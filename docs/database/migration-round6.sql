-- =============================================================================
-- ADMIN DASHBOARD ROUND 6 CONSOLIDATED MIGRATION
-- File: docs/database/migration-round6.sql
-- Description: Additive migration for Round 6 features (Logs, Activity, Security,
--              Retention Purging, Order Snapshots, and Profile Avatars).
-- Security Model: All admin permissions enforced via public.is_staff().
-- =============================================================================

-- 1. ADD MISSING COLUMNS TO EXISTING TABLES (ADDITIVE ONLY)
DO $$ BEGIN
  ALTER TABLE public.staff_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS vip BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.customization_options ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.customer_requests ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.career_applications ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.careers ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 2. CREATE NEW TABLES FOR LOGS, AUDITING & SECURITY

-- 2.1 ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  ip_address TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 LOG SETTINGS
CREATE TABLE IF NOT EXISTS public.log_settings (
  id INT PRIMARY KEY DEFAULT 1,
  retention_period TEXT NOT NULL DEFAULT '30days' CHECK (retention_period IN ('today', '7days', '30days')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.log_settings (id, retention_period) VALUES (1, '30days')
ON CONFLICT (id) DO NOTHING;

-- 2.3 COMPLETED ORDERS LOG SNAPSHOT
CREATE TABLE IF NOT EXISTS public.completed_orders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  items_summary TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 SIGN-IN LOG
CREATE TABLE IF NOT EXISTS public.signin_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('signin', 'signout')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 FAILED LOGINS (Server-Side Throttling & Lockout)
CREATE TABLE IF NOT EXISTS public.failed_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lockout_until TIMESTAMPTZ
);

-- INDEXES FOR LOG LOOKUPS
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_completed_orders_log_created ON public.completed_orders_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_logins_email_time ON public.failed_logins(email, attempted_at DESC);

-- 3. ROW-LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_orders_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signin_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_logins ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t_name TEXT; BEGIN
  FOR t_name IN SELECT unnest(ARRAY['activity_log', 'log_settings', 'completed_orders_log', 'signin_log', 'failed_logins'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "staff manages %1$s" ON public.%1$I', t_name);
    EXECUTE format('CREATE POLICY "staff manages %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', t_name);
  END LOOP;
END $$;

-- 4. SNAPSHOT TRIGGER FOR COMPLETED ORDERS
CREATE OR REPLACE FUNCTION public.record_completed_order_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_summary TEXT;
BEGIN
  IF (NEW.fulfillment_status = 'completed' AND (OLD.fulfillment_status IS NULL OR OLD.fulfillment_status != 'completed')) THEN
    -- Generate items summary
    SELECT COALESCE(string_agg(name || ' (x' || quantity || ')', ', '), 'No items')
    INTO v_items_summary
    FROM public.order_items
    WHERE order_id = NEW.id;

    INSERT INTO public.completed_orders_log (
      order_id, order_code, customer_name, customer_phone, customer_email, total, items_summary, completed_at, is_demo
    ) VALUES (
      NEW.id, COALESCE(NEW.order_code, NEW.tracking_number, 'WEB-' || substring(NEW.id::text from 1 for 6)),
      NEW.customer_name, NEW.customer_phone, NEW.customer_email, COALESCE(NEW.total, 0.00),
      v_items_summary, NOW(), COALESCE(NEW.is_demo, false)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_completed_order_snapshot ON public.orders;
CREATE TRIGGER trg_record_completed_order_snapshot
  AFTER INSERT OR UPDATE OF fulfillment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.record_completed_order_snapshot();

-- BACKFILL EXISTING COMPLETED ORDERS (SAFE TO RUN)
INSERT INTO public.completed_orders_log (order_id, order_code, customer_name, customer_phone, customer_email, total, items_summary, completed_at, is_demo)
SELECT 
  o.id,
  COALESCE(o.order_code, o.tracking_number, 'WEB-' || substring(o.id::text from 1 for 6)),
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  COALESCE(o.total, 0.00),
  (SELECT COALESCE(string_agg(i.name || ' (x' || i.quantity || ')', ', '), 'No items') FROM public.order_items i WHERE i.order_id = o.id),
  COALESCE(o.updated_at, o.created_at),
  COALESCE(o.is_demo, false)
FROM public.orders o
WHERE o.fulfillment_status = 'completed'
  AND NOT EXISTS (SELECT 1 FROM public.completed_orders_log col WHERE col.order_id = o.id);

-- 5. REPLACE NOTIFY STATUS CHANGE TRIGGER TO WRITE TO ACTIVITY LOG INSTEAD OF NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status) THEN
    -- Write to activity log (does NOT generate notification bell sound/item)
    INSERT INTO public.activity_log (event_type, description, metadata, is_demo)
    VALUES (
      'order_status_change',
      format('Order %s status changed from %s to %s', COALESCE(NEW.order_code, NEW.tracking_number, substring(NEW.id::text from 1 for 8)), OLD.fulfillment_status, NEW.fulfillment_status),
      jsonb_build_object('order_id', NEW.id, 'old_status', OLD.fulfillment_status, 'new_status', NEW.fulfillment_status),
      COALESCE(NEW.is_demo, false)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_status_change ON public.orders;
CREATE TRIGGER trg_notify_status_change
  AFTER UPDATE OF fulfillment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();

-- 6. RETENTION PURGE RPC FUNCTION (IS_STAFF PROTECTED)
CREATE OR REPLACE FUNCTION public.purge_expired_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retention TEXT;
  v_cutoff TIMESTAMPTZ;
  v_deleted INT := 0;
  v_sub_count INT := 0;
BEGIN
  -- Strict staff-only execution check
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access denied: staff permission required';
  END IF;

  SELECT retention_period INTO v_retention FROM public.log_settings WHERE id = 1;
  IF v_retention = 'today' THEN
    v_cutoff := date_trunc('day', NOW());
  ELSIF v_retention = '7days' THEN
    v_cutoff := NOW() - INTERVAL '7 days';
  ELSE
    v_cutoff := NOW() - INTERVAL '30 days';
  END IF;

  -- Delete ONLY from log/audit tables. Never orders, order_items, customer_profiles, or revenue data.
  DELETE FROM public.activity_log WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;

  DELETE FROM public.completed_orders_log WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;

  DELETE FROM public.signin_log WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;

  DELETE FROM public.failed_logins WHERE attempted_at < v_cutoff;
  GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;

  RETURN v_deleted;
END;
$$;

-- Revoke public execution on purge function
REVOKE EXECUTE ON FUNCTION public.purge_expired_logs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_expired_logs() TO authenticated;

-- 7. CLEAR DEMO DATA TOOL FUNCTION (IS_STAFF PROTECTED, BUILT BUT NOT RUN)
CREATE OR REPLACE FUNCTION public.clear_demo_data()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_sub INT := 0;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access denied: staff permission required';
  END IF;

  DELETE FROM public.orders WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.products WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.customization_options WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.reviews WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.customer_requests WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.career_applications WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.careers WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.gallery_items WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.admin_notifications WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  DELETE FROM public.activity_log WHERE is_demo = true;
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.clear_demo_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO authenticated;
