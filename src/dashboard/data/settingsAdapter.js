// Adapter to make HOPESON SettingsPage work with Supabase
// Returns data in the exact shape HOPESON expects and maps cleanly to site_settings table columns

import { getSiteSettings, updateSiteSettings } from './settings';

const SETTINGS_KEY = 'xa12-app-settings-v1';

// Default settings structure matching HOPESON UI
const DEFAULT_SETTINGS = {
  store: {
    name: 'Flower Girl Pro',
    phone: '+233 202 417 072',
    email: 'info@flowergirlpro.com',
    address: 'ACP Estate Junction, Kwabenya, Accra',
    instagramUrl: 'https://www.instagram.com/flowergirl_ghana/',
    deliveryNote: 'Delivery available across Accra. Same-day delivery available when stock and schedule allow.',
  },
  delivery: {
    sameday: { fee: 120, enabled: true },
    scheduled: { fee: 90, enabled: true },
    surprise: { fee: 140, enabled: true },
    collection: { fee: 0, enabled: true },
  },
  inventory: {
    lowStockThreshold: 3,
    lowStockAlerts: true,
  },
  notifications: {
    orders: true,
    requests: true,
    careers: true,
    lowStock: true,
  },
  security: {
    requirePasswordForDestructive: true,
  },
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

  // Transform Supabase site_settings columns to UI shape
  const mapped = {
    store: {
      name: dbSettings.business_name || DEFAULT_SETTINGS.store.name,
      phone: dbSettings.support_phone || DEFAULT_SETTINGS.store.phone,
      email: dbSettings.support_email || DEFAULT_SETTINGS.store.email,
      address: dbSettings.store_address || DEFAULT_SETTINGS.store.address,
      dispatchCity: dbSettings.dispatch_city || 'Accra',
      instagramUrl: dbSettings.instagram_url || DEFAULT_SETTINGS.store.instagramUrl,
      deliveryNote: dbSettings.delivery_note || DEFAULT_SETTINGS.store.deliveryNote,
    },
    delivery: {
      sameday: {
        fee: Number(dbSettings.delivery_sameday_fee ?? DEFAULT_SETTINGS.delivery.sameday.fee),
        enabled: dbSettings.delivery_sameday_enabled !== false,
      },
      scheduled: {
        fee: Number(dbSettings.delivery_scheduled_fee ?? DEFAULT_SETTINGS.delivery.scheduled.fee),
        enabled: dbSettings.delivery_scheduled_enabled !== false,
      },
      surprise: {
        fee: Number(dbSettings.delivery_surprise_fee ?? DEFAULT_SETTINGS.delivery.surprise.fee),
        enabled: dbSettings.delivery_surprise_enabled !== false,
      },
      collection: {
        fee: Number(dbSettings.delivery_collection_fee ?? DEFAULT_SETTINGS.delivery.collection.fee),
        enabled: dbSettings.delivery_collection_enabled !== false,
      },
    },
    inventory: {
      lowStockThreshold: Number(dbSettings.low_stock_threshold ?? DEFAULT_SETTINGS.inventory.lowStockThreshold),
      lowStockAlerts: dbSettings.low_stock_alerts !== false,
    },
    notifications: {
      orders: dbSettings.notifications_new_orders !== false,
      requests: dbSettings.notifications_new_requests !== false,
      careers: dbSettings.notifications_new_careers !== false,
      lowStock: dbSettings.notifications_low_stock !== false,
    },
    security: {
      requirePasswordForDestructive: dbSettings.require_password_destructive !== false,
    },
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(mapped));
  return mapped;
}

// Save to both localStorage and Supabase
export async function persistSettings(settings) {
  // Save to localStorage first (sync)
  saveAppSettings(settings);

  // Transform to exact Supabase site_settings column names
  const dbSettings = {
    business_name: settings.store.name,
    support_phone: settings.store.phone,
    support_email: settings.store.email,
    dispatch_city: settings.store.dispatchCity || settings.store.city || 'Accra',
    store_address: settings.store.address,
    instagram_url: settings.store.instagramUrl,
    delivery_note: settings.store.deliveryNote,

    delivery_sameday_fee: settings.delivery.sameday.fee,
    delivery_sameday_enabled: settings.delivery.sameday.enabled,
    delivery_scheduled_fee: settings.delivery.scheduled.fee,
    delivery_scheduled_enabled: settings.delivery.scheduled.enabled,
    delivery_surprise_fee: settings.delivery.surprise.fee,
    delivery_surprise_enabled: settings.delivery.surprise.enabled,
    delivery_collection_fee: settings.delivery.collection.fee,
    delivery_collection_enabled: settings.delivery.collection.enabled,

    low_stock_threshold: settings.inventory.lowStockThreshold,
    low_stock_alerts: settings.inventory.lowStockAlerts,

    notifications_new_orders: settings.notifications.orders,
    notifications_new_requests: settings.notifications.requests,
    notifications_new_careers: settings.notifications.careers,
    notifications_low_stock: settings.notifications.lowStock,

    require_password_destructive: settings.security.requirePasswordForDestructive,
  };

  const res = await updateSiteSettings(dbSettings);
  return res;
}
