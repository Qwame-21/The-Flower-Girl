import { Bell } from 'lucide-react';

export default function NotificationsPopover({
  notificationCount,
  notificationSound,
  setNotificationSound,
  notifications,
  readNotificationIds,
  markNotificationsRead,
  openOrder,
  selectNav,
  setSelectedItem,
}) {
  return (
    <>
      <small>Notifications</small>
      <strong>{notificationCount ? 'Recent store activity' : 'You’re all caught up'}</strong>
      <button
        className="admin-notification-sound"
        aria-pressed={notificationSound}
        onClick={() =>
          setNotificationSound(current => {
            const next = !current;
            window.localStorage.setItem('gifting-factory-notification-sound', next ? 'on' : 'off');
            return next;
          })
        }
      >
        <Bell size={14} /> Sound {notificationSound ? 'on' : 'off'}
      </button>
      {notificationCount > 0 && (
        <button
          className="admin-notification-clear"
          onClick={() => markNotificationsRead(notifications.map(item => item.id))}
        >
          Clear notifications
        </button>
      )}
      <div className="admin-notification-list">
        {notifications.filter(item => !readNotificationIds.includes(item.id)).slice(0, 8).map(item => (
          <button
            key={item.id}
            onClick={() => {
              markNotificationsRead([item.id]);
              if (item.route === 'Orders') openOrder(item.record.id);
              else if (item.route === 'Requests') {
                selectNav('Requests');
                setSelectedItem({
                  type: 'request',
                  title: item.title,
                  status: item.status,
                  detail: item.record.note || item.status,
                  request: item.record,
                });
              } else if (item.route === 'Careers') {
                selectNav('Careers');
                setSelectedItem({
                  type: 'application',
                  title: item.title,
                  status: item.status,
                  detail: item.record.motivation || item.record.role,
                  application: item.record,
                });
              }
            }}
          >
            <span>{item.type}</span>
            <b>{item.title}</b>
            <em>{item.status}</em>
          </button>
        ))}
      </div>
    </>
  );
}
