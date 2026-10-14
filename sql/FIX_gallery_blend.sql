-- =====================================================================
-- FIX_gallery_blend.sql
-- Add blend_background column to gallery_items for seamless background blending
-- Idempotent: safe to run multiple times
-- =====================================================================

DO $$
BEGIN
  -- 1. Add blend_background column to gallery_items if it doesn't exist
  ALTER TABLE public.gallery_items 
  ADD COLUMN IF NOT EXISTS blend_background boolean NOT NULL DEFAULT false;

  -- 2. Verify column comment
  COMMENT ON COLUMN public.gallery_items.blend_background IS 
    'When true, the storefront renders the image with mix-blend-mode: multiply over the page background to blend light image backgrounds seamlessly.';
END $$;

-- 3. Verify existing RLS policies permit public reading and staff writing
-- "public reads visible gallery" already permits SELECT of all columns where visible = true.
-- "staff_manage_gallery_items" (or foreach table policy with is_staff()) permits ALL operations for staff.
-- Grant explicit select to anon/authenticated just in case table-level grants are required:
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT ALL ON public.gallery_items TO authenticated;
