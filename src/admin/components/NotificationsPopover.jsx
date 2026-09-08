import { Bell, Volume2, VolumeX, CheckCheck } from 'lucide-react';

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
      <div className="admin-notification-actions"><button
        className="admin-notification-sound"
        role="switch"
        aria-label="Notification sound"
        aria-checked={notificationSound}
        onClick={() =>
          setNotificationSound(current => {
            const next = !current;
            window.localStorage.setItem('gifting-factory-notification-sound', next ? 'on' : 'off');
            return next;
          })
        }
      >
        {notificationSound ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound {notificationSound ? 'on' : 'off'}<span className="admin-sound-track" aria-hidden="true"><i /></span>
      </button>
      {notificationCount > 0 && (
        <button
          className="admin-notification-clear"
          onClick={() => markNotificationsRead(notifications.map(item => item.id))}
        >
          <CheckCheck size={16} /> Clear notifications
        </button>
      )}
      </div>
      {!notificationCount && <div className="admin-notification-empty"><Bell size={24} /><p>No unread notifications. New store activity will appear here.</p></div>}
      <div className="admin-notification-list">
        {notifications.filter(item => !readNotificationIds.includes(item.id)).map(item => (
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
