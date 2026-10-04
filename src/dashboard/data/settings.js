import { supabase } from '../../config/supabase';

// Get site settings
export async function getSiteSettings() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data: settings, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }

  return settings;
}

// Update site settings
export async function updateSiteSettings(settingsData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  // First fetch current settings to see which columns exist
  const { data: currentSettings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'global')
    .single();

  // Build update object with only existing columns
  const updateData = {
    business_name: settingsData.business_name,
    support_phone: settingsData.support_phone,
    support_email: settingsData.support_email,
    dispatch_city: settingsData.dispatch_city,
    delivery_note: settingsData.delivery_note,
    announcement_enabled: settingsData.announcement_enabled,
    store_address: settingsData.store_address,
    instagram_url: settingsData.instagram_url,
    delivery_sameday_enabled: settingsData.delivery_sameday_enabled,
    delivery_sameday_fee: settingsData.delivery_sameday_fee,
    delivery_scheduled_enabled: settingsData.delivery_scheduled_enabled,
    delivery_scheduled_fee: settingsData.delivery_scheduled_fee,
    delivery_surprise_enabled: settingsData.delivery_surprise_enabled,
    delivery_surprise_fee: settingsData.delivery_surprise_fee,
    delivery_collection_enabled: settingsData.delivery_collection_enabled,
    delivery_collection_fee: settingsData.delivery_collection_fee,
    low_stock_threshold: settingsData.low_stock_threshold,
    low_stock_alerts: settingsData.low_stock_alerts,
    notifications_new_orders: settingsData.notifications_new_orders,
    notifications_new_requests: settingsData.notifications_new_requests,
    notifications_new_careers: settingsData.notifications_new_careers,
    notifications_low_stock: settingsData.notifications_low_stock,
    require_password_destructive: settingsData.require_password_destructive,
  };

  // Only add new columns if they existed in the loaded row (SQL applied)
  if (currentSettings && 'delivery_selector_enabled' in currentSettings) {
    updateData.delivery_selector_enabled = settingsData.delivery_selector_enabled;
  }
  if (currentSettings && 'tracking_auto_refresh_enabled' in currentSettings) {
    updateData.tracking_auto_refresh_enabled = settingsData.tracking_auto_refresh_enabled;
    updateData.tracking_refresh_interval_seconds = settingsData.tracking_refresh_interval_seconds;
  }
  if (currentSettings && 'track_max_failed_attempts' in currentSettings) {
    updateData.track_max_failed_attempts = settingsData.track_max_failed_attempts;
    updateData.track_lockout_minutes = settingsData.track_lockout_minutes;
  }
  if (currentSettings && 'about_page' in currentSettings) {
    updateData.about_page = settingsData.about_page;
    updateData.delivery_page = settingsData.delivery_page;
    updateData.policy_page = settingsData.policy_page;
  }

  const { data, error } = await supabase
    .from('site_settings')
    .update(updateData)
    .eq('id', 'global')
    .select()
    .single();

  if (error) {
    console.error('Error updating site settings:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
