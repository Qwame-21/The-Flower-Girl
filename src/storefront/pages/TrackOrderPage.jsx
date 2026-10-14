import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CircleDollarSign, LoaderCircle, PackageCheck, Truck } from 'lucide-react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { hasTrackingApi, trackRecord } from '../api/trackingApi';
import { getSiteSettings, refreshSiteSettings } from '../api/siteFeatures';
import SiteFooter from '../components/SiteFooter';
import { parseDateString, formatDateISO, formatDateDisplay as accraFormatDate, todayAccra, formatTimestampDisplay } from '../../shared/dateUtils';
import { TrackOrderSkeleton, useDelayedLoading } from '../components/Skeleton';

function TrackingIcon({ stage }) {
  if (stage === 'paid') return <CircleDollarSign />;
  if (stage === 'packaging') return <LoaderCircle />;
  if (stage === 'ready') return <PackageCheck />;
  if (stage === 'delivery') return <Truck />;
  return <BadgeCheck />;
}

export default function TrackOrderPage({ onNavigate }) {
  const [prefill] = useState(() => { try { const value = JSON.parse(window.sessionStorage.getItem('gifting-factory-track-prefill') || '{}'); window.sessionStorage.removeItem('gifting-factory-track-prefill'); return value; } catch { return {}; } });
  const [reference, setReference] = useState(prefill.reference || '');
  const [credential, setCredential] = useState(prefill.credential || '');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const showSkeleton = useDelayedLoading(searching, { delay: 150, minDuration: 300 });
  const [trackingData, setTrackingData] = useState(readAdminData);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const resultRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => subscribeAdminData(data => { setTrackingData(data); setResult(current => current ? { ...current, record: (current.kind === 'order' ? data.orders : data.requests).find(record => record.id === current.record.id) || current.record } : current); }), []);
  useEffect(() => { if (result) window.requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }, [result]);

  // Load site settings for auto-refresh config (bypass cache for fresh settings)
  useEffect(() => {
    refreshSiteSettings().then(settings => {
      setSiteSettings(settings);
    });
  }, []);

  // Auto-refresh logic (defaults to enabled, refreshing every 8s unless explicitly disabled in settings)
  useEffect(() => {
    if (!result || siteSettings?.tracking_auto_refresh_enabled === false) {
      return;
    }

    // Stop auto-refresh for terminal statuses
    if (result.kind === 'order' && (result.record.status === 'completed' || result.record.status === 'cancelled')) {
      return;
    }
    if (result.kind === 'request' && result.record.status === 'closed') {
      return;
    }

    // Stop if rate-limited
    if (isRateLimited) {
      return;
    }

    const intervalSeconds = Math.max(3, Math.min(60, siteSettings?.tracking_refresh_interval_seconds || 8));

    const refresh = async () => {
      if (isRefreshingRef.current || document.hidden) {
        return;
      }

      isRefreshingRef.current = true;

      try {
        const { data } = await trackRecord(reference, credential);

        if (data?.kind === 'rate_limited') {
          setIsRateLimited(true);
          isRefreshingRef.current = false;
          return;
        }

        setIsRateLimited(false);

        if (data?.kind === 'order') {
          const eventFields = Object.fromEntries((data.events || []).flatMap(item => [[`${item.stage}At`, item.createdAt], [`${item.stage}Note`, item.note]]));
          setResult({
            kind: 'order',
            record: {
              tracking: data.trackingNumber,
              customer: data.customerName,
              recipient: data.recipientName || data.customerName,
              status: data.status,
              paymentStatus: data.paymentStatus,
              estimatedDelivery: data.estimatedDelivery,
              deliveryType: data.deliveryType,
              deliveryWindow: data.deliveryWindow,
              requestedDeliveryDate: data.requestedDeliveryDate,
              adminNote: data.adminNote,
              createdAt: data.createdAt,
              ...eventFields
            }
          });
        } else if (data?.kind === 'request') {
          setResult({
            kind: 'request',
            record: {
              reference: data.reference,
              shortCode: data.shortCode,
              name: data.customerName,
              requestType: data.requestType,
              service: data.service,
              occasion: data.occasion,
              status: data.status,
              preferredDate: data.preferredDate,
              quoteTotal: data.confirmedQuote,
              adminNote: data.adminNote,
              fulfilment: data.fulfilment,
              budget: data.budget,
              selections: data.selections,
              updatedAt: data.updatedAt,
            }
          });
        }
      } catch {
        // Silently fail refresh - keep last result
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Refresh immediately when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && !isRefreshingRef.current) {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up interval
    refreshTimerRef.current = setInterval(refresh, intervalSeconds * 1000);

    return () => {
      clearInterval(refreshTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isRefreshingRef.current = false;
    };
  }, [result, siteSettings, reference, credential, isRateLimited]);

  const search = async event => {
    event.preventDefault();
    setSearching(true);
    setIsRateLimited(false);
    const value = reference.trim().toLowerCase().replace(/\s+/g, '');
    const contact = credential.trim().toLowerCase();
    const digits = contact.replace(/\D/g, '');
    const normPhone = digits.startsWith('0') ? digits.slice(1) : digits.startsWith('233') ? digits.slice(3) : digits;
    const matchesContact = record => {
      const recordDigits = (record.phone || record.customerPhone || record.customer_phone || '').replace(/\D/g, '');
      const recNorm = recordDigits.startsWith('0') ? recordDigits.slice(1) : recordDigits.startsWith('233') ? recordDigits.slice(3) : recordDigits;
      const email = (record.email || record.customerEmail || record.customer_email || '').toLowerCase();
      const emailMatches = email === contact;
      const phoneMatches = normPhone.length >= 8 && recNorm.length >= 8 && recNorm.slice(-8) === normPhone.slice(-8);
      return emailMatches || phoneMatches;
    };
    const order = trackingData.orders.find(record => {
      const tracking = (record.tracking || record.tracking_number || '').toLowerCase().replace(/\s+/g, '');
      const code = (record.code || record.order_code || '').toLowerCase().replace(/\s+/g, '');
      return (tracking === value || code === value) && matchesContact(record);
    });
    const request = trackingData.requests.find(record => {
      const sc = (record.short_code || record.shortCode || '').toLowerCase().replace(/\s+/g, '');
      const ref = (record.reference || record.id || '').toLowerCase().replace(/\s+/g, '');
      return (sc === value || ref === value) && matchesContact(record);
    });
    let matched = order ? { kind: 'order', record: order } : request ? { kind: 'request', record: request } : null;
    if (hasTrackingApi()) {
      const { data } = await trackRecord(reference, credential);
      if (data?.kind === 'rate_limited') {
        setIsRateLimited(true);
        matched = null;
      } else if (data?.kind === 'order') {
        const eventFields = Object.fromEntries((data.events || []).flatMap(item => [[`${item.stage}At`, item.createdAt], [`${item.stage}Note`, item.note]]));
        matched = { kind: 'order', record: { tracking: data.trackingNumber, customer: data.customerName, recipient: data.recipientName || data.customerName, status: data.status, paymentStatus: data.paymentStatus, estimatedDelivery: data.estimatedDelivery, deliveryType: data.deliveryType, deliveryWindow: data.deliveryWindow, requestedDeliveryDate: data.requestedDeliveryDate, adminNote: data.adminNote, createdAt: data.createdAt, ...eventFields } };
      } else if (data?.kind === 'request') matched = { kind: 'request', record: { reference: data.reference, shortCode: data.shortCode, name: data.customerName, requestType: data.requestType, service: data.service, occasion: data.occasion, status: data.status, preferredDate: data.preferredDate, quoteTotal: data.confirmedQuote, adminNote: data.adminNote, fulfilment: data.fulfilment, budget: data.budget, selections: data.selections, updatedAt: data.updatedAt, createdAt: data.createdAt, receivedAt: data.receivedAt, quotedAt: data.quotedAt, approvedAt: data.approvedAt, convertedAt: data.convertedAt, closedAt: data.closedAt } };
    }
    setResult(matched);
    setSearched(true);
    setSearching(false);
  };

  const labels = { paid: 'Paid', packaging: 'Processing', ready: 'Packed', delivery: 'Dispatched', completed: 'Delivered', pending_payment: 'Awaiting payment' };
  const stages = ['paid', 'packaging', 'ready', 'delivery', 'completed'];
  const order = result?.kind === 'order' ? result.record : null;
  const request = result?.kind === 'request' ? result.record : null;

  // Delivery type and schedule formatting helpers
  const formatDeliveryTypeName = (type) => {
    if (!type) return '';
    const key = type.toLowerCase().trim();
    if (key === 'sameday') return 'Same-day delivery';
    if (key === 'scheduled') return 'Scheduled delivery';
    if (key === 'surprise') return 'Surprise delivery';
    if (key === 'collection') return 'Shop collection';
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatDeliveryWindow = (win) => {
    if (!win) return '';
    const lower = win.toLowerCase().trim();
    if (lower === 'morning') return '9:00 AM – 12:00 PM';
    if (lower === 'afternoon') return '12:00 PM – 4:00 PM';
    if (lower === 'evening') return '4:00 PM – 7:00 PM';
    return win;
  };

  // Build the delivery block data — timezone-safe, using Africa/Accra calendar dates
  const getDeliveryInfo = (ord) => {
    if (!ord) return null;
    const typeName = formatDeliveryTypeName(ord.deliveryType);
    const winLabel = formatDeliveryWindow(ord.deliveryWindow);

    // Customer requested date — parse safely without new Date(string)
    let requestedStr = '';
    if (ord.requestedDeliveryDate) {
      const p = parseDateString(ord.requestedDeliveryDate);
      if (p) requestedStr = accraFormatDate(formatDateISO(p));
    }

    // Admin confirmed date — may be stored as ISO timestamp or YYYY-MM-DD
    let confirmedDateStr = '';
    if (ord.estimatedDelivery) {
      // Try YYYY-MM-DD prefix first
      const match = String(ord.estimatedDelivery).match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) {
        const p = parseDateString(match[1]);
        if (p) confirmedDateStr = accraFormatDate(formatDateISO(p));
      }
    }

    const hasConfirmed = !!(confirmedDateStr);

    return { typeName, requestedStr, confirmedDateStr, winLabel, hasConfirmed };
  };

  const deliveryInfo = order ? getDeliveryInfo(order) : null;

  return <main className="content-page track-page">
    <header className="content-page-heading track-page-heading"><span>ORDER &amp; REQUEST TRACKING</span><h1>Follow your<br />gift.</h1><p>Enter the reference we shared and either the phone number or email used for the request.</p></header>
    <section className="track-workspace">
      <form onSubmit={search}>
        <label>Tracking, order or request number<input value={reference} onChange={event => setReference(event.target.value)} required placeholder="GF-123456 or RQ-123456" /></label>
        <label>Phone number or email<input value={credential} onChange={event => setCredential(event.target.value)} required placeholder="024 000 0000 or you@example.com" /></label>
        <button className="primary-action" disabled={searching}>{searching ? 'CHECKING…' : 'TRACK'}</button>
      </form>
      {showSkeleton && <TrackOrderSkeleton />}
      {!showSkeleton && order && <article ref={resultRef} className="tracking-result content-fade-in">
        <span>{order.tracking}</span>
        <h2>{order.customer}</h2>
        <p>Your order is currently <strong>{labels[order.status] || order.status}</strong>.</p>
        <small className="tracking-auto-refresh-note">Updates automatically</small>
        <div className="tracking-timeline">
          {stages.map(stage => {
            const done = stages.indexOf(stage) <= stages.indexOf(order.status) || (stage === 'paid' && order.paymentStatus === 'paid');
            const current = stage === order.status || (stage === 'paid' && order.status === 'pending_payment');
            
            // Format reached time or provide sensible fallback if order reached this stage
            let timeDisplay = 'Update pending';
            if (order[`${stage}At`]) {
              timeDisplay = formatTimestampDisplay(order[`${stage}At`]);
            } else if (stage === 'packaging' && done && (order.paidAt || order.createdAt)) {
              timeDisplay = formatTimestampDisplay(order.paidAt || order.createdAt);
            } else if (done && !order[`${stage}At`]) {
              timeDisplay = 'Completed';
            }

            return (
              <i key={stage} className={`${done ? 'done' : ''} ${current ? 'is-current' : ''}`}>
                <b><TrackingIcon stage={stage} /></b>
                <div className="tracking-step-info">
                  <span className="tracking-stage-label">{stage === 'paid' && order.paymentStatus !== 'paid' ? 'Awaiting payment' : labels[stage]}</span>
                  <time>{timeDisplay}</time>
                </div>
              </i>
            );
          })}
        </div>
        <section className="track-order-details">
          <p><strong>Recipient:</strong> {order.recipient || order.customer}</p>

          {/* Delivery / note block — clean, no accent bar */}
          <div className="track-team-note-block">
            {/* Row 1: Requested (always shown when delivery type or requested date is known) */}
            {(deliveryInfo?.typeName || deliveryInfo?.requestedStr) && (
              <div className="track-note-row">
                <span className="track-note-label">Requested</span>
                <span className="track-note-value">
                  {[deliveryInfo.typeName, deliveryInfo.requestedStr].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}

            {/* Row 2: Confirmed delivery — shown after admin saves; otherwise show 'will confirm' */}
            <div className="track-note-row">
              <span className="track-note-label">Confirmed delivery</span>
              {deliveryInfo?.hasConfirmed ? (
                <span className="track-note-value">
                  {[deliveryInfo.confirmedDateStr, deliveryInfo.winLabel].filter(Boolean).join(' · ')}
                </span>
              ) : (
                <span className="track-note-value track-note-pending">We will confirm your final delivery time shortly</span>
              )}
            </div>

            {/* Row 3: Message from team — only when admin has written a note */}
            {order.adminNote && (
              <div className="track-note-row">
                <span className="track-note-label">Message</span>
                <span className="track-note-value">{order.adminNote}</span>
              </div>
            )}
          </div>

          <p><strong>Payment:</strong> {order.paymentStatus === 'paid' ? 'Confirmed' : 'Awaiting confirmation'}</p>
        </section>
      </article>}
      {request && <article ref={resultRef} className="tracked-request tracking-result">
        <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{request.shortCode || request.reference || request.id}</span>
        <h2>{request.name || 'Custom request'}</h2>
        <p>Your request is <strong>
          {request.status === 'converted' ? 'now an active order' :
           request.status === 'approved' ? 'approved and ready to be processed' :
           request.status === 'quote_needed' ? 'being reviewed and quoted' :
           request.status === 'closed' ? 'closed' :
           'received and being reviewed'}
        </strong>.</p>
        <small className="tracking-auto-refresh-note">Updates automatically</small>

        {/* Visual Request Timeline — matches order tracking stepper */}
        <div className="tracking-timeline" aria-label="Request progress timeline" style={{ margin: '20px 0' }}>
          {[
            {
              key: 'received', label: 'Received',
              date: request.createdAt || request.received_at, done: true,
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            },
            {
              key: 'quoted', label: 'Quoted',
              date: request.quotedAt || request.quoteDate,
              done: ['quote_needed', 'approved', 'converted'].includes(request.status) || Boolean(request.quoteTotal && request.status !== 'new'),
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            },
            {
              key: 'approved', label: 'Approved',
              date: request.approvedAt,
              done: ['approved', 'converted'].includes(request.status),
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            },
            {
              key: 'converted',
              label: request.status === 'closed' ? 'Closed' : 'Converted',
              date: request.convertedAt || request.closedAt,
              done: request.status === 'converted' || request.status === 'closed',
              icon: request.status === 'closed'
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12H2l9-9 9 9h-3"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>
            }
          ].map((st) => {
            const isCurrent = !st.done && ['new','quote_needed','approved'].includes(request.status) &&
              (['new'].includes(request.status) && st.key === 'received' ||
               ['quote_needed'].includes(request.status) && st.key === 'quoted' ||
               ['approved'].includes(request.status) && st.key === 'approved');
            let timeDisplay = '';
            if (st.date) {
              if (typeof st.date === 'string' && st.date.includes('T')) {
                timeDisplay = formatTimestampDisplay(st.date);
              } else {
                try {
                  const parsed = parseDateString(st.date);
                  timeDisplay = parsed ? accraFormatDate(parsed) : '';
                } catch {}
              }
            }
            return (
              <i key={st.key} className={`${st.done ? 'done' : ''} ${isCurrent ? 'is-current' : ''}`}>
                <b>{st.icon}</b>
                <div className="tracking-step-info">
                  <span className="tracking-stage-label">{st.label}</span>
                  <time>{st.done ? (timeDisplay || 'Completed') : 'Pending'}</time>
                </div>
              </i>
            );
          })}
        </div>

        <section className="track-order-details">
          {(request.occasion || request.service) && (
            <p><strong>{request.service ? 'Service' : 'Occasion'}:</strong> {request.service || request.occasion}</p>
          )}
          {request.preferredDate && (
            <p><strong>Needed by:</strong> {
              typeof request.preferredDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(request.preferredDate)
                ? accraFormatDate(parseDateString(request.preferredDate))
                : request.preferredDate
            }</p>
          )}
          {request.fulfilment && (
            <p><strong>Fulfilment:</strong> {request.fulfilment === 'collection' ? 'Collection from shop' : 'Delivery'}</p>
          )}
          {request.selections && Array.isArray(request.selections) && request.selections.length > 0 && (
            <div style={{ marginTop: '4px', marginBottom: '4px' }}>
              <strong>Selections:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {request.selections.map((item, i) => (
                  <span key={i} style={{ fontSize: '12px', background: 'rgba(26,26,26,0.06)', padding: '3px 10px', borderRadius: '12px' }}>{item}</span>
                ))}
              </div>
            </div>
          )}
          {(request.quoteTotal && request.status !== 'new') ? (
            <p><strong>{['approved', 'converted'].includes(request.status) ? 'Confirmed quote' : 'Quote'}:</strong> GHS {Number(request.quoteTotal).toLocaleString()}</p>
          ) : request.budget ? (
            <p><strong>Budget:</strong> GHS {request.budget}</p>
          ) : null}
          {request.adminNote && (
            <p><strong>Note from our team:</strong> {request.adminNote}</p>
          )}
          {request.status === 'converted' && (
            <p style={{ color: '#059669', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Your request has been converted to a full order. Track it with your order reference.
            </p>
          )}
        </section>
      </article>}
      {searched && !result && <div className="track-empty"><p>{isRateLimited ? 'Too many attempts. Please wait a few minutes and try again.' : 'No record matched those details. Check the reference and contact information, then try again.'}</p><a href={`tel:${String(trackingData.settings.supportPhone || '').replace(/[^+\d]/g, '')}`}>Call {trackingData.settings.supportPhone}</a></div>}
    </section>
    <SiteFooter onNavigate={onNavigate} />
  </main>;
}
