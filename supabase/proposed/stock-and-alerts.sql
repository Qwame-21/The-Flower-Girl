-- Idempotent stock decrement and admin notifications triggers proposal
-- Path: supabase/proposed/stock-and-alerts.sql

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
  item_rec record;
  updated_product record;
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

  update public.checkout_attempts
  set status = 'paid', order_id = created_order_id, updated_at = now()
  where payment_reference = verified_reference;

  return jsonb_build_object('orderId', created_order_id, 'trackingNumber', attempt.tracking_number, 'orderCode', attempt.order_code, 'alreadyProcessed', false);
end $$;

revoke all on function public.finalize_paid_checkout(text,numeric,text) from public, anon, authenticated;
grant execute on function public.finalize_paid_checkout(text,numeric,text) to service_role;


-- Trigger for new customer requests
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


-- Trigger for new career applications
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
