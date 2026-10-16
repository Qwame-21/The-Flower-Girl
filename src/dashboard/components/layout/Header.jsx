import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { listNotifications, deleteNotification, markAllNotificationsRead, clearAllNotifications, subscribeToNotifications, startNotificationPolling } from '../../data/notifications';
import { supabase } from '../../../config/supabase';
import { playNotificationSound, playUnmuteSound } from '../../lib/sounds';
import { fetchSignInLogs, recordSignIn } from '../../lib/signinLog';
import { getAppSettings, syncSettingsWithSupabase } from '../../data/settingsAdapter';
import { addToast } from '../../lib/toastStore';

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
  '/customization': 'CUSTOMIZATION',
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

function getAccraClockText() {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(dtf.formatToParts(now).map(p => [p.type, p.value]));
  const weekday = (parts.weekday || '').toUpperCase();
  const day = parts.day;
  const month = (parts.month || '').toUpperCase();
  const year = parts.year;
  const hour = parts.hour;
  const minute = parts.minute;
  const second = parts.second;
  return `${weekday}, ${day} ${month} ${year} • ${hour}:${minute}:${second} GMT`;
}

function formatLogDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

function getAccraDateTimeText(separator = '•') {
  const now = new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now).map(part => [part.type, part.value]));

  return `${(parts.weekday || '').toUpperCase()}, ${parts.day} ${(parts.month || '').toUpperCase()} ${parts.year} ${separator} ${parts.hour}:${parts.minute} GMT`;
}

function LiveAccraClock() {
  const ref = useRef(null);
  useEffect(() => {
    function update() {
      if (ref.current) ref.current.textContent = getAccraClockText();
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span ref={ref} className="meta-label top-bar-clock" id="topBarClock">
      {getAccraClockText()}
    </span>
  );
}

function LiveMobileDateChip({ separator }) {
  const ref = useRef(null);
  useEffect(() => {
    function update() {
      if (ref.current) ref.current.textContent = getAccraDateTimeText(separator);
    }
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [separator]);
  return (
    <span ref={ref}>
      {getAccraDateTimeText(separator)}
    </span>
  );
}

export default function Header({ onToggleMobile, onRequestSignOut, isMobileMenuOpen = false }) {
  const location = useLocation();
  const activeTitle = ROUTE_TITLE_MAP[location.pathname] || 'OVERVIEW';
  const usesReferenceMobileHeader = ['/log', '/customization', '/insights'].includes(location.pathname);

  const [isDateChipHidden, setIsDateChipHidden] = useState(false);
  const previousScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > previousScrollY.current;
      setIsDateChipHidden(currentScrollY > 40 && scrollingDown);
      previousScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Notification state
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('notifications-muted') === 'true');
  const [notifications, setNotifications] = useState([]);
  const [notificationTab, setNotificationTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [usingPolling, setUsingPolling] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  // Auth user & staff profile state
  const [authUser, setAuthUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Sign in log activity table state
  const [signInLogs, setSignInLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const avatarInputRef = useRef(null);

  // Load real auth user & staff profile on mount
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setAuthUser(data.user);
        await loadStaffProfile(data.user.id);
        // Ensure active session is logged in signin_log
        try {
          if (!sessionStorage.getItem('current_signin_log_id')) {
            await recordSignIn(data.user.id);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const loadStaffProfile = async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('user_id, display_name, role, active, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[staff_profiles] Database error loading profile:', error.message || error);
      } else if (data) {
        setStaffProfile(data);
        setDisplayNameInput(data.display_name || '');
      }
    } catch (e) {
      console.error('[staff_profiles] Exception loading profile:', e);
    }
  };

  const loadLogs = async (userId) => {
    if (!userId) return;
    setLogsLoading(true);
    setLogsError('');
    const { data, error } = await fetchSignInLogs(userId);
    if (error) {
      setLogsError(error);
    } else {
      setSignInLogs(data || []);
    }
    setLogsLoading(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file (PNG, JPEG, GIF, WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image file size must not exceed 2 MB.');
      return;
    }
    setUploadingAvatar(true);
    setAvatarError('');
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `avatars/${authUser.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('storefront-media')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) {
        console.error('[avatar_upload] Storage upload error:', uploadErr.message || uploadErr);
        setAvatarError(`Upload failed: ${uploadErr.message}`);
        setUploadingAvatar(false);
        return;
      }
      const { data: publicData } = supabase.storage
        .from('storefront-media')
        .getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl;
      const { error: dbErr } = await supabase
        .from('staff_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', authUser.id);
      if (dbErr) {
        console.error('[staff_profiles] Update avatar_url error:', dbErr.message || dbErr);
        setAvatarError(`Database update failed: ${dbErr.message}`);
      } else {
        setStaffProfile(prev => ({ ...(prev || {}), avatar_url: publicUrl }));
      }
    } catch (err) {
      console.error('[avatar_upload] Unexpected error:', err);
      setAvatarError(err.message || 'Avatar upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!authUser) return;
    setUploadingAvatar(true);
    setAvatarError('');
    try {
      const { error: dbErr } = await supabase
        .from('staff_profiles')
        .update({ avatar_url: null })
        .eq('user_id', authUser.id);
      if (dbErr) {
        console.error('[staff_profiles] Remove avatar error:', dbErr.message || dbErr);
        setAvatarError(`Failed to remove: ${dbErr.message}`);
      } else {
        setStaffProfile(prev => ({ ...(prev || {}), avatar_url: null }));
      }
    } catch (err) {
      console.error('[avatar_remove] Unexpected error:', err);
      setAvatarError(err.message || 'Failed to remove avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveDisplayName = async (e) => {
    if (e) e.preventDefault();
    if (!authUser) return;
    const trimmed = displayNameInput.trim();
    if (!trimmed) {
      setNameError('Display name is required.');
      return;
    }
    if (trimmed.length > 40) {
      setNameError('Display name must be 40 characters or less.');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      const { error: dbErr } = await supabase
        .from('staff_profiles')
        .update({ display_name: trimmed })
        .eq('user_id', authUser.id);
      if (dbErr) {
        console.error('[staff_profiles] Update display_name error:', dbErr.message || dbErr);
        setNameError(`Failed to save: ${dbErr.message}`);
      } else {
        setStaffProfile(prev => ({ ...(prev || {}), display_name: trimmed }));
        setIsEditingName(false);
      }
    } catch (err) {
      console.error('[display_name_save] Unexpected error:', err);
      setNameError(err.message || 'Failed to save display name.');
    } finally {
      setSavingName(false);
    }
  };

  // Derive display name, email, initials
  const profileEmail = authUser?.email || 'admin@thegiftingfactory.com';
  const profileDisplayName =
    staffProfile?.display_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    (authUser?.email ? authUser.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Admin User');

  const profileInitials = profileDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || 'AD';

  const [appSettings, setAppSettings] = useState(() => getAppSettings());

  useEffect(() => {
    syncSettingsWithSupabase().then(res => { if (res) setAppSettings(res); });
    const handleSettingsChange = () => {
      syncSettingsWithSupabase().then(res => { if (res) setAppSettings(res); });
    };
    window.addEventListener('xa12:settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('xa12:settingsChanged', handleSettingsChange);
  }, []);

  const isNotifAllowed = (notif) => {
    if (!notif) return true;
    const type = (notif.type || '').toLowerCase();
    const notifPrefs = appSettings?.notifications || {};
    if (type === 'new_order' || type === 'order') return notifPrefs.orders !== false;
    if (type === 'new_request' || type === 'request') return notifPrefs.requests !== false;
    if (type === 'new_career' || type === 'new_application' || type === 'career' || type === 'application') return notifPrefs.careers !== false;
    if (type === 'low_stock' || type === 'stock') return notifPrefs.lowStock !== false && appSettings?.inventory?.lowStockAlerts !== false;
    return true;
  };

  // Unread count for badge
  const visibleNotifications = notifications.filter(isNotifAllowed);
  const unreadCount = visibleNotifications.filter(n => !n.readAt).length;
  const getNotificationTab = notification => {
    const type = (notification.type || '').toLowerCase();
    if (type === 'new_order' || type === 'order') return 'orders';
    if (type === 'new_request' || type === 'request') return 'requests';
    return 'other';
  };
  const notificationCounts = {
    orders: visibleNotifications.filter(n => getNotificationTab(n) === 'orders').length,
    requests: visibleNotifications.filter(n => getNotificationTab(n) === 'requests').length,
    other: visibleNotifications.filter(n => getNotificationTab(n) === 'other').length,
  };
  const displayedNotifications = visibleNotifications.filter(n => getNotificationTab(n) === notificationTab);

  // Clear All overlay confirm state
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const clearAllTimerRef = useRef(null);
  // Multi-select for bulk delete
  const [selectedNotifIds, setSelectedNotifIds] = useState([]);



  // Dropdown states
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // Modal states — ported from admin-monolith.html lines 19588-19636
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // Escape key listener to close profile side drawer
  useEffect(() => {
    if (!showProfileModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowProfileModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProfileModal]);

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

    function handleEscape(e) {
      if (e.key === 'Escape') {
        if (isNotifOpen) setIsNotifOpen(false);
        if (isProfileOpen) setIsProfileOpen(false);
      }
    }

    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('keydown', handleEscape);
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

  // Set up realtime or polling for new notifications.
  // Any INSERT received is treated as new — no created_at comparison (avoids clock skew).
  // Deduplication by id prevents duplicates.
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not configured, notifications polling disabled');
      return;
    }

    // Try realtime subscription first
    let unsubscribe;
    try {
      unsubscribe = subscribeToNotifications((newNotif) => {
        if (newNotif.type === 'status_change') return;
        // Dedupe by id
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          if (!isMuted && isNotifAllowed(newNotif)) {
            playNotificationSound();
          }
          if (isNotifAllowed(newNotif)) {
            addToast({
              id: newNotif.id,
              title: newNotif.title,
              body: newNotif.body,
              type: newNotif.type,
              route: newNotif.route
            });
          }
          return [{
            id: newNotif.id,
            type: newNotif.type,
            title: newNotif.title,
            body: newNotif.body,
            route: newNotif.route,
            recordId: newNotif.record_id,
            readAt: newNotif.read_at,
            createdAt: newNotif.created_at
          }, ...prev];
        });
      });
    } catch (e) {
      console.warn('Realtime subscription failed, falling back to polling:', e);
      setUsingPolling(true);
      unsubscribe = startNotificationPolling((newNotif) => {
        if (newNotif.type === 'status_change') return;
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          if (!isMuted && isNotifAllowed(newNotif)) {
            playNotificationSound();
          }
          if (isNotifAllowed(newNotif)) {
            addToast({
              id: newNotif.id,
              title: newNotif.title,
              body: newNotif.body,
              type: newNotif.type,
              route: newNotif.route
            });
          }
          return [{
            id: newNotif.id,
            type: newNotif.type,
            title: newNotif.title,
            body: newNotif.body,
            route: newNotif.route,
            recordId: newNotif.record_id,
            readAt: newNotif.read_at,
            createdAt: newNotif.created_at
          }, ...prev];
        });
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

  // Cleanup clear-all timer on unmount
  useEffect(() => {
    return () => {
      if (clearAllTimerRef.current) clearTimeout(clearAllTimerRef.current);
    };
  }, []);

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Play sample confirmation sound when unmuting
    if (!newMutedState) {
      playUnmuteSound();
    }

    // Trigger expanding capsule animation
    setIsExpanding(true);
    setTimeout(() => setIsExpanding(false), 1600);
  };

  // × button: optimistic delete from list, rollback on error
  const handleDismissNotif = async (notifId) => {
    const prev = notifications;
    setNotifications(n => n.filter(x => x.id !== notifId));
    const ok = await deleteNotification(notifId);
    if (!ok) {
      // Rollback
      setNotifications(prev);
    }
  };

  // Clear All — inline two-step confirm, auto-reverts after 4 s
  const handleClearAllFirst = () => {
    setClearAllConfirm(true);
    if (clearAllTimerRef.current) clearTimeout(clearAllTimerRef.current);
    clearAllTimerRef.current = setTimeout(() => {
      setClearAllConfirm(false);
    }, 4000);
  };

  const handleClearAllConfirm = async () => {
    if (clearAllTimerRef.current) clearTimeout(clearAllTimerRef.current);
    setClearAllConfirm(false);
    const prevNotifs = notifications;
    // Optimistic clear
    setNotifications([]);
    const success = await clearAllNotifications();
    if (!success) {
      // Rollback
      setNotifications(prevNotifs);
    }
  };

  const handleClearAllCancel = () => {
    if (clearAllTimerRef.current) clearTimeout(clearAllTimerRef.current);
    setClearAllConfirm(false);
  };

  const navigate = useNavigate();

  const handleNotificationClick = async (notif) => {
    setIsNotifOpen(false);
    const type = notif.type;
    const recordId = notif.recordId;

    // Auto-dismiss (delete) on click
    const prev = notifications;
    setNotifications(n => n.filter(x => x.id !== notif.id));
    const ok = await deleteNotification(notif.id);
    if (!ok) setNotifications(prev);

    if (type === 'new_order') {
      if (recordId) {
        navigate('/orders', { state: { openOrderId: recordId } });
      } else {
        navigate('/orders');
      }
    } else if (type === 'new_request') {
      navigate('/requests', { state: { openRequestId: recordId } });
    } else if (type === 'new_application') {
      navigate('/careers');
    } else if (type === 'low_stock') {
      navigate('/products');
    } else if (type === 'new_review') {
      navigate('/reviews');
    } else {
      navigate('/overview');
    }
  };

  const toggleSelectNotif = (id, e) => {
    e.stopPropagation();
    setSelectedNotifIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    const toDelete = [...selectedNotifIds];
    setSelectedNotifIds([]);
    const prev = notifications;
    setNotifications(n => n.filter(x => !toDelete.includes(x.id)));
    const results = await Promise.all(toDelete.map(id => deleteNotification(id)));
    if (results.some(r => !r)) setNotifications(prev);
  };

  return (
    <>
    {/* Mobile Header Zone - wraps island and date chip for fixed positioning */}
    <div className="mobile-header-zone">
      <div className={`top-title-bar${isNotifOpen ? ' notifications-open' : ''}${usesReferenceMobileHeader ? ' reference-mobile-header' : ''}`}>
        <div className="title-bar-left">
          <button
            className="icon-btn mobile-menu-btn"
            id="mobileMenuBtn"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="sideNav"
            aria-expanded={isMobileMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMobile();
            }}
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <span className="meta-label active-page-title" id="activePageTitle">
            {isMobileMenuOpen ? 'MENU' : activeTitle}
          </span>
        </div>

        <div className="title-bar-right">
          {/* Current Live Date and Time */}
          <div className="top-bar-clock-box">
            <LiveAccraClock />
          </div>

          {/* Grouped Notification Bell & Admin Profile Pair */}
          <div className="notif-admin-group">
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
                {unreadCount > 0 && (
                  <span
                    className="notif-accent-badge"
                    id="notifAccentBadge"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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
                      type="button"
                      className="notif-close-btn"
                      aria-label="Close notifications"
                      style={{ display: 'none' }}
                      onClick={() => setIsNotifOpen(false)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    {/* Mute toggle */}
                    <button
                      type="button"
                      className={`mute-toggle-btn ${isMuted ? 'muted' : ''} ${isExpanding ? 'expanding-capsule' : ''}`}
                      id="muteToggleBtn"
                      title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
                      aria-label={`Notifications ${isMuted ? 'muted' : 'unmuted'}. Activate to ${isMuted ? 'unmute' : 'mute'} notifications.`}
                      aria-pressed={isMuted}
                      onClick={handleToggleMute}
                    >
                      {isMuted ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <line x1="23" y1="9" x2="17" y2="15"></line>
                          <line x1="17" y1="9" x2="23" y2="15"></line>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                      )}
                      <span className="mute-btn-text">{isMuted ? 'Muted' : 'Unmuted'}</span>
                    </button>

                    {/* Multi-select delete */}
                    {selectedNotifIds.length > 0 && (
                      <button
                        className="btn-capsule clear-all-btn"
                        style={{ background: '#dc2626', color: '#fff', borderColor: 'transparent', fontSize: '10px', padding: '0 12px' }}
                        onClick={handleDeleteSelected}
                      >
                        Delete ({selectedNotifIds.length})
                      </button>
                    )}

                    {/* Clear All */}
                    <button
                      className="btn-capsule clear-all-btn"
                      id="clearNotifBtn"
                      onClick={handleClearAllFirst}
                      disabled={notifications.length === 0}
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* Clear All confirmation overlay */}
                {clearAllConfirm && (
                  <div className="notif-clear-overlay">
                    <p className="notif-clear-question">Clear all notifications?</p>
                    <div className="notif-clear-actions">
                      <button className="notif-clear-yes" onClick={handleClearAllConfirm}>Yes, clear all</button>
                      <button className="notif-clear-no" onClick={handleClearAllCancel}>No, keep</button>
                    </div>
                  </div>
                )}
                <div className="notif-tabs" role="tablist" aria-label="Notification categories">
                  {[
                    ['orders', 'Orders'],
                    ['requests', 'Requests'],
                    ['other', 'Other'],
                  ].map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={notificationTab === tab}
                      className={`notif-tab${notificationTab === tab ? ' active' : ''}`}
                      onClick={() => setNotificationTab(tab)}
                    >
                      {label}<span>{notificationCounts[tab]}</span>
                    </button>
                  ))}
                </div>
                <div className="notif-body" id="notifBody">
                  {displayedNotifications.length === 0 ? (
                    <div className="notif-empty" id="notifEmpty" style={{ display: 'block' }}>
                      <span className="meta-label">No {notificationTab === 'other' ? 'other ' : ''}{notificationTab} notifications</span>
                    </div>
                  ) : (
                    displayedNotifications.map((notif) => {
                      const isSelected = selectedNotifIds.includes(notif.id);
                      return (
                        <div
                          key={notif.id}
                          className={`notif-item ${notif.readAt ? 'read' : ''} ${isSelected ? 'notif-selected' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Multi-select checkbox */}
                          <span
                            className={`notif-select-dot ${isSelected ? 'selected' : ''}`}
                            onClick={(e) => toggleSelectNotif(notif.id, e)}
                            title={isSelected ? 'Deselect' : 'Select'}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span className="meta-label">{notif.title}</span>
                            {notif.body && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.body}</div>}
                          </div>
                          <button
                            className="notif-clear-item-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissNotif(notif.id);
                            }}
                            title="Dismiss"
                            aria-label="Dismiss notification"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      );
                    })
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
                {staffProfile?.avatar_url ? (
                  <img
                    src={staffProfile.avatar_url}
                    alt="Admin Avatar"
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar-flat-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
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
                    setShowProfileModal(true);
                    if (authUser?.id) {
                      loadLogs(authUser.id);
                      loadStaffProfile(authUser.id);
                    }
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
                    onRequestSignOut();
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
      </div>

      {/* Scroll-aware Date Chip inside the zone */}
      <div className={`mobile-floating-date-chip${usesReferenceMobileHeader ? ' reference-mobile-date-chip' : ''}${isDateChipHidden ? ' hidden' : ''}`} id="mobileFloatingDateChip" aria-hidden="true">
        <LiveMobileDateChip separator={usesReferenceMobileHeader ? '·' : '•'} />
      </div>
    </div>

    {/* Admin Profile Side Drawer */}
    {showProfileModal && (
      <>
        <div
          className="drawer-backdrop active"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 9998,
            transition: 'opacity 0.25s ease'
          }}
          onClick={() => setShowProfileModal(false)}
        />
        <div
          className="admin-profile-drawer active"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '400px',
            maxWidth: '90vw',
            background: '#ffffff',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            overflowY: 'auto'
          }}
        >
          {/* Drawer Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(26,26,26,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Admin Profile</div>
            <button
              type="button"
              className="btn-icon-action"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
              onClick={() => setShowProfileModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {/* Avatar Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'rgba(26,26,26,0.03)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(26,26,26,0.06)'
            }}>
              <div
                style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#1a1a1a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '20px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => avatarInputRef.current?.click()}
                title="Click to change profile picture"
              >
                {staffProfile?.avatar_url ? (
                  <img
                    src={staffProfile.avatar_url}
                    alt="Profile Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  profileInitials
                )}
                {uploadingAvatar && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px'
                  }}>
                    Uploading...
                  </div>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profileDisplayName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Store Administrator</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{
                      padding: '3px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '6px',
                      border: '1px solid rgba(26,26,26,0.2)', background: '#fff', cursor: 'pointer'
                    }}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {staffProfile?.avatar_url ? 'Replace' : 'Upload photo'}
                  </button>
                  {staffProfile?.avatar_url && (
                    <button
                      type="button"
                      style={{
                        padding: '3px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '6px',
                        border: '1px solid rgba(220,38,38,0.3)', background: '#fff', color: '#dc2626', cursor: 'pointer'
                      }}
                      onClick={handleRemoveAvatar}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {avatarError && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>{avatarError}</div>}
              </div>
            </div>

            {/* Profile Fields: Display Name, Role, Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Display Name</label>
                  {!isEditingName && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#1a1a1a', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => { setIsEditingName(true); setDisplayNameInput(profileDisplayName); setNameError(''); }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditingName ? (
                  <form onSubmit={handleSaveDisplayName} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      maxLength={40}
                      required
                      value={displayNameInput}
                      onChange={e => setDisplayNameInput(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(26,26,26,0.2)', fontSize: '13px' }}
                    />
                    <button
                      type="submit"
                      disabled={savingName}
                      style={{ padding: '6px 12px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {savingName ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid rgba(26,26,26,0.15)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{profileDisplayName}</div>
                )}
                {nameError && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>{nameError}</div>}
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Role</label>
                <div style={{ fontWeight: 600, color: '#1a1a1a' }}>Administrator</div>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email</label>
                <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{profileEmail}</div>
              </div>
            </div>

            {/* Sign-in Activity Table */}
            <div style={{ borderTop: '1px solid rgba(26,26,26,0.08)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="meta-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>SIGN-IN ACTIVITY</span>
                {logsError && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#1a1a1a', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => authUser?.id && loadLogs(authUser.id)}
                  >
                    Retry
                  </button>
                )}
              </div>

              {logsLoading ? (
                <div style={{ fontSize: '12px', color: '#6b7280', padding: '12px 0' }}>Loading sign-in history...</div>
              ) : logsError ? (
                <div style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                  Unable to load activity log: {logsError}
                </div>
              ) : signInLogs.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#6b7280', padding: '8px 0' }}>No recent sign-in activity recorded.</div>
              ) : (
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(26,26,26,0.08)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(26,26,26,0.03)', borderBottom: '1px solid rgba(26,26,26,0.08)' }}>
                        <th style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text-muted)' }}>Signed in</th>
                        <th style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--text-muted)' }}>Signed out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signInLogs.map((log, idx) => (
                        <tr key={log.id || idx} style={{ borderBottom: '1px solid rgba(26,26,26,0.04)' }}>
                          <td style={{ padding: '6px 10px', color: '#333' }}>
                            {formatLogDateTime(log.signed_in_at)}
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            {log.signed_out_at ? (
                              <span style={{ color: '#6b7280' }}>{formatLogDateTime(log.signed_out_at)}</span>
                            ) : (
                              <span style={{ color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Actions: Settings & Sign Out */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(26,26,26,0.08)' }}>
              <Link
                to="/settings"
                className="xp-pill"
                style={{ width: '100%', textAlign: 'center', textDecoration: 'none', padding: '10px 0', fontWeight: 600, boxSizing: 'border-box' }}
                onClick={() => setShowProfileModal(false)}
              >
                Settings
              </Link>
              <button
                type="button"
                className="xp-pill xp-solid"
                style={{ width: '100%', padding: '10px 0', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => {
                  setShowProfileModal(false);
                  onRequestSignOut();
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    </>
  );
}
