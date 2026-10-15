import { supabase } from '../../config/supabase';

// List all products
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

// Get single product
export async function getProduct(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return product;
}

// Create product
export async function createProduct(productData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      id: productData.id,
      name: productData.name,
      slug: productData.slug,
      tag: productData.tag || '',
      description: productData.description || '',
      details: productData.details || [],
      category: productData.category,
      price: productData.price,
      stock: productData.stock || 0,
      low_stock_threshold: productData.low_stock_threshold || 3,
      image_path: productData.image_path || null,
      secondary_image_path: productData.secondary_image_path || null,
      visible: productData.visible !== false,
      sort_order: productData.sort_order || 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update product
export async function updateProduct(id, productData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      name: productData.name,
      slug: productData.slug,
      tag: productData.tag,
      description: productData.description,
      details: productData.details,
      category: productData.category,
      price: productData.price,
      stock: productData.stock,
      low_stock_threshold: productData.low_stock_threshold,
      image_path: productData.image_path,
      secondary_image_path: productData.secondary_image_path,
      visible: productData.visible,
      sort_order: productData.sort_order
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete product
export async function deleteProduct(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  // Get product first to know what images to delete
  const { data: product } = await supabase
    .from('products')
    .select('image_path, secondary_image_path')
    .eq('id', id)
    .single();

  // Delete from database first
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
  }

  // If database delete succeeded, delete images from storage
  if (product) {
    const imagesToDelete = [];
    if (product.image_path) imagesToDelete.push(product.image_path);
    if (product.secondary_image_path) imagesToDelete.push(product.secondary_image_path);

    for (const imagePath of imagesToDelete) {
      try {
        const { error: deleteError } = await supabase
          .storage
          .from('storefront-media')
          .remove([imagePath]);
        if (deleteError) {
          console.error('Error deleting image from storage:', imagePath, deleteError);
        }
      } catch (err) {
        console.error('Error deleting image from storage:', imagePath, err);
      }
    }
  }

  return { success: true };
}

// Upload product image
export async function uploadProductImage(file, productId) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const ext = file.name.split('.').pop();
  const filename = `${productId}.${ext}`;
  const filePath = `products/${filename}`;

  const { error: uploadError } = await supabase
    .storage
    .from('storefront-media')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return { success: false, error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from('storefront-media')
    .getPublicUrl(filePath);

  return { success: true, path: filePath, url: publicUrl };
}

// List promotions
export async function listPromotions() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: promotions, error } = await supabase
    .from('promotions')
    .select('*, products(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }

  return promotions;
}

// Create promotion
export async function createPromotion(promotionData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('promotions')
    .insert({
      product_id: promotionData.productId,
      percent: promotionData.percent,
      status: promotionData.status || 'paused',
      starts_at: promotionData.starts_at || null,
      ends_at: promotionData.ends_at || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating promotion:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update promotion
export async function updatePromotion(id, promotionData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('promotions')
    .update({
      percent: promotionData.percent,
      status: promotionData.status,
      starts_at: promotionData.starts_at,
      ends_at: promotionData.ends_at
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating promotion:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete promotion
export async function deletePromotion(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promotion:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export const DEFAULT_PRODUCTS = [
  {
    id: 'hamper-3750',
    name: 'Luxury hamper',
    slug: 'luxury-hamper',
    category: 'hampers',
    price: 3750,
    stock: 25,
    low_stock_threshold: 3,
    tag: 'SIGNATURE',
    description: 'Laptop bag, Lacoste shirt, YSL perfume, Patek Philippe watch, manicure set and card.',
    details: ['Premium gift box', 'Fashion and fragrance selection', 'Watch and grooming pieces', 'Personal message card'],
    image_path: 'hamper-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 0
  },
  {
    id: 'christmas-bundle',
    name: 'Christmas bundle',
    slug: 'christmas-bundle',
    category: 'bundles',
    price: 1250,
    stock: 20,
    low_stock_threshold: 3,
    tag: 'SEASONAL',
    description: 'Six yards of Hollandaise fabric, Bodycology fragrance splash and an insulated tumbler.',
    details: ['Hollandaise fabric', 'Fragrance splash', 'Insulated tumbler', 'Gift presentation'],
    image_path: 'engagement-presentation-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 1
  },
  {
    id: 'period-care',
    name: 'Period care box',
    slug: 'period-care-box',
    category: 'care',
    price: 650,
    stock: 30,
    low_stock_threshold: 5,
    tag: 'SUBSCRIPTION',
    description: 'Pads and panty liners, feminine wash and wipes, ginger tea with mint, cranberry juice, cookies and a hot water bottle. Monthly subscription available.',
    details: ['Period-care essentials', 'Tea, juice and cookies', 'Hot water bottle', 'Optional monthly delivery'],
    image_path: 'wrapping-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 2
  },
  {
    id: 'fresh-bouquet',
    name: 'Fresh flower bouquet',
    slug: 'fresh-flower-bouquet',
    category: 'flowers',
    price: 450,
    stock: 30,
    low_stock_threshold: 5,
    tag: 'FRESH',
    description: 'A fresh arrangement selected around your preferred palette, occasion and delivery date.',
    details: ['Seasonal fresh flowers', 'Chosen colour direction', 'Hand-tied finishing', 'Message card'],
    image_path: 'bouquet-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 3
  },
  {
    id: 'fragrance-gift',
    name: 'Fragrance & treats gift',
    slug: 'fragrance-treats-gift',
    category: 'hampers',
    price: 950,
    stock: 20,
    low_stock_threshold: 3,
    tag: 'FREQUENTLY CHOSEN',
    description: 'A personalized combination of fragrance, premium chocolate, flowers and a handwritten card.',
    details: ['Fragrance selection', 'Premium chocolates', 'Fresh floral accent', 'Handwritten card'],
    image_path: 'basket-hamper-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 4
  },
  {
    id: 'personalized-bag',
    name: 'Personalized wrist bag',
    slug: 'personalized-wrist-bag',
    category: 'personalized',
    price: 650,
    stock: 20,
    low_stock_threshold: 3,
    tag: 'PERSONALIZED',
    description: 'A wrist bag gift with optional name engraving, wrapping and additional accessories.',
    details: ['Wrist bag', 'Optional name finishing', 'Gift wrapping', 'Selected accessories'],
    image_path: 'delivery-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 5
  },
  {
    id: 'embroidery',
    name: 'Embroidery & personalization',
    slug: 'embroidery-personalization',
    category: 'personalized',
    price: 180,
    stock: 50,
    low_stock_threshold: 10,
    tag: 'MADE TO ORDER',
    description: 'Add a name or short personal detail to selected shirts, fabric gifts and accessories.',
    details: ['Name or short wording', 'Thread colour selection', 'Placement confirmation', 'Production approval'],
    image_path: 'embroidery-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 6
  }
];

// Get inventory summary for Overview
export async function getInventorySummary() {
  let products = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, stock, low_stock_threshold');
      if (!error && Array.isArray(data) && data.length > 0) {
        products = data;
      }
    } catch (err) {
      console.warn('Error fetching inventory summary from Supabase:', err);
    }
  }

  // Fallback to default catalog products if DB table is empty or inaccessible
  if (products.length === 0) {
    products = DEFAULT_PRODUCTS;
  }

  const out = products.filter(p => Number(p.stock || 0) === 0).length;
  const low = products.filter(p => {
    const s = Number(p.stock || 0);
    const th = Number(p.low_stock_threshold || 3);
    return s > 0 && s <= th;
  }).length;
  const healthy = products.filter(p => {
    const s = Number(p.stock || 0);
    const th = Number(p.low_stock_threshold || 3);
    return s > th;
  }).length;
  const total = products.length;

  return {
    healthy,
    low,
    out,
    totalProducts: total,
    lowStockCount: low,
    outOfStockCount: out,
    products
  };
}
