import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getAttentionOrders, getActiveStockAlerts } from '../../lib/ordersModel';

export default function Sidebar({
  isLocked,
  onToggleLock,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  isMobileOpen,
  onCloseMobile
}) {
  const sideNavClass = `side-navigation ${
    isLocked || isHovered ? 'expanded' : 'collapsed'
  } ${isMobileOpen ? 'mobile-open' : ''}`;

  const [activeOrdersCount, setActiveOrdersCount] = useState(() => getAttentionOrders().length);
  const [stockAlertsCount, setStockAlertsCount] = useState(() => getActiveStockAlerts().length);

  useEffect(() => {
    const handleUpdate = () => {
      setActiveOrdersCount(getAttentionOrders().length);
      setStockAlertsCount(getActiveStockAlerts().length);
    };
    window.addEventListener('xa12:orders-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('xa12:orders-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <aside className={sideNavClass} id="sideNav" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="side-nav-inner">
        {/* Side Nav Header with Lock Icon */}
        <div className="menu-header">
          <button
            className={`lock-icon-btn ${isLocked ? 'locked' : ''}`}
            id="lockCapsuleBtn"
            title={
              isLocked
                ? 'Unlock Menu (Dynamic Hover Expansion)'
                : 'Lock Menu Open (Permanent Expansion)'
            }
            aria-label="Toggle Menu Lock"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
          >
            <svg
              className="padlock-svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="11" width="16" height="11" rx="2" ry="2" className="padlock-body" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" className="padlock-shackle" />
            </svg>
            <span className="meta-label lock-status-text" id="lockStatusText">
              {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </span>
          </button>

          <h2 className="menu-header-title">Menu</h2>
        </div>

        {/* Menu Scroll Body (12 Approved Pages in 3 Groups) */}
        <div className="menu-body">
          {/* Group 1: Commerce & Operations */}
          <div className="menu-group">
            <span className="meta-label group-header-label">Commerce & Operations</span>

            {/* 01. Overview */}
            <NavLink
              to="/overview"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Overview"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <span className="menu-item-label">Overview</span>
            </NavLink>

            {/* 02. Orders */}
            <NavLink
              to="/orders"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Orders"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {activeOrdersCount > 0 && (
                  <span
                    className="nav-status-badge"
                    id="ordersStatusBadge"
                    title={`${activeOrdersCount} active ${activeOrdersCount === 1 ? 'order' : 'orders'}`}
                    aria-label={`${activeOrdersCount} active ${activeOrdersCount === 1 ? 'order' : 'orders'}`}
                    style={{ display: 'flex' }}
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </div>
              <span className="menu-item-label">Orders</span>
            </NavLink>

            {/* 03. Log */}
            <NavLink
              to="/log"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Log"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <span className="menu-item-label">Log</span>
            </NavLink>

            {/* 05. Products */}
            <NavLink
              to="/products"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Products"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                {stockAlertsCount > 0 && (
                  <span
                    className="nav-status-badge"
                    id="productsStatusBadge"
                    title={`${stockAlertsCount} low stock products`}
                    style={{ display: 'flex' }}
                  >
                    {stockAlertsCount}
                  </span>
                )}
              </div>
              <span className="menu-item-label">Products</span>
            </NavLink>

            {/* 06. Shop/POS */}
            <NavLink
              to="/shop-pos"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Shop/POS"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <span className="menu-item-label">Shop/POS</span>
            </NavLink>
          </div>

          <div className="group-divider"></div>

          {/* Group 2: Analytics & Audience */}
          <div className="menu-group">
            <span className="meta-label group-header-label">Analytics & Audience</span>

            {/* 07. Insights */}
            <NavLink
              to="/insights"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Insights"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className="menu-item-label">Insights</span>
            </NavLink>

            {/* 08. Customers */}
            <NavLink
              to="/customers"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Customers"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="menu-item-label">Customers</span>
            </NavLink>

            {/* 09. Reviews */}
            <NavLink
              to="/reviews"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Reviews"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span className="menu-item-label">Reviews</span>
            </NavLink>

            {/* 10. Requests */}
            <NavLink
              to="/requests"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Requests"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
              </div>
              <span className="menu-item-label">Requests</span>
            </NavLink>
          </div>

          <div className="group-divider"></div>

          {/* Group 3: Platform & Utilities */}
          <div className="menu-group">
            <span className="meta-label group-header-label">Platform & Utilities</span>

            {/* 11. Careers */}
            <NavLink
              to="/careers"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Careers"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <span className="menu-item-label">Careers</span>
            </NavLink>

            {/* 12. Gallery */}
            <NavLink
              to="/gallery"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Gallery"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="20" height="20" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <span className="menu-item-label">Gallery</span>
            </NavLink>

            {/* 13. Settings */}
            <NavLink
              to="/settings"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Settings"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <span className="menu-item-label">Settings</span>
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
