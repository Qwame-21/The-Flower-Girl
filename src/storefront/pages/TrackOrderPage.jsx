import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CircleDollarSign, LoaderCircle, PackageCheck, Truck } from 'lucide-react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { hasTrackingApi, trackRecord } from '../api/trackingApi';
import { refreshSiteSettings } from '../api/siteFeatures';
import SiteFooter from '../components/SiteFooter';
import { parseDateString, formatDateISO, formatDateDisplay as accraFormatDate, formatTimestampDisplay } from '../../shared/dateUtils';
import {
  findTrackedRecord,
  getOrderCustomerFields,
  getRequestCustomerFields,
  mapTrackedRecord,
  mergeTrackedResult,
} from '../../shared/trackingFields';
import { TrackOrderSkeleton, useDelayedLoading } from '../components/Skeleton';

function TrackingIcon({ stage }) {
  if (stage === 'paid') return <CircleDollarSign />;
  if (stage === 'packaging') return <LoaderCircle />;
  if (stage === 'ready') return <PackageCheck />;
  if (stage === 'delivery') return <Truck />;
  return <BadgeCheck />;
}

function CollapsibleTextBlock({ id, label, text }) {
  const [expanded, setExpanded] = useState(false);
  const [canClamp, setCanClamp] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!expanded) {
        setCanClamp(el.scrollHeight > el.clientHeight + 2);
      }
    };

    checkOverflow();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(checkOverflow);
      ro.observe(el);
    }

    return () => ro?.disconnect();
  }, [text, expanded]);

  return (
    <div className="track-text-block">
      <div className="track-text-heading">
        <span className="track-text-label">{label}</span>
      </div>
      <div
        ref={textRef}
        id={`block-${id}`}
        className={`track-text-content ${expanded ? 'is-expanded' : 'is-clamped'}`}
      >
        {text}
      </div>
      {canClamp && (
        <button
          type="button"
          className="track-read-more-btn"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          aria-controls={`block-${id}`}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

function TrackDetail({ label, value, children }) {
  if (!children && (value === null || value === undefined || value === '')) return null;
  return (
    <div className="track-detail-item">
      <span className="track-detail-label">{label}</span>
      <span className="track-detail-value">{children || value}</span>
    </div>
  );
}

function TrackLongDetail({ id, label, text }) {
  if (!text) return null;
  return (
    <div className="track-long-detail">
      <CollapsibleTextBlock id={id} label={label} text={text} />
    </div>
  );
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
  const [lookupError, setLookupError] = useState('');
  const resultRef = useRef(null);
  const errorRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const scrolledSubmissionRef = useRef(0);
  const submissionIdRef = useRef(0);
  const [scrollSubmission, setScrollSubmission] = useState(null);

  useEffect(() => subscribeAdminData(data => {
    setTrackingData(data);
    setResult(current => {
      const updated = findTrackedRecord(current?.kind === 'order' ? data.orders : data.requests, current);
      return updated
        ? mergeTrackedResult(current, mapTrackedRecord({ kind: current.kind, ...updated }))
        : current;
    });
  }), []);
  useEffect(() => {
    if (!scrollSubmission || scrolledSubmissionRef.current === scrollSubmission.id) return undefined;
    let cancelled = false;
    const target = scrollSubmission.hasResult ? resultRef.current : errorRef.current;
    if (!target) return undefined;

    const settleAndScroll = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.allSettled(
        [...target.querySelectorAll('img')].map(image => image.decode?.())
      );
      const finiteAnimations = target.getAnimations()
        .filter(animation => animation.effect?.getTiming().iterations !== Infinity);
      await Promise.allSettled(finiteAnimations.map(animation => animation.finished));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (cancelled) return;

      const header = document.querySelector('.portfolio-header');
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let scrollContainer = target.parentElement;
      while (scrollContainer && scrollContainer !== document.body) {
        const overflowY = getComputedStyle(scrollContainer).overflowY;
        if (['auto', 'scroll'].includes(overflowY) && scrollContainer.scrollHeight > scrollContainer.clientHeight) break;
        scrollContainer = scrollContainer.parentElement;
      }

      scrolledSubmissionRef.current = scrollSubmission.id;
      if (scrollContainer && scrollContainer !== document.body) {
        const top = Math.max(
          0,
          scrollContainer.scrollTop + target.getBoundingClientRect().top - headerBottom - 20
        );
        scrollContainer.scrollTo({ top, behavior: reduceMotion ? 'instant' : 'smooth' });
      } else {
        const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerBottom - 20);
        window.scrollTo({ top, behavior: reduceMotion ? 'instant' : 'smooth' });
      }
    };

    settleAndScroll().catch(error => {
      console.error('Could not scroll to tracking result:', error);
    });
    return () => { cancelled = true; };
  }, [scrollSubmission, showSkeleton]);

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

        const incoming = mapTrackedRecord(data);
        if (incoming) setResult(current => mergeTrackedResult(current, incoming));
      } catch (error) {
        console.warn('Track refresh failed; retaining the last result:', error);
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
    const submissionId = ++submissionIdRef.current;
    setSearching(true);
    setIsRateLimited(false);
    setLookupError('');
    setResult(null);
    setSearched(false);
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
    try {
      if (hasTrackingApi()) {
        const { data } = await trackRecord(reference, credential);
        if (data?.kind === 'rate_limited') {
          setIsRateLimited(true);
          matched = null;
        } else if (data?.kind === 'order' || data?.kind === 'request') {
          matched = mapTrackedRecord(data);
        }
      }
      setResult(matched);
    } catch (error) {
      console.error('Track lookup failed:', error);
      matched = null;
      setResult(null);
      setLookupError('We could not check those details. Please try again.');
    } finally {
      setSearched(true);
      setSearching(false);
      setScrollSubmission({ id: submissionId, hasResult: Boolean(matched) });
    }
  };

  const labels = { paid: 'Paid', packaging: 'Processing', ready: 'Packed', delivery: 'Dispatched', completed: 'Delivered', pending_payment: 'Awaiting payment' };
  const stages = ['paid', 'packaging', 'ready', 'delivery', 'completed'];
  const order = result?.kind === 'order' ? result.record : null;
  const request = result?.kind === 'request' ? result.record : null;
  const orderCustomerFields = order ? getOrderCustomerFields(order) : null;
  const requestCustomerFields = request ? getRequestCustomerFields(request) : null;

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

    let requestedStr = '';
    if (ord.requestedDeliveryDate) {
      const p = parseDateString(ord.requestedDeliveryDate);
      if (p) requestedStr = accraFormatDate(formatDateISO(p));
    }

    let confirmedDateStr = '';
    if (ord.estimatedDelivery) {
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
        <div className="track-header-section">
          <span>{order.tracking}</span>
          <h2>{order.customer}</h2>
          <p>Your order is currently <strong>{labels[order.status] || order.status}</strong>.</p>
          <small className="tracking-auto-refresh-note">Updates automatically</small>
        </div>
        <div className="track-timeline-section">
          <div className="tracking-timeline">
            {stages.map(stage => {
              const done = stages.indexOf(stage) <= stages.indexOf(order.status) || (stage === 'paid' && order.paymentStatus === 'paid');
              const current = stage === order.status || (stage === 'paid' && order.status === 'pending_payment');

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
        </div>
        <section className="track-order-details">
          <div className="track-details-grid">
            <TrackDetail label="Payment" value={order.paymentStatus === 'paid' ? 'Confirmed' : 'Awaiting confirmation'} />
          </div>

          <section className="track-customer-section">
            <div className="track-details-grid">
              <TrackDetail label="Recipient" value={order.recipient} />
              <TrackDetail label="Your phone" value={order.customerPhone || order.customer_phone} />
              <TrackDetail label="Your email" value={order.customerEmail || order.customer_email} />
              <TrackDetail label="Recipient phone" value={order.recipientPhone || order.recipient_phone} />
              <TrackDetail label="Delivery or collection" value={deliveryInfo?.typeName} />
              <TrackDetail label="Delivery fee" value={order.deliveryFee != null ? `GHS ${Number(order.deliveryFee).toLocaleString()}` : ''} />
              <TrackDetail label="Requested date" value={deliveryInfo?.requestedStr} />
              <TrackDetail
                label="Confirmed date and time"
                value={deliveryInfo?.hasConfirmed ? [deliveryInfo.confirmedDateStr, deliveryInfo.winLabel].filter(Boolean).join(' · ') : ''}
              />
              {(order.locationLink || order.location_link) && /^https?:\/\//i.test(order.locationLink || order.location_link) && (
                <TrackDetail label="Map link">
                  <a href={order.locationLink || order.location_link} target="_blank" rel="noreferrer">Open delivery location</a>
                </TrackDetail>
              )}
            </div>
            <div className="track-long-details">
              <TrackLongDetail id="order-address" label="Delivery address" text={order.deliveryAddress || order.delivery_address} />
              <TrackLongDetail id="order-landmark" label="Nearest landmark" text={order.landmark} />
            </div>
            {(orderCustomerFields.deliveryInstructions || orderCustomerFields.giftMessage || orderCustomerFields.cardStyle) && (
              <div className="track-blocks-container">
                {orderCustomerFields.deliveryInstructions && (
                  <CollapsibleTextBlock id="order-instructions" label="Delivery instructions" text={orderCustomerFields.deliveryInstructions} />
                )}
                {orderCustomerFields.giftMessage && (
                  <CollapsibleTextBlock id="order-gift-message" label="Gift message" text={orderCustomerFields.giftMessage} />
                )}
                {orderCustomerFields.cardStyle && (
                  <CollapsibleTextBlock id="order-card-style" label="Card style" text={orderCustomerFields.cardStyle} />
                )}
              </div>
            )}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <div className="track-long-details">
                <TrackLongDetail
                  id="order-items"
                  label="Items"
                  text={order.items.map(item => `${item.name || item.item_name}${Number(item.quantity) > 1 ? ` × ${item.quantity}` : ''}`).join('\n')}
                />
              </div>
            )}
            {Array.isArray(order.customizationSelections) && order.customizationSelections.length > 0 && (
              <div className="track-long-details">
                <TrackLongDetail id="order-selections" label="Custom selections" text={order.customizationSelections.join(' · ')} />
              </div>
            )}
          </section>

          {orderCustomerFields.staffNote && (
            <div className="track-team-note">
              <CollapsibleTextBlock id="order-team-note" label="Note from our team" text={orderCustomerFields.staffNote} />
            </div>
          )}
        </section>
      </article>}
      {request && <article ref={resultRef} className="tracked-request tracking-result">
        <div className="track-header-section">
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
        </div>

        {/* Visual Request Timeline — matches order tracking stepper */}
        <div className="track-timeline-section">
          <div className="tracking-timeline" aria-label="Request progress timeline">
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
              const currentStage = ['converted', 'closed'].includes(request.status)
                ? 'converted'
                : request.status === 'approved'
                  ? 'approved'
                  : request.status === 'quote_needed'
                    ? 'quoted'
                    : 'received';
              const isCurrent = st.key === currentStage;
              let timeDisplay = '';
              if (st.date) {
                if (typeof st.date === 'string' && st.date.includes('T')) {
                  timeDisplay = formatTimestampDisplay(st.date);
                } else {
                  const parsed = parseDateString(st.date);
                  timeDisplay = parsed ? accraFormatDate(parsed) : '';
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
        </div>

        <section className="track-order-details">
          {(request.quoteTotal && request.status !== 'new') && (
            <div className="track-details-grid">
              <TrackDetail
                label={['approved', 'converted'].includes(request.status) ? 'Confirmed quote' : 'Quote'}
                value={`GHS ${Number(request.quoteTotal).toLocaleString()}`}
              />
            </div>
          )}
          <section className="track-customer-section">
            <div className="track-details-grid">
              <TrackDetail label="Occasion" value={request.occasion} />
              <TrackDetail label="Service" value={request.service} />
              <TrackDetail label="Your phone" value={request.customerPhone || request.phone} />
              <TrackDetail label="Your email" value={request.customerEmail || request.email} />
              <TrackDetail label="Recipient" value={request.recipient} />
              <TrackDetail label="Recipient phone" value={request.recipientPhone || request.recipient_phone} />
              <TrackDetail label="Delivery or collection" value={(request.fulfilment || request.deliveryType) === 'collection' ? 'Collection from shop' : (request.fulfilment || request.deliveryType) ? 'Delivery' : ''} />
              <TrackDetail label="Area" value={request.city} />
              <TrackDetail label="Delivery fee" value={request.deliveryFee !== null && request.deliveryFee !== undefined ? `GHS ${Number(request.deliveryFee).toLocaleString()}` : ''} />
              <TrackDetail label="Delivery time window" value={request.deliveryWindow} />
              {(request.locationLink || request.location_link) && /^https?:\/\//i.test(request.locationLink || request.location_link) && (
                <TrackDetail label="Map link">
                  <a href={request.locationLink || request.location_link} target="_blank" rel="noreferrer">Open delivery location</a>
                </TrackDetail>
              )}
              <TrackDetail
                label="Requested date"
                value={request.preferredDate && /^\d{4}-\d{2}-\d{2}/.test(request.preferredDate)
                  ? accraFormatDate(parseDateString(request.preferredDate))
                  : request.preferredDate}
              />
              <TrackDetail label="Quantity" value={request.quantity ? `${request.quantity} gift${Number(request.quantity) === 1 ? '' : 's'}` : ''} />
              <TrackDetail label="Budget" value={request.budget ? `GHS ${String(request.budget).replace(/^GHS\s*/i, '')}` : ''} />
            </div>
            <div className="track-long-details">
              <TrackLongDetail id="request-address" label="Delivery address" text={request.deliveryAddress || request.delivery_address} />
              <TrackLongDetail id="request-landmark" label="Nearest landmark" text={request.landmark} />
              {Array.isArray(request.selections) && request.selections.length > 0 && (
                <TrackLongDetail id="request-selections" label="Selections" text={request.selections.join(' · ')} />
              )}
            </div>
            {(requestCustomerFields.notes || requestCustomerFields.deliveryInstructions || requestCustomerFields.cardMessage || requestCustomerFields.cardStyle) && (
              <div className="track-blocks-container">
                {requestCustomerFields.notes && (
                  <CollapsibleTextBlock id="request-notes" label="Your notes" text={requestCustomerFields.notes} />
                )}
                {requestCustomerFields.deliveryInstructions && (
                  <CollapsibleTextBlock id="request-delivery-instructions" label="Delivery instructions" text={requestCustomerFields.deliveryInstructions} />
                )}
                {requestCustomerFields.cardMessage && (
                  <CollapsibleTextBlock id="request-card-message" label="Card message" text={requestCustomerFields.cardMessage} />
                )}
                {requestCustomerFields.cardStyle && (
                  <CollapsibleTextBlock id="request-card-style" label="Lettering style" text={requestCustomerFields.cardStyle} />
                )}
              </div>
            )}
          </section>
          {request.staffNote && (
            <div className="track-team-note">
              <CollapsibleTextBlock id="request-team-note" label="Note from our team" text={request.staffNote} />
            </div>
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
      {searched && !result && <div ref={errorRef} className="track-empty"><p>{lookupError || (isRateLimited ? 'Too many attempts. Please wait a few minutes and try again.' : 'No record matched those details. Check the reference and contact information, then try again.')}</p><a href={`tel:${String(trackingData.settings.supportPhone || '').replace(/[^+\d]/g, '')}`}>Call {trackingData.settings.supportPhone}</a></div>}
    </section>
    <SiteFooter onNavigate={onNavigate} />
  </main>;
}
