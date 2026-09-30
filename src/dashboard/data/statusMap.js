// Status mapping between dashboard labels and Supabase enum values
// Based on supabase/schema.sql enum definitions

export const FULFILLMENT_STATUS = {
  // Dashboard label -> DB enum
  'Pending Payment': 'pending_payment',
  'Paid': 'paid',
  'Processing': 'packaging', // Dashboard "Processing" maps to DB "packaging"
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
  paid: 'Paid',
  packaging: 'Processing',
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
  paid: 'paid',
  preparing: 'packaging', // Dashboard "preparing" maps to DB "packaging"
  packaging: 'packaging', // Dashboard "packaging" maps to DB "packaging"
  ready: 'ready',
  dispatched: 'delivery',
  delivered: 'completed',
  cancelled: 'cancelled'
};

// DB status to dashboard internal status mapping
export const DB_TO_DASHBOARD_FULFILLMENT = {
  pending_payment: 'pending_payment',
  paid: 'paid',
  packaging: 'packaging', // DB "packaging" maps to dashboard "packaging"
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
// - DB enum has 'pending_payment', 'paid', 'packaging', 'ready', 'delivery', 'completed', 'cancelled'
// - Dashboard uses 'preparing' and 'packaging' interchangeably for "Processing"
// - Dashboard stepper stages: paid, processing, packed, dispatched, delivered
// - DB order_events stages: pending_payment, paid, packaging, ready, delivery, completed, cancelled
// - Storefront tracking reads these DB enum values directly
