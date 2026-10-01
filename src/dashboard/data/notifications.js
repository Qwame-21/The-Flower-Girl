import { supabase } from '../../config/supabase';

// List notifications
export async function listNotifications() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data.map(notif => ({
    id: notif.id,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    route: notif.route,
    recordId: notif.record_id,
    readAt: notif.read_at,
    createdAt: notif.created_at
  }));
}

// Mark notification as read
export async function markNotificationRead(notificationId) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }

  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

// Delete a single notification row (optimistic; caller must rollback on false)
export async function deleteNotification(notificationId) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }

  const { error } = await supabase
    .from('admin_notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }

  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

// Clear all notifications (delete if RLS allows, otherwise mark read)
export async function clearAllNotifications() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }

  // Try delete first
  const { error: deleteError } = await supabase
    .from('admin_notifications')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.warn('Delete not allowed by RLS, marking all as read instead:', deleteError.message);
    // Fallback to marking all as read
    return await markAllNotificationsRead();
  }

  return true;
}

// Subscribe to new notifications via realtime.
// Any INSERT received after subscribing is treated as new — no created_at comparison
// (avoids clock skew and format differences). Deduplication by id is caller responsibility.
export function subscribeToNotifications(callback) {
  if (!supabase) {
    console.warn('Supabase not configured, notifications not available');
    return () => {};
  }

  const channel = supabase
    .channel('admin-notifications-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications'
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIPTION_ERROR') {
        console.error('Realtime subscription error for notifications');
      }
    });

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// Poll for notifications (fallback if realtime not available)
export function startNotificationPolling(callback, intervalMs = 30000) {
  if (!supabase) {
    console.warn('Supabase not configured, polling not available');
    return () => {};
  }

  let seenIds = new Set();
  let intervalId = null;

  const poll = async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      data.forEach(notif => {
        if (!seenIds.has(notif.id)) {
          seenIds.add(notif.id);
          callback(notif);
        }
      });
    }
  };

  // Initial poll to seed seenIds
  poll();

  // Start interval
  intervalId = setInterval(poll, intervalMs);

  // Return stop function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}
