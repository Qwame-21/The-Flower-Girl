import { addAdminRecord, updateAdminCollection, isDefaultAdminRecord } from '../api/adminStore.js';
const demoOrders = new Set(['order-gf-1052','order-gf-1051','order-gf-1050','order-gf-1049','order-gf-1048']);
const demoReviews = new Set(['RV-018','RV-017','RV-016']);
export function adminView(data) {
  const catalogue = Object.fromEntries(['products', 'collections', 'promotions', 'careers'].map(collection => [collection, (data[collection] || []).filter(record => !isDefaultAdminRecord(collection, record))]));
  return { ...data, ...catalogue, orders: (data.orders || []).filter(order => order.source === 'supabase' || !demoOrders.has(order.id)), reviews: (data.reviews || []).filter(review => !demoReviews.has(review.id)) };
}
export function saveBrowserRecord(collection, record, values) {
  if (record.id) return updateAdminCollection(collection, records => records.map(item => item.id === record.id ? { ...item, ...values, updatedAt: new Date().toISOString() } : item));
  return addAdminRecord(collection, values);
}
export function validateProductImage(value) {
  if (value && !/^(https:\/\/|\/[^/])/.test(value)) throw new Error('Use an HTTPS URL or a local /assets path.');
}
export function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
}
