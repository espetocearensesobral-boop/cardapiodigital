-- Schema PostgreSQL para deploy na Vercel.
-- Execute este arquivo no Postgres provisionado pelo Marketplace da Vercel.

create extension if not exists pgcrypto;

create table if not exists store_settings (
  id integer primary key default 1 check (id = 1),
  name text not null default 'La Bella Pizza',
  tagline text not null default 'A melhor pizza da região • Delivery e local',
  whatsapp text not null default '5588998340085',
  whatsapp_display text not null default '(88) 99834-0085',
  delivery_fee numeric(10, 2) not null default 5 check (delivery_fee >= 0),
  min_order numeric(10, 2) not null default 30 check (min_order >= 0),
  open_hour integer not null default 18 check (open_hour between 0 and 23),
  close_hour integer not null default 23 check (close_hour between 0 and 23),
  accepting_orders boolean not null default true,
  timezone text not null default 'America/Fortaleza',
  currency text not null default 'BRL',
  payment_methods jsonb not null default '{"pix":true,"dinheiro":true,"cartao":true}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  label text not null check (char_length(trim(label)) between 1 and 80),
  emoji text not null default '🍕' check (char_length(emoji) between 1 and 8),
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists global_addons (
  id text primary key,
  name text not null check (char_length(trim(name)) between 1 and 80),
  price numeric(10, 2) not null check (price >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists global_addons_active_name_idx
  on global_addons (lower(name)) where active = true;

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  category text not null,
  image_url text not null default '',
  badge text,
  addons jsonb not null default '[]'::jsonb,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists menu_items_catalog_idx on menu_items (available, category, sort_order);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_order_id uuid unique,
  customer_name text not null,
  phone text,
  order_type text not null check (order_type in ('delivery', 'local')),
  street text,
  number text,
  complement text,
  neighborhood text,
  reference text,
  table_number text,
  payment_method text check (payment_method is null or payment_method in ('pix', 'dinheiro', 'cartao')),
  change_for text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  notes text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'recebido' check (status in ('recebido', 'confirmado', 'em_preparo', 'saiu_entrega', 'concluido', 'cancelado')),
  source text not null default 'web' check (source in ('web', 'admin', 'import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status, created_at desc);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null check (status in ('recebido', 'confirmado', 'em_preparo', 'saiu_entrega', 'concluido', 'cancelado')),
  changed_by text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on order_status_history (order_id, created_at desc);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_updated_at on categories;
create trigger categories_updated_at before update on categories
for each row execute function touch_updated_at();

drop trigger if exists global_addons_updated_at on global_addons;
create trigger global_addons_updated_at before update on global_addons
for each row execute function touch_updated_at();

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
for each row execute function touch_updated_at();

create or replace function set_order_lifecycle_timestamps()
returns trigger language plpgsql as $$
begin
  if new.status = 'concluido' and (old.status is distinct from new.status) then
    new.completed_at = coalesce(new.completed_at, now());
  end if;
  if new.status = 'cancelado' and (old.status is distinct from new.status) then
    new.cancelled_at = coalesce(new.cancelled_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_lifecycle_timestamps on orders;
create trigger orders_lifecycle_timestamps before update of status on orders
for each row execute function set_order_lifecycle_timestamps();

create or replace function record_order_status_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into order_status_history (order_id, status, created_at)
    values (new.id, new.status, now());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_history on orders;
create trigger orders_status_history after insert or update of status on orders
for each row execute function record_order_status_change();

insert into store_settings (id)
values (1)
on conflict (id) do nothing;

insert into categories (id, label, emoji, sort_order) values
  ('espetinhos', 'Espetinhos', '🍢', 1),
  ('carnes', 'Carnes', '🥩', 2),
  ('frango', 'Frango', '🍗', 3),
  ('queijos', 'Queijos', '🧀', 4),
  ('medalhoes', 'Medalhões', '🥓', 5),
  ('bebidas', 'Bebidas', '🥤', 6),
  ('acompanhamentos', 'Acompanhamentos', '🍟', 7),
  ('sobremesas', 'Sobremesas', '🍮', 8)
on conflict (id) do nothing;

insert into global_addons (id, name, price, sort_order) values
  ('1', 'Requeijão Cremoso', 6, 1),
  ('2', 'Catupiry', 8, 2),
  ('3', 'Cheddar', 6, 3),
  ('4', 'Chocolate Harold', 6, 4),
  ('5', 'Bacon Extra', 5, 5),
  ('6', 'Extra Queijo', 7, 6)
on conflict (id) do nothing;

insert into menu_items (name, description, price, category, image_url, badge, addons, sort_order)
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
where not exists (select 1 from menu_items);
