export default function AccountPopover({ adminData, selectNav, setActiveTabs }) {
  return (
    <>
      <small>Signed in</small>
      <strong>{adminData.settings.adminName || 'Administrator'}</strong>
      <p>{adminData.settings.adminEmail} · Full access to catalogue, operations, content and hiring controls.</p>
      <button className="admin-foundation__profile-action" onClick={() => { selectNav('Settings'); setActiveTabs(current => ({ ...current, Settings: 'Team' })); }}>Profile settings</button>
      <button className="admin-foundation__profile-action" onClick={() => { selectNav('Settings'); setActiveTabs(current => ({ ...current, Settings: 'Security' })); }}>Change password</button>
      <button className="admin-foundation__profile-action is-logout" onClick={() => window.location.assign('/')}>Log out</button>
    </>
  );
}
