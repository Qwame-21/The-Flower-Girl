-- Read-only verification for the Track RPC and live request notifications.
WITH required_columns(table_name, column_name) AS (
  VALUES
    ('orders', 'id'),
    ('orders', 'tracking_number'),
    ('orders', 'order_code'),
    ('orders', 'customer_name'),
    ('orders', 'customer_phone'),
    ('orders', 'customer_email'),
    ('orders', 'recipient_name'),
    ('orders', 'delivery_address'),
    ('orders', 'landmark'),
    ('orders', 'location_link'),
    ('orders', 'fulfillment_status'),
    ('orders', 'payment_status'),
    ('orders', 'estimated_delivery'),
    ('orders', 'requested_delivery_date'),
    ('orders', 'delivery_type'),
    ('orders', 'delivery_fee'),
    ('orders', 'delivery_window'),
    ('orders', 'customer_note'),
    ('orders', 'card_message'),
    ('orders', 'card_style'),
    ('orders', 'customization_selections'),
    ('orders', 'admin_note'),
    ('orders', 'created_at'),
    ('order_items', 'id'),
    ('order_items', 'order_id'),
    ('order_items', 'item_name'),
    ('order_items', 'quantity'),
    ('order_events', 'order_id'),
    ('order_events', 'stage'),
    ('order_events', 'created_at'),
    ('customer_requests', 'id'),
    ('customer_requests', 'short_code'),
    ('customer_requests', 'reference'),
    ('customer_requests', 'customer_name'),
    ('customer_requests', 'phone'),
    ('customer_requests', 'email'),
    ('customer_requests', 'request_type'),
    ('customer_requests', 'service'),
    ('customer_requests', 'occasion'),
    ('customer_requests', 'status'),
    ('customer_requests', 'preferred_date'),
    ('customer_requests', 'confirmed_quote'),
    ('customer_requests', 'admin_note'),
    ('customer_requests', 'created_at'),
    ('customer_requests', 'received_at'),
    ('customer_requests', 'quoted_at'),
    ('customer_requests', 'approved_at'),
    ('customer_requests', 'converted_at'),
    ('customer_requests', 'closed_at'),
    ('customer_requests', 'updated_at'),
    ('customer_requests', 'selections'),
    ('customer_requests', 'quantity'),
    ('customer_requests', 'fulfilment'),
    ('customer_requests', 'recipient'),
    ('customer_requests', 'recipient_phone'),
    ('customer_requests', 'delivery_address'),
    ('customer_requests', 'landmark'),
    ('customer_requests', 'location_link'),
    ('customer_requests', 'delivery_instructions'),
    ('customer_requests', 'delivery_type'),
    ('customer_requests', 'delivery_fee'),
    ('customer_requests', 'delivery_window'),
    ('customer_requests', 'city'),
    ('customer_requests', 'budget'),
    ('customer_requests', 'notes'),
    ('customer_requests', 'card_message'),
    ('customer_requests', 'card_style'),
    ('customer_requests', 'viewed_at'),
    ('admin_notifications', 'id'),
    ('admin_notifications', 'type'),
    ('admin_notifications', 'title'),
    ('admin_notifications', 'body'),
    ('admin_notifications', 'route'),
    ('admin_notifications', 'record_id'),
    ('admin_notifications', 'read_at'),
    ('admin_notifications', 'created_at')
),
column_checks AS (
  SELECT
    format('%I.%I', required.table_name, required.column_name) AS item,
    CASE WHEN actual.column_name IS NULL THEN 'MISSING' ELSE 'OK' END AS status
  FROM required_columns required
  LEFT JOIN information_schema.columns actual
    ON actual.table_schema = 'public'
   AND actual.table_name = required.table_name
   AND actual.column_name = required.column_name
),
function_checks AS (
  SELECT 'function public.track_record(text,text)' AS item,
         CASE WHEN to_regprocedure('public.track_record(text,text)') IS NULL THEN 'MISSING' ELSE 'OK' END AS status
  UNION ALL
  SELECT 'function public.normalize_phone(text)',
         CASE WHEN to_regprocedure('public.normalize_phone(text)') IS NULL THEN 'MISSING' ELSE 'OK' END
  UNION ALL
  SELECT 'function public.notify_new_customer_request()',
         CASE WHEN to_regprocedure('public.notify_new_customer_request()') IS NULL THEN 'MISSING' ELSE 'OK' END
  UNION ALL
  SELECT 'trigger public.on_new_customer_request',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_trigger
           WHERE tgrelid = 'public.customer_requests'::regclass
             AND tgname = 'on_new_customer_request'
             AND NOT tgisinternal
         ) THEN 'OK' ELSE 'MISSING' END
  UNION ALL
  SELECT 'publication supabase_realtime: customer_requests',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'customer_requests'
         ) THEN 'OK' ELSE 'MISSING' END
  UNION ALL
  SELECT 'publication supabase_realtime: admin_notifications',
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'admin_notifications'
         ) THEN 'OK' ELSE 'MISSING' END
)
SELECT item, status
FROM (
  SELECT item, status FROM column_checks
  UNION ALL
  SELECT item, status FROM function_checks
) checks
ORDER BY item;
