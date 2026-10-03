-- Flower Girl Consolidation Migration
-- Safe to run on live database. No data loss, no table drops, no resets.
-- Can be re-run idempotently.
--
-- Table of Contents:
-- 1. Add category column to gallery_items
-- 2. Correct finalize_paid_checkout function signature
-- 3. Add stock decrement trigger
-- 4. Add low-stock notification trigger
-- 5. Add Paystack paid-lock trigger (staff orders excluded)
-- 6. Add request notification trigger
-- 7. Add career application notification trigger
-- 8. Add missing columns to site_settings
-- 9. Add tables to realtime publication
-- 10. Add phone normalization helper and update track_record function
--
BEGIN;

-- Add category column to gallery_items
alter table public.gallery_items add column if not exists category text;

-- Add missing columns to site_settings
alter table public.site_settings add column if not exists store_address text;
alter table public.site_settings add column if not exists instagram_url text;
alter table public.site_settings add column if not exists delivery_sameday_enabled boolean not null default true;
alter table public.site_settings add column if not exists delivery_sameday_fee numeric(12,2) not null default 120;
alter table public.site_settings add column if not exists delivery_scheduled_enabled boolean not null default true;
alter table public.site_settings add column if not exists delivery_scheduled_fee numeric(12,2) not null default 90;
alter table public.site_settings add column if not exists delivery_surprise_enabled boolean not null default true;
alter table public.site_settings add column if not exists delivery_surprise_fee numeric(12,2) not null default 140;
alter table public.site_settings add column if not exists delivery_collection_enabled boolean not null default true;
alter table public.site_settings add column if not exists delivery_collection_fee numeric(12,2) not null default 0;
alter table public.site_settings add column if not exists low_stock_threshold integer not null default 3;
alter table public.site_settings add column if not exists low_stock_alerts boolean not null default true;
alter table public.site_settings add column if not exists notifications_new_orders boolean not null default true;
alter table public.site_settings add column if not exists notifications_new_requests boolean not null default true;
alter table public.site_settings add column if not exists notifications_new_careers boolean not null default true;
alter table public.site_settings add column if not exists notifications_low_stock boolean not null default true;
alter table public.site_settings add column if not exists require_password_destructive boolean not null default true;

-- Replace finalize_paid_checkout with enhanced version (stock decrement, category storage, fixed fulfillment_status)
create or replace function public.finalize_paid_checkout(
  verified_reference text,
  verified_amount numeric,
  verified_currency text default 'GHS'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt public.checkout_attempts%rowtype;
  created_order_id uuid;
  item_rec record;
  updated_product record;
  item_category text;
begin
  select * into attempt from public.checkout_attempts
  where payment_reference = verified_reference
  for update;

  if not found then raise exception 'checkout_not_found'; end if;
  if attempt.status = 'paid' and attempt.order_id is not null then
    return jsonb_build_object('orderId', attempt.order_id, 'trackingNumber', attempt.tracking_number, 'orderCode', attempt.order_code, 'alreadyProcessed', true);
  end if;
  if attempt.status <> 'initialized' then raise exception 'checkout_not_payable'; end if;
  if attempt.currency <> upper(verified_currency) or abs(attempt.total - verified_amount) > 0.01 then
    raise exception 'payment_mismatch';
  end if;

  insert into public.orders (
    tracking_number, order_code, customer_name, customer_email, customer_phone,
    recipient_name, delivery_address, landmark, location_link, customer_note,
    card_message, card_style, requested_delivery_date, subtotal, total,
    payment_provider, payment_reference, payment_status, fulfillment_status
  ) values (
    attempt.tracking_number, attempt.order_code,
    attempt.checkout_data->>'customer_name', attempt.customer_email,
    attempt.checkout_data->>'customer_phone', attempt.checkout_data->>'recipient_name',
    attempt.checkout_data->>'delivery_address', nullif(attempt.checkout_data->>'landmark',''),
    nullif(attempt.checkout_data->>'location_link',''), nullif(attempt.checkout_data->>'customer_note',''),
    nullif(attempt.checkout_data->>'card_message',''), nullif(attempt.checkout_data->>'card_style',''),
    nullif(attempt.checkout_data->>'requested_delivery_date','')::date,
    attempt.subtotal, attempt.total, 'paystack', attempt.payment_reference, 'paid', 'packaging'
  ) returning id into created_order_id;

  -- Insert order_items with category stored in metadata for analytics
  for item_rec in
    select item.product_id, item.item_name, item.quantity, item.unit_price, coalesce(item.metadata, '{}'::jsonb)
    from jsonb_to_recordset(attempt.items) as item(product_id text, item_name text, quantity integer, unit_price numeric, metadata jsonb)
  loop
    select category into item_category from public.products where id = item_rec.product_id;
    insert into public.order_items (order_id, product_id, item_name, quantity, unit_price, metadata)
    values (
      created_order_id, item_rec.product_id, item_rec.item_name, item_rec.quantity, item_rec.unit_price,
      coalesce(item_rec.metadata, '{}'::jsonb) || jsonb_build_object('category', item_category)
    );
  end loop;

  -- Decrement products stock and check low stock threshold
  for item_rec in
    select item.product_id, item.item_name, item.quantity
    from jsonb_to_recordset(attempt.items) as item(product_id text, item_name text, quantity integer, unit_price numeric, metadata jsonb)
  loop
    if item_rec.product_id is not null then
      update public.products
      set stock = greatest(0, coalesce(stock, 0) - item_rec.quantity),
          updated_at = now()
      where id = item_rec.product_id
      returning id, name, stock, low_stock_threshold into updated_product;

      if found and updated_product.stock <= coalesce(updated_product.low_stock_threshold, 3) then
        insert into public.admin_notifications (type, title, body, route, record_id)
        values (
          'low_stock',
          'Low stock: ' || updated_product.name,
          'Stock for ' || updated_product.name || ' dropped to ' || updated_product.stock || ' (threshold: ' || coalesce(updated_product.low_stock_threshold, 3) || ')',
          '/admin',
          updated_product.id
        );
      end if;
    end if;
  end loop;

  insert into public.order_events (order_id, stage, customer_note)
  values (created_order_id, 'paid', 'Payment confirmed');

  insert into public.admin_notifications (type, title, body, route, record_id)
  values ('new_order', 'New paid order', attempt.tracking_number || ' · GHS ' || attempt.total, '/admin', created_order_id::text);

  update public.checkout_attempts set status='paid', order_id=created_order_id, updated_at=now()
  where id=attempt.id;

  return jsonb_build_object('orderId', created_order_id, 'trackingNumber', attempt.tracking_number, 'orderCode', attempt.order_code, 'alreadyProcessed', false);
end $$;

revoke all on function public.finalize_paid_checkout(text,numeric,text) from public, anon, authenticated;
grant execute on function public.finalize_paid_checkout(text,numeric,text) to service_role;

-- Add Paystack payment protection trigger
create or replace function public.protect_paystack_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.payment_status = 'paid' and new.payment_status <> 'paid' and old.payment_provider = 'paystack' and new.staff_order = false then
    raise exception 'Cannot undo payment on Paystack orders. Staff orders (staff_order = true) may toggle paid/unpaid freely.';
  end if;
  return new;
end $$;

drop trigger if exists protect_paystack_payment on public.orders;
create trigger protect_paystack_payment
  before update of payment_status on public.orders
  for each row execute function public.protect_paystack_payment();

-- Add admin status change notification trigger
create or replace function public.notify_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.fulfillment_status is distinct from new.fulfillment_status then
    insert into public.admin_notifications (type, title, body, route, record_id)
    values (
      'status_change',
      'Order status changed',
      'Order ' || new.tracking_number || ' is now ' || new.fulfillment_status,
      '/admin',
      new.id::text
    );
  end if;
  return new;
end $$;

drop trigger if exists notify_status_change on public.orders;
create trigger notify_status_change
  after update of fulfillment_status on public.orders
  for each row execute function public.notify_status_change();

-- Add customer request notification trigger
create or replace function public.notify_new_customer_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, title, body, route, record_id)
  values (
    'new_request',
    'New customer request from ' || new.customer_name,
    'Type: ' || new.request_type,
    '/admin',
    new.id::text
  );
  return new;
end $$;

drop trigger if exists on_new_customer_request on public.customer_requests;
create trigger on_new_customer_request
  after insert on public.customer_requests
  for each row execute function public.notify_new_customer_request();

-- Add career application notification trigger
create or replace function public.notify_new_career_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pos_title text;
begin
  select title into pos_title from public.careers where id = new.career_id;

  insert into public.admin_notifications (type, title, body, route, record_id)
  values (
    'new_application',
    'New career application from ' || new.full_name,
    'Role: ' || coalesce(pos_title, 'General Application'),
    '/admin',
    new.id::text
  );
  return new;
end $$;

drop trigger if exists on_new_career_application on public.career_applications;
create trigger on_new_career_application
  after insert on public.career_applications
  for each row execute function public.notify_new_career_application();

-- Phone normalization helper: keeps digits only, drops +, 00, and Ghana country code 233, drops single leading 0
-- Returns national number for Ghana numbers, full digits for other countries
create or replace function public.normalize_phone(phone text)
returns text language sql immutable strict parallel safe
as $$
declare digits text;
begin
  digits := regexp_replace(phone, '[^0-9]', '', 'g');
  -- Drop leading +
  if digits like '+%' then
    digits := substring(digits from 2);
  end if;
  -- Drop leading 00
  if digits like '00%' then
    digits := substring(digits from 3);
  end if;
  -- For Ghana numbers (start with 233), drop the country code
  if digits like '233%' then
    digits := substring(digits from 4);
  end if;
  -- Drop single leading 0
  if digits like '0%' then
    digits := substring(digits from 2);
  end if;
  return digits;
end $$;

-- Replace track_record RPC to support both tracking_number and order_code with normalized phone matching
create or replace function public.track_record(lookup_reference text, lookup_contact text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare result jsonb; normalized_lookup_phone text; normalized_stored_phone text;
begin
  normalized_lookup_phone := public.normalize_phone(lookup_contact);
  
  select jsonb_build_object(
    'kind','order','trackingNumber',o.tracking_number,'orderCode',o.order_code,'customerName',o.customer_name,
    'status',o.fulfillment_status,'paymentStatus',o.payment_status,
    'estimatedDelivery',o.estimated_delivery,'adminNote',o.admin_note,
    'requestedDeliveryDate',o.requested_delivery_date,
    'events',coalesce((select jsonb_agg(jsonb_build_object('stage',e.stage,'note',e.customer_note,'createdAt',e.created_at) order by e.created_at) from public.order_events e where e.order_id=o.id),'[]'::jsonb)
  ) into result from public.orders o
  where (lower(o.tracking_number)=lower(trim(lookup_reference)) or lower(o.order_code)=lower(trim(lookup_reference)))
    and (lower(coalesce(o.customer_email,''))=lower(trim(lookup_contact)) or public.normalize_phone(o.customer_phone)=normalized_lookup_phone)
  limit 1;
  if result is not null then return result; end if;

  select jsonb_build_object(
    'kind','request','reference',r.reference,'customerName',r.customer_name,
    'requestType',r.request_type,'service',r.service,'status',r.status,
    'preferredDate',r.preferred_date,'confirmedQuote',r.confirmed_quote,
    'adminNote',r.admin_note,'updatedAt',r.updated_at
  ) into result from public.customer_requests r
  where lower(r.reference)=lower(trim(lookup_reference))
    and (lower(coalesce(r.email,''))=lower(trim(lookup_contact)) or public.normalize_phone(r.phone)=normalized_lookup_phone)
  limit 1;
  return result;
end $$;

revoke all on function public.track_record(text,text) from public;
grant execute on function public.track_record(text,text) to anon, authenticated;

-- Test queries for phone normalization (run after migration to verify)
-- select public.normalize_phone('+233 20 317 6791');  -- Expected: 203176791
-- select public.normalize_phone('0203176791');       -- Expected: 203176791
-- select public.normalize_phone('233203176791');      -- Expected: 203176791
-- select public.normalize_phone('+233203176791');    -- Expected: 203176791
-- select public.normalize_phone('020 317 6791');     -- Expected: 203176791
-- select public.normalize_phone('+44 7700 900077'); -- Expected: 447700900077 (non-Ghana, keeps all digits)
-- select public.normalize_phone('07700 900077');    -- Expected: 7700900077 (non-Ghana, drops leading 0)

do $$ declare table_name text; begin
  foreach table_name in array array['products','gallery_items']
  loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

COMMIT;
