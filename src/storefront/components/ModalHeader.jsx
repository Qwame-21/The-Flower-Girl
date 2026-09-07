import { ArrowLeft, X } from 'lucide-react';

export default function ModalHeader({ eyebrow, title, onClose, closeLabel, back = false }) {
  return <header className={`modal-heading${back ? ' page-heading' : ''}`}>
    {back && <button type="button" className="round-icon" onClick={onClose} aria-label={closeLabel}><ArrowLeft size={20} /></button>}
    <div><span className="form-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
    {!back && <button type="button" className="round-icon" onClick={onClose} aria-label={closeLabel}><X size={18} /></button>}
  </header>;
}
