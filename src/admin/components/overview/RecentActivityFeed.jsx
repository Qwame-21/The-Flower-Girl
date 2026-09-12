import { Activity } from 'lucide-react';
import { ORDER_LABELS } from '../../utils/adminMappers';

const formatDate = value =>
  new Date(value).toLocaleDateString('en-GH', {
    timeZone: 'Africa/Accra',
    day: 'numeric',
    month: 'short',
  });

const formatTime = value =>
  new Date(value).toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Accra',
  });

export default function RecentActivityFeed({ activities = [], filter, onFilterChange, onInspect }) {
  return (
    <section className="ov-sui-activity-section" aria-label="Recent store activity">
      <header className="ov-sui-section-header">
        <div>
          <span className="ov-sui-tag">AUDIT LOG // 03</span>
          <h2 className="ov-sui-section-title">Recent Activity Feed</h2>
        </div>

        <div className="ov-sui-filter-pills">
          {['All', 'Order', 'Request', 'Application'].map(kind => (
            <button
              key={kind}
              className={`ov-sui-filter-btn ${filter === kind ? 'is-active' : ''}`}
              onClick={() => onFilterChange(kind)}
            >
              {kind === 'All' ? 'All Updates' : `${kind}s`}
            </button>
          ))}
        </div>
      </header>

      {activities.length ? (
        <div className="ov-sui-activity-list">
          {activities.slice(0, 10).map(item => (
            <button
              key={item.id}
              className="ov-sui-activity-row"
              onClick={() => onInspect(item.title, [item.record])}
            >
              <div className="ov-sui-act-icon">
                <Activity size={16} />
              </div>

              <div className="ov-sui-act-info">
                <strong className="ov-sui-act-title">{item.title}</strong>
                <span className="ov-sui-act-detail">{item.detail}</span>
              </div>

              <span className={`ov-sui-status-tag ov-sui-status-tag--${(item.status || 'default').toLowerCase()}`}>
                {ORDER_LABELS[item.status] || item.status || item.kind}
              </span>

              <time className="ov-sui-act-time">
                {formatDate(item.time)} · {formatTime(item.time)}
              </time>
            </button>
          ))}
        </div>
      ) : (
        <div className="ov-sui-empty-feed">
          <Activity size={24} />
          <span>No recorded activity in this category.</span>
        </div>
      )}
    </section>
  );
}
