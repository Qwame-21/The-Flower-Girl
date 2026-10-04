-- ============================================================================
-- LIVE FEATURES SQL - Flower Girl Slay Empire Integration
-- ============================================================================
-- This SQL is re-runnable (IF NOT EXISTS, CREATE OR REPLACE)
-- Do NOT apply without review - this is a draft, not applied yet
--
-- RUN ORDER:
-- 1. signin_log table creation
-- 2. site_settings new columns
-- 3. track_attempts table creation
-- 4. track_record RPC replacement with rate limiting
-- 5. Realtime publication additions
-- 6. orders customization columns
-- 7. customer_requests converted_order_id column
-- 8. convert_request_to_order RPC creation
--
-- ROLLBACK NOTES:
-- - Drop track_attempts table
-- - Revert track_record to original version (from migration 20261002120000)
-- - Remove new columns from site_settings, orders, customer_requests
-- - Drop convert_request_to_order function
-- ============================================================================

BEGIN;

-- 1. Create signin_log table if missing
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
CREATE POLICY IF NOT EXISTS "staff reads signin_log"
  ON public.signin_log FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Policy: Authenticated staff can insert their own rows
CREATE POLICY IF NOT EXISTS "staff inserts own signin_log"
  ON public.signin_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

-- Policy: Authenticated staff can update their own rows
CREATE POLICY IF NOT EXISTS "staff updates own signin_log"
  ON public.signin_log FOR UPDATE
  TO authenticated
  USING (public.is_staff() AND user_id = auth.uid())
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

-- 2. Add new columns to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS delivery_selector_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_auto_refresh_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tracking_refresh_interval_seconds integer NOT NULL DEFAULT 10 CHECK (tracking_refresh_interval_seconds >= 3 AND tracking_refresh_interval_seconds <= 60),
  ADD COLUMN IF NOT EXISTS track_max_failed_attempts integer NOT NULL DEFAULT 10 CHECK (track_max_failed_attempts >= 1 AND track_max_failed_attempts <= 100),
  ADD COLUMN IF NOT EXISTS track_lockout_minutes integer NOT NULL DEFAULT 15 CHECK (track_lockout_minutes >= 1 AND track_lockout_minutes <= 60);

-- 3. Create track_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.track_attempts (
  client_key text PRIMARY KEY,
  failed_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

-- Enable RLS on track_attempts (no policies - function manages access)
ALTER TABLE public.track_attempts ENABLE ROW LEVEL SECURITY;

-- 4. Replace track_record RPC with rate limiting version
-- Preserves ALL existing behavior, adds rate limiting for FAILED lookups only
CREATE OR REPLACE FUNCTION public.track_record(lookup_reference text, lookup_contact text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  normalized_lookup_phone text;
  -- Rate limiting variables
  client_key text;
  rate_limit_rec public.track_attempts%rowtype;
  max_attempts integer;
  lockout_minutes integer;
  lookup_failed boolean := false;
BEGIN
  normalized_lookup_phone := public.normalize_phone(lookup_contact);
  
  -- Extract client key from headers safely
  BEGIN
    client_key := coalesce(
      current_setting('request.headers', true)::jsonb->>'cf-connecting-ip',
      (current_setting('request.headers', true)::jsonb->>'x-forwarded-for')::text[])[1],
      'unknown'
    );
    -- Clean up: take first IP if comma-separated, truncate to 255 chars
    client_key := left(split_part(client_key, ',', 1), 255);
  EXCEPTION WHEN OTHERS THEN
    client_key := 'unknown';
  END;
  
  -- Read rate limit settings from site_settings with safe defaults
  BEGIN
    SELECT 
      coalesce(track_max_failed_attempts, 10),
      coalesce(track_lockout_minutes, 15)
    INTO max_attempts, lockout_minutes
    FROM public.site_settings
    WHERE id = 'global';
  EXCEPTION WHEN OTHERS THEN
    max_attempts := 10;
    lockout_minutes := 15;
  END;
  
  -- Check if client is locked out
  SELECT * INTO rate_limit_rec FROM public.track_attempts WHERE client_key = client_key;
  
  IF FOUND AND rate_limit_rec.locked_until IS NOT NULL AND rate_limit_rec.locked_until > now() THEN
    -- Client is locked out
    RETURN jsonb_build_object(
      'kind', 'rate_limited',
      'retryAfterSeconds', extract(epoch from (rate_limit_rec.locked_until - now()))::integer
    );
  END IF;
  
  -- Try to find order first
  SELECT jsonb_build_object(
    'kind','order','trackingNumber',o.tracking_number,'orderCode',o.order_code,'customerName',o.customer_name,
    'status',o.fulfillment_status,'paymentStatus',o.payment_status,
    'estimatedDelivery',o.estimated_delivery,'adminNote',o.admin_note,
    'requestedDeliveryDate',o.requested_delivery_date,
    'events',coalesce((select jsonb_agg(jsonb_build_object('stage',e.stage,'note',e.customer_note,'createdAt',e.created_at) order by e.created_at) from public.order_events e where e.order_id=o.id),'[]'::jsonb)
  ) INTO result FROM public.orders o
  WHERE (lower(o.tracking_number)=lower(trim(lookup_reference)) or lower(o.order_code)=lower(trim(lookup_reference)))
    and (lower(coalesce(o.customer_email,''))=lower(trim(lookup_contact)) or public.normalize_phone(o.customer_phone)=normalized_lookup_phone)
  LIMIT 1;
  
  IF result IS NOT NULL THEN
    -- Successful lookup - do NOT count against rate limit
    RETURN result;
  END IF;
  
  -- Try to find request
  SELECT jsonb_build_object(
    'kind','request','reference',r.reference,'customerName',r.customer_name,
    'requestType',r.request_type,'service',r.service,'status',r.status,
    'preferredDate',r.preferred_date,'confirmedQuote',r.confirmed_quote,
    'adminNote',r.admin_note,'updatedAt',r.updated_at
  ) INTO result FROM public.customer_requests r
  WHERE lower(r.reference)=lower(trim(lookup_reference))
    and (lower(coalesce(r.email,''))=lower(trim(lookup_contact)) or public.normalize_phone(r.phone)=normalized_lookup_phone)
  LIMIT 1;
  
  IF result IS NOT NULL THEN
    -- Successful lookup - do NOT count against rate limit
    RETURN result;
  END IF;
  
  -- Lookup failed - increment rate limit counter
  lookup_failed := true;
  
  -- Insert or update rate limit record
  INSERT INTO public.track_attempts (client_key, failed_count, window_started_at, locked_until)
  VALUES (client_key, 1, now(), NULL)
  ON CONFLICT (client_key) DO UPDATE SET
    failed_count = CASE
      WHEN locked_until IS NOT NULL AND locked_until > now() THEN failed_count
      WHEN window_started_at < now() - (lockout_minutes || ' minutes')::interval THEN 1
      ELSE failed_count + 1
    END,
    window_started_at = CASE
      WHEN window_started_at < now() - (lockout_minutes || ' minutes')::interval THEN now()
      ELSE window_started_at
    END,
    locked_until = CASE
      WHEN locked_until IS NOT NULL AND locked_until > now() THEN locked_until
      WHEN failed_count + 1 >= max_attempts THEN now() + (lockout_minutes || ' minutes')::interval
      ELSE NULL
    END;
  
  -- Return not found result
  RETURN jsonb_build_object('kind', 'not_found');
  
EXCEPTION WHEN OTHERS THEN
  -- On any error, return not found to avoid exposing internals
  RETURN jsonb_build_object('kind', 'not_found');
END $$;

REVOKE ALL ON FUNCTION public.track_record(text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.track_record(text,text) TO anon, authenticated;

-- 5. Add orders and admin_notifications to realtime publication (guarded)
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

-- 6. Add customization columns to orders table
-- Use existing request_id as the link back, do not add original_request_id
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customization_selections jsonb NOT NULL DEFAULT '[]';

-- 7. Add converted_order_id to customer_requests
ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

-- 8. Create convert_request_to_order RPC
-- Staff-only function to convert approved requests to orders
-- Mirrors createStaffOrder pattern from src/dashboard/data/orders.js
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
  v_timestamp bigint;
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
  -- Loop until both are unique (mirrors createStaffOrder pattern)
  LOOP
    v_timestamp := extract(epoch from now()) * 1000::bigint;
    v_tracking_number := 'GF-' || right(v_timestamp::text, 6);
    v_order_code := 'WEB-' || right(v_timestamp::text, 6);
    
    SELECT count(*) INTO v_exists FROM public.orders WHERE tracking_number = v_tracking_number;
    EXIT WHEN v_exists = 0;
    
    SELECT count(*) INTO v_exists FROM public.orders WHERE order_code = v_order_code;
    EXIT WHEN v_exists = 0;
    
    -- Small delay to avoid timestamp collision
    PERFORM pg_sleep(0.01);
  END LOOP;
  
  v_final_tracking := v_tracking_number;
  v_final_code := v_order_code;
  
  -- Insert order (mirrors createStaffOrder structure)
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
    location_link,
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
    NULL,
    v_request.notes,
    v_request.card_message,
    v_request.card_style,
    p_requested_delivery_date,
    v_request.confirmed_quote,
    v_request.confirmed_quote,
    'staff',
    NULL,
    'pending',
    'packaging',
    true,
    v_request.selections,
    p_admin_note
  ) RETURNING id INTO v_order_id;
  
  -- Insert order event
  INSERT INTO public.order_events (order_id, stage, customer_note)
  VALUES (v_order_id, 'paid', 'Created from request ' || v_request.reference);
  
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
GRANT EXECUTE ON FUNCTION public.convert_request_to_order(uuid,text,text,text,date,text) TO authenticated;

COMMIT;
