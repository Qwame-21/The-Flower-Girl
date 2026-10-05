import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function PasswordConfirmModal({ isOpen, onClose, onConfirm, title = 'Confirm Action' }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 60;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (isLocked) {
      setError('Too many failed attempts. Please wait.');
      return;
    }

    // Create temporary Supabase client
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    try {
      // Get current user's email from main session
      const { data: { user } } = await tempClient.auth.getUser();
      if (!user?.email) {
        setError('Could not verify your identity');
        return;
      }

      // Verify password by signing in with temp client
      const { error: signInError } = await tempClient.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        setAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_ATTEMPTS) {
            setIsLocked(true);
            setError('Too many failed attempts. Locked for 60 seconds.');
            startLockout();
          } else {
            setError(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
          }
          return newAttempts;
        });
        setPassword('');
        return;
      }

      // Password verified - execute action
      await onConfirm();
      // Sign out from temp client
      await tempClient.auth.signOut();
      handleClose();
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
  };

  const startLockout = () => {
    let seconds = LOCKOUT_SECONDS;
    setLockoutTimer(seconds);
    const timer = setInterval(() => {
      seconds--;
      setLockoutTimer(seconds);
      if (seconds <= 0) {
        clearInterval(timer);
        setIsLocked(false);
        setAttempts(0);
        setLockoutTimer(0);
      }
    }, 1000);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#747471', margin: '0 0 16px 0' }}>
          Enter your password to confirm this destructive action.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLocked}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>
          {error && (
            <div style={{ color: '#e11d48', fontSize: '12px', marginBottom: '12px' }}>
              {error}
            </div>
          )}
          {isLocked && (
            <div style={{ color: '#747471', fontSize: '12px', marginBottom: '12px' }}>
              Locked for {lockoutTimer} seconds
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLocked}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: '#fff',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLocked || !password.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: isLocked || !password.trim() ? '#ccc' : '#e11d48',
                color: '#fff',
                cursor: isLocked || !password.trim() ? 'not-allowed' : 'pointer',
                fontSize: '13px'
              }}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
