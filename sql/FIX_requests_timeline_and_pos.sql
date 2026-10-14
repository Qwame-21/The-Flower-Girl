-- ============================================================================
-- FIX_requests_timeline_and_pos.sql
-- Safe to re-run (idempotent).
-- Uses IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF EXISTS throughout.
--
-- Changes:
--  1. Add received_at, quoted_at, closed_at to customer_requests.
--  2. Backfill existing rows.
--  3. Trigger trg_customer_requests_timeline that auto-stamps the columns
--     when status transitions occur.
--  4. Update track_record() to return all timeline timestamps.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Timeline timestamp columns on customer_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS received_at  timestamptz,
  ADD COLUMN IF NOT EXISTS quoted_at    timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at    timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Backfill existing rows
-- ---------------------------------------------------------------------------

-- received_at: every row should have this; default to created_at
UPDATE public.customer_requests
  SET received_at = created_at
  WHERE received_at IS NULL;

-- quoted_at: rows already in quote_needed / approved / converted but missing quoted_at
UPDATE public.customer_requests
  SET quoted_at = COALESCE(updated_at, created_at)
  WHERE quoted_at IS NULL
    AND status IN ('quote_needed', 'approved', 'converted');

-- approved_at: rows already in approved / converted but missing approved_at
UPDATE public.customer_requests
  SET approved_at = COALESCE(updated_at, created_at)
  WHERE approved_at IS NULL
    AND status IN ('approved', 'converted');

-- converted_at: rows already converted but missing converted_at
UPDATE public.customer_requests
  SET converted_at = COALESCE(updated_at, created_at)
  WHERE converted_at IS NULL
    AND status = 'converted';

-- closed_at: rows already closed but missing closed_at
UPDATE public.customer_requests
  SET closed_at = COALESCE(updated_at, created_at)
  WHERE closed_at IS NULL
    AND status = 'closed';

-- ---------------------------------------------------------------------------
-- 3. Trigger function — auto-stamps timeline columns on status transitions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stamp_customer_request_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always stamp received_at on INSERT
  IF TG_OP = 'INSERT' THEN
    NEW.received_at := COALESCE(NEW.received_at, NOW());
  END IF;

  -- quoted_at: stamp when status first moves to quote_needed (or further)
  IF NEW.status IN ('quote_needed', 'approved', 'converted') AND NEW.quoted_at IS NULL THEN
    NEW.quoted_at := NOW();
  END IF;

  -- approved_at: stamp when status first moves to approved (or converted)
  IF NEW.status IN ('approved', 'converted') AND NEW.approved_at IS NULL THEN
    NEW.approved_at := NOW();
  END IF;

  -- converted_at: stamp when status first moves to converted
  IF NEW.status = 'converted' AND NEW.converted_at IS NULL THEN
    NEW.converted_at := NOW();
  END IF;

  -- closed_at: stamp when status moves to closed
  IF NEW.status = 'closed' AND NEW.closed_at IS NULL THEN
    NEW.closed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_requests_timeline ON public.customer_requests;
CREATE TRIGGER trg_customer_requests_timeline
  BEFORE INSERT OR UPDATE OF status ON public.customer_requests
  FOR EACH ROW EXECUTE FUNCTION public.stamp_customer_request_timeline();

-- ---------------------------------------------------------------------------
-- 4. Update track_record() to return all timeline timestamps + fix field names
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_record(lookup_reference text, lookup_contact text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
DECLARE
  result           jsonb;
  clean_ref        text := upper(trim(regexp_replace(lookup_reference, '\s+', '', 'g')));
  normalized_lookup text := public.normalize_phone(lookup_contact);
BEGIN
  -- Orders: match order_code or tracking_number
  SELECT jsonb_build_object(
    'kind',                 'order',
    'trackingNumber',       o.tracking_number,
    'orderCode',            o.order_code,
    'customerName',         o.customer_name,
    'recipientName',        o.recipient_name,
    'status',               o.fulfillment_status,
    'paymentStatus',        o.payment_status,
    'estimatedDelivery',    o.estimated_delivery,
    'requestedDeliveryDate', o.requested_delivery_date,
    'deliveryType',         o.delivery_type,
    'deliveryWindow',       o.delivery_window,
    'adminNote',            o.admin_note,
    'createdAt',            o.created_at,
    'events', COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object('stage', e.stage, 'note', e.customer_note, 'createdAt', e.created_at)
         ORDER BY e.created_at
       ) FROM public.order_events e WHERE e.order_id = o.id),
      '[]'::jsonb
    )
  ) INTO result
  FROM public.orders o
  WHERE (upper(o.tracking_number) = clean_ref OR upper(o.order_code) = clean_ref)
    AND (
      lower(coalesce(o.customer_email,'')) = lower(trim(lookup_contact))
      OR public.normalize_phone(o.customer_phone) = normalized_lookup
    )
  LIMIT 1;

  IF result IS NOT NULL THEN RETURN result; END IF;

  -- Customer requests: match short_code first, fall back to long reference
  SELECT jsonb_build_object(
    'kind',            'request',
    'reference',       COALESCE(r.short_code, r.reference),
    'longReference',   r.reference,
    'shortCode',       r.short_code,
    'customerName',    r.customer_name,
    'requestType',     r.request_type,
    'service',         r.service,
    'occasion',        r.occasion,
    'status',          r.status,
    'preferredDate',   r.preferred_date,
    'confirmedQuote',  r.confirmed_quote,
    'adminNote',       r.admin_note,
    'updatedAt',       r.updated_at,
    'createdAt',       r.created_at,
    'receivedAt',      r.received_at,
    'quotedAt',        r.quoted_at,
    'approvedAt',      r.approved_at,
    'convertedAt',     r.converted_at,
    'closedAt',        r.closed_at,
    'selections',      r.selections,
    'quantity',        r.quantity,
    'fulfilment',      r.fulfilment,
    'budget',          r.budget
  ) INTO result
  FROM public.customer_requests r
  WHERE (
    (r.short_code IS NOT NULL AND upper(r.short_code) = clean_ref)
    OR upper(r.reference) = clean_ref
  )
  AND (
    lower(coalesce(r.email,'')) = lower(trim(lookup_contact))
    OR public.normalize_phone(r.phone) = normalized_lookup
  )
  LIMIT 1;

  RETURN result;
END $fn$;

REVOKE ALL ON FUNCTION public.track_record(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.track_record(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Retention purge RPC function (staff-only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_expired_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retention TEXT := '30days';
  v_cutoff TIMESTAMPTZ;
  v_deleted INT := 0;
  v_sub_count INT := 0;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access denied: staff permission required';
  END IF;

  BEGIN
    SELECT retention_period INTO v_retention FROM public.log_settings WHERE id = 1;
  EXCEPTION WHEN OTHERS THEN
    v_retention := '30days';
  END;

  IF v_retention = 'today' THEN
    v_cutoff := date_trunc('day', NOW());
  ELSIF v_retention = '7days' THEN
    v_cutoff := NOW() - INTERVAL '7 days';
  ELSE
    v_cutoff := NOW() - INTERVAL '30 days';
  END IF;

  BEGIN
    DELETE FROM public.activity_log WHERE created_at < v_cutoff;
    GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;
  EXCEPTION WHEN OTHERS THEN END;

  BEGIN
    DELETE FROM public.completed_orders_log WHERE created_at < v_cutoff;
    GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;
  EXCEPTION WHEN OTHERS THEN END;

  BEGIN
    DELETE FROM public.signin_log WHERE created_at < v_cutoff;
    GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;
  EXCEPTION WHEN OTHERS THEN END;

  BEGIN
    DELETE FROM public.failed_logins WHERE attempted_at < v_cutoff;
    GET DIAGNOSTICS v_sub_count = ROW_COUNT; v_deleted := v_deleted + v_sub_count;
  EXCEPTION WHEN OTHERS THEN END;

  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_logs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_expired_logs() TO authenticated;

COMMIT;
