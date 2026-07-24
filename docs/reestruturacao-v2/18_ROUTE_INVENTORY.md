# V2-006 — Inventário de rotas

## Escopo e leitura

Inventário do commit `0659a9616562a08182581362a3dd9b60923a66af`. A fonte reproduzível
com parâmetros, redirects, links de entrada, tabelas/RPCs/buckets/canais e testes por rota é
`audit/route-inventory.json`. `src/routeTree.gen.ts` é gerado e não foi editado.

O inventário de referências correlato cobre código em `src`, testes, HTML, manifest, sitemap e
service worker. Rotas, assets, endpoints, URLs externas, deep links e destinos dinâmicos possuem
classificações próprias; portanto seus totais não são tratados como uma única contagem de “links
internos”.

Todas as páginas herdam `QueryClientProvider`, `ThemeProvider`, `AuthProvider` e
`RouteProtectionBoundary`. Rotas legadas autenticadas também montam Presence, Notifications,
BanGuard e MobileAppShell. `/v2/*` não monta esses providers privados legados. “Admin” significa
que a página executa verificação própria de papel; nunca que sessão autenticada concede papel ou
substitui RLS.

### Contagem

| Classe                         | Quantidade |
| ------------------------------ | ---------: |
| administrativa                 |         13 |
| autenticada                    |         36 |
| pública/exclusiva de visitante |         13 |
| endpoint server-side           |          3 |
| proteção herdada da raiz       |          3 |
| **total**                      |     **68** |

### Árvore resumida

```text
/
├─ auth/{login,signup,forgot-password,reset-password}
├─ onboarding/{,etapa-1,etapa-2,namoro}
├─ admin/{,auras,avatar,economia,equipe-live,fotos,fundos,gradientes-nome,
│         molduras,pets,presentes,stickers,verificacoes}
├─ api/{photo-repair,verify-photo,public/hooks/push-dispatch}
├─ conversas/{,$matchId,comunidade}
├─ pretendentes/{,$id}
├─ proposito/$matchId
├─ suporte/{,$id,ajuda}
├─ blog/{,$slug}
├─ v2/{,$section}
└─ 28 rotas planas de produto/conteúdo
```

## Inventário detalhado

Abreviações: `Pub` pública; `Vis` visitante; `Auth` autenticada; `Adm` administrativa; `API`
endpoint; `Herd` proteção herdada. “Dados” lista os recursos principais confirmados na própria
rota; helpers importados podem acrescentar recursos e estão em `audit/supabase-references.json`.
`L0` baixo risco de remoção (ainda requer paridade), `L1` médio, `L2` alto, `L3` crítico.

| Pathname                          | Arquivo / componente                    | Acesso e parâmetros    | Dados/efeitos principais                                            | Entradas, refresh e condição                  | Destino V2 / recomendação / risco           |
| --------------------------------- | --------------------------------------- | ---------------------- | ------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `/`                               | `routes/index.tsx` / Home               | Pub                    | estática                                                            | Header/PublicNav; refresh estável             | landing pública; preservar / L2             |
| `/auth/login`                     | `auth/login.tsx` / Login                | Vis                    | Auth                                                                | 40 refs; consome `returnTo` seguro            | auth compartilhada; preservar / L3          |
| `/auth/signup`                    | `auth/signup.tsx` / Signup              | Vis                    | Auth, `terms_acceptances`                                           | links públicos; → onboarding                  | onboarding V2 posterior / L3                |
| `/auth/forgot-password`           | `auth/forgot-password.tsx` / Forgot     | Pub                    | Auth reset                                                          | login                                         | preservar / L3                              |
| `/auth/reset-password`            | `auth/reset-password.tsx` / Reset       | Pub                    | Auth update                                                         | callback externo; sem entrada estática normal | deep link obrigatório / L3                  |
| `/onboarding/`                    | `onboarding/index.tsx` / OnboardingFlow | Auth                   | profiles, advanced, prefs, fotos/Storage                            | signup/profile; refresh restaura rascunho     | reconstruir perguntas / L3                  |
| `/onboarding/etapa-1`             | `onboarding/etapa-1.tsx`                | Herd                   | —                                                                   | alias → `/onboarding`; sem entrada            | redirect compatível / L1                    |
| `/onboarding/etapa-2`             | `onboarding/etapa-2.tsx` / Etapa2       | Auth                   | `profile_preferences`                                               | sem entrada estática; deep link possível      | investigar fluxo antigo / L2                |
| `/onboarding/namoro`              | `onboarding/namoro.tsx` / DatingOptInRoute | Auth                | adapter V2; membership/RPC atrás de flag                            | entrada opt-in; refresh estável                | Namoro opcional V2 / L3                     |
| `/inicio`                         | `inicio.tsx` / InicioRoute              | Auth                   | daily_posts, profiles, appeals, Realtime                            | nav/push; → onboarding se incompleto          | Início V2 após definição de feed / L3       |
| `/dashboard`                      | `dashboard.tsx` / Dashboard             | Auth                   | posts, interests, matches, messages, views                          | Header; refresh reconsulta                    | fundir decisão com Início / L2              |
| `/noticias/`                      | `noticias.index.tsx` / Noticias         | Auth                   | `daily_posts`, Realtime                                             | links internos                                | feed V2 / L2                                |
| `/devocional`                     | `devocional.tsx` / Devocional           | Auth                   | posts, comentários, reações, oração, Realtime                       | nav/manifest                                  | módulo de fé / L3                           |
| `/oracoes`                        | `oracoes.tsx` / Orações                 | Auth                   | prayer requests/reports/prayed, Realtime                            | menus                                         | comunidade de oração / L3                   |
| `/comunidade`                     | `comunidade.tsx`                        | Herd                   | —                                                                   | alias → `/conversas/comunidade`               | redirect até comunidade real / L1           |
| `/conversas/`                     | `conversas/index.tsx` / List            | Auth                   | helper lista matches/messages/blocks                                | nav/manifest/notificações                     | Conversas V2 / L3                           |
| `/conversas/$matchId`             | `conversas/$matchId.tsx`                | Auth; `matchId`        | messages, matches, blocks, profiles, read RPC, Realtime             | lista/push/deep link; refresh por ID          | Conversas V2, preservar ordem/receipts / L3 |
| `/conversas/comunidade`           | `conversas/comunidade.tsx`              | Auth                   | global_messages, flags, stickers, roles, commitments, 2 canais      | alias/menu                                    | espaço comunitário; separar namoro / L3     |
| `/pretendentes/`                  | `pretendentes/index.tsx`                | Auth                   | profiles, preferences, photos, blocks, commitments, roles           | nav/Header/manifest                           | Namoro opt-in / L3                          |
| `/pretendentes/$id`               | `pretendentes/$id.tsx`                  | Auth; `id`             | profiles/photos/prefs, interests, matches, views, reports           | lista/interesses/notificações                 | descoberta romântica / L3                   |
| `/interesses`                     | `interesses.tsx`                        | Auth                   | interests, matches, profiles, Realtime                              | menus/notificações                            | incorporar ao Namoro / L3                   |
| `/matches`                        | `matches.tsx`                           | Auth                   | matches, profiles, `unmatch`, Realtime                              | links internos                                | compatibilidade/redirect futuro / L3        |
| `/recados`                        | `recados.tsx`                           | Auth                   | 5 tabelas/views + 12 RPCs anônimas                                  | Header/perfil                                 | Namoro exclusivo; preservar histórico / L3  |
| `/proposito/$matchId`             | `proposito/$matchId.tsx`                | Auth; `matchId`        | matches/messages/profiles/gifts/read RPC, Realtime                  | chat/matches                                  | Propósito Firmado redesenhado / L3          |
| `/perfil`                         | `perfil.tsx` / PerfilPage               | Auth                   | profiles, photos, prefs, roles, badges, moderação/Storage           | 40 refs; nav/Header                           | Perfil modular / L3                         |
| `/bloqueados`                     | `bloqueados.tsx`                        | Auth                   | blocks, profiles                                                    | conta/perfil                                  | Configurações/privacidade / L3              |
| `/verificacao`                    | `verificacao.tsx`                       | Auth                   | profiles, verification_requests/verifications, Storage              | perfil/Header                                 | identidade/segurança / L3                   |
| `/conta`                          | `conta.tsx` / ContaPage                 | Auth                   | helpers de conta/Auth                                               | perfil/Header                                 | **V2-007 recomendado** / L3                 |
| `/notificacoes`                   | `notificacoes.tsx`                      | Herd                   | notifications                                                       | nav/Header/SW/manifest                        | central de notificações / L3                |
| `/suporte/`                       | `suporte/index.tsx`                     | Auth                   | tickets/messages, view list, Storage                                | footer/Header                                 | Configurações/Suporte / L3                  |
| `/suporte/$id`                    | `suporte/$id.tsx`                       | Auth; `id`             | tickets/messages/profiles/roles, Storage                            | lista/notificações                            | suporte; preservar ACL / L3                 |
| `/suporte/ajuda`                  | `suporte/ajuda.tsx`                     | Auth                   | articles, increment views RPC                                       | suporte                                       | ajuda / L2                                  |
| `/loja`                           | `loja.tsx` / LojaPage                   | Auth                   | profiles + helpers economia/customização                            | nav/perfil                                    | Loja compartilhada / L3                     |
| `/presentes/`                     | `presentes/index.tsx`                   | Auth                   | helpers gifts                                                       | perfil/loja                                   | presentes sociais/românticos / L3           |
| `/caixas`                         | `caixas.tsx`                            | Auth                   | helpers caixas/RPCs                                                 | loja                                          | economia/jogos / L3                         |
| `/avatar`                         | `avatar.tsx` / AvatarPage               | Auth                   | bases/categories/items/looks/inventory/coins, purchase RPC, Storage | nav/perfil                                    | desativação controlada personagem / L3      |
| `/avatar/criar`                   | `avatar.criar.tsx`                      | Auth                   | bases/profile/base do usuário                                       | sem entrada estática; filho de `/avatar`      | investigar onboarding antigo / L2           |
| `/meu-pet`                        | `meu-pet.tsx`                           | Auth                   | helpers pet V1/V2 e muitas RPCs                                     | nav/perfil                                    | plataforma compartilhada / L3               |
| `/pet-arcade`                     | `pet-arcade.tsx`                        | Auth                   | helpers arcade V1/V2                                                | meu-pet                                       | jogos; aguardar lista do usuário / L3       |
| `/quiz-biblico`                   | `quiz-biblico.tsx`                      | Auth                   | `get_today_quiz`                                                    | pet/menus                                     | jogo; não remover / L3                      |
| `/conquistas`                     | `conquistas.tsx`                        | Auth                   | helpers badges/conquistas                                           | perfil/pet                                    | progressão compartilhada / L3               |
| `/admin/`                         | `admin/index.tsx` / Admin               | Adm                    | 17+ tabelas, 7 RPCs, Storage, Realtime                              | Header/admin links; guard local               | Admin modular / L3                          |
| `/admin/auras`                    | `admin/auras.tsx`                       | Adm                    | helper auras                                                        | Admin                                         | Admin personalização / L3                   |
| `/admin/avatar`                   | `admin/avatar.tsx`                      | Adm                    | categories/items + bucket `avatar-items`                            | Admin; guards → login/início                  | manter até avatar desativado / L3           |
| `/admin/economia`                 | `admin/economia.tsx`                    | Adm                    | 4 RPCs admin + profiles/Storage                                     | Admin                                         | Admin economia / L3                         |
| `/admin/equipe-live`              | `admin/equipe-live.tsx`                 | Adm                    | helper live team                                                    | Admin; guard → admin/login                    | investigar operação externa / L3            |
| `/admin/fotos`                    | `admin/fotos.tsx`                       | Adm                    | moderation log/queue/settings, profiles/photos, delete RPC, Storage | Admin                                         | Admin moderação / L3                        |
| `/admin/fundos`                   | `admin/fundos.tsx`                      | Adm                    | helper backgrounds                                                  | Admin                                         | Admin personalização / L3                   |
| `/admin/gradientes-nome`          | `admin/gradientes-nome.tsx`             | Adm                    | helper gradients                                                    | Admin; guard → início/login                   | Admin personalização / L3                   |
| `/admin/molduras`                 | `admin/molduras.tsx`                    | Adm                    | helper decorations                                                  | Admin                                         | Admin personalização / L3                   |
| `/admin/pets`                     | `admin/pets.tsx`                        | Adm                    | helpers catálogo pet                                                | Admin                                         | Admin pets / L3                             |
| `/admin/presentes`                | `admin/presentes.tsx`                   | Adm                    | bucket `gift-images`                                                | Admin                                         | Admin presentes / L3                        |
| `/admin/stickers`                 | `admin/stickers.tsx`                    | Adm                    | sticker categories/items                                            | Admin                                         | Admin stickers / L3                         |
| `/admin/verificacoes`             | `admin/verificacoes.tsx`                | Adm                    | profiles, requests, verifications                                   | Admin                                         | Admin segurança / L3                        |
| `/api/photo-repair`               | `api/photo-repair.ts`                   | API POST               | service role server-only, profiles/photos/roles                     | ferramenta admin; sem link UI estático        | preservar auth + papel / L3                 |
| `/api/verify-photo`               | `api/verify-photo.ts`                   | API POST               | bearer usuário, AI, settings/log, rejects Storage                   | upload de foto                                | rate limit + fail-closed / L3               |
| `/api/public/hooks/push-dispatch` | `api/public/hooks/push-dispatch.ts`     | API POST               | segredo server-only, batch lazy                                     | pg_cron externo                               | preservar PR-001/Job / L3                   |
| `/blog/`                          | `blog.index.tsx`                        | Pub                    | conteúdo local                                                      | landing/sitemap                               | conteúdo público / L2                       |
| `/blog/$slug`                     | `blog.$slug.tsx`                        | Pub; `slug`            | conteúdo local                                                      | índice/sitemap                                | conteúdo público / L2                       |
| `/como-funciona`                  | `como-funciona.tsx`                     | Pub                    | estática                                                            | PublicNav                                     | reposicionar comunidade / L2                |
| `/depoimentos`                    | `depoimentos.tsx`                       | Pub                    | estática                                                            | landing                                       | preservar até novo marketing / L2           |
| `/instalar`                       | `instalar.tsx`                          | Pub                    | PWA install                                                         | nav/manifest                                  | manter PWA / L2                             |
| `/manual`                         | `manual.tsx`                            | Pub                    | estática                                                            | footer/PublicNav                              | atualizar incrementalmente / L2             |
| `/sobre`                          | `sobre.tsx`                             | Pub                    | estática                                                            | PublicNav                                     | atualizar posicionamento / L2               |
| `/termos`                         | `termos.tsx`                            | Pub                    | estática                                                            | signup/footer                                 | jurídico; preservar / L3                    |
| `/v2`                             | `v2.tsx` / V2RouteLayout                | Auth + flag            | nenhum backend; error boundary                                      | prefixo direto; refresh seguro                | raiz V2 / L3                                |
| `/v2/`                            | `v2.index.tsx`                          | Auth + flag            | —                                                                   | redirect tipado para seção `inicio`           | compatibilidade / L1                        |
| `/v2/$section`                    | `v2.$section.tsx`                       | Auth + flag; `section` | páginas provisórias sem backend                                     | registry V2; not-found localizado             | futuras rotas verticais / L3                |

## Redirecionamentos, aliases e sobreposições

| Origem                        | Destino                          | Condição           | Interpretação                                   |
| ----------------------------- | -------------------------------- | ------------------ | ----------------------------------------------- |
| `/comunidade`                 | `/conversas/comunidade`          | sempre             | alias legado; “comunidade” hoje é chat global   |
| `/onboarding/etapa-1`         | `/onboarding`                    | sempre             | compatibilidade                                 |
| `/v2/`                        | `/v2/inicio`                     | sempre, via params | entrada V2                                      |
| página privada                | `/auth/login?returnTo=...`       | sem sessão         | boundary canônico; alguns guards locais repetem |
| login                         | `returnTo` validado ou `/inicio` | sessão concluída   | same-origin, sem open redirect                  |
| páginas com perfil incompleto | `/onboarding`                    | regra local        | autorização de onboarding preservada            |

Não foram encontrados redirects circulares estáticos. O risco de concorrência vem da coexistência
do boundary global com guards locais, não de um ciclo literal identificado.

## Links e rotas quebradas

O scan encontrou **485 referências tipadas**:

| Dimensão      | Totais                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| origem        | `src` 433; testes 17; manifest 16; sitemap 11; public 8; configuração 0; outras 0    |
| classificação | rotas 424; assets 38; endpoints 4; externas 12; deep links 4; dinâmicas 3           |
| estado        | resolvidas 423; não resolvida 1; exige investigação 3; não aplicável a resolução 58 |

O manifest contribui com `start_url`, `scope`, ícones e atalhos. O sitemap contribui com seus 11
`<loc>`, normalizados de `https://vaidarnamoro.com` para pathnames internos. O service worker
contribui com precache, fallback e navegação dinâmica. URLs de outros domínios permanecem externas
e assets/endpoints não são tratados como file routes.

No estado atual, uma referência classificada como rota não resolve:

| Origem                           | Destino    | Estado         | Impacto                                                                            |
| -------------------------------- | ---------- | -------------- | ---------------------------------------------------------------------------------- |
| `src/v2/app-shell/navigation.ts` | `/membros` | sem file route | contrato padrão demonstrativo; o runtime real substitui por `/v2/explorar-pessoas` |

Esse é um resultado regenerável, não um contrato de teste: corrigir `/membros` futuramente deve
reduzir a contagem de não resolvidos para zero sem quebrar a suíte. Três destinos dinâmicos
(`/v2/${route.slug}` e a URL do `notificationclick`) exigem investigação. Isso não prova que
payloads externos de push, registros já salvos no banco ou URLs produzidas por lógica arbitrária
sejam válidos.

## Rotas sem entrada estática conhecida

- Os três endpoints são chamados por runtime ou infraestrutura externa e não são órfãos.
- `/auth/reset-password` é callback de recuperação (`redirectTo`) e é comprovadamente usada.
- `/v2` e `/v2/` são entradas/deep links e aparecem na route tree/testes.
- `/avatar/criar`, `/onboarding/etapa-1` e `/onboarding/etapa-2` precisam de investigação de
  fluxos históricos. A primeira é um opt-in comentado; etapa 1 é alias; etapa 2 pode ser deep link
  salvo. Nenhuma é segura para excluir.

## Divergências por superfície

- Bottom nav legado privilegia Início, Devocional, Conversas, Pretendentes e Perfil.
- Shell V2 privilegia Início, Comunidade, criação, Conversas e Perfil.
- Manifest privilegia Pretendentes, Conversas, Devocional e Notificações.
- Header possui destinos administrativos, românticos, economia e notificações.
- Push aceita destino fornecido pelo payload, sem catálogo same-origin no service worker.

Antes de retirar uma rota, o catálogo canônico deve cobrir menus mobile/desktop, manifest, push,
notificações salvas, deep links, sitemap e redirects.

## Proteção e autorização

- Rotas públicas permanecem montadas durante restauração da sessão.
- Rotas privadas não montam conteúdo durante `initializing`/erro recuperável.
- Admin preserva guards próprios, mas a garantia real deve continuar no backend/RLS.
- `/v2/*` exige a flag exata e sessão, usa o mesmo AuthProvider e não monta providers privados
  legados.
- Endpoints validam suas próprias credenciais; não são tratados como páginas.

## Critério de remoção por rota

Uma rota só pode ser classificada “segura para excluir” quando: não houver entrada em código,
manifest, SW, sitemap, notificação ou operação externa; a substituta tiver paridade e métricas;
redirect compatível estiver publicado; dados e Storage forem preservados; testes cliente/SSR,
auth, autorização, refresh e deep link passarem; e o rollback puder reativar a implementação
anterior sem migration destrutiva.
