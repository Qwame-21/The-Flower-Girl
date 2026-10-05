import { createClient } from '@supabase/supabase-js';

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
      throw new Error('Could not verify your identity');
    }

    // Verify password by signing in with temp client
    const { error: signInError } = await tempClient.auth.signInWithPassword({
      email: user.email,
      password: password,
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
    if (err.message.includes('Password') || err.message.includes('attempts') || err.message.includes('locked')) {
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
