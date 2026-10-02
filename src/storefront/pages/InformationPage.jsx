import { useEffect, useState } from 'react';
import SiteFooter from '../components/SiteFooter';

export default function InformationPage({ type, onNavigate }) {
  const delivery = type === 'delivery';
  return (
    <main className="content-page information-page">
      <header className="content-page-heading">
        <span>{delivery ? 'DELIVERY & FAQ' : 'ORDER POLICY'}</span>
        <h1>{delivery ? <>Delivery,<br />clearly arranged.</> : <>Before we<br />begin.</>}</h1>
      </header>
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
          <article><span>04</span><h2>Fresh and seasonal items</h2><p>Flowers and seasonal items are subject to availability. Alternatives will be offered if your first choice is unavailable.</p></article>
        </section>
      )}
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
