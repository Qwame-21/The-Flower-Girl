// Adapter to make HOPESON CustomersPage work with Supabase orders
// Returns data in the exact shape HOPESON expects

import { listOrders } from './orders';
import { formatGHS } from '../lib/ordersModel';
import { supabase } from '../../config/supabase';

const CUSTOMERS_KEY = 'xa12-customers-data-v1';

// Load customers from localStorage cache (sync)
export function loadCustomersData() {
  try {
    const cached = localStorage.getItem(CUSTOMERS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return [];
}

// Save customers overrides to localStorage & Supabase customer_profiles
export async function saveCustomersData(list) {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
    if (supabase) {
      for (const c of list) {
        try {
          if (c.email && c.email !== 'N/A') {
            await supabase.from('customer_profiles').upsert({
              email: c.email,
              vip: Boolean(c.isVip),
              notes: c.notes || ''
            }, { onConflict: 'email' });
          }
        } catch {}
      }
    }
  } catch {}
}

// Sync with Supabase orders (async)
export async function syncCustomersWithSupabase() {
  const orders = await listOrders();
  let overridesMap = {};
  try {
    const stored = localStorage.getItem(CUSTOMERS_KEY);
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr)) {
        arr.forEach(c => { overridesMap[c.id || c.email || c.phone] = c; });
      }
    }
  } catch {}

  const customerGroupMap = new Map();

  orders.forEach(ord => {
    const key = (ord.customerEmail || ord.customerPhone || ord.customerName).toLowerCase().trim();
    if (!customerGroupMap.has(key)) {
      customerGroupMap.set(key, {
        id: `cust-${key.replace(/[^a-z0-9]/g, '')}`,
        name: ord.customerName || 'Customer',
        email: ord.customerEmail || 'N/A',
        phone: ord.customerPhone || 'N/A',
        orderCount: 0,
        totalSpend: 0,
        lastOrderDate: ord.orderDate ? ord.orderDate.split('T')[0] : 'N/A',
        isVip: false,
        notes: '',
        orderHistory: []
      });
    }

    const c = customerGroupMap.get(key);
    c.orderCount += 1;
    if (ord.paymentStatus === 'paid') {
      c.totalSpend += Number(ord.total || 0);
    }
    c.orderHistory.push(ord);

    if (ord.orderDate && ord.orderDate > c.lastOrderDate) {
      c.lastOrderDate = ord.orderDate.split('T')[0];
    }
  });

  const result = Array.from(customerGroupMap.values()).map(c => {
    const ov = overridesMap[c.id] || overridesMap[c.email] || overridesMap[c.phone] || {};
    return {
      ...c,
      isVip: Boolean(ov.isVip),
      notes: ov.notes || ''
    };
  });

  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(result));
  return result;
}
