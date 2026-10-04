// supabase/functions/paystack-init/index.ts
// Initialises a Paystack payment and records the checkout attempt.
// Required secrets (Supabase Dashboard → Edge Functions → Secrets):
//   PAYSTACK_SECRET_KEY        – sk_test_… or sk_live_…
//   SUPABASE_SERVICE_ROLE_KEY  – auto-injected by Supabase runtime
//   SUPABASE_URL               – auto-injected by Supabase runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS');
  const allowlist = allowedOrigins ? allowedOrigins.split(',').map(o => o.trim()) : [];
  
  let corsOrigin = '*';
  if (allowlist.length > 0 && origin) {
    if (allowlist.includes(origin)) {
      corsOrigin = origin;
    } else {
      corsOrigin = 'null';
    }
  }
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(allowlist.length > 0 && origin && allowlist.includes(origin) ? { 'Vary': 'Origin' } : {}),
  };
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface InitPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipientName?: string;
  deliveryAddress: string;
  deliveryType?: 'sameday' | 'scheduled' | 'surprise' | 'collection';
  landmark?: string;
  locationLink?: string;
  customerNote?: string;
  cardMessage?: string;
  cardStyleNotes?: string;
  requestedDeliveryDate?: string;
  callbackUrl?: string;
  cart: CartItem[];
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!PAYSTACK_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server mis-configuration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: InitPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const {
    customerName, customerEmail, customerPhone, recipientName,
    deliveryAddress, deliveryType, landmark, locationLink, customerNote,
    cardMessage, cardStyleNotes, requestedDeliveryDate, cart,
  } = payload;

  if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    return new Response(JSON.stringify({ error: 'Cart is empty' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Price validation against the live database ───────────────────────────────
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const productIds = [...new Set(cart.map((item) => item.id))];
  const now = new Date().toISOString();
  const [
    { data: dbProducts, error: productError },
    { data: promotions, error: promotionError },
    { data: siteSettings, error: settingsError },
  ] = await Promise.all([
    supabase.from('products').select('id, name, price, stock, visible').in('id', productIds),
    supabase.from('promotions').select('product_id, percent').eq('status', 'active').or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`),
    supabase.from('site_settings').select('*').eq('id', 'global').maybeSingle(),
  ]);
  if (settingsError || !siteSettings) {
    return new Response(JSON.stringify({ error: 'Delivery settings could not be loaded. Try again.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (productError || promotionError || !dbProducts || dbProducts.length !== productIds.length) {
    return new Response(JSON.stringify({ error: 'The live catalogue could not validate every item. Refresh the shop and try again.' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const priceMap = new Map(dbProducts.map((p) => [p.id, p]));
  const promotionMap = new Map((promotions || []).map((promotion) => [promotion.product_id, Number(promotion.percent)]));
  let serverTotal = 0;
  const validatedItems: Array<{ product_id: string; item_name: string; quantity: number; unit_price: number; metadata: Record<string, number> }> = [];

  for (const cartItem of cart) {
    const dbProduct = priceMap.get(cartItem.id);

    if (!dbProduct || dbProduct.visible === false) {
      return new Response(JSON.stringify({ error: `Product unavailable: ${dbProduct?.name || cartItem.name}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const qty = Math.max(1, Math.round(cartItem.quantity || 1));
    if (qty > Number(dbProduct.stock)) {
      return new Response(JSON.stringify({ error: `Only ${dbProduct.stock} of ${dbProduct.name} available.` }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const discountPercent = Math.min(90, Math.max(0, promotionMap.get(cartItem.id) || 0));
    const itemPrice = Math.round(Number(dbProduct.price) * (100 - discountPercent) / 100);
    serverTotal += itemPrice * qty;
    validatedItems.push({ product_id: cartItem.id, item_name: dbProduct.name, quantity: qty, unit_price: itemPrice, metadata: { discount_percent: discountPercent } });
  }

  // ── Delivery Fee computation from site_settings ──────────────────────────────
  let deliveryFee = 0;
  if (!deliveryType) {
    deliveryFee = 0;
  } else if (deliveryType === 'sameday') {
    if (siteSettings.delivery_sameday_enabled === false) {
      return new Response(JSON.stringify({ error: 'Same-day delivery is currently disabled.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    deliveryFee = Number(siteSettings.delivery_sameday_fee);
  } else if (deliveryType === 'scheduled') {
    if (siteSettings.delivery_scheduled_enabled === false) {
      return new Response(JSON.stringify({ error: 'Scheduled delivery is currently disabled.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    deliveryFee = Number(siteSettings.delivery_scheduled_fee);
  } else if (deliveryType === 'surprise') {
    if (siteSettings.delivery_surprise_enabled === false) {
      return new Response(JSON.stringify({ error: 'Surprise delivery is currently disabled.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    deliveryFee = Number(siteSettings.delivery_surprise_fee);
  } else if (deliveryType === 'collection') {
    if (siteSettings.delivery_collection_enabled === false) {
      return new Response(JSON.stringify({ error: 'Store collection is currently disabled.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    deliveryFee = Number(siteSettings.delivery_collection_fee);
  } else {
    return new Response(JSON.stringify({ error: `Invalid delivery type: ${deliveryType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const grandTotal = serverTotal + deliveryFee;

  // ── Generate references ───────────────────────────────────────────────────────
  const timestamp = Date.now();
  const tracking   = `GF-${String(timestamp).slice(-6)}`;
  const orderCode  = `WEB-${String(timestamp).slice(-6)}`;
  const paystackRef = `gf_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  // Store a private, expiring attempt. This is deliberately not an order.
  const { error: attemptError } = await supabase.from('checkout_attempts').insert({
    payment_reference: paystackRef,
    tracking_number: tracking,
    order_code: orderCode,
    customer_email: customerEmail,
    checkout_data: {
      customer_name: customerName,
      customer_phone: customerPhone,
      recipient_name: recipientName || customerName,
      delivery_address: deliveryAddress,
      delivery_type: deliveryType || null,
      delivery_fee: deliveryFee,
      landmark: landmark || '',
      location_link: locationLink || '',
      customer_note: customerNote || '',
      card_message: cardMessage || '',
      card_style: cardStyleNotes || '',
      requested_delivery_date: requestedDeliveryDate || '',
    },
    items: validatedItems,
    subtotal: serverTotal,
    total: grandTotal,
    currency: 'GHS',
  });
  if (attemptError) {
    return new Response(JSON.stringify({ error: 'Checkout could not be prepared.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Call Paystack transaction/initialize ──────────────────────────────────────
  const amountInPesewas = Math.round(grandTotal * 100);
  let callbackUrl: string | undefined;
  if (payload.callbackUrl) {
    try {
      const candidate = new URL(payload.callbackUrl);
      const configuredStorefront = Deno.env.get('STOREFRONT_URL');
      const isLocal = ['localhost', '127.0.0.1'].includes(candidate.hostname) && PAYSTACK_SECRET.startsWith('sk_test_');
      const isConfigured = configuredStorefront && candidate.origin === new URL(configuredStorefront).origin;
      if ((candidate.protocol === 'https:' && isConfigured) || (candidate.protocol === 'http:' && isLocal)) callbackUrl = candidate.toString();
    } catch {
      callbackUrl = undefined;
    }
  }

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference: paystackRef,
      email: customerEmail,
      amount: amountInPesewas,
      currency: 'GHS',
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      metadata: {
        tracking_number: tracking,
        order_code: orderCode,
        customer_name: customerName,
        customer_phone: customerPhone,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData.status) {
    await supabase.from('checkout_attempts').update({ status: 'failed' }).eq('payment_reference', paystackRef);
    return new Response(JSON.stringify({ error: paystackData.message || 'Payment gateway error' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await supabase.from('checkout_attempts').update({ authorization_url: paystackData.data.authorization_url }).eq('payment_reference', paystackRef);

  return new Response(
    JSON.stringify({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackRef,
      trackingNumber: tracking,
      orderCode,
      subtotal: serverTotal,
      deliveryFee,
      total: grandTotal,
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
});
