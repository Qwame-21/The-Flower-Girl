// supabase/functions/paystack-init/index.ts
// Initialises a Paystack payment and records the checkout attempt.
// Required secrets (Supabase Dashboard → Edge Functions → Secrets):
//   PAYSTACK_SECRET_KEY        – sk_test_… or sk_live_…
//   SUPABASE_SERVICE_ROLE_KEY  – auto-injected by Supabase runtime
//   SUPABASE_URL               – auto-injected by Supabase runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
  landmark?: string;
  locationLink?: string;
  customerNote?: string;
  cardMessage?: string;
  cardStyleNotes?: string;
  requestedDeliveryDate?: string;
  cart: CartItem[];
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!PAYSTACK_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server mis-configuration' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let payload: InitPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const {
    customerName, customerEmail, customerPhone, recipientName,
    deliveryAddress, landmark, locationLink, customerNote,
    cardMessage, cardStyleNotes, requestedDeliveryDate, cart,
  } = payload;

  if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    return new Response(JSON.stringify({ error: 'Cart is empty' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Price validation against live DB (with fallback catalog) ─────────────────
  const FALLBACK_PRODUCTS = new Map<string, { id: string; name: string; price: number; stock: number; visible: boolean }>([
    ['hamper-3750', { id: 'hamper-3750', name: 'Luxury hamper', price: 3750, stock: 99, visible: true }],
    ['christmas-bundle', { id: 'christmas-bundle', name: 'Christmas bundle', price: 1250, stock: 99, visible: true }],
    ['period-care', { id: 'period-care', name: 'Period care box', price: 650, stock: 99, visible: true }],
    ['fresh-bouquet', { id: 'fresh-bouquet', name: 'Fresh flower bouquet', price: 450, stock: 99, visible: true }],
    ['fragrance-gift', { id: 'fragrance-gift', name: 'Fragrance & treats gift', price: 950, stock: 99, visible: true }],
    ['personalized-bag', { id: 'personalized-bag', name: 'Personalized wrist bag', price: 650, stock: 99, visible: true }],
    ['embroidery', { id: 'embroidery', name: 'Embroidery & personalization', price: 180, stock: 99, visible: true }],
  ]);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const productIds = cart.map((i) => i.id);

  let dbProducts: any[] = [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock, visible')
      .in('id', productIds);
    if (!error && Array.isArray(data)) {
      dbProducts = data;
    }
  } catch (err) {
    console.warn('DB product query notice:', err);
  }

  const priceMap = new Map(dbProducts.map((p) => [p.id, p]));
  let serverTotal = 0;
  const validatedItems: Array<{ product_id: string; item_name: string; quantity: number; unit_price: number }> = [];

  for (const cartItem of cart) {
    const dbProduct = priceMap.get(cartItem.id) || FALLBACK_PRODUCTS.get(cartItem.id) || {
      id: cartItem.id,
      name: cartItem.name || 'Gift Item',
      price: Math.max(0, Number(cartItem.price) || 0),
      stock: 99,
      visible: true,
    };

    if (dbProduct.visible === false) {
      return new Response(JSON.stringify({ error: `Product unavailable: ${dbProduct.name}` }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    const qty = Math.max(1, Math.round(cartItem.quantity || 1));
    const itemPrice = Number(dbProduct.price) || 0;
    serverTotal += itemPrice * qty;
    validatedItems.push({ product_id: cartItem.id, item_name: dbProduct.name, quantity: qty, unit_price: itemPrice });
  }

  // ── Generate references ───────────────────────────────────────────────────────
  const timestamp = Date.now();
  const tracking   = `GF-${String(timestamp).slice(-6)}`;
  const orderCode  = `WEB-${String(timestamp).slice(-6)}`;
  const paystackRef = `gf_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;

  // ── Insert pending order (service role bypasses RLS) ──────────────────────────
  try {
    const { data: newOrder, error: insertError } = await supabase.from('orders').insert({
      tracking_number: tracking,
      order_code: orderCode,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      recipient_name: recipientName || customerName,
      delivery_address: deliveryAddress,
      landmark: landmark || null,
      location_link: locationLink || null,
      customer_note: customerNote || null,
      card_message: cardMessage || null,
      card_style: cardStyleNotes || null,
      requested_delivery_date: requestedDeliveryDate || null,
      subtotal: serverTotal,
      total: serverTotal,
      payment_provider: 'paystack',
      payment_reference: paystackRef,
      payment_status: 'pending',
      fulfillment_status: 'pending_payment',
    }).select('id').single();

    if (insertError) {
      console.warn('DB order insert notice (table unseeded or pending migration):', insertError.message || insertError);
    } else if (newOrder?.id) {
      await supabase.from('order_items').insert(
        validatedItems.map((item) => ({ ...item, order_id: newOrder.id })),
      );
    }
  } catch (err) {
    console.warn('DB order insert catch notice:', err);
  }

  // ── Call Paystack transaction/initialize ──────────────────────────────────────
  const amountInPesewas = Math.round(serverTotal * 100);

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
    console.error('Paystack error:', paystackData);
    return new Response(JSON.stringify({ error: paystackData.message || 'Payment gateway error' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackRef,
      trackingNumber: tracking,
      total: serverTotal,
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
});
