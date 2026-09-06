import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SERVICES } from '../data/services';
import RequestModal from '../modals/RequestModal';
import SiteFooter from '../components/SiteFooter';

export default function ServicesPage({ onNavigate, initialService }) {
  const [selected, setSelected] = useState(() => SERVICES.find(service => service.name === initialService) || SERVICES[0]);
  const [requestOpen, setRequestOpen] = useState(null);
  const showService = service => {
    setSelected(service);
    if (window.innerWidth <= 900) window.setTimeout(() => document.querySelector('.service-story')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };
  return (
    <main className="content-page services-page">
      <header className="content-page-heading"><span>THE GIFTING FACTORY BY FLOWER GIRL</span><h1>Services</h1></header>
      <div className="service-story-layout"><ol className="service-index simple-service-index">{SERVICES.map((service, index) => <li key={service.name} className={selected.name === service.name ? 'active' : ''}><button onClick={() => showService(service)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{service.displayName || service.name}</strong><ArrowRight size={16} /></button></li>)}</ol><aside className="service-story"><img src={selected.image} alt={selected.displayName || selected.name} /><span>SELECTED SERVICE</span><h2>{selected.displayName || selected.name}</h2><p>{selected.detail}</p><div>{selected.name === 'Gift shop' ? <button className="primary-action" onClick={() => onNavigate?.('shop')}>BROWSE READY-MADE GIFTS</button> : <button className="primary-action" onClick={() => setRequestOpen(selected)}>BOOK THIS SERVICE</button>}<button className="soft-action" onClick={() => onNavigate?.('customize')}>BUILD A CUSTOM GIFT</button></div></aside></div>
      <SiteFooter onNavigate={onNavigate} />
      {requestOpen && <RequestModal service={requestOpen.name} onClose={() => setRequestOpen(null)} />}
    </main>
  );
}
