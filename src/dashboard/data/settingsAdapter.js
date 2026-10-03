// Adapter to make HOPESON SettingsPage work with Supabase
// Returns data in the exact shape HOPESON expects

import { getSiteSettings, updateSiteSettings } from './settings';

const SETTINGS_KEY = 'xa12-app-settings-v1';

// Default settings structure matching HOPESON
const DEFAULT_SETTINGS = {
  store: {
    name: 'Flower Girl Pro',
    phone: '+233 202 417 072',
    email: 'info@flowergirlpro.com',
    address: '',
    instagramUrl: ''
  },
  delivery: {
    sameday: { fee: 50, enabled: true },
    scheduled: { fee: 30, enabled: true },
    surprise: { fee: 40, enabled: true },
    collection: { fee: 0, enabled: true }
  },
  inventory: {
    lowStockThreshold: 5,
    lowStockAlerts: true
  },
  notifications: {
    orders: true,
    requests: true,
    careers: true,
    lowStock: true
  },
  security: {
    requirePasswordForDestructive: false
  }
};

// Load settings from localStorage cache (sync)
export function getAppSettings() {
  try {
    const cached = localStorage.getItem(SETTINGS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
export function saveAppSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

// Sync with Supabase (async)
export async function syncSettingsWithSupabase() {
  const dbSettings = await getSiteSettings();

  if (!dbSettings) {
    return DEFAULT_SETTINGS;
  }

  // Transform Supabase data to HOPESON shape
  const mapped = {
    store: {
      name: dbSettings.business_name || 'Flower Girl Pro',
      phone: dbSettings.support_phone || '+233 202 417 072',
      email: dbSettings.support_email || 'info@flowergirlpro.com',
      address: dbSettings.address || '',
      instagramUrl: dbSettings.instagram_url || ''
    },
    delivery: {
      sameday: { fee: dbSettings.sameday_fee || 50, enabled: dbSettings.sameday_enabled !== false },
      scheduled: { fee: dbSettings.scheduled_fee || 30, enabled: dbSettings.scheduled_enabled !== false },
      surprise: { fee: dbSettings.surprise_fee || 40, enabled: dbSettings.surprise_enabled !== false },
      collection: { fee: dbSettings.collection_fee || 0, enabled: dbSettings.collection_enabled !== false }
    },
    inventory: {
      lowStockThreshold: dbSettings.low_stock_threshold || 5,
      lowStockAlerts: dbSettings.low_stock_alerts !== false
    },
    notifications: {
      orders: dbSettings.notify_orders !== false,
      requests: dbSettings.notify_requests !== false,
      careers: dbSettings.notify_careers !== false,
      lowStock: dbSettings.notify_low_stock !== false
    },
    security: {
      requirePasswordForDestructive: dbSettings.require_password || false
    }
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(mapped));
  return mapped;
}

// Save to both localStorage and Supabase
export async function persistSettings(settings) {
  // Save to localStorage first (sync)
  saveAppSettings(settings);

  // Transform to Supabase shape
  const dbSettings = {
    business_name: settings.store.name,
    support_phone: settings.store.phone,
    support_email: settings.store.email,
    address: settings.store.address,
    instagram_url: settings.store.instagramUrl,
    sameday_fee: settings.delivery.sameday.fee,
    sameday_enabled: settings.delivery.sameday.enabled,
    scheduled_fee: settings.delivery.scheduled.fee,
    scheduled_enabled: settings.delivery.scheduled.enabled,
    surprise_fee: settings.delivery.surprise.fee,
    surprise_enabled: settings.delivery.surprise.enabled,
    collection_fee: settings.delivery.collection.fee,
    collection_enabled: settings.delivery.collection.enabled,
    low_stock_threshold: settings.inventory.lowStockThreshold,
    low_stock_alerts: settings.inventory.lowStockAlerts,
    notify_orders: settings.notifications.orders,
    notify_requests: settings.notifications.requests,
    notify_careers: settings.notifications.careers,
    notify_low_stock: settings.notifications.lowStock,
    require_password: settings.security.requirePasswordForDestructive
  };

  await updateSiteSettings(dbSettings);
}
