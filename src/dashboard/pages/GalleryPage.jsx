// src/pages/GalleryPage.jsx
// Admin gallery manager with storefront gallery display and Supabase uploaded photos

import { useState, useEffect } from 'react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { supabase } from '../../config/supabase';
import CustomDropdown from '../components/shared/CustomDropdown';

// Toast helper
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

// Category options from storefront products
const CATEGORY_OPTIONS = [
  { value: 'hampers', label: 'Hampers' },
  { value: 'flowers', label: 'Flowers' },
  { value: 'care', label: 'Care' },
  { value: 'personalized', label: 'Personalized' },
  { value: 'bundles', label: 'Bundles' },
  { value: 'Other', label: 'Other' }
];

// Add Photo modal with file upload
function AddPhotoModal({ onCancel, onSubmit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      setFile(null);
      setPreview(null);
      return;
    }

    // Validate file size (5 MB max)
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5 MB');
      setFile(null);
      setPreview(null);
      return;
    }

    setError('');
    setFile(selected);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selected);
  }

  function handleClearFile() {
    setFile(null);
    setPreview(null);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!category) {
      setError('Category is required');
      return;
    }
    if (!file) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({ title: title.trim(), category, file });
      setTitle('');
      setCategory('');
      setFile(null);
      setPreview(null);
      onCancel();
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '16px', padding: '24px',
        maxWidth: '480px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Add Photo to Gallery</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Upload a photo to the gallery (JPEG, PNG, WebP, max 5 MB)
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Grand Reception Showcase"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)',
                borderRadius: '8px', fontSize: '14px', outline: 0, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category *</label>
            <CustomDropdown
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={setCategory}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Image *</label>
            {!preview ? (
              <button
                type="button"
                onClick={() => document.getElementById('gallery-file-input').click()}
                style={{
                  width: '100%', padding: '12px', border: '2px dashed rgba(26,26,26,0.2)',
                  borderRadius: '8px', background: 'rgba(26,26,26,0.02)', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--text-muted)', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = 'rgba(26,26,26,0.4)'}
                onMouseLeave={(e) => e.target.style.borderColor = 'rgba(26,26,26,0.2)'}
              >
                Choose image
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain',
                    borderRadius: '8px', border: '1px solid rgba(26,26,26,0.1)' }}
                />
                <button
                  type="button"
                  onClick={handleClearFile}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <input
              id="gallery-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.14)',
                background: 'transparent', cursor: 'pointer', fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '13px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Uploading...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete confirm modal
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
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
          Are you sure you want to remove &ldquo;{item.label || 'this photo'}&rdquo; from the gallery?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn" onClick={onCancel}>No</button>
          <button type="button" className="btn d" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [storefrontGallery, setStorefrontGallery] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load storefront gallery from adminStore (read-only)
  useEffect(() => {
    const data = readAdminData();
    setStorefrontGallery(data.gallery || []);
    const unsubscribe = subscribeAdminData((newData) => {
      setStorefrontGallery(newData.gallery || []);
    });
    return unsubscribe;
  }, []);

  // Load uploaded photos from Supabase
  useEffect(() => {
    async function loadUploadedPhotos() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading gallery items:', error);
      } else {
        setUploadedPhotos(data || []);
      }
      setLoading(false);
    }

    loadUploadedPhotos();
  }, []);

  // Handle add photo upload
  async function handleAddPhoto({ title, category, file }) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = `gallery/${filename}`;

    // Upload to storage
    const { error: uploadError } = await supabase
      .storage
      .from('storefront-media')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get max sort_order
    const maxSort = uploadedPhotos.length > 0
      ? Math.max(...uploadedPhotos.map(p => p.sort_order || 0))
      : 0;

    // Insert into gallery_items
    const { error: insertError } = await supabase
      .from('gallery_items')
      .insert({
        image_path: filePath,
        label: title,
        category,
        visible: true,
        sort_order: maxSort + 1
      });

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // Reload photos
    const { data } = await supabase
      .from('gallery_items')
      .select('*')
      .order('sort_order', { ascending: true });

    setUploadedPhotos(data || []);
    showToast('Photo added to gallery!');
  }

  // Handle delete photo
  async function handleDeleteConfirmed() {
    if (!deleteTarget || !supabase) return;

    // Delete from storage
    if (deleteTarget.image_path) {
      await supabase
        .storage
        .from('storefront-media')
        .remove([deleteTarget.image_path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      console.error('Error deleting photo:', error);
      showToast('Failed to delete photo');
    } else {
      setUploadedPhotos(prev => prev.filter(p => p.id !== deleteTarget.id));
      showToast('Photo removed from gallery.');
    }

    setDeleteTarget(null);
  }

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Gallery &amp; Showcase Manager</h2>
          <p>Manage storefront gallery and uploaded photos.</p>
        </div>
        <div className="header-actions">
          <button className="xp-pill xp-solid" id="addPhotoBtn" type="button"
            onClick={() => setShowAddModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Photo
          </button>
        </div>
      </div>

      {/* Storefront gallery section (read-only) */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Storefront gallery</h3>
        {storefrontGallery.length > 0 ? (
          <div className="gallery-showcase">
            {storefrontGallery.map((item) => (
              <div key={item.id} className="gallery-item" data-id={item.id}>
                <img
                  src={item.src}
                  className="gallery-image"
                  alt={item.label || ''}
                />
                <div className="gallery-caption">— {(item.label || 'UNTITLED').toUpperCase()}</div>
                <hr className="gallery-divider" />
                <div className="gallery-actions">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Read-only (managed in storefront)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--card-bg, #f2f1ef)', borderRadius: '12px',
            border: '1px solid rgba(26,26,26,0.08)', padding: '48px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
              No storefront gallery photos
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Storefront gallery is empty
            </div>
          </div>
        )}
      </div>

      {/* Uploaded photos section */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Uploaded photos</h3>
        {uploadedPhotos.length > 0 ? (
          <div className="gallery-showcase">
            {uploadedPhotos.map((item) => (
              <div key={item.id} className="gallery-item" data-id={item.id}>
                <img
                  src={`${supabase.storage.from('storefront-media').getPublicUrl(item.image_path)}`}
                  className="gallery-image"
                  alt={item.label || ''}
                />
                <div className="gallery-caption">— {(item.label || 'UNTITLED').toUpperCase()}</div>
                <hr className="gallery-divider" />
                <div className="gallery-actions">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: 'auto' }}>
                    {item.category || 'Uncategorized'}
                  </span>
                  <button
                    className="btn-icon-action gal-del-btn"
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
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--card-bg, #f2f1ef)', borderRadius: '12px',
            border: '1px solid rgba(26,26,26,0.08)', padding: '48px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
              No uploaded photos
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Click "Add Photo" to upload photos to the gallery
            </div>
          </div>
        )}
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
