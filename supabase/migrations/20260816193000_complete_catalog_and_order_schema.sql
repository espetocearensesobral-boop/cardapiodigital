-- Complete catalog, settings and order operations schema for Supabase.
-- This migration is additive and preserves the existing JSON snapshots in orders/menu_items.

create extension if not exists pgcrypto;

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
