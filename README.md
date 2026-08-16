# Cardápio Digital

Cardápio digital mobile-first para a La Bella Pizza, com catálogo, busca, categorias, adicionais, carrinho, checkout, gravação server-side de pedidos e encaminhamento para o WhatsApp. O projeto também possui um painel administrativo protegido por sessão própria, com produtos, configurações e acompanhamento de pedidos.

## Stack

A aplicação utiliza TanStack Start, React 19, TanStack Router, TanStack Query, Vite, Tailwind CSS, Server Functions e Postgres. O build usa Nitro com preset `vercel`, e o gerenciamento oficial de dependências é feito com **pnpm 11** usando o lockfile `pnpm-lock.yaml`.

O banco recomendado é um Postgres provisionado por uma integração do Vercel Marketplace, como Neon. O projeto não possui dependência ou conexão com Supabase.

## Desenvolvimento local

É necessário Node.js 22 ou superior. Depois de clonar o repositório, instale as dependências e inicie o servidor:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Variáveis de ambiente

Configure as variáveis no ambiente **Production**, **Preview** e **Development** da Vercel conforme necessário:

| Variável         | Obrigatória | Exposição   | Finalidade                                                                                         |
| ---------------- | ----------: | ----------- | -------------------------------------------------------------------------------------------------- |
| `POSTGRES_URL`   |         Sim | Server-side | String de conexão fornecida pela integração Postgres do Vercel Marketplace.                        |
| `DATABASE_URL`   | Alternativa | Server-side | Alias aceito quando o provedor usa este nome. Não é necessário se `POSTGRES_URL` estiver presente. |
| `SESSION_SECRET` |         Sim | Server-side | Chave para assinar o cookie administrativo; use pelo menos 32 caracteres.                          |
| `ADMIN_EMAIL`    |         Sim | Server-side | E-mail do operador do painel.                                                                      |
| `ADMIN_PASSWORD` |         Sim | Server-side | Senha do operador do painel. Nunca use prefixo `VITE_`.                                            |
| `PUBLIC_APP_URL` |         Não | Server-side | Domínio público opcional, usado em integrações futuras e metadados.                                |

Gere uma chave de sessão segura com:

```sh
openssl rand -base64 48
```

O arquivo `.env.example` contém somente placeholders. Os valores reais devem ser cadastrados diretamente na Vercel; não coloque segredos no Git.

## Banco de dados

Execute `database/schema.sql` no Postgres provisionado pela integração da Vercel. O schema cria `store_settings`, `categories`, `global_addons`, `menu_items`, `orders` e `order_status_history`, além de índices, constraints, triggers de timestamps, idempotência de pedidos, histórico automático de status e seed inicial do catálogo.

O acesso ao banco ocorre exclusivamente em Server Functions. O navegador nunca recebe a string de conexão, e o painel usa `ADMIN_EMAIL`, `ADMIN_PASSWORD` e um cookie HttpOnly assinado por `SESSION_SECRET`.

## Deploy na Vercel

A Vercel detecta o projeto TanStack Start/Nitro. O `vite.config.ts` fixa explicitamente `nitro: { preset: "vercel" }`, garantindo o alvo correto para Vercel Functions.

Depois de conectar o repositório:

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
```

No painel da Vercel, instale uma integração Postgres pelo Marketplace, copie ou confirme a variável `POSTGRES_URL`, cadastre as variáveis administrativas e execute o `database/schema.sql` no banco. O comando de build recomendado é `pnpm run build`.

## Scripts de qualidade

```sh
pnpm run typecheck
pnpm run lint:ci
pnpm run test
pnpm run build
pnpm run check
```

O workflow em `.github/workflows/ci.yml` executa instalação reprodutível, typecheck, lint, testes e build em cada push para `main` e em pull requests.

## Integração com WhatsApp

O pedido é validado e gravado no Postgres antes de gerar a URL do WhatsApp. O servidor calcula preços, adicionais, taxa de entrega e pedido mínimo a partir das configurações e do cardápio atuais; o navegador envia somente IDs, quantidades, seleções e observações. Uma chave de idempotência impede duplicação quando uma tentativa é reenviada.

## Lovable

Este projeto foi originalmente criado com [Lovable](https://lovable.dev). Commits enviados à branch conectada podem ser sincronizados com o editor Lovable. Não faça force push, rebase, amend ou squash de commits já publicados.
