import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!paystackSecret || !supabaseUrl || !serviceRole) return new Response('Server mis-configuration', { status: 500 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';
  const expected = createHmac('sha512', paystackSecret).update(rawBody).digest('hex');
  if (!signature || signature !== expected) return new Response('Invalid signature', { status: 401 });

  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody); } catch { return new Response('Bad JSON', { status: 400 }); }
  if (event.event !== 'charge.success') return json({ received: true });

  const eventData = event.data as Record<string, unknown>;
  const reference = String(eventData?.reference || '');
  if (!reference || eventData?.status !== 'success') return json({ received: true });

  const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecret}` },
  });
  const verification = await verifyResponse.json();
  const verified = verification?.data;
  if (!verifyResponse.ok || !verification?.status || verified?.status !== 'success' || verified?.reference !== reference) {
    console.error('Paystack verification failed for a signed event');
    return new Response('Verification failed', { status: 409 });
  }

  const amount = Number(verified.amount) / 100;
  const currency = String(verified.currency || '').toUpperCase();
  if (!Number.isFinite(amount) || currency !== 'GHS') return new Response('Payment details rejected', { status: 409 });

  const supabase = createClient(supabaseUrl, serviceRole);
  const { data: result, error } = await supabase.rpc('finalize_paid_checkout', {
    verified_reference: reference,
    verified_amount: amount,
    verified_currency: currency,
  });
  if (error) {
    console.error('Checkout finalization failed:', error.message);
    return new Response('Order finalization failed', { status: 409 });
  }

  console.log('Verified order finalized:', result?.orderId);
  return json({ received: true });
});
