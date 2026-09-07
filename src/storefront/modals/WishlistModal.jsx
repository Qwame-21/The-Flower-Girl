import { useState } from 'react';
import { X } from 'lucide-react';
import ModalHeader from '../components/ModalHeader';

export default function WishlistModal({ products, onClose, onView, onRemove }) {
  const [scrollState, setScrollState] = useState({ progress: 0, visible: false });
  return <section className="flow-modal wishlist-modal shared-scroll-panel fixed-heading-modal" onScrollCapture={event => { const node = event.target; const available = node.scrollHeight - node.clientHeight; setScrollState({ progress: available > 0 ? node.scrollTop / available : 0, visible: available > 8 }); }} aria-label="Saved gifts"><div className={`modal-scroll-indicator ${scrollState.visible ? 'visible' : ''}`} aria-hidden="true"><span style={{ top: `${scrollState.progress * 100}%`, transform: `translateY(-${scrollState.progress * 100}%)` }} /></div><ModalHeader eyebrow="WISHLIST" title="Saved gifts" onClose={onClose} closeLabel="Back to shop" back /><div className="modal-body">{products.length ? <div className="wishlist-list">{products.map(product => <article key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.priceLabel}</span></div><button onClick={() => onView(product)}>VIEW</button><button onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from wishlist`}><X size={15} /></button></article>)}</div> : <div className="empty-wishlist"><p>Save gifts while browsing and they will stay here when you return.</p><button className="primary-action" onClick={onClose}>BROWSE THE SHOP</button></div>}</div></section>;
}
