import { supabase } from '../../config/supabase';
import { getImageUrl } from '../../dashboard/lib/imageUrlHelper';
import { PRODUCTS } from '../../data/products';

const CACHE_KEY = 'flowergirl-live-products-v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Map Supabase product shape to storefront product shape
 * Matches the shape of hardcoded PRODUCTS in src/data/products.js
 */
function mapDbProductToStorefront(dbProduct) {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price,
    priceLabel: `GHS ${dbProduct.price.toLocaleString()}`,
    detail: dbProduct.description || '',
    image: getImageUrl(dbProduct.image_path) || '/assets/gifting-factory-logo-transparent-v2.png',
    tag: dbProduct.tag || '',
    includes: Array.isArray(dbProduct.details) ? dbProduct.details : [],
  };
}

/**
 * Fetch live products from Supabase
 */
export async function fetchLiveProducts() {
  if (!supabase) {
    console.log('Supabase not configured, using hardcoded products');
    return { products: PRODUCTS, source: 'hardcoded' };
  }

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    if (!products || products.length === 0) {
      console.log('No visible products in database, using hardcoded products');
      return { products: PRODUCTS, source: 'hardcoded' };
    }

    const mappedProducts = products.map(mapDbProductToStorefront);
    
    // Update cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        products: mappedProducts,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Failed to cache products:', e);
    }

    return { products: mappedProducts, source: 'live' };
  } catch (error) {
    console.error('Failed to fetch live products:', error);
    
    // Try to use cached products
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { products, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('Using cached products');
          return { products, source: 'cache' };
        }
      }
    } catch (e) {
      console.warn('Failed to read cache:', e);
    }

    // Final fallback to hardcoded
    console.log('Using hardcoded products as final fallback');
    return { products: PRODUCTS, source: 'hardcoded' };
  }
}

/**
 * Get cached products (sync)
 */
export function getCachedProducts() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { products, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return products;
      }
    }
  } catch (e) {
    console.warn('Failed to read cache:', e);
  }
  return null;
}

/**
 * Subscribe to Realtime changes on products
 */
export function subscribeToProducts(callback) {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('products-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      async (payload) => {
        // Refetch all products on any change
        const { products } = await fetchLiveProducts();
        callback(products);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
