import { useState, useEffect } from 'react';
import { logoutToLogin } from '../../admin/utils/logout';

export const IDLE_LIMIT_MS = 30 * 60 * 1000;
export const WARN_MS = 60 * 1000;
export const STORAGE_KEY = 'dashboard-last-activity';

export function getStoredLastActivity() {
  if (typeof window === 'undefined') return Date.now();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const ts = parseInt(stored, 10);
    if (!isNaN(ts)) return ts;
  }
  const now = Date.now();
  localStorage.setItem(STORAGE_KEY, String(now));
  return now;
}

export function updateStoredLastActivity() {
  if (typeof window === 'undefined') return Date.now();
  const now = Date.now();
  localStorage.setItem(STORAGE_KEY, String(now));
  return now;
}

export function useIdleTimer() {
  const [warningShown, setWarningShown] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    let lastThrottledUpdate = 0;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledUpdate > 10000) {
        lastThrottledUpdate = now;
        updateStoredLastActivity();
        setWarningShown(false);
      }
    };

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const checkIdleStatus = () => {
      const now = Date.now();
      const lastActivity = getStoredLastActivity();
      const elapsed = now - lastActivity;
      const remaining = IDLE_LIMIT_MS - elapsed;

      if (remaining <= 0) {
        logoutToLogin('Signed out after 30 minutes of inactivity');
      } else if (remaining <= WARN_MS) {
        setWarningShown(true);
        setSecondsLeft(Math.max(0, Math.ceil(remaining / 1000)));
      } else {
        setWarningShown(false);
      }
    };

    checkIdleStatus();
    const interval = setInterval(checkIdleStatus, 1000); // 1s interval so seconds count down accurately

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkIdleStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const resetActivity = () => {
    updateStoredLastActivity();
    setWarningShown(false);
  };

  return { warningShown, secondsLeft, resetActivity };
}
