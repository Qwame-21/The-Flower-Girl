import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Search, X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { buildOverview } from '../utils/overview';
import { ORDER_LABELS } from '../utils/adminMappers';
import '../overview.css';

// Import modular sub-components
import WelcomeHeader from '../components/overview/WelcomeHeader';
import OverviewNavBar from '../components/overview/OverviewNavBar';
import MetricsCards from '../components/overview/MetricsCards';
import OrdersCarousel from '../components/overview/OrdersCarousel';
import RecentActivityFeed from '../components/overview/RecentActivityFeed';
import QuickActions from '../components/overview/QuickActions';
import HeroFloralBanner from '../components/overview/HeroFloralBanner';

const money = val =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

/* ─── Skeleton Loader Component ────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="ov-sui-skeleton-wrap" aria-label="Loading dashboard">
      <div className="ov-sui-sk-header">
        <div className="ov-sui-sk-line" style={{ width: 140, height: 12 }} />
        <div className="ov-sui-sk-line" style={{ width: 340, height: 38, marginTop: 12 }} />
        <div className="ov-sui-sk-line" style={{ width: 260, height: 16, marginTop: 8 }} />
      </div>

      <div className="ov-sui-sk-grid">
        <div className="ov-sui-sk-card" style={{ height: 140 }} />
        <div className="ov-sui-sk-card" style={{ height: 140 }} />
        <div className="ov-sui-sk-card" style={{ height: 140 }} />
        <div className="ov-sui-sk-card" style={{ height: 140 }} />
      </div>

      <div className="ov-sui-sk-card" style={{ height: 220, marginTop: 24 }} />
    </div>
  );
}

export default function OverviewPage({ activeTab = 'Today', adminData = {}, dataStatus = 'ready', staffIdentity }) {
  const [now, setNow] = useState(Date.now);
  const [activeSubTab, setActiveSubTab] = useState(activeTab);
  const [selected, setSelected] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const triggerRef = useRef(null);

  // 20s Polling interval for operational data freshness
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener (⌘K to toggle search, Escape to close)
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSelected(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const data = buildOverview(adminData || {}, activeSubTab, now);
  const searchResults = buildOverview(adminData || {}, 'Activity', now).activities.filter(item =>
    `${item.title} ${item.detail} ${item.record?.phone || ''} ${item.record?.service || ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
  const activities = data.activities.filter(item => filter === 'All' || item.kind === filter);

  const inspect = (title, records) => {
    triggerRef.current = document.activeElement;
    setSelected({ title, records });
  };

  if (dataStatus === 'loading' && !adminData?.orders?.length && !adminData?.requests?.length) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="overview-v2 sui-sawada-theme">
      {/* ─── Sui Sawada Top Navigation Bar ─────────────────────────── */}
      <OverviewNavBar
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        onOpenSearch={() => setSearchOpen(true)}
        pendingCount={data.pending.length}
      />

      {/* ─── Editorial Header & Hero Section ───────────────────────── */}
      <div className="ov-sui-top-row">
        <WelcomeHeader
          staffIdentity={staffIdentity}
          activeTab={activeSubTab}
          dataStatus={dataStatus}
          ordersSource={adminData?.ordersSource}
          now={now}
        />
        <HeroFloralBanner
          totalOrders={data.orders.length}
          revenueFormatted={money(data.revenue)}
        />
      </div>

      {/* ─── Floating Metrics Cards Grid (Indexed 01-04) ───────────── */}
      <MetricsCards
        data={data}
        activeTab={activeSubTab}
        onInspect={inspect}
      />

      {/* ─── Orders Thumbnail Preview Carousel Strip ────────────────── */}
      <OrdersCarousel
        orders={data.orders}
        onInspect={inspect}
      />

      {/* ─── Recent Activity Feed ──────────────────────────────────── */}
      <div className="ov-sui-bottom-row">
        <RecentActivityFeed
          activities={activities}
          filter={filter}
          onFilterChange={setFilter}
          onInspect={inspect}
        />

        <QuickActions
          onInspect={inspect}
          data={data}
        />
      </div>

      {/* ─── Search Overlay Modal (⌘K) ─────────────────────────────── */}
      {searchOpen && (
        <div className="ov-sui-search-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="ov-sui-search-modal" onClick={e => e.stopPropagation()}>
            <div className="ov-sui-search-input-header">
              <Search size={18} />
              <input
                type="search"
                autoFocus
                placeholder="Search orders by customer name, reference, or phone..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button onClick={() => setSearchOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {query.trim() && (
              <div className="ov-sui-search-results">
                {searchResults.length ? (
                  searchResults.map(item => (
                    <button
                      key={item.id}
                      className="ov-sui-search-item"
                      onClick={() => {
                        setSearchOpen(false);
                        inspect(item.title, [item.record]);
                      }}
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.kind} · {item.detail}</small>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                  ))
                ) : (
                  <div className="ov-sui-no-results">
                    <p>No matching orders or briefs found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Record Inspector Portal Drawer ────────────────────────── */}
      {selected &&
        createPortal(
          <div className="ov-inspector-backdrop" onClick={() => setSelected(null)}>
            <section
              className="ov-inspector-panel"
              aria-label={selected.title}
              onClick={e => e.stopPropagation()}
            >
              <header className="ov-inspector-header">
                <button
                  className="ov-inspector-back"
                  autoFocus
                  onClick={() => setSelected(null)}
                  aria-label="Back"
                >
                  <ArrowLeft size={16} />
                </button>
                <h3>{selected.title}</h3>
                <button
                  className="ov-inspector-close"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="ov-inspector-body">
                {selected.records.length ? (
                  selected.records.map((record, index) => (
                    <article key={record.id || index} className="ov-inspector-card">
                      <div className="ov-ins-title-row">
                        <strong>
                          {record.tracking || record.reference || record.name || 'Record'}
                        </strong>
                        <span className="ov-status-tag">
                          {ORDER_LABELS[record.status] || record.status || 'Active'}
                        </span>
                      </div>

                      <p className="ov-ins-customer">
                        {record.customer || record.name || record.role || 'Customer'}
                      </p>

                      <dl className="ov-ins-details">
                        {record.reference && (
                          <>
                            <dt>Source</dt>
                            <dd>
                              Customer request ·{' '}
                              {adminData?.requestsSource === 'supabase'
                                ? 'Shared database'
                                : 'Local storage'}
                            </dd>
                          </>
                        )}
                        {record.service && (
                          <>
                            <dt>Service</dt>
                            <dd>{record.service}</dd>
                          </>
                        )}
                        {(record.note || record.notes) && (
                          <>
                            <dt>Brief</dt>
                            <dd>{record.note || record.notes}</dd>
                          </>
                        )}
                        {record.total != null && (
                          <>
                            <dt>Total Amount</dt>
                            <dd>{money(Number(record.total))}</dd>
                          </>
                        )}
                        {record.delivery && (
                          <>
                            <dt>Delivery Address</dt>
                            <dd>{record.delivery}</dd>
                          </>
                        )}
                        {record.estimatedDelivery && (
                          <>
                            <dt>Estimated Delivery</dt>
                            <dd>
                              {new Date(record.estimatedDelivery).toLocaleString('en-GH', {
                                timeZone: 'Africa/Accra',
                              })}
                            </dd>
                          </>
                        )}
                        {record.phone && (
                          <>
                            <dt>Phone Number</dt>
                            <dd>{record.phone}</dd>
                          </>
                        )}
                      </dl>
                    </article>
                  ))
                ) : (
                  <div className="ov-empty-activity">
                    <Check size={28} />
                    <p>Nothing pending in this category. Everything is up to date.</p>
                  </div>
                )}
              </div>
            </section>
          </div>,
          document.body
        )}
    </div>
  );
}
