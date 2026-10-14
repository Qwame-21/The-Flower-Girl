import React from 'react';
import { LoaderCircle } from 'lucide-react';

/**
 * OutlineActionButton: Single shared source of truth for outline pill buttons
 * across the storefront (e.g. "USE MY LOCATION", "CHOOSE FILE", "CHANGE FILE").
 *
 * Dimensions: ~116-124px wide x 32px tall pill.
 * Features:
 * - Fixed 32px height, 8px border radius, 11px uppercase bold font with wide letter-spacing.
 * - Icon: 16px with consistent stroke.
 * - Tap target: minimum 44px hit area for touch devices via ::after overlay.
 * - Constant width during loading/disabled states to prevent layout shift.
 * - Works as either <button> or <label> (for visually hidden file inputs).
 */
export default function OutlineActionButton({
  as = 'button',
  icon = null,
  label,
  loading = false,
  loadingLabel = 'LOCATING…',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  children,
  title,
  ariaLabel,
  ...rest
}) {
  const Component = as;
  const isLabel = as === 'label';

  const content = (
    <>
      <span className="outline-btn-icon" aria-hidden="true">
        {loading ? (
          <LoaderCircle size={16} strokeWidth={1.6} className="outline-btn-spinner" />
        ) : (
          icon
        )}
      </span>
      <span className="outline-btn-label">
        {loading ? loadingLabel : label}
      </span>
      {children}
    </>
  );

  const sharedProps = {
    className: `outline-action-button ${loading ? 'is-loading' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim(),
    title: title || (typeof label === 'string' ? label : undefined),
    'aria-label': ariaLabel || (typeof label === 'string' ? label : undefined),
    ...rest,
  };

  if (isLabel) {
    return (
      <label
        {...sharedProps}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
            e.preventDefault();
            e.currentTarget.querySelector('input[type="file"]')?.click();
          }
        }}
      >
        {content}
      </label>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      {...sharedProps}
    >
      {content}
    </button>
  );
}
