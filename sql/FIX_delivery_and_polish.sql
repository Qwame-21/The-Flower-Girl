-- =============================================================================
-- FIX: Delivery Types, Fees, Settings, Backfill & Window Tracking
-- File: sql/FIX_delivery_and_polish.sql
-- Project: Flower Girl / The Gifting Factory (lvciyxnafwhrtrgmmjxw)
-- Safe to run in Supabase SQL Editor. Fully idempotent and re-runnable.
-- =============================================================================

-- =============================================================================
-- SECTION 1: Ensure site_settings Delivery Columns and Default Values Exist
-- =============================================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS delivery_selector_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_sameday_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_sameday_fee numeric(12,2) NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS delivery_scheduled_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_scheduled_fee numeric(12,2) NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS delivery_surprise_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_surprise_fee numeric(12,2) NOT NULL DEFAULT 140,
  ADD COLUMN IF NOT EXISTS delivery_collection_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_collection_fee numeric(12,2) NOT NULL DEFAULT 0;

-- Ensure the 'global' row in site_settings exists with delivery defaults.
-- We must supply every NOT NULL column that has no server-side default.
-- ON CONFLICT DO UPDATE only patches the delivery columns so it never
-- overwrites business_name or any other existing setting.
INSERT INTO public.site_settings (
  id,
  business_name,
  delivery_selector_enabled,
  delivery_sameday_enabled,
  delivery_sameday_fee,
  delivery_scheduled_enabled,
  delivery_scheduled_fee,
  delivery_surprise_enabled,
  delivery_surprise_fee,
  delivery_collection_enabled,
  delivery_collection_fee
) VALUES (
  'global',
  'The Gifting Factory',   -- safe placeholder; only used if the row does not exist yet
  true,
  true,
  120,
  true,
  90,
  true,
  140,
  true,
  0
) ON CONFLICT (id) DO UPDATE SET
  delivery_selector_enabled   = COALESCE(public.site_settings.delivery_selector_enabled, EXCLUDED.delivery_selector_enabled),
  delivery_sameday_enabled    = COALESCE(public.site_settings.delivery_sameday_enabled, EXCLUDED.delivery_sameday_enabled),
  delivery_sameday_fee        = COALESCE(public.site_settings.delivery_sameday_fee, EXCLUDED.delivery_sameday_fee),
  delivery_scheduled_enabled  = COALESCE(public.site_settings.delivery_scheduled_enabled, EXCLUDED.delivery_scheduled_enabled),
  delivery_scheduled_fee      = COALESCE(public.site_settings.delivery_scheduled_fee, EXCLUDED.delivery_scheduled_fee),
  delivery_surprise_enabled   = COALESCE(public.site_settings.delivery_surprise_enabled, EXCLUDED.delivery_surprise_enabled),
  delivery_surprise_fee       = COALESCE(public.site_settings.delivery_surprise_fee, EXCLUDED.delivery_surprise_fee),
  delivery_collection_enabled = COALESCE(public.site_settings.delivery_collection_enabled, EXCLUDED.delivery_collection_enabled),
  delivery_collection_fee     = COALESCE(public.site_settings.delivery_collection_fee, EXCLUDED.delivery_collection_fee);
  -- Note: business_name is deliberately NOT updated here — existing value is kept.


-- In case existing columns had nulls, update to correct defaults
UPDATE public.site_settings
SET
  delivery_selector_enabled   = COALESCE(delivery_selector_enabled, true),
  delivery_sameday_enabled    = COALESCE(delivery_sameday_enabled, true),
  delivery_sameday_fee        = COALESCE(delivery_sameday_fee, 120),
  delivery_scheduled_enabled  = COALESCE(delivery_scheduled_enabled, true),
  delivery_scheduled_fee      = COALESCE(delivery_scheduled_fee, 90),
  delivery_surprise_enabled   = COALESCE(delivery_surprise_enabled, true),
  delivery_surprise_fee       = COALESCE(delivery_surprise_fee, 140),
  delivery_collection_enabled = COALESCE(delivery_collection_enabled, true),
  delivery_collection_fee     = COALESCE(delivery_collection_fee, 0)
WHERE id = 'global';

-- =============================================================================
-- SECTION 2: Ensure orders Columns Exist (delivery_type, delivery_fee, delivery_window)
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_window text;

-- =============================================================================
-- SECTION 3: Backfill delivery_type and delivery_fee on Existing Orders
-- =============================================================================

-- Step A: Backfill from checkout_attempts where available
UPDATE public.orders o
SET
  delivery_type = COALESCE(
    NULLIF(ca.checkout_data->>'delivery_type', ''),
    o.delivery_type,
    CASE 
      WHEN (o.total - o.subtotal) = 120 THEN 'sameday'
      WHEN (o.total - o.subtotal) = 90  THEN 'scheduled'
      WHEN (o.total - o.subtotal) = 140 THEN 'surprise'
      WHEN (o.total - o.subtotal) = 0   THEN 'collection'
      ELSE 'standard'
    END
  ),
  delivery_fee = CASE
    WHEN (ca.checkout_data->>'delivery_fee')::numeric > 0 THEN (ca.checkout_data->>'delivery_fee')::numeric
    WHEN o.total > o.subtotal THEN (o.total - o.subtotal)
    WHEN o.delivery_fee IS NOT NULL AND o.delivery_fee > 0 THEN o.delivery_fee
    ELSE 0
  END
FROM public.checkout_attempts ca
WHERE o.payment_reference = ca.payment_reference
  AND (o.delivery_fee IS NULL OR o.delivery_fee = 0 OR o.delivery_type IS NULL);

-- Step B: Backfill any remaining orders where fee is missing/0 but total > subtotal
UPDATE public.orders
SET
  delivery_type = COALESCE(
    delivery_type,
    CASE 
      WHEN (total - subtotal) = 120 THEN 'sameday'
      WHEN (total - subtotal) = 90  THEN 'scheduled'
      WHEN (total - subtotal) = 140 THEN 'surprise'
      WHEN (total - subtotal) = 0   THEN 'collection'
      ELSE 'standard'
    END
  ),
  delivery_fee = CASE
    WHEN total > subtotal THEN (total - subtotal)
    ELSE COALESCE(delivery_fee, 0)
  END
WHERE (delivery_fee IS NULL OR delivery_fee = 0) AND total > subtotal;

-- Step C: Specifically ensure test order GF-767034 (WEB-767034) is fixed (same-day, 120)
UPDATE public.orders
SET
  delivery_type = 'sameday',
  delivery_fee = 120
WHERE tracking_number = 'GF-767034' OR order_code = 'WEB-767034';

-- =============================================================================
-- SECTION 4: Finalize Paid Checkout RPC Function (with delivery_window support)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.finalize_paid_checkout(
  verified_reference text,
  verified_amount numeric,
  verified_currency text DEFAULT 'GHS'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt public.checkout_attempts%ROWTYPE;
  created_order_id uuid;
  item_rec record;
  item_category text;
BEGIN
  -- Lock the checkout attempt for update to prevent concurrent duplicate finalization
  SELECT * INTO attempt FROM public.checkout_attempts
  WHERE payment_reference = verified_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'checkout_not_found';
  END IF;

  -- Idempotency check: if already finalized with an existing order, return success
  IF attempt.status = 'paid' AND attempt.order_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'orderId', attempt.order_id,
      'trackingNumber', attempt.tracking_number,
      'orderCode', attempt.order_code,
      'alreadyProcessed', true
    );
  END IF;

  IF attempt.status <> 'initialized' THEN
    RAISE EXCEPTION 'checkout_not_payable';
  END IF;

  IF attempt.currency <> UPPER(verified_currency) OR ABS(attempt.total - verified_amount) > 0.01 THEN
    RAISE EXCEPTION 'payment_mismatch';
  END IF;

  -- Insert order record with all checkout details including delivery_type, delivery_fee and delivery_window
  INSERT INTO public.orders (
    tracking_number,
    order_code,
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
    delivery_type,
    delivery_fee,
    delivery_window,
    subtotal,
    total,
    payment_provider,
    payment_reference,
    payment_status,
    fulfillment_status
  ) VALUES (
    attempt.tracking_number,
    attempt.order_code,
    attempt.checkout_data->>'customer_name',
    attempt.customer_email,
    attempt.checkout_data->>'customer_phone',
    COALESCE(attempt.checkout_data->>'recipient_name', attempt.checkout_data->>'customer_name'),
    attempt.checkout_data->>'delivery_address',
    NULLIF(attempt.checkout_data->>'landmark', ''),
    NULLIF(attempt.checkout_data->>'location_link', ''),
    NULLIF(attempt.checkout_data->>'customer_note', ''),
    NULLIF(attempt.checkout_data->>'card_message', ''),
    NULLIF(attempt.checkout_data->>'card_style', ''),
    NULLIF(attempt.checkout_data->>'requested_delivery_date', '')::date,
    NULLIF(attempt.checkout_data->>'delivery_type', ''),
    COALESCE(
      (attempt.checkout_data->>'delivery_fee')::numeric,
      CASE WHEN attempt.total > attempt.subtotal THEN (attempt.total - attempt.subtotal) ELSE 0 END
    ),
    NULLIF(attempt.checkout_data->>'delivery_window', ''),
    attempt.subtotal,
    attempt.total,
    'paystack',
    attempt.payment_reference,
    'paid',
    'packaging'
  ) RETURNING id INTO created_order_id;

  -- Insert order items and decrement stock
  FOR item_rec IN
    SELECT
      item.product_id,
      item.item_name,
      item.quantity,
      item.unit_price,
      COALESCE(item.metadata, '{}'::jsonb) AS metadata
    FROM jsonb_to_recordset(attempt.items) AS item(
      product_id text,
      item_name text,
      quantity integer,
      unit_price numeric,
      metadata jsonb
    )
  LOOP
    SELECT category INTO item_category FROM public.products WHERE id = item_rec.product_id;

    INSERT INTO public.order_items (order_id, product_id, item_name, quantity, unit_price, metadata)
    VALUES (
      created_order_id,
      item_rec.product_id,
      item_rec.item_name,
      item_rec.quantity,
      item_rec.unit_price,
      jsonb_build_object(
        'category', item_category,
        'discount_percent', (item_rec.metadata->>'discount_percent')::numeric
      )
    );

    -- Decrement stock safely if product exists
    BEGIN
      UPDATE public.products
      SET stock = GREATEST(0, stock - item_rec.quantity)
      WHERE id = item_rec.product_id AND stock IS NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  -- Insert initial order events (stage 'paid' and stage 'packaging')
  BEGIN
    INSERT INTO public.order_events (order_id, stage, customer_note, created_by)
    VALUES
      (created_order_id, 'paid', 'Payment confirmed via Paystack', NULL),
      (created_order_id, 'packaging', 'Order received and processing', NULL);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Create admin notification for the new paid order
  BEGIN
    INSERT INTO public.admin_notifications (type, title, body, route, record_id)
    VALUES (
      'new_order',
      'New paid order',
      attempt.tracking_number || ' · GHS ' || attempt.total,
      '/admin',
      created_order_id::text
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Mark the checkout attempt as paid and link order_id
  UPDATE public.checkout_attempts
  SET status = 'paid', order_id = created_order_id, updated_at = NOW()
  WHERE payment_reference = verified_reference;

  RETURN jsonb_build_object(
    'orderId', created_order_id,
    'trackingNumber', attempt.tracking_number,
    'orderCode', attempt.order_code,
    'alreadyProcessed', false
  );
END;
$$;

-- Enforce security: service_role execution only
REVOKE ALL ON FUNCTION public.finalize_paid_checkout(text, numeric, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_checkout(text, numeric, text) TO service_role;

-- =============================================================================
-- SECTION 5: Automatically Recover & Finalize Pending Attempts (e.g. GF-087313)
-- =============================================================================

DO $$
DECLARE
  r RECORD;
  v_res JSONB;
BEGIN
  FOR r IN (
    SELECT payment_reference, total, currency, tracking_number
    FROM public.checkout_attempts
    WHERE (tracking_number = 'GF-087313' OR status IN ('initialized', 'failed'))
      AND order_id IS NULL
    ORDER BY created_at DESC
  ) LOOP
    BEGIN
      -- Reset status to initialized so finalize_paid_checkout accepts it
      UPDATE public.checkout_attempts
      SET status = 'initialized'
      WHERE payment_reference = r.payment_reference;

      v_res := public.finalize_paid_checkout(r.payment_reference, r.total, r.currency);
      RAISE NOTICE 'Finalized attempt % (tracking %): %', r.payment_reference, r.tracking_number, v_res;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not finalize attempt % (tracking %): %', r.payment_reference, r.tracking_number, SQLERRM;
    END;
  END LOOP;
END $$;

-- =============================================================================
-- SECTION 6: normalize_phone
-- NOTE: The canonical definition (with 00-prefix stripping and STRICT/PARALLEL
-- SAFE) lives in FIX_requests_flow.sql which must be run first.
-- Run FIX_requests_flow.sql → then this file.
-- =============================================================================

-- Idempotent: only create the function if it does not already exist from
-- FIX_requests_flow.sql.  If it does exist this block is a no-op.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'normalize_phone'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.normalize_phone(phone text)
      RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
      SET search_path = public
      AS $body$
      DECLARE digits text;
      BEGIN
        digits := regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g');
        IF digits LIKE '00%' THEN digits := substring(digits FROM 3); END IF;
        IF digits LIKE '233%' AND length(digits) >= 12 THEN digits := substring(digits FROM 4); END IF;
        IF digits LIKE '0%' THEN digits := substring(digits FROM 2); END IF;
        RETURN digits;
      END $body$;
    $fn$;
  END IF;
END $do$;

GRANT EXECUTE ON FUNCTION public.normalize_phone(text) TO anon, authenticated, service_role;


