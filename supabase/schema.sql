-- The Gifting Factory: production Supabase foundation
-- Run in a new Supabase project SQL editor. Re-runnable where practical.

create extension if not exists pgcrypto;

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'staff' check (role in ('owner','admin','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.staff_profiles where user_id = auth.uid() and active); $$;

create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text unique not null,
  tag text default '',
  description text not null default '',
  details jsonb not null default '[]'::jsonb,
  category text not null,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  image_path text,
  secondary_image_path text,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.products (id,name,slug,tag,description,details,category,price,stock,image_path,visible,sort_order) values
('hamper-3750','Luxury hamper','luxury-hamper','SIGNATURE','Laptop bag, Lacoste shirt, YSL perfume, Patek Philippe watch, manicure set and card.','["Premium gift box","Fashion and fragrance selection","Watch and grooming pieces","Personal message card"]','hampers',3750,25,'hamper-editorial-v2.png',true,10),
('christmas-bundle','Christmas bundle','christmas-bundle','SEASONAL','Six yards of Hollandaise fabric, Bodycology fragrance splash and an insulated tumbler.','["Hollandaise fabric","Fragrance splash","Insulated tumbler","Gift presentation"]','bundles',1250,20,'engagement-presentation-v2.png',true,20),
('period-care','Period care box','period-care-box','SUBSCRIPTION','Pads and panty liners, feminine wash and wipes, ginger tea with mint, cranberry juice, cookies and a hot water bottle.','["Period-care essentials","Tea, juice and cookies","Hot water bottle","Optional monthly delivery"]','care',650,30,'wrapping-editorial-v2.png',true,30),
('fresh-bouquet','Fresh flower bouquet','fresh-flower-bouquet','FRESH','A fresh arrangement selected around your preferred palette, occasion and delivery date.','["Seasonal fresh flowers","Chosen colour direction","Hand-tied finishing","Message card"]','flowers',450,30,'bouquet-editorial-v2.png',true,40),
('fragrance-gift','Fragrance & treats gift','fragrance-treats-gift','FREQUENTLY CHOSEN','A personalized combination of fragrance, premium chocolate, flowers and a handwritten card.','["Fragrance selection","Premium chocolates","Fresh floral accent","Handwritten card"]','hampers',950,20,'basket-hamper-editorial-v2.png',true,50),
('personalized-bag','Personalized wrist bag','personalized-wrist-bag','PERSONALIZED','A wrist bag gift with optional name engraving, wrapping and additional accessories.','["Wrist bag","Optional name finishing","Gift wrapping","Selected accessories"]','personalized',650,20,'delivery-editorial-v2.png',true,60),
('embroidery','Embroidery & personalization','embroidery-personalization','MADE TO ORDER','Add a name or short personal detail to selected shirts, fabric gifts and accessories.','["Name or short wording","Thread colour selection","Placement confirmation","Production approval"]','personalized',180,50,'embroidery-editorial-v2.png',true,70)
on conflict (id) do nothing;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(), title text not null,
  description text not null default '', status text not null default 'draft' check (status in ('draft','live')),
  sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.collection_products (
  collection_id uuid references public.collections(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  sort_order integer not null default 0, primary key (collection_id, product_id)
);
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(), product_id text not null references public.products(id) on delete cascade,
  percent numeric(5,2) not null check (percent > 0 and percent <= 90), status text not null default 'paused' check (status in ('active','paused')),
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists one_active_promotion_per_product on public.promotions(product_id) where status = 'active';

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(), image_path text not null, label text not null,
  visible boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.customer_requests (
  id uuid primary key default gen_random_uuid(), reference text unique not null,
  request_type text not null check (request_type in ('bespoke_gift','service')),
  service text, customer_name text not null, email text, phone text not null,
  occasion text, preferred_date date, selections jsonb not null default '[]'::jsonb,
  quantity integer not null default 1 check (quantity > 0), notes text,
  card_message text, card_style text, inspiration_path text,
  estimate_low numeric(12,2), estimate_high numeric(12,2), confirmed_quote numeric(12,2),
  status text not null default 'new' check (status in ('new','quote_needed','approved','converted','closed')),
  admin_note text, approved_at timestamptz, converted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), tracking_number text unique not null, order_code text unique not null,
  request_id uuid references public.customer_requests(id) on delete set null,
  customer_name text not null, customer_email text, customer_phone text not null,
  recipient_name text, delivery_address text not null, landmark text, location_link text,
  customer_note text, card_message text, card_style text, requested_delivery_date date,
  subtotal numeric(12,2) not null check (subtotal >= 0), total numeric(12,2) not null check (total >= 0),
  payment_provider text not null default 'paystack', payment_reference text unique,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  fulfillment_status text not null default 'pending_payment' check (fulfillment_status in ('pending_payment','paid','packaging','ready','delivery','completed','cancelled')),
  estimated_delivery timestamptz, admin_note text, staff_order boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null, item_name text not null,
  quantity integer not null check (quantity > 0), unit_price numeric(12,2) not null check (unit_price >= 0), metadata jsonb not null default '{}'::jsonb
);
create table if not exists public.order_events (
  id bigint generated always as identity primary key, order_id uuid not null references public.orders(id) on delete cascade,
  stage text not null check (stage in ('pending_payment','paid','packaging','ready','delivery','completed','cancelled')),
  customer_note text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);

-- A checkout attempt is not an order. It holds the server-validated basket until
-- Paystack confirms payment. Only the signed webhook finalizes it into an order.
create table if not exists public.checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  payment_reference text unique not null,
  tracking_number text unique not null,
  order_code text unique not null,
  customer_email text not null,
  checkout_data jsonb not null,
  items jsonb not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  total numeric(12,2) not null check (total >= 0),
  currency text not null default 'GHS' check (currency = 'GHS'),
  status text not null default 'initialized' check (status in ('initialized','paid','failed','expired')),
  authorization_url text,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), customer_name text not null, product_or_service text not null,
  rating integer not null check (rating between 1 and 5), review_text text not null,
  status text not null default 'pending' check (status in ('pending','published','flagged')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(), title text not null, location text, employment_type text,
  description text not null, status text not null default 'draft' check (status in ('draft','open','paused','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(), career_id uuid references public.careers(id) on delete set null,
  full_name text not null, email text not null, phone text not null, location text,
  portfolio_url text, earliest_start_date date, experience text, motivation text, resume_path text,
  status text not null default 'new' check (status in ('new','reviewing','shortlisted','rejected','hired')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.site_content (
  key text primary key, value text not null default '', updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create table if not exists public.site_settings (
  id text primary key default 'global' check (id = 'global'), business_name text not null,
  support_phone text, support_email text, dispatch_city text, delivery_note text,
  announcement_enabled boolean not null default false, updated_at timestamptz not null default now()
);
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(), type text not null, title text not null, body text,
  route text, record_id text, read_at timestamptz, created_at timestamptz not null default now()
);

-- Public media buckets. Originals are uploaded by staff; request files use signed URLs.
insert into storage.buckets (id, name, public) values ('storefront-media','storefront-media',true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('request-uploads','request-uploads',false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('career-files','career-files',false) on conflict (id) do nothing;

alter table public.staff_profiles enable row level security;
alter table public.products enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.promotions enable row level security;
alter table public.gallery_items enable row level security;
alter table public.customer_requests enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.checkout_attempts enable row level security;
alter table public.reviews enable row level security;
alter table public.careers enable row level security;
alter table public.career_applications enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_notifications enable row level security;

do $$ begin
  create policy "public reads visible products" on public.products for select using (visible);
  create policy "public reads live collections" on public.collections for select using (status = 'live');
  create policy "public reads collection products" on public.collection_products for select using (true);
  create policy "public reads active promotions" on public.promotions for select using (status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
  create policy "public reads visible gallery" on public.gallery_items for select using (visible);
  create policy "public reads published reviews" on public.reviews for select using (status = 'published');
  create policy "public reads open careers" on public.careers for select using (status = 'open');
  create policy "public reads site content" on public.site_content for select using (true);
  create policy "public reads site settings" on public.site_settings for select using (true);
exception when duplicate_object then null; end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['staff_profiles','products','collections','collection_products','promotions','gallery_items','customer_requests','orders','order_items','order_events','checkout_attempts','reviews','careers','career_applications','site_content','site_settings','admin_notifications']
  loop execute format('create policy "staff manages %1$s" on public.%1$I for all to authenticated using (public.is_staff()) with check (public.is_staff())', table_name);
  end loop;
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public reads storefront media" on storage.objects for select using (bucket_id = 'storefront-media');
  create policy "staff manages storefront media" on storage.objects for all to authenticated using (bucket_id = 'storefront-media' and public.is_staff()) with check (bucket_id = 'storefront-media' and public.is_staff());
  create policy "staff reads request uploads" on storage.objects for select to authenticated using (bucket_id in ('request-uploads','career-files') and public.is_staff());
exception when duplicate_object then null; end $$;

-- Public forms and checkout must call server/Edge Functions using the service role.
-- Do not add anonymous INSERT/UPDATE policies to orders, requests, applications or storage.

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

do $$ declare table_name text; begin
  foreach table_name in array array['products','collections','promotions','gallery_items','customer_requests','orders','checkout_attempts','reviews','careers','career_applications','site_content','site_settings']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.touch_updated_at()', table_name);
  end loop;
end $$;

-- Idempotent, transactional conversion used only after webhook verification.
create or replace function public.finalize_paid_checkout(
  verified_reference text,
  verified_amount numeric,
  verified_currency text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt public.checkout_attempts%rowtype;
  created_order_id uuid;
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
    attempt.subtotal, attempt.total, 'paystack', attempt.payment_reference, 'paid', 'paid'
  ) returning id into created_order_id;

  insert into public.order_items (order_id, product_id, item_name, quantity, unit_price, metadata)
  select created_order_id, item.product_id, item.item_name, item.quantity, item.unit_price, coalesce(item.metadata, '{}'::jsonb)
  from jsonb_to_recordset(attempt.items) as item(product_id text, item_name text, quantity integer, unit_price numeric, metadata jsonb);

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

-- Customer-safe tracking lookup. Server-side rate limiting is still required.
create or replace function public.track_record(lookup_reference text, lookup_contact text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare result jsonb; normalized_contact text := regexp_replace(lower(trim(lookup_contact)), '[^0-9]', '', 'g');
begin
  select jsonb_build_object(
    'kind','order','trackingNumber',o.tracking_number,'customerName',o.customer_name,
    'status',o.fulfillment_status,'paymentStatus',o.payment_status,
    'estimatedDelivery',o.estimated_delivery,'adminNote',o.admin_note,
    'requestedDeliveryDate',o.requested_delivery_date,
    'events',coalesce((select jsonb_agg(jsonb_build_object('stage',e.stage,'note',e.customer_note,'createdAt',e.created_at) order by e.created_at) from public.order_events e where e.order_id=o.id),'[]'::jsonb)
  ) into result from public.orders o
  where lower(o.tracking_number)=lower(trim(lookup_reference))
    and (lower(coalesce(o.customer_email,''))=lower(trim(lookup_contact)) or (length(normalized_contact)>=9 and length(regexp_replace(o.customer_phone,'[^0-9]','','g'))>=9 and right(regexp_replace(o.customer_phone,'[^0-9]','','g'),9)=right(normalized_contact,9)))
  limit 1;
  if result is not null then return result; end if;

  select jsonb_build_object(
    'kind','request','reference',r.reference,'customerName',r.customer_name,
    'requestType',r.request_type,'service',r.service,'status',r.status,
    'preferredDate',r.preferred_date,'confirmedQuote',r.confirmed_quote,
    'adminNote',r.admin_note,'updatedAt',r.updated_at
  ) into result from public.customer_requests r
  where lower(r.reference)=lower(trim(lookup_reference))
    and (lower(coalesce(r.email,''))=lower(trim(lookup_contact)) or (length(normalized_contact)>=9 and length(regexp_replace(r.phone,'[^0-9]','','g'))>=9 and right(regexp_replace(r.phone,'[^0-9]','','g'),9)=right(normalized_contact,9)))
  limit 1;
  return result;
end $$;

revoke all on function public.track_record(text,text) from public;
grant execute on function public.track_record(text,text) to anon, authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['orders','order_events','customer_requests','admin_notifications']
  loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
