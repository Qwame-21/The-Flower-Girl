// src/pages/RequestsPage.jsx
// Ported 1-for-1 verbatim from admin-monolith.html renderRequestsView() (lines 23569–24236)
// Storage key: 'xa12_custom_requests'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CopyIcon from '../components/shared/CopyIcon';
import AutoGrowTextarea from '../components/shared/AutoGrowTextarea';
import { loadRequestsData, saveRequestsData, syncRequestsWithSupabase, convertRequestToOrder, updateRequestStatusSync, updateRequestAdminNoteSync, updateRequestQuoteSync, deleteRequestSync, markRequestViewedSync } from '../data/requestsAdapter';
import { fetchRequests, getCachedData, isDataLoading, subscribeToCache } from '../data/dataCache';
import { supabase } from '../../config/supabase';
import { parseDateString, formatDateDisplay, formatTimestampDisplay } from '../../shared/dateUtils';
import { formatNumber, formatNumberText } from '../lib/ordersModel';

const REQUESTS_KEY = 'xa12_custom_requests';

// ── Initial Seed Data ── (Monolith lines 22493–22612)
const SEED_REQUESTS = [
  {
    id: 'REQ-1042',
    reference: 'RQ-4F82K1',
    created_at: '22 Sep 2026',
    status: 'new',
    customer_name: 'Nana K. Mensah',
    phone: '+233 24 000 0000',
    email: 'nana@email.com',
    request_type: 'bespoke_gift',
    service: '',
    occasion: 'Anniversary',
    quantity: 1,
    budget: 'GHS 2,000',
    preferred_date: '25 Sep 2026',
    fulfilment: 'delivery',
    city: 'East Legon',
    recipient: 'Ama Mensah',
    selections: ['Flower bouquet', 'Perfume', 'Card message & design'],
    notes: 'Deep blush roses, eucalyptus, gold foil ribbon. Deliver before 9am.',
    inspiration_path: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&auto=format&fit=crop&q=60',
    card_message: 'With love, always.',
    card_style: 'Classic serif',
    estimate_low: 1050,
    estimate_high: 1180,
    confirmed_quote: null,
    admin_note: '',
    approved_at: null,
    converted_at: null
  },
  {
    id: 'REQ-1041',
    reference: 'RQ-7H20QD',
    created_at: '19 Sep 2026',
    approved_at: '21 Sep 2026',
    status: 'approved',
    customer_name: 'Efua Appiah',
    phone: '+233 20 000 0000',
    email: 'efua.appiah@yahoo.com',
    request_type: 'service',
    service: 'Gift wrapping',
    occasion: 'Birthday',
    quantity: 12,
    budget: null,
    preferred_date: '28 Sep 2026',
    fulfilment: 'collection',
    city: '',
    recipient: '',
    selections: [],
    notes: 'Yellow and coral wrapping with a bottle attached to each gift.',
    inspiration_path: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&auto=format&fit=crop&q=60',
    card_message: '',
    card_style: '',
    estimate_low: null,
    estimate_high: null,
    confirmed_quote: 1150,
    admin_note: 'Confirmed quote agreed via phone on 21 Sep.',
    converted_at: null
  },
  {
    id: 'REQ-1040',
    reference: 'RQ-3M91PL',
    created_at: '15 Sep 2026',
    status: 'quote_needed',
    customer_name: 'Kwame Osei',
    phone: '+233 27 333 1122',
    email: 'kwame.osei@gmail.com',
    request_type: 'bespoke_gift',
    service: '',
    occasion: 'Sympathy',
    quantity: 1,
    budget: 'GHS 1,800',
    preferred_date: '29 Sep 2026',
    fulfilment: 'delivery',
    city: 'Airport Residential',
    recipient: 'The Osei Family',
    selections: ['White Lilies', 'Orchids', 'Satin Sash'],
    notes: 'Pure white lilies, orchids, and satin sash with custom gold inscription.',
    inspiration_path: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400&auto=format&fit=crop&q=60',
    card_message: 'With deepest sympathies and love.',
    card_style: 'Clean minimal',
    estimate_low: 1500,
    estimate_high: 1800,
    confirmed_quote: null,
    admin_note: '',
    approved_at: null,
    converted_at: null
  },
  {
    id: 'REQ-1039',
    reference: 'RQ-9K44ZZ',
    created_at: '10 Sep 2026',
    approved_at: '12 Sep 2026',
    converted_at: '14 Sep 2026',
    status: 'converted',
    customer_name: 'Standard Bank Ghana',
    phone: '+233 30 211 4455',
    email: 'corporate@standardbank.com.gh',
    request_type: 'service',
    service: 'Corporate Event',
    occasion: 'Corporate',
    quantity: 15,
    budget: 'GHS 8,500',
    preferred_date: '16 Sep 2026',
    fulfilment: 'delivery',
    city: 'Cantonments',
    recipient: 'Standard Bank Gala',
    selections: [],
    notes: 'Navy blue and ivory theme. Low-profile arrangements so guests can speak across tables.',
    inspiration_path: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400&auto=format&fit=crop&q=60',
    card_message: 'Compliments of Standard Bank Management.',
    card_style: 'Classic serif',
    estimate_low: 8000,
    estimate_high: 9000,
    confirmed_quote: 8500,
    admin_note: 'Converted to Order #ORD-9082.',
    approved_at: '12 Sep 2026',
    converted_at: '14 Sep 2026'
  }
];

// Gift-box icon — thin line style matching sidebar, no cubes or shades
function GiftBoxMotifSvg({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M12 8V21" />
      <path d="M3 13h18" />
      <path d="M8 8c0-2 1.5-4 4-4s4 2 4 4" />
      <path d="M8 8c-2 0-4-1-4-3 0-1.5 1.5-2 3-1L12 8" />
      <path d="M16 8c2 0 4-1 4-3 0-1.5-1.5-2-3-1L12 8" />
    </svg>
  );
}

function CollapsibleText({ text, maxLines = 3 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 120 || text.split('\n').length > 3;
  return (
    <div>
      <div
        style={expanded ? { whiteSpace: 'pre-line', lineHeight: 1.5 } : {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'pre-line',
          lineHeight: 1.5
        }}
      >
        {text}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 0 0',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--ink, #1c1c1b)',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function formatNeededByDate(val) {
  if (!val) return '';
  // YYYY-MM-DD strings: use parseDateString to avoid UTC-shift off-by-one
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const d = parseDateString(val);
    if (d) return formatDateDisplay(d);
  }
  // Already a human-readable string (from seed data) — return as-is
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val);
}

function formatTimelineDateTime(val) {
  if (!val) return '';
  // Full ISO timestamps → formatTimestampDisplay (Africa/Accra wall-clock time)
  if (typeof val === 'string' && val.includes('T')) {
    return formatTimestampDisplay(val);
  }
  // Fallback for legacy seed strings (e.g. "12 Sep 2026")
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {}
  return String(val);
}



function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

function isHttpLink(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const handledRequestId = useRef(null);
  const [requests, setRequests] = useState(() => {
    const cached = loadRequestsData();
    return cached.length > 0 ? cached : SEED_REQUESTS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all'|'n'|'q'|'a'|'c'|'x'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal / Drawer state
  const [drawerTarget, setDrawerTarget] = useState(null);
  const [quoteModalReq, setQuoteModalReq] = useState(null);
  const [quoteInputVal, setQuoteInputVal] = useState('');
  const [quoteNoteVal, setQuoteNoteVal] = useState('');
  const [whatsappPrompt, setWhatsappPrompt] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [adminNoteDrawerInput, setAdminNoteDrawerInput] = useState('');
  const [adminNoteSaveState, setAdminNoteSaveState] = useState('idle');

  const saveAndSetRequests = (updated) => {
    saveRequestsData(updated);
    setRequests(updated);
  };

  // Reload from cache after Supabase updates
  const reloadFromCache = () => {
    const cached = loadRequestsData();
    setRequests(cached.length > 0 ? cached : SEED_REQUESTS);
  };

  // Manual refresh function with toast feedback
  const refreshRequests = useCallback(async (showFeedback = false) => {
    setIsRefreshing(true);
    try {
      await fetchRequests(true);
      const result = await syncRequestsWithSupabase();
      if (result && result.length > 0) {
        setRequests(result);
        if (showFeedback) showToast('Requests updated');
      } else {
        const cached = loadRequestsData();
        setRequests(cached.length > 0 ? cached : SEED_REQUESTS);
        if (showFeedback) showToast('Requests refreshed');
      }
    } catch (err) {
      console.error('Failed to refresh requests:', err);
      if (showFeedback) showToast('Failed to refresh requests');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const openRequest = useCallback((request) => {
    setDrawerTarget(request);
    setAdminNoteDrawerInput(request.admin_note || '');
    setAdminNoteSaveState('idle');
    markRequestViewedSync(request.id).then(result => {
      if (!result.success) {
        showToast('Could not mark request as viewed');
        return;
      }
      refreshRequests(false);
    });
  }, [refreshRequests]);

  useEffect(() => {
    const requestId = location.state?.openRequestId;
    if (!requestId || handledRequestId.current === requestId) return;
    const request = requests.find(item => String(item.id) === String(requestId));
    if (!request) return;
    handledRequestId.current = requestId;
    openRequest(request);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, openRequest, requests]);

  // Load requests from cache/Supabase on mount
  useEffect(() => {
    refreshRequests(false);
  }, [refreshRequests]);

  // Refetch when window regains focus (e.g. user returns from testing storefront)
  useEffect(() => {
    const handleFocus = () => {
      refreshRequests(false);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshRequests]);

  // Subscribe to dataCache changes
  useEffect(() => {
    const unsubscribe = subscribeToCache(() => {
      const cached = loadRequestsData();
      if (cached && cached.length > 0) {
        setRequests(cached);
      }
    });
    return unsubscribe;
  }, []);

  // Realtime subscription for customer_requests and new_request notifications
  useEffect(() => {
    if (!supabase) return undefined;

    const channel = supabase
      .channel('requests-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_requests' },
        async (payload) => {
          await refreshRequests(false);
          if (payload.eventType === 'INSERT') {
            const customer = payload.new?.customer_name || 'Customer';
            const ref = payload.new?.reference || 'New request';
            showToast(`New custom request: ${ref} from ${customer}`);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        async (payload) => {
          if (payload.new?.type === 'new_request') {
            await refreshRequests(false);
            showToast(payload.new?.title || 'New customer request received');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshRequests]);

  useEffect(() => {
    if (drawerTarget) {
      setAdminNoteDrawerInput(drawerTarget.admin_note || '');
    }
  }, [drawerTarget]);

  // Counts — Monolith lines 23573–23578
  const countNew = requests.filter(r => r.status === 'new').length;
  const countQuoteNeeded = requests.filter(r => r.status === 'quote_needed').length;
  const countApproved = requests.filter(r => r.status === 'approved').length;
  const countConverted = requests.filter(r => r.status === 'converted').length;
  const countClosed = requests.filter(r => r.status === 'closed').length;
  const countAll = requests.filter(r => r.status !== 'closed').length;

  // Matching helper — Monolith lines 23582–23607
  const q = searchQuery.trim().toLowerCase();
  function isMatching(r) {
    if (activeFilter === 'all') {
      if (r.status === 'closed') return false;
    } else if (activeFilter === 'n') {
      if (r.status !== 'new') return false;
    } else if (activeFilter === 'q') {
      if (r.status !== 'quote_needed') return false;
    } else if (activeFilter === 'a') {
      if (r.status !== 'approved') return false;
    } else if (activeFilter === 'c') {
      if (r.status !== 'converted') return false;
    } else if (activeFilter === 'x') {
      if (r.status !== 'closed') return false;
    }

    if (q) {
      const ref = (r.reference || r.id || '').toLowerCase();
      const shortCode = (r.short_code || '').toLowerCase();
      const longRef = (r.long_reference || '').toLowerCase();
      const name = (r.customer_name || r.client || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const occ = (r.occasion || r.service || '').toLowerCase();
      if (!ref.includes(q) && !shortCode.includes(q) && !longRef.includes(q) && !name.includes(q) && !phone.includes(q) && !occ.includes(q)) {
        return false;
      }
    }
    return true;
  }

  // Compose Quote Flow — Monolith lines 23867–23939
  function handleOpenComposeQuote(req) {
    const defaultAmount = req.confirmed_quote || req.estimate_high || (req.budget ? parseInt(String(req.budget).replace(/[^0-9]/g, ''), 10) : 2000) || 2000;
    setQuoteModalReq(req);
    setQuoteInputVal(String(defaultAmount));
    setQuoteNoteVal(req.admin_note || '');
  }

  async function handleSaveQuote() {
    if (!quoteModalReq) return;
    const amount = parseFloat(quoteInputVal);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid quote amount above 0.');
      return;
    }

    const result = await updateRequestQuoteSync(quoteModalReq.id, amount);
    if (result.success) {
      // Re-sync and update drawer immediately so timeline reflects new status/quote
      const fresh = await syncRequestsWithSupabase();
      setRequests(fresh.length > 0 ? fresh : loadRequestsData());
      if (drawerTarget && drawerTarget.id === quoteModalReq.id) {
        const updated = (fresh.length > 0 ? fresh : loadRequestsData()).find(r => r.id === quoteModalReq.id);
        if (updated) setDrawerTarget(updated);
      }
      showToast('Quote saved — status moved to Quote needed');
    } else {
      showToast('Failed to save quote');
    }

    const rawPhone = quoteModalReq.phone || '';
    const normalizedPhone = rawPhone.replace(/\D/g, '');
    const phoneDigits = normalizedPhone.startsWith('0')
      ? `233${normalizedPhone.slice(1)}`
      : normalizedPhone.startsWith('233')
        ? normalizedPhone
        : normalizedPhone;
    const waMessage = `Hello ${quoteModalReq.customer_name || 'Customer'}, this is The Gifting Factory. Your request ${quoteModalReq.reference || quoteModalReq.id} is priced at GHS ${formatNumber(amount, 2)}.${quoteNoteVal ? ' ' + quoteNoteVal : ''} Reply YES to approve.`;

    setWhatsappPrompt({
      phoneDigits,
      waMessage,
      amount,
      ref: quoteModalReq.reference || quoteModalReq.id
    });

    setQuoteModalReq(null);
  }

  // Mark Approved Flow — Monolith lines 23942–23966
  function handleMarkApproved(req) {
    const amountStr = req.confirmed_quote ? `GHS ${formatNumber(req.confirmed_quote, 2)}` : 'the agreed quote';
    setConfirmModal({
      title: 'Mark Quote Approved',
      message: `Has ${req.customer_name || 'the customer'} confirmed the price of ${amountStr}?`,
      confirmText: 'Yes, approved',
      onConfirm: async () => {
        const result = await updateRequestStatusSync(req.id, 'approved');
        if (result.success) {
          reloadFromCache();
          showToast('Approved');
          setConfirmModal(null);
          if (drawerTarget && drawerTarget.id === req.id) {
            setDrawerTarget(null);
          }
        } else {
          showToast('Failed to approve request');
        }
      }
    });
  }

  // Convert to Order Flow — Phase 5: RPC-based conversion
  function handleConvertOrder(req) {
    if (!req.confirmed_quote || req.confirmed_quote <= 0) {
      showToast('Cannot convert request without a confirmed quote amount.');
      return;
    }

    if (req.converted_order_id) {
      showToast('This request has already been converted to an order.');
      return;
    }

    const selItems = (req.selections && req.selections.length) ? req.selections.join(', ') : (req.occasion || 'Custom Gift');
    const totalStr = `GHS ${formatNumber(req.confirmed_quote, 2)}`;

    // Open conversion modal with form fields
    setConfirmModal({
      title: 'Convert Request to Order',
      message: `Customer: ${req.customer_name || 'Client'} | Items: ${selItems} | Total: ${totalStr}`,
      confirmText: 'Convert',
      onConfirm: async () => {
        const conversionData = {
          deliveryAddress: document.getElementById('convert-delivery-address')?.value || '',
          recipientName: document.getElementById('convert-recipient')?.value || '',
          landmark: document.getElementById('convert-landmark')?.value || '',
          requestedDeliveryDate: document.getElementById('convert-date')?.value || '',
          adminNote: document.getElementById('convert-note')?.value || '',
        };

        const result = await convertRequestToOrder(req.id, conversionData);

        if (result.success) {
          const { tracking_number, order_code } = result.data || {};
          showToast(`Order created! Tracking: ${tracking_number || 'N/A'} · Code: ${order_code || 'N/A'}`);

          // Refresh requests list to show converted status
          const fresh = await syncRequestsWithSupabase();
          setRequests(fresh);

          setConfirmModal(null);
          if (drawerTarget && drawerTarget.id === req.id) {
            setDrawerTarget(null);
          }
        } else {
          showToast(`Conversion failed: ${result.error}`);
        }
      },
      isConversionModal: true,
      defaultRecipient: req.recipient || req.customer_name || '',
      defaultCity: req.city || '',
      defaultAddress: req.delivery_address || '',
    });
  }

  // Reopen Request Flow
  async function handleReopenRequest(req) {
    const restoreStatus = req._prevStatus || 'new';
    const result = await updateRequestStatusSync(req.id, restoreStatus);
    if (result.success) {
      reloadFromCache();
      showToast(`Request reopened to ${restoreStatus.replace('_', ' ')}.`);
    } else {
      showToast('Failed to reopen request');
    }
    if (drawerTarget && drawerTarget.id === req.id) {
      setDrawerTarget(null);
    }
  }

  // Decline / Close Request Flow with confirmation step
  function handleDeclineOrClose(req) {
    const code = req.short_code || req.reference || req.id;
    setConfirmModal({
      title: 'Decline / Close Request',
      message: `Are you sure you want to close request ${code} from ${req.customer_name || 'the customer'}? This will mark it closed and update tracking.`,
      confirmText: 'Yes, close request',
      onConfirm: async () => {
        const result = await updateRequestStatusSync(req.id, 'closed', adminNoteDrawerInput || req.admin_note);
        if (result.success) {
          reloadFromCache();
          showToast('Request closed');
          setConfirmModal(null);
          if (drawerTarget && drawerTarget.id === req.id) {
            setDrawerTarget(null);
          }
        } else {
          showToast('Failed to close request');
        }
      }
    });
  }

  // Save Drawer Note and Trigger — Monolith lines 23830–23845
  async function handleSaveDrawerNoteAndTrigger(actionType) {
    if (!drawerTarget) return;
    const result = await updateRequestStatusSync(drawerTarget.id, drawerTarget.status, adminNoteDrawerInput);
    if (result.success) {
      reloadFromCache();
      const currentReq = loadRequestsData().find(r => r.id === drawerTarget.id) || drawerTarget;

      if (actionType === 'compose-quote') handleOpenComposeQuote(currentReq);
      else if (actionType === 'mark-approved') handleMarkApproved(currentReq);
      else if (actionType === 'convert-order') handleConvertOrder(currentReq);
      else if (actionType === 'view-order') navigate('/orders');
      else if (actionType === 'reopen') handleReopenRequest(currentReq);
    } else {
      showToast('Failed to save note');
    }
  }

  return (
    <div className="page-container">
      {/* Page Header — Monolith lines 23610–23616 */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Custom Requests</h2>
          <p>Track each request from New to Converted.</p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => refreshRequests(true)}
          disabled={isRefreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: isRefreshing ? 'wait' : 'pointer' }}
          title="Refresh requests"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Filter Bar & Search — Monolith lines 23618–23628 */}
      <div className="req-bar">
        <input
          className="req-search"
          id="reqSearchInput"
          placeholder="Search by reference, name or phone"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="req-pills" id="reqPills">
          <button type="button" className={`req-pill ${activeFilter === 'all' ? 'on' : ''}`} data-f="all" onClick={() => setActiveFilter('all')}>
            All<small>{countAll}</small>
          </button>
          <button type="button" className={`req-pill ${activeFilter === 'n' ? 'on' : ''}`} data-f="n" onClick={() => setActiveFilter('n')}>
            New<small>{countNew}</small>
          </button>
          <button type="button" className={`req-pill ${activeFilter === 'q' ? 'on' : ''}`} data-f="q" onClick={() => setActiveFilter('q')}>
            Quote Needed<small>{countQuoteNeeded}</small>
          </button>
          <button type="button" className={`req-pill ${activeFilter === 'a' ? 'on' : ''}`} data-f="a" onClick={() => setActiveFilter('a')}>
            Approved<small>{countApproved}</small>
          </button>
          <button type="button" className={`req-pill ${activeFilter === 'c' ? 'on' : ''}`} data-f="c" onClick={() => setActiveFilter('c')}>
            Converted<small>{countConverted}</small>
          </button>
          <button type="button" className={`req-pill ${activeFilter === 'x' ? 'on' : ''}`} data-f="x" onClick={() => setActiveFilter('x')}>
            Closed<small>{countClosed}</small>
          </button>
        </div>
      </div>

      {/* Request Grid — Monolith lines 23630–23681 */}
      <div className="req-grid" id="reqGrid">
        {requests.map((req, idx) => {
          const matches = isMatching(req);

          const st = req.status || 'new';
          let stText = 'New';
          let btnText = 'Compose Quote';
          let actionType = 'compose-quote';

          if (st === 'quote_needed') {
            stText = 'Quote Needed';
            btnText = 'Mark Approved';
            actionType = 'mark-approved';
          } else if (st === 'approved') {
            stText = 'Approved';
            btnText = 'Convert to Order';
            actionType = 'convert-order';
          } else if (st === 'converted') {
            stText = 'Converted';
            btnText = 'View Order';
            actionType = 'view-order';
          } else if (st === 'closed') {
            stText = 'Closed';
            btnText = 'Reopen';
            actionType = 'reopen';
          }

          const motifSvg = <GiftBoxMotifSvg size={52} />;
          const hasSentQuote = Boolean(req.confirmed_quote && req.status !== 'new');
          const amountLabel = hasSentQuote ? 'Quote' : 'Budget';
          const amountVal = hasSentQuote
            ? formatNumber(req.confirmed_quote, 2)
            : formatNumberText(req.budget || (req.estimate_low ? `${req.estimate_low} – ${req.estimate_high}` : '—'));
          const amountText = String(amountVal).startsWith('GHS ') ? amountVal : `GHS ${amountVal}`;
          const metaCategory = req.occasion || req.service || (req.request_type === 'service' ? 'Service' : 'Bespoke gift');
          const whenText = req.created_at || 'Recently';
          const displayRef = req.short_code || req.reference || req.id;

          return (
            <article
              key={req.id}
              className={`card req-card-v3 ${matches ? '' : 'hide'}`}
              data-id={req.id}
              onClick={() => openRequest(req)}
            >
              <div className="top">
                <span className="ref code-with-copy" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  {displayRef}
                  <CopyIcon text={displayRef} />
                </span>
                <span className="st">{stText}</span>
              </div>
              <div className="motif">{motifSvg}</div>
              <div>
                <div className="name">{req.customer_name || req.client || 'Client'}</div>
                <div className="meta">{metaCategory} · {amountLabel} <b>{amountText}</b></div>
                {req.selections && req.selections.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {req.selections.slice(0, 3).map((item, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: '11px',
                          background: 'rgba(26,26,26,0.05)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          color: '#374151',
                          maxWidth: '140px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item}
                      </span>
                    ))}
                    {req.selections.length > 3 && (
                      <span style={{ fontSize: '10px', color: '#888', alignSelf: 'center' }}>
                        +{formatNumber(req.selections.length - 3)} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="foot">
                <span className="when"><i></i>{whenText}</span>
                <button
                  type="button"
                  className="pillbtn"
                  onClick={e => {
                    e.stopPropagation();
                    if (actionType === 'compose-quote') handleOpenComposeQuote(req);
                    else if (actionType === 'mark-approved') handleMarkApproved(req);
                    else if (actionType === 'convert-order') handleConvertOrder(req);
                    else if (actionType === 'view-order') navigate('/orders');
                    else if (actionType === 'reopen') handleReopenRequest(req);
                  }}
                >
                  {btnText}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Request Timeline Drawer Overlay */}
      <div
        className={`ov ${drawerTarget ? 'on' : ''}`}
        id="reqDrawerOverlay"
        onClick={e => { if (e.target.id === 'reqDrawerOverlay') setDrawerTarget(null); }}
      >
        {drawerTarget && (() => {
          const drawerRef = drawerTarget.short_code || drawerTarget.reference || drawerTarget.id;
          return (
            <div className="drawer" id="reqDrawerContainer">
              {/* Drawer Header */}
              <div className="dhead">
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div className="dmotif">
                    <GiftBoxMotifSvg size={36} />
                  </div>
                  <div className="dtitle">
                    <h2 className="code-with-copy" style={{ fontFamily: 'monospace' }}>
                      {drawerRef}
                      <CopyIcon text={drawerRef} />
                    </h2>
                    <div className="sub">
                      {drawerTarget.customer_name || drawerTarget.client || 'Client'} · {drawerTarget.occasion || drawerTarget.service || 'Request'}
                    </div>
                  </div>
                </div>
                <button type="button" className="dclose" onClick={() => setDrawerTarget(null)} aria-label="Close drawer">✕</button>
              </div>

              {/* Drawer Body */}
              <div className="dbody">
                {/* 1. Timeline */}
                <div>
                  <div className="sec-lbl">Timeline</div>
                  <div className="timeline">
                    <div className="tstep">
                      <div className="tdot"><i className="done" /><b className={drawerTarget.status !== 'new' ? 'done' : ''} /></div>
                      <div className="tinfo">
                        <div className="tn">Received</div>
                        <div className="td">{formatTimelineDateTime(drawerTarget.received_at || drawerTarget.created_at_iso || drawerTarget.created_at) || 'Received'}</div>
                      </div>
                    </div>
                    <div className="tstep">
                      <div className="tdot">
                        <i className={drawerTarget.status !== 'new' ? 'done' : ''} />
                        <b className={drawerTarget.status === 'approved' || drawerTarget.status === 'converted' ? 'done' : ''} />
                      </div>
                      <div className="tinfo">
                        <div className="tn">Quoted</div>
                        <div className="td">
                          {drawerTarget.quoted_at
                            ? formatTimelineDateTime(drawerTarget.quoted_at)
                            : (drawerTarget.confirmed_quote && drawerTarget.status === 'new'
                              ? 'Draft — not sent yet'
                              : (['quote_needed', 'approved', 'converted'].includes(drawerTarget.status) && drawerTarget.confirmed_quote
                                ? formatTimelineDateTime(drawerTarget.created_at_iso || drawerTarget.created_at)
                                : 'Not yet'))}
                        </div>
                      </div>
                    </div>
                    <div className="tstep">
                      <div className="tdot">
                        <i className={drawerTarget.status === 'approved' || drawerTarget.status === 'converted' ? 'done' : ''} />
                        <b className={drawerTarget.status === 'converted' ? 'done' : ''} />
                      </div>
                      <div className="tinfo">
                        <div className="tn">Approved</div>
                        <div className="td">
                          {drawerTarget.approved_at
                            ? formatTimelineDateTime(drawerTarget.approved_at)
                            : (['approved', 'converted'].includes(drawerTarget.status) ? 'Approved' : 'Not yet')}
                        </div>
                      </div>
                    </div>
                    <div className="tstep">
                      <div className="tdot">
                        <i className={drawerTarget.status === 'converted' || drawerTarget.status === 'closed' ? 'done' : ''} />
                      </div>
                      <div className="tinfo">
                        <div className="tn">{drawerTarget.status === 'closed' ? 'Closed' : 'Converted'}</div>
                        <div className="td">
                          {drawerTarget.status === 'closed'
                            ? (drawerTarget.closed_at ? formatTimelineDateTime(drawerTarget.closed_at) : 'Closed')
                            : (drawerTarget.converted_at ? formatTimelineDateTime(drawerTarget.converted_at) : (drawerTarget.status === 'converted' ? 'Converted' : 'Not yet'))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Customer */}
                <div>
                  <div className="sec-lbl">Customer</div>
                  <div className="grid2">
                    <div className="drow">
                      <div className="k">Name</div>
                      <div className="v">{drawerTarget.customer_name || 'Client'}</div>
                    </div>
                    {drawerTarget.phone && (
                      <div className="drow">
                        <div className="k">Phone</div>
                        <div className="v">
                          <span className="req-delivery-value">
                            <a href={`tel:${drawerTarget.phone}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                              {drawerTarget.phone}
                            </a>
                            <CopyIcon text={drawerTarget.phone} ariaLabel="Copy customer phone number" />
                          </span>
                        </div>
                      </div>
                    )}
                    {drawerTarget.email && (
                      <div className="drow">
                        <div className="k">Email</div>
                        <div className="v">
                          <span className="req-delivery-value">
                            <a href={`mailto:${drawerTarget.email}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                              {drawerTarget.email}
                            </a>
                            <CopyIcon text={drawerTarget.email} ariaLabel="Copy customer email address" />
                          </span>
                        </div>
                      </div>
                    )}
                    {drawerTarget.phone && (
                      <div className="drow">
                        <div className="k">WhatsApp</div>
                        <div className="v">
                          <a
                            href={`https://wa.me/${drawerTarget.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${drawerTarget.customer_name || 'Customer'}, regarding your request ${drawerRef}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 600, textDecoration: 'none' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            Send WhatsApp
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Gift request */}
                <div>
                  <div className="sec-lbl">Gift Request</div>
                  <div className="grid2">
                    <div className="drow">
                      <div className="k">Occasion</div>
                      <div className="v">{drawerTarget.occasion || drawerTarget.service || 'Bespoke gift'}</div>
                    </div>
                    {drawerTarget.preferred_date && (
                      <div className="drow">
                        <div className="k">Needed by</div>
                        <div className="v">{formatNeededByDate(drawerTarget.preferred_date)}</div>
                      </div>
                    )}
                    <div className="drow">
                      <div className="k">Quantity</div>
                      <div className="v">{formatNumber(drawerTarget.quantity || 1)} identical gift{Number(drawerTarget.quantity) > 1 ? 's' : ''}</div>
                    </div>
                    {drawerTarget.budget && (
                      <div className="drow">
                        <div className="k">Customer Budget</div>
                        <div className="v">{formatNumberText(drawerTarget.budget.startsWith?.('GHS') ? drawerTarget.budget : `GHS ${drawerTarget.budget}`)}</div>
                      </div>
                    )}
                  </div>
                  {drawerTarget.selections && drawerTarget.selections.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div className="k" style={{ marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mute, #747471)' }}>
                        Selected items ({formatNumber(drawerTarget.selections.length)})
                      </div>
                      <div className="chips">
                        {drawerTarget.selections.map((s, idx) => (
                          <span key={idx} className="chip">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Card */}
                {(drawerTarget.card_message || drawerTarget.card_style) && (
                  <div>
                    <div className="sec-lbl">Card &amp; Personalization</div>
                    <div className="grid2">
                      {drawerTarget.card_style && (
                        <div className="drow">
                          <div className="k">Lettering Style</div>
                          <div className="v">{drawerTarget.card_style}</div>
                        </div>
                      )}
                      {drawerTarget.card_message && (
                        <div className="drow" style={{ gridColumn: 'span 2' }}>
                          <div className="k">Card Message</div>
                          <div className="v" style={{ fontStyle: 'italic', background: 'rgba(26,26,26,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                            <CollapsibleText text={`"${drawerTarget.card_message}"`} maxLines={3} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Delivery or collection */}
                <div>
                  <div className="sec-lbl">Delivery or Collection</div>
                  <div className="grid2">
                    <div className="drow">
                      <div className="k">Fulfilment Type</div>
                      <div className="v" style={{ textTransform: 'capitalize' }}>
                        {drawerTarget.fulfilment === 'collection' ? 'Collection from shop' : 'Delivery'}
                      </div>
                    </div>
                    {drawerTarget.recipient && drawerTarget.recipient !== drawerTarget.customer_name && drawerTarget.recipient !== 'recipient' && (
                      <div className="drow">
                        <div className="k">Recipient Name</div>
                        <div className="v">{drawerTarget.recipient}</div>
                      </div>
                    )}
                    {drawerTarget.recipient_phone && drawerTarget.recipient_phone !== drawerTarget.phone && drawerTarget.recipient_phone !== 'recipientPhone' && (
                      <div className="drow">
                        <div className="k">Recipient Phone</div>
                        <div className="v">
                          <span className="req-delivery-value">
                            <a href={`tel:${drawerTarget.recipient_phone}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                              {drawerTarget.recipient_phone}
                            </a>
                            <CopyIcon text={drawerTarget.recipient_phone} ariaLabel="Copy recipient phone number" />
                          </span>
                        </div>
                      </div>
                    )}
                    {drawerTarget.city && (
                      <div className="drow">
                        <div className="k">City / Area</div>
                        <div className="v">{drawerTarget.city}</div>
                      </div>
                    )}
                    {drawerTarget.delivery_address && (
                      <div className="drow" style={{ gridColumn: 'span 2' }}>
                        <div className="k">Full Address</div>
                        <div className="v">{drawerTarget.delivery_address}</div>
                      </div>
                    )}
                    {drawerTarget.landmark && (
                      <div className="drow" style={{ gridColumn: 'span 2' }}>
                        <div className="k">Nearest Landmark</div>
                        <div className="v">{drawerTarget.landmark}</div>
                      </div>
                    )}
                    {isHttpLink(drawerTarget.location_link) && (
                      <div className="drow" style={{ gridColumn: 'span 2' }}>
                        <div className="k">Location Link</div>
                        <div className="v">
                          <a href={drawerTarget.location_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', textDecoration: 'underline' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Open Map Link
                          </a>
                        </div>
                      </div>
                    )}
                    {drawerTarget.delivery_instructions && (
                      <div className="drow" style={{ gridColumn: 'span 2' }}>
                        <div className="k">Instructions</div>
                        <div className="v"><CollapsibleText text={drawerTarget.delivery_instructions} maxLines={3} /></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Notes */}
                {drawerTarget.notes && (
                  <div>
                    <div className="sec-lbl">Customer Notes</div>
                    <div className="note">
                      <CollapsibleText text={drawerTarget.notes} maxLines={3} />
                    </div>
                  </div>
                )}

                {/* Inspiration Image / Attachment (if any) */}
                {drawerTarget.inspiration_path && (
                  <div>
                    <div className="sec-lbl">Inspiration / Attachment</div>
                    <div style={{ marginTop: '6px' }}>
                      {drawerTarget.inspiration_path.startsWith('http') ? (
                        <a href={drawerTarget.inspiration_path} target="_blank" rel="noopener noreferrer">
                          <img
                            src={drawerTarget.inspiration_path}
                            alt="Inspiration"
                            style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(26,26,26,0.1)' }}
                          />
                        </a>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#555' }}>
                          Attachment: <code>{drawerTarget.inspiration_path}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. Quote (show only when exists) */}
                {(drawerTarget.confirmed_quote || (drawerTarget.status !== 'new' && drawerTarget.estimate_high)) && (
                  <div>
                    <div className="sec-lbl">Quote</div>
                    <div className="qty">
                      <span>
                        {drawerTarget.status === 'new'
                          ? 'Quote amount (not sent)'
                          : ['approved', 'converted'].includes(drawerTarget.status)
                            ? 'Confirmed quote'
                            : 'Proposed quote'}
                      </span>
                      <span className="amt">
                        GHS {formatNumber(drawerTarget.confirmed_quote || drawerTarget.estimate_high || 0, 2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 8. Admin note visible to the customer on /track */}
                <div className="field">
                  <label htmlFor="reqDrawerAdminNote" style={{ margin: '0 0 8px', fontWeight: 600 }}>Note from our team (visible on /track)</label>
                  <AutoGrowTextarea
                    id="reqDrawerAdminNote"
                    value={adminNoteDrawerInput}
                    placeholder="Write an update for the customer to see on /track..."
                    onChange={e => {
                      setAdminNoteDrawerInput(e.target.value);
                      setAdminNoteSaveState('idle');
                    }}
                  />
                  <div className="req-drawer-note-save">
                    {adminNoteSaveState === 'saved' && <span role="status">Saved</span>}
                    {adminNoteSaveState === 'failed' && <span role="status">Could not save</span>}
                    <button
                      type="button"
                      className="btn"
                      disabled={adminNoteSaveState === 'saving'}
                      onClick={async () => {
                        setAdminNoteSaveState('saving');
                        try {
                          const res = await updateRequestAdminNoteSync(drawerTarget.id, adminNoteDrawerInput);
                          if (res.success) {
                            setAdminNoteSaveState('saved');
                            showToast('Admin note saved and updated on tracking');
                            reloadFromCache();
                          } else {
                            setAdminNoteSaveState('failed');
                            showToast('Failed to save note');
                          }
                        } catch (error) {
                          console.error('Failed to save request note:', error);
                          setAdminNoteSaveState('failed');
                          showToast('Failed to save note');
                        }
                      }}
                    >
                      {adminNoteSaveState === 'saving' ? 'Saving…' : 'Save Note'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="dfoot req-drawer-action-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                {drawerTarget.status !== 'closed' ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleDeclineOrClose(drawerTarget)}
                    style={{ color: '#b91c1c', borderColor: 'rgba(185,28,28,0.3)', borderRadius: '999px', padding: '8px 20px', fontWeight: 600 }}
                  >
                    Decline / Close
                  </button>
                ) : <div />}
                <button
                  type="button"
                  className="btn p"
                  onClick={() => {
                    let actionType = 'compose-quote';
                    const st = drawerTarget.status;
                    if (st === 'quote_needed') actionType = 'mark-approved';
                    else if (st === 'approved') actionType = 'convert-order';
                    else if (st === 'converted') actionType = 'view-order';
                    else if (st === 'closed') actionType = 'reopen';
                    handleSaveDrawerNoteAndTrigger(actionType);
                  }}
                  style={{ borderRadius: '999px', padding: '8px 22px', fontWeight: 700, border: 'none', background: '#1a1a1a', color: '#fff' }}
                >
                  {drawerTarget.status === 'quote_needed'
                    ? 'Mark Approved'
                    : drawerTarget.status === 'approved'
                      ? 'Convert to Order'
                      : drawerTarget.status === 'converted'
                        ? 'View Converted Order'
                        : drawerTarget.status === 'closed'
                          ? 'Reopen Request'
                          : 'Compose Quote'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Compose Quote Modal — Monolith lines 23874–23938 */}
      {quoteModalReq && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '90%' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>Compose Quote for {quoteModalReq.reference || quoteModalReq.id}</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px 0' }}>Set price quote for {quoteModalReq.customer_name || 'Client'}.</p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '4px' }}>Quote amount (GHS)</label>
              <input
                type="number"
                value={quoteInputVal}
                onChange={e => setQuoteInputVal(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="quote-note" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '4px' }}>Note to customer</label>
              <AutoGrowTextarea
                id="quote-note"
                value={quoteNoteVal}
                onChange={e => setQuoteNoteVal(e.target.value)}
                placeholder="Add a note or special terms..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn" onClick={() => setQuoteModalReq(null)} style={{ padding: '8px 22px', borderRadius: '999px', border: '1px solid rgba(26,26,26,0.15)', background: '#fff', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
              <button type="button" className="btn p" onClick={handleSaveQuote} style={{ padding: '8px 22px', borderRadius: '999px', border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 700 }}>Save Quote</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Prompt Modal — Monolith lines 23906–23936 */}
      {whatsappPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10003, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '90%' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Quote saved.</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              Quote of <strong>GHS {formatNumber(whatsappPrompt.amount, 2)}</strong> has been saved for request {whatsappPrompt.ref}.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  window.open(`https://wa.me/${whatsappPrompt.phoneDigits}?text=${encodeURIComponent(whatsappPrompt.waMessage)}`, '_blank');
                  setWhatsappPrompt(null);
                }}
                style={{ padding: '8px 18px', borderRadius: '999px', border: '1px solid rgba(26,26,26,0.15)', background: '#fff', fontSize: '13px', fontWeight: 500 }}
              >
                Send on WhatsApp
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  navigator.clipboard.writeText(`+${whatsappPrompt.phoneDigits}`);
                }}
                style={{ padding: '8px 18px', borderRadius: '999px', border: '1px solid rgba(26,26,26,0.15)', background: '#fff', fontSize: '13px', fontWeight: 500 }}
              >
                Copy number
              </button>
              <button
                type="button"
                className="btn p"
                onClick={() => setWhatsappPrompt(null)}
                style={{ padding: '8px 22px', borderRadius: '999px', border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 700 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10004, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: confirmModal.isConversionModal ? '500px' : '400px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>{confirmModal.title}</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>{confirmModal.message}</p>

            {confirmModal.isConversionModal && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Delivery address *</label>
                <input
                  id="convert-delivery-address"
                  type="text"
                  required
                  defaultValue={confirmModal.defaultAddress || ''}
                  placeholder="Full delivery address"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', marginBottom: '12px' }}
                />

                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Recipient (optional)</label>
                <input
                  id="convert-recipient"
                  type="text"
                  defaultValue={confirmModal.defaultRecipient}
                  placeholder="Recipient name"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', marginBottom: '12px' }}
                />

                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Landmark (optional)</label>
                <input
                  id="convert-landmark"
                  type="text"
                  defaultValue={confirmModal.defaultCity}
                  placeholder="Nearest landmark"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', marginBottom: '12px' }}
                />

                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Requested delivery date (optional)</label>
                <input
                  id="convert-date"
                  type="date"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', marginBottom: '12px' }}
                />

                <label htmlFor="convert-note" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Note (optional)</label>
                <AutoGrowTextarea
                  id="convert-note"
                  placeholder="Any additional notes"
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn" onClick={() => setConfirmModal(null)} style={{ padding: '8px 22px', borderRadius: '999px', border: '1px solid rgba(26,26,26,0.15)', background: '#fff', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
              <button type="button" className="btn p" onClick={confirmModal.onConfirm} style={{ padding: '8px 22px', borderRadius: '999px', border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 700 }}>{confirmModal.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
