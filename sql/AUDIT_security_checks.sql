-- ============================================================================
-- AUDIT_security_checks.sql — Comprehensive Supabase Security & RLS Audit
-- ============================================================================
-- Flower Girl / The Gifting Factory
-- Database: lvciyxnafwhrtrgmmjxw
--
-- Instructions: Run this in Supabase SQL Editor. It performs read-only checks
-- and returns clear audit reports for RLS, permissions, triggers, and RPC safety.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Check Row Level Security (RLS) status across all public tables
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'PASS: RLS is active'
        ELSE 'FAIL: RLS is disabled — table exposed to public anon API'
    END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ----------------------------------------------------------------------------
-- 2. Audit all active RLS policies on sensitive tables
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- 3. Verify public anon write permissions
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
ORDER BY table_name, privilege_type;

-- ----------------------------------------------------------------------------
-- 4. Verify function search_path and SECURITY DEFINER safety
-- ----------------------------------------------------------------------------
SELECT 
    proname AS function_name,
    prosecdef AS is_security_definer,
    proconfig AS search_path_settings,
    CASE 
        WHEN prosecdef AND (proconfig IS NULL OR NOT 'search_path=public, pg_temp' = ANY(proconfig))
        THEN 'WARN: SECURITY DEFINER function missing explicit search_path'
        ELSE 'PASS'
    END AS safety_status
FROM pg_proc
JOIN pg_namespace n ON pg_proc.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('finalize_paid_checkout', 'verify_order_pin', 'delete_order_permanently');

-- ----------------------------------------------------------------------------
-- 5. Verify Paystack immutability triggers on orders table
-- ----------------------------------------------------------------------------
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_schema = 'public';
