-- Customer profiles table for staff-managed VIP status and notes
-- This table allows staff to mark customers as VIP and add confidential notes
-- without modifying the core orders or customer_requests tables

create table if not exists public.customer_profiles (
  email text primary key,
  vip boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.customer_profiles enable row level security;

-- Staff can manage customer profiles
create policy "staff manages customer_profiles"
on public.customer_profiles
for all to authenticated
using (public.is_staff())
with check (public.is_staff());
