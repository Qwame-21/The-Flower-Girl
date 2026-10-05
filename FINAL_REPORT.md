# Flower Girl - Final Report

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
