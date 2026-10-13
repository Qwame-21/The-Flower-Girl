-- =============================================================================
-- FIX: Orders Detail, Fulfillment Status Transitions & Activity Logging
-- File: sql/FIX_orders_detail_and_status.sql
-- Project: Flower Girl / The Gifting Factory (lvciyxnafwhrtrgmmjxw)
-- Safe to run in Supabase SQL Editor. Fully idempotent and re-runnable.
-- =============================================================================

-- =============================================================================
-- SECTION 1: Add delivery_type and delivery_fee to public.orders
-- =============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) DEFAULT 0;

-- Backfill existing orders from their checkout_attempts rows
UPDATE public.orders o
SET
  delivery_type = COALESCE(o.delivery_type, NULLIF(ca.checkout_data->>'delivery_type', '')),
  delivery_fee  = COALESCE(o.delivery_fee, (ca.checkout_data->>'delivery_fee')::numeric, 0)
FROM public.checkout_attempts ca
WHERE o.payment_reference = ca.payment_reference;

-- Set default 0 on any orders where delivery_fee is still NULL
UPDATE public.orders
SET delivery_fee = 0
WHERE delivery_fee IS NULL;

-- =============================================================================
-- SECTION 2: Ensure Activity Log & Completed Orders Log Tables Exist
-- =============================================================================

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

-- RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manages activity_log" ON public.activity_log;
CREATE POLICY "staff manages activity_log" ON public.activity_log
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- RLS on completed_orders_log
ALTER TABLE public.completed_orders_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manages completed_orders_log" ON public.completed_orders_log;
CREATE POLICY "staff manages completed_orders_log" ON public.completed_orders_log
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- SECTION 3: Completed Order Snapshot Function & Trigger (Fixing i.item_name)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_completed_order_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_summary TEXT;
BEGIN
  IF NEW.fulfillment_status = 'completed' AND (OLD.fulfillment_status IS DISTINCT FROM 'completed' OR TG_OP = 'INSERT') THEN
    SELECT COALESCE(string_agg(i.item_name || ' (x' || i.quantity || ')', ', '), 'No items')
    INTO v_items_summary
    FROM public.order_items i
    WHERE i.order_id = NEW.id;

    INSERT INTO public.completed_orders_log (
      order_id, order_code, customer_name, customer_phone, customer_email,
      total, items_summary, completed_at, is_demo
    ) VALUES (
      NEW.id,
      COALESCE(NEW.order_code, NEW.tracking_number, 'WEB-' || substring(NEW.id::text from 1 for 6)),
      NEW.customer_name,
      NEW.customer_phone,
      NEW.customer_email,
      COALESCE(NEW.total, 0.00),
      v_items_summary,
      NOW(),
      COALESCE(NEW.is_demo, false)
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

-- =============================================================================
-- SECTION 4: Status Change Notification Trigger (Exception Safe to Activity Log)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status) THEN
    BEGIN
      INSERT INTO public.activity_log (event_type, description, metadata, is_demo)
      VALUES (
        'order_status_change',
        format('Order %s status changed from %s to %s', COALESCE(NEW.order_code, NEW.tracking_number, substring(NEW.id::text from 1 for 8)), OLD.fulfillment_status, NEW.fulfillment_status),
        jsonb_build_object('order_id', NEW.id, 'old_status', OLD.fulfillment_status, 'new_status', NEW.fulfillment_status),
        COALESCE(NEW.is_demo, false)
      );
    EXCEPTION WHEN OTHERS THEN
      -- Exception guard ensures logging never blocks fulfillment status updates
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_status_change ON public.orders;
DROP TRIGGER IF EXISTS trg_notify_status_change ON public.orders;
CREATE TRIGGER trg_notify_status_change
  AFTER UPDATE OF fulfillment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();

-- =============================================================================
-- SECTION 5: Update finalize_paid_checkout RPC to Copy delivery_type & delivery_fee
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

  -- Insert order record with all checkout details including delivery_type and delivery_fee
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
    COALESCE((attempt.checkout_data->>'delivery_fee')::numeric, 0),
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
      item_rec.metadata || jsonb_build_object('category', COALESCE(item_category, 'Uncategorized'))
    );

    IF item_rec.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = GREATEST(0, stock - item_rec.quantity),
          updated_at = NOW()
      WHERE id = item_rec.product_id;
    END IF;
  END LOOP;

  -- Create initial order events (paid and packaging stages reached)
  INSERT INTO public.order_events (order_id, stage, customer_note)
  VALUES
    (created_order_id, 'paid', 'Payment confirmed'),
    (created_order_id, 'packaging', 'Order received and processing');

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

  -- Mark the checkout attempt as successfully finalized
  UPDATE public.checkout_attempts
  SET status = 'paid',
      order_id = created_order_id,
      updated_at = NOW()
  WHERE payment_reference = verified_reference;

  RETURN jsonb_build_object(
    'orderId', created_order_id,
    'trackingNumber', attempt.tracking_number,
    'orderCode', attempt.order_code,
    'alreadyProcessed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_paid_checkout(text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_paid_checkout(text, numeric, text) TO service_role;

-- =============================================================================
-- SECTION 6: Ensure RLS Policies for Staff Management & Public Tracking
-- =============================================================================

-- Orders policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can track orders" ON public.orders;
CREATE POLICY "public can track orders" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "staff manages orders" ON public.orders;
CREATE POLICY "staff manages orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Order items policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can view order items" ON public.order_items;
CREATE POLICY "public can view order items" ON public.order_items
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "staff manages order_items" ON public.order_items;
CREATE POLICY "staff manages order_items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Order events policies
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can view order events" ON public.order_events;
CREATE POLICY "public can view order events" ON public.order_events
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "staff manages order_events" ON public.order_events;
CREATE POLICY "staff manages order_events" ON public.order_events
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
