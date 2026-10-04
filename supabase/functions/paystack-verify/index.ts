import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!paystackSecret || !supabaseUrl || !serviceRole) {
    return json({ error: 'Server mis-configuration' }, 500);
  }

  let body: { reference?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const reference = String(body.reference || '').trim();
  if (!reference) {
    return json({ error: 'Missing payment reference' }, 400);
  }

  console.log('[paystack-verify] Verifying transaction reference server-side:', reference);

  // Call Paystack Verify API with secret key server-side only
  const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecret}` },
  });

  const verification = await verifyResponse.json();
  const verified = verification?.data;

  if (!verifyResponse.ok || !verification?.status || verified?.status !== 'success' || verified?.reference !== reference) {
    console.error('[paystack-verify] Paystack verification failed:', verification);
    return json({ error: verification?.message || 'Payment verification failed' }, 409);
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
    console.error('[paystack-verify] Checkout finalization RPC failed:', error.message);
    return json({ error: 'Order finalization failed' }, 409);
  }

  console.log('[paystack-verify] Verified order finalized:', result?.orderId);

  return json({
    success: true,
    orderId: result?.orderId,
    trackingNumber: result?.trackingNumber,
    orderCode: result?.orderCode,
  });
});
