# La Bella Pizza — Cardápio Digital

Cardápio digital mobile-first para a La Bella Pizza, com catálogo, busca, categorias, adicionais, carrinho, checkout, gravação segura de pedidos e encaminhamento para o WhatsApp. O projeto também possui um painel administrativo protegido por autenticação Supabase para produtos, configurações e acompanhamento de pedidos.

## Stack

A aplicação utiliza TanStack Start, React 19, TanStack Router, TanStack Query, Vite, Tailwind CSS, Supabase e Server Functions. O gerenciamento oficial de dependências é feito com **pnpm 11** e o lockfile versionado é `pnpm-lock.yaml`.

## Desenvolvimento local

É necessário Node.js 22 ou superior. Depois de clonar o repositório, instale as dependências e inicie o servidor:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha as variáveis do projeto Supabase:

```sh
cp .env.example .env
```

`SUPABASE_SERVICE_ROLE_KEY` é uma variável exclusivamente server-side. Nunca use o prefixo `VITE_` nessa chave e nunca a exponha no navegador. As variáveis com prefixo `VITE_` podem conter apenas a URL e a chave pública do Supabase.

## Banco de dados e acesso administrativo

As migrations em `supabase/migrations/` formam o esquema completo do Supabase. A primeira migration (`20260816190000_secure_admin_and_store_settings.sql`) cria configurações compartilhadas, membros da equipe, policies RLS e a chave de idempotência dos pedidos. A segunda (`20260816193000_complete_catalog_and_order_schema.sql`) normaliza categorias e adicionais, cria histórico de status, timestamps operacionais, índices, constraints e policies públicas/administrativas.

Aplique as migrations na ordem em que aparecem no diretório antes da publicação. Se estiver usando o Supabase CLI, execute `supabase db push` a partir da raiz do projeto; alternativamente, copie cada arquivo para o SQL Editor do Supabase e execute-os em sequência.

Depois de criar um usuário em Supabase Auth, associe-o à equipe com uma operação administrativa no banco:

```sql
insert into public.staff_users (user_id, role)
values ('UUID_DO_USUARIO_AUTH', 'admin');
```

O acesso ao painel está disponível em `/admin`. Usuários autenticados sem registro em `staff_users` não podem visualizar ou executar operações administrativas. A tabela `order_status_history` registra automaticamente cada mudança de status, enquanto `categories` e `global_addons` são as fontes normalizadas do catálogo; os snapshots JSON em `store_settings` permanecem sincronizados para compatibilidade.

## Scripts de qualidade

```sh
pnpm run typecheck
pnpm run lint:ci
pnpm run test
pnpm run build
pnpm run check
```

O script `build` executa o typecheck antes da compilação. O workflow em `.github/workflows/ci.yml` executa instalação reprodutível, typecheck, lint, testes e build em cada push para `main` e em pull requests.

## Integração com WhatsApp

O pedido é validado e gravado no Supabase antes de gerar a URL do WhatsApp. O servidor calcula preços, adicionais, taxa de entrega e pedido mínimo a partir das configurações e do cardápio atuais; o navegador envia somente IDs, quantidades, seleções e observações. Uma chave de idempotência impede duplicação quando uma tentativa é reenviada.

## Lovable

Este projeto foi originalmente criado com [Lovable](https://lovable.dev). Commits enviados à branch conectada podem ser sincronizados com o editor Lovable. Não faça force push, rebase, amend ou squash de commits já publicados.
