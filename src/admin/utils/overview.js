// Operational dates follow the store's Ghana time zone (UTC).
const DAY = 86400000;
const demoIds = new Set(['order-gf-1052', 'order-gf-1051', 'order-gf-1050', 'order-gf-1049', 'order-gf-1048']);
const timestamp = value => { const result = Date.parse(value); return Number.isFinite(result) ? result : null; };
export function buildOverview(data, period = 'Today', now = Date.now()) {
  const today = Math.floor(now / DAY) * DAY;
  const start = period === 'This week' ? today - 6 * DAY : today;
  const orders = (data.orders || []).filter(order => order.source === 'supabase' || !demoIds.has(order.id));
  const pending = orders.filter(order => !['completed', 'cancelled', 'refunded'].includes(order.status));
  const overdue = pending.filter(order => {
    const estimated = timestamp(order.estimatedDelivery);
    const requested = timestamp(order.requestedDeliveryDate);
    return estimated !== null ? estimated < now : requested !== null && requested + DAY <= now;
  });
  const paid = orders.filter(order => order.paymentStatus === 'paid' && timestamp(order.paidAt || order.createdAt) >= start && timestamp(order.paidAt || order.createdAt) <= now);
  const revenue = paid.reduce((sum, order) => sum + (Number.isFinite(Number(order.total)) ? Number(order.total) : 0), 0);
  const quotes = (data.requests || []).filter(request => ['new', 'quote_needed'].includes(request.status));
  const activities = [
    ...orders.map(order => ({ id: `order-${order.id}`, kind: 'Order', title: order.tracking || 'Order received', detail: order.customer || 'Customer order', status: order.status, time: order.updatedAt || order.createdAt, record: order })),
    ...(data.requests || []).map(request => ({ id: `request-${request.id}`, kind: 'Request', title: request.reference || 'Gift request', detail: request.name || request.service || 'Custom gifting', status: request.status, time: request.updatedAt || request.createdAt, record: request })),
    ...(data.applications || []).map(application => ({ id: `application-${application.id}`, kind: 'Application', title: application.name || 'New application', detail: application.role || 'Career application', status: application.status, time: application.updatedAt || application.createdAt, record: application })),
  ].filter(item => timestamp(item.time) !== null && timestamp(item.time) <= now && (period === 'Activity' || timestamp(item.time) >= start)).sort((a, b) => timestamp(b.time) - timestamp(a.time));
  const trend = Array.from({ length: period === 'This week' ? 7 : 6 }, (_, i) => {
    const from = period === 'This week' ? start + i * DAY : today + i * 4 * 3600000;
    const to = from + (period === 'This week' ? DAY : 4 * 3600000);
    return { from, value: paid.filter(order => { const time = timestamp(order.paidAt || order.createdAt); return time >= from && time < to; }).reduce((sum, order) => sum + Number(order.total || 0), 0) };
  });
  return { orders, pending, overdue, paid, revenue, quotes, activities, trend, ready: pending.filter(order => order.status === 'ready'), awaitingPayment: pending.filter(order => order.paymentStatus !== 'paid') };
}
