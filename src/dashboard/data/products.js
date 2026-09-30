import { supabase } from '../../config/supabase';

// List all products with stock data
export async function listProducts() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products;
}

// Get inventory summary
export async function getInventorySummary() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { healthy: 0, low: 0, out: 0, products: [] };
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, stock, low_stock_threshold, visible')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching inventory:', error);
    return { healthy: 0, low: 0, out: 0, products: [] };
  }

  let healthy = 0;
  let low = 0;
  let out = 0;

  const categorizedProducts = products.map(p => {
    if (p.stock === 0) {
      out++;
      return { ...p, status: 'out' };
    } else if (p.stock <= p.low_stock_threshold) {
      low++;
      return { ...p, status: 'low' };
    } else {
      healthy++;
      return { ...p, status: 'healthy' };
    }
  });

  return {
    healthy,
    low,
    out,
    products: categorizedProducts
  };
}
