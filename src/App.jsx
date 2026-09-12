import { useState, useEffect, lazy, Suspense } from 'react';
import Navigation from './components/Navigation';
import DrawerMenu from './components/DrawerMenu';
import SearchModal from './components/SearchModal';
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
import AdminAccess, { AdminLoadingFallback } from './admin/components/AdminAccess';
const AboutPage = lazy(() => import('./storefront/pages/AboutPage'));
const CareersPage = lazy(() => import('./storefront/pages/CareersPage'));
const CustomizePage = lazy(() => import('./storefront/pages/CustomizePage'));
const ServicesPage = lazy(() => import('./storefront/pages/ServicesPage'));
const GalleryPage = lazy(() => import('./storefront/pages/GalleryPage'));
const ShopPage = lazy(() => import('./storefront/pages/ShopPage'));
const InformationPage = lazy(() => import('./storefront/pages/InformationPage'));
const TrackOrderPage = lazy(() => import('./storefront/pages/TrackOrderPage'));
import { PORTFOLIO_SERIES } from './data/portfolioData';
import { styles } from './storefront/home/homeStyles';
import HomePage from './storefront/home/HomePage';

import PageMetadata from './site/PageMetadata';
import { pages, pageForPath } from './site/routes';

export default function App() { return <Suspense fallback={null}><SiteApp /></Suspense>; }
function SiteApp() {
  // Pre-fetch storefront lazy route chunks and admin dashboard chunk immediately on mount for instant navigation
  useEffect(() => {
    import('./components/AdminDashboard');
    import('./storefront/pages/AboutPage');
    import('./storefront/pages/CareersPage');
    import('./storefront/pages/CustomizePage');
    import('./storefront/pages/ServicesPage');
    import('./storefront/pages/GalleryPage');
    import('./storefront/pages/ShopPage');
    import('./storefront/pages/InformationPage');
    import('./storefront/pages/TrackOrderPage');
  }, []);

  const returningFromPayment = new URLSearchParams(window.location.search).get('payment') === 'return';
  const [adminMode, setAdminMode] = useState(() => /^\/admin(?:\/login)?\/?$/.test(window.location.pathname));

  useEffect(() => {
    if (adminMode) {
      import('./components/AdminDashboard');
    }
  }, [adminMode]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeTab, updateActiveTab] = useState(() => returningFromPayment ? 'shop' : pageForPath(window.location.pathname));
  const setActiveTab = tab => { updateActiveTab(tab); if (pages[tab] && window.location.pathname !== pages[tab][0]) window.history.pushState({}, '', pages[tab][0]); };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(returningFromPayment);
  const [wishlistRequested, setWishlistRequested] = useState(false);
  const [homeServiceOpen, setHomeServiceOpen] = useState(null);
  const [preferredService, setPreferredService] = useState(null);
  const [scrollIndicator, setScrollIndicator] = useState({ progress: 0, visible: false });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('gifting-factory-cart') || '[]');
      return Array.isArray(saved) ? saved.map(item => ({ ...item, quantity: item.quantity || 1 })) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('gifting-factory-wishlist') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? PORTFOLIO_SERIES.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev === PORTFOLIO_SERIES.length - 1 ? 0 : prev + 1));
  };

  // Subtle 3D Tilt effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 10;
      const y = (e.clientY / innerHeight - 0.5) * 10;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 760px)').matches) window.scrollTo({ top: 0, behavior: 'instant' });
      else document.querySelector('.home-scroll, .content-page')?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [activeTab]);

  useEffect(() => {
    let scrollNode;
    let resizeObserver;
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const updateIndicator = () => {
      if (!scrollNode) return;
      const available = mobile
        ? document.documentElement.scrollHeight - window.innerHeight
        : scrollNode.scrollHeight - scrollNode.clientHeight;
      const offset = mobile ? window.scrollY : scrollNode.scrollTop;
      setScrollIndicator({ progress: available > 0 ? offset / available : 0, visible: available > 8 });
    };
    const frame = window.requestAnimationFrame(() => {
      scrollNode = mobile ? window : document.querySelector('.home-scroll, .content-page');
      if (!scrollNode) return;
      scrollNode.addEventListener('scroll', updateIndicator, { passive: true });
      if (mobile) window.addEventListener('resize', updateIndicator, { passive: true });
      else {
        resizeObserver = new ResizeObserver(updateIndicator);
        resizeObserver.observe(scrollNode);
      }
      updateIndicator();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      scrollNode?.removeEventListener('scroll', updateIndicator);
      if (mobile) window.removeEventListener('resize', updateIndicator);
      resizeObserver?.disconnect();
    };
  }, [activeTab]);

  useEffect(() => { window.localStorage.setItem('gifting-factory-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.localStorage.setItem('gifting-factory-wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    if (!returningFromPayment) return;
    window.history.replaceState({}, '', window.location.pathname);
  }, [returningFromPayment]);

  useEffect(() => {
    const syncRoute = () => { setAdminMode(/^\/admin(?:\/login)?\/?$/.test(window.location.pathname)); updateActiveTab(pageForPath(window.location.pathname)); };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (activeTab !== 'home' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setCurrentSlideIndex(current => (current + 1) % PORTFOLIO_SERIES.length), 6500);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  const navigateStorefront = tab => { setCheckoutRequested(false); setWishlistRequested(false); if (tab === 'services') setPreferredService(null); setActiveTab(tab); };

  if (adminMode) {
    return (
      <>
        <PageMetadata admin />
        <Suspense fallback={<AdminLoadingFallback message="Loading staff workspace…" />}>
          <AdminAccess>
            {identity => <AdminDashboard staffIdentity={identity} onExit={() => { window.history.pushState({}, '', '/'); setAdminMode(false); }} />}
          </AdminAccess>
        </Suspense>
      </>
    );
  }

  if (activeTab === 'not-found') return <><PageMetadata page="not-found"/><main className="site-not-found"><p>404 · PAGE NOT FOUND</p><h1>Let’s find your way back.</h1><p>This page may have moved or the address may be incorrect.</p><a href="/">Return to the storefront</a></main></>;

  return (
    <div style={styles.appContainer} className="portfolio-page">
      <PageMetadata page={activeTab} />
      {/* Top Header Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={navigateStorefront}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenShop={() => navigateStorefront('shop')}
        onOpenCheckout={() => { setWishlistRequested(false); setActiveTab('shop'); setCheckoutRequested(true); }}
        onOpenWishlist={() => { setCheckoutRequested(false); setActiveTab('shop'); setWishlistRequested(true); }}
        onOpenServices={() => navigateStorefront('services')}
        onOpenGallery={() => setActiveTab('gallery')}
        cartCount={cartCount}
        wishlistCount={wishlist.length}
      />
      <div className={`page-scroll-indicator ${scrollIndicator.visible ? 'visible' : ''}`} aria-hidden="true"><span style={{ top: `${scrollIndicator.progress * 100}%`, transform: `translateY(-${scrollIndicator.progress * 100}%)` }} /></div>

      {/* Main Full-Screen Seamless Editorial Canvas */}
      {activeTab === 'home' && (
        <HomePage
          currentSlideIndex={currentSlideIndex}
          handlePrevSlide={handlePrevSlide}
          handleNextSlide={handleNextSlide}
          mousePos={mousePos}
          homeServiceOpen={homeServiceOpen}
          setHomeServiceOpen={setHomeServiceOpen}
          setPreferredService={setPreferredService}
          setActiveTab={setActiveTab}
          onNavigate={navigateStorefront}
        />
      )}

      {activeTab === 'about' && <AboutPage key="about" onNavigate={navigateStorefront} />}
      {activeTab === 'services' && <ServicesPage key={`services-${preferredService || 'all'}`} initialService={preferredService} onNavigate={navigateStorefront} />}
      {activeTab === 'gallery' && <GalleryPage key="gallery" onNavigate={navigateStorefront} />}
      {activeTab === 'shop' && <ShopPage key="shop" onNavigate={navigateStorefront} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} openCheckout={checkoutRequested} onCheckoutHandled={() => setCheckoutRequested(false)} openWishlist={wishlistRequested} onWishlistHandled={() => setWishlistRequested(false)} />}
      {activeTab === 'customize' && <CustomizePage key="customize" onNavigate={navigateStorefront} />}
      {activeTab === 'careers' && <CareersPage key="careers" onNavigate={navigateStorefront} />}
      {activeTab === 'track' && <TrackOrderPage key="track" onNavigate={navigateStorefront} />}
      {activeTab === 'delivery' && <InformationPage key="delivery" type="delivery" onNavigate={navigateStorefront} />}
      {activeTab === 'policy' && <InformationPage key="policy" type="policy" onNavigate={navigateStorefront} />}

      {/* Modals and Side Drawers */}
      <DrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentSlideIndex={currentSlideIndex}
        onSelectSlide={(idx) => { setCurrentSlideIndex(idx); setActiveTab('home'); }}
        onNavigate={navigateStorefront}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectSlide={(idx) => { setCurrentSlideIndex(idx); setActiveTab('home'); }}
        onNavigate={navigateStorefront}
      />

    </div>
  );
}
