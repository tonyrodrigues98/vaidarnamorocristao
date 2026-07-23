# V2-006 — Auditoria do aplicativo legado

## Marco, objetivo e fonte de evidência

Esta auditoria foi executada sobre `main` em
`0659a9616562a08182581362a3dd9b60923a66af`, sem consultar o Supabase publicado.
Seu objetivo é preparar substituições verticais e reversíveis; não autoriza exclusão, migration,
mudança de rota canônica ou ativação da V2.

As conclusões distinguem explicitamente:

- **código confirmado**: observado no HEAD;
- **tipos confirmados**: presente em `src/integrations/supabase/types.ts`;
- **histórico confirmado**: declarado pelas migrations versionadas;
- **publicado não verificado**: exige snapshot autenticado e ambiente descartável;
- **inferência estática**: candidato que ainda precisa de validação dinâmica.

O coletor reproduzível `scripts/audit-legacy.mjs` inspeciona imports estáticos e dinâmicos,
strings de navegação, rotas TanStack, providers, dependências, referências Supabase e assets. Ele
gera JSON sanitizado em `docs/reestruturacao-v2/audit/`. O coletor não abre rede, não carrega
variáveis de ambiente e não registra valores de credenciais.

Os sete JSONs usam `schemaVersion: 2`, registram
`auditedBaseCommit: 0659a9616562a08182581362a3dd9b60923a66af` e declaram que foram produzidos
pela árvore de trabalho derivada dessa base, antes do commit que os publica. Não há timestamp nem
SHA autorreferencial do commit final; por isso duas execuções sobre a mesma árvore produzem hashes
idênticos.

## Resumo executivo

- Há **67 file routes**: 13 administrativas, 35 autenticadas, 13 públicas/visitante, 3 endpoints e
  3 cuja proteção é herdada da raiz.
- Foram inventariadas **465 referências tipadas**: 411 rotas, 37 assets, 4 endpoints, 8 URLs
  externas, 3 deep links e 2 destinos dinâmicos. As fontes são `src` (424), testes (8), manifest
  (14), sitemap (11), service worker/public (8), configuração (0) e outras (0). Das 411 rotas, 410
  resolvem e uma não resolve no estado atual: `src/v2/app-shell/navigation.ts` declara `/membros`;
  o runtime integrado usa `/v2/explorar-pessoas`. O achado é resultado atual, não contrato
  permanente de teste.
- Há três aliases/redirecionamentos intencionais: `/comunidade` →
  `/conversas/comunidade`, `/onboarding/etapa-1` → `/onboarding` e `/v2/` →
  `/v2/inicio` por parâmetro tipado.
- O shell raiz monta uma sessão canônica, mas a aplicação ainda possui guards locais,
  navegações e consultas repetidas. A duplicação é dívida de migração; não foi encontrado um
  segundo provider de sessão.
- `PresenceProvider`, `NotificationsBridge`, `BanGuard` e `MobileAppShell` são montados para todas
  as rotas legadas autenticadas. Presence realiza Realtime, `touch_my_activity` e timer de 60 s;
  Notifications mantém um canal amplo e consultas derivadas.
- A análise estática encontrou **31 arquivos-fonte potencialmente órfãos**, **2 contratos usados
  somente por testes**, **146 assets sem referência por basename** e **10 dependências sem uso
  direto/configurado detectável**. Nenhum deles é declarado seguro para excluir nesta etapa.
- O grafo de 449 módulos e 2.616 imports tem um ciclo conhecido entre `router.tsx` e
  `routeTree.gen.ts`, causado
  pelo registro de tipos gerado. Não há ciclos em `src/v2`.
- O código referencia **70 tabelas/views**, **91 RPCs**, **6 buckets** e **10 nomes de canais
  Realtime**. Isso é inventário de uso do código, não prova de existência ou ACL no banco
  publicado.
- Foram reconfirmados riscos de segurança já documentados: parâmetros de moedas/XP/progresso
  controláveis pelo cliente no contrato versionado, helper genérico de notificação concedido no
  histórico, moderação de foto sem rate limit e fail-open, além de mídia de pets autenticada em
  cache não particionado. As ACLs finais do banco publicado não foram presumidas.
- A recomendação para V2-007 é **Configurações/Conta**, e não Perfil: é um corte menor, com poucas
  dependências de apresentação, capaz de validar leitura/escrita real, autorização, rollback e
  navegação V2 antes de migrar o monólito de Perfil.

## Limitações

- O Supabase publicado, Vault, Storage, cron, Jobs, Realtime e policies não foram consultados.
- “Sem import estático” não prova abandono. O relatório também procurou imports dinâmicos,
  strings, rotas, manifest, service worker, testes e convenções, mas integrações externas podem
  existir.
- A análise de assets por basename não resolve URLs produzidas por arquivos `*.asset.json`,
  caminhos do Lovable (`/__l5e/assets-v1/...`) ou conteúdo armazenado no banco.
- O inventário de links interpreta literais de código/HTML, propriedades conhecidas do manifest,
  `<loc>` do sitemap e entradas estáticas/dinâmicas do service worker. Destinos construídos por
  lógica arbitrária continuam marcados como dinâmicos ou podem exigir inspeção manual.
- Não houve autenticação real, dados reais ou teste de PWA instalado. Os testes adicionados
  caracterizam o código versionado sem rede.
- Migrations são histórico. Não são tratadas como retrato do banco publicado.

## Arquitetura observada

O runtime é React 19 + TanStack Start/Router + TypeScript + Vite, com Tailwind CSS 4, React Query,
Supabase Auth/Database/Realtime/Storage e PWA por service worker próprio.

```text
Root route
└─ QueryClientProvider
   └─ ThemeProvider
      └─ AuthProvider
         └─ V2AwareRouteBoundary
            ├─ /v2/* → Outlet V2, sem providers privados legados
            └─ legado autenticado
               └─ PresenceProvider
                  ├─ NotificationsBridge
                  ├─ BanGuard
                  └─ MobileAppShell → página legada
```

`RouteProtectionBoundary` é a fronteira compartilhada de autenticação. Admin, onboarding,
aprovação de perfil e banimento conservam verificações específicas. Autenticação não equivale a
papel administrativo e o frontend não substitui RLS.

## Matriz de domínios

| Domínio           | Entradas e implementação atual                                      | Dados/serviços confirmados no código                                           | Acoplamentos e duplicações                                             | Condição e estratégia                                                     |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Autenticação      | `/auth/*`, `AuthProvider`, V2 session coordinator                   | Supabase Auth, `user_roles`, `profiles`, cache React Query                     | guards locais e redirects coexistem com boundary canônico              | manter provider único; remover guards por rota apenas após caracterização |
| Onboarding        | `/onboarding`, etapas 1/2                                           | `profiles`, `profile_advanced`, `profile_preferences`, bucket `profile-photos` | etapa 1 é alias; etapa 2 não tem entrada estática conhecida            | reconstruir perguntas; manter adaptador e dados existentes                |
| Início            | `/inicio`, `inicio.tsx`                                             | `daily_posts`, `profiles`, fluxos admin/ban/reverificação                      | página monolítica e sobreposição com dashboard/notícias                | migrar depois de Configurações e Perfil                                   |
| Comunidade/feed   | `/dashboard`, `/noticias`, `/devocional`, `/orações`, `/comunidade` | posts, interesses, mensagens, comentários, orações e Realtime                  | três superfícies de conteúdo e alias de “comunidade” para chat         | definir feed canônico antes de retirar aliases                            |
| Perfil            | `/perfil`, `/bloqueados`, `/verificacao`                            | perfis, fotos, preferências, badges, roles, verificações                       | perfil concentra visualização, edição, economia e customização         | migrar por módulos, preservando foto e `avatar_url`                       |
| Pretendentes      | `/pretendentes/*`, `/interesses`, `/matches`                        | profiles, preferences, interests, matches, commitments                         | lista/interesses/matches são experiências sobrepostas                  | manter dados; substituir descoberta somente com Namoro opt-in             |
| Explorar pessoas  | Pretendentes e contrato V2 `explorar-pessoas`                       | atualmente reutiliza perfis/roles/bloqueios                                    | `/membros` existe só no shell demonstrativo                            | criar domínio comunitário sem filtro romântico                            |
| Conversas         | `/conversas`, `$matchId`, `/conversas/comunidade`                   | messages, matches, blocks, profiles, global_messages, Realtime                 | chat 1:1, propósito e chat global possuem consultas/receipts paralelos | reconstrução própria após invariantes de mensagens                        |
| Recados anônimos  | `/recados`                                                          | views/tabelas e 12 RPCs anônimas                                               | rota grande, domínio exclusivamente romântico                          | manter fechado ao Namoro e preservar histórico                            |
| Propósito         | `/proposito/$matchId`                                               | matches, messages, gifts, profiles                                             | replica leitura/Realtime de mensagens do chat                          | separar pausa romântica de conversas sociais                              |
| Notificações      | `/notificacoes`, bridge global, push/SW                             | notifications, push_subscriptions, Realtime, push queue                        | destinos também vivem em Header, manifest e SW                         | centralizar catálogo de destinos antes da migração                        |
| Loja              | `/loja` e componentes de catálogo                                   | profiles e bibliotecas de decoração/economia                                   | catálogo e apresentação de perfil misturados                           | manter saldos; migrar após contrato de inventário                         |
| Moedas            | `coins.ts`, Saldo, Admin economia                                   | `user_coins`, transações e RPCs de saldo/gasto/admin                           | múltiplas origens de prêmio; risco ACL histórico                       | contenção de segurança antes de redesign                                  |
| Presentes         | `/presentes`, gifts/decorations                                     | gift transactions/catalog/bucket `gift-images`                                 | presente social e romântico compartilham tipos                         | preservar propriedade e contexto                                          |
| Molduras          | perfil, loja, Admin molduras                                        | decorations, owned/equipped, storage                                           | catálogo/equipamento em helpers amplos                                 | adaptar para perfil modular                                               |
| Auras             | perfil, loja, Admin auras                                           | decorations/equipped                                                           | mesma infraestrutura das molduras                                      | manter semântica de propriedade                                           |
| Fundos            | perfil, loja, Admin fundos                                          | profile backgrounds, purchase/equip RPCs                                       | fundo de perfil e pet têm contratos distintos                          | não consolidar                                                            |
| Stickers          | chat global, Admin stickers                                         | stickers/categories e Storage                                                  | banner legado candidato órfão; catálogo ativo no chat                  | validar uso dinâmico antes de retirar UI                                  |
| Avatar-personagem | `/avatar`, `/avatar/criar`, Admin avatar                            | bases, items, looks, inventário, bucket `avatar-items`                         | personagem e foto usam a palavra avatar                                | desativação por protocolo; nunca remover foto/molduras                    |
| Pet               | `/meu-pet`, `/pet-arcade`, jogos                                    | famílias `user_pets` e `user_pets_v2`, muitas RPCs                             | duas gerações intencionais e componentes V1/V2                         | preservar ambas; sem consolidação                                         |
| Eventos           | apenas ação preparatória V2 e conteúdo “em breve”                   | nenhum backend de evento detectado em runtime V2                               | não há implementação real                                              | criar depois de feed/grupos                                               |
| Lives             | Admin equipe-live e componentes Caren Live                          | configurações/equipe, referências remotas                                      | domínio parcial e específico                                           | investigar operação externa antes de migrar                               |
| Administração     | 13 rotas `/admin/*`                                                 | 29 tabelas/views, 11 RPCs e 2 buckets nas próprias rotas                       | `admin/index.tsx` é monólito; guards por página variam                 | dividir por domínio sem reescrever regras                                 |
| Configurações     | `/conta`, `/bloqueados`, `/suporte/*`                               | conta, tickets, artigos, notificações                                          | conta é corte menor e separado do perfil visual                        | primeiro módulo recomendado para V2-007                                   |
| PWA/offline       | manifest, `registerSW`, `public/sw.js`, banners                     | Cache API, instalação, offline HTML                                            | cache de pets não é particionado por usuário                           | revisar antes de ativação ampla da V2                                     |
| Push              | hook, SW, queue e endpoint protegido                                | push_subscriptions, push queue, cron externo conhecido                         | destinos espalhados; processamento concorrente ainda não atômico       | preservar PR-001 e Job; mudança separada                                  |
| Moderação         | fotos, reports, palavras, Admin                                     | verify-photo, photo moderation, reports, Storage                               | IA sem rate limit e fail-open                                          | conter antes de ampliar uploads sociais                                   |
| Sala de Cinema    | ação demonstrativa no Create Sheet                                  | nenhum schema, rota ou serviço real detectado                                  | somente vestígio visual preparatório                                   | produto futuro; vídeos fora do Git                                        |

## Duplicações arquiteturais

| ID      | Classificação              | Evidência                                                                       | Risco                                            | Tratamento                                                      |
| ------- | -------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| DUP-001 | migração em andamento      | `RouteProtectionBoundary` mais `<Navigate>` em várias páginas                   | redirects concorrentes ao mudar rotas            | retirar guard local somente quando a rota V2 assumir o contrato |
| DUP-002 | dívida técnica             | `Header`, `MobileBottomNav`, manifest, SW e dois registries V2 definem destinos | links divergentes; `/membros` sem rota           | catálogo de navegação canônico por plataforma                   |
| DUP-003 | compatibilidade necessária | `user_pets` e `user_pets_v2`, catálogos e históricos V1/V2                      | perda de progressão se consolidado               | preservar até reconciliação semântica                           |
| DUP-004 | dívida técnica             | chat 1:1 e Propósito repetem messages/read receipts/Realtime                    | ordenação e subscriptions inconsistentes         | serviço de mensagens único na reconstrução                      |
| DUP-005 | migração em andamento      | tokens/tema globais legados e DS V2 escopado                                    | vazamento visual se o escopo for removido        | manter `.vdn-v2[data-vdn-v2]`                                   |
| DUP-006 | duplicação perigosa        | parâmetros de recompensa chegam a RPCs cliente-callable                         | fraude se ACL publicada corresponde ao histórico | P0: snapshot e contenção                                        |
| DUP-007 | dívida técnica             | Perfil, Loja, Saldo e Customização compartilham catálogo/equipamento            | difícil separar propriedade de apresentação      | comandos/queries por domínio compartilhado                      |
| DUP-008 | requer decisão de produto  | dashboard, notícias, início, devocional e orações disputam “conteúdo inicial”   | navegação sem destino canônico                   | definir feed comunitário V2                                     |

## Providers e custo global

| Elemento                 | Montagem               | Side effects/custo                                                           | Escopo necessário                   | Recomendação                                              |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| QueryClientProvider      | raiz                   | cache; sem rede própria                                                      | todas as rotas                      | manter; isolar cache privado no auth boundary             |
| ThemeProvider            | raiz                   | `localStorage`, `matchMedia`, classe no documento                            | todas as rotas                      | manter até App Shell controlar tema sem duplicar provider |
| AuthProvider             | raiz                   | `getSession`, um `onAuthStateChange`, roles/profile, canal de exclusão       | todas as rotas                      | fonte canônica; não duplicar                              |
| RouteProtectionBoundary  | raiz                   | decisão/redirect; sem query própria                                          | páginas protegidas                  | fronteira canônica                                        |
| PresenceProvider         | legado autenticado     | canal `global-presence`, track, RPC imediata + 60 s                          | presença/chat e superfícies sociais | futuramente escopar a rotas que exibem presença           |
| NotificationsBridge      | legado autenticado     | canal por usuário, múltiplos `postgres_changes`, consultas de enriquecimento | notificações/badges                 | centralizar e limitar eventos/queries                     |
| BanGuard                 | legado autenticado     | observa auth/rota e bloqueia UI                                              | todas as privadas                   | preservar; backend continua obrigatório                   |
| MobileAppShell/BottomNav | legado autenticado     | listeners/viewport e query de profile no nav                                 | páginas legadas mobile              | retirar somente após shell V2 canônico                    |
| TooltipProvider          | cinco montagens locais | contexto de UI, sem rede                                                     | componentes pontuais                | baixo risco; consolidação opcional                        |

Em `audit/providers.json`, atividade de rede não é mais um booleano ambíguo: `fetch`, `query`,
`rpc`, `realtime` e `subscriptions` são sinais separados, e `networkActivity` é verdadeiro quando
qualquer um deles existe. Assim, `PresenceProvider` registra corretamente `rpc: true`,
`realtime: true`, `subscriptions: true` e `networkActivity: true`.

## Supabase e fronteiras de dados

O artefato `audit/supabase-references.json` lista cada nome e todos os arquivos consumidores.
Resultados estáticos:

- 70 tabelas/views referenciadas por `.from`;
- 91 RPCs literais;
- 6 buckets (`avatar-items`, `avatar-looks`, `gift-images`, `photo-moderation-rejects`,
  `profile-photos`, `verifications`);
- 10 canais Realtime literais, além de canais construídos por template;
- Auth no cliente canônico e em endpoints que validam bearer;
- `client.server.ts` usa `SUPABASE_SERVICE_ROLE_KEY` apenas em módulos server-side.

Não foi localizada chave privilegiada em módulo de browser. A presença do nome da variável
server-only no código/bundle SSR não significa vazamento do valor. O bundle cliente deve continuar
sem valor ou uso de `service_role`.

Inconsistências confirmadas no código:

- nomes de tabela e bucket aparecem juntos no mesmo extrator (`profile_photos` /
  `profile-photos`, `avatar_items` / `avatar-items`);
- várias chamadas usam `as never`/`as any`, sinalizando deriva entre tipos e banco;
- páginas administrativas e monólitos executam queries diretamente;
- `verify-photo` recebe bearer do usuário, depois usa cliente server-only para settings; o endpoint
  não possui limite por usuário/IP;
- `verifyPhoto.ts` transforma falha de rede/IA em `soft: true`; `ProfilePhotosManager` prossegue
  com upload sem fila de revisão.

## Dependências

Das 79 declarações, o scan classificou 68 como importadas diretamente/configuradas e `vitest`
como uso de testes. Dez exigem investigação:

`@cloudflare/vite-plugin`, `@hookform/resolvers`, `@tailwindcss/vite`,
`@tanstack/router-plugin`, `@types/node`, `@types/react`, `@types/react-dom`,
`eslint-config-prettier`, `nitro` e `tw-animate-css`.

Essa lista **não** é uma lista de remoção: tipos são consumidos pelo compilador; Tailwind,
TanStack, Nitro e Cloudflare podem ser acionados indiretamente por
`@lovable.dev/vite-tanstack-config`; `tw-animate-css` pode ser importado pelo CSS. Antes de remover,
é obrigatório comparar lockfile, configuração resolvida e builds cliente/SSR em PR separado.

## Assets e estilos

- `public/` contém 25 arquivos e cerca de 7 MB; `src/assets` contém sprites, imagens de avatar,
  caixas, arcade, decoração e JSONs de referência do Lovable.
- Os maiores candidatos sem basename são
  `album-main.png` (1,83 MB), `egg-burst.png` (0,83 MB) e `album-lectern.png` (0,57 MB).
  Eles pertencem a cenas do arcade e exigem inspeção de carregamento por catálogo antes de
  remoção.
- 146 candidatos incluem pequenos `*.asset.json`, robots/llms e modelos do face-api.
  Convenções externas e carregamento por URL impedem declarar órfão.
- O CSS legado é global e possui tokens românticos/rose, glass e vários z-index. O Design System
  V2 permanece integralmente escopado; não foi observado vazamento V2 → legado.
- Poppins é carregada remotamente pela raiz. Isso é dependência externa de renderização; o
  fallback precisa ser preservado até uma estratégia de fonte local.

## PWA, cache e service worker

`public/sw.js` usa `vaidarnamoro-pwa-v3`, precache mínimo, navegação network-first e fallback
`/offline.html`. Assets estáticos same-origin são cache-first.

Riscos:

1. requests `sign|public|authenticated` do bucket `pets` usam stale-while-revalidate;
2. a cache key remove a query da URL assinada;
3. a cache não é particionada nem limpa por usuário/logout;
4. um dispositivo compartilhado pode reter mídia autenticada de pet após troca de conta;
5. `notificationclick` aceita URL absoluta do payload e não valida same-origin antes de
   `openWindow`;
6. o manifest e metadados continuam centrados em namoro e destacam Pretendentes;
7. atualização usa `skipWaiting`/`clients.claim`, mas não há protocolo explícito de reload do
   cliente após troca de bundle.

## Código potencialmente órfão

### Resultado

- **Comprovadamente órfão:** 0.
- **Seguro para remoção agora:** 0.
- **Contratos usados somente por testes:** `src/v2/domains/registry.ts` e
  `src/v2/legacy/preservation.ts`; ambos são deliberados e devem permanecer.
- **Candidatos fonte que exigem investigação:** 31.
- **Candidatos de asset que exigem investigação:** 147.

Entre os 31 estão componentes aparentemente substituídos (`ArcadeHistory.tsx` ao lado de
`ArcadeHistoryV2.tsx`, `MobileChatScreen.tsx`), cartões antigos (`CoinsCard`,
`DecorationsCard`, `PetCareHistoryCard`), banners (`AnonymousMessagesBanner`,
`StickersChatBanner`), `AdminSidebar`, `useActiveCommitment`, `appNavigation` e 20 wrappers UI.
O inventário completo e a evidência ficam em `audit/orphan-candidates.json`.

Validação obrigatória antes de cada remoção: `rg` por arquivo/símbolo, imports dinâmicos,
catálogos/strings, testes, route tree, build cliente/SSR, smoke da rota dona, e comparação de
assets carregados no Network. Nenhum candidato foi removido.

## Achados priorizados

| ID         | Pri. | Domínio            | Evidência e estado                                                                                                                 | Impacto                                               | Ação/pré-condição                                                       | Testes / etapa                                 |
| ---------- | ---: | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| LEG-P0-001 |   P0 | moedas             | `grant_coin_event(uuid,int,text)` é `SECURITY DEFINER` e concedida a authenticated no histórico; usuário/alvo/valor são parâmetros | crédito indevido se ACL publicada coincide            | snapshot de assinatura/ACL; revogar chamada externa e encapsular prêmio | RLS/RPC descartável; segurança antes da V2-007 |
| LEG-P0-002 |   P0 | XP                 | `award_xp` recebe source/amount/cap/meta do browser e o histórico concede authenticated                                            | progressão arbitrária                                 | allowlist/valor server-side e ACL publicada                             | concorrência/economia em banco descartável     |
| LEG-P0-003 |   P0 | missões/conquistas | histórico concede `track_achievement` a authenticated e recebe user/inc; `progress_mission_action` recebe user/inc                 | recompensas forjadas                                  | tornar internas e derivar `auth.uid()`/evento                           | RPC/RLS por papel                              |
| LEG-P0-004 |   P0 | notificações       | migration posterior concede helper genérico `create_notification` a authenticated                                                  | spam/phishing interno                                 | snapshot de ACL e privatização por funções específicas                  | RLS/RPC descartável                            |
| LEG-P1-001 |   P1 | moderação          | `/api/verify-photo` sem rate limit; `soft:true` permite upload sem review                                                          | custo e conteúdo não moderado                         | rate limit e quarentena fail-closed operacional                         | unitário do endpoint + integração local        |
| LEG-P1-002 |   P1 | PWA/privacidade    | cache de pets autenticado não particionado, query assinada removida                                                                | mídia residual entre contas                           | versionar/particionar ou não cachear autenticado; limpar no logout      | SW browser test                                |
| LEG-P1-003 |   P1 | push/deep link     | `notificationclick` abre URL absoluta sem same-origin allowlist                                                                    | navegação externa controlada por payload comprometido | sanitizar destino interno                                               | teste unitário do SW                           |
| LEG-P1-004 |   P1 | navegação          | `/membros` não resolve no contrato público do App Shell                                                                            | clique quebrado se consumidor usar defaults           | trocar por destino canônico tipado                                      | caracterização de links; V2-007/008            |
| LEG-P2-001 |   P2 | providers          | Presence/notifications em toda rota legada autenticada                                                                             | rede/subscriptions desnecessárias                     | medir e escopar após shells canônicos                                   | métricas + testes de montagem                  |
| LEG-P2-002 |   P2 | conversas          | chat e Propósito repetem messages/read/Realtime                                                                                    | duplicidade, ordenação instável                       | serviço de mensagens e paginação comum                                  | etapa de Conversas                             |
| LEG-P2-003 |   P2 | rotas              | boundary canônico mais guards/redirects locais                                                                                     | loop/flash em futuras trocas                          | retirar por rota com teste                                              | cada migração vertical                         |
| LEG-P2-004 |   P2 | comunidade         | início/dashboard/notícias/devocional disputam navegação de conteúdo                                                                | destino social indefinido                             | decisão de produto e feed V2                                            | etapa Início/Comunidade                        |
| LEG-P2-005 |   P2 | Admin              | `admin/index.tsx` concentra muitos domínios/queries                                                                                | regressão e autorização difícil de revisar            | modularizar sem mudar regras                                            | Admin posterior                                |
| LEG-P2-006 |   P2 | dependências       | dez pacotes sem uso estático direto                                                                                                | peso/risco de manutenção não quantificado             | resolver config e bundle antes de remover                               | PR mecânico isolado                            |
| LEG-P3-001 |   P3 | código             | 31 candidatos sem incoming runtime                                                                                                 | manutenção e bundle potencial                         | investigar individualmente                                              | onda de limpeza pós-paridade                   |
| LEG-P3-002 |   P3 | assets             | 146 candidatos; arcade inclui arquivos grandes                                                                                     | tamanho de repo/bundle                                | Network + catálogo + build                                              | PR de assets separado                          |
| LEG-P3-003 |   P3 | marca/PWA          | manifest/meta ainda descrevem namoro como produto total                                                                            | posicionamento inconsistente                          | atualizar com App Shell canônico                                        | ativação comunitária                           |
| LEG-P3-004 |   P3 | UI                 | CSS/tokens/navigation legados paralelos à V2                                                                                       | conflitos e custo cognitivo                           | retirar só após paridade                                                | por módulo                                     |
| LEG-P4-001 |   P4 | rota 404           | not-found global está em inglês                                                                                                    | acabamento inconsistente                              | localizar na adoção do shell                                            | etapa de navegação                             |
| LEG-P4-002 |   P4 | tooling            | ciclo tipo-only router ↔ routeTree gerado                                                                                          | ruído em análise                                      | ignorar/allowlist documentado                                           | nenhum trabalho de produto                     |

Os quatro P0 são **confirmados no código/tipos/histórico**, mas sua explorabilidade no banco
publicado permanece **não verificada** por restrição desta etapa. Eles bloqueiam mudanças visuais
que ampliem essas superfícies; não bloqueiam a documentação/testes read-only deste PR.

## Recomendações

1. Não mesclar mudanças de domínio com contenção de segurança.
2. Capturar ACL/assinaturas publicadas em ambiente autenticado e preparar PR de segurança
   aditivo/reversível para LEG-P0-001–004.
3. Corrigir PWA de mídia autenticada antes de promover uso offline amplo.
4. Começar V2-007 por Configurações/Conta, com adapter para os RPCs atuais e sem alterar schema.
5. Migrar Perfil depois, separando identidade/fotos de economia/personalização.
6. Migrar Início e Comunidade quando o modelo de feed estiver decidido.
7. Tratar Pretendentes e Conversas em ondas próprias, pois possuem os maiores invariantes
   românticos e históricos.

## Reexecução

```powershell
node scripts/audit-legacy.mjs
```

A execução deve permanecer read-only em relação à aplicação e só regrava os artefatos JSON
sanitizados da própria auditoria.

Os testes de caracterização validam classificadores com fixtures seguras e inseguras. Eles não
exigem que `/membros` continue quebrado, que cache autenticado permaneça sem partição ou que deep
links continuem sem allowlist same-origin.
