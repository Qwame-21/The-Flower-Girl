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
export const DASHBOARD_TO_DB_FULFILLMENT = {
  pending_payment: 'pending_payment',
  paid: 'paid',
  preparing: 'packaging',
  packaging: 'packaging',
  ready: 'ready',
  packed: 'ready',
  dispatched: 'delivery',
  delivery: 'delivery',
  delivered: 'completed',
  completed: 'completed',
  cancelled: 'cancelled'
};

// DB status to dashboard internal status mapping
// NOTE: Database now sets fulfillment_status to 'packaging' when order is paid (not 'paid')
// This matches the admin flow expectation: paid → packaging (Processing)
export const DB_TO_DASHBOARD_FULFILLMENT = {
  pending_payment: 'pending_payment',
  paid: 'packaging',  // Database writes 'packaging' on paid, admin displays as "Processing"
  packaging: 'packaging',
  ready: 'ready',
  delivery: 'dispatched',
  completed: 'delivered',
  cancelled: 'cancelled'
};

// Dashboard stepper stages to DB order_events stages
export const STEPPER_TO_EVENT_STAGE = {
  paid: 'paid',
  packaging: 'packaging',
  packed: 'ready',
  ready: 'ready',
  dispatched: 'delivery',
  delivery: 'delivery',
  delivered: 'completed',
  completed: 'completed'
};

