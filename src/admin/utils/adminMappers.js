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
    source: 'supabase',
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

export const mapDatabaseRequest = req => ({
  id: req.id,
  reference: req.reference,
  requestType: req.request_type,
  service: req.service,
  name: req.customer_name,
  email: req.email,
  phone: req.phone,
  occasion: req.occasion,
  date: req.preferred_date,
  preferredDate: req.preferred_date,
  selections: Array.isArray(req.selections) ? req.selections : [],
  quantity: Number(req.quantity || 1),
  note: req.notes,
  cardMessage: req.card_message,
  cardStyleNotes: req.card_style,
  inspirationPath: req.inspiration_path,
  estimateLow: req.estimate_low != null ? Number(req.estimate_low) : null,
  estimateHigh: req.estimate_high != null ? Number(req.estimate_high) : null,
  confirmedQuote: req.confirmed_quote != null ? Number(req.confirmed_quote) : null,
  status: req.status || 'new',
  adminNote: req.admin_note || '',
  approvedAt: req.approved_at,
  convertedAt: req.converted_at,
  createdAt: req.created_at,
  updatedAt: req.updated_at,
});

export const mapDatabaseApplication = app => ({
  id: app.id,
  careerId: app.career_id,
  name: app.full_name,
  fullName: app.full_name,
  email: app.email,
  phone: app.phone,
  location: app.location,
  portfolio: app.portfolio_url,
  portfolioUrl: app.portfolio_url,
  date: app.earliest_start_date,
  earliestStartDate: app.earliest_start_date,
  experience: app.experience,
  motivation: app.motivation,
  resumePath: app.resume_path,
  status: app.status || 'new',
  role: 'Applicant',
  createdAt: app.created_at,
  updatedAt: app.updated_at,
});

export const mapDatabaseCareer = career => ({
  id: career.id,
  title: career.title,
  location: career.location || 'Accra',
  employmentType: career.employment_type || 'Full-time',
  description: career.description || '',
  status: career.status || 'draft',
  createdAt: career.created_at,
  updatedAt: career.updated_at,
});

