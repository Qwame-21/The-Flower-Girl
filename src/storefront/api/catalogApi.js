import { supabase } from '../../config/supabase';

// In-memory cache for the session
let cachedProducts = null;
let cachedPromotions = null;
let cachedGallery = null;
let cachedSettings = null;

// List visible products (storefront shape)
export async function getProducts() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return cachedProducts || [];
    }

    // Transform to storefront shape
    const storefrontProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      priceLabel: `GHS ${p.price}`,
      detail: p.description,
      image: p.image_path ? `/assets/${p.image_path}` : '',
      tag: p.tag,
      includes: Array.isArray(p.details) ? p.details : [],
      category: p.category,
      stock: p.stock
    }));

    cachedProducts = storefrontProducts;
    return storefrontProducts;
  } catch (err) {
    console.error('Error fetching products:', err);
    return cachedProducts || [];
  }
}

// List active promotions (storefront shape)
export async function getPromotions() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return cachedPromotions || [];
    }

    // Check time validity
    const now = new Date();
    const validPromotions = promotions.filter(p => {
      if (p.starts_at && new Date(p.starts_at) > now) return false;
      if (p.ends_at && new Date(p.ends_at) < now) return false;
      return true;
    });

    // Transform to storefront shape
    const storefrontPromotions = validPromotions.map(p => ({
      id: p.id,
      productId: p.product_id,
      percent: p.percent,
      status: p.status
    }));

    cachedPromotions = storefrontPromotions;
    return storefrontPromotions;
  } catch (err) {
    console.error('Error fetching promotions:', err);
    return cachedPromotions || [];
  }
}

// List visible gallery items (storefront shape)
export async function getGallery() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data: items, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching gallery:', error);
      return cachedGallery || [];
    }

    // Transform to storefront shape
    const storefrontGallery = items.map(item => ({
      id: item.id,
      src: `${supabase.storage.from('storefront-media').getPublicUrl(item.image_path)}`,
      label: item.label,
      visible: item.visible
    }));

    cachedGallery = storefrontGallery;
    return storefrontGallery;
  } catch (err) {
    console.error('Error fetching gallery:', err);
    return cachedGallery || [];
  }
}

// Get site settings (storefront shape)
export async function getSettings() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  try {
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return cachedSettings;
    }

    cachedSettings = settings;
    return settings;
  } catch (err) {
    console.error('Error fetching settings:', err);
    return cachedSettings;
  }
}

// Clear cache (call on logout or explicit refresh)
export function clearCache() {
  cachedProducts = null;
  cachedPromotions = null;
  cachedGallery = null;
  cachedSettings = null;
}
