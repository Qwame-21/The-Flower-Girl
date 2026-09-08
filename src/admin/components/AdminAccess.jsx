import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '../../config/supabase';
import '../login.css';
import { logoutToLogin } from '../utils/logout';
import { getStaffIdentity } from '../utils/staffAccess';

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
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: String(values.get('email')).trim(), password: String(values.get('password')) });
      if (error) throw error;
      form.reset();
      onSubmitted?.();
    } catch { setError('Sign-in failed. Check your email and password, or try again when your connection is available.'); }
    finally { setBusy(false); }
  };
  return <main className="admin-login"><a className="login-home" href="/"><ArrowLeft size={16} />Back to storefront</a><section className="login-card" aria-labelledby="staff-login-title"><span className="login-mark"><LockKeyhole size={24} /></span><p className="login-eyebrow">THE GIFTING FACTORY</p><h1 id="staff-login-title">Welcome back.</h1><p className="login-description">Sign in to your staff workspace.</p>
    {!supabase && <p className="login-notice" role="status">Staff sign-in is not connected in this preview. The backend configuration is needed before accounts can sign in.</p>}
    {message && <p className="login-notice" role="status">{message}</p>}
    <form onSubmit={submit}><label>Email address<input autoFocus type="email" name="email" autoComplete="username" required placeholder="you@example.com" disabled={busy} /></label><label>Password<div className="login-password"><input name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} onKeyUp={event=>setCapsLock(event.getModifierState('CapsLock'))} onKeyDown={event=>setCapsLock(event.getModifierState('CapsLock'))} /><button type="button" disabled={busy} onClick={()=>setVisible(value=>!value)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>{capsLock && <small className="login-caps" role="status">Caps Lock is on.</small>}{error && <p className="login-notice" role="alert">{error}</p>}<button className="login-submit" type="submit" disabled={!supabase || busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form>
    <p className="login-help">Need access or a password reset? Contact your store administrator.</p>
  </section><p className="login-footer">A thoughtful workspace for thoughtful gifting.</p></main>;
}

export default function AdminAccess({ children }) {
  const [access, setAccess] = useState({ status: supabase ? 'loading' : 'signed-out', identity: null, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (window.location.pathname !== '/admin') window.history.replaceState({}, '', '/admin');
    if (!supabase) return;
    let active = true;
    let request = 0;
    const check = async session => {
      const ticket = ++request;
      if (!session) { if(active)setAccess({status:'signed-out',identity:null,error:''}); return; }
      if(active)setAccess({status:'loading',identity:null,error:''});
      try {
        const identity=await getStaffIdentity(supabase,session);
        if(!active || ticket!==request)return;
        setAccess({status:'ready',identity,error:''});
      } catch (error) { if(active && ticket===request)setAccess({status:error.code === 'STAFF_ACCESS_REQUIRED' ? 'denied' : 'error',identity:null,error:error.code === 'STAFF_ACCESS_REQUIRED' ? error.message : 'Could not verify staff access. Check your connection and try again.'}); }
    };
    supabase.auth.getSession().then(({data,error})=>{if(!active)return;if(error)setAccess({status:'error',identity:null,error:'Could not restore your session.'});else check(data.session);}).catch(()=>{if(active)setAccess({status:'error',identity:null,error:'Could not restore your session.'});});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(event!=='INITIAL_SESSION')window.setTimeout(()=>{if(active)check(session);},0);});
    return ()=>{active=false;request++;subscription.unsubscribe();};
  },[revision]);
  if(access.status==='ready')return children(access.identity);
  if(access.status==='signed-out')return <StaffLogin/>;
  return <main className="admin-login"><section className="login-card"><span className="login-mark"><LockKeyhole size={24}/></span><h1>{access.status==='loading'?'Opening your workspace…':'Staff access'}</h1><p className="login-description" role="status">{access.status==='loading'?'Checking your session and permissions.':access.error}</p>{access.status!=='loading'&&<div className="login-recovery"><button className="login-submit" onClick={()=>setRevision(value=>value+1)}>Try again</button><button onClick={async()=>{try { await logoutToLogin(); } catch { setAccess(current=>({...current,error:'Could not sign out. Please retry.'})); }}}><LogOut size={16}/>Use another account</button></div>}</section></main>;
}
