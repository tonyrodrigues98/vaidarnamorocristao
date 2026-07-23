# V2-025 — Convergência, readiness e preparação de release

## Objetivo

Consolidar a reconstrução inteira e demonstrar que a base está pronta para
revisão, rollout controlado e operação. Não fazer merge/deploy automaticamente.

## Inventário final

- rotas;
- aliases/redirects;
- domínios;
- feature flags;
- migrations e estado;
- adapters;
- providers;
- subscriptions;
- jobs;
- endpoints;
- buckets;
- dependências;
- assets;
- Draft PR stack;
- blockers externos.

## Matriz de paridade

Para cada sistema:

- comportamento legado;
- comportamento V2;
- dados;
- permissões;
- offline;
- mobile;
- a11y;
- performance;
- telemetria;
- rollback;
- status.

Abranger:

- Auth/Conta;
- onboarding;
- Início/Dashboard;
- Comunidade;
- Conversas;
- Perfil;
- Namoro;
- Propósito/recados;
- economia/Loja/inventário;
- pets/jogos;
- conteúdo/Verbo;
- Cinema;
- notificações/moderação/suporte;
- Admin;
- PWA.

## Suíte final

- install congelado;
- typecheck;
- lint;
- format;
- unitários;
- componentes;
- integração;
- RLS/RPC no ambiente descartável;
- Realtime;
- E2E;
- migração/reconciliação;
- PWA/offline;
- a11y;
- visual/responsivo;
- performance/bundle;
- build cliente/SSR;
- secrets/server-only;
- links/imports/ciclos;
- `git diff --check`.

Quarentenar testes dependentes de ambiente ausente sem mascarar falha.

## Observabilidade

- erro/latência por rota;
- Auth;
- Realtime;
- fila/push;
- economia;
- Storage;
- Cinema;
- jobs;
- cache/update;
- flags/coortes;
- alertas e owners;
- runbooks.

Sem conteúdo privado em logs/labels.

## Rollout

Preparar, não executar:

1. ambiente interno;
2. contas sintéticas;
3. staff;
4. coorte pequena;
5. aumento gradual;
6. default V2;
7. retirada lógica;
8. contração futura.

Definir critérios de:

- avançar;
- pausar;
- rollback;
- kill switch;
- comunicação;
- suporte.

## Documentação operacional

- arquitetura;
- domínios;
- dados;
- migrations;
- flags;
- incidentes;
- backup/restore;
- jobs;
- secrets por nome, sem valor;
- deploy;
- rollback;
- moderação;
- Cinema;
- suporte;
- acessibilidade;
- performance.

## Revisão final

Classificar:

- bloqueadores;
- riscos aceitos;
- pendências de Antonio;
- pendências jurídicas;
- pendências de produção;
- dívida pós-release;
- funcionalidades futuras fora do V2.

Não declarar pronto se uma área tiver somente mock, dados falsos, autorização
visual ou migração não reconciliada.

## Critérios de conclusão

- todos os lotes rastreados;
- base compilável e testada;
- nenhum secret privilegiado;
- dados preservados;
- domínios e rotas coerentes;
- UX principal completa;
- flags/rollback;
- observabilidade/runbooks;
- PRs revisáveis;
- release plan pronto;
- nenhuma ação de produção realizada;
- lista curta de decisões humanas inevitáveis.

## Resposta final

No máximo 20 linhas:

- estado do programa;
- PR stack;
- gates;
- blockers;
- decisões de Antonio;
- confirmação de ausência de merge/deploy/mutation.

