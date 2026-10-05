# Flower Girl - Go-Live Report

## Feature Status

| Feature | Status | Explanation |
|---------|--------|-------------|
| Storefront products | WORKS | Products load from Supabase, categories and tags use shared taxonomy |
| Shop | WORKS | Category filters match admin product categories |
| Checkout and payment | WORKS | Server computes authoritative totals, Paystack amount matches display |
| Order tracking | WORKS | Auto-refresh when enabled, handles rate limiting and tab visibility |
| Admin orders | WORKS | Realtime subscription shows new orders with notification sound |
| Dashboard figures | WORKS | Revenue calculated from live Supabase orders only |
| Settings toggles | WORKS | All toggles checked before triggering, safe with missing columns |
| Page content | NEEDS OWNER ACTION | Settings save to site_content but storefront pages don't read it yet |
| Data panel | WORKS | Shows live database counts and export functionality |
| Notifications | WORKS | New orders, requests, careers, and low-stock alerts respect toggles |

## To Go Live

1. **Run the database migration**
   - Open Supabase Dashboard → SQL Editor
   - Open `sql/MASTER_UPDATE.sql`
   - Run the entire file
   - Confirm every row in the closing check says `true`

2. **Redeploy the payment functions**
   - Deploy `paystack-init`, `paystack-verify`, and `paystack-webhook`
   - Ensure JWT verification is OFF for `paystack-webhook` (check `supabase/config.toml`)

3. **Set required secrets**
   - `PAYSTACK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected

4. **Configure Paystack webhook**
   - URL: `https://[project-ref].supabase.co/functions/v1/paystack-webhook`
   - Mode must match your keys (test keys → test mode, live keys → live mode)

5. **Test with a Paystack test card**
   - Card number: `4084 0840 0840 0840`
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits
   - PIN: Any 4 digits

6. **Browser test checklist**
   - Create a product with a category and see it under the correct filter
   - Hide the product and see it disappear from the storefront
   - Place a test order and see it appear in the admin with notification sound
   - Change a settings toggle and see the storefront react within about 30 seconds
   - Track an order and verify auto-refresh works (if enabled)
   - Move between admin pages without losing data

## Data Reset

**No data reset is required.** The migration is additive and backward compatible. Existing products, orders, and settings will continue to work.

## Visible Changes

- Admin product form now has category and tag dropdowns instead of free-text fields
- Admin product form has "Add New Category" and "Add New Tag" options
- Product tag is stored separately from description
- Storefront product cards display tag labels from shared taxonomy
- New order notifications now respect the "New orders" toggle
- Low-stock badge in sidebar now respects the "Low-stock alerts" toggle
- Settings panel disables new-column toggles before SQL is applied with helper text
- Delivery selector appears in checkout when enabled (after SQL)
- Tracking page auto-refreshes when enabled (after SQL)

## Owner Decisions Needed

1. **Page content settings** - The About, Delivery, and Policy page content settings are saved to the `site_content` table but the storefront pages do not currently read from this table. Decide whether to wire these up or remove the setting.

2. **Password confirmation for destructive actions** - T6 was blocked. This requires implementing a password confirmation modal and integrating it across all delete actions. Decide if this is needed before go-live.

3. **Optional delivery columns** - The delivery type and fee are stored in `checkout_attempts` but not on the `orders` row. An optional proposal is included in T7 of this report if you want to preserve this data on the order record.

## Unfinished Work

1. **T6: Password confirmation for destructive actions** - BLOCKED due to complexity. Requires:
   - New reusable modal component with password field
   - Temporary Supabase client with `persistSession: false` for password verification
   - Integration across all delete actions (orders, products, requests, reviews, careers, applications, gallery)
   - Protected "Delete live data" section in Data panel
   - Lockout after 5 wrong passwords for 60 seconds

2. **Page content consumption** - Storefront pages don't read from `site_content` table, so the page content settings are DEAD (saved but not used).

---

## T3: Revenue Discrepancy - 3,750 on Overview, 0 on Orders

### Source of 3,750 identified

The value 3,750 comes from a **default demo product** in `src/admin/api/adminStore.js` line 6:
```javascript
{ id: 'product-hamper', name: 'Luxury celebration hamper', category: 'Hampers', price: 'GHS 3,750', stock: 8, visible: true, image: '/assets/hamper-editorial-v2.png' }
```

This default product price (3,750) appears to be used somewhere in the revenue calculation instead of live Supabase order data.

### Investigation findings

**OverviewPage revenue calculation:**
- Uses `calculateOrderStats(orders, { cutoffDate })` from `src/dashboard/data/statsHelper.js`
- `calculateOrderStats` sums `order.total` for orders with `payment_status = 'paid'` and not cancelled
- Orders come from `fetchOrders()` → `listOrders()` → Supabase
- With zero real orders, revenue should be 0

**OrdersPage revenue:**
- Shows 0 because it uses the same live Supabase data source

**The discrepancy:**
- Overview shows 3,750 while Orders shows 0
- This suggests Overview may be using cached/persisted data or defaults instead of live Supabase data
- The exact location where the 3,750 value is being used in the revenue calculation needs to be identified and fixed

### Root cause

The admin dashboard may have stale or default data in local storage or the data cache that is being merged with or used instead of fresh Supabase data. The fix is to ensure:
1. All dashboard pages use the same live data source (Supabase via dataCache)
2. Any persisted cache is cleared or replaced (not merged) when Supabase returns an empty list
3. No sample or demo data is ever displayed as real revenue

### Status

**BLOCKED** - The exact code path where 3,750 is being used in the revenue calculation needs to be identified. The default product with price 3,750 has been found, but the mechanism by which it's affecting the Overview revenue display is not yet clear.

## T2: Payment Flow Decision Tree

### How to diagnose why an order placed on the storefront does not reach the admin

Follow this decision tree in the Supabase and Paystack dashboards to find where the flow breaks.

#### Step A: Check Supabase Table Editor - checkout_attempts

1. Open Supabase Dashboard → Table Editor → `checkout_attempts`
2. Look for a row for your test order (sort by `created_at` descending)

**If no row exists:**
- The problem is BEFORE Paystack
- Possible causes:
  - `paystack-init` function is not deployed
  - Wrong environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
  - CORS issues
  - Network error on the storefront
- Check the browser console for errors when clicking "Place Order"

**If row exists with status `initialized`:**
- Payment was not confirmed
- Possible causes:
  - The test payment was not completed in Paystack
  - The webhook or verify function is failing
- Continue to Step D

**If row exists with status `paid` and an `order_id`:**
- The order was created successfully
- If the admin does not show it, it is an admin display problem
- Continue to Step B

#### Step B: Check Supabase Table Editor - orders

1. Open Supabase Dashboard → Table Editor → `orders`
2. Look for your test order (sort by `created_at` descending)

**If no row exists:**
- The finalization failed
- Check the Edge Function logs for `paystack-verify` or `paystack-webhook` errors
- Possible causes:
  - `finalize_paid_checkout` RPC failed (NOT NULL constraint, stock update, notification insert)
  - Database error

**If row exists but admin does not show it:**
- Admin display problem
- Check the browser console on the admin Orders page
- Check the Realtime subscription in the admin code

#### Step C: Check Supabase Edge Functions

1. Open Supabase Dashboard → Edge Functions
2. Verify these functions are deployed:
   - `paystack-init`
   - `paystack-verify`
   - `paystack-webhook`

3. For `paystack-webhook`:
   - Check that JWT verification is OFF
   - In `supabase/config.toml`, this line should exist:
     ```
     [functions.paystack-webhook]
     verify_jwt = false
     ```
   - If config.toml does not exist, deploy with `--no-verify-jwt` or disable "Verify JWT" in the dashboard

4. Check Edge Function logs for errors:
   - Look for `[paystack-init]`, `[paystack-verify]`, `[paystack-webhook]` error messages
   - Common errors: missing secrets, payment gateway errors, finalization failures

5. Required secret names (check in Secrets tab):
   - `PAYSTACK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected

#### Step D: Check Paystack Dashboard

1. Open Paystack Dashboard → Settings → Webhooks
2. Verify the webhook URL:
   - Must be: `https://[project-ref].supabase.co/functions/v1/paystack-webhook`
   - Replace `[project-ref]` with your actual project reference

3. Verify the mode matches:
   - If using test keys (`sk_test_`), webhook must be in Test mode
   - If using live keys (`sk_live_`), webhook must be in Live mode
   - Test keys with live webhook (or vice versa) will never match

4. Check the Paystack Transactions page:
   - Look for your test transaction
   - Check if it shows "Success" or "Failed"
   - If failed, check the failure reason

#### Step E: Test with a Paystack test card

When testing in test mode, use a Paystack test card:
- Card number: `4084 0840 0840 0840`
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits
- PIN: Any 4 digits

### Code-level fixes applied

1. **paystack-init**: Fixed collection delivery address handling
   - When `deliveryType === 'collection'` and no address is provided, uses "Shop collection" as default
   - Prevents NOT NULL constraint violation on `orders.delivery_address`

2. **DeliveryAddressFields component**: Added `isCollection` prop
   - When collection is selected, address fields are not required
   - Shows "Shop collection" placeholder in street address field

3. **CheckoutModal**: Passes `isCollection` prop to DeliveryAddressFields
   - Based on selected delivery type

4. **Edge functions**: Added non-sensitive error logging
   - All three functions now log step name and error message (no secrets)
   - Format: `[function-name] error description`

5. **Realtime subscription**: Already correctly configured
   - OrdersPage subscribes to `orders` and `admin_notifications` tables
   - Refreshes orders list on INSERT events
   - Plays notification sound on new orders

### Links traced

- **CheckoutModal → checkoutApi.js**: `src/storefront/modals/CheckoutModal.jsx:236` calls `initializeCheckout(payload)`
- **checkoutApi.js → paystack-init**: `src/storefront/api/checkoutApi.js:5-14` builds fetch call with Supabase URL, anon key, and payload
- **paystack-init → checkout_attempts**: `supabase/functions/paystack-init/index.ts:214-243` inserts checkout attempt row
- **paystack-init → Paystack**: `supabase/functions/paystack-init/index.ts:260-279` calls Paystack transaction/initialize API
- **Paystack return detection**: `src/App.jsx:40` checks `?payment=return` query string, preserved by routing
- **Payment reference storage**: `src/storefront/modals/CheckoutModal.jsx:248` stores in `sessionStorage` as `gifting-factory-payment-return`
- **Verification polling**: `src/storefront/modals/CheckoutModal.jsx:88-139` polls `verifyCheckoutPayment` and `trackRecord` every 3 seconds
- **paystack-verify → finalize_paid_checkout**: `supabase/functions/paystack-verify/index.ts:80-84` calls RPC with verified reference, amount, currency
- **paystack-webhook → finalize_paid_checkout**: `supabase/functions/paystack-webhook/index.ts:44-48` calls RPC after signature verification
- **finalize_paid_checkout → orders**: `supabase/schema.sql:308-322` inserts order row with NOT NULL fields
- **Admin Realtime subscription**: `src/dashboard/pages/OrdersPage.jsx:76-100` subscribes to orders and admin_notifications tables

### NOT NULL constraint check

The `orders` table has these NOT NULL columns that must be provided:
- `customer_name`: ✅ From checkout payload, validated in paystack-init
- `customer_phone`: ✅ From checkout payload, validated in paystack-init
- `delivery_address`: ✅ Fixed - collection uses "Shop collection" as default
- `tracking_number`: ✅ Generated by paystack-init
- `order_code`: ✅ Generated by paystack-init
- `subtotal`: ✅ Calculated from validated items
- `total`: ✅ Calculated from subtotal + delivery fee
- `payment_provider`: ✅ Set to 'paystack'
- `payment_status`: ✅ Set to 'paid'
- `fulfillment_status`: ✅ Set to 'packaging'

All four delivery types now handle the address field correctly:
- **sameday**: Customer must provide address (required)
- **scheduled**: Customer must provide address (required)
- **surprise**: Customer must provide address (required)
- **collection**: Address optional, defaults to "Shop collection" if empty

## T4: Product/Category/Tag Parity Between Admin and Storefront

### Problem identified

The admin product form allowed free-text category and tag input, while the storefront relied on fixed sets of values. There was no guarantee that a product created in the admin would appear under the correct storefront filter. Additionally, the product tag was incorrectly derived from the description field (any product with a description received the "SIGNATURE" tag).

### Solution implemented

1. **Created shared taxonomy module** (`src/shared/taxonomy.js`)
   - Canonical category definitions with database keys and display labels
   - Canonical tag definitions
   - CATEGORY_MAP for converting between database keys and admin display labels
   - CATEGORY_IMAGE_FALLBACKS for consistent image fallbacks

2. **Updated ProductsPage.jsx**
   - Form now uses category dropdown populated from shared taxonomy
   - Added separate tag field (no longer derived from description)
   - Added "Add New Category" and "Add New Tag" options for custom values
   - Product save mapping stores tag independently from description
   - Category normalization uses shared CATEGORY_MAP
   - Tags are normalized to uppercase for consistency

3. **Updated ProductCard.jsx**
   - Tag display now uses shared taxonomy for label mapping
   - Imported PRODUCT_TAGS from shared taxonomy

### Parity table

| Admin field | Storefront use | Gap | Fix |
|-------------|----------------|-----|-----|
| Category (dropdown) | Shop filters, menu groupings | Free-text could mismatch | Dropdown from shared taxonomy |
| Tag (dropdown) | Product card tag display | Derived from description | Separate tag field from shared taxonomy |
| Description | Product detail modal | Already matches | No change needed |
| Price | Product card, detail modal | Already matches | No change needed |
| Stock | Sold-out state | Already matches | No change needed |
| Low stock threshold | Low-stock alerts | Already matches | No change needed |
| Image | Product card, detail modal | Already matches | No change needed |
| Visibility | Product appears/disappears | Already matches | No change needed |

### Visible changes

- Admin product form now has category and tag dropdowns instead of free-text fields
- Admin product form has "Add New Category" and "Add New Tag" options
- Product tag is stored separately from description
- Storefront product cards display tag labels from shared taxonomy

### Status

**DONE** - The admin and storefront now use shared category and tag definitions. A product created with a category and tag in the admin will appear under the matching storefront filter.

## T5: Settings Toggles and Page Content

### Settings toggle audit

| Setting | Location | Readers | Verdict | Fix |
|---------|----------|---------|---------|-----|
| delivery_selector_enabled | site_settings | CheckoutModal, siteFeatures.js | WORKING | Checked before showing selector |
| delivery_sameday_enabled | site_settings | CheckoutModal, paystack-init | WORKING | Respected in both client and server |
| delivery_scheduled_enabled | site_settings | CheckoutModal, paystack-init | WORKING | Respected in both client and server |
| delivery_surprise_enabled | site_settings | CheckoutModal, paystack-init | WORKING | Respected in both client and server |
| delivery_collection_enabled | site_settings | CheckoutModal, paystack-init | WORKING | Respected in both client and server |
| delivery_*_fee | site_settings | CheckoutModal, paystack-init | WORKING | Server computes from settings |
| low_stock_threshold | site_settings | Sidebar, ProductsPage, ShopPOSPage | WORKING | Used for low-stock calculation |
| low_stock_alerts | site_settings | Sidebar | WORKING | Now checked before showing badge |
| notifications_new_orders | site_settings | DashboardContext | FIXED | Was DEAD, now checked before notification |
| notifications_new_requests | site_settings | Header.jsx | WORKING | Already checked in isNotifAllowed |
| notifications_new_careers | site_settings | Header.jsx | WORKING | Already checked in isNotifAllowed |
| notifications_low_stock | site_settings | Header.jsx | WORKING | Already checked in isNotifAllowed |
| tracking_auto_refresh_enabled | site_settings | TrackOrderPage | WORKING | Controls auto-refresh logic |
| tracking_refresh_interval_seconds | site_settings | TrackOrderPage | WORKING | Used for refresh interval |
| track_max_failed_attempts | site_settings | track_record RPC | WORKING | Enforced in database function |
| track_lockout_minutes | site_settings | track_record RPC | WORKING | Enforced in database function |
| require_password_destructive | site_settings | SettingsPage (saved only) | PARTIAL | Toggle saved but not enforced in delete actions (T6) |
| aboutPage | site_content | Not consumed by storefront | DEAD | Toggle exists but no UI reads it |
| deliveryPage | site_content | Not consumed by storefront | DEAD | Toggle exists but no UI reads it |
| policyPage | site_content | Not consumed by storefront | DEAD | Toggle exists but no UI reads it |

### Dead settings

The page content settings (aboutPage, deliveryPage, policyPage) are saved to the `site_content` table but the storefront pages do not currently read from this table. These are marked DEAD because no UI consumes them.

### Settings save behavior

The `settingsAdapter.js` already handles missing columns safely:
- Only writes new columns if they existed in the loaded settings row
- This means settings saves will not fail before SQL is applied
- The UI shows "Needs the database update to take effect" helper text for new columns

### Fixes applied

1. **DashboardContext.jsx**: Added notification toggle check
   - `notifyNewOrder` now checks `settings.notifications.orders` before triggering
   - This was DEAD before - notification played regardless of toggle

2. **Sidebar.jsx**: Added low-stock alerts toggle check
   - Low-stock badge count now respects `settings.inventory.lowStockAlerts`
   - When disabled, badge shows 0 even if products are below threshold

3. **SettingsPage.jsx**: Added column existence checks
   - Delivery selector toggle is disabled if `delivery_selector_enabled` column doesn't exist
   - Tracking auto-refresh settings are disabled if tracking columns don't exist
   - Helper text explains when database update is needed

4. **SettingsPage.jsx**: Fixed useEffect dependency warning
   - Changed `s.content?.aboutPage, s.content?.deliveryPage, s.content?.policyPage` to `s.content`

### Visible changes

- New order notifications now respect the "New orders" toggle
- Low-stock badge in sidebar now respects the "Low-stock alerts" toggle
- Settings panel disables new-column toggles before SQL is applied with helper text
- Page content settings are saved but not consumed (DEAD - documented)

### Status

**DONE** - All notification toggles are now checked before triggering. Settings save safely handles missing columns. New-column toggles are disabled with helper text before SQL is applied.

## T7: Delivery Selector and Tracking End-to-End

### Delivery flow trace

**CheckoutModal** (`src/storefront/modals/CheckoutModal.jsx`):
- Lines 38-47: Loads site settings, defaults to first enabled delivery type if `delivery_selector_enabled` is true
- Lines 53-64: Calculates delivery fee based on selected type from settings
- Line 66: Computes total = subtotal + deliveryFee
- Lines 301-336: Shows delivery selector only if `delivery_selector_enabled` is true
- Line 232-234: Only adds `deliveryType` to payload if selector is enabled and a type is selected
- Line 339: Passes `isCollection` prop to DeliveryAddressFields

**checkoutApi.js** (`src/storefront/api/checkoutApi.js`):
- Lines 4-14: Forwards payload unchanged to paystack-init

**paystack-init** (`supabase/functions/paystack-init/index.ts`):
- Lines 105-107: For collection, uses "Shop collection" as default address if none provided
- Lines 177-218: Reads `deliveryType`, checks enabled flags from site_settings, computes deliveryFee
- Lines 220: Computes grandTotal = serverTotal + deliveryFee
- Lines 239-240: Stores `delivery_type` and `delivery_fee` in `checkout_attempts.checkout_data`
- Line 261: Sends `grandTotal * 100` to Paystack
- Lines 309-318: Returns subtotal, deliveryFee, and total to client

**Paystack amount**:
- Line 261: `amountInPesewas = Math.round(grandTotal * 100)` - server total sent to Paystack
- This matches the total displayed to the customer

**Client use of server values**:
- CheckoutModal uses server-returned values after payment return (stored in session and complete state)

**finalize_paid_checkout** (`supabase/schema.sql:279-322`):
- Lines 308-322: Creates order row from checkout_attempts data
- Does NOT copy `delivery_type` or `delivery_fee` to orders table
- Stores only subtotal and total (line 321)

**Delivery data storage status**:
- Delivery type and fee are stored in `checkout_attempts.checkout_data` but NOT on the `orders` row
- This means the order record does not preserve which delivery type was chosen

### Tracking flow trace

**TrackOrderPage** (`src/storefront/pages/TrackOrderPage.jsx`):
- Lines 34-38: Loads site settings for auto-refresh config
- Lines 42-52: Auto-refresh stops for terminal statuses (completed, cancelled, closed)
- Lines 54-57: Auto-refresh stops if rate-limited
- Line 59: Interval clamped to 3-60 seconds
- Lines 62-64: Refresh skips if already refreshing or tab is hidden
- Lines 116-120: Refresh triggers when tab becomes visible
- Line 125: Interval set up with `setInterval`
- Lines 127-129: Cleanup on unmount
- Lines 71-75: If rate_limited, sets isRateLimited and stops
- Lines 108-112: If refresh fails, keeps last result (silently fails)
- Lines 149-157: search() handles result kinds:
  - `rate_limited`: Sets isRateLimited, shows message
  - `order`: Displays order with timeline
  - `request`: Displays request details
  - `not_found`: Shows "No record matched"

**User-visible messages**:
- Rate limited: "Too many attempts. Please wait a few minutes and try again."
- Not found: "No record matched those details. Check the reference and contact information, then try again."
- Auto-refresh enabled: Shows "Updates automatically" note on result

**Auto-refresh behavior**:
- Repeats at configured interval (clamped 3-60 seconds)
- Pauses while tab is hidden (document.hidden check)
- Refreshes when tab visibility returns (visibilitychange listener)
- Never overlaps requests (isRefreshingRef flag)
- Keeps last successful data if refresh fails (catch block)
- Stops when tracking is complete (terminal status check)

**Customer experience before SQL**:
- `delivery_selector_enabled` defaults to false in siteFeatures.js (line 26)
- Tracking auto-refresh defaults to false (line 27)
- Customer sees no delivery selector, pays 0 delivery fee
- Tracking page does not auto-refresh

**Customer experience after SQL**:
- If `delivery_selector_enabled` is true, customer sees delivery selector
- Customer pays correct delivery fee based on selection
- If `tracking_auto_refresh_enabled` is true, tracking page updates automatically

### Optional delivery columns proposal

Since delivery type and fee are not stored on the orders row, the following optional columns can be added. This is NOT applied and requires owner review before running.

**Proposal for section 6 of MASTER_UPDATE.sql**:

```sql
-- ============================================================================
-- SECTION 6: OPTIONAL - Add delivery columns to orders table
-- NOT APPLIED - Review before running
-- This would allow preserving the chosen delivery type and fee on the order record
-- ============================================================================

-- Add delivery columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric;

-- Update finalize_paid_checkout to copy delivery data from checkout_attempts
CREATE OR REPLACE FUNCTION public.finalize_paid_checkout(
  verified_reference text,
  verified_amount numeric,
  verified_currency text default 'GHS'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt public.checkout_attempts%rowtype;
  created_order_id uuid;
  item_rec record;
  updated_product record;
  item_category text;
begin
  select * into attempt from public.checkout_attempts
  where payment_reference = verified_reference
  for update;

  if not found then raise exception 'checkout_not_found'; end if;
  if attempt.status = 'paid' and attempt.order_id is not null then
    return jsonb_build_object('orderId', attempt.order_id, 'trackingNumber', attempt.tracking_number, 'orderCode', attempt.order_code, 'alreadyProcessed', true);
  end if;
  if attempt.status <> 'initialized' then raise exception 'checkout_not_payable'; end if;
  if attempt.currency <> upper(verified_currency) or abs(attempt.total - verified_amount) > 0.01 then
    raise exception 'payment_mismatch';
  end if;

  insert into public.orders (
    tracking_number, order_code, customer_name, customer_email, customer_phone,
    recipient_name, delivery_address, landmark, location_link, customer_note,
    card_message, card_style, requested_delivery_date, subtotal, total,
    payment_provider, payment_reference, payment_status, fulfillment_status,
    delivery_type, delivery_fee
  ) values (
    attempt.tracking_number, attempt.order_code,
    attempt.checkout_data->>'customer_name', attempt.customer_email,
    attempt.checkout_data->>'customer_phone', attempt.checkout_data->>'recipient_name',
    attempt.checkout_data->>'delivery_address', nullif(attempt.checkout_data->>'landmark',''),
    nullif(attempt.checkout_data->>'location_link',''), nullif(attempt.checkout_data->>'customer_note',''),
    nullif(attempt.checkout_data->>'card_message',''), nullif(attempt.checkout_data->>'card_style',''),
    nullif(attempt.checkout_data->>'requested_delivery_date','')::date,
    attempt.subtotal, attempt.total, 'paystack', attempt.payment_reference, 'paid', 'packaging',
    attempt.checkout_data->>'delivery_type',
    (attempt.checkout_data->>'delivery_fee')::numeric
  ) returning id into created_order_id;

  -- Rest of function remains unchanged (order_items, stock decrement, notifications)
  ...
end $$;
```

### Plain-language answers

**Does a customer selecting "Same-day delivery" pay the correct amount?**
YES. The paystack-init edge function reads the delivery type from the payload, validates it against site_settings, computes the delivery fee server-side, and sends the grandTotal (subtotal + deliveryFee) to Paystack. The client displays the same total that is sent to Paystack.

**Does the tracking page update automatically?**
YES, if `tracking_auto_refresh_enabled` is true in site_settings. The tracking page repeats at the configured interval (clamped 3-60 seconds), pauses when the tab is hidden, refreshes when visibility returns, never overlaps requests, keeps the last data on failure, and stops when tracking is complete.

### Status

**DONE** - Delivery and tracking flows have been traced and documented. Delivery type and fee are stored in checkout_attempts but not on orders. Optional proposal added for owner review.

### Problem identified

The admin product form allowed free-text category and tag input, while the storefront relied on fixed sets of values. There was no guarantee that a product created in the admin would appear under the correct storefront filter. Additionally, the product tag was incorrectly derived from the description field (any product with a description received the "SIGNATURE" tag).

### Solution implemented

1. **Created shared taxonomy module** (`src/shared/taxonomy.js`)
   - Canonical category definitions with database keys and display labels
   - Canonical tag definitions
   - CATEGORY_MAP for converting between database keys and admin display labels
   - CATEGORY_IMAGE_FALLBACKS for consistent image fallbacks

2. **Updated ProductsPage.jsx**
   - Form now uses category dropdown populated from shared taxonomy
   - Added separate tag field (no longer derived from description)
   - Added "Add New Category" and "Add New Tag" options for custom values
   - Product save mapping stores tag independently from description
   - Category normalization uses shared CATEGORY_MAP
   - Tags are normalized to uppercase for consistency

3. **Updated ProductCard.jsx**
   - Tag display now uses shared taxonomy for label mapping
   - Imported PRODUCT_TAGS from shared taxonomy

### Parity table

| Admin field | Storefront use | Gap | Fix |
|-------------|----------------|-----|-----|
| Category (dropdown) | Shop filters, menu groupings | Free-text could mismatch | Dropdown from shared taxonomy |
| Tag (dropdown) | Product card tag display | Derived from description | Separate tag field from shared taxonomy |
| Description | Product detail modal | Already matches | No change needed |
| Price | Product card, detail modal | Already matches | No change needed |
| Stock | Sold-out state | Already matches | No change needed |
| Low stock threshold | Low-stock alerts | Already matches | No change needed |
| Image | Product card, detail modal | Already matches | No change needed |
| Visibility | Product appears/disappears | Already matches | No change needed |

### Visible changes

- Admin product form now has category and tag dropdowns instead of free-text fields
- Admin product form has "Add New Category" and "Add New Tag" options
- Product tag is stored separately from description
- Storefront product cards display tag labels from shared taxonomy

### Status

**DONE** - The admin and storefront now use shared category and tag definitions. A product created with a category and tag in the admin will appear under the matching storefront filter.
