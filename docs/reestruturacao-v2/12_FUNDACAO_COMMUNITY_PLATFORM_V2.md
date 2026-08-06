# Fundação Community Platform V2

## 1. Marco e escopo

- Repositório: `tonyrodrigues98/vaidarnamorocristao`
- Branch de trabalho: `rebuild/community-platform-v2`
- Base: `main`
- Commit-base: `0de09e755ff19bdcba80eed37484cce6ea1b4a4f`
- Estado inicial: working tree limpo e `main` local igual a `origin/main`
- Publicação: fora do escopo
- Supabase publicado, migrations, policies, buckets, Vault, secrets, cron e Job:
  somente leitura documental; nenhuma alteração autorizada

Esta etapa cria somente uma fronteira inicial. As rotas, consultas e componentes
legados continuam sendo a implementação ativa. Todas as experiências V2 ficam
desativadas por padrão.

## 2. Stack confirmada

| Área              | Implementação atual                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Frontend          | React 19.2, TypeScript 5.8 e Vite 7.3                                                      |
| Aplicação/SSR     | TanStack Start, TanStack Router e Nitro                                                    |
| Dados             | Supabase JS 2.110, Postgres, Auth, Realtime e Storage                                      |
| Estado remoto     | TanStack Query                                                                             |
| UI                | Tailwind CSS 4, Radix UI, Lucide, Framer Motion e Sonner                                   |
| Formulários       | React Hook Form, Zod e Hookform Resolvers                                                  |
| PWA               | `manifest.webmanifest`, service worker próprio e fallback offline                          |
| Runtime de deploy | configuração Cloudflare/Lovable via `wrangler.jsonc` e `@lovable.dev/vite-tanstack-config` |
| Testes            | Vitest; testes unitários seguros e testes integrados que exigem Supabase descartável       |
| Pacotes           | Bun; há também lockfiles históricos de npm/Bun que devem ser tratados separadamente        |

## 3. Inventário do frontend atual

### 3.1 Volumetria

- 65 arquivos de rota, incluindo três endpoints server-side;
- 207 componentes;
- 81 módulos em `src/lib`;
- 8 hooks em `src/hooks`;
- 6 arquivos de integração;
- 380 arquivos TypeScript/TSX analisados no grafo de imports;
- aproximadamente 1.500 dependências internas estáticas.

Não existe hoje uma pasta própria de serviços ou contextos. Queries, commands,
Realtime e regras de apresentação estão espalhados por rotas, hooks e `src/lib`.

### 3.2 Rotas

#### Públicas e institucionais

`/`, `/como-funciona`, `/sobre`, `/depoimentos`, `/blog`, `/blog/$slug`,
`/termos`, `/manual` e `/instalar`.

#### Autenticação e onboarding

`/auth/login`, `/auth/signup`, `/auth/forgot-password`,
`/auth/reset-password`, `/onboarding`, `/onboarding/etapa-1` e
`/onboarding/etapa-2`.

#### Núcleo autenticado

`/inicio`, `/perfil`, `/conta`, `/dashboard`, `/notificacoes`,
`/bloqueados`, `/verificacao`, `/noticias`, `/devocional`, `/oracoes`,
`/conquistas` e `/quiz-biblico`.

#### Comunidade e mensagens

`/comunidade`, `/conversas`, `/conversas/comunidade`,
`/conversas/$matchId` e `/suporte/*`.

Hoje `/comunidade` não representa um domínio comunitário completo. A experiência
social existente está concentrada em chat global, devocionais, orações e
notícias.

#### Namoro

`/pretendentes`, `/pretendentes/$id`, `/interesses`, `/matches`,
`/recados` e `/proposito/$matchId`.

O domínio romântico ainda está misturado à navegação e ao perfil geral. A rota
`/inicio` ainda consulta sugestões baseadas em sexo e estado de aprovação.

#### Economia, personalização e pets

`/loja`, `/caixas`, `/presentes`, `/avatar`, `/avatar/criar`,
`/meu-pet` e `/pet-arcade`.

#### Administração

`/admin`, `/admin/economia`, `/admin/fotos`, `/admin/verificacoes`,
`/admin/equipe-live`, `/admin/pets`, `/admin/avatar`, `/admin/auras`,
`/admin/molduras`, `/admin/fundos`, `/admin/gradientes-nome`,
`/admin/presentes` e `/admin/stickers`.

#### Endpoints

- `/api/public/hooks/push-dispatch`;
- `/api/verify-photo`;
- `/api/photo-repair`.

### 3.3 Componentes, hooks e contextos

Os maiores grupos são:

- `components/ui`: 51 componentes;
- `components/pet`: 62 componentes;
- `components/avatar`: 12 componentes;
- `components/admin`: 10 componentes;
- `components/mobile`: 8 componentes;
- `components/gifts`: 7 componentes.

Hooks existentes:

- `useActiveCommitment`;
- `useConversationsList`;
- `use-long-press`;
- `use-mobile`;
- `useNetworkStatus`;
- `usePullToRefresh`;
- `usePushNotifications`;
- `usePwaInstall`.

Providers/contextos montados no root:

- `AuthProvider`;
- `QueryClientProvider`;
- `ThemeProvider`;
- `PresenceProvider`;
- `NotificationsBridge`;
- `BanGuard`;
- shell mobile e estados de rede/PWA.

### 3.4 Arquivos monolíticos

| Arquivo                               | Linhas aproximadas | Risco                                                           |
| ------------------------------------- | -----------------: | --------------------------------------------------------------- |
| `src/routes/admin/index.tsx`          |              3.880 | ações administrativas, queries, UI e permissões no mesmo módulo |
| `src/routes/admin/pets.tsx`           |              1.989 | operações e configuração ampla de pets                          |
| `src/routes/loja.tsx`                 |              1.701 | catálogo, economia, compra, inventário e UI                     |
| `src/routes/perfil.tsx`               |              1.670 | identidade, edição, preferências, fotos e personalização        |
| `src/routes/conversas/comunidade.tsx` |              1.482 | paginação, Realtime, moderação e composer                       |
| `src/routes/onboarding/index.tsx`     |              1.398 | perguntas, persistência, retomada e UI                          |
| `src/routes/devocional.tsx`           |              1.392 | conteúdo e várias interações sociais                            |
| `src/routes/meu-pet.tsx`              |              1.317 | pet, inventário, cuidado, missões e apresentação                |
| `src/routes/inicio.tsx`               |              1.242 | agregação, perfil, namoro, conteúdo, missões e Admin            |
| `src/routes/recados.tsx`              |              1.149 | regras românticas, quota, hints, denúncias e UI                 |

Esses módulos não devem ser reescritos simultaneamente. A extração deverá seguir
fatias verticais com adaptadores, testes e flags.

### 3.5 Dependências circulares

A análise estática inicial encontrou um ciclo:

`routeTree.gen.ts → __root.tsx → router.tsx → routeTree.gen.ts`

O elo de `__root.tsx` para `router.tsx` existia apenas para importar
`AppRouterContext`. A fundação move esse contrato para
`src/v2/app/router-context.ts`, removendo a dependência do shell para a fábrica
do router. Resta somente o ciclo tipado gerado
`routeTree.gen.ts ↔ router.tsx`, porque o gerador importa o tipo de
`getRouter`; não é um ciclo de execução escrito pelos módulos de produto. O
grafo deverá permanecer sem ciclos manuais; o arquivo gerado não deve ser
editado diretamente.

## 4. Contrato Supabase conhecido

### 4.1 Autoridade

- Tipos gerados: 140 tabelas, 3 views e 105 funções.
- Migrations: 196 arquivos históricos.
- Código: referências reais usadas pelo frontend atual.
- Produção: ainda não reconciliada nesta etapa.

Tipos e migrations não provam sozinhos o estado publicado.

### 4.2 Tabelas e views referenciadas pelo aplicativo

#### Identidade, perfil e segurança

`profiles`, `profile_advanced`, `profile_preferences`, `profile_photos`,
`profile_views`, `blocks`, `reports`, `restricted_words`,
`verification_requests`, `verifications`, `photo_moderation_log`,
`photo_moderation_queue`, `photo_moderation_settings`, `terms_acceptances`,
`user_roles`, `user_activity`, `user_admin_requests`, `user_admin_warnings` e
`user_ban_appeals`.

#### Namoro

`interests`, `matches`, `conversations`, `messages`, `message_flags`,
`relationship_commitments`, `anonymous_messages`,
`anonymous_message_settings`, `anonymous_message_hints`,
`anonymous_messages_inbox`, `anonymous_messages_outbox`,
`couple_time_capsules`, `pre_cadastros` e `pre_cadastro_matches`.

#### Comunidade e conteúdo

`global_messages`, `daily_posts`, `devotional_comments`,
`devotional_comment_likes`, `devotional_comment_reports`,
`devotional_prayed`, `devotional_reactions`, `prayer_requests`,
`prayer_request_prayed`, `prayer_request_reports`, `notifications`,
`live_team_members`, `live_monthly_highlights`, `support_articles`,
`support_tickets` e `support_messages`.

#### Economia, loja e personalização

`user_coins`, `coin_transactions`, `gift_transactions`, `virtual_gifts`,
`user_decorations`, `avatar_decorations`, `avatar_bases`,
`avatar_categories`, `avatar_items`, `user_avatar_base`,
`user_avatar_equipped`, `user_avatar_inventory`, `user_avatar_looks`,
`name_gradients`, `user_name_gradients`, `profile_backgrounds`,
`user_profile_backgrounds`, `sticker_categories`, `stickers`,
`user_achievements`, `user_badges`, `badges`, `user_grab_inventory`,
`grab_config`, `grab_pools` e `grab_pool_prizes`.

#### Pets, missões e jogos

`pets`, `user_pets`, `user_pets_v2`, `pet_species`, `pet_variants`,
`pet_backgrounds`, `user_pet_backgrounds`, `user_pet_unlocks`,
`pet_achievements`, `pet_arcade_daily_missions`, `pet_benefits`,
`pet_care_config`, `pet_care_events`, `pet_care_items`,
`pet_care_item_compat`, `pet_care_state`, `pet_confessions`,
`pet_expeditions`, `pet_perk_effects`, `pet_personality_effects` e os logs e
estados de arcade presentes nos tipos.

#### Push

`push_subscriptions` e `push_queue`.

### 4.3 RPCs referenciadas

#### Identidade/Admin

`admin_ban_user`, `admin_unban_user`, `admin_hard_delete_user`,
`admin_delete_user_photo`, `admin_search_users`, `admin_user_economy`,
`admin_economy_summary`, `request_account_deactivation`,
`request_account_deletion`, `request_account_reactivation`,
`cancel_account_deletion`, `request_reverification`, `check_text_restricted` e
`get_hidden_staff_ids`.

#### Economia, XP e inventário

`admin_add_user_coins`, `admin_grant_coins`, `claim_daily_coins`,
`get_my_coins`, `spend_coin`, `award_xp`, `get_my_xp_state`,
`get_my_prestige`, `get_my_rebirth_history`, `prestige_rebirth`,
`recompute_user_badges`, `award_contributor_badge`, `claim_starter_bundle`,
`get_my_starter_bundle`, `claim_freebie`, `claim_free_frame`,
`list_my_freebie_status`, `purchase_decoration`, `equip_decoration`,
`unequip_decoration`, `purchase_name_gradient`, `equip_name_gradient`,
`unequip_name_gradient`, `purchase_profile_background`,
`equip_profile_background`, `unequip_profile_background`,
`purchase_avatar_item`, `send_virtual_gift` e `redeem_virtual_gift`.

#### Namoro e mensagens

`send_anonymous_message`, `reply_anonymous_message`,
`report_anonymous_message`, `ignore_anonymous_message`,
`unignore_anonymous_message`, `request_anonymous_hint`,
`request_anonymous_reveal`, `send_anonymous_hint_text`,
`buy_anonymous_extra`, `get_anonymous_cooldown`, `get_anonymous_quota`,
`set_anonymous_optout`, `mark_message_read` e `unmatch`.

#### Comunidade e plataforma

`mark_all_notifications_read`, `increment_article_views`,
`touch_my_activity`, `get_prayer_streak`, `get_received_gifts_public` e
`get_today_quiz`.

#### Pets e jogos

`apply_pet_care`, `collect_pet_reward`, `equip_pet`,
`equip_pet_background`, `unlock_pet_background`, `unlock_adult_pet_with_coins`,
`evolve_my_pet`, `get_pet_evolution_status`, `get_pet_streak`,
`get_pet_weekly_chest`, `claim_pet_weekly_chest`, `pet_care_uses_today`,
`pet_runtime_modifiers`, `get_active_pet_perks`, `get_pet_dream_match`,
`roll_daily_missions`, `get_today_missions`, `get_my_missions`,
`progress_mission_action`, `roll_daily_expeditions`,
`get_today_expeditions`, `get_active_expedition`, `start_expedition`,
`claim_expedition`, `perform_grab`, `perform_grab_multi` e `get_grab_state`.

O inventário tipado ainda inclui funções sensíveis como `grant_coin_event`,
`create_notification` e `track_achievement`. A exposição publicada precisa ser
confirmada antes de qualquer redesenho desses fluxos.

### 4.4 Storage

Buckets referenciados diretamente:

- `profile-photos`;
- `verifications`;
- `support-attachments`;
- `photo-moderation-rejects`;
- `stickers`;
- `gift-images`;
- `avatar-items`;
- `avatar-looks`.

As migrations também declaram `profile-backgrounds` e `live-team`.

Nenhum bucket ou objeto pode ser renomeado, tornado público/privado ou copiado
sem inventário autenticado, matriz de acesso e teste de compatibilidade.

### 4.5 Policies conhecidas

A leitura histórica encontrou 446 declarações `CREATE POLICY` distribuídas por
aproximadamente 140 alvos, incluindo policies de `storage.objects` e
configuração de Realtime.

Esse número contém revisões, drops e recriações. Não representa a quantidade de
policies atualmente ativas. Os domínios com maior quantidade histórica incluem:

- Storage: 65 declarações;
- palavras restritas: 12;
- mensagens: 9;
- chat global: 9;
- interesses: 8;
- posts diários: 8;
- pets do usuário: 7;
- perfil/preferências e papéis: 6–7 por alvo.

O snapshot publicado deverá comparar nome, comando, papel, `USING`,
`WITH CHECK`, owner e grants. Contagem simples não é suficiente.

### 4.6 Autenticação

`AuthProvider` usa:

- `supabase.auth.onAuthStateChange`;
- `supabase.auth.getSession`;
- persistência no `localStorage`;
- refresh automático;
- carregamento adicional de `user_roles` e status do perfil;
- subscription para remoção do próprio perfil.

O cliente público usa apenas URL e publishable key. O cliente admin server-only
usa `SUPABASE_SERVICE_ROLE_KEY` por `process.env` e não deve ser importado por
componentes de navegador.

## 5. Mapa de preservação

| Domínio    | Dados protegidos                        | Invariantes mínimas                                                 |
| ---------- | --------------------------------------- | ------------------------------------------------------------------- |
| Auth       | usuários, identidades, sessões          | mesmo usuário, provedores e capacidade de recuperação               |
| Perfil     | perfil, fotos, ordem, verificação       | owner, visibilidade, moderação e apresentação preservados           |
| Namoro     | interesses, matches, recados, propósito | participantes, estado, ordem e histórico sem autoativação           |
| Mensagens  | threads, mensagens, flags, leitura      | autoria, destinatário, ordenação, entrega e bloqueios               |
| Comunidade | posts, chat, orações, devocionais       | autoria, audiência, moderação e timestamps                          |
| Push       | subscriptions e fila                    | endpoint, usuário, tentativas e processamento; Job único preservado |
| Economia   | saldo, ledger, compras, presentes       | soma semântica, moeda, preço histórico, ownership e idempotência    |
| XP/missões | XP, níveis, conquistas e missões        | fonte, caps, progressão e prevenção de replay                       |
| Inventário | itens e equipamentos                    | item adquirido, quantidade, estado equipado e origem                |
| Pets/jogos | `user_pets`, `user_pets_v2`, progresso  | sem consolidação, perda de recompensa ou remoção de assets          |
| Admin      | roles, suporte, avisos, denúncias       | mesma autoridade, auditabilidade e confidencialidade                |
| Storage    | buckets e objetos                       | bucket, path, owner, tamanho, MIME, acesso e referências            |
| Operação   | secrets, Vault e cron                   | nomes, escopo server-only, Job e frequência intactos                |

## 6. Arquitetura-alvo

```text
src/
  app/
    shell/
    routing/
    providers/
    navigation/
  design-system/
    tokens/
    primitives/
    patterns/
    icons/
  domains/
    community/
      application/
      data/
      ui/
    dating/
    messaging/
    profile/
    economy/
    customization/
    pets/
    admin/
  platform/
    supabase/
      auth/
      database/
      realtime/
      storage/
    feature-flags/
    observability/
    pwa/
  legacy/
    adapters/
    routes/
    compatibility/
```

Durante a transição, a implementação vive em `src/v2/` para não conflitar com
as pastas atuais. Quando uma fronteira tiver paridade, poderá ser promovida para
o layout final em PR mecânico separado.

### 6.1 Regras de dependência

- UI depende de application e contratos; não consulta Supabase diretamente.
- Application define queries, commands e eventos de domínio.
- Data implementa portas usando Supabase e respeita RLS.
- Comunidade não depende de disponibilidade romântica.
- Namoro pode ler identidade pública permitida, nunca controlar participação social.
- Mensagens não decide elegibilidade romântica; recebe o contexto da thread.
- Economia é server-authoritative para saldos e recompensas.
- Avatar, pets, loja, inventário e personalização são capacidades da plataforma
  compartilhada. Nenhuma delas depende da participação no Namoro.
- Admin usa capabilities explícitas e não redefine regras em componentes.
- `service_role` permanece exclusivamente server-side.
- Legado é acessado por adaptadores documentados e removíveis.
- Shared genérico só nasce após pelo menos dois usos reais compatíveis.
- Uma interface legada só pode ser ocultada após a substituta atingir paridade
  funcional comprovada e possuir rollback por feature flag.
- A desativação de Pretendentes não desativa Avatar, pets, loja, inventário ou
  personalização e não autoriza remover nenhum dado desses sistemas.

### 6.2 Foundation implementada nesta etapa

- `src/v2/app`: contexto do router, identidade do build e gate autenticado;
- `src/v2/platform`: registry de feature flags fail-closed;
- `src/v2/domains`: ownership e dependências permitidas;
- `src/v2/legacy`: invariantes de preservação;
- metadados `vdn-build-commit` e `vdn-build-channel` no documento;
- `/inicio` aguarda Auth e dispara no máximo uma navegação para login;
- nenhum domínio V2 está ativado.

## 7. Plano incremental de PRs

| PR     | Objetivo e módulos                                            | Dependências           | Banco                         | Flag                          | Risco/testes                                             | Rollback e conclusão                                   |
| ------ | ------------------------------------------------------------- | ---------------------- | ----------------------------- | ----------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| V2-001 | Fundação, contratos, build metadata e gate de `/inicio`       | PR #1                  | nenhum                        | todas off                     | unitários, typecheck, build e navegação anônima          | remover imports V2; zero mudança funcional autenticada |
| V2-002 | Hardening de Auth e navegação protegida em todas as rotas     | V2-001                 | nenhum                        | `appShell` off                | sessão, refresh, logout, redirects e papéis              | manter guards legados; zero loop/transição rejeitada   |
| V2-003 | Design system V2: tokens, primitives e estados                | V2-001                 | nenhum                        | consumo por componente        | visual, contraste, reduced motion e 16px inputs          | componentes antigos permanecem                         |
| V2-004 | App shell responsivo e navegação por capabilities             | V2-002/003             | nenhum                        | `appShell`                    | mobile/desktop, safe areas, deep links e acessibilidade  | flag volta ao shell atual                              |
| V2-005 | Adapter read-only do perfil e fotos existentes                | snapshot publicado     | nenhum                        | `profile` off                 | RLS, owner, ordem, signed/public URLs                    | voltar às queries legadas                              |
| V2-006 | Capability independente Comunidade/Namoro                     | decisões e snapshot    | migration aditiva provável    | `dating` off                  | matriz social/romântica, usuários comprometidos          | flag off e coluna ignorada                             |
| V2-007 | Onboarding comunitário com opt-in de Namoro                   | V2-005/006             | aditiva se necessária         | coorte `dating`               | retomada, dupla submissão e opt-in                       | novas coortes voltam ao fluxo legado                   |
| V2-008 | Conexões, grupos e eventos: contratos/MVP                     | decisões sociais       | tabelas aditivas              | `community`                   | RLS, blocks, moderação e papéis                          | ocultar rotas V2; preservar dados                      |
| V2-009 | Feed social e interações                                      | V2-008                 | aditiva                       | `community`                   | autoria, audience, paginação, offline e abuso            | leitura/composer desligados por flag                   |
| V2-010 | Status de 24 horas                                            | V2-009                 | aditiva + expiração           | flag própria futura           | TTL, viewers, privacidade, Storage e moderação           | parar distribuição sem apagar auditoria                |
| V2-011 | Conversas: adapters, paginação, Realtime e offline            | V2-002/005             | somente aditiva se comprovada | `messaging`                   | ordem, optimistic send, reconnect, leitura e duplicidade | voltar às telas antigas                                |
| V2-012 | Perfil modular e personalização                               | V2-003/005             | layout aditivo                | `profile`                     | paridade, reordenação, privacidade e itens equipados     | renderizador antigo preservado                         |
| V2-013 | Loja, ledger, inventário e cosméticos                         | contenção RPC + V2-012 | apenas após reconciliação     | `economy`, `customization`    | saldo×ledger, replay, compra e ownership                 | UI antiga e commands anteriores seguros                |
| V2-014 | Pets, missões e jogos por adapters                            | V2-013                 | nenhuma consolidação          | `pets`                        | `user_pets` e V2, recompensas e progresso                | cada módulo volta isoladamente                         |
| V2-015 | Admin por capabilities e rotas                                | V2-002 e domínios      | regras preservadas            | `admin`                       | papel, permissão, auditoria e ações críticas             | painel antigo por módulo                               |
| V2-016 | Observabilidade, performance e PWA V2                         | fatias anteriores      | nenhum                        | por módulo                    | Core Web Vitals, offline, cache, bundle e erros          | remover instrumentação/voltar SW anterior              |
| V2-017 | Desativação visual do Pretendentes e avatar-personagem legado | paridade e telemetria  | nenhum                        | flags de navegação            | deep links, históricos, paridade e compensação           | reexpor rotas; sem apagar dados                        |
| V2-018 | Contração física controlada                                   | estabilização longa    | potencialmente destrutiva     | irreversível somente aprovado | backup, backfill, comparação e restore                   | somente com rollback testado                           |
| V2-019 | Cinema: discovery e spike                                     | Comunidade estável     | schema aditivo futuro         | `cinema`                      | direitos, CDN, sync, host, moderação e carga             | nenhuma sessão nova; preservar catálogo                |
| V2-FMT | Normalização mecânica de Prettier/CRLF                        | independente           | nenhum                        | n/a                           | lint e diff exclusivamente mecânico                      | revert isolado; nunca misturar com lógica              |

Cada PR com banco deverá usar:

`expandir → preencher → comparar → alternar → estabilizar → contrair`

## 8. Testes obrigatórios por fase

- Unitários para regras, flags, mapeadores e commands.
- Integração com Supabase exclusivamente descartável.
- Matriz RLS para anon, user, moderator, admin, super_admin e service role.
- Realtime com reconexão, duplicidade e ordenação.
- Navegação pública/protegida e persistência da sessão.
- PWA, offline, update do service worker e instalação.
- Mobile iOS/Android, safe areas e teclado.
- Acessibilidade por teclado, leitor, contraste e reduced motion.
- Performance, tamanho de bundle e listas longas.
- Migração com backfill idempotente, reconciliação e rollback.
- Regressão visual por viewport e estados loading/vazio/erro/offline.

## 9. Riscos e limitações

- Estado publicado do Supabase ainda não foi reconciliado.
- Testes RLS não podem usar produção.
- A versão atualmente publicada não tem commit verificável.
- RPCs sensíveis de economia, XP, conquistas, missões e notificações permanecem
  bloqueadores antes do redesign desses domínios.
- Moderação de fotos ainda exige fail-safe e rate limit.
- Push autorizado ainda não tem claim atômico.
- Páginas grandes e queries diretas dificultam testes e extração.
- O lint global possui baseline massivo de line endings/Prettier.
- Login autenticado real só pode ser validado com conta e ambiente de teste seguros.

## 10. Próximo PR recomendado

Após revisar esta fundação, o próximo PR deve ser **V2-002 — Auth e navegação
protegida**:

- inventariar todos os `<Navigate to="/auth/login">`;
- criar um único contrato de rota protegida;
- eliminar redirects durante estado Auth indefinido;
- impedir subscriptions/queries de páginas protegidas antes da sessão;
- testar refresh, sessão expirada, logout, usuário banido/rejeitado e deep links;
- manter Auth/Supabase atuais e não criar migration.

Não iniciar app shell visual ou feed antes desse hardening.
