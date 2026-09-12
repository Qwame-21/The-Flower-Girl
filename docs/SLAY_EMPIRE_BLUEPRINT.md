# SLAY EMPIRE — ARCHITECTURAL BLUEPRINT & CLONING SPECIFICATION

> **Target Audience**: Autonomous AI coding agents and engineers tasked with recreating an identical, production-ready clone of the **Slay Empire** e-commerce platform with zero access to the original source code.

---

## 1. TECH STACK & INTEGRATIONS

### Core Framework & Tooling
| Layer | Technology | Exact Version | Configuration Details |
| :--- | :--- | :--- | :--- |
| **Runtime / Build Tool** | Vite | `^6.3.5` | React plugin `@vitejs/plugin-react` (`^4.5.2`), SPA routing fallback, dev proxy server with `/api/delete-image` Cloudinary signature destruction endpoint |
| **Frontend Framework** | React | `^19.1.0` | React DOM `^19.1.0`, StrictMode enabled |
| **Routing Strategy** | Custom React State + History API | N/A | `window.location.pathname` synchronized via `popstate` event listeners and custom `nav(page)` dispatcher (no React Router dependency required) |
| **Styling** | Vanilla CSS3 | N/A | Custom CSS design tokens, editorial serif typography, glassmorphism overlays, keyframe micro-animations (`index.css`) |
| **Authentication & Tokens** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` | `^9.0.3` / `^3.0.3` | Admin token verification, password hashing, 2-hour JWT expiry |
| **Hosting Platform** | Vercel Serverless / Cloudflare Pages | N/A | `vercel.json` rewrite routing `/api/*` to serverless handlers and all remaining paths to `index.html` |

---

### Supabase Architecture & Client Wrapper
The application uses a hybrid data access pattern:
1. **Public Client-Side REST Wrapper (`src/utils/supabase.js`)**:
   - Initialized using environment variables:
     - `VITE_SUPABASE_URL`: Supabase project URL (e.g. `https://<project-ref>.supabase.co`)
     - `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_KEY`: Supabase anon/publishable key (`sb_publishable_...`)
   - Uses native `fetch` directly against `${VITE_SUPABASE_URL}/rest/v1/${table}` to keep bundle size minimal.
   - For read-only operations (`products`, `slay_testimonials`), client sends `apikey: VITE_SUPABASE_ANON_KEY` with standard PostgREST queries.
   - For write/update mutations on orders and products, requests are routed through `/api/admin/*` and `/api/checkout/*` serverless endpoints to protect administrative operations.
2. **Polling Engine (`supa.poll`)**:
   - Lightweight `setTimeout`-based polling mechanism for live updates without persistent WebSocket overhead.
   - Configurable polling intervals: Products (3,000ms), Orders (3,000ms), Testimonials (8,000ms).
   - Polling is automatically throttled/paused during active admin edits via mutation guards (`mutatingRef`).

---

### Third-Party Services Integration

#### 1. Cloudinary (Media CDN & Image Optimization)
- **Upload Flow**:
  - Client-side pre-upload image compression via HTML5 Canvas (`compressImage` in `src/utils/helpers.js`): max width `1200px`, JPEG quality `0.82`.
  - Unsigned multipart upload to Cloudinary Upload API: `https://api.cloudinary.com/v1_1/${VITE_CLOUDINARY_CLOUD_NAME}/image/upload`.
  - Preset specified via `VITE_CLOUDINARY_PRESET` (folder: `slay_products`).
  - Auto-transformation injected into returned URL: `/upload/f_auto,q_auto,w_900/`.
- **Deletion Flow**:
  - Triggered on product deletion or image update.
  - Serverless endpoint `/api/delete-image` or local Vite middleware receives image URL, parses public ID, generates SHA1 signature using `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`, and sends destruction request to `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`.
- **Environment Variables**:
  - `VITE_CLOUDINARY_CLOUD_NAME` (Client)
  - `VITE_CLOUDINARY_PRESET` (Client)
  - `CLOUDINARY_API_KEY` (Server)
  - `CLOUDINARY_API_SECRET` (Server)

#### 2. Paystack (Payments & Verification)
- **Checkout Flow**:
  - Dynamically loads `https://js.paystack.co/v1/inline.js` via `loadPaystackScript()`.
  - Opens inline iframe modal with customer email, phone, name, GHS amount in pesewas (`amount * 100`), currency `"GHS"`, and generated reference `SLY-PAY-<UUID>`.
- **Verification Flow**:
  - Upon modal completion callback, client sends payment reference to backend `/api/checkout/verify`.
  - Backend queries `https://api.paystack.co/transaction/verify/${reference}` using `PAYSTACK_SECRET_KEY`, validates transaction amount matches authoritative order total in database, and sets `status_payment = true`.
- **Environment Variables**:
  - `VITE_PAYSTACK_PUBLIC_KEY` (Client)
  - `PAYSTACK_SECRET_KEY` (Server)

#### 3. WhatsApp Cloud API / Direct Messaging
- **Integration**: Customer order support and order dispatch notifications.
- **Environment Variables**:
  - `VITE_WHATSAPP_ACCESS_TOKEN` (Server/API)
  - `VITE_WHATSAPP_PHONE_NUMBER_ID` (Server/API)

#### 4. JWT & Server Admin Security
- `JWT_SECRET`: High-entropy 64-char secret used to sign and verify admin bearer tokens.
- `DEV_OVERRIDE_SECRET`: Optional emergency developer override password.
- `SUPABASE_SECRET_KEY` / `SUPABASE_URL`: Service role credentials used exclusively by serverless `/api/*` endpoints.

---

## 2. FOLDER & FILE STRUCTURE

```
/
├── api/                             # Serverless API routes (Node.js / Vercel Functions)
│   ├── admin/                       # Protected admin backend endpoints
│   │   ├── _auth.js                 # JWT verification, Supabase service-role client, IP rate limiting helpers
│   │   ├── change-password.js       # Admin password update with bcrypt hashing
│   │   ├── customers.js             # Customer analytics & directory management
│   │   ├── login.js                 # Admin login with rate limiting & JWT issuance
│   │   ├── orders.js                # Protected order mutations & deletions
│   │   ├── products.js              # Protected product CRUD mutations
│   │   └── testimonials.js          # Testimonials moderation
│   ├── checkout/                    # Public checkout endpoints
│   │   ├── _shared.js               # Authoritative price calculation, input sanitation, code generators
│   │   ├── create.js                # Authoritative order creation endpoint
│   │   └── verify.js                # Paystack transaction verification endpoint
│   ├── delete-image.js              # Cloudinary SHA1 signature image destruction handler
│   └── track-order.js               # Public order status query by ID or Purchase Code
├── public/                          # Static assets
│   ├── favicon.png                  # Store icon
│   ├── hero_new.jpg                 # Desktop hero background banner
│   └── logo.jpg                     # Store branding logo
├── src/                             # Main React application source
│   ├── components/                  # Reusable UI components
│   │   ├── ErrorBoundary.jsx        # Top-level React error catcher
│   │   ├── Fld.jsx                  # Standardized form input wrapper with labels
│   │   ├── Icons.jsx                # Inline SVG icon library & category glyphs
│   │   ├── ImageInput.jsx           # Canvas image compressor & Cloudinary upload widget
│   │   ├── OrderToast.jsx           # Floating new-order toast notification overlay
│   │   ├── ProductCard.jsx          # Interactive e-commerce product card with secondary image hover
│   │   └── ScrollFadeIn.jsx         # Viewport intersection animation wrapper
│   ├── config/                      # Store constants & seed data
│   │   ├── client.config.js         # Centralized store configuration (branding, colors, contact, FAQs)
│   │   └── defaultProducts.js       # Fallback mock/seed products when DB is offline
│   ├── hooks/                       # Custom React hooks
│   │   ├── useLocalStorage.js       # Resilient localStorage sync with state
│   │   ├── useOrderNotifications.js # Web Audio chime, browser notification & toast dispatch
│   │   ├── useOrders.js             # Orders state management, polling, status cascading
│   │   ├── useProducts.js           # Products state management, polling, optimistic updates
│   │   ├── useScrollReveal.js       # IntersectionObserver hook for reveal animations
│   │   └── useTestimonials.js       # Testimonials state & polling hook
│   ├── utils/                       # Utility helper functions
│   │   ├── helpers.js               # Formatters (GHS, ago, genCode), shape converters, filters
│   │   ├── paystack.js              # Paystack script loader & modal initializer
│   │   ├── productImages.js         # Image URL optimizer & preloader
│   │   └── supabase.js              # Supabase REST client & poller
│   ├── views/                       # Primary view modules
│   │   ├── AdminApp.jsx             # Comprehensive administration dashboard & tabs
│   │   └── StorefrontApp.jsx        # Public storefront (Home, Shop, About, Track, Modals, Drawer)
│   ├── App.jsx                      # App root, route dispatcher, stats aggregator, banner alerts
│   ├── index.css                    # Complete design system tokens, typography, layout rules
│   └── main.jsx                     # Vite DOM entry point
├── admin_policies.sql               # Production Row-Level Security hardening script
├── schema.sql                       # Core PostgreSQL database schema & table definitions
├── vercel.json                      # Vercel deployment rewrites configuration
└── vite.config.js                   # Vite bundler configuration & local API mocks
```

---

## 3. STOREFRONT PAGES & PUBLIC ROUTING

Routing is state-driven inside `App.jsx` and `StorefrontApp.jsx` based on `window.location.pathname` or internal `page` state (`home`, `shop`, `about`, `faq`, `privacy`, `terms`, `track`, `product`).

### 1. `HomePage` (`page === "home"`)
- **Purpose**: Brand landing experience featuring seasonal promotions, trust pillars, bestselling products, and customer testimonials.
- **Key Sections**:
  - **Dynamic Promo Hero**: Calculates maximum discount percentage across all active promotion products (`promo_active && promo_price`) and renders dynamic headline copy (`"Enjoy up to 25% off our beauty range"`).
  - **Trust Strip**: 4 value propositions (Authentic products, 24h delivery, Mobile Money / Card checkout, WhatsApp support).
  - **Bestsellers Grid**: Displays up to 4 top products marked `bestseller: true`.
  - **Trending Grid**: Displays up to 4 products marked `is_trending: true`.
  - **Social Proof / Testimonial Carousel**: Displays customer reviews with 5-star ratings.
  - **CTAs**: Instant navigation to `shop` catalog and external Google Maps directions link.

### 2. `ShopPage` (`page === "shop"`)
- **Purpose**: Full catalog browsing, category filtering, subcategory pills, and item selection.
- **State & Interaction**:
  - **Category Tabs**: Toggle between `skincare`, `wellness`, `bundles`.
  - **Subcategory Pills**: Dynamic pills generated per category (e.g. `Face`, `Body`, `Natural` for skincare; `Vitamins`, `Beauty Supps`, `Hair/Skin/Nails` for wellness).
  - **Search & Sort**: Real-time filtering by keyword and sorting by price/name.
  - **Stock Indicators**: Real-time stock status badge (`Out of Stock`, `Only 1 Left`, `Low Stock`).
  - **Card Hover**: Secondary image cross-fade on mouse enter, instant quantity stepper, and "Add to Bag" button.

### 3. `ProductDetailPage` / `ProductModal` (`page === "product"`)
- **Purpose**: Deep product inspection.
- **Features**: Dual image gallery switcher (primary vs. secondary image), brand name, discounted promo pricing breakdown, full notes/description, ingredient breakdown (`extra` column), live stock counter, and "Add to Bag" with animated fly-to-cart confirmation.

### 4. `CartDrawer` (Slide-in Drawer)
- **Purpose**: Slide-out cart inspector and guest checkout form.
- **Features**:
  - Item listing with quantity stepper and item removal.
  - Subtotal calculator formatted in Ghana Cedis (`GH₵`).
  - **Checkout Form Fields**: Full Name, Phone Number (validated), Email (optional), Street Address, Apartment/Suite, City, Delivery Notes.
  - **Payment Options**:
    1. **Mobile Money (MoMo)**: Displays store MoMo number (`024 751 3470`), allows customer to enter MoMo transaction reference.
    2. **Paystack**: Initializes Paystack inline modal for instant Mobile Money / Visa / Mastercard payments.
  - **Submission Logic**: Posts payload to `/api/checkout/create`, decrements client stock optimistically, clears cart, and redirects to confirmation banner.

### 5. `OrderTracking` (`page === "track"`)
- **Purpose**: Order self-service portal for customers.
- **Interaction**:
  - Input field accepts either **Order ID** (`SLY-...`) or **6-character Purchase Code** (`SLY-XXXXXX`).
  - Fetches order status and displays a visual 4-step progress stepper:
    1. `Payment Confirmed` (with completion timestamp)
    2. `Packaged & Quality Checked` (with timestamp)
    3. `Dispatched for Delivery` (with timestamp & estimated delivery notes)
    4. `Delivered` (with final fulfillment timestamp)
  - Displays ordered items list, delivery address, and direct WhatsApp help link.

### 6. Informational Pages
- **`AboutPage` (`page === "about"`)**: Brand background story, location details in Lapaz, Accra, and social media handles (TikTok, Instagram).
- **`FaqPage` (`page === "faq"`)**: Interactive accordions answering common questions regarding delivery timelines, returns, and payment methods.
- **`PrivacyPage` / `TermsPage`**: GDPR/local compliance statements on customer data handling and return policy.

---

## 4. ADMIN DASHBOARD (`/slay-staff-dashboard`)

Accessible via the `/slay-staff-dashboard` URL route. Protected by a dedicated authentication gateway.

```
+-----------------------------------------------------------------------------------+
|  HAJIA SLAY EMPIRE ADMIN     [CLOUD CONNECTED]        🔔 (3)       [LOGOUT]       |
+-----------------------------------------------------------------------------------+
|  [VIEW SELECTOR: Orders v]                    [+ Staff Cart]   [● Syncing...]    |
+-----------------------------------------------------------------------------------+
|  [TOTAL REVENUE: GH₵ 24,850]  [ACTIVE ORDERS: 8]   [PENDING PAYMENT: 2]           |
+-----------------------------------------------------------------------------------+
|  [ Active Orders Tab Content / Status Matrix / Search / Filter / Actions ]        |
+-----------------------------------------------------------------------------------+
```

### Authentication & Gating Logic
1. Admin enters master password on the login screen.
2. Request posts to `/api/admin/login` (enforces IP rate limiting: max 5 failed attempts per 15 minutes).
3. Server compares password against bcrypt hash in `site_settings` table (or developer override secret).
4. On success, server returns a signed JWT token (`expiresIn: '2h'`).
5. Client stores token in `localStorage.setItem('slay_admin_token', token)` and sets `slay_admin_session = true`.
6. Client monitors session duration (`slay_session_at`); automatically invalidates and logs out after 2 hours.

---

### Admin Navigation Tabs

| Tab View | Purpose | Data Read / Written | Key Features |
| :--- | :--- | :--- | :--- |
| **`orders`** | Active order processing | Reads active (unfulfilled) orders from `orders` table; updates status flags & timestamps | Single-click status toggles (`Paid`, `Packaged`, `Dispatched`, `Delivered`) with cascading validation; estimated delivery date inputs; admin notes; order deletion with password prompt. |
| **`log`** | Historical records archive | Reads all completed orders (all 4 flags = true) | Search by ID/Customer Name/Phone; 30-day filter toggle; **Export to CSV** generator. |
| **`products`** | Product catalog management | Reads/writes `products` table; deletes images on Cloudinary | Add new product modal; inline editing of price, promo price, stock, low stock threshold; image upload/replace via `ImageInput`; **Bulk Promo Manager** (apply % discount or custom price across categories). |
| **`reviews`** | Testimonial moderation | Reads/writes `slay_testimonials` table | Approve, edit, create new verified reviews, or delete inappropriate entries. |
| **`shop`** | Staff POS Mode | Reads `products`, creates orders via `/api/checkout/create` | Allows staff to take orders in-store or over the phone on behalf of customers using staff pricing/flags. |
| **`insights`** | Business analytics & metrics | Aggregates all orders and products | Confirmed revenue, pending revenue, month-over-month growth, repeat customer count, top 10 best-selling products by revenue, average order value (AOV), low-stock alert summary. |
| **`customers`** | Customer CRM directory | Reads `customers` table | Lists customer lifetime spend, total order count, phone, email, and last purchase date. |
| **`settings`** | Store configuration | Writes `site_settings`, local storage toggles | Change admin password; toggle simulated social proof notifications; clean up orphaned imageless products. |

---

### Status Cascading Rules (Deterministic Order Logic)
When an admin updates an order status in `useOrders.js`, the following cascade rules execute:
- **Ticking `Delivered`**: Automatically sets `Dispatched = true`, `Packaged = true`, `Payment = true` and records timestamps.
- **Ticking `Dispatched`**: Automatically sets `Packaged = true`, `Payment = true`.
- **Ticking `Packaged`**: Automatically sets `Payment = true` (staff has confirmed payment before packaging).
- **Unticking `Payment`**: Automatically clears `Packaged = false`, `Dispatched = false`, `Delivered = false`.
- **Unticking `Packaged`**: Automatically clears `Dispatched = false`, `Delivered = false`.
- **Unticking `Dispatched`**: Automatically clears `Delivered = false`.

---

## 5. SHARED UI COMPONENTS

### 1. `ProductCard.jsx`
- **Props**: `p` (product object), `index`, `activeCat`, `addToCart`, `cart`, `qty`, `setQty`, `onClick`.
- **Key Behaviors**:
  - Image container with skeleton shimmer loader while downloading.
  - Secondary image hover swap (smooth cross-fade and subtle scale zoom).
  - Floating badges: `Bestseller` (rose badge), `PROMO` + `-X%` (accent badge), `Out of Stock` (red badge), `Only 1 Left` (rose badge), `Low Stock` (amber badge).
  - Slide-up bottom detail panel revealing quantity selector (`-` / `+`) and "ADD TO BAG" button.

### 2. `OrderToast.jsx`
- **Props**: `toasts` (array of new order objects), `onDismiss`, `onViewOrders`.
- **Key Behaviors**:
  - Fixed top-right container (`z-index: 9999`).
  - Slide-in cubic bezier animation.
  - Glassmorphic translucent card displaying customer name, item count, total `GH₵`, and relative timestamp (`"2 mins ago"`).
  - 8-second auto-dismiss progress bar with manual close button.
  - "View Orders →" CTA that switches the dashboard view to `orders`.

### 3. `ImageInput.jsx` & `ImageInputCompact.jsx`
- **Props**: `value` (current URL), `onChange(newUrl)`.
- **Key Behaviors**:
  - Accepts direct image URL paste or native file selection.
  - Performs client-side canvas compression down to max width 1200px (0.82 quality) before network transmission.
  - Uploads to Cloudinary; falls back to local DataURL base64 if cloud credentials are missing.
  - Live thumbnail preview with remove button.

### 4. `Icons.jsx`
- Self-contained SVG icon library avoiding external icon package dependencies.
- Contains: `bag`, `check`, `truck`, `card`, `skincare`, `wellness`, `bundle`, `menu`, `search`, `arrow`, `trash`, `edit`, `star`, `close`.
- Includes specialized subcomponents:
  - `StarRating`: Renders 1 to 5 filled gold stars.
  - `CatIcon`: Renders unique category line art.
  - `TrustBullet`: Renders trust icons inside soft-toned circular badges.

### 5. `ScrollFadeIn.jsx`
- React component using `IntersectionObserver` to trigger smooth reveal transitions (`transform: translateY(0)`, `opacity: 1`) when elements scroll into the viewport.

### 6. `Fld.jsx`
- Standardized form field wrapper providing uppercase tracking labels, error text display, and consistent input styling.

---

## 6. DATABASE SCHEMA & SECURITY POLICIES

### PostgreSQL Table Definitions

```sql
-- 1. PRODUCTS TABLE
create table if not exists products (
  id text primary key,                     -- e.g. 'S01', 'W05', 'B02'
  name text not null,
  brand text default '',
  category text not null,                  -- 'skincare', 'wellness', 'bundles'
  subcategory text default 'other',        -- e.g. 'face wash', 'serum', 'vitamins'
  price numeric not null,
  original_price numeric not null,
  notes text default '',                   -- Description / notes
  extra text default '',                   -- Ingredients / usage details
  image text default '',                   -- Primary Cloudinary URL
  secondary_image text default '',         -- Hover Cloudinary URL
  bestseller boolean default false,
  is_trending boolean default false,
  gender text default 'women',             -- 'women', 'men', 'unisex'
  stock integer default 0,
  low_stock_threshold integer default 3,
  promo_active boolean default false,
  promo_price numeric,
  created_at timestamptz default now()
);

-- 2. ORDERS TABLE
create table if not exists orders (
  id text primary key,                     -- e.g. 'SLY-1724420000000-ABCDEF'
  purchase_code text,                      -- 6-char tracking code e.g. 'SLY-K8M2P9'
  timestamp_ms bigint not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_country text default 'Ghana',
  street_address text not null,
  apartment text,
  city text not null,
  postal_code text,
  customer_notes text,
  items jsonb not null,                    -- Array of [{ id, name, price, qty, image, ... }]
  total numeric not null,
  staff_order boolean default false,
  payment_method text default 'momo',      -- 'momo' or 'paystack'
  momo_ref text,
  paystack_ref text,
  status_payment boolean default false,
  status_packaged boolean default false,
  status_dispatched boolean default false,
  status_delivered boolean default false,
  status_payment_at bigint,
  status_packaged_at bigint,
  status_dispatched_at bigint,
  status_delivered_at bigint,
  admin_note text,
  estimated_delivery text,
  created_at timestamptz default now()
);

-- 3. CUSTOMERS TABLE
create table if not exists customers (
  id bigint generated always as identity primary key,
  phone text unique not null,
  name text,
  email text,
  total_orders integer default 0,
  total_spent numeric default 0,
  last_order_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 4. TESTIMONIALS TABLE
create table if not exists slay_testimonials (
  id bigint generated always as identity primary key,
  name text not null,
  handle text default 'verified_customer',
  review text not null,
  rating integer default 5,
  created_at timestamptz default now()
);

-- 5. SITE SETTINGS (Admin Password)
create table if not exists site_settings (
  id text primary key default 'global',
  admin_password_hash text not null,       -- bcrypt hash of admin password
  updated_at timestamptz default now()
);

-- 6. RATE LIMITS
create table if not exists rate_limits (
  ip text primary key,
  attempts integer default 0,
  last_attempt timestamptz default now(),
  locked_until timestamptz
);
```

---

### Row Level Security (RLS) Policies
- **`products`**: Public read-only (`SELECT using (true)`). Insert/Update/Delete disallowed for `anon` role (must pass through `/api/admin/products` with service role key).
- **`slay_testimonials`**: Public read and insert (`SELECT using (true)`, `INSERT with check (true)`). Update/Delete requires admin service role.
- **`orders`**: No direct public access. Created exclusively by `/api/checkout/create`; queried by tracking endpoint `/api/track-order`; updated/deleted by `/api/admin/orders`.
- **`customers`**: No direct public access. Managed server-side during checkout.
- **`site_settings` & `rate_limits`**: Default-deny for `anon` role. Accessed strictly via backend `/api/admin/login`.

---

## 7. DESIGN SYSTEM & VISUAL SPECIFICATION

The site implements a **Luxury Editorial Beauty** aesthetic, combining classic high-fashion serif typography with warm rose/pink accents and clean minimalist white spaces.

```
       #e8a0b4                #fce8ee                #111111                #ffffff
  [ Primary Accent ]     [ Accent Tint / Pill ]   [ Dark Text / Body ]    [ Clean Canvas ]
```

### 1. Color Palette

| Token Name | HEX Value | Role & Usage |
| :--- | :--- | :--- |
| **`accent`** | `#e8a0b4` | **Primary Brand Color (Rose/Pink)**: CTA buttons, active tabs, promo highlights, logo accent, badges. |
| **`accentLight`** | `#f5c7d4` | Lighter rose tint: Hover states, soft gradient stops. |
| **`accentDark`** | `#d47a92` | Dark rose tone: Active button clicks, progress bar gradients. |
| **`accentTint`** | `#fce8ee` / `#fce9ed` | Soft pastel background: Promo banner background, pill hover, active dropdown items. |
| **`bgDark`** | `#111111` | Primary dark background / high contrast footer / text on light mode. |
| **`bgDarkLighter`**| `#1a1a1a` | Dark mode surface background. |
| **`surface`** | `#ffffff` | Primary card background, header background, modal sheets. |
| **`surfaceMuted`** | `#fafafa` / `#f5f4f2` | Card image placeholder background, subtle panel fills. |
| **`textPrimary`** | `#111111` | Primary headings, product titles, bold interface text. |
| **`textSecondary`**| `#333333` | Body copy, product descriptions, modal text. |
| **`textMuted`** | `#666666` / `#888888` | Labels, navigation links, secondary metadata. |
| **`border`** | `#e8e8e8` / `#dddddd` | Card borders, dividers, form input borders. |
| **`statusSuccess`**| `#10b981` / `#22c55e` | Cloud connected pill, payment confirmed indicator. |
| **`statusWarning`**| `#f59e0b` | Low stock alert indicator. |
| **`statusError`** | `#ef4444` | Out of stock badge, login failure message. |

---

### 2. Typography System
Loaded from Google Fonts:
- **Headings & Brand Title**: `'Cormorant Garamond', 'Georgia', serif`
  - Hero Display: `clamp(40px, 7vw, 72px)`, weight `300` or `400`, letter-spacing `-.02em`.
  - Section Headings: `28px` to `36px`, weight `400`, editorial italic accents (`em { font-style: italic; color: #e8a0b4; }`).
  - Product Titles: `16px` to `18px`, weight `500`.
- **Interface, UI, Buttons & Labels**: `'Raleway', sans-serif`
  - Navigation Links: `11px`, weight `500`, letter-spacing `.2em`, uppercase.
  - Section Labels: `10px`, weight `600`, letter-spacing `.25em`, uppercase, accent color.
  - Buttons (`.rose-btn`, `.ghost-btn`): `10px`, weight `500` or `600`, letter-spacing `.2em`, uppercase.
  - Body Text: `14px`, weight `400`, line-height `1.9`.
  - Input Fields: `14px` (`16px` on mobile to prevent iOS auto-zoom).

---

### 3. Layout Conventions, Breakpoints & Animation Patterns
- **Max Container Width**: `1280px` centered with responsive horizontal padding (`16px` mobile, `24px` desktop).
- **Breakpoints**:
  - `Mobile Small`: `< 480px` (Cart drawer expands to 100vw, cards adjust to 340px height).
  - `Tablet / Mobile Nav`: `< 768px` (Desktop navigation collapses to hamburger menu).
  - `Desktop`: `> 1024px` (Full navigation bar, grid layouts with 3–4 columns).
- **Component Patterns**:
  - **Buttons (`.rose-btn`)**: Flat solid rose background (`#e8a0b4`), black text, uppercase, transitions to black background with white text on hover.
  - **Inputs / Textareas**: Border radius `0px` or `3px`, 1px solid `#e8e8e8`, focus border `#e8a0b4`.
  - **Animations**:
    - `fadeIn`: `0.65s cubic-bezier(0.16, 1, 0.3, 1)` slide-up.
    - `wobble`: Subtle rotation animation on category pill click.
    - `productShimmer`: Skeleton loading sweep across empty image placeholders.
    - `bell-ring`: Keyframe swing for admin notifications bell.

---

## 8. KEY FLOWS & LOGICAL WORKFLOWS

### Flow 1: Guest Checkout & Order Tracking

```
[ Customer Browses Store ]
           │
           ▼
[ Adds Products to Cart ] ──► (Cart stored in localStorage: 'slay_cart')
           │
           ▼
[ Opens Cart Drawer & Fills Delivery Info ]
           │
           ▼
  Selects Payment Method?
  ├───► Mobile Money (MoMo)
  │         │
  │         ├── Customer views MoMo merchant number (024 751 3470)
  │         └── Inputs MoMo Transaction ID
  │
  └───► Paystack Online Payment
            │
            ├── System opens PaystackPop inline iframe
            └── Customer completes payment (Card / MoMo)
           │
           ▼
[ POST /api/checkout/create ]
           │
           ├── Server recalculates cart total against database (authoritative price check)
           ├── Generates unique Order ID ('SLY-<timestamp>-<HEX>')
           ├── Generates 6-char tracking code ('SLY-XXXXXX')
           ├── Inserts order record into Supabase 'orders' table
           └── Upserts/updates customer profile in 'customers' table
           │
           ▼
[ Order Confirmed Banner Displayed ] ──► (Displays Order ID + Tracking Code + Copy button)
           │
           ▼
[ Customer Opens Order Tracking ('/track') ]
           │
           ├── Enters Order ID or Purchase Code
           └── Views live 4-step progress timeline: Paid ➔ Packaged ➔ Dispatched ➔ Delivered
```

---

### Flow 2: Real-Time Admin Order Notification & Fulfillment

```
[ New Order Created in Supabase ]
           │
           ▼
[ AdminApp Polling Loop triggers (every 3000ms) ]
           │
           ├── useOrders hook detects new order ID not in knownIdsRef
           │
           ├── 1. Soft 2-tone Audio Chime plays (Web Audio API: 880Hz -> 1046.5Hz)
           ├── 2. Desktop Notification fires (if browser tab is in background)
           ├── 3. Animated Toast card slides in top-right (OrderToast)
           └── 4. Notification Bell badge increments
           │
           ▼
[ Admin Clicks Order / Opens 'Orders' Tab ]
           │
           ├── Status Toggle: Clicks "Packaged"
           │       └── Automatically marks "Payment" = true + sets status_packaged_at
           │
           ├── Inputs Delivery Estimate (e.g. "Tomorrow by 2:00 PM via Rider")
           │       └── Saves admin_note & estimated_delivery to database
           │
           ├── Status Toggle: Clicks "Dispatched" ➔ "Delivered"
           │
           ▼
[ Order Completed: Automatically moved from Active Orders to Master Log Archive ]
```

---

### Flow 3: Product Lifecycle & Cloudinary Deletion

```
[ Admin Creates New Product ]
           │
           ├── Selects image from device
           ├── ImageInput compresses file on client canvas (max width 1200px, 0.82 quality)
           ├── Uploads directly to Cloudinary upload preset ('slay_products')
           └── Saves product record to Supabase via POST /api/admin/products
           │
           ▼
[ Admin Updates Image or Deletes Product ]
           │
           ├── Admin deletes product or replaces existing image
           ├── Frontend triggers deleteCloudinaryImage(oldImageUrl)
           └── Backend /api/delete-image calculates SHA1 signature and calls Cloudinary destruction API
```

---

## 9. CONFIGURATION DICTIONARY (`src/config/client.config.js`)

To replicate or rebrand the site, modify the centralized configuration object:

```javascript
export const config = {
  storeName: "Hajia Slay Empire",
  storeSlug: "slay-empire",
  emailDomain: "slayempire.shop",
  phone: "053 795 9673",
  momoNumber: "024 751 3470",
  whatsapp: "https://wa.me/233537959673",
  tiktok: "https://www.tiktok.com/discover/hajia-slay-empire",
  instagram: "https://www.instagram.com/hajia_slay_empire_",
  location: "Lapaz, Accra",
  mapsUrl: "https://maps.app.goo.gl/H5dvywtX3wZ17Key8",
  heroBg: "/hero_new.jpg",
  logo: "/logo.jpg",
  
  colors: {
    accent: "#e8a0b4",
    accentLight: "#f5c7d4",
    accentDark: "#d47a92",
    bgDark: "#111111",
    textOnDark: "#ffffff",
    textOnLight: "#333333",
    textMuted: "#666666",
    surface: "#ffffff",
    border: "#e5e5e5"
  },

  storageKeys: {
    orders: "slay_orders",
    adminSession: "slay_admin_session",
    products: "slay_products",
    cart: "slay_cart",
    testimonials: "slay_testimonials",
    sessionAt: "slay_session_at"
  },

  polling: {
    products: 3000,
    orders: 3000,
    testimonials: 8000
  },

  categories: {
    skincare: { label: "Skincare", icon: "skincare" },
    wellness: { label: "Wellness", icon: "wellness" },
    bundles: { label: "Bundles", icon: "bundle" }
  }
};
```

---
*End of Blueprint — Slay Empire Architecture Specification.*
