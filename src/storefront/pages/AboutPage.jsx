import { useEffect, useState } from 'react';
import { Flower2 } from 'lucide-react';
import { getSiteSettings } from '../api/siteFeatures';
import SiteFooter from '../components/SiteFooter';

const DEFAULT_CONTENT = {
  about: 'The Gifting Factory by Flower Girl is an Accra gift shop creating luxury hampers, fresh flower arrangements and carefully finished packages for the people and moments that matter.\n\nFrom ready-to-order gifts to custom boxes, engagement wrapping and engraving, every order begins with the recipient, the occasion and your budget.\n\nCollection and delivery timing are confirmed with each order. Same-day delivery is available when timing and stock permit.',
};

export default function AboutPage({ onNavigate }) {
  const [content, setContent] = useState(DEFAULT_CONTENT.about);
  const [supportPhone, setSupportPhone] = useState('+233 202 417 072');

  useEffect(() => {
    getSiteSettings().then(settings => {
      if (settings?.about_page) {
        setContent(settings.about_page);
      }
      if (settings?.support_phone) {
        setSupportPhone(settings.support_phone);
      }
    });
  }, []);

  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <main className="content-page about-page">
      <header className="content-page-heading about-page-heading">
        <div>
          <span>OUR STORY</span>
          <h1>Gifts made<br />personal.</h1>
        </div>
        <Flower2 className="about-gray-flower" strokeWidth={0.85} aria-hidden="true" />
      </header>
      <section className="about-intro">
        {paragraphs.map((para, index) => (
          <p key={index} className={index === 0 ? 'about-lead' : ''}>{para}</p>
        ))}
        {!content && <p className="about-lead">This page is being updated. For assistance, call {supportPhone}.</p>}
      </section>
      <section className="about-path">
        <article><span>01</span><p><strong>Tell us who it is for.</strong>Share the recipient, occasion, preferred colours, budget and anything that makes the gift feel personal.</p></article>
        <article><span>02</span><p><strong>We compose every detail.</strong>Products, flowers, wrapping, engraving and the message card are brought into one considered presentation.</p></article>
        <article><span>03</span><p><strong>Choose how it arrives.</strong>Collect from the shop, schedule a delivery, or request same-day service when timing and availability permit.</p></article>
      </section>
      <div className="page-cta-row">
        <button className="primary-action" onClick={() => onNavigate?.('customize')}>BUILD A CUSTOM GIFT</button>
        <button className="soft-action" onClick={() => onNavigate?.('services')}>VIEW ALL SERVICES</button>
      </div>
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
