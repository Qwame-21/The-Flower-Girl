import { useState, useEffect } from 'react';
import { fetchOrders, getCachedData, isDataLoading } from '../data/dataCache';

// Category color map for Insights category breakdown
const CATEGORY_COLORS = {
  Hampers: '#5E9470',
  Personalized: '#D0A24A',
  Bundles: '#5F82A6',
  Care: '#6E9C7B',
  Flowers: '#B9645C',
  Other: '#8A8D8A'
};

function filterOrdersByDateRange(orders, range) {
  const now = new Date();
  const startDate = new Date();

  switch (range) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'all':
    default:
      return orders;
  }

  return orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    if (Number.isNaN(orderDate.getTime())) return false;
    return orderDate >= startDate && orderDate <= now;
  });
}

function formatInsightCurrency(value) {
  return `GHS ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function calculateInsightsStats(orders) {
  const paidOrders = orders.filter(order => order.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = paidOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const customerOrders = {};
  orders.forEach(order => {
    const customerId = order.customerName || 'unknown';
    customerOrders[customerId] = (customerOrders[customerId] || 0) + 1;
  });

  const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
  const totalCustomers = Object.keys(customerOrders).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    repeatRate,
    repeatCount: repeatCustomers,
    newCount: totalCustomers - repeatCustomers
  };
}

function getTopProductsByUnits(orders) {
  const productSales = {};

  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const productId = item.productId || item.name;
        const productName = item.name;
        const quantity = item.qty || 1;
        const price = item.unitPrice || 0;

        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: productName,
            units: 0,
            revenue: 0
          };
        }

        productSales[productId].units += quantity;
        productSales[productId].revenue += price * quantity;
      });
    }
  });

  return Object.values(productSales)
    .sort((a, b) => b.units - a.units)
    .slice(0, 10);
}

function getCategoryRevenueBreakdown(orders) {
  const categoryRevenue = {};

  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const cat = item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'Other';
        const price = item.unitPrice || 0;
        const quantity = item.qty || 1;

        if (!categoryRevenue[cat]) {
          categoryRevenue[cat] = 0;
        }

        categoryRevenue[cat] += price * quantity;
      });
    }
  });

  const total = Object.values(categoryRevenue).reduce((sum, val) => sum + val, 0);

  return {
    categories: Object.entries(categoryRevenue).map(([name, revenue]) => ({
      name,
      revenue,
      percentage: total > 0 ? Math.round((revenue / total) * 100) : 0,
      color: CATEGORY_COLORS[name] || '#8A8D8A'
    })),
    total
  };
}

function InsightsTrendChart({ orders, mode }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!orders || orders.length === 0) {
    return <div className="empty-state">No sales data for this period</div>;
  }

  const dateMap = {};
  orders.forEach(order => {
    const d = new Date(order.orderDate);
    if (Number.isNaN(d.getTime())) return;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const key = d.toISOString().split('T')[0];
    if (!dateMap[key]) {
      dateMap[key] = { key, label, revenue: 0, orders: 0 };
    }
    dateMap[key].revenue += order.total || 0;
    dateMap[key].orders += 1;
  });

  const sortedKeys = Object.keys(dateMap).sort();
  if (sortedKeys.length === 0) {
    return <div className="empty-state">No sales data for this period</div>;
  }

  const chartData = sortedKeys.map(k => ({
    d: dateMap[k].label,
    v: mode === 'revenue' ? dateMap[k].revenue : dateMap[k].orders
  }));

  const padL = 50, padR = 20, padT = 15, padB = 35, w = 680, h = 260;
  const plotW = w - padL - padR, plotH = h - padT - padB;

  const maxVal = Math.max(...chartData.map(p => p.v), 0);
  const niceMax = maxVal > 0 ? (mode === 'revenue' ? (Math.ceil(maxVal / 1000) * 1000 || Math.ceil(maxVal)) : Math.ceil(maxVal)) : 10;
  const steps = 4;

  const count = chartData.length;
  const xFor = i => padL + (count > 1 ? (i / (count - 1)) * plotW : plotW / 2);
  const yFor = v => padT + plotH - (niceMax > 0 ? (v / niceMax) * plotH : 0);

  const pts = chartData.map((p, i) => [xFor(i), yFor(p.v)]);
  const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  const xStep = count > 30 ? Math.ceil(count / 6) : (count > 12 ? Math.ceil(count / 8) : (count > 6 ? 2 : 1));

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * w;
    let closestIdx = 0;
    let closestDist = Infinity;
    pts.forEach((p, i) => {
      const dist = Math.abs(p[0] - svgX);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });
    setHoverIndex(closestIdx);
  };

  const safeIndex = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < pts.length ? hoverIndex : null;
  const activePt = safeIndex !== null ? pts[safeIndex] : null;
  const activeData = safeIndex !== null ? chartData[safeIndex] : null;

  const valStr = activeData ? (
    mode === 'revenue'
      ? 'GHS ' + Math.round(activeData.v).toLocaleString('en-US')
      : Math.round(activeData.v).toLocaleString('en-US') + ' orders'
  ) : '';

  const leftPercent = activePt ? (activePt[0] / w) * 100 : 0;
  const topPercent = activePt ? (activePt[1] / h) * 100 : 0;
  const isNearTop = activePt ? activePt[1] < 50 : false;

  return (
    <div className="chartwrap" style={{ position: 'relative', width: '100%', overflowX: 'auto', minHeight: `${h}px` }}>
      <svg
        id="insightsChartSvg"
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {/* Y Gridlines and labels */}
        <g className="insights-gridlines">
          {Array.from({ length: steps + 1 }).map((_, i) => {
            const y = padT + plotH - (i / steps) * plotH;
            return (
              <line key={i} x1={padL} y1={y.toFixed(1)} x2={w - padR} y2={y.toFixed(1)} stroke="rgba(26,26,26,0.08)" strokeDasharray="3 3" />
            );
          })}
        </g>
        <g className="insights-ylabels">
          {Array.from({ length: steps + 1 }).map((_, i) => {
            const val = (i / steps) * niceMax;
            const y = padT + plotH - (i / steps) * plotH;
            const formatted = mode === 'revenue'
              ? (val >= 1000 ? `GHS ${(val / 1000).toFixed(1)}k` : `GHS ${Math.round(val).toLocaleString()}`)
              : Math.round(val).toLocaleString();
            return (
              <text key={i} x={padL - 10} y={(y + 4).toFixed(1)} textAnchor="end" fill="var(--text-muted, #7a7a7a)" fontSize="11" fontWeight="500">
                {formatted}
              </text>
            );
          })}
        </g>

        {/* Trend Line */}
        {linePath && <path className="line" d={linePath} fill="none" stroke="var(--chart-good, #5E9470)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {/* Hover Guide Line */}
        {activePt && (
          <line
            className="hoverline"
            x1={activePt[0].toFixed(1)}
            y1={padT}
            x2={activePt[0].toFixed(1)}
            y2={padT + plotH}
            stroke="rgba(26,26,26,0.22)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Dots */}
        <g className="dots">
          {pts.map((p, i) => (
            <circle
              key={i}
              className="dot"
              cx={p[0].toFixed(1)}
              cy={p[1].toFixed(1)}
              r={safeIndex === i ? 6 : 4}
              fill={safeIndex === i ? 'var(--chart-good, #5E9470)' : '#ffffff'}
              stroke="var(--chart-good, #5E9470)"
              strokeWidth="2"
              style={{ transition: 'r 0.15s ease, fill 0.15s ease' }}
            />
          ))}
        </g>

        {/* X Labels */}
        <g className="insights-xlabels">
          {chartData.map((p, i) => {
            if (i % xStep !== 0 && i !== count - 1) return null;
            return (
              <text key={i} className="xlabel" x={xFor(i).toFixed(1)} y={(h - 10).toFixed(1)} textAnchor="middle" fill="var(--text-muted, #7a7a7a)" fontSize="11" fontWeight="500">
                {p.d}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Floating Tooltip */}
      {activePt && activeData && (
        <div
          className="insights-tooltip"
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            background: '#1a1a1a',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '600',
            padding: '8px 12px',
            borderRadius: '10px',
            left: `${leftPercent}%`,
            top: isNearTop ? `calc(${topPercent}% + 15px)` : `calc(${topPercent}% - 10px)`,
            transform: isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            opacity: 1,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2 }}>
            {valStr}
          </div>
          <div style={{ fontSize: '10px', fontWeight: '400', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>
            {activeData.d}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [dateRange, setDateRange] = useState('all');
  const [chartMode, setChartMode] = useState('revenue');
  const [orders, setOrders] = useState(() => getCachedData('orders') || []);
  const [loading, setLoading] = useState(!getCachedData('orders'));

  // Load orders from cache/Supabase on mount
  useEffect(() => {
    async function loadOrders() {
      if (!isDataLoading('orders')) {
        setLoading(false);
      }
      
      try {
        const loadedOrders = await fetchOrders();
        setOrders(loadedOrders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        // Keep existing data on error
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = filterOrdersByDateRange(orders, dateRange);
  const stats = calculateInsightsStats(filteredOrders);
  const topProducts = getTopProductsByUnits(filteredOrders);
  const categoryBreakdown = getCategoryRevenueBreakdown(filteredOrders);

  // CSV Export
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Customer Name,Amount (GHS),Status,Date\n";
    filteredOrders.forEach(o => {
      csvContent += `"${o.id}","${o.customerName}",${o.total || 0},"${o.fulfillmentStatus}","${o.orderDate}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `insights_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container insights-mobile-page">
      <style>{`
        .insights-reference-shell {
          width: 100%;
          min-height: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 18px 14px 28px;
          background: #151515;
          box-sizing: border-box;
        }

        .insights-reference-card {
          width: min(100%, 456px);
          background: #e8e4df;
          border: 1px solid rgba(19, 19, 19, 0.08);
          border-radius: 24px;
          color: #171717;
          box-shadow: 0 22px 55px rgba(0, 0, 0, 0.18);
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }

        .insights-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 0;
        }

        .insights-header-icons {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-pill {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          border: 1px solid rgba(23, 23, 23, 0.25);
          background: rgba(255, 255, 255, 0.32);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .header-pill.menu {
          width: 46px;
          height: 38px;
          border-radius: 19px;
          background: rgba(255, 255, 255, 0.2);
        }

        .header-pill span {
          display: block;
          width: 16px;
          height: 2px;
          background: #171717;
          border-radius: 999px;
          position: relative;
        }

        .header-pill.menu span::before,
        .header-pill.menu span::after {
          content: '';
          position: absolute;
          left: 0;
          width: 16px;
          height: 2px;
          background: #171717;
          border-radius: 999px;
        }

        .header-pill.menu span::before { top: -5px; }
        .header-pill.menu span::after { top: 5px; }

        .brand-title {
          flex: 1;
          text-align: center;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: #171717;
          margin-top: 3px;
        }

        .badge-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .badge-wrap .notif {
          width: 18px;
          height: 18px;
          border: 1px solid rgba(23, 23, 23, 0.18);
          border-radius: 50%;
          position: relative;
          background: rgba(255, 255, 255, 0.22);
        }

        .badge-wrap .notif::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          transform: translate(-50%, -50%);
          border: 1.5px solid #171717;
          border-top: none;
          border-radius: 0 0 7px 7px;
        }

        .badge-wrap .notif::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 2px;
          width: 4px;
          height: 4px;
          background: #171717;
          border-radius: 50%;
          transform: translateX(-50%);
        }

        .badge-wrap .count {
          position: absolute;
          right: -5px;
          top: -5px;
          min-width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #3a6ae1;
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(232, 228, 223, 0.9);
        }

        .insights-body {
          padding: 14px 18px 18px;
        }

        .insights-date {
          margin-top: 10px;
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 600;
          color: rgba(23, 23, 23, 0.7);
        }

        .insights-title {
          margin: 18px 0 4px;
          font-size: clamp(30px, 3.2vw, 40px);
          line-height: 0.98;
          font-weight: 700;
          letter-spacing: -0.06em;
        }

        .insights-subtitle {
          margin: 0 0 18px;
          font-size: 12px;
          line-height: 1.4;
          color: rgba(23, 23, 23, 0.70);
          font-weight: 500;
          max-width: 330px;
        }

        .export-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          border: 1px solid rgba(23, 23, 23, 0.8);
          border-radius: 999px;
          background: transparent;
          color: #171717;
          padding: 10px 14px;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 700;
          margin: 0 auto 18px;
        }

        .period-tabs {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1px solid rgba(23, 23, 23, 0.2);
          padding-bottom: 10px;
          margin-bottom: 14px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: rgba(23, 23, 23, 0.52);
        }

        .period-tabs span { white-space: nowrap; }

        .period-tabs .active {
          color: #171717;
          position: relative;
        }

        .period-tabs .active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -11px;
          height: 2px;
          background: #171717;
          border-radius: 999px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0;
          border-bottom: 1px solid rgba(23, 23, 23, 0.2);
        }

        .kpi-card {
          padding: 10px 0 14px;
          min-height: 108px;
          border-top: 1px solid rgba(23, 23, 23, 0.2);
        }

        .kpi-card:nth-child(odd) {
          padding-right: 16px;
          border-right: 1px solid rgba(23, 23, 23, 0.2);
        }

        .kpi-card:nth-child(even) {
          padding-left: 16px;
        }

        .kpi-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          color: rgba(23, 23, 23, 0.62);
          margin-bottom: 10px;
          line-height: 1.3;
        }

        .kpi-value {
          margin: 0 0 6px;
          font-size: clamp(19px, 2.6vw, 26px);
          line-height: 1.08;
          letter-spacing: -0.05em;
          font-weight: 700;
        }

        .kpi-note {
          font-size: 11px;
          color: rgba(23, 23, 23, 0.7);
          line-height: 1.3;
        }

        .panel-section {
          padding-top: 16px;
          border-bottom: 1px solid rgba(23, 23, 23, 0.2);
          margin-bottom: 12px;
        }

        .panel-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .panel-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.04em;
        }

        .chart-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(23, 23, 23, 0.7);
        }

        .chart-toggle .active {
          color: #171717;
          border-bottom: 2px solid #171717;
          padding-bottom: 3px;
        }

        .chart-box {
          position: relative;
          height: 120px;
          margin-top: 8px;
          margin-bottom: 4px;
        }

        .chart-box svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .chart-box .y-label {
          font-size: 8px;
          fill: rgba(23, 23, 23, 0.8);
          font-weight: 500;
        }

        .chart-box .x-label {
          font-size: 8px;
          fill: rgba(23, 23, 23, 0.6);
          font-weight: 500;
        }

        .chart-box .line {
          fill: none;
          stroke: #6ea587;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .chart-box .area {
          fill: rgba(110, 165, 135, 0.16);
          stroke: none;
        }

        .chart-box .dot {
          fill: white;
          stroke: #6ea587;
          stroke-width: 2;
        }

        .category-list,
        .product-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .category-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 12px;
          font-weight: 600;
          color: #171717;
        }

        .category-name {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .category-bar {
          flex: 1;
          height: 6px;
          background: rgba(23, 23, 23, 0.09);
          border-radius: 999px;
          overflow: hidden;
          margin: 8px 0 0;
        }

        .category-fill {
          height: 100%;
          border-radius: 999px;
        }

        .swatch {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .product-list {
          margin-top: 6px;
        }

        .product-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 4px 0;
        }

        .product-rank {
          font-size: 12px;
          font-weight: 700;
          color: rgba(23, 23, 23, 0.7);
          width: 20px;
          flex-shrink: 0;
        }

        .product-name {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
        }

        .product-value {
          font-size: 12px;
          font-weight: 600;
          color: rgba(23, 23, 23, 0.9);
          white-space: nowrap;
        }

        @media (max-width: 420px) {
          .insights-reference-shell {
            padding-inline: 10px;
          }
          .insights-reference-card {
            border-radius: 18px;
          }
          .period-tabs {
            gap: 4px;
            font-size: 9px;
            letter-spacing: 0.08em;
          }
        }
      `}</style>

      <div className="page-header-row insights-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-group">
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}><span className="insights-desktop-title">Business Insights &amp; Analytics</span><span className="insights-mobile-title">Insights</span></h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Real-time sales performance, revenue breakdown, and customer analytics.</p>
        </div>
        <div className="header-actions">
          <button className="xp-pill insights-export-button" onClick={handleExportCSV} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {loading && <p className="insights-loading" role="status">Loading insights...</p>}

      <div className="xp-chips insights-period-tabs mobile-underline-tabs" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button type="button" className={`xp-chip mobile-underline-tab ${dateRange === 'week' ? 'xp-on active' : ''}`} onClick={() => setDateRange('week')}>This week</button>
        <button type="button" className={`xp-chip mobile-underline-tab ${dateRange === 'month' ? 'xp-on active' : ''}`} onClick={() => setDateRange('month')}>This month</button>
        <button type="button" className={`xp-chip mobile-underline-tab ${dateRange === '30days' ? 'xp-on active' : ''}`} onClick={() => setDateRange('30days')}>Last 30 days</button>
        <button type="button" className={`xp-chip mobile-underline-tab ${dateRange === 'all' ? 'xp-on active' : ''}`} onClick={() => setDateRange('all')}>All time</button>
      </div>

      <div className="summary-kpi-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">TOTAL REVENUE</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>{formatInsightCurrency(stats.totalRevenue)}</div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From all completed orders</span>
        </div>
        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">ORDERS</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>{stats.totalOrders}</div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In selected period</span>
        </div>
        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">AVG ORDER VALUE</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>{formatInsightCurrency(stats.avgOrderValue)}</div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per order average</span>
        </div>
        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">REPEAT CUSTOMER RATE</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>{stats.repeatRate}%</div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stats.repeatCount} repeat / {stats.newCount} new</span>
        </div>
      </div>

      <div className="insights-grid-2col" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div className="chart-card insights-trend-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <div className="chart-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="meta-label insights-desktop-section-label">{chartMode === 'revenue' ? 'REVENUE' : 'ORDERS'} TREND</span>
            <span className="insights-section-heading insights-mobile-section-label">{chartMode === 'revenue' ? 'Revenue trend' : 'Orders trend'}</span>
            <div className="insights-chart-tabs mobile-underline-tabs" style={{ display: 'flex', gap: '4px' }}>
              <button className={`xp-chip mobile-underline-tab ${chartMode === 'revenue' ? 'xp-on active' : ''}`} onClick={() => setChartMode('revenue')}>Revenue</button>
              <button className={`xp-chip mobile-underline-tab ${chartMode === 'orders' ? 'xp-on active' : ''}`} onClick={() => setChartMode('orders')}>Orders</button>
            </div>
          </div>
          <InsightsTrendChart orders={filteredOrders} mode={chartMode} />
        </div>

        <div className="chart-card insights-category-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <div className="chart-header-row" style={{ marginBottom: '16px' }}>
            <span className="meta-label insights-desktop-section-label">CATEGORY BREAKDOWN</span>
            <span className="insights-section-heading insights-mobile-section-label">Category breakdown</span>
          </div>
          {categoryBreakdown.total > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {categoryBreakdown.categories.map(cat => (
                <div key={cat.name} className="insights-category-breakdown-row" data-category={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="insights-category-marker" style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                      {cat.name}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatInsightCurrency(cat.revenue)} ({cat.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(26,26,26,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${cat.percentage}%`, height: '100%', background: cat.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No sales yet in this range</div>
          )}
        </div>
      </div>

      <div className="insights-grid-2col" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        <div className="chart-card insights-products-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label insights-desktop-section-label">TOP PRODUCTS</span>
          <span className="insights-section-heading insights-mobile-section-label">Top products</span>
          {topProducts.length > 0 ? (
            <div className="top-products-list" style={{ marginTop: '12px' }}>
              {topProducts.map((product, index) => (
                <div key={product.id} className="insights-product-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
                  <div className="insights-product-name" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '14px', width: '24px' }}>#{index + 1}</span>
                    <div>
                      <div className="insights-product-title" style={{ fontWeight: 600, fontSize: '14px' }}>{product.name}</div>
                      <div className="insights-product-revenue" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatInsightCurrency(product.revenue)}</div>
                    </div>
                  </div>
                  <div className="insights-product-metrics" style={{ textAlign: 'right' }}>
                    <div className="insights-product-units">
                      <div style={{ fontWeight: 700, fontSize: '15px', fontVariantNumeric: 'tabular-nums' }}>{product.units}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>units sold</div>
                    </div>
                    <span className="insights-product-mobile-summary">{product.units} sold · {formatInsightCurrency(product.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No sales yet in this range</div>
          )}
        </div>
      </div>
    </div>
  );
}
