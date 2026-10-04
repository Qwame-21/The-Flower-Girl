# Flower Girl Project Intel Report

**Generated:** 2026-10-04  
**Project:** The Gifting Factory by Flower Girl  
**Purpose:** Complete forensic extraction of project architecture, functionality, and connectivity

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLOWER GIRL ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STOREFRONT (React 19 + Vite)                                                │
│  ├─ Client-side routing (react-router-dom)                                   │
│  ├─ State: React useState (cart, wishlist, admin mode, etc.)                │
│  ├─ Storage: localStorage (cart, wishlist), sessionStorage (payment return)│
│  ├─ Supabase Client: anon key for read operations                           │
│  └─ Pages: Home, About, Services, Gallery, Shop, Customize, Careers, Track  │
│                                                                             │
│  ↓                                                                          │
│  SUPABASE EDGE FUNCTIONS (Deno)                                              │
│  ├─ paystack-init: Initialize payment, validate cart, create checkout_attempt│
│  ├─ paystack-verify: Verify payment server-side, call finalize_paid_checkout│
│  ├─ paystack-webhook: Handle Paystack webhook with signature verification   │
│  └─ submit-inquiry: Handle custom requests and career applications           │
│                                                                             │
│  ↓                                                                          │
│  SUPABASE DATABASE (PostgreSQL)                                             │
│  ├─ Tables: products, orders, order_items, order_events, checkout_attempts│
│  │         customer_requests, reviews, careers, career_applications        │
│  │         gallery_items, site_settings, admin_notifications, staff_profiles│
│  │         customer_profiles, customization_options                        │
│  ├─ RLS: Public reads (anon), Staff writes (authenticated + is_staff())    │
│  ├─ RPCs: finalize_paid_checkout (service role only), track_record (anon)   │
│  └─ Triggers: Stock decrement, notifications, payment protection            │
│                                                                             │
│  ↓                                                                          │
│  ADMIN DASHBOARD (React 19 + Vite + HashRouter)                              │
│  ├─ Auth: Supabase Auth + staff_profiles table                             │
│  ├─ Pages: Overview, Orders, Log, Products, Customization, Shop/POS         │
│  │         Gallery, Reviews, Requests, Careers, Customers, Insights, Settings│
│  ├─ Realtime: Supabase realtime subscriptions for orders, notifications      │
│  ├─ Idle timer: 30 min auto-logout                                         │
│  └─ Audio: Web Audio API notification sounds                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pages and Button Matrix

### Home Page (`/`)
**File:** `src/storefront/home/HomePage.jsx`

| Element | Handler | Backend Call | Tables Touched | Result | Status |
|---------|---------|--------------|----------------|--------|--------|
| "SHOP GIFTS" button | `onNavigate('shop')` | None | None | Navigate to Shop page | WORKING |
| "BUILD A GIFT" button | `onNavigate('customize')` | None | None | Navigate to Customize page | WORKING |
| Portfolio slide click | `setHomeServiceOpen` + `setPreferredService` | None | None | Open service detail, set preferred service | WORKING |
| Previous/Next slide arrows | `handlePrevSlide` / `handleNextSlide` | None | None | Change slide index | WORKING |
| "READ OUR STORY" button | `setActiveTab('about')` | None | None | Navigate to About page | WORKING |
| "VIEW THIS SERVICE" button | `setPreferredService` + `setActiveTab('services')` | None | None | Navigate to Services with preferred service | WORKING |
| "VIEW THE ROLE" button | `setActiveTab('careers')` | None | None | Navigate to Careers page | WORKING |
| Social links (CALL, WA, IG) | External links | None | None | Open external URLs | WORKING |

### Shop Page (`/shop`)
**File:** `src/storefront/pages/ShopPage.jsx`

| Element | Handler | Backend Call | Tables Touched | Result | Status |
|---------|---------|--------------|----------------|--------|--------|
| Product card "ADD" button | `addWithFeedback(product)` | None (localStorage) | None | Add to cart state, persist to localStorage | WORKING |
| Product card "VIEW" button | `setDetailProduct(product)` | None | None | Open ProductDetail modal | WORKING |
| Product card heart icon | `toggleWishlist(product.id)` | None (localStorage) | None | Add/remove from wishlist state | WORKING |
| Checkout badge in Navigation | `setCheckoutRequested(true)` | None | None | Open CheckoutModal | WORKING |
| Wishlist badge in Navigation | `setWishlistRequested(true)` | None | None | Open WishlistModal | WORKING |
| "OPEN GIFT BUILDER" banner button | `onNavigate('customize')` | None | None | Navigate to Customize page | WORKING |
| Quantity controls (CheckoutModal) | `onQuantity(id, qty)` | None (localStorage) | None | Update cart item quantity | WORKING |
| "PLACE ORDER" button (CheckoutModal) | `initializeCheckout(payload)` | POST to `/functions/v1/paystack-init` | products, promotions, site_settings, checkout_attempts | Validate cart, create checkout_attempt, redirect to Paystack | WORKING |
| ProductDetail "ADD TO ORDER" button | `onAdd(product, qty)` | None (localStorage) | None | Add to cart, close modal | WORKING |
| ProductDetail "SAVE GIFT" button | `onToggleWishlist(id)` | None (localStorage) | None | Add to wishlist | WORKING |
| ProductDetail "CUSTOMIZE THIS GIFT" button | `onCustomize(product.name)` | None | None | Close modal, open Customize page with service | WORKING |
| Wishlist "VIEW" button | `onView(product)` | None | None | Open ProductDetail modal | WORKING |
| Wishlist "X" button | `onRemove(id)` | None (localStorage) | None | Remove from wishlist | WORKING |

### Customize Page (`/customize`)
**File:** `src/storefront/pages/CustomizePage.jsx`

| Element | Handler | Backend Call | Tables Touched | Result | Status |
|---------|---------|--------------|----------------|--------|--------|
| Customization option checkbox | `toggle(option)` | None | None | Add/remove from selected array | WORKING |
| Quantity control | `setQuantity(qty)` | None | None | Update quantity state | WORKING |
| "SAVE CUSTOM REQUEST(S)" button | `submitInquiry('request', record, null, submissionId)` | POST to `/functions/v1/submit-inquiry` | customer_requests, storage (request-uploads) | Create customer_request, upload inspiration image | WORKING |
| "TRACK THIS REQUEST" button (after submit) | `onNavigate('track')` + sessionStorage prefill | None | None | Navigate to Track page with prefill | WORKING |
| Retry button (fetch error) | `loadCustomization()` | GET from `customization_options` via Supabase anon | customization_options | Reload options from database | WORKING |

### Track Order Page (`/track`)
**File:** `src/storefront/pages/TrackOrderPage.jsx`

| Element | Handler | Backend Call | Tables Touched | Result | Status |
|---------|---------|--------------|----------------|--------|--------|
| "TRACK" button | `trackRecord(reference, credential)` | RPC `track_record(reference, credential)` via Supabase anon | orders, order_events, customer_requests | Return order or request details | WORKING |
| Call support link | External `tel:` link | None | None | Open phone dialer | WORKING |

### Services Page (`/services`)
**File:** `src/storefront/pages/ServicesPage.jsx`

| Element | Handler | Backend Call | Tables Touched | Result | Status |
|---------|---------|--------------|----------------|--------|--------|
| Service link click | `showService(service)` | None | None | Update selected service state | WORKING |
| "BOOK THIS SERVICE" button | `setRequestOpen(service)` | None | None | Open RequestModal with service | WORKING |
| "BROWSE READY-MADE GIFTS" button | `onNavigate('shop')` | None | None | Navigate to Shop page | WORKING |
| "BUILD A CUSTOM GIFT" button | `onNavigate('customize')` | None | None | Navigate to Customize page | WORKING |

### Careers Page (`/careers`)
**File:** `src/storefront/pages/CareersPage.jsx`

| Element | Handler | Backend Call | Tables Touched | Result | Status |
|---------|---------|--------------|----------------|--------|--------|
| "START APPLICATION" link | Scroll to form | None | None | Scroll to application form | WORKING |
| "START APPLICATION" button | `submitInquiry('career', record, file, submissionId)` | POST to `/functions/v1/submit-inquiry` | career_applications, storage (career-files) | Create career_application, upload resume | WORKING |

### Gallery Page (`/gallery`)
**File:** `src/storefront/pages/GalleryPage.jsx`

| Element | Handler | Backend Call | Tables Touched | Result | Status |
|---------|---------|--------------|----------------|--------|--------|
| Gallery images | `readAdminData().gallery` + realtime subscription | GET from `gallery_items` via Supabase sync | gallery_items | Display gallery images from Supabase or localStorage cache | WORKING |
| "SEE MORE ON INSTAGRAM" link | External Instagram link | None | None | Open Instagram | WORKING |

### About Page (`/about`)
**File:** `src/storefront/pages/AboutPage.jsx` (NOT FOUND - referenced in routes.js but file exists in components folder)
**Status:** PAGE NOT FOUND - Routes reference `/about` but file location unclear

### Information Pages (`/delivery`, `/policy`)
**File:** `src/storefront/pages/InformationPage.jsx` (NOT FOUND - referenced in routes.js)
**Status:** PAGE NOT FOUND - Routes reference these pages but file location unclear

---

## Customization Spec

### Customization Options Loading
**File:** `src/storefront/data/customization.js`

**Source:** `customization_options` table via Supabase anon key

**Columns:**
- `id` (uuid) - Primary key
- `category` (text) - Group label (e.g., "Base", "Add-ons", "Finishing")
- `option_name` (text) - Individual option name
- `estimate` (numeric) - Estimated price for this option
- `display_order` (integer) - Sort order within category
- `visible` (boolean) - Whether to show in storefront

**API Call:**
```javascript
supabase
  .from('customization_options')
  .select('category, option_name, estimate, display_order')
  .eq('visible', true)
  .order('category', { ascending: true })
  .order('display_order', { ascending: true })
```

**UI Mapping:**
- Options grouped by `category` → fieldset with legend
- Checkbox for each `option_name`
- Selected options stored in React state array
- Live estimate calculated: `sum(selected.map(opt => estimates[opt])) * quantity`

### Customization Request Submission
**File:** `src/storefront/pages/CustomizePage.jsx` + `src/storefront/api/submissions.js`

**Payload Structure:**
```javascript
{
  kind: 'request',
  record: {
    service: 'Custom gift',
    email: string,
    occasion: string,
    date: 'YYYY-MM-DD',
    name: string,
    phone: string,
    note: string,  // Gift notes and instructions
    cardMessage: string (optional),
    cardStyleNotes: string (optional),
    preferredDate: formatted date,
    estimateLow: number,
    estimateHigh: number,
    selections: string[],  // Array of selected option names
    quantity: number,
    // Also includes delivery details from requestDeliveryDetails():
    fulfilment: 'delivery' | 'collection',
    recipient: string,
    recipientPhone: string,
    deliveryAddress: string,
    landmark: string,
    locationLink: string,
    deliveryInstructions: string,
    budget: string
  },
  file: File (optional inspiration image),
  submissionId: uuid (client-generated for deduplication)
}
```

**API Endpoint:** `POST /functions/v1/submit-inquiry`

**Database Storage:**
- **Table:** `customer_requests`
- **Columns populated:**
  - `id` = submissionId (uuid)
  - `reference` = `RQ-{submissionId without dashes, uppercase, first 16 chars}`
  - `request_type` = 'bespoke_gift' (if service === 'Custom gift')
  - `service` = record.service
  - `customer_name` = record.name
  - `email` = record.email
  - `phone` = record.phone
  - `occasion` = record.occasion
  - `preferred_date` = record.date
  - `quantity` = record.quantity
  - `selections` = record.selections (jsonb array)
  - `estimate_low` = record.estimateLow
  - `estimate_high` = record.estimateHigh
  - `notes` = record.note + delivery details (formatted string)
  - `card_message` = record.cardMessage
  - `card_style` = record.cardStyleNotes
  - `status` = 'new'
  - `inspiration_path` = uploaded file path (if provided)

**Validation in Edge Function:**
- Email format validation
- Phone length validation (min 7 digits)
- Date validation (not in past)
- Quantity validation (1-1000)
- Selections validation (max 100 items, max 200 chars each)
- File validation (max 5MB, allowed extensions based on type)

**Storage:**
- **Bucket:** `request-uploads` (private)
- **Path:** `{submissionId}/{uuid}.{ext}`

---

## Orders and Tracking

### Order Creation Flow

**Initiation:** CheckoutModal → `initializeCheckout(payload)`

**Payload to paystack-init:**
```javascript
{
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  recipientName: string (optional),
  deliveryAddress: string,
  deliveryType: 'sameday' | 'scheduled' | 'surprise' | 'collection' (optional),
  landmark: string (optional),
  locationLink: string (optional),
  customerNote: string (optional),
  cardMessage: string (optional),
  cardStyleNotes: string (optional),
  requestedDeliveryDate: string (optional, 'YYYY-MM-DD'),
  callbackUrl: string (optional),
  cart: [{
    id: string,
    name: string,
    quantity: number,
    price: number
  }]
}
```

**paystack-init Edge Function** (`supabase/functions/paystack-init/index.ts`):

1. **Server-side validation:**
   - Fetch products from `products` table (by id)
   - Fetch active promotions from `promotions` table
   - Fetch site settings from `site_settings` table
   - Validate product visibility and stock
   - Calculate server-side prices with discounts
   - Validate delivery type against site settings (enabled/disabled flags)
   - Calculate delivery fee from site settings

2. **Create checkout_attempt:**
   - **Table:** `checkout_attempts`
   - **Columns:**
     - `id` = uuid
     - `payment_reference` = `gf_{timestamp}_{random6}` (Paystack reference)
     - `tracking_number` = `GF-{last 6 digits of timestamp}`
     - `order_code` = `WEB-{last 6 digits of timestamp}`
     - `customer_email` = customerEmail
     - `checkout_data` = jsonb with all form fields
     - `items` = jsonb array of validated items with metadata (discount_percent)
     - `subtotal` = server-calculated subtotal
     - `total` = subtotal + delivery fee
     - `currency` = 'GHS'
     - `status` = 'initialized'
     - `authorization_url` = Paystack authorization URL (after API call)
     - `expires_at` = now + 2 hours

3. **Call Paystack API:**
   - POST to `https://api.paystack.co/transaction/initialize`
   - Headers: `Authorization: Bearer {PAYSTACK_SECRET_KEY}`
   - Body includes reference, email, amount (in pesewas), currency, callback_url, metadata

4. **Response to client:**
   ```javascript
   {
     authorizationUrl: string,
     reference: string,
     trackingNumber: string,
     orderCode: string,
     subtotal: number,
     deliveryFee: number,
     total: number
   }
   ```

5. **Client redirects to Paystack**

### Payment Verification & Order Finalization

**Webhook path:** `POST /functions/v1/paystack-webhook`

**Security:**
- HMAC-SHA512 signature verification using `x-paystack-signature` header
- Only processes `charge.success` events
- Double-verifies with Paystack API before finalizing

**Finalization RPC:** `finalize_paid_checkout(verified_reference, verified_amount, verified_currency)`

**Function:** `public.finalize_paid_checkout` (security definer, service role only)

**Steps:**
1. Lock `checkout_attempts` row by payment_reference
2. Check if already processed (idempotent)
3. Validate amount and currency match
4. **Insert into `orders`:**
   - `tracking_number` = from checkout_attempt
   - `order_code` = from checkout_attempt
   - `customer_name`, `customer_email`, `customer_phone` = from checkout_data
   - `recipient_name`, `delivery_address`, `landmark`, `location_link` = from checkout_data
   - `customer_note`, `card_message`, `card_style` = from checkout_data
   - `requested_delivery_date` = from checkout_data
   - `subtotal`, `total` = from checkout_attempt
   - `payment_provider` = 'paystack'
   - `payment_reference` = verified reference
   - `payment_status` = 'paid'
   - `fulfillment_status` = 'packaging' (FIXED in migration)
   - `staff_order` = false

5. **Insert into `order_items`:**
   - For each item in checkout_attempt.items:
     - Fetch product category from `products` table
     - Store category in metadata jsonb
     - Insert with order_id, product_id, item_name, quantity, unit_price, metadata

6. **Decrement product stock:**
   - For each item with product_id:
     - Update `products.stock = greatest(0, stock - quantity)`
     - If stock <= low_stock_threshold, insert notification into `admin_notifications`

7. **Insert order event:**
   - Stage = 'paid', note = 'Payment confirmed'

8. **Insert notification:**
   - Type = 'new_order', title = 'New paid order', body = '{tracking} · GHS {total}'

9. **Update checkout_attempt:**
   - status = 'paid'
   - order_id = created order id

10. **Return:** `{orderId, trackingNumber, orderCode, alreadyProcessed}`

### Order Status Flow

**Fulfillment Statuses (enum):**
- `pending_payment` - Initial state before payment
- `paid` - Payment confirmed (maps to 'packaging' in dashboard)
- `packaging` - Order being prepared
- `ready` - Packed and ready for dispatch
- `delivery` - Dispatched/in transit
- `completed` - Delivered
- `cancelled` - Cancelled

**Payment Statuses (enum):**
- `pending` - Payment not yet received
- `paid` - Payment confirmed
- `failed` - Payment failed
- `refunded` - Payment refunded

**Status Changes:**
- Admin can change fulfillment status via dashboard
- Paystack-paid orders have trigger protection (cannot unmark as paid)
- Staff orders (staff_order = true) can toggle paid/unpaid freely
- Each status change inserts row into `order_events`

### Order Tracking

**Customer-facing tracking:** TrackOrderPage

**Two paths:**

1. **Legacy fallback (no Supabase):**
   - Reads from localStorage cache via `readAdminData()`
   - Searches in `orders` and `requests` arrays
   - Matches by tracking/code + email/phone (last 9 digits)

2. **Supabase RPC (preferred):**
   - Calls RPC `track_record(lookup_reference, lookup_contact)`
   - **Function:** `public.track_record` (security definer, anon access)
   - **Logic:**
     - Normalizes phone (digits only, drops Ghana country code +233, drops leading 0)
     - Searches `orders` by `order_code` OR `tracking_number` (case-insensitive)
     - Validates contact: email match OR phone match (last 9 digits)
     - If not found, searches `customer_requests` by `reference`
     - Returns jsonb with kind ('order' or 'request') and details

**Order response shape:**
```javascript
{
  kind: 'order',
  trackingNumber: string,
  customerName: string,
  status: string,  // fulfillment_status mapped
  paymentStatus: string,
  estimatedDelivery: timestamp,
  requestedDeliveryDate: date,
  adminNote: string,
  events: [{
    stage: string,
    note: string,
    createdAt: timestamp
  }]
}
```

**Request response shape:**
```javascript
{
  kind: 'request',
  reference: string,
  customerName: string,
  requestType: string,
  service: string,
  status: string,
  preferredDate: date,
  confirmedQuote: number,
  adminNote: string,
  updatedAt: timestamp
}
```

**Refresh behavior:**
- Manual refresh via "TRACK" button
- No auto-refresh or polling
- Payment return from Paystack triggers verification polling in CheckoutModal (max 10 attempts, 3s intervals)

---

## Admin Behavior

### Admin Authentication

**Flow:**
1. User navigates to `/admin`
2. AdminAccess component checks for saved Supabase session
3. If no session, shows StaffLogin form
4. User enters email + password
5. Calls `supabase.auth.signInWithPassword()`
6. On success, calls `getStaffIdentity(supabase, session)`
7. **Staff identity check:**
   - Queries `staff_profiles` table by `user_id`
   - Must have `active = true`
   - Role must be 'owner', 'admin', or 'staff'
   - If no row or inactive, throws `STAFF_ACCESS_REQUIRED` error
8. Records sign-in to `signin_log` table
9. Sets dashboard to ready state

**Files:**
- `src/admin/components/AdminAccess.jsx` - Access gate and login form
- `src/admin/utils/staffAccess.js` - Staff identity verification
- `src/dashboard/lib/signinLog.js` - Sign-in/out logging

**Security:**
- Lockout after 5 failed attempts (60 second timer)
- Caps lock detection
- Session persisted by Supabase auth
- 30-minute idle timeout with auto-logout
- All admin routes require staff profile

### Admin Data Loading

**Realtime subscriptions:**
- Orders page: Subscribes to `orders` table changes + `admin_notifications` INSERT
- Notifications: Subscribe to `admin_notifications` INSERT events
- Fallback polling available if realtime fails

**Adapters:**
- `adminStore.js` - Legacy localStorage-based cache with Supabase sync
- `supabaseSync.js` - Fetches products, promotions, gallery, settings from Supabase
- Settings cached in localStorage under `xa12-app-settings-v1`

### Admin Operations

**Orders Page** (`src/dashboard/pages/OrdersPage.jsx`):
- **Load:** `listOrders()` - fetches orders with items and events
- **Status change:** `updateOrderStatus(orderId, action, customerNote, userId)`
  - Validates Paystack protection
  - Updates fulfillment_status and payment_status
  - Inserts/deletes order_events rows
  - Optimistic UI update with rollback on error
- **Delete:** `deleteOrder(orderId)` - deletes order_events, order_items, then orders
- **Note update:** `updateOrderNote(orderId, adminNote)`
- **Bulk actions:** Move status, cancel, delete multiple orders

**Shop/POS Page** (`src/dashboard/pages/ShopPOSPage.jsx`):
- **Load:** `loadPosProducts()` - fetches visible products from Supabase
- **Create order:** `placeStaffOrder(formData, cart, userId)`
  - Calls `createStaffOrder()` from orders.js
  - Generates tracking number and order code
  - Decrements stock
  - Sets `staff_order = true`
  - Inserts initial order event

**Products Page** (`src/dashboard/pages/ProductsPage.jsx`):
- **CRUD:** `listProducts()`, `createProduct()`, `updateProduct()`, `deleteProduct()`
- **Image upload:** `uploadProductImage()` to `storefront-media` bucket
- **Promotions:** `listPromotions()`, `createPromotion()`, `updatePromotion()`, `deletePromotion()`

**Gallery Page** (`src/dashboard/pages/GalleryPage.jsx`):
- **CRUD:** `listGalleryItems()`, `createGalleryItem()`, `updateGalleryItem()`, `deleteGalleryItem()`
- **Image upload:** `uploadGalleryImage()` to `storefront-media` bucket

**Requests Page** (`src/dashboard/pages/RequestsPage.jsx`):
- **Load:** `listRequests()` - fetches all customer_requests
- **Update status:** `updateRequestStatus(id, status, adminNote)`
- **Update quote:** `updateRequestQuote(id, confirmedQuote)`
- **Delete:** `deleteRequest(id)`

**Careers Page** (`src/dashboard/pages/CareersPage.jsx`):
- **Load:** `listCareers()` - career postings
- **Load applications:** `listApplications()` - career_applications with career title
- **CRUD:** `createCareer()`, `updateCareer()`, `deleteCareer()`
- **Application status:** `updateApplicationStatus(id, status)`
- **Delete application:** `deleteApplication(id)`

**Reviews Page** (`src/dashboard/pages/ReviewsPage.jsx`):
- **Load:** `listReviews()` - all reviews
- **Create:** `createReview()` - inserts with status 'pending'
- **Update status:** `updateReviewStatus(id, status)` - pending/published/flagged
- **Delete:** `deleteReview(id)`

**Customers Page** (`src/dashboard/pages/CustomersPage.jsx`):
- **Load:** `syncCustomersWithSupabase()` - derived from orders table
- Groups customers by email/phone/name
- Calculates order count and total spend
- Stores VIP flag and notes in localStorage cache
- Attempts to sync to `customer_profiles` table (NOT FOUND in schema)

**Settings Page** (`src/dashboard/pages/SettingsPage.jsx`):
- **Load:** `syncSettingsWithSupabase()` - fetches from `site_settings` table
- **Save:** `persistSettings(settings)` - updates `site_settings` table
- Maps between UI shape and database columns

**Customization Page** (`src/dashboard/pages/CustomizationPage.jsx`):
- **Load:** Fetches from `customization_options` table
- **CRUD:** Create, update, delete customization options
- Columns: category, option_name, estimate, display_order, visible

**Notifications** (`src/dashboard/data/notifications.js`):
- **Load:** `listNotifications()` - excludes 'status_change' type
- **Mark read:** `markNotificationRead(id)`
- **Delete:** `deleteNotification(id)`
- **Clear all:** `clearAllNotifications()` - delete or mark all as read
- **Realtime:** `subscribeToNotifications(callback)`
- **Polling fallback:** `startNotificationPolling(callback)`

### Admin Deletion

**Require password for destructive operations:**
- Controlled by `site_settings.require_password_destructive`
- Not implemented in current code (TODO)

**Deletion sequence:**
- Orders: order_events → order_items → orders (cascades handled by foreign keys)
- Gallery: storage delete → database delete
- Products: database delete (image remains in storage - NOT cleaned up)
- Requests: direct delete
- Reviews: direct delete
- Careers: direct delete
- Applications: direct delete (resume file NOT cleaned up from storage)

---

## Payments

### Payment Provider
**Provider:** Paystack (https://paystack.co)

### Payment Flow

1. **Initialization:**
   - Client sends cart to `paystack-init` Edge Function
   - Server validates products, prices, stock, delivery settings
   - Server creates `checkout_attempts` row with status 'initialized'
   - Server calls Paystack transaction/initialize API
   - Server receives authorization_url
   - Server updates checkout_attempts with authorization_url
   - Client receives authorization_url and redirects to Paystack

2. **Payment:**
   - User completes payment on Paystack
   - Paystack redirects to callback_url (if provided) or returns to merchant
   - Client lands back at storefront with `?payment=return` query param
   - CheckoutModal shows confirmation state and polls for verification

3. **Verification (Client-side polling):**
   - CheckoutModal calls `paystack-verify` Edge Function
   - Server calls Paystack transaction/verify API
   - If verified, server calls `finalize_paid_checkout` RPC
   - Polling continues up to 10 attempts with 3s intervals
   - Falls back to tracking API check as verification

4. **Webhook (Server-side):**
   - Paystack sends POST to `paystack-webhook` Edge Function
   - Webhook verifies HMAC-SHA512 signature
   - Processes only `charge.success` events
   - Double-verifies with Paystack API
   - Calls `finalize_paid_checkout` RPC
   - Returns success response

### Secret Keys

**Client-side (safe):**
- `VITE_PAYSTACK_PUBLIC_KEY` - Paystack public key (pk_test_...)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

**Server-side (Edge Function secrets):**
- `PAYSTACK_SECRET_KEY` - Paystack secret key (sk_test_... or sk_live_...)
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected by Supabase runtime
- `SUPABASE_URL` - Auto-injected by Supabase runtime
- `STOREFRONT_URL` - Optional for callback URL validation

### Payment Status Protection

**Trigger:** `protect_paystack_payment()` on `orders` table

**Logic:**
- Prevents changing payment_status from 'paid' to anything else
- EXCEPT when `staff_order = true` (staff orders can toggle freely)
- Only applies to Paystack orders (`payment_provider = 'paystack'`)

---

## Database Spec

### Tables

#### `staff_profiles`
- `user_id` (uuid, PK, references auth.users)
- `display_name` (text, not null)
- `role` (text, not null, check: 'owner'|'admin'|'staff')
- `active` (boolean, not null, default true)
- `created_at` (timestamptz, not null, default now())

**RLS:**
- Staff read/write via `is_staff()` function
- No public access

#### `products`
- `id` (text, PK)
- `name` (text, not null)
- `slug` (text, unique, not null)
- `tag` (text, default '')
- `description` (text, default '')
- `details` (jsonb, default '[]')
- `category` (text, not null)
- `price` (numeric(12,2), not null, check: price >= 0)
- `stock` (integer, not null, default 0, check: stock >= 0)
- `low_stock_threshold` (integer, not null, default 3, check: low_stock_threshold >= 0)
- `image_path` (text)
- `secondary_image_path` (text)
- `visible` (boolean, not null, default true)
- `sort_order` (integer, not null, default 0)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- Public: select on visible products
- Staff: all operations via `is_staff()`

#### `collections`
- `id` (uuid, PK, default gen_random_uuid())
- `title` (text, not null)
- `description` (text, default '')
- `status` (text, not null, default 'draft', check: 'draft'|'live')
- `sort_order` (integer, not null, default 0)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- Public: select on live collections
- Staff: all operations via `is_staff()`

#### `collection_products`
- `collection_id` (uuid, references collections, PK part 1)
- `product_id` (text, references products, PK part 2)
- `sort_order` (integer, not null, default 0, PK part 3)

**RLS:**
- Public: select all
- Staff: all operations via `is_staff()`

#### `promotions`
- `id` (uuid, PK, default gen_random_uuid())
- `product_id` (text, references products, not null)
- `percent` (numeric(5,2), not null, check: 0 < percent <= 90)
- `status` (text, not null, default 'paused', check: 'active'|'paused')
- `starts_at` (timestamptz)
- `ends_at` (timestamptz)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**Index:** One active promotion per product (where status = 'active')

**RLS:**
- Public: select on active promotions within date range
- Staff: all operations via `is_staff()`

#### `gallery_items`
- `id` (uuid, PK, default gen_random_uuid())
- `image_path` (text, not null)
- `label` (text, not null)
- `category` (text)
- `visible` (boolean, not null, default true)
- `sort_order` (integer, not null, default 0)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- Public: select on visible items
- Staff: all operations via `is_staff()`

#### `customer_requests`
- `id` (uuid, PK, default gen_random_uuid())
- `reference` (text, unique, not null)
- `request_type` (text, not null, check: 'bespoke_gift'|'service')
- `service` (text)
- `customer_name` (text, not null)
- `email` (text)
- `phone` (text, not null)
- `occasion` (text)
- `preferred_date` (date)
- `selections` (jsonb, default '[]')
- `quantity` (integer, not null, default 1, check: quantity > 0)
- `notes` (text)
- `card_message` (text)
- `card_style` (text)
- `inspiration_path` (text)
- `estimate_low` (numeric(12,2))
- `estimate_high` (numeric(12,2))
- `confirmed_quote` (numeric(12,2))
- `status` (text, not null, default 'new', check: 'new'|'quote_needed'|'approved'|'converted'|'closed')
- `admin_note` (text)
- `approved_at` (timestamptz)
- `converted_at` (timestamptz)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**Triggers:**
- `on_new_customer_request` - Inserts notification on insert

**RLS:**
- No public INSERT/UPDATE (must use Edge Function)
- Staff: all operations via `is_staff()`

#### `orders`
- `id` (uuid, PK, default gen_random_uuid())
- `tracking_number` (text, unique, not null)
- `order_code` (text, unique, not null)
- `request_id` (uuid, references customer_requests, on delete set null)
- `customer_name` (text, not null)
- `customer_email` (text)
- `customer_phone` (text, not null)
- `recipient_name` (text)
- `delivery_address` (text, not null)
- `landmark` (text)
- `location_link` (text)
- `customer_note` (text)
- `card_message` (text)
- `card_style` (text)
- `requested_delivery_date` (date)
- `subtotal` (numeric(12,2), not null, check: subtotal >= 0)
- `total` (numeric(12,2), not null, check: total >= 0)
- `payment_provider` (text, not null, default 'paystack')
- `payment_reference` (text, unique)
- `payment_status` (text, not null, default 'pending', check: 'pending'|'paid'|'failed'|'refunded')
- `fulfillment_status` (text, not null, default 'pending_payment', check: 'pending_payment'|'paid'|'packaging'|'ready'|'delivery'|'completed'|'cancelled')
- `estimated_delivery` (timestamptz)
- `admin_note` (text)
- `staff_order` (boolean, not null, default false)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**Triggers:**
- `protect_paystack_payment` - Prevents undoing Paystack payments
- `notify_status_change` - Inserts notification on fulfillment_status change

**RLS:**
- No public INSERT/UPDATE (must use Edge Function or service role)
- Staff: all operations via `is_staff()`

#### `order_items`
- `id` (uuid, PK, default gen_random_uuid())
- `order_id` (uuid, references orders, on delete cascade, not null)
- `product_id` (text, references products, on delete set null)
- `item_name` (text, not null)
- `quantity` (integer, not null, check: quantity > 0)
- `unit_price` (numeric(12,2), not null, check: unit_price >= 0)
- `metadata` (jsonb, default '{}')

**RLS:**
- No public access
- Staff: all operations via `is_staff()`

#### `order_events`
- `id` (bigint, generated always as identity, PK)
- `order_id` (uuid, references orders, on delete cascade, not null)
- `stage` (text, not null, check: 'pending_payment'|'paid'|'packaging'|'ready'|'delivery'|'completed'|'cancelled')
- `customer_note` (text)
- `created_by` (uuid, references auth.users, on delete set null)
- `created_at` (timestamptz, not null, default now())

**RLS:**
- No public access
- Staff: all operations via `is_staff()`

#### `checkout_attempts`
- `id` (uuid, PK, default gen_random_uuid())
- `payment_reference` (text, unique, not null)
- `tracking_number` (text, unique, not null)
- `order_code` (text, unique, not null)
- `customer_email` (text, not null)
- `checkout_data` (jsonb, not null)
- `items` (jsonb, not null)
- `subtotal` (numeric(12,2), not null, check: subtotal >= 0)
- `total` (numeric(12,2), not null, check: total >= 0)
- `currency` (text, not null, default 'GHS', check: currency = 'GHS')
- `status` (text, not null, default 'initialized', check: 'initialized'|'paid'|'failed'|'expired')
- `authorization_url` (text)
- `order_id` (uuid, references orders, on delete set null)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())
- `expires_at` (timestamptz, not null, default now() + interval '2 hours')

**RLS:**
- No public access
- Staff: all operations via `is_staff()`

#### `reviews`
- `id` (uuid, PK, default gen_random_uuid())
- `customer_name` (text, not null)
- `product_or_service` (text, not null)
- `rating` (integer, not null, check: rating between 1 and 5)
- `review_text` (text, not null)
- `status` (text, not null, default 'pending', check: 'pending'|'published'|'flagged')
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- Public: select on published reviews
- Staff: all operations via `is_staff()`

#### `careers`
- `id` (uuid, PK, default gen_random_uuid())
- `title` (text, not null)
- `location` (text)
- `employment_type` (text)
- `description` (text, not null)
- `status` (text, not null, default 'draft', check: 'draft'|'open'|'paused'|'closed')
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- Public: select on open careers
- Staff: all operations via `is_staff()`

#### `career_applications`
- `id` (uuid, PK, default gen_random_uuid())
- `career_id` (uuid, references careers, on delete set null)
- `full_name` (text, not null)
- `email` (text, not null)
- `phone` (text, not null)
- `location` (text)
- `portfolio_url` (text)
- `earliest_start_date` (date)
- `experience` (text)
- `motivation` (text)
- `resume_path` (text)
- `status` (text, not null, default 'new', check: 'new'|'reviewing'|'shortlisted'|'rejected'|'hired')
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**Triggers:**
- `on_new_career_application` - Inserts notification on insert

**RLS:**
- No public INSERT/UPDATE (must use Edge Function)
- Staff: all operations via `is_staff()`

#### `site_content`
- `key` (text, PK)
- `value` (text, not null, default '')
- `updated_at` (timestamptz, not null, default now())
- `updated_by` (uuid, references auth.users, on delete set null)

**RLS:**
- Public: select all
- Staff: all operations via `is_staff()`

#### `site_settings`
- `id` (text, PK, default 'global', check: id = 'global')
- `business_name` (text, not null)
- `support_phone` (text)
- `support_email` (text)
- `dispatch_city` (text)
- `delivery_note` (text)
- `announcement_enabled` (boolean, not null, default false)
- `store_address` (text)
- `instagram_url` (text)
- `delivery_sameday_enabled` (boolean, not null, default true)
- `delivery_sameday_fee` (numeric(12,2), not null, default 120)
- `delivery_scheduled_enabled` (boolean, not null, default true)
- `delivery_scheduled_fee` (numeric(12,2), not null, default 90)
- `delivery_surprise_enabled` (boolean, not null, default true)
- `delivery_surprise_fee` (numeric(12,2), not null, default 140)
- `delivery_collection_enabled` (boolean, not null, default true)
- `delivery_collection_fee` (numeric(12,2), not null, default 0)
- `low_stock_threshold` (integer, not null, default 3)
- `low_stock_alerts` (boolean, not null, default true)
- `notifications_new_orders` (boolean, not null, default true)
- `notifications_new_requests` (boolean, not null, default true)
- `notifications_new_careers` (boolean, not null, default true)
- `notifications_low_stock` (boolean, not null, default true)
- `require_password_destructive` (boolean, not null, default true)
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- Public: select all
- Staff: all operations via `is_staff()`

#### `admin_notifications`
- `id` (uuid, PK, default gen_random_uuid())
- `type` (text, not null)
- `title` (text, not null)
- `body` (text)
- `route` (text)
- `record_id` (text)
- `read_at` (timestamptz)
- `created_at` (timestamptz, not null, default now())

**RLS:**
- No public access
- Staff: all operations via `is_staff()`

#### `customer_profiles`
- `email` (text, PK)
- `vip` (boolean, not null, default false)
- `notes` (text)
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- No public access
- Staff: all operations via `is_staff()`

**CODE MISMATCH:** CustomersPage references this table but it's not used in the main flow. Customer data is derived from orders table instead.

#### `customization_options`
- `id` (uuid, PK, default gen_random_uuid())
- `category` (text, not null)
- `option_name` (text, not null)
- `estimate` (numeric(12,2), not null, default 0, check: estimate >= 0)
- `display_order` (integer, not null, default 0)
- `visible` (boolean, not null, default true)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**RLS:**
- Public: select on visible options
- Staff: all operations via `is_staff()`

#### `signin_log` (NOT in schema.sql, referenced in signinLog.js)
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users)
- `signed_in_at` (timestamptz)
- `signed_out_at` (timestamptz)
- `user_agent` (text)

**CODE MISMATCH:** Table referenced in code but not defined in schema.sql. Will need to be created.

### RPC Functions

#### `public.is_staff()`
- Returns: boolean
- Checks if current auth.uid has active staff_profiles row
- Used in RLS policies

#### `public.finalize_paid_checkout(verified_reference, verified_amount, verified_currency)`
- Returns: jsonb
- Security definer, service role only
- Converts checkout_attempt to order
- Decrements stock
- Creates order_items
- Inserts order_events
- Creates notifications
- Idempotent (returns alreadyProcessed if already finalized)

#### `public.track_record(lookup_reference, lookup_contact)`
- Returns: jsonb
- Security definer, anon access
- Normalizes phone numbers
- Searches orders by tracking_number or order_code
- Searches customer_requests by reference
- Validates contact match (email or phone)
- Returns order or request details with events

#### `public.normalize_phone(phone)`
- Returns: text
- Normalizes phone to Ghana format
- Removes +, 00, country code 233, leading 0
- Used by track_record

### Triggers

#### `touch_updated_at()`
- Fires before update on all main tables
- Sets updated_at = now()

#### `protect_paystack_payment()`
- Fires before update of payment_status on orders
- Prevents undoing Paystack payments (unless staff_order = true)

#### `notify_status_change()`
- Fires after update of fulfillment_status on orders
- Inserts notification when status changes

#### `on_new_customer_request()`
- Fires after insert on customer_requests
- Inserts notification

#### `on_new_career_application()`
- Fires after insert on career_applications
- Inserts notification

### Storage Buckets

#### `storefront-media` (public)
- Product images: `products/{productId}.{ext}`
- Gallery images: `gallery/{uuid}.{ext}`

**RLS:**
- Public: select
- Staff: all operations via `is_staff()`

#### `request-uploads` (private)
- Custom request inspiration images: `{submissionId}/{uuid}.{ext}`

**RLS:**
- Staff: select, insert via `is_staff()`

#### `career-files` (private)
- Career application resumes: `{submissionId}/{uuid}.{ext}`

**RLS:**
- Staff: select, insert via `is_staff()`

### Realtime Publications

- `products` table added to `supabase_realtime` publication
- `gallery_items` table added to `supabase_realtime` publication

---

## Connectivity Findings

### Working Chains

1. **Storefront → Products (Read):**
   - ShopPage → readAdminData() → localStorage cache OR supabaseSync() → Supabase products table
   - Status: WORKING (dual path: cache + sync)

2. **Storefront → Custom Request (Write):**
   - CustomizePage → submitInquiry() → submit-inquiry Edge Function → customer_requests table + storage
   - Status: WORKING

3. **Storefront → Career Application (Write):**
   - CareersPage → submitInquiry() → submit-inquiry Edge Function → career_applications table + storage
   - Status: WORKING

4. **Storefront → Order Payment (Write):**
   - CheckoutModal → initializeCheckout() → paystack-init Edge Function → checkout_attempts table → Paystack API → redirect
   - Status: WORKING

5. **Payment → Order Finalization:**
   - Paystack webhook → paystack-webhook Edge Function → finalize_paid_checkout RPC → orders table + order_items + stock decrement
   - Status: WORKING

6. **Admin → Orders (Read/Write):**
   - OrdersPage → listOrders() → Supabase orders table with items and events
   - OrdersPage → updateOrderStatus() → Supabase orders + order_events
   - Status: WORKING

7. **Admin → Staff Orders (Write):**
   - ShopPOSPage → placeStaffOrder() → createStaffOrder() → orders table + stock decrement
   - Status: WORKING

8. **Admin → Products (Read/Write):**
   - ProductsPage → listProducts() → Supabase products table
   - ProductsPage → create/update/delete → Supabase products table
   - Status: WORKING

9. **Admin → Gallery (Read/Write):**
   - GalleryPage → listGalleryItems() → Supabase gallery_items table
   - GalleryPage → create/update/delete → Supabase gallery_items table + storage
   - Status: WORKING

10. **Admin → Requests (Read/Write):**
    - RequestsPage → listRequests() → Supabase customer_requests table
    - RequestsPage → update/delete → Supabase customer_requests table
    - Status: WORKING

11. **Admin → Settings (Read/Write):**
    - SettingsPage → syncSettingsWithSupabase() → Supabase site_settings table
    - SettingsPage → persistSettings() → Supabase site_settings table
    - Status: WORKING

12. **Admin → Customization (Read/Write):**
    - CustomizationPage → fetch from Supabase customization_options table
    - CustomizationPage → create/update/delete → Supabase customization_options table
    - Status: WORKING

13. **Customer → Order Tracking (Read):**
    - TrackOrderPage → trackRecord() → track_record RPC → orders/customer_requests tables
    - Status: WORKING

14. **Admin → Notifications (Read/Write):**
    - Dashboard → subscribeToNotifications() → Supabase realtime on admin_notifications
    - Triggers insert notifications on new orders, requests, applications, low stock
    - Status: WORKING

### Broken or Weak Links

1. **Admin → Sign-in Log (Write):**
   - File: `src/dashboard/lib/signinLog.js`
   - References `signin_log` table
   - Table NOT FOUND in schema.sql
   - Status: BROKEN - will fail on write

2. **Admin → Customer Profiles (Write):**
   - File: `src/dashboard/data/customersAdapter.js`
   - Attempts to upsert to `customer_profiles` table
   - Table exists in schema but not used in main flow
   - Customer data derived from orders instead
   - Status: PARTIAL - table exists but sync logic not tested

3. **Storefront → About/Delivery/Policy Pages:**
   - Routes defined in routes.js
   - Files NOT FOUND in expected location
   - Status: BROKEN - 404 on navigation

4. **Admin → Insights Page:**
   - Page exists but data helpers not implemented
   - `calculateOrderStats` and `calculateDailyTrend` exist in statsHelper.js
   - Status: PARTIAL - page renders but may not show real data

5. **Admin → Password Protection for Destructive Operations:**
   - Setting exists in site_settings (`require_password_destructive`)
   - Not implemented in UI code
   - Status: NOT IMPLEMENTED

6. **Product Deletion → Storage Cleanup:**
   - ProductsPage deletes product from database
   - Does NOT delete image from storage
   - Status: WEAK - orphaned files in storage

7. **Career Application Deletion → Storage Cleanup:**
   - CareersPage deletes application from database
   - Does NOT delete resume from storage
   - Status: WEAK - orphaned files in storage

8. **Gallery Deletion → Storage Cleanup:**
   - GalleryPage deletes image from storage AND database
   - Status: WORKING (correct pattern)

9. **Admin Store → Collections:**
   - Tables exist (collections, collection_products)
   - No admin UI to manage them
   - Status: NOT IMPLEMENTED

10. **Admin Store → Site Content:**
    - Table exists (site_content)
    - No admin UI to manage it
    - Status: NOT IMPLEMENTED

11. **Request → Order Conversion:**
    - customer_requests has `converted_at` field
    - No UI to convert request to order
    - Status: NOT IMPLEMENTED

12. **Paystack Verification Polling:**
    - CheckoutModal polls paystack-verify up to 10 times
    - Falls back to tracking API check
    - No guaranteed verification if webhook fails
    - Status: WEAK - no retry mechanism after polling exhausts

13. **Delivery Type in paystack-init:**
    - Edge Function expects deliveryType parameter
    - CheckoutModal does NOT send deliveryType
    - CODE MISMATCH: delivery_fee defaults to 0
    - Status: BROKEN - delivery fees not charged

14. **Admin Idle Timer:**
    - 30-minute auto-logout implemented
    - Uses localStorage to track activity
    - Status: WORKING

15. **Admin Session Restoration:**
    - Uses Supabase auth session persistence
    - Checks staff_profiles on session restore
    - Status: WORKING

---

## Security and Cleanliness Findings

### Debug Code

**console.log found in:**
- `src/storefront/modals/CheckoutModal.jsx` (lines 67, 81) - wrapped in DEV check
- `src/storefront/api/trackingApi.js` (line 40) - error logging
- `src/dashboard/data/orders.js` (lines 18, 32, 127, 158, 282, 305, 338, 379, 403, 425) - warn/error logging
- `src/dashboard/data/products.js` (lines 16, 36, 73, 108, 128, 153) - error logging
- `src/dashboard/data/gallery.js` (lines 16, 43, 69, 92, 127) - error logging
- `src/dashboard/data/reviews.js` (lines 16, 36, 64, 85) - error logging
- `src/dashboard/data/careers.js` (lines 16, 43, 73, 91, 105, 111, 153) - error logging
- `src/dashboard/data/shopPos.js` (lines 43) - warn logging
- `src/dashboard/data/settings.js` (lines 16, 32, 63) - error logging
- `src/dashboard/data/notifications.js` (lines 18, 48, 67, 85, 108, 140) - error/warn logging
- `src/dashboard/data/customersAdapter.js` (line 38) - empty catch
- `src/dashboard/lib/ordersModel.js` (lines 56, 61, 65, 70, 74) - deprecated warnings
- `src/dashboard/lib/signinLog.js` (lines 26, 31, 44, 77, 90, 100, 126, 134) - error logging
- `src/admin/api/adminStore.js` (lines 114, 126, 169) - error/warn logging
- `src/admin/utils/staffAccess.js` - none
- `src/admin/components/AdminAccess.jsx` (line 158) - error logging
- `src/data/supabaseSync.js` (lines 25, 77) - error logging

**debugger found in:** None

**Status:** Most console.log statements are error/warn logging which is acceptable. Some DEV-only checks present.

### Dead Code

**Deprecated functions in ordersModel.js:**
- `getOrders()` - deprecated, returns empty array
- `saveOrders()` - deprecated, does nothing
- `logActivityEvent()` - deprecated, does nothing
- `getAttentionOrders()` - deprecated, returns empty array
- `getActiveStockAlerts()` - deprecated, returns empty array
- `RAW_SNAPSHOT_PRODUCTS` - empty array

**Status:** These are stubs for pages outside Phase 6A scope. Could be removed or implemented.

### Unused Files

**Potentially unused:**
- `src/components/ContentPages.jsx` - NOT FOUND in file listing but referenced in App.jsx imports (NOT ACTUALLY IMPORTED)
- `src/admin/api/adminStore.js` - Legacy localStorage cache, still used by storefront for products/gallery/settings sync
- `src/data/adminStore.js` - Re-exports adminStore, used by storefront
- `src/data/supabaseSync.js` - Used by adminStore sync, still active
- `src/data/products.js` - Hardcoded product list, used as fallback when Supabase not configured

**Status:** Most files are still in use through the dual localStorage/Supabase architecture.

### Commented-Out Code

**Significant blocks:**
- None found in main codebase

### Hardcoded Test Data

**Found in:**
- `src/data/products.js` - 7 hardcoded products (used as fallback)
- `src/admin/api/adminStore.js` - defaults object with sample products, gallery, settings
- `src/dashboard/pages/ShopPOSPage.jsx` - RAW_SNAPSHOT_PRODUCTS array (hardcoded fallback)
- `src/data/supabaseSync.js` - DEFAULT_PRODUCTS, DEFAULT_GALLERY, DEFAULT_PROMOTIONS (fallbacks)

**Status:** All are legitimate fallbacks for when Supabase is not configured. Acceptable.

### Secrets Exposure

**Client-side files checked:**
- `src/config/supabase.js` - Uses VITE_SUPABASE_PUBLISHABLE_KEY (anon key) - SAFE
- `src/config/payment.js` - Uses VITE_PAYSTACK_PUBLIC_KEY - SAFE
- `src/storefront/api/checkoutApi.js` - Uses VITE_SUPABASE_PUBLISHABLE_KEY in headers - SAFE
- Edge functions use Deno.env.get() for secrets - SAFE

**Status:** No secrets exposed. Only public keys used in client code.

### Unused Dependencies

**Not analyzed** - Would require checking if all npm packages are imported and used.

### Environment Variables

**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `VITE_PAYSTACK_PUBLIC_KEY` - Paystack public key
- `PAYSTACK_SECRET_KEY` - Edge Function secret (not in client)
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected by Supabase (not in client)
- `STOREFRONT_URL` - Optional, for callback URL validation

**Optional:**
- `VITE_SITE_URL` - Production origin for canonical URLs

**Status:** All required vars documented in .env.example

---

## NOT FOUND List

### Database Objects
- `signin_log` table - Referenced in `src/dashboard/lib/signinLog.js` but not in schema.sql

### Files
- `src/storefront/pages/AboutPage.jsx` - Referenced in routes.js but not found
- `src/storefront/pages/InformationPage.jsx` - Referenced in routes.js for /delivery and /policy but not found
- `src/components/ContentPages.jsx` - Referenced in some contexts but not in file listing

### Features
- Admin UI for managing collections (tables exist but no UI)
- Admin UI for managing site_content (table exists but no UI)
- Admin UI for converting requests to orders (field exists but no UI)
- Password confirmation for destructive admin operations (setting exists but not implemented)
- Delivery type selection in checkout UI (backend expects it but frontend doesn't send it)

### Code References
- Delivery fee calculation in checkout - frontend doesn't send deliveryType to paystack-init, so delivery_fee defaults to 0
- About, Delivery, and Policy pages - routes exist but no page components

---

## Summary

**Architecture:** React 19 + Vite storefront, Supabase backend (PostgreSQL + Auth + Storage + Edge Functions), React admin dashboard with HashRouter

**Pages:** 10 storefront pages (3 missing), 13 admin dashboard pages

**Database:** 18 tables, 3 RPC functions, 6 triggers, 3 storage buckets

**Security:** RLS policies with staff role verification, no secrets in client code, Paystack webhook signature verification

**Working Flows:** Product catalog, custom requests, career applications, order payment, order tracking, admin CRUD for orders/products/gallery/requests/careers/settings/customization

**Broken Links:** 3 missing pages, signin_log table missing, delivery fees not charged, some storage cleanup missing, several admin features not implemented

**Cleanliness:** Acceptable debug logging, no dead code blockers, legitimate fallback data, no secret exposure
