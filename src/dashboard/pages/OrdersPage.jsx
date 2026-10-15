import { useState, useEffect, useTransition, useLayoutEffect, useRef } from 'react';
import CustomDropdown from '../components/shared/CustomDropdown';
import CopyIcon from '../components/shared/CopyIcon';
import AutoGrowTextarea from '../components/shared/AutoGrowTextarea';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import { ORDER_CATEGORIES, formatGHS } from '../lib/ordersModel';
import { getOrderCustomerFields } from '../../shared/trackingFields';
import { listOrders, updateOrderStatus, deleteOrder, deleteOrders, updateOrderNote } from '../data/orders';
import { supabase } from '../../config/supabase';
import { DASHBOARD_TO_DB_FULFILLMENT, DB_TO_DASHBOARD_FULFILLMENT, STEPPER_TO_EVENT_STAGE } from '../data/statusMap';
import { getImageUrl } from '../lib/imageUrlHelper';
import { useDashboard } from '../contexts/DashboardContext';
import { fetchOrders, subscribeToCache, getCachedData, isDataLoading } from '../data/dataCache';
import { getAppSettings, syncSettingsWithSupabase } from '../data/settingsAdapter';
import {
  parseDateString,
  formatDateISO,
  formatDateDisplay as accraFormatDateDisplay,
  formatDeliveryWindowShort,
  formatDeliveryWindowFull,
  getDeliverySubtitle,
  todayAccra,
  timestampToAccraDate,
  dateRange,
  compareDates
} from '../../shared/dateUtils';
import { parseAdminOrderNotes } from '../../shared/orderNotes';

// SVG Icons
// SVG Icons (clean thin-stroke line icons, 18-20px)
const SVG = {
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  search: <svg className="search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  banknote: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  payment: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  shoppingBag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  avatar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  email: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  location: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  pin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>,
  truck: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  note: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  giftCard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  pen: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
  sparkles: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>,
  whatsapp: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  restore: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
};

function formatDate(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? String(date) : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDisplayDate(dateStr) {
  return formatDateDisplay(dateStr);
}

function formatRequestedDate(dateStr) {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    const date = new Date(y, m, d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? String(dateStr) : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function getCleanCustomerNote(rawNote) {
  if (!rawNote) return '';
  const lines = rawNote.split(/\r?\n/);
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.toLowerCase().startsWith('gift card:') && !trimmed.toLowerCase().startsWith('card style:');
  });
  return filtered.join('\n').trim();
}

function getDeliveryTypeName(type) {
  if (!type) return 'Standard delivery';
  const key = type.toLowerCase().trim();
  const map = {
    sameday: 'Same-day delivery',
    scheduled: 'Scheduled delivery',
    surprise: 'Surprise delivery',
    collection: 'Shop collection',
    standard: 'Standard delivery',
  };
  return map[key] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Collapsible free text component (3 lines max with Show more / Show less toggle)
function CollapsibleText({ text, maxLines = 3, style = {} }) {
  const [expanded, setExpanded] = useState(false);
  const textRef = useState(null)[0];
  const [canToggle, setCanToggle] = useState(false);

  useEffect(() => {
    if (!text) {
      setCanToggle(false);
      return;
    }
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    setCanToggle(lines.length > maxLines || text.length > 140);
  }, [text, maxLines]);

  if (!text) return null;

  return (
    <div style={style}>
      <div
        style={!expanded ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.45',
          whiteSpace: 'pre-wrap'
        } : {
          lineHeight: '1.45',
          whiteSpace: 'pre-wrap'
        }}
      >
        {text}
      </div>
      {canToggle && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0 0 0',
            fontSize: '11px',
            fontWeight: 600,
            color: '#2563eb',
            cursor: 'pointer',
            marginTop: '3px'
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function CollapsibleOrderNote({ id, label, text }) {
  const [expanded, setExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || expanded) return undefined;

    const updateToggle = () => setCanToggle(content.scrollHeight > content.clientHeight + 2);
    updateToggle();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(updateToggle);
    observer.observe(content);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <div className="admin-order-note-block">
      <span className="admin-order-note-block__label">{label}</span>
      <div
        ref={contentRef}
        id={id}
        className={`admin-order-note-block__content ${expanded ? '' : 'is-collapsed'}`}
      >
        {text}
      </div>
      {canToggle && (
        <button
          type="button"
          className="admin-order-note-block__toggle"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function getOrderNoteEntries(order) {
  const legacyCustomerNote = !order.customerNote && /(?:gift\s*card|card\s*style)\s*:/i.test(order.adminNote || '')
    ? order.adminNote
    : '';
  const blocks = parseAdminOrderNotes(order.customerNote || legacyCustomerNote);
  const hasGiftMessage = blocks.some(block => block.id === 'gift-message');
  const hasCardStyle = blocks.some(block => block.id === 'card-style');
  const entries = blocks.map(block => ({
    ...block,
    label: block.id === 'gift-message' ? 'Gift card message' : block.label,
  }));

  if (order.cardMessage && !hasGiftMessage && !entries.some(block => block.content === order.cardMessage)) {
    entries.push({ id: 'gift-message', label: 'Gift card message', content: order.cardMessage });
  }
  if (order.cardStyle && !hasCardStyle && !entries.some(block => block.content === order.cardStyle)) {
    entries.push({ id: 'card-style', label: 'Card style', content: order.cardStyle });
  }

  return entries;
}

export default function OrdersPage() {
  const [, startTransition] = useTransition();
  const { notifyNewOrder } = useDashboard();
  const [settings, setSettings] = useState(null);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);

  // Load settings for password confirmation check & listen to live updates
  useEffect(() => {
    const refreshSettings = () => setSettings(getAppSettings());
    refreshSettings();
    window.addEventListener('xa12:settingsChanged', refreshSettings);
    syncSettingsWithSupabase().then(s => { if (s) setSettings(s); }).catch(() => { });
    return () => window.removeEventListener('xa12:settingsChanged', refreshSettings);
  }, []);

  // Load orders state
  const [ordersList, setOrdersList] = useState(() => getCachedData('orders') || []);
  const [loading, setLoading] = useState(!getCachedData('orders'));
  const [error, setError] = useState(null);
  // Per-order inline error (e.g. stage button write failure)
  const [orderErrors, setOrderErrors] = useState({});
  // Track in-flight updates per order to prevent race conditions
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  // Load orders from cache/Supabase on mount and subscribe to realtime
  useEffect(() => {
    async function loadOrders() {
      if (!isDataLoading('orders')) {
        setLoading(false);
      }

      setError(null);
      try {
        const orders = await fetchOrders();
        setOrdersList(orders || []);
      } catch (err) {
        setError(err.message);
        // Keep existing data on error
      } finally {
        setLoading(false);
      }
    }
    loadOrders();

    if (!supabase) return undefined;

    const channel = supabase
      .channel('orders-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          const fresh = await fetchOrders(true);
          setOrdersList(fresh || []);

          // Play notification sound on new order INSERT
          if (payload.eventType === 'INSERT' && payload.new) {
            notifyNewOrder(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        async (payload) => {
          if (payload.new?.type === 'new_order') {
            const fresh = await fetchOrders(true);
            setOrdersList(fresh || []);
            notifyNewOrder(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Fallback to polling if Realtime fails
          const pollInterval = setInterval(async () => {
            const fresh = await fetchOrders(true);
            setOrdersList(fresh || []);
          }, 10000);
          return () => clearInterval(pollInterval);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notifyNewOrder]);

  // Subscribe to cache updates
  useEffect(() => {
    const unsubscribe = subscribeToCache(() => {
      const cachedOrders = getCachedData('orders');
      if (cachedOrders) {
        setOrdersList(cachedOrders);
      }
    });
    return unsubscribe;
  }, []);

  // Filters state
  const [filters, setFilters] = useState({
    searchQuery: '',
    category: 'all',
    status: 'all',
    source: 'all'
  });

  // Selection & modal state
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [confirmingBulkCancel, setConfirmingBulkCancel] = useState(false);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [panelDrafts, setPanelDrafts] = useState({});
  const [saveStates, setSaveStates] = useState({});
  const [lastSavedTimes, setLastSavedTimes] = useState({});

  // Filter ONLY live non-delivered orders for Orders page (delivered moves to Log)
  const liveOrders = ordersList.filter(o => o.fulfillmentStatus !== 'delivered');

  // Show error if loading failed
  if (error && liveOrders.length === 0) {
    return (
      <div className="page-container orders-page">
        <div className="page-header-row">
          <div className="page-title-group">
            <h2>Orders</h2>
            <p>Manage customer orders and fulfillment</p>
          </div>
        </div>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#666',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>Could not refresh. Showing the last loaded data.</p>
          <button
            className="btn"
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem' }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Filtered orders derivation
  const filteredOrders = liveOrders.filter(order => {
    if (filters.category !== 'all') {
      const matchCat = (order.items || []).some(item => (item.category || '').toLowerCase() === filters.category);
      if (!matchCat) return false;
    }
    if (filters.status !== 'all') {
      if (filters.status === 'pending_payment') {
        // pending_payment is a fulfillmentStatus value on mapped orders
        if (order.fulfillmentStatus !== 'pending_payment') return false;
      } else if (order.fulfillmentStatus !== filters.status) {
        return false;
      }
    }
    if (filters.source !== 'all' && order.source !== filters.source) {
      return false;
    }
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const code = (order.orderCode || order.id || '').toLowerCase();
      const name = (order.customerName || '').toLowerCase();
      const phone = (order.customerPhone || order.phone || '').toLowerCase();
      const hasItemMatch = (order.items || []).some(item =>
        (item.name || '').toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q)
      );
      if (!code.includes(q) && !name.includes(q) && !phone.includes(q) && !hasItemMatch) {
        return false;
      }
    }
    return true;
  });



  // Silent background refresh — merges by id without remounting the list
  const refreshOrders = async () => {
    const fresh = await listOrders();
    setOrdersList(prev => {
      // Merge: update existing items in-place, append new ones, keep order
      const byId = new Map(fresh.map(o => [o.id, o]));
      const merged = prev.map(o => byId.get(o.id) || o);
      const existingIds = new Set(prev.map(o => o.id));
      fresh.forEach(o => { if (!existingIds.has(o.id)) merged.push(o); });
      return merged;
    });
  };

  // Checkbox toggle
  const toggleSelectOrder = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const allFilteredIds = filteredOrders.map(o => o.id);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  // Stepper box status update — optimistic local update, silent background write
  const handleStepperClick = async (orderId, stage) => {
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;

    // Prevent race: ignore if this order is already being updated
    if (updatingOrders.has(orderId)) return;

    const prevOrder = { ...order };
    setOrderErrors(prev => ({ ...prev, [orderId]: null }));
    setUpdatingOrders(prev => new Set(prev).add(orderId));

    // Paystack-paid orders cannot be un-paid (payment_provider='paystack', status='paid', has payment_reference)
    // Staff orders can toggle paid/unpaid freely
    if (stage === 'paid' && order.paymentStatus === 'paid' &&
      order.paymentProvider === 'paystack' && order.paymentReference) {
      // Locked Paid pill for Paystack paid online orders: do nothing silently, no error message
      setUpdatingOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      return;
    }

    let optFulfillment = order.fulfillmentStatus;
    let optPayment = order.paymentStatus;

    if (stage === 'paid') {
      if (order.paymentStatus === 'pending') {
        optFulfillment = 'packaging';
        optPayment = 'paid';
      } else {
        optFulfillment = 'pending_payment';
        optPayment = 'pending';
      }
    } else if (stage === 'packed' || stage === 'ready') {
      if (order.fulfillmentStatus === 'ready' || order.fulfillmentStatus === 'packed') {
        optFulfillment = 'packaging';
      } else {
        optFulfillment = 'ready';
        optPayment = 'paid';
      }
    } else if (stage === 'dispatched' || stage === 'delivery') {
      if (order.fulfillmentStatus === 'dispatched' || order.fulfillmentStatus === 'delivery') {
        optFulfillment = 'ready';
      } else {
        optFulfillment = 'dispatched';
        optPayment = 'paid';
      }
    } else if (stage === 'delivered' || stage === 'completed') {
      if (order.fulfillmentStatus === 'delivered' || order.fulfillmentStatus === 'completed') {
        optFulfillment = 'dispatched';
      } else {
        optFulfillment = 'delivered';
        optPayment = 'paid';
      }
    }

    // Optimistic UI update: update only this order in the list
    setOrdersList(prev => prev.map(o =>
      o.id === orderId ? { ...o, fulfillmentStatus: optFulfillment, paymentStatus: optPayment } : o
    ));

    // Background write: run database update in parallel (order update + event insert/delete)
    const result = await updateOrderStatus(orderId, stage);

    // Clear in-flight flag
    setUpdatingOrders(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    if (!result || !result.success) {
      // Rollback optimistic update on failure
      setOrdersList(prev => prev.map(o => o.id === orderId ? prevOrder : o));
      setOrderErrors(prev => ({ ...prev, [orderId]: result?.error || 'Update failed' }));
    }
    // On success: the UI already shows the new state; no full refetch needed
    // Realtime updates will merge any server-side changes automatically
  };

  // Restore order
  const handleRestoreOrder = async (orderId) => {
    const prevOrder = ordersList.find(o => o.id === orderId);
    setOrderErrors(prev => ({ ...prev, [orderId]: null }));
    setOrdersList(prev => prev.map(o =>
      o.id === orderId ? { ...o, fulfillmentStatus: 'packaging' } : o
    ));
    const result = await updateOrderStatus(orderId, 'packaging', 'Order reopened');
    if (!result || !result.success) {
      if (prevOrder) setOrdersList(prev => prev.map(o => o.id === orderId ? prevOrder : o));
      setOrderErrors(prev => ({ ...prev, [orderId]: result?.error || 'Restore failed' }));
    } else {
      await refreshOrders();
    }
  };

  // Single delete order
  const handleConfirmDeleteOrder = async (orderId) => {
    if (settings?.security?.requirePasswordForDestructive) {
      setPendingDeleteAction(() => async () => {
        const success = await deleteOrder(orderId);
        if (success) {
          setOrdersList(prev => prev.filter(o => o.id !== orderId));
          setConfirmingDeleteId(null);
          if (expandedId === orderId) setExpandedId(null);
        }
      });
      setShowPwConfirm(true);
      return;
    }

    const success = await deleteOrder(orderId);
    if (success) {
      setOrdersList(prev => prev.filter(o => o.id !== orderId));
      setConfirmingDeleteId(null);
      if (expandedId === orderId) setExpandedId(null);
    }
  };

  // Bulk actions
  const handleBulkMoveStatus = async (targetStatus) => {
    for (const orderId of selectedIds) {
      const result = await updateOrderStatus(orderId, targetStatus, `Bulk move to ${targetStatus}`);
      if (!result || !result.success) {
        console.error(`Failed to move order ${orderId}:`, result?.error);
      }
    }
    await refreshOrders();
    setSelectedIds([]);
  };

  const handleConfirmBulkCancel = async () => {
    for (const orderId of selectedIds) {
      const result = await updateOrderStatus(orderId, 'cancelled', 'Bulk cancel');
      if (!result || !result.success) {
        console.error(`Failed to cancel order ${orderId}:`, result?.error);
      }
    }
    await refreshOrders();
    setSelectedIds([]);
    setConfirmingBulkCancel(false);
  };

  const handleConfirmBulkDelete = async () => {
    const toDelete = [...selectedIds];
    if (toDelete.length === 0) return;

    if (settings?.security?.requirePasswordForDestructive) {
      setPendingDeleteAction(() => async () => {
        await deleteOrders(toDelete);
        await refreshOrders();
        setSelectedIds([]);
        setConfirmingBulkDelete(false);
      });
      setShowPwConfirm(true);
      return;
    }

    await deleteOrders(toDelete);
    await refreshOrders();
    setSelectedIds([]);
    setConfirmingBulkDelete(false);
  };

  const handlePasswordConfirm = async (password) => {
    try {
      const { confirmDestructive } = await import('../utils/confirmDestructive');
      await confirmDestructive(password);
      if (pendingDeleteAction) {
        await pendingDeleteAction();
        setPendingDeleteAction(null);
      }
      setShowPwConfirm(false);
    } catch (err) {
      throw err;
    }
  };

  // Draft handlers
  const updateDraft = (orderId, key, val) => {
    setPanelDrafts(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [key]: val
      }
    }));
  };

  const handleSaveNote = async (order) => {
    setSaveStates(prev => ({ ...prev, [order.id]: 'saving' }));
    const draft = panelDrafts[order.id] || {};
    let estDeliveryIso = undefined;

    // Earliest allowed date: later of order's Accra creation date and today in Accra
    const orderCreatedAccra = timestampToAccraDate(order.orderDate || order.createdAt) || todayAccra();
    const todayStr = todayAccra();
    const earliestAllowed = compareDates(orderCreatedAccra, todayStr) >= 0 ? orderCreatedAccra : todayStr;

    // Use draft date; if none set, fall back to requested delivery date (parsed safely)
    let dateVal = draft.date;
    if (!dateVal && order.requestedDeliveryDate) {
      const parsed = parseDateString(order.requestedDeliveryDate);
      if (parsed) dateVal = formatDateISO(parsed);
    }

    // Guard: reject dates before earliest allowed
    if (dateVal && compareDates(dateVal, earliestAllowed) < 0) {
      setSaveStates(prev => ({ ...prev, [order.id]: 'failed' }));
      setOrderErrors(prev => ({
        ...prev,
        [order.id]: `Cannot save a past date (${accraFormatDateDisplay(dateVal)}). Earliest allowed: ${accraFormatDateDisplay(earliestAllowed)}.`
      }));
      return;
    }

    if (dateVal) {
      try {
        const win = draft.window || '';
        let timeStr = '12:00:00';
        if (win === 'morning') timeStr = '09:00:00';
        else if (win === 'afternoon') timeStr = '13:00:00';
        else if (win === 'evening') timeStr = '17:00:00';
        // Build ISO from date+time using UTC to avoid local-timezone shift on save
        estDeliveryIso = `${dateVal}T${timeStr}+00:00`;
      } catch (e) {
        console.warn('Error formatting estimated delivery date:', e);
      }
    }

    const winVal = draft.window !== undefined ? draft.window : (order.deliveryWindow || undefined);

    const nextOrders = ordersList.map(o => {
      if (o.id !== order.id) return o;
      const updated = { ...o };
      if (draft.note !== undefined) updated.adminNote = draft.note;
      if (winVal !== undefined) updated.deliveryWindow = winVal;
      if (dateVal) {
        updated.estimatedDeliveryAt = {
          date: dateVal,
          window: winVal || '',
        };
        const winDisp = winVal ? ` · ${winVal}` : '';
        updated.estimatedDelivery = estDeliveryIso || `${accraFormatDateDisplay(dateVal)}${winDisp}`;
      }
      return updated;
    });
    setOrdersList(nextOrders);

    // Persist: admin note, estimated_delivery date+time, and delivery_window
    const noteVal = draft.note !== undefined ? draft.note : (order.adminNote || '');
    const res = await updateOrderNote(order.id, noteVal, estDeliveryIso, winVal);
    if (!res) {
      setSaveStates(prev => ({ ...prev, [order.id]: 'failed' }));
      setOrderErrors(prev => ({ ...prev, [order.id]: 'Failed to save note / delivery schedule' }));
    } else {
      setOrderErrors(prev => ({ ...prev, [order.id]: null }));
      const nowAccra = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Accra',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(new Date());
      setLastSavedTimes(prev => ({ ...prev, [order.id]: nowAccra }));
      setSaveStates(prev => ({ ...prev, [order.id]: 'saved' }));
      setTimeout(() => {
        setSaveStates(prev => ({ ...prev, [order.id]: 'idle' }));
      }, 2000);
    }
  };

  // Stats helpers
  const calculateStats = (orders) => {
    const liveOrders = orders.filter(o => o.fulfillmentStatus !== 'delivered');
    const totalRevenue = liveOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const activeOrders = liveOrders.length;
    const pendingPayment = liveOrders.filter(o => o.paymentStatus === 'pending').length;

    const categoryCounts = { all: liveOrders.length, hampers: 0, personalized: 0, bundles: 0, care: 0, flowers: 0 };
    liveOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const cat = (item.category || '').toLowerCase();
        if (categoryCounts[cat] !== undefined) {
          categoryCounts[cat]++;
        }
      });
    });

    const statusCounts = {
      all: liveOrders.length,
      pending_payment: liveOrders.filter(o => o.fulfillmentStatus === 'pending_payment').length,
      paid: liveOrders.filter(o => o.fulfillmentStatus === 'paid').length,
      packaging: liveOrders.filter(o => o.fulfillmentStatus === 'packaging').length,
      ready: liveOrders.filter(o => o.fulfillmentStatus === 'ready').length,
      dispatched: liveOrders.filter(o => o.fulfillmentStatus === 'dispatched').length,
      cancelled: liveOrders.filter(o => o.fulfillmentStatus === 'cancelled').length
    };

    const sourceCounts = {
      all: liveOrders.length,
      staff: liveOrders.filter(o => o.staffOrder).length,
      online: liveOrders.filter(o => !o.staffOrder).length
    };

    return { totalRevenue, activeOrders, pendingPayment, categoryCounts, statusCounts, sourceCounts };
  };

  const stats = calculateStats(ordersList);
  const { categoryCounts, statusCounts, sourceCounts } = stats;

  const categoryTabs = [
    { id: 'all', name: 'All Orders', count: liveOrders.length },
    ...ORDER_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: categoryCounts[cat.id] || 0
    }))
  ];

  // Status chips: ids match fulfillmentStatus values on mapped orders.
  // 'delivered' is excluded from chips — it lives in LogPage (listed separately).
  // Chips sum == statusCounts.all (verified by /tmp/parity/out/status_counts.txt)
  const statusOptions = [
    { id: 'all', name: 'All statuses', count: statusCounts.all },
    { id: 'pending_payment', name: 'Pending payment', count: statusCounts.pending_payment },
    { id: 'paid', name: 'Paid', count: statusCounts.paid },
    { id: 'packaging', name: 'Processing', count: statusCounts.packaging },
    { id: 'ready', name: 'Packed', count: statusCounts.ready },
    { id: 'dispatched', name: 'Dispatched', count: statusCounts.dispatched },
    { id: 'cancelled', name: 'Cancelled', count: statusCounts.cancelled }
  ];

  const sourceOptions = [
    { id: 'all', name: 'All' },
    { id: 'staff', name: 'Staff' },
    { id: 'online', name: 'Online' }
  ];

  const hasActiveFilters = filters.category !== 'all' || filters.status !== 'all' || filters.source !== 'all' || !!filters.searchQuery;

  // Selection island logic
  const selectedCount = selectedIds.length;
  const allSelected = selectedCount > 0 && selectedCount === filteredOrders.length;

  return (
    <div className="orders-page-container">
      {/* Page Header */}
      <div className="orders-page-header">
        <div className="page-title-group">
          <h2>Orders Management</h2>
          <p>Track order fulfillment, assign riders, and manage orders.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-row">
        <div className="stat-card">
          <div className="stat-card-icon">{SVG.banknote}</div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value">GHS {Math.round(stats.totalRevenue).toLocaleString('en-US')}</div>
          <div className="stat-card-caption">From paid orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">{SVG.shoppingBag}</div>
          <div className="stat-card-label">Active Orders</div>
          <div className="stat-card-value">{stats.activeOrders}</div>
          <div className="stat-card-caption">Not yet delivered</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">{SVG.clock}</div>
          <div className="stat-card-label">Pending Payment</div>
          <div className="stat-card-value">{stats.pendingPayment}</div>
          <div className="stat-card-caption">Awaiting payment</div>
        </div>
      </div>

      {/* Unified Filter Card */}
      <div className="orders-filter-card">
        {/* Search Bar */}
        <div className="filter-card-search">
          {SVG.search}
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search ID, name, phone, or item code..."
            value={filters.searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              startTransition(() => {
                setFilters(prev => ({ ...prev, searchQuery: val }));
              });
            }}
          />
        </div>

        {/* Categories Row */}
        <div className="filter-card-row">
          <div className="category-tabs-row">
            {categoryTabs.map(tab => (
              <button
                key={tab.id}
                className={`category-tab ${filters.category === tab.id ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, category: tab.id }))}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Status & Source Filter Row */}
        <div className="filter-card-row filter-card-bottom-row">
          <div className="status-filters">
            {statusOptions.map(opt => (
              <button
                key={opt.id}
                className={`status-filter ${filters.status === opt.id ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, status: opt.id }))}
              >
                {opt.name} ({opt.count})
              </button>
            ))}
          </div>

          <div className="source-toggle">
            {sourceOptions.map(opt => (
              <button
                key={opt.id}
                className={`source-toggle-btn ${filters.source === opt.id ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, source: opt.id }))}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Helper Line with Selection Island */}
      <div className="helper-line-with-island">
        <span className="helper-text">
          Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
        </span>
        {hasActiveFilters && (
          <button
            className="clear-filters-link"
            onClick={() => setFilters({ searchQuery: '', category: 'all', status: 'all', source: 'all' })}
          >
            Clear filters
          </button>
        )}

        {/* Selection Island */}
        {filteredOrders.length > 0 && (
          selectedCount === 0 ? (
            <div className="selection-island">
              <button className="island-action" onClick={toggleSelectAll}>Select all</button>
              <span className="island-count">0 selected</span>
            </div>
          ) : confirmingBulkCancel ? (
            <div className="selection-island has-selection confirming-cancel">
              <span className="island-confirm-text">Cancel {selectedCount} {selectedCount === 1 ? 'order' : 'orders'}?</span>
              <button className="island-action danger danger-solid" onClick={handleConfirmBulkCancel}>Yes</button>
              <button className="island-action" onClick={() => setConfirmingBulkCancel(false)}>No</button>
            </div>
          ) : confirmingBulkDelete ? (
            <div className="selection-island has-selection confirming-cancel">
              <span className="island-confirm-text">Delete {selectedCount} {selectedCount === 1 ? 'order' : 'orders'}?</span>
              <button className="island-action danger danger-solid" onClick={handleConfirmBulkDelete}>Yes</button>
              <button className="island-action" onClick={() => setConfirmingBulkDelete(false)}>No</button>
            </div>
          ) : (
            <div className="selection-island has-selection">
              <button className="island-action primary" onClick={toggleSelectAll}>
                {allSelected ? 'Clear' : 'Select all'}
              </button>
              <span className="island-count">{selectedCount} selected</span>
              <div className="island-divider"></div>
              <CustomDropdown
                options={[
                  { value: 'preparing', label: 'Processing' },
                  { value: 'ready', label: 'Packed' },
                  { value: 'dispatched', label: 'Dispatched' },
                  { value: 'delivered', label: 'Delivered' }
                ]}
                value=""
                placeholder="Move status..."
                onChange={(val) => {
                  if (val) handleBulkMoveStatus(val);
                }}
              />
              <button className="island-action" onClick={() => setSelectedIds([])}>Cancel</button>
              <button className="island-action danger" onClick={() => setConfirmingBulkCancel(true)}>Cancel Orders</button>
              <button className="island-action danger danger-solid" onClick={() => setConfirmingBulkDelete(true)}>Delete</button>
            </div>
          )
        )}
      </div>

      {/* Order List */}
      <div className="order-list">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--chart-bad)', margin: 0 }}>Error loading orders: {error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              {SVG.shoppingBag}
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0' }}>No orders found</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isSelected = selectedIds.includes(order.id);
            const isExpanded = expandedId === order.id;
            const displayCode = order.orderCode || order.id;
            const customerNoteEntries = getOrderNoteEntries(order);

            let offTrackPill = null;
            if (order.paymentStatus === 'pending') {
              offTrackPill = <span className="off-track-pill awaiting-payment">Awaiting payment</span>;
            } else if (order.fulfillmentStatus === 'cancelled') {
              offTrackPill = <span className="off-track-pill cancelled">Cancelled</span>;
            }

            const skus = (order.items || []).map(i => i.sku).filter(Boolean);
            let productCodesDisplay = '';
            if (skus.length === 1) productCodesDisplay = skus[0];
            else if (skus.length > 1) productCodesDisplay = `${skus[0]} +${skus.length - 1}`;
            const hasCodes = productCodesDisplay.length > 0;

            const sourceTag = order.source === 'staff' ? 'Staff' : 'Online';
            const amount = order.total || 0;
            const deliveryInfo = getDeliverySubtitle(order);

            const isPaid = order.paymentStatus === 'paid';
            const stepperSteps = [
              { key: 'paid', label: 'Paid', actionStage: 'paid' },
              { key: 'packed', label: 'Packed', actionStage: 'packed' },
              { key: 'dispatched', label: 'Dispatched', actionStage: 'dispatched' },
              { key: 'delivered', label: 'Delivered', actionStage: 'delivered' }
            ];

            const getStepperCurrentIndex = (o) => {
              if (o.fulfillmentStatus === 'cancelled') return -1;
              if (o.paymentStatus !== 'paid') return -1;
              const status = o.fulfillmentStatus;
              if (status === 'packaging' || status === 'preparing' || status === 'paid') return 0;
              if (status === 'ready' || status === 'packed') return 1;
              if (status === 'dispatched' || status === 'delivery') return 2;
              if (status === 'delivered' || status === 'completed') return 3;
              return -1;
            };

            const currentIndex = getStepperCurrentIndex(order);

            const draft = panelDrafts[order.id] || {};
            const draftDate = draft.date !== undefined ? draft.date : '';
            const draftWindow = draft.window !== undefined ? draft.window : '';
            const draftFrom = draft.from !== undefined ? draft.from : '';
            const draftTo = draft.to !== undefined ? draft.to : '';
            const staffNote = getOrderCustomerFields(order).staffNote;
            const draftNote = draft.note !== undefined ? draft.note : staffNote;

            // Timezone-safe: parse YYYY-MM-DD without new Date(string) to avoid UTC shift
            const requestedDateStr = order.requestedDeliveryDate
              ? (() => { const p = parseDateString(order.requestedDeliveryDate); return p ? formatDateISO(p) : ''; })()
              : '';

            // Earliest allowed: later of order's Accra creation date and today in Accra
            const orderCreatedAccraDate = timestampToAccraDate(order.orderDate || order.createdAt) || todayAccra();
            const todayAccraDate = todayAccra();
            const tomorrowAccraDate = dateRange(todayAccraDate, 2)[1];
            const earliestDate = compareDates(orderCreatedAccraDate, todayAccraDate) >= 0 ? orderCreatedAccraDate : todayAccraDate;

            const hasStructuredDelivery = order.estimatedDeliveryAt && typeof order.estimatedDeliveryAt === 'object';
            // Preselect: saved confirmed date > requested date (if valid) > earliest allowed
            const savedConfirmedDate = hasStructuredDelivery ? order.estimatedDeliveryAt.date || '' : '';
            let selectedDate = draftDate ||
              (savedConfirmedDate && compareDates(savedConfirmedDate, earliestDate) >= 0 ? savedConfirmedDate : '') ||
              (requestedDateStr && compareDates(requestedDateStr, earliestDate) >= 0 ? requestedDateStr : '') ||
              earliestDate;
            let selectedWindow = draftWindow || (hasStructuredDelivery ? order.estimatedDeliveryAt.window || '' : '') || (order.deliveryWindow || '');

            // Build date options: no past dates, 14 days forward from earliest
            const dateOptions = [{ value: '', label: 'Not set' }];
            const forwardDates = dateRange(earliestDate, 14);
            forwardDates.forEach(ds => {
              const shortDate = accraFormatDateDisplay(ds, false);
              let label = shortDate;
              if (ds === todayAccraDate) {
                label = `Today · ${shortDate}`;
              } else if (ds === tomorrowAccraDate) {
                label = `Tomorrow · ${shortDate}`;
              }
              if (ds === requestedDateStr) {
                label = `${label} · Requested`;
              }
              dateOptions.push({ value: ds, label });
            });
            // If saved confirmed date is outside the 14-day window, add it too
            if (savedConfirmedDate && !forwardDates.includes(savedConfirmedDate) && compareDates(savedConfirmedDate, earliestDate) >= 0) {
              dateOptions.push({ value: savedConfirmedDate, label: `Confirmed · ${accraFormatDateDisplay(savedConfirmedDate, false)}` });
            }

            const hasConfirmedDelivery = !!order.estimatedDelivery;
            let confirmedSummary = '';
            if (hasConfirmedDelivery) {
              const m = String(order.estimatedDelivery).match(/^(\d{4}-\d{2}-\d{2})/);
              const dateLabel = m ? accraFormatDateDisplay(m[1]) : '';
              const winLabel = formatDeliveryWindowFull(order.deliveryWindow);
              confirmedSummary = [dateLabel, winLabel].filter(Boolean).join(' · ');
            }

            const savedDateVal = order.estimatedDelivery ? (order.estimatedDelivery.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '') : '';
            const savedWinVal = order.deliveryWindow || '';
            const savedNoteVal = staffNote;

            const hasUnsavedChanges =
              (draft.date !== undefined && draft.date !== savedDateVal) ||
              (draft.window !== undefined && draft.window !== savedWinVal) ||
              (draft.note !== undefined && draft.note !== savedNoteVal);

            const timeWindows = [
              { value: '', label: 'Not set' },
              { value: 'morning', label: 'Morning · 9am-12pm' },
              { value: 'afternoon', label: 'Afternoon · 12-4pm' },
              { value: 'evening', label: 'Evening · 4-7pm' },
              { value: 'custom', label: 'Custom time…' }
            ];

            let nextStageLabel = 'MARK PACKED';
            let nextStageAction = null;
            let isNextStageDisabled = false;

            if (order.paymentStatus === 'pending') {
              nextStageLabel = 'MARK AS PAID FIRST';
              nextStageAction = 'paid';
              isNextStageDisabled = false;
            } else if (order.fulfillmentStatus === 'packaging' || order.fulfillmentStatus === 'preparing' || order.fulfillmentStatus === 'paid') {
              nextStageLabel = 'MARK PACKED';
              nextStageAction = 'packed';
              isNextStageDisabled = false;
            } else if (order.fulfillmentStatus === 'ready' || order.fulfillmentStatus === 'packed') {
              nextStageLabel = 'DISPATCH ORDER';
              nextStageAction = 'dispatched';
              isNextStageDisabled = false;
            } else if (order.fulfillmentStatus === 'dispatched' || order.fulfillmentStatus === 'delivery') {
              nextStageLabel = 'MARK DELIVERED';
              nextStageAction = 'delivered';
              isNextStageDisabled = false;
            } else if (order.fulfillmentStatus === 'completed' || order.fulfillmentStatus === 'delivered') {
              nextStageLabel = 'ORDER DELIVERED';
              nextStageAction = null;
              isNextStageDisabled = true;
            } else if (order.fulfillmentStatus === 'cancelled') {
              nextStageLabel = 'ORDER CANCELLED';
              nextStageAction = null;
              isNextStageDisabled = true;
            }

            return (
              <div key={order.id} className={`order-card ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}>
                <div
                  className="order-card-header"
                  onClick={() => setExpandedId(prev => prev === order.id ? null : order.id)}
                >
                  {/* Checkbox */}
                  <label className="order-card-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                    <span className="custom-checkbox-box"></span>
                  </label>

                  {/* Avatar */}
                  <div className="order-card-avatar">{SVG.avatar}</div>

                  {/* Info */}
                  <div className={`order-card-info ${!hasCodes ? 'centered' : ''}`}>
                    <div className="order-name-row">
                      <span className="order-customer-name">{order.customerName}</span>
                      <span className="order-source-tag">{sourceTag}</span>
                      {offTrackPill}
                    </div>
                    {(hasCodes || deliveryInfo) && (
                      <div className="order-product-codes">
                        {productCodesDisplay ? `${productCodesDisplay}${deliveryInfo}` : deliveryInfo.replace(/^ · /, '')}
                      </div>
                    )}
                  </div>

                  {/* Right side: Stepper, Amount, Chevron */}
                  <div className="order-card-right">
                    {order.fulfillmentStatus === 'cancelled' ? (
                      <div className="cancelled-restore-container" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="restore-capsule-btn"
                          onClick={() => handleRestoreOrder(order.id)}
                        >
                          {SVG.restore} Restore order
                        </button>
                        {orderErrors[order.id] && (
                          <span style={{ fontSize: '11px', color: '#b9645c', marginLeft: '8px' }}>{orderErrors[order.id]}</span>
                        )}
                      </div>
                    ) : (
                      <div className="order-stepper-boxes" onClick={(e) => e.stopPropagation()}>
                        {stepperSteps.map((step, index) => {
                          const isStepPaid = step.key === 'paid';
                          const isPaystackPaid = isPaid && isStepPaid && !order.staffOrder;
                          let disabled = false;
                          if (!isPaid) {
                            disabled = !isStepPaid;
                          } else if (isPaystackPaid) {
                            disabled = true;
                          }

                          let stateClass = '';
                          if (disabled && !isPaid) {
                            stateClass = 'disabled';
                          } else if (index === currentIndex) {
                            stateClass = 'current';
                          } else if (index < currentIndex) {
                            stateClass = 'reached';
                          }

                          return (
                            <button
                              key={step.key}
                              data-stage={step.key}
                              className={`stepper-box ${stateClass}`}
                              disabled={disabled}
                              title={isPaystackPaid ? 'Paid online (Paystack)' : undefined}
                              onClick={() => handleStepperClick(order.id, step.actionStage)}
                            >
                              <span className="stepper-checkbox"></span>
                              <span className="stepper-label">{step.label}</span>
                            </button>
                          );
                        })}
                        {orderErrors[order.id] && (
                          <span style={{ fontSize: '11px', color: '#b9645c', whiteSpace: 'nowrap', alignSelf: 'center', marginLeft: '4px' }}>{orderErrors[order.id]}</span>
                        )}
                      </div>
                    )}

                    <div className="order-amount-block">
                      <div className="order-amount-text">GHS {amount.toLocaleString('en-US')}</div>
                    </div>

                    <div className={`expand-chevron ${isExpanded ? 'expanded' : ''}`}>
                      {SVG.chevron}
                    </div>
                  </div>
                </div>

                {/* Expanded details panel */}
                {isExpanded && (() => {
                  const itemsSubtotal = (order.items || []).reduce((sum, it) => sum + ((it.unitPrice || 0) * (it.qty || 1)), 0);
                  const deliveryFee = Number(order.deliveryFee || 0);
                  const grandTotal = Number(order.total || (itemsSubtotal + deliveryFee));

                  return (
                    <div className="order-details-panel">
                      {orderErrors[order.id] && (
                        <div style={{
                          margin: '0 0 16px 0',
                          padding: '10px 14px',
                          background: 'rgba(220, 38, 38, 0.08)',
                          border: '1px solid rgba(220, 38, 38, 0.25)',
                          borderRadius: '8px',
                          color: '#dc2626',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                          <span>{orderErrors[order.id]}</span>
                        </div>
                      )}

                      <div className="details-panel-grid">
                        {/* Left: Customer, Order, Payment & Delivery Details */}
                        <div className="details-column customer-column">
                          <div className="customer-info-section">
                            <div className="customer-header-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <div className="customer-name-display" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {order.customerName}
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: order.staffOrder ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: order.staffOrder ? '#2563eb' : '#059669',
                                    border: `1px solid ${order.staffOrder ? 'rgba(37, 99, 235, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                                  }}>
                                    {order.staffOrder ? 'Staff Created (POS)' : 'Online Order'}
                                  </span>
                                </div>
                              </div>
                              <div className="customer-header-right">
                                <span className="order-code-chip code-with-copy" title="Order Code">
                                  {displayCode}
                                  <CopyIcon text={displayCode} />
                                </span>
                                {order.trackingNumber && order.trackingNumber !== displayCode && (
                                  <span className="order-code-chip code-with-copy" title="Tracking Number">
                                    {order.trackingNumber}
                                    <CopyIcon text={order.trackingNumber} />
                                  </span>
                                )}
                                <button className="print-badge-btn" onClick={() => window.print()}>PRINT</button>
                              </div>
                            </div>

                            <div className="contact-details-grid" style={{ marginTop: '14px' }}>
                              {/* Payment Information */}
                              <div className="contact-detail-row">
                                <div className="contact-icon-tile">{SVG.banknote || SVG.phone}</div>
                                <div className="contact-detail-content">
                                  <div className="contact-detail-label">PAYMENT DETAILS</div>
                                  <div className="contact-detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontWeight: 600, color: order.paymentStatus === 'paid' ? '#059669' : '#d97706' }}>
                                        {(order.paymentStatus || 'pending').toUpperCase()}
                                      </span>
                                      {order.paymentProvider && (
                                        <span style={{ color: 'var(--text-muted)' }}>via {order.paymentProvider.toUpperCase()}</span>
                                      )}
                                    </div>
                                    {order.paymentReference && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        <span>Ref: {order.paymentReference}</span>
                                        <CopyIcon text={order.paymentReference} />
                                      </div>
                                    )}
                                    {order.orderDate && (
                                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                        Paid: {new Date(order.orderDate).toLocaleString('en-GH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Customer Contact */}
                              {(order.customerPhone || order.phone) && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.phone}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">PHONE</div>
                                    <div className="contact-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <a href={`tel:${order.customerPhone || order.phone}`} className="contact-link">
                                        {order.customerPhone || order.phone}
                                      </a>
                                      <CopyIcon text={order.customerPhone || order.phone} />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {(order.customerEmail || order.email) && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.email}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">EMAIL</div>
                                    <div className="contact-detail-value">
                                      <a href={`mailto:${order.customerEmail || order.email}`} className="contact-link">
                                        {order.customerEmail || order.email}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* WhatsApp Direct Action */}
                              {(order.customerPhone || order.phone) && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                  </div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">WHATSAPP</div>
                                    <div className="contact-detail-value">
                                      {(() => {
                                        const phone = order.customerPhone || order.phone;
                                        const digits = phone.replace(/\D/g, '');
                                        let internationalPhone = digits;
                                        if (digits.startsWith('0')) internationalPhone = '233' + digits.slice(1);
                                        else if (!digits.startsWith('233') && !phone.startsWith('+')) internationalPhone = '233' + digits;
                                        const statusLabel = order.fulfillmentStatus || 'Processing';
                                        const waMessage = encodeURIComponent(
                                          `Hello! Your order ${order.orderCode || order.trackingNumber} is currently ${statusLabel}. Tracking: ${order.trackingNumber || 'N/A'}`
                                        );
                                        return (
                                          <a
                                            href={`https://wa.me/${internationalPhone}?text=${waMessage}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="contact-link"
                                          >
                                            Message on WhatsApp
                                          </a>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Recipient Name (if present) */}
                              {order.recipientName && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.avatar}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">RECIPIENT NAME</div>
                                    <div className="contact-detail-value">
                                      <span style={{ fontWeight: 600 }}>{order.recipientName}</span>
                                      {order.recipientName !== order.customerName && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>(Recipient differs from customer)</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Delivery Address Details */}
                              {order.deliveryAddress && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.location}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">DELIVERY ADDRESS</div>
                                    <div className="contact-detail-value" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                      {order.deliveryAddress}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Landmark (omit if empty) */}
                              {order.landmark && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.pin}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">LANDMARK</div>
                                    <div className="contact-detail-value">{order.landmark}</div>
                                  </div>
                                </div>
                              )}

                              {/* Location Link (omit if empty) */}
                              {order.locationLink && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.map}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">LOCATION LINK</div>
                                    <div className="contact-detail-value">
                                      <a href={order.locationLink} target="_blank" rel="noreferrer" className="contact-link" style={{ wordBreak: 'break-all' }}>
                                        Open delivery location pin ↗
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Delivery Type & Requested Date */}
                              {(order.deliveryType || order.requestedDeliveryDate) && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.truck}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">DELIVERY PREFERENCES</div>
                                    <div className="contact-detail-value" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      {order.deliveryType && (
                                        <div>
                                          <strong>Type:</strong> {order.deliveryType.replace(/_/g, ' ').toUpperCase()}
                                          {order.deliveryFee ? ` (Fee: GHS ${Number(order.deliveryFee).toLocaleString('en-US')})` : ''}
                                        </div>
                                      )}
                                      {order.requestedDeliveryDate && (
                                        <div style={{ color: '#2563eb', fontWeight: 600 }}>
                                          Customer requested date: {accraFormatDateDisplay(order.requestedDeliveryDate)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Customer Note (omit if empty) */}
                              {customerNoteEntries.length > 0 && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.note}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">CUSTOMER NOTE</div>
                                    <div className="contact-detail-value">
                                      {customerNoteEntries.map(entry => (
                                        <CollapsibleOrderNote
                                          key={entry.id}
                                          id={`order-${order.id}-note-${entry.id}`}
                                          label={entry.label}
                                          text={entry.content}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Customization selections (omit if empty) */}
                              {order.customizations && (
                                <div className="contact-detail-row">
                                  <div className="contact-icon-tile">{SVG.sparkles}</div>
                                  <div className="contact-detail-content">
                                    <div className="contact-detail-label">CUSTOMIZATION SELECTIONS</div>
                                    <div className="contact-detail-value">
                                      {Array.isArray(order.customizations)
                                        ? order.customizations.join(' · ')
                                        : (typeof order.customizations === 'string'
                                            ? order.customizations
                                            : JSON.stringify(order.customizations))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Items & Price Breakdown */}
                        <div className="details-column items-column">
                          <div className="column-header-row">
                            <span className="column-title">ITEMS ({(order.items || []).length})</span>
                          </div>
                          <div className="items-list">
                            {(order.items || []).map((item, idx) => {
                              const rawImg = item.image || item.imageUrl || item.image_path || item.metadata?.image || item.metadata?.imageUrl;
                              const itemImg = getImageUrl(rawImg);
                              const itemTotal = (item.unitPrice || 0) * (item.qty || 1);
                              const itemCode = item.sku || item.productId || '—';

                              return (
                                <div key={idx} className="item-entry" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(26,26,26,0.05)' }}>
                                  <div style={{
                                    width: '42px', height: '42px', borderRadius: '6px', overflow: 'hidden',
                                    background: 'rgba(26,26,26,0.04)', border: '1px solid rgba(26,26,26,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
                                  }}>
                                    {itemImg ? (
                                      <img src={itemImg} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="item-entry-left" style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <span className="item-code" style={{ padding: '1px 5px', borderRadius: '3px', background: 'rgba(26,26,26,0.06)', fontSize: '11px', fontWeight: 600 }}>
                                        {itemCode}
                                      </span>
                                      <span className="item-name" style={{ fontWeight: 600 }}>{item.name}</span>
                                      <span className="item-qty" style={{ color: 'var(--text-muted)' }}>×{item.qty}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <span>GHS {Number(item.unitPrice).toLocaleString('en-US')} each</span>
                                      {item.category && (
                                        <span style={{ padding: '0 5px', background: 'rgba(26,26,26,0.04)', borderRadius: '3px' }}>{item.category}</span>
                                      )}
                                      {item.discountPercent > 0 && (
                                        <span style={{ color: '#059669', fontWeight: 600 }}>{item.discountPercent}% OFF</span>
                                      )}
                                    </div>
                                    {/* Additional item metadata details */}
                                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {Object.entries(item.metadata)
                                          .filter(([k]) => !['category', 'discount_percent', 'image', 'imageUrl'].includes(k))
                                          .map(([k, v]) => (
                                            <span key={k} style={{ marginRight: '6px' }}>
                                              {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                  <span className="item-entry-price" style={{ fontWeight: 600, whiteSpace: 'nowrap', paddingTop: '2px' }}>
                                    GHS {itemTotal.toLocaleString('en-US')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Price Breakdown */}
                          <div className="items-price-breakdown" style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(26,26,26,0.02)', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              <span>Items subtotal:</span>
                              <span style={{ fontWeight: 500 }}>GHS {Math.round(itemsSubtotal || order.subtotal || 0).toLocaleString('en-US')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                              <span>Delivery fee {order.deliveryType ? `(${order.deliveryType})` : ''}:</span>
                              <span style={{ fontWeight: 500 }}>GHS {Math.round(deliveryFee).toLocaleString('en-US')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px dashed rgba(26,26,26,0.12)', paddingTop: '8px' }}>
                              <span>Total:</span>
                              <span className="total-amount-pink" style={{ fontSize: '16px', fontWeight: 700 }}>
                                GHS {Math.round(grandTotal).toLocaleString('en-US')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery & Admin Note Section */}
                      <div className="admin-delivery-section">
                        <div className="section-divider"></div>

                        {/* Delivery Confirmation Status Indicator */}
                        <div className="delivery-status-indicator-row">
                          <div className="delivery-status-left">
                            {hasConfirmedDelivery ? (
                              <span className="delivery-status-pill confirmed">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Confirmed for {confirmedSummary}</span>
                              </span>
                            ) : (
                              <span className="delivery-status-pill pending">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Not confirmed yet</span>
                              </span>
                            )}
                          </div>
                          {hasUnsavedChanges && (
                            <span className="unsaved-changes-pill">
                              Unsaved changes
                            </span>
                          )}
                        </div>

                        <div className="delivery-section">
                          <div className="delivery-dropdowns-row">
                            <div className="form-field-row">
                              <label className="form-field-label">
                                DELIVERY DATE
                                {order.requestedDeliveryDate && (
                                  <span style={{ color: '#2563eb', fontWeight: 600, marginLeft: '6px', fontSize: '11px' }}>
                                    (Customer requested: {accraFormatDateDisplay(order.requestedDeliveryDate)})
                                  </span>
                                )}
                              </label>
                              <CustomDropdown
                                options={dateOptions}
                                value={selectedDate}
                                onChange={(val) => updateDraft(order.id, 'date', val)}
                              />
                            </div>

                            <div className="form-field-row">
                              <label className="form-field-label">TIME WINDOW</label>
                              <CustomDropdown
                                options={timeWindows}
                                value={selectedWindow}
                                disabled={!selectedDate}
                                onChange={(val) => updateDraft(order.id, 'window', val)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="admin-note-section">
                          <div className="form-field-row">
                            <label className="form-field-label" htmlFor={`orderAdminNote-${order.id}`}>ADMIN NOTE (VISIBLE TO CUSTOMER ON TRACK ORDER)</label>
                            <AutoGrowTextarea
                              id={`orderAdminNote-${order.id}`}
                              className="form-field-input admin-note-field"
                              value={draftNote}
                              placeholder="e.g. Call customer 10 mins before arrival"
                              onChange={(e) => updateDraft(order.id, 'note', e.target.value)}
                            />
                          </div>
                        </div>

                        {(() => {
                          const orderSaveState = saveStates[order.id] || 'idle';
                          const lastSavedTime = lastSavedTimes[order.id];

                          return (
                            <div className="admin-note-actions">
                              <div className="save-note-action-container" aria-live="polite">
                                <button
                                  className={`save-note-capsule-btn ${orderSaveState}`}
                                  disabled={orderSaveState === 'saving'}
                                  onClick={() => handleSaveNote(order)}
                                >
                                  {orderSaveState === 'saving' && (
                                    <>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                        <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
                                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                                        <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                                      </svg>
                                      SAVING…
                                    </>
                                  )}
                                  {orderSaveState === 'saved' && 'SAVED'}
                                  {orderSaveState === 'failed' && 'FAILED · TRY AGAIN'}
                                  {orderSaveState === 'idle' && 'Save note & delivery'}
                                </button>
                                {lastSavedTime && (
                                  <span className="last-saved-hint">Last saved at {lastSavedTime} GMT</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Bottom Action Row */}
                      <div className="details-action-row">
                        <button
                          className="stage-action-grey-btn"
                          disabled={isNextStageDisabled || !nextStageAction}
                          onClick={() => {
                            if (nextStageAction) handleStepperClick(order.id, nextStageAction);
                          }}
                        >
                          {nextStageLabel}
                        </button>

                        {confirmingDeleteId === order.id ? (
                          <span className="delete-confirm-group">
                            <span className="island-confirm-text" style={{ fontSize: '12px', color: '#b9645c', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Delete order permanently?
                            </span>
                            <button
                              className="delete-order-pink-btn"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                              onClick={() => handleConfirmDeleteOrder(order.id)}
                            >
                              Yes
                            </button>
                            <button
                              className="stage-action-grey-btn"
                              onClick={() => setConfirmingDeleteId(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            className="delete-order-pink-btn"
                            onClick={() => setConfirmingDeleteId(order.id)}
                          >
                            Delete order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Password confirmation modal */}
      <PasswordConfirmModal
        isOpen={showPwConfirm}
        onClose={() => { setShowPwConfirm(false); setPendingDeleteAction(null); }}
        onConfirm={handlePasswordConfirm}
        title="Confirm Deletion"
      />
    </div>
  );
}
