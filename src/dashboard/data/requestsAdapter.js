// Adapter to make HOPESON RequestsPage work with Supabase
// Returns data in the exact shape HOPESON expects

import { listRequests } from './requests';

const REQUESTS_KEY = 'xa12_custom_requests';

// Load requests from localStorage cache (sync)
export function loadRequestsData() {
  try {
    const cached = localStorage.getItem(REQUESTS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return [];
}

// Save requests to localStorage
export function saveRequestsData(list) {
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  } catch {}
}

// Sync with Supabase (async)
export async function syncRequestsWithSupabase() {
  const requests = await listRequests();

  // Transform Supabase data to HOPESON shape
  const mapped = requests.map(r => ({
    id: r.id,
    reference: r.reference,
    created_at: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    status: r.status,
    customer_name: r.customer_name,
    phone: r.phone,
    email: r.email,
    request_type: r.request_type,
    service: r.service,
    occasion: r.occasion,
    quantity: r.quantity,
    budget: r.budget,
    preferred_date: r.preferred_date,
    fulfilment: r.fulfilment,
    city: r.city,
    recipient: r.recipient,
    selections: r.selections || [],
    notes: r.notes,
    inspiration_path: r.inspiration_path,
    card_message: r.card_message,
    card_style: r.card_style,
    estimate_low: r.estimate_low,
    estimate_high: r.estimate_high,
    confirmed_quote: r.confirmed_quote,
    admin_note: r.admin_note,
    approved_at: r.approved_at,
    converted_at: r.converted_at
  }));

  localStorage.setItem(REQUESTS_KEY, JSON.stringify(mapped));
  return mapped;
}
