# Flower Girl - Go-Live Report

## T1: One SQL File for Everything

### SQL File Created

Created `sql/MASTER_UPDATE.sql` containing all database changes in a single, re-runnable file.

### Sections Included

1. **signin_log table and policies** - Tracks staff sign-in/out with 3 RLS policies
2. **New site_settings columns** - 5 columns for delivery selector and tracking settings
3. **track_attempts table and rate-limited track_record** - Rate limiting for tracking lookups
4. **Realtime publication additions** - Orders and admin_notifications added to supabase_realtime
5. **Order and request columns, convert_request_to_order** - Customization support and request-to-order conversion
6. **OPTIONAL delivery columns** - Commented-out proposal for orders.delivery_type and orders.delivery_fee

### Pitfalls Verified

| Pitfall | Status | Details |
|---------|--------|---------|
| CREATE POLICY IF NOT EXISTS invalid | ✅ Fixed | Uses DROP POLICY IF EXISTS then CREATE POLICY |
| Variable naming like columns | ✅ Fixed | All PL/pgSQL variables prefixed with v_ |
| track_record original return shapes | ✅ Verified | Preserves 'order', 'request', 'not_found' shapes, adds 'rate_limited' |
| Limiter fails open | ✅ Verified | Returns 'not_found' on exception, skips limiting if no client key |
| Client key extraction order | ✅ Verified | cf-connecting-ip, then x-forwarded-for, else unknown |
| No shared "unknown" bucket | ✅ Verified | Skips rate limiting entirely when client_key is 'unknown' |
| Count only FAILED lookups | ✅ Verified | v_lookup_failed set only after both order and request lookups fail |
| Compute failure count before lock decision | ✅ Fixed | CASE statement computes new count before deciding lockout |
| Delete old track_attempts rows | ✅ Verified | Deletes records older than lockout_minutes * 2 |
| convert_request_to_order checks is_staff() | ✅ Verified | Calls public.is_staff() and raises exception if false |
| Lock request row | ✅ Verified | Uses FOR UPDATE on customer_requests |
| Validate request status | ✅ Verified | Checks status='approved', confirmed_quote > 0, not already converted, delivery address given |
| Tracking/order code format | ✅ Verified | Uses GF-{timestamp} and WEB-{timestamp} matching createStaffOrder |
| Loop on clock_timestamp() | ✅ Verified | Uses clock_timestamp() (not now()) |
| Check both values for uniqueness | ✅ Verified | Checks both tracking_number and order_code before inserting |
| Create order UNPAID | ✅ Verified | payment_status='pending', fulfillment_status='pending_payment' |
| Insert order_events row | ✅ Verified | Inserts event with stage='pending_payment' |
| Same payment_provider as createStaffOrder | ✅ Verified | Uses 'staff' |
| staff_order = true | ✅ Verified | Sets staff_order=true |
| request_id link back | ✅ Verified | Sets request_id from p_request_id |
| customization_selections copied | ✅ Verified | Copies v_request.selections |
| Follow notification conventions | ✅ Verified | Inserts admin_notifications row |
| REVOKE ALL from public and anon | ✅ Verified | REVOKE ALL on both functions |
| GRANT EXECUTE to authenticated | ✅ Verified | Full argument signature used |
| Use valid types (timestamptz) | ✅ Verified | Uses timestamptz throughout |
| Never to_char an epoch value | ✅ Verified | No to_char found in file |

### Verification Query

File ends with a read-only verification SELECT that returns one row per check as (check_name, ok), with false rows first. All required checks are included:
- 5 new site_settings columns exist
- signin_log exists with RLS on and 3 policies
- track_attempts exists with RLS on and no policies
- track_record(text,text) exists, is security definer, and executable by anon
- convert_request_to_order exists with 6 arguments, is security definer, NOT executable by anon, executable by authenticated
- orders.customization_selections and customer_requests.converted_order_id exist
- orders and admin_notifications are in supabase_realtime publication
- site_content exists

### Old SQL Files Removed

The following files have been removed from the working tree (git history preserved):
- sql/live-features.sql
- sql/connect-fixes.sql
- sql/live-features-verify.sql

### SQL Testing Status

**NOT EXECUTED** - The SQL was reviewed against all pitfalls but not executed in a local PostgreSQL database. The owner should test in a non-production environment before applying to live.

### Status

**DONE** - T1 acceptance passed. sql/MASTER_UPDATE.sql is the only SQL file created by this work, with header, six sections, closing verification, and all pitfalls checked.
