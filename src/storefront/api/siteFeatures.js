import { supabase } from '../../config/supabase';

const SETTINGS_CACHE_KEY = 'flowergirl-site-settings-v1';
const CACHE_DURATION = 30 * 1000; // 30 seconds

/**
 * Load site settings with fallback defaults
 * Reads safely - returns defaults if Supabase is unavailable or columns are missing
 */
export async function getSiteSettings() {
  // Check cache first
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch {
    // Cache read failed, continue to fetch from Supabase
  }

  // Default settings (matches current behavior when settings are missing)
  const defaults = {
    delivery_selector_enabled: false,
    tracking_auto_refresh_enabled: false,
    tracking_refresh_interval_seconds: 10,
    track_max_failed_attempts: 10,
    track_lockout_minutes: 15,
    delivery_sameday_enabled: true,
    delivery_sameday_fee: 120,
    delivery_scheduled_enabled: true,
    delivery_scheduled_fee: 90,
    delivery_surprise_enabled: true,
    delivery_surprise_fee: 140,
    delivery_collection_enabled: true,
    delivery_collection_fee: 0,
    about_page: '',
    delivery_page: '',
    policy_page: '',
    support_phone: '+233 202 417 072',
  };

  if (!supabase) {
    return defaults;
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error || !data) {
      return defaults;
    }

    // Merge with defaults, preserving any new columns that exist
    const settings = { ...defaults };

    for (const key in data) {
      if (key in settings) {
        settings[key] = data[key];
      }
    }

    // Load page content from site_content table
    try {
      const { data: contentData } = await supabase
        .from('site_content')
        .select('key, value')
        .in('key', ['about_page', 'delivery_page', 'policy_page']);

      if (contentData) {
        contentData.forEach(row => {
          if (row.key === 'about_page') settings.about_page = row.value || '';
          if (row.key === 'delivery_page') settings.delivery_page = row.value || '';
          if (row.key === 'policy_page') settings.policy_page = row.value || '';
        });
      }
    } catch {
      // If site_content read fails, keep defaults
    }

    // Cache the result
    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
        data: settings,
        timestamp: Date.now(),
      }));
    } catch {
      // Cache write failed, return settings anyway
    }

    return settings;
  } catch {
    return defaults;
  }
}

/**
 * Bypass cache and force refresh
 */
export async function refreshSiteSettings() {
  const SETTINGS_CACHE_KEY = 'flowergirl-site-settings-v1';
  
  try {
    localStorage.removeItem(SETTINGS_CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
  
  return getSiteSettings();
}

/**
 * Refetch settings when window regains focus
 */
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    refreshSiteSettings();
  });
}
