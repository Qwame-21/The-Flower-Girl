// src/pages/SettingsPage.jsx
// Ported 1-for-1 from admin-monolith.html renderSettingsView().
// 6 tabs: store | delivery | inventory | alerts (Notifications) | security | data.
// No invented tabs (the earlier "Profile" tab has been removed).

import { useState, useCallback } from 'react';
import { getAppSettings, saveAppSettings } from '../lib/settingsModel';

// ─── tiny toast helper ───────────────────────────────────────────────────────
function showToast(msg) {
  const ev = new CustomEvent('xa12:toast', { detail: { message: msg } });
  window.dispatchEvent(ev);
}

// ─── Save-button micro-animation: 200 ms "Saving…" state ─────────────────────
function useSavingState() {
  const [saving, setSaving] = useState(false);
  const withSaving = useCallback(async (fn) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 200));
    try { fn(); } catch (err) { showToast(err.message || 'Error saving settings.'); }
    setSaving(false);
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
    instagramUrl: s.store.instagramUrl,
  });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSave() {
    withSaving(() => {
      const updated = { ...s, store: { ...s.store, ...form } };
      saveAppSettings(updated);
      onChange(updated);
      showToast('Store profile saved!');
    });
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-store">
      <div className="settings-card">
        <h2>Store profile</h2>
        <div className="sub">Displayed to customers on the storefront and checkout.</div>
        <div className="settings-fields">
          <div className="settings-f full">
            <label htmlFor="set_store_name">Store name</label>
            <input type="text" id="set_store_name" value={form.name}
              onChange={set('name')} placeholder="The Gifting Factory" />
          </div>
          <div className="settings-f">
            <label htmlFor="set_store_phone">WhatsApp number</label>
            <input type="text" id="set_store_phone" value={form.phone}
              onChange={set('phone')} placeholder="+233 20 000 0000" />
          </div>
          <div className="settings-f">
            <label htmlFor="set_store_email">Contact email</label>
            <input type="email" id="set_store_email" value={form.email}
              onChange={set('email')} placeholder="hello@yourstore.com" />
          </div>
          <div className="settings-f full">
            <label htmlFor="set_store_address">Collection address</label>
            <input type="text" id="set_store_address" value={form.address}
              onChange={set('address')} placeholder="ACP Estate Junction, Kwabenya, Accra" />
          </div>
          <div className="settings-f full">
            <label htmlFor="set_store_insta">Instagram showcase URL</label>
            <input type="url" id="set_store_insta" value={form.instagramUrl}
              onChange={set('instagramUrl')} placeholder="https://www.instagram.com/yourpage/" />
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
  const [form, setForm] = useState({
    samedayFee:        s.delivery.sameday.fee,
    samedayOn:         s.delivery.sameday.enabled,
    scheduledFee:      s.delivery.scheduled.fee,
    scheduledOn:       s.delivery.scheduled.enabled,
    surpriseFee:       s.delivery.surprise.fee,
    surpriseOn:        s.delivery.surprise.enabled,
    collectionFee:     s.delivery.collection.fee ?? 0,
    collectionOn:      s.delivery.collection.enabled,
  });
  const setNum = (k) => (e) => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }));
  const setBool = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }));

  function handleSave() {
    withSaving(() => {
      const updated = {
        ...s,
        delivery: {
          sameday:    { fee: form.samedayFee,    enabled: form.samedayOn    },
          scheduled:  { fee: form.scheduledFee,  enabled: form.scheduledOn  },
          surprise:   { fee: form.surpriseFee,   enabled: form.surpriseOn   },
          collection: { fee: form.collectionFee, enabled: form.collectionOn },
        }
      };
      saveAppSettings(updated);
      onChange(updated);
      showToast('Delivery & collection saved!');
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
        <div className="sub">Turn options on/off and set the fee. This is the single source used by the POS order form.</div>
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

  function handleSave() {
    withSaving(() => {
      const updated = { ...s, inventory: { lowStockThreshold: threshold, lowStockAlerts: alertsOn } };
      saveAppSettings(updated);
      onChange(updated);
      // tell nav badges to refresh if they listen to this key
      window.dispatchEvent(new Event('xa12:settingsChanged'));
      showToast('Inventory settings saved! Products page now uses the new threshold.');
    });
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-inventory">
      <div className="settings-card">
        <h2>Stock alerts</h2>
        <div className="sub">Controls when a product is flagged as low stock. The Products page reads this threshold directly.</div>
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

// ─── Panel: Notifications (data-t="alerts") ───────────────────────────────────
function AlertsPanel({ s, onChange }) {
  const [saving, withSaving] = useSavingState();
  const [form, setForm] = useState({ ...s.notifications });
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }));

  function handleSave() {
    withSaving(() => {
      const updated = { ...s, notifications: { ...form } };
      saveAppSettings(updated);
      onChange(updated);
      showToast('Notification preferences saved!');
    });
  }

  const Row = ({ label, sub, field }) => (
    <div className="set-row">
      <div><b>{label}</b><div className="sub">{sub}</div></div>
      <label className="sw">
        <input type="checkbox" checked={form[field]} onChange={setCheck(field)} />
        <i />
      </label>
    </div>
  );

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-alerts">
      <div className="settings-card">
        <h2>Notification preferences</h2>
        <div className="sub">Turning a type off stops new notifications from appearing for that event.</div>
        <Row label="New orders"          sub="Notifies you when a new order is placed via POS or the storefront."  field="newOrders"   />
        <Row label="New custom requests" sub="Notifies you when a bespoke order request is submitted."              field="newRequests" />
        <Row label="New job applications" sub="Notifies you when a candidate applies for a job posting."            field="newJobApps"  />
        <Row label="Low stock"           sub="Shows a persistent alert when inventory falls below the threshold."   field="lowStock"    />
      </div>
      <div className="bar" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className="btn p" type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

// ─── Panel: Security ──────────────────────────────────────────────────────────
function SecurityPanel({ s, onChange }) {
  const [pwCurrent, setPwCurrent]   = useState('');
  const [pwNew,     setPwNew]       = useState('');
  const [pwConfirm, setPwConfirm]   = useState('');
  const [pwDestruct, setPwDestruct] = useState(s.security.requirePasswordDestructive);
  const [errs, setErrs] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving]         = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  function clearErr(field) { setErrs(e => ({ ...e, [field]: '' })); }

  function handleUpdatePassword() {
    const e = { current: '', newPw: '', confirm: '' };
    let valid = true;
    if (!pwCurrent.trim())  { e.current = 'Current password is required.'; valid = false; }
    if (pwNew.length < 8)   { e.newPw   = 'Must be at least 8 characters.'; valid = false; }
    if (pwNew !== pwConfirm){ e.confirm  = 'Passwords do not match.'; valid = false; }
    setErrs(e);
    if (!valid) return;

    setSaving(true);
    setTimeout(() => {
      const updated = { ...s, security: { ...s.security, requirePasswordDestructive: pwDestruct } };
      saveAppSettings(updated);
      onChange(updated);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setSaving(false);
      showToast('Validated. Server verification not yet connected — will apply once backend is linked.');
    }, 200);
  }

  function handlePwDestructChange(e) {
    const val = e.target.checked;
    setPwDestruct(val);
    const updated = { ...s, security: { ...s.security, requirePasswordDestructive: val } };
    saveAppSettings(updated);
    onChange(updated);
  }

  function handleSignOut() {
    setShowSignOut(false);
    showToast('Signed out.');
    setTimeout(() => window.location.reload(), 500);
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-security">
      {/* Change password card */}
      <div className="settings-card">
        <h2>Change password</h2>
        <div className="sub">Use at least 8 characters.</div>
        <div className="settings-fields">
          <div className="settings-f full" id="set_pw_current_group">
            <label htmlFor="set_pw_current">Current password</label>
            <input type="password" id="set_pw_current" placeholder="••••••••"
              autoComplete="current-password" value={pwCurrent}
              onChange={e => { setPwCurrent(e.target.value); clearErr('current'); }}
              className={errs.current ? 'set-field-invalid' : ''} />
            {errs.current && (
              <span className="set-field-error" role="alert" aria-live="polite">{errs.current}</span>
            )}
          </div>
          <div className="settings-f" id="set_pw_new_group">
            <label htmlFor="set_pw_new">New password</label>
            <input type="password" id="set_pw_new" placeholder="••••••••"
              autoComplete="new-password" value={pwNew}
              onChange={e => { setPwNew(e.target.value); clearErr('newPw'); }}
              className={errs.newPw ? 'set-field-invalid' : ''} />
            {errs.newPw && (
              <span className="set-field-error" role="alert" aria-live="polite">{errs.newPw}</span>
            )}
          </div>
          <div className="settings-f" id="set_pw_confirm_group">
            <label htmlFor="set_pw_confirm">Confirm new password</label>
            <input type="password" id="set_pw_confirm" placeholder="••••••••"
              autoComplete="new-password" value={pwConfirm}
              onChange={e => { setPwConfirm(e.target.value); clearErr('confirm'); }}
              className={errs.confirm ? 'set-field-invalid' : ''} />
            {errs.confirm && (
              <span className="set-field-error" role="alert" aria-live="polite">{errs.confirm}</span>
            )}
          </div>
        </div>
        {/* Info banner — matches monolith exactly */}
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px',
          fontSize: '11px', color: 'var(--mute,#747471)', background: 'rgba(28,28,27,.04)',
          borderRadius: '10px', padding: '10px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span><strong>Server verification not yet connected.</strong> Fields are functional and
            client-side validation runs. Password changes will take effect once the backend API is linked.</span>
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
            <div className="sub">You will be returned to the entry screen.</div>
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
    </section>
  );
}

// ─── Panel: Data ──────────────────────────────────────────────────────────────
function DataPanel() {
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearInput,     setClearInput]     = useState('');
  const [clearError,     setClearError]     = useState('');

  // Matches monolith buildAndDownloadCSV() exactly
  function escCSV(v) {
    const s = String(v == null ? '' : v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function handleExportData() {
    const rows = [['Type','Reference / ID','Customer','Amount (GHS)','Status','Date']];
    try { const arr = JSON.parse(localStorage.getItem('xa12-orders-data-v1') || '[]');
      (Array.isArray(arr) ? arr : []).forEach(o => rows.push(['Order',escCSV(o.orderNumber||o.id),escCSV(o.customerName),o.amount||o.total||'',escCSV(o.fulfillmentStatus||o.status),escCSV(o.date||o.createdAt)])); } catch {}
    try { const arr = JSON.parse(localStorage.getItem('xa12-customers-data-v1') || '[]');
      (Array.isArray(arr) ? arr : []).forEach(c => rows.push(['Customer',escCSV(c.id),escCSV(c.name),c.totalSpend||'',escCSV(c.status),escCSV(c.joinDate||c.createdAt)])); } catch {}
    try { const arr = JSON.parse(localStorage.getItem('xa12_custom_requests') || '[]');
      (Array.isArray(arr) ? arr : []).forEach(r => rows.push(['Request',escCSV(r.reference||r.id),escCSV(r.customerName||r.name),r.budget||r.amount||'',escCSV(r.status),escCSV(r.date||r.createdAt)])); } catch {}
    try { const arr = JSON.parse(localStorage.getItem('xa12-activity-log-v1') || '[]');
      (Array.isArray(arr) ? arr : []).forEach(l => rows.push(['Log',escCSV(l.type),'','',escCSV(l.text),escCSV(l.time||l.timestamp)])); } catch {}
    const csv  = rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `xa12_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Data exported as CSV!');
  }

  function handleConfirmClear() {
    if ((clearInput || '').trim() !== 'CLEAR') {
      setClearError('Must be exactly CLEAR.'); return;
    }
    setShowClearModal(false);
    try { localStorage.setItem('xa12-orders-data-v1', '[]'); } catch {}
    try { localStorage.setItem('xa12_custom_requests', '[]'); } catch {}
    try { localStorage.setItem('xa12-customers-data-v1', '[]'); } catch {}
    try { localStorage.setItem('xa12-reviews-data-v1', '[]'); } catch {}
    try { localStorage.setItem('xa12-activity-log-v1', '[]'); } catch {}
    try {
      const ck = Object.keys(localStorage).find(k => k.toLowerCase().includes('career') || k.toLowerCase().includes('job-posting'));
      if (ck) { const d = JSON.parse(localStorage.getItem(ck) || '[]'); if (Array.isArray(d)) localStorage.setItem(ck, JSON.stringify(d.map(j => ({ ...j, applications: [] })))); }
    } catch {}
    showToast('Demo data cleared. Orders, customers, requests, reviews and logs removed.');
  }

  return (
    <section className="settings-panel on" role="tabpanel" id="set-panel-data">
      {/* Data & export */}
      <div className="settings-card">
        <h2>Data &amp; export</h2>
        <div className="sub">Logs are kept for 30 days and removed automatically.</div>
        <div className="set-row">
          <div><b>Log retention</b></div>
          <span style={{ background: 'var(--card-bg,#f2f1ef)', border: '1px solid var(--line,rgba(28,28,27,.12))',
            borderRadius: '999px', padding: '4px 12px', fontSize: '11px', fontWeight: 600,
            color: 'var(--mute,#747471)' }}>30 days</span>
        </div>
        <div className="set-row">
          <div>
            <b>Export data</b>
            <div className="sub">Downloads orders, customers, requests and activity log as a CSV file.</div>
          </div>
          <button className="btn" type="button" onClick={handleExportData}>Export CSV</button>
        </div>
      </div>

      {/* Danger: Demo data */}
      <div className="settings-card" style={{ borderColor: 'rgba(161,75,69,.2)' }}>
        <h2 style={{ color: '#a14b45' }}>Danger zone — Demo data</h2>
        <div className="sub">Removes all locally seeded prototype data. This cannot be undone.</div>
        <div className="set-row">
          <div>
            <b>Clear demo data</b>
            <div className="sub">Removes sample orders, customers, requests, job applications, reviews and activity logs.</div>
          </div>
          <button className="btn d" type="button" onClick={() => { setShowClearModal(true); setClearInput(''); setClearError(''); }}>
            Clear demo data
          </button>
        </div>
      </div>

      {/* Danger: Live data (disabled) */}
      <div className="settings-card" style={{ borderColor: 'rgba(161,75,69,.1)', opacity: 0.75 }}>
        <h2 style={{ color: '#a14b45' }}>Danger zone — Live data (Supabase)</h2>
        <div className="sub">Deletes production records from the live database. <strong>Not yet active</strong> — requires a protected server-side function that does not exist yet.</div>
        <div className="set-row">
          <div>
            <b>Clear live data</b>
            <div className="sub">Disabled until the Supabase backend is connected.</div>
          </div>
          <button className="btn d" type="button" disabled aria-disabled="true"
            style={{ opacity: 0.4, cursor: 'not-allowed' }}>Clear live data</button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--mute,#747471)', fontStyle: 'italic' }}>
          Placeholder only — will be enabled once the protected admin_clear_live_data Supabase RPC is in place.
        </div>
      </div>

      {/* Clear demo data modal */}
      {showClearModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px',
            maxWidth: '440px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Clear Demo Data</h3>
            <p style={{ fontSize: '13px', color: 'var(--mute,#747471)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Permanently deletes all locally seeded prototype data. <strong>Cannot be undone.</strong>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: 'var(--mute,#747471)', display: 'block', marginBottom: '6px' }}>
                Type CLEAR to confirm
              </label>
              <input type="text" id="clearConfirmInput" placeholder="CLEAR" autoComplete="off"
                value={clearInput} onChange={e => setClearInput(e.target.value)}
                style={{ width: '100%', border: '0', borderBottom: '1.5px solid var(--line,rgba(28,28,27,.15))',
                  background: 'transparent', font: '500 15px Outfit, system-ui', padding: '8px 0', outline: 0 }} />
              {clearError && (
                <span style={{ fontSize: '11px', color: '#a14b45', marginTop: '4px', display: 'block' }}>{clearError}</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" onClick={() => setShowClearModal(false)}>Cancel</button>
              <button type="button" className="btn d" onClick={handleConfirmClear}>Clear demo data</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Main SettingsPage component ──────────────────────────────────────────────
// Tabs match admin-monolith.html exactly: store | delivery | inventory | alerts | security | data
const TABS = [
  { key: 'store',     label: 'Store'         },
  { key: 'delivery',  label: 'Delivery'      },
  { key: 'inventory', label: 'Inventory'     },
  { key: 'alerts',    label: 'Notifications' },
  { key: 'security',  label: 'Security'      },
  { key: 'data',      label: 'Data'          },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [s, setS] = useState(() => getAppSettings());

  // called by sub-panels after saving so s stays in sync for this render
  const handleChange = useCallback((updated) => setS(updated), []);

  return (
    <div className="page-container settings-page">
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Settings</h2>
          <p>Configure your store, delivery, alerts and security preferences.</p>
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
      {activeTab === 'security'  && <SecurityPanel  s={s} onChange={handleChange} />}
      {activeTab === 'data'      && <DataPanel />}
    </div>
  );
}
