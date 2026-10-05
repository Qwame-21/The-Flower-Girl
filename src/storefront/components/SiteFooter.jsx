import { useState, useEffect } from 'react';
import FooterLogo from './FooterLogo';
import { getSiteSettings } from '../api/siteFeatures';

export default function SiteFooter({ onNavigate }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  const storeName = settings?.business_name || 'The Gifting Factory by Flower Girl';
  const storeAddress = settings?.store_address || 'ACP Estate Junction, Kwabenya, Accra';
  const instagramUrl = settings?.instagram_url || 'https://www.instagram.com/flowergirl_ghana/';
  const supportPhone = settings?.support_phone || '+233 202 417 072';

  const handleNavClick = (page, event) => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && onNavigate) {
      event.preventDefault();
      onNavigate(page);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <button
          type="button"
          onClick={() => onNavigate?.('home')}
          aria-label="Go to homepage"
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <FooterLogo />
        </button>
        <p>Luxury gifts, flowers and thoughtful presentation for every occasion.</p>
        <a
          className="footer-location"
          href={`https://maps.google.com/?q=${encodeURIComponent(storeAddress)}`}
          target="_blank"
          rel="noreferrer"
        >
          {storeAddress}
        </a>
      </div>
      <div className="footer-directory">
        <div className="footer-pages">
          <a href="/about" onClick={(e) => handleNavClick('about', e)}><b>ABOUT</b><span>Our story</span></a>
          <a href="/services" onClick={(e) => handleNavClick('services', e)}><b>SERVICES</b><span>What we do</span></a>
          <a href="/customize" onClick={(e) => handleNavClick('customize', e)}><b>CUSTOM</b><span>Build a gift</span></a>
          <a href="/careers" onClick={(e) => handleNavClick('careers', e)}><b>CAREERS</b><span>Join the team</span></a>
          <a href="/shop" onClick={(e) => handleNavClick('shop', e)}><b>SHOP</b><span>Browse gifts</span></a>
        </div>
        <div className="footer-guides">
          <a href="/track" onClick={(e) => handleNavClick('track', e)}><b>TRACK ORDER</b><span>Check fulfillment</span></a>
          <a href="/delivery" onClick={(e) => handleNavClick('delivery', e)}><b>DELIVERY</b><span>Options & timing</span></a>
          <a href="/policy" onClick={(e) => handleNavClick('policy', e)}><b>POLICY</b><span>Terms & conditions</span></a>
        </div>
      </div>
      <div className="footer-contact">
        <a href={`tel:${supportPhone}`} className="footer-phone">{supportPhone}</a>
        <a href={instagramUrl} target="_blank" rel="noreferrer" className="footer-instagram">@flowergirl_ghana</a>
      </div>
    </footer>
  );
}
