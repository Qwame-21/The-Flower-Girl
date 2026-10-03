import { supabase } from '../../config/supabase';

/**
 * Convert any image_path to a working URL:
 * - Full http(s) URL or data URL → as is
 * - Path starting with "/" or "assets/" → site's own file
 * - Otherwise → Supabase storefront-media public URL
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '';

  // Already a full URL or data URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Site's own file
  if (imagePath.startsWith('/') || imagePath.startsWith('assets/')) {
    return imagePath;
  }

  // Supabase Storage public URL
  if (supabase) {
    const { data } = supabase.storage.from('storefront-media').getPublicUrl(imagePath);
    return data.publicUrl;
  }

  // Fallback: treat as relative path
  return imagePath;
}
