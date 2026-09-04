import { useState } from 'react';
import { X, ShoppingBag, Check } from 'lucide-react';
import { SHOP_PRINTS } from '../data/portfolioData';

export default function ShopModal({ isOpen, onClose }) {
  const [selectedPrint, setSelectedPrint] = useState(SHOP_PRINTS[0]);
  const [frameOption, setFrameOption] = useState('signature');
  const [addedToCart, setAddedToCart] = useState(false);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-scale-in">
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <ShoppingBag size={20} />
            <h2>THE GIFT SHOP</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        <div style={styles.body}>
          {/* Main Selected Print Preview & Selector */}
          <div style={styles.printViewer}>
            <div style={styles.imageBox}>
              <img
                src={selectedPrint.image}
                alt={selectedPrint.title}
                style={{
                  ...styles.previewImg,
                  border: 'none',
                  boxShadow: 'none'
                }}
              />
              <span style={styles.seriesBadge}>{selectedPrint.series}</span>
            </div>

            <div style={styles.printConfig}>
              <h1 style={styles.printTitle}>{selectedPrint.title}</h1>
              <p style={styles.priceTag}>{selectedPrint.price} <span style={styles.taxText}>Final quote depends on your selection</span></p>

              <div style={styles.metaRow}>
                <div><strong>Format:</strong> {selectedPrint.dimensions}</div>
                <div><strong>Includes:</strong> {selectedPrint.paper}</div>
                <div><strong>Delivery:</strong> Same-day options in Accra, subject to availability</div>
                <div style={{ color: '#2b7a3e', fontWeight: '600' }}>{selectedPrint.stock}</div>
              </div>

              <div style={styles.optionGroup}>
                <label style={styles.label}>PRESENTATION</label>
                <div style={styles.frameBtns}>
                  <button
                    onClick={() => setFrameOption('signature')}
                    style={{
                      ...styles.frameOptionBtn,
                      border: frameOption === 'signature' ? '2px solid #181818' : '1px solid #ccc',
                      backgroundColor: frameOption === 'signature' ? '#ffffff' : 'transparent'
                    }}
                  >
                    Signature gift wrapping
                  </button>
                  <button
                    onClick={() => setFrameOption('personalized')}
                    style={{
                      ...styles.frameOptionBtn,
                      border: frameOption === 'personalized' ? '2px solid #181818' : '1px solid #ccc',
                      backgroundColor: frameOption === 'personalized' ? '#ffffff' : 'transparent'
                    }}
                  >
                    Personalized box and message
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                style={{
                  ...styles.buyBtn,
                  backgroundColor: addedToCart ? '#2b7a3e' : '#181818'
                }}
              >
                {addedToCart ? (
                  <>
                    <Check size={18} /> Added to Cart!
                  </>
                ) : (
                  `Start Your Order: ${selectedPrint.price}`
                )}
              </button>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Thumbnail Print List */}
          <h3 style={styles.collectionTitle}>SHOP BY GIFT TYPE</h3>
          <div style={styles.grid}>
            {SHOP_PRINTS.map((print) => (
              <div
                key={print.id}
                onClick={() => setSelectedPrint(print)}
                style={{
                  ...styles.card,
                  border: selectedPrint.id === print.id ? '2px solid #181818' : '1px solid rgba(0,0,0,0.08)'
                }}
                className="hover-lift"
              >
                <img src={print.image} alt={print.title} style={styles.cardImg} />
                <div style={styles.cardInfo}>
                  <strong style={styles.cardTitle}>{print.title}</strong>
                  <span style={styles.cardPrice}>{print.price}</span>
                </div>
              </div>
            ))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(6px)',
    zIndex: 110,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  },
  modal: {
    width: '880px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    backgroundColor: '#ecece9',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
  },
  header: {
    padding: '1.5rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(0,0,0,0.08)'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    letterSpacing: '0.05em'
  },
  closeBtn: {
    padding: '0.4rem',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  body: {
    padding: '2rem',
    overflowY: 'auto'
  },
  printViewer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2.5rem',
    alignItems: 'center'
  },
  imageBox: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dfdfdd',
    padding: '2rem',
    borderRadius: '8px'
  },
  previewImg: {
    width: '100%',
    maxHeight: '340px',
    objectFit: 'contain',
    borderRadius: '4px',
    transition: 'all 0.3s ease'
  },
  seriesBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: '0.7rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
    letterSpacing: '0.05em'
  },
  printConfig: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
  },
  printTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#181818'
  },
  priceTag: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#181818'
  },
  taxText: {
    fontSize: '0.75rem',
    color: '#666',
    fontWeight: '400'
  },
  metaRow: {
    fontSize: '0.85rem',
    color: '#444',
    lineHeight: '1.6',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: '0.8rem 1rem',
    borderRadius: '6px'
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    fontWeight: '700',
    color: '#666'
  },
  frameBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  frameOptionBtn: {
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.82rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buyBtn: {
    padding: '1rem',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '600',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.3s ease',
    marginTop: '0.5rem'
  },
  divider: {
    margin: '2rem 0 1.5rem 0',
    border: 'none',
    borderTop: '1px solid rgba(0,0,0,0.08)'
  },
  collectionTitle: {
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    color: '#666',
    marginBottom: '1rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  cardImg: {
    width: '100%',
    height: '140px',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: '0.8rem',
    color: '#181818',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cardPrice: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#181818'
  }
};
