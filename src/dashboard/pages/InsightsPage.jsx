import { useState, useEffect } from 'react';
import { formatGHS } from '../lib/ordersModel';
import { listOrders } from '../data/orders';

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
    const orderDate = new Date(order.orderDate || Date.now());
    return orderDate >= startDate && orderDate <= now;
  });
}

function calculateInsightsStats(orders) {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
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
    const d = new Date(order.orderDate || Date.now());
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
  const areaPath = linePath ? linePath + ` L${pts[pts.length - 1][0].toFixed(1)},${(padT + plotH).toFixed(1)} L${pts[0][0].toFixed(1)},${(padT + plotH).toFixed(1)} Z` : '';

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
    <div className="chartwrap" style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg
        id="insightsChartSvg"
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="insightsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-good, #5E9470)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--chart-good, #5E9470)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

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

        {/* Area & Line Path */}
        {areaPath && <path className="area" d={areaPath} fill="url(#insightsGrad)" />}
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
  const [orders, setOrders] = useState([]);
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
    <div className="page-container" style={{ padding: '24px 32px' }}>
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-group">
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>Business Insights & Analytics</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Real-time sales performance, revenue breakdown, and customer analytics.</p>
        </div>
        <div className="header-actions">
          <button className="xp-pill" onClick={handleExportCSV} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Filter Pills */}
      <div className="xp-chips" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button type="button" className={`xp-chip ${dateRange === 'week' ? 'xp-on' : ''}`} onClick={() => setDateRange('week')}>This week</button>
        <button type="button" className={`xp-chip ${dateRange === 'month' ? 'xp-on' : ''}`} onClick={() => setDateRange('month')}>This month</button>
        <button type="button" className={`xp-chip ${dateRange === '30days' ? 'xp-on' : ''}`} onClick={() => setDateRange('30days')}>Last 30 days</button>
        <button type="button" className={`xp-chip ${dateRange === 'all' ? 'xp-on' : ''}`} onClick={() => setDateRange('all')}>All time</button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="summary-kpi-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">TOTAL REVENUE</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>
            {formatGHS(stats.totalRevenue)}
          </div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From all completed orders</span>
        </div>

        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">ORDERS</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>
            {stats.totalOrders}
          </div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In selected period</span>
        </div>

        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">AVG ORDER VALUE</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>
            {formatGHS(stats.avgOrderValue)}
          </div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per order average</span>
        </div>

        <div className="kpi-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">REPEAT CUSTOMER RATE</span>
          <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>
            {stats.repeatRate}%
          </div>
          <span className="kpi-trend" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {stats.repeatCount} repeat / {stats.newCount} new
          </span>
        </div>
      </div>

      <div className="insights-grid-2col" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Revenue/Orders Chart */}
        <div className="chart-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <div className="chart-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="meta-label">{chartMode === 'revenue' ? 'REVENUE' : 'ORDERS'} TREND</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className={`xp-chip ${chartMode === 'revenue' ? 'xp-on' : ''}`} onClick={() => setChartMode('revenue')}>Revenue</button>
              <button className={`xp-chip ${chartMode === 'orders' ? 'xp-on' : ''}`} onClick={() => setChartMode('orders')}>Orders</button>
            </div>
          </div>
          <InsightsTrendChart orders={filteredOrders} mode={chartMode} />
        </div>

        {/* Category Breakdown */}
        <div className="chart-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <div className="chart-header-row" style={{ marginBottom: '16px' }}>
            <span className="meta-label">CATEGORY BREAKDOWN</span>
          </div>
          {categoryBreakdown.total > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {categoryBreakdown.categories.map(cat => (
                <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }}></span>
                      {cat.name}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatGHS(cat.revenue)} ({cat.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(26,26,26,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${cat.percentage}%`, height: '100%', background: cat.color, borderRadius: '3px' }}></div>
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
        {/* Top Selling Products */}
        <div className="chart-card" style={{ background: 'var(--card-bg, #f2f1ef)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <span className="meta-label">TOP PRODUCTS</span>
          {topProducts.length > 0 ? (
            <div className="top-products-list" style={{ marginTop: '12px' }}>
              {topProducts.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '14px', width: '24px' }}>#{idx + 1}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatGHS(p.revenue)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', fontVariantNumeric: 'tabular-nums' }}>{p.units}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>units sold</div>
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
