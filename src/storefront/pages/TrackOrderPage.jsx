import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CircleDollarSign, LoaderCircle, PackageCheck, Truck } from 'lucide-react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { hasTrackingApi, trackRecord } from '../api/trackingApi';
import { getSiteSettings, refreshSiteSettings } from '../api/siteFeatures';
import SiteFooter from '../components/SiteFooter';
import { parseDateString, formatDateISO, formatDateDisplay as accraFormatDate, todayAccra } from '../../shared/dateUtils';

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
              name: data.customerName,
              status: data.status,
              service: data.service,
              preferredDate: data.preferredDate,
              quoteTotal: data.confirmedQuote,
              adminNote: data.adminNote
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
    const value = reference.trim().toLowerCase();
    const contact = credential.trim().toLowerCase();
    const digits = contact.replace(/\D/g, '');
    const matchesContact = record => {
      const recordDigits = record.phone?.replace(/\D/g, '') || '';
      return record.email?.toLowerCase() === contact || record.customerEmail?.toLowerCase() === contact || (digits.length >= 9 && recordDigits.length >= 9 && recordDigits.slice(-9) === digits.slice(-9));
    };
    const order = trackingData.orders.find(record => (record.tracking?.toLowerCase() === value || record.code?.toLowerCase() === value) && matchesContact(record));
    const request = trackingData.requests.find(record => (record.reference?.toLowerCase() === value || record.id?.toLowerCase() === value) && matchesContact(record));
    let matched = order ? { kind: 'order', record: order } : request ? { kind: 'request', record: request } : null;
    if (hasTrackingApi()) {
      const { data } = await trackRecord(reference, credential);
      if (data?.kind === 'rate_limited') {
        setIsRateLimited(true);
        matched = null;
      } else if (data?.kind === 'order') {
        const eventFields = Object.fromEntries((data.events || []).flatMap(item => [[`${item.stage}At`, item.createdAt], [`${item.stage}Note`, item.note]]));
        matched = { kind: 'order', record: { tracking: data.trackingNumber, customer: data.customerName, recipient: data.recipientName || data.customerName, status: data.status, paymentStatus: data.paymentStatus, estimatedDelivery: data.estimatedDelivery, deliveryType: data.deliveryType, deliveryWindow: data.deliveryWindow, requestedDeliveryDate: data.requestedDeliveryDate, adminNote: data.adminNote, createdAt: data.createdAt, ...eventFields } };
      } else if (data?.kind === 'request') matched = { kind: 'request', record: { reference: data.reference, name: data.customerName, status: data.status, service: data.service, preferredDate: data.preferredDate, quoteTotal: data.confirmedQuote, adminNote: data.adminNote } };
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
      {order && <article ref={resultRef} className="tracking-result">
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
              try {
                timeDisplay = new Date(order[`${stage}At`]).toLocaleString('en-GH', { timeZone: 'Africa/Accra', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              } catch (e) {
                timeDisplay = String(order[`${stage}At`]);
              }
            } else if (stage === 'packaging' && done && (order.paidAt || order.createdAt)) {
              try {
                timeDisplay = new Date(order.paidAt || order.createdAt).toLocaleString('en-GH', { timeZone: 'Africa/Accra', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              } catch (e) {
                timeDisplay = 'Processing';
              }
            } else if (done && !order[`${stage}At`]) {
              timeDisplay = 'Completed';
            }

            return (
              <i key={stage} className={`${done ? 'done' : ''} ${current ? 'is-current' : ''}`}>
                <b><TrackingIcon stage={stage} /></b>
                <span className="tracking-stage-label">{stage === 'paid' && order.paymentStatus !== 'paid' ? 'Awaiting payment' : labels[stage]}</span>
                <time>{timeDisplay}</time>
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
      {request && <article ref={resultRef} className="tracked-request tracking-result"><span>{request.reference || request.id}</span><h2>{request.name || 'Custom request'}</h2><p>Your request is <strong>{request.status === 'converted' ? 'now an order' : request.status === 'approved' ? 'approved' : request.status === 'quote_needed' ? 'being quoted' : 'received'}</strong>.</p><small className="tracking-auto-refresh-note">Updates automatically</small><section className="track-order-details"><p><strong>Service:</strong> {request.service || request.selections?.join(', ') || 'Bespoke gift'}</p><p><strong>Preferred date:</strong> {request.preferredDate || 'To confirm'}</p>{request.quoteTotal && <p><strong>Confirmed quote:</strong> GHS {Number(request.quoteTotal).toLocaleString()}</p>}<p><strong>Latest update:</strong> {request.adminNote || 'The team will contact you as the request progresses.'}</p></section></article>}
      {searched && !result && <div className="track-empty"><p>{isRateLimited ? 'Too many attempts. Please wait a few minutes and try again.' : 'No record matched those details. Check the reference and contact information, then try again.'}</p><a href={`tel:${String(trackingData.settings.supportPhone || '').replace(/[^+\d]/g, '')}`}>Call {trackingData.settings.supportPhone}</a></div>}
    </section>
    <SiteFooter onNavigate={onNavigate} />
  </main>;
}
