// src/pages/ReviewsPage.jsx
// Ported 1-for-1 from admin-monolith.html renderReviewsView() (lines 21884–22241)
// Storage key: 'xa12-reviews-data-v1'  Instagram URL key: 'xa12-instagram-url-v1'

import { useState, useEffect, useCallback } from 'react';

const REVIEWS_KEY  = 'xa12-reviews-data-v1';
const INSTAGRAM_KEY = 'xa12-instagram-url-v1';

// ── Persistence helpers ── (monolith lines 21838–21851) ─────────────────────
function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveReviews(data) {
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(data)); } catch {}
}

// ── Toast helper ────────────────────────────────────────────────────────────
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

// ── Star display (renderStarsSVG — monolith lines 19681–19687) ────────────────
function StarsSVG({ rating }) {
  return (
    <span className="stars-rating-svg" style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24"
          fill={n <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

// ── Star picker (drawer form — monolith lines 21908–21913) ───────────────────
function StarPicker({ rating, onChange }) {
  return (
    <div className="review-star-picker" id="reviewStarPicker">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          className={`star-pick-btn${n <= rating ? ' active' : ''}`}
          data-star={n}
          onClick={() => onChange(n)}>
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={n <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── Add Testimonial Drawer (monolith lines 22039–22069) ─────────────────────
function AddTestimonialDrawer({ draft, onDraftChange, onClose, onSave }) {
  return (
    <div className={`drawer-overlay open`} id="reviewDrawerOverlay"
      onClick={e => { if (e.target.id === 'reviewDrawerOverlay') onClose(); }}>
      <div className="drawer-panel" id="reviewDrawerPanel">
        <div className="drawer-header">
          <h3 className="drawer-title">Add Testimonial</h3>
          <button type="button" className="drawer-close-btn" id="closeReviewDrawerBtn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          {/* Customer Name — monolith line 22049 */}
          <div className="field-group">
            <label className="field-label">Customer Name</label>
            <input type="text" className="field-input" id="revDraftName"
              value={draft.name}
              onChange={e => onDraftChange({ ...draft, name: e.target.value })}
              placeholder="e.g. Abena Owusu" />
          </div>
          {/* Review Text — monolith line 22053 */}
          <div className="field-group">
            <label className="field-label">Review Text</label>
            <textarea className="field-textarea" id="revDraftText" rows={4}
              placeholder="Write what the customer said..."
              value={draft.text}
              onChange={e => onDraftChange({ ...draft, text: e.target.value })} />
          </div>
          {/* Star Rating — monolith lines 22056–22058 */}
          <div className="field-group">
            <label className="field-label">Star Rating</label>
            <StarPicker rating={draft.rating} onChange={r => onDraftChange({ ...draft, rating: r })} />
          </div>
          {/* Show on storefront toggle — monolith lines 22059–22062 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="field-label" style={{ margin: 0 }}>Show on storefront</label>
            <button type="button" className="xp-pill" id="revShownToggleBtn"
              onClick={() => onDraftChange({ ...draft, shown: !draft.shown })}>
              {draft.shown ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
        <div className="drawer-footer">
          <button type="button" className="xp-pill" id="cancelReviewDrawerBtn" onClick={onClose}>Cancel</button>
          <button type="button" className="xp-pill xp-solid" id="saveReviewDrawerBtn" onClick={onSave}>Save Testimonial</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ReviewsPage ─────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const [reviews,          setReviews]          = useState(loadReviews);
  const [ratingFilter,     setRatingFilter]     = useState('all');   // monolith: reviewRatingFilter
  const [statusFilter,     setStatusFilter]     = useState('all');   // monolith: reviewStatusFilter
  const [sortOrder,        setSortOrder]        = useState('newest'); // monolith: reviewSortOrder
  const [drawerOpen,       setDrawerOpen]       = useState(false);   // monolith: reviewAddDrawerOpen
  const [draft,            setDraft]            = useState({ name: '', text: '', rating: 5, shown: true }); // monolith: reviewDraft
  const [inlineDeleteId,   setInlineDeleteId]   = useState(null);    // monolith: reviewInlineDeleteId
  const [instagramUrl,     setInstagramUrl]     = useState(() => {
    try { return localStorage.getItem(INSTAGRAM_KEY) || ''; } catch { return ''; }
  });
  const [igInputVal, setIgInputVal] = useState(instagramUrl);

  // Keep igInputVal in sync when instagramUrl changes externally
  useEffect(() => { setIgInputVal(instagramUrl); }, [instagramUrl]);

  // Escape key closes drawer — monolith lines 22234–22241
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e) => { if (e.key === 'Escape') { setDrawerOpen(false); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [drawerOpen]);

  // ── Computed metrics (monolith lines 21885–21893) ─────────────────────────
  const total      = reviews.length;
  const avgRating  = total > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1)
    : '—';
  const fiveStarPct = total > 0
    ? Math.round(reviews.filter(r => r.rating === 5).length / total * 100)
    : 0;
  const shownCount = reviews.filter(r => r.status === 'published').length;

  // ── Filter + sort (monolith lines 21895–21905) ────────────────────────────
  let filtered = reviews.filter(r => {
    const ratingOk = ratingFilter === 'all' || String(r.rating) === ratingFilter;
    const statusOk = statusFilter === 'all'
      || (statusFilter === 'shown'  && r.status === 'published')
      || (statusFilter === 'hidden' && r.status !== 'published');
    return ratingOk && statusOk;
  });
  if (sortOrder === 'newest') filtered = [...filtered].reverse();

  // ── Persist helper ────────────────────────────────────────────────────────
  const saveAndSet = useCallback((data) => {
    saveReviews(data);
    setReviews(data);
  }, []);

  // ── Instagram save (monolith lines 22092–22106) ───────────────────────────
  function handleSaveInstagram() {
    const val = igInputVal.trim();
    if (val && !val.startsWith('http')) {
      showToast('Instagram URL must start with http.');
      return;
    }
    setInstagramUrl(val);
    try { localStorage.setItem(INSTAGRAM_KEY, val); } catch {}
    showToast('Instagram URL saved.');
  }

  // ── Show/Hide toggle (monolith lines 22108–22118) ────────────────────────
  function handleToggleVisibility(id) {
    const updated = reviews.map(r =>
      r.id === id ? { ...r, status: r.status === 'published' ? 'pending' : 'published' } : r
    );
    saveAndSet(updated);
  }

  // ── Inline delete step 1: show confirm (monolith lines 22120–22126) ───────
  function handleRequestDelete(id) { setInlineDeleteId(id); }

  // ── Inline delete step 2: confirm Yes (monolith lines 22127–22135) ────────
  function handleConfirmDelete(id) {
    const updated = reviews.filter(r => r.id !== id);
    setInlineDeleteId(null);
    saveAndSet(updated);
  }

  // ── Inline delete cancel No (monolith lines 22136–22142) ─────────────────
  function handleCancelDelete() { setInlineDeleteId(null); }

  // ── Export JSON (monolith lines 22144–22156) ──────────────────────────────
  function handleExport() {
    const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  // ── Open drawer (monolith lines 22158–22166) ──────────────────────────────
  function handleOpenDrawer() {
    setDraft({ name: '', text: '', rating: 5, shown: true });
    setDrawerOpen(true);
  }

  // ── Save new testimonial (monolith lines 22207–22232) ────────────────────
  function handleSaveDrawer() {
    const name = draft.name.trim();
    const text = draft.text.trim();
    if (!name || !text) {
      showToast('Please fill in the customer name and review text.');
      return;
    }
    const newReview = {
      id:           `rev-${Date.now()}`,
      customerName: name,
      reviewText:   text,
      rating:       draft.rating,
      status:       draft.shown ? 'published' : 'pending',
      date:         new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      isFlagged:    false,
      replyText:    '',
      replyDate:    '',
    };
    const updated = [...reviews, newReview];
    setDrawerOpen(false);
    setDraft({ name: '', text: '', rating: 5, shown: true });
    saveAndSet(updated);
  }

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Customer Reviews</h2>
          <p>Monitor testimonials, manage storefront visibility, and capture Instagram showcase URL.</p>
        </div>
        <div className="header-actions">
          {/* Export button — monolith line 21926 */}
          <button className="xp-pill" id="exportReviewsBtn" type="button" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          {/* Add testimonial button — monolith line 21929 */}
          <button className="xp-pill xp-solid" id="addReviewBtn" type="button" onClick={handleOpenDrawer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add testimonial
          </button>
        </div>
      </div>

      {/* Metrics Strip — monolith lines 21935–21953 */}
      <div className="reviews-metrics-strip">
        <div className="rev-metric-cell">
          <span className="rev-metric-value">{total}</span>
          <span className="rev-metric-label">Total Reviews</span>
        </div>
        <div className="rev-metric-cell">
          <span className="rev-metric-value">{avgRating}</span>
          <span className="rev-metric-label">Avg Rating</span>
        </div>
        <div className="rev-metric-cell">
          <span className="rev-metric-value">{fiveStarPct}%</span>
          <span className="rev-metric-label">5-Star Share</span>
        </div>
        <div className="rev-metric-cell">
          <span className="rev-metric-value">{shownCount}</span>
          <span className="rev-metric-label">Shown on Site</span>
        </div>
      </div>

      {/* Instagram URL Card — monolith lines 21955–21970 */}
      <div className="cms-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <span className="meta-label">INSTAGRAM SHOWCASE URL</span>
          <input type="url" className="field-input" id="instagramUrlInput"
            placeholder="https://www.instagram.com/thegiftingfactory/"
            value={igInputVal}
            onChange={e => setIgInputVal(e.target.value)}
            style={{ marginTop: '6px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button className="xp-pill" id="saveInstagramBtn" type="button" onClick={handleSaveInstagram}>Save</button>
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
              className="xp-pill" id="openInstagramBtn" style={{ textDecoration: 'none' }}>Open</a>
          )}
        </div>
      </div>

      {/* Filter Bar — monolith lines 21972–21987 */}
      <div className="xp-chips" style={{ marginTop: '16px' }}>
        {/* Rating filter pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span className="meta-label">Rating</span>
          {['all','5','4','3','2','1'].map(v => (
            <button key={v} type="button"
              className={`xp-chip${ratingFilter === v ? ' xp-on' : ''}`}
              data-rating={v}
              onClick={() => setRatingFilter(v)}>
              {v === 'all' ? 'All' : `${v}★`}
            </button>
          ))}
        </div>
        {/* Status + Sort pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: 'auto' }}>
          {['all','shown','hidden'].map(v => (
            <button key={v} type="button"
              className={`xp-chip${statusFilter === v ? ' xp-on' : ''}`}
              data-status={v}
              onClick={() => setStatusFilter(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          {['newest','oldest'].map(v => (
            <button key={v} type="button"
              className={`xp-chip${sortOrder === v ? ' xp-on' : ''}`}
              data-sort={v}
              onClick={() => setSortOrder(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Testimonial Grid — monolith lines 21989–22035 */}
      <div className="reviews-grid">
        {filtered.length > 0 ? filtered.map(r => {
          const isShown    = r.status === 'published';
          const isDeleting = inlineDeleteId === r.id;
          return (
            <div key={r.id} className="review-card" data-id={r.id}>
              <div className="review-card-header">
                <div className="review-author-box">
                  <div className="author-avatar">{(r.customerName || '?').charAt(0)}</div>
                  <div>
                    <h3 className="author-name">{r.customerName}</h3>
                    <span className="review-date">{r.date || ''}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StarsSVG rating={r.rating} />
                  <span className={`status-badge ${isShown ? 'status-published' : 'status-pending'}`}>
                    {isShown ? 'Shown' : 'Hidden'}
                  </span>
                </div>
              </div>

              <p className="review-body-text">{r.reviewText}</p>

              <div className="review-actions-bar">
                {isDeleting ? (
                  /* Inline delete confirm — monolith lines 22013–22018 */
                  <span className="inline-delete-confirm">
                    Delete?
                    <button className="xp-pill xp-yes" type="button"
                      data-confirm-delete={r.id}
                      onClick={() => handleConfirmDelete(r.id)}>Yes</button>
                    <button className="xp-pill xp-no" type="button"
                      data-cancel-delete={r.id}
                      onClick={handleCancelDelete}>No</button>
                  </span>
                ) : (
                  /* Normal actions — monolith lines 22019–22026 */
                  <>
                    <button className="xp-pill toggle-visibility-btn" type="button"
                      data-id={r.id}
                      onClick={() => handleToggleVisibility(r.id)}>
                      {isShown ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                          Hide
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Show
                        </>
                      )}
                    </button>
                    <button className="xp-pill req-delete-review-btn" type="button"
                      data-id={r.id}
                      onClick={() => handleRequestDelete(r.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        }) : (
          /* Empty state — monolith lines 22030–22034 */
          <div style={{
            gridColumn: '1 / -1', padding: '48px', textAlign: 'center',
            background: 'var(--card-bg,#f2f1ef)', borderRadius: '12px', color: 'var(--text-muted)'
          }}>
            {total === 0
              ? 'No testimonials yet. Add your first one with the button above.'
              : 'No reviews match the selected filters.'}
          </div>
        )}
      </div>

      {/* Add Testimonial Drawer — monolith lines 22039–22069 */}
      {drawerOpen && (
        <AddTestimonialDrawer
          draft={draft}
          onDraftChange={setDraft}
          onClose={() => setDrawerOpen(false)}
          onSave={handleSaveDrawer}
        />
      )}
    </div>
  );
}
