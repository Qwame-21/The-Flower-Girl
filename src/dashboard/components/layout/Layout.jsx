import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIdleTimer } from '../../lib/idle';

export default function Layout() {
  const [isLocked, setIsLocked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { warningShown, secondsLeft, resetActivity } = useIdleTimer();

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
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        {/* Mobile Backdrop Overlay */}
        <div
          className={`mobile-nav-backdrop ${isMobileOpen ? 'active' : ''}`}
          id="mobileBackdrop"
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Main Admin Content Area with Horizontal Top Title Bar */}
        <section className="admin-main-canvas" id="adminCanvas">
          <Header onToggleMobile={() => setIsMobileOpen((prev) => !prev)} />

          {/* Full-Width Extendable Content Body (Scroll Container) */}
          <div className="extendable-content-body" id="extendableContentBody">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
