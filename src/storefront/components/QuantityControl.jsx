import { Minus, Plus } from 'lucide-react';

/**
 * QuantityControl — shared capsule stepper used everywhere in the storefront.
 *
 * Visual spec (identical on mobile and desktop):
 *   - 3-column grid: [32px | 34px | 32px], total width ≈ 98px
 *   - Height: 36px visible; 44px invisible tap target via ::after
 *   - Background: transparent (always inherits page background)
 *   - Border: 1px solid rgba(17,17,17,.22), border-radius: 999px
 *   - appearance: none so iOS/Android never paint their own chrome
 */
export default function QuantityControl({ value, onDecrease, onIncrease, label, disabled = false }) {
  return (
    <div className="quantity-control" aria-label={label}>
      <button
        type="button"
        className="qty-btn qty-btn--dec"
        onClick={onDecrease}
        disabled={disabled}
        aria-label={`Reduce ${label}`}
      >
        <Minus size={13} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="qty-value" aria-live="polite" aria-atomic="true">
        {value}
      </span>
      <button
        type="button"
        className="qty-btn qty-btn--inc"
        onClick={onIncrease}
        disabled={disabled}
        aria-label={`Increase ${label}`}
      >
        <Plus size={13} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
