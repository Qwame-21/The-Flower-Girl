import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getAppSettings } from '../data/settingsAdapter';
import { logoutToLogin } from '../../admin/utils/logout';

const DashboardContext = createContext(null);

// Track processed notification IDs to prevent duplicates
const processedNotificationIds = new Set();

export function DashboardProvider({ children, onSignOut }) {
  const audioContextRef = useRef(null);
  const notificationPermissionRef = useRef('default');
  const [isSignOutConfirmationOpen, setIsSignOutConfirmationOpen] = useState(false);
  const requestSignOut = () => setIsSignOutConfirmationOpen(true);
  const confirmSignOut = () => {
    setIsSignOutConfirmationOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      logoutToLogin();
    }
  };

  useEffect(() => {
    if (!isSignOutConfirmationOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSignOutConfirmationOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSignOutConfirmationOpen]);

  // Unlock audio context on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioContextRef.current && typeof AudioContext !== 'undefined') {
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {
          // Swallow autoplay errors silently
        });
      }
    };

    const handleInteraction = () => {
      unlockAudio();
      // Request notification permission on first click
      if (notificationPermissionRef.current === 'default' && typeof Notification !== 'undefined') {
        Notification.requestPermission().then(permission => {
          notificationPermissionRef.current = permission;
        }).catch(() => {
          notificationPermissionRef.current = 'denied';
        });
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    // Use existing mute control from Header.jsx
    const isMuted = localStorage.getItem('notifications-muted') === 'true';
    if (isMuted) return;

    try {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
      }
    } catch (err) {
      // Swallow audio errors silently
    }
  };

  // Show OS notification when tab is hidden
  const showBrowserNotification = (title, body, tag) => {
    if (typeof Notification === 'undefined' || notificationPermissionRef.current !== 'granted') {
      return;
    }

    if (!document.hidden) {
      return;
    }

    // De-duplicate by tag
    if (tag && processedNotificationIds.has(tag)) {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        tag,
        icon: '/favicon.ico',
      });

      processedNotificationIds.add(tag);

      // Clean up old IDs to prevent memory leaks
      if (processedNotificationIds.size > 100) {
        const firstId = processedNotificationIds.values().next().value;
        processedNotificationIds.delete(firstId);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      // Swallow notification errors silently
    }
  };

  // Handle new order notification
  const notifyNewOrder = (order) => {
    const settings = getAppSettings();
    if (!settings?.notifications?.orders) {
      return;
    }

    const tracking = order.tracking_number || order.order_code || 'Unknown';
    const total = order.total ? `GHS ${order.total}` : '';
    const title = 'New order';
    const body = `${tracking} · ${total}`;
    const tag = `order-${order.id}`;

    playNotificationSound();
    showBrowserNotification(title, body, tag);
  };

  return (
    <DashboardContext.Provider value={{ onSignOut, notifyNewOrder, requestSignOut }}>
      {children}
      {isSignOutConfirmationOpen && (
        <div
          className="signout-confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsSignOutConfirmationOpen(false);
          }}
        >
          <div className="signout-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="signout-confirm-title">
            <h3 id="signout-confirm-title">Sign Out of the Admin?</h3>
            <p>You will need to enter your staff credentials to sign back in.</p>
            <div className="signout-confirm-actions">
              <button type="button" className="btn" onClick={() => setIsSignOutConfirmationOpen(false)}>
                CANCEL
              </button>
              <button type="button" className="btn d" onClick={confirmSignOut}>
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return {
    onSignOut: context.onSignOut,
    notifyNewOrder: context.notifyNewOrder,
    requestSignOut: context.requestSignOut
  };
}
