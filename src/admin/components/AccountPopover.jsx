export default function AccountPopover({ adminData, selectNav, setActiveTabs, currentUser, staffProfile, onSignOut }) {
  const displayName = staffProfile?.display_name || currentUser?.email?.split('@')[0] || adminData.settings.adminName || 'Staff Administrator';
  const email = currentUser?.email || adminData.settings.adminEmail || 'admin@thegiftingfactory.com';
  const role = staffProfile?.role || 'owner';

  return (
    <>
      <small>Signed in ({role.toUpperCase()})</small>
      <strong>{displayName}</strong>
      <p>{email} · Full access to catalogue, orders, custom briefs, content and hiring controls.</p>
      <button className="admin-foundation__profile-action" onClick={() => { selectNav('Settings'); setActiveTabs(current => ({ ...current, Settings: 'Team' })); }}>Profile settings</button>
      <button className="admin-foundation__profile-action" onClick={() => { selectNav('Settings'); setActiveTabs(current => ({ ...current, Settings: 'Security' })); }}>Change password</button>
      <button
        className="admin-foundation__profile-action is-logout"
        onClick={() => {
          if (onSignOut) {
            onSignOut();
          } else {
            window.location.assign('/');
          }
        }}
      >
        Sign out
      </button>
    </>
  );
}

