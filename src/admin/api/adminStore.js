const KEY = 'gifting-factory-admin-data-v2';
const EVENT = 'gifting-factory-admin-update';

const defaults = {
  orders: [], requests: [], applications: [], products: [
    { id: 'product-hamper', name: 'Luxury celebration hamper', category: 'Hampers', price: 'GHS 3,750', stock: 8, visible: true, image: '/assets/hamper-editorial-v2.png' },
    { id: 'product-bouquet', name: 'Fresh flower bouquet', category: 'Flowers', price: 'From GHS 450', stock: 19, visible: true, image: '/assets/bouquet-editorial-v2.png' },
    { id: 'product-care', name: 'Period care box', category: 'Care gifts', price: 'From GHS 650', stock: 6, visible: true, image: '/assets/gifting-factory-logo-transparent-v2.png' },
    { id: 'product-embroidery', name: 'Embroidery service', category: 'Personalization', price: 'From GHS 180', stock: 14, visible: false, image: '/assets/embroidery-editorial-v2.png' },
  ],
  collections: [
    { id: 'collection-celebration', title: 'Celebration gifts', description: 'Birthday, milestone and congratulations gifts.', status: 'live', productIds: ['product-hamper', 'product-bouquet'] },
    { id: 'collection-care', title: 'Care packages', description: 'Thoughtful wellness and comfort gifts.', status: 'live', productIds: ['product-care'] },
  ],
  promotions: [{ id: 'promo-hamper-20', productId: 'hamper-3750', percent: 20, status: 'active' }],
  gallery: [
    { id: 'gallery-hamper', src: '/assets/hamper-editorial-v2.png', label: 'Luxury gift hamper', visible: true },
    { id: 'gallery-bouquet', src: '/assets/bouquet-editorial-v2.png', label: 'Fresh flower bouquet', visible: true },
    { id: 'gallery-wrap', src: '/assets/wrapping-editorial-v2.png', label: 'Signature gift presentation', visible: true },
    { id: 'gallery-basket', src: '/assets/basket-hamper-editorial-v2.png', label: 'Curated celebration basket', visible: true },
  ],
  reviews: [],
  content: {
    announcement: 'Thoughtful gifting, prepared with care in Accra.',
    deliveryPolicy: 'Delivery timing is confirmed with each order after availability and destination are reviewed.',
    orderPolicy: 'Production begins after the final design, wording, price and payment terms are confirmed.',
    homepageFeature: 'Celebration gifts',
  },
  settings: { businessName: 'The Gifting Factory', supportPhone: '+233 24 000 0000', supportEmail: 'hello@thegiftingfactory.com', dispatchCity: 'Accra', leadTime: 'Delivery timing confirmed per order', deliveryNote: 'We will call the recipient before dispatch.', adminName: 'Administrator', adminEmail: 'admin@thegiftingfactory.com' },
  careers: [{ id: 'career-content', title: 'Content Creator & Social Media Manager', status: 'open' }],
};

// Match only unchanged built-in catalogue examples; edited or shared records stay visible.
export function isDefaultAdminRecord(collection, record) {
  if (record.source === 'supabase' || record.createdAt || record.updatedAt) return false;
  const example = defaults[collection]?.find?.(item => item.id === record.id);
  return Boolean(example && Object.keys(record).length === Object.keys(example).length && Object.entries(example).every(([key, value]) => JSON.stringify(record[key]) === JSON.stringify(value)));
}

export function readAdminData() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    const merged = { ...defaults, ...saved, products: Array.isArray(saved.products) ? saved.products : defaults.products, collections: Array.isArray(saved.collections) ? saved.collections : defaults.collections, reviews: Array.isArray(saved.reviews) ? saved.reviews : defaults.reviews, content: { ...defaults.content, ...(saved.content || {}) }, settings: { ...defaults.settings, ...(saved.settings || {}) } };
    if (merged.settings.leadTime === '1–3 working days') merged.settings.leadTime = defaults.settings.leadTime;
    if (merged.content.deliveryPolicy === 'Standard delivery takes 1–3 working days after confirmation.') merged.content.deliveryPolicy = defaults.content.deliveryPolicy;
    return {
      ...merged,
      orders: (merged.orders || []).map(order => {
        const status = order.status === 'packing' ? 'packaging' : order.status || 'pending_payment';
        return {
          ...order,
          status,
          tracking: order.tracking || order.code || String(order.id || '').toUpperCase(),
          customerEmail: order.customerEmail || order.email || '',
          delivery: order.delivery || order.address || order.location || '',
          paymentStatus: order.paymentStatus || 'pending',
          items: (order.items || []).map(item => ({ ...item, qty: item.qty || item.quantity || 1 })),
        };
      }),
    };
  } catch { return defaults; }
}

export function writeAdminData(next) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return next;
}

export function addAdminRecord(collection, record) {
  const current = readAdminData();
  const next = { ...current, [collection]: [{ id: `${collection}-${Date.now()}`, createdAt: new Date().toISOString(), ...record }, ...(current[collection] || [])] };
  return writeAdminData(next);
}

export function updateAdminCollection(collection, updater) {
  const current = readAdminData();
  return writeAdminData({ ...current, [collection]: updater(current[collection] || []) });
}

export function subscribeAdminData(callback) {
  const local = event => callback(event.detail || readAdminData());
  const storage = event => { if (event.key === KEY) callback(readAdminData()); };
  window.addEventListener(EVENT, local);
  window.addEventListener('storage', storage);
  return () => { window.removeEventListener(EVENT, local); window.removeEventListener('storage', storage); };
}
