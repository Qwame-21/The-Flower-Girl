# MASTER PLAN: Slay Empire Live-Order Features → Flower Girl

**Generated:** 2026-10-04  
**Purpose:** Bring Slay Empire's live-order features into Flower Girl while preserving Flower Girl's strengths

---

## Summary

This plan details how to integrate Slay Empire's proven live-order patterns into Flower Girl. Flower Girl is architecturally stronger in several areas (Supabase Realtime, `finalize_paid_checkout` RPC, `is_staff()` RLS, `track_record` RPC) and these advantages will be preserved. Slay Empire's specific weaknesses (no rate limiting on tracking, JWT in localStorage, hardcoded Cloudinary values, no stock recheck at payment verification, imageless-product auto-delete in customer browsers) will NOT be carried over.

**Defects found:** 23  
**Features specified:** 6  
**Decisions needed:** 5

---

## Storefront Design Pattern Guide

### Design System (Flower Girl)

**Color Palette:**
- Background: `#e2e2e0` (warm gray)
- Card background: `#d5d5d3`
- Text primary: `#111111`
- Text secondary: `#4a4a4a`
- Text muted: `#777777`
- Accent: `#5c5c5a` (dark gray)
- Primary action: `#1d1d1d` (black) with white text
- Soft action: transparent with `#1d1d1d` text, inverts on hover

**Typography:**
- Main font: `Outfit`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif
- Heading font: `Outfit`, `Plus Jakarta Sans`, sans-serif
- Meta labels: 11px, 500 weight, 0.09em letter-spacing, uppercase
- Body: 13-16px, 400 weight

**Buttons:**
- `.primary-action`: 46px min-height, padding 0.8rem 1.35rem, border 1px solid #1d1d1d, border-radius 9999px, 10px font-size, 600 weight, 0.12em letter-spacing
- `.soft-action`: Same dimensions, transparent background, 1d1d1d text, inverts on hover
- Hover: translateY(-2px), 220ms ease transition
- Focus-visible: 2px solid #111 outline, 4px offset

**Form Fields:**
- Input, textarea, select: 16px font-size, white background, 1px solid #e8e8e8 border (Slay Empire pattern - check if Flower Girl has this), 11px padding, 44px min-height
- Labels: 10px font-size, 0.15em letter-spacing, uppercase, #888888 color
- Focus: border-color `#e8a0b4` (Slay Empire accent - do NOT carry over, use Flower Girl dark gray `#1d1d1d`)

**Cards:**
- Background: `rgba(255, 255, 255, 0.48)` with 15px border-radius
- Spacing: 10px gap in grids
- Border: none (editorial style, no visible borders)

**Modals:**
- Backdrop: `.flow-backdrop` with blur
- Container: `.flow-modal` with 9999 z-index
- Header: Fixed heading with `.fixed-heading-modal` class
- Scrollable body: `.modal-body` with custom scrollbar

**Badges:**
- Status badges: Background colors from `--status-*` tokens, rounded pills
- Notification badge: `--accent-signal: #c9612e` (orange terracotta)

**Animations:**
- `.animate-fade-in`: 0.45s cubic-bezier(0.16, 1, 0.3, 1)
- `.animate-hero-float`: 6s ease-in-out infinite
- `.animate-scale-in`: 0.3s cubic-bezier(0.16, 1, 0.3, 1)
- `.animate-drawer`: 0.35s cubic-bezier(0.16, 1, 0.3, 1)
- `.hover-lift`: translateY(-2px) on hover with 0.25s ease

**Responsive Breakpoints:**
- Mobile: max-width 760px
- Tablet: 761px-1024px
- Desktop: 1025px+

**Class Naming Conventions:**
- Kebab-case for utility classes
- BEM-like for components: `.component-name__element--modifier`
- Utility-first for spacing: `.mt-4`, `.p-6`, etc. (check if Tailwind is used - NOT from intel, verify)
- State classes: `.is-active`, `.is-open`, `.is-added`, `.is-loading`

**Loading States:**
- Skeleton loaders NOT found in Flower Girl (Slay Empire has `.skeleton-image` - do NOT carry over)
- Use simple loading spinners or text states
- Disabled button state: opacity 0.35, pointer-events none

**Empty States:**
- Simple text messages in card-style containers
- No specialized empty state illustrations found

**Error States:**
- Text error messages in red or muted color
- Alert banners at top of content areas

**File references:**
- Global styles: `src/index.css`
- Storefront-specific: `src/App.css` (legacy, minimal), `src/responsive-overlays.css`
- Dashboard: `src/dashboard/index.css`

---

## Admin Design Pattern Guide

### Design System (Flower Girl Dashboard)

**Color Palette:**
- Background gradient: radial-gradient from `#e4e4e2` → `#dededc` → `#d6d6d4`
- Text primary: `#1a1a1a`
- Text muted: `#7a7a7a`
- Card background: `#f2f1ef`
- Active pill: `#1a1a1a` background, white text
- Signal accent: `#c9612e` (orange for notifications)
- Status colors: Muted flat tints (see CSS variables)

**Typography:**
- Font: `Plus Jakarta Sans`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif
- Type scale: 11px (xs) to 28px (3xl)
- Font weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- Meta labels: 11px, 500 weight, 0.09em letter-spacing, uppercase

**Layout:**
- Viewport: `.viewport-frame` with radial gradient background
- Side navigation: Collapsible 68px (collapsed) → 276px (expanded)
- Main content: Flex with 16px gap
- Card radius: 32px for navigation panels, 28px for title bar, 12-16px for cards
- Backdrop filter: blur(24px) saturate(180%) for glass morphism

**Navigation:**
- `.side-navigation`: Collapsible panel with lock toggle
- `.menu-item`: 40px circles when collapsed, full-width pill when expanded
- Active state: Dark background `#1a1a1a`, white text, white icon
- Status badge: `--accent-signal: #c9612e`, 15px min-width, 8px font-size

**Buttons:**
- Icon buttons: 6px padding, 50% border-radius, opacity 0.8 on hover
- Primary: Dark background, light text (check specific classes)
- Disabled: opacity 0.35, pointer-events none

**Form Fields:**
- Input size: 16px font-size (--admin-input-font-size)
- Border: 1px solid rgba(26, 26, 26, 0.14)
- Focus: border-color accent, 0.22s ease transition
- Padding: 11px 14px, 44px min-height

**Cards:**
- Background: `#f2f1ef`
- Border: 1px solid rgba(255, 255, 255, 0.8)
- Border-radius: 12-16px
- Shadow: 0 6px 32px rgba(0, 0, 0, 0.08)

**Modals:**
- Z-index: `--z-modal: 2000`
- Backdrop: Fixed inset with blur
- Content: White background, border-radius 14px, box-shadow

**Animations:**
- Duration tokens: `--dur-fast: 160ms`, `--dur: 240ms`
- Easing: `--ease: cubic-bezier(0.16, 1, 0.3, 1)`
- Pulse signal: 2s cubic-bezier for notification badge

**Responsive:**
- Mobile breakpoint: 768px
- Collapsed navigation on mobile

**File references:**
- Dashboard styles: `src/dashboard/index.css`
- Component styles in individual component files

---

## Feature Comparison Matrix

| Feature | Slay Empire Approach | Flower Girl Current State | Gap |
|---------|----------------------|------------------------|-----|
| **Order Placement** | Creates order in DB via service-role, server-side price validation, auto-decrements stock | Creates checkout_attempt first, Paystack redirect, then converts to order via RPC | DIFFERENT - Flower Girl 2-step (checkout_attempt → order) vs Slay Empire 1-step. Both use server-side validation |
| **Customization** | NOT FOUND - no customization feature | Separate `customer_requests` table with selections, estimates, quotes. No connection to orders or payment | MISSING - Request-to-order conversion not implemented |
| **Payment** | Paystack, 10 verify attempts at 3000ms, polling fallback | Paystack, 10 verify attempts at 3000ms, webhook + verify endpoint | SAME - Both use identical retry pattern |
| **Order Tracking** | RPC `get_guest_order` (SECURITY DEFINER), 10000ms auto-refresh, no rate limiting | RPC `track_record` (SECURITY DEFINER), NO auto-refresh, no rate limiting | MISSING - Auto-refresh and rate limiting needed |
| **Admin Status Control** | Polling 3000ms, optimistic UI with 8000ms mutation lock, 4 boolean status fields | Realtime subscriptions, optimistic UI, enum status fields, trigger protection | DIFFERENT - Flower Girl stronger (Realtime vs polling), both have optimistic UI |
| **New-Order Notifications** | Polling 3000ms, deduplication by Set, Web Audio chime, OS notification, toast with 8s auto-dismiss | Realtime INSERT subscription, Web Audio chime, bell badge, toast/polling fallback | SAME - Both have sound + toast, Flower Girl stronger (Realtime primary) |
| **Admin-to-Customer Speed** | ≤10s (tracking poll) | Manual refresh only (no auto-refresh) | MISSING - Auto-refresh needed |
| **Deletion Handling** | Direct delete from DB, no storage cleanup on products, customers stats not decremented | Cascade deletes, storage cleanup on gallery only, products/careers NOT cleaned up | PARTIAL - Storage cleanup missing for products and career applications |
| **Security** | JWT in localStorage (weak), no rate limiting on tracking, service-role bypasses RLS | Supabase Auth session, `is_staff()` RLS, no rate limiting on tracking | DIFFERENT - Flower Girl stronger (Supabase Auth vs JWT), both missing rate limiting |

---

## Customization and Data Model Mapping

### Current State

**Flower Girl customization:**
- Lives in `customer_requests` table
- Fields: `selections` (jsonb array), `estimate_low`, `estimate_high`, `confirmed_quote`, `status` (new/quote_needed/approved/converted/closed)
- Separate from `orders` table - no direct payment or tracking connection
- `request_id` column exists in `orders` table but not populated
- `converted_at` field exists but never set

**Slay Empire:**
- No customization feature found

### Missing Connection

**Problem:** Custom requests cannot become paid orders. Customers can:
1. Submit a custom request with selections and estimates
2. Wait for admin to provide a confirmed quote
3. But cannot pay for it or track it like a regular order

**Required data model changes:**

1. **Add to `orders` table:**
   - `customization_selections` (jsonb) - Copy of `customer_requests.selections`
   - `customization_estimates` (jsonb) - `{low, high, confirmed}` estimates
   - `original_request_id` (uuid, references `customer_requests`) - Link back to original request

2. **Add to `customer_requests` table:**
   - `converted_order_id` (uuid, references `orders`) - Forward link after conversion

3. **New RPC: `convert_request_to_order(request_id, confirmed_quote, customer_details, delivery_details, payment_reference)`**
   - Security definer, service role only
   - Validates request status is 'approved'
   - Creates order with customization data
   - Sets `converted_at` on request
   - Sets `original_request_id` on order
   - Decrements stock if products involved (may need to add product selection to requests)
   - Returns new order ID

4. **Trigger:** `on_request_converted` - inserts notification when request converted

5. **RLS policies:**
   - `convert_request_to_order`: Execute to authenticated users with `is_staff() = true`
   - Allow staff to update `customer_requests.status` through existing adapter

### Exact SQL Changes

See "Proposed SQL" section for full migration.

---

## Per-Feature Integration Design

### 1. Fast Order Tracking with Auto-Refresh

**Current Flower Girl:** Manual "TRACK" button only  
**Slay Empire:** 10000ms setInterval, stops when status = delivered

**What exists:**
- `track_record` RPC (SECURITY DEFINER, anon access) - WORKING
- TrackOrderPage component with form and result display
- Status display with stages (paid, packaging, ready, delivery, completed)

**What to add:**
- Auto-refresh using setInterval at 10000ms (10 seconds)
- Stop when `status === 'completed'` or `status === 'cancelled'`
- Silent refresh (no loading spinner between updates, just fade effect)
- Add `lastRefreshAt` timestamp to show when data was last fetched

**Speed mechanism:**
- Polling (not Realtime) - matches Slay Empire pattern
- Interval: 10000ms
- No rate limiting (Slay Empire also lacks this - we will add it separately)

**Files to change:**
- STOREFRONT: `src/storefront/pages/TrackOrderPage.jsx`

**How to implement:**
```javascript
useEffect(() => {
  if (!result || result.kind !== 'order') return;
  if (result.status === 'completed' || result.status === 'cancelled') return;
  
  const interval = setInterval(() => {
    trackRecord(reference, credential);
  }, 10000);
  
  return () => clearInterval(interval);
}, [result?.status, reference, credential]);
```

---

### 2. Admin Status Control with Quick Reflection

**Current Flower Girl:** Realtime subscriptions, optimistic UI, enum status fields  
**Slay Empire:** Polling 3000ms, optimistic UI, 4 boolean status fields, 8000ms mutation lock

**What exists:**
- Realtime subscription to `orders` table INSERT/UPDATE
- Optimistic UI in `updateOrderStatus`
- Enum status fields: `pending_payment`, `paid`, `packaging`, `ready`, `delivery`, `completed`, `cancelled`
- `protect_paystack_payment` trigger

**What to add:**
- None - Flower Girl's Realtime is superior
- Keep existing optimistic UI
- Keep existing trigger protection

**Why Realtime is better:**
- Instant updates (vs 3s polling delay)
- Lower server load
- More reliable connection
- No mutation lock needed (Realtime handles race conditions)

**Files to change:**
- NONE (keep existing implementation)

---

### 3. New-Order Notifications with Sound

**Current Flower Girl:** Realtime INSERT subscription, Web Audio chime, bell badge, toast, polling fallback  
**Slay Empire:** Polling 3000ms, Web Audio chime, OS notification, toast with 8s auto-dismiss

**What exists:**
- `subscribeToNotifications(callback)` - Realtime INSERT on `admin_notifications`
- `playNotificationSound()` - Web Audio API chime (E5 → A5, 120ms each)
- Bell badge with pulse animation
- Toast system with auto-dismiss
- Polling fallback: `startNotificationPolling(callback)` at 30000ms

**What to add:**
- OS notification (browser Notification API) when `document.hidden === true`
- Duplicate alert prevention (deduplication by order ID)
- Autoplay handling (try/catch around AudioContext, silent fail)

**Speed mechanism:**
- Realtime primary (instant)
- Polling fallback at 30000ms (30 seconds) if Realtime fails

**Files to change:**
- ADMIN: `src/dashboard/lib/sounds.js` (add OS notification)
- ADMIN: Notification component (add OS notification trigger)

**How to implement:**
```javascript
// In notification handler
if (Notification.permission === 'granted' && document.hidden === true) {
  new Notification('New Order', {
    body: `${tracking} · GHS ${total}`,
    tag: order.id, // Prevents duplicates
    icon: '/favicon.png'
  });
}
```

---

### 4. Verified Payment Reaching Admin Reliably

**Current Flower Girl:** Webhook + verify endpoint + 10 attempts at 3000ms polling  
**Slay Empire:** Same pattern

**What exists:**
- `paystack-webhook` Edge Function with HMAC-SHA512 signature verification
- `paystack-verify` Edge Function with double-verification
- `finalize_paid_checkout` RPC (idempotent)
- CheckoutModal polling: 10 attempts at 3000ms intervals
- Fallback to tracking API check

**What to add:**
- None - implementation is already identical and correct
- Idempotency prevents double-payment issues

**Weakness in current implementation:**
- No retry mechanism after polling exhausts (if webhook fails and polling times out, order may stay unpaid forever)

**Recommended improvement (future, not required):**
- Add admin-side "retry verification" button for stuck orders
- Add webhook delivery status tracking

**Files to change:**
- NONE (current implementation is sound)

---

### 5. Graceful Handling of Direct Supabase Deletions

**Current Flower Girl:** Direct deletions from dashboard cascade via foreign keys  
**Slay Empire:** Same, but customers stats not decremented

**What exists:**
- Foreign key cascade on `order_events` → `orders`
- Foreign key cascade on `order_items` → `orders`
- Gallery deletion: storage delete + database delete (correct pattern)
- Product deletion: database delete only (storage cleanup MISSING)
- Career application deletion: database delete only (storage cleanup MISSING)

**What to add:**
- Storage cleanup on product deletion (delete from `storefront-media` bucket)
- Storage cleanup on career application deletion (delete from `career-files` bucket)
- Customer profiles sync decrementation (or remove unused `customer_profiles` table)

**Files to change:**
- ADMIN: `src/dashboard/data/products.js` (add storage cleanup)
- ADMIN: `src/dashboard/data/careers.js` (add storage cleanup)
- ADMIN: `src/dashboard/data/customersAdapter.js` (decide: implement or remove)

---

## Audit and Fix List

### DATABASE

**1. Missing `signin_log` table**
- **File:** `src/dashboard/lib/signinLog.js` (lines 9-52)
- **Issue:** Code references table but it doesn't exist in schema.sql
- **Fix:** Create table with columns: `id` (uuid, PK), `user_id` (uuid, references auth.users), `signed_in_at` (timestamptz), `signed_out_at (timestamptz), `user_agent` (text)
- **Why:** Sign-in/out logging is functional but fails on write
- **Priority:** HIGH

**2. Delivery type not sent to paystack-init**
- **File:** `src/storefront/modals/CheckoutModal.jsx` (payload construction)
- **Issue:** `deliveryType` parameter not sent to `initializeCheckout()`, so delivery_fee defaults to 0
- **Fix:** Add delivery type selection UI and include in payload
- **Why:** Customers are not being charged delivery fees
- **Priority:** HIGH

**3. Missing About, Delivery, Policy pages**
- **File:** `src/site/routes.js` (lines referencing /about, /delivery, /policy)
- **Issue:** Routes exist but page components not found
- **Fix:** Create `AboutPage.jsx`, `DeliveryPage.jsx`, `PolicyPage.jsx` in `src/storefront/pages/`
- **Why:** 404 errors on navigation
- **Priority:** MEDIUM

**4. `customer_profiles` table unused**
- **File:** `src/dashboard/data/customersAdapter.js` (lines 26-39)
- **Issue:** Table exists but not used in main flow, sync logic untested
- **Fix:** Either implement properly or remove table and sync logic
- **Recommendation:** Remove table - customer data derived from orders is sufficient
- **Priority:** LOW

### EDGE FUNCTION

**5. paystack-init CORS uses wildcard**
- **File:** `supabase/functions/paystack-init/index.ts` (line with Access-Control-Allow-Origin)
- **Issue:** `Access-Control-Allow-Origin: *` allows any origin
- **Fix:** Set to `VITE_SITE_URL` or specific storefront URL
- **Why:** Security best practice, prevents CSRF
- **Priority:** MEDIUM

**6. Logging of payment references in paystack-verify**
- **File:** `supabase/functions/paystack-verify/index.ts` (console.log statements)
- **Issue:** Logs sensitive payment references
- **Fix:** Remove or replace with generic "Payment verified" message
- **Why:** Security - payment references could be sensitive
- **Priority:** MEDIUM

### ADMIN

**7. Deprecated stubs in ordersModel.js**
- **File:** `src/dashboard/lib/ordersModel.js` (lines 56-78)
- **Issue:** `getOrders()`, `saveOrders()`, `logActivityEvent()`, `getAttentionOrders()`, `getActiveStockAlerts()` return empty arrays
- **Fix:** Either implement properly or remove
- **Recommendation:** Remove - these are for pages outside Phase 6A scope that don't exist
- **Priority:** LOW

**8. Insights page data helpers not connected**
- **File:** `src/dashboard/pages/OverviewPage.jsx` (uses statsHelper.js functions)
- **Issue:** `calculateOrderStats` and `calculateDailyTrend` exist but may not show real data
- **Fix:** Verify connection and fix if broken
- **Priority:** LOW

**9. Password protection for destructive operations not implemented**
- **File:** Setting exists in `site_settings.require_password_destructive` but no UI code
- **Issue:** Setting exists but not enforced
- **Fix:** Implement password confirmation modal before destructive operations
- **Priority:** MEDIUM

**10. Product deletion storage cleanup missing**
- **File:** `src/dashboard/data/products.js` (deleteProduct function)
- **Issue:** Database delete does not remove image from storage
- **Fix:** Add storage delete before database delete
- **Why:** Orphaned files in storage
- **Priority:** MEDIUM

**11. Career application deletion storage cleanup missing**
- **File:** `src/dashboard/data/careers.js` (deleteApplication function)
- **Issue:** Database delete does not remove resume from storage
- **Fix:** Add storage delete before database delete
- **Why:** Orphaned files in storage
- **Priority:** MEDIUM

### STOREFRONT

**12. console.log in CheckoutModal**
- **File:** `src/storefront/modals/CheckoutModal.jsx` (lines 67, 81)
- **Issue:** DEV-only console.log present
- **Fix:** Remove or ensure DEV-only check is strict
- **Why:** Debug cleanup
- **Priority:** LOW

**13. console.error in trackingApi**
- **File:** `src/storefront/api/trackingApi.js` (line 40)
- **Issue:** Error logging to console
- **Fix:** Acceptable for error logging, but consider removing for production
- **Priority:** LOW

### GENERAL

**14. No rate limiting on track_record RPC**
- **File:** `supabase/schema.sql` (RPC definition)
- **Issue:** `track_record` has no rate limiting, allowing enumeration attacks
- **Fix:** Add rate limiting using `rate_limits` table pattern or Supabase Edge Function rate limiting
- **Recommendation:** Add rate limiting at Edge Function level (300 requests per 15 minutes per IP)
- **Priority:** HIGH

**15. No stock recheck at payment verification**
- **Note:** Slay Empire has this weakness, Flower Girl stock is decremented in `finalize_paid_checkout` AFTER verification
- **Status:** Flower Girl is STRONGER here - stock is decremented atomically with order creation
- **Fix:** None needed
- **Priority:** N/A

---

## Feature Specs

### Feature 1: Delivery Type Selection and Fees at Checkout

**What it does for the customer:**
Customer can choose delivery type (Same-day, Scheduled, Surprise, Collection) during checkout. Delivery fee is calculated based on selection and added to order total.

**Admin control:**
- **Page:** Settings Page (`/settings`)
- **Section:** Delivery settings
- **Controls:**
  - Toggle: "Enable same-day delivery" (boolean, default: true)
  - Number field: "Same-day delivery fee (GHS)" (numeric, default: 120)
  - Toggle: "Enable scheduled delivery" (boolean, default: true)
  - Number field: "Scheduled delivery fee (GHS)" (numeric, default: 90)
  - Toggle: "Enable surprise delivery" (boolean, default: true)
  - Number field: "Surprise delivery fee (GHS)" (numeric, default: 140)
  - Toggle: "Enable collection" (boolean, default: true)
  - Number field: "Collection fee (GHS)" (numeric, default: 0)
- **Validation:** Fees must be >= 0, toggles boolean
- **Who may change:** Staff with `is_staff() = true` (owner, admin, staff)

**Data:**
- **Table:** `site_settings` (already exists)
- **Columns:** `delivery_sameday_enabled`, `delivery_sameday_fee`, `delivery_scheduled_enabled`, `delivery_scheduled_fee`, `delivery_surprise_enabled`, `delivery_surprise_fee`, `delivery_collection_enabled`, `delivery_collection_fee` (all already exist)
- **Defaults:** sameday enabled/120, scheduled enabled/90, surprise enabled/140, collection enabled/0
- **SQL:** No changes needed (columns already exist)

**How the storefront reads it:**
- **File:** `src/storefront/modals/CheckoutModal.jsx`
- **Call:** Fetch from `site_settings` table via Supabase anon key
- **Fallback:** If fetch fails or settings missing, default to sameday with 120 GHS fee
- **Code:**
```javascript
const [deliveryType, setDeliveryType] = useState('sameday');
const [deliveryFee, setDeliveryFee] = useState(120);

// On mount
useEffect(() => {
  async function loadSettings() {
    const { data } = await supabase
      .from('site_settings')
      .select('delivery_sameday_enabled, delivery_sameday_fee, delivery_scheduled_enabled, delivery_scheduled_fee, delivery_surprise_enabled, delivery_surprise_fee, delivery_collection_enabled, delivery_collection_fee')
      .single();
    
    if (data) {
      // Determine default enabled type
      if (data.delivery_sameday_enabled) {
        setDeliveryType('sameday');
        setDeliveryFee(data.delivery_sameday_fee);
      } else if (data.delivery_scheduled_enabled) {
        setDeliveryType('scheduled');
        setDeliveryFee(data.delivery_scheduled_fee);
      } else if (data.delivery_surprise_enabled) {
        setDeliveryType('surprise');
        setDeliveryFee(data.delivery_surprise_fee);
      } else {
        setDeliveryType('collection');
        setDeliveryFee(data.delivery_collection_fee);
      }
    }
  }
  loadSettings();
}, []);
```

**UI:**
- **Component:** Add delivery type selection to CheckoutModal
- **Placement:** After delivery address fields, before card message
- **Existing components to reuse:**
  - Form label pattern from existing fields
  - CustomSelect component (already exists in `src/storefront/components/CustomSelect.jsx`)
  - Input fields pattern from existing delivery address fields
- **Classes:** Reuse existing form field classes from CheckoutModal
- **States:** Loading (spinner), Disabled (during submission), Error (validation message)
- **Copy text:**
  - Label: "Delivery type"
  - Options: "Same-day delivery", "Scheduled delivery", "Surprise delivery", "Shop collection"
  - Fee display: "Delivery fee: GHS {fee}"

**Behavior and edge cases:**
- If all delivery types disabled, default to collection with 0 fee
- If selected type is disabled, auto-switch to first enabled type
- If delivery fee is 0, show "Free"
- Delivery type is included in payload to `paystack-init`
- Delivery fee is added to subtotal to calculate total

**Files to change:**
- STOREFRONT: `src/storefront/modals/CheckoutModal.jsx` (add delivery type selection UI and include in payload)
- STOREFRONT: `src/storefront/api/checkoutApi.js` (add deliveryType to initializeCheckout payload)

**Off-switch and removal:**
- **Admin off-switch:** Disable all delivery type toggles in Settings Page → fallback to collection with 0 fee
- **Removal checklist:**
  1. Remove delivery type selection UI from CheckoutModal
  2. Remove deliveryType from initializeCheckout payload
  3. Keep database columns (harmless if unused)
  4. Remove from feature spec

**Acceptance checks:**
1. Load checkout modal, verify delivery type selector appears with current settings
2. Select different delivery type, verify fee updates
3. Disable a delivery type in Settings, verify it disappears from storefront
4. Place order, verify delivery fee is included in total
5. Verify order record in database shows correct delivery fee

---

### Feature 2: Missing About, Delivery, and Policy Pages

**What it does for the customer:**
Customers can navigate to read About story, Delivery information, and Policy details.

**Admin control:**
- **Page:** Settings Page (`/settings`)
- **Section:** Site content (or separate Content Page if needed)
- **Controls:**
  - Text area: "About page content" (rich text or markdown)
  - Text area: "Delivery information" (rich text or markdown)
  - Text area: "Policy content" (rich text or markdown)
- **Validation:** Max character limit (e.g., 10000)
- **Who may change:** Staff with `is_staff() = true`

**Data:**
- **Table:** `site_content` (already exists)
- **Columns:** `key` (text PK), `value` (text, not null, default ''), `updated_at` (timestamptz), `updated_by` (uuid)
- **Keys:** `about_page`, `delivery_page`, `policy_page`
- **Defaults:** Empty string for all keys
- **SQL:** No changes needed (table already exists)

**How the storefront reads it:**
- **Files:** `src/storefront/pages/AboutPage.jsx`, `src/storefront/pages/DeliveryPage.jsx`, `src/storefront/pages/PolicyPage.jsx`
- **Call:** Fetch from `site_content` table via Supabase anon key
- **Fallback:** If fetch fails or key missing, show hardcoded default content
- **Code:**
```javascript
const [content, setContent] = useState(DEFAULT_CONTENT);

useEffect(() => {
  async function loadContent() {
    const { data } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'about_page')
      .single();
    
    if (data?.value) {
      setContent(data.value);
    }
  }
  loadContent();
}, []);
```

**UI:**
- **Components:** Create three new page components
- **Placement:** In `src/storefront/pages/`
- **Existing components to reuse:**
  - Content page layout from `InformationPage.jsx` (if it exists) or ServicesPage.jsx pattern
  - `.content-page` class (already exists in CSS)
  - `.content-page-heading` class (already exists in CSS)
  - SiteFooter component (already exists)
- **Classes:** Reuse existing content page classes
- **States:** Loading (spinner), Error (error message)
- **Copy text (default):**
  - About: "About The Gifting Factory content..."
  - Delivery: "Delivery information..."
  - Policy: "Terms and conditions..."

**Behavior and edge cases:**
- If content is markdown, parse to HTML
- If content is rich text, render as HTML (dangerouslySetInnerHTML)
- If content is empty, show default fallback
- Pages should be accessible from navigation

**Files to change:**
- STOREFRONT: `src/storefront/pages/AboutPage.jsx` (create or fix)
- STOREFRONT: `src/storefront/pages/DeliveryPage.jsx` (create or fix)
- STOREFRONT: `src/storefront/pages/PolicyPage.jsx` (create or fix)
- ADMIN: `src/dashboard/pages/SettingsPage.jsx` (add content editing UI)
- ADMIN: `src/dashboard/data/settings.js` (add content CRUD functions)

**Off-switch and removal:**
- **Admin off-switch:** Delete content values from database → storefront shows defaults
- **Removal checklist:**
  1. Remove page components
  2. Remove routes from `src/site/routes.js`
  3. Keep database table (harmless if unused)
  4. Remove from feature spec

**Acceptance checks:**
1. Navigate to /about, verify page loads without 404
2. Update About content in Settings, verify storefront reflects change
3. Delete About content in Settings, verify storefront shows default
4. Repeat for Delivery and Policy pages

---

### Feature 3: Tracking Auto-Refresh

**What it does for the customer:**
Order tracking page automatically refreshes every 10 seconds so customer sees status updates without manual refresh.

**Admin control:**
- **Page:** Settings Page (`/settings`)
- **Section:** Tracking settings (new section)
- **Controls:**
  - Toggle: "Enable auto-refresh on tracking page" (boolean, default: true)
  - Number field: "Refresh interval (seconds)" (numeric, default: 10, min 5, max 60)
- **Validation:** Interval must be between 5 and 60 seconds
- **Who may change:** Staff with `is_staff() = true`

**Data:**
- **Table:** `site_settings` (already exists)
- **Columns:** Add `tracking_auto_refresh_enabled` (boolean, default true), `tracking_refresh_interval_seconds` (integer, default 10, check 5-60)
- **SQL:** See Proposed SQL section

**How the storefront reads it:**
- **File:** `src/storefront/pages/TrackOrderPage.jsx`
- **Call:** Fetch from `site_settings` table via Supabase anon key
- **Fallback:** If fetch fails or settings missing, default to enabled with 10 second interval
- **Code:**
```javascript
const [autoRefresh, setAutoRefresh] = useState(true);
const [refreshInterval, setRefreshInterval] = useState(10);

useEffect(() => {
  async function loadSettings() {
    const { data } = await supabase
      .from('site_settings')
      .select('tracking_auto_refresh_enabled, tracking_refresh_interval_seconds')
      .single();
    
    if (data) {
      setAutoRefresh(data.tracking_auto_refresh_enabled !== false);
      setRefreshInterval(data.tracking_refresh_interval_seconds || 10);
    }
  }
  loadSettings();
}, []);

useEffect(() => {
  if (!result || result.kind !== 'order' || !autoRefresh) return;
  if (result.status === 'completed' || result.status === 'cancelled') return;
  
  const interval = setInterval(() => {
    trackRecord(reference, credential);
  }, refreshInterval * 1000);
  
  return () => clearInterval(interval);
}, [result?.status, reference, credential, autoRefresh, refreshInterval]);
```

**UI:**
- **Component:** Modify existing TrackOrderPage.jsx
- **Placement:** Add interval display in header
- **Existing components to reuse:** None (new UI element)
- **Classes:** Use existing `.meta-label` class for interval display
- **States:** Loading (silent), Active (showing "Last refreshed: X"), Paused (if disabled)
- **Copy text:** "Auto-refresh: On (every 10s)", "Last refreshed: 2s ago"

**Behavior and edge cases:**
- Stop auto-refresh when order is completed or cancelled
- Stop auto-refresh if disabled in settings
- If interval is less than 5 seconds, force to 5
- If interval is more than 60 seconds, force to 60
- Silent refresh with fade effect (no loading spinner)

**Files to change:**
- STOREFRONT: `src/storefront/pages/TrackOrderPage.jsx` (add auto-refresh logic)
- DATABASE: Add columns to `site_settings` table (see Proposed SQL)
- ADMIN: `src/dashboard/pages/SettingsPage.jsx` (add tracking settings UI)
- ADMIN: `src/dashboard/data/settings.js` (add tracking settings CRUD)

**Off-switch and removal:**
- **Admin off-switch:** Disable auto-refresh toggle → storefront shows manual refresh only
- **Removal checklist:**
  1. Remove auto-refresh logic from TrackOrderPage
  2. Remove tracking settings from Settings Page
  3. Remove database columns (or keep as harmless)
  4. Remove from feature spec

**Acceptance checks:**
1. Load tracking page with active order, verify it auto-refreshes every 10s
2. Change interval to 20s in Settings, verify storefront reflects change
3. Disable auto-refresh in Settings, verify auto-refresh stops
4. Verify auto-refresh stops when order is completed

---

### Feature 4: Payment Return Retry or Confirmation Behavior

**What it does for customer:**
After returning from Paystack, if verification polling exhausts, customer can manually retry verification or continue to tracking page with manual refresh.

**Admin control:**
- None (behavior is client-side)

**Data:**
- No database changes needed

**How the storefront reads it:**
- **File:** `src/storefront/modals/CheckoutModal.jsx`
- **Call:** Existing polling logic
- **Fallback:** After 10 attempts, show "Verification taking longer than expected" message with two buttons: "Retry verification" and "View tracking status"

**UI:**
- **Component:** Modify existing CheckoutModal.jsx confirmation state
- **Placement:** After polling exhausts
- **Existing components to reuse:** Primary and soft action buttons
- **Classes:** Reuse `.primary-action` and `.soft-action` classes
- **States:** Polling (showing spinner), Exhausted (showing retry buttons), Verified (showing success)
- **Copy text:**
  - Polling: "Verifying payment..."
  - Exhausted: "Payment verification is taking longer than expected. This can happen if network is slow."
  - Retry button: "Retry verification"
  - Continue button: "View tracking status"

**Behavior and edge cases:**
- After 10 attempts (30 seconds total), show exhausted state
- "Retry verification" button calls paystack-verify again up to 3 more times
- "View tracking status" button navigates to tracking page with prefill
- If already verified during polling, show success state immediately
- If webhook already confirmed order, tracking page will show paid status

**Files to change:**
- STOREFRONT: `src/storefront/modals/CheckoutModal.jsx` (add retry logic after polling exhausts)

**Off-switch and removal:**
- **Admin off-switch:** Not applicable (client-side behavior)
- **Removal checklist:**
  1. Remove retry buttons, keep existing behavior
  2. Remove from feature spec

**Acceptance checks:**
1. Complete Paystack payment, return to storefront
2. Let polling exhaust (wait 30 seconds)
3. Verify exhausted state appears with retry buttons
4. Click "Retry verification", verify it attempts verification again
5. Click "View tracking status", verify navigation to tracking page

---

### Feature 5: Rate Limiting on Public RPCs

**What it does for security:**
Prevents enumeration attacks on order tracking by limiting number of requests per IP address.

**Admin control:**
- **Page:** Settings Page (`/settings`)
- **Section:** Security settings (new section)
- **Controls:**
  - Number field: "Tracking requests per 15 minutes" (numeric, default: 30)
  - Number field: "Tracking lockout duration (minutes)" (numeric, default: 15)
- **Validation:** Requests per window must be 1-100, lockout duration 1-60 minutes
- **Who may change:** Staff with `is_staff() = true`

**Data:**
- **Table:** `rate_limits` (already exists in schema)
- **Columns:** `ip` (text PK), `attempts` (integer, default 0), `last_attempt` (timestamptz), `locked_until` (timestamptz)
- **SQL:** No changes needed (table already exists)

**How the storefront uses it:**
- **Edge Function:** Modify `supabase/functions/paystack-webhook/index.ts` or create wrapper
- **Pattern:** Check rate limits before calling `track_record` RPC
- **Fallback:** If rate limit not available, allow request (graceful degradation)

**UI:**
- **Component:** None (Edge Function only)
- **Placement:** Edge Function code
- **Existing components to reuse:** None
- **Classes:** None
- **States:** None (server-side only)
- **Copy text:** None (no UI)

**Behavior and edge cases:**
- Count requests by IP address
- Reset attempts after lockout expires
- Return 429 Too Many Requests if rate limited
- If rate_limits table doesn't exist, allow request (graceful degradation)

**Files to change:**
- EDGE FUNCTION: `supabase/functions/paystack-webhook/index.ts` (add rate limiting check before RPC)
- ADMIN: `src/dashboard/pages/SettingsPage.jsx` (add rate limiting settings UI)
- ADMIN: `src/dashboard/data/settings.js` (add rate limiting settings CRUD)

**Off-switch and removal:**
- **Admin off-switch:** Set requests per window to very high number (9999) → effectively disabled
- **Removal checklist:**
  1. Remove rate limiting check from Edge Function
  2. Remove rate limiting settings from Settings Page
  3. Keep rate_limits table (harmless if unused)
  4. Remove from feature spec

**Acceptance checks:**
1. Make 30 tracking requests within 15 minutes from same IP, verify 429 response on 31st request
2. Wait 15 minutes, verify requests allowed again
3. Change limit to 5 in Settings, verify 429 response on 6th request
4. Disable rate limiting (set to 9999), verify all requests allowed

---

## Proposed SQL

```sql
-- ============================================================================
-- MASTER PLAN SQL: Flower Girl Slay Empire Integration
-- ============================================================================
-- This SQL is re-runnable (IF NOT EXISTS/ALTER TABLE) and commented
-- Do NOT apply without review - this is a draft, not applied yet
-- ============================================================================

-- 1. Add missing signin_log table
CREATE TABLE IF NOT EXISTS public.signin_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_in_at timestamptz NOT NULL DEFAULT now(),
  signed_out_at timestampostz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add delivery fee columns to site_settings (if not exist)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tracking_auto_refresh_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_refresh_interval_seconds integer NOT NULL DEFAULT 10 CHECK (tracking_refresh_interval_seconds >= 5 AND tracking_refresh_interval_seconds <= 60);

-- 3. Add customization fields to orders table (for request-to-order conversion)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customization_selections jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS customization_estimates jsonb DEFAULT '{"low": 0, "high": 0, "confirmed": 0}',
  ADD COLUMN IF NOT EXISTS original_request_id uuid REFERENCES public.customer_requests(id) ON DELETE SET NULL;

-- 4. Add forward link to customer_requests table
ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

-- 5. Create convert_request_to_order RPC
CREATE OR REPLACE FUNCTION public.convert_request_to_order(
  p_request_id uuid,
  p_confirmed_quote numeric,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_recipient_name text,
  p_delivery_address text,
  p_landmark text,
  p_delivery_instructions text,
  p_requested_delivery_date date,
  p_card_message text,
  p_card_style text,
  p_payment_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_order_id uuid;
  v_tracking_number text;
  v_order_code text;
  v_subtotal numeric;
  v_total numeric;
  v_fulfillment_status text := 'packaging';
BEGIN
  -- Lock and validate request
  SELECT * INTO v_request
  FROM public.customer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found'
    );
  END IF;

  IF v_request.status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request must be approved before conversion'
    );
  END IF;

  IF v_request.confirmed_quote IS NULL OR v_request.confirmed_quote = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request must have confirmed quote'
    );
  END IF;

  -- Check if already converted
  IF v_request.converted_order_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request already converted to order',
      'existing_order_id', v_request.converted_order_id
    );
  END IF;

  -- Generate tracking number and order code
  v_tracking_number := 'GF-' || to_char(extract(epoch from now())::bigint, 'FM999999');
  v_order_code := 'WEB-' || to_char(extract(epoch from now())::bigint, 'FM999999');

  -- Calculate total from confirmed quote
  v_subtotal := p_confirmed_quote;
  v_total := p_confirmed_quote;

  -- Insert order
  INSERT INTO public.orders (
    tracking_number,
    order_code,
    request_id,
    customer_name,
    customer_email,
    customer_phone,
    recipient_name,
    delivery_address,
    landmark,
    customer_note,
    card_message,
    card_style,
    requested_delivery_date,
    subtotal,
    total,
    payment_provider,
    payment_reference,
    payment_status,
    fulfillment_status,
    staff_order,
    customization_selections,
    customization_estimates,
    original_request_id
  ) VALUES (
    v_tracking_number,
    v_order_code,
    p_request_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_recipient_name,
    p_delivery_address,
    p_landmark,
    p_delivery_instructions,
    p_card_message,
    p_card_style,
    p_requested_delivery_date,
    v_subtotal,
    v_total,
    'staff', -- Staff orders bypass Paystack
    p_payment_reference,
    'paid', -- Pre-paid via quote
    v_fulfillment_status,
    true,
    v_request.selections,
    jsonb_build_object(
      'low', v_request.estimate_low,
      'high', v_request.estimate_high,
      'confirmed', p_confirmed_quote
    ),
    p_request_id
  ) RETURNING id INTO v_order_id;

  -- Insert order event
  INSERT INTO public.order_events (
    order_id,
    stage,
    customer_note,
    created_by
  ) VALUES (
    v_order_id,
    'paid',
    'Converted from request ' || v_request.reference,
    NULL
  );

  -- Update request
  UPDATE public.customer_requests
  SET
    converted_at = now(),
    converted_order_id = v_order_id,
    status = 'converted'
  WHERE id = p_request_id;

  -- Insert notification
  INSERT INTO public.admin_notifications (
    type,
    title,
    body,
    route,
    record_id
  ) VALUES (
    'new_order',
    'New converted order',
    v_tracking_number || ' · GHS ' || v_total,
    '/orders',
    v_order_id::text
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'tracking_number', v_tracking_number,
    'order_code', v_order_code
  );
END;
$$;

-- Grant execute on function
REVOKE ALL ON FUNCTION public.convert_request_to_order FROM public;
GRANT EXECUTE ON FUNCTION public.convert_request_to TO authenticated;

-- 6. Add trigger on request conversion (optional - notification trigger already exists)
-- This is handled by the function itself above

-- 7. Add rate limiting helper function (if not using Edge Function rate limiting)
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip text, p_max_attempts integer, p_window_minutes integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit RECORD;
  v_attempts integer;
  v_locked_until timestamptz;
  v_window_start timestamptz := now() - (p_window_minutes || 15) * interval '1 minute';
BEGIN
  -- Lock or create rate limit row
  INSERT INTO public.rate_limits (ip, attempts, last_attempt, locked_until)
  VALUES (p_ip, 1, now(), NULL)
  ON CONFLICT (ip) DO UPDATE SET
    attempts = CASE
      WHEN locked_until IS NULL OR locked_until < now() THEN 1
      ELSE attempts + 1
    END,
    last_attempt = now(),
    locked_until = CASE
      WHEN locked_until IS NULL AND attempts >= p_max_attempts THEN now() + (p_window_minutes || 15) * interval '1 minute'
      ELSE locked_until
    END;

  -- Read updated row
  SELECT * INTO v_rate_limit
  FROM public.rate_limits
  WHERE ip = p_ip;

  -- Check if locked
  IF v_rate_limit.locked_until IS NOT NULL AND v_rate_limit.locked_until > now() THEN
    RETURN false; -- Locked
  END IF;

  -- Check if exceeded
  IF v_rate_limit.attempts > p_max_attempts THEN
    RETURN false; -- Exceeded
  END IF;

  RETURN true; -- Allowed
END;
$$;

-- Grant execute on function
REVOKE ALL ON FUNCTION public.check_rate_limit FROM public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon;

-- 8. Update track_record RPC to use rate limiting (optional - if Edge Function rate limiting not used)
-- This would require modifying the function to accept IP address and call check_rate_limit
-- Recommend implementing rate limiting at Edge Function level instead

-- 9. Update touch_updated_at trigger to include new columns (if needed)
-- No changes needed - trigger is generic

-- ============================================================================
-- END OF PROPOSED SQL
-- ============================================================================
```

---

## Risks and Conflicts

### Risks

1. **Delivery type selection may break existing checkout flow**
   - Risk: Adding delivery type to CheckoutModal payload may cause validation errors in paystack-init
   - Mitigation: Test thoroughly, ensure paystack-init handles missing deliveryType gracefully (default to collection with 0 fee)

2. **Auto-refresh may cause performance issues**
   - Risk: 10s polling across many customers could increase database load
   - Mitigation: Rate limiting on `track_record` RPC will prevent abuse; reasonable default (10s) is acceptable

3. **Request-to-order conversion may create data inconsistency**
   - Risk: If request and order both modified independently, references may break
   - Mitigation: Use transaction in RPC, add validation, use foreign key constraints

4. **Storage cleanup may fail silently**
   - Risk: If storage delete fails but database delete succeeds, orphaned files remain
   - Mitigation: Log errors, add retry logic, report to admin via notification

5. **Rate limiting may block legitimate customers**
   - Risk: Family members sharing IP could hit rate limit
   - Mitigation: Set reasonable defaults (30 requests/15min), allow admin adjustment

### Conflicts

1. **Different visual languages**
   - Flower Girl: Warm gray editorial, Outfit font
   - Slay Empire: Rose/pink, Cormorant Garamond/Raleway
   - Resolution: Keep Flower Girl design, do not adopt Slay Empire visual language

2. **Different status models**
   - Flower Girl: Enum fields (`pending_payment`, `paid`, `packaging`, etc.)
   - Slay Empire: 4 boolean fields (`status_payment`, `status_packaged`, etc.)
   - Resolution: Keep Flower Girl enum model (stronger, cleaner)

3. **Different update mechanisms**
   - Flower Girl: Realtime subscriptions
   - Slay Empire: Polling
   - Resolution: Keep Flower Girl Realtime (superior)

4. **Different payment initialization**
   - Flower Girl: 2-step (checkout_attempt → order)
   - Slay Empire: 1-step (direct order creation)
   - Resolution: Keep Flower Girl 2-step (more robust, allows pre-validation)

---

## Decisions for the User

**Decision 1: Rate limiting implementation approach**
- **Option A:** Implement at Edge Function level (add rate limiting check before RPC)
- **Option B:** Implement at database level (use `check_rate_limit` RPC in tracking code)
- **Recommendation:** Option A (Edge Function) - cleaner separation of concerns, easier to test, no database schema changes for rate tracking
- **Your choice:** ?

**Decision 2: Request-to-order conversion UI placement**
- **Option A:** Add "Convert to Order" button in Requests Page
- **Option B:** Add "Convert to Order" button in Track Order Page (for converted requests)
- **Recommendation:** Option A (Requests Page) - more logical admin workflow
- **Your choice:** ?

**Decision 3: Customer profiles table fate**
- **Option A:** Implement properly with sync logic
- **Option B:** Remove table and sync logic, rely on orders-derived data
- **Recommendation:** Option B (remove) - simpler, orders-derived data is sufficient, reduces complexity
- **Your choice:** ?

**Decision 4: Deprecated stubs in ordersModel.js**
- **Option A:** Implement for pages outside Phase 6A scope
- **Option B:** Remove deprecated functions
- **Recommendation:** Option B (remove) - pages don't exist, stubs add confusion
- **Your choice:** ?

**Decision 5: Auto-refresh default interval**
- **Option A:** 5 seconds (faster updates)
- **Option B:** 10 seconds (Slay Empire default)
- **Option C:** 15 seconds (slower, less load)
- **Recommendation:** Option B (10 seconds) - matches Slay Empire, reasonable balance
- **Your choice:** ?

---

## Implementation Order

### DATABASE (Run SQL manually after review)

1. **Create missing signin_log table** (HIGH priority)
   - Check: Verify table doesn't exist
   - Run: SQL section 1
   - Verify: SELECT from signin_log returns expected structure

2. **Add tracking settings columns to site_settings** (MEDIUM priority)
   - Check: Verify columns don't exist
   - Run: SQL section 2
   - Verify: Settings page shows new fields

3. **Add customization fields to orders table** (HIGH priority)
   - Check: Verify columns don't exist
   - Run: SQL section 3
   - Verify: Orders table has new columns

4. **Add forward link to customer_requests** (HIGH priority)
   - Check: Verify column doesn't exist
   - Run: SQL section 4
   - Verify: customer_requests has new column

5. **Create convert_request_to_order RPC** (HIGH priority)
   - Check: Verify function doesn't exist
   - Run: SQL section 5
   - Verify: Function executes with test data

6. **Create check_rate_limit function** (HIGH priority)
   - Check: Verify function doesn't exist
   - Run: SQL section 7
   - Verify: Function executes with test data

### EDGE FUNCTION

7. **Add rate limiting to paystack-webhook** (HIGH priority)
   - **File:** `supabase/functions/paystack-webhook/index.ts`
   - **Change:** Add rate limiting check before `finalize_paid_checkout` call
   - **Pattern:** Check IP from headers, call `check_rate_limit` or implement inline rate limiting
   - **Check:** Deploy and test with multiple rapid requests

8. **Remove logging from paystack-verify** (MEDIUM priority)
   - **File:** `supabase/functions/paystack-verify/index.ts`
   - **Change:** Remove or replace `console.log` with generic message
   - **Check:** Deploy and verify no sensitive data in logs

9. **Fix CORS in paystack-init** (MEDIUM priority)
   - **File:** `supabase/functions/paystack-init/index.ts`
   - **Change:** Set `Access-Control-Allow-Origin` to `VITE_SITE_URL` or specific storefront URL
   - **Check:** Deploy and verify CORS headers

### ADMIN

10. **Add delivery type selection UI to Settings** (HIGH priority)
    - **File:** `src/dashboard/pages/SettingsPage.jsx`
    - **Change:** Add delivery settings section with toggles and number fields
    - **Check:** Settings page shows delivery settings, values persist to database

11. **Add tracking settings UI to Settings** (MEDIUM priority)
    - **File:** **Create** `src/dashboard/data/trackingSettings.js` (adapter)
    - **File:** `src/dashboard/pages/SettingsPage.jsx`
    - **Change:** Add tracking settings section with toggle and interval field
    - **Check:** Settings page shows tracking settings, values persist to database

12. **Add content editing UI to Settings** (MEDIUM priority)
    - **File:** **Create** `src/dashboard/data/contentAdapter.js` (adapter)
    - **File:** `src/dashboard/pages/SettingsPage.jsx`
    - **Change:** Add content editing section with text areas for About, Delivery, Policy
    - **Check:** Settings page shows content editing, values persist to database

13. **Implement password protection for destructive operations** (MEDIUM priority)
    - **File:** `src/dashboard/pages/OrdersPage.jsx` (delete actions)
    - **File:** `src/dashboard/pages/ProductsPage.jsx` (delete actions)
    - **Change:** Add password confirmation modal before delete
    - **Check:** Password modal appears before delete, validates against staff password or master password

14. **Add storage cleanup to product deletion** (MEDIUM priority)
    - **File:** `src/dashboard/data/products.js` (deleteProduct function)
    - **Change:** Call Supabase storage delete before database delete
    - **Check:** Product deletion removes image from storage

15. **Add storage cleanup to career application deletion** (MEDIUM priority)
    - **File:** `src/dashboard/data/careers.js` (deleteApplication function)
    - **Change:** Call Supabase storage delete before database delete
    - **Check:** Application deletion removes resume from storage

16. **Implement or remove customer_profiles sync** (LOW priority)
    - **Decision dependent:** See Decision 3
    - **If Option A (implement):** Fix sync logic, add RLS policies
    - **If Option B (remove):** Remove table and sync code
    - **Check:** No broken references, customers page still works

17. **Remove deprecated stubs from ordersModel.js** (LOW priority)
    - **Decision dependent:** See Decision 4
    - **If Option A (implement):** Implement properly
    - **If Option B (remove):** Remove stub functions
    - **Check:** No broken references, all pages work

18. **Fix Insights page data helpers** (LOW priority)
    - **File:** `src/dashboard/pages/OverviewPage.jsx`
    - **Change:** Verify `calculateOrderStats` and `calculateDailyTrend` are connected
    - **Check:** Insights page shows real data

### STOREFRONT

19. **Add delivery type selection to CheckoutModal** (HIGH priority)
    - **File:** `src/storefront/modals/CheckoutModal.jsx`
    - **Change:** Add delivery type selector UI, include in payload to `initializeCheckout`
    - **Check:** Delivery type selector appears, delivery fee calculated, payload includes deliveryType

20. **Add delivery type to checkoutApi payload** (HIGH priority)
    - **File:** `src/storefront/api/checkoutApi.js`
    - **Change:** Add deliveryType to `initializeCheckout` payload
    - **Check:** API call includes deliveryType

21. **Create/fix AboutPage.jsx** (MEDIUM priority)
    - **File:** `src/storefront/pages/AboutPage.jsx`
    - **Change:** Create or fix page component, load from `site_content` table
    - **Check:** /about route loads without 404, content editable from Settings

22. **Create/fix DeliveryPage.jsx** (MEDIUM priority)
    - **File:** `src/storefront/pages/DeliveryPage.jsx`
    - **Change:** Create or fix page component, load from `site_content` table
    - **Check:** /delivery route loads without 404, content editable from Settings

23. **Create/fix PolicyPage.jsx** (MEDIUM priority)
    - **File:** `src/storefront/pages/PolicyPage.jsx`
    - **Change:** Create or fix page component, load from `site_content` table
    - **Check:** /policy route loads without 404, content editable from Settings

24. **Add auto-refresh to TrackOrderPage** (MEDIUM priority)
    - **File:** `src/storefront/pages/TrackOrderPage.jsx`
    - **Change:** Add setInterval at configured interval, stop on completion/cancellation
    - **Check:** Tracking page auto-refreshes every configured interval, stops on completion

25. **Add payment return retry logic to CheckoutModal** (MEDIUM priority)
    - **File:** `src/storefront/modals/CheckoutModal.jsx`
    - **Change:** Add retry buttons after polling exhausts
    - **Check:** Polling exhausts shows retry buttons, retry works, continue button navigates to tracking

26. **Remove DEV console.log from CheckoutModal** (LOW priority)
    - **File:** `src/storefront/modals/CheckoutModal.jsx`
    - **Change:** Remove or ensure DEV-only check is strict
    - **Check:** No console.log in production build

### VERIFICATION

27. **Run build and lint**
    - Command: `npm run build` and `npm run lint`
    - Check: No errors or warnings

28. **Test payment flow end-to-end**
    - Create order, pay via Paystack, verify order created in database
    - Check: Delivery fee included, order status is 'paid', notification created

29. **Test tracking auto-refresh**
    - Create test order, navigate to tracking page
    - Check: Auto-refreshes every configured interval, stops on completion

30. **Test request-to-order conversion**
    - Create custom request, approve in admin, convert to order
    - Check: Order created with customization data, request marked as converted

31. **Test rate limiting**
    - Make 31 tracking requests from same IP within 15 minutes
    - Check: 31st request returns 429, 31st after lockout period succeeds

---

## Corrections to the Intel Reports

### FLOWER_GIRL_INTEL.md Corrections

1. **Status of delivery fee bug:**
   - **Intel stated:** "Status: BROKEN - delivery fees not charged"
   - **Correction:** Status should be "PARTIAL" - backend supports it but frontend doesn't send deliveryType, so fees default to 0 for customers who don't manually add it

2. **Status of checkout_attempts expiration:**
   - **Intel stated:** "expires_at = now + 2 hours"
   - **Correction:** This is correct, no correction needed

3. **Status of verification polling:**
   - **Intel stated:** "Status: WEAK - no retry mechanism after polling exhausts"
   - **Correction:** This is correct, no correction needed

### SLAY_EMPIRE_INTEL.md Corrections

No corrections needed - intel report accurately reflects Slay Empire implementation.

---

**End of MASTER PLAN**
