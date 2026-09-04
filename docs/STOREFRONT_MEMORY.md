# Storefront design memory

Last verified: 2026-09-04

## Approved visual direction

- Warm light-gray editorial canvas with black typography and controls. Do not introduce purple, pink, gradients, heavy shadows, or generic card styling.
- Use the supplied black Gifting Factory wordmark. Its one-time write-on reveal lasts exactly 2.2 seconds and must not loop.
- On desktop the wordmark is optically enlarged inside its existing 82px header; increasing it must never increase the navigation bar height or disturb navigation spacing.
- Desktop navigation shows Home, About, Services, Gallery, Shop, Careers, search, wishlist, and shopping bag. Mobile replaces the page links with the hamburger drawer while keeping the utility icons visible.
- Hero products and flowers are transparent cutouts blended into the canvas. They are not placed inside image cards.
- Buttons and close controls use consistent geometry, visible focus states, pointer cursors, and restrained motion.
- Internal scrolling uses the slim storefront indicator. Avoid a thick browser-style track inside checkout or wishlist panels.

## Locked page decisions

### Home

- Keep the compact header height and the landscape editorial hero.
- Hero thumbnails and artwork change gently; artwork rests at the bottom of the hero.
- “What we make meaningful” uses rounded arrow controls.
- Footer closing text is clearly visible and includes the copyright and same-day delivery note.

### About

- The three-step sequence uses large open `01`, `02`, and `03` editorial numbers.
- Its visual language matches Delivery & FAQ: a fine top rule, large number, and unboxed explanatory copy.
- Do not replace this treatment with circles, tables, or enclosed cards.

### Services and Gallery

- Service imagery floats directly on the canvas with no image-card background.
- Service options remain readable as horizontal text rows.
- The service-request inspiration upload is a compact horizontal pill with its icon and label centered on one line.
- Gallery is a compact, orderly image grid with a restrained Instagram action.

### Shop and order flows

- Product cutouts are centered inside consistent pale visual areas without clipping.
- A product-card “Add to Order” action briefly confirms with a checkmark and “Added,” then returns to its original label without changing the button footprint.
- Cart and wishlist persist through `localStorage` under `gifting-factory-cart` and `gifting-factory-wishlist`.
- The bag opens checkout. Quantity controls allow multiple units.
- Every checkout line includes a quiet explicit Remove action in addition to its quantity controls.
- Recipient name is optional and its helper remains on one line where space permits.
- Paystack owns the final card or Mobile Money selection. The storefront presents one secure Paystack action rather than duplicate payment-method buttons.

### Careers

- Key responsibilities, what we are looking for, and what we offer are vertically stacked sections.
- Application fields are open editorial lines, not rounded textarea cards.
- Typed text uses the storefront font at a comfortably readable size.

## Content constraints

- Treat customer-provided social screenshots as research references, not assets to publish.
- Do not fabricate operational claims, inventory, delivery coverage, or policy promises.
- Keep the current Accra delivery wording until the customer confirms broader coverage and an exact map pin.
