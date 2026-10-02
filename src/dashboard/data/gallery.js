import { supabase } from '../../config/supabase';

// List gallery items
export async function listGalleryItems() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: items, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching gallery items:', error);
    return [];
  }

  return items;
}

// Create gallery item
export async function createGalleryItem(itemData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('gallery_items')
    .insert({
      image_path: itemData.image_path,
      label: itemData.label,
      category: itemData.category || null,
      visible: itemData.visible !== false,
      sort_order: itemData.sort_order || 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating gallery item:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update gallery item
export async function updateGalleryItem(id, itemData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('gallery_items')
    .update({
      label: itemData.label,
      category: itemData.category,
      visible: itemData.visible,
      sort_order: itemData.sort_order
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating gallery item:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete gallery item
export async function deleteGalleryItem(id, imagePath) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  // Delete from storage first
  if (imagePath) {
    const { error: storageError } = await supabase
      .storage
      .from('storefront-media')
      .remove([imagePath]);

    if (storageError) {
      console.warn('Error deleting from storage:', storageError);
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting gallery item:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Upload gallery image
export async function uploadGalleryImage(file) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const ext = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = `gallery/${filename}`;

  const { error: uploadError } = await supabase
    .storage
    .from('storefront-media')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return { success: false, error: uploadError.message };
  }

  return { success: true, path: filePath };
}
