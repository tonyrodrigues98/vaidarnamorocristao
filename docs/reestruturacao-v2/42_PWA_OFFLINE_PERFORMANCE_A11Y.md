# V2-022 — PWA, offline, performance e acessibilidade

## Objetivo e estado

Este lote endurece a infraestrutura transversal da V2 sem ativar features, aplicar migrations ou
alterar dados. O service worker continua registrado pelo root existente e a V2 passa a expor um
aviso de atualização controlada dentro do shell.

Estado operacional: **código local, flag V2 fechada, sem deploy**.

## PWA e atualização

- `manifest.webmanifest` descreve a plataforma como comunidade cristã, possui identidade estável,
  `scope`, `start_url`, modos de display e atalhos que passam pelo router/autenticação.
- `public/sw.js` usa cache `vaidarnamoro-pwa-v5`.
- instalação não chama `skipWaiting`; uma versão nova espera a decisão do usuário;
- `registerSW.ts` publica uma máquina de estados SSR-safe:
  `unsupported | idle | checking | ready | activating | error`;
- `V2ServiceWorkerUpdateNotice` anuncia a atualização, oferece “Atualizar” e “Depois” e só solicita
  ativação após ação explícita;
- após `controllerchange` solicitado pelo usuário, ocorre um único reload;
- falha de verificação de update mantém o worker ativo;
- previews, iframes, hosts Lovable e `?sw=off` permanecem fora do registro;
- clique push continua resolvido por `vdn-navigation-policy.js`, limitado a same-origin e caminhos
  permitidos.

Não houve mudança em inscrição push, VAPID, fila, cron ou endpoint de dispatch.

## Política de cache e privacidade

| Classe         | Namespace                                        | Regra                                            |
| -------------- | ------------------------------------------------ | ------------------------------------------------ |
| público        | `vdn-v2-v1-public-*`                             | somente GET público com TTL e domínio explícitos |
| privado        | `vdn-v2-v1-private-<scope-opaco>-*`              | exige versão, scope opaco por sujeito e TTL      |
| legado privado | nomes `private`, `authenticated` ou `pet-images` | removido no boundary de auth                     |

O service worker atual não cria cache privado. Ele mantém somente:

1. shell estático same-origin não sensível;
2. objetos do bucket público `pets`, preservando a URL completa;
3. fallback estático `/offline.html`.

URLs assinadas, query com token/assinatura/expiração, navegação autenticada e respostas cross-origin
não declaradas são recusadas pelo contrato de cache público. Logout/troca de conta cancelam queries,
limpam mutations, caches privados antigos/V2 e chaves locais prefixadas de draft/outbox.

## Offline honesto

Há 17 ações classificadas por intenção:

- `cacheable-read`: leitura previamente carregada;
- `local-draft`: rascunho privado no dispositivo;
- `blocked`: exige conexão;
- `idempotent-outbox`: somente se o backend confirmar idempotência;
- `explicit-download`: conteúdo público previamente baixado.

Cinema, upload, compra/equipamento, Admin e envio de mensagem ficam bloqueados offline. Nenhum
payload de outbox é persistido neste lote. O protocolo puro modela client ID, idempotency key,
scope opaco, backoff limitado, conflito, cancelamento e conclusão. Mesmo `content.progress` só pode
ser enfileirado quando um chamador futuro fornecer confirmação explícita de idempotência server-side.

## Performance e budgets

O script `scripts/check-v2-quality-budget.mjs` mede o build de produção sem instrumentar o runtime.
O baseline versionado em `audit/v2-quality-budget.json` registra:

- chunk da rota V2 integrada;
- CSS V2;
- soma dos chunks lazy `V2*`.

O budget é calculado a partir dos bytes observados, arredondado para KiB com 15% de margem de rollout.
Ele não inventa CWV ou latência: LCP, INP, CLS, waterfall, memória e p75/p95 ainda exigem coleta em
ambiente de teste representativo. Admin permanece lazy; o orçamento evidencia o custo ainda
concentrado de imports estáticos da rota V2.

Comandos:

```text
node scripts/check-v2-quality-budget.mjs --capture
node scripts/check-v2-quality-budget.mjs
```

`--capture` é reservado para uma revisão explícita de baseline; CI/revisão usa o modo check.

## Responsividade e acessibilidade

Os contratos V2 existentes permanecem:

- canvas sem overflow horizontal;
- bottom navigation com safe area e conteúdo compensado;
- sidebar por breakpoint sem forçar três colunas;
- touch targets e controles com pelo menos 44 px;
- input com 16 px;
- skip link, landmarks, headings, labels, foco visível e overlays com Escape/restauração de foco;
- live region discreta para update;
- tokens `safe-area-inset-*`;
- `prefers-reduced-motion` no Design System, shell e aviso de update;
- nenhuma interação depende apenas de hover ou long-press.

WCAG 2.2 AA continua o alvo. Testes estáticos protegem os contratos determinísticos. Leitor de tela,
zoom/texto ampliado, landscape, contraste final, Lighthouse e axe devem ser repetidos em browser real
para cada rota com dados representativos.

## Realtime, sessão e múltiplas abas

A auditoria reproduzível registra 9 mounts de providers e 11 canais Realtime no legado. A V2 mantém:

- providers privados somente após sessão;
- uma subscription de auth por provider;
- cancelamento e limpeza de cache na troca de identidade;
- nenhum provider Realtime novo neste lote;
- nenhum cache autenticado no service worker;
- atualização de SW comunicada entre worker e clientes sem payload privado.

Longa sessão, background/foreground, refresh de token e múltiplas abas continuam como smoke
obrigatório antes de rollout, pois não podem ser provados por inspeção estática.

## Testes e critérios

Quatro arquivos cobrem cache/PWA, offline/outbox, update controlado e budgets/acessibilidade.
Também são executadas a suíte segura completa, TypeScript, lint/Prettier focados, build cliente/SSR,
budget, auditoria determinística, ciclos e inspeção de credenciais.

Critérios atendidos neste lote:

- nenhum cache privado criado pelo SW;
- limpeza de estados privados no auth boundary;
- update controlado e reversível;
- offline descrito sem falsa persistência;
- budgets vinculados ao build medido;
- regressões determinísticas automatizadas;
- nenhuma alteração operacional.

## Limitações, adoção e rollback

Antes de rollout:

1. validar instalação/update em iOS, Android e desktop;
2. simular logout e troca de conta com Storage/Cache Inspector;
3. coletar CWV e memória em rotas críticas;
4. validar leitor de tela/teclado/zoom;
5. revisar idempotência e criptografia antes de habilitar qualquer outbox;
6. servir o SW v5 em ambiente isolado e confirmar limpeza dos caches v4.

Rollback de código: reverter este commit restaura o SW v4 e remove o aviso/contratos. Em ambiente já
servido, publicar uma versão posterior do worker é mais seguro que tentar reinstalar um arquivo
antigo. Nenhum dado remoto depende deste lote.
