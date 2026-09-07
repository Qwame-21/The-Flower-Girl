import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { requestWhatsAppUrl } from '../utils/request';

export default function RequestConfirmation({ request }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(request.reference); setCopied(true); setError(''); }
    catch { setError('Copy is unavailable. Select and copy the reference shown above.'); }
  };
  return <div className="request-confirmation">
    <div className="request-reference"><strong>{request.reference}</strong><button type="button" onClick={copy} aria-label="Copy request reference">{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : 'Copy reference'}</button></div>
    <span role="status">{error || (copied ? 'Reference copied.' : '')}</span>
    <p>Continue on WhatsApp to send your reference and request details to the team. Review the message before sending.</p>
    <a className="primary-action" href={requestWhatsAppUrl(request)} target="_blank" rel="noreferrer">CONTINUE ON WHATSAPP</a>
  </div>;
}
