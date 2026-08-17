# Banco de dados Supabase

Para uma instalação normal via Supabase CLI, as migrations devem ser executadas nesta ordem:

1. `20260801014003_e3bcf0b7-145d-4d4b-a5b2-69cdb89cd279.sql`
2. `20260816190000_secure_admin_and_store_settings.sql`
3. `20260816193000_complete_catalog_and_order_schema.sql`

A terceira migration foi tornada autossuficiente: se você estiver usando o SQL Editor em um projeto totalmente vazio, pode executar somente `20260816193000_complete_catalog_and_order_schema.sql`. Ela cria as tabelas-base, policies, seeds e estruturas complementares antes de aplicar os upgrades.

## Aplicação via Supabase CLI

Na raiz do projeto, configure o projeto Supabase e aplique as migrations:

```sh
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

Se o projeto já estiver vinculado, basta executar `supabase db push`.

## Aplicação via SQL Editor

No SQL Editor do Supabase, execute os três arquivos integralmente na ordem acima. Como alternativa para um projeto vazio, execute somente a terceira migration, que contém o bootstrap completo. Não combine a terceira migration com um script parcialmente executado; se uma execução anterior falhar, corrija o estado ou reinicie o projeto antes de repetir.

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

## Modo do checkout

Enquanto o catálogo público estiver usando dados mockados, o checkout também usa o catálogo local por padrão. Para ativar explicitamente a validação e o salvamento no Supabase após confirmar as tabelas e as variáveis do deploy, configure a variável server-side:

```env
MOCK_DATA_MODE=false
```

Com qualquer outro valor, ou sem essa variável, o pedido é validado e confirmado pelo catálogo mockado local, evitando que uma configuração Supabase incompleta interrompa a finalização do pedido.

## Acesso administrativo de demonstração

Com o banco desconectado, o login administrativo funciona em modo de demonstração por padrão. Use:

```text
Usuário: admin@labellapizza.local
Senha: LaBella@2026
```

A sessão é mantida apenas no `localStorage` do navegador e não representa uma conta real. Para reativar a autenticação Supabase, configure `VITE_ADMIN_DEMO_MODE=false` no ambiente do frontend e mantenha as variáveis públicas do Supabase configuradas. A central `/pedidos` continua usando os pedidos mockados até a integração de leitura ser ativada.
