import { UserRound } from 'lucide-react';
import { readAdminData, writeAdminData } from '../api/adminStore';

export default function SettingsPage({
  activeTab,
  adminData,
  settingsMessage,
  setSettingsMessage,
}) {
  const saveSetting = (key, value) =>
    writeAdminData({
      ...readAdminData(),
      settings: { ...readAdminData().settings, [key]: value },
    });

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = form.get('newPassword');
    const confirm = form.get('confirmPassword');
    setSettingsMessage(
      next.length < 8
        ? 'Password must contain at least 8 characters.'
        : next !== confirm
        ? 'The new passwords do not match.'
        : 'Password validation passed. Connect authentication before enabling password changes.'
    );
  };

  return (
    <>
      <header className="admin-page-heading">
        <div>
          <small>Administration · {activeTab}</small>
          <h2>Settings</h2>
          <p>Manage the administrator profile, account security and store preferences.</p>
        </div>
      </header>
      <div className="settings-workspace">
        {activeTab === 'Store' && (
          <>
            <section>
              <small>Store profile</small>
              <h3>Customer-facing information</h3>
              <label>
                Business name
                <input
                  defaultValue={adminData.settings.businessName}
                  onBlur={event => saveSetting('businessName', event.target.value)}
                />
              </label>
              <label>
                Support phone
                <input
                  defaultValue={adminData.settings.supportPhone}
                  onBlur={event => saveSetting('supportPhone', event.target.value)}
                />
              </label>
              <label>
                Support email
                <input
                  type="email"
                  defaultValue={adminData.settings.supportEmail}
                  onBlur={event => saveSetting('supportEmail', event.target.value)}
                />
              </label>
              <button
                onClick={() =>
                  setSettingsMessage('Store information is saved in this browser preview.')
                }
              >
                Confirm store details
              </button>
            </section>
            <section>
              <small>Operations</small>
              <h3>Delivery defaults</h3>
              <label>
                Dispatch city
                <input
                  defaultValue={adminData.settings.dispatchCity}
                  onBlur={event => saveSetting('dispatchCity', event.target.value)}
                />
              </label>
              <label>
                Standard lead time
                <input
                  defaultValue={adminData.settings.leadTime}
                  onBlur={event => saveSetting('leadTime', event.target.value)}
                />
              </label>
              <label>
                Customer delivery note
                <textarea
                  defaultValue={adminData.settings.deliveryNote}
                  onBlur={event => saveSetting('deliveryNote', event.target.value)}
                />
              </label>
              <button
                onClick={() =>
                  setSettingsMessage('Delivery defaults are saved in this browser preview.')
                }
              >
                Confirm delivery defaults
              </button>
            </section>
          </>
        )}
        {activeTab === 'Team' && (
          <>
            <section>
              <small>Team access</small>
              <h3>Administrator</h3>
              <label>
                Display name
                <input
                  defaultValue={adminData.settings.adminName}
                  onBlur={event => saveSetting('adminName', event.target.value)}
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  defaultValue={adminData.settings.adminEmail}
                  onBlur={event => saveSetting('adminEmail', event.target.value)}
                />
              </label>
              <button
                onClick={() =>
                  setSettingsMessage(
                    'Administrator profile is saved in this browser preview.'
                  )
                }
              >
                Confirm profile
              </button>
            </section>
            <section>
              <small>Roles and permissions</small>
              <h3>Current access</h3>
              <div className="team-role">
                <UserRound size={18} />
                <span>
                  <strong>{adminData.settings.adminName}</strong>
                  <small>Full catalogue, orders, content and hiring access</small>
                </span>
                <b>Owner</b>
              </div>
              <p>
                Additional team accounts require an authentication service before
                invitations can be sent safely.
              </p>
            </section>
          </>
        )}
        {activeTab === 'Security' && (
          <>
            <form onSubmit={handlePasswordSubmit}>
              <small>Security</small>
              <h3>Change password</h3>
              <label>
                Current password
                <input name="currentPassword" type="password" required />
              </label>
              <label>
                New password
                <input name="newPassword" type="password" minLength="8" required />
              </label>
              <label>
                Confirm new password
                <input name="confirmPassword" type="password" minLength="8" required />
              </label>
              <button type="submit">Validate password change</button>
            </form>
            <section>
              <small>Session</small>
              <h3>Account protection</h3>
              <p>
                This preview stores operational records in this browser. Production login,
                session revocation and password changes require the authentication
                backend.
              </p>
              <button onClick={() => window.location.assign('/')}>
                Sign out of preview
              </button>
            </section>
          </>
        )}
        {settingsMessage && <p className="settings-message">{settingsMessage}</p>}
      </div>
    </>
  );
}
