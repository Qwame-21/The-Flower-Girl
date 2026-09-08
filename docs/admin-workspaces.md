# Admin workspace implementation

The admin uses a white surface / blue action / black text system. `src/admin/palette.css` is the consolidated source for shared control states; `records.css` defines responsive tables and native dialog forms. Table rows stack on mobile. Dialog headings and actions stay visible while forms scroll. Escape closes dialogs and focus returns to the trigger.

## Available pages

- Overview: real available order totals, priorities, activity filters, search and record inspection. Built-in sample order IDs are excluded.
- Orders: search, status tabs, detail expansion, notes and browser-local manual orders. Manual orders start pending and do not initiate payment.
- Requests: authenticated Supabase reads/updates for `customer_requests`, quotation amounts, statuses and notes; inspiration files use 60-second signed URLs.
- Products: searchable browser catalogue; create/edit price, stock, image URL, description and visibility.
- Shop: feature/visibility controls and collections with a product checklist.
- Customers: read-only contacts and order history derived from available orders; returning customers and recipients tabs.
- Reviews: browser review moderation. Built-in sample review IDs are excluded from display without removing stored records.
- Delivery: order destinations, estimates and fulfilment updates. Uses Supabase for database-sourced orders and browser storage for local orders.
- Insights: paid totals, average order value, item-level sales and delivery stage counts.
- Careers: authenticated role creation/editing and application review, including private CV links.
- Content: browser content editors for homepage feature, policies and announcements.
- Settings: browser store/profile preferences and existing-account Supabase sign-in. Display profile edits do not change authorization.
- Gallery: existing gallery data and controls are preserved.

## Remaining integration work

This worktree has no configured Supabase environment at validation time. Add the existing project's public client URL/key through the normal deployment configuration; never put service-role credentials in Vite variables. Requests and Careers display an explicit configuration/sign-in/error state rather than treating local arrays as shared records.

Live staff authorization, RLS, shared writes and signed attachment downloads need testing against the configured backend. Schema execution and the submit-inquiry function deployment remain unconfirmed; see storefront-submissions.md.

Products, collections, reviews, content, settings and manual orders remain browser-backed. Their forms label that scope; they are not a production shared admin backend. Overview notifications still use the existing dashboard data subscription and need shared request/application reconciliation. Role catalogue publication into the storefront, request-to-order conversion, transactional delivery event history, rider assignment, password management and team permission administration are not implemented by these UI forms.

Existing browser records are not deleted. Known built-in sample order/review IDs are omitted from the admin view only. No production data was changed, and nothing was pushed or deployed.

## Validation

- Vite production build.
- Focused ESLint for new workspace components, hooks and utilities.
- Node tests cover record preservation, sample filtering, image URL validation, datetime conversion, overview calculations and storefront submission validation.
- Browser checks cover all operational routes, the populated product editor, mobile navigation and modal layout, and the disconnected backend states. Live backend success paths remain unverified.

## Login and access checks

`/admin/login` provides the dedicated staff login UI, including password visibility, Caps Lock indication, submission feedback and configuration errors. In a configured environment, AdminAccess requires a valid session and matching active staff profile before mounting the dashboard. Production builds with missing configuration remain on the disconnected login screen. Only Vite development mode supports the unconfigured local workspace preview. Settings → Security displays the authenticated profile and sign-out action; password resets and staff provisioning remain owner-managed.

The login UI was visually checked at desktop and 390px mobile widths. Four additional unit tests verify missing sessions, active profile matching, denied profiles and database failures. Live Supabase sign-in remains unverified because no configuration is present in this worktree.

## Canonical admin entry

The canonical URL is `/admin` for both login and dashboard. Unauthenticated users see the login form; only a verified active staff session mounts the dashboard. Logout returns to `/admin`. The development preview bypass has been removed. Legacy `/admin/login` links normalize to `/admin`. With Supabase unconfigured, the login form remains visible and sign-in is disabled.
