import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import { listNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications, subscribeToNotifications, startNotificationPolling } from '../../data/notifications';
import { supabase } from '../../../config/supabase';

// Single notification sound function that respects mute state
let audioInstance = null;
export function playNotificationSound() {
  const isMuted = localStorage.getItem('notifications-muted') === 'true';
  if (isMuted) return;

  if (!audioInstance) {
    audioInstance = new Audio('/notification.mp3');
    audioInstance.volume = 0.5;
  }
  audioInstance.currentTime = 0;
  audioInstance.play().catch(() => {
    // Audio play failed (browser policy or missing file) - silent fail
  });
}

// Synthesized audio feedback for mute toggle (matches HOPESON original)
function playMuteSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

function playUnmuteSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

const ROUTE_TITLE_MAP = {
  '/overview': 'OVERVIEW',
  '/orders': 'ORDERS',
  '/log': 'LOG',
  '/products': 'PRODUCTS',
  '/shop-pos': 'SHOP/POS',
  '/insights': 'INSIGHTS',
  '/customers': 'CUSTOMERS',
  '/reviews': 'REVIEWS',
  '/requests': 'REQUESTS',
  '/careers': 'CAREERS',
  '/gallery': 'GALLERY',
  '/settings': 'SETTINGS',
};

// Architectural standard for dropdown positioning matching admin-monolith.html line 19136
function positionDropdown(trigger, dropdown, options = {}) {
  if (!trigger || !dropdown) return;

  const triggerRect = trigger.getBoundingClientRect();
  const dropdownRect = dropdown.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const { offset = 8, align = 'right', verticalAlign = 'bottom' } = options;

  let top, left, right;

  if (verticalAlign === 'bottom') {
    top = triggerRect.bottom + offset;
  } else {
    top = triggerRect.top - dropdownRect.height - offset;
  }

  if (align === 'right') {
    right = Math.max(offset, viewportWidth - triggerRect.right);
    left = 'auto';
  } else if (align === 'left') {
    left = triggerRect.left;
    right = 'auto';
  } else {
    left = triggerRect.left + triggerRect.width / 2 - dropdownRect.width / 2;
    right = 'auto';
  }

  if (left !== 'auto' && left + dropdownRect.width > viewportWidth - offset) {
    left = viewportWidth - dropdownRect.width - offset;
  }

  if (top + dropdownRect.height > viewportHeight - offset) {
    top = viewportHeight - dropdownRect.height - offset;
  }

  dropdown.style.position = 'fixed';
  dropdown.style.top = `${top}px`;
  dropdown.style.left = left === 'auto' ? 'auto' : `${left}px`;
  dropdown.style.right = right === 'auto' ? 'auto' : `${right}px`;
}

export default function Header({ onToggleMobile }) {
  const location = useLocation();
  const activeTitle = ROUTE_TITLE_MAP[location.pathname] || 'OVERVIEW';
  const { onSignOut } = useDashboard();

  // Live top bar clock state
  const [clockText, setClockText] = useState('');

  // Notification state
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('notifications-muted') === 'true');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingPolling, setUsingPolling] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setClockText(`${dayName}, ${dateNum} ${monthName} ${year} • ${hrs}:${mins}:${secs}`);
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dropdown states
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // Modal states — ported from admin-monolith.html lines 19588-19636
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Refs for trigger & dropdown positioning
  const notifBtnRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const adminProfileBtnRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Position notification dropdown when active
  useLayoutEffect(() => {
    if (isNotifOpen && notifBtnRef.current && notifDropdownRef.current) {
      positionDropdown(notifBtnRef.current, notifDropdownRef.current, { align: 'right', verticalAlign: 'bottom' });
    }
  }, [isNotifOpen]);

  // Position profile dropdown when active
  useLayoutEffect(() => {
    if (isProfileOpen && adminProfileBtnRef.current && profileDropdownRef.current) {
      positionDropdown(adminProfileBtnRef.current, profileDropdownRef.current, { align: 'right', verticalAlign: 'bottom' });
    }
  }, [isProfileOpen]);

  // Close dropdowns on outside click or scroll/resize
  useEffect(() => {
    function handleOutsideClick(e) {
      if (notifBtnRef.current && !notifBtnRef.current.contains(e.target) && notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (adminProfileBtnRef.current && !adminProfileBtnRef.current.contains(e.target) && profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleReposition() {
      if (isNotifOpen && notifBtnRef.current && notifDropdownRef.current) {
        positionDropdown(notifBtnRef.current, notifDropdownRef.current, { align: 'right', verticalAlign: 'bottom' });
      }
      if (isProfileOpen && adminProfileBtnRef.current && profileDropdownRef.current) {
        positionDropdown(adminProfileBtnRef.current, profileDropdownRef.current, { align: 'right', verticalAlign: 'bottom' });
      }
    }

    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isNotifOpen, isProfileOpen]);

  // Load notifications from Supabase on mount
  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      const loaded = await listNotifications();
      setNotifications(loaded);
      setLoading(false);
    }
    loadNotifications();
  }, []);

  // Set up realtime or polling for new notifications
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not configured, notifications polling disabled');
      return;
    }

    const pageLoadTime = new Date().toISOString();

    // Try realtime subscription first
    let unsubscribe;
    try {
      unsubscribe = subscribeToNotifications((newNotif) => {
        // Only play sound and add if notification arrived after page load
        if (newNotif.created_at > pageLoadTime) {
          if (!isMuted) {
            playNotificationSound();
          }
          setNotifications(prev => [newNotif, ...prev]);
        }
      });
      console.log('Using realtime subscription for notifications');
    } catch (e) {
      console.warn('Realtime subscription failed, falling back to polling:', e);
      setUsingPolling(true);
      unsubscribe = startNotificationPolling((newNotif) => {
        if (newNotif.created_at > pageLoadTime) {
          if (!isMuted) {
            playNotificationSound();
          }
          setNotifications(prev => [newNotif, ...prev]);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isMuted]);

  // Persist mute state to localStorage
  useEffect(() => {
    localStorage.setItem('notifications-muted', String(isMuted));
  }, [isMuted]);

  // Notification handlers
  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Play sound
    if (newMutedState) {
      playMuteSound();
    } else {
      playUnmuteSound();
    }

    // Trigger expanding capsule animation
    setIsExpanding(true);
    setTimeout(() => setIsExpanding(false), 1600);
  };

  const handleMarkRead = async (notifId) => {
    await markNotificationRead(notifId);
    setNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, readAt: new Date().toISOString() } : n
    ));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
  };

  const handleClearAll = async () => {
    const success = await clearAllNotifications();
    if (success) {
      setNotifications([]);
      setShowClearAllModal(false);
    } else {
      // If delete failed, mark all as read instead
      await handleMarkAllRead();
      setShowClearAllModal(false);
    }
  };

  return (
    <>
    <div className="top-title-bar">
      <div className="title-bar-left">
        <button
          className="icon-btn mobile-menu-btn"
          id="mobileMenuBtn"
          aria-label="Open Navigation Menu"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMobile();
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span className="meta-label active-page-title" id="activePageTitle">
          {activeTitle}
        </span>
      </div>

      <div className="title-bar-right">
        {/* Current Live Date and Time */}
        <div className="top-bar-clock-box">
          <span className="meta-label top-bar-clock" id="topBarClock">
            {clockText}
          </span>
        </div>

        {/* Notification Bell Icon Button & Accent Badge */}
        <div className="notif-wrapper">
          <button
            ref={notifBtnRef}
            className="notif-btn"
            id="notifBtn"
            aria-expanded={isNotifOpen}
            aria-label="Notifications"
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileOpen(false);
              setIsNotifOpen((prev) => !prev);
            }}
          >
            <div className="notif-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <span className="notif-accent-badge" id="notifAccentBadge" style={{ display: 'none' }}></span>
            <span className="notif-btn-label" id="notifBtnLabel" aria-hidden="true"></span>
          </button>

          {/* Notification Dropdown Panel */}
          <div
            ref={notifDropdownRef}
            className={`notif-dropdown ${isNotifOpen ? 'active' : ''}`}
            id="notifDropdown"
            aria-hidden={!isNotifOpen}
          >
            <div className="dropdown-header">
              <span className="meta-label">NOTIFICATIONS</span>
              <div className="dropdown-header-actions">
                <button
                  className={`mute-toggle-btn ${isMuted ? 'muted' : ''} ${isExpanding ? 'expanding-capsule' : ''}`}
                  id="muteToggleBtn"
                  title={isMuted ? "Unmute notifications" : "Mute notifications"}
                  onClick={handleToggleMute}
                >
                  {isMuted ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6l-3 3a3 3 0 0 0 1.06 5.94M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  )}
                  <span className="mute-btn-text">{isMuted ? 'Muted' : 'Unmuted'}</span>
                </button>
                <button
                  className="btn-capsule clear-all-btn"
                  id="clearNotifBtn"
                  onClick={() => setShowClearAllModal(true)}
                  disabled={notifications.length === 0}
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="notif-body" id="notifBody">
              {notifications.length === 0 ? (
                <div className="notif-empty" id="notifEmpty" style={{ display: 'block' }}>
                  <span className="meta-label">NO NEW NOTIFICATIONS</span>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className="notif-item">
                    <span className="meta-label">{notif.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Prominent Admin Profile Capsule */}
        <div className="admin-profile-pill-wrapper">
          <button
            ref={adminProfileBtnRef}
            className="admin-profile-pill prominent"
            id="adminProfileBtn"
            aria-expanded={isProfileOpen}
            aria-label="Admin Profile Menu"
            onClick={(e) => {
              e.stopPropagation();
              setIsNotifOpen(false);
              setIsProfileOpen((prev) => !prev);
            }}
          >
            <div className="avatar-flat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="meta-label admin-name">ADMIN</span>
          </button>

          <div
            ref={profileDropdownRef}
            className={`profile-dropdown ${isProfileOpen ? 'active' : ''}`}
            id="profileDropdown"
            aria-hidden={!isProfileOpen}
          >
            <a
              href="#profile"
              className="dropdown-item"
              onClick={(e) => {
                e.preventDefault();
                setIsProfileOpen(false);
                // Monolith: href="#profile" opens XModal.custom() with Admin User info card
                // admin-monolith.html lines 19588-19619
                setShowProfileModal(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="meta-label">PROFILE</span>
            </a>
            <Link
              to="/settings"
              className="dropdown-item"
              onClick={() => setIsProfileOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="meta-label">ACCOUNT SETTINGS</span>
            </Link>
            <div className="dropdown-divider"></div>
            <a
              href="#signout"
              className="dropdown-item signout-item"
              onClick={(e) => {
                e.preventDefault();
                setIsProfileOpen(false);
                // Monolith: href="#signout" fires XModal.confirm() — admin-monolith.html lines 19626-19636
                setShowSignOutModal(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="meta-label">SIGN OUT</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Admin Profile modal — ported from admin-monolith.html lines 19588-19619 */}
    {showProfileModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
      }}>
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          maxWidth: '400px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink,#1c1c1b)' }}>Admin Profile</div>
            <div style={{ fontSize: '12px', color: 'var(--mute,#747471)' }}>Display Name &amp; Account Details</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px',
              background: 'var(--soft,#eeeeeb)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%',
                background: 'var(--ink,#1c1c1b)', color: 'var(--card,#fbfbf9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '16px' }}>AD</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink,#1c1c1b)' }}>Admin User</div>
                <div style={{ fontSize: '12px', color: 'var(--mute,#747471)' }}>Store Administrator</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  color: 'var(--mute,#747471)', display: 'block' }}>Display Name</label>
                Admin User
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  color: 'var(--mute,#747471)', display: 'block' }}>Role</label>
                Administrator (Owner)
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  color: 'var(--mute,#747471)', display: 'block' }}>Email</label>
                admin@thegiftingfactory.com
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  color: 'var(--mute,#747471)', display: 'block' }}>Status</label>
                Active
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mute,#747471)', fontStyle: 'italic', marginTop: '8px' }}>
              Note: Profile editing will be enabled when connected to live auth backend.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn p"
                onClick={() => setShowProfileModal(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Sign Out confirm modal — ported from admin-monolith.html lines 19626-19636 */}
    {showSignOutModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
      }}>
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          maxWidth: '400px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Sign Out</h3>
          <p style={{ fontSize: '13px', color: 'var(--mute,#747471)', margin: '0 0 16px 0' }}>
            Are you sure you want to sign out?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn"
              onClick={() => setShowSignOutModal(false)}>Cancel</button>
            <button type="button" className="btn d"
              onClick={() => {
                setShowSignOutModal(false);
                if (onSignOut) {
                  onSignOut();
                } else {
                  // Fallback if no signOut prop provided
                  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: 'Signed out.' } }));
                  setTimeout(() => window.location.reload(), 400);
                }
              }}>Sign Out</button>
          </div>
        </div>
      </div>
    )}

    {/* Clear All confirm modal */}
    {showClearAllModal && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
      }}>
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          maxWidth: '400px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Clear All Notifications</h3>
          <p style={{ fontSize: '13px', color: 'var(--mute,#747471)', margin: '0 0 16px 0' }}>
            Are you sure you want to clear all notifications? This will mark them as read.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn"
              onClick={() => setShowClearAllModal(false)}>No</button>
            <button type="button" className="btn d"
              onClick={handleClearAll}>Yes</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
