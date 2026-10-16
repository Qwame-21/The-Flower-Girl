import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchRequests, getCachedData, subscribeToCache } from '../../data/dataCache';
import { getAppSettings } from '../../data/settingsAdapter';
import { formatNumber } from '../../lib/ordersModel';
import { supabase } from '../../../config/supabase';

export default function Sidebar({
  isLocked,
  onToggleLock,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  isMobileOpen,
  onCloseMobile,
  onRequestSignOut,
  mobileMenuRef
}) {
  const sideNavClass = `side-navigation ${
    isLocked || isHovered ? 'expanded' : 'collapsed'
  } ${isMobileOpen ? 'mobile-open' : ''}`;

  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [stockAlertsCount, setStockAlertsCount] = useState(0);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);

  // Compute badge counts from cached data
  useEffect(() => {
    const updateCounts = () => {
      const orders = getCachedData('orders') || [];
      const products = getCachedData('products') || [];
      const requests = getCachedData('requests') || [];
      const settings = getAppSettings();

      // Active orders: pending payment or processing (not delivered/cancelled)
      const activeOrders = orders.filter(o =>
        o.paymentStatus === 'pending' ||
        (o.fulfillmentStatus !== 'delivered' && o.fulfillmentStatus !== 'cancelled')
      ).length;

      // Low stock: products at or below their low_stock_threshold (only if alerts enabled)
      const lowStockAlertsEnabled = settings?.inventory?.lowStockAlerts !== false;
      const lowStock = lowStockAlertsEnabled ? products.filter(p => {
        const threshold = p.low_stock_threshold || 5;
        return p.stock <= threshold;
      }).length : 0;

      const activeRequests = requests.filter(r => !['converted', 'closed'].includes(r.status)).length;

      setActiveOrdersCount(activeOrders);
      setStockAlertsCount(lowStock);
      setActiveRequestsCount(activeRequests);
    };

    updateCounts();

    // Subscribe to cache updates
    const unsubscribe = subscribeToCache(updateCounts);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    fetchRequests(true);
    const channel = supabase
      .channel('sidebar-request-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_requests' }, () => {
        fetchRequests(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside
      className={sideNavClass}
      id="sideNav"
      ref={mobileMenuRef}
      role={isMobileOpen ? 'dialog' : undefined}
      aria-modal={isMobileOpen ? 'true' : undefined}
      aria-labelledby={isMobileOpen ? 'mobileMenuTitle' : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
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

          <h2 className="menu-header-title" id="mobileMenuTitle">
            {isMobileOpen ? 'MENU' : 'Menu'}
          </h2>
          <button
            type="button"
            className="mobile-drawer-close"
            aria-label="Close navigation menu"
            onClick={onCloseMobile}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Scroll Body (12 Approved Pages in 3 Groups) */}
        <nav className="menu-body" aria-label="Admin navigation">
          {/* Group 1: Commerce & Operations */}
          <div className="menu-group" data-mobile-group="workspace">
            <span className="meta-label group-header-label">Commerce & Operations</span>
            <span
              className="mobile-menu-section-title"
              role="heading"
              aria-level="3"
              style={{ display: 'none' }}
            >
              WORKSPACE
            </span>

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
                    title={`${formatNumber(activeOrdersCount)} active ${activeOrdersCount === 1 ? 'order' : 'orders'}`}
                    aria-label={`${formatNumber(activeOrdersCount)} active ${activeOrdersCount === 1 ? 'order' : 'orders'}`}
                    style={{ display: 'flex' }}
                  >
                    {formatNumber(activeOrdersCount)}
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
                    title={`${formatNumber(stockAlertsCount)} low stock products`}
                    style={{ display: 'flex' }}
                  >
                    {formatNumber(stockAlertsCount)}
                  </span>
                )}
              </div>
              <span className="menu-item-label">Products</span>
            </NavLink>

            {/* 06. Customization */}
            <NavLink
              to="/customization"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Customization"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <span className="menu-item-label">Customization</span>
            </NavLink>

            {/* 07. Shop/POS */}
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
          <div className="menu-group" data-mobile-group="catalog">
            <span className="meta-label group-header-label">Analytics & Audience</span>
            <span
              className="mobile-menu-section-title"
              role="heading"
              aria-level="3"
              style={{ display: 'none' }}
            >
              CATALOG
            </span>

            {/* 08. Insights */}
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

            {/* 09. Customers */}
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

            {/* 10. Reviews */}
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

            {/* 11. Requests */}
            <NavLink
              to="/requests"
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              data-page="Requests"
              onClick={onCloseMobile}
            >
              <div className="menu-item-icon-wrapper">
                {/* Gift-box icon — thin line style matching sidebar */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="13" rx="1" />
                  <path d="M12 8V21" />
                  <path d="M3 13h18" />
                  <path d="M8 8c0-2 1.5-4 4-4s4 2 4 4" />
                  <path d="M8 8c-2 0-4-1-4-3 0-1.5 1.5-2 3-1L12 8" />
                  <path d="M16 8c2 0 4-1 4-3 0-1.5-1.5-2-3-1L12 8" />
                </svg>
                {activeRequestsCount > 0 && (
                  <span
                    className="nav-status-badge"
                    id="requestsStatusBadge"
                    title={`${formatNumber(activeRequestsCount)} active ${activeRequestsCount === 1 ? 'request' : 'requests'}`}
                    aria-label={`${formatNumber(activeRequestsCount)} active ${activeRequestsCount === 1 ? 'request' : 'requests'}`}
                    style={{ display: 'flex' }}
                  >
                    {formatNumber(activeRequestsCount)}
                  </span>
                )}
              </div>
              <span className="menu-item-label">Requests</span>
            </NavLink>
          </div>

          <div className="group-divider"></div>

          {/* Group 3: Platform & Utilities */}
          <div className="menu-group" data-mobile-group="people">
            <span className="meta-label group-header-label">Platform & Utilities</span>
            <span
              className="mobile-menu-section-title"
              role="heading"
              aria-level="3"
              style={{ display: 'none' }}
            >
              PEOPLE & INSIGHTS
            </span>

            {/* 12. Careers */}
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

            {/* 13. Gallery */}
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

            {/* 14. Settings */}
            <NavLink
              to="/settings"
              className={({ isActive }) => `menu-item desktop-settings-item ${isActive ? 'active' : ''}`}
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
          <NavLink
            to="/settings"
            className={({ isActive }) => `menu-item mobile-settings-item ${isActive ? 'active' : ''}`}
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
          <button
            type="button"
            className="menu-item mobile-sign-out"
            onClick={() => {
              onCloseMobile();
              onRequestSignOut();
            }}
          >
            <div className="menu-item-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className="menu-item-label">Sign out</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
