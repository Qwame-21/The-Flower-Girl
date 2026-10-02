-- Flower Girl Consolidation Migration
-- Run this in Supabase SQL Editor after reviewing. Safe to run on live database.
-- No data loss, no table drops, no resets.
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

-- Add customer_profiles table
create table if not exists public.customer_profiles (
  email text primary key,
  vip boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

do $$ begin
  create policy "staff manages customer_profiles"
  on public.customer_profiles
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
exception when duplicate_object then null; end $$;

-- Add touch_updated_at trigger to customer_profiles
drop trigger if exists set_updated_at on public.customer_profiles;
create trigger set_updated_at before update on public.customer_profiles for each row execute function public.touch_updated_at();

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

-- Replace track_record RPC to support both tracking_number and order_code
create or replace function public.track_record(lookup_reference text, lookup_contact text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare result jsonb; normalized_contact text := regexp_replace(lower(trim(lookup_contact)), '[^0-9]', '', 'g');
begin
  select jsonb_build_object(
    'kind','order','trackingNumber',o.tracking_number,'orderCode',o.order_code,'customerName',o.customer_name,
    'status',o.fulfillment_status,'paymentStatus',o.payment_status,
    'estimatedDelivery',o.estimated_delivery,'adminNote',o.admin_note,
    'requestedDeliveryDate',o.requested_delivery_date,
    'events',coalesce((select jsonb_agg(jsonb_build_object('stage',e.stage,'note',e.customer_note,'createdAt',e.created_at) order by e.created_at) from public.order_events e where e.order_id=o.id),'[]'::jsonb)
  ) into result from public.orders o
  where (lower(o.tracking_number)=lower(trim(lookup_reference)) or lower(o.order_code)=lower(trim(lookup_reference)))
    and (lower(coalesce(o.customer_email,''))=lower(trim(lookup_contact)) or (length(normalized_contact)>=9 and length(regexp_replace(o.customer_phone,'[^0-9]','','g'))>=9 and right(regexp_replace(o.customer_phone,'[^0-9]','','g),9)=right(normalized_contact,9)))
  limit 1;
  if result is not null then return result; end if;

  select jsonb_build_object(
    'kind','request','reference',r.reference,'customerName',r.customer_name,
    'requestType',r.request_type,'service',r.service,'status',r.status,
    'preferredDate',r.preferred_date,'confirmedQuote',r.confirmed_quote,
    'adminNote',r.admin_note,'updatedAt',r.updated_at
  ) into result from public.customer_requests r
  where lower(r.reference)=lower(trim(lookup_reference))
    and (lower(coalesce(r.email,''))=lower(trim(lookup_contact)) or (length(normalized_contact)>=9 and length(regexp_replace(r.phone,'[^0-9]','','g'))>=9 and right(regexp_replace(r.phone,'[^0-9]','','g),9)=right(normalized_contact,9)))
  limit 1;
  return result;
end $$;

revoke all on function public.track_record(text,text) from public;
grant execute on function public.track_record(text,text) to anon, authenticated;
do $$ declare table_name text; begin
  foreach table_name in array array['products','gallery_items']
  loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

-- Add customization_options table for storefront customization builder
create table if not exists public.customization_options (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  option_name text not null,
  estimate numeric(12,2) not null default 0 check (estimate >= 0),
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customization_options enable row level security;

do $$ begin
  create policy "staff manages customization_options"
  on public.customization_options
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public reads visible customization options"
  on public.customization_options
  for select
  using (visible);
exception when duplicate_object then null; end $$;

-- Add trigger for updated_at
drop trigger if exists set_updated_at on public.customization_options;
create trigger set_updated_at before update on public.customization_options for each row execute function public.touch_updated_at();

-- Seed default customization options from static data
insert into public.customization_options (category, option_name, estimate, display_order, visible) values
  ('Choose a base', 'Luxury box', 220, 1, true),
  ('Choose a base', 'Open hamper', 180, 2, true),
  ('Choose a base', 'Flower bouquet', 450, 3, true),
  ('Choose a base', 'Gift bag', 120, 4, true),
  ('Choose a base', 'Keepsake basket', 280, 5, true),
  ('Choose a base', 'Corporate box', 240, 6, true),
  ('Add gifts', 'Perfume', 480, 1, true),
  ('Add gifts', 'Chocolate', 120, 2, true),
  ('Add gifts', 'Fresh flowers', 300, 3, true),
  ('Add gifts', 'Jewelry', 350, 4, true),
  ('Add gifts', 'Wrist bag', 320, 5, true),
  ('Add gifts', 'Watch', 420, 6, true),
  ('Add gifts', 'Tumbler', 160, 7, true),
  ('Add gifts', 'Fabric', 380, 8, true),
  ('Add gifts', 'Self-care items', 220, 9, true),
  ('Add gifts', 'Shirt', 250, 10, true),
  ('Add gifts', 'Manicure set', 130, 11, true),
  ('Add gifts', 'Tea & cookies', 90, 12, true),
  ('Add gifts', 'Juice', 45, 13, true),
  ('Add gifts', 'Hot water bottle', 110, 14, true),
  ('Personalize', 'Engraved name', 80, 1, true),
  ('Personalize', 'Embroidered name', 120, 2, true),
  ('Personalize', 'Card message & design', 40, 3, true),
  ('Personalize', 'Photo insert', 25, 4, true),
  ('Personalize', 'Branded ribbon', 65, 5, true),
  ('Personalize', 'Company branding', 160, 6, true),
  ('Finish & deliver', 'Gift wrapping', 90, 1, true),
  ('Finish & deliver', 'Engagement wrapping', 240, 2, true),
  ('Finish & deliver', 'Same-day Accra delivery', 120, 3, true),
  ('Finish & deliver', 'Scheduled delivery', 90, 4, true),
  ('Finish & deliver', 'Store collection', 0, 5, true),
  ('Finish & deliver', 'Surprise delivery', 140, 6, true)
on conflict do nothing;

-- Seed default site settings
insert into public.site_settings (
  id, business_name, support_phone, support_email, dispatch_city, delivery_note, announcement_enabled,
  store_address, instagram_url,
  delivery_sameday_enabled, delivery_sameday_fee,
  delivery_scheduled_enabled, delivery_scheduled_fee,
  delivery_surprise_enabled, delivery_surprise_fee,
  delivery_collection_enabled, delivery_collection_fee,
  low_stock_threshold, low_stock_alerts,
  notifications_new_orders, notifications_new_requests, notifications_new_careers, notifications_low_stock,
  require_password_destructive
)
values (
  'global',
  'Flower Girl Pro',
  '+233 202 417 072',
  'info@flowergirlpro.com',
  'Accra',
  'Delivery available across Accra. Same-day delivery available when stock and schedule allow.',
  false,
  'ACP Estate Junction, Kwabenya, Accra',
  'https://www.instagram.com/thegiftingfactory/',
  true, 120,
  true, 90,
  true, 140,
  true, 0,
  3, true,
  true, true, true, true,
  true
)
on conflict (id) do update set
  business_name = EXCLUDED.business_name,
  support_phone = EXCLUDED.support_phone,
  support_email = EXCLUDED.support_email,
  dispatch_city = EXCLUDED.dispatch_city,
  delivery_note = EXCLUDED.delivery_note,
  announcement_enabled = EXCLUDED.announcement_enabled,
  store_address = EXCLUDED.store_address,
  instagram_url = EXCLUDED.instagram_url,
  delivery_sameday_enabled = EXCLUDED.delivery_sameday_enabled,
  delivery_sameday_fee = EXCLUDED.delivery_sameday_fee,
  delivery_scheduled_enabled = EXCLUDED.delivery_scheduled_enabled,
  delivery_scheduled_fee = EXCLUDED.delivery_scheduled_fee,
  delivery_surprise_enabled = EXCLUDED.delivery_surprise_enabled,
  delivery_surprise_fee = EXCLUDED.delivery_surprise_fee,
  delivery_collection_enabled = EXCLUDED.delivery_collection_enabled,
  delivery_collection_fee = EXCLUDED.delivery_collection_fee,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  low_stock_alerts = EXCLUDED.low_stock_alerts,
  notifications_new_orders = EXCLUDED.notifications_new_orders,
  notifications_new_requests = EXCLUDED.notifications_new_requests,
  notifications_new_careers = EXCLUDED.notifications_new_careers,
  notifications_low_stock = EXCLUDED.notifications_low_stock,
  require_password_destructive = EXCLUDED.require_password_destructive;

COMMIT;
