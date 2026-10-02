import { useEffect, useState } from 'react';
import SiteFooter from '../components/SiteFooter';

export default function LegacyTrackOrderPage({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [credential, setCredential] = useState('');
  const phone = credential;
  const setPhone = setCredential;
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const stages = ['paid', 'packaging', 'ready', 'delivery', 'completed'];
  const labels = { paid: 'Paid', packaging: 'Processing', ready: 'Packed', delivery: 'Dispatched', completed: 'Delivered', pending_payment: 'Awaiting payment' };
  const search = event => { event.preventDefault(); setResult(null); setSearched(true); };
  const order = result?.kind === 'order' ? result.record : null;
  const request = result?.kind === 'request' ? result.record : null;

  return <main className="content-page track-page"><header className="content-page-heading"><span>ORDER & REQUEST TRACKING</span><h1>Follow your<br />gift.</h1></header><section className="track-workspace"><form onSubmit={search}><label>Tracking, order or request number<input value={query} onChange={event => setQuery(event.target.value)} required placeholder="GF-123456 or RQ-123456" /></label><label>Order phone number<input value={phone} onChange={event => setPhone(event.target.value)} required type="tel" placeholder="024 000 0000" /></label><button className="primary-action">TRACK</button></form>{searched && !result && <div className="track-empty"><p>Tracking requires a configured database. Please use the main tracking page or contact support.</p></div><SiteFooter onNavigate={onNavigate} /></main>;
}
