import { supabase } from '../../config/supabase';
import { recordSignOut } from '../../dashboard/lib/signinLog';

export async function logoutToLogin(reasonNotice = '') {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        await recordSignOut(data.user.id);
      }
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

