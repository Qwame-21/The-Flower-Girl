import { supabase } from '../../config/supabase';

const CACHE_KEY = 'flowergirl-customization-v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Hardcoded fallback options (used when Supabase is not configured or fetch fails)
const DEFAULT_OPTIONS = {
  'Base': ['Basket', 'Box', 'Bag'],
  'Contents': ['Perfume', 'Chocolate', 'Wine', 'Skincare', 'Jewelry', 'Socks', 'Tie', 'Scarf'],
  'Finishing': ['Ribbon', 'Card', 'Wrapping paper', 'Tissue paper', 'Gift tag'],
  'Delivery': ['Same-day delivery', 'Scheduled delivery', 'Surprise delivery', 'Collection']
};

const DEFAULT_ESTIMATES = {
  'Basket': 50, 'Box': 40, 'Bag': 30,
  'Perfume': 150, 'Chocolate': 80, 'Wine': 120, 'Skincare': 100, 'Jewelry': 200, 'Socks': 50, 'Tie': 60, 'Scarf': 70,
  'Ribbon': 10, 'Card': 15, 'Wrapping paper': 20, 'Tissue paper': 5, 'Gift tag': 10,
  'Same-day delivery': 120, 'Scheduled delivery': 90, 'Surprise delivery': 140, 'Collection': 0
};

export async function fetchStorefrontCustomization() {
  if (!supabase) {
    console.log('Supabase not configured, using default customization options');
    return { options: DEFAULT_OPTIONS, estimates: DEFAULT_ESTIMATES, source: 'hardcoded' };
  }

  try {
    const { data, error } = await supabase
      .from('customization_options')
      .select('category, option_name, estimate, display_order')
      .eq('visible', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No visible customization options in database, using defaults');
      return { options: DEFAULT_OPTIONS, estimates: DEFAULT_ESTIMATES, source: 'hardcoded' };
    }

    const optionsMap = {};
    const estimatesMap = {};

    data.forEach(row => {
      const cat = row.category || 'General';
      if (!optionsMap[cat]) optionsMap[cat] = [];
      if (!optionsMap[cat].includes(row.option_name)) {
        optionsMap[cat].push(row.option_name);
      }
      estimatesMap[row.option_name] = Number(row.estimate || 0);
    });

    // Update cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        options: optionsMap,
        estimates: estimatesMap,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Failed to cache customization options:', e);
    }

    return { options: optionsMap, estimates: estimatesMap, source: 'live' };
  } catch (error) {
    console.error('Failed to fetch customization options:', error);

    // Try to use cached options
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { options, estimates, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('Using cached customization options');
          return { options, estimates, source: 'cache' };
        }
      }
    } catch (e) {
      console.warn('Failed to read cache:', e);
    }

    // Final fallback to defaults
    console.log('Using default customization options as final fallback');
    return { options: DEFAULT_OPTIONS, estimates: DEFAULT_ESTIMATES, source: 'hardcoded' };
  }
}

export function getCachedCustomization() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { options, estimates, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return { options, estimates };
      }
    }
  } catch (e) {
    console.warn('Failed to read cache:', e);
  }
  return null;
}

