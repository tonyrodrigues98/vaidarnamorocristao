# T46-27.2 — Catálogos, economia, Pets e Live

## Arquitetura

- Rotas: presentes, stickers, fundos, molduras, auras, gradientes de nome, avatar, Pets, economia e equipe da Live.
- O `AdminShell` fornece navegação, título, viewport e responsividade; cada rota permanece dona de auth, guard, queries, uploads, mutations, dialogs, filtros e invalidações.
- O registry de 13 destinos continua sendo a fonte de navegação e visibilidade por papel. Guards locais e RLS continuam sendo a autoridade final.
- Flag off mantém `Header` e `AdminTopNav`; flag on usa sidebar/rail/drawer sem bottom navigation.

## Contratos preservados

- Catálogos: tabelas, buckets, paths, MIME, limites, preço, raridade, status, ordem e confirmações atuais.
- Avatar: `avatar_categories`, `avatar_items`, bucket `avatar-items` e limite de 5 MB.
- Pets: todas as tabs, catálogos, progressão, cuidado, expedições, Grab, Arcade e painel legado.
- Economia: `admin_economy_summary`, janelas e ledger reais; nenhuma regra monetária foi alterada.
- Live: equipe, categorias, destaques mensais, upload, ordenação e rollback otimista atuais.

## Cobertura e validação

- O teste de cobertura lê `routeTree.gen.ts` e exige classificação para todas as 69 rotas.
- Rotas API, públicas, documentos, auth, onboarding, chats focados, Admin e tombstones V2 são separadas do App Shell.
- Testes estáticos protegem ownership das rotas e impedem acesso backend pelo shell.
- Sem sessão Supabase administrativa segura, operações sensíveis foram verificadas por contratos determinísticos, não por E2E real.

## Backend e limitações

Zero migration, dependência, rota, tabela, RPC, bucket, query ou mutation nova. O tema escuro permanece funcional, não visualmente congelado.

## Rollback

Imediato: `VITE_FF_NATIVE_SHELL=false`.

Código: `git revert <commit-da-t46-27-2>`.
