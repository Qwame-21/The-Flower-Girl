import { X, Gift, MapPin, Sparkles } from 'lucide-react';
import { ARTIST_INFO } from '../data/portfolioData';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="animate-scale-in">
        <div style={styles.header}>
          <h2>OUR GIFTING HOUSE</h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        <div style={styles.body}>
          <div style={styles.topProfile}>
            <div style={styles.avatarLarge} className="brand-modal-mark">FG</div>
            <div style={styles.profileDetails}>
              <h1 style={styles.name}>{ARTIST_INFO.name} <span style={styles.jpName}>{ARTIST_INFO.japaneseName}</span></h1>
              <p style={styles.roleTag}>{ARTIST_INFO.role} / {ARTIST_INFO.basedIn}</p>
              <p style={styles.bioText}>{ARTIST_INFO.bio}</p>
            </div>
          </div>

          <hr style={styles.divider} />

          <div style={styles.gridSection}>
            <div style={styles.column}>
              <h3 style={styles.sectionHeader}><Gift size={18} /> HOW IT WORKS</h3>
              <div style={styles.itemList}>
                {ARTIST_INFO.exhibitions.map((ex, idx) => (
                  <div key={idx} style={styles.exItem}>
                    <span style={styles.year}>{ex.year}</span>
                    <div>
                      <strong style={styles.exTitle}>{ex.title}</strong>
                      <p style={styles.exVenue}>{ex.venue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.column}>
              <h3 style={styles.sectionHeader}><Sparkles size={18} /> WHAT WE CREATE</h3>
              <ul style={styles.awardList}>
                {ARTIST_INFO.awards.map((aw, idx) => (
                  <li key={idx} style={styles.awardItem}>{aw}</li>
                ))}
              </ul>

              <h3 style={{ ...styles.sectionHeader, marginTop: '1.5rem' }}><MapPin size={18} /> VISIT & ORDER</h3>
              <p style={styles.statement}>
                Call or WhatsApp 020 241 7072 for availability, customization and delivery.
              </p>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(6px)',
    zIndex: 110,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  },
  modal: {
    width: '760px',
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
  closeBtn: {
    padding: '0.4rem',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  body: {
    padding: '2rem',
    overflowY: 'auto'
  },
  topProfile: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start'
  },
  avatarLarge: {
    width: '120px',
    height: '120px',
    borderRadius: '8px',
    objectFit: 'cover'
  },
  profileDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  name: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#181818'
  },
  jpName: {
    fontSize: '1.2rem',
    fontWeight: '400',
    color: '#777777',
    marginLeft: '0.5rem'
  },
  roleTag: {
    fontSize: '0.85rem',
    letterSpacing: '0.08em',
    color: '#555555'
  },
  bioText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#333333',
    marginTop: '0.5rem'
  },
  divider: {
    margin: '2rem 0',
    border: 'none',
    borderTop: '1px solid rgba(0,0,0,0.08)'
  },
  gridSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  sectionHeader: {
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    color: '#181818',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  exItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  },
  year: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#888'
  },
  exTitle: {
    fontSize: '0.92rem',
    color: '#181818'
  },
  exVenue: {
    fontSize: '0.8rem',
    color: '#666'
  },
  awardList: {
    paddingLeft: '1.2rem',
    fontSize: '0.88rem',
    color: '#444',
    lineHeight: '1.6'
  },
  awardItem: {
    marginBottom: '0.4rem'
  },
  statement: {
    fontSize: '0.88rem',
    fontStyle: 'italic',
    color: '#444',
    lineHeight: '1.6',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: '1rem',
    borderRadius: '6px',
    borderLeft: '3px solid #181818'
  }
};
