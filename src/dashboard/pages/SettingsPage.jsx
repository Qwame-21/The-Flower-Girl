// src/pages/SettingsPage.jsx
// Enhanced with all original features from settingsModel.js

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

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
    const result = await updateSiteSettings(settings);

    if (result.success) {
      showToast('Settings saved');
    } else {
      showToast('Failed to save settings');
    }

    setSaving(false);
  };

  const handleDeleteAllData = async () => {
    if (!settings?.require_password_destructive) {
      showToast('Password confirmation required in settings');
      return;
    }
    
    // This would need to be implemented as a Supabase function
    // For now, just show a message
    showToast('Data deletion requires server-side implementation');
    setShowDeleteConfirm(false);
    setDeletePassword('');
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
          <p>Configure store profile, delivery, notifications, and security.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(26,26,26,0.1)', flexWrap: 'wrap' }}>
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
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'inventory' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Inventory
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'notifications' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'notifications' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Notifications
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'security' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'security' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Security
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
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Store Address</label>
              <input
                type="text"
                value={settings.store_address || ''}
                onChange={e => setSettings({ ...settings, store_address: e.target.value })}
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
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Instagram URL</label>
              <input
                type="url"
                value={settings.instagram_url || ''}
                onChange={e => setSettings({ ...settings, instagram_url: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
            </div>
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
        </div>
      )}

      {activeTab === 'delivery' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Delivery Options</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { key: 'sameday', label: 'Same-day delivery', defaultFee: 120 },
              { key: 'scheduled', label: 'Scheduled delivery', defaultFee: 90 },
              { key: 'surprise', label: 'Surprise delivery', defaultFee: 140 },
              { key: 'collection', label: 'Store collection', defaultFee: 0 }
            ].map(option => (
              <div key={option.key} style={{ 
                padding: '16px', 
                border: '1px solid rgba(26,26,26,0.08)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <input
                    type="checkbox"
                    id={`delivery_${option.key}`}
                    checked={settings[`delivery_${option.key}_enabled`]}
                    onChange={e => setSettings({ ...settings, [`delivery_${option.key}_enabled`]: e.target.checked })}
                  />
                  <label htmlFor={`delivery_${option.key}`} style={{ fontSize: '14px', fontWeight: 500 }}>
                    {option.label}
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '140px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fee (GHS):</span>
                  <input
                    type="number"
                    value={settings[`delivery_${option.key}_fee`] || option.defaultFee}
                    onChange={e => setSettings({ ...settings, [`delivery_${option.key}_fee`]: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    style={{ width: '70px', padding: '6px 8px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Inventory Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Low Stock Threshold</label>
              <input
                type="number"
                value={settings.low_stock_threshold || 3}
                onChange={e => setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value) || 3 })}
                min="0"
                style={{ width: '120px', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Alert when stock falls below this level</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="lowStockAlerts"
                checked={settings.low_stock_alerts}
                onChange={e => setSettings({ ...settings, low_stock_alerts: e.target.checked })}
              />
              <label htmlFor="lowStockAlerts" style={{ fontSize: '14px' }}>
                Enable low stock alerts
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Notification Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'new_orders', label: 'New orders' },
              { key: 'new_requests', label: 'New customer requests' },
              { key: 'new_careers', label: 'New career applications' },
              { key: 'low_stock', label: 'Low stock alerts' }
            ].map(notif => (
              <div key={notif.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id={`notif_${notif.key}`}
                  checked={settings[`notifications_${notif.key}`]}
                  onChange={e => setSettings({ ...settings, [`notifications_${notif.key}`]: e.target.checked })}
                />
                <label htmlFor={`notif_${notif.key}`} style={{ fontSize: '14px' }}>
                  {notif.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Security Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="requirePassword"
                checked={settings.require_password_destructive}
                onChange={e => setSettings({ ...settings, require_password_destructive: e.target.checked })}
              />
              <label htmlFor="requirePassword" style={{ fontSize: '14px' }}>
                Require password confirmation for destructive actions
              </label>
            </div>
            
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              border: '1px solid #ef4444', 
              borderRadius: '8px',
              backgroundColor: '#fef2f2'
            }}>
              <h4 style={{ color: '#dc2626', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Danger Zone</h4>
              <p style={{ fontSize: '13px', color: '#991b1b', marginBottom: '12px' }}>
                Once you delete all data, there is no going back. Please be certain.
              </p>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  Delete All Data
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAllData}
                    style={{
                      padding: '6px 12px',
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                    style={{
                      padding: '6px 12px',
                      background: '#fff',
                      color: '#1a1a1a',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
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
