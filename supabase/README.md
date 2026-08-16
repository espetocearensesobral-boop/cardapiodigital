# Banco de dados Supabase

As migrations devem ser executadas nesta ordem:

1. `20260801014003_e3bcf0b7-145d-4d4b-a5b2-69cdb89cd279.sql`
2. `20260816190000_secure_admin_and_store_settings.sql`
3. `20260816193000_complete_catalog_and_order_schema.sql`

## Aplicação via Supabase CLI

Na raiz do projeto, configure o projeto Supabase e aplique as migrations:

```sh
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Se o projeto já estiver vinculado, basta executar `supabase db push`.

## Aplicação via SQL Editor

No SQL Editor do Supabase, execute os três arquivos integralmente na ordem acima. Não execute a segunda ou a terceira migration antes da primeira, pois elas dependem das tabelas `menu_items` e `orders`.

## Primeiro administrador

Crie o usuário em **Authentication > Users**. Depois execute, substituindo o UUID:

```sql
insert into public.staff_users (user_id, role)
values ('UUID_DO_USUARIO_AUTH', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

## Verificações pós-aplicação

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'menu_items', 'orders', 'staff_users', 'store_settings',
    'categories', 'global_addons', 'order_status_history'
  )
order by table_name;

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'menu_items', 'orders', 'staff_users', 'store_settings',
    'categories', 'global_addons', 'order_status_history'
  )
order by tablename;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

A chave `SUPABASE_SERVICE_ROLE_KEY` deve permanecer exclusivamente nas variáveis server-side do deploy. Ela não deve ser cadastrada como variável `VITE_*`.
