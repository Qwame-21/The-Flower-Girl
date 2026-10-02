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

  const { data, error } = await supabase
    .from('site_settings')
    .update({
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
      require_password_destructive: settingsData.require_password_destructive
    })
    .eq('id', 'global')
    .select()
    .single();

  if (error) {
    console.error('Error updating site settings:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
