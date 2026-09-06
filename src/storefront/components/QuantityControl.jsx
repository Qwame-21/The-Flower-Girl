import { Minus, Plus } from 'lucide-react';

export default function QuantityControl({ value, onDecrease, onIncrease, label }) {
  return <div className="quantity-control" aria-label={label}><button type="button" onClick={onDecrease} aria-label={`Reduce ${label}`}><Minus size={14} /></button><span>{value}</span><button type="button" onClick={onIncrease} aria-label={`Increase ${label}`}><Plus size={14} /></button></div>;
}
