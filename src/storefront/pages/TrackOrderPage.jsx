import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CircleDollarSign, LoaderCircle, PackageCheck, Truck } from 'lucide-react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { hasTrackingApi, trackRecord } from '../api/trackingApi';
import SiteFooter from '../components/SiteFooter';

function TrackingIcon({ stage }) {
  if (stage === 'paid') return <CircleDollarSign />;
  if (stage === 'packaging') return <LoaderCircle />;
  if (stage === 'ready') return <PackageCheck />;
  if (stage === 'delivery') return <Truck />;
  return <BadgeCheck />;
}

export default function TrackOrderPage({ onNavigate }) {
  const [prefill] = useState(() => { try { const value = JSON.parse(window.sessionStorage.getItem('gifting-factory-track-prefill') || '{}'); window.sessionStorage.removeItem('gifting-factory-track-prefill'); return value; } catch { return {}; } });
  const [reference, setReference] = useState(prefill.reference || '');
  const [credential, setCredential] = useState(prefill.credential || '');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [trackingData, setTrackingData] = useState(readAdminData);
  const resultRef = useRef(null);
  useEffect(() => subscribeAdminData(data => { setTrackingData(data); setResult(current => current ? { ...current, record: (current.kind === 'order' ? data.orders : data.requests).find(record => record.id === current.record.id) || current.record } : current); }), []);
  useEffect(() => { if (result) window.requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }, [result]);

  const search = async event => {
    event.preventDefault();
    setSearching(true);
    const value = reference.trim().toLowerCase();
    const contact = credential.trim().toLowerCase();
    const digits = contact.replace(/\D/g, '');
    const matchesContact = record => {
      const recordDigits = record.phone?.replace(/\D/g, '') || '';
      return record.email?.toLowerCase() === contact || record.customerEmail?.toLowerCase() === contact || (digits.length >= 9 && recordDigits.length >= 9 && recordDigits.slice(-9) === digits.slice(-9));
    };
    const order = trackingData.orders.find(record => (record.tracking?.toLowerCase() === value || record.code?.toLowerCase() === value) && matchesContact(record));
    const request = trackingData.requests.find(record => (record.reference?.toLowerCase() === value || record.id?.toLowerCase() === value) && matchesContact(record));
    let matched = order ? { kind: 'order', record: order } : request ? { kind: 'request', record: request } : null;
    if (hasTrackingApi()) {
      const { data } = await trackRecord(reference, credential);
      if (data?.kind === 'order') {
        const eventFields = Object.fromEntries((data.events || []).flatMap(item => [[`${item.stage}At`, item.createdAt], [`${item.stage}Note`, item.note]]));
        matched = { kind: 'order', record: { tracking: data.trackingNumber, customer: data.customerName, status: data.status, paymentStatus: data.paymentStatus, estimatedDelivery: data.estimatedDelivery, requestedDeliveryDate: data.requestedDeliveryDate, adminNote: data.adminNote, ...eventFields } };
      } else if (data?.kind === 'request') matched = { kind: 'request', record: { reference: data.reference, name: data.customerName, status: data.status, service: data.service, preferredDate: data.preferredDate, quoteTotal: data.confirmedQuote, adminNote: data.adminNote } };
    }
    setResult(matched);
    setSearched(true);
    setSearching(false);
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
        <button className="primary-action" disabled={searching}>{searching ? 'CHECKING…' : 'TRACK'}</button>
      </form>
      {order && <article ref={resultRef} className="tracking-result"><span>{order.tracking}</span><h2>{order.customer}</h2><p>Your order is currently <strong>{labels[order.status] || order.status}</strong>.</p><div className="tracking-timeline">{stages.map(stage => { const done = stages.indexOf(stage) <= stages.indexOf(order.status) || (stage === 'paid' && order.paymentStatus === 'paid'); const current = stage === order.status || (stage === 'paid' && order.status === 'pending_payment'); const note = order[`${stage}Note`] || (current ? order.adminNote : ''); return <i key={stage} className={`${done ? 'done' : ''} ${current ? 'is-current' : ''}`}><b><TrackingIcon stage={stage} /></b><span className="tracking-stage-label">{stage === 'paid' && order.paymentStatus !== 'paid' ? 'Awaiting payment' : labels[stage]}</span><time>{order[`${stage}At`] ? new Date(order[`${stage}At`]).toLocaleString('en-GH') : 'Update pending'}</time>{note && <small>{note}</small>}</i>; })}</div><section className="track-order-details"><p><strong>Recipient:</strong> {order.recipient || order.customer}</p><p><strong>Delivery:</strong> {order.delivery || 'Awaiting confirmation'}</p><p><strong>Payment:</strong> {order.paymentStatus === 'paid' ? 'Confirmed' : 'Awaiting confirmation'}</p>{order.estimatedDelivery && <p><strong>Estimated delivery:</strong> {new Date(order.estimatedDelivery).toLocaleString('en-GH')}</p>}{order.adminNote && <p><strong>Latest update:</strong> {order.adminNote}</p>}</section></article>}
      {request && <article ref={resultRef} className="tracked-request tracking-result"><span>{request.reference || request.id}</span><h2>{request.name || 'Custom request'}</h2><p>Your request is <strong>{request.status === 'converted' ? 'now an order' : request.status === 'approved' ? 'approved' : request.status === 'quote_needed' ? 'being quoted' : 'received'}</strong>.</p><section className="track-order-details"><p><strong>Service:</strong> {request.service || request.selections?.join(', ') || 'Bespoke gift'}</p><p><strong>Preferred date:</strong> {request.preferredDate || 'To confirm'}</p>{request.quoteTotal && <p><strong>Confirmed quote:</strong> GHS {Number(request.quoteTotal).toLocaleString()}</p>}<p><strong>Latest update:</strong> {request.adminNote || 'The team will contact you as the request progresses.'}</p></section></article>}
      {searched && !result && <div className="track-empty"><p>No record matched those details. Check the reference and contact information, then try again.</p><a href={`tel:${String(trackingData.settings.supportPhone || '').replace(/[^+\d]/g, '')}`}>Call {trackingData.settings.supportPhone}</a></div>}
    </section>
    <SiteFooter onNavigate={onNavigate} />
  </main>;
}
