import { supabase } from '../../config/supabase';

export function hasTrackingApi() {
  return Boolean(supabase);
}

/**
 * Looks up an order directly from the orders table by order_code or tracking_number,
 * then validates the contact (phone or email) matches.
 * Returns { data: { kind, ... } } shaped like the old RPC to keep TrackOrderPage compatible.
 */
export async function trackRecord(reference, credential) {
  if (!supabase) return { data: null, error: 'Supabase not configured' };

  const ref = reference.trim().toUpperCase();
  const contact = credential.trim().toLowerCase();
  const digits = contact.replace(/\D/g, '');

  // Search orders by order_code OR tracking_number (case-insensitive)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_code,
      tracking_number,
      customer_name,
      customer_email,
      customer_phone,
      fulfillment_status,
      payment_status,
      estimated_delivery,
      requested_delivery_date,
      admin_note,
      order_events (stage, customer_note, created_at)
    `)
    .or(`order_code.ilike.${ref},tracking_number.ilike.${ref}`)
    .limit(10);

  if (error) {
    console.error('trackRecord error:', error);
    return { data: null, error: error.message };
  }

  if (!orders || orders.length === 0) {
    return { data: null };
  }

  // Find one matching the contact info
  const matched = orders.find(o => {
    const email = (o.customer_email || '').toLowerCase();
    const phone = (o.customer_phone || '').replace(/\D/g, '');
    const contactMatchesEmail = email === contact;
    const contactMatchesPhone = digits.length >= 8 && phone.length >= 8 && phone.slice(-9) === digits.slice(-9);
    return contactMatchesEmail || contactMatchesPhone;
  });

  if (!matched) {
    return { data: null };
  }

  // Map fulfillment status to the stages the tracking page understands
  const FULFILLMENT_MAP = {
    preparing: 'packaging',
    packaging: 'packaging',
    ready: 'ready',
    packed: 'ready',
    dispatched: 'delivery',
    delivery: 'delivery',
    delivered: 'completed',
    completed: 'completed',
  };

  const events = (matched.order_events || []).map(e => ({
    stage: FULFILLMENT_MAP[e.stage] || e.stage,
    note: e.customer_note,
    createdAt: e.created_at,
  }));

  const eventFields = Object.fromEntries(
    events.flatMap(e => [[`${e.stage}At`, e.createdAt], [`${e.stage}Note`, e.note]])
  );

  return {
    data: {
      kind: 'order',
      trackingNumber: matched.tracking_number || matched.order_code,
      customerName: matched.customer_name,
      status: FULFILLMENT_MAP[matched.fulfillment_status] || matched.fulfillment_status || 'packaging',
      paymentStatus: matched.payment_status,
      estimatedDelivery: matched.estimated_delivery,
      requestedDeliveryDate: matched.requested_delivery_date,
      adminNote: matched.admin_note,
      events,
      ...eventFields,
    },
  };
}
