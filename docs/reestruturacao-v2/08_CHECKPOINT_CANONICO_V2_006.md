# Checkpoint canônico anterior ao programa completo

## Git e PR

- Repositório: `tonyrodrigues98/vaidarnamorocristao`
- `origin/main`: `0659a9616562a08182581362a3dd9b60923a66af`
- Draft PR: #7 — `docs(v2): audit legacy application`
- Branch: `rebuild/v2-006-legacy-audit`
- Head único: `79675aab2d97ef02ff40b320133b5be62225be3c`
- Estado no checkpoint: aberto, Draft, mergeável, não mesclado
- Working tree: limpa
- V2-007: não iniciada naquele momento

## Auditoria

- 67 rotas;
- 445 referências tipadas;
- origens:
  - `src`: 404;
  - testes: 8;
  - manifest: 14;
  - sitemap: 11;
  - public/service worker: 8;
- classificações:
  - rotas: 392;
  - assets: 36;
  - endpoints: 4;
  - URLs externas: 8;
  - deep links: 3;
  - destinos dinâmicos: 2;
- estados:
  - resolvidas: 391;
  - não resolvidas: 1;
  - investigação: 2;
  - não aplicável: 51;
- link de rota não resolvido naquele estado: `/membros`;
- 436 módulos;
- 2.566 imports;
- 13 imports dinâmicos;
- ciclo tipo-only gerado `router.tsx ↔ routeTree.gen.ts`;
- zero ciclos em `src/v2`;
- zero itens comprovadamente seguros para remoção.

## Correções metodológicas já concluídas

- testes não exigem mais que `/membros` permaneça quebrado;
- cache inseguro e ausência de same-origin não são contratos;
- fixtures aceitam versões seguras e detectam inseguras;
- manifest, sitemap e service worker entram no inventário;
- referências externas possuem classificação própria;
- artefatos usam `schemaVersion: 2`, `auditedBaseCommit`,
  `generatedFrom` e `sourceState`;
- leitura de `GITHUB_SHA` removida;
- `PresenceProvider` registra RPC, Realtime, subscriptions e network activity.

## Validações do checkpoint

- TypeScript;
- 3 arquivos/20 testes novos;
- suíte segura de 19 arquivos/137 testes;
- ESLint;
- Prettier;
- builds cliente/SSR;
- `git diff --check`;
- auditoria determinística;
- bundle sem credencial privilegiada.

## Restrições confirmadas

Não houve:

- mudança funcional;
- correção de `/membros`;
- alteração do service worker;
- dependência alterada;
- acesso ao Supabase;
- migration;
- deploy;
- exclusão;
- início da V2-007.

## Regra de uso

Este é um checkpoint histórico, não uma ordem para rejeitar progresso posterior.
O Codex deve confrontá-lo com Git/PRs e continuar do estado real mais recente,
preservando trabalho válido.

