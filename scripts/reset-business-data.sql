-- One-time reset for the existing Gifting Factory Supabase project.
-- Run as the database owner in the Supabase SQL editor after reviewing scope.
-- Preserves gallery_items, auth.users, staff_profiles and all storage objects.
-- A private snapshot remains available for recovery. Do not expose its schema.
-- No CASCADE: unexpected external dependencies cause the transaction to roll back.
BEGIN;
CREATE SCHEMA IF NOT EXISTS business_reset_backup;
REVOKE ALL ON SCHEMA business_reset_backup FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  target text;
  targets text[] := ARRAY[
    'admin_notifications', 'order_events', 'order_items', 'checkout_attempts',
    'orders', 'customer_requests', 'career_applications', 'careers',
    'collection_products', 'promotions', 'collections', 'reviews', 'products',
    'site_content', 'site_settings'
  ];
BEGIN
  -- A fixed snapshot name intentionally makes accidental reruns fail.
  FOREACH target IN ARRAY targets LOOP
    EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE', target);
    EXECUTE format('CREATE TABLE business_reset_backup.%I AS TABLE public.%I', target, target);
    EXECUTE format('REVOKE ALL ON TABLE business_reset_backup.%I FROM PUBLIC, anon, authenticated', target);
  END LOOP;
  FOREACH target IN ARRAY targets LOOP
    EXECUTE format('DELETE FROM public.%I', target);
  END LOOP;
END $$;
COMMIT;

-- Counts only: no personal information in the verification output.
SELECT 'orders' AS collection, count(*) AS remaining FROM public.orders
UNION ALL SELECT 'requests', count(*) FROM public.customer_requests
UNION ALL SELECT 'applications', count(*) FROM public.career_applications
UNION ALL SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'gallery_preserved', count(*) FROM public.gallery_items
UNION ALL SELECT 'staff_preserved', count(*) FROM public.staff_profiles;
