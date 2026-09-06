import { Menu, Search, ShoppingBag, Heart } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, onOpenDrawer, onOpenSearch, onOpenShop, onOpenCheckout, onOpenWishlist, onOpenServices, onOpenGallery, cartCount, wishlistCount }) {
  return (
    <header style={styles.header} className="portfolio-header">

      {/* ── HAMBURGER (left) — visible on mobile only ── */}
      <button
        onClick={onOpenDrawer}
        style={styles.menuButton}
        className="mobile-menu-button"
        aria-label="Open Menu Drawer"
      >
        <Menu size={20} color="#111111" strokeWidth={2} />
      </button>

      {/* ── LOGO — left on desktop, centered on mobile ── */}
      <button
        className="header-wordmark"
        onClick={() => setActiveTab('home')}
        aria-label="The Gifting Factory by Flower Girl – go home"
      >
        <img
          src="/assets/gifting-factory-logo-transparent-v2.png"
          alt="The Gifting Factory logo"
          className="header-logo-img"
        />
      </button>

      {/* ── DESKTOP NAV LINKS — hidden on mobile ── */}
      <nav style={styles.rightNav} className="desktop-nav">
        <button
          style={{ ...styles.navLink, fontWeight: activeTab === 'home' ? '600' : '400', opacity: activeTab === 'home' ? 1 : 0.8 }}
          onClick={() => setActiveTab('home')}
          className="link-underline"
        >HOME</button>

        <button
          style={{ ...styles.navLink, fontWeight: activeTab === 'about' ? '600' : '400', opacity: activeTab === 'about' ? 1 : 0.8 }}
          onClick={() => setActiveTab('about')}
          className="link-underline"
        >ABOUT</button>

        <button
          style={{ ...styles.navLink, fontWeight: activeTab === 'services' ? '600' : '400', opacity: activeTab === 'services' ? 1 : 0.8 }}
          onClick={onOpenServices}
          className="link-underline"
        >SERVICES</button>

        <button
          style={{ ...styles.navLink, fontWeight: activeTab === 'gallery' ? '600' : '400', opacity: activeTab === 'gallery' ? 1 : 0.8 }}
          onClick={onOpenGallery}
          className="link-underline"
        >GALLERY</button>

        <button
          style={{ ...styles.navLink, fontWeight: activeTab === 'shop' ? '600' : '400', opacity: activeTab === 'shop' ? 1 : 0.8 }}
          onClick={onOpenShop}
          className="link-underline"
        >SHOP</button>

        <button
          style={{ ...styles.navLink, fontWeight: activeTab === 'careers' ? '600' : '400', opacity: activeTab === 'careers' ? 1 : 0.8 }}
          onClick={() => setActiveTab('careers')}
          className="link-underline"
        >CAREERS</button>

        <button
          style={{ ...styles.navLink, fontWeight: activeTab === 'track' ? '600' : '400', opacity: activeTab === 'track' ? 1 : 0.8 }}
          onClick={() => setActiveTab('track')}
          className="link-underline"
        >TRACK ORDER</button>

        <div className="nav-utilities">
          <button onClick={onOpenSearch} style={styles.searchButton} aria-label="Search" className="hover-lift">
            <Search size={18} color="#111111" strokeWidth={2.2} />
          </button>
          <button className="nav-order" onClick={onOpenWishlist} aria-label={`${wishlistCount} saved gifts. Open wishlist`}>
            <Heart size={18} strokeWidth={1.9} />
            {wishlistCount > 0 && <span aria-hidden="true">{wishlistCount}</span>}
          </button>
          <button className={`nav-order ${cartCount ? 'has-items' : ''}`} onClick={onOpenCheckout} aria-label={`${cartCount} items in cart. Open checkout`}>
            <ShoppingBag size={18} strokeWidth={1.9} />
            {cartCount > 0 && <span aria-hidden="true">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ── MOBILE UTILITY ICONS — search + cart (right side) ── */}
      <div className="mobile-nav-utils">
        <button onClick={onOpenSearch} style={styles.searchButton} aria-label="Search" className="hover-lift">
          <Search size={18} color="#111111" strokeWidth={2.2} />
        </button>
        <button className="nav-order" onClick={onOpenWishlist} aria-label={`${wishlistCount} saved gifts. Open wishlist`}>
          <Heart size={18} strokeWidth={1.9} />
          {wishlistCount > 0 && <span aria-hidden="true">{wishlistCount}</span>}
        </button>
        <button className={`nav-order ${cartCount ? 'has-items' : ''}`} onClick={onOpenCheckout} aria-label={`${cartCount} items in cart`}>
          <ShoppingBag size={18} strokeWidth={1.9} />
          {cartCount > 0 && <span aria-hidden="true">{cartCount}</span>}
        </button>
      </div>

    </header>
  );
}

const styles = {
  header: {
    width: '100%',
    padding: '2.5rem 4.5rem 1rem 4.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    backgroundColor: 'transparent'
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem'
  },
  avatarRing: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#d6d6d4',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  avatarButton: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  brandMark: {
    fontSize: '0.72rem',
    fontWeight: '600',
    letterSpacing: '-0.04em',
    color: '#111111'
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem'
  },
  rightNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '3.5rem'
  },
  navLink: {
    fontSize: '0.82rem',
    letterSpacing: '0.15em',
    color: '#111111',
    padding: '0.2rem 0',
    background: 'none'
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.2rem',
    marginLeft: '0.2rem'
  }
};
