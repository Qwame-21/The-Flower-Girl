-- ============================================================================
-- FIX_requests_flow.sql
-- Safe to re-run (idempotent).
-- Uses IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS throughout.
--
-- Problems fixed:
--  1. normalize_phone() declared LANGUAGE sql but used PL/pgSQL DECLARE/BEGIN
--     syntax - broken stub caused track_record() to fail for all requests.
--  2. customer_requests had no structured delivery columns; edge function stored
--     everything as a blob in `notes`. Added 8 dedicated columns.
--  3. short_code column (RQ-XXXXXX, 6 unambiguous chars) for human-readable
--     references. Old long codes kept in `reference`; new rows also have a
--     short_code. track_record() matches both.
--  4. convert_request_to_order() RPC ensured present (idempotent).
--  5. notify_new_customer_request() updated to use short code.
--  6. Realtime publication verified.
--
-- Seed data: RQ-0000000000004000 ("Test User") is NOT touched by this migration.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Structured delivery/fulfilment columns on customer_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS fulfilment            text,
  ADD COLUMN IF NOT EXISTS delivery_address      text,
  ADD COLUMN IF NOT EXISTS recipient             text,
  ADD COLUMN IF NOT EXISTS recipient_phone       text,
  ADD COLUMN IF NOT EXISTS landmark              text,
  ADD COLUMN IF NOT EXISTS location_link         text,
  ADD COLUMN IF NOT EXISTS delivery_instructions text,
  ADD COLUMN IF NOT EXISTS budget                text;

-- ---------------------------------------------------------------------------
-- 2. Short code column (NULL for existing rows, populated for new inserts)
-- ---------------------------------------------------------------------------
ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS short_code text;

-- Partial unique index: NULLs are excluded so old rows can have NULL
CREATE UNIQUE INDEX IF NOT EXISTS customer_requests_short_code_key
  ON public.customer_requests (short_code)
  WHERE short_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. converted_order_id (also in MASTER_UPDATE.sql - idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS converted_order_id uuid
    REFERENCES public.orders(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. Short-code generator: 6 chars from unambiguous alphabet (no 0,O,1,I,L)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_short_code(prefix text DEFAULT 'RQ')
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $fn$
DECLARE
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  alen     int  := 31;
  code     text := '';
  i        int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(alphabet, (floor(random() * alen)::int + 1), 1);
  END LOOP;
  RETURN prefix || '-' || code;
END $fn$;

-- ---------------------------------------------------------------------------
-- 5. FIX normalize_phone
--    Root cause: the migration declared it LANGUAGE sql but the body uses
--    PL/pgSQL DECLARE/BEGIN - this is a hard syntax error. The function may
--    have been silently dropped or stored as a broken stub, causing every
--    track_record() call for requests to throw an error and return nothing.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_phone(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT PARALLEL SAFE
SET search_path = public
AS $fn$
DECLARE
  digits text;
BEGIN
  -- Strip every non-digit character
  digits := regexp_replace(phone, '[^0-9]', '', 'g');
  -- Drop leading 00 (international prefix e.g. 00233...)
  IF digits LIKE '00%' THEN
    digits := substring(digits FROM 3);
  END IF;
  -- Drop Ghana country code 233 when present (result must be >= 9 digits)
  IF digits LIKE '233%' AND length(digits) >= 12 THEN
    digits := substring(digits FROM 4);
  END IF;
  -- Drop leading 0 (local dial prefix e.g. 0241234567)
  IF digits LIKE '0%' THEN
    digits := substring(digits FROM 2);
  END IF;
  RETURN digits;
END $fn$;

-- ---------------------------------------------------------------------------
-- 6. Updated track_record
--    - LANGUAGE plpgsql (not sql)
--    - Matches short_code OR long reference (case-insensitive, spaces stripped)
--    - Returns richer request payload for the tracking page
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_record(lookup_reference text, lookup_contact text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  result            jsonb;
  normalized_lookup text;
  clean_ref         text;
BEGIN
  normalized_lookup := public.normalize_phone(lookup_contact);
  -- Uppercase, strip spaces (handles "RQ- 48K2F9" typed with a space)
  clean_ref := regexp_replace(upper(trim(lookup_reference)), '\s+', '', 'g');

  -- Orders (unchanged logic, just re-expressed clearly)
  SELECT jsonb_build_object(
    'kind',                  'order',
    'trackingNumber',        o.tracking_number,
    'orderCode',             o.order_code,
    'customerName',          o.customer_name,
    'status',                o.fulfillment_status,
    'paymentStatus',         o.payment_status,
    'estimatedDelivery',     o.estimated_delivery,
    'adminNote',             o.admin_note,
    'requestedDeliveryDate', o.requested_delivery_date,
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
    'kind',           'request',
    'reference',      COALESCE(r.short_code, r.reference),
    'longReference',  r.reference,
    'shortCode',      r.short_code,
    'customerName',   r.customer_name,
    'requestType',    r.request_type,
    'service',        r.service,
    'occasion',       r.occasion,
    'status',         r.status,
    'preferredDate',  r.preferred_date,
    'confirmedQuote', r.confirmed_quote,
    'adminNote',      r.admin_note,
    'updatedAt',      r.updated_at,
    'createdAt',      r.created_at,
    'selections',     r.selections,
    'quantity',       r.quantity,
    'fulfilment',     r.fulfilment,
    'budget',         r.budget
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
-- 7. customization_selections on orders (idempotent, from MASTER_UPDATE)
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customization_selections jsonb NOT NULL DEFAULT '[]';

-- ---------------------------------------------------------------------------
-- 8. convert_request_to_order (staff-only; security definer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.convert_request_to_order(
  p_request_id              uuid,
  p_delivery_address        text,
  p_recipient_name          text DEFAULT NULL,
  p_landmark                text DEFAULT NULL,
  p_requested_delivery_date date DEFAULT NULL,
  p_admin_note              text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_req      public.customer_requests%rowtype;
  v_order_id uuid;
  v_tracking text;
  v_code     text;
  v_exists   int;
  attempt    int := 0;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access required';
  END IF;

  SELECT * INTO v_req FROM public.customer_requests
  WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'approved' THEN
    RAISE EXCEPTION 'Request must be approved before conversion';
  END IF;
  IF v_req.confirmed_quote IS NULL OR v_req.confirmed_quote <= 0 THEN
    RAISE EXCEPTION 'Request must have a confirmed quote';
  END IF;
  IF v_req.converted_order_id IS NOT NULL THEN
    RAISE EXCEPTION 'Request already converted';
  END IF;
  IF p_delivery_address IS NULL OR trim(p_delivery_address) = '' THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  -- Generate unique GF-/WEB- codes with retry
  LOOP
    attempt := attempt + 1;
    IF attempt <= 5 THEN
      v_tracking := 'GF-'  || right((extract(epoch FROM clock_timestamp()) * 1000)::bigint::text, 6);
      v_code     := 'WEB-' || right((extract(epoch FROM clock_timestamp()) * 1000)::bigint::text, 6);
    ELSE
      v_tracking := 'GF-'  || lpad((floor(random() * 1000000))::int::text, 6, '0');
      v_code     := 'WEB-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    END IF;
    SELECT count(*) INTO v_exists FROM public.orders
    WHERE tracking_number = v_tracking OR order_code = v_code;
    EXIT WHEN v_exists = 0 OR attempt >= 10;
  END LOOP;

  INSERT INTO public.orders (
    tracking_number, order_code, request_id,
    customer_name, customer_email, customer_phone,
    recipient_name, delivery_address, landmark,
    customer_note, card_message, card_style,
    requested_delivery_date, subtotal, total,
    payment_provider, payment_status, fulfillment_status,
    staff_order, customization_selections, admin_note
  ) VALUES (
    v_tracking, v_code, v_req.id,
    v_req.customer_name, v_req.email, v_req.phone,
    COALESCE(p_recipient_name, v_req.recipient),
    p_delivery_address,
    COALESCE(p_landmark, v_req.landmark),
    v_req.notes,
    v_req.card_message, v_req.card_style,
    p_requested_delivery_date,
    v_req.confirmed_quote, v_req.confirmed_quote,
    'staff', 'pending', 'pending_payment',
    true, v_req.selections, p_admin_note
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_events (order_id, stage, customer_note)
  VALUES (v_order_id, 'pending_payment',
          'Created from request ' || COALESCE(v_req.short_code, v_req.reference));

  UPDATE public.customer_requests
  SET status = 'converted', converted_at = now(), converted_order_id = v_order_id
  WHERE id = p_request_id;

  INSERT INTO public.admin_notifications (type, title, body, route, record_id)
  VALUES ('new_order', 'Request converted to order',
          v_tracking || ' · GHS ' || v_req.confirmed_quote, '/admin', v_order_id::text);

  RETURN jsonb_build_object(
    'success', true, 'order_id', v_order_id,
    'tracking_number', v_tracking, 'order_code', v_code
  );
END $fn$;

REVOKE ALL ON FUNCTION public.convert_request_to_order(uuid,text,text,text,date,text) FROM public;
REVOKE ALL ON FUNCTION public.convert_request_to_order(uuid,text,text,text,date,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.convert_request_to_order(uuid,text,text,text,date,text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. notify_new_customer_request: use short_code when available
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_customer_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, route, record_id)
  VALUES (
    'new_request',
    'New request from ' || new.customer_name,
    COALESCE(new.short_code, new.reference)
      || ' · ' || COALESCE(new.occasion, new.service, new.request_type),
    '/admin',
    new.id::text
  );
  RETURN new;
END $fn$;

DROP TRIGGER IF EXISTS on_new_customer_request ON public.customer_requests;
CREATE TRIGGER on_new_customer_request
  AFTER INSERT ON public.customer_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_customer_request();

-- ---------------------------------------------------------------------------
-- 10. Realtime publication for customer_requests
-- ---------------------------------------------------------------------------
DO $pub$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'customer_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_requests;
  END IF;
END $pub$;

-- ---------------------------------------------------------------------------
-- Verification queries (uncomment and run after applying):
--   select public.normalize_phone('+233241234567');  -- expect: 241234567
--   select public.normalize_phone('0241234567');     -- expect: 241234567
--   select public.normalize_phone('233241234567');   -- expect: 241234567
--   select public.generate_short_code('RQ');         -- e.g. RQ-4A8KFJ
--   select short_code, reference, customer_name from public.customer_requests limit 5;
-- ---------------------------------------------------------------------------

COMMIT;
