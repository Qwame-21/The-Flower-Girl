# Live admin test handoff

The Vercel configuration serves `/admin` through the SPA and redirects legacy `/admin/login` links to `/admin`. Login and logout use the same canonical URL.

## Deployment configuration

Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the hosting project's environment for both preview and production, then rebuild. Local `.env.local` is ignored by Git and does not configure hosting. Never publish service-role or payment secret keys. Preserve the existing Paystack environment configuration; Hubtel is not integrated by this change.

## Test against the deployed URL

1. Open `/admin` in a private window: login must appear before dashboard content.
2. Sign in with an existing active staff account. Confirm the account menu's name, email and role match Supabase.
3. Refresh `/admin` and confirm the staff session restores. Log out and confirm the login screen returns; browser Back must not reopen protected content.
4. With a non-staff account, verify access is denied.
5. Check Orders, Requests and Careers for shared records. Use only explicitly designated test records for changes. Verify from a second authenticated browser that shared updates persist.
6. Check collapsed navigation, account actions and forms at desktop and phone widths, including keyboard focus and Escape dismissal.

New browsers no longer receive seeded orders or reviews. Known historical demo IDs remain filtered in the admin view; stored business records and gallery assets are preserved. Products, collections, reviews, content, preferences and manual orders currently use browser storage, so these are not shared production workflows. Overview requests/applications still need reconciliation with the shared backend.

A successful build does not validate payment settlement, database policies, private downloads or staff permissions on the live host. These require the live checks above. Do not run schema.sql blindly against the existing project.

## Full reset requested after demo-only cleanup

The user subsequently requested deletion of stored business records while preserving the gallery. `scripts/reset-business-data.sql` is prepared but has NOT been executed. It copies the explicit business table list into a private backup schema and deletes those rows in one transaction. Staff profiles, authentication accounts, gallery records and storage objects are excluded. It uses no cascading deletion and aborts if its snapshot tables already exist. A database owner must run it in the correct project; the browser publishable key cannot execute SQL.

This script does not clear browser-local records, carts, wishlists or private uploaded files. Those remain until a separate scoped reset is performed. Do not delete gallery images or authentication storage when clearing browser data. The existence of this script must not be reported as a completed reset.

## Reset controls

Settings → Security now has separate local and database reset controls with typed confirmation. The local reset preserves gallery and preferences, saves a timestamped localStorage backup, and clears business collections, copy, cart and wishlist. The database control invokes the owner-only `reset_business_data` RPC. Install `supabase/migrations/20260908120000_reset_business_data.sql` as database owner before using it. Installing the migration does not delete records. The RPC snapshots rows into a private schema and deletes the explicit table list atomically. Gallery, staff accounts, preferences and storage files are excluded. No reset was executed during UI testing. Private snapshots can be restored only by a database owner; local backups remain in that browser's storage.
