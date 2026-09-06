import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { readAdminData, subscribeAdminData } from '../data/adminStore';
import { PRODUCTS } from '../data/products';

export default function DrawerMenu({ isOpen, onClose, onNavigate }) {
  const [adminData, setAdminData] = useState(readAdminData);
  useEffect(() => subscribeAdminData(setAdminData), []);
  if (!isOpen) return null;
  const promotion = (adminData.promotions || []).find(item => item.status === 'active' && Number(item.percent) > 0);
  const promotedProduct = promotion && [...(adminData.products || []), ...PRODUCTS].find(product => product.id === promotion.productId);

  return (
    <div className="storefront-drawer" style={styles.fullPage} onClick={onClose}>
      <div
        className="storefront-drawer__inner"
        style={styles.inner}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button className="round-icon" onClick={onClose} style={styles.closeBtn} aria-label="Close menu">
          <X size={24} color="#181818" />
        </button>

        {/* Page links — vertical, no label */}
        <nav className="storefront-drawer__pages" style={styles.pageList}>
          {[
            ['home',     'HOME'],
            ['about',    'ABOUT'],
            ['services', 'SERVICES'],
            ['gallery',  'GALLERY'],
            ['shop',     'SHOP'],
            ['careers',  'CAREERS'],
            ['track',    'TRACK ORDER'],
          ].map(([page, label]) => (
            <button
              key={page}
              onClick={() => { onNavigate(page); onClose(); }}
              style={styles.pageBtn}
              className="storefront-drawer__page"
            >
              {label}
            </button>
          ))}
        </nav>

        <button className="storefront-drawer__announcement" onClick={() => { onNavigate(promotion ? 'shop' : 'home'); onClose(); }}>
          <small>{promotion ? 'CURRENT OFFER' : 'FROM THE STUDIO'}</small>
          <strong>{promotion ? `${Number(promotion.percent)}% off ${promotedProduct?.name || 'selected gifts'}` : adminData.content?.announcement}</strong>
          <span>{promotion ? 'View the offer →' : 'Return to the storefront →'}</span>
        </button>

        {/* Social links — horizontal, text-based, matching site style */}
        <div className="storefront-drawer__socials" style={styles.socialRow}>
          <a href="tel:+233202417072" style={styles.socialLink} className="link-underline">CALL</a>
          <a href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer" style={styles.socialLink} className="link-underline">WA</a>
          <a href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer" style={styles.socialLink} className="link-underline">IG</a>
        </div>
        <a
          className="storefront-drawer__location"
          href="https://maps.google.com/?q=ACP+Estate+Junction+Kwabenya+Accra"
          target="_blank"
          rel="noreferrer"
        >
          <MapPin size={17} strokeWidth={2.35} aria-hidden="true" />
          <span>ACP Estate Junction, Kwabenya, Accra</span>
        </a>
      </div>
    </div>
  );
}

const styles = {
  fullPage: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#ecece9',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
  },
  inner: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '2.5rem 2rem',
    boxSizing: 'border-box',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: '0.5rem',
    borderRadius: '50%',
    backgroundColor: 'rgba(17,17,17,0.06)',
    marginBottom: '3rem',
  },
  pageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  pageBtn: {
    textAlign: 'left',
    fontSize: '0.95rem',
    color: '#181818',
    padding: '0.4rem 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  socialRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '2rem',
    marginTop: '3rem',
    paddingBottom: '1rem',
  },
  socialLink: {
    fontSize: '0.8rem',
    fontWeight: '500',
    letterSpacing: '0.12em',
    color: '#111111',
    textDecoration: 'none',
  },
};
