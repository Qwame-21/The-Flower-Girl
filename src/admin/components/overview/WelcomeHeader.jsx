import { Calendar, ShieldCheck, Wifi } from 'lucide-react';

const formatDate = value =>
  new Date(value).toLocaleDateString('en-GH', {
    timeZone: 'Africa/Accra',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function WelcomeHeader({ staffIdentity, activeTab, dataStatus, ordersSource, now }) {
  const staffName = staffIdentity?.full_name || staffIdentity?.email?.split('@')[0] || 'Flower Girl';
  const roleName = staffIdentity?.role || 'Store Administrator';

  const getHeadingText = () => {
    if (activeTab === 'This week') return 'A little perspective.';
    if (activeTab === 'Activity') return 'The latest from the factory.';
    return `Welcome back, ${staffName}.`;
  };

  const getSubtext = () => {
    if (activeTab === 'This week') return 'Seven days of gifting, with the work ahead in clear view.';
    if (activeTab === 'Activity') return 'Chronological audit of store operations and customer briefs.';
    return 'Your daily operational edit — orders, fulfillment, revenue, and custom briefs.';
  };

  return (
    <header className="ov-sui-header">
      <div className="ov-sui-header-main">
        <div className="ov-sui-eyebrow-wrap">
          <span className="ov-sui-tag">STAFF WORKSPACE // 01</span>
          <span className="ov-sui-bullet">•</span>
          <span className="ov-sui-role">{roleName.toUpperCase()}</span>
        </div>

        <h1 className="ov-sui-title">{getHeadingText()}</h1>
        <p className="ov-sui-subtitle">{getSubtext()}</p>

        <div className="ov-sui-meta">
          <span className="ov-sui-date">
            <Calendar size={14} />
            {formatDate(now).toUpperCase()} · ACCRA
          </span>
        </div>
      </div>

      <div className="ov-sui-header-side">
        <div className="ov-sui-connection-card">
          <div className="ov-sui-status-badge">
            <span className={`ov-sui-dot ${dataStatus === 'error' ? 'is-offline' : 'is-online'}`} />
            <span>
              {dataStatus === 'error'
                ? 'Offline Mode'
                : ordersSource === 'supabase'
                ? 'Shared Supabase Gateway'
                : 'Local Environment'}
            </span>
          </div>
          <small className="ov-sui-status-note">
            {dataStatus === 'error'
              ? 'Could not sync shared orders. Local cache active.'
              : 'Live 20s HTTP polling active.'}
          </small>
        </div>
      </div>
    </header>
  );
}
