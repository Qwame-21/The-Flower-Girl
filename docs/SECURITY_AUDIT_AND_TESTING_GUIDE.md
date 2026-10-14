# Security Audit & Testing Guide
**Projects:** The Flower Girl / Gifting Factory & SNG Studio  
**Date:** 2026-10-14  

---

## 1. How to Test Your Own Apps (Developer Testing Guide)

### Where is it done?
You can perform these tests in two places:
1. **Directly in your Mac Terminal** (using `curl` commands — fastest and most realistic).
2. **Directly inside Google Chrome / Brave / Safari** (using DevTools).

---

### Method A: Browser DevTools (How visitors inspect your site)

1. Open your live site in Google Chrome: `https://the-flower-girl.vercel.app`
2. Right-click anywhere on the page and click **Inspect** (or press `Cmd + Option + I`).
3. Click the **Network** tab at the top.
4. Filter by **Fetch/XHR**.
5. Refresh the page or click around.
6. Click any request made to `supabase.co`:
   - Under **Headers**, you will see the **Request URL** (e.g. `https://lvciyxnafwhrtrgmmjxw.supabase.co/rest/v1/...`)
   - Under **Request Headers**, you will see `apikey: sb_publishable_...`
7. Now click the **Console** tab in DevTools and run this single line of JavaScript:
   ```javascript
   fetch('https://lvciyxnafwhrtrgmmjxw.supabase.co/rest/v1/orders?select=*', {
     headers: {
       apikey: 'sb_publishable_-3ObYQvGxbK7XZRPK8VTjQ_z4lQN1mS',
       Authorization: 'Bearer sb_publishable_-3ObYQvGxbK7XZRPK8VTjQ_z4lQN1mS'
     }
   }).then(r => r.json()).then(console.log);
   ```

#### How to read the results:
- ❌ **VULNERABLE:** You see an array of customer records with names, phone numbers, and addresses.
- ✅ **SECURE:** You see `[]` (empty list) or an error like `{"code":"42501","message":"permission denied"}`.

---

### Method B: Terminal `curl` (How penetration testers check endpoints)

Open your Mac Terminal and paste this command:

```bash
curl -s "https://lvciyxnafwhrtrgmmjxw.supabase.co/rest/v1/orders?select=*" \
  -H "apikey: sb_publishable_-3ObYQvGxbK7XZRPK8VTjQ_z4lQN1mS" \
  -H "Authorization: Bearer sb_publishable_-3ObYQvGxbK7XZRPK8VTjQ_z4lQN1mS"
```

- If it returns `[]`, your Row Level Security (RLS) is working properly!
- If it dumps raw customer orders, RLS has an open `USING (true)` policy that must be closed.

---

## 2. The Vulnerability We Found & How It Happened

### The Root Cause: The `USING (true)` Trap
When building order tracking, a previous migration added this policy:
```sql
CREATE POLICY "public can track orders" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (true);
```

#### Why was this dangerous?
The developer intended to let customers look up their order on the frontend, and filtered the results *inside JavaScript in the browser* like this:
```javascript
// Dangerous pattern: fetches rows first, then filters in browser JS
orders.find(o => o.phone === customerPhone);
```
Because the database policy had `USING (true)`, anyone could bypass the JavaScript frontend entirely and ask the database directly: `"Give me everything (*)"`.

### The Proper Solution: `SECURITY DEFINER` RPC
Instead of opening the `orders` table to the public:
1. Keep `orders` table strictly private (`orders` can only be queried by staff).
2. Create a targeted database function (`track_record`):
   ```sql
   create function public.track_record(lookup_reference text, lookup_contact text)
   ...
   where (o.tracking_number = lookup_reference or o.order_code = lookup_reference)
     and (o.customer_email = lookup_contact or o.customer_phone = lookup_contact);
   ```
3. The database only returns data **if and only if** the exact code AND phone/email match.

---

## 3. The 1-Minute SQL Fix for The Flower Girl

Run this script in your **Supabase Dashboard > SQL Editor**:

```sql
-- 1. Drop the dangerous open read policies
DROP POLICY IF EXISTS "public can track orders" ON public.orders;
DROP POLICY IF EXISTS "public can view order events" ON public.order_events;
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all on order_events" ON public.order_events;

-- 2. Make sure RLS is strictly enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. Ensure staff policy is in place for authenticated staff
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'staff manages orders'
  ) THEN
    CREATE POLICY "staff manages orders" ON public.orders
      FOR ALL TO authenticated
      USING (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_events' AND policyname = 'staff manages order_events'
  ) THEN
    CREATE POLICY "staff manages order_events" ON public.order_events
      FOR ALL TO authenticated
      USING (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'staff manages order_items'
  ) THEN
    CREATE POLICY "staff manages order_items" ON public.order_items
      FOR ALL TO authenticated
      USING (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END $$;

-- 4. Grant track_record execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.track_record(text, text) TO anon, authenticated;
```

---

## 4. Reusable Security Checklist for SNG Studio

When we review and audit **SNG Studio**, we will follow this exact checklist:

1. **Table RLS Audit:**
   - Run `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;` on every single table.
   - Search for `USING (true)` on private tables (orders, users, client files, quotes, messages).
   - Ensure public tables (products, portfolio, published posts) only allow `SELECT USING (is_visible = true)`.

2. **CORS & Allowed Origins:**
   - Set `ALLOWED_ORIGINS` to `https://sngstudio-domain.com,http://localhost:5173`.
   - Ensure no wildcard `Access-Control-Allow-Origin: *` is present on payment or inquiry APIs.

3. **Storage Bucket Security:**
   - Public assets (avatars, portfolio images) in public read-only buckets.
   - Private customer uploads (resumes, contracts, project briefs) in private buckets with signed URLs or staff-only policies.

4. **Edge Function & Webhook Signatures:**
   - Always verify the payment provider's HMAC signature (e.g. `x-paystack-signature`) before fulfilling any paid service or order.
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend `.env` files.
