import { supabase } from '../../config/supabase';
import { listOrders } from './orders';
import { listProducts } from './products';
import { listGalleryItems } from './gallery';
import { listPromotions } from './products';

/**
 * Shared cache for admin dashboard data
 * Implements stale-while-revalidate pattern
 */

const CACHE = {
  orders: { data: null, timestamp: 0, loading: false },
  products: { data: null, timestamp: 0, loading: false },
  gallery: { data: null, timestamp: 0, loading: false },
  promotions: { data: null, timestamp: 0, loading: false },
};

const CACHE_DURATION = 30000; // 30 seconds

const listeners = new Set();

function notifyListeners() {
  listeners.forEach(callback => callback());
}

export function subscribeToCache(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getCachedData(key) {
  return CACHE[key]?.data || null;
}

export function isDataLoading(key) {
  return CACHE[key]?.loading || false;
}

export function getDataTimestamp(key) {
  return CACHE[key]?.timestamp || 0;
}

export function isDataStale(key) {
  return Date.now() - (CACHE[key]?.timestamp || 0) > CACHE_DURATION;
}

/**
 * Fetch orders with stale-while-revalidate
 */
export async function fetchOrders(forceRefresh = false) {
  if (!forceRefresh && CACHE.orders.data && !isDataStale('orders')) {
    return CACHE.orders.data;
  }

  if (CACHE.orders.loading) {
    return CACHE.orders.data; // Return stale data while loading
  }

  CACHE.orders.loading = true;
  notifyListeners();

  try {
    const data = await listOrders();
    CACHE.orders.data = data;
    CACHE.orders.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    // Keep existing data on error
    return CACHE.orders.data;
  } finally {
    CACHE.orders.loading = false;
    notifyListeners();
  }
}

/**
 * Fetch products with stale-while-revalidate
 */
export async function fetchProducts(forceRefresh = false) {
  if (!forceRefresh && CACHE.products.data && !isDataStale('products')) {
    return CACHE.products.data;
  }

  if (CACHE.products.loading) {
    return CACHE.products.data;
  }

  CACHE.products.loading = true;
  notifyListeners();

  try {
    const data = await listProducts();
    CACHE.products.data = data;
    CACHE.products.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return CACHE.products.data;
  } finally {
    CACHE.products.loading = false;
    notifyListeners();
  }
}

/**
 * Fetch gallery with stale-while-revalidate
 */
export async function fetchGallery(forceRefresh = false) {
  if (!forceRefresh && CACHE.gallery.data && !isDataStale('gallery')) {
    return CACHE.gallery.data;
  }

  if (CACHE.gallery.loading) {
    return CACHE.gallery.data;
  }

  CACHE.gallery.loading = true;
  notifyListeners();

  try {
    const data = await listGalleryItems();
    CACHE.gallery.data = data;
    CACHE.gallery.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return CACHE.gallery.data;
  } finally {
    CACHE.gallery.loading = false;
    notifyListeners();
  }
}

/**
 * Fetch promotions with stale-while-revalidate
 */
export async function fetchPromotions(forceRefresh = false) {
  if (!forceRefresh && CACHE.promotions.data && !isDataStale('promotions')) {
    return CACHE.promotions.data;
  }

  if (CACHE.promotions.loading) {
    return CACHE.promotions.data;
  }

  CACHE.promotions.loading = true;
  notifyListeners();

  try {
    const data = await listPromotions();
    CACHE.promotions.data = data;
    CACHE.promotions.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return CACHE.promotions.data;
  } finally {
    CACHE.promotions.loading = false;
    notifyListeners();
  }
}

/**
 * Refresh all cached data
 */
export async function refreshAllData() {
  await Promise.all([
    fetchOrders(true),
    fetchProducts(true),
    fetchGallery(true),
    fetchPromotions(true),
  ]);
}

/**
 * Clear cache (e.g., after logout)
 */
export function clearCache() {
  Object.keys(CACHE).forEach(key => {
    CACHE[key] = { data: null, timestamp: 0, loading: false };
  });
  notifyListeners();
}
