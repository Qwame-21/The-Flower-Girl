# Supabase implementation plan

Run `supabase/schema.sql` in a new Supabase project, create the first user in Supabase Authentication, then insert that user ID into `staff_profiles` with role `owner`.

## Required server functions

1. `paystack-init`: validates products, stock, promotions and prices from the database, stores a private expiring checkout attempt, initializes Paystack, and returns only the authorization URL and reserved customer references. It does not create an order.
2. `paystack-webhook`: verifies Paystack’s signature, re-verifies the transaction through Paystack, and atomically creates the paid order, items, Paid event and admin notification exactly once. Never trust a browser callback as payment confirmation.
3. `create-request`: validates service/bespoke fields, uploads any inspiration file to the private bucket, creates the `RQ-…` record, and notifies Admin.
4. `track-record`: accepts a reference plus normalized phone/email, rate-limits requests, and returns only customer-safe order/request fields and timeline events.
5. `submit-application`: stores the application and résumé in the private career bucket and optionally triggers an email notification.

## What the five infrastructure gaps mean

- **Paystack:** the public key may be exposed, but the secret key must remain server-side. Only the verified webhook converts a checkout attempt into an order.
- **Database and realtime:** replace `localStorage` with Supabase tables. Subscribe Admin and Track Order to request/order/event changes so updates appear without refresh.
- **Career delivery:** save every application and résumé, then connect an email provider or Supabase hook so the hiring team is alerted.
- **Image uploads:** bundled storefront images remain versioned in `public/assets`; admin-added gallery/product media goes to `storefront-media`; private request inspiration and CV files use signed URLs from private buckets.
- **Authentication and synchronization:** use Supabase Auth for staff, enforce RLS for every admin mutation, and expose narrow server endpoints for public checkout, requests and tracking.

## Launch order

1. Create the Supabase project and run the schema.
2. Configure Auth and insert the owner profile.
3. Deploy the five server/Edge Functions.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; keep service-role and Paystack secret keys only in server secrets.
5. Replace `adminStore.js` collection-by-collection, starting with products, requests, orders and order events.
6. Migrate bundled demo data, validate RLS, then test payment, request tracking, uploads and staff permissions in staging.
