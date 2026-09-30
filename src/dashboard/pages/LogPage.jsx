// src/pages/LogPage.jsx
// Ported 1-for-1 from admin-monolith.html renderLogView() (lines 24250–24810)

import { useState, useEffect } from 'react';
import CustomDropdown from '../components/shared/CustomDropdown';
import { formatGHS } from '../lib/ordersModel';
import { listOrders, updateOrderStatus } from '../data/orders';

// SVG Icons matching monolith
const SVG_ICONS = {
  download: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  shoppingBag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  dollar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  truck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
};

// ── Helper formatLogDayLabel ── (Monolith lines 24248–24256)
function formatLogDayLabel(dateObj) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffDays = Math.round((today - target) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
}

// ── Helper formatDeliveredTimeString ── (Monolith lines 24258–24271)
function formatDeliveredTimeString(order) {
  if (order.deliveredAt) {
    const d = new Date(order.deliveredAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }
  // Fallback to audit log
  if (order.auditLog && order.auditLog.length > 0) {
    const deliveredEntry = order.auditLog.slice().reverse().find(l => l.note && l.note.toLowerCase().includes('delivered'));
    if (deliveredEntry) return deliveredEntry.time;
  }
  return 'Completed';
}

// ── Toast Helper ──
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

export default function LogPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);

  // Tab & filter states matching monolith globals (lines 24273–24285)
  const [logsTabState, setLogsTabState] = useState('delivered'); // 'delivered' | 'activity'
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [logsDateFilter, setLogsDateFilter] = useState('all'); // 'all' | 'today' | '7days' | '30days'
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

  // Activity Log filter states (lines 24540–24553)
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load orders from Supabase on mount
  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const loadedOrders = await listOrders();
      setOrders(loadedOrders);

      // Derive activity logs from order_events
      const derivedLogs = [];
      loadedOrders.forEach(order => {
        if (order.auditLog && order.auditLog.length > 0) {
          order.auditLog.forEach(event => {
            derivedLogs.push({
              id: `${order.id}-${event.time}`,
              type: 'order',
              text: `Order #${order.orderCode || order.id}: ${event.stage}`,
              timestamp: event.time,
              timeRelative: event.time
            });
          });
        }
      });
      setActivityLogs(derivedLogs);
      setLoading(false);
    }
    loadOrders();
  }, []);

  // Listen for order updates from elsewhere in app
  useEffect(() => {
    const handleOrdersUpdated = async () => {
      const loadedOrders = await listOrders();
      setOrders(loadedOrders);
    };
    window.addEventListener('xa12:orders-updated', handleOrdersUpdated);
    return () => {
      window.removeEventListener('xa12:orders-updated', handleOrdersUpdated);
    };
  }, []);

  // Filter delivered orders (Monolith lines 24287–24318)
  const deliveredOrders = orders.filter(o => o.fulfillmentStatus === 'delivered');

  let filteredDelivered = deliveredOrders.filter(order => {
    // Search filter
    if (logsSearchQuery.trim()) {
      const q = logsSearchQuery.toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchCode = (order.orderCode || '').toLowerCase().includes(q);
      const matchName = (order.customerName || '').toLowerCase().includes(q);
      const matchPhone = (order.phone || order.customerPhone || '').toLowerCase().includes(q);
      const matchItems = (order.items || []).some(item =>
        (item.name || '').toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q)
      );
      if (!matchId && !matchCode && !matchName && !matchPhone && !matchItems) {
        return false;
      }
    }

    // Date range filter
    if (logsDateFilter !== 'all') {
      const now = new Date();
      const orderTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : (new Date(order.orderDate).getTime() || now.getTime());
      const diffDays = (now.getTime() - orderTime) / (1000 * 3600 * 24);

      if (logsDateFilter === 'today' && diffDays > 1) return false;
      if (logsDateFilter === '7days' && diffDays > 7) return false;
      if (logsDateFilter === '30days' && diffDays > 30) return false;
    }

    return true;
  });

  // Sort newest delivered first (Monolith lines 24320–24325)
  filteredDelivered.sort((a, b) => {
    const timeA = a.deliveredAt ? new Date(a.deliveredAt).getTime() : (new Date(a.orderDate).getTime() || 0);
    const timeB = b.deliveredAt ? new Date(b.deliveredAt).getTime() : (new Date(b.orderDate).getTime() || 0);
    return timeB - timeA;
  });

  // Group delivered orders by day (Monolith lines 24327–24337)
  const dayGroupsMap = new Map();
  filteredDelivered.forEach(order => {
    const orderDateObj = order.deliveredAt ? new Date(order.deliveredAt) : (new Date(order.orderDate) || new Date());
    const validDate = isNaN(orderDateObj.getTime()) ? new Date() : orderDateObj;
    const dayLabel = formatLogDayLabel(validDate);
    if (!dayGroupsMap.has(dayLabel)) {
      dayGroupsMap.set(dayLabel, []);
    }
    dayGroupsMap.get(dayLabel).push(order);
  });

  // Activity Log filtering (Monolith lines 24540–24588 & 24780–24794)
  let filteredActivity = activityLogs.filter(log => {
    if (activityTypeFilter !== 'all' && log.type !== activityTypeFilter) {
      return false;
    }
    if (activitySearchQuery.trim()) {
      const q = activitySearchQuery.toLowerCase();
      const textMatch = (log.text || '').toLowerCase().includes(q);
      const typeMatch = (log.type || '').toLowerCase().includes(q);
      if (!textMatch && !typeMatch) return false;
    }
    return true;
  });

  // ── Expand/Collapse Toggle ── (Monolith lines 24731–24742)
  function toggleExpand(orderId) {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }

  // ── Reopen Order Action ── (Monolith lines 24745–24776)
  const handleReopenOrder = async (orderId) => {
    // Reopen order: change status from 'completed' to 'delivery' (dispatched)
    const success = await updateOrderStatus(orderId, 'dispatched', 'Order reopened from delivery history');
    if (success) {
      const refreshedOrders = await listOrders();
      setOrders(refreshedOrders);
      setExpandedOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      showToast('Order reopened successfully.');
    } else {
      showToast('Failed to reopen order.');
    }
  };

  // ── Export CSV ── (Monolith lines 24620–24644)
  function handleExportCSV() {
    try {
      const delivs = orders.filter(o => o.fulfillmentStatus === 'delivered');
      let csv = 'DELIVERED ORDERS\n"Order Code","Customer","Phone","Amount (GHS)","Items","Delivered At"\n';
      delivs.forEach(o => {
        csv += `"${o.orderCode || o.id}","${(o.customerName || '').replace(/"/g, '""')}","${o.customerPhone || o.phone || ''}","${(o.amount || 0).toFixed(2)}","${(o.items || []).map(i => (i.name || i.title || '') + ' x' + (i.qty || 1)).join(' | ')}","${o.deliveredAt ? new Date(o.deliveredAt).toLocaleString() : ''}"\n`;
      });
      csv += '\nACTIVITY LOG\n"ID","Type","Description","Timestamp"\n';
      activityLogs.forEach(l => {
        csv += `"${l.id || ''}","${l.type || ''}","${(l.text || '').replace(/"/g, '""')}","${l.timestamp || l.timeRelative || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'store-logs-' + new Date().toISOString().split('T')[0] + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export error:', e);
    }
  }

  // ── Clear Activity Log Action ──
  // Activity logs are now derived from order_events in Supabase
  // Clearing is not applicable - we can only clear the UI display
  function handleClearActivityConfirm() {
    setActivityLogs([]);
    setShowClearConfirm(false);
    showToast('Activity display cleared (logs persist in database).');
  }

  return (
    <div className="page-container">
      {/* Page Header — Monolith lines 24349–24367 */}
      <div className="page-header-row" style={{ marginBottom: '20px' }}>
        <div className="page-title-group">
          <h2>Logs &amp; Delivery History</h2>
          <p>Archived delivery records and system event logs. Entries are removed after 30 days. Export to keep a copy.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Export CSV Button */}
          <button
            className="btn-capsule"
            id="exportLogsCSVBtn"
            type="button"
            onClick={handleExportCSV}
            style={{ background: '#1a1a1a', color: '#fff', minHeight: '38px', gap: '6px' }}
          >
            {SVG_ICONS.download} Export CSV
          </button>
          {/* Tab Switcher Segmented Control */}
          <div className="seg" id="logsTabSwitcher">
            <button
              type="button"
              className={`seg-btn ${logsTabState === 'delivered' ? 'active' : ''}`}
              onClick={() => setLogsTabState('delivered')}
            >
              Delivered Orders ({deliveredOrders.length})
            </button>
            <button
              type="button"
              className={`seg-btn ${logsTabState === 'activity' ? 'active' : ''}`}
              onClick={() => setLogsTabState('activity')}
            >
              Activity Log ({activityLogs.length})
            </button>
          </div>
        </div>
      </div>

      {logsTabState === 'delivered' ? (
        <>
          {/* Delivered Orders Controls — Monolith lines 24370–24396 */}
          <div className="orders-filter-card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="filter-card-search" style={{ flex: 1, minWidth: '260px' }}>
                <svg className="search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="orders-search-input"
                  id="logDeliveredSearchInput"
                  placeholder="Search by customer name, phone, order code, or product..."
                  value={logsSearchQuery}
                  onChange={e => setLogsSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="logDateRangeSelect" style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Date range:</label>
                <CustomDropdown
                  options={[
                    { value: 'all', label: 'All time' },
                    { value: 'today', label: 'Today' },
                    { value: '7days', label: 'Last 7 days' },
                    { value: '30days', label: 'Last 30 days' }
                  ]}
                  value={logsDateFilter}
                  onChange={setLogsDateFilter}
                />
              </div>
            </div>
          </div>

          {/* Helper Line — Monolith lines 24399–24401 */}
          <div className="helper-line-with-island" style={{ marginBottom: '16px' }}>
            <span className="helper-text">
              Showing {filteredDelivered.length} delivered {filteredDelivered.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {/* Delivered Orders Grouped List — Monolith lines 24404–24536 */}
          <div className="delivered-orders-container">
            {filteredDelivered.length > 0 ? (
              Array.from(dayGroupsMap.entries()).map(([dayLabel, groupOrders]) => (
                <div key={dayLabel} className="log-day-group">
                  <div className="log-day-header">{dayLabel}</div>
                  <div className="log-day-orders">
                    {groupOrders.map(order => {
                      const isExpanded = expandedOrderIds.has(order.id);
                      const itemsSummary = (order.items || []).map(i => `${i.name || i.title || ''} × ${i.qty || 1}`).join(', ');
                      const deliveredTime = formatDeliveredTimeString(order);
                      const formattedAmount = formatGHS(order.amount);
                      const initials = order.customerName
                        ? order.customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : 'CU';

                      return (
                        <div key={order.id} className={`order-card log-delivered-card ${isExpanded ? 'expanded' : ''}`} data-order-id={order.id}>
                          {/* Card Main Bar */}
                          <div
                            className="order-card-main"
                            onClick={() => toggleExpand(order.id)}
                            style={{ cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
                          >
                            {/* Left: Avatar & Customer Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                              <div
                                className="customer-avatar"
                                style={{
                                  width: '38px', height: '38px', borderRadius: '50%', background: '#f0f2f1', color: '#1a1a1a',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px',
                                  flexShrink: 0, border: '1px solid rgba(26,26,26,0.08)'
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{order.customerName}</span>
                                  <span
                                    className={`source-pill ${order.source || 'online'}`}
                                    style={{
                                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: '6px',
                                      background: order.source === 'staff' ? '#ede9fe' : '#e0f2fe',
                                      color: order.source === 'staff' ? '#5b21b6' : '#0369a1'
                                    }}
                                  >
                                    {order.source === 'staff' ? 'Staff' : 'Online'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                                  {itemsSummary}
                                </div>
                              </div>
                            </div>

                            {/* Middle: Delivered Chip */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span className="status-delivered-chip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Delivered {deliveredTime}
                              </span>
                            </div>

                            {/* Right: Amount, Code & Expand Chevron */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', textAlign: 'right' }}>{formattedAmount}</div>
                                <span className="order-code-sub" style={{ display: 'block', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                                  {order.orderCode || order.id}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="btn-icon-action toggle-chevron-btn"
                                aria-label="Toggle Details"
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                              >
                                {isExpanded ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15" />
                                  </svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Read-only Details Panel — Monolith lines 24467–24519 */}
                          {isExpanded && (
                            <div className="log-order-expanded-panel" style={{ padding: '16px 20px', borderTop: '1px solid rgba(26,26,26,0.06)', background: 'rgba(26,26,26,0.02)' }}>
                              <div className="log-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                                {/* Customer & Delivery */}
                                <div className="log-detail-block">
                                  <div className="log-detail-title" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', marginBottom: '6px' }}>Customer &amp; Delivery Info</div>
                                  <div className="log-detail-text" style={{ fontSize: '13px', color: '#333' }}>
                                    <div><strong>Phone:</strong> {order.customerPhone || order.phone || 'N/A'}</div>
                                    <div><strong>Address:</strong> {order.deliveryAddress || 'Standard Delivery'}</div>
                                    <div><strong>Window:</strong> {order.deliveryWindow || order.estimatedDelivery || 'N/A'}</div>
                                    {order.riderAssigned && <div><strong>Rider:</strong> {order.riderAssigned}</div>}
                                  </div>
                                </div>

                                {/* Order Items Breakdown */}
                                <div className="log-detail-block">
                                  <div className="log-detail-title" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', marginBottom: '6px' }}>Ordered Items</div>
                                  <div className="log-items-list" style={{ fontSize: '13px', color: '#333' }}>
                                    {(order.items || []).map((item, idx) => (
                                      <div key={idx} className="log-item-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span>{item.name || item.title} {item.variant ? `(${item.variant})` : ''} × {item.qty || 1}</span>
                                        <span style={{ fontWeight: 600 }}>
                                          {formatGHS((item.unitPrice || item.price || 0) * (item.qty || 1))}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Admin Note & Audit Trail */}
                                <div className="log-detail-block">
                                  <div className="log-detail-title" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', marginBottom: '6px' }}>Admin Note &amp; Activity</div>
                                  <div className="log-detail-text" style={{ marginBottom: '8px', fontSize: '13px' }}>
                                    {order.adminNote ? <em>&ldquo;{order.adminNote}&rdquo;</em> : <span style={{ color: '#888' }}>No notes attached.</span>}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#7a7a7a' }}>
                                    {(order.auditLog || []).slice(-3).map((l, idx) => (
                                      <div key={idx}>• {l.time}: {l.note}</div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Action Row with Reopen Button */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(26,26,26,0.06)' }}>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Reopening returns this order to Dispatched status on the Orders page.</span>
                                <button
                                  type="button"
                                  className="reopen-delivered-btn"
                                  onClick={(e) => { e.stopPropagation(); handleReopenOrder(order.id); }}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px',
                                    border: '1px solid rgba(26,26,26,0.15)', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="1 4 1 10 7 10" />
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                  </svg>
                                  Reopen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)', padding: '48px', textAlign: 'center' }}>
                <div className="empty-state-icon" style={{ marginBottom: '12px', color: '#8b8d8a' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="empty-state-title" style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>No delivered orders match criteria</div>
                <div className="empty-state-message" style={{ color: '#6b7280', fontSize: '13px' }}>Orders will appear here once fulfilled and marked Delivered.</div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Activity Log Tab — Monolith lines 24538–24605 */
        <>
          <div className="log-filter-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="log-search-input"
              placeholder="Search activity log..."
              id="logSearchInput"
              value={activitySearchQuery}
              onChange={e => setActivitySearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.14)', fontSize: '13px' }}
            />
            <CustomDropdown
              options={[
                { value: 'all', label: 'All Activity' },
                { value: 'order', label: 'Orders' },
                { value: 'payment', label: 'Payments' },
                { value: 'cancel', label: 'Cancellations' },
                { value: 'delete', label: 'Deletions' },
                { value: 'delivery', label: 'Deliveries' }
              ]}
              value={activityTypeFilter}
              onChange={setActivityTypeFilter}
            />

            {/* Clear all inline confirm handler — Monolith lines 24554–24556 & 24651–24710 */}
            {!showClearConfirm ? (
              <button
                className="btn-capsule"
                id="clearLogsBtn"
                type="button"
                onClick={() => setShowClearConfirm(true)}
                style={{ background: '#1a1a1a', color: '#fff', minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {SVG_ICONS.trash} Clear all
              </button>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <span>Clear all?</span>
                <button
                  type="button"
                  className="btn-capsule"
                  onClick={handleClearActivityConfirm}
                  style={{ background: '#dc2626', color: '#fff', padding: '5px 12px', minHeight: '32px', fontSize: '12px', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="btn-capsule"
                  onClick={() => setShowClearConfirm(false)}
                  style={{ background: 'rgba(26,26,26,0.08)', color: 'var(--text-primary)', padding: '5px 12px', minHeight: '32px', fontSize: '12px', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
                >
                  No
                </button>
              </div>
            )}
          </div>
          <div className="retention-notice-line" style={{ fontSize: '12px', color: 'var(--text-muted, #8A8D8A)', marginBottom: '12px' }}>
            Entries are removed after 30 days. Export to keep a copy.
          </div>

          <div className="log-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredActivity.length > 0 ? (
              filteredActivity.map((log, idx) => {
                const icon = SVG_ICONS[log.type] || SVG_ICONS.clock;
                return (
                  <div
                    key={log.id || idx}
                    className="log-entry"
                    data-log-type={log.type || 'info'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                      background: 'var(--card-bg, #fff)', border: '1px solid rgba(26,26,26,0.08)', borderRadius: '10px'
                    }}
                  >
                    <div
                      className="log-entry-avatar"
                      style={{
                        background: 'rgba(26,26,26,0.06)', borderRadius: '50%', width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0
                      }}
                    >
                      {icon}
                    </div>
                    <div className="log-entry-content" style={{ flex: 1 }}>
                      <div className="log-entry-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="log-entry-info">
                          <span className="log-entry-action" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.text}
                          </span>
                        </div>
                        <span className="log-entry-time" style={{ fontSize: '12px', color: '#8a8d8a' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : (log.timeRelative || '')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-log-state" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)', padding: '48px', textAlign: 'center' }}>
                <div className="empty-log-icon" style={{ marginBottom: '12px', color: '#8b8d8a' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="empty-log-title" style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>No activity logged yet</div>
                <div className="empty-log-message" style={{ color: '#6b7280', fontSize: '13px' }}>Activity will appear here as orders are processed, delivered or deleted.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
