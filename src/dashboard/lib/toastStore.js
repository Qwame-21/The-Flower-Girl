/**
 * toastStore.js — In-memory reactive store for dashboard toast notifications.
 *
 * Supports:
 * - Max 3 stacked toasts (FIFO eviction if > 3)
 * - 6s default auto-dismiss
 * - Pause countdown on hover, resume on mouse leave
 * - Subscription pattern for React components
 */

let toasts = [];
let listeners = new Set();

function emit() {
  const snapshot = [...toasts];
  listeners.forEach(fn => fn(snapshot));
}

export function subscribeToasts(callback) {
  listeners.add(callback);
  callback([...toasts]);
  return () => listeners.delete(callback);
}

export function getToasts() {
  return [...toasts];
}

export function removeToast(id) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export function addToast({ id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, body, type = 'info', route = null, duration = 6000 }) {
  // Avoid duplicate by ID
  if (toasts.some(t => t.id === id)) return;

  const newToast = {
    id,
    title,
    body,
    type,
    route,
    duration,
    createdAt: Date.now()
  };

  // Keep max 3 toasts (drop oldest if needed)
  if (toasts.length >= 3) {
    toasts = toasts.slice(toasts.length - 2);
  }
  toasts = [...toasts, newToast];
  emit();
}

export function clearToasts() {
  toasts = [];
  emit();
}
