import { useEffect, useState } from 'react';
import { Check, LoaderCircle, LocateFixed, MapPin, Trash2 } from 'lucide-react';
import { initializeCheckout } from '../api/checkoutApi';
import { hasTrackingApi, trackRecord } from '../api/trackingApi';
import { formIsoDateOptional } from '../utils/date';
import CardStylePicker from '../components/CardStylePicker';
import DateField from '../components/DateField';
import QuantityControl from '../components/QuantityControl';
import PhoneInput from '../components/PhoneInput';
import ModalHeader from '../components/ModalHeader';
import DeliveryAddressFields from '../components/DeliveryAddressFields';
import { formatDeliveryAddress } from '../utils/address';

export default function CheckoutModal({ cart, onClose, onQuantity, onNavigate }) {
  const [complete, setComplete] = useState(() => {
    try { return JSON.parse(window.sessionStorage.getItem('gifting-factory-payment-return') || 'null'); } catch { return null; }
  });
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [scrollState, setScrollState] = useState({ progress: 0, visible: false });
  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyTrackingId = async () => {
    if (copying || copied) return;
    setCopying(true);
    try {
      await Promise.all([
        navigator.clipboard.writeText(complete.trackingNumber),
        new Promise(resolve => window.setTimeout(resolve, 420)),
      ]);
      setCopied(true);
    } finally {
      setCopying(false);
    }
  };

  useEffect(() => {
    if (!complete?.trackingNumber || ['paid', 'pending'].includes(complete.status) || !hasTrackingApi()) return undefined;
    let stopped = false;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      const { data } = await trackRecord(complete.trackingNumber, complete.customerEmail);
      if (!stopped && data?.kind === 'order' && data.paymentStatus === 'paid') {
        setComplete(current => ({ ...current, status: 'paid' }));
        window.sessionStorage.setItem('gifting-factory-payment-return', JSON.stringify({ ...complete, status: 'paid' }));
      } else if (!stopped && attempts < 12) window.setTimeout(check, 1500);
      else if (!stopped) {
        setComplete(current => ({ ...current, status: 'pending' }));
        window.sessionStorage.setItem('gifting-factory-payment-return', JSON.stringify({ ...complete, status: 'pending' }));
      }
    };
    check();
    return () => { stopped = true; };
  }, [complete]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const cardMessage = data.get('cardMessage');
    const cardStyleNotes = data.get('cardStyleNotes');
    const instructionParts = [
      data.get('instructions'),
      cardMessage && `Gift card: ${cardMessage}`,
      cardStyleNotes && `Card style: ${cardStyleNotes}`,
    ].filter(Boolean);

    try {
      const res = await initializeCheckout({
        customerName: data.get('customer'),
        customerEmail: data.get('email'),
        customerPhone: data.get('phone'),
        recipientName: data.get('recipient-name') || data.get('customer'),
        deliveryAddress: formatDeliveryAddress(data),
        landmark: data.get('landmark') || '',
        locationLink,
        customerNote: instructionParts.join('\n'),
        cardMessage: cardMessage || '',
        cardStyleNotes: cardStyleNotes || '',
        requestedDeliveryDate: formIsoDateOptional(data, 'checkout'),
        callbackUrl: `${window.location.origin}/?payment=return`,
        cart: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
      });

      const json = await res.json();

      if (!res.ok || !json.authorizationUrl) {
        console.error('Paystack init response error:', res.status, json);
        setSubmitError(json.error || json.message || 'Payment initialisation failed. Please try again.');
        setSubmitting(false);
        return;
      }

      const receipt = { trackingNumber: json.trackingNumber, orderCode: json.orderCode, reference: json.reference, customerEmail: data.get('email'), status: 'confirming' };
      window.sessionStorage.setItem('gifting-factory-payment-return', JSON.stringify(receipt));
      cart.forEach(item => onQuantity(item.id, 0));
      setRedirecting(true);
      window.setTimeout(() => window.location.assign(json.authorizationUrl), 180);
    } catch (err) {
      console.error('Checkout error:', err);
      setSubmitError('Network error. Check your connection and try again.');
      setSubmitting(false);
    }
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('Location is not available in this browser.'); return; }
    setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setLocationLink(`https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`);
      setLocationStatus('Current location added. You can still edit the link.');
    }, () => setLocationStatus('Location permission was not granted. Paste a Maps link instead.'), { enableHighAccuracy: true, timeout: 10000 });
  };
  return (
      <section className="flow-modal checkout-modal fixed-heading-modal" onScrollCapture={event => { const node = event.target; const available = node.scrollHeight - node.clientHeight; setScrollState({ progress: available > 0 ? node.scrollTop / available : 0, visible: available > 8 }); }} aria-label="Your order">
        <div className={`modal-scroll-indicator ${scrollState.visible ? 'visible' : ''}`} aria-hidden="true"><span style={{ top: `${scrollState.progress * 100}%`, transform: `translateY(-${scrollState.progress * 100}%)` }} /></div>
        {redirecting && <div className="paystack-transition" role="status" aria-live="polite"><span>SECURE CHECKOUT</span><strong>Opening Paystack</strong><p>Keep this tab open. Your order details are ready.</p><i aria-hidden="true" /></div>}
        <ModalHeader eyebrow={complete ? 'PAYMENT RETURN' : 'CHECKOUT'} title={complete ? (complete.status === 'paid' ? 'Your order is confirmed.' : complete.status === 'pending' ? 'Confirmation is taking longer.' : 'Confirming your payment.') : cart.length ? 'Your order' : 'Your bag is empty'} onClose={onClose} closeLabel="Back to shop" back />
        <div className="modal-body">
        {complete ? (
          <div className="flow-success payment-receipt">
            <Check size={28} />
            <p>{complete.status === 'paid' ? 'Payment has been verified and your order is now with The Gifting Factory.' : complete.status === 'pending' ? 'Keep your tracking ID. If Paystack completed the payment, its signed confirmation will finish the order automatically.' : 'Paystack has returned you safely. This page will update as soon as the signed payment confirmation arrives.'}</p>
            <div className="receipt-code"><small>ORDER TRACKING ID</small><strong>{complete.trackingNumber}</strong><button className={copied ? 'is-copied' : copying ? 'is-copying' : ''} type="button" aria-label={copied ? 'Tracking ID copied' : copying ? 'Copying tracking ID' : 'Copy tracking ID'} disabled={copying} onClick={copyTrackingId}>{copied ? <Check size={16} /> : copying ? <i aria-hidden="true" /> : <span>COPY ID</span>}</button></div>
            {complete.orderCode && <small className="receipt-order-code">ORDER CODE · {complete.orderCode}</small>}
            <div className="receipt-actions"><button className="primary-action" onClick={() => { window.sessionStorage.setItem('gifting-factory-track-prefill', JSON.stringify({ reference: complete.trackingNumber, credential: complete.customerEmail })); window.sessionStorage.removeItem('gifting-factory-payment-return'); onClose(); onNavigate?.('track'); }}>TRACK THIS ORDER</button><button className="soft-action" onClick={() => { window.sessionStorage.removeItem('gifting-factory-payment-return'); onClose(); }}>RETURN TO THE SHOP</button></div>
          </div>
        ) : !cart.length ? (
          <div className="flow-success empty-order"><p>Add a ready-made gift or begin with the custom gift builder.</p><button className="primary-action" onClick={onClose}>BROWSE THE SHOP</button></div>
        ) : (
          <form onSubmit={submit}>
            <div className="checkout-summary">{cart.map(item => <div className="checkout-line" key={item.id}>
              <img className="checkout-product-image" src={item.image || '/assets/gifting-factory-logo-transparent-v2.png'} alt={item.name} />
              <div className="checkout-product-name"><span>{item.name}</span><small>GHS {item.price.toLocaleString()} each</small></div>
              <QuantityControl value={item.quantity} label={item.name} onDecrease={() => onQuantity(item.id, item.quantity - 1)} onIncrease={() => onQuantity(item.id, item.quantity + 1)} />
              <strong>GHS {(item.price * item.quantity).toLocaleString()}</strong>
              <button className="checkout-remove" type="button" onClick={() => onQuantity(item.id, 0)} aria-label={`Remove ${item.name} from order`}><Trash2 size={17} strokeWidth={1.6} /></button>
            </div>)}</div>
            <div className="checkout-total"><span>SUBTOTAL</span><strong>GHS {total.toLocaleString()}</strong></div>
            <div className="checkout-contact-grid"><label>Customer name<input name="customer" required disabled={submitting} /></label><label>Email for receipt<input name="email" required type="email" disabled={submitting} /></label><PhoneInput required disabled={submitting} /><label><span className="field-label">Recipient name <small>optional</small></span><input name="recipient-name" placeholder="Leave blank if you are receiving it" disabled={submitting} /></label></div>
            <DeliveryAddressFields disabled={submitting} /><label>Nearest landmark<input name="landmark" disabled={submitting} /></label>
            <div className="location-field"><label>Google Maps or location link<input type="url" value={locationLink} onChange={event => setLocationLink(event.target.value)} placeholder="https://maps.google.com/..." disabled={submitting} /></label><button type="button" onClick={useCurrentLocation} disabled={submitting}><LocateFixed size={15} /> USE MY LOCATION</button>{locationStatus && <small><MapPin size={13} />{locationStatus}</small>}</div>
            <label>Delivery instructions<textarea name="instructions" rows="2" placeholder="Gate, floor, preferred call time or surprise-delivery note" disabled={submitting} /></label><DateField label="Delivery date" prefix="checkout" />
            <fieldset className="checkout-card-message"><legend>Gift card message <small>(optional)</small></legend><label>Message for the card<textarea name="cardMessage" rows="3" placeholder="Write the message exactly as it should appear" disabled={submitting} /></label><CardStylePicker disabled={submitting} /></fieldset>
            {submitError && <small className="checkout-error">{submitError}</small>}
            <button className="primary-action" type="submit" disabled={submitting}>
              {submitting ? <><LoaderCircle size={16} className="spin-icon" /> PROCESSING…</> : <>PLACE ORDER {total > 0 ? `· GHS ${total.toLocaleString()}` : ''}</>}
            </button>
            <small className="checkout-payment-note">You will be redirected to Paystack to complete payment securely. Your order is confirmed only after payment.</small>
          </form>
        )}
        </div>
      </section>
  );
}
