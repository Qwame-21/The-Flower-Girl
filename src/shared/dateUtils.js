/**
 * dateUtils.js — timezone-safe date helpers for Flower Girl / The Gifting Factory
 *
 * All calendar dates in this project are plain YYYY-MM-DD strings.
 * The business is in Ghana (Africa/Accra, UTC+0, no daylight saving).
 *
 * ROOT CAUSE of the off-by-one bug:
 *   `new Date("2026-10-13")` parses as midnight UTC. When displayed in a
 *   browser behind UTC (e.g. US Central, UTC-5) it becomes Oct 12 22:00 local
 *   time, so .getDate() / .toLocaleDateString() returns 12 instead of 13.
 *
 * Fix: always parse YYYY-MM-DD by splitting the string into year/month/day
 * components and constructing a LOCAL Date(y, m-1, d) — which is timezone-
 * independent for calendar-date display.  Never use new Date("YYYY-MM-DD").
 */

/**
 * Parse a "YYYY-MM-DD" string into a local Date object (no timezone shift).
 * Safe to call on undefined / null — returns null.
 */
export function parseDateString(str) {
  if (!str) return null;
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}

/**
 * Format a local Date (or a "YYYY-MM-DD" string) for display.
 * Output: "Tue, 13 Oct 2026" or "Tue, 13 Oct" if includeYear is false.
 */
export function formatDateDisplay(dateOrStr, includeYear = true) {
  const d = typeof dateOrStr === 'string' ? parseDateString(dateOrStr) : dateOrStr;
  if (!d || isNaN(d.getTime())) return String(dateOrStr ?? '');
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  if (!includeYear) {
    return `${weekday}, ${day} ${month}`;
  }
  return `${weekday}, ${day} ${month} ${d.getFullYear()}`;
}

/**
 * Format a delivery window string (e.g. 'afternoon') into short hours '12–4pm'.
 */
export function formatDeliveryWindowShort(win) {
  if (!win) return '';
  const lower = String(win).toLowerCase().trim();
  if (lower === 'morning') return '9am–12pm';
  if (lower === 'afternoon') return '12–4pm';
  if (lower === 'evening') return '4–7pm';
  if (lower === 'custom') return 'Custom time';
  return win;
}

/**
 * Format a delivery window string into full label 'Afternoon · 12–4pm'.
 */
export function formatDeliveryWindowFull(win) {
  if (!win) return '';
  const lower = String(win).toLowerCase().trim();
  if (lower === 'morning') return 'Morning · 9am–12pm';
  if (lower === 'afternoon') return 'Afternoon · 12–4pm';
  if (lower === 'evening') return 'Evening · 4–7pm';
  if (lower === 'custom') return 'Custom time';
  return win;
}

/**
 * Build the collapsed row delivery subtitle.
 * Example: " · Delivery Wed, 14 Oct · 12–4pm"
 */
export function getDeliverySubtitle(order) {
  if (!order || !order.estimatedDelivery) {
    return ' · Delivery not confirmed';
  }
  const match = String(order.estimatedDelivery).match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return ' · Delivery not confirmed';
  const dateStr = formatDateDisplay(match[1], false);
  const win = formatDeliveryWindowShort(order.deliveryWindow);
  const winPart = win ? ` · ${win}` : '';
  return ` · Delivery ${dateStr}${winPart}`;
}

/**
 * Format a local Date as "YYYY-MM-DD" (for storing / comparing).
 */
export function formatDateISO(d) {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Return today's calendar date in Africa/Accra as a "YYYY-MM-DD" string.
 * Uses Intl so it works correctly regardless of the viewer's browser timezone.
 */
export function todayAccra() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Accra' }).formatToParts(now);
  // en-CA locale gives YYYY-MM-DD order
  const y = parts.find(p => p.type === 'year')?.value ?? '';
  const mo = parts.find(p => p.type === 'month')?.value ?? '';
  const d = parts.find(p => p.type === 'day')?.value ?? '';
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Convert a UTC ISO timestamp (e.g. order.created_at) to the Africa/Accra
 * calendar date as a "YYYY-MM-DD" string.
 */
export function timestampToAccraDate(isoTimestamp) {
  if (!isoTimestamp) return null;
  const d = new Date(isoTimestamp);
  if (isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Accra' }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value ?? '';
  const mo = parts.find(p => p.type === 'month')?.value ?? '';
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  return `${y}-${mo.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Compare two "YYYY-MM-DD" strings lexicographically.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareDates(a, b) {
  return String(a).localeCompare(String(b));
}

/**
 * Return an array of "YYYY-MM-DD" strings from startDate (inclusive) for
 * `count` consecutive days.  startDate is a "YYYY-MM-DD" string.
 */
export function dateRange(startDateStr, count) {
  const start = parseDateString(startDateStr);
  if (!start) return [];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return formatDateISO(d);
  });
}
