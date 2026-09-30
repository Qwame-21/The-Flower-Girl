import { useEffect } from 'react';
import './index.css';
import './App.css';
import DashboardApp from './DashboardApp';
import { DashboardProvider } from './contexts/DashboardContext';

export default function DashboardEntry({ onSignOut }) {
  useEffect(() => {
    // Inject Google Fonts
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Inject favicon
    const faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    faviconLink.type = 'image/svg+xml';
    faviconLink.href = '/favicon.svg';
    document.head.appendChild(faviconLink);

    // Inject meta description
    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = 'X-A12 Master Baseline Admin Dashboard.';
    document.head.appendChild(metaDesc);

    // Cleanup function to remove injected elements
    return () => {
      document.head.removeChild(preconnect1);
      document.head.removeChild(preconnect2);
      document.head.removeChild(fontLink);
      document.head.removeChild(faviconLink);
      document.head.removeChild(metaDesc);
    };
  }, []);

  return (
    <div className="dashboard-viewport">
      <DashboardProvider onSignOut={onSignOut}>
        <DashboardApp />
      </DashboardProvider>
    </div>
  );
}
