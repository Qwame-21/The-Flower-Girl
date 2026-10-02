// src/pages/SettingsPage.jsx
// Enhanced with all original features from settingsModel.js
// Optimized for performance with capsule-style buttons

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSiteSettings, updateSiteSettings } from '../data/settings';

// Toast helper
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

// Capsule button style
const capsuleButtonStyle = {
  padding: '10px 20px',
  borderRadius: '9999px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.15s ease'
};

const primaryButtonStyle = {
  ...capsuleButtonStyle,
  background: '#1a1a1a',
  color: '#fff'
};

const secondaryButtonStyle = {
  ...capsuleButtonStyle,
  background: '#f3f4f6',
  color: '#1a1a1a',
  border: '1px solid #e5e7eb'
};

const dangerButtonStyle = {
  ...capsuleButtonStyle,
  background: '#dc2626',
  color: '#fff'
};

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

  const handleSave = useCallback(async () => {
    if (!settings) return;

    setSaving(true);
    const result = await updateSiteSettings(settings);

    if (result.success) {
      showToast('Settings saved');
    } else {
      showToast('Failed to save settings');
    }

    setSaving(false);
  }, [settings]);

  const handleDeleteAllData = useCallback(async () => {
    if (!settings?.require_password_destructive) {
      showToast('Password confirmation required in settings');
      return;
    }
    
    showToast('Data deletion requires server-side implementation');
    setShowDeleteConfirm(false);
    setDeletePassword('');
  }, [settings]);

  const handleInputChange = useCallback((field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  // Memoize tab content to prevent re-renders
  const tabContent = useMemo(() => {
    if (!settings) return null;

    if (activeTab === 'store') {
      return (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Store Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Business Name</label>
              <input
                type="text"
                value={settings.business_name}
                onChange={e => handleInputChange('business_name', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Store Address</label>
              <input
                type="text"
                value={settings.store_address || ''}
                onChange={e => handleInputChange('store_address', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Support Phone</label>
                <input
                  type="text"
                  value={settings.support_phone || ''}
                  onChange={e => handleInputChange('support_phone', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Support Email</label>
                <input
                  type="email"
                  value={settings.support_email || ''}
                  onChange={e => handleInputChange('support_email', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Instagram URL</label>
              <input
                type="url"
                value={settings.instagram_url || ''}
                onChange={e => handleInputChange('instagram_url', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Dispatch City</label>
              <input
                type="text"
                value={settings.dispatch_city || ''}
                onChange={e => handleInputChange('dispatch_city', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Delivery Note</label>
              <textarea
                value={settings.delivery_note || ''}
                onChange={e => handleInputChange('delivery_note', e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="announcementEnabled"
                checked={settings.announcement_enabled}
                onChange={e => handleInputChange('announcement_enabled', e.target.checked)}
              />
              <label htmlFor="announcementEnabled" style={{ fontSize: '14px' }}>
                Enable announcement banner on storefront
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'delivery') {
      return (
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
                borderRadius: '12px',
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
                    onChange={e => handleInputChange(`delivery_${option.key}_enabled`, e.target.checked)}
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
                    onChange={e => handleInputChange(`delivery_${option.key}_fee`, parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    style={{ width: '70px', padding: '6px 8px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '9999px', fontSize: '14px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'inventory') {
      return (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Inventory Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Low Stock Threshold</label>
              <input
                type="number"
                value={settings.low_stock_threshold || 3}
                onChange={e => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 3)}
                min="0"
                style={{ width: '120px', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '9999px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Alert when stock falls below this level</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="lowStockAlerts"
                checked={settings.low_stock_alerts}
                onChange={e => handleInputChange('low_stock_alerts', e.target.checked)}
              />
              <label htmlFor="lowStockAlerts" style={{ fontSize: '14px' }}>
                Enable low stock alerts
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'notifications') {
      return (
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
                  onChange={e => handleInputChange(`notifications_${notif.key}`, e.target.checked)}
                />
                <label htmlFor={`notif_${notif.key}`} style={{ fontSize: '14px' }}>
                  {notif.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'security') {
      return (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '16px' }}>Security Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="requirePassword"
                checked={settings.require_password_destructive}
                onChange={e => handleInputChange('require_password_destructive', e.target.checked)}
              />
              <label htmlFor="requirePassword" style={{ fontSize: '14px' }}>
                Require password confirmation for destructive actions
              </label>
            </div>
            
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              border: '1px solid #ef4444', 
              borderRadius: '12px',
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
                    ...dangerButtonStyle,
                    padding: '8px 18px',
                    fontSize: '13px'
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
                    style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '9999px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAllData}
                    style={{
                      ...dangerButtonStyle,
                      padding: '6px 14px',
                      fontSize: '13px'
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                    style={{
                      ...secondaryButtonStyle,
                      padding: '6px 14px',
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
      );
    }

    return null;
  }, [settings, activeTab, showDeleteConfirm, deletePassword, handleInputChange, handleDeleteAllData]);

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
        {[
          { id: 'store', label: 'Store Profile' },
          { id: 'delivery', label: 'Delivery' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'security', label: 'Security' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #1a1a1a' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: activeTab === tab.id ? '#1a1a1a' : 'var(--text-muted)',
              borderRadius: '9999px',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabContent}

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            ...primaryButtonStyle,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
