const INIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-init`;
const VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-verify`;

const ERROR_MESSAGES = {
  OUT_OF_STOCK: (msg) => msg || 'This item is out of stock. Please remove it from your order.',
  PRODUCT_UNAVAILABLE: (msg) => msg || 'This item is no longer available. Please refresh the shop.',
  INVALID_DELIVERY_TYPE: () => 'Invalid delivery type selected.',
  DELIVERY_UNAVAILABLE: (msg) => msg || 'That delivery option is not available right now.',
  INVALID_DATE: (msg) => msg || 'Please choose a valid delivery date (today or in the future).',
  MISSING_FIELD: (msg) => msg || 'Please fill in all required fields.',
  INVALID_EMAIL: () => 'Please enter a valid email address.',
  CALLBACK_NOT_ALLOWED: () => 'Payment callback URL is not allowed.',
  PAYMENT_NOT_CONFIGURED: () => 'Payment is temporarily unavailable. Please try again shortly or contact us.',
  PAYMENT_PROVIDER_ERROR: () => 'Payment is temporarily unavailable. Please try again shortly or contact us.',
  INTERNAL: () => 'Something went wrong. Please try again.',
  CART_EMPTY: () => 'Your cart is empty.',
};

export function getErrorMessage(error) {
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code](error.message);
  }
  return error?.message || 'Payment initialisation failed. Please try again.';
}

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

export function verifyCheckoutPayment(reference) {
  return fetch(VERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`,
    },
    body: JSON.stringify({ reference }),
  });
}

