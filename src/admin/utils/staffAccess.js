export async function getStaffIdentity(client, session) {
  if (!session?.user?.id) return null;
  const { data, error } = await client.from('staff_profiles').select('user_id,display_name,role,active').eq('user_id', session.user.id).eq('active', true).maybeSingle();
  if (error) throw error;
  if (!data?.active || data.user_id !== session.user.id) {
    const denied = new Error('This account does not have active staff access. Contact the store owner.');
    denied.code = 'STAFF_ACCESS_REQUIRED';
    throw denied;
  }
  return { profile: data, email: session.user.email };
}
