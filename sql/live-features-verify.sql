-- ============================================================================
-- LIVE FEATURES VERIFICATION SQL
-- ============================================================================
-- Run this AFTER applying sql/live-features.sql to verify the changes
-- This file is read-only and does not modify any data
-- ============================================================================

-- Check that new site_settings columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'site_settings'
  AND column_name IN (
    'delivery_selector_enabled',
    'tracking_auto_refresh_enabled',
    'tracking_refresh_interval_seconds',
    'track_max_failed_attempts',
    'track_lockout_minutes'
  )
ORDER BY column_name;

-- Check that signin_log table exists with correct columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'signin_log'
ORDER BY ordinal_position;

-- Check that track_attempts table exists with correct columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'track_attempts'
ORDER BY ordinal_position;

-- Check that signin_log has RLS enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'signin_log';

-- Check that track_attempts has RLS enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'track_attempts';

-- Check that signin_log policies exist
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'signin_log'
ORDER BY policyname;

-- Check that track_record function exists with correct signature
SELECT 
  p.proname,
  pg_get_function_arguments(p.oid) as args,
  p.prorettype as return_type,
  p.prosecdefiner as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'track_record';

-- Check that track_record has correct grants
SELECT 
  grantee,
  privilege_type,
  privilege
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
  AND routine_name = 'track_record'
ORDER BY grantee, privilege_type;

-- Check that convert_request_to_order function exists with correct signature
SELECT 
  p.proname,
  pg_get_function_arguments(p.oid) as args,
  p.prorettype as return_type,
  p.prosecdefiner as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'convert_request_to_order';

-- Check that convert_request_to_order has correct grants
SELECT 
  grantee,
  privilege_type,
  privilege
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
  AND routine_name = 'convert_request_to_order'
ORDER BY grantee, privilege_type;

-- Check that orders.customization_selections column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name = 'customization_selections';

-- Check that customer_requests.converted_order_id column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customer_requests'
  AND column_name = 'converted_order_id';

-- Check that orders is in supabase_realtime publication
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'orders';

-- Check that admin_notifications is in supabase_realtime publication
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'admin_notifications';

-- Check that site_content table exists (for Part 2)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'site_content'
ORDER BY ordinal_position;
