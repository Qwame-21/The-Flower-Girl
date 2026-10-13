-- ============================================================================
-- FIX_security_hardening.sql — Supabase RLS Hardening & RPC Isolation
-- ============================================================================
-- Flower Girl / The Gifting Factory
-- Database: lvciyxnafwhrtrgmmjxw
--
-- Instructions: Run this in Supabase SQL Editor to enforce RLS and lock down
-- security definer RPC execution environments.
-- ============================================================================

-- 1. Enforce RLS on all public tables
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- 2. Harden SECURITY DEFINER functions with pinned search_path to prevent injection
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc JOIN pg_namespace n ON pg_proc.pronamespace = n.oid
        WHERE n.nspname = 'public' AND proname = 'finalize_paid_checkout'
    ) THEN
        ALTER FUNCTION public.finalize_paid_checkout(text, numeric, text) SET search_path = public, pg_temp;
    END IF;
END $$;

-- 3. Ensure site_settings readable by anon and authenticated, writable by authenticated
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'site_settings_read_public'
    ) THEN
        CREATE POLICY site_settings_read_public ON public.site_settings
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'site_settings_write_auth'
    ) THEN
        CREATE POLICY site_settings_write_auth ON public.site_settings
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
