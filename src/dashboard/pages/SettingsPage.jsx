// src/pages/SettingsPage.jsx
// Rewired to use Supabase site_settings table

import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings } from '../data/settings';

// Toast helper
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      const data = await getSiteSettings();
      setSettings(data);
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    const result = await updateSiteSettings({
      businessName: settings.business_name,
      supportPhone: settings.support_phone,
      supportEmail: settings.support_email,
      dispatchCity: settings.dispatch_city,
      deliveryNote: settings.delivery_note,
      announcementEnabled: settings.announcement_enabled
    });

    if (result.success) {
      showToast('Settings saved');
    } else {
      showToast('Failed to save settings');
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="page-container">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="page-container">No settings found. Please initialize site_settings table.</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Settings</h2>
          <p>Configure store profile and operations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(26,26,26,0.1)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'store' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'store' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Store Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'contact' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'contact' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Contact
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'delivery' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'delivery' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Delivery
        </button>
      </div>

      {activeTab === 'store' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Store Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Business Name</label>
              <input
                type="text"
                value={settings.business_name}
                onChange={e => setSettings({ ...settings, business_name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Support Phone</label>
                <input
                  type="text"
                  value={settings.support_phone || ''}
                  onChange={e => setSettings({ ...settings, support_phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Support Email</label>
                <input
                  type="email"
                  value={settings.support_email || ''}
                  onChange={e => setSettings({ ...settings, support_email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Contact Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Dispatch City</label>
              <input
                type="text"
                value={settings.dispatch_city || ''}
                onChange={e => setSettings({ ...settings, dispatch_city: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Delivery Note</label>
              <textarea
                value={settings.delivery_note || ''}
                onChange={e => setSettings({ ...settings, delivery_note: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'delivery' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Delivery Settings</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="announcementEnabled"
              checked={settings.announcement_enabled}
              onChange={e => setSettings({ ...settings, announcement_enabled: e.target.checked })}
            />
            <label htmlFor="announcementEnabled" style={{ fontSize: '14px' }}>
              Enable announcement banner on storefront
            </label>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
