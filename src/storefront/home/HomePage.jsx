import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PORTFOLIO_SERIES } from '../../data/portfolioData';
import { styles } from './homeStyles';
import { HOME_SERVICE_LINKS } from './homeServices';
import SiteFooter from '../components/SiteFooter';

export default function HomePage({
  currentSlideIndex,
  handlePrevSlide,
  handleNextSlide,
  mousePos,
  homeServiceOpen,
  setHomeServiceOpen,
  setPreferredService,
  setActiveTab,
  onNavigate
}) {
  const currentSlide = PORTFOLIO_SERIES[currentSlideIndex];

  return (
    <div className="home-scroll">
      <main style={styles.mainCanvas} className="portfolio-layout">
        {/* Left column: collection label, title, subtitle and counter */}
        <section style={styles.leftCol} className="portfolio-copy">
          <div style={styles.tagWrapper}>
            <span style={styles.roleTag}>{currentSlide.category}</span>
          </div>

          <div style={styles.titleWrapper}>
            <h1 style={styles.mainName} className="portfolio-name">
              The<br />
              Gifting<br />
              Factory
            </h1>
            <span className="brand-signature">BY FLOWER GIRL</span>
            <p style={styles.subjectSub}>{currentSlide.subject}</p>
          </div>

          <div style={styles.counterWrapper}>
            <span style={styles.slideCounter}>{currentSlide.code}</span>
          </div>
        </section>

        {/* Middle Column: Dual Thumbnail Frame & Slide Controls */}
        <section style={styles.middleCol} className="portfolio-thumbnails">
          <div style={styles.cardSliderContainer} className="thumbnail-strip">
            {/* Top Right Arrow Controls Pill */}
            <div style={styles.arrowControlsWrapper} className="thumbnail-controls">
              <button
                onClick={handlePrevSlide}
                style={styles.arrowBtn}
                aria-label="Previous Slide"
                className="hover-lift"
              >
                <ChevronLeft size={16} color="#ffffff" />
              </button>
              <button
                onClick={handleNextSlide}
                style={{ ...styles.arrowBtn, borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                aria-label="Next Slide"
                className="hover-lift"
              >
                <ChevronRight size={16} color="#ffffff" />
              </button>
            </div>

            {/* Side-by-Side Thumbnail Cards */}
            <div style={styles.cardsGrid} key={currentSlide.id} className="animate-fade-in thumbnail-grid">
              {currentSlide.thumbnails.map((thumb) => (
                <div
                  key={thumb.id}
                  style={styles.thumbCard}
                  className="thumbnail-item"
                >
                  <img
                    src={thumb.image}
                    alt={thumb.title}
                    style={styles.thumbImg}
                    className="seamless-blend"
                  />
                </div>
              ))}
            </div>

            {/* Caption Text Below Right Thumbnail */}
            <div style={styles.captionRow}>
              <span style={styles.originText}>{currentSlide.origin}</span>
            </div>
          </div>
        </section>

        {/* Right Column: Hero Surreal Floral Artpiece (Floating Directly on Canvas without any card/box) */}
        <section style={styles.rightCol} className="portfolio-artwork">
          <div
            style={{
              ...styles.heroArtBox,
              transform: `perspective(1000px) rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.3}deg)`
            }}
            key={currentSlide.id}
            className="animate-fade-in hero-artwork-wrap"
          >
            <img
              src={currentSlide.heroImage}
              alt={currentSlide.title}
              style={styles.heroImg}
              className="seamless-blend animate-hero-float hero-artwork"
            />
          </div>

          <p className="hero-origin-mobile">{currentSlide.origin}</p>

          {/* Bottom Right Social Links */}
          <div style={styles.socialBar} className="hero-socials">
            <a href="tel:+233202417072" style={styles.socialLink} className="link-underline">CALL</a>
            <a href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer" style={styles.socialLink} className="link-underline">WA</a>
            <a href="https://www.instagram.com/flowergirl_ghana/" target="_blank" rel="noreferrer" style={styles.socialLink} className="link-underline">IG</a>
          </div>
        </section>
      </main>
      <section className="home-information">
        <div className="home-about-label"><span>ABOUT THE GIFTING FACTORY</span><button className="soft-action" onClick={() => setActiveTab('about')}>READ OUR STORY</button></div>
        <h2>We turn thoughtful ideas<br />into gifts worth keeping.</h2>
        <div className="home-facts"><p>Luxury hampers built around the person, the occasion and your budget.</p><p>Fresh flowers, wrapping, engagement presentation and personalized finishing.</p><p>Collection and same-day delivery options confirmed with every order.</p></div>
      </section>
      <section className="home-service-links">
        <div className="service-links-intro"><span>01 / 05</span><h2>What we make<br />meaningful.</h2></div>
        <ol>{HOME_SERVICE_LINKS.map((item, index) => <li key={item.label} className={homeServiceOpen === item.service ? 'is-open' : ''}><button aria-expanded={homeServiceOpen === item.service} onClick={() => setHomeServiceOpen(current => current === item.service ? null : item.service)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><i>+</i></button>{homeServiceOpen === item.service && <div className="home-service-detail"><p>{item.detail}</p><button onClick={() => { setPreferredService(item.service); setActiveTab('services'); }}>VIEW THIS SERVICE</button></div>}</li>)}</ol>
      </section>
      <section className="career-callout"><div><span>WE’RE GROWING</span><h2>Join the creative<br />team behind the gifts.</h2></div><div><p>Applications are open for a Content Creator / Social Media Manager in Accra.</p><button className="primary-action" onClick={() => setActiveTab('careers')}>VIEW THE ROLE</button></div></section>
      <SiteFooter onNavigate={onNavigate} />
    </div>
  );
}
