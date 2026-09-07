import { useState } from 'react';
import { Check, Upload } from 'lucide-react';
import { addAdminRecord } from '../../data/adminStore';
import { formDate } from '../utils/date';
import CardStylePicker from '../components/CardStylePicker';
import DateField from '../components/DateField';
import PhoneInput from '../components/PhoneInput';
import ModalHeader from '../components/ModalHeader';
import RequestDeliveryFields from '../components/RequestDeliveryFields';
import RequestConfirmation from '../components/RequestConfirmation';
import { requestDeliveryDetails } from '../utils/request';

export default function RequestModal({ service, onClose }) {
  const [sent, setSent] = useState(false);
  const [fileName, setFileName] = useState('');
  const [requestReference] = useState(() => `RQ-${String(Date.now()).slice(-6)}`);
  const submit = (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const record = { ...requestDeliveryDetails(data), quantity: Number(data.get('quantity') || 1), reference: requestReference, service, name: data.get('name'), email: data.get('email'), phone: data.get('phone'), occasion: data.get('occasion'), preferredDate: formDate(data, 'request'), inspirationName: fileName, note: data.get('request'), cardMessage: data.get('cardMessage'), cardStyleNotes: data.get('cardStyleNotes'), status: 'new' }; addAdminRecord('requests', record); setSent(record); };

  return (
    <div className="flow-backdrop" onClick={onClose}>
      <section className="flow-modal request-modal fixed-heading-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <ModalHeader eyebrow="SERVICE REQUEST" title={sent ? "Request saved" : service} onClose={onClose} closeLabel="Close request" />
        <div className="modal-body">
        {sent ? (
          <div className="flow-success"><Check size={28} /><RequestConfirmation request={sent} /></div>
        ) : (
          <form onSubmit={submit}>
            <label>Name<input name="name" required /></label>
            <label>Email address<input name="email" type="email" required /></label>
            <PhoneInput required />
            <label>Occasion<input name="occasion" required /></label>
            <DateField label="Preferred date" prefix="request" />
            <label>Number of gifts / items<input name="quantity" type="number" min="1" step="1" defaultValue="1" required /></label>
            <RequestDeliveryFields />
            <label>Service notes and instructions<textarea name="request" rows="4" required placeholder="Describe what you need, who it is for, preferred colours, wording or any delivery details" /></label>
            <fieldset className="request-card-message"><legend>Gift card <small>(optional)</small></legend><label>Message for the card<textarea name="cardMessage" rows="3" placeholder="Write the message exactly as it should appear" /></label><CardStylePicker /></fieldset>
            <label className="upload-field"><Upload size={16} /> Inspiration image<input type="file" accept="image/*" onChange={(event) => setFileName(event.target.files?.[0]?.name || '')} /></label>
            {fileName && <small>{fileName} — please attach this image in the WhatsApp chat.</small>}
            <button className="primary-action" type="submit">SAVE REQUEST</button>
          </form>
        )}
        </div>
      </section>
    </div>
  );
}
