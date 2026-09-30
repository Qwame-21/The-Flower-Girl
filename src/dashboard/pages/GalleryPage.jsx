// src/pages/GalleryPage.jsx
// Ported 1-for-1 from admin-monolith.html renderGalleryView() (lines 25151–25272)
// galleryItems is session-only (in-memory) — monolith never persists it to localStorage.

import { useState } from 'react';

// ── seed data: exact 4 items from monolith line 22617–22621 ──────────────────
const SEED_ITEMS = [
  { id: 'GAL-01', title: 'Elysian Bridal Arch',              category: 'Weddings',             date: '2026-09-10', featured: true,  image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&auto=format&fit=crop&q=80' },
  { id: 'GAL-02', title: 'Velvet Rose Executive Box',         category: 'Corporate Gifting',    date: '2026-09-08', featured: true,  image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&auto=format&fit=crop&q=80' },
  { id: 'GAL-03', title: 'Golden Hour Sunflower Arrangement', category: 'Everyday Arrangements',date: '2026-09-05', featured: false, image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80' },
  { id: 'GAL-04', title: 'White Orchid Sympathy Wreath',      category: 'Sympathy',             date: '2026-09-02', featured: true,  image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600&auto=format&fit=crop&q=80' },
];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&auto=format&fit=crop&q=80';

// ── toast helper (uses the xa12:toast event App.jsx listens to) ───────────────
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

// ── Add Photo modal ───────────────────────────────────────────────────────────
function AddPhotoModal({ onCancel, onSubmit }) {
  const [title,    setTitle]    = useState('');
  const [category, setCategory] = useState('');
  const [url,      setUrl]      = useState('');

  function handleSubmit() {
    if (!title.trim()) { showToast('Photo title is required.'); return; }
    onSubmit({ title: title.trim(), category: category.trim(), url: url.trim() });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '16px', padding: '24px',
        maxWidth: '440px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Add Photo to Gallery</div>
          <div style={{ fontSize: '12px', color: 'var(--mute,#747471)', marginTop: '2px' }}>Enter photo title and image URL.</div>
        </div>
        {[
          { label: 'Photo Title',  val: title,    set: setTitle,    ph: 'e.g. Grand Reception Showcase', type: 'text' },
          { label: 'Category',     val: category, set: setCategory, ph: 'e.g. Weddings', type: 'text' },
          { label: 'Image URL',    val: url,       set: setUrl,     ph: 'https://...', type: 'url'  },
        ].map(({ label, val, set, ph, type }) => (
          <div key={label} style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--mute,#747471)', display: 'block', marginBottom: '6px' }}>{label}</label>
            <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
              style={{ width: '100%', border: '0', borderBottom: '1.5px solid rgba(28,28,27,.15)',
                background: 'transparent', font: '500 14px Outfit, system-ui', padding: '6px 0', outline: 0, boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn p" onClick={handleSubmit}>Add Photo</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ item, onCancel, onConfirm }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '16px', padding: '24px',
        maxWidth: '400px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Delete Photo</h3>
        <p style={{ fontSize: '13px', color: 'var(--mute,#747471)', margin: '0 0 16px 0' }}>
          Are you sure you want to remove &ldquo;{item.title || 'this photo'}&rdquo; from the gallery?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn d" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main GalleryPage ──────────────────────────────────────────────────────────
export default function GalleryPage() {
  const [items,       setItems]       = useState(SEED_ITEMS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // item to delete

  // ── Featured toggle ─────────────────────────────────────────────────────────
  // monolith lines 25222-25228: toggles item.featured in-place
  function handleFeaturedChange(id, checked) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, featured: checked } : item));
  }

  // ── Move up ──────────────────────────────────────────────────────────────────
  // monolith lines 25230-25238: swap idx-1 and idx
  function handleMoveUp(id) {
    setItems(prev => {
      const idx = prev.findIndex(g => g.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  // ── Move down ────────────────────────────────────────────────────────────────
  // monolith lines 25241-25249: swap idx and idx+1
  function handleMoveDown(id) {
    setItems(prev => {
      const idx = prev.findIndex(g => g.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  // ── Delete confirmed ─────────────────────────────────────────────────────────
  // monolith lines 25252-25271: remove by id, toast
  function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setItems(prev => prev.filter(g => g.id !== deleteTarget.id));
    showToast('Photo removed from gallery.');
    setDeleteTarget(null);
  }

  // ── Add photo submitted ───────────────────────────────────────────────────────
  // monolith lines 25201-25216: push new item with generated id, toast, re-render
  function handleAddPhoto({ title, category, url }) {
    const today = new Date().toISOString().slice(0, 10);
    const newItem = {
      id: 'GAL-' + String(items.length + 1).padStart(2, '0'),
      title,
      category,
      date: today,
      featured: false,
      image: url || '',
    };
    setItems(prev => [...prev, newItem]);
    showToast('Photo added to gallery!');
    setShowAddModal(false);
  }

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Gallery &amp; Showcase Manager</h2>
          <p>Organize portfolio photography and feature highlights.</p>
        </div>
        <div className="header-actions">
          <button className="xp-pill xp-solid" id="addPhotoBtn" type="button"
            onClick={() => setShowAddModal(true)}>
            {/* Plus SVG matching monolith SVG_ICONS.plus */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Photo
          </button>
        </div>
      </div>

      {/* Gallery showcase grid */}
      <div className="gallery-showcase">
        {items.map((item, idx) => (
          <div key={item.id} className="gallery-item" data-id={item.id}>
            <img
              src={item.image || FALLBACK_IMG}
              className="gallery-image"
              alt={item.title || ''}
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
            />
            <div className="gallery-caption">— {(item.title || 'UNTITLED').toUpperCase()}</div>
            <hr className="gallery-divider" />
            <div className="gallery-actions">
              {/* Featured checkbox — monolith lines 25173-25176 */}
              <label className="gal-featured-label" title="Featured photo">
                <input
                  type="checkbox"
                  className="gal-featured-toggle"
                  data-id={item.id}
                  checked={item.featured}
                  onChange={e => handleFeaturedChange(item.id, e.target.checked)}
                />
                <span>Featured</span>
              </label>
              {/* Up / Down / Delete — monolith lines 25177-25181 */}
              <div className="gal-btn-group">
                <button
                  className="btn-icon-action gal-up-btn"
                  data-id={item.id}
                  title="Move up"
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(item.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                  </svg>
                </button>
                <button
                  className="btn-icon-action gal-down-btn"
                  data-id={item.id}
                  title="Move down"
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => handleMoveDown(item.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                  </svg>
                </button>
                <button
                  className="btn-icon-action gal-del-btn"
                  data-id={item.id}
                  title="Delete photo"
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Photo modal */}
      {showAddModal && (
        <AddPhotoModal
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAddPhoto}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}
    </div>
  );
}
