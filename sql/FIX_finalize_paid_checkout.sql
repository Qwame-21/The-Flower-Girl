-- =============================================================================
-- FIX: Finalize Paid Checkout & Delivery Fee Configuration
-- File: sql/FIX_finalize_paid_checkout.sql
-- Project: Flower Girl / The Gifting Factory (lvciyxnafwhrtrgmmjxw)
-- Safe to run in Supabase SQL Editor. Fully idempotent and re-runnable.
-- =============================================================================

-- =============================================================================
-- SECTION 1: Ensure site_settings Delivery Columns and Default Values Exist
-- =============================================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS store_address text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS delivery_sameday_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_sameday_fee numeric(12,2) NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS delivery_scheduled_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_scheduled_fee numeric(12,2) NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS delivery_surprise_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_surprise_fee numeric(12,2) NOT NULL DEFAULT 140,
  ADD COLUMN IF NOT EXISTS delivery_collection_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_collection_fee numeric(12,2) NOT NULL DEFAULT 0;

-- Ensure the 'global' row exists and has the correct non-null defaults
INSERT INTO public.site_settings (
  id,
  business_name,
  support_phone,
  support_email,
  dispatch_city,
  delivery_note,
  announcement_enabled,
  store_address,
  instagram_url,
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
  'The Gifting Factory by Flower Girl',
  '+233 202 417 072',
  'info@flowergirlpro.com',
  'Accra',
  'Delivery available across Accra. Same-day delivery available when stock and schedule allow.',
  false,
  'ACP Estate Junction, Kwabenya, Accra',
  'https://www.instagram.com/flowergirl_ghana/',
  true,
  120,
  true,
  90,
  true,
  140,
  true,
  0
) ON CONFLICT (id) DO UPDATE SET
  delivery_sameday_enabled    = COALESCE(public.site_settings.delivery_sameday_enabled, EXCLUDED.delivery_sameday_enabled),
  delivery_sameday_fee        = COALESCE(public.site_settings.delivery_sameday_fee, EXCLUDED.delivery_sameday_fee),
  delivery_scheduled_enabled  = COALESCE(public.site_settings.delivery_scheduled_enabled, EXCLUDED.delivery_scheduled_enabled),
  delivery_scheduled_fee      = COALESCE(public.site_settings.delivery_scheduled_fee, EXCLUDED.delivery_scheduled_fee),
  delivery_surprise_enabled   = COALESCE(public.site_settings.delivery_surprise_enabled, EXCLUDED.delivery_surprise_enabled),
  delivery_surprise_fee       = COALESCE(public.site_settings.delivery_surprise_fee, EXCLUDED.delivery_surprise_fee),
  delivery_collection_enabled = COALESCE(public.site_settings.delivery_collection_enabled, EXCLUDED.delivery_collection_enabled),
  delivery_collection_fee     = COALESCE(public.site_settings.delivery_collection_fee, EXCLUDED.delivery_collection_fee);

-- In case the 'global' row already had explicit NULLs in fee columns, backfill them to defaults
UPDATE public.site_settings
SET
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
-- SECTION 2: Ensure order_items.metadata Column Exists
-- =============================================================================

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- =============================================================================
-- SECTION 3: Corrected finalize_paid_checkout RPC Function
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
  updated_product record;
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

  -- Insert order record (payment_status: paid, fulfillment_status: packaging)
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
    attempt.checkout_data->>'recipient_name',
    attempt.checkout_data->>'delivery_address',
    NULLIF(attempt.checkout_data->>'landmark', ''),
    NULLIF(attempt.checkout_data->>'location_link', ''),
    NULLIF(attempt.checkout_data->>'customer_note', ''),
    NULLIF(attempt.checkout_data->>'card_message', ''),
    NULLIF(attempt.checkout_data->>'card_style', ''),
    NULLIF(attempt.checkout_data->>'requested_delivery_date', '')::date,
    attempt.subtotal,
    attempt.total,
    'paystack',
    attempt.payment_reference,
    'paid',
    'packaging'
  ) RETURNING id INTO created_order_id;

  -- Insert order items and decrement stock
  -- Fixed: column alias "AS metadata" prevents Postgres record "item_rec" has no field "metadata" error
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
      item_rec.metadata || jsonb_build_object('category', COALESCE(item_category, 'Uncategorized'))
    );

    IF item_rec.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = GREATEST(0, COALESCE(stock, 0) - item_rec.quantity),
          updated_at = NOW()
      WHERE id = item_rec.product_id
      RETURNING id, name, stock, low_stock_threshold INTO updated_product;

      IF FOUND AND updated_product.stock <= COALESCE(updated_product.low_stock_threshold, 3) THEN
        INSERT INTO public.admin_notifications (type, title, body, route, record_id)
        VALUES (
          'low_stock',
          'Low stock: ' || updated_product.name,
          'Stock for ' || updated_product.name || ' dropped to ' || updated_product.stock || ' (threshold: ' || COALESCE(updated_product.low_stock_threshold, 3) || ')',
          '/admin',
          updated_product.id
        );
      END IF;
    END IF;
  END LOOP;

  -- Create initial order event (stage: paid)
  INSERT INTO public.order_events (order_id, stage, customer_note)
  VALUES (created_order_id, 'paid', 'Payment confirmed');

  -- Create admin notification for the new paid order
  INSERT INTO public.admin_notifications (type, title, body, route, record_id)
  VALUES (
    'new_order',
    'New paid order',
    attempt.tracking_number || ' · GHS ' || attempt.total,
    '/admin',
    created_order_id::text
  );

  -- Update checkout attempt to paid status with created order_id
  UPDATE public.checkout_attempts
  SET status = 'paid',
      order_id = created_order_id,
      updated_at = NOW()
  WHERE id = attempt.id;

  RETURN jsonb_build_object(
    'orderId', created_order_id,
    'trackingNumber', attempt.tracking_number,
    'orderCode', attempt.order_code,
    'alreadyProcessed', false
  );
END $$;

-- Enforce security: service role only
REVOKE ALL ON FUNCTION public.finalize_paid_checkout(text, numeric, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_checkout(text, numeric, text) TO service_role;

-- =============================================================================
-- SECTION 4: RLS Policies for Storefront Order Tracking
-- =============================================================================
-- Allows storefront customer lookups by tracking_number / order_code
-- required because trackingApi.js queries orders and order_events via anon key

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'public can track orders'
  ) THEN
    CREATE POLICY "public can track orders" ON public.orders
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_events' AND policyname = 'public can view order events'
  ) THEN
    CREATE POLICY "public can view order events" ON public.order_events
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;
