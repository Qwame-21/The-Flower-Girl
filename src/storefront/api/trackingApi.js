import { supabase } from '../../config/supabase';

export function hasTrackingApi() {
  return Boolean(supabase);
}

// Columns that exist in the original schema (always safe to query).
const BASE_SELECT = `
  id,
  order_code,
  tracking_number,
  customer_name,
  customer_email,
  customer_phone,
  recipient_name,
  delivery_address,
  landmark,
  location_link,
  customer_note,
  card_message,
  card_style,
  fulfillment_status,
  payment_status,
  estimated_delivery,
  requested_delivery_date,
  admin_note,
  created_at,
  order_events (stage, created_at),
  order_items (item_name, quantity)
`;

// Additional columns added by migrations. Queried in the first pass;
// if PostgREST rejects the query (400 "column does not exist") we fall back
// to BASE_SELECT and return nulls for the optional fields.
const EXTENDED_SELECT = `
  id,
  order_code,
  tracking_number,
  customer_name,
  customer_email,
  customer_phone,
  customer_note,
  recipient_name,
  delivery_address,
  landmark,
  location_link,
  fulfillment_status,
  payment_status,
  estimated_delivery,
  requested_delivery_date,
  delivery_type,
  delivery_fee,
  delivery_window,
  customization_selections,
  admin_note,
  created_at,
  order_events (stage, created_at),
  order_items (item_name, quantity)
`;

/**
 * Looks up an order directly from the orders table by order_code or tracking_number,
 * then validates the contact (phone or email) matches.
 * Returns { data: { kind, ... } } shaped like the old RPC to keep TrackOrderPage compatible.
 *
 * Degrades gracefully when optional migration columns don't exist yet:
 *  - First tries EXTENDED_SELECT (all columns).
 *  - If PostgREST returns a column-not-found error (HTTP 400 / code PGRST204 or message
 *    containing "column"), retries with BASE_SELECT and omits the optional fields.
 */
export async function trackRecord(reference, credential) {
  if (!supabase) return { data: null, error: 'Supabase not configured' };

  const ref = reference.trim().toUpperCase();
  const contact = credential.trim().toLowerCase();
  const digits = contact.replace(/\D/g, '');

  const cleanRef = reference.trim().replace(/\s+/g, '');

  // 1. PRIMARY & SECURE PATH: Use track_record RPC
  // Validates credentials inside Postgres without exposing the full orders table
  try {
    const rpcRes = await supabase.rpc('track_record', {
      lookup_reference: cleanRef,
      lookup_contact: credential.trim(),
    });

    if (rpcRes.data) {
      const data = rpcRes.data;
      if (data.kind === 'order') {
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

        const rawEvents = data.events || [];
        const events = rawEvents.map(e => ({
          stage: FULFILLMENT_MAP[e.stage] || e.stage,
          createdAt: e.createdAt || e.created_at,
        }));

        const eventFields = Object.fromEntries(events.map(e => [`${e.stage}At`, e.createdAt]));

        return {
          data: {
            ...data,
            status: FULFILLMENT_MAP[data.status] || data.status || 'packaging',
            events,
            ...eventFields,
          },
        };
      }

      return { data };
    }
  } catch (err) {
    console.warn('[trackRecord] RPC error, attempting fallback:', err);
  }

  // 2. FALLBACK PATH (for local/custom queries):
  let orders;
  let usingBaseOnly = false;

  const firstResult = await supabase
    .from('orders')
    .select(EXTENDED_SELECT)
    .or(`order_code.ilike.${ref},tracking_number.ilike.${ref}`)
    .limit(10);

  if (firstResult.error) {
    const msg = firstResult.error.message || '';
    const isColumnMissing =
      (firstResult.error.code && firstResult.error.code.startsWith('42')) ||
      msg.toLowerCase().includes('column') ||
      msg.toLowerCase().includes('does not exist') ||
      firstResult.error.code === 'PGRST204';

    if (isColumnMissing) {
      usingBaseOnly = true;
      const fallback = await supabase
        .from('orders')
        .select(BASE_SELECT)
        .or(`order_code.ilike.${ref},tracking_number.ilike.${ref}`)
        .limit(10);

      if (fallback.error) {
        return { data: null, error: fallback.error.message };
      }
      orders = fallback.data;
    } else {
      return { data: null, error: firstResult.error.message };
    }
  } else {
    orders = firstResult.data;
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
    createdAt: e.created_at,
  }));

  const eventFields = Object.fromEntries(events.map(e => [`${e.stage}At`, e.createdAt]));

  return {
    data: {
      kind: 'order',
      trackingNumber: matched.tracking_number || matched.order_code,
      customerName: matched.customer_name,
      customerPhone: matched.customer_phone ?? null,
      customerEmail: matched.customer_email ?? null,
      // Optional — null when migration not yet run
      recipientName: matched.recipient_name ?? null,
      deliveryAddress: matched.delivery_address ?? null,
      landmark: matched.landmark ?? null,
      locationLink: matched.location_link ?? null,
      status: FULFILLMENT_MAP[matched.fulfillment_status] || matched.fulfillment_status || 'packaging',
      paymentStatus: matched.payment_status,
      customerNote: matched.customer_note ?? null,
      cardMessage: matched.card_message ?? null,
      cardStyle: matched.card_style ?? null,
      estimatedDelivery: matched.estimated_delivery ?? null,
      deliveryType: usingBaseOnly ? null : (matched.delivery_type ?? null),
      deliveryFee: usingBaseOnly ? null : (matched.delivery_fee ?? null),
      deliveryWindow: usingBaseOnly ? null : (matched.delivery_window ?? null),
      requestedDeliveryDate: matched.requested_delivery_date ?? null,
      customizationSelections: usingBaseOnly ? null : (matched.customization_selections ?? null),
      items: (matched.order_items || []).map(item => ({
        name: item.item_name,
        quantity: item.quantity,
      })),
      staffNote: matched.admin_note ?? null,
      createdAt: matched.created_at,
      events,
      ...eventFields,
    },
  };
}
