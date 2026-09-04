import { useState } from 'react';
import { X, ArrowRight, Check, Upload, Heart, Minus, Plus, MapPin, LocateFixed } from 'lucide-react';
import { isPaystackTestConfigured } from '../config/payment';

const SERVICES = [
  { name: 'Gift shop', detail: 'Luxury gift hampers, fresh flowers, chocolates, jewelry, fashion pieces and useful everyday gifts.', image: '/assets/hamper-editorial-v2.png' },
  { name: 'Gift wrapping', detail: 'A considered presentation service for gifts supplied by you or selected from our shop.', image: '/assets/wrapping-editorial-v2.png' },
  { name: 'Engagement wrapping', detail: 'Coordinated wrapping and presentation for engagement ceremonies and family gifting.', image: '/assets/engagement-presentation-v2.png' },
  { name: 'Gift boxes', detail: 'Curated boxes for birthdays, Valentine’s, Christmas, self-care and other occasions.', image: '/assets/luxury_hamper_cutout.png' },
  { name: 'Engraving', detail: 'Personalization for selected gifts, including clothing, bags and presentation pieces.', image: '/assets/embroidery-editorial-v2.png' },
  { name: 'Luxury gift hampers', detail: 'Build a hamper with flowers, treats, fragrances, fashion pieces, accessories and a personal card.', image: '/assets/basket-hamper-editorial-v2.png' },
  { name: 'Fresh flowers', detail: 'Fresh bouquets arranged for gifting, milestones and special occasions.', image: '/assets/bouquet-editorial-v2.png' },
  { name: 'Same-day delivery in Accra', detail: 'Same-day delivery is available in Accra, subject to order time and product availability.', image: '/assets/delivery-editorial-v2.png' }
];

const CUSTOM_OPTIONS = {
  'Choose a base': ['Luxury box', 'Open hamper', 'Flower bouquet', 'Gift bag', 'Keepsake basket', 'Corporate box'],
  'Add gifts': ['Perfume', 'Chocolate', 'Fresh flowers', 'Jewelry', 'Wrist bag', 'Watch', 'Tumbler', 'Fabric', 'Self-care items', 'Shirt', 'Manicure set', 'Tea & cookies', 'Juice', 'Hot water bottle'],
  'Personalize': ['Engraved name', 'Embroidered name', 'Printed message', 'Custom card', 'Photo insert', 'Branded ribbon', 'Company branding'],
  'Finish & deliver': ['Gift wrapping', 'Engagement wrapping', 'Same-day Accra delivery', 'Scheduled delivery', 'Store collection', 'Surprise delivery']
};

const CUSTOM_ESTIMATES = {
  'Luxury box': 220, 'Open hamper': 180, 'Flower bouquet': 450, 'Gift bag': 120, 'Keepsake basket': 280, 'Corporate box': 240,
  Perfume: 480, Chocolate: 120, 'Fresh flowers': 300, Jewelry: 350, 'Wrist bag': 320, Watch: 420, Tumbler: 160, Fabric: 380,
  'Self-care items': 220, Shirt: 250, 'Manicure set': 130, 'Tea & cookies': 90, Juice: 45, 'Hot water bottle': 110,
  'Engraved name': 80, 'Embroidered name': 120, 'Printed message': 40, 'Custom card': 35, 'Photo insert': 25, 'Branded ribbon': 65, 'Company branding': 160,
  'Gift wrapping': 90, 'Engagement wrapping': 240, 'Same-day Accra delivery': 120, 'Scheduled delivery': 90, 'Store collection': 0, 'Surprise delivery': 140
};

const PRODUCTS = [
  { id: 'hamper-3750', name: 'Luxury hamper', price: 3750, priceLabel: 'GHS 3,750', detail: 'Laptop bag, Lacoste shirt, YSL perfume, Patek Philippe watch, manicure set and card.', image: '/assets/hamper-editorial-v2.png', tag: 'SIGNATURE', includes: ['Premium gift box', 'Fashion and fragrance selection', 'Watch and grooming pieces', 'Personal message card'] },
  { id: 'christmas-bundle', name: 'Christmas bundle', price: 1250, priceLabel: 'From GHS 1,250', detail: 'Six yards of Hollandaise fabric, Bodycology fragrance splash and an insulated tumbler.', image: '/assets/engagement-presentation-v2.png', tag: 'SEASONAL', includes: ['Hollandaise fabric', 'Fragrance splash', 'Insulated tumbler', 'Gift presentation'] },
  { id: 'period-care', name: 'Period care box', price: 650, priceLabel: 'From GHS 650', detail: 'Pads and panty liners, feminine wash and wipes, ginger tea with mint, cranberry juice, cookies and a hot water bottle. Monthly subscription available.', image: '/assets/wrapping-editorial-v2.png', tag: 'SUBSCRIPTION', includes: ['Period-care essentials', 'Tea, juice and cookies', 'Hot water bottle', 'Optional monthly delivery'] },
  { id: 'fresh-bouquet', name: 'Fresh flower bouquet', price: 450, priceLabel: 'From GHS 450', detail: 'A fresh arrangement selected around your preferred palette, occasion and delivery date.', image: '/assets/bouquet-editorial-v2.png', tag: 'FRESH', includes: ['Seasonal fresh flowers', 'Chosen colour direction', 'Hand-tied finishing', 'Message card'] },
  { id: 'fragrance-gift', name: 'Fragrance & treats gift', price: 950, priceLabel: 'From GHS 950', detail: 'A personalized combination of fragrance, premium chocolate, flowers and a handwritten card.', image: '/assets/basket-hamper-editorial-v2.png', tag: 'FREQUENTLY CHOSEN', includes: ['Fragrance selection', 'Premium chocolates', 'Fresh floral accent', 'Handwritten card'] },
  { id: 'personalized-bag', name: 'Personalized wrist bag', price: 650, priceLabel: 'From GHS 650', detail: 'A wrist bag gift with optional name engraving, wrapping and additional accessories.', image: '/assets/delivery-editorial-v2.png', tag: 'PERSONALIZED', includes: ['Wrist bag', 'Optional name finishing', 'Gift wrapping', 'Selected accessories'] },
  { id: 'embroidery', name: 'Embroidery & personalization', price: 180, priceLabel: 'From GHS 180', detail: 'Add a name or short personal detail to selected shirts, fabric gifts and accessories.', image: '/assets/embroidery-editorial-v2.png', tag: 'MADE TO ORDER', includes: ['Name or short wording', 'Thread colour selection', 'Placement confirmation', 'Production approval'] }
];

function FooterLogo() {
  return <div className="footer-logo"><img src="/assets/gifting-factory-logo-transparent-v2.png" alt="The Gifting Factory by Flower Girl" /></div>;
}

function DateSelect({ name, placeholder, options }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  return <div className={`custom-select ${open ? 'open' : ''}`}><input className="date-value" required name={name} value={value} onChange={() => {}} /><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}><span>{value || placeholder}</span><i /></button>{open && <div className="custom-select-menu" role="listbox" aria-label={placeholder}>{options.map(option => <button type="button" role="option" aria-selected={value === String(option)} key={option} onClick={() => { setValue(String(option)); setOpen(false); }}>{option}</button>)}</div>}</div>;
}

function DateField({ label, prefix }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return <fieldset className="date-field"><legend>{label}</legend><div><DateSelect name={`${prefix}-day`} placeholder="Day" options={Array.from({ length: 31 }, (_, index) => index + 1)} /><DateSelect name={`${prefix}-month`} placeholder="Month" options={months} /><DateSelect name={`${prefix}-year`} placeholder="Year" options={Array.from({ length: 4 }, (_, index) => 2026 + index)} /></div></fieldset>;
}

export function SiteFooter({ onNavigate }) {
  return <footer className="site-footer"><div className="footer-brand"><FooterLogo /><p>Luxury gifts, flowers and thoughtful presentation for every occasion.</p><a className="footer-location" href="https://maps.google.com/?q=ACP+Estate+Junction+Kwabenya+Accra" target="_blank" rel="noreferrer">ACP Estate Junction, Kwabenya, Accra</a></div><div className="footer-directory"><div className="footer-pages"><button onClick={() => onNavigate?.('about')}><b>ABOUT</b><span>Our story</span></button><button onClick={() => onNavigate?.('services')}><b>SERVICES</b><span>What we do</span></button><button onClick={() => onNavigate?.('customize')}><b>CUSTOM</b><span>Build a gift</span></button><button onClick={() => onNavigate?.('careers')}><b>CAREERS</b><span>Join the team</span></button><button onClick={() => onNavigate?.('shop')}><b>SHOP</b><span>Browse gifts</span></button></div><div className="footer-guides"><button onClick={() => onNavigate?.('delivery')}><b>DELIVERY & FAQ</b><span>Timing and answers</span></button><button onClick={() => onNavigate?.('policy')}><b>ORDER POLICY</b><span>How orders work</span></button></div><nav aria-label="Contact links"><a href="tel:+233202417072" aria-label="Call The Gifting Factory">CALL</a><a href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer" aria-label="Message The Gifting Factory on WhatsApp">WA</a><a href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer" aria-label="Visit The Gifting Factory on Instagram">IG</a></nav></div><div className="footer-meta"><small>© 2026 The Gifting Factory by Flower Girl</small><small>Same-day delivery available in Accra</small></div></footer>;
}

export function InformationPage({ type, onNavigate }) {
  const delivery = type === 'delivery';
  return <main className="content-page information-page"><header className="content-page-heading"><span>{delivery ? 'DELIVERY & FAQ' : 'ORDER POLICY'}</span><h1>{delivery ? <>Delivery,<br />clearly arranged.</> : <>Before we<br />begin.</>}</h1></header>{delivery ? <section className="information-list"><article><span>01</span><h2>Where do you deliver?</h2><p>Delivery is available across Accra. Share the complete address and a reachable recipient number when ordering.</p></article><article><span>02</span><h2>Can I request same-day delivery?</h2><p>Yes, when stock, preparation time and the destination allow it. The team confirms availability before payment.</p></article><article><span>03</span><h2>Can I schedule a delivery?</h2><p>Yes. Choose a preferred date in the gift builder or booking form. A delivery window is confirmed with your order.</p></article><article><span>04</span><h2>Can I collect my order?</h2><p>Collection can be arranged from ACP Estate Junction, Kwabenya, after the team confirms that your order is ready.</p></article></section> : <section className="information-list"><article><span>01</span><h2>Quotes and payment</h2><p>Prices marked “From” are starting estimates. The final total is confirmed after product availability, customization and delivery are agreed.</p></article><article><span>02</span><h2>Custom orders</h2><p>Production begins after the design, wording, total and payment terms are confirmed. Check names and messages carefully before approval.</p></article><article><span>03</span><h2>Changes and cancellations</h2><p>Personalized items cannot be changed after production starts. Contact the team promptly if an order detail needs attention.</p></article><article><span>04</span><h2>Fresh and sourced items</h2><p>Flowers and sourced products depend on availability. When necessary, the team discusses a suitable replacement before completing the gift.</p></article></section>}<div className="page-cta-row"><button className="primary-action" onClick={() => onNavigate?.('customize')}>START A REQUEST</button><button className="soft-action" onClick={() => onNavigate?.('shop')}>VISIT THE SHOP</button></div><SiteFooter onNavigate={onNavigate} /></main>;
}

export function AboutPage({ onNavigate }) {
  return <main className="content-page about-page"><header className="content-page-heading"><span>OUR STORY</span><h1>Gifts made<br />personal.</h1></header><section className="about-intro"><p className="about-lead">The Gifting Factory by Flower Girl is an Accra gift shop creating luxury hampers, fresh flower arrangements and carefully finished packages for the people and moments that matter.</p><div><p>From ready-to-order gifts to custom boxes, engagement wrapping and engraving, every order begins with the recipient, the occasion and your budget.</p><p>Collection and delivery timing are confirmed with each order. Same-day delivery is available when timing and stock permit.</p></div></section><section className="about-path"><article><span>01</span><p><strong>Tell us who it is for.</strong>Share the recipient, occasion, preferred colours, budget and anything that makes the gift feel personal.</p></article><article><span>02</span><p><strong>We compose every detail.</strong>Products, flowers, wrapping, engraving and the message card are brought into one considered presentation.</p></article><article><span>03</span><p><strong>Choose how it arrives.</strong>Collect from the shop, schedule a delivery, or request same-day service when timing and availability permit.</p></article></section><div className="page-cta-row"><button className="primary-action" onClick={() => onNavigate?.('customize')}>BUILD A CUSTOM GIFT</button><button className="soft-action" onClick={() => onNavigate?.('services')}>VIEW ALL SERVICES</button></div><SiteFooter onNavigate={onNavigate} /></main>;
}

export function CareersPage({ onNavigate }) {
  const [applicationSent, setApplicationSent] = useState(false);
  return <main className="content-page careers-page"><header className="content-page-heading"><span>CAREERS · ACCRA</span><h1>Join our<br />creative team.</h1></header><section className="career-layout"><div className="career-role"><span>OPEN POSITION</span><h2>Content Creator &amp;<br />Social Media Manager</h2><p>We are looking for a creative, passionate and trend-aware person to manage content and grow our online community.</p><a className="primary-action" href="#application">START APPLICATION</a></div><div className="career-details"><article><h3>Key responsibilities</h3><ul><li>Create engaging content for social platforms</li><li>Plan and manage the content calendar</li><li>Shoot and edit polished photos, videos and graphics</li><li>Monitor trends and suggest creative ideas</li><li>Engage followers and help grow the community</li><li>Review performance and provide monthly reports</li></ul></article><article><h3>What we are looking for</h3><ul><li>Experience in content creation or social media</li><li>Clear written and verbal communication</li><li>Confidence using content creation tools</li><li>Strong understanding of social trends and analytics</li><li>Independent, detail-oriented working style</li><li>Interest in branding, storytelling and engagement</li></ul></article><article><h3>What we offer</h3><ul><li>Competitive salary</li><li>Creative and supportive work environment</li><li>Opportunities for growth and development</li><li>A chance to shape a growing Ghanaian gifting brand</li></ul></article></div></section><section className="application-section" id="application"><div><span>APPLICATION</span><h2>Tell us about<br />your work.</h2><p>Share the details that help the team understand your experience and creative point of view.</p></div><form onSubmit={event => { event.preventDefault(); setApplicationSent(true); }}><div className="application-grid"><label>Full name<input required /></label><label>Email address<input required type="email" /></label><label>Phone / WhatsApp<input required type="tel" /></label><label>Current location<input required /></label><label>Portfolio or social link<input required type="url" placeholder="https://" /></label><DateField label="Earliest start date" prefix="career" /></div><label>Relevant experience<textarea required rows="4" /></label><label>Why do you want to join the team?<textarea required rows="5" /></label><label className="upload-field">Attach CV / résumé<input required type="file" accept=".pdf,.doc,.docx" /></label><button className="primary-action" type="submit">SUBMIT APPLICATION</button>{applicationSent && <p className="inline-success">Application details saved. Email delivery will activate when the hiring inbox is connected.</p>}</form></section><SiteFooter onNavigate={onNavigate} /></main>;
}

export function CustomizePage({ onNavigate }) {
  const [selected, setSelected] = useState([]);
  const [sent, setSent] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const toggle = option => setSelected(current => current.includes(option) ? current.filter(item => item !== option) : [...current, option]);
  const unitEstimate = selected.reduce((sum, option) => sum + (CUSTOM_ESTIMATES[option] || 0), 0);
  const estimateLow = unitEstimate * quantity;
  const estimateHigh = Math.ceil(estimateLow * 1.12 / 10) * 10;
  return <main className="content-page customize-page"><header className="content-page-heading"><span>BESPOKE GIFT BUILDER</span><h1>Make it<br />theirs.</h1></header><div className="custom-gallery"><figure><img src="/assets/hamper-editorial-v2.png" alt="Luxury hamper inspiration" /><figcaption>Hampers</figcaption></figure><figure><img src="/assets/bouquet-editorial-v2.png" alt="Fresh flower inspiration" /><figcaption>Flowers</figcaption></figure><figure><img src="/assets/embroidery-editorial-v2.png" alt="Embroidery and personalization inspiration" /><figcaption>Personalization</figcaption></figure></div><div className="custom-builder"><form onSubmit={event => { event.preventDefault(); setSent(true); }}>{Object.entries(CUSTOM_OPTIONS).map(([group, options], groupIndex) => <fieldset key={group}><legend><span>{String(groupIndex + 1).padStart(2, '0')}</span>{group}</legend><div>{options.map(option => <label key={option} className={selected.includes(option) ? 'selected' : ''}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />{option}</label>)}</div></fieldset>)}<label className="custom-note">Tell us the occasion, recipient, colours, budget or inspiration<textarea required rows="5" /></label><div className="custom-contact"><label>Name<input required /></label><label>WhatsApp number<input required type="tel" /></label><DateField label="Preferred date" prefix="custom" /></div><div className="custom-quantity"><span>NUMBER OF IDENTICAL GIFTS</span><QuantityControl value={quantity} label="custom gifts" onDecrease={() => setQuantity(current => Math.max(1, current - 1))} onIncrease={() => setQuantity(current => current + 1)} /></div><input type="hidden" name="custom-quantity" value={quantity} /><button className="primary-action" type="submit">{sent ? 'REQUEST SAVED' : `SAVE ${quantity > 1 ? `${quantity} ` : ''}CUSTOM REQUEST${quantity > 1 ? 'S' : ''}`}</button>{sent && <p className="inline-success">Your selections for {quantity} gift{quantity > 1 ? 's are' : ' is'} ready. Continue on WhatsApp to confirm availability and pricing.</p>}</form><aside><img src="/assets/hamper-editorial-v2.png" alt="A curated luxury gift hamper" /><span>YOUR SELECTION · QTY {quantity}</span><h2>{selected.length ? `${selected.length} choices` : 'Start with anything'}</h2><p>{selected.length ? selected.join(' · ') : 'Choose a base, add the items they will love, and tell us how to finish it.'}</p><div className="estimate-panel"><small>LIVE ESTIMATE</small>{unitEstimate ? <><strong>GHS {estimateLow.toLocaleString()}–{estimateHigh.toLocaleString()}</strong><p>For {quantity} gift{quantity > 1 ? 's' : ''}. Final pricing follows stock and delivery confirmation.</p></> : <p>Select a base and gift items to calculate an estimate.</p>}</div><a className="soft-action" href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer">CONTINUE ON WHATSAPP</a></aside></div><SiteFooter onNavigate={onNavigate} /></main>;
}

function RequestModal({ service, onClose }) {
  const [sent, setSent] = useState(false);
  const [fileName, setFileName] = useState('');
  const submit = (event) => { event.preventDefault(); setSent(true); };

  return (
    <div className="flow-backdrop" onClick={onClose}>
      <section className="flow-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <button className="round-icon close-flow" onClick={onClose} aria-label="Close request"><X size={18} /></button>
        {sent ? (
          <div className="flow-success"><Check size={28} /><h2>Request saved</h2><p>Contact the business on WhatsApp to continue your request.</p><a className="primary-action" href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer">CONTINUE ON WHATSAPP</a></div>
        ) : (
          <form onSubmit={submit}>
            <span className="form-eyebrow">SERVICE REQUEST</span><h2>{service}</h2>
            <label>Name<input name="name" required /></label>
            <label>Phone or WhatsApp<input name="phone" type="tel" required /></label>
            <label>Occasion<input name="occasion" required /></label>
            <DateField label="Preferred date" prefix="request" />
            <label>Request<textarea name="request" rows="4" required /></label>
            <label className="upload-field"><Upload size={16} /> Inspiration image<input type="file" accept="image/*" onChange={(event) => setFileName(event.target.files?.[0]?.name || '')} /></label>
            {fileName && <small>{fileName}</small>}
            <button className="primary-action" type="submit">SAVE REQUEST</button>
          </form>
        )}
      </section>
    </div>
  );
}

function QuantityControl({ value, onDecrease, onIncrease, label }) {
  return <div className="quantity-control" aria-label={label}><button type="button" onClick={onDecrease} aria-label={`Reduce ${label}`}><Minus size={14} /></button><span>{value}</span><button type="button" onClick={onIncrease} aria-label={`Increase ${label}`}><Plus size={14} /></button></div>;
}

function CheckoutModal({ cart, onClose, onQuantity }) {
  const [complete, setComplete] = useState(false);
  const [locationLink, setLocationLink] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [scrollState, setScrollState] = useState({ progress: 0, visible: false });
  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const submit = (event) => { event.preventDefault(); setComplete(true); };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('Location is not available in this browser.'); return; }
    setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setLocationLink(`https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`);
      setLocationStatus('Current location added. You can still edit the link.');
    }, () => setLocationStatus('Location permission was not granted. Paste a Maps link instead.'), { enableHighAccuracy: true, timeout: 10000 });
  };
  return (
    <div className="flow-backdrop" onClick={onClose}>
      <section className="flow-modal checkout-modal" onScroll={event => { const node = event.currentTarget; const available = node.scrollHeight - node.clientHeight; setScrollState({ progress: available > 0 ? node.scrollTop / available : 0, visible: available > 8 }); }} onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <div className={`modal-scroll-indicator ${scrollState.visible ? 'visible' : ''}`} aria-hidden="true"><span style={{ top: `${scrollState.progress * 100}%`, transform: `translateY(-${scrollState.progress * 100}%)` }} /></div>
        <button className="round-icon close-flow" onClick={onClose} aria-label="Close checkout"><X size={18} /></button>
        {!cart.length ? (
          <div className="flow-success empty-order"><span className="form-eyebrow">YOUR ORDER</span><h2>Your bag is empty</h2><p>Add a ready-made gift or begin with the custom gift builder.</p><button className="primary-action" onClick={onClose}>BROWSE THE SHOP</button></div>
        ) : complete ? (
          <div className="flow-success"><Check size={28} /><h2>{isPaystackTestConfigured ? 'Paystack test checkout configured' : 'Ready for Paystack test mode'}</h2><p>{isPaystackTestConfigured ? 'The public test configuration is present. Server-side initialization and webhook verification are the remaining activation steps.' : 'Your order remains saved. Add the test credentials and server verification endpoint to activate secure Mobile Money and card testing.'}</p><button className="primary-action" onClick={onClose}>RETURN TO THE SHOP</button></div>
        ) : (
          <form onSubmit={submit}>
            <span className="form-eyebrow">CHECKOUT</span><h2>Your order</h2>
            <div className="checkout-summary">{cart.map(item => <div className="checkout-line" key={item.id}><div><span>{item.name}</span><small>GHS {item.price.toLocaleString()} each</small></div><QuantityControl value={item.quantity} label={item.name} onDecrease={() => onQuantity(item.id, item.quantity - 1)} onIncrease={() => onQuantity(item.id, item.quantity + 1)} /><strong>GHS {(item.price * item.quantity).toLocaleString()}</strong></div>)}</div>
            <div className="checkout-total"><span>SUBTOTAL</span><strong>GHS {total.toLocaleString()}</strong></div>
            <div className="checkout-contact-grid"><label>Customer name<input required /></label><label>Email for receipt<input required type="email" /></label><label>Phone or WhatsApp<input type="tel" required /></label><label><span className="field-label">Recipient name <small>optional</small></span><input name="recipient-name" placeholder="Leave blank if you are receiving it" /></label></div>
            <label>Delivery address<textarea rows="2" required /></label><label>Nearest landmark<input /></label>
            <div className="location-field"><label>Google Maps or location link<input type="url" value={locationLink} onChange={event => setLocationLink(event.target.value)} placeholder="https://maps.google.com/..." /></label><button type="button" onClick={useCurrentLocation}><LocateFixed size={15} /> USE MY LOCATION</button>{locationStatus && <small><MapPin size={13} />{locationStatus}</small>}</div>
            <label>Delivery instructions<textarea rows="2" placeholder="Gate, floor, preferred call time or surprise-delivery note" /></label><DateField label="Delivery date" prefix="checkout" />
            <button className="primary-action" type="submit">CONTINUE TO SECURE PAYMENT {total > 0 ? `· GHS ${total.toLocaleString()}` : ''}</button>
          </form>
        )}
      </section>
    </div>
  );
}

export function ServicesPage({ onNavigate }) {
  const [selected, setSelected] = useState(SERVICES[0]);
  const [requestOpen, setRequestOpen] = useState(null);
  const showService = service => {
    setSelected(service);
    if (window.innerWidth <= 900) window.setTimeout(() => document.querySelector('.service-story')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };
  return (
    <main className="content-page services-page">
      <header className="content-page-heading"><span>THE GIFTING FACTORY BY FLOWER GIRL</span><h1>Services</h1></header>
      <div className="service-story-layout"><ol className="service-index simple-service-index">{SERVICES.map((service, index) => <li key={service.name} className={selected.name === service.name ? 'active' : ''}><button onClick={() => showService(service)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{service.name}</strong><ArrowRight size={16} /></button></li>)}</ol><aside className="service-story"><img src={selected.image} alt={selected.name} /><span>SELECTED SERVICE</span><h2>{selected.name}</h2><p>{selected.detail}</p><div><button className="primary-action" onClick={() => setRequestOpen(selected)}>BOOK THIS SERVICE</button><button className="soft-action" onClick={() => onNavigate?.('customize')}>CUSTOMIZE SERVICE</button></div></aside></div>
      <SiteFooter onNavigate={onNavigate} />
      {requestOpen && <RequestModal service={requestOpen.name} onClose={() => setRequestOpen(null)} />}
    </main>
  );
}

export function GalleryPage({ onNavigate }) {
  const images = [
    { src: '/assets/hamper-editorial-v2.png', label: 'Luxury gift hamper' },
    { src: '/assets/bouquet-editorial-v2.png', label: 'Fresh flower bouquet' },
    { src: '/assets/luxury_hamper_cutout.png', label: 'Curated gift box' },
    { src: '/assets/hero_orange_roses_cutout.png', label: 'Fresh flowers' }
  ];
  return <main className="content-page gallery-page"><header className="content-page-heading"><span>THE GIFTING FACTORY BY FLOWER GIRL</span><h1>Gallery</h1></header><div className="gallery-grid">{images.map((image, index) => <figure key={`${image.src}-${index}`}><img src={image.src} alt={image.label} /><figcaption>{image.label}</figcaption></figure>)}</div><a className="instagram-action" href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer">SEE MORE ON INSTAGRAM <ArrowRight size={16} /></a><SiteFooter onNavigate={onNavigate} /></main>;
}

function ProductDetail({ product, saved, onClose, onAdd, onToggleWishlist, onCustomize }) {
  const [quantity, setQuantity] = useState(1);
  return <div className="flow-backdrop" onClick={onClose}><section className="product-detail" role="dialog" aria-modal="true" aria-label={`${product.name} details`} onClick={event => event.stopPropagation()}><button className="round-icon close-flow" onClick={onClose} aria-label="Close product details"><X size={18} /></button><div className="product-detail-visual"><img src={product.image} alt={product.name} /></div><div className="product-detail-copy"><span>{product.tag}</span><h2>{product.name}</h2><p>{product.detail}</p><strong>{product.priceLabel}</strong><div className="product-includes"><small>WHAT’S INCLUDED</small>{product.includes.map(item => <p key={item}><Check size={14} />{item}</p>)}</div><div className="detail-order-row"><QuantityControl value={quantity} label={product.name} onDecrease={() => setQuantity(current => Math.max(1, current - 1))} onIncrease={() => setQuantity(current => current + 1)} /><button className="primary-action" onClick={() => { onAdd(product, quantity); onClose(); }}>ADD {quantity} TO ORDER</button></div><div className="detail-secondary"><button onClick={() => onToggleWishlist(product.id)}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'SAVED' : 'SAVE GIFT'}</button><button onClick={() => { onClose(); onCustomize(product.name); }}>CUSTOMIZE THIS GIFT</button></div><small className="merch-note">Final availability, substitutions and delivery are confirmed before payment.</small></div></section></div>;
}

function WishlistModal({ products, onClose, onView, onRemove }) {
  const [scrollState, setScrollState] = useState({ progress: 0, visible: false });
  return <div className="flow-backdrop" onClick={onClose}><section className="flow-modal wishlist-modal shared-scroll-panel" onScroll={event => { const node = event.currentTarget; const available = node.scrollHeight - node.clientHeight; setScrollState({ progress: available > 0 ? node.scrollTop / available : 0, visible: available > 8 }); }} role="dialog" aria-modal="true" aria-label="Saved gifts" onClick={event => event.stopPropagation()}><div className={`modal-scroll-indicator ${scrollState.visible ? 'visible' : ''}`} aria-hidden="true"><span style={{ top: `${scrollState.progress * 100}%`, transform: `translateY(-${scrollState.progress * 100}%)` }} /></div><button className="round-icon close-flow" onClick={onClose} aria-label="Close wishlist"><X size={18} /></button><span className="form-eyebrow">WISHLIST</span><h2>Saved gifts</h2>{products.length ? <div className="wishlist-list">{products.map(product => <article key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.priceLabel}</span></div><button onClick={() => onView(product)}>VIEW</button><button onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from wishlist`}><X size={15} /></button></article>)}</div> : <div className="empty-wishlist"><p>Save gifts while browsing and they will stay here when you return.</p><button className="primary-action" onClick={onClose}>BROWSE THE SHOP</button></div>}</section></div>;
}

export function ShopPage({ onNavigate, cart, setCart, wishlist, setWishlist, openCheckout, onCheckoutHandled, openWishlist, onWishlistHandled }) {
  const [requestProduct, setRequestProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const add = (product, quantity = 1) => setCart(current => current.some(item => item.id === product.id) ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { ...product, quantity }]);
  const updateQuantity = (id, quantity) => setCart(current => quantity < 1 ? current.filter(item => item.id !== id) : current.map(item => item.id === id ? { ...item, quantity } : item));
  const toggleWishlist = id => setWishlist(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const savedProducts = PRODUCTS.filter(product => wishlist.includes(product.id));
  return (
    <main className="content-page shop-page">
      <header className="content-page-heading shop-heading"><div><span>ORDERS & BOOKINGS</span><h1>Shop</h1></div></header>
      <div className="shop-custom-banner"><div><span>BUILD YOUR OWN</span><h2>Choose every detail.</h2><p>Start with flowers or a box, then add perfume, chocolate, fashion, jewelry, engraving and delivery.</p></div><button className="primary-action" onClick={() => onNavigate?.('customize')}>OPEN GIFT BUILDER</button></div><div className="product-grid">{PRODUCTS.map(product => <article className={`product-${product.id}`} key={product.id}><button className={`product-save ${wishlist.includes(product.id) ? 'saved' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label={`${wishlist.includes(product.id) ? 'Remove' : 'Save'} ${product.name}`}><Heart size={17} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} /></button><button className="product-visual" onClick={() => setDetailProduct(product)}><img src={product.image} alt={product.name} /></button><span>{product.tag} · {product.priceLabel}</span><button className="product-title" onClick={() => setDetailProduct(product)}><h2>{product.name}</h2></button><p>{product.detail}</p><div className="product-actions"><button onClick={() => add(product)}>ADD TO ORDER</button><button onClick={() => setDetailProduct(product)}>VIEW DETAILS</button></div></article>)}</div>
      {requestProduct && <RequestModal service={requestProduct} onClose={() => setRequestProduct(null)} />}
      {detailProduct && <ProductDetail product={detailProduct} saved={wishlist.includes(detailProduct.id)} onClose={() => setDetailProduct(null)} onAdd={add} onToggleWishlist={toggleWishlist} onCustomize={setRequestProduct} />}
      {openWishlist && <WishlistModal products={savedProducts} onClose={onWishlistHandled} onView={product => { onWishlistHandled(); setDetailProduct(product); }} onRemove={toggleWishlist} />}
      {openCheckout && <CheckoutModal cart={cart} onClose={onCheckoutHandled} onQuantity={updateQuantity} />}
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
