# Storefront submission handoff

## Implemented

- Service and custom-gift forms call `submit-inquiry`. Success is displayed only after persistence; failures retain entries. UUID retry tokens prevent duplicate records.
- Requests go to `customer_requests`; delivery address, recipient, phone, fulfilment, map, instructions and budget are included in `notes`. Estimates, selections, dates and card wording use their existing columns.
- Inspiration images upload to private `request-uploads` storage.
- Careers sends application data to `career_applications` and a required CV to private `career-files` storage. Maximum attachment size is 5 MB.
- Dates reject past and impossible dates; the submission endpoint checks dates again using the Ghana/UTC business date.
- The gallery and storefront layout are unchanged.

## Deployment still required

The repository's existing `supabase/schema.sql` defines the tables, private buckets, staff access policies and tracking RPC used by this endpoint. Do not blindly re-run the whole schema against production; verify these existing resources first.

Deploy `supabase functions deploy submit-inquiry --project-ref lvciyxnafwhrtrgmmjxw` from an authenticated Supabase CLI. The function uses runtime-injected SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Never put a service-role key in Vite variables.

Deploy the storefront build with its existing VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. No live deployment was performed during this change.

## Admin implementation contract

Read `customer_requests` and `career_applications` using the signed-in staff Supabase client (existing RLS requires active staff membership). Do not read browser-local request/application arrays as the source of truth. Request notes contain delivery details. Use short-lived signed download URLs for `inspiration_path` and `resume_path`; buckets stay private. Career applications currently belong to the storefront's displayed Content Creator role; `career_id` is null until the admin role catalogue is connected.

The current admin request/application screens still use local data and must be wired to these tables during the admin work. This change supplies persistence, not that unfinished admin integration.

## Validation

`node --test tests/submissions.test.mjs` tests calendar edge cases and the endpoint with an isolated database/storage mock. Browser checks cover a failed request retaining entries, retry success, custom-gift submission and WhatsApp details. Build and storefront lint are also checked. These checks do not establish live database persistence; after deployment, verify a test request and application from a separate authenticated staff session, including private file download.
