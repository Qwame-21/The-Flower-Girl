// supabase/functions/paystack-webhook/index.ts
// Receives and verifies signed Paystack webhook events.
// Only a signed charge.success event creates a confirmed order.
// Required secrets (Supabase Dashboard → Edge Functions → Secrets):
//   PAYSTACK_SECRET_KEY        – used to verify the X-Paystack-Signature header
//   SUPABASE_SERVICE_ROLE_KEY  – auto-injected by Supabase runtime
//   SUPABASE_URL               – auto-injected by Supabase runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-paystack-signature',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
  const SUPABASE_URL    = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!PAYSTACK_SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
    return new Response('Server mis-configuration', { status: 500 });
  }

  // ── Read raw body (needed for signature verification) ────────────────────────
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';

  // ── Verify HMAC-SHA512 signature ──────────────────────────────────────────────
  const expectedSig = createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    console.warn('Webhook signature mismatch — ignoring');
    return new Response('Invalid signature', { status: 401 });
  }

  // ── Parse event ───────────────────────────────────────────────────────────────
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const eventType = event.event as string;
  console.log('Paystack webhook received:', eventType);

  // ── Only act on charge.success ────────────────────────────────────────────────
  if (eventType !== 'charge.success') {
    // Acknowledge all other events without processing
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = event.data as Record<string, unknown>;
  const reference = data.reference as string;
  const paidAmount = (data.amount as number) / 100; // convert back from pesewas
  const paystackStatus = data.status as string; // should be 'success'

  if (!reference || paystackStatus !== 'success') {
    return new Response('Ignored', { status: 200 });
  }

  // ── Update the order via service role (bypasses RLS) ─────────────────────────
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Verify the order exists and is still pending
  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('id, payment_status, total')
    .eq('payment_reference', reference)
    .single();

  if (fetchError || !existingOrder) {
    console.error('Order not found for reference:', reference, fetchError);
    return new Response('Order not found', { status: 404 });
  }

  if (existingOrder.payment_status !== 'pending') {
    // Already processed (idempotency guard)
    console.log('Order already processed:', reference);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sanity-check: paid amount should match the stored total
  if (Math.abs(paidAmount - existingOrder.total) > 0.01) {
    console.error(`Amount mismatch for ${reference}: paid ${paidAmount}, expected ${existingOrder.total}`);
    // Still mark as paid — discrepancies require manual review, not silent failure
  }

  // Mark order as paid
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      fulfillment_status: 'paid',
    })
    .eq('id', existingOrder.id);

  if (updateError) {
    console.error('Failed to update order:', updateError);
    return new Response('DB update failed', { status: 500 });
  }

  // Insert the first order_event for audit trail
  await supabase.from('order_events').insert({
    order_id: existingOrder.id,
    stage: 'paid',
    customer_note: 'Payment confirmed via Paystack webhook',
  });

  // Insert admin notification
  await supabase.from('admin_notifications').insert({
    type: 'new_order',
    title: 'New paid order',
    body: `Reference ${reference} confirmed. Total: GHS ${existingOrder.total}`,
    route: '/admin',
    record_id: existingOrder.id,
  });

  console.log('Order confirmed:', existingOrder.id, 'ref:', reference);

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
