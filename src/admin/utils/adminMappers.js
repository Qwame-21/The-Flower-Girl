export const ORDER_STAGES = ['pending_payment', 'paid', 'packaging', 'ready', 'delivery', 'completed'];

export const ORDER_LABELS = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  packaging: 'Processing',
  ready: 'Packed',
  delivery: 'Dispatched',
  completed: 'Delivered',
};

export const cataloguePrice = value => Number(String(value || '').match(/[\d,.]+/)?.[0]?.replace(/,/g, '') || 0);

export const mapDatabaseOrder = order => {
  const eventTimes = Object.fromEntries((order.order_events || []).map(event => [`${event.stage}At`, event.created_at]));
  return {
    id: order.id,
    tracking: order.tracking_number,
    code: order.order_code,
    customer: order.customer_name,
    customerEmail: order.customer_email,
    phone: order.customer_phone,
    recipient: order.recipient_name,
    delivery: order.delivery_address,
    landmark: order.landmark,
    locationLink: order.location_link,
    customerNote: order.customer_note,
    cardMessage: order.card_message,
    cardStyleNotes: order.card_style,
    requestedDeliveryDate: order.requested_delivery_date,
    total: Number(order.total || 0),
    paymentMethod: 'Paystack',
    paymentStatus: order.payment_status,
    status: order.fulfillment_status,
    estimatedDelivery: order.estimated_delivery,
    adminNote: order.admin_note,
    staffOrder: order.staff_order,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    ...eventTimes,
    items: (order.order_items || []).map(item => ({ id: item.product_id || item.id, name: item.item_name, qty: item.quantity, price: Number(item.unit_price || 0) })),
    events: order.order_events || [],
  };
};
