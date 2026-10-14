import React, { useState, useEffect, useRef } from 'react';

/**
 * useDelayedLoading:
 * Avoids flashing skeleton on instant/cached data (< 150ms).
 * If loading exceeds 150ms, shows skeleton for at least 300ms to avoid abrupt flickers.
 */
export function useDelayedLoading(loading, { delay = 150, minDuration = 300 } = {}) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const shownAtRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading) {
      timerRef.current = setTimeout(() => {
        setShowSkeleton(true);
        shownAtRef.current = Date.now();
      }, delay);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (showSkeleton && shownAtRef.current) {
        const elapsed = Date.now() - shownAtRef.current;
        if (elapsed < minDuration) {
          const remaining = minDuration - elapsed;
          const hideTimer = setTimeout(() => {
            setShowSkeleton(false);
            shownAtRef.current = null;
          }, remaining);
          return () => clearTimeout(hideTimer);
        } else {
          setShowSkeleton(false);
          shownAtRef.current = null;
        }
      } else {
        setShowSkeleton(false);
        shownAtRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loading, delay, minDuration, showSkeleton]);

  return showSkeleton;
}

/**
 * Base Skeleton primitive
 */
export function Skeleton({
  width,
  height,
  borderRadius,
  aspectRatio,
  className = '',
  style = {},
  ...rest
}) {
  const combinedStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(borderRadius ? { borderRadius } : {}),
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  };

  return (
    <div
      className={`skeleton-shimmer ${className}`.trim()}
      style={combinedStyle}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function SkeletonText({ lines = 1, className = '', height = '14px', lastLineWidth = '70%' }) {
  return (
    <div className={`skeleton-text-group ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={height}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          borderRadius="4px"
          className="skeleton-text-line"
        />
      ))}
    </div>
  );
}

/**
 * ProductCardSkeleton: exact layout match for ProductCard
 */
export function ProductCardSkeleton() {
  return (
    <article className="product-card skeleton-product-card" aria-hidden="true">
      <div className="product-visual">
        <Skeleton aspectRatio="1 / 1" width="100%" borderRadius="16px" />
      </div>
      <div className="product-body" style={{ marginTop: '12px' }}>
        <Skeleton height="11px" width="40%" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <Skeleton height="18px" width="85%" borderRadius="4px" style={{ marginBottom: '8px' }} />
        <Skeleton height="15px" width="50%" borderRadius="4px" style={{ marginBottom: '14px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton height="36px" width="100%" borderRadius="999px" />
        </div>
      </div>
    </article>
  );
}

/**
 * ProductGridSkeleton: renders an array of ProductCardSkeleton inside a container with accessibility attributes
 */
export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div
      className="product-grid skeleton-container"
      role="status"
      aria-busy="true"
      aria-label="Loading products"
    >
      <span className="sr-only">Loading products…</span>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}


/**
 * GalleryTileSkeleton: matches figure in .gallery-grid
 */
export function GalleryTileSkeleton() {
  return (
    <figure className="gallery-skeleton-figure" aria-hidden="true">
      <Skeleton aspectRatio="4 / 5" width="100%" borderRadius="16px" />
      <div style={{ marginTop: '10px' }}>
        <Skeleton height="13px" width="50%" borderRadius="4px" />
      </div>
    </figure>
  );
}

export function GalleryGridSkeleton({ count = 6 }) {
  return (
    <div
      className="gallery-grid skeleton-container"
      role="status"
      aria-busy="true"
      aria-label="Loading gallery"
    >
      <span className="sr-only">Loading gallery items…</span>
      {Array.from({ length: count }).map((_, i) => (
        <GalleryTileSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * TrackOrderSkeleton: matches order tracking result
 */
export function TrackOrderSkeleton() {
  return (
    <article
      className="track-result-skeleton skeleton-container"
      role="status"
      aria-busy="true"
      aria-label="Looking up your order"
      style={{
        marginTop: '2rem',
        padding: '1.75rem',
        border: '1px solid rgba(17, 17, 17, 0.12)',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.25)',
      }}
    >
      <span className="sr-only">Looking up your order…</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ width: '50%' }}>
          <Skeleton height="11px" width="40%" borderRadius="4px" style={{ marginBottom: '8px' }} />
          <Skeleton height="24px" width="80%" borderRadius="6px" />
        </div>
        <Skeleton height="28px" width="90px" borderRadius="999px" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '2rem 0' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <Skeleton width="36px" height="36px" borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton height="14px" width="45%" borderRadius="4px" />
              <Skeleton height="11px" width="30%" borderRadius="4px" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(17, 17, 17, 0.12)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton height="14px" width="35%" borderRadius="4px" />
        <Skeleton height="16px" width="25%" borderRadius="4px" />
      </div>
    </article>
  );
}
