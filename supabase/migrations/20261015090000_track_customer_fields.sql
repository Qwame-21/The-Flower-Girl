BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS order_code text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS location_link text,
  ADD COLUMN IF NOT EXISTS fulfillment_status text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS estimated_delivery timestamptz,
  ADD COLUMN IF NOT EXISTS requested_delivery_date date,
  ADD COLUMN IF NOT EXISTS delivery_type text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_window text,
  ADD COLUMN IF NOT EXISTS customer_note text,
  ADD COLUMN IF NOT EXISTS card_message text,
  ADD COLUMN IF NOT EXISTS card_style text,
  ADD COLUMN IF NOT EXISTS customization_selections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;

ALTER TABLE public.order_events
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.customer_requests
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS short_code text,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS request_type text,
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS occasion text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS preferred_date date,
  ADD COLUMN IF NOT EXISTS confirmed_quote numeric(12,2),
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS selections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS fulfilment text,
  ADD COLUMN IF NOT EXISTS recipient text,
  ADD COLUMN IF NOT EXISTS recipient_phone text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS location_link text,
  ADD COLUMN IF NOT EXISTS delivery_instructions text,
  ADD COLUMN IF NOT EXISTS delivery_type text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2),
  ADD COLUMN IF NOT EXISTS delivery_window text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS card_message text,
  ADD COLUMN IF NOT EXISTS card_style text,
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  route text,
  record_id text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS route text,
  ADD COLUMN IF NOT EXISTS record_id text,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

UPDATE public.orders
SET customer_note = admin_note
WHERE (customer_note IS NULL OR btrim(customer_note) = '')
  AND admin_note IS NOT NULL
  AND btrim(admin_note) <> ''
  AND admin_note ~* '(gift[[:space:]]*card|card[[:space:]]*style)[[:space:]]*:';

CREATE OR REPLACE FUNCTION public.normalize_phone(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT PARALLEL SAFE
SET search_path = public
AS $fn$
DECLARE
  digits text;
BEGIN
  digits := regexp_replace(phone, '[^0-9]', '', 'g');
  IF digits LIKE '00%' THEN
    digits := substring(digits FROM 3);
  END IF;
  IF digits LIKE '233%' AND length(digits) >= 12 THEN
    digits := substring(digits FROM 4);
  END IF;
  IF digits LIKE '0%' THEN
    digits := substring(digits FROM 2);
  END IF;
  RETURN digits;
END
$fn$;

CREATE OR REPLACE FUNCTION public.track_record(lookup_reference text, lookup_contact text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result jsonb;
  clean_ref text := regexp_replace(upper(trim(coalesce(lookup_reference, ''))), '\s+', '', 'g');
  normalized_lookup text := public.normalize_phone(coalesce(lookup_contact, ''));
BEGIN
  SELECT jsonb_build_object(
    'kind', 'order',
    'trackingNumber', o.tracking_number,
    'orderCode', o.order_code,
    'customerName', o.customer_name,
    'customerPhone', o.customer_phone,
    'customerEmail', o.customer_email,
    'recipientName', o.recipient_name,
    'deliveryAddress', o.delivery_address,
    'landmark', o.landmark,
    'locationLink', o.location_link,
    'status', o.fulfillment_status,
    'paymentStatus', o.payment_status,
    'estimatedDelivery', o.estimated_delivery,
    'requestedDeliveryDate', o.requested_delivery_date,
    'deliveryType', o.delivery_type,
    'deliveryFee', o.delivery_fee,
    'deliveryWindow', o.delivery_window,
    'customerNote', o.customer_note,
    'cardMessage', o.card_message,
    'cardStyle', o.card_style,
    'customizationSelections', coalesce(o.customization_selections, '[]'::jsonb),
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object('name', item.item_name, 'quantity', item.quantity) ORDER BY item.id)
      FROM public.order_items item
      WHERE item.order_id = o.id
    ), '[]'::jsonb),
    'staffNote', o.admin_note,
    'createdAt', o.created_at,
    'events', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object('stage', event.stage, 'createdAt', event.created_at)
        ORDER BY event.created_at
      )
      FROM public.order_events event
      WHERE event.order_id = o.id
    ), '[]'::jsonb)
  ) INTO result
  FROM public.orders o
  WHERE (upper(o.tracking_number) = clean_ref OR upper(o.order_code) = clean_ref)
    AND (
      lower(coalesce(o.customer_email, '')) = lower(trim(coalesce(lookup_contact, '')))
      OR public.normalize_phone(o.customer_phone) = normalized_lookup
    )
  LIMIT 1;

  IF result IS NOT NULL THEN
    RETURN result;
  END IF;

  SELECT jsonb_build_object(
    'kind', 'request',
    'reference', coalesce(r.short_code, r.reference),
    'shortCode', r.short_code,
    'customerName', r.customer_name,
    'customerPhone', r.phone,
    'customerEmail', r.email,
    'requestType', r.request_type,
    'service', r.service,
    'occasion', r.occasion,
    'status', r.status,
    'preferredDate', r.preferred_date,
    'confirmedQuote', r.confirmed_quote,
    'staffNote', r.admin_note,
    'createdAt', r.created_at,
    'receivedAt', r.received_at,
    'quotedAt', r.quoted_at,
    'approvedAt', r.approved_at,
    'convertedAt', r.converted_at,
    'closedAt', r.closed_at,
    'updatedAt', r.updated_at,
    'selections', coalesce(r.selections, '[]'::jsonb),
    'quantity', r.quantity,
    'fulfilment', r.fulfilment,
    'deliveryType', r.delivery_type,
    'deliveryFee', r.delivery_fee,
    'deliveryWindow', r.delivery_window,
    'city', r.city,
    'recipient', r.recipient,
    'recipientPhone', r.recipient_phone,
    'deliveryAddress', r.delivery_address,
    'landmark', r.landmark,
    'locationLink', r.location_link,
    'deliveryInstructions', r.delivery_instructions,
    'budget', r.budget,
    'notes', r.notes,
    'cardMessage', r.card_message,
    'cardStyle', r.card_style
  ) INTO result
  FROM public.customer_requests r
  WHERE (
      (r.short_code IS NOT NULL AND upper(r.short_code) = clean_ref)
      OR upper(r.reference) = clean_ref
    )
    AND (
      lower(coalesce(r.email, '')) = lower(trim(coalesce(lookup_contact, '')))
      OR public.normalize_phone(r.phone) = normalized_lookup
    )
  LIMIT 1;

  RETURN result;
END
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_customer_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $notification$
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, route, record_id)
  VALUES (
    'new_request',
    'New customer request from ' || coalesce(NEW.customer_name, 'Customer'),
    'Type: ' || coalesce(NEW.request_type, 'Custom request'),
    '/admin',
    NEW.id::text
  );
  RETURN NEW;
END
$notification$;

DROP TRIGGER IF EXISTS on_new_customer_request ON public.customer_requests;
CREATE TRIGGER on_new_customer_request
  AFTER INSERT ON public.customer_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_customer_request();

REVOKE ALL ON FUNCTION public.track_record(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.track_record(text, text) TO anon, authenticated;

DO $publication$
DECLARE
  table_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH table_name IN ARRAY ARRAY['customer_requests', 'admin_notifications']
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = table_name
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
      END IF;
    END LOOP;
  END IF;
END
$publication$;

NOTIFY pgrst, 'reload schema';
COMMIT;
