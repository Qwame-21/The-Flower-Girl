// src/pages/GalleryPage.jsx
// Admin gallery manager with storefront gallery display and Supabase uploaded photos

import { useState, useEffect } from 'react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { supabase } from '../../config/supabase';
import CustomDropdown from '../components/shared/CustomDropdown';
import { getImageUrl } from '../lib/imageUrlHelper';
import { getAppSettings } from '../data/settingsAdapter';
import PasswordConfirmModal from '../components/PasswordConfirmModal';

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

// ---- Blend auto-detection helpers ----
// Sample the four corners of an image drawn on an off-screen canvas.
// Returns { blendBackground: bool, note: string }
function detectBlendBackground(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const inset = Math.max(2, Math.round(Math.min(W, H) * 0.015));
      const corners = [
        ctx.getImageData(inset, inset, 1, 1).data,
        ctx.getImageData(W - inset - 1, inset, 1, 1).data,
        ctx.getImageData(inset, H - inset - 1, 1, 1).data,
        ctx.getImageData(W - inset - 1, H - inset - 1, 1, 1).data,
      ];
      // Check if every corner is transparent
      const allTransparent = corners.every(d => d[3] === 0);
      if (allTransparent) {
        resolve({ blendBackground: false, note: 'Transparent background detected — blend not needed' });
        return;
      }
      // Check if every corner is a light/near-white colour
      const threshold = 200;
      const delta = 30;
      const allLight = corners.every(d => d[3] > 200 && d[0] > threshold && d[1] > threshold && d[2] > threshold);
      const channelRange = Math.max(
        ...corners.map(d => Math.max(d[0], d[1], d[2]) - Math.min(d[0], d[1], d[2])),
      );
      if (allLight && channelRange < delta) {
        resolve({ blendBackground: true, note: 'Light background detected — blend recommended' });
      } else {
        resolve({ blendBackground: false, note: 'Dark or varied background — blend not recommended' });
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ blendBackground: false, note: '' }); };
    img.src = url;
  });
}

// Add Photo modal with file upload and blend toggle
function AddPhotoModal({ onCancel, onSubmit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [blendBackground, setBlendBackground] = useState(false);
  const [blendNote, setBlendNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFileChange(e) {
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
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(selected);

    // Auto-detect blend background
    const detected = await detectBlendBackground(selected);
    setBlendBackground(detected.blendBackground);
    setBlendNote(detected.note);
  }

  function handleClearFile() {
    setFile(null);
    setPreview(null);
    setBlendBackground(false);
    setBlendNote('');
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
      await onSubmit({ title: title.trim(), category, file, blend_background: blendBackground });
      setTitle('');
      setCategory('');
      setFile(null);
      setPreview(null);
      setBlendBackground(false);
      setBlendNote('');
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

          {/* Blend background toggle with auto-detected suggestion */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '10px 12px', border: '1px solid rgba(26,26,26,0.14)',
              borderRadius: '10px', background: blendBackground ? '#f0fdf4' : 'rgba(26,26,26,0.02)',
              transition: 'background 0.25s'
            }}>
              {/* Pill toggle */}
              <button
                type="button"
                aria-checked={blendBackground}
                role="switch"
                onClick={() => setBlendBackground(v => !v)}
                style={{
                  flexShrink: 0, width: '40px', height: '22px',
                  borderRadius: '999px', border: 'none', cursor: 'pointer',
                  background: blendBackground ? '#059669' : 'rgba(26,26,26,0.18)',
                  position: 'relative', transition: 'background 0.2s', marginTop: '1px'
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px',
                  left: blendBackground ? '21px' : '3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.18s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                }} />
              </button>
              <div style={{ cursor: 'pointer' }} onClick={() => setBlendBackground(v => !v)}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Blend into page background</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {blendNote || 'On: image blends into the sand-coloured page background. Use for product shots with light or white backgrounds.'}
                </div>
              </div>
            </div>
            {/* Live preview tile */}
            {preview && (
              <div style={{ marginTop: '8px', padding: '10px', borderRadius: '8px',
                background: '#e2e2e0', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: '#666', marginBottom: '6px' }}>Preview on page background</div>
                <img
                  src={preview}
                  alt="Blend preview"
                  style={{
                    maxWidth: '100%', maxHeight: '120px', objectFit: 'contain',
                    mixBlendMode: blendBackground ? 'multiply' : 'normal',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}
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
                padding: '8px 22px', borderRadius: '999px', border: '1px solid rgba(26,26,26,0.14)',
                background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 22px', borderRadius: '999px', border: 'none',
                background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '13px',
                fontWeight: 600, opacity: loading ? 0.6 : 1
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

// Edit Photo modal — toggle blend_background on an existing uploaded photo
function EditPhotoModal({ item, onCancel, onSave }) {
  const [blend, setBlend] = useState(Boolean(item.blend_background));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(item.id, { blend_background: blend });
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = item.image_path ? item._previewUrl : null;

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
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Edit Photo</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {item.label || 'Untitled'}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '10px 12px', border: '1px solid rgba(26,26,26,0.14)',
          borderRadius: '10px', background: blend ? '#f0fdf4' : 'rgba(26,26,26,0.02)',
          transition: 'background 0.25s', marginBottom: '12px'
        }}>
          {/* Pill toggle */}
          <button
            type="button"
            aria-checked={blend}
            role="switch"
            onClick={() => setBlend(v => !v)}
            style={{
              flexShrink: 0, width: '40px', height: '22px',
              borderRadius: '999px', border: 'none', cursor: 'pointer',
              background: blend ? '#059669' : 'rgba(26,26,26,0.18)',
              position: 'relative', transition: 'background 0.2s', marginTop: '1px'
            }}
          >
            <span style={{
              position: 'absolute', top: '3px',
              left: blend ? '21px' : '3px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#fff', transition: 'left 0.18s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
            }} />
          </button>
          <div style={{ cursor: 'pointer' }} onClick={() => setBlend(v => !v)}>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Blend into page background</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              On: renders with mix-blend-mode: multiply over #e2e2e0. Use for product shots with white/light backgrounds.
            </div>
          </div>
        </div>

        {/* Preview pane */}
        <div style={{ padding: '10px', borderRadius: '8px', background: '#e2e2e0',
          textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#666', marginBottom: '6px' }}>Preview on page background</div>
          <img
            src={item._previewUrl}
            alt="Blend preview"
            style={{
              maxWidth: '100%', maxHeight: '110px', objectFit: 'contain',
              mixBlendMode: blend ? 'multiply' : 'normal', borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{ padding: '8px 22px', borderRadius: '999px', border: '1px solid rgba(26,26,26,0.14)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 22px', borderRadius: '999px', border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
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
  const [editTarget, setEditTarget] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [settings, setSettings] = useState(() => getAppSettings());
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);

  // Load storefront gallery from adminStore (read-only)
  useEffect(() => {
    const data = readAdminData();
    setStorefrontGallery(data.gallery || []);
    const unsubscribe = subscribeAdminData((newData) => {
      setStorefrontGallery(newData.gallery || []);
    });
    return unsubscribe;
  }, []);

  // Load settings for password confirmation check
  useEffect(() => {
    setSettings(getAppSettings());
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

  // Filter storefront gallery to show only not-yet-imported images
  const notImportedStorefront = storefrontGallery.filter(item => {
    const fileName = item.src.split('/').pop();
    const targetPath = `gallery/imported-${fileName}`;
    return !uploadedPhotos.some(up => up.image_path === targetPath);
  });

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
        sort_order: maxSort + 1,
        blend_background: Boolean(blend_background)
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

  // Handle edit (blend_background toggle) on an uploaded photo
  async function handleEditSave(id, updates) {
    if (!supabase) return;
    const { error } = await supabase
      .from('gallery_items')
      .update({ blend_background: Boolean(updates.blend_background) })
      .eq('id', id);
    if (error) {
      showToast('Failed to update photo.');
    } else {
      setUploadedPhotos(prev =>
        prev.map(p => p.id === id ? { ...p, blend_background: Boolean(updates.blend_background) } : p)
      );
      setEditTarget(null);
      showToast('Photo updated.');
    }
  }

  // Handle delete photo
  async function handleDeleteConfirmed() {
    if (!deleteTarget || !supabase) return;

    if (settings?.security?.requirePasswordForDestructive) {
      setPendingDeleteAction(() => async () => {
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
      });
      setShowPwConfirm(true);
      return;
    }

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

  const handlePasswordConfirm = async (password) => {
    try {
      const { confirmDestructive } = await import('../utils/confirmDestructive');
      await confirmDestructive(password);
      if (pendingDeleteAction) {
        await pendingDeleteAction();
        setPendingDeleteAction(null);
      }
      setShowPwConfirm(false);
    } catch (err) {
      throw err;
    }
  };

  // Handle import storefront gallery
  async function handleImportStorefrontGallery() {
    if (!supabase) {
      showToast('Supabase not configured');
      return;
    }

    setImportLoading(true);
    setImportMessage('');

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === 'storefront-media');

      if (!bucketExists) {
        setImportMessage('Storage bucket "storefront-media" not found. Please create it in Supabase.');
        setImportLoading(false);
        return;
      }

      // Check if table exists
      const { error: tableError } = await supabase
        .from('gallery_items')
        .select('id')
        .limit(1);

      if (tableError) {
        setImportMessage('Gallery table not found. Please run the migration.');
        setImportLoading(false);
        return;
      }

      // Get current max sort_order
      const { data: existingItems } = await supabase
        .from('gallery_items')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const maxSort = existingItems?.[0]?.sort_order || 0;

      // Process each storefront gallery image
      for (const item of storefrontGallery) {
        try {
          const fileName = item.src.split('/').pop();
          const targetPath = `gallery/imported-${fileName}`;

          // Check if already imported
          const { data: existing } = await supabase
            .from('gallery_items')
            .select('id')
            .eq('image_path', targetPath)
            .single();

          if (existing) {
            skipped++;
            continue;
          }

          // Fetch the image file
          const response = await fetch(item.src);
          if (!response.ok) {
            failed++;
            continue;
          }

          const blob = await response.blob();
          const file = new File([blob], fileName, { type: blob.type });

          // Upload to Supabase
          const { error: uploadError } = await supabase
            .storage
            .from('storefront-media')
            .upload(targetPath, file);

          if (uploadError) {
            failed++;
            continue;
          }

          // Create gallery item
          const { error: insertError } = await supabase
            .from('gallery_items')
            .insert({
              image_path: targetPath,
              label: item.label || fileName.replace(/-/g, ' ').replace(/\.[^/.]+$/, ''),
              category: null,
              visible: true,
              sort_order: maxSort + imported + 1
            });

          if (insertError) {
            failed++;
            continue;
          }

          imported++;
        } catch (err) {
          failed++;
          console.error('Error importing image:', item.src, err);
        }
      }

      setImportMessage(`${imported} imported, ${skipped} skipped, ${failed} failed`);

      // Reload photos if any were imported
      if (imported > 0) {
        const { data } = await supabase
          .from('gallery_items')
          .select('*')
          .order('sort_order', { ascending: true });

        setUploadedPhotos(data || []);
      }
    } catch (err) {
      setImportMessage('Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setImportLoading(false);
    }
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

      {/* Storefront gallery section (read-only, not yet imported) */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Storefront gallery</h3>
          {notImportedStorefront.length > 0 && (
            <button
              className="xp-pill xp-solid"
              type="button"
              onClick={handleImportStorefrontGallery}
              disabled={importLoading}
              style={{ opacity: importLoading ? 0.6 : 1 }}
            >
              {importLoading ? 'Importing...' : 'Import current storefront gallery'}
            </button>
          )}
        </div>
        {importMessage && (
          <div style={{ fontSize: '12px', color: importMessage.includes('failed') ? '#dc2626' : '#059669', marginBottom: '12px' }}>
            {importMessage}
          </div>
        )}
        {notImportedStorefront.length > 0 ? (
          <div className="gallery-showcase">
            {notImportedStorefront.map((item) => (
              <div key={item.id} className="gallery-item" data-id={item.id}>
                <img
                  src={getImageUrl(item.src)}
                  className="gallery-image"
                  alt={item.label || ''}
                />
                <div className="gallery-caption">— {(item.label || 'UNTITLED').toUpperCase()}</div>
                <hr className="gallery-divider" />
                <div className="gallery-actions">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Not yet imported
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
              {storefrontGallery.length === 0 ? 'No storefront gallery photos' : 'All storefront images imported'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {storefrontGallery.length === 0 ? 'Storefront gallery is empty' : 'Storefront gallery images are now managed in Supabase'}
            </div>
          </div>
        )}
      </div>

      {/* Uploaded photos section */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Uploaded photos</h3>
        {uploadedPhotos.length > 0 ? (
          <div className="gallery-showcase">
            {uploadedPhotos.map((item) => {
              const imgUrl = getImageUrl(item.image_path);
              return (
                <div key={item.id} className="gallery-item" data-id={item.id}>
                  <img
                    src={imgUrl}
                    className="gallery-image"
                    alt={item.label || ''}
                  />
                  <div className="gallery-caption">— {(item.label || 'UNTITLED').toUpperCase()}</div>
                  <hr className="gallery-divider" />
                  <div className="gallery-actions">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: 'auto' }}>
                      {item.category || 'Uncategorized'}
                    </span>
                    {/* Blend badge */}
                    {item.blend_background && (
                      <span
                        title="Background blend enabled"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          fontSize: '10px', fontWeight: 600, color: '#059669',
                          background: '#ecfdf5', padding: '2px 7px', borderRadius: '10px',
                          marginRight: '4px'
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/>
                        </svg>
                        blend
                      </span>
                    )}
                    {/* Edit button */}
                    <button
                      className="btn-icon-action"
                      title="Edit photo settings"
                      type="button"
                      onClick={() => setEditTarget({ ...item, _previewUrl: imgUrl })}
                      style={{ marginRight: '2px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
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
              );
            })}
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

      {/* Edit photo modal (blend toggle) */}
      {editTarget && (
        <EditPhotoModal
          item={editTarget}
          onCancel={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Password confirmation modal */}
      <PasswordConfirmModal
        isOpen={showPwConfirm}
        onClose={() => { setShowPwConfirm(false); setPendingDeleteAction(null); }}
        onConfirm={handlePasswordConfirm}
        title="Confirm Deletion"
      />
    </div>
  );
}
