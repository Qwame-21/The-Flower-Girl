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

const json = (body: unknown, status = 200, corsHeaders: Record<string, string>) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!paystackSecret || !supabaseUrl || !serviceRole) {
    console.error('[paystack-verify] Server mis-configuration: missing secrets');
    return json({ error: 'Server mis-configuration' }, 500, corsHeaders);
  }

  let body: { reference?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, corsHeaders);
  }

  const reference = String(body.reference || '').trim();
  if (!reference) {
    return json({ error: 'Missing payment reference' }, 400, corsHeaders);
  }

  // Call Paystack Verify API with secret key server-side only
  const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecret}` },
  });

  const verification = await verifyResponse.json();
  const verified = verification?.data;

  if (!verifyResponse.ok || !verification?.status || verified?.status !== 'success' || verified?.reference !== reference) {
    console.error('[paystack-verify] Payment verification failed:', verifyResponse.status, verification?.message);
    return json({ error: verification?.message || 'Payment verification failed' }, 409, corsHeaders);
  }

  const amount = Number(verified.amount) / 100;
  const currency = String(verified.currency || '').toUpperCase();
  if (!Number.isFinite(amount) || currency !== 'GHS') {
    return json({ error: 'Payment details rejected' }, 409);
  }

  // Finalize paid checkout via Security Definer RPC as Service Role
  const supabase = createClient(supabaseUrl, serviceRole);
  const { data: result, error } = await supabase.rpc('finalize_paid_checkout', {
    verified_reference: reference,
    verified_amount: amount,
    verified_currency: currency,
  });

  if (error) {
    console.error('[paystack-verify] Order finalization failed:', error.message);
    return json({ error: 'Order finalization failed' }, 409, corsHeaders);
  }

  return json({
    success: true,
    orderId: result?.orderId,
    trackingNumber: result?.trackingNumber,
    orderCode: result?.orderCode,
  }, 200, corsHeaders);
});
