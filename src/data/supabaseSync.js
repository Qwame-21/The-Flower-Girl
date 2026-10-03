import { supabase } from '../config/supabase';
import { getImageUrl } from '../dashboard/lib/imageUrlHelper';

const DEFAULT_PRODUCTS = [
  { id: 'hamper-3750', name: 'Luxury hamper', price: 3750, priceLabel: 'GHS 3,750', detail: 'Laptop bag, Lacoste shirt, YSL perfume, Patek Philippe watch, manicure set and card.', image: '/assets/hamper-editorial-v2.png', tag: 'SIGNATURE', includes: ['Premium gift box', 'Fashion and fragrance selection', 'Watch and grooming pieces', 'Personal message card'] },
  { id: 'christmas-bundle', name: 'Christmas bundle', price: 1250, priceLabel: 'From GHS 1,250', detail: 'Six yards of Hollandaise fabric, Bodycology fragrance splash and an insulated tumbler.', image: '/assets/engagement-presentation-v2.png', tag: 'SEASONAL', includes: ['Hollandaise fabric', 'Fragrance splash', 'Insulated tumbler', 'Gift presentation'] },
  { id: 'period-care', name: 'Period care box', price: 650, priceLabel: 'From GHS 650', detail: 'Pads and panty liners, feminine wash and wipes, ginger tea with mint, cranberry juice, cookies and a hot water bottle. Monthly subscription available.', image: '/assets/wrapping-editorial-v2.png', tag: 'SUBSCRIPTION', includes: ['Period-care essentials', 'Tea, juice and cookies', 'Hot water bottle', 'Optional monthly delivery'] },
  { id: 'fresh-bouquet', name: 'Fresh flower bouquet', price: 450, priceLabel: 'From GHS 450', detail: 'A fresh arrangement selected around your preferred palette, occasion and delivery date.', image: '/assets/bouquet-editorial-v2.png', tag: 'FRESH', includes: ['Seasonal fresh flowers', 'Chosen colour direction', 'Hand-tied finishing', 'Message card'] },
  { id: 'fragrance-gift', name: 'Fragrance & treats gift', price: 950, priceLabel: 'From GHS 950', detail: 'A personalized combination of fragrance, premium chocolate, flowers and a handwritten card.', image: '/assets/basket-hamper-editorial-v2.png', tag: 'FREQUENTLY CHOSEN', includes: ['Fragrance selection', 'Premium chocolates', 'Fresh floral accent', 'Handwritten card'] },
  { id: 'personalized-bag', name: 'Personalized wrist bag', price: 650, priceLabel: 'From GHS 650', detail: 'A wrist bag gift with optional name engraving, wrapping and additional accessories.', image: '/assets/delivery-editorial-v2.png', tag: 'PERSONALIZED', includes: ['Wrist bag', 'Optional name finishing', 'Gift wrapping', 'Selected accessories'] },
  { id: 'embroidery', name: 'Embroidery & personalization', price: 180, priceLabel: 'From GHS 180', detail: 'Add a name or short personal detail to selected shirts, fabric gifts and accessories.', image: '/assets/embroidery-editorial-v2.png', tag: 'MADE TO ORDER', includes: ['Name or short wording', 'Thread colour selection', 'Placement confirmation', 'Production approval'] }
];

const DEFAULT_GALLERY = [
  { id: 'gallery-hamper', src: '/assets/hamper-editorial-v2.png', label: 'Luxury gift hamper', visible: true },
  { id: 'gallery-bouquet', src: '/assets/bouquet-editorial-v2.png', label: 'Fresh flower bouquet', visible: true },
  { id: 'gallery-wrap', src: '/assets/wrapping-editorial-v2.png', label: 'Signature gift presentation', visible: true },
  { id: 'gallery-basket', src: '/assets/basket-hamper-editorial-v2.png', label: 'Curated celebration basket', visible: true },
];

const DEFAULT_PROMOTIONS = [];

export async function fetchSupabaseData() {
  if (!supabase) {
    console.log('Supabase not configured, using built-in defaults');
    return { products: DEFAULT_PRODUCTS, promotions: DEFAULT_PROMOTIONS, gallery: DEFAULT_GALLERY, settings: null };
  }

  try {
    const [productsResult, promotionsResult, galleryResult, settingsResult] = await Promise.all([
      supabase.from('products').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('promotions').select('*').eq('status', 'active'),
      supabase.from('gallery_items').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('site_settings').select('*').single()
    ]);

    const products = productsResult.data || [];
    const promotions = promotionsResult.data || [];
    const galleryItems = galleryResult.data || [];
    const settings = settingsResult.data || null;

    // Map products to storefront shape
    const mappedProducts = products.length > 0 ? products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      priceLabel: `GHS ${p.price.toLocaleString()}`,
      detail: p.description || '',
      image: getImageUrl(p.image_path) || '/assets/gifting-factory-logo-transparent-v2.png',
      tag: p.tag || '',
      includes: Array.isArray(p.details) ? p.details : []
    })) : DEFAULT_PRODUCTS;

    // Map promotions to storefront shape
    const mappedPromotions = promotions.map(p => ({
      id: p.id,
      productId: p.product_id,
      percent: p.percent,
      status: p.status
    }));

    // Map gallery to storefront shape
    const mappedGallery = galleryItems.length > 0 ? galleryItems.map(g => ({
      id: g.id,
      src: getImageUrl(g.image_path) || '/assets/gifting-factory-logo-transparent-v2.png',
      label: g.title || g.caption || '',
      visible: g.visible
    })) : DEFAULT_GALLERY;

    return {
      products: mappedProducts,
      promotions: mappedPromotions,
      gallery: mappedGallery,
      settings
    };
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    // Return defaults on any error
    return { products: DEFAULT_PRODUCTS, promotions: DEFAULT_PROMOTIONS, gallery: DEFAULT_GALLERY, settings: null };
  }
}
