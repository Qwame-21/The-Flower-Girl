-- =============================================================================
-- CUSTOMIZATION OPTIONS DUPLICATE REVIEW & CLEANUP SCRIPT
-- File: docs/database/review-customization-duplicates.sql
-- Description: Inspects duplicate options in customization_options and provides
--              a safe transaction block to remove duplicate rows while retaining
--              the oldest row for each unique (category, option_name) pair.
-- =============================================================================

-- 1. INSPECT DUPLICATES (READ-ONLY QUERY)
-- Run this query to inspect duplicates and their counts in the database:
SELECT category, option_name, COUNT(*) AS duplicate_count
FROM public.customization_options
GROUP BY category, option_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, category, option_name;

-- Detailed inspection of duplicate rows with IDs and timestamps:
SELECT id, category, option_name, estimate, display_order, visible, created_at
FROM public.customization_options
WHERE (category, option_name) IN (
    SELECT category, option_name
    FROM public.customization_options
    GROUP BY category, option_name
    HAVING COUNT(*) > 1
)
ORDER BY category, option_name, created_at ASC;


-- 2. CLEANUP TRANSACTION (DO NOT RUN UNTIL REVIEWED)
-- WARNING: Review the select results above before executing this block.
/*
BEGIN;

DELETE FROM public.customization_options c1
WHERE c1.id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY category, option_name
                   ORDER BY created_at ASC, id ASC
               ) AS row_num
        FROM public.customization_options
    ) duplicates
    WHERE duplicates.row_num > 1
);

-- Verify remaining count (should be 32 distinct options)
SELECT category, COUNT(*) AS count
FROM public.customization_options
GROUP BY category
ORDER BY category;

COMMIT;
*/
