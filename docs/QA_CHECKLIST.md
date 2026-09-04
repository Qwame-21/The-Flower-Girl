# Storefront release checklist

Run this list after every approved UI change.

## Automated

- `npm run lint`
- `npm run build`
- Confirm no horizontal document overflow at 1440×900, 820×1180, and 390×844.

## Navigation and responsive behavior

- Desktop links open Home, About, Services, Gallery, Shop, and Careers.
- Mobile hamburger opens and closes cleanly.
- Mobile drawer opens Our Story, Services, Gallery, Shop Gifts, Build a Custom Gift, Careers, Delivery & FAQ, and Order Policy.
- Footer navigation opens the matching internal pages.
- Search opens, filters results, routes to the chosen destination, and closes.

## Commerce

- Product details open and close.
- Add to Order updates the shopping-bag count.
- Increasing and decreasing quantities updates the subtotal.
- Wishlist save or remove updates the heart count.
- Cart and wishlist counts remain after a reload.
- Checkout recipient name remains optional.
- Delivery-date controls and location-link input are usable.
- Paystack action is disabled or explanatory when configuration is incomplete; no secret key appears in the client bundle.

## Forms and accessibility

- Required fields show native validation without clearing entered data.
- Application and request forms remain keyboard usable.
- Every icon-only control has an accessible name.
- Buttons, links, uploads, and custom selects show pointer, focus, and pressed feedback.
- Reduced-motion users do not receive the wordmark animation.
