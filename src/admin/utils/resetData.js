import { readAdminData, writeAdminData } from '../api/adminStore.js';

export function clearedLocalData(current) {
  return { ...current, orders: [], requests: [], applications: [], products: [], collections: [], promotions: [], reviews: [], careers: [], content: Object.fromEntries(Object.keys(current.content || {}).map(key => [key, ''])) };
}
export function clearLocalBusinessData() {
  const current = readAdminData();
  // If backup storage fails, abort before changing any records.
  window.localStorage.setItem(`gifting-factory-reset-backup-${Date.now()}`, JSON.stringify(current));
  writeAdminData(clearedLocalData(current));
  for (const key of ['gifting-factory-cart', 'gifting-factory-wishlist']) window.localStorage.setItem(key, '[]');
}
export async function clearDatabaseBusinessData(client) {
  if (!client) throw new Error('Supabase is not configured.');
  const { error } = await client.rpc('reset_business_data', { confirmation: 'DELETE DATABASE DATA' });
  if (error) {
    if (error.code === 'PGRST202') throw new Error('Database reset is not installed yet. Apply the reset_business_data migration in Supabase first. No records were deleted.');
    throw new Error('Database reset failed. Check owner access and database configuration before retrying.');
  }
}
