# Complete Admin and Storefront UI Specification

This is a portable UI/UX blueprint of the implemented application. It documents literal source values and explicitly distinguishes requested page names from pages that do not exist.

## 0. Implemented information architecture

### Admin

The admin is one centered, dropdown-navigated workspace. It has no sidebar and no URL-per-tab routing.

Exact tab order:

```js
[
  ["orders", "Orders"],
  ["log", "Log"],
  ["reviews", "Reviews"],
  ["products", "Products"],
  ["shop", "Shop"],
  ["insights", "Insights"],
  ["customers", "Customers"],
  ["settings", "Settings"]
]
```

Requested-name mapping:

| Requested page | Actual implementation |
|---|---|
| Overview/Dashboard | No separate Overview tab. The Orders tab begins with three overview KPI cards. |
| Orders | Implemented as `orders`. |
| Products | Implemented as `products`. |
| Bookings | Not present anywhere in the project. |
| Consultations | Not present anywhere in the project. |
| Settings | Implemented as `settings`. |
| Reviews | Implemented as `reviews`; component name is `AdminTestimonialsView`. |
| Clients | No `Clients` page. Equivalent customer rollup is labeled `Customers`. |
| Staff | No standalone Staff page. Staff-only ordering is provided by the admin Shop tab and `Staff Cart`. |
| Insights | Implemented as `insights`. |
| Point of Sale | No page with this name. The admin Shop tab plus Staff Cart is the POS-equivalent workflow. |

### Public storefront

Top navigation exposes `Home`, `Shop`, `About`, and `Track Order`. Mobile navigation additionally exposes `Privacy`. Internal page state also supports `FAQ`, `Terms`, `Product`, and the Cart drawer. Search is a full-screen overlay.

## 1. File map

### Application shell

| Path | Responsibility |
|---|---|
| `src/main.jsx` | Imports `src/index.css`; mounts `<App />` into `#root`. |
| `src/App.jsx` | Selects admin versus storefront route, supplies collections/statistics, and wires new-order notifications. |
| `src/index.css` | Global reset, font import, controls, responsive layouts, storefront cards/search/modal/drawer, admin classes, and animations. |
| `src/config/client.config.js` | Store identity, navigation content, contact data, colors, storage keys, and polling intervals. |

### Admin

| Path | Components/role |
|---|---|
| `src/views/AdminApp.jsx` | `AdminApp`, `AdminOrdersView`, `OrdersList`, `OrderCard`, `AdminTestimonialsView`, `BulkUpdatePanel`, `AdminProductsView`, `InsightsView`, `AdminCustomers`, `AdminSettingsView`, `DeleteOrderConfirmationModal`, `BulkDeleteConfirmationModal`. |
| `src/components/OrderToast.jsx` | `OrderToast`, private `OrderToastCard`. |
| `src/components/ImageInput.jsx` | `ImageInput`, `ImageInputCompact`. |
| `src/components/Fld.jsx` | Shared field wrapper. |
| `src/components/Icons.jsx` | Custom SVG `Icon`, `StarRating`. |
| `src/components/ErrorBoundary.jsx` | Reviews/products visual fallback. |
| `src/hooks/useOrders.js` | Polling and new-ID detection that drives notifications. |
| `src/hooks/useOrderNotifications.js` | Toast/bell/native-notification/audio state. |
| `src/hooks/useProducts.js` | Product state consumed by admin UI. |
| `src/hooks/useTestimonials.js` | Review state consumed by admin UI. |
| `src/utils/helpers.js` | Formatting, category options, Cloudinary upload/compression, image deletion helper. |
| `src/utils/supabase.js` | Poll client invoked by hooks. |

### Storefront

| Path | Components/role |
|---|---|
| `src/views/StorefrontApp.jsx` | `StorefrontApp`, `HomePage`, `ShopPage`, `CartDrawer`, `SearchOverlay`, `ProductModal`, `ProductDetailPage`, `SocialProof`, `TestimonialSection`, `OrderStepper`, `OrderTracking`, `AboutPage`, `FaqPage`, `PrivacyPage`, `TermsPage`, `SiteFooter`. |
| `src/components/ProductCard.jsx` | Product tile, image hover swap, quantities, badges, price, CTA. |
| `src/components/Icons.jsx` | `Icon`, `CatIcon`, `TrustBullet`, `StarRating`, `TypewriterTitle`. |
| `src/components/ScrollFadeIn.jsx` | Intersection-based section reveal wrapper. |
| `src/hooks/useScrollReveal.js` | Reveal refs used by Home. |
| `src/components/Fld.jsx` | Checkout/tracking form field wrapper. |
| `src/utils/paystack.js` | Checkout UI integration. |
| `src/utils/helpers.js` | `GHS`, category pills/filtering, category colors/backgrounds, relative time. |
| `src/config/defaultProducts.js` | Default display-ready product content. |
| `public/logo.jpg` | Header logo. |
| `public/hero_new.jpg` | Desktop hero background. |
| `public/wellness_new.jpg` | Storefront imagery. |
| `public/favicon.png` | Browser/native-notification icon. |

### Page-by-page dependency map

The application is intentionally concentrated into two large view files; the entries below are the complete implementation dependency set for each requested surface, including shared data hooks and server endpoints where the page invokes them. Files not named in a row do not participate in that page.

| Surface | View/component implementation | Shared UI/style/config | State, transformation, and persistence |
|---|---|---|---|
| Admin login and authenticated shell/navigation | `src/views/AdminApp.jsx` (`AdminApp`) | `src/index.css`; `src/components/Icons.jsx`; `src/components/OrderToast.jsx`; `src/config/client.config.js` | `src/hooks/useLocalStorage.js`; `src/utils/supabase.js`; `src/utils/helpers.js`; `api/admin/login.js`; `api/admin/_auth.js` |
| Overview/Dashboard and Orders | `src/views/AdminApp.jsx` (`AdminApp`, `AdminOrdersView`, `OrdersList`, `OrderCard`, `DeleteOrderConfirmationModal`, `BulkDeleteConfirmationModal`) | `src/index.css`; `src/components/Icons.jsx`; `src/components/OrderToast.jsx`; `src/config/client.config.js` | `src/App.jsx` (KPI/stat derivation); `src/hooks/useOrders.js`; `src/hooks/useOrderNotifications.js`; `src/hooks/useLocalStorage.js`; `src/utils/helpers.js`; `src/utils/supabase.js`; `api/admin/orders.js`; `api/admin/_auth.js` |
| Business-wide Log | `src/views/AdminApp.jsx` (`AdminApp`, `OrdersList`, `OrderCard`, both delete confirmation modals) | `src/index.css`; `src/components/Icons.jsx`; `src/config/client.config.js` | `src/hooks/useOrders.js`; `src/utils/helpers.js`; `src/utils/supabase.js`; `api/admin/orders.js`; `api/admin/_auth.js`; CSV creation/download is browser-native inside `AdminApp` |
| Reviews | `src/views/AdminApp.jsx` (`AdminTestimonialsView`) | `src/index.css`; `src/components/Fld.jsx`; `src/components/Icons.jsx` (`StarRating`); `src/components/ErrorBoundary.jsx` | `src/hooks/useTestimonials.js`; `src/hooks/useLocalStorage.js`; `src/utils/supabase.js`; `src/config/client.config.js`; `api/admin/testimonials.js`; `api/admin/_auth.js` |
| Products | `src/views/AdminApp.jsx` (`AdminProductsView`, `BulkUpdatePanel`) | `src/index.css`; `src/components/Fld.jsx`; `src/components/ImageInput.jsx` (`ImageInput`, `ImageInputCompact`); `src/components/Icons.jsx`; `src/components/ErrorBoundary.jsx` | `src/hooks/useProducts.js`; `src/hooks/useLocalStorage.js`; `src/utils/helpers.js`; `src/utils/productImages.js`; `src/utils/supabase.js`; `src/config/defaultProducts.js`; `src/config/client.config.js`; `api/admin/products.js`; `api/admin/_auth.js`; `api/delete-image.js` and `functions/api/delete-image.js` are the two deployment-layout copies of the image-deletion endpoint |
| Admin Shop / Point of Sale / staff-order workflow | `src/views/AdminApp.jsx` (`AdminApp` wrapper/cart state); `src/views/StorefrontApp.jsx` (`ShopPage`, `ProductModal`, `CartDrawer`) | `src/index.css`; `src/components/ProductCard.jsx`; `src/components/Fld.jsx`; `src/components/Icons.jsx`; `src/config/client.config.js` | `src/hooks/useOrders.js`; `src/utils/helpers.js`; `src/utils/paystack.js`; `src/utils/supabase.js`; `api/checkout/create.js`; `api/checkout/verify.js`; `api/checkout/_shared.js`; `api/admin/orders.js` |
| Insights | `src/views/AdminApp.jsx` (`InsightsView`) | `src/index.css`; `src/components/Icons.jsx` | `src/App.jsx` (all KPI, ranking, customer, stock, and fulfillment calculations); `src/utils/helpers.js`; data originates from `src/hooks/useOrders.js` and `src/hooks/useProducts.js` |
| Customers/Clients | `src/views/AdminApp.jsx` (`AdminCustomers`) | `src/index.css` | `src/App.jsx` (passes active plus completed orders); `src/hooks/useOrders.js`; `src/utils/helpers.js` (`GHS`, `ago`); `src/utils/supabase.js`; `api/admin/orders.js`; `api/admin/customers.js` exists for customer persistence/clearing but the visible rollup is derived from orders rather than fetched customer rows |
| Settings | `src/views/AdminApp.jsx` (`AdminSettingsView`) | `src/index.css`; `src/components/Fld.jsx`; `src/config/client.config.js` | `src/hooks/useLocalStorage.js`; `src/hooks/useProducts.js`; `src/utils/helpers.js`; `src/utils/supabase.js`; `api/admin/change-password.js`; `api/admin/products.js`; `api/admin/orders.js`; `api/admin/customers.js`; `api/admin/_auth.js` |
| Public storefront shell/Home | `src/views/StorefrontApp.jsx` (`StorefrontApp`, `HomePage`, `SocialProof`, `TestimonialSection`, `SiteFooter`) | `src/index.css`; `src/components/ProductCard.jsx`; `src/components/ScrollFadeIn.jsx`; `src/components/Icons.jsx`; `public/logo.jpg`; `public/hero_new.jpg`; `public/wellness_new.jpg`; `public/favicon.png`; `src/config/client.config.js` | `src/App.jsx`; `src/hooks/useScrollReveal.js`; `src/hooks/useProducts.js`; `src/hooks/useOrders.js`; `src/hooks/useTestimonials.js`; `src/hooks/useLocalStorage.js`; `src/utils/helpers.js`; `src/utils/supabase.js`; `src/config/defaultProducts.js` |
| Public Shop and product views | `src/views/StorefrontApp.jsx` (`ShopPage`, `ProductModal`, `ProductDetailPage`, `SearchOverlay`) | `src/index.css`; `src/components/ProductCard.jsx`; `src/components/Icons.jsx`; `src/config/client.config.js` | `src/App.jsx`; `src/hooks/useProducts.js`; `src/hooks/useLocalStorage.js`; `src/utils/helpers.js`; `src/utils/productImages.js`; `src/utils/supabase.js`; `src/config/defaultProducts.js` |
| Cart/checkout and order tracking | `src/views/StorefrontApp.jsx` (`CartDrawer`, `OrderStepper`, `OrderTracking`) | `src/index.css`; `src/components/Fld.jsx`; `src/components/Icons.jsx`; `src/config/client.config.js` | `src/App.jsx`; `src/hooks/useOrders.js`; `src/hooks/useLocalStorage.js`; `src/utils/helpers.js`; `src/utils/paystack.js`; `src/utils/supabase.js`; `api/checkout/create.js`; `api/checkout/verify.js`; `api/checkout/_shared.js`; `api/track-order.js` |
| About, FAQ, Privacy, Terms | `src/views/StorefrontApp.jsx` (`AboutPage`, `FaqPage`, `PrivacyPage`, `TermsPage`, `SiteFooter`) | `src/index.css`; `src/components/Icons.jsx`; `src/config/client.config.js` | No page-specific persistence or endpoint |
| Application entry/routing shared by all surfaces | `index.html`; `src/main.jsx`; `src/App.jsx` | `src/index.css`; `src/components/ErrorBoundary.jsx`; `vite.config.js`; `vercel.json` | Route selection is pathname-driven in `App`; storefront subpages are local React state in `StorefrontApp`; admin tabs are local React state in `AdminApp` |

There are no Bookings, Consultations, standalone Staff, standalone Point of Sale, or standalone Overview component files/routes. Those absences are implementation facts, not omitted documentation.

## 2. Typography

### Font source

There is no local `@font-face`. Fonts are imported from Google Fonts:

```css
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Raleway:wght@300;400;500;600&display=swap");
```

Families and loaded weights:

- `"Cormorant Garamond", serif`: `300`, `400`, `500`, `600`; italic `300`, `400`.
- `"Raleway", sans-serif`: `300`, `400`, `500`, `600`.

Global rules:

```css
body { font-family: "Cormorant Garamond", serif; font-weight: 400; }
h1, h2 { font-weight: 400 !important; }
h3, h4, h5, h6 { font-weight: 500; }
button, [role="button"], label, select { font-weight: 500; }
input, textarea { font-weight: 400; }
```

Unspecified `line-height` is browser `normal`; this is intentional. The table below only states a line-height where source defines one.

### Exhaustive shared/admin text roles

| Role | Family | Size | Weight | Line height | Letter spacing |
|---|---|---:|---:|---:|---:|
| Admin title | Cormorant | `26px` | `300` | normal | `.2em` |
| Login title | Cormorant | `28px` | `300` | normal | `.18em` |
| Main KPI | Cormorant | `24px` | `400` inherited | normal | normal |
| Insight primary KPI | Cormorant | `28px` | inherited | normal | normal |
| Insight secondary KPI | Cormorant | `22px` | inherited | normal | normal |
| Order/customer name | Cormorant | `17px` or `18px` | `400` | normal | normal |
| Table row name | Cormorant | `14px` | inherited | normal | normal |
| Admin section eyebrow | Raleway | `10px` | inherited `500` where label; otherwise normal | normal | `.18em`–`.2em` literal per section |
| Table header | Raleway | `9px` | inherited | normal | `.15em` |
| Table metadata | Raleway | `9px`–`12px` | normal/bold when declared | normal | normal to `.15em` |
| Tag/badge | Raleway | `9px` | inherited | normal | `.15em` |
| Button base | Raleway | `10px` | `500` | normal | `.2em` |
| Small action | Raleway | `9px` | varies | normal | `.1em`–`.15em` |
| Label | Raleway | `10px` | `500` | normal | `.15em` |
| Input | Raleway | `14px`; `16px` at `≤768px` | `400` | normal | normal |
| Select | Raleway | `14px`; `16px` at `≤768px` | `500` | normal | normal |
| Textarea | Raleway | `14px`; `16px` at `≤768px` | `400` | normal | normal |
| Placeholder | inherits field | same as field | same as field | same as field | same; color `#999999` |
| Metadata/timestamp | Raleway | `8px`–`12px` | usually `400` | normal | `0`–`.12em` |
| Toast customer | Cormorant | `17px` | `600` | normal | normal |
| Toast title | Raleway | `10px` | `700` | normal | `.12em` |
| Toast timestamp | Raleway | `9px` | normal | normal | normal |

### Storefront text roles

| Role | Family | Size | Weight | Line height | Letter spacing |
|---|---|---:|---:|---:|---:|
| Hero title | Cormorant | `clamp(40px,7vw,72px)` | `300` | `1.05` | `-.02em` |
| Standard page/section title | Cormorant | `clamp(28px,5vw,48px)` | `300` or explicit `400` in Shop | normal | normal |
| Product-detail title | Cormorant | `32px` page / `28px` modal | `300` | `1.2` | normal |
| Legal/tracking large title | Cormorant | `clamp(28px,6vw,64px)` | `300` | normal | normal |
| Section label | Raleway | `10px` | `500` | normal | `.3em` |
| Desktop nav | Raleway | `11px` | `500` | normal | `.2em` |
| Mobile nav | Raleway | `14px` | `500` | normal | `.2em` inherited |
| Promo banner | Raleway | `10px` | `500` | normal | `.2em` |
| Body/description | Raleway | usually `12px`–`14px` | `400` | `1.8`, `1.9`, or `2` where declared | normal |
| Shop intro | Raleway | `13px` | `400` | normal | normal |
| Product brand | Raleway | `10px` | `600` | normal | `.25em` |
| Product title | Cormorant | `16px`; `14px` at `≤540px` | `500` | `1.25` | normal |
| Product old price | Cormorant | `13px` | inherited | normal | normal |
| Product price | Cormorant | `17px` | `500` | normal | normal |
| Product ID | Raleway | `9px` | inherited | normal | `.2em` |
| Card tag | Raleway | `9px` | inherited | normal | `.15em` |
| Quantity value | Raleway | `13px` | inherited | normal | normal |
| Category tab | Raleway | `10px` | `500` | normal | `.15em` |
| Subfilter pill | Raleway | `9px` | inherited | normal | `.15em` |
| Search field | Cormorant | `clamp(22px,5vw,32px)` | `400` | normal | `-.01em` |
| Search column title | Raleway | `10px` | `700` | normal | `.15em` |
| Modal brand | Raleway | `11px` | inherited | normal | `.3em` |
| Modal description | Raleway | `13px` | inherited | `1.9` | normal |
| Footer brand | Cormorant | `22px` | `300` | normal | `.2em` |
| Footer heading | Raleway | `10px` | inherited | normal | `.2em` |
| Footer link | Cormorant | `13px` | inherited | normal | normal |
| Order step label | Raleway | `10px`; `8px` at `≤500px` | `600`; active `700` | `1.3` | `.05em`; `.02em` mobile |
| Step timestamp | Raleway | `8px`; `7.5px` mobile | normal | normal | `.02em` |

Textarea uses the same exact base as inputs: white, `1px solid #e8e8e8`, `padding:11px 14px`, Raleway `14px`, weight `400`, normal line-height and letter-spacing, width `100%`, minimum height `44px`, radius `0`; it becomes `16px` at `≤768px`. The three visible textarea roles are:

| Textarea | Additional geometry | Placeholder |
|---|---|---|
| Product `Key Ingredients / Benefits` | `height:100px; resize:vertical` | `e.g. Vitamin C · Niacinamide · SPF 30 (Use Enter to add spacing and structure key headings and points)` |
| Review `Review Text` | `height:80px`; browser default `resize` behavior remains | `What did they say about their glow?` |
| Cart/checkout `Order Notes (opt.)` | `rows=2; min-height:80px; resize:vertical` | `Special instructions…` |

All textarea placeholders inherit the field typography and use global placeholder color `#999999`; none has a textarea-only font override. The application root also declares the practical serif fallback chain `'Cormorant Garamond','Georgia',serif`; explicit sans-serif roles use `'Raleway',sans-serif`.

## 3. Global design tokens

### Colors

| Literal | Primary use |
|---|---|
| `#ffffff`, `#fff` | Page, cards, inputs, light text. |
| `#fafafa` | Soft panels, toolbars, empty states. |
| `#fdf6f8` | Empty image-upload tile. |
| `#fce8ee`, `#fce9ed` | Rose tint, selected/hover surfaces; `#fce9ed` is the Home hero CTA-area tint. |
| `#f5f5f5`, `#f5f4f2` | Neutral tags, product image canvas. |
| `#f3f4f6`, `#f0f0f0`, `#eeeeee`, `#e8e8e8`, `#e5e7eb`, `#e5e5e5` | Cool/light dividers, skeletons, standard borders, configured border token. |
| `#dddddd`, `#d1d5db` | Ghost/checkbox borders and tracking-step connector. |
| `#cccccc`, `#b8b8b8`, `#9ca3af`, `#999999`, `#888888`, `#6b7280`, `#666666` | Scrollbar, disabled, placeholder, secondary, and tracking-step muted colors. |
| `#555555`, `#444444`, `#333333`, `#222222`, `#1a1a1a`, `#111111`, `#000000` | Progressively darker metadata/body ink, dark panels, status backgrounds, and black. |
| `#e8a0b4` | Primary accent. |
| `#f5c7d4` | Configured light accent. |
| `#d47a92`, `#c06080` | Dark rose gradients/receipt. |
| `#22c55e` | Connected and verified. |
| `#10b981` | Configured success token. |
| `#ef4444` | Destructive/duplicate/out-of-stock. |
| `#eab308`, `#f59e0b` | Stock warning/configured warning. |
| `#25D366` | WhatsApp. |
All short forms in source are exact equivalents of the six-digit values above (`#111`, `#222`, `#555`, `#666`, `#888`, `#999`, `#bbb`, `#ccc`, `#ddd`, `#eee`, `#fff`). Exact alpha literals used are:

- Rose: `#e8a0b422`, `#e8a0b444`, `#e8a0b488`, and `rgba(232,160,180,0.05)`, `.08`, `.1`, `.12`, `.15`, `.18`, `.2`, `.25`, `.3`, `.35`.
- Black/ink: transparent `rgba(0,0,0,0)`, plus `.04`, `.06`, `.08`, `.10`, `.1`, `.13`, `.15`, `.2`, `.4`, `.5`, `.6`, `.68`, `.7`, `.9`; search overlay also uses `rgba(17,17,17,.45)`.
- White: `#ffffff44`, transparent `rgba(255,255,255,0)`, plus `.08`, `.3`, `.4`, `.85`, `.88`, `.9`, `.92`, `.94`, `.95`, `.97`, `.98`, `.99`.
- Green: `rgba(34,197,94,.08)`, `.35`, `.5`.
- Skeleton highlight: `rgba(238,238,238,.75)`.

No CSS custom properties are defined. Reimplementations should preserve these literals rather than infer a generated shade scale.

### Radius, border, shadow, blur

- Global `button,input,select,textarea`: initially `3px`; later field rule forces input/select/textarea to `0`.
- Standard panel border: `1px solid #e8e8e8`, usually radius `0`.
- Product card: radius `0`; shadow `0 1px 4px rgba(0,0,0,.04)`.
- Product card hover: `0 8px 24px rgba(232,160,180,.15)`.
- Header: `0 1px 12px rgba(0,0,0,.04)`.
- Header icon controls: `0 1px 4px rgba(0,0,0,.04)`; hover `0 2px 10px rgba(232,160,180,.18)`.
- Dropdown: `0 8px 24px rgba(0,0,0,.08)`.
- Search panel: blur `20px`, shadow `0 16px 40px rgba(0,0,0,.15)`; overlay blur `12px`.
- Drawer: `-8px 0 32px rgba(0,0,0,.08)`.
- Admin modal: `0 10px 25px rgba(0,0,0,.1)`, overlay blur `2px`.
- Toast: radius `10px`, blur `16px`, shadow `0 8px 32px rgba(0,0,0,.13), 0 1.5px 6px rgba(232,160,180,.18)`.
- Product modal sheet: radius `4px` desktop; `14px 14px 0 0` mobile.
- Badges/pills use `50%`, `10px`, `20px`, `24px`, or `999px` as explicitly noted.

## 4. Shared component inventory

### Buttons

Primary `.rose-btn`: Raleway `10px`, weight `500`, `.2em`, uppercase; `13px 28px`; minimum `44px`; rose fill/border and black text. Hover is black/white. Disabled is opacity `.35`, not-allowed, pointer-events none. At `≤540px`: `10px 14px`, `9px`.

Secondary `.ghost-btn`: identical type/geometry; white, `1px solid #dddddd`, `#666666`; hover rose border and `#111111`.

Quantity `.qty-ctrl`: `34×34`, white, `1px solid #dddddd`, Raleway `20px`, weight `600`, no minimum height; hover rose tint/border/text; disabled opacity `.3`. At `≤540px`, `28×28`, `16px`.

Destructive actions are either red-filled `#ef4444/#ffffff` or transparent rose/red outline. There is no shared destructive class.

Navigation `.nav-link`: borderless transparent, Raleway `11px`, `.2em`, uppercase, `#666666`; hover/active `#111111`.

Global clickable transition: `0.35s cubic-bezier(0.16,1,0.3,1)` unless overridden.

### Form controls

```css
input, textarea, select {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  color: #111111;
  padding: 11px 14px;
  font-family: "Raleway", sans-serif;
  font-size: 14px;
  width: 100%;
  outline: none;
  transition: border-color .3s;
  min-height: 44px;
  border-radius: 0;
}
```

Focus border is rose. Placeholder is `#999999`. At `≤768px`, all are `16px`.

Label: Raleway `10px`, `.15em`, uppercase, `#888888`, block, `margin-bottom: 6px`.

`.check-box`: custom `18×18`, white/gray; checked rose with black `✓` at `11px`.

### Tags

Base `.tag`: Raleway `9px`, `.15em`, uppercase, `3px 8px`, `#f5f5f5/#666666`, `1px solid #eeeeee`. Rose/red/amber variants use `#fce8ee/#e8a0b4/#e8a0b444`; green/teal/purple/blue variants are neutral `#f5f5f5/#111111/#e8e8e8`.

### Tables

Native tables, `width:100%`, `border-collapse:collapse`, inside `overflow-x:auto`. Header cells are Raleway `9px`, `.15em`, `#666666`, `10px 12px`; rows generally use `12px` cells and `1px solid #1a1a1a` bottom borders. No striping, sticky headers, library sorting, or pagination widget.

### Animations

- `.fade-in`: `fadeIn .65s cubic-bezier(.16,1,.3,1)` from opacity `0`, `translateY(10px)`.
- Dropdown menu: `fadeIn .2s ease-out`.
- Product shimmer: `1.35s ease-in-out infinite`, background to `-220%`.
- Product hover: translate `-2px`; detail panel expands `76px` to `300px` over `.42s`.
- Bell: `bell-ring .5s ease 0s 3`; badge pop `.3s`.
- Toast: translateX state transition `.34s` spring-like cubic-bezier; progress drains `8s linear`.
- `prefers-reduced-motion` disables fade, pill wave, and shimmer and disables smooth scrolling.

## 5. Admin shell, navigation, and page layouts

Authenticated root:

```js
{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px" }
```

Header and navigation rows wrap with `gap:12`. Title/status/bell is left. The tab trigger and action buttons form the next row. There is no separate Overview page.

Tab trigger: white, rose `1px` border/text, `10px 18px`, Raleway `11px` bold `.15em`, minimum width `160`, radius `0`. Hover background `#fce8ee`. Menu is absolute white, minimum `160`, shadow; items `12px 18px`, Raleway `11px`, `.1em`; active `#fce8ee/#111111`, inactive transparent/`#666666`, hover `#fafafa/#111111`.

### Overview/Orders

Three KPI cards precede orders: grid `repeat(auto-fit,minmax(200px,1fr))`, `gap:16`, bottom margin `24`. Each card is `#fafafa`, `20px`, standard border, and `4px` left stripe. Labels: `TOTAL REVENUE`, `ACTIVE ORDERS`, `PENDING PAYMENT`.

Orders search, category filters, alert disclosure, bulk toolbar, order card structure, and every action are specified in §8.

### Log

Top status row is flex space-between with `padding:0 4px`, `margin-bottom:16`. A master/recent toggle is a borderless rose underlined Raleway `10px` button. Search row wraps, `gap:12`; input max width `400`. `EXPORT CSV` is `.rose-btn`, height `42px`, `0 20px`, with a left `14×14` download SVG and `gap:8`. Results reuse `OrdersList`.

### Reviews

`AdminTestimonialsView` supplies a create form followed by review records. Form controls use `Fld`; submit is `.rose-btn`. Ratings use `StarRating`, an inline-flex row with `gap:2` of filled rose custom SVG stars, default `14px`. There is no third-party review component.

### Products

Fully specified in §6.

### Admin Shop / Point of Sale / Staff

This is the only staff/POS surface. It wraps public `ShopPage` in `1px solid #e8a0b488`, `padding:32px 0 0`, `margin-top:32`, radius `4`. `SHOP PREVIEW` overlaps at `top:-14,left:24`; `CART (n)` is absolute at `top:12,right:16`. Header action `Staff Cart` is `.ghost-btn` with a left bag SVG and count circle. The shared `CartDrawer` receives `staffMode`.

There is no staff roster, permissions, shifts, bookings, or consultations UI.

### Insights

Column stack `gap:24`. Top cards grid is `repeat(auto-fit,minmax(280px,1fr))`, `gap:16`; each card `#fafafa`, `22px`, standard border. Sections: `REVENUE OVERVIEW`, `MONTHLY PERFORMANCE`, `BUSINESS INTELLIGENCE`.

`PRODUCT INCOME BREAKDOWN` is a native table with a `2px` proportional bar, `#f5f5f5` track, `max-width:180`; first rank rose, others `#333333`. `PAYMENT & FULFILLMENT STATUS (%)` is `repeat(auto-fit,minmax(140px,1fr))`, `gap:10`; tiles are white, `16px`, `2px` left status border.

No chart library, canvas, axes, legend, or tooltip.

### Customers / Clients

Search input max width `340`. Cards stack with `gap:2`; each `#fafafa`, standard border, `16px 18px`, wrapping flex, `gap:16`. Identity is left; ORDERS, SPENT, LAST metrics are right with `gap:20`. `Gift Eligible` and `VIP` tags may appear. No separate client profile page.

### Settings

Fully specified in §7.

### Admin modal and toast

Admin confirmation overlay is fixed/inset, black `.5`, centered, z-index `1000`, blur `2px`. Content is white, rose border, `24px`, max width `400`, width `90%`, shadow, `slideDown .3s ease-out`. Toast is fully specified in §9.

### Admin responsive behavior

- `≤600px`: full admin title hidden; `HSE Admin` shown.
- `≤768px`: status checks full width and left-aligned; `.two-col` becomes one column; fields become `16px`.
- `≤640px`: `.admin-note-grid` one column.
- `≤480px`: `.order-row` becomes column and left-aligned.

## 6. Product page — full feature inventory

Vertical stack `gap:20`: search/new toolbar; optional stock alerts; optional Top Ordered strip; form card; `BulkUpdatePanel`; skincare, wellness, bundles tables.

Blank model:

```js
{
 image:"", secondaryImage:"", name:"", brand:"",
 category:"skincare", subcategory:"face wash", price:"",
 notes:"", extra:"", gender:"women", stock:"10",
 lowStockThreshold:"3", bestseller:false, isTrending:false
}
```

Every field:

1. `PRIMARY IMAGE — Product Photo`: `ImageInput`.
2. `SECONDARY IMAGE — Back / Ingredients / In-Use`: `ImageInput`.
3. `Product Name *`: text, required.
4. `Brand`: text.
5. `Category`: select—Skincare, Wellness, Bundles & Sets.
6. `Subcategory`: category-specific select; Other reveals `Type custom subcategory...`.
7. `For`: Women, Unisex, Men, Kids.
8. `Price (GH₵) *`: number, required/number validation only.
9. `Stock Qty`: number.
10. `Low Stock Alert At`: number.
11. `Key Ingredients / Benefits`: `100px` high vertical-resize textarea.
12. `Size / Volume / Type`: text.
13. `Mark as Bestseller`: checkbox.
14. `Mark as Trending`: checkbox.

Validation is only:

```js
!form.name.trim() || !form.price || isNaN(form.price)
```

Failure: `WARN: Name and a valid price are required.` Success: `Product added!`/`Product updated!`, cleared after `3000ms`. No spinner or disabled save.

Images are exactly two fixed slots, not a gallery. No multi-upload, reorder, drag/drop, captions, or crop. Upload uses Cloudinary cloud `dccf0ffxr`, unsigned preset/folder `slay_products`, after JPEG compression at max width `1200`, quality `.82`; returned URL receives `/f_auto,q_auto,w_900/` and `?v=timestamp`. Failure falls back to a max-width `900`, quality `.78` base64 data URL. Preview is `90×90`, cover, rose border. Clear uses native confirmation and only changes the form value immediately. When an edited product is subsequently saved, `useProducts.updateProduct` detects a changed/cleared primary or secondary URL and calls `deleteCloudinaryImage` for the replaced old URL; deleting a whole product likewise attempts deletion of both stored Cloudinary images. Base64/local and non-Cloudinary URLs cannot be remotely removed.

Compact table image controls are `64×64`, open a black `.9` full-screen preview, and save immediately. They provide Change/Delete; no separate table save.

### Dual image-upload row

The Primary and Secondary fields are not stacked field wrappers. They occupy one full-width nested grid inside the form:

```js
{
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  gridColumn: "1/-1"
}
```

Each column has its own custom label:

```js
{
  display: "block",
  fontFamily: "'Raleway',sans-serif",
  fontSize: 9,
  color: "#e8a0b4",
  letterSpacing: ".15em",
  marginBottom: 6
}
```

Labels are exactly `PRIMARY IMAGE — Product Photo` and `SECONDARY IMAGE — Back / Ingredients / In-Use`. Each renders an independent `ImageInput` with identical behavior:

```text
column, gap 10
├─ flex row, gap 8
│  ├─ URL input, flex 1
│  ├─ Upload button
│  └─ hidden file input accept="image/*"
├─ optional status message
└─ optional preview
```

The combined text control accepts a pasted URL and has placeholder `Paste image URL or upload`. If a base64 fallback is stored, the displayed input value becomes blank, opacity becomes `.7`, and placeholder becomes `Image saved`. Typing clears any prior status message.

The adjacent Upload button is transparent with `1px solid #e8a0b4`, rose text, Raleway `10px`, `.15em`, uppercase, `padding:"0 16px"`, `minHeight:44`, and no wrap. While processing it is disabled, changes text to `Processing…`, text color to `#666`, and cursor to `not-allowed`.

Only the first selected file is used. Non-image MIME types show `Please select an image file.` Successful Cloudinary upload shows `Uploaded successfully`; fallback shows `Saved locally (add Cloudinary keys for cloud hosting)`. Each field previews independently as a `90×90` cover image with rose border. Its `20×20` circular rose `x` is positioned `top:-6,right:-6` and asks `Are you sure you want to clear this image?`.

There are no variants. Category values are `skincare`, `wellness`, `bundles`; audience is metadata only. Stock `0` is Out; `0 < stock ≤ lowStockThreshold` is Low. Price/stock table inputs save on blur or Enter.

Promotion input is number `min=0,max=99`; valid `0<pct<100` sets:

```js
promoPrice = Math.round((originalPrice || price) * (1 - pct / 100))
```

Otherwise promo is disabled. Table Delete becomes inline Confirm/Cancel rather than a modal.

### `TOP ORDERED` highlight panel

This panel is conditional: it renders only when at least one ordered product can be derived. It aggregates quantities from every supplied order item by product ID:

```js
counts[i.id] = (counts[i.id] || 0) + i.qty
```

Entries are sorted descending by quantity, sliced to the first five, and joined to the current product catalog by ID. It is therefore a top-five units-ordered summary, not a revenue ranking and not the manually assigned `bestseller` flag.

Outer panel:

```js
{ background: "#fafafa", padding: "16px 18px" }
```

Heading is an inline `Icon name="star"` at `12px`, followed by `TOP ORDERED`. Heading style is Raleway `10px`, `#e8a0b4`, `.18em`, `marginBottom:12`, flex centered with `gap:6`.

Entries use a wrapping flex row with `gap:8`. Each entry is a neutral chip-like block:

```js
{
  background: "#f5f5f5",
  padding: "8px 14px",
  display: "flex",
  gap: 10,
  alignItems: "center"
}
```

Inside, product ID is Raleway `9px` rose; product name is Cormorant `14px`; trailing `.tag.tag-rose` reads exactly `${count} ordered`. If the product ID no longer resolves, the ID itself is displayed as the name fallback.

## 7. Settings page — full layout

No tabs or accordions. Two wrapping equal cards, each `flex:1,minWidth:280`, `#fafafa`, `22px`, standard border, parent `gap:20`.

Left card:

- **CHANGE PASSWORD:** Current, New, Confirm inputs with `18×18` eye SVGs. Minimum new-password length `8`; passwords must match. Button `Update Password`; message states `Updating credentials…`, failure, or success. Enter works in Confirm.
- **DANGER ZONE:** `Reset Local Browser Data` and `Wipe Cloud Storage System`, full-width rose-tinted `.ghost-btn`s. Both require password verification then native `window.confirm`. Labels change to `Clearing…`, `Wiping Cloud…`, `Cloud Wiped`; disabled during work, cloud wipe disabled offline.
- **CONTACT:** configured phone and WhatsApp link.

Right card:

- **GOOGLE SHEETS SYNC:** three instruction rows with `2px` rose left border; Published CSV URL; `AUTO-SYNC EVERY 5 MINS`; Preview ghost button; conditional Confirm Import primary button; scrollable preview `max-height:160`. Preview-before-confirm is the save pattern. Auto-sync runs immediately then every `5*60*1000`.
- **SOCIAL PROOF CONTROL:** `Simulated Popups` custom `44×24` switch. Track rose/on or `#222222`/off; `18×18` thumb moves `left:3` to `23` over `.4s`. Saves immediately.

No global Settings Save button, custom settings modal, or undo.

## 8. Orders page — exhaustive buttons and actions

### Search/filter

- Search `×`: borderless rose, `14px`, absolute right `14`; clears.
- Four category buttons: selected rose/black/rose border; inactive transparent/`#999999`/`#333333`; `8px 16px`, Raleway `10px`, `.1em`, flex `gap:8`. Count badge trails.
- Awaiting-delivery disclosure is a clickable `div`, not a button.

### Bulk toolbar

- `SELECT ALL` and `CLEAR`: `.ghost-btn`, override `9px`, `4px 8px`, `minHeight:0`.
- `SELECT DUPLICATES (N)`: same plus rose text and `rgba(232,160,180,.3)` border.
- `DELETE SELECTED`: red-filled `.rose-btn`, white, `6px 14px`, `9px`, auto height. Opens password-confirmed bulk-delete modal. No success toast/loading state.

### Per-order summary

Every order row includes four directly clickable inline progress boxes in this exact order:

```js
[
  ["payment", "Paid", "#e8a0b4", "#111111"],
  ["packaged", "Packed", "#ffffff", "#111111"],
  ["dispatched", "Dispatched", "#ffffff", "#111111"],
  ["delivered", "Delivered", "#ffffff", "#111111"]
]
```

They are not static badges, a select, dropdown, or modal action. The group is `.order-status-checks` with `display:flex`, `gap:6`, and wrapping. Each stage is a clickable flex `div` with `alignItems:"center"`, `gap:5`, `padding:"6px 10px"`, and `transition:"all .2s"`. It contains a read-only `.check-box` and Raleway `9px` label.

Unchecked visual state:

- container background `#111111`;
- container border `1px solid #222222`;
- label `#666666`, `fontWeight:"normal"`;
- checkbox is `18×18`, white background, `1px solid #dddddd`, no checkmark.

Checked visual state:

- container background remains `#111111`;
- Paid border and label become `#e8a0b4`; Packed, Dispatched, and Delivered become `#ffffff`;
- label becomes bold;
- checkbox background/border become `#e8a0b4`;
- checkbox `::after` renders a centered black `✓` at `11px`.

Click stops row-expansion propagation and calls:

```js
updateOrderStatus(order.id, stageKey, !order.status[stageKey])
```

Thus every stage can be un-clicked as well as clicked; the UI is not forward-only. Cascades preserve a coherent sequence:

- checking Packaged also checks Paid;
- checking Dispatched also checks Packaged and Paid;
- checking Delivered also checks Dispatched, Packaged, and Paid;
- unchecking Paid clears Packaged, Dispatched, and Delivered;
- unchecking Packaged clears Dispatched and Delivered;
- unchecking Dispatched clears Delivered;
- unchecking Delivered only clears Delivered.

Each newly checked stage receives a timestamp; clearing it clears the associated timestamp. UI updates optimistically. There is no confirmation or success toast. Database failure uses native `alert(...)` and reverts the order to the pre-click status snapshot. Poll overwrite is suppressed for `8000ms`. In `readOnly` mode cursor becomes `default` and clicking does nothing.

At `≤768px`, the group becomes `width:100%` and left-aligned.

### Collapsible Awaiting Delivery group

This group renders only when the active category filter is `all` and `awaitingDelivery.length > 0`. Membership is orders for which both `status.packaged` and `status.payment` are true, sorted oldest first.

Outer container has `marginBottom:20`, `border:"1px solid #111111"`, and black background. The clickable header is a `div`, not a button:

```js
{
  padding: "12px 18px",
  display: "flex",
  justifyContent: "space-between",
  cursor: "pointer"
}
```

Left side uses white `warning` SVG at `12px` and exact text `AWAITING DELIVERY — N ORDER`/`ORDERS`, Raleway `10px`, `.18em`, flex `gap:6`. Right side is a plain `▲` when open or `▼` when closed in `#cccccc`. Initial state is open.

Expanded body has `borderTop:"1px solid #333333"`, `padding:"12px 18px"`, column `gap:8`, and `#fafafa`. Each grouped row is white, wrapping flex space-between, `gap:8`, `padding:"10px 12px"`, standard border, plus `3px` left age stripe. It displays customer name, phone, order ID, total, readiness tag, optional green `VERIFIED ORDER`, and relative age at right.

### Category filter pill row

The row is wrapping flex, `gap:10`, `marginBottom:24`. Exact items are `ALL ORDERS`, `SKINCARE`, `WELLNESS`, and `BUNDLES`.

Counts are live:

- All = total active orders;
- category counts each order once per recognized category using a `Set` of its item categories;
- categories match substrings `skincare`, `wellness`, or `bundle`.

Selected pill is rose fill, black text, rose `1px` border. Unselected is transparent, `#999999`, `1px solid #333333`. Pills are `8px 16px`, Raleway `10px`, `.1em`, flex centered with `gap:8`, `transition:"all .2s"`.

Count badge renders only when count is greater than zero. It is trailing, black text, `1px 6px`, radius `10`, `9px`, bold. Selected badge background is `rgba(0,0,0,0.15)`; unselected badge is `#e8a0b4`. Filtering is immediate and checks whether any order item category includes the selected value.

### Bulk-selection toolbar and row checkbox

The toolbar renders above the list whenever the list is editable and non-empty. It is `#fafafa`, standard border, `12px 16px`, wrapping flex space-between/center, `gap:10`, `marginBottom:6`.

Every editable row begins with a dedicated selection wrapper, `paddingRight:8`, containing a read-only `.check-box` overridden to `16×16`. Clicking this wrapper stops propagation so selection does not expand/collapse the order. Selection is held in a `Set` of order IDs; clicking toggles membership.

Toolbar left side shows `${selectedIds.size} SELECTED` in Raleway `10px`, `.1em`, `#666666`, then:

- when none selected, `SELECT ALL` selects every order in the currently rendered/filtered list;
- when one or more selected, `CLEAR` replaces the set with empty;
- when duplicates exist, `SELECT DUPLICATES (N)` replaces selection with all duplicate IDs.

`SELECT ALL`/`CLEAR` are `.ghost-btn` overrides `fontSize:9`, `padding:"4px 8px"`, `minHeight:0`. Duplicate selection adds rose text and `rgba(232,160,180,.3)` border.

Only when selection is non-empty, `DELETE SELECTED` appears at the right. It is red-filled, white, `6px 14px`, Raleway `9px`, and opens the password-confirmed bulk-delete modal. Successful deletion clears selection through the supplied callback. There are no bulk status updates, exports, assignments, or other bulk actions.

### Expanded order

- `PRINT`: rose fill, black, `4px 8px`, `9px` bold, absolute top-right; opens print window.
- `SAVE NOTE` → `✓ SAVED`: black → green, white, `8px 20px`, Raleway `9px`, `.15em`; saved state lasts `2000ms`.
- Delivery notification: left WhatsApp SVG, `gap:8`, `#25D366` if enabled or `#333333` disabled, `10px 18px`, `9px`, `.12em`. Disabled before Packaged and while sending. Labels: `MARK PACKAGED FIRST`, `SENDING…`, `SEND DELIVERY NOTIFICATION`, and result strings `✓ Sent!`/`✗ Failed`/`✗ Error`.
- `DELETE ORDER`: transparent rose outline, `10px 18px`, `9px`, `.12em`; opens single password modal.
- Modal confirm is red filled; Cancel is `.ghost-btn`. Error inline; no spinner/success toast.

### Header/order-adjacent

- Bell: icon-only, transparent, `padding:4`, `20×20` custom SVG; selects Orders and clears unread count.
- Log `Show All History` toggle: borderless, rose, underlined, Raleway `10px`.
- Log `EXPORT CSV`: primary, `42px` height, `0 20px`, left `14×14` download SVG, `gap:8`.

## 9. Notification system

Orders poll every `3000ms`; no Realtime subscription. First load seeds an in-memory known-ID `Set` without notifying. Later rows whose IDs are absent call `onNewOrder`.

Only genuinely new order IDs notify. Status, payment, low stock, product, review, and settings changes do not.

Each new order:

1. requests browser notification permission once, tracked by session key `slay_notif_permission_asked`;
2. prepends an in-app toast, deduplicated by ID, maximum five;
3. increments in-memory `bellCount`;
4. sends a native notification only when permission is granted and `document.hidden`;
5. plays sine tones `880Hz/.18s` and `1046.5Hz/.28s`;
6. auto-dismisses toast after `8000ms`.

Native title is `🛍️ New Order — Slay Empire`, icon `/favicon.png`, tag order ID.

Toast stack is fixed top-right `20px`, z-index `9999`, gap `10`. Cards are white `.97`, blur `16px`, `14px 16px`, radius `10`, rose alpha border and compound shadow. Content is accent strip, emoji/title/time, customer/order/item/total, `View Orders →`, dismiss `×`, and `2px` eight-second progress bar.

Dismiss removes the toast only. Auto-dismiss also leaves bell count unchanged. Selecting Orders, clicking bell, or View Orders clears the whole bell count. No persistence, history dropdown, per-item read state, or backend acknowledgement.

## 10. Public storefront

### Storefront shell and navigation

Optional promo banner precedes a sticky header. Banner is `#fce8ee`, Raleway `10px`, `.2em`, uppercase, `14px 40px 14px 16px`; close `×` is absolute right `16`.

Header:

```js
{
 position:"sticky", top:0, zIndex:50,
 background:"rgba(255,255,255,.97)",
 borderBottom:"1px solid #e8e8e8",
 boxShadow:"0 1px 12px rgba(0,0,0,.04)",
 padding:"0 24px", height:68,
 display:"flex", alignItems:"center", justifyContent:"space-between"
}
```

Logo image height `44px`, `mix-blend-mode:multiply`; `34px` at `≤480px`. Desktop nav gap `28`. Search is a circular `44×44` white control. Bag is a `min-height:44`, radius `999`, `9px 16px 9px 14px`, icon then Raleway `11px` label; count badge is `20×20`, rose.

At `≤768px`, desktop nav hides and the `44×44` menu control appears. Mobile panel is fixed below header, white, `24px 16px`, column `gap:24`, shadow. At `≤480px`, nav height and panel top become `60px`.

### Home

Hero is full-bleed via viewport-calc margins. Desktop uses configured background and content maximum `720px`, margin `0 auto 0 max(40px,7%)`, horizontal padding `24px`. Mobile at `≤540px` removes background, displays `.hero-mobile-img` at `100%×380px`, cover, and gives text `28px 20px 0`.

Below hero:

- trust strip: wrapping centered flex, `gap:24px 40px`, `20px 24px`, pale surface and top/bottom borders;
- Best Sellers: `.section-pad`, compact product grid;
- Delivery & Returns centered section;
- Why Choose Us: three-column `.feature-grid`, `gap:24`, cards `32px 28px`;
- spotlight product grid;
- community CTA;
- category cards: `repeat(auto-fit,minmax(280px,1fr))`;
- subcategory pill row;
- testimonials;
- footer.

`.section-pad` is `72px 20px`, max width `1400`; at `≤540px`, `40px 12px`.

### Shop page layout

Root: `maxWidth:1400`, centered, `padding:"40px 12px"`. Header has section label `Shop`, typewriter title `The Essentials`, intro text, centered category tabs, and subfilter pills.

Category tabs use `.cat-tab`: `10px 20px`, Raleway `10px`, `.15em`, uppercase, transparent border/background, `#666666`. Active is rose/black; inactive hover gets gray border and dark text.

Subfilters are produced per category:

- skincare: All, Face, Body, Natural;
- wellness: All, Vitamins, Beauty Supps, Hair/Skin/Nails, Intimate, Daily;
- bundles: All, Skincare Kits, Wellness Kits.

Subfilter button is transparent/rose border when active, `6px 16px`, Raleway `9px`, `.15em`.

Products display eight initially. `LOAD MORE` uses `.ghost-btn`; a fake `600ms` loading state adds eight. Empty state is centered with `100px 20px`.

Grid:

```css
.grid-products, .grid-products-compact {
 display:grid;
 grid-template-columns:repeat(4,1fr);
 gap:16px;
}
```

- `≤1150px`: three columns.
- `≤820px`: two columns, gap `12px`.
- `≤540px`: two columns forced, gap `12px`.

### Product card

Card is `430px` tall (`340px` at `≤540px`), white, standard border, overflow hidden, subtle shadow. Click opens Product Detail.

Image canvas is absolute full-card, `#f5f4f2`. Images are contain-fit, centered, padded `18px 12px 88px`. First four load eager; first two high priority. Primary fades in; if secondary exists, hover fades primary out with `scale(1.08)` and secondary in.

Top-left ID: Raleway `9px`, `.2em`, translucent white, `2px 8px`, border. Top-right vertical badges: Bestseller, PROMO, discount percentage, Out of Stock, Only 1 Left, Low Stock.

Detail panel is bottom absolute, initially max height `76px`, `12px 14px 14px`, white-transparent upward gradient. Hover expands to `300px`. Brand appears above title. Title/price share a baseline row. Old price is rose strikethrough `13px`; current price rose `17px`, weight `500`.

Expanded actions: quantity minus, value, plus; then full-width primary CTA `padding:14px`. CTA reads `ADD TO BAG` or `OUT OF STOCK` and disables when no available stock. Card opacity is `.6` for `.oos`.

Mobile detail panel uses `10px 8px`, starts at `84px`; title row becomes column and title wraps to two lines at `14px`.

Skeleton uses absolute image block plus two `10px` rounded detail lines and a `100deg` shimmer.

### Search overlay

Fixed/inset, dark `.45`, blur `12px`, z-index `400`. Top panel is white `.88`, blur `20px`, `36px 24px 28px`, rose-alpha bottom border and shadow. Search input is a Cormorant borderless field with underline wrapper.

Results layout: `1.1fr 1.9fr`, gap `36`; category tiles left, product results right. At `≤768px`, one column, gap `28`. Result rows are white, `14px 16px`, `gap:16`, standard border plus transparent `3px` left border; hover shifts `4px`, turns rose-bordered, and adds rose shadow. At `≤540px`, panel `24px 16px 20px`, rows `12px`, thumbnails `46×56`.

### Product modal/detail

Modal overlay is fixed and centered; modal is a two-column grid, height `min(680px,90vh)`. Image half is cover-fit at `center 15%`; content is header/body/footer grid. Header `32px 40px 0`, body `0 40px 16px`, footer `16px 40px 28px`.

At `≤640px`, it becomes a bottom sheet: overlay aligns bottom; radius `14px 14px 0 0`; image is sticky, `72vw`, minimum `260px`; header/body/footer use `18px` horizontal padding.

Product detail page is centered max width `1000`, `24px 16px 80px`; grid `1.1fr 1fr`, gap `48`, collapsing to one column at `≤640px`. Both show image switching, badges, title, description, quantity controls, and full-width `ADD TO BAG` button with `18px` padding.

### Cart drawer

Overlay fixed/inset black `.4`, z-index `99`. Drawer fixed right, `100dvh`, width `100vw` or `440px` at `≥481px`, white, column, safe-area padding, shadow. Header `20px`; scroll body `20px`; footer `18px 20px` with top border. Items are separated by borders, use `28×28` quantity controls, Remove text action, and checkout forms based on state.

### Order tracking

Centered max width `640`, `60px auto`, horizontal padding `16`. Search card uses `32px`. Result uses a four-step visual line: Order Placed, Payment, Packaged, Dispatched/Delivered state. Dots are `32×32`, labels below; progress green. At `≤500px`, dots `28×28` and labels/timestamps shrink.

### Social proof and testimonials

Social proof is a dismissible purchase/review popup, fixed near viewport edge, `12px 14px`, shadow `0 12px 40px rgba(0,0,0,.1)`. Settings controls whether simulated entries mix with real verified activity.

Testimonials use cards `22px 26px`; quote is Cormorant `16px`, line-height `1.5`; avatar is circular; star rating uses custom rose SVG stars. Section uses responsive `repeat(auto-fit,minmax(260px,1fr))`.

### Footer and secondary public pages

Footer is dark, `80px 24px 40px`, grid `repeat(auto-fit,minmax(200px,1fr))`. It contains brand/about, Shop links, Help links, contact, social controls, and bottom legal/credit.

About: max width `820`, `72px 16px 80px`; content cards `22px 24px`.

FAQ: max width `800`, same outer padding; static question/answer cards `24px 28px`.

Privacy/Terms: max width `760`, `72px 16px 80px`; legal section headings Raleway `10px`, `.18em`; body Raleway `13px`, line-height `1.9`–`2`.

## 11. Dependencies

Runtime:

```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "bcryptjs": "^3.0.3",
  "jsonwebtoken": "^9.0.3"
}
```

Dev:

```json
{
  "@vitejs/plugin-react": "^4.5.2",
  "vite": "^6.3.5"
}
```

There is no Tailwind, component library, icon library, chart library, animation library, toast library, modal library, or data-grid library. UI is React, inline style objects, global CSS, and hand-authored SVG.

## 12. Customers/Clients page and business-wide activity Log

### Customer aggregation source and behavior

The actual tab label is `Customers`; there is no separately named Clients page. `AdminApp` passes both active and completed/logged orders:

```jsx
<AdminCustomers orders={[...orders, ...logOrders]} />
```

Customer records are not stored separately for this view. They are recomputed from real order objects with the phone number as the grouping key. Orders without a customer phone are skipped. For the first order encountered for a phone, the view initializes:

```js
{
  name: order.customer.name,
  phone,
  email: order.customer.email,
  orders: 0,
  spent: 0,
  first: order.timestamp,
  last: order.timestamp
}
```

For every matching order:

```js
customer.orders++;
customer.spent += order.total;
customer.first = Math.min(customer.first, order.timestamp);
customer.last = Math.max(customer.last, order.timestamp);
```

The derived customers are sorted by `last` descending, then filtered by case-insensitive name or phone substring. Search input placeholder is `Search by name or phone…`, with `maxWidth:340`; its wrapper has `marginBottom:16`.

### Customer row layout

Rows stack in a column with `gap:2`. Each row is display-only:

```js
{
  background: "#fafafa",
  border: "1px solid #e8e8e8",
  padding: "16px 18px",
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  alignItems: "center"
}
```

The identity block uses `flex:1,minWidth:160`. Name/badge row is wrapping flex, centered, `gap:8`, `marginBottom:4`. Name is Cormorant `17px`. Contact line is Raleway `11px`, `#666666`, formatted as phone followed by ` · email` only when email exists.

The aggregate-stat block is wrapping flex with `gap:20`. Every metric is center aligned:

| Metric | Computation | Label style | Value style |
|---|---|---|---|
| `ORDERS` | Count of all supplied orders sharing the phone | Raleway `9px`, `#666666`, `.12em`, `marginBottom:4` | Cormorant `22px`, `#111111`, weight `300` |
| `SPENT` | Sum of `order.total` for that phone, formatted through `GHS(...)` | Same label style | Cormorant `15px`, `#999999` |
| `LAST` | Maximum order timestamp, formatted by `ago(c.last)` as relative time such as `2 days ago` | Same label style | Raleway `11px`, `#666666` |

Although `first` is computed, it is not rendered.

### VIP and Gift Eligible badges

`VIP` renders when either threshold is true:

```js
c.orders >= 3 || c.spent >= 1000
```

It uses `className="tag tag-rose"`. Exact visual styling:

```css
.tag {
  font-family: "Raleway", sans-serif;
  font-size: 9px;
  letter-spacing: .15em;
  text-transform: uppercase;
  padding: 3px 8px;
  display: inline-block;
  white-space: nowrap;
}

.tag-rose {
  background: #fce8ee;
  color: #e8a0b4;
  border: 1px solid #e8a0b444;
}
```

There is no radius declaration, so the tag remains square under this CSS.

`Gift Eligible` independently renders at `c.orders >= 5` using `.tag.tag-teal`: `#f5f5f5` background, `#111111` text, `1px solid #e8e8e8`, with the same base tag typography and padding. A customer can display both badges.

### Empty and interaction states

No results shows a center-aligned panel with `padding:"56px 0"`, standard border, and Raleway `12px` `#333333` text `No customers yet`.

There is no per-customer activity log, timeline, detail page, modal, or drill-down. Customer rows have no `onClick`, link, button, expand chevron, or modal trigger. Individual orders, status changes, items, notes, bookings, and consultations are not shown on this page.

### Business-wide `Log` tab

The `Log` tab is an order-level activity/history view across the whole business, not a customer detail. It reuses `OrdersList`, so each order can expand into the same order-card detail and action structure documented in §8.

Default range is the last 30 days:

```js
Date.now() - order.timestamp < 2592000000
```

When `showAllLog` is true, all `logOrders` are used. The top status/action row is:

```js
{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 4px",
  marginBottom: 16
}
```

Range label is Raleway `10px`, `#666666`, `.1em`:

- default: `RECENT ACTIVITY · LAST 30 DAYS`;
- all-history: `MASTER RECORD · ALL HISTORY`.

The adjacent toggle is borderless and backgroundless, rose, Raleway `10px`, bold, pointer, underlined. Its labels are `Show All History` and `Show Recent Only`. It switches ranges immediately; there is no date picker.

Search/export row uses `marginBottom:16`, wrapping flex, centered, `gap:12`. Search input has `maxWidth:400`, `flex:1`, placeholder `Search by ID, name, or phone…`; matching is case-insensitive against order ID and customer name, and direct lowercased matching against customer phone.

`EXPORT CSV` is `.rose-btn` with overrides:

```js
{
  height: "42px",
  padding: "0 20px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8
}
```

A custom `14×14` download SVG is placed left of the label, with stroke width `2`. Export uses the currently range-filtered and search-filtered records. Columns are:

```text
Order ID
Purchase Code
Customer Name
Customer Phone
Customer Email
Placed On
Items
Total (GHS)
Status
Payment Method
Momo Ref
Paystack Ref
Admin Note
Estimated Delivery
```

The Log is not accessed by clicking a customer. It is a separate admin tab and does not group records by customer.
