# Admin dashboard direction

This document locks the design relationship between the storefront and the future operations dashboard. Detailed dashboard architecture will be finalized with the customer workflow brief before implementation.

## Shared visual system

- Use the storefront’s warm gray, off-black, white, and muted-gray palette. Do not introduce dashboard-only purple, blue, gradients, or unrelated accent colors.
- Keep Outfit as the working interface typeface and preserve the storefront’s editorial scale, careful tracking, and restrained weights.
- Reuse the storefront wordmark, favicon language, slim rules, rounded utility controls, compact status markers, and subtle 180–250ms interaction timing.
- Prefer open layouts and grouped rows over generic white card grids. A surface should exist only when it clarifies hierarchy or interaction.
- Keep radii, button heights, form fields, focus states, and scroll indicators consistent with the storefront.

## Operational structure to design next

1. Overview and daily priorities.
2. Orders, payment state, and fulfillment stages.
3. Custom gift and service requests with uploaded inspiration.
4. Products, pricing, stock, categories, and storefront visibility.
5. Customers, recipients, saved delivery details, and communication history.
6. Delivery assignment, rider handoff, tracking, and completion.
7. Careers applications and résumé review.
8. Content, gallery, policies, and storefront settings.
9. Staff roles, permissions, activity history, and security.

## Product principle

The admin should feel like the private operational side of the same Gifting Factory brand, not a purchased dashboard template. Storefront components may inform its visual grammar, but customer-facing marketing layouts should not be copied where dense operational tools need clearer tables, filters, and status controls.

## Live Slay Empire dashboard audit

The source dashboard was run locally and reviewed module by module on 4 September 2026. Its structure is a useful operational scaffold, but its beauty-retail terminology, pink accents, serif styling, and insecure development shortcuts are not part of The Gifting Factory system.

### Structure to retain

- A quiet identity bar containing the admin wordmark, connection state, notifications, and account exit.
- One focused workspace at a time, selected through a compact module control instead of a permanently dominant sidebar.
- A consistent page sequence: operational summary, search and filters, contextual actions, then the working records.
- Expandable order records that keep the summary scannable while exposing customer, item, payment, delivery, and internal-note details on demand.
- Dedicated management surfaces for orders, activity history, products, storefront-assisted ordering, insights, customers, reviews, and settings.
- Immediate inventory controls for price, stock, low-stock threshold, storefront badges, imagery, ordering rank, and promotions.
- CSV export, order history, notification state, and bulk actions as practical staff tools rather than decorative analytics.

### Gifting Factory translation

| Slay Empire module | Gifting Factory module | Required adaptation |
| --- | --- | --- |
| Orders | Orders | Paystack state, recipient optionality, quantities, gift messages, fulfillment stages, and delivery location links. |
| Log | Activity & order history | Completed, cancelled, refunded, and archived orders with staff attribution and export. |
| Reviews | Reviews | Moderation, product association, verified-order state, rating summaries, and storefront visibility. |
| Products | Catalogue | Hampers, flowers, wrapping, personalization, engraving, add-ons, starting prices, stock, lead time, and visibility. |
| Shop | Assisted order | Let staff assemble an order or custom gift for a customer using the same catalogue and pricing logic as the storefront. |
| Insights | Performance | Revenue, order value, popular products, custom-request conversion, fulfillment time, delivery load, and low stock. |
| Customers | Customers & recipients | Customer history, recipient details, contact preferences, delivery locations, and reusable addresses without forcing accounts. |
| Settings | Store operations | Payment configuration status, delivery zones, policies, content, team roles, integrations, and security controls. |

### Additional modules required

- **Requests:** custom gifts and service bookings, inspiration uploads, quotes, approvals, and conversion into orders.
- **Delivery:** geographic zones, fees, scheduled date, rider assignment, status history, and completion evidence.
- **Careers:** applications, résumé attachments, review status, notes, and candidate communication state.
- **Content:** gallery imagery, homepage collections, policies, FAQs, service descriptions, and storefront announcements.
- **Team & security:** authenticated staff accounts, scoped roles, session expiry, audit events, and protected server-side actions.

## First implementation slice

Build the shared shell and Orders workspace first. It should validate the wordmark scale, module selector, metric rhythm, filters, expandable record treatment, status workflow, and responsive behavior. Once approved, reuse that system for Requests and Catalogue before adding the remaining modules.

## Visual-reference synthesis

The three supplied dashboard references are influences, not templates to reproduce literally.

### Shell and work queues

- Use a narrow icon rail on desktop for the primary operational areas, influenced by the first reference.
- Pair it with a calm top bar containing the current page title, notifications, search, and the signed-in staff account.
- Keep secondary states directly beneath the title as segmented filters with counts, such as `All orders`, `Awaiting confirmation`, `Preparing`, `Ready`, and `Delivery`.
- Use structured record panels for requests and orders, but avoid nesting every field inside another card. Expanded detail should remain easy to scan.

### Circular breakdown

- Adapt the second reference’s circular chart for an operational composition, not generic “expenses”.
- Recommended overview: `Order mix` split across hampers, flowers, wrapping, personalization, and service requests.
- A second use may show `Fulfillment mix`: awaiting confirmation, preparing, ready, out for delivery, and completed.
- Keep the chart monochrome with warm-gray tonal steps and one black active segment. Do not introduce a rainbow legend.

### Performance chart

- Adapt the third reference’s vertical bars for order volume or revenue by day, week, or month.
- Allow one selected period to become solid black while surrounding periods remain muted and lightly hatched.
- Pair it with a restrained line chart for average fulfillment time, custom-request conversion, or delivery completion—not decorative engagement statistics.
- Charts should expose exact values through hover/focus and remain readable as summarized lists on small screens.

### Proposed desktop hierarchy

1. Brand mark and compact icon rail.
2. Page title, search, notifications, and staff account.
3. Status filters and urgent operational alerts.
4. Four priority metrics.
5. Primary working area: orders or requests.
6. Supporting analytics: order mix and performance trend.
7. Contextual detail drawer for editing, notes, delivery, and payment state.

The shell should feel quieter than the references: `#e2e2e0` canvas, near-black type, off-white working surfaces, thin rules, limited rounding, and product imagery only when it helps recognition.
