MASTER VERSION: 2
START COMMIT: 0a6b7479a5911e500f499e08e63a702318e5eb9f
T1: DONE
T2: DONE
T3: DONE
T4: DONE
T5: DONE
T6: DONE
T7: DONE
T8: DONE

CONNECT-FIXES ROUND (branch: connect-fixes):
- Part A: Fixed admin crash - getAppSettings sync/Promise mismatch
- Part B: Fixed two defects in sql/MASTER_UPDATE.sql (track_record blanket exception, convert_request_to_order loop)
- Part C: Fixed delete-live-data role check (staff_profiles) and unprotected deletes
- Part D: Corrected DEAD page content claims in FINAL_REPORT.md
- Part E: Verified tracking auto-refresh stop conditions (completed/cancelled)
- Part F: Traced revenue 3,750 issue - data path verified clean
- Part G: Updated FINAL_REPORT.md with fix status

ROUND 3 (branch: connect-fixes):
- Part A: Fixed Insights and Overview chart containers - added minHeight to render even when empty
- Part B: Fixed Reviews page - all CRUD operations now go to Supabase first
- Part C: Fixed Requests and Careers pages - all writes now go to Supabase first
- Part D: Proved 3,750 source - legacy adminStore defaults, not used by new dashboard
- Part E: Updated FINAL_REPORT.md with Round 3 findings
