import { useState } from 'react';
import { addAdminRecord } from '../../data/adminStore';
import { CUSTOM_ESTIMATES, CUSTOM_OPTIONS } from '../data/customization';
import { formDate } from '../utils/date';
import CardStylePicker from '../components/CardStylePicker';
import DateField from '../components/DateField';
import QuantityControl from '../components/QuantityControl';
import SiteFooter from '../components/SiteFooter';
import PhoneInput from '../components/PhoneInput';
import RequestDeliveryFields from '../components/RequestDeliveryFields';
import RequestConfirmation from '../components/RequestConfirmation';
import { requestDeliveryDetails } from '../utils/request';

export default function CustomizePage({ onNavigate }) {
  const [selected, setSelected] = useState([]);
  const [sent, setSent] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [requestReference] = useState(() => `RQ-${String(Date.now()).slice(-6)}`);
  const toggle = option => setSelected(current => current.includes(option) ? current.filter(item => item !== option) : [...current, option]);
  const unitEstimate = selected.reduce((sum, option) => sum + (CUSTOM_ESTIMATES[option] || 0), 0);
  const estimateLow = unitEstimate * quantity;
  const estimateHigh = Math.ceil(estimateLow * 1.12 / 10) * 10;
  const submit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const record = {
      ...requestDeliveryDetails(data),
      service: 'Custom gift',
      email: data.get('email'),
      occasion: data.get('occasion'),
      reference: requestReference,
      name: data.get('name'),
      phone: data.get('phone'),
      note: data.get('note'),
      cardMessage: data.get('cardMessage'),
      cardStyleNotes: data.get('cardStyleNotes'),
      preferredDate: formDate(data, 'custom'),
      estimateLow,
      estimateHigh,
      selections: selected,
      quantity,
      status: 'new'
    };
    addAdminRecord('requests', record);
    setSent(record);
  };

  return <main className="content-page customize-page">
    <header className="content-page-heading"><span>BESPOKE GIFT BUILDER</span><h1>Make it<br />theirs.</h1></header>
    <div className="custom-gallery"><figure><img src="/assets/hamper-editorial-v2.png" alt="Luxury hamper inspiration" /><figcaption>Hampers</figcaption></figure><figure><img src="/assets/bouquet-editorial-v2.png" alt="Fresh flower inspiration" /><figcaption>Flowers</figcaption></figure><figure><img src="/assets/embroidery-editorial-v2.png" alt="Embroidery and personalization inspiration" /><figcaption>Personalization</figcaption></figure></div>
    <div className="custom-builder"><form onSubmit={submit}>
      {Object.entries(CUSTOM_OPTIONS).map(([group, options], groupIndex) => <fieldset className="custom-option-group" key={group}><legend><span>{String(groupIndex + 1).padStart(2, '0')}</span>{group}</legend><div>{options.map(option => <label key={option} className={selected.includes(option) ? 'selected' : ''}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />{option}</label>)}</div></fieldset>)}
      <section className="builder-card-message"><span>CARD MESSAGE &amp; DESIGN</span><p>Select “Card message &amp; design” above when you want either a printed message or a custom card. Then enter the exact wording and choose its lettering below.</p><label>Message for the card <small>(optional)</small><textarea name="cardMessage" rows="3" placeholder="Write the message exactly as it should appear" /></label><CardStylePicker /></section>
      <label className="custom-note">Gift notes and instructions<textarea name="note" required rows="5" placeholder="Tell us the occasion, recipient, preferred colours, budget, presentation ideas or anything the team should know" /></label>
      <div className="custom-contact"><label>Name<input name="name" required /></label><label>Email address<input name="email" type="email" required /></label><label>Occasion<input name="occasion" required /></label><PhoneInput label="WhatsApp number" required /><DateField label="Preferred date" prefix="custom" /></div>
      <RequestDeliveryFields />
      <div className="custom-quantity"><span>NUMBER OF IDENTICAL GIFTS</span><QuantityControl value={quantity} label="custom gifts" onDecrease={() => setQuantity(current => Math.max(1, current - 1))} onIncrease={() => setQuantity(current => current + 1)} /></div>
      <input type="hidden" name="custom-quantity" value={quantity} /><button className="primary-action" type="submit">{sent ? 'REQUEST SAVED' : `SAVE ${quantity > 1 ? `${quantity} ` : ''}CUSTOM REQUEST${quantity > 1 ? 'S' : ''}`}</button>
      {sent && <div className="inline-success custom-request-success" role="status"><RequestConfirmation request={sent} /><button type="button" onClick={() => onNavigate?.('track')}>TRACK THIS REQUEST</button></div>}
    </form><aside><img src="/assets/hamper-editorial-v2.png" alt="A curated luxury gift hamper" /><span>YOUR SELECTION · QTY {quantity}</span><h2>{selected.length ? `${selected.length} choices` : 'Start with anything'}</h2><p>{selected.length ? selected.join(' · ') : 'Choose a base, add the items they will love, and tell us how to finish it.'}</p><div className="estimate-panel"><small>LIVE ESTIMATE</small>{unitEstimate ? <><strong>GHS {estimateLow.toLocaleString()}–{estimateHigh.toLocaleString()}</strong><p>For {quantity} gift{quantity > 1 ? 's' : ''}. Final pricing follows stock and delivery confirmation.</p></> : <p>Select a base and gift items to calculate an estimate.</p>}</div><p>Save your request to continue on WhatsApp with your reference and complete gift details.</p></aside></div>
    <SiteFooter onNavigate={onNavigate} />
  </main>;
}
