// src/lib/ordersModel.js — Shared utilities for dashboard
// Demo data removed - now uses Supabase data layer for scoped pages
// Stubs kept for pages outside Phase 6A scope (Products, Requests, ShopPOS)

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

export function formatGHS(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || isNaN(num)) {
    return 'GHS 0.00';
  }
  return `GHS ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function isPendingPayment(o) {
  return o.paymentStatus === 'pending' && o.fulfillmentStatus !== 'cancelled';
}

// Stubs for pages outside Phase 6A scope (Products, Requests, ShopPOS)
// These pages will be migrated in a future phase
export function getOrders() {
  console.warn('getOrders() is deprecated for pages outside Phase 6A scope');
  return [];
}

export function saveOrders(orders) {
  console.warn('saveOrders() is deprecated for pages outside Phase 6A scope');
}

export function logActivityEvent(event) {
  console.warn('logActivityEvent() is deprecated for pages outside Phase 6A scope');
}

export function getAttentionOrders() {
  console.warn('getAttentionOrders() is deprecated for pages outside Phase 6A scope');
  return [];
}

export function getActiveStockAlerts() {
  console.warn('getActiveStockAlerts() is deprecated for pages outside Phase 6A scope');
  return [];
}

export const RAW_SNAPSHOT_PRODUCTS = [];


