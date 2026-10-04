import { supabase } from '../../config/supabase';

/**
 * Record sign-in event for current user:
 * 1. Insert row into public.signin_log with user_id, signed_in_at, user_agent.
 * 2. Store inserted row id in sessionStorage ('current_signin_log_id').
 * 3. Delete signin_log rows for this user older than 30 days.
 */
export async function recordSignIn(userId) {
  if (!supabase || !userId) return null;
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('signin_log')
      .insert({
        user_id: userId,
        signed_in_at: nowIso,
        user_agent: userAgent
      })
      .select('id')
      .single();

    if (error) {
      console.error('[signin_log] Failed to insert signin_log row:', error.message || error);
    } else if (data?.id) {
      try {
        sessionStorage.setItem('current_signin_log_id', data.id);
      } catch (e) {
        console.warn('[signin_log] sessionStorage write failed:', e);
      }
    }

    // Purge rows older than 30 days for this admin user
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: purgeErr } = await supabase
      .from('signin_log')
      .delete()
      .eq('user_id', userId)
      .lt('signed_in_at', thirtyDaysAgo);

    if (purgeErr) {
      console.error('[signin_log] Failed to purge logs older than 30 days:', purgeErr.message || purgeErr);
    }

    return data?.id || null;
  } catch (err) {
    console.error('[signin_log] Record sign-in unexpected error:', err);
    return null;
  }
}

/**
 * Record sign-out event for current user:
 * 1. Read stored log ID from sessionStorage.
 * 2. If present, update signed_out_at timestamp on that row.
 * 3. If log ID is missing, update the newest row for this user where signed_out_at is null.
 * 4. Remove stored log ID from sessionStorage.
 */
export async function recordSignOut(userId) {
  if (!supabase || !userId) return;
  try {
    const nowIso = new Date().toISOString();
    let logId = null;
    try {
      logId = sessionStorage.getItem('current_signin_log_id');
    } catch {}

    if (logId) {
      const { error } = await supabase
        .from('signin_log')
        .update({ signed_out_at: nowIso })
        .eq('id', logId);

      if (error) {
        console.error('[signin_log] Failed to update sign-out timestamp by ID:', error.message || error);
      }
    } else {
      // Fallback: update newest row where signed_out_at is null
      const { data, error: selectErr } = await supabase
        .from('signin_log')
        .select('id')
        .eq('user_id', userId)
        .is('signed_out_at', null)
        .order('signed_in_at', { ascending: false })
        .limit(1);

      if (selectErr) {
        console.error('[signin_log] Failed to find active session row for sign-out:', selectErr.message || selectErr);
      } else if (data && data.length > 0) {
        const activeRowId = data[0].id;
        const { error: updateErr } = await supabase
          .from('signin_log')
          .update({ signed_out_at: nowIso })
          .eq('id', activeRowId);

        if (updateErr) {
          console.error('[signin_log] Failed to update active session sign-out:', updateErr.message || updateErr);
        }
      }
    }
  } catch (err) {
    console.error('[signin_log] Record sign-out unexpected error:', err);
  } finally {
    try {
      sessionStorage.removeItem('current_signin_log_id');
    } catch {}
  }
}

/**
 * Fetch latest 10 sign-in activity rows for the current admin user.
 */
export async function fetchSignInLogs(userId) {
  if (!supabase || !userId) return { data: [], error: 'Supabase client or user ID unavailable' };
  try {
    const { data, error } = await supabase
      .from('signin_log')
      .select('id, user_id, signed_in_at, signed_out_at, user_agent')
      .eq('user_id', userId)
      .order('signed_in_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[signin_log] Fetch error:', error.message || error);
      return { data: null, error: error.message || 'Database error fetching sign-in activity' };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[signin_log] Fetch unexpected error:', err);
    return { data: null, error: err.message || 'Unexpected error fetching sign-in activity' };
  }
}
