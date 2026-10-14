-- =====================================================================
-- VERIFY_LIVE_DB.sql
-- Read-only verification script for the Flower Girl / Gifting Factory
-- Supabase project: lvciyxnafwhrtrgmmjxw
--
-- Run entirely in the Supabase SQL editor.
-- Every statement is SELECT-only. Nothing is written.
-- Results returned as (item, kind, status, fix_in_file).
-- =====================================================================

-- ---- 0. Helper CTE for structured output ----
WITH

-- ---- 1. Table existence ----
tables_check AS (
  SELECT
    t.table_name                        AS item,
    'table'                             AS kind,
    CASE WHEN t.table_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status,
    'supabase/schema.sql'               AS fix_in_file
  FROM (VALUES
    ('products'),('gallery_items'),('customer_requests'),('orders'),
    ('order_items'),('order_events'),('checkout_attempts'),('staff_profiles'),
    ('promotions'),('collections'),('collection_products'),('reviews'),
    ('careers'),('career_applications'),('site_content'),('site_settings'),
    ('admin_notifications'),('customer_profiles'),('customization_options')
  ) AS required(table_name)
  LEFT JOIN information_schema.tables t
    ON t.table_schema = 'public' AND t.table_name = required.table_name
),

-- ---- 2. Key column checks ----
columns_check AS (
  SELECT
    c.table_name || '.' || c.column_name AS item,
    'column'                             AS kind,
    CASE WHEN c.column_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status,
    'sql/FIX_gallery_blend.sql or supabase/schema.sql' AS fix_in_file
  FROM (VALUES
    ('gallery_items',       'blend_background'),
    ('gallery_items',       'category'),
    ('gallery_items',       'visible'),
    ('gallery_items',       'sort_order'),
    ('customer_requests',   'selections'),
    ('customer_requests',   'card_message'),
    ('customer_requests',   'card_style'),
    ('customer_requests',   'estimate_low'),
    ('customer_requests',   'estimate_high'),
    ('customer_requests',   'confirmed_quote'),
    ('customer_requests',   'approved_at'),
    ('customer_requests',   'converted_at'),
    ('customer_requests',   'admin_note'),
    ('orders',              'tracking_number'),
    ('orders',              'order_code'),
    ('orders',              'request_id'),
    ('orders',              'delivery_type'),
    ('orders',              'recipient_name'),
    ('orders',              'delivery_address'),
    ('orders',              'payment_method'),
    ('orders',              'payment_status'),
    ('order_events',        'event_type'),
    ('order_events',        'actor'),
    ('order_events',        'note'),
    ('staff_profiles',      'is_active'),
    ('site_settings',       'support_phone'),
    ('admin_notifications', 'is_read')
  ) AS required(tbl, col)
  LEFT JOIN information_schema.columns c
    ON c.table_schema = 'public' AND c.table_name = required.tbl AND c.column_name = required.col
),

-- ---- 3. RPC / function existence ----
rpcs_check AS (
  SELECT
    p.proname                  AS item,
    'rpc'                      AS kind,
    CASE WHEN p.proname IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status,
    'supabase/schema.sql'      AS fix_in_file
  FROM (VALUES
    ('is_staff'),
    ('submit_customer_request'),
    ('track_order'),
    ('get_order_for_tracking')
  ) AS required(fn_name)
  LEFT JOIN pg_proc p
    ON p.proname = required.fn_name AND p.pronamespace = 'public'::regnamespace
),

-- ---- 4. RLS policy check (presence of at least one policy per table) ----
rls_check AS (
  SELECT
    required.tbl                                                       AS item,
    'rls_policy'                                                       AS kind,
    CASE WHEN count(pc.policyname) > 0 THEN 'OK' ELSE 'NO POLICY' END AS status,
    'supabase/schema.sql'                                              AS fix_in_file
  FROM (VALUES
    ('gallery_items'),('products'),('customer_requests'),('orders'),
    ('order_items'),('order_events'),('staff_profiles'),('site_settings'),
    ('admin_notifications')
  ) AS required(tbl)
  LEFT JOIN pg_policies pc ON pc.schemaname = 'public' AND pc.tablename = required.tbl
  GROUP BY required.tbl
),

-- ---- 5. Realtime publication membership ----
publication_check AS (
  SELECT
    pt.tablename                                                        AS item,
    'realtime_pub'                                                      AS kind,
    CASE WHEN pt.tablename IS NOT NULL THEN 'OK' ELSE 'NOT IN PUB' END AS status,
    'supabase/schema.sql (supabase_realtime publication)'              AS fix_in_file
  FROM (VALUES
    ('products'),('gallery_items'),('orders'),('order_events'),
    ('customer_requests'),('admin_notifications')
  ) AS required(tbl)
  LEFT JOIN pg_publication_tables pt
    ON pt.pubname = 'supabase_realtime' AND pt.tablename = required.tbl
),

-- ---- 6. Storage bucket existence ----
bucket_check AS (
  SELECT
    b.name                                                              AS item,
    'storage_bucket'                                                    AS kind,
    CASE WHEN b.name IS NOT NULL THEN 'OK' ELSE 'MISSING BUCKET' END   AS status,
    'Supabase dashboard > Storage'                                     AS fix_in_file
  FROM (VALUES
    ('storefront-media'),
    ('resume-uploads')
  ) AS required(bucket_name)
  LEFT JOIN storage.buckets b ON b.name = required.bucket_name
),

-- ---- 7. Trigger existence ----
triggers_check AS (
  SELECT
    tg.trigger_name                                                     AS item,
    'trigger'                                                           AS kind,
    CASE WHEN tg.trigger_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status,
    'supabase/schema.sql'                                              AS fix_in_file
  FROM (VALUES
    ('set_updated_at'),
    ('notify_new_request'),
    ('notify_new_order')
  ) AS required(trig_name)
  LEFT JOIN information_schema.triggers tg
    ON tg.trigger_schema = 'public' AND tg.trigger_name = required.trig_name
  GROUP BY tg.trigger_name, required.trig_name
)

-- ---- Combine all checks ----
SELECT item, kind, status, fix_in_file FROM tables_check
UNION ALL
SELECT item, kind, status, fix_in_file FROM columns_check
UNION ALL
SELECT item, kind, status, fix_in_file FROM rpcs_check
UNION ALL
SELECT item, kind, status, fix_in_file FROM rls_check
UNION ALL
SELECT item, kind, status, fix_in_file FROM publication_check
UNION ALL
SELECT item, kind, status, fix_in_file FROM bucket_check
UNION ALL
SELECT item, kind, status, fix_in_file FROM triggers_check
ORDER BY kind, status DESC, item;
