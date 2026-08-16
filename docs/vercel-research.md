# Verificação de compatibilidade Vercel — 2026-08-16

A documentação oficial da Vercel confirma que TanStack Start funciona na Vercel quando combinado com Nitro. A configuração recomendada usa `nitro/vite` no `vite.config.ts`, e o preset Vercel pode ser detectado automaticamente ou fixado explicitamente como `preset: "vercel"`.

Fonte: https://vercel.com/docs/frameworks/full-stack/tanstack-start

A documentação oficial de Postgres informa que Vercel Postgres não está disponível para novos projetos como produto próprio. Para novos projetos, a Vercel recomenda instalar uma integração de Postgres pelo Marketplace, como Neon. A integração injeta as credenciais e variáveis de ambiente no projeto Vercel.

Fonte: https://vercel.com/docs/postgres

Decisão para o projeto: substituir Supabase por Postgres via integração do Vercel Marketplace, mantendo as Server Functions do TanStack Start e usando autenticação administrativa própria baseada em credenciais server-side da Vercel. Não usar `@vercel/postgres` como dependência obrigatória sem confirmar o provedor; preferir a biblioteca `postgres` ou o driver oficial do provedor escolhido e documentar as variáveis efetivamente injetadas.
