-- ============================================================================
-- FIX: SEAL ORDERS & ORDER_EVENTS PRIVACY LEAK
-- ============================================================================
-- Purpose:
-- Prevents anonymous bulk scraping of customer orders, names, addresses, and
-- phone numbers, while preserving customer order tracking via track_record RPC.
-- ============================================================================

-- 1. Drop the dangerous open read policy on orders and events
DROP POLICY IF EXISTS "public can track orders" ON public.orders;
DROP POLICY IF EXISTS "public can view order events" ON public.order_events;
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all on order_events" ON public.order_events;

-- 2. Strictly enforce Row Level Security on orders, events, and items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. Ensure staff management policies exist for authenticated staff
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

-- 4. Verify track_record RPC is granted to anon and authenticated
GRANT EXECUTE ON FUNCTION public.track_record(text, text) TO anon, authenticated;
