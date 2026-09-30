import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isLocked, setIsLocked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="viewport-frame" id="app">
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
