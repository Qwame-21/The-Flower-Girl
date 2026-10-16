import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ToastContainer';
import { useIdleTimer } from '../../lib/idle';
import AdminErrorBoundary from '../ErrorBoundary';
import { useDashboard } from '../../contexts/DashboardContext';

export default function Layout() {
  const location = useLocation();
  const { requestSignOut } = useDashboard();
  const mobileMenuRef = useRef(null);
  const wasMobileMenuOpen = useRef(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState({ open: false, pathname: location.pathname });
  const isMobileOpen = mobileDrawer.open && mobileDrawer.pathname === location.pathname;
  const closeMobileDrawer = useCallback(
    () => setMobileDrawer({ open: false, pathname: location.pathname }),
    [location.pathname]
  );
  const { warningShown, secondsLeft, resetActivity } = useIdleTimer();

  // Keep keyboard focus inside the mobile navigation while it is open.
  useEffect(() => {
    if (!isMobileOpen) {
      if (wasMobileMenuOpen.current) {
        document.getElementById('mobileMenuBtn')?.focus();
        wasMobileMenuOpen.current = false;
      }
      return undefined;
    }

    wasMobileMenuOpen.current = true;
    const dialog = mobileMenuRef.current;
    const closeButton = dialog?.querySelector('.mobile-drawer-close');
    const menuBody = dialog?.querySelector('.menu-body');
    if (menuBody) menuBody.scrollTop = 0;
    closeButton?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMobileDrawer();
        return;
      }

      if (e.key !== 'Tab' || !dialog) return;
      const focusableElements = Array.from(
        dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')
      )
        .filter((element) => element.getClientRects().length > 0)
        .sort((first, second) => {
          const getOrder = (element) => {
            if (element === closeButton) return -1;
            if (element.matches('.menu-item[data-page]')) {
              return Number.parseInt(getComputedStyle(element).order, 10);
            }
            return 100;
          };
          return getOrder(first) - getOrder(second);
        });
      const activeIndex = focusableElements.indexOf(document.activeElement);
      if (focusableElements.length === 0) return;

      e.preventDefault();
      const nextIndex = activeIndex === -1
        ? (e.shiftKey ? focusableElements.length - 1 : 0)
        : (activeIndex + (e.shiftKey ? -1 : 1) + focusableElements.length) % focusableElements.length;
      focusableElements[nextIndex].focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', closeMobileDrawer);
    window.addEventListener('hashchange', closeMobileDrawer);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', closeMobileDrawer);
      window.removeEventListener('hashchange', closeMobileDrawer);
    };
  }, [closeMobileDrawer, isMobileOpen, location.pathname]);

  useEffect(() => {
    if (!isMobileOpen || !window.matchMedia('(max-width: 767px)').matches) return undefined;

    const scrollY = window.scrollY;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const bodyPaddingRight = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    const bodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
      overflow: document.body.style.overflow,
      overscrollBehavior: document.body.style.overscrollBehavior
    };
    const rootStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior
    };

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overscroll-behavior', 'contain', 'important');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('overscroll-behavior', 'contain', 'important');

    return () => {
      Object.assign(document.body.style, bodyStyles);
      Object.assign(document.documentElement.style, rootStyles);
      document.body.style.setProperty('overflow', bodyStyles.overflow, 'important');
      document.body.style.setProperty('overscroll-behavior', bodyStyles.overscrollBehavior, 'important');
      document.documentElement.style.setProperty('overflow', rootStyles.overflow, 'important');
      document.documentElement.style.setProperty('overscroll-behavior', rootStyles.overscrollBehavior, 'important');
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    };
  }, [isMobileOpen]);

  return (
    <div className="viewport-frame" id="app">
      {warningShown && (
        <div
          className="idle-warning-banner"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderBottom: '1px solid #ffeeba',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          <span>You'll be signed out in {secondsLeft} s due to inactivity</span>
          <button
            onClick={resetActivity}
            style={{
              padding: '4px 12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#856404',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Stay signed in
          </button>
        </div>
      )}
      <main className="content-container">
        {/* Extended Vertical Side Navigation */}
        <Sidebar
          isLocked={isLocked}
          onToggleLock={() => setIsLocked((prev) => !prev)}
          isHovered={isHovered}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={closeMobileDrawer}
          onRequestSignOut={requestSignOut}
          mobileMenuRef={mobileMenuRef}
        />

        {/* Main Admin Content Area with Horizontal Top Title Bar */}
        <section
          className="admin-main-canvas"
          id="adminCanvas"
          aria-hidden={isMobileOpen ? 'true' : undefined}
        >
          <Header
            isMobileMenuOpen={isMobileOpen}
            onRequestSignOut={requestSignOut}
            onToggleMobile={() => setMobileDrawer({ open: !isMobileOpen, pathname: location.pathname })}
          />

          {/* Full-Width Extendable Content Body (Scroll Container) */}
          <div className="extendable-content-body" id="extendableContentBody">
            <AdminErrorBoundary>
              <Outlet />
            </AdminErrorBoundary>
          </div>
        </section>
      </main>
      <ToastContainer />
    </div>
  );
}
