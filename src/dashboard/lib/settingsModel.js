// src/lib/settingsModel.js — Ported verbatim from admin-monolith.html appSettings logic

export const DEFAULT_SETTINGS = {
  store: {
    name: 'The Gifting Factory by Flower Girl',
    phone: '+233 20 241 7072',
    email: 'hello@yourstore.com',
    address: 'ACP Estate Junction, Kwabenya, Accra',
    instagramUrl: 'https://www.instagram.com/thegiftingfactory/'
  },
  delivery: {
    sameday: { enabled: true, fee: 120 },
    scheduled: { enabled: true, fee: 90 },
    surprise: { enabled: true, fee: 140 },
    collection: { enabled: true, fee: 0 }
  },
  inventory: {
    lowStockThreshold: 3,
    lowStockAlerts: true
  },
  notifications: {
    newOrders: true,
    newRequests: true,
    newJobApps: true,
    lowStock: true
  },
  security: {
    requirePasswordDestructive: true
  }
};

export function getAppSettings() {
  try {
    const raw = localStorage.getItem('app_settings_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        store: { ...DEFAULT_SETTINGS.store, ...parsed.store },
        delivery: {
          sameday: { ...DEFAULT_SETTINGS.delivery.sameday, ...parsed.delivery?.sameday },
          scheduled: { ...DEFAULT_SETTINGS.delivery.scheduled, ...parsed.delivery?.scheduled },
          surprise: { ...DEFAULT_SETTINGS.delivery.surprise, ...parsed.delivery?.surprise },
          collection: { ...DEFAULT_SETTINGS.delivery.collection, ...parsed.delivery?.collection }
        },
        inventory: { ...DEFAULT_SETTINGS.inventory, ...parsed.inventory },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
        security: { ...DEFAULT_SETTINGS.security, ...parsed.security }
      };
    }
  } catch (e) {
    console.warn('Error reading app settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveAppSettings(newSettings) {
  try {
    localStorage.setItem('app_settings_v1', JSON.stringify(newSettings));
    if (newSettings.store && newSettings.store.instagramUrl) {
      localStorage.setItem('xa12-instagram-url-v1', newSettings.store.instagramUrl);
    }
  } catch (e) {
    console.warn('Error saving app settings to localStorage:', e);
  }
}
