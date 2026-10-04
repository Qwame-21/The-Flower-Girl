import { supabase } from '../../config/supabase';

/**
 * Convert any image_path to a working URL:
 * - Full http(s) URL or data URL → as is
 * - Path starting with "/" or "assets/" → site's own file
 * - Known static assets → /assets/filename
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
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  }

  const staticAssets = [
    'basket-hamper-editorial-v2.png',
    'bouquet-editorial-v2.png',
    'delivery-editorial-v2.png',
    'embroidery-editorial-v2.png',
    'engagement-presentation-v2.png',
    'gifting-factory-logo-transparent-v2.png',
    'hamper-editorial-v2.png',
    'hero_orange_roses_cutout.png',
    'hero_pink_lily_cutout.png',
    'luxury_hamper_cutout.png',
    'welcome_floral_monochrome.png',
    'wrapping-editorial-v2.png'
  ];

  if (staticAssets.includes(imagePath)) {
    return `/assets/${imagePath}`;
  }

  // Supabase Storage public URL
  if (supabase) {
    const { data } = supabase.storage.from('storefront-media').getPublicUrl(imagePath);
    if (data && data.publicUrl) {
      return data.publicUrl;
    }
  }

  // Fallback: treat as relative asset path
  return `/assets/${imagePath}`;
}

