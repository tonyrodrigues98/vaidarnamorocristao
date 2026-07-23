# V2-022 — PWA, offline, desempenho e acessibilidade

## Objetivo

Fazer hardening transversal das superfícies V2 para que o produto funcione bem
em dispositivos reais, internet instável e sessões múltiplas sem vazamento de
dados.

Este lote não substitui os critérios aplicados durante cada feature. Ele
consolida, mede e corrige o sistema completo.

## PWA

- manifest community-first;
- atalhos condicionais/seguros;
- ícones/splash;
- install;
- atualização de service worker;
- aviso/reload controlado;
- deep links;
- push;
- fallback;
- cache versionado;
- limpeza de caches antigos;
- compatibilidade iOS/Android/desktop.

## Cache privado

- namespace por usuário e versão;
- nenhuma URL assinada normalizada de forma a cruzar identidade;
- logout limpa cache, drafts, outbox e queries privadas;
- troca de conta não mostra bytes/metadados anteriores;
- cache público separado;
- TTL;
- invalidação por domínio;
- Storage delivery respeitado.

## Offline

Classificar cada ação:

- leitura cacheável;
- rascunho local;
- mutação bloqueada;
- outbox idempotente;
- download explícito.

Para outbox:

- client ID;
- idempotência server;
- retry/backoff;
- conflito;
- cancelamento;
- indicador;
- limpeza;
- criptografia/privacidade conforme risco.

Não prometer offline total para Cinema, upload, economia ou ações privilegiadas.

## Performance

Medir por rota:

- bundle inicial/assíncrono;
- CSS;
- imagens/fontes;
- queries;
- subscriptions;
- memória;
- render;
- network waterfall;
- CWV;
- p75/p95 das ações.

Corrigir:

- imports pesados;
- duplicação de providers;
- subscriptions globais;
- N+1;
- listas sem paginação;
- imagens sem tamanho/formato;
- prefetch excessivo;
- Admin/pets/jogos/Verbo/Cinema no shell;
- re-render;
- cache incoerente.

Definir budgets baseados em medição, não números inventados.

## Responsividade

Validar:

- 320;
- 360;
- 390;
- tablet;
- 1024;
- desktop amplo;
- safe areas;
- landscape;
- teclado;
- zoom;
- texto ampliado;
- touch;
- ausência de hover obrigatório.

## Acessibilidade

- WCAG 2.2 AA;
- contraste;
- personalização;
- foco;
- teclado;
- leitor de tela;
- landmarks/headings;
- labels;
- dialog/drawer focus trap;
- reduced motion;
- drag alternative;
- long-press alternative;
- legendas/transcrição no Cinema quando disponíveis;
- erro anunciado;
- status live regions sem ruído.

## Realtime e sessão

- provider/subscription count;
- reconexão;
- auth refresh;
- logout;
- background/foreground;
- múltiplas abas;
- memory leak;
- presença;
- push click.

## Testes

- install/update;
- offline/online;
- cache/logout/switch;
- deep link;
- outbox/replay;
- dispositivos/breakpoints;
- Lighthouse/axe ou equivalente;
- screen reader smoke;
- keyboard;
- reduced motion;
- bundle analyzer;
- budgets;
- longa sessão.

## Critérios de conclusão

- zero vazamento de cache conhecido;
- update seguro;
- offline honesto;
- budgets e medições;
- superfícies críticas responsivas;
- WCAG nos fluxos principais;
- subscriptions controladas;
- documentação de limites;
- regressões automatizadas.

