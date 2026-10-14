import { useState, useEffect, useRef, useCallback } from 'react';

export const SHUFFLE_CARDS = [
  {
    id: 'hamper',
    src: '/assets/hamper-editorial-v2.png',
    alt: 'Luxury gift box curated with gourmet chocolates, fine fragrance and floral accents',
    title: 'Curated Hampers',
    label: 'Hampers & Gifts'
  },
  {
    id: 'bouquet',
    src: '/assets/bouquet-editorial-v2.png',
    alt: 'Handcrafted fresh floral bouquet arrangement with seasonal premium blooms',
    title: 'Fresh Flowers',
    label: 'Fresh Flowers'
  },
  {
    id: 'wrapping',
    src: '/assets/wrapping-editorial-v2.png',
    alt: 'Dark luxury gift box with maroon ribbon, cream paper and leather wallet',
    title: 'Presentation & Delivery',
    label: 'Bespoke Wrapping'
  },
  {
    id: 'embroidery',
    src: '/assets/embroidery-editorial-v2.png',
    alt: 'Personalized custom monogram embroidery and tailored gift presentation scene',
    title: 'Custom Personalization',
    label: 'Personalization'
  }
];

export default function ShuffleCardStack({ activeGroupHint }) {
  const [display, setDisplay] = useState({ current: 0, exiting: null, direction: 'next' });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const containerRef = useRef(null);
  const pointerRef = useRef({ isDown: false, startX: 0, startY: 0, startTime: 0 });
  const isAnimatingRef = useRef(false);
  const animTimerRef = useRef(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Listen to tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // IntersectionObserver to pause when off-screen
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Preload next image for instant rendering
  useEffect(() => {
    const nextIdx = (display.current + 1) % SHUFFLE_CARDS.length;
    const img = new Image();
    img.src = SHUFFLE_CARDS[nextIdx].src;
  }, [display.current]);

  const changeTo = useCallback((targetIndex, direction = 'next') => {
    if (targetIndex === display.current || isAnimatingRef.current) return;

    if (prefersReducedMotion) {
      setDisplay({ current: targetIndex, exiting: null, direction });
      return;
    }

    isAnimatingRef.current = true;
    setDisplay(prev => ({
      current: targetIndex,
      exiting: prev.current,
      direction
    }));

    clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => {
      setDisplay(prev => ({ ...prev, exiting: null }));
      isAnimatingRef.current = false;
    }, 600);
  }, [display.current, prefersReducedMotion]);

  const nextCard = useCallback(() => {
    const nextIdx = (display.current + 1) % SHUFFLE_CARDS.length;
    changeTo(nextIdx, 'next');
  }, [display.current, changeTo]);

  const prevCard = useCallback(() => {
    const prevIdx = (display.current - 1 + SHUFFLE_CARDS.length) % SHUFFLE_CARDS.length;
    changeTo(prevIdx, 'prev');
  }, [display.current, changeTo]);

  // Bring matching card to front when group hint changes
  useEffect(() => {
    if (activeGroupHint === undefined || activeGroupHint === null) return;
    const target = Math.max(0, Math.min(activeGroupHint, SHUFFLE_CARDS.length - 1));
    if (target !== display.current) {
      changeTo(target, target > display.current ? 'next' : 'prev');
    }
  }, [activeGroupHint, display.current, changeTo]);

  // Auto-shuffle timer: every 3 seconds
  useEffect(() => {
    if (prefersReducedMotion || isHovered || isFocused || isTabHidden || !isIntersecting) {
      return;
    }
    const timer = setInterval(() => {
      nextCard();
    }, 3000);

    return () => clearInterval(timer);
  }, [prefersReducedMotion, isHovered, isFocused, isTabHidden, isIntersecting, nextCard]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  // Pointer event handlers for swipe and tap
  const handlePointerDown = (e) => {
    pointerRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now()
    };
  };

  const handlePointerUp = (e) => {
    if (!pointerRef.current.isDown) return;
    const dx = e.clientX - pointerRef.current.startX;
    const dy = e.clientY - pointerRef.current.startY;
    const dt = Date.now() - pointerRef.current.startTime;
    pointerRef.current.isDown = false;

    // Detect horizontal swipe
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 800) {
      if (dx < 0) {
        nextCard();
      } else {
        prevCard();
      }
    } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 400) {
      // Tap on image shuffles to next
      nextCard();
    }
  };

  const handlePointerCancel = () => {
    pointerRef.current.isDown = false;
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextCard();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prevCard();
    }
  };

  const currentCard = SHUFFLE_CARDS[display.current];
  const exitingCard = display.exiting !== null ? SHUFFLE_CARDS[display.exiting] : null;

  return (
    <div
      ref={containerRef}
      className="shuffle-card-container clean-shuffle"
      role="region"
      aria-label="Custom gift inspiration gallery. Click, swipe, or use arrow keys to shuffle preview images."
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="shuffle-view-frame" aria-live="polite">
        {exitingCard && (
          <div
            key={`exit-${exitingCard.id}`}
            className={`shuffle-slide is-exiting dir-${display.direction}`}
            aria-hidden="true"
          >
            <img
              src={exitingCard.src}
              alt={exitingCard.alt}
              width="400"
              height="500"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        )}

        <div
          key={`current-${currentCard.id}`}
          className={`shuffle-slide ${display.exiting !== null ? `is-entering dir-${display.direction}` : 'is-active'}`}
        >
          <img
            src={currentCard.src}
            alt={currentCard.alt}
            width="400"
            height="500"
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>

      <div className="shuffle-dots" role="tablist" aria-label="Preview image selection">
        {SHUFFLE_CARDS.map((card, idx) => {
          const isActive = idx === display.current;
          return (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Show ${card.label} preview`}
              className={`shuffle-dot-btn ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                changeTo(idx, idx > display.current ? 'next' : 'prev');
              }}
            >
              <span className="shuffle-dot-indicator" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
