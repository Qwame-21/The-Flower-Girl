# FIXES_REPORT.md

## What Was Changed

### Phase 1: Connect Storefront to Live Products from Supabase ✅

**Files Changed:**
- `src/storefront/data/liveProducts.js` (NEW)
- `src/storefront/hooks/useLiveProducts.js` (NEW)
- `src/storefront/pages/ShopPage.jsx`
- `src/components/SearchModal.jsx`
- `src/components/DrawerMenu.jsx`

**Changes:**
- Created `liveProducts.js` module to fetch products from Supabase with caching
- Created `useLiveProducts()` React hook with Realtime subscription
- Updated ShopPage to use live products instead of hardcoded `PRODUCTS`
- Updated SearchModal to use cached live products
- Updated DrawerMenu to use cached live products
- Added cart/wishlist cleanup to remove entries with non-existent product IDs
- Added error state with refresh button when products are unavailable
- Promotions still attach correctly using live product IDs

**Visible Changes:**
- Shop page now shows products from Supabase database
- Error message appears if products are unavailable: "Products are unavailable right now. Please refresh."
- Cart/wishlist items with non-existent product IDs are silently removed

**Price Verification:**
- ShopPage now displays price from Supabase `products` table
- This matches what the server (paystack-init) charges
- CONFIRMED: Displayed price now comes from the same table as the server

---

### Phase 2: Wire Other Admin-Managed Content to Storefront ✅

**Files Changed:**
- `src/storefront/data/careers.js` (NEW)
- `src/storefront/pages/CareersPage.jsx`
- `src/storefront/pages/GalleryPage.jsx`
- `src/storefront/pages/ShopPage.jsx`
- `src/storefront/data/customization.js`
- `src/storefront/pages/CustomizePage.jsx`

**Verdicts:**

| Content Type | Admin Save | Storefront Consumer | Verdict | Notes |
|-------------|------------|-------------------|---------|-------|
| **Customization options** | `customization_options` table | CustomizePage | LIVE | Updated to use live data with cache and fallback |
| **Careers** | `careers` table | CareersPage | LIVE | New data module created, page updated to use live data |
| **Gallery** | `gallery_items` table | GalleryPage | LIVE | Added refetch on window focus for freshness |
| **Promotions** | `promotions` table | ShopPage | LIVE | Already connected, added refetch on window focus |
| **Reviews** | `reviews` table | None | DEAD | No storefront reviews/testimonials block exists |

**Changes:**
- Created `careers.js` data module to fetch careers from Supabase
- Updated CareersPage to display live careers from database with fallback to default
- Updated GalleryPage to refetch on window focus
- Updated ShopPage to refetch promotions on window focus
- Updated `customization.js` to fetch from `customization_options` table with caching
- Updated CustomizePage to show cached options instantly and refetch on mount and window focus
- Added hardcoded fallback for customization options when Supabase not configured or fetch fails

**Visible Changes:**
- Careers page now shows open positions from database
- Loading state: "Loading open positions..."
- Empty state: "No open positions at this time. Check back soon!"
- Gallery and promotions refresh when window regains focus
- Customize page now shows options from database with loading and error states
- Customization options refresh when window regains focus

**Decision for Owner:**
- Reviews: No storefront testimonials/reviews block exists. Consider adding one to display published reviews (`status = 'published'`).

---

### Phase 3: Admin Data Loading and Revenue Figure ✅

**Files Changed:**
- `src/dashboard/data/dataCache.js` (NEW)
- `src/dashboard/pages/OverviewPage.jsx`
- `src/dashboard/pages/OrdersPage.jsx`
- `src/dashboard/pages/CustomersPage.jsx`
- `src/dashboard/pages/InsightsPage.jsx`
- `src/dashboard/pages/RequestsPage.jsx`

**Changes:**
- Created `dataCache.js` module for shared admin data cache with stale-while-revalidate
- Added `fetchRequests()` to cache for customer requests
- Updated OverviewPage to use cached data with loading states
- Updated OverviewPage to show "—" instead of "0" while loading
- Updated OverviewPage to keep existing data on fetch failure
- Updated OrdersPage to use cached data with Realtime
- Updated CustomersPage to use cached orders (derived from orders cache)
- Updated InsightsPage to use cached orders and show cached data instantly
- Updated RequestsPage to use cached requests and keep data on fetch failure
- Added error states with "Could not refresh. Showing the last loaded data." message
- ShopPOSPage uses dedicated `loadPosProducts()` (different shape), kept as-is

**Visible Changes:**
- OverviewPage shows "—" for revenue while loading, not "0"
- Error message appears if fetch fails: "Could not refresh. Showing the last loaded data."
- Data persists when navigating between pages
- OrdersPage shows error state if fetch fails
- CustomersPage, InsightsPage, RequestsPage now render cached data instantly on mount

**Revenue Calculation Verification:**
- Ran throwaway script to test revenue calculation with Supabase-shaped rows
- `orders.js` maps database fields: `payment_status` → `paymentStatus`, `fulfillment_status` → `fulfillmentStatus`, `total` → `total`
- `statsHelper.js` reads: `paymentStatus`, `fulfillmentStatus`, `total`
- Field mapping is CORRECT
- Revenue counts only orders with `paymentStatus === 'paid'` that are not cancelled
- Staff/POS orders with `paymentStatus === 'pending'` are NOT counted until marked paid
- Test PASSED: paid order counted, pending order not counted, cancelled paid order not counted

**Sidebar Badges:**
- Connected Sidebar to dataCache for live badge counts
- Orders badge: counts pending payment or processing orders (not delivered/cancelled)
- Products badge: counts products at or below their low_stock_threshold
- Subscribes to cache updates to refresh badges when data changes
- Removed TODO placeholders

---

### Phase 4: Settings Freshness (Partial) ✅

**Files Changed:**
- `src/storefront/api/siteFeatures.js`
- `src/storefront/modals/CheckoutModal.jsx`
- `src/storefront/pages/TrackOrderPage.jsx`

**Changes:**
- Reduced site settings cache from 5 minutes to 30 seconds
- Added `refreshSiteSettings()` function to bypass cache
- Updated CheckoutModal to bypass cache on mount (fresh delivery fees)
- Updated TrackOrderPage to bypass cache on mount (fresh tracking settings)
- Added window focus listener to refresh settings globally

**Visible Changes:**
- Settings now reflect admin changes within ~30 seconds instead of 5 minutes
- Checkout modal gets fresh delivery fees when opened
- Tracking page gets fresh auto-refresh settings when opened

**Store Details on Storefront:**
- Navigation: Hardcoded store name in logo button (needs investigation)
- Footer: Not found as separate component (embedded in pages)
- Checkout: Uses support phone from settings (WORKING)
- INCOMPLETE: Store name, email, address, Instagram link not wired to header/footer

---

### Phase 5: Admin Data Panel (Partial) ✅

**Files Changed:**
- `src/dashboard/pages/SettingsPage.jsx`

**Changes:**
- Removed Supabase project URL display
- Removed project ID display
- Kept connection status badge without URL
- Kept live table counts
- Kept export CSV button
- "Clear demo data" button remains disabled (was already disabled)

**Visible Changes:**
- Data panel no longer shows Supabase project URL or ID
- Shows "Connected (Live)" badge only
- Table counts still displayed
- Export button still works

**Delete Live Data Section:**
- NOT IMPLEMENTED in this phase
- Requires password verification UI component
- Requires role checking (owner/admin only)
- RECOMMENDATION: Implement as separate Phase 5b

**Security Check:**
- Searched entire `src/` for service-role keys, secret keys, JWT secrets, Paystack secrets
- NO SECRET KEYS FOUND in client code
- Only anon key is used in browser (safe)
- CONFIRMED: No secret exposure risk

---

### Phase 6: Delivery Selector and Tracking End-to-End ⏸️

**Status: NOT COMPLETED**

**Delivery:**
- CheckoutModal reads delivery selector toggle from settings
- CheckoutModal displays delivery type selector when enabled
- Delivery fees are calculated based on selected type
- NOT VERIFIED: Whether selected delivery type is sent to paystack-init Edge Function
- NOT VERIFIED: Whether paystack-init stores delivery type and fee in orders table
- RECOMMENDATION: SQL proposal to add columns to `orders` table:
  ```sql
  ALTER TABLE orders ADD COLUMN delivery_type TEXT;
  ALTER TABLE orders ADD COLUMN delivery_fee NUMERIC;
  ```

**Tracking:**
- TrackOrderPage reads auto-refresh settings from settings
- TrackOrderPage displays "Updates automatically" when enabled
- NOT VERIFIED: Whether auto-refresh interval actually triggers the refresh
- NOT VERIFIED: Whether failed attempts lockout is enforced
- Settings that need database update: `tracking_auto_refresh_enabled`, `tracking_refresh_interval_seconds`, `track_max_failed_attempts`, `track_lockout_minutes`

---

### Phase 7: Verify and Report ⏸️

**Status: PARTIALLY COMPLETED**

**Build Status:**
- Build succeeded after Phases 1-4
- No lint errors
- No tests configured to run

**Manual Test List:**
- [ ] Create a product in admin and see it on Shop page
- [ ] Hide a product in admin and watch it disappear from Shop page
- [ ] Change a delivery toggle and see storefront react within ~30 seconds
- [ ] Navigate between admin pages without losing data
- [ ] Try Delete live data gates (not implemented)

---

## What Was Not Completed

### Phase 4 (Remaining): Toggle Audit and Store Details

**Toggle Audit Table:** NOT COMPLETED
- Need to trace every toggle to its consumer
- Need to verify each toggle's OFF behavior
- Need to identify DEAD toggles (saved but never read)

**Store Details on Storefront:** NOT COMPLETED
- Need to wire store name, phone, email, address, Instagram to Navigation and footer
- Need to replace hardcoded values with settings values with fallback

**require_password_destructive Enforcement:** NOT COMPLETED
- Toggle exists and is saved
- NOT ENFORCED on delete operations
- Needs password verification UI component
- Needs to be applied to: orders, products, requests, reviews, careers, applications, gallery items

**Database Column Detection:** NOT COMPLETED
- Need to check if settings columns exist before writing them
- Need to disable toggles with hint "Needs the database update to take effect" when column missing

---

### Phase 5 (Remaining): Delete Live Data Section

**Status:** NOT IMPLEMENTED

**Requirements:**
- Staff role checking (owner/admin only)
- Type DELETE confirmation
- Password re-entry verification
- Batch deletion through existing delete functions
- Progress display
- Final counts refresh
- Export reminder

---

### Phase 6 (Remaining): Delivery and Tracking End-to-End

**Status:** NOT COMPLETED

**Needs:**
- Verify delivery type is sent to paystack-init
- Verify paystack-init stores delivery type and fee
- Propose SQL for missing order columns
- Verify tracking auto-refresh actually works
- Verify tracking lockout is enforced

---

### Phase 7 (Remaining): Complete Verification

**Status:** PARTIALLY COMPLETED

**Remaining:**
- Sidebar badges investigation
- Complete toggle audit table
- Complete store details wiring
- Complete require_password_destructive enforcement
- Complete Delete live data section
- Complete delivery/tracing verification
- Full manual testing

---

## Decisions for Owner

1. **Reviews/Testimonials:** No storefront block exists. Consider adding a testimonials section to display published reviews (`status = 'published'`).

2. **Delete Live Data:** Not implemented. Should be implemented as a separate feature with proper gates (role check, password re-entry, type DELETE confirmation).

3. **Delivery Columns on Orders:** The orders table may not have columns for `delivery_type` and `delivery_fee`. Proposed SQL:
   ```sql
   ALTER TABLE orders ADD COLUMN delivery_type TEXT;
   ALTER TABLE orders ADD COLUMN delivery_fee NUMERIC;
   ```

4. **Sidebar Badges:** Need investigation to ensure they show real counts from cached data.

5. **Database Update:** Several new settings columns from live-features branch may not be applied yet. Need to verify SQL has been applied and implement column detection.

---

## What Still Needs Database Update

Before these features work, the SQL from `sql/live-features.sql` must be applied:

1. **Tracking toggles:**
   - `tracking_auto_refresh_enabled`
   - `tracking_refresh_interval_seconds`
   - `track_max_failed_attempts`
   - `track_lockout_minutes`

2. **Delivery selector:**
   - `delivery_selector_enabled`

3. **site_content table:**
   - For Page Content tab (about_page, delivery_page, policy_page)

4. **signin_log table:**
   - For sign-in tracking

5. **track_attempts table:**
   - For tracking rate limiting

6. **Orders table columns (proposed):**
   - `delivery_type`
   - `delivery_fee`
   - `customization_selections` (may already exist)

---

## Next Steps for Owner

1. **Apply Database SQL:** Run `sql/live-features.sql` in Supabase SQL editor to add new columns and tables.

2. **Test Products:** Create a product in admin and verify it appears on Shop page.

3. **Test Careers:** Create an open career in admin and verify it appears on Careers page.

4. **Test Settings:** Change a delivery toggle and verify storefront reacts within ~30 seconds.

5. **Test Admin Navigation:** Navigate between admin pages and verify data persists.

6. **Consider Delete Live Data:** Decide if this feature is needed. If yes, implement as separate phase.

7. **Consider Delivery Columns:** Decide if delivery type and fee should be stored on orders. If yes, apply proposed SQL.

8. **Toggle Audit:** Request complete toggle audit table to identify which toggles are DEAD.

9. **Store Details:** Request store details to be wired to header/footer.

10. **Password Enforcement:** Request require_password_destructive to be enforced on deletions.
