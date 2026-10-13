// src/pages/SettingsPage.jsx
// 6 tabs: store | delivery | inventory | alerts (Notifications) | security | data.
// All controls wired to site_settings or real Supabase auth / tables.

import { useState, useCallback, useEffect } from 'react';
import { getAppSettings, syncSettingsWithSupabase, persistSettings } from '../data/settingsAdapter';
import { supabase } from '../../config/supabase';
import { useDashboard } from '../contexts/DashboardContext';
import { logoutToLogin } from '../../admin/utils/logout';
import PasswordConfirmModal from '../components/PasswordConfirmModal';

// ─── tiny toast helper ───────────────────────────────────────────────────────
function showToast(msg) {
  const ev = new CustomEvent('xa12:toast', { detail: { message: msg } });
  window.dispatchEvent(ev);
}

// ─── Save-button helper: handles async save, reports success or error ───────
function useSavingState() {
  const [saving, setSaving] = useState(false);
  const withSaving = useCallback(async (asyncFn) => {
    setSaving(true);
    try {
      const res = await asyncFn();
      if (res && res.error) {
        showToast(`Save failed: ${res.error}`);
      } else {
        showToast('Settings saved successfully!');
      }
    } catch (err) {
      showToast(err.message || 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  }, []);
  return [saving, withSaving];
}

// ─── Panel: Store ─────────────────────────────────────────────────────────────
function StorePanel({ s, onChange }) {
  const [saving, withSaving] = useSavingState();
  const [form, setForm] = useState({
    name:         s.store.name,
    phone:        s.store.phone,
    email:        s.store.email,
    address:      s.store.address,
    dispatchCity: s.store.dispatchCity || 'Accra',
    instagramUrl: s.store.instagramUrl,
    deliveryNote: s.store.deliveryNote,
  });

  useEffect(() => {
    setForm({
      name:         s.store.name,
      phone:        s.store.phone,
      email:        s.store.email,
      address:      s.store.address,
      dispatchCity: s.store.dispatchCity || 'Accra',
      instagramUrl: s.store.instagramUrl,
      deliveryNote: s.store.deliveryNote,
    });
  }, [s.store]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSave() {
    withSaving(async () => {
      const updated = { ...s, store: { ...s.store, ...form } };
      onChange(updated);
      window.dispatchEvent(new Event('xa12:settingsChanged'));
      return await persistSettings(updated);
    });
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-store">
      <div className="settings-card">
        <h2>Store profile</h2>
        <div className="sub">Displayed to customers on the storefront, header, footer and checkout.</div>
        <div className="settings-fields">
          <div className="settings-f full">
            <label htmlFor="set_store_name">Store name</label>
            <input type="text" id="set_store_name" value={form.name}
              onChange={set('name')} placeholder="The Gifting Factory by Flower Girl" />
          </div>
          <div className="settings-f">
            <label htmlFor="set_store_phone">WhatsApp / Support number</label>
            <input type="text" id="set_store_phone" value={form.phone}
              onChange={set('phone')} placeholder="+233 20 000 0000" />
          </div>
          <div className="settings-f">
            <label htmlFor="set_store_email">Contact email</label>
            <input type="email" id="set_store_email" value={form.email}
              onChange={set('email')} placeholder="hello@yourstore.com" />
          </div>
          <div className="settings-f">
            <label htmlFor="set_store_city">Dispatch city / region</label>
            <input type="text" id="set_store_city" value={form.dispatchCity}
              onChange={set('dispatchCity')} placeholder="Accra" />
          </div>
          <div className="settings-f full">
            <label htmlFor="set_store_address">Collection &amp; Store address</label>
            <input type="text" id="set_store_address" value={form.address}
              onChange={set('address')} placeholder="ACP Estate Junction, Kwabenya, Accra" />
          </div>
          <div className="settings-f full">
            <label htmlFor="set_store_insta">Instagram showcase URL</label>
            <input type="url" id="set_store_insta" value={form.instagramUrl}
              onChange={set('instagramUrl')} placeholder="https://www.instagram.com/yourpage/" />
          </div>
          <div className="settings-f full">
            <label htmlFor="set_store_delivery_note">Delivery policy note</label>
            <input type="text" id="set_store_delivery_note" value={form.deliveryNote}
              onChange={set('deliveryNote')} placeholder="Delivery available across Accra." />
          </div>
        </div>
      </div>
      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

// ─── Panel: Delivery ──────────────────────────────────────────────────────────
function DeliveryPanel({ s, onChange }) {
  const [saving, withSaving] = useSavingState();
  const [hasSelectorColumn, setHasSelectorColumn] = useState(false);

  // Check if delivery_selector_enabled column exists in database
  useEffect(() => {
    async function checkColumn() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('delivery_selector_enabled')
          .limit(1)
          .single();
        setHasSelectorColumn(data && 'delivery_selector_enabled' in data);
      } catch {
        setHasSelectorColumn(false);
      }
    }
    checkColumn();
  }, []);

  const [form, setForm] = useState({
    samedayFee:        s.delivery.sameday.fee,
    samedayOn:         s.delivery.sameday.enabled,
    scheduledFee:      s.delivery.scheduled.fee,
    scheduledOn:       s.delivery.scheduled.enabled,
    surpriseFee:       s.delivery.surprise.fee,
    surpriseOn:        s.delivery.surprise.enabled,
    collectionFee:     s.delivery.collection.fee ?? 0,
    collectionOn:      s.delivery.collection.enabled,
    selectorEnabled:   s.delivery.selectorEnabled ?? true,
  });

  useEffect(() => {
    setForm({
      samedayFee:        s.delivery.sameday.fee,
      samedayOn:         s.delivery.sameday.enabled,
      scheduledFee:      s.delivery.scheduled.fee,
      scheduledOn:       s.delivery.scheduled.enabled,
      surpriseFee:       s.delivery.surprise.fee,
      surpriseOn:        s.delivery.surprise.enabled,
      collectionFee:     s.delivery.collection.fee ?? 0,
      collectionOn:      s.delivery.collection.enabled,
      selectorEnabled:   s.delivery.selectorEnabled ?? true,
    });
  }, [s.delivery]);

  const setNum = (k) => (e) => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }));
  const setBool = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }));

  function handleSave() {
    withSaving(async () => {
      const updated = {
        ...s,
        delivery: {
          sameday:    { fee: form.samedayFee,    enabled: form.samedayOn    },
          scheduled:  { fee: form.scheduledFee,  enabled: form.scheduledOn  },
          surprise:   { fee: form.surpriseFee,   enabled: form.surpriseOn   },
          collection: { fee: form.collectionFee, enabled: form.collectionOn },
          selectorEnabled: form.selectorEnabled,
        }
      };
      onChange(updated);
      window.dispatchEvent(new Event('xa12:settingsChanged'));
      return await persistSettings(updated);
    });
  }

  const Row = ({ label, sub, feeKey, onKey }) => (
    <div className="set-row">
      <div><b>{label}</b><div className="sub">{sub}</div></div>
      <div className="set-end">
        <span style={{ fontSize: '11px', color: 'var(--mute,#747471)' }}>GHS</span>
        <input type="number" className="set-fee-input" value={form[feeKey]}
          onChange={setNum(feeKey)} min="0" step="5" />
        <label className="sw">
          <input type="checkbox" checked={form[onKey]} onChange={setBool(onKey)} />
          <i />
        </label>
      </div>
    </div>
  );

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-delivery">
      <div className="settings-card">
        <h2>Delivery &amp; collection</h2>
        <div className="sub">Turn options on/off and set exact fees. The storefront checkout and server total computation read from these settings.</div>
        <div className="set-row" style={{ alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
          <div><b>Let customers choose delivery type at checkout</b><div className="sub">When off, checkout behaves as it does today (no delivery selector){!hasSelectorColumn && ' · Needs the database update to take effect'}</div></div>
          <div className="set-end">
            <label className="sw">
              <input type="checkbox" checked={form.selectorEnabled} onChange={setBool('selectorEnabled')} disabled={!hasSelectorColumn} />
              <i />
            </label>
          </div>
        </div>
        <Row label="Same-day Accra delivery"  sub="Delivered within Accra the same day."           feeKey="samedayFee"    onKey="samedayOn"    />
        <Row label="Scheduled delivery"        sub="Customer chooses a date and time slot."          feeKey="scheduledFee"  onKey="scheduledOn"  />
        <Row label="Surprise delivery"         sub="Recipient not informed of delivery time."        feeKey="surpriseFee"   onKey="surpriseOn"   />
        <Row label="Store collection"          sub="Customer picks up in-store. Enter 0 for free."  feeKey="collectionFee" onKey="collectionOn" />
      </div>
      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

// ─── Panel: Inventory ─────────────────────────────────────────────────────────
function InventoryPanel({ s, onChange }) {
  const [saving, withSaving] = useSavingState();
  const [threshold, setThreshold] = useState(s.inventory.lowStockThreshold);
  const [alertsOn,  setAlertsOn]  = useState(s.inventory.lowStockAlerts);

  useEffect(() => {
    setThreshold(s.inventory.lowStockThreshold);
    setAlertsOn(s.inventory.lowStockAlerts);
  }, [s.inventory]);

  function handleSave() {
    withSaving(async () => {
      const updated = { ...s, inventory: { lowStockThreshold: threshold, lowStockAlerts: alertsOn } };
      onChange(updated);
      window.dispatchEvent(new Event('xa12:settingsChanged'));
      return await persistSettings(updated);
    });
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-inventory">
      <div className="settings-card">
        <h2>Stock alerts</h2>
        <div className="sub">Controls when a product is flagged as low stock across Products page, POS, and notification bell.</div>
        <div className="set-row">
          <div><b>Low-stock threshold</b><div className="sub">Alert when stock falls to or below this number.</div></div>
          <div className="step-counter" role="group" aria-label="Low-stock threshold">
            <button type="button" aria-label="Decrease"
              onClick={() => setThreshold(n => (n > 1 ? n - 1 : n))}>−</button>
            <span aria-live="polite">{threshold}</span>
            <button type="button" aria-label="Increase"
              onClick={() => setThreshold(n => n + 1)}>+</button>
          </div>
        </div>
        <div className="set-row">
          <div><b>Low-stock alerts</b><div className="sub">Show a persistent alert in the bell when any product drops below threshold.</div></div>
          <label className="sw">
            <input type="checkbox" id="set_inv_alerts_on" checked={alertsOn}
              onChange={e => setAlertsOn(e.target.checked)} />
            <i />
          </label>
        </div>
      </div>
      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

// ─── Panel: Notifications (Alerts) ───────────────────────────────────────────
function AlertsPanel({ s, onChange }) {
  const [saving, withSaving] = useSavingState();
  const [hasTrackingColumns, setHasTrackingColumns] = useState(false);

  // Check if tracking columns exist in database
  useEffect(() => {
    async function checkColumns() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('tracking_auto_refresh_enabled, tracking_refresh_interval_seconds, track_max_failed_attempts, track_lockout_minutes')
          .limit(1)
          .single();
        setHasTrackingColumns(data && 'tracking_auto_refresh_enabled' in data);
      } catch {
        setHasTrackingColumns(false);
      }
    }
    checkColumns();
  }, []);

  const [form, setForm] = useState({
    ...s.notifications,
    autoRefreshEnabled: s.tracking?.autoRefreshEnabled ?? true,
    refreshIntervalSeconds: s.tracking?.refreshIntervalSeconds ?? 10,
    maxFailedAttempts: s.tracking?.maxFailedAttempts ?? 10,
    lockoutMinutes: s.tracking?.lockoutMinutes ?? 15,
  });

  useEffect(() => {
    setForm({
      ...s.notifications,
      autoRefreshEnabled: s.tracking?.autoRefreshEnabled ?? true,
      refreshIntervalSeconds: s.tracking?.refreshIntervalSeconds ?? 10,
      maxFailedAttempts: s.tracking?.maxFailedAttempts ?? 10,
      lockoutMinutes: s.tracking?.lockoutMinutes ?? 15,
    });
  }, [s.notifications, s.tracking]);

  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }));
  const setNum = (k) => (e) => setForm(f => ({ ...f, [k]: parseInt(e.target.value) || 0 }));

  function handleSave() {
    withSaving(async () => {
      const updated = {
        ...s,
        notifications: {
          orders: form.orders,
          requests: form.requests,
          careers: form.careers,
          lowStock: form.lowStock,
        },
        tracking: {
          autoRefreshEnabled: form.autoRefreshEnabled,
          refreshIntervalSeconds: form.refreshIntervalSeconds,
          maxFailedAttempts: form.maxFailedAttempts,
          lockoutMinutes: form.lockoutMinutes,
        },
      };
      onChange(updated);
      window.dispatchEvent(new Event('xa12:settingsChanged'));
      return await persistSettings(updated);
    });
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-alerts">
      <div className="settings-card">
        <h2>Notification preferences</h2>
        <div className="sub">Turning a toggle off suppresses bell notifications and audio alerts for that event type.</div>
        <NotificationRow label="New orders"          sub="Notifies you when a new order is placed via POS or the storefront."  field="orders"   form={form} setCheck={setCheck} />
        <NotificationRow label="New custom requests" sub="Notifies you when a bespoke order request is submitted."              field="requests" form={form} setCheck={setCheck} />
        <NotificationRow label="New job applications" sub="Notifies you when a candidate applies for a job posting."            field="careers"  form={form} setCheck={setCheck} />
        <NotificationRow label="Low stock"           sub="Shows a persistent alert when inventory falls below the threshold."   field="lowStock"    form={form} setCheck={setCheck} />
      </div>
      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="settings-card" style={{ marginTop: '16px' }}>
        <h2>Order tracking auto-refresh</h2>
        <div className="sub">Customer-facing tracking page automatically refreshes to show status updates.{!hasTrackingColumns && ' · Needs the database update to take effect'}</div>
        <div className="set-row">
          <div><b>Auto-refresh order tracking</b><div className="sub">When off, customers must manually click Track to see updates</div></div>
          <label className="sw">
            <input type="checkbox" checked={form.autoRefreshEnabled} onChange={setCheck('autoRefreshEnabled')} disabled={!hasTrackingColumns} />
            <i />
          </label>
        </div>
        <div className="set-row">
          <div><b>Refresh every (seconds)</b><div className="sub">Between 3 and 60 seconds</div></div>
          <input
            type="number"
            className="set-fee-input"
            value={form.refreshIntervalSeconds}
            onChange={setNum('refreshIntervalSeconds')}
            min="3"
            max="60"
            disabled={!hasTrackingColumns}
            style={{ width: '80px' }}
          />
        </div>
        <div className="set-row">
          <div><b>Failed lookups before lockout</b><div className="sub">Between 1 and 100 attempts</div></div>
          <input
            type="number"
            className="set-fee-input"
            value={form.maxFailedAttempts}
            onChange={setNum('maxFailedAttempts')}
            min="1"
            max="100"
            disabled={!hasTrackingColumns}
            style={{ width: '80px' }}
          />
        </div>
        <div className="set-row">
          <div><b>Lockout duration (minutes)</b><div className="sub">Between 1 and 60 minutes</div></div>
          <input
            type="number"
            className="set-fee-input"
            value={form.lockoutMinutes}
            onChange={setNum('lockoutMinutes')}
            min="1"
            max="60"
            disabled={!hasTrackingColumns}
            style={{ width: '80px' }}
          />
        </div>
      </div>
      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

function NotificationRow({ label, sub, field, form, setCheck }) {
  return (
    <div className="set-row">
      <div><b>{label}</b><div className="sub">{sub}</div></div>
      <label className="sw">
        <input type="checkbox" checked={form[field]} onChange={setCheck(field)} />
        <i />
      </label>
    </div>
  );
}

// ─── Panel: Page Content ──────────────────────────────────────────────────────
function ContentPanel({ s, onChange }) {
  const [saving, withSaving] = useSavingState();
  const [form, setForm] = useState(() => ({
    aboutPage: s.content?.aboutPage || '',
    deliveryPage: s.content?.deliveryPage || '',
    policyPage: s.content?.policyPage || '',
    deliverySamedayInfo: s.content?.deliverySamedayInfo || '',
    deliveryScheduledInfo: s.content?.deliveryScheduledInfo || '',
    deliverySurpriseInfo: s.content?.deliverySurpriseInfo || '',
    deliveryCollectionInfo: s.content?.deliveryCollectionInfo || '',
  }));

  useEffect(() => {
    setForm({
      aboutPage: s.content?.aboutPage || '',
      deliveryPage: s.content?.deliveryPage || '',
      policyPage: s.content?.policyPage || '',
      deliverySamedayInfo: s.content?.deliverySamedayInfo || '',
      deliveryScheduledInfo: s.content?.deliveryScheduledInfo || '',
      deliverySurpriseInfo: s.content?.deliverySurpriseInfo || '',
      deliveryCollectionInfo: s.content?.deliveryCollectionInfo || '',
    });
  }, [s.content]);

  const setText = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSave() {
    withSaving(async () => {
      const updated = {
        ...s,
        content: {
          aboutPage: form.aboutPage,
          deliveryPage: form.deliveryPage,
          policyPage: form.policyPage,
          deliverySamedayInfo: form.deliverySamedayInfo,
          deliveryScheduledInfo: form.deliveryScheduledInfo,
          deliverySurpriseInfo: form.deliverySurpriseInfo,
          deliveryCollectionInfo: form.deliveryCollectionInfo,
        },
      };
      onChange(updated);
      window.dispatchEvent(new Event('xa12:settingsChanged'));
      return await persistSettings(updated);
    });
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-content">
      <div className="settings-card">
        <h2>Page content</h2>
        <div className="sub">Edit the text shown on About, Delivery, and Policy pages. These are customer-facing pages in the storefront.</div>
        <div className="settings-fields">
          <ContentTextArea
            label="About page"
            field="aboutPage"
            placeholder="Tell your story..."
            form={form}
            setText={setText}
          />
          <ContentTextArea
            label="Delivery information"
            field="deliveryPage"
            placeholder="Explain delivery options..."
            form={form}
            setText={setText}
          />
          <ContentTextArea
            label="Policy"
            field="policyPage"
            placeholder="Your policies..."
            form={form}
            setText={setText}
          />
          <div className="settings-f full" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Delivery options text</label>
            <div className="sub" style={{ marginBottom: '1rem' }}>Short descriptions for each delivery type shown on the Delivery page (max 500 characters each).</div>
          </div>
          <ContentTextArea
            label="Same-day delivery info"
            field="deliverySamedayInfo"
            placeholder="Delivered on the day you order, when stock and our delivery schedule allow."
            form={form}
            setText={setText}
            maxLength={500}
          />
          <ContentTextArea
            label="Scheduled delivery info"
            field="deliveryScheduledInfo"
            placeholder="Choose the date you want your gift delivered. We deliver on the date you pick."
            form={form}
            setText={setText}
            maxLength={500}
          />
          <ContentTextArea
            label="Surprise delivery info"
            field="deliverySurpriseInfo"
            placeholder="Delivered as a surprise to your recipient. Add their details and any instructions when you order."
            form={form}
            setText={setText}
            maxLength={500}
          />
          <ContentTextArea
            label="Shop collection info"
            field="deliveryCollectionInfo"
            placeholder="Collect your order from our shop."
            form={form}
            setText={setText}
            maxLength={500}
          />
        </div>
      </div>
      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

function ContentTextArea({ label, field, placeholder, form, setText, maxLength = 10000 }) {
  return (
    <div className="settings-f full">
      <label htmlFor={`set_content_${field}`}>{label}</label>
      <textarea
        id={`set_content_${field}`}
        value={form[field]}
        onChange={setText(field)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={6}
        style={{ resize: 'vertical', fontFamily: 'inherit' }}
      />
      <div className="sub" style={{ marginTop: '4px' }}>
        {form[field].length} / 10000 characters • Leave empty to use fallback text
      </div>
    </div>
  );
}

// ─── Panel: Security ──────────────────────────────────────────────────────────
function SecurityPanel({ s, onChange }) {
  const { onSignOut } = useDashboard();
  const [pwCurrent, setPwCurrent]   = useState('');
  const [pwNew,     setPwNew]       = useState('');
  const [pwConfirm, setPwConfirm]   = useState('');
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew,     setShowPwNew]     = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  const [pwDestruct, setPwDestruct] = useState(s.security.requirePasswordForDestructive);
  const [errs, setErrs] = useState({ current: '', newPw: '', confirm: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving]         = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showSecurityPwConfirm, setShowSecurityPwConfirm] = useState(false);
  const [pendingDestructiveAction, setPendingDestructiveAction] = useState(null);

  useEffect(() => {
    setPwDestruct(s.security.requirePasswordForDestructive);
  }, [s.security]);

  function clearErr(field) { setErrs(e => ({ ...e, [field]: '' })); setSuccessMsg(''); }

  async function handleUpdatePassword() {
    const e = { current: '', newPw: '', confirm: '' };
    let valid = true;
    if (!pwCurrent.trim()) { e.current = 'Current password is required.'; valid = false; }
    if (pwNew.length < 8)  { e.newPw   = 'New password must be at least 8 characters.'; valid = false; }
    if (pwNew && pwNew === pwCurrent) { e.newPw = 'New password must differ from current password.'; valid = false; }
    if (pwNew !== pwConfirm){ e.confirm  = 'Passwords do not match.'; valid = false; }

    setErrs(e);
    if (!valid) {
      setTimeout(() => {
        const firstInvalid = document.querySelector('.set-field-invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
      }, 50);
      return;
    }

    setSaving(true);
    try {
      if (supabase) {
        // Step 1: Verify current password via Auth sign-in
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          const { error: verifyErr } = await supabase.auth.signInWithPassword({
            email: userData.user.email,
            password: pwCurrent,
          });
          if (verifyErr) {
            setErrs(prev => ({ ...prev, current: 'Current password is incorrect.' }));
            setSaving(false);
            return;
          }
        }

        // Step 2: Update password in Supabase Auth
        const { error: updateErr } = await supabase.auth.updateUser({ password: pwNew });
        if (updateErr) {
          setErrs(prev => ({ ...prev, newPw: updateErr.message || 'Failed to update password.' }));
          setSaving(false);
          return;
        }
      }

      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setSuccessMsg('Password updated successfully!');
      showToast('Password updated successfully!');
    } catch (err) {
      setErrs(prev => ({ ...prev, newPw: err.message || 'Password update failed.' }));
    } finally {
      setSaving(false);
    }
  }

  async function handlePwDestructChange(e) {
    const val = e.target.checked;
    setPwDestruct(val);
    const updated = { ...s, security: { ...s.security, requirePasswordForDestructive: val } };
    onChange(updated);
    window.dispatchEvent(new Event('xa12:settingsChanged'));
    await persistSettings(updated);
  }

  const handleDestructiveAction = async (actionCallback) => {
    if (!s.security.requirePasswordForDestructive) {
      await actionCallback();
      return;
    }
    setPendingDestructiveAction(() => actionCallback);
    setShowSecurityPwConfirm(true);
  };

  const handlePasswordConfirm = async (password) => {
    try {
      const { confirmDestructive } = await import('../utils/confirmDestructive');
      await confirmDestructive(password);
      if (pendingDestructiveAction) {
        await pendingDestructiveAction();
        setPendingDestructiveAction(null);
      }
      setShowSecurityPwConfirm(false);
    } catch (err) {
      throw err; // Let modal handle the error
    }
  };

  function handleSignOut() {
    setShowSignOut(false);
    if (onSignOut) {
      onSignOut();
    } else {
      logoutToLogin();
    }
  }

  const EyeIcon = ({ visible }) => visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-security">
      {/* Change password card */}
      <div className="settings-card">
        <h2>Change password</h2>
        <div className="sub">Use at least 8 characters. Password must differ from current.</div>
        {successMsg && <div style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>{successMsg}</div>}
        <div className="settings-fields">
          <div className="settings-f full" id="set_pw_current_group">
            <label htmlFor="set_pw_current">Current password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type={showPwCurrent ? 'text' : 'password'} id="set_pw_current" placeholder="••••••••"
                autoComplete="current-password" value={pwCurrent}
                onChange={e => { setPwCurrent(e.target.value); clearErr('current'); }}
                className={errs.current ? 'set-field-invalid shop-error' : ''}
                style={{ paddingRight: '40px', width: '100%' }} />
              <button
                type="button"
                onClick={() => setShowPwCurrent(!showPwCurrent)}
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label={showPwCurrent ? 'Hide password' : 'Show password'}
              >
                <EyeIcon visible={showPwCurrent} />
              </button>
            </div>
            {errs.current && (
              <span className="set-field-error field-error" role="alert" aria-live="polite" style={{ color: '#e11d48', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errs.current}</span>
            )}
          </div>
          <div className="settings-f" id="set_pw_new_group">
            <label htmlFor="set_pw_new">New password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type={showPwNew ? 'text' : 'password'} id="set_pw_new" placeholder="••••••••"
                autoComplete="new-password" value={pwNew}
                onChange={e => { setPwNew(e.target.value); clearErr('newPw'); }}
                className={errs.newPw ? 'set-field-invalid shop-error' : ''}
                style={{ paddingRight: '40px', width: '100%' }} />
              <button
                type="button"
                onClick={() => setShowPwNew(!showPwNew)}
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label={showPwNew ? 'Hide password' : 'Show password'}
              >
                <EyeIcon visible={showPwNew} />
              </button>
            </div>
            {errs.newPw && (
              <span className="set-field-error field-error" role="alert" aria-live="polite" style={{ color: '#e11d48', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errs.newPw}</span>
            )}
          </div>
          <div className="settings-f" id="set_pw_confirm_group">
            <label htmlFor="set_pw_confirm">Confirm new password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input type={showPwConfirm ? 'text' : 'password'} id="set_pw_confirm" placeholder="••••••••"
                autoComplete="new-password" value={pwConfirm}
                onChange={e => { setPwConfirm(e.target.value); clearErr('confirm'); }}
                className={errs.confirm ? 'set-field-invalid shop-error' : ''}
                style={{ paddingRight: '40px', width: '100%' }} />
              <button
                type="button"
                onClick={() => setShowPwConfirm(!showPwConfirm)}
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label={showPwConfirm ? 'Hide password' : 'Show password'}
              >
                <EyeIcon visible={showPwConfirm} />
              </button>
            </div>
            {errs.confirm && (
              <span className="set-field-error field-error" role="alert" aria-live="polite" style={{ color: '#e11d48', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errs.confirm}</span>
            )}
          </div>
        </div>
      </div>

      {/* Protection card */}
      <div className="settings-card">
        <h2>Protection</h2>
        <div className="sub">Extra checks for high-impact admin actions.</div>
        <div className="set-row">
          <div>
            <b>Ask for password on destructive actions</b>
            <div className="sub">Deleting orders, clearing data, removing products.</div>
          </div>
          <label className="sw">
            <input type="checkbox" id="set_sec_pw_destructive"
              checked={pwDestruct} onChange={handlePwDestructChange} />
            <i />
          </label>
        </div>
        <div className="set-row">
          <div>
            <b>Sign out on this device</b>
            <div className="sub">You will be returned to the login screen.</div>
          </div>
          <button className="btn" id="signOutBtn" type="button"
            onClick={() => setShowSignOut(true)}>Sign out</button>
        </div>
      </div>

      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleUpdatePassword}>
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </div>

      {/* Sign-out confirm modal */}
      {showSignOut && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px',
            maxWidth: '400px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Sign Out</h3>
            <p style={{ fontSize: '13px', color: 'var(--mute,#747471)', margin: '0 0 16px 0' }}>
              Sign out of the admin dashboard?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" onClick={() => setShowSignOut(false)}>Cancel</button>
              <button type="button" className="btn d" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Password confirmation modal */}
      <PasswordConfirmModal
        isOpen={showSecurityPwConfirm}
        onClose={() => setShowSecurityPwConfirm(false)}
        onConfirm={handlePasswordConfirm}
        title="Confirm Destructive Action"
      />
    </section>
  );
}

// ─── Panel: Data ──────────────────────────────────────────────────────────────
function DataPanel() {
  const [userRole, setUserRole] = useState(null);
  const [settings, setSettings] = useState(() => getAppSettings());
  const [dbCounts, setDbCounts] = useState({ orders: 0, products: 0, requests: 0, reviews: 0, notifications: 0, applications: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [deleteCategories, setDeleteCategories] = useState({ orders: false, requests: false, reviews: false, notifications: false, applications: false });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDataPwConfirm, setShowDataPwConfirm] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);

  async function loadCounts() {
    if (!supabase) return;
    setLoadingCounts(true);
    try {
      const [ordersRes, productsRes, requestsRes, reviewsRes, notificationsRes, applicationsRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('customer_requests').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('admin_notifications').select('id', { count: 'exact', head: true }),
        supabase.from('career_applications').select('id', { count: 'exact', head: true }),
      ]);
      setDbCounts({
        orders: ordersRes.count || 0,
        products: productsRes.count || 0,
        requests: requestsRes.count || 0,
        reviews: reviewsRes.count || 0,
        notifications: notificationsRes.count || 0,
        applications: applicationsRes.count || 0,
      });
    } catch (err) {
      console.warn('Error loading real database table counts:', err);
    } finally {
      setLoadingCounts(false);
    }
  }

  useEffect(() => {
    async function init() {
      await loadCounts();
      // Load user role for access control from staff_profiles table
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleData } = await supabase
            .from('staff_profiles')
            .select('role')
            .eq('user_id', user.id)
            .eq('active', true)
            .single();
          setUserRole(roleData?.role || null);
        }
      } catch (err) {
        console.warn('Error loading user role:', err);
      }
    }
    init();
  }, []);

  // Load settings for password confirmation check (live reload)
  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

  function escCSV(v) {
    const s = String(v == null ? '' : v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  async function handleExportData() {
    showToast('Preparing real database export…');
    const rows = [['Table', 'ID', 'Reference / Code', 'Name / Title', 'Status / Amount', 'Created At']];

    try {
      if (supabase) {
        const [ordersData, requestsData, productsData] = await Promise.all([
          supabase.from('orders').select('*').limit(1000),
          supabase.from('customer_requests').select('*').limit(1000),
          supabase.from('products').select('*').limit(1000),
        ]);

        (ordersData.data || []).forEach(o => rows.push(['Order', escCSV(o.id), escCSV(o.order_code || o.tracking_number), escCSV(o.customer_name), escCSV(o.total_amount), escCSV(o.created_at)]));
        (requestsData.data || []).forEach(r => rows.push(['Request', escCSV(r.id), escCSV(r.reference_number), escCSV(r.customer_name), escCSV(r.status), escCSV(r.created_at)]));
        (productsData.data || []).forEach(p => rows.push(['Product', escCSV(p.id), escCSV(p.sku), escCSV(p.name), escCSV(p.price), escCSV(p.created_at)]));
      }
    } catch (err) {
      console.error('Export fetch error:', err);
    }

    const csv  = rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `flowergirl_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Live database export downloaded!');
  }

  async function executeDelete() {
    setIsDeleting(true);
    setDeleteProgress('Starting deletion...');
    const results = [];

    try {
      if (deleteCategories.orders) {
        setDeleteProgress('Deleting orders...');
        const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        results.push({ category: 'Orders', success: !error, error: error?.message });
      }

      if (deleteCategories.requests) {
        setDeleteProgress('Deleting customer requests...');
        const { error } = await supabase.from('customer_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        results.push({ category: 'Requests', success: !error, error: error?.message });
      }

      if (deleteCategories.reviews) {
        setDeleteProgress('Deleting reviews...');
        const { error } = await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        results.push({ category: 'Reviews', success: !error, error: error?.message });
      }

      if (deleteCategories.notifications) {
        setDeleteProgress('Deleting notifications...');
        const { error } = await supabase.from('admin_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        results.push({ category: 'Notifications', success: !error, error: error?.message });
      }

      if (deleteCategories.applications) {
        setDeleteProgress('Deleting job applications...');
        const { error } = await supabase.from('career_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        results.push({ category: 'Applications', success: !error, error: error?.message });
      }

      // Refresh cache
      setDeleteProgress('Refreshing data...');
      loadCounts();

      const successCount = results.filter(r => r.success).length;
      showToast(`Deleted ${successCount} categories successfully. Check results for errors.`);
    } catch (err) {
      showToast(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteProgress('');
      setDeleteCategories({ orders: false, requests: false, reviews: false, notifications: false, applications: false });
      setDeleteConfirmText('');
    }
  }

  const handlePasswordConfirm = async (password) => {
    try {
      const { confirmDestructive } = await import('../utils/confirmDestructive');
      await confirmDestructive(password);
      if (pendingDeleteAction) {
        await pendingDeleteAction();
        setPendingDeleteAction(null);
      }
      setShowDataPwConfirm(false);
    } catch (err) {
      throw err;
    }
  };

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-data">
      {/* Live database stats & environment card */}
      <div className="settings-card">
        <h2>Database environment &amp; live counts</h2>
        <div className="sub">Real-time table counts from your connected Supabase backend.</div>
        <div className="set-row">
          <div><b>Connection status</b><div className="sub">Connected to live database</div></div>
          <span style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '999px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: '#166534' }}>
            Connected (Live)
          </span>
        </div>
        <div className="set-row">
          <div><b>Live Database Table Counts</b><div className="sub">Actual rows stored in production tables.</div></div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main,#1c1c1b)' }}>
            {loadingCounts ? 'Loading counts…' : `${dbCounts.orders} orders · ${dbCounts.products} products · ${dbCounts.requests} requests · ${dbCounts.reviews} reviews`}
          </span>
        </div>
      </div>

      {/* Data & export */}
      <div className="settings-card">
        <h2>Data export</h2>
        <div className="sub">Export production database tables to CSV format. Never alters or deletes data.</div>
        <div className="set-row">
          <div>
            <b>Export live database</b>
            <div className="sub">Downloads orders, custom requests and product catalogue as a CSV spreadsheet.</div>
          </div>
          <button className="btn" type="button" onClick={handleExportData}>Export CSV</button>
        </div>
      </div>

      {/* Danger: Demo data (disabled per requirement) */}
      <div className="settings-card" style={{ borderColor: 'rgba(161,75,69,.2)', opacity: 0.75 }}>
        <h2 style={{ color: '#a14b45' }}>Danger zone — Demo data tool</h2>
        <div className="sub">Built &amp; disabled until demo rows are tagged by administrator. No deletions will be run.</div>
        <div className="set-row">
          <div>
            <b>Clear demo data</b>
            <div className="sub">Disabled until demo rows are explicitly marked in database.</div>
          </div>
          <button className="btn d" type="button" disabled aria-disabled="true" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
            Clear demo data (Disabled)
          </button>
        </div>
      </div>

      {/* Delete live data section - owner/admin only */}
      {userRole === 'owner' || userRole === 'admin' ? (
      <div className="settings-card" style={{ borderColor: 'rgba(161,75,69,.2)' }}>
        <h2 style={{ color: '#a14b45' }}>Delete live data</h2>
        <div className="sub">Permanently delete production data. Export first as backup.</div>
        <div className="set-row">
          <div>
            <b>Orders</b>
            <div className="sub">{dbCounts.orders} records (includes items and events)</div>
          </div>
          <input type="checkbox" checked={deleteCategories.orders} onChange={(e) => setDeleteCategories({...deleteCategories, orders: e.target.checked})} />
        </div>
        <div className="set-row">
          <div>
            <b>Customer requests</b>
            <div className="sub">{dbCounts.requests} records</div>
          </div>
          <input type="checkbox" checked={deleteCategories.requests} onChange={(e) => setDeleteCategories({...deleteCategories, requests: e.target.checked})} />
        </div>
        <div className="set-row">
          <div>
            <b>Reviews</b>
            <div className="sub">{dbCounts.reviews} records</div>
          </div>
          <input type="checkbox" checked={deleteCategories.reviews} onChange={(e) => setDeleteCategories({...deleteCategories, reviews: e.target.checked})} />
        </div>
        <div className="set-row">
          <div>
            <b>Admin notifications</b>
            <div className="sub">{dbCounts.notifications} records</div>
          </div>
          <input type="checkbox" checked={deleteCategories.notifications} onChange={(e) => setDeleteCategories({...deleteCategories, notifications: e.target.checked})} />
        </div>
        <div className="set-row">
          <div>
            <b>Job applications</b>
            <div className="sub">{dbCounts.applications} records</div>
          </div>
          <input type="checkbox" checked={deleteCategories.applications} onChange={(e) => setDeleteCategories({...deleteCategories, applications: e.target.checked})} />
        </div>
        <div style={{ marginTop: '16px', padding: '12px', background: '#fff1f2', borderRadius: '8px', fontSize: '12px', color: '#a14b45', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div><strong>Export first:</strong> Always export your data before deleting. This action cannot be undone.</div>
        </div>
        <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '10px' }}>
          <button className="btn d" type="button" disabled={isDeleting || !Object.values(deleteCategories).some(Boolean)} onClick={() => setShowDeleteModal(true)}>
            {isDeleting ? 'Deleting…' : 'Delete Selected'}
          </button>
        </div>
      </div>
      ) : (
        <div className="settings-card" style={{ opacity: 0.6 }}>
          <h2 style={{ color: '#a14b45' }}>Delete live data</h2>
          <div className="sub">This section is only available to owner and admin roles.</div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#a14b45' }}>Confirm Deletion</h3>
            <p style={{ fontSize: '13px', color: '#747471', margin: '0 0 16px 0' }}>
              This will permanently delete the selected data. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '16px', textTransform: 'uppercase' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>Cancel</button>
              <button
                type="button"
                className="btn d"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  setShowDeleteModal(false);
                  // Check if password confirmation is required
                  if (settings?.security?.requirePasswordForDestructive) {
                    setPendingDeleteAction(() => executeDelete);
                    setShowDataPwConfirm(true);
                  } else {
                    executeDelete();
                  }
                }}
              >
                Confirm & Enter Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password confirmation modal */}
      <PasswordConfirmModal
        isOpen={showDataPwConfirm}
        onClose={() => { setShowDataPwConfirm(false); setPendingDeleteAction(null); }}
        onConfirm={handlePasswordConfirm}
        title="Confirm Deletion"
      />
    </section>
  );
}

// ─── Main SettingsPage component ──────────────────────────────────────────────
const TABS = [
  { key: 'store',     label: 'Store'         },
  { key: 'delivery',  label: 'Delivery'      },
  { key: 'inventory', label: 'Inventory'     },
  { key: 'alerts',    label: 'Notifications' },
  { key: 'content',   label: 'Page Content'  },
  { key: 'security',  label: 'Security'      },
  { key: 'data',      label: 'Data'          },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [s, setS] = useState(() => getAppSettings());

  // Sync with Supabase on mount
  useEffect(() => {
    syncSettingsWithSupabase().then(result => {
      setS(result);
    });
  }, []);

  // called by sub-panels after saving so s stays in sync for this render
  const handleChange = useCallback((updated) => {
    setS(updated);
  }, []);

  return (
    <div className="page-container settings-page">
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Settings</h2>
          <p>Configure your store, delivery, inventory, notifications and security preferences.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="settings-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.key}
            className={`settings-tab${activeTab === t.key ? ' on' : ''}`}
            data-t={t.key} role="tab"
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels — only the active one renders */}
      {activeTab === 'store'     && <StorePanel     s={s} onChange={handleChange} />}
      {activeTab === 'delivery'  && <DeliveryPanel  s={s} onChange={handleChange} />}
      {activeTab === 'inventory' && <InventoryPanel s={s} onChange={handleChange} />}
      {activeTab === 'alerts'    && <AlertsPanel    s={s} onChange={handleChange} />}
      {activeTab === 'content'   && <ContentPanel   s={s} onChange={handleChange} />}
      {activeTab === 'security'  && <SecurityPanel  s={s} onChange={handleChange} />}
      {activeTab === 'data'      && <DataPanel />}
    </div>
  );
}
