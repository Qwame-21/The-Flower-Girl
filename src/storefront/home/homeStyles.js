export const styles = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#e2e2e0',
    position: 'relative',
    overflow: 'hidden'
  },
  mainCanvas: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 1.15fr) minmax(320px, 1.35fr) minmax(460px, 2.3fr)',
    padding: '0.5rem 4.5rem 2.8rem 4.5rem',
    alignItems: 'center',
    gap: '2.5rem',
    maxWidth: '1850px',
    margin: '0 auto',
    width: '100%',
    height: 'calc(100vh - 85px)'
  },
  /* Left Column */
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    paddingTop: '2.2rem',
    paddingBottom: '0.5rem'
  },
  tagWrapper: {
    marginBottom: '2rem'
  },
  roleTag: {
    fontSize: '0.78rem',
    letterSpacing: '0.22em',
    color: '#4a4a4a',
    fontWeight: '500'
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    margin: 'auto 0'
  },
  mainName: {
    fontSize: 'clamp(4.2rem, 5.8vw, 6.6rem)',
    fontWeight: '600',
    lineHeight: '0.94',
    letterSpacing: '-0.025em',
    color: '#111111',
    fontFamily: 'var(--font-heading)'
  },
  subjectSub: {
    fontSize: 'clamp(1.4rem, 2vw, 2.1rem)',
    fontWeight: '400',
    color: '#333333',
    marginTop: '0.5rem',
    letterSpacing: '-0.01em'
  },
  counterWrapper: {
    marginTop: '2.5rem'
  },
  slideCounter: {
    fontSize: '1.6rem',
    fontWeight: '500',
    letterSpacing: '0.04em',
    color: '#111111',
    fontFamily: 'var(--font-heading)'
  },

  /* Middle Column */
  middleCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative'
  },
  cardSliderContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '360px'
  },
  arrowControlsWrapper: {
    position: 'absolute',
    top: '-25px',
    right: '0px',
    backgroundColor: '#5c5c5a',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    zIndex: 5
  },
  arrowBtn: {
    padding: '0.35rem 0.65rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    width: '100%'
  },
  thumbCard: {
    backgroundColor: '#d5d5d3',
    borderRadius: '2px',
    overflow: 'hidden',
    aspectRatio: '1 / 1.12',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '0.4rem'
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  captionRow: {
    marginTop: '0.4rem',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingRight: '0.2rem'
  },
  originText: {
    fontSize: '0.72rem',
    color: '#555555',
    letterSpacing: '0.04em',
    fontWeight: '400'
  },

  /* Right Column (Hero Art Floating Directly on Canvas) */
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    position: 'relative',
    paddingBottom: '0.5rem'
  },
  heroArtBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxHeight: '660px',
    transition: 'transform 0.15s ease-out'
  },
  heroImg: {
    maxWidth: '100%',
    maxHeight: '640px',
    objectFit: 'contain'
  },
  socialBar: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '2.5rem',
    marginTop: '1rem'
  },
  socialLink: {
    fontSize: '0.8rem',
    fontWeight: '500',
    letterSpacing: '0.12em',
    color: '#111111'
  }
};
