-- Support functions for dashboard order management
-- These functions can be used if needed for automatic tracking number/order code generation

-- Function to generate tracking number (GF-TIMESTAMP-RANDOM)
create or replace function public.generate_tracking_number()
returns text language sql stable as $$
  select 'GF-' || upper(to_hex(extract(epoch from now())::bigint)) || '-' || upper(substr(md5(random()::text), 1, 6));
$$;

-- Function to generate order code (GF-YEAR-RANDOM)
create or replace function public.generate_order_code()
returns text language sql stable as $$
  select 'GF-' || extract(year from now())::text || '-' || lpad((random() * 90000 + 10000)::int::text, 5, '0');
$$;

-- Note: The dashboard currently generates these client-side in orders.js
-- These functions are provided as alternatives if server-side generation is preferred
