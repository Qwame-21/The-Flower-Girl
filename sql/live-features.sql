-- READ-ONLY. Run in the Supabase SQL editor AFTER applying sql/live-features.sql.
-- Returns one row per check. Every "ok" must be true (false rows are listed first).

select check_name, coalesce(ok, false) as ok
from (
  select 'site_settings has the 5 new columns' as check_name,
    (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'site_settings'
        and column_name in ('delivery_selector_enabled','tracking_auto_refresh_enabled',
                            'tracking_refresh_interval_seconds','track_max_failed_attempts',
                            'track_lockout_minutes')) = 5 as ok

  union all
  select 'signin_log exists with RLS on',
    (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'signin_log')

  union all
  select 'signin_log has 3 policies',
    (select count(*) from pg_policies where schemaname = 'public' and tablename = 'signin_log') = 3

  union all
  select 'track_attempts exists with RLS on and no policies',
    (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'track_attempts')
    and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'track_attempts')

  union all
  select 'track_record(text,text) exists and is security definer',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'track_record'
               and p.pronargs = 2 and p.prosecdef)

  union all
  select 'track_record is executable by anon',
    has_function_privilege('anon', to_regprocedure('public.track_record(text,text)'), 'EXECUTE')

  union all
  select 'convert_request_to_order exists and is security definer',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'convert_request_to_order'
               and p.pronargs = 6 and p.prosecdef)

  union all
  select 'convert_request_to_order is NOT executable by anon',
    not has_function_privilege('anon',
          to_regprocedure('public.convert_request_to_order(uuid,text,text,text,date,text)'), 'EXECUTE')

  union all
  select 'convert_request_to_order is executable by authenticated',
    has_function_privilege('authenticated',
          to_regprocedure('public.convert_request_to_order(uuid,text,text,text,date,text)'), 'EXECUTE')

  union all
  select 'orders.customization_selections exists',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'orders'
               and column_name = 'customization_selections')

  union all
  select 'customer_requests.converted_order_id exists',
    exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'customer_requests'
               and column_name = 'converted_order_id')

  union all
  select 'orders is in the supabase_realtime publication',
    exists (select 1 from pg_publication_tables
             where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders')

  union all
  select 'admin_notifications is in the supabase_realtime publication',
    exists (select 1 from pg_publication_tables
             where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications')

  union all
  select 'site_content table exists',
    to_regclass('public.site_content') is not null
) checks
order by ok, check_name;