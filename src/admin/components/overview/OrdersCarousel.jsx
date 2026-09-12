import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Package, ArrowUpRight, Gift } from 'lucide-react';
import { ORDER_LABELS } from '../../utils/adminMappers';

const money = val =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  }).format(val || 0);

export default function OrdersCarousel({ orders = [], onInspect }) {
  const scrollRef = useRef(null);

  const scroll = direction => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = direction === 'left' ? -320 : 320;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="ov-sui-carousel-section" aria-label="Recent order previews">
      <header className="ov-sui-section-header">
        <div>
          <span className="ov-sui-tag">RECENT ORDERS STRIP // 02</span>
          <h2 className="ov-sui-section-title">Active Order Previews</h2>
        </div>

        <div className="ov-sui-carousel-controls">
          <button
            className="ov-sui-nav-btn"
            onClick={() => scroll('left')}
            aria-label="Scroll carousel left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="ov-sui-nav-btn"
            onClick={() => scroll('right')}
            aria-label="Scroll carousel right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {orders.length ? (
        <div className="ov-sui-carousel-track" ref={scrollRef}>
          {orders.map((order, idx) => (
            <button
              key={order.id || idx}
              className="ov-sui-carousel-card"
              onClick={() => onInspect(order.tracking || 'Order detail', [order])}
            >
              <div className="ov-sui-card-thumb">
                <div className="ov-sui-thumb-inner">
                  <Gift size={24} />
                  <span className="ov-sui-thumb-num">#{idx + 1}</span>
                </div>
              </div>

              <div className="ov-sui-card-content">
                <div className="ov-sui-card-ref-row">
                  <strong className="ov-sui-order-ref">{order.tracking || 'Order'}</strong>
                  <ArrowUpRight size={14} className="ov-sui-arrow-icon" />
                </div>
                <p className="ov-sui-customer-name">{order.customer || 'Customer'}</p>
                <div className="ov-sui-card-footer">
                  <span className="ov-sui-status-tag">
                    {ORDER_LABELS[order.status] || order.status || 'Active'}
                  </span>
                  {order.total && <span className="ov-sui-order-amt">{money(order.total)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="ov-sui-empty-carousel">
          <Package size={24} />
          <span>No order previews available in this view.</span>
        </div>
      )}
    </section>
  );
}
