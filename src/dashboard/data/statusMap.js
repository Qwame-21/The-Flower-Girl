// Status mapping between dashboard labels and Supabase enum values
// Based on supabase/schema.sql enum definitions

export const FULFILLMENT_STATUS = {
  // Dashboard label -> DB enum
  'Pending Payment': 'pending_payment',
  'Processing': 'paid', // Dashboard uses "Processing" but DB maps to 'paid' for production stage
  'Packed': 'ready',
  'Dispatched': 'delivery',
  'Delivered': 'completed',
  'Cancelled': 'cancelled'
};

export const PAYMENT_STATUS = {
  'Pending': 'pending',
  'Paid': 'paid',
  'Failed': 'failed',
  'Refunded': 'refunded'
};

// Reverse mapping for display
export const FULFILLMENT_STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  paid: 'Processing',
  packaging: 'Processing', // Dashboard uses 'packaging' internally
  ready: 'Packed',
  delivery: 'Dispatched',
  completed: 'Delivered',
  cancelled: 'Cancelled'
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
};

// Dashboard internal status to DB status mapping
// The dashboard uses 'preparing', 'packaging', 'dispatched' internally
// These need to map to DB enum values
export const DASHBOARD_TO_DB_FULFILLMENT = {
  pending_payment: 'pending_payment',
  preparing: 'paid', // Dashboard "preparing" maps to DB "paid" (production started)
  packaging: 'paid', // Dashboard "packaging" maps to DB "paid" (same stage)
  ready: 'ready',
  dispatched: 'delivery',
  delivered: 'completed',
  cancelled: 'cancelled'
};

// DB status to dashboard internal status mapping
export const DB_TO_DASHBOARD_FULFILLMENT = {
  pending_payment: 'pending_payment',
  paid: 'preparing', // DB "paid" maps to dashboard "preparing"
  ready: 'ready',
  delivery: 'dispatched',
  completed: 'delivered',
  cancelled: 'cancelled'
};

// Dashboard stepper stages to DB order_events stages
export const STEPPER_TO_EVENT_STAGE = {
  paid: 'paid',
  processing: 'packaging',
  packed: 'ready',
  dispatched: 'delivery',
  delivered: 'completed'
};

// Notes on status mapping:
// - Dashboard uses 'preparing' and 'packaging' interchangeably for "Processing"
// - DB enum has 'paid' which means "payment confirmed, production started"
// - DB enum has 'packaging' which is NOT used in current schema - should be 'paid'
// - DB enum has 'delivery' which means "out for delivery"
// - DB enum has 'completed' which means "delivered"
// - Dashboard stepper stages: paid, processing, packed, dispatched, delivered
// - DB order_events stages: pending_payment, paid, packaging, ready, delivery, completed, cancelled
