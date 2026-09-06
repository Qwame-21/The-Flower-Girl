import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, Check, Upload, Heart, Minus, Plus, MapPin, LocateFixed, Flower2, CircleDollarSign, LoaderCircle, PackageCheck, Truck, BadgeCheck } from 'lucide-react';
import { addAdminRecord, readAdminData, subscribeAdminData, updateAdminCollection } from '../data/adminStore';
import { PRODUCTS } from '../data/products';

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
  'Personalize': ['Engraved name', 'Embroidered name', 'Card message & design', 'Photo insert', 'Branded ribbon', 'Company branding'],
  'Finish & deliver': ['Gift wrapping', 'Engagement wrapping', 'Same-day Accra delivery', 'Scheduled delivery', 'Store collection', 'Surprise delivery']
};

const CUSTOM_ESTIMATES = {
  'Luxury box': 220, 'Open hamper': 180, 'Flower bouquet': 450, 'Gift bag': 120, 'Keepsake basket': 280, 'Corporate box': 240,
  Perfume: 480, Chocolate: 120, 'Fresh flowers': 300, Jewelry: 350, 'Wrist bag': 320, Watch: 420, Tumbler: 160, Fabric: 380,
  'Self-care items': 220, Shirt: 250, 'Manicure set': 130, 'Tea & cookies': 90, Juice: 45, 'Hot water bottle': 110,
  'Engraved name': 80, 'Embroidered name': 120, 'Card message & design': 40, 'Photo insert': 25, 'Branded ribbon': 65, 'Company branding': 160,
  'Gift wrapping': 90, 'Engagement wrapping': 240, 'Same-day Accra delivery': 120, 'Scheduled delivery': 90, 'Store collection': 0, 'Surprise delivery': 140
};

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

function formDate(data, prefix) {
  const day = data.get(`${prefix}-day`);
  const month = data.get(`${prefix}-month`);
  const year = data.get(`${prefix}-year`);
  return day && month && year ? `${day} ${month} ${year}` : '';
}

export function SiteFooter({ onNavigate }) {
  return <footer className="site-footer"><div className="footer-brand"><FooterLogo /><p>Luxury gifts, flowers and thoughtful presentation for every occasion.</p><a className="footer-location" href="https://maps.google.com/?q=ACP+Estate+Junction+Kwabenya+Accra" target="_blank" rel="noreferrer">ACP Estate Junction, Kwabenya, Accra</a></div><div className="footer-directory"><div className="footer-pages"><button onClick={() => onNavigate?.('about')}><b>ABOUT</b><span>Our story</span></button><button onClick={() => onNavigate?.('services')}><b>SERVICES</b><span>What we do</span></button><button onClick={() => onNavigate?.('customize')}><b>CUSTOM</b><span>Build a gift</span></button><button onClick={() => onNavigate?.('careers')}><b>CAREERS</b><span>Join the team</span></button><button onClick={() => onNavigate?.('shop')}><b>SHOP</b><span>Browse gifts</span></button></div><div className="footer-guides"><button onClick={() => onNavigate?.('track')}><b>TRACK ORDER</b><span>Check fulfillment</span></button><button onClick={() => onNavigate?.('delivery')}><b>DELIVERY & FAQ</b><span>Timing and answers</span></button><button onClick={() => onNavigate?.('policy')}><b>ORDER POLICY</b><span>How orders work</span></button></div><nav aria-label="Contact links"><a href="tel:+233202417072" aria-label="Call The Gifting Factory">CALL</a><a href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer" aria-label="Message The Gifting Factory on WhatsApp">WA</a><a href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer" aria-label="Visit The Gifting Factory on Instagram">IG</a></nav></div><div className="footer-meta"><small>© 2026 The Gifting Factory by Flower Girl</small><small>Same-day delivery in Accra</small></div></footer>;
}

export function LegacyTrackOrderPage({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [credential, setCredential] = useState('');
  const phone = credential;
  const setPhone = setCredential;
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [trackingData, setTrackingData] = useState(readAdminData);
  useEffect(() => subscribeAdminData(data => { setTrackingData(data); setResult(current => current ? current.kind === 'request' ? { ...current, record: data.requests.find(request => request.id === current.record.id) || current.record } : { ...current, record: data.orders.find(order => order.id === current.record.id) || current.record } : current); }), []);
  const stages = ['paid', 'packaging', 'ready', 'delivery', 'completed'];
  const labels = { paid: 'Paid', packaging: 'Processing', ready: 'Packed', delivery: 'Dispatched', completed: 'Delivered', pending_payment: 'Awaiting payment' };
  const search = event => { event.preventDefault(); const value = query.trim().toLowerCase(); const contact = credential.trim().toLowerCase(); const normalizedPhone = contact.replace(/\D/g, ''); const credentialMatches = item => item.email?.toLowerCase() === contact || item.customerEmail?.toLowerCase() === contact || (normalizedPhone.length >= 7 && item.phone?.replace(/\D/g, '') === normalizedPhone); const order = trackingData.orders.find(item => (item.tracking?.toLowerCase() === value || item.code?.toLowerCase() === value) && credentialMatches(item)); const request = trackingData.requests.find(item => (item.reference?.toLowerCase() === value || item.id?.toLowerCase() === value) && credentialMatches(item)); setResult(order ? { kind: 'order', record: order } : request ? { kind: 'request', record: request } : null); setSearched(true); };
  const order = result?.kind === 'order' ? result.record : null;
  const request = result?.kind === 'request' ? result.record : null;
  return <main className="content-page track-page"><header className="content-page-heading"><span>ORDER & REQUEST TRACKING</span><h1>Follow your<br />gift.</h1></header><section className="track-workspace"><form onSubmit={search}><label>Tracking, order or request number<input value={query} onChange={event => setQuery(event.target.value)} required placeholder="GF-123456 or RQ-123456" /></label><label>Order phone number<input value={phone} onChange={event => setPhone(event.target.value)} required type="tel" placeholder="024 000 0000" /></label><button className="primary-action">TRACK</button></form>{order ? <article><span>{order.tracking}</span><h2>{order.customer}</h2><p>Your order is currently <strong>{labels[order.status] || order.status}</strong>.</p>{order.status === 'pending_payment' && <p>Payment has not been confirmed. The team will contact you with the approved payment method.</p>}<div className="tracking-timeline"><i className={order.paymentStatus === 'paid' ? 'done' : ''}><b /><span>{order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting payment'}</span><time>{order.paidAt ? new Date(order.paidAt).toLocaleString('en-GH') : 'Update pending'}</time></i>{stages.slice(1).map(stage => <i key={stage} className={stages.indexOf(stage) <= stages.indexOf(order.status) ? 'done' : ''}><b /><span>{labels[stage]}</span>{order[`${stage}At`] ? <time>{new Date(order[`${stage}At`]).toLocaleString('en-GH')}</time> : <time>Update pending</time>}</i>)}</div><section className="track-order-details"><p><strong>Recipient:</strong> {order.recipient || order.customer}</p><p><strong>Ordered:</strong> {new Date(order.createdAt).toLocaleString('en-GH')}</p><p><strong>Delivery:</strong> {order.delivery || 'Awaiting confirmation'}</p>{order.requestedDeliveryDate && <p><strong>Requested date:</strong> {order.requestedDeliveryDate}</p>}<p><strong>Payment:</strong> {order.paymentStatus === 'paid' ? 'Confirmed' : 'Awaiting confirmation'} · {order.paymentMethod || 'Method pending'}</p>{order.estimatedDelivery && <p><strong>Estimated delivery:</strong> {new Date(order.estimatedDelivery).toLocaleString('en-GH')}</p>}{order.adminNote && <p><strong>Update from the team:</strong> {order.adminNote}</p>}{order.receivedBy && <p><strong>Received by:</strong> {order.receivedBy}{order.proofNote ? ` · ${order.proofNote}` : ''}</p>}<p><strong>Items:</strong> {order.items?.map(item => `${item.qty || item.quantity || 1}× ${item.name}`).join(', ')}</p></section></article> : request ? <article className="tracked-request"><span>{request.reference || request.id}</span><h2>{request.name || 'Custom request'}</h2><p>Your request is <strong>{request.status === 'converted' ? 'now an order' : request.status === 'approved' ? 'approved' : request.status === 'quote_needed' ? 'being quoted' : 'received'}</strong>.</p><section className="track-order-details"><p><strong>Service:</strong> {request.service || request.selections?.join(', ') || 'Bespoke gift'}</p><p><strong>Preferred date:</strong> {request.preferredDate || 'To confirm'}</p><p><strong>Quantity:</strong> {request.quantity || 1}</p>{request.quoteTotal && <p><strong>Confirmed quote:</strong> GHS {Number(request.quoteTotal).toLocaleString()}</p>}<p><strong>Next step:</strong> {request.status === 'approved' ? 'The team is preparing this request for order creation.' : request.status === 'converted' ? 'Use the order tracking number shared by the team.' : 'The team will contact you after reviewing availability and pricing.'}</p></section></article> : searched && <div className="track-empty"><p>No record matched both details. Check the reference and phone number, then try again.</p><a href={`tel:${String(trackingData.settings.supportPhone || '').replace(/[^+\d]/g, '')}`}>Call {trackingData.settings.supportPhone}</a></div>}</section><SiteFooter onNavigate={onNavigate} /></main>;
}

function TrackingIcon({ stage }) {
  if (stage === 'paid') return <CircleDollarSign />;
  if (stage === 'packaging') return <LoaderCircle />;
  if (stage === 'ready') return <PackageCheck />;
  if (stage === 'delivery') return <Truck />;
  return <BadgeCheck />;
}

export function TrackOrderPage({ onNavigate }) {
  const [reference, setReference] = useState('');
  const [credential, setCredential] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [trackingData, setTrackingData] = useState(readAdminData);
  const resultRef = useRef(null);
  useEffect(() => subscribeAdminData(data => { setTrackingData(data); setResult(current => current ? { ...current, record: (current.kind === 'order' ? data.orders : data.requests).find(record => record.id === current.record.id) || current.record } : current); }), []);
  useEffect(() => { if (result) window.requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }, [result]);

  const search = event => {
    event.preventDefault();
    const value = reference.trim().toLowerCase();
    const contact = credential.trim().toLowerCase();
    const digits = contact.replace(/\D/g, '');
    const matchesContact = record => record.email?.toLowerCase() === contact || record.customerEmail?.toLowerCase() === contact || (digits.length >= 7 && record.phone?.replace(/\D/g, '') === digits);
    const order = trackingData.orders.find(record => (record.tracking?.toLowerCase() === value || record.code?.toLowerCase() === value) && matchesContact(record));
    const request = trackingData.requests.find(record => (record.reference?.toLowerCase() === value || record.id?.toLowerCase() === value) && matchesContact(record));
    setResult(order ? { kind: 'order', record: order } : request ? { kind: 'request', record: request } : null);
    setSearched(true);
  };

  const labels = { paid: 'Paid', packaging: 'Processing', ready: 'Packed', delivery: 'Dispatched', completed: 'Delivered', pending_payment: 'Awaiting payment' };
  const stages = ['paid', 'packaging', 'ready', 'delivery', 'completed'];
  const order = result?.kind === 'order' ? result.record : null;
  const request = result?.kind === 'request' ? result.record : null;

  return <main className="content-page track-page">
    <header className="content-page-heading track-page-heading"><span>ORDER &amp; REQUEST TRACKING</span><h1>Follow your<br />gift.</h1><p>Enter the reference we shared and either the phone number or email used for the request.</p></header>
    <section className="track-workspace">
      <form onSubmit={search}>
        <label>Tracking, order or request number<input value={reference} onChange={event => setReference(event.target.value)} required placeholder="GF-123456 or RQ-123456" /></label>
        <label>Phone number or email<input value={credential} onChange={event => setCredential(event.target.value)} required placeholder="024 000 0000 or you@example.com" /></label>
        <button className="primary-action">TRACK</button>
      </form>
      {order && <article ref={resultRef} className="tracking-result"><span>{order.tracking}</span><h2>{order.customer}</h2><p>Your order is currently <strong>{labels[order.status] || order.status}</strong>.</p><div className="tracking-timeline">{stages.map(stage => { const done = stages.indexOf(stage) <= stages.indexOf(order.status) || (stage === 'paid' && order.paymentStatus === 'paid'); const current = stage === order.status || (stage === 'paid' && order.status === 'pending_payment'); const note = order[`${stage}Note`] || (current ? order.adminNote : ''); return <i key={stage} className={`${done ? 'done' : ''} ${current ? 'is-current' : ''}`}><b><TrackingIcon stage={stage} /></b><span className="tracking-stage-label">{stage === 'paid' && order.paymentStatus !== 'paid' ? 'Awaiting payment' : labels[stage]}</span><time>{order[`${stage}At`] ? new Date(order[`${stage}At`]).toLocaleString('en-GH') : 'Update pending'}</time>{note && <small>{note}</small>}</i>; })}</div><section className="track-order-details"><p><strong>Recipient:</strong> {order.recipient || order.customer}</p><p><strong>Delivery:</strong> {order.delivery || 'Awaiting confirmation'}</p><p><strong>Payment:</strong> {order.paymentStatus === 'paid' ? 'Confirmed' : 'Awaiting confirmation'}</p>{order.estimatedDelivery && <p><strong>Estimated delivery:</strong> {new Date(order.estimatedDelivery).toLocaleString('en-GH')}</p>}{order.adminNote && <p><strong>Latest update:</strong> {order.adminNote}</p>}</section></article>}
      {request && <article ref={resultRef} className="tracked-request tracking-result"><span>{request.reference || request.id}</span><h2>{request.name || 'Custom request'}</h2><p>Your request is <strong>{request.status === 'converted' ? 'now an order' : request.status === 'approved' ? 'approved' : request.status === 'quote_needed' ? 'being quoted' : 'received'}</strong>.</p><section className="track-order-details"><p><strong>Service:</strong> {request.service || request.selections?.join(', ') || 'Bespoke gift'}</p><p><strong>Preferred date:</strong> {request.preferredDate || 'To confirm'}</p>{request.quoteTotal && <p><strong>Confirmed quote:</strong> GHS {Number(request.quoteTotal).toLocaleString()}</p>}<p><strong>Latest update:</strong> {request.adminNote || 'The team will contact you as the request progresses.'}</p></section></article>}
      {searched && !result && <div className="track-empty"><p>No record matched those details. Check the reference and contact information, then try again.</p><a href={`tel:${String(trackingData.settings.supportPhone || '').replace(/[^+\d]/g, '')}`}>Call {trackingData.settings.supportPhone}</a></div>}
    </section>
    <SiteFooter onNavigate={onNavigate} />
  </main>;
}

export function InformationPage({ type, onNavigate }) {
  const delivery = type === 'delivery';
  const [content, setContent] = useState(() => readAdminData().content);
  useEffect(() => subscribeAdminData(data => setContent(data.content)), []);
  return <main className="content-page information-page"><header className="content-page-heading"><span>{delivery ? 'DELIVERY & FAQ' : 'ORDER POLICY'}</span><h1>{delivery ? <>Delivery,<br />clearly arranged.</> : <>Before we<br />begin.</>}</h1></header>{(delivery ? content.deliveryPolicy : content.orderPolicy) && <aside className="published-policy"><span>{delivery ? 'CURRENT DELIVERY NOTE' : 'CURRENT ORDER POLICY'}</span><p>{delivery ? content.deliveryPolicy : content.orderPolicy}</p></aside>}{delivery ? <section className="information-list"><article><span>01</span><h2>Where do you deliver?</h2><p>Delivery is available across Accra. Share the complete address and a reachable recipient number when ordering.</p></article><article><span>02</span><h2>Can I request same-day delivery?</h2><p>Yes, when stock, preparation time and the destination allow it. The team confirms availability before payment.</p></article><article><span>03</span><h2>Can I schedule a delivery?</h2><p>Yes. Choose a preferred date in the gift builder or booking form. A delivery window is confirmed with your order.</p></article><article><span>04</span><h2>Can I collect my order?</h2><p>Collection can be arranged from ACP Estate Junction, Kwabenya, after the team confirms that your order is ready.</p></article></section> : <section className="information-list"><article><span>01</span><h2>Quotes and payment</h2><p>Prices marked “From” are starting estimates. The final total is confirmed after product availability, customization and delivery are agreed.</p></article><article><span>02</span><h2>Custom orders</h2><p>Production begins after the design, wording, total and payment terms are confirmed. Check names and messages carefully before approval.</p></article><article><span>03</span><h2>Changes and cancellations</h2><p>Personalized items cannot be changed after production starts. Contact the team promptly if an order detail needs attention.</p></article><article><span>04</span><h2>Fresh and sourced items</h2><p>Flowers and sourced products depend on availability. When necessary, the team discusses a suitable replacement before completing the gift.</p></article></section>}<div className="page-cta-row"><button className="primary-action" onClick={() => onNavigate?.('customize')}>START A REQUEST</button><button className="soft-action" onClick={() => onNavigate?.('shop')}>VISIT THE SHOP</button></div><SiteFooter onNavigate={onNavigate} /></main>;
}

export function AboutPage({ onNavigate }) {
  return <main className="content-page about-page"><header className="content-page-heading about-page-heading"><div><span>OUR STORY</span><h1>Gifts made<br />personal.</h1></div><Flower2 className="about-gray-flower" strokeWidth={0.85} aria-hidden="true" /></header><section className="about-intro"><p className="about-lead">The Gifting Factory by Flower Girl is an Accra gift shop creating luxury hampers, fresh flower arrangements and carefully finished packages for the people and moments that matter.</p><div><p>From ready-to-order gifts to custom boxes, engagement wrapping and engraving, every order begins with the recipient, the occasion and your budget.</p><p>Collection and delivery timing are confirmed with each order. Same-day delivery is available when timing and stock permit.</p></div></section><section className="about-path"><article><span>01</span><p><strong>Tell us who it is for.</strong>Share the recipient, occasion, preferred colours, budget and anything that makes the gift feel personal.</p></article><article><span>02</span><p><strong>We compose every detail.</strong>Products, flowers, wrapping, engraving and the message card are brought into one considered presentation.</p></article><article><span>03</span><p><strong>Choose how it arrives.</strong>Collect from the shop, schedule a delivery, or request same-day service when timing and availability permit.</p></article></section><div className="page-cta-row"><button className="primary-action" onClick={() => onNavigate?.('customize')}>BUILD A CUSTOM GIFT</button><button className="soft-action" onClick={() => onNavigate?.('services')}>VIEW ALL SERVICES</button></div><SiteFooter onNavigate={onNavigate} /></main>;
}

export function CareersPage({ onNavigate }) {
  const [applicationSent, setApplicationSent] = useState(false);
  return <main className="content-page careers-page"><header className="content-page-heading"><span>CAREERS · ACCRA</span><h1>Join our<br />creative team.</h1></header><section className="career-layout"><div className="career-role"><span>OPEN POSITION</span><h2>Content Creator &amp;<br />Social Media Manager</h2><p>We are looking for a creative, passionate and trend-aware person to manage content and grow our online community.</p><a className="primary-action" href="#application">START APPLICATION</a></div><div className="career-details"><article><h3>Key responsibilities</h3><ul><li>Create engaging content for social platforms</li><li>Plan and manage the content calendar</li><li>Shoot and edit polished photos, videos and graphics</li><li>Monitor trends and suggest creative ideas</li><li>Engage followers and help grow the community</li><li>Review performance and provide monthly reports</li></ul></article><article><h3>What we are looking for</h3><ul><li>Experience in content creation or social media</li><li>Clear written and verbal communication</li><li>Confidence using content creation tools</li><li>Strong understanding of social trends and analytics</li><li>Independent, detail-oriented working style</li><li>Interest in branding, storytelling and engagement</li></ul></article><article><h3>What we offer</h3><ul><li>Competitive salary</li><li>Creative and supportive work environment</li><li>Opportunities for growth and development</li><li>A chance to shape a growing Ghanaian gifting brand</li></ul></article></div></section><section className="application-section" id="application"><div><span>APPLICATION</span><h2>Tell us about<br />your work.</h2><p>Share the details that help the team understand your experience and creative point of view.</p></div><form onSubmit={event => { event.preventDefault(); setApplicationSent(true); }}><div className="application-grid"><label>Full name<input required /></label><label>Email address<input required type="email" /></label><label>Phone / WhatsApp<input required type="tel" /></label><label>Current location<input required /></label><label>Portfolio or social link<input required type="url" placeholder="https://" /></label><DateField label="Earliest start date" prefix="career" /></div><label>Relevant experience<textarea required rows="4" /></label><label>Why do you want to join the team?<textarea required rows="5" /></label><label className="upload-field">Attach CV / résumé<input required type="file" accept=".pdf,.doc,.docx" /></label><button className="primary-action" type="submit">SUBMIT APPLICATION</button>{applicationSent && <p className="inline-success">Application details saved. Email delivery will activate when the hiring inbox is connected.</p>}</form></section><SiteFooter onNavigate={onNavigate} /></main>;
}

export function CustomizePage({ onNavigate }) {
  const [selected, setSelected] = useState([]);
  const [sent, setSent] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [requestReference] = useState(() => `RQ-${String(Date.now()).slice(-6)}`);
  const toggle = option => setSelected(current => current.includes(option) ? current.filter(item => item !== option) : [...current, option]);
  const unitEstimate = selected.reduce((sum, option) => sum + (CUSTOM_ESTIMATES[option] || 0), 0);
  const estimateLow = unitEstimate * quantity;
  const estimateHigh = Math.ceil(estimateLow * 1.12 / 10) * 10;
  const submit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addAdminRecord('requests', {
      reference: requestReference,
      name: data.get('name'),
      phone: data.get('phone'),
      note: data.get('note'),
      cardMessage: data.get('cardMessage'),
      cardStyleNotes: data.get('cardStyleNotes'),
      preferredDate: formDate(data, 'custom'),
      estimateLow,
      estimateHigh,
      selections: selected,
      quantity,
      status: 'new'
    });
    setSent(true);
  };

  return <main className="content-page customize-page">
    <header className="content-page-heading"><span>BESPOKE GIFT BUILDER</span><h1>Make it<br />theirs.</h1></header>
    <div className="custom-gallery"><figure><img src="/assets/hamper-editorial-v2.png" alt="Luxury hamper inspiration" /><figcaption>Hampers</figcaption></figure><figure><img src="/assets/bouquet-editorial-v2.png" alt="Fresh flower inspiration" /><figcaption>Flowers</figcaption></figure><figure><img src="/assets/embroidery-editorial-v2.png" alt="Embroidery and personalization inspiration" /><figcaption>Personalization</figcaption></figure></div>
    <div className="custom-builder"><form onSubmit={submit}>
      {Object.entries(CUSTOM_OPTIONS).map(([group, options], groupIndex) => <fieldset key={group}><legend><span>{String(groupIndex + 1).padStart(2, '0')}</span>{group}</legend><div>{options.map(option => <label key={option} className={selected.includes(option) ? 'selected' : ''}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />{option}</label>)}</div></fieldset>)}
      <section className="builder-card-message"><span>CARD MESSAGE &amp; DESIGN</span><p>Select “Card message &amp; design” above when you want either a printed message or a custom card. Then enter the exact wording and choose its lettering below.</p><label>Message for the card <small>(optional)</small><textarea name="cardMessage" rows="3" placeholder="Write the message exactly as it should appear" /></label><CardStylePicker /></section>
      <label className="custom-note">Gift notes and instructions<textarea name="note" required rows="5" placeholder="Tell us the occasion, recipient, preferred colours, budget, presentation ideas or anything the team should know" /></label>
      <div className="custom-contact"><label>Name<input name="name" required /></label><label>WhatsApp number<input name="phone" required type="tel" /></label><DateField label="Preferred date" prefix="custom" /></div>
      <div className="custom-quantity"><span>NUMBER OF IDENTICAL GIFTS</span><QuantityControl value={quantity} label="custom gifts" onDecrease={() => setQuantity(current => Math.max(1, current - 1))} onIncrease={() => setQuantity(current => current + 1)} /></div>
      <input type="hidden" name="custom-quantity" value={quantity} /><button className="primary-action" type="submit">{sent ? 'REQUEST SAVED' : `SAVE ${quantity > 1 ? `${quantity} ` : ''}CUSTOM REQUEST${quantity > 1 ? 'S' : ''}`}</button>
      {sent && <div className="inline-success custom-request-success" role="status"><p>Request received. Save reference <strong>{requestReference}</strong> and track it with the same phone number.</p><button type="button" onClick={() => onNavigate?.('track')}>TRACK THIS REQUEST</button></div>}
    </form><aside><img src="/assets/hamper-editorial-v2.png" alt="A curated luxury gift hamper" /><span>YOUR SELECTION · QTY {quantity}</span><h2>{selected.length ? `${selected.length} choices` : 'Start with anything'}</h2><p>{selected.length ? selected.join(' · ') : 'Choose a base, add the items they will love, and tell us how to finish it.'}</p><div className="estimate-panel"><small>LIVE ESTIMATE</small>{unitEstimate ? <><strong>GHS {estimateLow.toLocaleString()}–{estimateHigh.toLocaleString()}</strong><p>For {quantity} gift{quantity > 1 ? 's' : ''}. Final pricing follows stock and delivery confirmation.</p></> : <p>Select a base and gift items to calculate an estimate.</p>}</div><a className="soft-action" href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer">CONTINUE ON WHATSAPP</a></aside></div>
    <SiteFooter onNavigate={onNavigate} />
  </main>;
}

function RequestModal({ service, onClose }) {
  const [sent, setSent] = useState(false);
  const [fileName, setFileName] = useState('');
  const [requestReference] = useState(() => `RQ-${String(Date.now()).slice(-6)}`);
  const submit = (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); addAdminRecord('requests', { reference: requestReference, service, name: data.get('name'), email: data.get('email'), phone: data.get('phone'), occasion: data.get('occasion'), preferredDate: formDate(data, 'request'), inspirationName: fileName, note: data.get('request'), cardMessage: data.get('cardMessage'), cardStyleNotes: data.get('cardStyleNotes'), status: 'new' }); setSent(true); };

  return (
    <div className="flow-backdrop" onClick={onClose}>
      <section className="flow-modal request-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <button className="round-icon close-flow" onClick={onClose} aria-label="Close request"><X size={18} /></button>
        {sent ? (
          <div className="flow-success"><Check size={28} /><h2>Request saved</h2><p>Save reference <strong>{requestReference}</strong>. Track it with the same phone number or continue with the team on WhatsApp.</p><a className="primary-action" href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer">CONTINUE ON WHATSAPP</a></div>
        ) : (
          <form onSubmit={submit}>
            <span className="form-eyebrow">SERVICE REQUEST</span><h2>{service}</h2>
            <label>Name<input name="name" required /></label>
            <label>Email address<input name="email" type="email" required /></label>
            <label>Phone or WhatsApp<input name="phone" type="tel" required /></label>
            <label>Occasion<input name="occasion" required /></label>
            <DateField label="Preferred date" prefix="request" />
            <label>Service notes and instructions<textarea name="request" rows="4" required placeholder="Describe what you need, who it is for, preferred colours, wording or any delivery details" /></label>
            <fieldset className="request-card-message"><legend>Gift card <small>(optional)</small></legend><label>Message for the card<textarea name="cardMessage" rows="3" placeholder="Write the message exactly as it should appear" /></label><CardStylePicker /></fieldset>
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

const CARD_STYLES = [
  { value: 'Classic serif', label: 'Classic', sample: 'With love, always.', className: 'is-classic' },
  { value: 'Handwritten script', label: 'Handwritten', sample: 'With love, always.', className: 'is-script' },
  { value: 'Clean minimal', label: 'Minimal', sample: 'WITH LOVE, ALWAYS.', className: 'is-minimal' },
];

function CardStylePicker({ disabled = false }) {
  return <fieldset className="card-style-picker" disabled={disabled}><legend>Lettering style</legend><div>{CARD_STYLES.map((style, index) => <label className={style.className} key={style.value}><input type="radio" name="cardStyleNotes" value={style.value} defaultChecked={index === 0} /><span>{style.label}</span><b>{style.sample}</b></label>)}</div></fieldset>;
}

function CheckoutModal({ cart, onClose, onQuantity }) {
  const [complete, setComplete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [scrollState, setScrollState] = useState({ progress: 0, visible: false });
  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  const INIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-init`;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const cardMessage = data.get('cardMessage');
    const cardStyleNotes = data.get('cardStyleNotes');
    const instructionParts = [
      data.get('instructions'),
      cardMessage && `Gift card: ${cardMessage}`,
      cardStyleNotes && `Card style: ${cardStyleNotes}`,
    ].filter(Boolean);

    try {
      const res = await fetch(INIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`,
        },
        body: JSON.stringify({
          customerName: data.get('customer'),
          customerEmail: data.get('email'),
          customerPhone: data.get('phone'),
          recipientName: data.get('recipient-name') || data.get('customer'),
          deliveryAddress: data.get('address'),
          landmark: data.get('landmark') || '',
          locationLink,
          customerNote: instructionParts.join('\n'),
          cardMessage: cardMessage || '',
          cardStyleNotes: cardStyleNotes || '',
          requestedDeliveryDate: formDate(data, 'checkout'),
          cart: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.authorizationUrl) {
        console.error('Paystack init response error:', res.status, json);
        setSubmitError(json.error || json.message || 'Payment initialisation failed. Please try again.');
        setSubmitting(false);
        return;
      }

      // Show the tracking number to the customer before redirecting
      setComplete(json.trackingNumber);
      cart.forEach(item => onQuantity(item.id, 0));

      // Open Paystack hosted payment page
      window.open(json.authorizationUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Checkout error:', err);
      setSubmitError('Network error. Check your connection and try again.');
      setSubmitting(false);
    }
  };
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
        {complete ? (
          <div className="flow-success">
            <Check size={28} />
            <h2>Order placed</h2>
            <p>Your tracking number is <strong>{complete}</strong>. A Paystack payment window has opened — complete payment there. Your order status updates to <em>paid</em> once payment is confirmed.</p>
            <button className="primary-action" onClick={onClose}>RETURN TO THE SHOP</button>
          </div>
        ) : !cart.length ? (
          <div className="flow-success empty-order"><span className="form-eyebrow">YOUR ORDER</span><h2>Your bag is empty</h2><p>Add a ready-made gift or begin with the custom gift builder.</p><button className="primary-action" onClick={onClose}>BROWSE THE SHOP</button></div>
        ) : (
          <form onSubmit={submit}>
            <span className="form-eyebrow">CHECKOUT</span><h2>Your order</h2>
            <div className="checkout-summary">{cart.map(item => <div className="checkout-line" key={item.id}><div><span>{item.name}</span><small>GHS {item.price.toLocaleString()} each</small><button className="checkout-remove" type="button" onClick={() => onQuantity(item.id, 0)} aria-label={`Remove ${item.name} from order`}>REMOVE</button></div><QuantityControl value={item.quantity} label={item.name} onDecrease={() => onQuantity(item.id, item.quantity - 1)} onIncrease={() => onQuantity(item.id, item.quantity + 1)} /><strong>GHS {(item.price * item.quantity).toLocaleString()}</strong></div>)}</div>
            <div className="checkout-total"><span>SUBTOTAL</span><strong>GHS {total.toLocaleString()}</strong></div>
            <div className="checkout-contact-grid"><label>Customer name<input name="customer" required disabled={submitting} /></label><label>Email for receipt<input name="email" required type="email" disabled={submitting} /></label><label>Phone or WhatsApp<input name="phone" type="tel" required disabled={submitting} /></label><label><span className="field-label">Recipient name <small>optional</small></span><input name="recipient-name" placeholder="Leave blank if you are receiving it" disabled={submitting} /></label></div>
            <label>Delivery address<textarea name="address" rows="2" required disabled={submitting} /></label><label>Nearest landmark<input name="landmark" disabled={submitting} /></label>
            <div className="location-field"><label>Google Maps or location link<input type="url" value={locationLink} onChange={event => setLocationLink(event.target.value)} placeholder="https://maps.google.com/..." disabled={submitting} /></label><button type="button" onClick={useCurrentLocation} disabled={submitting}><LocateFixed size={15} /> USE MY LOCATION</button>{locationStatus && <small><MapPin size={13} />{locationStatus}</small>}</div>
            <label>Delivery instructions<textarea name="instructions" rows="2" placeholder="Gate, floor, preferred call time or surprise-delivery note" disabled={submitting} /></label><DateField label="Delivery date" prefix="checkout" />
            <fieldset className="checkout-card-message"><legend>Gift card message <small>(optional)</small></legend><label>Message for the card<textarea name="cardMessage" rows="3" placeholder="Write the message exactly as it should appear" disabled={submitting} /></label><CardStylePicker disabled={submitting} /></fieldset>
            {submitError && <small className="checkout-error">{submitError}</small>}
            <button className="primary-action" type="submit" disabled={submitting}>
              {submitting ? <><LoaderCircle size={16} className="spin-icon" /> PROCESSING…</> : <>PLACE ORDER {total > 0 ? `· GHS ${total.toLocaleString()}` : ''}</>}
            </button>
            <small className="checkout-payment-note">You will be redirected to Paystack to complete payment securely. Your order is confirmed only after payment.</small>
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
  const [images, setImages] = useState(() => readAdminData().gallery.filter(image => image.visible));
  useEffect(() => subscribeAdminData(data => setImages(data.gallery.filter(image => image.visible))), []);
  return <main className="content-page gallery-page"><header className="content-page-heading"><span>THE GIFTING FACTORY BY FLOWER GIRL</span><h1>Gallery</h1></header><div className="gallery-grid">{images.map((image, index) => <figure key={`${image.src}-${index}`}><img src={image.src} alt={image.label} /><figcaption>{image.label}</figcaption></figure>)}</div><a className="instagram-action" href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer">SEE MORE ON INSTAGRAM <ArrowRight size={16} /></a><SiteFooter onNavigate={onNavigate} /></main>;
}

function ProductDetail({ product, saved, onClose, onAdd, onToggleWishlist, onCustomize }) {
  const [quantity, setQuantity] = useState(1);
  const available = product.stock == null ? Infinity : Math.max(0, Number(product.stock));
  return <div className="flow-backdrop product-detail-backdrop" onClick={onClose}><section className="product-detail" role="dialog" aria-modal="true" aria-label={`${product.name} details`} onClick={event => event.stopPropagation()}><button className="round-icon close-flow" onClick={onClose} aria-label="Close product details"><X size={18} /></button><div className="product-detail-visual">{product.discountPercent > 0 && <span className="product-sale-badge">{product.discountPercent}% OFF</span>}<img src={product.image} alt={product.name} /></div><div className="product-detail-copy"><span>{product.tag}</span><h2>{product.name}</h2><p>{product.detail}</p><div className="product-detail-price">{product.discountPercent > 0 && <del>{product.originalPriceLabel}</del>}<strong>{product.priceLabel}</strong></div><div className="product-includes"><small>DETAILS &amp; BENEFITS</small>{product.includes.map(item => <p key={item}><Check size={14} />{item}</p>)}</div><div className="detail-order-row"><QuantityControl value={quantity} label={product.name} onDecrease={() => setQuantity(current => Math.max(1, current - 1))} onIncrease={() => setQuantity(current => available === Infinity ? current + 1 : Math.min(Math.max(available, 1), current + 1))} /><button className="primary-action" disabled={!available} onClick={() => { onAdd(product, quantity); onClose(); }}>{available ? `ADD ${quantity} TO ORDER` : 'OUT OF STOCK'}</button></div><div className="detail-secondary"><button onClick={() => onToggleWishlist(product.id)}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'SAVED' : 'SAVE GIFT'}</button><button onClick={() => { onClose(); window.setTimeout(() => onCustomize(product.name), 120); }}>CUSTOMIZE THIS GIFT</button></div><small className="merch-note">Final availability and delivery are confirmed before payment.</small></div></section></div>;
}

function WishlistModal({ products, onClose, onView, onRemove }) {
  const [scrollState, setScrollState] = useState({ progress: 0, visible: false });
  return <div className="flow-backdrop" onClick={onClose}><section className="flow-modal wishlist-modal shared-scroll-panel" onScroll={event => { const node = event.currentTarget; const available = node.scrollHeight - node.clientHeight; setScrollState({ progress: available > 0 ? node.scrollTop / available : 0, visible: available > 8 }); }} role="dialog" aria-modal="true" aria-label="Saved gifts" onClick={event => event.stopPropagation()}><div className={`modal-scroll-indicator ${scrollState.visible ? 'visible' : ''}`} aria-hidden="true"><span style={{ top: `${scrollState.progress * 100}%`, transform: `translateY(-${scrollState.progress * 100}%)` }} /></div><button className="round-icon close-flow" onClick={onClose} aria-label="Close wishlist"><X size={18} /></button><span className="form-eyebrow">WISHLIST</span><h2>Saved gifts</h2>{products.length ? <div className="wishlist-list">{products.map(product => <article key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.priceLabel}</span></div><button onClick={() => onView(product)}>VIEW</button><button onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from wishlist`}><X size={15} /></button></article>)}</div> : <div className="empty-wishlist"><p>Save gifts while browsing and they will stay here when you return.</p><button className="primary-action" onClick={onClose}>BROWSE THE SHOP</button></div>}</section></div>;
}

function ProductCard({ product, saved, added, onSave, onView, onAdd }) {
  return <article className={`product-${product.id}`}><button className={`product-save ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button><button className="product-visual" onClick={onView}>{product.discountPercent > 0 && <span className="product-sale-badge">{product.discountPercent}% OFF</span>}<img src={product.image} alt={product.name} /></button><span>{product.tag}</span><button className="product-title" onClick={onView}><h2>{product.name}</h2></button><p>{product.detail}</p><div className="product-card-price">{product.discountPercent > 0 && <del>{product.originalPriceLabel}</del>}<strong>{product.priceLabel}</strong></div><div className="product-actions"><button className={added ? 'is-added' : ''} onClick={onAdd} aria-live="polite">{added ? <><Check size={14} /> ADDED</> : 'ADD TO ORDER'}</button><button onClick={onView}>VIEW DETAILS</button></div></article>;
}

export function ShopPage({ onNavigate, cart, setCart, wishlist, setWishlist, openCheckout, onCheckoutHandled, openWishlist, onWishlistHandled }) {
  const [requestProduct, setRequestProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [addedProduct, setAddedProduct] = useState('');
  const [promotions, setPromotions] = useState(() => readAdminData().promotions || []);
  useEffect(() => subscribeAdminData(data => setPromotions(data.promotions || [])), []);
  const shopProducts = PRODUCTS.map(product => { const promotion = promotions.find(item => item.productId === product.id && item.status === 'active' && Number(item.percent) > 0); if (!promotion) return product; const discountPercent = Math.min(90, Number(promotion.percent)); const salePrice = Math.round(product.price * (100 - discountPercent) / 100); return { ...product, originalPriceLabel: product.priceLabel, discountPercent, price: salePrice, priceLabel: `GHS ${salePrice.toLocaleString()}` }; });
  const add = (product, quantity = 1) => setCart(current => current.some(item => item.id === product.id) ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item) : [...current, { ...product, quantity }]);
  const addWithFeedback = product => {
    add(product);
    setAddedProduct(product.id);
    window.setTimeout(() => setAddedProduct(current => current === product.id ? '' : current), 1600);
  };
  const updateQuantity = (id, quantity) => setCart(current => quantity < 1 ? current.filter(item => item.id !== id) : current.map(item => item.id === id ? { ...item, quantity } : item));
  const toggleWishlist = id => setWishlist(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const savedProducts = shopProducts.filter(product => wishlist.includes(product.id));
  return (
    <main className="content-page shop-page">
      <header className="content-page-heading shop-heading"><div><span>ORDERS & BOOKINGS</span><h1>Shop</h1></div></header>
      <div className="shop-custom-banner"><div><span>BUILD YOUR OWN</span><h2>Choose every detail.</h2><p>Start with flowers or a box, then add perfume, chocolate, fashion, jewelry, engraving and delivery.</p></div><button className="primary-action" onClick={() => onNavigate?.('customize')}>OPEN GIFT BUILDER</button></div><div className="product-grid">{shopProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} added={addedProduct === product.id} onSave={() => toggleWishlist(product.id)} onView={() => setDetailProduct(product)} onAdd={() => addWithFeedback(product)} />)}</div>
      {requestProduct && <RequestModal service={requestProduct} onClose={() => setRequestProduct(null)} />}
      {detailProduct && <ProductDetail product={detailProduct} saved={wishlist.includes(detailProduct.id)} onClose={() => setDetailProduct(null)} onAdd={add} onToggleWishlist={toggleWishlist} onCustomize={setRequestProduct} />}
      {openWishlist && <WishlistModal products={savedProducts} onClose={onWishlistHandled} onView={product => { onWishlistHandled(); setDetailProduct(product); }} onRemove={toggleWishlist} />}
      {openCheckout && <CheckoutModal cart={cart} onClose={onCheckoutHandled} onQuantity={updateQuantity} />}
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
