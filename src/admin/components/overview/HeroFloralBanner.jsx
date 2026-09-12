import floralSrc from '../../assets/floral_corner.png';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export default function HeroFloralBanner({ totalOrders = 0, revenueFormatted = 'GHS 0.00' }) {
  return (
    <div className="ov-sui-hero-banner">
      <div className="ov-sui-hero-content">
        <div className="ov-sui-hero-tag">
          <Sparkles size={14} />
          <span>EDITORIAL SPOTLIGHT</span>
        </div>

        <h2 className="ov-sui-hero-title">The Gifting Factory</h2>
        <p className="ov-sui-hero-desc">
          Crafted with care in Accra. Every gift order is tailored for a memorable experience.
        </p>

        <div className="ov-sui-hero-stats">
          <div className="ov-sui-hero-stat">
            <small>TOTAL ORDERS</small>
            <strong>{totalOrders}</strong>
          </div>
          <div className="ov-sui-hero-divider" />
          <div className="ov-sui-hero-stat">
            <small>CONFIRMED REVENUE</small>
            <strong>{revenueFormatted}</strong>
          </div>
        </div>
      </div>

      <div className="ov-sui-hero-art">
        <img
          src={floralSrc}
          alt=""
          className="ov-sui-hero-flower"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
