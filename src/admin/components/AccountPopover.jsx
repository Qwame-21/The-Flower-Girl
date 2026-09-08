import { useState } from 'react';
import { UserRound, LockKeyhole, LogOut } from 'lucide-react';
import { logoutToLogin } from '../utils/logout';

export default function AccountPopover({ staffIdentity, selectNav, setActiveTabs, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = staffIdentity?.profile.display_name || staffIdentity?.email || 'Staff';
  const role = { owner: 'Owner', admin: 'Administrator', staff: 'Staff' }[staffIdentity?.profile.role] || 'Staff';
  const navigate = tab => {
    selectNav('Settings');
    setActiveTabs(current => ({ ...current, Settings: tab }));
    onClose();
  };
  const logout = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await logoutToLogin(); }
    catch { setError('Could not log out. Please try again.'); setBusy(false); }
  };
  return <section className="admin-account" aria-label="Your account" aria-busy={busy}>
    <p className="admin-account-eyebrow">YOUR WORKSPACE</p>
    <div className="admin-account-identity"><span className="admin-account-avatar" aria-hidden="true">{name.trim().slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{role}</small></div></div>
    <p className="admin-account-email">{staffIdentity?.email}</p>
    <p className="admin-account-session"><LockKeyhole size={13} />Authenticated staff account</p>
    <div className="admin-account-actions">
      <button disabled={busy} onClick={() => navigate('Team')}><UserRound size={18} /><span><strong>Profile settings</strong><small>Your workspace preferences</small></span></button>
      <button disabled={busy} onClick={() => navigate('Security')}><LockKeyhole size={18} /><span><strong>Security settings</strong><small>Account and access details</small></span></button>
      <button className="is-logout" disabled={busy} onClick={logout}><LogOut size={18} /><span>{busy ? 'Logging out…' : 'Log out'}</span></button>
    </div>
    {error && <p className="admin-account-error" role="alert">{error}</p>}
  </section>;
}
