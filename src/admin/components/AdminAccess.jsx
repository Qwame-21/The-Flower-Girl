import { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../config/supabase';
import '../login.css';
import { logoutToLogin } from '../utils/logout';
import { getStaffIdentity } from '../utils/staffAccess';
import { recordSignIn } from '../../dashboard/lib/signinLog';
import floralSrc from '../assets/floral_corner.png';

/* ─── Preload decorative floral asset immediately ───────────────────── */
if (typeof window !== 'undefined') {
  const preloadImg = new Image();
  preloadImg.src = floralSrc;
}

/* ─── Shared corner floral layout ──────────────────────────────────── */
function FloralCorners() {
  return (
    <>
      <img src={floralSrc} alt="" width="540" height="540" loading="eager" decoding="sync" className="lf-corner lf-corner--tl" aria-hidden="true" />
      <img src={floralSrc} alt="" width="540" height="540" loading="eager" decoding="sync" className="lf-corner lf-corner--tr" aria-hidden="true" />
      <img src={floralSrc} alt="" width="540" height="540" loading="eager" decoding="sync" className="lf-corner lf-corner--bl" aria-hidden="true" />
      <img src={floralSrc} alt="" width="540" height="540" loading="eager" decoding="sync" className="lf-corner lf-corner--br" aria-hidden="true" />
    </>
  );
}

/* ─── Staff login form ─────────────────────────────────────────────── */
export function StaffLogin({ message = '', onSubmitted }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [capsLock, setCapsLock] = useState(false);
  const [displayNotice, setDisplayNotice] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('admin_logout_notice') || message;
    }
    return message;
  });

  useEffect(() => {
    const stored = localStorage.getItem('admin_logout_notice');
    if (stored) {
      setDisplayNotice(stored);
      localStorage.removeItem('admin_logout_notice'); // clear it after displaying once
    } else if (message) {
      setDisplayNotice(message);
    }
  }, [message]);


  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }

    return valid;
  };

  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_login_lockout');
      if (stored) {
        const lockoutTime = parseInt(stored, 10);
        const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
        if (remaining > 0) setLockoutTimer(remaining);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer(prev => {
        if (prev <= 1) {
          localStorage.removeItem('admin_login_lockout');
          localStorage.removeItem('admin_login_attempts');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    if (lockoutTimer > 0) {
      setError(`Too many failed sign-in attempts. Please wait ${lockoutTimer} second${lockoutTimer !== 1 ? 's' : ''} before trying again.`);
      return;
    }
    if (!validate()) return;
    if (!supabase) {
      setError('Staff sign-in backend is unavailable in this environment.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (signInError) {
        let attempts = 0;
        try {
          attempts = (parseInt(localStorage.getItem('admin_login_attempts') || '0', 10)) + 1;
          localStorage.setItem('admin_login_attempts', String(attempts));
          if (attempts >= 5) {
            const until = Date.now() + 60000;
            localStorage.setItem('admin_login_lockout', String(until));
            setLockoutTimer(60);
          }
        } catch {}

        if (signInError.message?.toLowerCase().includes('invalid login credentials') || signInError.status === 400) {
          if (attempts >= 5) {
            throw new Error('Too many failed sign-in attempts. Temporarily locked out for 60 seconds.');
          }
          throw new Error('Invalid email or password. Check your credentials or contact your administrator.');
        } else {
          throw new Error(signInError.message || 'Could not connect to sign-in service. Check your connection.');
        }
      }
      try {
        localStorage.removeItem('admin_login_attempts');
        localStorage.removeItem('admin_login_lockout');
      } catch {}
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          await recordSignIn(authData.user.id);
        }
      } catch (logErr) {
        console.error('[signin_log] Error recording sign-in:', logErr);
      }
      onSubmitted?.();
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please check your details and try again.');
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
        <h1>Welcome back Flower girl.</h1>
        <p className="login-subtext">Sign in to your staff workspace.</p>

        {!supabase && (
          <p className="login-notice" role="status">
            Staff sign-in is not connected in this preview. The backend configuration is needed before accounts can sign in.
          </p>
        )}
        {displayNotice && <p className="login-notice" role="status">{displayNotice}</p>}

        <form className="login-form" onSubmit={submit} noValidate>
          <div className={`login-field ${emailError ? 'login-field--has-error' : ''}`}>
            <label htmlFor="lf-email" className="login-field-label">Email address</label>
            <input
              id="lf-email"
              autoFocus
              type="email"
              name="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              autoComplete="username"
              required
              placeholder="you@example.com"
              disabled={busy}
            />
            {emailError && <span className="login-field-err-msg"><AlertCircle size={13} />{emailError}</span>}
          </div>

          <div className={`login-field ${passwordError ? 'login-field--has-error' : ''}`}>
            <label htmlFor="lf-password" className="login-field-label">Password</label>
            <div className="login-password-wrap">
              <input
                id="lf-password"
                name="password"
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
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
                onClick={e => {
                  e.preventDefault();
                  setVisible(v => !v);
                  document.getElementById('lf-password')?.focus();
                }}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <span className="login-field-err-msg"><AlertCircle size={13} />{passwordError}</span>}
          </div>

          {capsLock && <small className="login-caps" role="status">Caps Lock is on.</small>}
          {error && (
            <p className="login-notice" role="alert">
              <AlertCircle size={16} /> {error}
            </p>
          )}

          <button className="login-submit" type="submit" disabled={!supabase || busy}>
            {busy ? (
              <span className="login-submit-inner">
                <Loader2 size={16} className="login-spinner-icon" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="login-help">
          Need access or a password reset? Contact your store administrator.
        </p>
      </div>
    </main>
  );
}

/* ─── Synchronously check for local session token ──────────────────── */
const hasSavedSessionToken = () => {
  if (typeof window === 'undefined' || !supabase) return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
        const val = localStorage.getItem(key);
        if (val && (val.includes('access_token') || val.includes('currentSession'))) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
};

/* ─── Shared Two-Stage Loading Fallback UI ───────────────────────────── */
export function AdminLoadingFallback({ stage = 1, message }) {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        zIndex: 9999,
        gap: '16px',
      }}
      aria-busy="true"
      role="status"
      aria-label="Loading"
    >
      {/* Circular spinner */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        style={{ animation: 'adminSpinnerRotate 0.8s linear infinite' }}
      >
        <circle
          cx="18" cy="18" r="15"
          stroke="#e5e5e3"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="18" cy="18" r="15"
          stroke="#1a1a1a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="30 65"
        />
      </svg>
      <p style={{
        fontSize: '14px',
        fontWeight: 500,
        color: '#555555',
        letterSpacing: '0.01em',
        margin: 0,
        textAlign: 'center'
      }}>
        {message || 'Loading, please wait a moment...'}
      </p>
      <style>{`
        @keyframes adminSpinnerRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

/* ─── Access gate ──────────────────────────────────────────────────── */
export default function AdminAccess({ children }) {
  const [access, setAccess] = useState(() => ({
    status: supabase ? (hasSavedSessionToken() ? 'loading' : 'signed-out') : 'signed-out',
    identity: null,
    error: '',
  }));
  const [loadingStage, setLoadingStage] = useState(1);
  const [revision, setRevision] = useState(0);
  const currentUserIdRef = useRef(null);
  const isReadyRef = useRef(false);
  isReadyRef.current = access.status === 'ready';

  // Stage 1 -> Stage 2 smooth visual transition
  useEffect(() => {
    if (access.status !== 'loading') {
      setLoadingStage(1);
      return undefined;
    }
    const timer = setTimeout(() => setLoadingStage(2), 200);
    return () => clearTimeout(timer);
  }, [access.status]);

  useEffect(() => {
    if (window.location.pathname !== '/admin') window.history.replaceState({}, '', '/admin');
    if (!supabase) return;

    let active = true;
    let request = 0;
    const startTime = Date.now();

    const check = async (session, isInitial = false) => {
      const ticket = ++request;
      if (!session) {
        currentUserIdRef.current = null;
        if (active) setAccess({ status: 'signed-out', identity: null, error: '' });
        return;
      }

      // If already ready for same user id, do nothing (never leave ready on focus event)
      if (!isInitial && isReadyRef.current && currentUserIdRef.current === session.user?.id) {
        return;
      }

      if (active && !isReadyRef.current) setAccess({ status: 'loading', identity: null, error: '' });

      try {
        const identity = await getStaffIdentity(supabase, session);
        if (!active || ticket !== request) return;
        currentUserIdRef.current = session.user?.id || null;
        const elapsed = Date.now() - startTime;
        const remainingDelay = isInitial ? Math.max(0, 420 - elapsed) : 0;
        setTimeout(() => {
          if (active && ticket === request) {
            setAccess({ status: 'ready', identity, error: '' });
          }
        }, remainingDelay);
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
        else check(data.session, true);
      })
      .catch(() => { if (active) setAccess({ status: 'error', identity: null, error: 'Could not restore your session.' }); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        currentUserIdRef.current = null;
        if (active) setAccess({ status: 'signed-out', identity: null, error: '' });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (currentUserIdRef.current && session?.user?.id === currentUserIdRef.current && isReadyRef.current) {
          // Same user, already ready: DO NOTHING (never leave ready on focus event)
          return;
        }
        window.setTimeout(() => { if (active) check(session, false); }, 0);
      }
    });

    return () => { active = false; request++; subscription.unsubscribe(); };
  }, [revision]);

  if (access.status === 'ready') return children(access.identity);
  if (access.status === 'signed-out') {
    return (
      <StaffLogin
        onSubmitted={() => {
          setAccess({ status: 'loading', identity: null, error: '' });
          setRevision(v => v + 1);
        }}
      />
    );
  }

  /* Loading state */
  if (access.status === 'loading') {
    return <AdminLoadingFallback stage={loadingStage} />;
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
