-- Complete catalog, settings and order operations schema for Supabase.
-- This migration is additive and preserves the existing JSON snapshots in orders/menu_items.

create extension if not exists pgcrypto;

-- Bootstrap objects so this migration can be applied to an empty Supabase project.
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  size text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  category text not null,
  image_url text not null default '',
  badge text,
  addons jsonb not null default '[]'::jsonb,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.menu_items to anon, authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
drop policy if exists "Menu is public" on public.menu_items;
create policy "Menu is public"
  on public.menu_items for select to anon, authenticated
  using (true);

insert into public.menu_items (name, description, price, category, image_url, badge, addons, sort_order)
select seed.name, seed.description, seed.price, seed.category, seed.image_url, seed.badge, seed.addons::jsonb, seed.sort_order
from (values
  ('Espetinho de Carne', 'Carne bovina suculenta na brasa, tempero especial da casa', 10.00, 'espetinhos', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=600&fit=crop', 'Mais Vendido', '[{"name":"Bacon","price":3},{"name":"Queijo","price":2.5},{"name":"Cheddar","price":3.5}]', 1),
  ('Espetinho de Frango', 'Peito de frango temperado e grelhado na brasa', 9.00, 'espetinhos', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=600&fit=crop', null, '[{"name":"Bacon","price":3},{"name":"Queijo","price":2.5}]', 2),
  ('Espetinho Misto', 'Carne e frango no mesmo espeto, a melhor combinação', 10.50, 'espetinhos', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=600&fit=crop', null, '[{"name":"Bacon","price":3},{"name":"Queijo","price":2.5}]', 3),
  ('Picanha na Brasa', 'Picanha premium fatiada, 400g de pura suculência', 89.90, 'carnes', 'https://images.unsplash.com/photo-1546833998-877b37c2e5c4?w=600&h=600&fit=crop', 'Premium', '[{"name":"Farofa Especial","price":5},{"name":"Vinagrete","price":4}]', 4),
  ('Costela de Porco', 'Costela suína assada lentamente, desfiando no garfo', 69.90, 'carnes', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=600&fit=crop', null, '[{"name":"Molho Barbecue","price":3},{"name":"Farofa","price":5}]', 5),
  ('Coração de Frango', 'Corações selecionados, tempero leve e suculentos', 12.00, 'frango', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&h=600&fit=crop', 'Top', '[{"name":"Limão","price":1},{"name":"Pimenta","price":1.5}]', 6),
  ('Coxinha da Asa', 'Coxinhas de asa crocantes por fora, macias por dentro', 11.00, 'frango', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=600&fit=crop', null, '[{"name":"Molho Rosé","price":2}]', 7),
  ('Queijo Coalho', 'Queijo coalho na brasa, clássico e irresistível', 14.00, 'queijos', 'https://images.unsplash.com/photo-1563729768-6af784d6df1d?w=600&h=600&fit=crop', null, '[{"name":"Orégano","price":1},{"name":"Mel","price":2}]', 8),
  ('Medalhão de Carne', 'Carne envolta em bacon, recheada com queijo', 16.00, 'medalhoes', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=600&fit=crop', 'Novo', '[{"name":"Queijo Extra","price":3},{"name":"Bacon Extra","price":3.5}]', 9),
  ('Medalhão de Frango', 'Frango com cream cheese envolto em bacon', 15.00, 'medalhoes', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=600&fit=crop', null, '[{"name":"Cheddar","price":3}]', 10),
  ('Coca-Cola 350ml', 'Lata gelada', 6.00, 'bebidas', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop', null, '[]', 11),
  ('Guaraná Antarctica', 'Lata 350ml', 5.50, 'bebidas', 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&h=600&fit=crop', null, '[]', 12),
  ('Batata Frita', 'Porção generosa, crocante e dourada', 18.00, 'acompanhamentos', 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&h=600&fit=crop', null, '[{"name":"Bacon","price":5},{"name":"Cheddar","price":4}]', 13),
  ('Pão de Alho', 'Pão artesanal com manteiga de alho e ervas', 8.00, 'acompanhamentos', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&h=600&fit=crop', null, '[]', 14),
  ('Pudim de Leite', 'Pudim cremoso com calda de caramelo', 12.00, 'sobremesas', 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&h=600&fit=crop', null, '[]', 15),
  ('Mousse de Maracujá', 'Mousse aerado com calda de maracujá', 10.00, 'sobremesas', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop', null, '[]', 16)
) as seed(name, description, price, category, image_url, badge, addons, sort_order)
where not exists (select 1 from public.menu_items);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_order_id uuid,
  customer_name text not null,
  phone text,
  order_type text not null check (order_type in ('delivery', 'local')),
  street text,
  number text,
  complement text,
  neighborhood text,
  reference text,
  table_number text,
  payment_method text,
  change_for text,
  items jsonb not null,
  notes text,
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  status text not null default 'recebido',
  created_at timestamptz not null default now()
);

grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

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
  on public.staff_users for select to authenticated
  using (user_id = auth.uid());

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff_users
    where user_id = auth.uid() and role in ('staff', 'admin')
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
  '[{"id":"tradicional","label":"Tradicional","emoji":"🍕"},{"id":"especial","label":"Especial","emoji":"🌟"},{"id":"doce","label":"Doce","emoji":"🍫"},{"id":"bebidas","label":"Bebidas","emoji":"🥤"},{"id":"acompanhamentos","label":"Acompanhamentos","emoji":"🍟"},{"id":"sobremesas","label":"Sobremesas","emoji":"🍮"}]'::jsonb,
  '[{"id":"1","name":"Requeijão Cremoso","price":6},{"id":"2","name":"Catupiry","price":8},{"id":"3","name":"Cheddar","price":6},{"id":"4","name":"Chocolate Harold","price":6},{"id":"5","name":"Bacon Extra","price":5},{"id":"6","name":"Extra Queijo","price":7}]'::jsonb
)
on conflict (id) do nothing;

grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
drop policy if exists "Store settings are public" on public.store_settings;
create policy "Store settings are public"
  on public.store_settings for select to anon, authenticated
  using (true);
drop policy if exists "Staff can update store settings" on public.store_settings;
create policy "Staff can update store settings"
  on public.store_settings for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can view orders" on public.orders;
create policy "Staff can view orders"
  on public.orders for select to authenticated
  using (public.is_staff());
drop policy if exists "Staff can update orders" on public.orders;
create policy "Staff can update orders"
  on public.orders for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
revoke insert, delete on public.orders from anon, authenticated;

drop policy if exists "Staff can manage menu" on public.menu_items;
create policy "Staff can manage menu"
  on public.menu_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop trigger if exists store_settings_updated_at on public.store_settings;

create or replace function public.touch_updated_at()
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

alter table public.menu_items
  add column if not exists size text not null default '';

alter table public.store_settings
  add column if not exists timezone text not null default 'America/Fortaleza',
  add column if not exists currency text not null default 'BRL',
  add column if not exists accepting_orders boolean not null default true;

create table if not exists public.categories (
  id text primary key,
  label text not null check (char_length(trim(label)) between 1 and 80),
  emoji text not null default '🍕' check (char_length(emoji) between 1 and 8),
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.global_addons (
  id text primary key,
  name text not null check (char_length(trim(name)) between 1 and 80),
  price numeric(10, 2) not null check (price >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists global_addons_active_name_idx
  on public.global_addons (lower(name))
  where active = true;

create index if not exists categories_public_order_idx
  on public.categories (active, sort_order, label);

create index if not exists global_addons_public_order_idx
  on public.global_addons (active, sort_order, name);

insert into public.categories (id, label, emoji, sort_order, active)
select
  item->>'id',
  item->>'label',
  coalesce(item->>'emoji', '🍕'),
  row_number() over (order by ordinality) - 1,
  true
from public.store_settings settings
cross join lateral jsonb_array_elements(settings.categories) with ordinality as values(item, ordinality)
where settings.id = 1
  and item ? 'id'
  and item ? 'label'
on conflict (id) do nothing;

insert into public.categories (id, label, emoji, sort_order, active)
select distinct
  item.category,
  initcap(replace(replace(item.category, '-', ' '), '_', ' ')),
  '🍽️',
  1000 + row_number() over (order by item.category),
  true
from public.menu_items item
where not exists (
  select 1 from public.categories existing where existing.id = item.category
)
on conflict (id) do nothing;

insert into public.global_addons (id, name, price, sort_order, active)
select
  item->>'id',
  item->>'name',
  greatest(0, coalesce((item->>'price')::numeric, 0)),
  row_number() over (order by ordinality) - 1,
  true
from public.store_settings settings
cross join lateral jsonb_array_elements(settings.global_addons) with ordinality as values(item, ordinality)
where settings.id = 1
  and item ? 'id'
  and item ? 'name'
on conflict (id) do nothing;

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
before update on public.categories
for each row execute function public.touch_updated_at();

drop trigger if exists global_addons_updated_at on public.global_addons;
create trigger global_addons_updated_at
before update on public.global_addons
for each row execute function public.touch_updated_at();

-- Keep the existing JSON fields synchronized for backward compatibility while the normalized tables become canonical.
create or replace function public.sync_store_settings_catalog_json()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.store_settings
  set categories = coalesce((select jsonb_agg(jsonb_build_object(
    'id', c.id,
    'label', c.label,
    'emoji', c.emoji
  ) order by c.sort_order, c.label) from public.categories c where c.active), '[]'::jsonb),
  global_addons = coalesce((select jsonb_agg(jsonb_build_object(
    'id', a.id,
    'name', a.name,
    'price', a.price
  ) order by a.sort_order, a.name) from public.global_addons a where a.active), '[]'::jsonb),
  updated_at = now()
  where id = 1;
  return null;
end;
$$;

drop trigger if exists categories_sync_store_settings on public.categories;
create trigger categories_sync_store_settings
after insert or update or delete on public.categories
for each statement execute function public.sync_store_settings_catalog_json();

drop trigger if exists global_addons_sync_store_settings on public.global_addons;
create trigger global_addons_sync_store_settings
after insert or update or delete on public.global_addons
for each statement execute function public.sync_store_settings_catalog_json();

alter table public.orders
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists source text not null default 'web',
  add column if not exists cancelled_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('recebido', 'confirmado', 'em_preparo', 'saiu_entrega', 'concluido', 'cancelado'));

alter table public.orders
  drop constraint if exists orders_source_check;
alter table public.orders
  add constraint orders_source_check
  check (source in ('web', 'whatsapp', 'admin', 'import'));

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index if not exists orders_phone_created_at_idx
  on public.orders (phone, created_at desc);

create index if not exists orders_order_type_created_at_idx
  on public.orders (order_type, created_at desc);

create or replace function public.set_order_lifecycle_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.status = 'cancelado' and old.status is distinct from new.status and new.cancelled_at is null then
    new.cancelled_at = now();
  end if;
  if new.status = 'concluido' and old.status is distinct from new.status and new.completed_at is null then
    new.completed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_lifecycle_timestamps on public.orders;
create trigger orders_lifecycle_timestamps
before update on public.orders
for each row execute function public.set_order_lifecycle_timestamps();

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (status in ('recebido', 'confirmado', 'em_preparo', 'saiu_entrega', 'concluido', 'cancelado')),
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on public.order_status_history (order_id, created_at desc);

insert into public.order_status_history (order_id, status, created_at)
select order_row.id, order_row.status, order_row.created_at
from public.orders order_row
where not exists (
  select 1
  from public.order_status_history history
  where history.order_id = order_row.id
);

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_history on public.orders;
create trigger orders_status_history
after insert or update of status on public.orders
for each row execute function public.record_order_status_change();

-- Public catalog reads only expose active categories/addons. Staff can manage them.
grant select on public.categories, public.global_addons to anon, authenticated;
grant insert, update, delete on public.categories, public.global_addons to authenticated;
grant all on public.categories, public.global_addons to service_role;
alter table public.categories enable row level security;
alter table public.global_addons enable row level security;

drop policy if exists "Public can view active categories" on public.categories;
create policy "Public can view active categories"
  on public.categories for select to anon, authenticated
  using (active = true);

drop policy if exists "Staff can manage categories" on public.categories;
create policy "Staff can manage categories"
  on public.categories for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Public can view active global addons" on public.global_addons;
create policy "Public can view active global addons"
  on public.global_addons for select to anon, authenticated
  using (active = true);

drop policy if exists "Staff can manage global addons" on public.global_addons;
create policy "Staff can manage global addons"
  on public.global_addons for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Order history is private to staff and service_role.
grant select on public.order_status_history to authenticated;
grant all on public.order_status_history to service_role;
alter table public.order_status_history enable row level security;

drop policy if exists "Staff can view order history" on public.order_status_history;
create policy "Staff can view order history"
  on public.order_status_history for select to authenticated
  using (public.is_staff());

revoke all on public.order_status_history from anon;
revoke insert, update, delete on public.order_status_history from authenticated;

-- These functions are trigger-only and must not be callable through the PostgREST API.
revoke all on function public.touch_updated_at() from public;
revoke all on function public.sync_store_settings_catalog_json() from public;
revoke all on function public.set_order_lifecycle_timestamps() from public;
revoke all on function public.record_order_status_change() from public;
