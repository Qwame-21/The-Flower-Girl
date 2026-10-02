import { supabase } from '../../config/supabase';

export async function logoutToLogin(reasonNotice = '') {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('signOut error:', e);
    }
  }
  if (reasonNotice && typeof localStorage !== 'undefined') {
    localStorage.setItem('admin_logout_notice', reasonNotice);
  }
  window.location.replace('/admin');
}
