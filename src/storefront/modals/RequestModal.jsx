import { useState } from 'react';
import { Check, Upload, X } from 'lucide-react';
import { addAdminRecord } from '../../data/adminStore';
import { formDate } from '../utils/date';
import CardStylePicker from '../components/CardStylePicker';
import DateField from '../components/DateField';
import PhoneInput from '../components/PhoneInput';

export default function RequestModal({ service, onClose }) {
  const [sent, setSent] = useState(false);
  const [fileName, setFileName] = useState('');
  const [requestReference] = useState(() => `RQ-${String(Date.now()).slice(-6)}`);
  const submit = (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); addAdminRecord('requests', { reference: requestReference, service, name: data.get('name'), email: data.get('email'), phone: data.get('phone'), occasion: data.get('occasion'), preferredDate: formDate(data, 'request'), inspirationName: fileName, note: data.get('request'), cardMessage: data.get('cardMessage'), cardStyleNotes: data.get('cardStyleNotes'), status: 'new' }); setSent(true); };

  return (
    <div className="flow-backdrop" onClick={onClose}>
      <section className="flow-modal request-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <button className="round-icon close-flow" onClick={onClose} aria-label="Close request"><X size={18} /></button>
        {sent ? (
          <div className="flow-success"><Check size={28} /><h2>Request saved</h2><p>Save reference <strong>{requestReference}</strong>. Track it with the same phone number or continue with the team on WhatsApp.</p><a className="primary-action" href="https://wa.me/message/WWAXSHH3LEGIL1" target="_blank" rel="noreferrer">CONTINUE ON WHATSAPP</a></div>
        ) : (
          <form onSubmit={submit}>
            <span className="form-eyebrow">SERVICE REQUEST</span><h2>{service}</h2>
            <label>Name<input name="name" required /></label>
            <label>Email address<input name="email" type="email" required /></label>
            <PhoneInput required />
            <label>Occasion<input name="occasion" required /></label>
            <DateField label="Preferred date" prefix="request" />
            <label>Service notes and instructions<textarea name="request" rows="4" required placeholder="Describe what you need, who it is for, preferred colours, wording or any delivery details" /></label>
            <fieldset className="request-card-message"><legend>Gift card <small>(optional)</small></legend><label>Message for the card<textarea name="cardMessage" rows="3" placeholder="Write the message exactly as it should appear" /></label><CardStylePicker /></fieldset>
            <label className="upload-field"><Upload size={16} /> Inspiration image<input type="file" accept="image/*" onChange={(event) => setFileName(event.target.files?.[0]?.name || '')} /></label>
            {fileName && <small>{fileName}</small>}
            <button className="primary-action" type="submit">SAVE REQUEST</button>
          </form>
        )}
      </section>
    </div>
  );
}
