import { useEffect, useState } from 'react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { getSiteSettings } from '../api/siteFeatures';
import SiteFooter from '../components/SiteFooter';

export default function InformationPage({ type, onNavigate }) {
  const delivery = type === 'delivery';
  const [content, setContent] = useState(() => readAdminData().content);
  const [siteContent, setSiteContent] = useState('');
  const [supportPhone, setSupportPhone] = useState('+233 202 417 072');

  useEffect(() => subscribeAdminData(data => setContent(data.content)), []);

  useEffect(() => {
    getSiteSettings().then(settings => {
      if (delivery && settings?.delivery_page) {
        setSiteContent(settings.delivery_page);
      } else if (!delivery && settings?.policy_page) {
        setSiteContent(settings.policy_page);
      }
      if (settings?.support_phone) {
        setSupportPhone(settings.support_phone);
      }
    });
  }, [delivery]);

  const paragraphs = siteContent.split('\n\n').filter(p => p.trim());

  return (
    <main className="content-page information-page">
      <header className="content-page-heading">
        <span>{delivery ? 'DELIVERY & FAQ' : 'ORDER POLICY'}</span>
        <h1>{delivery ? <>Delivery,<br />clearly arranged.</> : <>Before we<br />begin.</>}</h1>
      </header>
      {siteContent ? (
        <section className="about-intro">
          {paragraphs.map((para, index) => <p key={index}>{para}</p>)}
        </section>
      ) : (delivery ? content.deliveryPolicy : content.orderPolicy) && (
        <aside className="published-policy">
          <span>{delivery ? 'CURRENT DELIVERY NOTE' : 'CURRENT ORDER POLICY'}</span>
          <p>{delivery ? content.deliveryPolicy : content.orderPolicy}</p>
        </aside>
      )}
      {!siteContent && !(delivery ? content.deliveryPolicy : content.orderPolicy) && (
        <p className="about-lead">This page is being updated. For assistance, call {supportPhone}.</p>
      )}
      {delivery ? (
        <section className="information-list">
          <article><span>01</span><h2>Where do you deliver?</h2><p>Delivery is available across Accra. Share the complete address and a reachable recipient number when ordering.</p></article>
          <article><span>02</span><h2>Can I request same-day delivery?</h2><p>Yes, when stock, preparation time and the destination allow it. The team confirms availability before payment.</p></article>
          <article><span>03</span><h2>Can I schedule a delivery?</h2><p>Yes. Choose a preferred date in the gift builder or booking form. A delivery window is confirmed with your order.</p></article>
          <article><span>04</span><h2>Can I collect my order?</h2><p>Collection can be arranged from ACP Estate Junction, Kwabenya, after the team confirms that your order is ready.</p></article>
        </section>
      ) : (
        <section className="information-list">
          <article><span>01</span><h2>Quotes and payment</h2><p>Prices marked "From" are starting estimates. The final total is confirmed after product availability, customization and delivery are agreed.</p></article>
          <article><span>02</span><h2>Custom orders</h2><p>Production begins after the design, wording, total and payment terms are confirmed. Check names and messages carefully before approval.</p></article>
          <article><span>03</span><h2>Changes and cancellations</h2><p>Personalized items cannot be changed after production starts. Contact the team promptly if an order detail needs attention.</p></article>
          <article><span>04</span><h2>Fresh and sourced goods</h2><p>Flowers and some items are sourced to order. Substitutions of equal quality may be made if the specified item is unavailable at the time of production.</p></article>
        </section>
      )}
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
