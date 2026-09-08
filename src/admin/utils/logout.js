import { supabase } from '../../config/supabase';

export async function logoutToLogin() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  window.location.replace('/admin');
}
