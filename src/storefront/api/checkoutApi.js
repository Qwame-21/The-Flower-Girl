const INIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-init`;

export function initializeCheckout(payload) {
  return fetch(INIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`,
    },
    body: JSON.stringify(payload),
  });
}
