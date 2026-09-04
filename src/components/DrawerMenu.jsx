import { X, ArrowRight, Globe, MessageCircle, MapPin, Phone } from 'lucide-react';
import { PORTFOLIO_SERIES, ARTIST_INFO } from '../data/portfolioData';

export default function DrawerMenu({ isOpen, onClose, currentSlideIndex, onSelectSlide, onNavigate }) {
  if (!isOpen) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer"
      >
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.artistBrand}>
            <div style={styles.drawerAvatar} className="brand-modal-mark">FG</div>
            <div>
              <h3 style={styles.drawerTitle}>{ARTIST_INFO.name}</h3>
              <p style={styles.drawerSub}>{ARTIST_INFO.role}</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close menu">
            <X size={24} color="#181818" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div style={styles.contentBody}>
          <div style={styles.sectionGroup}>
            <span style={styles.sectionLabel}>FEATURED COLLECTIONS</span>
            <ul style={styles.seriesList}>
              {PORTFOLIO_SERIES.map((item, index) => (
                <li key={item.id} style={styles.seriesItem}>
                  <button
                    onClick={() => {
                      onSelectSlide(index);
                      onClose();
                    }}
                    style={{
                      ...styles.seriesBtn,
                      color: currentSlideIndex === index ? '#181818' : '#666666',
                      fontWeight: currentSlideIndex === index ? '600' : '400'
                    }}
                  >
                    <span style={styles.seriesCode}>{item.code}</span>
                    <span style={styles.seriesTitle}>{item.title}</span>
                    {currentSlideIndex === index && <ArrowRight size={16} color="#181818" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div style={styles.sectionGroup}>
            <span style={styles.sectionLabel}>PAGES</span>
            <div style={styles.pagesGrid}>
              {[
                ['about', 'Our Story'],
                ['services', 'Services'],
                ['gallery', 'Gallery'],
                ['shop', 'Shop Gifts'],
                ['customize', 'Build a Custom Gift'],
                ['careers', 'Careers'],
                ['delivery', 'Delivery & FAQ'],
                ['policy', 'Order Policy']
              ].map(([page, label]) => (
                <button key={page} onClick={() => { onNavigate(page); onClose(); }} style={styles.pageBtn}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.sectionGroup}>
            <span style={styles.sectionLabel}>DELIVERY</span>
            <p style={styles.studioText}>
              Same-day delivery available in Accra
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.drawerFooter}>
          <div style={styles.socials}>
            <a href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer" style={styles.socialIcon} aria-label="Instagram"><Globe size={18} /></a>
            <a href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer" style={styles.socialIcon} aria-label="WhatsApp"><MessageCircle size={18} /></a>
            <a href="tel:+233202417072" style={styles.socialIcon} aria-label="Phone"><Phone size={18} /></a>
            <span style={styles.socialIcon} aria-label="Kwabenya, Accra"><MapPin size={18} /></span>
          </div>
          <p style={styles.copyright}>© 2026 The Gifting Factory by Flower Girl.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  drawer: {
    width: '420px',
    maxWidth: '90vw',
    height: '100%',
    backgroundColor: '#ecece9',
    display: 'flex',
    flexDirection: 'column',
    padding: '2.5rem 2rem',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.12)'
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid rgba(0,0,0,0.08)'
  },
  artistBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  drawerAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  drawerTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#181818'
  },
  drawerSub: {
    fontSize: '0.75rem',
    color: '#666666',
    letterSpacing: '0.05em'
  },
  closeBtn: {
    padding: '0.5rem',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.04)'
  },
  contentBody: {
    flex: 1,
    overflowY: 'auto',
    paddingTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  sectionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  sectionLabel: {
    fontSize: '0.7rem',
    letterSpacing: '0.18em',
    color: '#888888',
    fontWeight: '600'
  },
  seriesList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  seriesItem: {
    width: '100%'
  },
  seriesBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.4)',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  seriesCode: {
    fontSize: '0.85rem',
    fontWeight: '700',
    letterSpacing: '0.05em'
  },
  seriesTitle: {
    fontSize: '0.9rem',
    flex: 1
  },
  pagesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem'
  },
  pageBtn: {
    textAlign: 'left',
    fontSize: '0.95rem',
    color: '#181818',
    padding: '0.4rem 0',
    borderBottom: '1px solid rgba(0,0,0,0.05)'
  },
  studioText: {
    fontSize: '0.82rem',
    lineHeight: '1.6',
    color: '#555555'
  },
  drawerFooter: {
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  socials: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem'
  },
  socialIcon: {
    color: '#333333',
    transition: 'transform 0.2s ease'
  },
  copyright: {
    fontSize: '0.72rem',
    color: '#888888'
  }
};
