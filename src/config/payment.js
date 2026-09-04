export const PAYMENT_CONFIG = Object.freeze({
  provider: 'paystack',
  currency: 'GHS',
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  initializeEndpoint: import.meta.env.VITE_PAYMENT_INITIALIZE_ENDPOINT || '/api/payments/initialize',
});

export const isPaystackTestConfigured = PAYMENT_CONFIG.publicKey.startsWith('pk_test_') && !PAYMENT_CONFIG.publicKey.includes('replace_me');
