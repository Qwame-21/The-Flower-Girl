import { useState, useEffect, useMemo, useRef, useCallback, useReducer } from 'react';
import { submitInquiry } from '../api/submissions';
import { fetchStorefrontCustomization, getCachedCustomization } from '../data/customization';
import { supabase } from '../../config/supabase';
import { formDate, formIsoDate } from '../utils/date';
import CardStylePicker from '../components/CardStylePicker';
import DateField from '../components/DateField';
import QuantityControl from '../components/QuantityControl';
import SiteFooter from '../components/SiteFooter';
import PhoneInput from '../components/PhoneInput';
import RequestDeliveryFields from '../components/RequestDeliveryFields';
import RequestConfirmation from '../components/RequestConfirmation';
import ShuffleCardStack from '../components/ShuffleCardStack';
import { requestDeliveryDetails } from '../utils/request';
import { CUSTOMIZATION_SYNC_CHANNEL } from '../../shared/customizationSync';

const DRAFT_STORAGE_KEY = 'fg_customize_form_draft_v2';
const SCROLL_STORAGE_KEY = 'fg_customize_scroll_pos';
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const INITIAL_STATE = {
  selected: [],
  quantity: 1,
  fields: {
    cardMessage: '',
    cardStyleNotes: 'calligraphy',
    note: '',
    name: '',
    email: '',
    occasion: '',
    phone: '',
    'phone-number': '',
    'phone-code': '+233',
    'custom-day': '',
    'custom-month': '',
    'custom-year': '',
    fulfilment: 'delivery',
    recipient: '',
    recipientPhone: '',
    'recipientPhone-number': '',
    'recipientPhone-code': '+233',
    address: '',
    addressLine2: '',
    city: '',
    region: '',
    country: 'Ghana',
    postalCode: '',
    landmark: '',
    locationLink: '',
    deliveryInstructions: '',
    budget: '',
  },
  notice: ''
};

function isSingleSelectGroup(groupName) {
  const norm = (groupName || '').toLowerCase().trim();
  return norm.includes('base') || norm.includes('choose a base');
}

function loadSavedDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.savedAt && (Date.now() - parsed.savedAt > DRAFT_EXPIRY_MS)) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }
    const validated = {
      ...INITIAL_STATE,
      fields: { ...INITIAL_STATE.fields }
    };
    if (Array.isArray(parsed.selected)) {
      validated.selected = parsed.selected.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof parsed.quantity === 'number' && parsed.quantity >= 1) {
      validated.quantity = Math.floor(parsed.quantity);
    }
    if (parsed.fields && typeof parsed.fields === 'object') {
      validated.fields = { ...validated.fields, ...parsed.fields };
    }
    return validated;
  } catch {
    return null;
  }
}

function formReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_OPTION': {
      const { group, option, groupOptions } = action;
      const isSingle = isSingleSelectGroup(group);
      let nextSelected;
      if (isSingle) {
        if (state.selected.includes(option)) {
          nextSelected = state.selected.filter(x => x !== option);
        } else {
          nextSelected = state.selected.filter(x => !groupOptions.includes(x)).concat(option);
        }
      } else {
        if (state.selected.includes(option)) {
          nextSelected = state.selected.filter(x => x !== option);
        } else {
          nextSelected = [...state.selected, option];
        }
      }
      return { ...state, selected: nextSelected };
    }
    case 'SET_QUANTITY': {
      const qty = typeof action.quantity === 'function' ? action.quantity(state.quantity) : action.quantity;
      return { ...state, quantity: Math.max(1, qty || 1) };
    }
    case 'SET_FIELD': {
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.name]: action.value
        }
      };
    }
    case 'VALIDATE_SELECTIONS': {
      const { validOptions } = action;
      if (!validOptions) return state;
      const filtered = state.selected.filter(opt => validOptions.has(opt));
      if (filtered.length !== state.selected.length) {
        return {
          ...state,
          selected: filtered,
          notice: 'Some choices are no longer available and were removed from your estimate.'
        };
      }
      return state;
    }
    case 'DISMISS_NOTICE': {
      return { ...state, notice: '' };
    }
    case 'RESET': {
      return { ...INITIAL_STATE };
    }
    default:
      return state;
  }
}

export default function CustomizePage({ onNavigate }) {
  const formRef = useRef(null);
  const [activeGroupHint, setActiveGroupHint] = useState(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 900px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 900px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const [state, dispatch] = useReducer(formReducer, undefined, () => loadSavedDraft() || INITIAL_STATE);
  const [sent, setSent] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customOptions, setCustomOptions] = useState(() => {
    const cached = getCachedCustomization();
    return cached ? cached.options : {};
  });
  const [customEstimates, setCustomEstimates] = useState(() => {
    const cached = getCachedCustomization();
    return cached ? cached.estimates : {};
  });
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(() => {
    const cached = getCachedCustomization();
    return !cached || Object.keys(cached.options || {}).length === 0;
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const hasLoadedOptionsRef = useRef(false);
  const customOptionsRef = useRef(customOptions);
  customOptionsRef.current = customOptions;

  // Refresh options from Supabase and listen for cross-tab visibility changes.
  useEffect(() => {
    let isMounted = true;
    let requestInProgress = false;

    function loadOptions() {
      if (requestInProgress) return;
      requestInProgress = true;
      fetchStorefrontCustomization()
        .then(({ options, estimates }) => {
          if (!isMounted) return;
          hasLoadedOptionsRef.current = true;
          setCustomOptions(options);
          setCustomEstimates(estimates);
          setLoading(false);
        })
        .catch(err => {
          if (!isMounted) return;
          setLoading(false);
          if (!customOptionsRef.current || Object.keys(customOptionsRef.current).length === 0) {
            setFetchError(err.message || 'Failed to load customization options.');
          }
        })
        .finally(() => {
          requestInProgress = false;
        });
    }

    loadOptions();

    let channel = null;
    if (supabase) {
      channel = supabase
        .channel(CUSTOMIZATION_SYNC_CHANNEL)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customization_options' }, () => {
          loadOptions();
        })
        .subscribe((status, error) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('Customization realtime subscription unavailable; polling remains active.', error);
          }
        });
    }

    const broadcastChannel = typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel(CUSTOMIZATION_SYNC_CHANNEL);
    if (broadcastChannel) {
      broadcastChannel.onmessage = ({ data }) => {
        if (!isMounted || !data?.options || !data?.estimates) return;
        hasLoadedOptionsRef.current = true;
        setCustomOptions(data.options);
        setCustomEstimates(data.estimates);
        setLoading(false);
        setFetchError('');
      };
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadOptions();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const poll = window.setInterval(refreshWhenVisible, 12_000);

    return () => {
      isMounted = false;
      window.clearInterval(poll);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      broadcastChannel?.close();
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedOptionsRef.current) return;
    dispatch({
      type: 'VALIDATE_SELECTIONS',
      validOptions: new Set(Object.values(customOptions).flat())
    });
  }, [customOptions]);

  // Restore scroll position
  useEffect(() => {
    try {
      const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (savedScroll) {
        const y = parseInt(savedScroll, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: 'instant' });
          });
        }
      }
    } catch {}
  }, []);

  // Track scroll position
  useEffect(() => {
    let scrollTimer;
    const onScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        try {
          sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
        } catch {}
      }, 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Debounced auto-save to localStorage
  const flushDraft = useCallback(() => {
    try {
      if (!stateRef.current) return;
      const payload = {
        selected: stateRef.current.selected,
        quantity: stateRef.current.quantity,
        fields: stateRef.current.fields,
        savedAt: Date.now()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(flushDraft, 300);
    return () => clearTimeout(timer);
  }, [state, flushDraft]);

  // Flush draft immediately on visibility change (switching tabs) or pagehide
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushDraft();
      }
    };
    const onPageHide = () => {
      flushDraft();
    };
    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [flushDraft]);

  // Chip click handler
  const handleToggle = useCallback((group, option, groupOptions, groupIndex) => {
    dispatch({ type: 'TOGGLE_OPTION', group, option, groupOptions });
    if (groupIndex !== undefined) {
      setActiveGroupHint(groupIndex);
    }
  }, []);

  // Track field changes across the form
  const handleFormChange = useCallback((e) => {
    const target = e.target;
    if (!target || !target.name) return;
    if (target.closest('.custom-option-group')) return;
    dispatch({ type: 'SET_FIELD', name: target.name, value: target.value });
  }, []);

  // Live estimate calculation
  const unitEstimate = useMemo(() => {
    return state.selected.reduce((sum, option) => sum + (customEstimates[option] || 0), 0);
  }, [state.selected, customEstimates]);

  const estimateLow = useMemo(() => unitEstimate * state.quantity, [unitEstimate, state.quantity]);
  const estimateHigh = useMemo(() => Math.ceil(estimateLow * 1.12 / 10) * 10, [estimateLow]);

  // Submit handler
  const submit = async event => {
    event.preventDefault();
    if (submitting || sent) return;
    setSubmitting(true);
    setError('');
    try {
      const data = new FormData(event.currentTarget);
      const record = {
        ...requestDeliveryDetails(data),
        service: 'Custom gift',
        email: data.get('email') || state.fields.email,
        occasion: data.get('occasion') || state.fields.occasion,
        date: formIsoDate(data, 'custom'),
        name: data.get('name') || state.fields.name,
        phone: data.get('phone') || state.fields.phone,
        note: data.get('note') || state.fields.note,
        cardMessage: data.get('cardMessage') || state.fields.cardMessage,
        cardStyleNotes: data.get('cardStyleNotes') || state.fields.cardStyleNotes,
        preferredDate: formDate(data, 'custom'),
        estimateLow,
        estimateHigh,
        selections: state.selected,
        quantity: state.quantity,
        status: 'new'
      };
      const result = await submitInquiry('request', record, null, submissionId);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      } catch {}
      setSent({ ...record, ...result });
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="content-page customize-page">
      <div className="custom-builder">
        {loading && Object.keys(customOptions).length === 0 ? (
          <p className="loading-state">Loading customization options…</p>
        ) : fetchError && Object.keys(customOptions).length === 0 ? (
          <div className="error-banner" role="alert">
            <p>Unable to load options: {fetchError}</p>
            <button type="button" className="secondary-action" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : sent ? (
          <div className="custom-confirmation-container" style={{ width: '100%' }}>
            <RequestConfirmation request={sent} onNavigate={onNavigate} />
          </div>
        ) : (
          <form ref={formRef} onSubmit={submit} onChange={handleFormChange}>
            {isMobile && (
              <div className="mobile-shuffle-wrapper">
                <ShuffleCardStack activeGroupHint={activeGroupHint} />
              </div>
            )}
            <div className="builder-header">
              <h1 className="builder-heading">
                Build your request
              </h1>
            </div>

            {state.notice && (
              <div role="status" style={{ padding: '7px 10px', background: 'rgba(26,26,26,0.04)', color: '#666', borderRadius: '4px', fontSize: '11px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{state.notice}</span>
                <button type="button" onClick={() => dispatch({ type: 'DISMISS_NOTICE' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#92400e' }}>✕</button>
              </div>
            )}

            {Object.entries(customOptions)
              .filter(([_, options]) => Array.isArray(options) && options.length > 0)
              .map(([group, options], groupIndex) => {
              const isSingle = isSingleSelectGroup(group);
              return (
                <fieldset className="custom-option-group" key={group}>
                  <legend>
                    <span>{String(groupIndex + 1).padStart(2, '0')}</span>
                    {group}
                    {isSingle && <small style={{ fontWeight: 400, marginLeft: '6px', opacity: 0.7 }}>(choose one)</small>}
                  </legend>
                  <div>
                    {options.map(option => {
                      const isSelected = state.selected.includes(option);
                      return (
                        <label
                          key={option}
                          className={`custom-chip ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(group, option, options, groupIndex)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={option}
                          />
                          <span className="chip-label">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}

            <section className="builder-card-message">
              <span>CARD MESSAGE &amp; DESIGN</span>
              <p>Select “Card message &amp; design” above when you want either a printed message or a custom card. Then enter the exact wording and choose its lettering below.</p>
              <label>Message for the card <small>(optional)</small>
                <textarea
                  name="cardMessage"
                  rows="3"
                  defaultValue={state.fields.cardMessage || ''}
                  placeholder="Write the message exactly as it should appear"
                />
              </label>
              <CardStylePicker defaultValue={state.fields.cardStyleNotes || 'calligraphy'} />
            </section>

            <label className="custom-note">
              Gift notes and instructions
              <textarea
                name="note"
                required
                rows="5"
                defaultValue={state.fields.note || ''}
                placeholder="Tell us the occasion, recipient, preferred colours, budget, presentation ideas or anything the team should know"
              />
            </label>

            <div className="custom-contact">
              <label>Name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  defaultValue={state.fields.name || ''}
                />
              </label>
              <label>Email address
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={state.fields.email || ''}
                />
              </label>
              <label>Occasion
                <input
                  name="occasion"
                  required
                  defaultValue={state.fields.occasion || ''}
                />
              </label>
              <PhoneInput
                label="WhatsApp number"
                name="phone"
                required
                defaultValue={state.fields['phone-number'] || state.fields.phone || ''}
              />
              <DateField
                label="Preferred date"
                prefix="custom"
                defaultValue={{
                  day: state.fields['custom-day'],
                  month: state.fields['custom-month'],
                  year: state.fields['custom-year']
                }}
              />
            </div>

            <RequestDeliveryFields defaultValues={state.fields} />

            <div className="custom-quantity">
              <span>NUMBER OF IDENTICAL GIFTS</span>
              <QuantityControl
                value={state.quantity}
                label="custom gifts"
                onDecrease={() => dispatch({ type: 'SET_QUANTITY', quantity: q => Math.max(1, q - 1) })}
                onIncrease={() => dispatch({ type: 'SET_QUANTITY', quantity: q => q + 1 })}
              />
            </div>

            <input type="hidden" name="custom-quantity" value={state.quantity} />

            <button
              className="primary-action"
              type="submit"
              disabled={submitting || Boolean(sent)}
              style={{ minHeight: '44px' }}
            >
              {submitting ? 'SUBMITTING…' : sent ? 'REQUEST SAVED' : `SAVE ${state.quantity > 1 ? `${state.quantity} ` : ''}CUSTOM REQUEST${state.quantity > 1 ? 'S' : ''}`}
            </button>
            {error && <p role="alert" style={{ color: '#b91c1c', marginTop: '12px' }}>{error}</p>}
          </form>
        )}

        <aside className="custom-aside">
          {!isMobile && <ShuffleCardStack activeGroupHint={activeGroupHint} />}
          <span>YOUR SELECTION · QTY {state.quantity}</span>
          <h2>{state.selected.length ? `${state.selected.length} choices` : 'Start with anything'}</h2>
          <p style={{ minHeight: '44px' }}>
            {state.selected.length ? state.selected.join(' · ') : 'Choose a base, add the items they will love, and tell us how to finish it.'}
          </p>
          <div className="estimate-panel" style={{ minHeight: '110px' }}>
            <small>LIVE ESTIMATE</small>
            {unitEstimate ? (
              <>
                <strong>GHS {estimateLow.toLocaleString()}–{estimateHigh.toLocaleString()}</strong>
                <p>For {state.quantity} gift{state.quantity > 1 ? 's' : ''}. Final pricing follows stock and delivery confirmation.</p>
              </>
            ) : (
              <p>Select a base and gift items to calculate an estimate.</p>
            )}
          </div>
          <p>Save your request to continue on WhatsApp with your reference and complete gift details.</p>
        </aside>
      </div>

      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
