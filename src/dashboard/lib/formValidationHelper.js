/**
 * Shared Form Validation & Scroll Helper
 * Focuses and smoothly scrolls to the first invalid field in any admin form container.
 */

export function focusAndScrollToFirstError(containerOrSelector = document) {
  const container = typeof containerOrSelector === 'string'
    ? document.querySelector(containerOrSelector) || document
    : containerOrSelector;

  if (!container) return;

  // Find all elements marked with error classes or error attributes
  const errorElements = Array.from(
    container.querySelectorAll('.shop-error, .field-error, .has-error, [aria-invalid="true"], .field-input-error')
  );

  if (errorElements.length === 0) return;

  const firstErrorEl = errorElements[0];

  // Find focusable input/select/textarea inside or equal to first error element
  let focusTarget = firstErrorEl;
  if (!['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(firstErrorEl.tagName)) {
    const childInput = firstErrorEl.querySelector('input, select, textarea, button');
    if (childInput) focusTarget = childInput;
  }

  // Smooth scroll
  firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Focus input
  setTimeout(() => {
    try {
      focusTarget.focus({ preventScroll: true });
    } catch {}
  }, 300);
}
