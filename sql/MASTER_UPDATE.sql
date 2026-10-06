-- ============================================================================
-- MASTER UPDATE SQL - Flower Girl
-- ============================================================================
-- This file contains ALL database changes for the live features integration.
-- It is safe to run multiple times (uses IF NOT EXISTS and CREATE OR REPLACE).
--
-- WHAT EACH SECTION DOES AND WHY:
--
-- Section 1: signin_log table and policies
--   - Tracks when staff members sign in and out
--   - Enables security auditing and session monitoring
--   - 3 policies allow staff to read all rows and manage their own entries
--
-- Section 2: New site_settings columns
--   - delivery_selector_enabled: toggle for delivery type selector on checkout
--   - tracking_auto_refresh_enabled: toggle for auto-refresh on tracking page
--   - tracking_refresh_interval_seconds: how often to refresh (3-60 seconds)
--   - track_max_failed_attempts: how many failed lookups before lockout (1-100)
--   - track_lockout_minutes: how long to lock out after hitting limit (1-60 minutes)
--
-- Section 3: track_attempts table and rate-limited track_record
--   - track_attempts stores rate limit state per client IP
--   - track_record is updated to rate-limit FAILED lookups only
--   - Prevents abuse of the tracking lookup endpoint
--   - Fails open if no client IP can be determined
--
-- Section 4: Realtime publication additions
--   - Adds orders and admin_notifications to supabase_realtime
--   - Enables live updates in the admin dashboard
--   - Guarded with IF NOT EXISTS checks
--
-- Section 5: Order and request columns, convert_request_to_order
--   - orders.customization_selections: stores selected customizations
--   - customer_requests.converted_order_id: links request to its order
--   - convert_request_to_order: staff-only function to convert approved requests
--
-- Section 6: OPTIONAL delivery columns (COMMENTED OUT - DO NOT ACTIVATE)
--   - Proposed columns for orders.delivery_type and orders.delivery_fee
--   - To be reviewed in T7 before activation
--
-- HOW TO RUN:
-- 1. Open Supabase SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Check the final verification table - every row should show ok=true
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: signin_log table and policies
-- ============================================================================

-- Create signin_log table if missing
-- Matches exactly what src/dashboard/lib/signinLog.js reads and writes
CREATE TABLE IF NOT EXISTS public.signin_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_in_at timestamptz NOT NULL DEFAULT now(),
  signed_out_at timestamptz,
  user_agent text
);

-- Enable RLS on signin_log
ALTER TABLE public.signin_log ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can select all rows
DROP POLICY IF EXISTS "staff reads signin_log" ON public.signin_log;
CREATE POLICY "staff reads signin_log"
  ON public.signin_log FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Policy: Authenticated staff can insert their own rows
DROP POLICY IF EXISTS "staff inserts own signin_log" ON public.signin_log;
CREATE POLICY "staff inserts own signin_log"
  ON public.signin_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

-- Policy: Authenticated staff can update their own rows
DROP POLICY IF EXISTS "staff updates own signin_log" ON public.signin_log;
CREATE POLICY "staff updates own signin_log"
  ON public.signin_log FOR UPDATE
  TO authenticated
  USING (public.is_staff() AND user_id = auth.uid())
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

-- ============================================================================
-- SECTION 2: New site_settings columns
-- ============================================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS delivery_selector_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_auto_refresh_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_refresh_interval_seconds integer NOT NULL DEFAULT 10 CHECK (tracking_refresh_interval_seconds >= 3 AND tracking_refresh_interval_seconds <= 60),
  ADD COLUMN IF NOT EXISTS track_max_failed_attempts integer NOT NULL DEFAULT 10 CHECK (track_max_failed_attempts >= 1 AND track_max_failed_attempts <= 100),
  ADD COLUMN IF NOT EXISTS track_lockout_minutes integer NOT NULL DEFAULT 15 CHECK (track_lockout_minutes >= 1 AND track_lockout_minutes <= 60);

-- ============================================================================
-- SECTION 3: track_attempts table and rate-limited track_record
-- ============================================================================

-- Create track_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.track_attempts (
  client_key text PRIMARY KEY,
  failed_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

-- Enable RLS on track_attempts (no policies - function manages access)
ALTER TABLE public.track_attempts ENABLE ROW LEVEL SECURITY;

-- Replace track_record RPC with rate limiting version
-- Preserves ALL existing behavior, adds rate limiting for FAILED lookups only
CREATE OR REPLACE FUNCTION public.track_record(lookup_reference text, lookup_contact text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_normalized_lookup_phone text;
  -- Rate limiting variables
  v_client_key text;
  v_rate_limit_rec public.track_attempts%rowtype;
  v_max_attempts integer;
  v_lockout_minutes integer;
BEGIN
  v_normalized_lookup_phone := public.normalize_phone(lookup_contact);

  -- Extract client key from headers safely (wrapped in its own exception block)
  BEGIN
    v_client_key := coalesce(
      current_setting('request.headers', true)::jsonb->>'cf-connecting-ip',
      current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'unknown'
    );
    -- Clean up: take first IP if comma-separated, truncate to 255 chars
    v_client_key := left(split_part(v_client_key, ',', 1), 255);
  EXCEPTION WHEN OTHERS THEN
    v_client_key := 'unknown';
  END;

  -- If no valid client key, skip rate limiting (fail open)
  IF v_client_key != 'unknown' AND v_client_key IS NOT NULL AND trim(v_client_key) != '' THEN
    -- Read rate limit settings from site_settings with safe defaults (wrapped in its own exception block)
    BEGIN
      SELECT
        coalesce(track_max_failed_attempts, 10),
        coalesce(track_lockout_minutes, 15)
      INTO v_max_attempts, v_lockout_minutes
      FROM public.site_settings
      WHERE id = 'global';
    EXCEPTION WHEN OTHERS THEN
      v_max_attempts := 10;
      v_lockout_minutes := 15;
    END;

    -- Check if client is locked out (wrapped in its own exception block)
    BEGIN
      SELECT * INTO v_rate_limit_rec FROM public.track_attempts WHERE client_key = v_client_key;

      IF FOUND AND v_rate_limit_rec.locked_until IS NOT NULL AND v_rate_limit_rec.locked_until > clock_timestamp() THEN
        -- Client is locked out
        RETURN jsonb_build_object(
          'kind', 'rate_limited',
          'retryAfterSeconds', extract(epoch from (v_rate_limit_rec.locked_until - clock_timestamp()))::integer
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Limiter problem never blocks the real lookup
    END;
  END IF;

  -- Try to find order first
  SELECT jsonb_build_object(
    'kind','order','trackingNumber',o.tracking_number,'orderCode',o.order_code,'customerName',o.customer_name,
    'status',o.fulfillment_status,'paymentStatus',o.payment_status,
    'estimatedDelivery',o.estimated_delivery,'adminNote',o.admin_note,
    'requestedDeliveryDate',o.requested_delivery_date,
    'events',coalesce((select jsonb_agg(jsonb_build_object('stage',e.stage,'note',e.customer_note,'createdAt',e.created_at) order by e.created_at) from public.order_events e where e.order_id=o.id),'[]'::jsonb)
  ) INTO v_result FROM public.orders o
  WHERE (lower(o.tracking_number)=lower(trim(lookup_reference)) or lower(o.order_code)=lower(trim(lookup_reference)))
    and (lower(coalesce(o.customer_email,''))=lower(trim(lookup_contact)) or public.normalize_phone(o.customer_phone)=v_normalized_lookup_phone)
  LIMIT 1;

  IF v_result IS NOT NULL THEN
    -- Successful lookup - do NOT count against rate limit
    RETURN v_result;
  END IF;

  -- Try to find request
  SELECT jsonb_build_object(
    'kind','request','reference',r.reference,'customerName',r.customer_name,
    'requestType',r.request_type,'service',r.service,'status',r.status,
    'preferredDate',r.preferred_date,'confirmedQuote',r.confirmed_quote,
    'adminNote',r.admin_note,'updatedAt',r.updated_at
  ) INTO v_result FROM public.customer_requests r
  WHERE lower(r.reference)=lower(trim(lookup_reference))
    and (lower(coalesce(r.email,''))=lower(trim(lookup_contact)) or public.normalize_phone(r.phone)=v_normalized_lookup_phone)
  LIMIT 1;

  IF v_result IS NOT NULL THEN
    -- Successful lookup - do NOT count against rate limit
    RETURN v_result;
  END IF;

  -- Lookup failed - increment rate limit counter (wrapped in its own exception block)
  IF v_client_key != 'unknown' AND v_client_key IS NOT NULL AND trim(v_client_key) != '' THEN
    BEGIN
      -- Insert or update rate limit record
      INSERT INTO public.track_attempts (client_key, failed_count, window_started_at, locked_until)
      VALUES (v_client_key, 1, clock_timestamp(), NULL)
      ON CONFLICT (client_key) DO UPDATE SET
        failed_count = CASE
          WHEN locked_until IS NOT NULL AND locked_until > clock_timestamp() THEN failed_count
          WHEN window_started_at < clock_timestamp() - (v_lockout_minutes || ' minutes')::interval THEN 1
          ELSE failed_count + 1
        END,
        window_started_at = CASE
          WHEN window_started_at < clock_timestamp() - (v_lockout_minutes || ' minutes')::interval THEN clock_timestamp()
          ELSE window_started_at
        END,
        locked_until = CASE
          WHEN locked_until IS NOT NULL AND locked_until > clock_timestamp() THEN locked_until
          WHEN (CASE
            WHEN locked_until IS NOT NULL AND locked_until > clock_timestamp() THEN failed_count
            WHEN window_started_at < clock_timestamp() - (v_lockout_minutes || ' minutes')::interval THEN 1
            ELSE failed_count + 1
          END) >= v_max_attempts THEN clock_timestamp() + (v_lockout_minutes || ' minutes')::interval
          ELSE NULL
        END;

      -- Clean up old records occasionally (delete records older than lockout minutes * 2)
      DELETE FROM public.track_attempts
      WHERE window_started_at < clock_timestamp() - (v_lockout_minutes * 2 || ' minutes')::interval;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Limiter problem never blocks the real lookup
    END;
  END IF;

  -- Return not found result
  RETURN jsonb_build_object('kind', 'not_found');
END $$;

REVOKE ALL ON FUNCTION public.track_record(text,text) FROM public;
REVOKE ALL ON FUNCTION public.track_record(text,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.track_record(text,text) TO anon, authenticated;

-- ============================================================================
-- SECTION 4: Realtime publication additions
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: Order and request columns, convert_request_to_order
-- ============================================================================

-- Add customization columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customization_selections jsonb NOT NULL DEFAULT '[]';

-- Add converted_order_id to customer_requests
ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create convert_request_to_order RPC
-- Staff-only function to convert approved requests to orders
CREATE OR REPLACE FUNCTION public.convert_request_to_order(
  p_request_id uuid,
  p_delivery_address text,
  p_recipient_name text DEFAULT NULL,
  p_landmark text DEFAULT NULL,
  p_requested_delivery_date date DEFAULT NULL,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.customer_requests%rowtype;
  v_order_id uuid;
  v_tracking_number text;
  v_order_code text;
  v_final_tracking text;
  v_final_code text;
  v_exists integer;
BEGIN
  -- Staff check
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access required';
  END IF;

  -- Lock and validate request
  SELECT * INTO v_request FROM public.customer_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'approved' THEN
    RAISE EXCEPTION 'Request must be approved before conversion';
  END IF;

  IF v_request.confirmed_quote IS NULL OR v_request.confirmed_quote <= 0 THEN
    RAISE EXCEPTION 'Request must have a confirmed quote greater than 0';
  END IF;

  IF v_request.converted_order_id IS NOT NULL THEN
    RAISE EXCEPTION 'Request already converted to order';
  END IF;

  IF p_delivery_address IS NULL OR trim(p_delivery_address) = '' THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  -- Generate unique tracking number and order code
  -- Format: GF-{last 6 digits of timestamp} and WEB-{last 6 digits of timestamp}
  -- This mirrors the pattern from createStaffOrder in src/dashboard/data/orders.js
  -- Loop continues until BOTH tracking number AND order code are unused
  -- After 5 collisions, switch to random six-digit suffixes
  FOR attempt IN 1..10 LOOP
    IF attempt <= 5 THEN
      -- First 5 attempts: use timestamp-based suffixes
      v_tracking_number := 'GF-' || right((extract(epoch from clock_timestamp()) * 1000)::bigint::text, 6);
      v_order_code := 'WEB-' || right((extract(epoch from clock_timestamp()) * 1000)::bigint::text, 6);
    ELSE
      -- After 5 collisions: use random six-digit suffixes
      v_tracking_number := 'GF-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
      v_order_code := 'WEB-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    END IF;

    -- Check BOTH tracking number AND order code for uniqueness
    SELECT count(*) INTO v_exists FROM public.orders
    WHERE tracking_number = v_tracking_number OR order_code = v_order_code;

    EXIT WHEN v_exists = 0;
  END LOOP;

  v_final_tracking := v_tracking_number;
  v_final_code := v_order_code;

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
    payment_status,
    fulfillment_status,
    staff_order,
    customization_selections,
    admin_note
  ) VALUES (
    v_final_tracking,
    v_final_code,
    v_request.id,
    v_request.customer_name,
    v_request.email,
    v_request.phone,
    p_recipient_name,
    p_delivery_address,
    p_landmark,
    v_request.notes,
    v_request.card_message,
    v_request.card_style,
    p_requested_delivery_date,
    v_request.confirmed_quote,
    v_request.confirmed_quote,
    'staff',
    'pending',
    'pending_payment',
    true,
    v_request.selections,
    p_admin_note
  ) RETURNING id INTO v_order_id;

  -- Insert order event
  INSERT INTO public.order_events (order_id, stage, customer_note)
  VALUES (v_order_id, 'pending_payment', 'Created from request ' || v_request.reference);

  -- Update request
  UPDATE public.customer_requests
  SET
    status = 'converted',
    converted_at = now(),
    converted_order_id = v_order_id
  WHERE id = p_request_id;

  -- Insert notification
  INSERT INTO public.admin_notifications (type, title, body, route, record_id)
  VALUES (
    'new_order',
    'New converted order',
    v_final_tracking || ' · GHS ' || v_request.confirmed_quote,
    '/admin',
    v_order_id::text
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'tracking_number', v_final_tracking,
    'order_code', v_final_code
  );
END $$;

REVOKE ALL ON FUNCTION public.convert_request_to_order(uuid,text,text,text,date,text) FROM public;
REVOKE ALL ON FUNCTION public.convert_request_to_order(uuid,text,text,text,date,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.convert_request_to_order(uuid,text,text,text,date,text) TO authenticated;

COMMIT;

-- ============================================================================
-- SECTION 6: OPTIONAL delivery columns (COMMENTED OUT - DO NOT ACTIVATE)
-- ============================================================================
-- This section is a proposal for adding delivery_type and delivery_fee to orders.
-- It will be reviewed in T7 before activation. Do not uncomment without review.
--
-- Uncomment and run ONLY after T7 review and approval:
--
-- BEGIN;
--
-- ALTER TABLE public.orders
--   ADD COLUMN IF NOT EXISTS delivery_type text,
--   ADD COLUMN IF NOT EXISTS delivery_fee numeric;
--
-- COMMIT;
-- ============================================================================

-- ============================================================================
-- VERIFICATION CHECKS
-- ============================================================================
-- This final query verifies that all changes were applied correctly.
-- Run this after the file completes to confirm everything is in place.
-- Every row should show ok=true. If any row shows ok=false, investigate.

select check_name, coalesce(ok, false) as ok
from (
  select 'site_settings has the 5 new columns' as check_name,
    (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'site_settings'
        and column_name in ('delivery_selector_enabled','tracking_auto_refresh_enabled',
                            'tracking_refresh_interval_seconds','track_max_failed_attempts',
                            'track_lockout_minutes')) = 5 as ok

  union all
  select 'signin_log exists with RLS on',
    (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'signin_log')

  union all
  select 'signin_log has 3 policies',
    (select count(*) from pg_policies where schemaname = 'public' and tablename = 'signin_log') >= 3

  union all
  select 'track_attempts exists with RLS on and no policies',
    (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'track_attempts')
    and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'track_attempts')

  union all
  select 'track_record(text,text) exists and is security definer',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'track_record'
               and p.pronargs = 2 and p.prosecdef)

  union all
  select 'track_record is executable by anon',
    has_function_privilege('anon', to_regprocedure('public.track_record(text,text)'), 'EXECUTE')

  union all
  select 'convert_request_to_order exists and is security definer',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'convert_request_to_order'
               and p.pronargs = 6 and p.prosecdef)

  union all
  select 'convert_request_to_order is NOT executable by anon',
    not has_function_privilege('anon',
          to_regprocedure('public.convert_request_to_order(uuid,text,text,text,date,text)'), 'EXECUTE')

  union all
  select 'convert_request_to_order is executable by authenticated',
    has_function_privilege('authenticated',
          to_regprocedure('public.convert_request_to_order(uuid,text,text,text,date,text)'), 'EXECUTE')

  union all
  select 'orders.customization_selections exists',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'orders'
               and column_name = 'customization_selections')

  union all
  select 'customer_requests.converted_order_id exists',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'customer_requests'
               and column_name = 'converted_order_id')

  union all
  select 'orders is in the supabase_realtime publication',
    exists (select 1 from pg_publication_tables
             where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders')

  union all
  select 'admin_notifications is in the supabase_realtime publication',
    exists (select 1 from pg_publication_tables
             where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications')

  union all
  select 'site_content table exists',
    to_regclass('public.site_content') is not null
) checks
order by ok, check_name;
