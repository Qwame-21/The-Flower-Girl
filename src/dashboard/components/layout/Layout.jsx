import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ToastContainer';
import { useIdleTimer } from '../../lib/idle';
import AdminErrorBoundary from '../ErrorBoundary';

export default function Layout() {
  const location = useLocation();
  const [isLocked, setIsLocked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState({ open: false, pathname: location.pathname });
  const isMobileOpen = mobileDrawer.open && mobileDrawer.pathname === location.pathname;
  const closeMobileDrawer = () => setMobileDrawer({ open: false, pathname: location.pathname });
  const { warningShown, secondsLeft, resetActivity } = useIdleTimer();

  // Close mobile drawer on Escape key press
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileDrawer({ open: false, pathname: location.pathname });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, location.pathname]);

  useEffect(() => {
    if (!isMobileOpen || !window.matchMedia('(max-width: 767px)').matches) return undefined;

    const scrollY = window.scrollY;
    const bodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width
    };
    const bodyOverflow = {
      value: document.body.style.getPropertyValue('overflow'),
      priority: document.body.style.getPropertyPriority('overflow')
    };
    const rootOverflow = {
      value: document.documentElement.style.getPropertyValue('overflow'),
      priority: document.documentElement.style.getPropertyPriority('overflow')
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');

    return () => {
      Object.assign(document.body.style, bodyStyles);
      document.body.style.setProperty('overflow', bodyOverflow.value, bodyOverflow.priority);
      document.documentElement.style.setProperty('overflow', rootOverflow.value, rootOverflow.priority);
      window.scrollTo(0, scrollY);
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
        />

        {/* Mobile Backdrop Overlay */}
        <div
          className={`mobile-nav-backdrop ${isMobileOpen ? 'active' : ''}`}
          id="mobileBackdrop"
          onClick={closeMobileDrawer}
        />

        {/* Main Admin Content Area with Horizontal Top Title Bar */}
        <section className="admin-main-canvas" id="adminCanvas">
          <Header onToggleMobile={() => setMobileDrawer({ open: !isMobileOpen, pathname: location.pathname })} />

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
