-- SQL for connect-fixes branch
-- These are recommendations for the owner to apply after verifying the current database state
-- Do NOT apply these without review and backup

-- NOTE: The settingsAdapter.js already has column detection, so the app will work
-- even if these columns are not present. The app will disable controls with a hint
-- when columns are missing.

-- 1. Orders table - add delivery type and fee columns (if not present)
-- This is a RECOMMENDATION for the owner to consider based on Step 6 findings
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC;

-- The live-features.sql file should already contain:
-- - delivery_selector_enabled column
-- - tracking_auto_refresh_enabled, tracking_refresh_interval_seconds columns
-- - track_max_failed_attempts, track_lockout_minutes columns
-- - site_content table for page content
-- - signin_log table for sign-in tracking
-- - track_attempts table for tracking rate limiting

-- Verify these have been applied before enabling the corresponding features
