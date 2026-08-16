-- Centralized restaurant settings and staff authorization.
create table if not exists public.staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

grant select on public.staff_users to authenticated;
revoke all on public.staff_users from anon;
alter table public.staff_users enable row level security;

drop policy if exists "Staff can view own membership" on public.staff_users;
create policy "Staff can view own membership"
  on public.staff_users
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.staff_users
    where user_id = auth.uid()
      and role in ('staff', 'admin')
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  name text not null default 'La Bella Pizza',
  tagline text not null default 'A melhor pizza da região • Delivery e local',
  whatsapp text not null default '5588998340085',
  whatsapp_display text not null default '(88) 99834-0085',
  delivery_fee numeric(10, 2) not null default 5 check (delivery_fee >= 0),
  min_order numeric(10, 2) not null default 30 check (min_order >= 0),
  open_hour integer not null default 18 check (open_hour between 0 and 23),
  close_hour integer not null default 23 check (close_hour between 0 and 23),
  payment_methods jsonb not null default '{"pix":true,"dinheiro":true,"cartao":true}'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  global_addons jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, categories, global_addons)
values (
  1,
  '[
    {"id":"tradicional","label":"Tradicional","emoji":"🍕"},
    {"id":"especial","label":"Especial","emoji":"🌟"},
    {"id":"doce","label":"Doce","emoji":"🍫"},
    {"id":"bebidas","label":"Bebidas","emoji":"🥤"},
    {"id":"acompanhamentos","label":"Acompanhamentos","emoji":"🍟"},
    {"id":"sobremesas","label":"Sobremesas","emoji":"🍮"}
  ]'::jsonb,
  '[
    {"id":"1","name":"Requeijão Cremoso","price":6},
    {"id":"2","name":"Catupiry","price":8},
    {"id":"3","name":"Cheddar","price":6},
    {"id":"4","name":"Chocolate Harold","price":6},
    {"id":"5","name":"Bacon Extra","price":5},
    {"id":"6","name":"Extra Queijo","price":7}
  ]'::jsonb
)
on conflict (id) do nothing;

grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;

drop policy if exists "Store settings are public" on public.store_settings;
create policy "Store settings are public"
  on public.store_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Staff can update store settings" on public.store_settings;
create policy "Staff can update store settings"
  on public.store_settings
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Tighten client-visible menu writes around authenticated staff membership.
grant select, insert, update, delete on public.menu_items to authenticated;
drop policy if exists "Staff can manage menu" on public.menu_items;
create policy "Staff can manage menu"
  on public.menu_items
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Orders are inserted by the server with service_role and read/updated only by staff.
drop policy if exists "Staff can view orders" on public.orders;
drop policy if exists "Staff can update orders" on public.orders;
create policy "Staff can view orders"
  on public.orders
  for select
  to authenticated
  using (public.is_staff());
create policy "Staff can update orders"
  on public.orders
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

revoke insert, delete on public.orders from anon, authenticated;
grant update on public.orders to authenticated;

create or replace function public.touch_store_settings_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at
before update on public.store_settings
for each row
execute function public.touch_store_settings_updated_at();

-- Idempotency key prevents duplicate orders after retries or lost responses.
alter table public.orders
  add column if not exists client_order_id uuid;

create unique index if not exists orders_client_order_id_idx
  on public.orders (client_order_id)
  where client_order_id is not null;
