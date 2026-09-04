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
