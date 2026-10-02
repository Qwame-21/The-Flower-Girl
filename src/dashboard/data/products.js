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

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message };
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
