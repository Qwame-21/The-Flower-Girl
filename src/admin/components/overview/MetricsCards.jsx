import { Wallet, Package, Truck, MessageSquareText, TrendingUp, AlertTriangle } from 'lucide-react';

const money = val =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

export default function MetricsCards({ data, activeTab, onInspect }) {
  const cards = [
    {
      index: '01',
      title: 'REVENUE SNAPSHOT',
      value: money(data.revenue),
      subtext: data.paid.length
        ? `${data.paid.length} confirmed paid ${data.paid.length === 1 ? 'order' : 'orders'}`
        : 'No payments in this period',
      icon: Wallet,
      type: 'revenue',
      onClick: () => onInspect('Revenue breakdown', data.paid),
    },
    {
      index: '02',
      title: 'PENDING FULFILLMENT',
      value: `${data.pending.length} Orders`,
      subtext: data.ready.length ? `${data.ready.length} ready for dispatch` : 'All open orders',
      icon: Package,
      type: 'pending',
      onClick: () => onInspect('Pending orders', data.pending),
    },
    {
      index: '03',
      title: 'DELIVERY ALERTS',
      value: `${data.overdue.length} Overdue`,
      subtext: data.overdue.length ? 'Requires delivery follow-up' : 'All delivery estimates on time',
      icon: Truck,
      type: 'overdue',
      isWarning: data.overdue.length > 0,
      onClick: () => onInspect('Overdue deliveries', data.overdue),
    },
    {
      index: '04',
      title: 'QUOTES & BRIEFS',
      value: `${data.quotes.length} Awaiting Quote`,
      subtext: 'Open custom gift requests',
      icon: MessageSquareText,
      type: 'quotes',
      onClick: () => onInspect('Requests awaiting a quote', data.quotes),
    },
  ];

  return (
    <div className="ov-sui-metrics-grid">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <button
            key={card.index}
            className={`ov-sui-metric-card ${card.isWarning ? 'is-warning-card' : ''}`}
            onClick={card.onClick}
          >
            <div className="ov-sui-card-top">
              <span className="ov-sui-card-index">{card.index}</span>
              <span className="ov-sui-card-tag">{card.title}</span>
              <Icon size={16} className="ov-sui-card-icon" />
            </div>

            <div className="ov-sui-card-val-wrap">
              <strong className="ov-sui-card-value">{card.value}</strong>
            </div>

            <div className="ov-sui-card-bottom">
              <span className="ov-sui-card-subtext">{card.subtext}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
