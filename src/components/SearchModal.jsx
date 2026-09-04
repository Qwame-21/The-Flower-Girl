import { useState } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { PORTFOLIO_SERIES } from '../data/portfolioData';
import { PRODUCTS } from '../data/products';

const SITE_PATHS = [
  { id: 'about', title: 'About The Gifting Factory', label: 'ABOUT', detail: 'Our story and how each gift is composed', image: '/assets/gifting-factory-logo-transparent-v2.png', keywords: 'about story gifting factory flower girl process' },
  { id: 'shop', title: 'Shop ready-made gifts', label: 'SHOP', detail: 'Hampers, bouquets, bundles and personalized gifts', image: '/assets/hamper-editorial-v2.png', keywords: 'shop gifts hampers bouquets products' },
  { id: 'customize', title: 'Build a custom gift', label: 'CUSTOM', detail: 'Choose the base, contents, finishing and delivery', image: '/assets/basket-hamper-editorial-v2.png', keywords: 'custom builder personalize perfume chocolate engraving' },
  { id: 'services', title: 'Explore our services', label: 'SERVICES', detail: 'Wrapping, engagement presentation, boxes and embroidery', image: '/assets/embroidery-editorial-v2.png', keywords: 'services wrapping boxes embroidery engraving engagement' },
  { id: 'gallery', title: 'View the gift gallery', label: 'GALLERY', detail: 'Selected hampers, flowers and finished gifts', image: '/assets/bouquet-editorial-v2.png', keywords: 'gallery photos images instagram inspiration' },
  { id: 'careers', title: 'Careers and applications', label: 'CAREERS', detail: 'Current role and application form', image: '/assets/engagement-presentation-v2.png', keywords: 'career job hiring content creator social media manager application' },
  { id: 'delivery', title: 'Delivery & common questions', label: 'HELP', detail: 'Same-day availability, scheduling and collection', image: '/assets/delivery-editorial-v2.png', keywords: 'delivery faq questions accra collection schedule' },
  { id: 'policy', title: 'Order policy', label: 'POLICY', detail: 'Payment, custom-order changes and product availability', image: '/assets/wrapping-editorial-v2.png', keywords: 'policy payment cancellation changes replacement availability terms' }
];

export default function SearchModal({ isOpen, onClose, onSelectSlide, onNavigate }) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredSeries = PORTFOLIO_SERIES.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.subject.toLowerCase().includes(query.toLowerCase()) ||
    s.origin.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPaths = SITE_PATHS.filter(item => `${item.title} ${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(query.toLowerCase()));
  const filteredProducts = PRODUCTS.filter(item => `${item.name} ${item.tag} ${item.detail} ${item.priceLabel} ${item.includes.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-scale-in">
        <div style={styles.searchBar}>
          <Search size={22} color="#888" />
          <input
            type="text"
            placeholder="Search hampers, flowers, wrapping..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close search"><X size={20} /></button>
        </div>

        <div style={styles.resultsBody}>
          {/* Series Matches */}
          <div style={styles.section}>
            <span style={styles.sectionHeader}>FEATURED COLLECTIONS ({filteredSeries.length})</span>
            <div style={styles.list}>
              {filteredSeries.map((item) => (
                <div
                  key={item.id}
                  style={styles.itemRow}
                  onClick={() => {
                    const originalIdx = PORTFOLIO_SERIES.findIndex(s => s.id === item.id);
                    onSelectSlide(originalIdx);
                    onClose();
                  }}
                  className="hover-lift"
                >
                  <img src={item.heroImage} alt={item.title} style={styles.thumb} />
                  <div style={styles.itemMeta}>
                    <span style={styles.code}>{item.code} / {item.subject}</span>
                    <strong style={styles.title}>{item.title}</strong>
                    <span style={styles.sub}>{item.origin}</span>
                  </div>
                  <ArrowRight size={18} color="#666" />
                </div>
              ))}
            </div>
          </div>

          {/* Useful destinations */}
          <div style={styles.section}>
            <span style={styles.sectionHeader}>PRODUCTS ({filteredProducts.length})</span>
            <div style={styles.list}>
              {filteredProducts.map((item) => (
                <div key={item.id} style={styles.itemRow} onClick={() => { onNavigate('shop'); onClose(); }} className="hover-lift">
                  <img src={item.image} alt="" style={styles.thumb} />
                  <div style={styles.itemMeta}>
                    <span style={styles.code}>{item.tag}</span>
                    <strong style={styles.title}>{item.name}</strong>
                    <span style={styles.sub}>{item.priceLabel}</span>
                  </div>
                  <ArrowRight size={18} color="#666" />
                </div>
              ))}
            </div>
          </div>

          {/* Useful destinations */}
          <div style={styles.section}>
            <span style={styles.sectionHeader}>EXPLORE THE SITE ({filteredPaths.length})</span>
            <div style={styles.list}>
              {filteredPaths.map((item) => (
                <div key={item.id} style={styles.itemRow} onClick={() => { onNavigate(item.id); onClose(); }} className="hover-lift">
                  <img src={item.image} alt="" style={styles.thumb} />
                  <div style={styles.itemMeta}>
                    <span style={styles.code}>{item.label}</span>
                    <strong style={styles.title}>{item.title}</strong>
                    <span style={styles.sub}>{item.detail}</span>
                  </div>
                  <ArrowRight size={18} color="#666" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(226, 226, 224, 0.84)',
    backdropFilter: 'blur(16px)',
    zIndex: 120,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '0'
  },
  modal: {
    width: '100%',
    maxWidth: '100vw',
    backgroundColor: 'transparent',
    borderRadius: '0',
    overflow: 'hidden',
    boxShadow: 'none'
  },
  searchBar: {
    padding: 'clamp(1.5rem,4vw,3rem) clamp(1.5rem,7vw,7rem)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    backgroundColor: 'transparent'
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '1.1rem',
    fontFamily: 'inherit',
    color: '#181818',
    backgroundColor: 'transparent'
  },
  closeBtn: {
    display: 'grid',
    placeItems: 'center',
    width: '42px',
    height: '42px',
    padding: '0',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,0.18)',
    backgroundColor: 'transparent'
  },
  resultsBody: {
    maxHeight: 'calc(100dvh - 110px)',
    overflowY: 'auto',
    padding: '2rem clamp(1.5rem,7vw,7rem) 4rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
    gap: 'clamp(2rem,6vw,6rem)'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem'
  },
  sectionHeader: {
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    color: '#777',
    fontWeight: '700'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem'
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 0',
    backgroundColor: 'transparent',
    borderRadius: '0',
    borderTop: '1px solid rgba(0,0,0,0.16)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  thumb: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  itemMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  code: {
    fontSize: '0.75rem',
    color: '#888'
  },
  title: {
    fontSize: '0.95rem',
    color: '#181818'
  },
  sub: {
    fontSize: '0.78rem',
    color: '#666'
  }
};
