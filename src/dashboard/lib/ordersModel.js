// src/lib/ordersModel.js — Ported verbatim from admin-monolith.html ordersModel.js

export const STORAGE_KEYS = {
  V1: 'xa12-orders-data-v1',
  V2: 'xa12-orders-data-v2',
  DELETED: 'xa12-orders-deleted-v1',
  ROLLUPS: 'xa12-daily-rollups-v1',
  ACTIVITY: 'xa12-activity-log-v1'
};

export const LOGS_RETENTION_DAYS = 30;
export const KEEP_DAILY_ROLLUPS = true;
export const INVENTORY_THRESHOLDS = { low: 5, out: 0 };

export const CATEGORY_MAP = {
  hampers: 'Hampers',
  personalized: 'Personalized',
  bundles: 'Bundles',
  care: 'Care',
  flowers: 'Flowers'
};

export const ORDER_CATEGORIES = [
  { id: 'hampers', name: 'Hampers' },
  { id: 'personalized', name: 'Personalized' },
  { id: 'bundles', name: 'Bundles' },
  { id: 'care', name: 'Care' },
  { id: 'flowers', name: 'Flowers' }
];

export const FULFILLMENT_STATUS_MAP = {
  pending_payment: { label: 'Pending Payment', stage: null },
  preparing: { label: 'Processing', stage: 'processing' },
  ready: { label: 'Packed', stage: 'packed' },
  dispatched: { label: 'Dispatched', stage: 'dispatched' },
  delivered: { label: 'Delivered', stage: 'delivered' },
  cancelled: { label: 'Cancelled', stage: null }
};

export const STEPPER_STAGES = ['paid', 'processing', 'packed', 'dispatched', 'delivered'];

export const VALID_TRANSITIONS = {
  pending_payment: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['dispatched', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered: ['cancelled'],
  cancelled: []
};

export const RAW_SNAPSHOT_PRODUCTS = [
  {
    id: "hamper-3750",
    name: "Luxury hamper",
    category: "hampers",
    price: 3750,
    stock: 25,
    image: "",
    description: "Laptop bag, Lacoste shirt, YSL perfume, Patek Philippe watch, manicure set and card.",
    tags: ["SIGNATURE"],
    active: true,
    syntheticSku: "HAM-3750",
    isSyntheticSku: true
  },
  {
    id: "christmas-bundle",
    name: "Christmas bundle",
    category: "bundles",
    price: 1250,
    stock: 20,
    image: "",
    description: "Six yards of Hollandaise fabric, Bodycology fragrance splash and an insulated tumbler.",
    tags: ["SEASONAL"],
    active: true,
    syntheticSku: "BUN-1250",
    isSyntheticSku: true
  },
  {
    id: "period-care",
    name: "Period care box",
    category: "care",
    price: 650,
    stock: 30,
    image: "",
    description: "Pads and panty liners, feminine wash and wipes, ginger tea with mint, cranberry juice, cookies and a hot water bottle. Monthly subscription available.",
    tags: ["SUBSCRIPTION"],
    active: true,
    syntheticSku: "CAR-0650",
    isSyntheticSku: true
  },
  {
    id: "fresh-bouquet",
    name: "Fresh flower bouquet",
    category: "flowers",
    price: 450,
    stock: 30,
    image: "",
    description: "A fresh arrangement selected around your preferred palette, occasion and delivery date.",
    tags: ["FRESH"],
    active: true,
    syntheticSku: "FLO-0450",
    isSyntheticSku: true
  },
  {
    id: "fragrance-gift",
    name: "Fragrance & treats gift",
    category: "hampers",
    price: 950,
    stock: 20,
    image: "",
    description: "A personalized combination of fragrance, premium chocolate, flowers and a handwritten card.",
    tags: ["FREQUENTLY CHOSEN"],
    active: true,
    syntheticSku: "HAM-0950",
    isSyntheticSku: true
  },
  {
    id: "personalized-bag",
    name: "Personalized wrist bag",
    category: "personalized",
    price: 650,
    stock: 20,
    image: "",
    description: "A wrist bag gift with optional name engraving, wrapping and additional accessories.",
    tags: ["PERSONALIZED"],
    active: true,
    syntheticSku: "PER-0650",
    isSyntheticSku: true
  },
  {
    id: "embroidery",
    name: "Embroidery & personalization",
    category: "personalized",
    price: 180,
    stock: 50,
    image: "",
    description: "Add a name or short personal detail to selected shirts, fabric gifts and accessories.",
    tags: ["MADE TO ORDER"],
    active: true,
    syntheticSku: "EMB-0180",
    isSyntheticSku: true
  }
];

export const productsCatalog = {
  getAll() {
    return RAW_SNAPSHOT_PRODUCTS.map(p => ({
      id: p.id,
      sku: p.syntheticSku,
      name: p.name,
      category: CATEGORY_MAP[p.category] || p.category,
      rawCategory: p.category,
      price: p.price,
      variants: [],
      stock: p.stock,
      image: p.image,
      description: p.description,
      tags: p.tags,
      active: p.active,
      isSyntheticSku: true
    }));
  },
  getCategories() {
    return [
      { id: 'all', name: 'All Orders' },
      ...ORDER_CATEGORIES
    ];
  },
  getById(id) {
    const p = RAW_SNAPSHOT_PRODUCTS.find(item => item.id === id);
    if (!p) return null;
    return {
      id: p.id,
      sku: p.syntheticSku,
      name: p.name,
      category: CATEGORY_MAP[p.category] || p.category,
      rawCategory: p.category,
      price: p.price,
      variants: [],
      stock: p.stock,
      image: p.image,
      description: p.description,
      tags: p.tags,
      active: p.active
    };
  }
};

function createPRNG(seed = 987654321) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSeededOrders(baseDate = new Date('2026-09-21T00:00:00Z')) {
  const prng = createPRNG(123456789);
  const products = productsCatalog.getAll();
  const customerNames = [
    "Adwoa Mensah", "Kwame Asare", "Abena Osei", "Kofi Annan",
    "Akosua Dankwa", "Yaw Darko", "Efia Boakye", "Kweku Baako",
    "Ama K. Abebrese", "Kojo Oppong", "Yaa Asantewaa", "Fiifi Kwetey",
    "Esi Eduful", "Kobina Tahir", "Akua Donkor", "Paapa Yankson",
    "Araba Koomson", "Nana Aba Anamoah", "Kwadwo Sheldon", "Selorm Adadevoh"
  ];
  const ghanaPhones = [
    "+233 24 123 4567", "+233 20 987 6543", "+233 55 444 3322",
    "+233 27 888 9911", "+233 50 112 2334", "+233 26 554 4332",
    "+233 24 990 0112", "+233 20 776 6554", "+233 55 331 1223"
  ];

  const orders = [];
  let seqNumber = 1;

  for (let dayOffset = 0; dayOffset <= 89; dayOffset++) {
    const dateObj = new Date(baseDate.getTime() - dayOffset * 86400000);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const orderCount = isWeekend ? (2 + Math.floor(prng() * 2)) : Math.floor(prng() * 2);

    for (let i = 0; i < orderCount; i++) {
      const orderIdStr = `ORD-${String(9841 - seqNumber).padStart(4, '0')}`;
      const codeStr = `GF-2026-${String(seqNumber).padStart(5, '0')}`;
      seqNumber++;

      const name = customerNames[Math.floor(prng() * customerNames.length)];
      const phone = ghanaPhones[Math.floor(prng() * ghanaPhones.length)];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      const source = prng() < 0.35 ? 'staff' : 'online';

      const itemCount = 1 + Math.floor(prng() * 2.2);
      const items = [];
      let totalAmount = 0;

      for (let k = 0; k < itemCount; k++) {
        const prod = products[Math.floor(prng() * products.length)];
        const qty = 1 + (prng() < 0.2 ? 1 : 0);
        const lineTotal = prod.price * qty;
        totalAmount += lineTotal;
        items.push({
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          variant: '',
          qty: qty,
          unitPrice: prod.price,
          category: prod.category
        });
      }

      let fulfillmentStatus = 'delivered';
      let paymentStatus = 'paid';
      let deliveredAt = null;

      if (dayOffset <= 15) {
        const randStatus = prng();
        if (randStatus < 0.15) {
          fulfillmentStatus = 'pending_payment';
          paymentStatus = 'pending';
        } else if (randStatus < 0.30) {
          fulfillmentStatus = 'preparing';
          paymentStatus = 'paid';
        } else if (randStatus < 0.45) {
          fulfillmentStatus = 'ready';
          paymentStatus = 'paid';
        } else if (randStatus < 0.60) {
          fulfillmentStatus = 'dispatched';
          paymentStatus = 'paid';
        } else if (randStatus < 0.70) {
          fulfillmentStatus = 'cancelled';
          paymentStatus = prng() < 0.5 ? 'pending' : 'paid';
        } else {
          fulfillmentStatus = 'delivered';
          paymentStatus = 'paid';
          deliveredAt = dateObj.toISOString();
        }
      } else {
        if (prng() < 0.05) {
          fulfillmentStatus = 'cancelled';
          paymentStatus = 'paid';
        } else {
          fulfillmentStatus = 'delivered';
          paymentStatus = 'paid';
          deliveredAt = dateObj.toISOString();
        }
      }

      let estimatedDelivery = '';
      let estimatedDeliveryAt = { date: '', window: '', from: '', to: '' };
      let adminNote = '';

      if (orderIdStr === 'ORD-9840') {
        fulfillmentStatus = 'preparing';
        paymentStatus = 'paid';
      } else if (orderIdStr === 'ORD-9838') {
        fulfillmentStatus = 'pending_payment';
        paymentStatus = 'pending';
      } else if (orderIdStr === 'ORD-9834') {
        fulfillmentStatus = 'preparing';
        paymentStatus = 'paid';
      } else if (orderIdStr === 'ORD-9828') {
        fulfillmentStatus = 'preparing';
        paymentStatus = 'paid';
      }

      if (seqNumber === 5) {
        estimatedDelivery = "Deliver to East Legon near Shell by 2pm";
      } else if (seqNumber === 10) {
        const todayStr = baseDate.toISOString().split('T')[0];
        estimatedDeliveryAt = { date: todayStr, window: 'morning', from: '09:00', to: '12:00' };
        estimatedDelivery = `Today · 9am-12pm`;
      } else if (seqNumber === 15) {
        adminNote = "Please make sure the ribbons are burgundy red and include a handwritten card saying Happy Anniversary to my dear Sarah!";
      }

      orders.push({
        id: orderIdStr,
        orderCode: codeStr,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        amount: totalAmount,
        paymentStatus,
        fulfillmentStatus,
        orderDate: dateObj.toISOString(),
        deliveredAt,
        source,
        estimatedDelivery,
        estimatedDeliveryAt,
        adminNote,
        items
      });
    }
  }

  return orders;
}

export function getOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.V2) || localStorage.getItem(STORAGE_KEYS.V1);
    if (raw) {
      return JSON.parse(raw);
    }
    const seeded = generateSeededOrders();
    localStorage.setItem(STORAGE_KEYS.V2, JSON.stringify(seeded));
    return seeded;
  } catch {
    return generateSeededOrders();
  }
}

export function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEYS.V2, JSON.stringify(orders));
  } catch {}
}

export function isPendingPayment(o) {
  return o.paymentStatus === 'pending' && o.fulfillmentStatus !== 'cancelled';
}

export function getCombinedStats(period = 'all') {
  const liveOrders = getOrders();
  const rawRollups = localStorage.getItem(STORAGE_KEYS.ROLLUPS);
  const rollups = (KEEP_DAILY_ROLLUPS && rawRollups) ? JSON.parse(rawRollups) : {};

  const now = new Date();
  let periodDays = Infinity;
  if (period === '7d') periodDays = 7;
  else if (period === '30d') periodDays = 30;

  const cutoffDate = periodDays !== Infinity ? new Date(now.getTime() - periodDays * 86400000) : null;
  const cutoffStr = cutoffDate ? cutoffDate.toISOString().split('T')[0] : '0000-00-00';

  let totalRevenue = 0;
  let totalOrdersCount = 0;
  let paidNonCancelledCount = 0;

  const categoryRevenue = { hampers: 0, personalized: 0, bundles: 0, care: 0, flowers: 0 };
  const productUnits = {};

  liveOrders.forEach(o => {
    const oDateStr = (o.orderDate || '').split('T')[0];
    if (cutoffStr && oDateStr < cutoffStr) return;

    if (o.fulfillmentStatus !== 'cancelled') {
      totalOrdersCount++;
      if (o.paymentStatus === 'paid') {
        totalRevenue += o.amount;
        paidNonCancelledCount++;
      }

      (o.items || []).forEach(item => {
        const catKey = (item.category || '').toLowerCase();
        if (categoryRevenue[catKey] !== undefined) {
          categoryRevenue[catKey] += (item.unitPrice * item.qty);
        }
        const pId = item.productId || item.name;
        if (!productUnits[pId]) {
          productUnits[pId] = { name: item.name, units: 0, revenue: 0 };
        }
        productUnits[pId].units += item.qty;
        productUnits[pId].revenue += (item.unitPrice * item.qty);
      });
    }
  });

  if (KEEP_DAILY_ROLLUPS) {
    Object.keys(rollups).forEach(dateKey => {
      if (cutoffStr && dateKey < cutoffStr) return;
      const r = rollups[dateKey];
      totalRevenue += r.revenue;
      totalOrdersCount += r.orders;
      paidNonCancelledCount += r.orders;

      Object.keys(r.byCategory || {}).forEach(cat => {
        if (categoryRevenue[cat] !== undefined) {
          categoryRevenue[cat] += r.byCategory[cat];
        }
      });

      Object.keys(r.byProduct || {}).forEach(pId => {
        if (!productUnits[pId]) {
          const prodObj = productsCatalog.getById(pId);
          productUnits[pId] = { name: prodObj ? prodObj.name : pId, units: 0, revenue: 0 };
        }
        productUnits[pId].units += r.byProduct[pId].units;
        productUnits[pId].revenue += r.byProduct[pId].revenue;
      });
    });
  }

  const avgOrderValue = paidNonCancelledCount > 0 ? (totalRevenue / paidNonCancelledCount) : 0;

  return {
    totalRevenue,
    totalOrdersCount,
    paidNonCancelledCount,
    avgOrderValue,
    categoryRevenue,
    productUnits
  };
}

export function getActivityLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (raw) return JSON.parse(raw);
    const sample = [
      { id: 1, type: 'order', text: 'New order #ORD-9840 received', timeRelative: '2m ago' },
      { id: 2, type: 'payment', text: 'Payment confirmed for #ORD-9834 (GHS 3,750)', timeRelative: '15m ago' },
      { id: 3, type: 'delivery', text: '#ORD-9828 dispatched for delivery', timeRelative: '1h ago' },
      { id: 4, type: 'signin', text: 'Admin signed in from Accra', timeRelative: '3h ago' }
    ];
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(sample));
    return sample;
  } catch {
    return [];
  }
}

export function logActivityEvent(event) {
  try {
    const list = getActivityLog();
    const entry = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type: event.type || 'info',
      text: event.text,
      timeRelative: 'Just now'
    };
    list.unshift(entry);
    if (list.length > 300) list.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(list));
  } catch (e) {
    console.warn('logActivityEvent error:', e);
  }
}

export function formatGHS(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || isNaN(num)) {
    return 'GHS 0.00';
  }
  return `GHS ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getAttentionOrders() {
  const orders = getOrders();
  return orders.filter(o => o.fulfillmentStatus !== 'delivered' && o.fulfillmentStatus !== 'cancelled');
}

export function getActiveStockAlerts() {
  const prods = productsCatalog.getAll();
  return prods.filter(p => {
    const alertLevel = typeof p.threshold === 'number' ? p.threshold : (parseInt(p.threshold, 10) || 5);
    const stockVal = typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0);
    return stockVal <= alertLevel;
  });
}

export function getOrderStats(orders) {

  const combined = getCombinedStats('all');
  const activeOrders = orders.filter(o => o.fulfillmentStatus !== 'delivered' && o.fulfillmentStatus !== 'cancelled').length;
  const pendingPayment = orders.filter(isPendingPayment).length;

  return {
    totalRevenue: combined.totalRevenue,
    activeOrders: activeOrders,
    pendingPayment: pendingPayment,
    avgOrderValue: combined.avgOrderValue
  };
}

export function getCategoryCounts(orders) {
  const counts = {
    all: orders.length,
    hampers: 0,
    personalized: 0,
    bundles: 0,
    care: 0,
    flowers: 0
  };

  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const cat = (item.category || '').toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
  });

  return counts;
}

export function getStatusCounts(orders) {
  return {
    all: orders.length,
    pending_payment: orders.filter(isPendingPayment).length,
    preparing: orders.filter(o => o.fulfillmentStatus === 'preparing').length,
    ready: orders.filter(o => o.fulfillmentStatus === 'ready').length,
    dispatched: orders.filter(o => o.fulfillmentStatus === 'dispatched').length,
    delivered: orders.filter(o => o.fulfillmentStatus === 'delivered').length,
    cancelled: orders.filter(o => o.fulfillmentStatus === 'cancelled').length
  };
}

export function getSourceCounts(orders) {
  return {
    all: orders.length,
    staff: orders.filter(o => o.source === 'staff').length,
    online: orders.filter(o => o.source === 'online').length
  };
}

export const overviewDemoData = {

  orderStatus: {
    delivered: { key: 'delivered', label: 'Delivered', value: 34, color: 'var(--chart-good, #5E9470)' },
    preparing: { key: 'preparing', label: 'Processing', value: 8, color: 'var(--chart-progress, #D0A24A)' },
    ready: { key: 'ready', label: 'Packed', value: 5, color: 'var(--chart-info, #5F82A6)' },
    dispatched: { key: 'dispatched', label: 'Dispatched', value: 4, color: 'var(--chart-sage, #6E9C7B)' },
    pending: { key: 'pending', label: 'Pending Payment', value: 3, color: 'var(--chart-bad, #B9645C)' }
  },
  inventory: {
    healthy: { key: 'healthy', label: 'In Stock', value: 18, color: 'var(--chart-good, #5E9470)' },
    low: { key: 'low', label: 'Low Stock', value: 5, color: 'var(--chart-progress, #D0A24A)' },
    out: { key: 'out', label: 'Out of Stock', value: 2, color: 'var(--chart-bad, #B9645C)' }
  },
  delivery: {
    onTime: { key: 'onTime', label: 'On Time', value: 42, color: 'var(--chart-good, #5E9470)' },
    runningLate: { key: 'runningLate', label: 'Running Late', value: 4, color: 'var(--chart-bad, #B9645C)' }
  }
};
