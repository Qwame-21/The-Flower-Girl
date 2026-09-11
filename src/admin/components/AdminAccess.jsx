import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { supabase } from '../../config/supabase';
import '../login.css';
import { logoutToLogin } from '../utils/logout';
import { getStaffIdentity } from '../utils/staffAccess';
import floralSrc from '../assets/floral_corner.png';

/* ─── Shared corner layout ─────────────────────────────────────────── */
function FloralCorners() {
  return (
    <>
      <img src={floralSrc} alt="" className="lf-corner lf-corner--tl" />
      <img src={floralSrc} alt="" className="lf-corner lf-corner--tr" />
      <img src={floralSrc} alt="" className="lf-corner lf-corner--bl" />
      <img src={floralSrc} alt="" className="lf-corner lf-corner--br" />
    </>
  );
}

/* ─── Staff login form ─────────────────────────────────────────────── */
export function StaffLogin({ message = '', onSubmitted }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [capsLock, setCapsLock] = useState(false);

  const submit = async event => {
    event.preventDefault();
    if (!supabase || busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: String(values.get('email')).trim(),
        password: String(values.get('password')),
      });
      if (signInError) throw signInError;
      form.reset();
      onSubmitted?.();
    } catch {
      setError('Sign-in failed. Check your email and password, or try again when your connection is available.');
    } finally {
      setBusy(false);
    }
  };

  const trackCaps = event => setCapsLock(event.getModifierState('CapsLock'));

  return (
    <main className="admin-login">
      <FloralCorners />
      <div className="login-center">
        <span className="login-eyebrow">The Gifting Factory</span>
        <h1>Welcome back.</h1>
        <p className="login-subtext">Sign in to your staff workspace.</p>

        {!supabase && (
          <p className="login-notice" role="status">
            Staff sign-in is not connected in this preview. The backend configuration is needed before accounts can sign in.
          </p>
        )}
        {message && <p className="login-notice" role="status">{message}</p>}

        <form className="login-form" onSubmit={submit}>
          <div className="login-field">
            <label htmlFor="lf-email" className="login-field-label">Email address</label>
            <input
              id="lf-email"
              autoFocus
              type="email"
              name="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
              disabled={busy}
            />
          </div>

          <div className="login-field">
            <label htmlFor="lf-password" className="login-field-label">Password</label>
            <div className="login-password-wrap">
              <input
                id="lf-password"
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={busy}
                onKeyUp={trackCaps}
                onKeyDown={trackCaps}
              />
              <button
                type="button"
                className="login-eye-btn"
                disabled={busy}
                onClick={() => setVisible(v => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {capsLock && <small className="login-caps" role="status">Caps Lock is on.</small>}
          {error && <p className="login-notice" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={!supabase || busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-help">
          Need access or a password reset? Contact your store administrator.
        </p>
      </div>
    </main>
  );
}

/* ─── Access gate ──────────────────────────────────────────────────── */
export default function AdminAccess({ children }) {
  const [access, setAccess] = useState({
    status: supabase ? 'loading' : 'signed-out',
    identity: null,
    error: '',
  });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (window.location.pathname !== '/admin') window.history.replaceState({}, '', '/admin');
    if (!supabase) return;

    let active = true;
    let request = 0;

    const check = async session => {
      const ticket = ++request;
      if (!session) { if (active) setAccess({ status: 'signed-out', identity: null, error: '' }); return; }
      if (active) setAccess({ status: 'loading', identity: null, error: '' });
      try {
        const identity = await getStaffIdentity(supabase, session);
        if (!active || ticket !== request) return;
        setAccess({ status: 'ready', identity, error: '' });
      } catch (err) {
        if (active && ticket === request) {
          setAccess({
            status: err.code === 'STAFF_ACCESS_REQUIRED' ? 'denied' : 'error',
            identity: null,
            error: err.code === 'STAFF_ACCESS_REQUIRED'
              ? err.message
              : 'Could not verify staff access. Check your connection and try again.',
          });
        }
      }
    };

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAccess({ status: 'error', identity: null, error: 'Could not restore your session.' });
        else check(data.session);
      })
      .catch(() => { if (active) setAccess({ status: 'error', identity: null, error: 'Could not restore your session.' }); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') window.setTimeout(() => { if (active) check(session); }, 0);
    });

    return () => { active = false; request++; subscription.unsubscribe(); };
  }, [revision]);

  if (access.status === 'ready') return children(access.identity);
  if (access.status === 'signed-out') return <StaffLogin />;

  /* Loading state */
  if (access.status === 'loading') {
    return (
      <main className="admin-login" aria-busy="true" role="status" aria-label="Verifying staff session">
        <FloralCorners />
        <div className="login-center">
          <span className="login-eyebrow">The Gifting Factory</span>
          <h1>Staff access</h1>
          <p className="login-subtext">Verifying your session…</p>
        </div>
      </main>
    );
  }

  /* Error / denied state */
  return (
    <main className="admin-login">
      <FloralCorners />
      <div className="login-center">
        <span className="login-eyebrow">The Gifting Factory</span>
        <h1>Staff access</h1>
        <p className="login-subtext">{access.error}</p>
        <div className="login-recovery">
          <button className="login-submit" onClick={() => setRevision(v => v + 1)}>Try again</button>
          <button
            onClick={async () => {
              try { await logoutToLogin(); }
              catch { setAccess(cur => ({ ...cur, error: 'Could not sign out. Please retry.' })); }
            }}
          >
            <LogOut size={16} /> Use another account
          </button>
        </div>
      </div>
    </main>
  );
}
