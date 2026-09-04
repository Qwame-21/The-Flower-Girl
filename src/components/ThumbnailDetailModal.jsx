import { X } from 'lucide-react';

export default function ThumbnailDetailModal({ thumbnail, onClose }) {
  if (!thumbnail) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-scale-in">
        <div style={styles.header}>
          <div style={styles.titleInfo}>
            <h3>{thumbnail.title}</h3>
            <span style={styles.specs}>{thumbnail.specs}</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn} className="thumbnail-close" aria-label="Close image"><X size={20} /></button>
        </div>

        <div style={styles.imageContainer}>
          <img src={thumbnail.image} alt={thumbnail.title} style={styles.fullImg} />
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>A closer look, thoughtfully curated by The Gifting Factory</p>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    zIndex: 130,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  },
  modal: {
    width: '680px',
    maxWidth: '92vw',
    backgroundColor: '#ecece9',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '1.2rem 1.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(0,0,0,0.08)'
  },
  titleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  specs: {
    fontSize: '0.78rem',
    color: '#666'
  },
  closeBtn: {
    width: '40px',
    height: '40px',
    padding: '0',
    borderRadius: '999px',
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  imageContainer: {
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#e1e1df'
  },
  fullImg: {
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: '0',
    boxShadow: 'none'
  },
  footer: {
    padding: '1rem 1.8rem',
    backgroundColor: '#ffffff',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '0.8rem',
    color: '#777'
  }
};
