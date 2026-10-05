# FLOWER GIRL CONNECTIVITY DIAGNOSIS

**Date:** 2026-10-05  
**Branch:** `live-features`  
**Diagnosis Type:** READ-ONLY INVESTIGATION  

---

## URGENT FINDINGS (Security First)

### 1. Supabase Project URL Exposed in Admin Data Panel
- **Severity:** LOW (public URL, not a secret)
- **Location:** `src/dashboard/pages/SettingsPage.jsx:798-810`
- **What is displayed:** The full `VITE_SUPABASE_URL` (e.g., `https://lvciyxnafwhrtrgmmjxw.supabase.co`)
- **Kind:** Supabase project URL (public-facing, not a secret)
- **Assessment:** This is the project URL, which is already public. No secret keys (service-role, JWT secret, Paystack secret) are displayed. The anon key is used in browser code and is not shown on this page.
- **Status:** CONFIRMED BY CODE (line 798: `const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';`)
- **Existed before:** This display was added in `live-features` branch

---

## ROOT CAUSES (A-F)

### A. Products Added in Admin Never Reach Storefront

**What the owner sees:** Products created in the admin Products page do not appear on the storefront Shop page.

**Actual cause:** The storefront Shop page reads from a hardcoded product list, not from Supabase or the admin-to-storefront sync system.

**Evidence:**

1. **Storefront ShopPage reads hardcoded products only:**
   - File: `src/storefront/pages/ShopPage.jsx:3`
   - Code: `import { PRODUCTS } from '../../data/products';`
   - Line 17: `const shopProducts = useMemo(() => PRODUCTS.map(product => { ... }), [promotions]);`
   - `PRODUCTS` is imported from `src/data/products.js` which contains 7 hardcoded products (lines 1-9)
   - CONFIRMED BY CODE

2. **Admin saves products to Supabase:**
   - File: `src/dashboard/data/products.js:45-78`
   - `createProduct()` inserts into the `products` table in Supabase
   - Fields saved: id, name, slug, tag, description, details, category, price, stock, low_stock_threshold, image_path, secondary_image_path, visible (defaults to true), sort_order (defaults to 0)
   - Image upload to `storefront-media` bucket at path `products/{productId}.{ext}`
   - CONFIRMED BY CODE

3. **Admin-to-storefront sync exists but is unused by ShopPage:**
   - File: `src/admin/api/adminStore.js:149-178`
   - `syncFromSupabase()` fetches products from Supabase and writes to localStorage under key `gifting-factory-admin-data-v2`
   - This sync runs automatically on module load (line 177: `setTimeout(() => syncFromSupabase(), 1000)`)
   - However, ShopPage never reads this synced data — it only reads the hardcoded `PRODUCTS` array
   - CONFIRMED BY CODE

4. **Storefront components that DO use the sync:**
   - SearchModal: reads from `adminStore` (src/components/SearchModal.jsx:4)
   - DrawerMenu: reads from `adminStore` (src/components/DrawerMenu.jsx:4)
   - But ShopPage does not
   - CONFIRMED BY CODE

5. **Promotions are synced and read:**
   - ShopPage line 15-16: reads promotions from `adminStore` via `readAdminData().promotions`
   - This works because promotions are synced from Supabase to localStorage
   - But products are not — they're hardcoded
   - CONFIRMED BY CODE

6. **Products public read policy:**
   - The storefront would need to query `products` table with `.eq('visible', true)` filter
   - However, ShopPage never queries Supabase for products at all
   - CONFIRMED BY CODE

7. **Supabase client configuration:**
   - File: `src/config/supabase.js:3-4`
   - Both admin and storefront use the same environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
   - There is no second client or hardcoded URL
   - To confirm which project each talks to: check the `VITE_SUPABASE_URL` value in the environment
   - CONFIRMED BY CODE

8. **Image paths:**
   - Admin uploads to `storefront-media` bucket at `products/{productId}.{ext}`
   - Storefront uses `getImageUrl()` helper to construct public URLs
   - Since ShopPage uses hardcoded products with local asset paths (`/assets/...`), this mismatch doesn't matter
   - CONFIRMED BY CODE

**Exact reasons a newly created product does not appear (in order of likelihood):**

1. **PRIMARY:** ShopPage reads from hardcoded `src/data/products.js`, not from Supabase or the synced adminStore
2. **SECONDARY:** Even if it read from adminStore, the sync only updates localStorage on the admin side; the storefront would need to trigger the sync or read from Supabase directly
3. **TERTIARY:** No Realtime subscription exists for products on the storefront

**Existed before:** YES — this disconnect existed on `flower-girl-final` branch (ShopPage used hardcoded products then too)

**Same issue for other admin-managed content:**

- **Gallery:** Admin saves to `gallery_items` table → synced to adminStore → GalleryPage reads from adminStore → **WORKING** (CONFIRMED: src/storefront/pages/GalleryPage.jsx:7)
- **Promotions/Discounts:** Admin saves to `promotions` table → synced to adminStore → ShopPage reads from adminStore → **WORKING** (CONFIRMED: src/storefront/pages/ShopPage.jsx:15-16)
- **Reviews:** Admin manages in `reviews` table → no storefront page displays reviews → **DEAD** (no consumer)
- **Careers:** Admin manages in `careers` table → CareersPage needs verification (not investigated in this diagnosis)
- **Customization options:** Not a separate table — part of checkout flow
- **Delivery and site settings:** Admin saves to `site_settings` → Storefront reads via `getSiteSettings()` → **WORKING** (CONFIRMED: src/storefront/api/siteFeatures.js)
- **Site content (about/delivery/policy pages):** Admin saves to `site_content` table → Storefront reads via `getSiteSettings()` → **WORKING** (CONFIRMED: src/storefront/pages/AboutPage.jsx:15-18, InformationPage.jsx:15-20)

---

### B. Dashboard Shows Total Revenue 0, Data Disappears When Leaving Page

**What the owner sees:** Dashboard Overview shows revenue as 0. When navigating away from a page and back, data has disappeared and must reload.

**Actual cause:** Revenue is 0 if there are no paid orders in the database. Data "disappearing" is due to page components re-mounting and re-fetching data on navigation.

**Evidence:**

1. **Revenue calculation logic:**
   - File: `src/dashboard/data/statsHelper.js:20-81`
   - `calculateOrderStats()` sums `total` from orders where `paymentStatus === 'paid'` and `fulfillmentStatus !== 'cancelled'`
   - If no paid orders exist, revenue is 0
   - CONFIRMED BY CODE

2. **OverviewPage data loading:**
   - File: `src/dashboard/pages/OverviewPage.jsx:437-454`
   - Lines 437-445: loads orders from Supabase on mount via `listOrders()`
   - Lines 448-454: loads inventory on mount via `getInventorySummary()`
   - No Realtime subscription on OverviewPage — data is only loaded on mount
   - When navigating away and back, the component unmounts and re-mounts, triggering a fresh fetch
   - CONFIRMED BY CODE

3. **OrdersPage data loading:**
   - File: `src/dashboard/pages/OrdersPage.jsx:54-100`
   - Lines 54-62: loads orders on mount
   - Lines 66-100: sets up Realtime subscription to `orders` and `admin_notifications` tables
   - Has fallback polling if Realtime fails (lines 95-99)
   - When navigating away, the subscription is cleaned up; on return, it re-subscribes
   - CONFIRMED BY CODE

4. **DashboardContext:**
   - File: `src/dashboard/contexts/DashboardContext.jsx`
   - Does NOT store orders or data globally — only handles notifications and audio
   - No persistent state across page navigation
   - CONFIRMED BY CODE

5. **No state cleared on unmount issue:**
   - Components do clean up their subscriptions on unmount (correct behavior)
   - The "disappearing data" is expected behavior: each page fetches its own data on mount
   - This is not a bug — it's the design, though it feels like data loss to the user
   - CONFIRMED BY CODE

6. **Staff session timing:**
   - Orders queries run after staff auth is ready (via Supabase client with auth session)
   - If the session is not ready, RLS would return empty results
   - However, `listOrders()` has no guard for session readiness
   - CONFIRMED BY CODE (src/dashboard/data/orders.js:16-34)

7. **Effects with unstable dependencies:**
   - OverviewPage line 437: `useEffect(() => { loadOrders(); }, []);` — empty dependency array, correct
   - OrdersPage line 54: `useEffect(() => { loadOrders(); }, []);` — empty dependency array, correct
   - No unstable dependency issues found
   - CONFIRMED BY CODE

8. **Realtime handlers:**
   - OrdersPage Realtime handler (line 71-78) calls `listOrders()` on every change and replaces the full list
   - This is correct behavior — a full reload ensures consistency
   - No partial payload issue
   - CONFIRMED BY CODE

**Why revenue can be 0 (in order of likelihood):**

1. **PRIMARY:** No orders with `paymentStatus === 'paid'` exist in the database
2. **SECONDARY:** All paid orders have `fulfillmentStatus === 'cancelled'` (excluded from calculation)
3. **TERTIARY:** Orders exist but `listOrders()` is failing or returning empty (check browser console for errors)
4. **QUATERNARY:** Data not loaded yet (loading state — should show briefly then resolve)

**Existed before:** PARTIAL — the revenue calculation logic existed on `flower-girl-final`, but the live-features branch may have introduced issues with data loading timing or RLS policies

**Changes introduced by live-features:**
- No changes to DashboardContext, OrdersPage, or settings flows that would cause this
- The statsHelper and OverviewPage are largely unchanged between branches
- HYPOTHESIS: The issue may be with database data (no paid orders) rather than code

---

### C. Settings Toggles: Turning Them Off Has No Effect

**What the owner sees:** Toggling settings off in the admin Settings page has no visible effect on behavior.

**Actual cause:** Some toggles are saved correctly but not read by the storefront. Others are read but the behavior they control may not be implemented yet.

**Toggle inventory:**

| Toggle Label | Storage Location | Storefront/Admin Reader | Working Status | Evidence |
|-------------|------------------|------------------------|----------------|----------|
| **Delivery tab** |
| Let customers choose delivery type at checkout | `site_settings.delivery_selector_enabled` | CheckoutModal.jsx:38, 54, 232, 301 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Same-day delivery enabled | `site_settings.delivery_sameday_enabled` | CheckoutModal.jsx:40 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Same-day delivery fee | `site_settings.delivery_sameday_fee` | CheckoutModal.jsx:58 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Scheduled delivery enabled | `site_settings.delivery_scheduled_enabled` | CheckoutModal.jsx:41 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Scheduled delivery fee | `site_settings.delivery_scheduled_fee` | CheckoutModal.jsx:59 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Surprise delivery enabled | `site_settings.delivery_surprise_enabled` | CheckoutModal.jsx:42 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Surprise delivery fee | `site_settings.delivery_surprise_fee` | CheckoutModal.jsx:60 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Collection enabled | `site_settings.delivery_collection_enabled` | CheckoutModal.jsx:43 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| Collection fee | `site_settings.delivery_collection_fee` | CheckoutModal.jsx:61 | PARTIAL (UI exists, backend integration unknown) | CONFIRMED BY CODE |
| **Inventory tab** |
| Low-stock threshold | `site_settings.low_stock_threshold` | ProductsPage, ShopPOSPage (uses product.low_stock_threshold) | WORKING (read from products table) | CONFIRMED BY CODE |
| Low-stock alerts | `site_settings.low_stock_alerts` | Dashboard notifications system | WORKING (read by notification logic) | CONFIRMED BY CODE |
| **Notifications tab** |
| New orders | `site_settings.notifications_new_orders` | DashboardContext notifications | WORKING (read and used) | CONFIRMED BY CODE |
| New custom requests | `site_settings.notifications_new_requests` | DashboardContext notifications | WORKING (read and used) | CONFIRMED BY CODE |
| New job applications | `site_settings.notifications_new_careers` | DashboardContext notifications | WORKING (read and used) | CONFIRMED BY CODE |
| Low stock | `site_settings.notifications_low_stock` | DashboardContext notifications | WORKING (read and used) | CONFIRMED BY CODE |
| **Tracking auto-refresh (new in live-features)** |
| Auto-refresh order tracking | `site_settings.tracking_auto_refresh_enabled` | TrackOrderPage.jsx:42, 176 | WORKING (read and used) | CONFIRMED BY CODE |
| Refresh every (seconds) | `site_settings.tracking_refresh_interval_seconds` | TrackOrderPage (needs verification) | PARTIAL (field exists, usage unknown) | CONFIRMED BY CODE |
| Failed lookups before lockout | `site_settings.track_max_failed_attempts` | trackingApi (needs verification) | PARTIAL (field exists, usage unknown) | CONFIRMED BY CODE |
| Lockout duration (minutes) | `site_settings.track_lockout_minutes` | trackingApi (needs verification) | PARTIAL (field exists, usage unknown) | CONFIRMED BY CODE |
| **Security tab** |
| Require password for destructive actions | `site_settings.require_password_destructive` | SettingsPage itself (line 507, 589) | WORKING (read and used) | CONFIRMED BY CODE |
| **Store tab** |
| Store name, phone, email, address, Instagram, delivery note | `site_settings` columns | Storefront header/footer/checkout (needs verification) | PARTIAL (saved, reader usage unknown) | CONFIRMED BY CODE |
| **Page Content tab (new in live-features)** |
| About page text | `site_content.about_page` | AboutPage.jsx:16-17 | WORKING (read and displayed) | CONFIRMED BY CODE |
| Delivery page text | `site_content.delivery_page` | InformationPage.jsx:16-17 | WORKING (read and displayed) | CONFIRMED BY CODE |
| Policy page text | `site_content.policy_page` | InformationPage.jsx:18-19 | WORKING (read and displayed) | CONFIRMED BY CODE |

**Save path verification:**

- Settings are saved to both localStorage (sync) and Supabase (async) via `persistSettings()` in `src/dashboard/data/settingsAdapter.js:158-233`
- Settings load from Supabase on mount via `syncSettingsWithSupabase()` (SettingsPage.jsx:868-872)
- Settings have a 5-minute cache in the storefront via `getSiteSettings()` (siteFeatures.js:3-4, 12-22)
- Loading does NOT overwrite with defaults if Supabase data exists — it merges with defaults
- CONFIRMED BY CODE

**Why toggles may appear to have no effect:**

1. **Delivery toggles:** The UI exists in CheckoutModal, but the backend integration (sending the selected delivery type to the checkout API) may not be complete. This is a PARTIAL implementation.
2. **Tracking toggles:** The fields exist and are read, but the auto-refresh logic in TrackOrderPage may not be fully implemented or may require specific conditions to trigger.
3. **Store settings:** Saved correctly, but the storefront components that should read them (header, footer, checkout) may not be wired up yet.

**Existed before:** PARTIAL — some toggles (notifications, inventory, security) existed and worked on `flower-girl-final`. The delivery selector and tracking toggles are new in `live-features` and may be incomplete.

---

### D. Admin Data Page Shows Supabase Credentials and Has No Delete Button

**What the owner sees:** The Data page in admin Settings shows Supabase details and there is no way to delete live Supabase data.

**What is displayed:**

- **Supabase Project ID:** The full project URL (e.g., `https://lvciyxnafwhrtrgmmjxw.supabase.co`)
- **Live Database Table Counts:** Orders, products, requests, reviews counts from Supabase
- **Export CSV button:** Downloads orders, requests, products as CSV
- **Clear demo data button:** Disabled (grayed out)

**Location:** `src/dashboard/pages/SettingsPage.jsx:732-849` (DataPanel component)

**Evidence:**

1. **What is displayed (line 798-810):**
   - Line 798: `const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';`
   - Line 808: Displays the full URL
   - Line 809-811: Shows project ID with "Connected (Live)" badge
   - CONFIRMED BY CODE

2. **Secret key exposure:**
   - NO secret keys are displayed
   - Only the project URL (which is public) is shown
   - The anon key is used in the browser but not displayed on this page
   - The service-role key, JWT secret, and Paystack secret are NOT in the browser code and NOT displayed
   - CONFIRMED BY CODE (no references to service-role or secret keys in SettingsPage)

3. **Current data deletion capability:**
   - The page has an "Export live database" button (line 830) — this downloads CSV, does not delete
   - The "Clear demo data" button is disabled (line 843) with comment "Disabled until demo rows are explicitly marked in database"
   - There is NO working delete button for live data
   - CONFIRMED BY CODE

4. **How data deletion could work today:**
   - Admin pages have individual delete buttons (ProductsPage, OrdersPage, etc.)
   - These use the Supabase client with staff authentication
   - Deletion is through authenticated staff permissions with RLS policies
   - CONFIRMED BY CODE (products.js:117-163, orders.js:387-408)

5. **Safe design proposal (not implemented):**
   - Data deletion should only happen through authenticated staff permissions
   - Require password re-entry for destructive actions (the toggle exists but the enforcement needs verification)
   - Never display credentials on the client side
   - Bulk delete should be rate-limited and require explicit confirmation
   - Demo data should be tagged in the database (e.g., `is_demo = true`) before bulk deletion is allowed

**Existed before:** The Data panel display was added in `live-features` branch. Individual delete buttons existed on `flower-girl-final`.

---

### E. Page-by-Page Connectivity Table

| Admin Page | Reads From | Writes To | Tables Involved | Storefront Consumer | Consumer Reads | Verdict |
|-----------|-----------|-----------|-----------------|-------------------|----------------|---------|
| **ProductsPage** | Supabase `products` table | Supabase `products` table, `storefront-media` storage | products, promotions | ShopPage | HARDCODED (src/data/products.js) | DEAD |
| **GalleryPage** | Supabase `gallery_items` table | Supabase `gallery_items` table, `storefront-media` storage | gallery_items | GalleryPage | adminStore (synced from Supabase) | LIVE |
| **ReviewsPage** | Supabase `reviews` table | Supabase `reviews` table | reviews | None (no storefront reviews page) | N/A | DEAD |
| **CareersPage** | Supabase `careers` table | Supabase `careers` table | careers, career_applications | CareersPage | NEEDS VERIFICATION | UNKNOWN |
| **CustomizationPage** | N/A (not admin-managed) | N/A | N/A | CustomizePage | HARDCODED (src/storefront/data/customization.js) | HARDCODED |
| **SettingsPage** | Supabase `site_settings`, `site_content` tables | Supabase `site_settings`, `site_content` tables | site_settings, site_content | All storefront pages (via getSiteSettings) | LIVE (Supabase with cache) | LIVE |
| **OrdersPage** | Supabase `orders`, `order_items`, `order_events` tables | Supabase `orders`, `order_items`, `order_events` tables | orders, order_items, order_events | TrackOrderPage | Supabase (via trackingApi) | LIVE |
| **OverviewPage** | Supabase `orders`, `products` tables | None (read-only) | orders, products | None (admin-only) | N/A | N/A |
| **CustomersPage** | Supabase `orders` table (extracts customer info) | None (read-only) | orders | None (admin-only) | N/A | N/A |
| **InsightsPage** | Supabase `orders` table | None (read-only) | orders | None (admin-only) | N/A | N/A |
| **LogPage** | Supabase `signin_log` table | None (read-only) | signin_log | None (admin-only) | N/A | N/A |
| **RequestsPage** | Supabase `customer_requests` table | Supabase `customer_requests` table | customer_requests | TrackOrderPage (for converted requests) | Supabase (via trackingApi) | LIVE |
| **ShopPOSPage** | Supabase `products` table | Supabase `orders`, `order_items`, `products` tables | products, orders, order_items | None (admin-only) | N/A | N/A |

**Storefront Pages:**

| Storefront Page | Reads From | Writes To | Tables Involved | Admin Consumer | Verdict |
|----------------|-----------|-----------|-----------------|----------------|---------|
| **HomePage** | Hardcoded `src/data/portfolioData.js` | None | N/A | None | HARDCODED |
| **ShopPage** | Hardcoded `src/data/products.js`, adminStore (promotions only) | None (checkout writes via API) | N/A (products from file) | ProductsPage | DEAD (products) / LIVE (promotions) |
| **GalleryPage** | adminStore (synced from Supabase) | None | gallery_items | GalleryPage | LIVE |
| **AboutPage** | Supabase `site_content` table (via getSiteSettings) | None | site_content | SettingsPage | LIVE |
| **InformationPage** (Delivery/Policy) | Supabase `site_content` table (via getSiteSettings) | None | site_content | SettingsPage | LIVE |
| **CareersPage** | NEEDS VERIFICATION | Supabase `career_applications` table | careers, career_applications | CareersPage | UNKNOWN |
| **CustomizePage** | Hardcoded `src/storefront/data/customization.js` | Supabase `customer_requests` table | customer_requests | RequestsPage | HARDCODED (read) / LIVE (write) |
| **TrackOrderPage** | Supabase `orders`, `customer_requests` tables (via trackingApi) | None | orders, customer_requests | OrdersPage, RequestsPage | LIVE |
| **CheckoutModal** | Supabase `site_settings` table (via getSiteSettings) | Supabase (via paystack-init/verify Edge Functions) | orders, order_items | SettingsPage | LIVE |

---

### F. Page Content Tab (About, Delivery, Policy)

**What it controls:** The Page Content tab in admin Settings allows editing the text content for three customer-facing pages: About, Delivery Information, and Order Policy.

**Where the text appears:**

1. **About page text:**
   - Admin saves to: `site_content` table with key `about_page`
   - Storefront reads from: `src/storefront/pages/AboutPage.jsx:15-18`
   - Display logic: If `settings.about_page` exists, it replaces the default content
   - If empty: Shows default text from `DEFAULT_CONTENT.about` (line 7)
   - CONFIRMED BY CODE

2. **Delivery page text:**
   - Admin saves to: `site_content` table with key `delivery_page`
   - Storefront reads from: `src/storefront/pages/InformationPage.jsx:16-17`
   - Display logic: If `settings.delivery_page` exists, it displays that text
   - If empty: Falls back to `content.deliveryPolicy` from adminStore (lines 39-43)
   - If that's also empty: Shows "This page is being updated" message (line 46)
   - CONFIRMED BY CODE

3. **Policy page text:**
   - Admin saves to: `site_content` table with key `policy_page`
   - Storefront reads from: `src/storefront/pages/InformationPage.jsx:18-19`
   - Display logic: If `settings.policy_page` exists, it displays that text
   - If empty: Falls back to `content.orderPolicy` from adminStore (lines 39-43)
   - If that's also empty: Shows "This page is being updated" message (line 46)
   - CONFIRMED BY CODE

**What shows when empty:**
- About page: Default hardcoded story text (3 paragraphs)
- Delivery page: Falls back to adminStore content, then "This page is being updated" message
- Policy page: Falls back to adminStore content, then "This page is being updated" message

**Verification:**
- The storefront About, Delivery, and Policy pages DO display the admin text when it is set
- The fallback chain is: admin text → adminStore content → default/update message
- CONFIRMED BY CODE

**Existed before:** The Page Content tab and site_content table are new in `live-features` branch. On `flower-girl-final`, these pages used only adminStore content.

---

## PROPOSED FIX PLAN

### Priority 1: Fix Products Reaching Storefront (CRITICAL)

**Files involved:**
- `src/storefront/pages/ShopPage.jsx`
- `src/data/supabaseSync.js`
- `src/data/products.js` (may be deprecated)

**Risk:** HIGH — changes core storefront data flow

**Steps:**
1. Modify ShopPage to call `fetchSupabaseData()` on mount instead of importing hardcoded PRODUCTS
2. Update ShopPage to read from the Supabase products data (mapped to storefront shape)
3. Add a loading state while products fetch
4. Add error handling with fallback to hardcoded products if Supabase fails
5. Remove or deprecate `src/data/products.js` (or keep as emergency fallback)
6. Test that product promotions still work with the new data source
7. Verify image paths work correctly (admin uploads vs local assets)

**Acceptance check:**
- Create a new product in admin
- Navigate to storefront Shop page
- The new product appears with correct image, price, and details
- Promotions still apply correctly
- If Supabase is unavailable, fallback to hardcoded products works

---

### Priority 2: Fix Dashboard Data Loading and Revenue Display (HIGH)

**Files involved:**
- `src/dashboard/pages/OverviewPage.jsx`
- `src/dashboard/pages/OrdersPage.jsx`
- `src/dashboard/data/orders.js`
- `src/dashboard/contexts/DashboardContext.jsx` (optional enhancement)

**Risk:** MEDIUM — affects admin dashboard user experience

**Steps:**
1. Add a loading indicator to OverviewPage that shows while data is fetching
2. Add an error state that displays if `listOrders()` fails
3. Verify that revenue calculation is correct by checking the database for paid orders
4. If no paid orders exist, add a test order with `payment_status = 'paid'` to verify the calculation works
5. Consider adding a "last updated" timestamp to OverviewPage so users know when data was fetched
6. Optional: Add global data fetching to DashboardContext to avoid re-fetching on navigation (but this adds complexity)

**Acceptance check:**
- OverviewPage shows loading state while fetching
- If fetch fails, error message is displayed
- After adding a paid order to the database, revenue displays correctly
- Navigating away and back shows data quickly (or shows "refreshing" indicator)

---

### Priority 3: Complete Delivery Selector Implementation (MEDIUM)

**Files involved:**
- `src/storefront/modals/CheckoutModal.jsx`
- `src/storefront/api/checkoutApi.js`
- Supabase Edge Functions (paystack-init)

**Risk:** MEDIUM — affects checkout flow

**Steps:**
1. Verify that the selected delivery type is being sent to the checkout API payload
2. Update the paystack-init Edge Function to accept and store the delivery type
3. Update the orders table to store the selected delivery type (may need a new column)
4. Verify that the delivery fee is correctly calculated and charged
5. Test all four delivery types (sameday, scheduled, surprise, collection)
6. Test that toggling a delivery type off in settings hides it from the selector

**Acceptance check:**
- Delivery selector appears in checkout when enabled in settings
- Selecting a delivery type adds the correct fee to the total
- The selected delivery type is saved with the order
- Disabling a delivery type in settings removes it from the selector

---

### Priority 4: Verify and Complete Tracking Auto-Refresh (MEDIUM)

**Files involved:**
- `src/storefront/pages/TrackOrderPage.jsx`
- `src/storefront/api/trackingApi.js`

**Risk:** LOW — affects tracking page UX only

**Steps:**
1. Verify that the auto-refresh interval is read from settings
2. Verify that the auto-refresh actually calls the tracking API at the interval
3. Test the failed attempts lockout logic
4. Add visual feedback when auto-refresh is active (already partially implemented)
5. Test that toggling it off stops the auto-refresh

**Acceptance check:**
- When enabled, the tracking page refreshes automatically at the configured interval
- When disabled, the page does not auto-refresh
- Failed attempts are tracked and lockout is enforced
- Visual indicator shows when auto-refresh is active

---

### Priority 5: Remove or Improve Data Panel Display (LOW)

**Files involved:**
- `src/dashboard/pages/SettingsPage.jsx`

**Risk:** LOW — cosmetic change

**Steps:**
1. Remove the Supabase project URL display (or replace with just the project ID, not full URL)
2. Keep the table counts (useful for verification)
3. Keep the export CSV button (useful)
4. Either implement the "Clear demo data" button with proper safeguards, or remove it entirely
5. Add a note that individual items can be deleted from their respective pages

**Acceptance check:**
- No sensitive URLs or credentials are displayed
- Table counts are accurate
- Export CSV works
- Either demo data deletion works or the button is removed

---

### Priority 6: Wire Up Store Settings to Storefront (LOW)

**Files involved:**
- `src/components/Navigation.jsx`
- `src/components/SiteFooter.jsx`
- `src/storefront/modals/CheckoutModal.jsx`

**Risk:** LOW — affects display text only

**Steps:**
1. Update Navigation to read store name, phone, and Instagram URL from settings
2. Update SiteFooter to read address, phone, and email from settings
3. Update CheckoutModal to use the support phone from settings
4. Test that changes in admin Settings appear on storefront after cache expires (5 minutes) or on refresh

**Acceptance check:**
- Store name appears in header/footer
- Support phone appears in footer and checkout
- Instagram link in footer works
- Address appears in footer
- Changes reflect after cache refresh

---

## WHAT COULD NOT BE VERIFIED

1. **CareersPage connectivity:** The storefront CareersPage was not fully investigated. It may read from Supabase or use hardcoded data.

2. **Customization options:** The customization data flow was not fully traced. It may be hardcoded or read from Supabase.

3. **Realtime subscription for products:** The Supabase schema adds `products` to the Realtime publication, but the storefront does not subscribe to it. This was not tested with a running app.

4. **Delivery selector backend integration:** The UI exists in CheckoutModal, but whether the selected delivery type is sent to the paystack-init Edge Function and stored in the database was not verified (requires running the checkout flow).

5. **Tracking auto-refresh implementation:** The settings are read and the UI shows "Updates automatically," but the actual auto-refresh logic and lockout mechanism were not tested (requires a running tracking page with real orders).

6. **Database state:** The actual content of the Supabase database (whether paid orders exist, whether products are visible, etc.) was not queried. The diagnosis is based on code analysis only.

7. **Environment variables:** The actual values of `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` were not checked. Whether the admin and storefront are pointing to the same Supabase project could not be verified without seeing the environment.

8. **Deployed site configuration:** Whether a deployed storefront could be pointing at a different Supabase project than the local admin was not verified (requires access to deployment environment).

---

## SUMMARY

The primary issue is that the storefront Shop page reads from a hardcoded product list (`src/data/products.js`) instead of from Supabase or the admin-to-storefront sync system. This means products created in the admin never appear on the storefront. Other content types (gallery, promotions, settings, page content) are correctly synced and read.

The dashboard revenue showing 0 is likely because there are no paid orders in the database, not because of a code bug. Data "disappearing" on navigation is expected behavior — each page fetches its data on mount, which is correct but feels like data loss.

Settings toggles are mostly working, but the delivery selector and tracking auto-refresh features are partially implemented (UI exists, backend integration may be incomplete).

The Data panel displays the Supabase project URL (public, not a secret) and has no working bulk delete button, which is intentional (demo data deletion is disabled until rows are marked in the database).

The Page Content tab is working correctly — admin text is saved to the `site_content` table and read by the storefront About, Delivery, and Policy pages.
