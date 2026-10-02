export async function getStaffIdentity(client, session) {
  if (!session?.user?.id) return null;
  const { data, error } = await client
    .from('staff_profiles')
    .select('user_id,display_name,role,active')
    .eq('user_id', session.user.id)
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;

  // No row found — user exists in Auth but not in staff_profiles
  if (!data) {
    const denied = new Error(
      'This account does not have active staff access. Contact the store owner.'
    );
    denied.code = 'STAFF_ACCESS_REQUIRED';
    throw denied;
  }

  // Row found but doesn't belong to this user (shouldn't happen but guard anyway)
  if (data.user_id !== session.user.id) {
    const denied = new Error(
      'Staff profile mismatch. Please sign out and try again.'
    );
    denied.code = 'STAFF_ACCESS_REQUIRED';
    throw denied;
  }

  return { profile: data, email: session.user.email };
}
