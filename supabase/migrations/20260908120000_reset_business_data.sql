-- Install once as database owner. This migration does not delete business data.
create schema if not exists business_reset_backup;
revoke all on schema business_reset_backup from public, anon, authenticated;
create table if not exists business_reset_backup.snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null,
  records jsonb not null
);
revoke all on business_reset_backup.snapshots from public, anon, authenticated;

create or replace function public.reset_business_data(confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target text;
  snapshot jsonb := '{}'::jsonb;
  rows jsonb;
  targets text[] := array['admin_notifications','order_events','order_items','checkout_attempts','orders','customer_requests','career_applications','careers','collection_products','promotions','collections','reviews','products','site_content'];
begin
  if confirmation is distinct from 'DELETE DATABASE DATA' then
    raise exception 'Explicit confirmation required';
  end if;
  if not exists(select 1 from public.staff_profiles where user_id = auth.uid() and active and role = 'owner') then
    raise exception 'Active owner access required' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(809081200);
  foreach target in array targets loop
    execute format('lock table public.%I in access exclusive mode', target);
    execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t', target) into rows;
    snapshot := snapshot || jsonb_build_object(target, rows);
  end loop;
  insert into business_reset_backup.snapshots(created_by, records) values(auth.uid(), snapshot);
  foreach target in array targets loop
    execute format('delete from public.%I', target);
  end loop;
end;
$$;
revoke all on function public.reset_business_data(text) from public, anon;
grant execute on function public.reset_business_data(text) to authenticated;
