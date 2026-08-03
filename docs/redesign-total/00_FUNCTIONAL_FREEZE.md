# Congelamento funcional do Redesign Total

## Baseline

- SHA de producao congelado: `394d8988b259000dc74d3acd1f061582895da96c`.
- Branch exclusiva: `redesign/total-v1`.
- Rotas geradas: 69.
- P0/P1 no corte: zero.
- P2 aceito: suporte nao possui fluxo seguro de exclusao/anonimizacao de chamado fechado e attachment privado.
- Rollback funcional: a experiencia publicada permanece preservada com `VITE_FF_TOTAL_REDESIGN=false`.

Main e producao nao sao superficies de trabalho deste redesign. Nenhuma publicacao, merge ou ativacao em producao faz parte da fase 01.

## Contratos congelados

Permanecem fonte unica e sem alteracao de comportamento:

- React, TanStack Start/Router, SSR e PWA;
- Supabase, schema, migrations, RLS, buckets e signed URLs;
- autenticacao, sessao, onboarding, guards e matriz administrativa;
- queries, query keys, mutations, RPCs, invalidacoes e realtime channels;
- rotas, deep links, contagem de 69 rotas e classificacao por shell;
- Início, Comunidade, Explorar, Conversas e Perfil, nessa ordem;
- focused chat, VisualViewport, safe areas, teclado, scroll e historico;
- economia, inventario, loja, avatar, pets, arcade e recompensas;
- moderacao, verificacao, suporte, AdminShell e observabilidade;
- service worker, runtime config e notificacoes push.

## Limites de implementacao

O redesign pode criar apresentacoes, adapters puros e view models sem efeitos. Nao pode criar segunda camada de dados, mocks de runtime, endpoint, rota, dependencia, timer, listener, query, mutation ou subscription.

Arquivos e dominios funcionais proibidos permanecem fora do escopo: `supabase/migrations/**`, `src/integrations/supabase/**`, Auth, coins, push, presence, RLS, `src/routes/api/**`, policies, schema, buckets e guards.

## Evidencia de preservacao

Os testes da fase verificam flag desligada, ordem das cinco abas, rotas, ausencia de migrations/dependencias/endpoints e equivalencia dos contratos de apresentacao. Os gates completos off/on continuam obrigatorios.
