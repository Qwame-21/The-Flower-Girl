import { Bell, ChevronDown, CircleHelp, Menu, UserRound, X } from 'lucide-react';
import HelpPopover from './HelpPopover';
import NotificationsPopover from './NotificationsPopover';
import AccountPopover from './AccountPopover';

export default function AdminTopbar({
  activeNav,
  setMobileOpen,
  utilityPanel,
  toggleUtility,
  setUtilityPanel,
  notificationCount,
  notificationSound,
  setNotificationSound,
  notifications,
  readNotificationIds,
  markNotificationsRead,
  openOrder,
  selectNav,
  setSelectedItem,
  adminData,
  setActiveTabs,
}) {
  return (
    <header className="admin-foundation__topbar">
      <div className="admin-foundation__title">
        <button className="admin-foundation__menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Menu size={19} />
        </button>
        <h1>{activeNav}</h1>
      </div>
      <div className="admin-foundation__utilities">
        <button
          className={utilityPanel === 'help' ? 'is-active' : ''}
          aria-label="Help"
          aria-expanded={utilityPanel === 'help'}
          onClick={() => toggleUtility('help')}
        >
          <CircleHelp size={18} strokeWidth={1.6} />
        </button>
        <button
          className={utilityPanel === 'notifications' ? 'is-active admin-notification-button' : 'admin-notification-button'}
          aria-label="Notifications"
          aria-expanded={utilityPanel === 'notifications'}
          onClick={() => toggleUtility('notifications')}
        >
          <Bell size={18} strokeWidth={1.6} />
          {notificationCount > 0 && <b>{notificationCount}</b>}
        </button>
        <button
          className={`admin-foundation__account ${utilityPanel === 'account' ? 'is-active' : ''}`}
          aria-label="Account menu"
          aria-expanded={utilityPanel === 'account'}
          onClick={() => toggleUtility('account')}
        >
          <span>
            <UserRound size={17} strokeWidth={1.6} />
          </span>
          <strong>{adminData.settings.adminName || 'Admin'}</strong>
          <ChevronDown size={15} />
        </button>
      </div>
      {utilityPanel && (
        <aside className={`admin-foundation__popover is-${utilityPanel}`} aria-live="polite">
          <button className="admin-foundation__popover-close" onClick={() => setUtilityPanel(null)} aria-label="Close panel">
            <X size={14} />
          </button>
          {utilityPanel === 'help' && <HelpPopover selectNav={selectNav} />}
          {utilityPanel === 'notifications' && (
            <NotificationsPopover
              notificationCount={notificationCount}
              notificationSound={notificationSound}
              setNotificationSound={setNotificationSound}
              notifications={notifications}
              readNotificationIds={readNotificationIds}
              markNotificationsRead={markNotificationsRead}
              openOrder={openOrder}
              selectNav={selectNav}
              setSelectedItem={setSelectedItem}
            />
          )}
          {utilityPanel === 'account' && (
            <AccountPopover adminData={adminData} selectNav={selectNav} setActiveTabs={setActiveTabs} />
          )}
        </aside>
      )}
    </header>
  );
}
