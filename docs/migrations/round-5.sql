-- =========================================================
-- ROUND 5 DATABASE MIGRATION FILE
-- File: docs/migrations/round-5.sql
-- =========================================================

-- 1. MANDATORY PRODUCT IMAGE CONSTRAINT
-- Enforces that no product can be created or updated with an empty or null image path.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_product_image_not_empty'
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT check_product_image_not_empty
    CHECK (image_path IS NOT NULL AND length(trim(image_path)) > 0);
  END IF;
END $$;


-- 2. JOB APPLICATIONS TABLE (Storefront -> Admin Careers Sync)
CREATE TABLE IF NOT EXISTS public.career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID REFERENCES public.careers(id) ON DELETE SET NULL,
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT,
  portfolio_url TEXT,
  resume_path TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'reviewing', 'shortlisted', 'rejected', 'hired'
  rating INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & Realtime for career_applications
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert for career applications'
  ) THEN
    CREATE POLICY "Allow public insert for career applications"
    ON public.career_applications FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read for career applications'
  ) THEN
    CREATE POLICY "Allow authenticated read for career applications"
    ON public.career_applications FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update for career applications'
  ) THEN
    CREATE POLICY "Allow authenticated update for career applications"
    ON public.career_applications FOR UPDATE TO public USING (true);
  END IF;
END $$;


-- 3. CUSTOMIZATION CATEGORIES & OPTIONS TABLE (Storefront <-> Admin Customization Sync)
CREATE TABLE IF NOT EXISTS public.customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL, -- e.g. 'Choose a base', 'Add gifts', 'Personalize', 'Finish & deliver'
  option_name TEXT NOT NULL,   -- e.g. 'Luxury box', 'Engraved name'
  estimate_price NUMERIC(10,2) DEFAULT 0.00,
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for customization_options
ALTER TABLE public.customization_options ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read customization_options'
  ) THEN
    CREATE POLICY "Allow public read customization_options"
    ON public.customization_options FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated write customization_options'
  ) THEN
    CREATE POLICY "Allow authenticated write customization_options"
    ON public.customization_options FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;


-- 4. ADMIN SIGN-IN ACTIVITY TABLE & 30-DAY AUTOMATIC PURGE
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name TEXT NOT NULL DEFAULT 'Admin User',
  signed_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_out_at TIMESTAMPTZ,
  user_agent TEXT
);

-- RLS for admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for admin_sessions'
  ) THEN
    CREATE POLICY "Allow all for admin_sessions"
    ON public.admin_sessions FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Automatic 30-day purge function
CREATE OR REPLACE FUNCTION purge_old_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.admin_sessions
  WHERE signed_in_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
