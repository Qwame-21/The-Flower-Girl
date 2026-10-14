import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../config/supabase';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

let attempts = 0;
let isLocked = false;
let lockoutTimer = null;

export async function confirmDestructive(password) {
  if (isLocked) {
    throw new Error('Too many failed attempts. Please wait.');
  }

  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }

  // 1. Get current user's email from active main session
  let email = null;
  if (supabase) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) {
        email = userData.user.email;
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        email = sessionData?.session?.user?.email;
      }
    } catch (e) {
      console.warn('Error reading active user session:', e);
    }
  }

  // Fallback to localStorage if session key is stored directly
  if (!email && typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase.auth.token') || key.includes('-auth-token'))) {
          const stored = JSON.parse(localStorage.getItem(key) || '{}');
          if (stored?.user?.email) {
            email = stored.user.email;
            break;
          }
        }
      }
    } catch {}
  }

  if (!email) {
    throw new Error('Could not verify your identity. Please ensure you are logged in.');
  }

  // 2. Create isolated temporary client to verify password without disturbing main session
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
    // Verify password by signing in with temp client
    const { error: signInError } = await tempClient.auth.signInWithPassword({
      email,
      password: password.trim(),
    });

    if (signInError) {
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        isLocked = true;
        startLockout();
        throw new Error('Too many failed attempts. Locked for 60 seconds.');
      }
      throw new Error(`Incorrect password. ${MAX_ATTEMPTS - attempts} attempts remaining.`);
    }

    // Password verified - reset attempts
    attempts = 0;
    await tempClient.auth.signOut();
    return true;
  } catch (err) {
    // Re-throw our custom errors
    if (err.message.includes('Password') || err.message.includes('password') || err.message.includes('attempts') || err.message.includes('locked') || err.message.includes('identity')) {
      throw err;
    }
    throw new Error('Verification failed. Please try again.');
  }
}

function startLockout() {
  let seconds = LOCKOUT_SECONDS;
  if (lockoutTimer) clearInterval(lockoutTimer);
  lockoutTimer = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(lockoutTimer);
      isLocked = false;
      attempts = 0;
      lockoutTimer = null;
    }
  }, 1000);
}

export function resetLockout() {
  if (lockoutTimer) clearInterval(lockoutTimer);
  isLocked = false;
  attempts = 0;
  lockoutTimer = null;
}
