import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import DrawerMenu from './components/DrawerMenu';
import SearchModal from './components/SearchModal';
import AdminDashboard from './components/AdminDashboard';
import { AboutPage, CareersPage, CustomizePage, ServicesPage, GalleryPage, ShopPage, SiteFooter, InformationPage, TrackOrderPage } from './components/ContentPages';
import { PORTFOLIO_SERIES } from './data/portfolioData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const [adminMode, setAdminMode] = useState(() => window.location.pathname === '/admin');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const [wishlistRequested, setWishlistRequested] = useState(false);
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

  const currentSlide = PORTFOLIO_SERIES[currentSlideIndex];

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
      document.querySelector('.home-scroll, .content-page')?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }, [activeTab]);

  useEffect(() => {
    let scrollNode;
    let resizeObserver;
    const updateIndicator = () => {
      if (!scrollNode) return;
      const available = scrollNode.scrollHeight - scrollNode.clientHeight;
      setScrollIndicator({ progress: available > 0 ? scrollNode.scrollTop / available : 0, visible: available > 8 });
    };
    const frame = window.requestAnimationFrame(() => {
      scrollNode = document.querySelector('.home-scroll, .content-page');
      if (!scrollNode) return;
      scrollNode.addEventListener('scroll', updateIndicator, { passive: true });
      resizeObserver = new ResizeObserver(updateIndicator);
      resizeObserver.observe(scrollNode);
      updateIndicator();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      scrollNode?.removeEventListener('scroll', updateIndicator);
      resizeObserver?.disconnect();
    };
  }, [activeTab]);

  useEffect(() => { window.localStorage.setItem('gifting-factory-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { window.localStorage.setItem('gifting-factory-wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    const syncRoute = () => setAdminMode(window.location.pathname === '/admin');
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (activeTab !== 'home' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setCurrentSlideIndex(current => (current + 1) % PORTFOLIO_SERIES.length), 6500);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  if (adminMode) return <AdminDashboard onExit={() => { window.history.pushState({}, '', '/'); setAdminMode(false); }} />;

  return (
    <div style={styles.appContainer} className="portfolio-page">
      {/* Top Header Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenShop={() => setActiveTab('shop')}
        onOpenCheckout={() => { setActiveTab('shop'); setCheckoutRequested(true); }}
        onOpenWishlist={() => { setActiveTab('shop'); setWishlistRequested(true); }}
        onOpenServices={() => setActiveTab('services')}
        onOpenGallery={() => setActiveTab('gallery')}
        cartCount={cartCount}
        wishlistCount={wishlist.length}
      />
      <div className={`page-scroll-indicator ${scrollIndicator.visible ? 'visible' : ''}`} aria-hidden="true"><span style={{ top: `${scrollIndicator.progress * 100}%`, transform: `translateY(-${scrollIndicator.progress * 100}%)` }} /></div>

      {/* Main Full-Screen Seamless Editorial Canvas */}
      {activeTab === 'home' && (
        <div className="home-scroll">
          <main style={styles.mainCanvas} className="portfolio-layout">
            {/* Left column: collection label, title, subtitle and counter */}
            <section style={styles.leftCol} className="portfolio-copy">
              <div style={styles.tagWrapper}>
                <span style={styles.roleTag}>{currentSlide.category}</span>
              </div>

              <div style={styles.titleWrapper}>
                <h1 style={styles.mainName} className="portfolio-name">
                  The<br />
                  Gifting<br />
                  Factory
                </h1>
                <span className="brand-signature">BY FLOWER GIRL</span>
                <p style={styles.subjectSub}>{currentSlide.subject}</p>
              </div>

              <div style={styles.counterWrapper}>
                <span style={styles.slideCounter}>{currentSlide.code}</span>
              </div>
            </section>

            {/* Middle Column: Dual Thumbnail Frame & Slide Controls */}
            <section style={styles.middleCol} className="portfolio-thumbnails">
              <div style={styles.cardSliderContainer} className="thumbnail-strip">
                {/* Top Right Arrow Controls Pill */}
                <div style={styles.arrowControlsWrapper} className="thumbnail-controls">
                  <button
                    onClick={handlePrevSlide}
                    style={styles.arrowBtn}
                    aria-label="Previous Slide"
                    className="hover-lift"
                  >
                    <ChevronLeft size={16} color="#ffffff" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    style={{ ...styles.arrowBtn, borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                    aria-label="Next Slide"
                    className="hover-lift"
                  >
                    <ChevronRight size={16} color="#ffffff" />
                  </button>
                </div>

                {/* Side-by-Side Thumbnail Cards */}
                <div style={styles.cardsGrid} key={currentSlide.id} className="animate-fade-in thumbnail-grid">
                  {currentSlide.thumbnails.map((thumb) => (
                    <div
                      key={thumb.id}
                      style={styles.thumbCard}
                      className="thumbnail-item"
                    >
                      <img
                        src={thumb.image}
                        alt={thumb.title}
                        style={styles.thumbImg}
                        className="seamless-blend"
                      />
                    </div>
                  ))}
                </div>

                {/* Caption Text Below Right Thumbnail */}
                <div style={styles.captionRow}>
                  <span style={styles.originText}>{currentSlide.origin}</span>
                </div>
              </div>
            </section>

            {/* Right Column: Hero Surreal Floral Artpiece (Floating Directly on Canvas without any card/box) */}
            <section style={styles.rightCol} className="portfolio-artwork">
              <div
                style={{
                  ...styles.heroArtBox,
                  transform: `perspective(1000px) rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.3}deg)`
                }}
                key={currentSlide.id}
                className="animate-fade-in hero-artwork-wrap"
              >
                <img
                  src={currentSlide.heroImage}
                  alt={currentSlide.title}
                  style={styles.heroImg}
                  className="seamless-blend animate-hero-float hero-artwork"
                />
              </div>

              {/* Bottom Right Social Links */}
              <div style={styles.socialBar} className="hero-socials">
                <a href="tel:+233202417072" style={styles.socialLink} className="link-underline">CALL</a>
                <a href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer" style={styles.socialLink} className="link-underline">WA</a>
                <a href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer" style={styles.socialLink} className="link-underline">IG</a>
              </div>
            </section>
          </main>
          <section className="home-information">
            <div className="home-about-label"><span>ABOUT THE GIFTING FACTORY</span><button className="soft-action" onClick={() => setActiveTab('about')}>READ OUR STORY</button></div>
            <h2>We turn thoughtful ideas<br />into gifts worth keeping.</h2>
            <div className="home-facts"><p>Luxury hampers built around the person, the occasion and your budget.</p><p>Fresh flowers, wrapping, engagement presentation and personalized finishing.</p><p>Collection and same-day delivery options confirmed with every order.</p></div>
          </section>
          <section className="home-service-links">
            <div className="service-links-intro"><span>01 / 05</span><h2>What we make<br />meaningful.</h2></div>
            <ol>{['Gift shop', 'Wrapping', 'Engagement wrapping', 'Boxes', 'Engraving'].map((item, index) => <li key={item}><button onClick={() => setActiveTab('services')}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><i>→</i></button></li>)}</ol>
          </section>
          <section className="career-callout"><div><span>WE’RE GROWING</span><h2>Join the creative<br />team behind the gifts.</h2></div><div><p>Applications are open for a Content Creator / Social Media Manager in Accra.</p><button className="primary-action" onClick={() => setActiveTab('careers')}>VIEW THE ROLE</button></div></section>
          <SiteFooter onNavigate={setActiveTab} />
        </div>
      )}

      {activeTab === 'about' && <AboutPage key="about" onNavigate={setActiveTab} />}
      {activeTab === 'services' && <ServicesPage key="services" onNavigate={setActiveTab} />}
      {activeTab === 'gallery' && <GalleryPage key="gallery" onNavigate={setActiveTab} />}
      {activeTab === 'shop' && <ShopPage key="shop" onNavigate={setActiveTab} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} openCheckout={checkoutRequested} onCheckoutHandled={() => setCheckoutRequested(false)} openWishlist={wishlistRequested} onWishlistHandled={() => setWishlistRequested(false)} />}
      {activeTab === 'customize' && <CustomizePage key="customize" onNavigate={setActiveTab} />}
      {activeTab === 'careers' && <CareersPage key="careers" onNavigate={setActiveTab} />}
      {activeTab === 'track' && <TrackOrderPage key="track" onNavigate={setActiveTab} />}
      {activeTab === 'delivery' && <InformationPage key="delivery" type="delivery" onNavigate={setActiveTab} />}
      {activeTab === 'policy' && <InformationPage key="policy" type="policy" onNavigate={setActiveTab} />}

      {/* Modals and Side Drawers */}
      <DrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentSlideIndex={currentSlideIndex}
        onSelectSlide={(idx) => { setCurrentSlideIndex(idx); setActiveTab('home'); }}
        onNavigate={setActiveTab}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectSlide={(idx) => { setCurrentSlideIndex(idx); setActiveTab('home'); }}
        onNavigate={setActiveTab}
      />

    </div>
  );
}

const styles = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#e2e2e0',
    position: 'relative',
    overflow: 'hidden'
  },
  mainCanvas: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 1.15fr) minmax(320px, 1.35fr) minmax(460px, 2.3fr)',
    padding: '0.5rem 4.5rem 2.8rem 4.5rem',
    alignItems: 'center',
    gap: '2.5rem',
    maxWidth: '1850px',
    margin: '0 auto',
    width: '100%',
    height: 'calc(100vh - 85px)'
  },
  /* Left Column */
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    paddingTop: '2.2rem',
    paddingBottom: '0.5rem'
  },
  tagWrapper: {
    marginBottom: '2rem'
  },
  roleTag: {
    fontSize: '0.78rem',
    letterSpacing: '0.22em',
    color: '#4a4a4a',
    fontWeight: '500'
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    margin: 'auto 0'
  },
  mainName: {
    fontSize: 'clamp(4.2rem, 5.8vw, 6.6rem)',
    fontWeight: '600',
    lineHeight: '0.94',
    letterSpacing: '-0.025em',
    color: '#111111',
    fontFamily: 'var(--font-heading)'
  },
  subjectSub: {
    fontSize: 'clamp(1.4rem, 2vw, 2.1rem)',
    fontWeight: '400',
    color: '#333333',
    marginTop: '0.5rem',
    letterSpacing: '-0.01em'
  },
  counterWrapper: {
    marginTop: '2.5rem'
  },
  slideCounter: {
    fontSize: '1.6rem',
    fontWeight: '500',
    letterSpacing: '0.04em',
    color: '#111111',
    fontFamily: 'var(--font-heading)'
  },

  /* Middle Column */
  middleCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative'
  },
  cardSliderContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '360px'
  },
  arrowControlsWrapper: {
    position: 'absolute',
    top: '-25px',
    right: '0px',
    backgroundColor: '#5c5c5a',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    zIndex: 5
  },
  arrowBtn: {
    padding: '0.35rem 0.65rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    width: '100%'
  },
  thumbCard: {
    backgroundColor: '#d5d5d3',
    borderRadius: '2px',
    overflow: 'hidden',
    aspectRatio: '1 / 1.12',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '0.4rem'
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  captionRow: {
    marginTop: '0.4rem',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingRight: '0.2rem'
  },
  originText: {
    fontSize: '0.72rem',
    color: '#555555',
    letterSpacing: '0.04em',
    fontWeight: '400'
  },

  /* Right Column (Hero Art Floating Directly on Canvas) */
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    position: 'relative',
    paddingBottom: '0.5rem'
  },
  heroArtBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxHeight: '660px',
    transition: 'transform 0.15s ease-out'
  },
  heroImg: {
    maxWidth: '100%',
    maxHeight: '640px',
    objectFit: 'contain'
  },
  socialBar: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '2.5rem',
    marginTop: '1rem'
  },
  socialLink: {
    fontSize: '0.8rem',
    fontWeight: '500',
    letterSpacing: '0.12em',
    color: '#111111'
  }
};
