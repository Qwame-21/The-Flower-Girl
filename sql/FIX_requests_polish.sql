-- =============================================================================
-- FIX_requests_polish.sql
-- Safe to re-run (fully idempotent).
-- Run AFTER FIX_requests_flow.sql.
--
-- What this does:
--  1. Backfills short_code on every existing customer_requests row with NULL.
--  2. Parses each row's notes text blob into the structured delivery columns
--     where those columns are currently NULL or empty.
--  3. Strips the "Delivery address: ..." blob footer from notes so the
--     drawer shows only the human-written customer text.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Backfill short_code on rows that don't have one.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r     RECORD;
  cand  TEXT;
  clash INT;
  tries INT;
BEGIN
  FOR r IN
    SELECT id FROM public.customer_requests WHERE short_code IS NULL
    ORDER BY created_at
  LOOP
    tries := 0;
    LOOP
      tries := tries + 1;
      cand := public.generate_short_code('RQ');
      SELECT COUNT(*) INTO clash
      FROM public.customer_requests WHERE short_code = cand;
      EXIT WHEN clash = 0 OR tries >= 20;
    END LOOP;

    IF clash = 0 THEN
      UPDATE public.customer_requests SET short_code = cand WHERE id = r.id;
    ELSE
      UPDATE public.customer_requests
      SET short_code = 'RQ-' || upper(substring(replace(r.id::text, '-', '') FROM 1 FOR 6))
      WHERE id = r.id AND short_code IS NULL;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Backfill structured delivery columns from the notes blob.
--    NULLIF(..., 'fieldname') prevents writing the key name as a value when
--    old blobs stored empty lines like "recipient:\nlandmark:".
-- ---------------------------------------------------------------------------
UPDATE public.customer_requests AS r
SET
  delivery_address = COALESCE(
    NULLIF(trim(r.delivery_address), ''),
    NULLIF(trim(COALESCE((regexp_match(r.notes, '(?im)^Delivery address:\s*(.+)$'))[1], '')), '')
  ),
  fulfilment = COALESCE(
    NULLIF(trim(r.fulfilment), ''),
    CASE
      WHEN lower(trim(COALESCE((regexp_match(r.notes, '(?im)^fulfilment:\s*(\S+)$'))[1], '')))
           IN ('delivery', 'collection')
      THEN lower(trim((regexp_match(r.notes, '(?im)^fulfilment:\s*(\S+)$'))[1]))
      ELSE NULL
    END
  ),
  recipient = COALESCE(
    NULLIF(trim(r.recipient), ''),
    NULLIF(NULLIF(trim(COALESCE((regexp_match(r.notes, '(?im)^recipient:\s*(.+)$'))[1], '')), ''), 'recipient')
  ),
  recipient_phone = COALESCE(
    NULLIF(trim(r.recipient_phone), ''),
    NULLIF(NULLIF(trim(COALESCE((regexp_match(r.notes, '(?im)^recipientPhone:\s*(.+)$'))[1], '')), ''), 'recipientPhone')
  ),
  landmark = COALESCE(
    NULLIF(trim(r.landmark), ''),
    NULLIF(NULLIF(trim(COALESCE((regexp_match(r.notes, '(?im)^landmark:\s*(.+)$'))[1], '')), ''), 'landmark')
  ),
  location_link = COALESCE(
    NULLIF(trim(r.location_link), ''),
    NULLIF(NULLIF(trim(COALESCE((regexp_match(r.notes, '(?im)^locationLink:\s*(.+)$'))[1], '')), ''), 'locationLink')
  ),
  delivery_instructions = COALESCE(
    NULLIF(trim(r.delivery_instructions), ''),
    NULLIF(NULLIF(trim(COALESCE((regexp_match(r.notes, '(?im)^deliveryInstructions:\s*(.+)$'))[1], '')), ''), 'deliveryInstructions')
  ),
  budget = COALESCE(
    NULLIF(trim(r.budget), ''),
    NULLIF(NULLIF(trim(COALESCE((regexp_match(r.notes, '(?im)^budget:\s*(.+)$'))[1], '')), ''), 'budget')
  )
WHERE r.notes IS NOT NULL AND r.notes <> '';

-- Infer fulfilment from delivery_address when still NULL
UPDATE public.customer_requests
SET fulfilment = CASE
  WHEN lower(delivery_address) LIKE '%collection%' THEN 'collection'
  ELSE 'delivery'
END
WHERE fulfilment IS NULL AND COALESCE(trim(delivery_address), '') <> '';

-- ---------------------------------------------------------------------------
-- 3. Strip the blob footer from notes (keep only the human-written text).
--    Before: "Test note\n\nDelivery address: East Legon\nfulfilment:\n..."
--    After:  "Test note"
-- ---------------------------------------------------------------------------
UPDATE public.customer_requests
SET notes = trim(split_part(notes, E'\n\nDelivery address:', 1))
WHERE
  notes LIKE E'%\n\nDelivery address:%'
  AND COALESCE(trim(delivery_address), '') <> '';

-- Rows where the entire notes is just the blob (no human text before it)
UPDATE public.customer_requests
SET notes = ''
WHERE
  notes ~ '^Delivery address:'
  AND COALESCE(trim(delivery_address), '') <> '';

-- ---------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT id, short_code, reference, customer_name, status,
--          delivery_address, fulfilment, recipient, notes
--   FROM public.customer_requests ORDER BY created_at DESC LIMIT 10;
--
--   SELECT COUNT(*) FROM public.customer_requests WHERE short_code IS NULL;
--   -- expect: 0
-- ---------------------------------------------------------------------------

COMMIT;
