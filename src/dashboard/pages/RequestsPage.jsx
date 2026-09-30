// src/pages/RequestsPage.jsx
// Ported 1-for-1 verbatim from admin-monolith.html renderRequestsView() (lines 23569–24236)
// Storage key: 'xa12_custom_requests'

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, saveOrders } from '../lib/ordersModel';

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

// Motifs SVG helpers — Monolith lines 23550–23567
const bespokeMotifs = [
  <svg key="b0" viewBox="0 0 100 100"><path d="M50 8 L88 30 L88 70 L50 92 L12 70 L12 30 Z"/><path d="M50 8 L50 50 L88 30 M50 50 L12 30 M50 50 L50 92"/></svg>,
  <svg key="b1" viewBox="0 0 100 100"><path d="M50 8 L90 50 L50 92 L10 50 Z"/><path d="M50 8 L50 92 M10 50 L90 50"/></svg>,
  <svg key="b2" viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" rx="4"/><rect x="35" y="35" width="30" height="30" rx="2"/></svg>
];
const serviceMotifs = [
  <svg key="s0" viewBox="0 0 100 100"><circle cx="50" cy="50" r="10"/><circle cx="50" cy="50" r="20"/><circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="40"/></svg>,
  <svg key="s1" viewBox="0 0 100 100"><path d="M50 4 L50 96 M4 50 L96 50 M18 18 L82 82 M82 18 L18 82"/></svg>,
  <svg key="s2" viewBox="0 0 100 100"><circle cx="50" cy="30" r="20"/><circle cx="50" cy="70" r="20"/><circle cx="30" cy="50" r="20"/><circle cx="70" cy="50" r="20"/></svg>
];

function getRequestMotifSvg(req, index) {
  const idx = Math.abs(index || 0) % 3;
  return req.request_type === 'service' ? serviceMotifs[idx] : bespokeMotifs[idx];
}

// Persistence helpers
function loadRequests() {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    return raw ? JSON.parse(raw) : SEED_REQUESTS;
  } catch {
    return SEED_REQUESTS;
  }
}
function saveRequests(arr) {
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(arr));
  } catch {}
}

function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(loadRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all'|'n'|'q'|'a'|'c'|'x'

  // Modal / Drawer state
  const [drawerTarget, setDrawerTarget] = useState(null);
  const [quoteModalReq, setQuoteModalReq] = useState(null);
  const [quoteInputVal, setQuoteInputVal] = useState('');
  const [quoteNoteVal, setQuoteNoteVal] = useState('');
  const [whatsappPrompt, setWhatsappPrompt] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [adminNoteDrawerInput, setAdminNoteDrawerInput] = useState('');

  const saveAndSetRequests = (updated) => {
    saveRequests(updated);
    setRequests(updated);
  };

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
      const name = (r.customer_name || r.client || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const occ = (r.occasion || r.service || '').toLowerCase();
      if (!ref.includes(q) && !name.includes(q) && !phone.includes(q) && !occ.includes(q)) {
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

  function handleSaveQuote() {
    if (!quoteModalReq) return;
    const amount = parseFloat(quoteInputVal);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid quote amount above 0.');
      return;
    }

    const updated = requests.map(r => {
      if (r.id === quoteModalReq.id) {
        return {
          ...r,
          confirmed_quote: amount,
          admin_note: quoteNoteVal,
          status: 'quote_needed',
          quote_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };
      }
      return r;
    });

    saveAndSetRequests(updated);

    const phoneDigits = (quoteModalReq.phone || '').replace(/[^0-9]/g, '');
    const waMessage = `Hello ${quoteModalReq.customer_name || 'Customer'}, this is The Gifting Factory. Your request ${quoteModalReq.reference || quoteModalReq.id} is priced at GHS ${amount.toLocaleString()}.${quoteNoteVal ? ' ' + quoteNoteVal : ''} Reply YES to approve.`;

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
    const amountStr = req.confirmed_quote ? `GHS ${req.confirmed_quote.toLocaleString()}` : 'the agreed quote';
    setConfirmModal({
      title: 'Mark Quote Approved',
      message: `Has ${req.customer_name || 'the customer'} confirmed the price of ${amountStr}?`,
      confirmText: 'Yes, approved',
      onConfirm: () => {
        const updated = requests.map(r => {
          if (r.id === req.id) {
            return {
              ...r,
              status: 'approved',
              approved_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            };
          }
          return r;
        });
        saveAndSetRequests(updated);
        showToast('Approved');
        setConfirmModal(null);
        if (drawerTarget && drawerTarget.id === req.id) {
          setDrawerTarget(null);
        }
      }
    });
  }

  // Convert to Order Flow — Monolith lines 23969–24036
  function handleConvertOrder(req) {
    if (!req.confirmed_quote || req.confirmed_quote <= 0) {
      showToast('Cannot convert request without a confirmed quote amount.');
      return;
    }

    const selItems = (req.selections && req.selections.length) ? req.selections.join(', ') : (req.occasion || 'Custom Gift');
    const totalStr = `GHS ${req.confirmed_quote.toLocaleString()}`;

    setConfirmModal({
      title: 'Convert Request to Order',
      message: `Customer: ${req.customer_name || 'Client'} | Items: ${selItems} | Total: ${totalStr}`,
      confirmText: 'Convert Now',
      onConfirm: () => {
        const orderId = `ORD-${Date.now().toString().slice(-5)}`;
        const orderNum = `GF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const quoteVal = req.confirmed_quote;

        const newOrder = {
          id: orderId,
          orderCode: orderNum,
          customerName: req.customer_name || req.client || 'Client',
          customerPhone: req.phone || '',
          customerEmail: req.email || '',
          amount: quoteVal,
          paymentStatus: 'pending',
          fulfillmentStatus: 'preparing',
          orderDate: new Date().toISOString(),
          source: 'online',
          adminNote: `Custom request ref: ${req.reference || req.id}`,
          items: (req.selections && req.selections.length)
            ? req.selections.map(s => ({ name: s, qty: 1, unitPrice: Math.round(quoteVal / req.selections.length) }))
            : [{ name: `Bespoke Request: ${req.occasion || 'Custom Gift'}`, qty: req.quantity || 1, unitPrice: quoteVal }]
        };

        const existingOrders = getOrders();
        saveOrders([...existingOrders, newOrder]);
        window.dispatchEvent(new CustomEvent('xa12:orders-updated'));

        const updated = requests.map(r => {
          if (r.id === req.id) {
            return {
              ...r,
              status: 'converted',
              converted_at: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              order_id: orderId
            };
          }
          return r;
        });

        saveAndSetRequests(updated);
        showToast(`Order created (${orderNum}).`);
        setConfirmModal(null);
        if (drawerTarget && drawerTarget.id === req.id) {
          setDrawerTarget(null);
        }
      }
    });
  }

  // Reopen Request Flow — Monolith lines 24045–24061
  function handleReopenRequest(req) {
    const restoreStatus = req._prevStatus || 'new';
    const updated = requests.map(r => {
      if (r.id === req.id) {
        return { ...r, status: restoreStatus };
      }
      return r;
    });
    saveAndSetRequests(updated);
    showToast(`Request reopened to ${restoreStatus.replace('_', ' ')}.`);
    if (drawerTarget && drawerTarget.id === req.id) {
      setDrawerTarget(null);
    }
  }

  // Save Drawer Note and Trigger — Monolith lines 23830–23845
  function handleSaveDrawerNoteAndTrigger(actionType) {
    if (!drawerTarget) return;
    const updated = requests.map(r => {
      if (r.id === drawerTarget.id) {
        return { ...r, admin_note: adminNoteDrawerInput };
      }
      return r;
    });
    saveAndSetRequests(updated);
    const currentReq = updated.find(r => r.id === drawerTarget.id) || drawerTarget;

    if (actionType === 'compose-quote') handleOpenComposeQuote(currentReq);
    else if (actionType === 'mark-approved') handleMarkApproved(currentReq);
    else if (actionType === 'convert-order') handleConvertOrder(currentReq);
    else if (actionType === 'view-order') navigate('/orders');
    else if (actionType === 'reopen') handleReopenRequest(currentReq);
  }

  return (
    <div className="page-container">
      {/* Page Header — Monolith lines 23610–23616 */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Custom Requests</h2>
          <p>Track each request from New to Converted.</p>
        </div>
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

          const motifSvg = getRequestMotifSvg(req, idx);
          const amountVal = req.confirmed_quote ? req.confirmed_quote.toLocaleString() : (req.budget || (req.estimate_low ? `${req.estimate_low} - ${req.estimate_high}` : '2,000'));
          const amountLabel = req.confirmed_quote ? 'Quote' : 'Budget';
          const metaCategory = req.occasion || req.service || (req.request_type === 'service' ? 'Service' : 'Bespoke gift');
          const whenText = req.created_at || '2 days ago';

          return (
            <article
              key={req.id}
              className={`card req-card-v3 ${matches ? '' : 'hide'}`}
              data-id={req.id}
              onClick={() => setDrawerTarget(req)}
            >
              <div className="top">
                <span className="ref">{req.reference || req.id}</span>
                <span className="st">{stText}</span>
              </div>
              <div className="motif">{motifSvg}</div>
              <div>
                <div className="name">{req.customer_name || req.client || 'Client'}</div>
                <div className="meta">{metaCategory} · {amountLabel} <b>GHS {String(amountVal)}</b></div>
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

      {/* Request Timeline Drawer Overlay — Monolith lines 23684–23828 */}
      <div
        className={`ov ${drawerTarget ? 'on' : ''}`}
        id="reqDrawerOverlay"
        onClick={e => { if (e.target.id === 'reqDrawerOverlay') setDrawerTarget(null); }}
      >
        {drawerTarget && (
          <div className="drawer" id="reqDrawerContainer">
            {/* Drawer Header */}
            <div className="dhead">
              <div style={{ display: 'flex', gap: '14px' }}>
                <div className="dmotif">
                  {getRequestMotifSvg(drawerTarget, requests.findIndex(r => r.id === drawerTarget.id))}
                </div>
                <div className="dtitle">
                  <h2>{drawerTarget.reference || drawerTarget.id}</h2>
                  <div className="sub">
                    {drawerTarget.customer_name || drawerTarget.client || 'Client'} · {drawerTarget.occasion || drawerTarget.service || 'Request'}
                  </div>
                </div>
              </div>
              <button type="button" className="dclose" onClick={() => setDrawerTarget(null)}>✕</button>
            </div>

            {/* Drawer Body */}
            <div className="dbody">
              {/* Timeline */}
              <div>
                <div className="sec-lbl">Timeline</div>
                <div className="timeline">
                  <div className="tstep">
                    <div className="tdot"><i className="done" /><b className={drawerTarget.status !== 'new' ? 'done' : ''} /></div>
                    <div className="tinfo"><div className="tn">Received</div><div className="td">{drawerTarget.created_at || '22 Sep 2026'}</div></div>
                  </div>
                  <div className="tstep">
                    <div className="tdot"><i className={drawerTarget.status !== 'new' ? 'done' : ''} /><b className={drawerTarget.status === 'approved' || drawerTarget.status === 'converted' ? 'done' : ''} /></div>
                    <div className="tinfo"><div className="tn">Quoted</div><div className="td">{drawerTarget.quote_date || (drawerTarget.confirmed_quote ? 'Quoted' : 'Not yet')}</div></div>
                  </div>
                  <div className="tstep">
                    <div className="tdot"><i className={drawerTarget.status === 'approved' || drawerTarget.status === 'converted' ? 'done' : ''} /><b className={drawerTarget.status === 'converted' ? 'done' : ''} /></div>
                    <div className="tinfo"><div className="tn">Approved</div><div className="td">{drawerTarget.approved_at || (drawerTarget.status === 'approved' || drawerTarget.status === 'converted' ? 'Approved' : 'Not yet')}</div></div>
                  </div>
                  <div className="tstep">
                    <div className="tdot"><i className={drawerTarget.status === 'converted' ? 'done' : ''} /></div>
                    <div className="tinfo"><div className="tn">Converted</div><div className="td">{drawerTarget.converted_at || (drawerTarget.status === 'converted' ? 'Converted' : 'Not yet')}</div></div>
                  </div>
                </div>
              </div>

              {/* Contact Grid */}
              <div>
                <div className="sec-lbl">Contact</div>
                <div className="grid2">
                  {drawerTarget.phone && <div className="drow"><div className="k">Phone</div><div className="v">{drawerTarget.phone}</div></div>}
                  {drawerTarget.email && <div className="drow"><div className="k">Email</div><div className="v">{drawerTarget.email}</div></div>}
                  {drawerTarget.preferred_date && <div className="drow"><div className="k">Needed by</div><div className="v">{drawerTarget.preferred_date}</div></div>}
                  {(drawerTarget.city || drawerTarget.fulfilment) && <div className="drow"><div className="k">Delivery</div><div className="v">{drawerTarget.city || drawerTarget.fulfilment}</div></div>}
                </div>
              </div>

              {/* Selections */}
              {drawerTarget.selections && drawerTarget.selections.length > 0 && (
                <div>
                  <div className="sec-lbl">Selected items</div>
                  <div className="chips">
                    {drawerTarget.selections.map((s, idx) => (
                      <span key={idx} className="chip">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {drawerTarget.notes && (
                <div>
                  <div className="sec-lbl">Notes</div>
                  <div className="note">{drawerTarget.notes}</div>
                </div>
              )}

              {/* Quote */}
              <div>
                <div className="sec-lbl">Quote</div>
                <div className="qty">
                  <span>{drawerTarget.confirmed_quote ? 'Confirmed Quote' : 'Budget mentioned'}</span>
                  <span className="amt">{drawerTarget.confirmed_quote ? `GHS ${drawerTarget.confirmed_quote.toLocaleString()}` : (drawerTarget.budget || 'GHS 2,000')}</span>
                </div>
              </div>

              {/* Admin Note Input */}
              <div className="field">
                <label>Admin note</label>
                <textarea
                  id="reqDrawerAdminNote"
                  rows={2}
                  placeholder="Add a note"
                  value={adminNoteDrawerInput}
                  onChange={e => setAdminNoteDrawerInput(e.target.value)}
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="dfoot">
              <button type="button" className="btn d" onClick={() => setDrawerTarget(null)}>Close</button>
              <button type="button" className="btn" onClick={() => setDrawerTarget(null)}>Cancel</button>
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
              >
                {drawerTarget.status === 'quote_needed' ? 'Mark Approved' : drawerTarget.status === 'approved' ? 'Convert to Order' : drawerTarget.status === 'converted' ? 'View Order' : drawerTarget.status === 'closed' ? 'Reopen' : 'Compose Quote'}
              </button>
            </div>
          </div>
        )}
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
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '4px' }}>Note to customer</label>
              <textarea
                rows={3}
                value={quoteNoteVal}
                onChange={e => setQuoteNoteVal(e.target.value)}
                placeholder="Add a note or special terms..."
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn" onClick={() => setQuoteModalReq(null)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', background: '#fff', fontSize: '13px' }}>Cancel</button>
              <button type="button" className="btn p" onClick={handleSaveQuote} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 600 }}>Save Quote</button>
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
              Quote of <strong>GHS {whatsappPrompt.amount.toLocaleString()}</strong> has been saved for request {whatsappPrompt.ref}.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  window.open(`https://wa.me/${whatsappPrompt.phoneDigits}?text=${encodeURIComponent(whatsappPrompt.waMessage)}`, '_blank');
                  setWhatsappPrompt(null);
                }}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', background: '#fff', fontSize: '13px' }}
              >
                Send on WhatsApp
              </button>
              <button
                type="button"
                className="btn p"
                onClick={() => setWhatsappPrompt(null)}
                style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 600 }}
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
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>{confirmModal.title}</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn" onClick={() => setConfirmModal(null)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', background: '#fff', fontSize: '13px' }}>Cancel</button>
              <button type="button" className="btn p" onClick={confirmModal.onConfirm} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: 600 }}>{confirmModal.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
