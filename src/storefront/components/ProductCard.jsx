import { Check, Heart } from 'lucide-react';
import { PRODUCT_TAGS } from '../../shared/taxonomy';

export default function ProductCard({ product, saved, added, onSave, onView, onAdd }) {
  const tagLabel = PRODUCT_TAGS.find(t => t.value === product.tag)?.label || product.tag;
  const available = product.stock == null ? Infinity : Math.max(0, Number(product.stock));
  const isOutOfStock = available === 0;
  return <article className={`product-${product.id}`}><button className={`product-save ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button><button className="product-visual" onClick={onView}>{product.discountPercent > 0 && <span className="product-sale-badge">{product.discountPercent > 0}% OFF</span>}<img src={product.image} alt={product.name} /></button><span>{tagLabel}</span><button className="product-title" onClick={onView}><h2>{product.name}</h2></button><p>{product.detail}</p><div className="product-card-price">{product.discountPercent > 0 && <del>{product.originalPriceLabel}</del>}<strong>{product.priceLabel}</strong></div><div className="product-actions"><button className={added ? 'is-added' : ''} disabled={isOutOfStock} onClick={onAdd} aria-live="polite">{isOutOfStock ? 'Sold out' : (added ? <><Check size={14} /> ADDED</> : 'ADD TO ORDER')}</button><button onClick={onView}>VIEW DETAILS</button></div></article>;
}
