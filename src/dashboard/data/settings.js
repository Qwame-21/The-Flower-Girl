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
      business_name: settingsData.businessName,
      support_phone: settingsData.supportPhone,
      support_email: settingsData.supportEmail,
      dispatch_city: settingsData.dispatchCity,
      delivery_note: settingsData.deliveryNote,
      announcement_enabled: settingsData.announcementEnabled
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
