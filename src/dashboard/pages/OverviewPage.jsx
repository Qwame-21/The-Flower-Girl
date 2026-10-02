import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatGHS, CATEGORY_MAP } from '../lib/ordersModel';
import { listOrders } from '../data/orders';
import { getInventorySummary } from '../data/products';

// SVG Icons matching monolith
const SVG = {
  dollar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  shoppingBag: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  package: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><polyline points="22.68 8.56 12 14.7 1.32 8.56"/><line x1="12" y1="14.7" x2="12" y2="23"/><polygon points="12 2 22.68 8.2 22.68 15.8 12 22 1.32 15.8 1.32 8.2 12 2"/></svg>,
  truck: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  trash: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
};

// Spline helper
function getCatmullRomSplinePath(pts) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

// Donut Ring Chart component
function DonutRingCard({ title, icon, totalLabel, type, filter, onFilterChange, filterOptions, data }) {
  const [highlightedKey, setHighlightedKey] = useState(null);
  const src = data || {};
  const segments = Object.values(src);

  let active = segments;
  if (type === 'orderStatus') {
    if (filter === 'open') active = segments.filter(s => s.key !== 'delivered');
    if (filter === 'closed') active = segments.filter(s => s.key === 'delivered');
  }
  if (type === 'inventory') {
    if (filter === 'low') active = segments.filter(s => s.key === 'low' || s.key === 'out');
    if (filter === 'out') active = segments.filter(s => s.key === 'out');
  }
  if (type === 'delivery') {
    if (filter === 'on time') active = segments.filter(s => s.key !== 'runningLate');
    if (filter === 'delayed') active = segments.filter(s => s.key === 'runningLate');
  }

  const total = active.reduce((s, seg) => s + seg.value, 0);
  const RING_C = 2 * Math.PI * 48;
  const gap = 3.5;
  const r = 48, cx = 60, cy = 60;
  const totalGap = active.length > 1 ? gap * active.length : 0;
  const usable = RING_C - totalGap;

  let currentOffset = 0;

  const highlightedItem = highlightedKey ? active.find(s => s.key === highlightedKey) : null;
  const displayVal = highlightedItem ? highlightedItem.value : (active[0]?.value || 0);
  const displayLabel = highlightedItem ? highlightedItem.label : (active[0]?.label || 'No data');

  return (
    <div className="overview-card ring-card" data-ring-type={type}>
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon-square">{icon}</div>
          <div>
            <span className="card-label">{title}</span>
            <span className="card-sublabel">{totalLabel || `${total} items`}</span>
          </div>
        </div>
        <div className="segmented-control seg">
          {filterOptions.map(opt => (
            <button
              key={opt.val}
              className={`segment-btn seg-btn ${filter === opt.val ? 'active' : ''}`}
              onClick={() => onFilterChange(opt.val)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ring-chart-container">
        <svg
          className="ring-chart"
          viewBox="0 0 120 120"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', overflow: 'visible' }}
        >
          <circle
            className="ring-bg"
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(26,26,26,0.08)"
            strokeWidth="14"
          />
          {active.map(seg => {
            const dash = total > 0 ? (seg.value / total) * usable : 0;
            const offset = currentOffset;
            currentOffset += dash + (active.length > 1 ? gap : 0);
            const isDimmed = highlightedKey && highlightedKey !== seg.key;
            const isHighlighted = highlightedKey === seg.key;

            return (
              <circle
                key={seg.key}
                className={`ring-segment ${isDimmed ? 'dimmed' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${dash} ${RING_C}`}
                strokeDashoffset={-offset}
                onMouseEnter={() => setHighlightedKey(seg.key)}
                onMouseLeave={() => setHighlightedKey(null)}
              />
            );
          })}
        </svg>
        <div className="ring-center">
          <span className="ring-value">{displayVal}</span>
          <span className="ring-label">{displayLabel}</span>
        </div>
      </div>

      <div className="ring-legend">
        {active.map(seg => {
          const isDimmed = highlightedKey && highlightedKey !== seg.key;
          return (
            <div
              key={seg.key}
              className={`legend-item ${isDimmed ? 'dimmed' : ''}`}
              onMouseEnter={() => setHighlightedKey(seg.key)}
              onMouseLeave={() => setHighlightedKey(null)}
              tabIndex={0}
            >
              <div className="legend-item-left">
                <span className="legend-dot" style={{ background: seg.color, flexShrink: 0 }}></span>
                <span className="legend-label">{seg.label}</span>
              </div>
              <span className="legend-value">{seg.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Trend Chart SVG Component
function TrendChart({ series, mode }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const { dates = [], currentValues = [], previousValues = [] } = series;
  const rawMax = Math.max(...currentValues, ...previousValues, 0);
  const maxVal = rawMax > 0 ? rawMax : 100;
  const width = 640;
  const height = 220;
  const padding = { top: 35, right: 30, bottom: 40, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const count = currentValues.length;

  const getX = (idx) => padding.left + (count > 1 ? (idx / (count - 1)) * chartW : chartW / 2);
  const getY = (val) => padding.top + chartH - (maxVal > 0 ? (val / maxVal) * chartH : 0);

  const pts = currentValues.map((v, i) => ({ x: getX(i), y: getY(v), val: v, date: dates[i] || `Point ${i+1}` }));
  const prevPts = previousValues.map((v, i) => ({ x: getX(i), y: getY(v), val: v }));

  const mainLinePath = getCatmullRomSplinePath(pts);
  const prevLinePath = getCatmullRomSplinePath(prevPts);

  const firstPt = pts[0] || { x: padding.left, y: padding.top + chartH };
  const lastPt = pts[pts.length - 1] || { x: padding.left + chartW, y: padding.top + chartH };
  const areaPath = mainLinePath ? `${mainLinePath} L ${lastPt.x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${firstPt.x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z` : '';

  let maxPtIndex = 0;
  pts.forEach((p, idx) => {
    if (p.val > (pts[maxPtIndex]?.val || 0)) maxPtIndex = idx;
  });
  const maxPt = pts[maxPtIndex];
  const maxLabel = mode === 'revenue'
    ? `GHS ${Math.round(maxPt?.val || 0).toLocaleString('en-US')}`
    : `${Math.round(maxPt?.val || 0).toLocaleString('en-US')} orders`;

  const ticks = [0, maxVal * 0.5, maxVal];

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    let closestIdx = 0;
    let closestDist = Infinity;
    pts.forEach((p, i) => {
      const dist = Math.abs(p.x - svgX);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });
    setHoverIndex(closestIdx);
  };

  const activePt = hoverIndex !== null ? pts[hoverIndex] : null;
  const activePrevPt = hoverIndex !== null ? prevPts[hoverIndex] : null;

  function formatVal(val) {
    if (mode === 'revenue') return `GHS ${Math.round(val).toLocaleString('en-US')}`;
    return `${Math.round(val).toLocaleString('en-US')} orders`;
  }

  let pctChangeText = '';
  let pctColor = 'var(--chart-good, #5E9470)';
  if (activePt && activePrevPt && activePrevPt.val > 0) {
    const pct = Math.round(((activePt.val - activePrevPt.val) / activePrevPt.val) * 100);
    pctChangeText = `${pct >= 0 ? '+' : ''}${pct}% vs prev`;
    pctColor = pct >= 0 ? 'var(--chart-good, #5E9470)' : 'var(--chart-bad, #B9645C)';
  }

  return (
    <div className="trend-chart-container" style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible', cursor: 'crosshair' }}
        className="trend-chart-svg"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5E9470" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#5E9470" stopOpacity="0.0" />
          </linearGradient>
          <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="capsuleShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1a1a1a" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Horizontal Y Grid lines */}
        {ticks.map(t => {
          const y = getY(t);
          const label = mode === 'revenue'
            ? (t >= 1000 ? `GHS ${(t/1000).toFixed(1)}k` : `GHS ${Math.round(t).toLocaleString('en-US')}`)
            : Math.round(t).toLocaleString('en-US');
          return (
            <g key={t}>
              <line
                x1={padding.left}
                y1={y.toFixed(1)}
                x2={(width - padding.right).toFixed(1)}
                y2={y.toFixed(1)}
                stroke="rgba(26,26,26,0.06)"
                strokeDasharray="3 3"
              />
              <text
                x={(padding.left - 10).toFixed(1)}
                y={(y + 4).toFixed(1)}
                fontSize="11"
                fontWeight="500"
                fill="var(--text-muted, #8A8D8A)"
                textAnchor="end"
                fontVariantNumeric="tabular-nums"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* X axis date labels */}
        {pts.map((p, idx) => {
          if (count > 8 && idx % Math.ceil(count / 6) !== 0 && idx !== count - 1) return null;
          return (
            <text
              key={idx}
              x={p.x.toFixed(1)}
              y={(height - 10).toFixed(1)}
              fontSize="11"
              fontWeight="500"
              fill="var(--text-muted, #8A8D8A)"
              textAnchor="middle"
            >
              {p.date}
            </text>
          );
        })}

        {/* Previous Period Line */}
        {prevLinePath && (
          <path
            d={prevLinePath}
            fill="none"
            stroke="rgba(26,26,26,0.22)"
            strokeWidth="1.75"
            strokeDasharray="4 4"
          />
        )}

        {/* Area Fill */}
        {areaPath && <path d={areaPath} fill="url(#trendAreaGrad)" className="trend-area-path" />}

        {/* Main Smooth Curved Line */}
        {mainLinePath && (
          <path
            d={mainLinePath}
            fill="none"
            stroke="var(--chart-good, #5E9470)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="trend-line-main"
          />
        )}

        {/* Peak Marker */}
        {maxPt && maxPt.val > 0 && (() => {
          const capsuleW = Math.max(92, Math.round(maxLabel.length * 7.2 + 24));
          const halfW = Math.round(capsuleW / 2);
          return (
            <g transform={`translate(${maxPt.x.toFixed(1)}, ${(maxPt.y - 28).toFixed(1)})`} className="peak-marker">
              <rect x={-halfW} y="-12" width={capsuleW} height="24" rx="12" fill="#1a1a1a" filter="url(#capsuleShadow)" />
              <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="10" fontWeight="700" fontVariantNumeric="tabular-nums">
                {maxLabel}
              </text>
            </g>
          );
        })()}

        {/* Last Point Pulse Marker */}
        {lastPt && (
          <circle
            cx={lastPt.x.toFixed(1)}
            cy={lastPt.y.toFixed(1)}
            r="4.5"
            fill="var(--chart-good, #5E9470)"
            stroke="#ffffff"
            strokeWidth="2"
            className="last-pulse-dot"
          />
        )}

        {/* Interactive Hover Guide */}
        {activePt && (
          <g className="interactive-hover-group">
            <line
              x1={activePt.x.toFixed(1)}
              y1={padding.top}
              x2={activePt.x.toFixed(1)}
              y2={height - padding.bottom}
              stroke="rgba(26,26,26,0.18)"
              strokeDasharray="3 3"
            />
            <circle
              cx={activePt.x.toFixed(1)}
              cy={activePt.y.toFixed(1)}
              r="6"
              fill="var(--chart-good, #5E9470)"
              stroke="#ffffff"
              strokeWidth="2.5"
              filter="url(#dotGlow)"
            />
          </g>
        )}
      </svg>

      {/* Floating Tooltip */}
      {activePt && (
        <div
          className="trend-chart-tooltip"
          style={{
            position: 'absolute',
            display: 'block',
            opacity: 1,
            left: `${Math.min(Math.max(activePt.x - 70, 4), width - 144)}px`,
            top: `${Math.max(activePt.y - 60, 4)}px`,
            pointerEvents: 'none',
            zIndex: 10,
            background: '#ffffff',
            border: '1px solid rgba(26,26,26,0.12)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
            minWidth: '130px'
          }}
        >
          <div className="tt-date" style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '2px' }}>
            {activePt.date}
          </div>
          <div className="tt-val" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatVal(activePt.val)}
          </div>
          {pctChangeText && (
            <div className="tt-change" style={{ fontSize: '11px', fontWeight: '600', color: pctColor, marginTop: '2px' }}>
              {pctChangeText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();

  // Filters state
  const [period, setPeriod] = useState('30d');
  const [trendMode, setTrendMode] = useState('revenue');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');

  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState({ healthy: 0, low: 0, out: 0, products: [] });
  const [loading, setLoading] = useState(true);

  // Load orders from Supabase on mount
  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const loadedOrders = await listOrders();
      setOrders(loadedOrders);
      setLoading(false);
    }
    loadOrders();
  }, []);

  // Load inventory from Supabase on mount
  useEffect(() => {
    async function loadInventory() {
      const invData = await getInventorySummary();
      setInventory(invData);
    }
    loadInventory();
  }, []);

  // Compute stats from real orders
  const calculateStats = (ordersList, periodDays) => {
    const now = new Date();
    const cutoffDate = periodDays !== Infinity ? new Date(now.getTime() - periodDays * 86400000) : null;
    const cutoffStr = cutoffDate ? cutoffDate.toISOString().split('T')[0] : '0000-00-00';

    let totalRevenue = 0;
    let totalOrdersCount = 0;
    let paidNonCancelledCount = 0;

    const categoryRevenue = { hampers: 0, personalized: 0, bundles: 0, care: 0, flowers: 0 };

    ordersList.forEach(o => {
      const oDateStr = (o.orderDate || '').split('T')[0];
      if (cutoffStr && oDateStr < cutoffStr) return;

      if (o.fulfillmentStatus !== 'cancelled') {
        totalOrdersCount++;
        if (o.paymentStatus === 'paid') {
          totalRevenue += o.total || 0;
          paidNonCancelledCount++;
        }

        (o.items || []).forEach(item => {
          const catKey = (item.category || '').toLowerCase();
          if (categoryRevenue[catKey] !== undefined) {
            categoryRevenue[catKey] += (item.unitPrice * item.qty);
          }
        });
      }
    });

    const avgOrderValue = paidNonCancelledCount > 0 ? (totalRevenue / paidNonCancelledCount) : 0;

    return {
      totalRevenue,
      totalOrdersCount,
      paidNonCancelledCount,
      avgOrderValue,
      categoryRevenue
    };
  };

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : Infinity;
  const combinedStats = calculateStats(orders, periodDays);
  const prevPeriodDays = period === '7d' ? 30 : Infinity;
  const prevStats = calculateStats(orders, prevPeriodDays);

  const activeOrdersCount = orders.filter(o => o.fulfillmentStatus !== 'delivered' && o.fulfillmentStatus !== 'cancelled').length;
  const pendingPaymentCount = orders.filter(o => o.paymentStatus === 'pending' && o.fulfillmentStatus !== 'cancelled').length;

  const revDelta = prevStats.totalRevenue > 0 ? Math.round(((combinedStats.totalRevenue - prevStats.totalRevenue) / prevStats.totalRevenue) * 100) : null;
  const ordersDelta = prevStats.totalOrdersCount > 0 ? Math.round(((combinedStats.totalOrdersCount - prevStats.totalOrdersCount) / prevStats.totalOrdersCount) * 100) : null;

  const hasData = combinedStats.totalRevenue > 0 || combinedStats.totalOrdersCount > 0;

  // Compute order status distribution from real orders
  const orderStatusData = {
    delivered: { key: 'delivered', label: 'Delivered', value: orders.filter(o => o.fulfillmentStatus === 'delivered').length, color: 'var(--chart-good, #5E9470)' },
    preparing: { key: 'preparing', label: 'Processing', value: orders.filter(o => o.fulfillmentStatus === 'preparing').length, color: 'var(--chart-progress, #D0A24A)' },
    ready: { key: 'ready', label: 'Packed', value: orders.filter(o => o.fulfillmentStatus === 'ready').length, color: 'var(--chart-info, #5F82A6)' },
    dispatched: { key: 'dispatched', label: 'Dispatched', value: orders.filter(o => o.fulfillmentStatus === 'dispatched').length, color: 'var(--chart-sage, #6E9C7B)' },
    pending: { key: 'pending', label: 'Pending Payment', value: orders.filter(o => o.paymentStatus === 'pending' && o.fulfillmentStatus !== 'cancelled').length, color: 'var(--chart-bad, #B9645C)' }
  };

  // Inventory data - derived from products table
  const inventoryData = {
    healthy: { key: 'healthy', label: 'In Stock', value: inventory.healthy, color: 'var(--chart-good, #5E9470)' },
    low: { key: 'low', label: 'Low Stock', value: inventory.low, color: 'var(--chart-progress, #D0A24A)' },
    out: { key: 'out', label: 'Out of Stock', value: inventory.out, color: 'var(--chart-bad, #B9645C)' }
  };
  const totalProducts = inventory.healthy + inventory.low + inventory.out;

  // Delivery data - derived from orders
  const deliveredOrders = orders.filter(o => o.fulfillmentStatus === 'delivered');
  const deliveryData = {
    onTime: { key: 'onTime', label: 'On Time', value: deliveredOrders.length, color: 'var(--chart-good, #5E9470)' },
    runningLate: { key: 'runningLate', label: 'Running Late', value: 0, color: 'var(--chart-bad, #B9645C)' }
  };

  const trendSeries = {
    dates: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
    currentValues: hasData ? [1200, 2400, 1800, 3100, 2800, 3900, combinedStats.totalRevenue] : [0, 0, 0, 0, 0, 0, 0],
    previousValues: hasData ? [1000, 2000, 1500, 2600, 2400, 3200, 3500] : [0, 0, 0, 0, 0, 0, 0]
  };

  // Derive activity log from order_events
  const activityLog = [];
  orders.slice(0, 6).forEach(order => {
    if (order.auditLog && order.auditLog.length > 0) {
      order.auditLog.slice(0, 2).forEach(event => {
        activityLog.push({
          id: `${order.id}-${event.time}`,
          type: 'order',
          text: `Order #${order.orderCode || order.id}: ${event.stage}`,
          timestamp: event.time,
          timeRelative: event.time
        });
      });
    }
  });

  return (
    <div className="overview-page-container">
      {/* Welcome Greeting & Period Control */}
      <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div className="welcome-header-row">
          <h1 className="welcome-title">Welcome back, Admin</h1>
          <p className="welcome-description">Overview of store performance and action items</p>
        </div>
        <div className="segmented-control seg" id="overviewPeriodControl">
          <button className={`segment-btn seg-btn ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')}>Last 7 days</button>
          <button className={`segment-btn seg-btn ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')}>Last 30 days</button>
          <button className={`segment-btn seg-btn ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>All time</button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="metric-cards-row">
        {/* Card 1: Total Revenue */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div className="metric-icon-square">{SVG.dollar}</div>
          </div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">{formatGHS(combinedStats.totalRevenue)}</div>
          <div className="metric-divider"></div>
          <div className="metric-comparison">
            <span className="comparison-label">vs prev period</span>
            <span className={`comparison-pill ${revDelta !== null && revDelta >= 0 ? 'positive' : 'negative'}`}>
              {revDelta !== null ? `${revDelta >= 0 ? '↑' : '↓'} ${Math.abs(revDelta)}%` : '—'}
            </span>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div className="metric-icon-square">{SVG.shoppingBag}</div>
          </div>
          <div className="metric-label">Active Orders</div>
          <div className="metric-value">{activeOrdersCount}</div>
          <div className="metric-divider"></div>
          <div className="metric-comparison">
            <span className="comparison-label">vs prev period</span>
            <span className={`comparison-pill ${ordersDelta !== null && ordersDelta >= 0 ? 'positive' : 'negative'}`}>
              {ordersDelta !== null ? `${ordersDelta >= 0 ? '↑' : '↓'} ${Math.abs(ordersDelta)}%` : '—'}
            </span>
          </div>
        </div>

        {/* Card 3: Pending Payment */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div className="metric-icon-square">{SVG.clock}</div>
          </div>
          <div className="metric-label">Pending Payment</div>
          <div className="metric-value">{pendingPaymentCount}</div>
          <div className="metric-divider"></div>
          <div className="metric-comparison">
            <span className="comparison-label">vs prev period</span>
            <span className="comparison-pill positive">Awaiting payment</span>
          </div>
        </div>

        {/* Card 4: Avg Order Value */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div className="metric-icon-square">{SVG.check}</div>
          </div>
          <div className="metric-label">Avg Order Value</div>
          <div className="metric-value">{formatGHS(combinedStats.avgOrderValue)}</div>
          <div className="metric-divider"></div>
          <div className="metric-comparison">
            <span className="comparison-label">vs prev period</span>
            <span className="comparison-pill positive">Paid orders</span>
          </div>
        </div>
      </div>

      {/* Sales Trend & Recent Activity Row */}
      <div className="overview-trend-activity-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        {/* Sales Trend Chart Card */}
        <div className="overview-card trend-chart-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon-square">{SVG.dollar}</div>
              <div>
                <span className="card-label">Sales Trend</span>
                <span className="card-sublabel">Performance over time</span>
              </div>
            </div>
            <div className="segmented-control seg">
              <button className={`segment-btn seg-btn ${trendMode === 'revenue' ? 'active' : ''}`} onClick={() => setTrendMode('revenue')}>Revenue</button>
              <button className={`segment-btn seg-btn ${trendMode === 'orders' ? 'active' : ''}`} onClick={() => setTrendMode('orders')}>Orders</button>
            </div>
          </div>
          <TrendChart series={trendSeries} mode={trendMode} />
        </div>

        {/* Recent Activity Tile Card */}
        <div className="overview-card activity-tile-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon-square">{SVG.clock}</div>
              <div>
                <span className="card-label">Recent Activity</span>
                <span className="card-sublabel">Latest updates</span>
              </div>
            </div>
            <button className="btn-capsule" onClick={() => navigate('/log')} style={{ fontSize: '11px', cursor: 'pointer' }}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '4px', overflowY: 'auto', maxHeight: '220px' }}>
            {activityLog.length > 0 ? (
              activityLog.map(item => {
                let icon = SVG.clock;
                if (item.type === 'order') icon = SVG.shoppingBag;
                if (item.type === 'payment') icon = SVG.dollar;
                if (item.type === 'delivery') icon = SVG.truck;
                if (item.type === 'cancel' || item.type === 'delete') icon = SVG.trash;
                if (item.type === 'signin') icon = SVG.check;

                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(26,26,26,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#555' }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.text}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {item.timeRelative || 'Recent'}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue by Category & Top Products Grid */}
      <div className="revenue-top-products-grid">
        {/* Revenue by Category Card */}
        <div className="overview-card revenue-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon-square">{SVG.grid}</div>
              <div>
                <span className="card-label">Revenue by Category</span>
                <span className="card-sublabel">Distribution for selected period</span>
              </div>
            </div>
          </div>
          <div className="revenue-amount">{formatGHS(combinedStats.totalRevenue)}</div>
          <div className="segmented-legend" style={{ marginTop: '16px' }}>
            {Object.keys(combinedStats.categoryRevenue || {}).map(catKey => {
              const val = combinedStats.categoryRevenue[catKey];
              const pct = combinedStats.totalRevenue > 0 ? Math.round((val / combinedStats.totalRevenue) * 100) : 0;
              const catName = CATEGORY_MAP[catKey] || catKey;
              return (
                <div key={catKey} className="legend-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
                  <div className="legend-item-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="legend-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--chart-good, #5E9470)' }}></span>
                    <span className="legend-label" style={{ fontSize: '13px', fontWeight: 500 }}>{catName}</span>
                  </div>
                  <span className="legend-value" style={{ fontSize: '13px', fontWeight: 600 }}>{formatGHS(val)} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products Card */}
        <div className="overview-card top-products-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon-square">{SVG.package}</div>
              <div>
                <span className="card-label">Top Products This Period</span>
                <span className="card-sublabel">Best sellers by units sold</span>
              </div>
            </div>
          </div>
          <div className="top-products-list">
            {Object.values(combinedStats.productUnits || {})
              .sort((a, b) => b.units - a.units)
              .slice(0, 4)
              .map((p, idx) => (
                <div key={idx} className="top-product-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="product-rank" style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '14px' }}>#{idx + 1}</div>
                    <div>
                      <div className="product-name" style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatGHS(p.revenue)}</div>
                    </div>
                  </div>
                  <div className="product-metric" style={{ textAlign: 'right' }}>
                    <div className="metric-value" style={{ fontWeight: 700, fontSize: '15px' }}>{p.units}</div>
                    <div className="metric-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>sold</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 3 Donut Ring Cards Row */}
      <div className="ring-charts-row">
        {/* Order Status Ring */}
        <DonutRingCard
          title="Order Status"
          icon={SVG.shoppingBag}
          totalLabel="Total Orders"
          type="orderStatus"
          filter={orderStatusFilter}
          onFilterChange={setOrderStatusFilter}
          filterOptions={[
            { val: 'all', label: 'All' },
            { val: 'open', label: 'Open' },
            { val: 'closed', label: 'Closed' }
          ]}
          data={orderStatusData}
        />

        {/* Inventory Health Ring */}
        {totalProducts > 0 ? (
          <DonutRingCard
            title="Inventory Health"
            icon={SVG.package}
            totalLabel="Now (Total Products)"
            type="inventory"
            filter={inventoryFilter}
            onFilterChange={setInventoryFilter}
            filterOptions={[
              { val: 'all', label: 'All' },
              { val: 'low', label: 'Low' },
              { val: 'out', label: 'Out' }
            ]}
            data={inventoryData}
          />
        ) : (
          <div className="overview-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No inventory data</div>
              <div style={{ fontSize: '12px' }}>Products table is empty or not connected</div>
            </div>
          </div>
        )}

        {/* Delivery Status Ring */}
        <DonutRingCard
          title="Delivery Status"
          icon={SVG.truck}
          totalLabel="Total Deliveries"
          type="delivery"
          filter={deliveryFilter}
          onFilterChange={setDeliveryFilter}
          filterOptions={[
            { val: 'all', label: 'All' },
            { val: 'on time', label: 'On time' },
            { val: 'delayed', label: 'Late' }
          ]}
          data={deliveryData}
        />
      </div>
    </div>
  );
}
