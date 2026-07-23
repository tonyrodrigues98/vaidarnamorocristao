# Plano de Execução Codex — Reestruturação V2 do VaiDarNamoro

> Marco de análise: `main` em `622ce18191cd351a201a931170faaa25de573ff9`, inspecionado em 22 de julho de 2026.
>
> Natureza deste documento: plano técnico progressivo. Nenhuma recomendação abaixo autoriza, por si só, aplicação de migration, alteração do Supabase publicado, remoção de dados, ativação de feature ou retirada física de legado.

## Convenções de evidência

Este plano diferencia explicitamente:

- **HEAD**: confirmado no código, configuração ou teste do commit analisado;
- **TIPOS**: confirmado em `src/integrations/supabase/types.ts`, que representa uma geração anterior do schema, mas não prova o estado publicado neste momento;
- **MIGRATIONS**: declarado no histórico em `supabase/migrations/`, sem presumir que todas foram aplicadas, na mesma ordem ou sem alterações externas;
- **PRODUÇÃO**: exige consulta autenticada e somente leitura ao Supabase publicado;
- **INFERIDO**: conclusão fundamentada, ainda sem prova direta;
- **PENDENTE**: informação não fornecida ou não verificável neste marco.

Ordem obrigatória para qualquer mudança de dados: **expandir → preencher → comparar → alternar → estabilizar → contrair**.

---

## A. Marco analisado

### A.1 Git e estado da árvore

| Campo | Valor |
|---|---|
| Repositório | `tonyrodrigues98/vaidarnamorocristao` |
| Branch | `main` |
| Commit | `622ce18191cd351a201a931170faaa25de573ff9` |
| Assunto do commit | `Add files via upload` |
| Working tree antes da análise | limpo; `git status --short` sem saída |
| Working tree ao concluir este plano | somente `docs/reestruturacao-v2/11_PLANO_EXECUCAO_CODEX.md`, alteração autorizada por esta tarefa |
| `AGENTS.md` aplicável | nenhum arquivo encontrado no repositório |
| Commit/push nesta tarefa | não realizados |

Os documentos históricos citam marcos anteriores, entre eles `7fb5...` e `1de94...`. Eles servem como contexto, não como retrato do HEAD analisado.

### A.2 Stack confirmada no repositório

- React `19.2.0`, TypeScript `5.8.3` e Vite `^7.3.1`;
- TanStack React Start `^1.168.32`, TanStack Router `1.170.18` e TanStack Query `^5.83.0`;
- Supabase JS `^2.110.8`, com Auth, PostgREST/RPC, Realtime e Storage;
- Nitro e adaptação Cloudflare, com `wrangler.jsonc` apontando para a saída server do TanStack Start;
- Tailwind CSS `^4.3.3`, Radix UI, Lucide React, Framer Motion, React Hook Form e Zod;
- PWA própria por `public/manifest.webmanifest`, `public/sw.js` e `src/lib/registerSW.ts`;
- Vitest para testes e ESLint/Prettier para qualidade;
- Bun como gerenciador e executor do CI em `.github/workflows/tests.yml`.

Há três lockfiles (`bun.lock`, `bun.lockb` e `package-lock.json`). O CI usa Bun e `bun install --frozen-lockfile`; portanto, a autoridade de dependências deve ser formalizada antes de atualizações. O ambiente desta análise não tinha Bun nem `node_modules`; dependências não foram instaladas.

### A.3 Inventário documental integral

Foram encontrados **11 arquivos** em `docs/reestruturacao-v2/`. Foram lidos integralmente **10 documentos substantivos**. O décimo primeiro, `a`, contém somente CRLF (2 bytes), sem conteúdo analisável, e foi ignorado mediante autorização expressa do usuário.

| # | Arquivo | Leitura | Finalidade | Autoridade |
|---:|---|---|---|---|
| 1 | `a` | vazio; ignorado por autorização | nenhuma finalidade identificável | nenhuma |
| 2 | `VDN_GUIA_APLICACAO_CODEX.md` | integral | método, ordem de trabalho, árvore documental esperada e critérios operacionais | processo e coordenação |
| 3 | `VDN_ITEM_1_REVISAO_OFICIAL_ESCOPO.md` | integral | revisão oficial das decisões de produto e preservação | destino funcional/visual, abaixo apenas das decisões mais recentes |
| 4 | `VDN_ITEM_2_PLANO_SEGURANCA.md` | integral | ameaças, contenções e verificação de segurança | restrição obrigatória |
| 5 | `VDN_ITEM_3_SNAPSHOT_CANONICO_SUPABASE.md` | integral | modelo de snapshot, classificação de evidências e lacunas do banco publicado | restrição obrigatória para dados |
| 6 | `VDN_ITEM_3_SUPABASE_INVENTARIO_READONLY.sql` | integral | inventário SQL somente leitura para schema, grants, RLS, Realtime e Storage | instrumento diagnóstico; não executado |
| 7 | `VDN_ITEM_4_ARQUITETURA_POR_DOMINIOS.md` | integral | fronteiras do monólito modular e dependências | arquitetura-alvo |
| 8 | `VDN_ITEM_5_SEPARACAO_COMUNIDADE_NAMORO.md` | integral | estados, capacidades e isolamento entre Comunidade e Namoro | regra funcional-alvo |
| 9 | `VDN_ITEM_6_PLANO_DESMONTAGEM_MONOLITOS.md` | integral | estratégia de extração progressiva sem big bang | método de refatoração |
| 10 | `VDN_ITEM_7_PLANO_PRESERVACAO_MIGRACAO.md` | integral | invariantes, reconciliação, rollout e rollback | restrição obrigatória |
| 11 | `VDN_ITEM_8_PROJETO_NOVA_EXPERIENCIA.md` | integral | experiência-alvo, navegação, estados e princípios visuais | principal referência de destino após a revisão oficial |

Lacuna documental: o guia referencia `VDN_ITEM_1_MANUAL_SISTEMA_ATUAL.md`, mas esse arquivo não existe na pasta nem foi localizado no repositório. O código atual foi usado como fonte primária do presente, conforme a hierarquia definida. A ausência deve ser corrigida ou assumida formalmente como obsolescência do manual.

### A.4 Referências Sites/Vitra

Não foram encontrados URL pública, export, imagem, captura, gravação ou subpasta `referencias-sites/`. Também não existe `.openai/hosting.json`. As ocorrências de “Sites”, “Vitra”, Steam, Instagram, Discord e WhatsApp nos documentos são descrições textuais; não dão acesso aos protótipos.

**REFERÊNCIA SITES PENDENTE**

| Superfície | Material necessário antes do PR visual correspondente |
|---|---|
| Perfil | URL pública ou export; screenshot mobile e desktop; gravação das configurações laterais |
| Início e Status | URL pública ou export; screenshot mobile e desktop; gravação de publicação/visualização |
| Comunidade | URL pública ou export; screenshot mobile e desktop; gravação de presença, grupos e eventos |
| Conversas/Vitra | URL pública ou export; screenshots mobile/desktop; gravação de lista, envio, reconexão e anexos |
| Verbo | URL pública/export e especificação de integração com login |
| Sala de Cinema | URL pública/export, screenshots e gravação do host/player/chat sincronizado |

A ausência não bloqueia o primeiro PR de segurança. Bloqueia decisões de fidelidade visual e aceite de regressão visual nas superfícies correspondentes; não será preenchida por invenção.

---

## B. Diagnóstico do sistema atual

### B.1 Forma geral e rotas

O produto já é um monólito React/TanStack Start em produção, com **65 arquivos de rota**. As áreas reais incluem:

- marketing, conteúdo público e Auth: `src/routes/index.tsx`, `como-funciona.tsx`, `sobre.tsx`, `depoimentos.tsx`, `blog.*`, `auth/*`;
- núcleo autenticado atual: `inicio.tsx`, `dashboard.tsx`, `perfil.tsx`, `conta.tsx`, `notificacoes.tsx`, `bloqueados.tsx`, `verificacao.tsx`;
- namoro: `pretendentes/*`, `interesses.tsx`, `matches.tsx`, `recados.tsx`, `proposito/$matchId.tsx`;
- conversas: `conversas/index.tsx`, `conversas/$matchId.tsx` e `conversas/comunidade.tsx`;
- conteúdo cristão: `devocional.tsx`, `oracoes.tsx`, `quiz-biblico.tsx`, `noticias.index.tsx`;
- economia e expressão: `loja.tsx`, `caixas.tsx`, `conquistas.tsx`, `presentes/index.tsx`, `avatar.tsx`, `avatar.criar.tsx`;
- pets e jogos: `meu-pet.tsx`, `pet-arcade.tsx`;
- suporte: `suporte/index.tsx`, `suporte/$id.tsx`, `suporte/ajuda.tsx`;
- administração: `admin/index.tsx` e rotas de fotos, economia, pets, presentes, avatar, decorações, equipe e verificações;
- endpoints server: `api/verify-photo.ts`, `api/photo-repair.ts` e `api/public/hooks/push-dispatch.ts`.

`src/routes/comunidade.tsx` é apenas um redirect compatível para `/conversas/comunidade`; não existe ainda uma Comunidade social como núcleo. `src/components/mobile/MobileBottomNav.tsx` exibe Início, Devocional, Conversas, Pretendentes e Perfil, mantendo Namoro visível para todos. `public/manifest.webmanifest` também oferece atalho para Pretendentes. A metadata em `src/routes/__root.tsx` ainda posiciona o produto como namoro cristão.

Não foram encontrados modelos atuais equivalentes a membership comunitário independente, modo namoro explícito, conexões sociais, Status de 24 horas, Verbo integrado ou Sala de Cinema. Isso é ausência no HEAD/TIPOS, não autorização para escolher um schema novo sem snapshot.

### B.2 Monólitos e acoplamento

Arquivos de maior risco por tamanho e múltiplas responsabilidades:

| Arquivo | Linhas aproximadas | Responsabilidades misturadas |
|---|---:|---|
| `src/routes/admin/index.tsx` | 3.999 | usuários, moderação, conteúdo, operações e métricas |
| `src/routes/admin/pets.tsx` | 2.062 | catálogos, espécies, variantes, itens e operações |
| `src/routes/loja.tsx` | 1.764 | catálogo, compra, inventário, apresentação e economia |
| `src/routes/perfil.tsx` | 1.746 | perfil, preferências românticas, foto, badges, economia, pets e personalização |
| `src/routes/conversas/comunidade.tsx` | 1.528 | consulta, paginação, Realtime, moderação, edição e UI do chat global |
| `src/routes/onboarding/index.tsx` | 1.460 | fluxo de 13 etapas e gravação em múltiplas tabelas |
| `src/routes/devocional.tsx` | 1.460 | conteúdo, estado, interações e apresentação |
| `src/routes/meu-pet.tsx` | 1.369 | pet, cuidado, inventário, missões e UI |
| `src/routes/inicio.tsx` | 1.289 | agregação, queries diretas, cards de namoro, missões e conteúdo |
| `src/routes/recados.tsx` | 1.197 | elegibilidade, mensagens anônimas, dicas, revelação e UI |
| `src/routes/conversas/$matchId.tsx` | 1.077 | autorização, paginação, Realtime, leitura, envio otimista, edição e UI |
| `src/integrations/supabase/types.ts` | 7.067 | tipos gerados; não deve ser modularizado manualmente |

A desmontagem deve começar por testes de caracterização e fachadas de domínio, mantendo rotas como composição. Não cabe reescrita simultânea desses arquivos.

### B.3 Autenticação e autorização

- `src/integrations/supabase/client.ts` cria o cliente browser com sessão persistida em `localStorage`.
- `src/lib/auth.tsx` (`AuthProvider`) observa Auth, carrega `profiles` e `user_roles`, expõe papel e estado, e mantém canal Realtime para autoexclusão do perfil.
- `src/integrations/supabase/auth-middleware.ts` (`requireSupabaseAuth`) autentica server functions com token e cliente sujeito a RLS.
- `src/integrations/supabase/client.server.ts` cria `supabaseAdmin` com `SUPABASE_SERVICE_ROLE_KEY`, somente no bundle server.
- Rotas administrativas usam guards de interface, mas a autoridade final precisa continuar em RLS/RPC/policies; esconder UI não é controle de acesso.

Não foi encontrado `service_role` importado em frontend. O risco confirmado é o endpoint público que aciona um cliente admin no servidor.

### B.4 Supabase, schema e migrations

- `src/integrations/supabase/types.ts`: 140 tabelas, 3 views, 201 funções/RPCs, 26 enums e 91 relacionamentos tipados;
- `supabase/migrations/`: 196 arquivos;
- `supabase/config.toml`: somente `project_id`;
- `.env` está versionado. Os nomes encontrados são de URL/project/publishable keys; nenhum valor foi reproduzido neste plano. É necessário varrer o histórico por segredos e remover o rastreamento futuro sem invalidar configuração legítima.

O Supabase publicado não foi consultado nesta tarefa. O SQL de inventário somente leitura não foi executado. Grants, policies, publicações, triggers, buckets, contagens e checksums de produção permanecem **PENDENTES**.

### B.5 Conversas e Realtime

- `src/hooks/useConversationsList.ts` centraliza lista e possui registry de canais com referência, mas ainda consulta `messages` e acopla a lista ao match romântico;
- `src/routes/conversas/$matchId.tsx` usa `useInfiniteQuery`, cursor temporal, estado otimista e canal `chat-${matchId}` para INSERT/UPDATE/DELETE;
- leitura chama `mark_message_read` por mensagem;
- `src/routes/conversas/comunidade.tsx` mantém lista local, paginação e canal `global-chat`;
- `src/lib/useRealtimeNotifications.tsx`, `src/lib/notifications.tsx` e `src/lib/presence.tsx` adicionam subscriptions paralelas;
- a lista atual não distingue conversa social, romântica, grupo, evento, Verbo ou Cinema por contrato de domínio.

O histórico contém policy ampla de `realtime.messages`, seguida de allowlist mais estrita em `20260527125602...` e `20260607211557...`. Portanto, o achado amplo parece mitigado nas **MIGRATIONS**, mas só uma inspeção **PRODUÇÃO** pode confirmar policies finais e tópicos efetivos.

### B.6 Storage e fotos

Há uso legítimo de buckets para fotos, verificações, moderação, presentes, stickers, avatar-personagem, pets, expedições, suporte e equipe. Alguns fluxos usam signed URLs; outros usam `getPublicUrl`.

O histórico torna `profile-photos` privado em `20260528023644...`, mas volta a defini-lo como público e cria leitura pública em `20260604153000_profile_photos_public_delivery.sql`. O código de perfil e onboarding chama `getPublicUrl`. Estado final de produção: **PENDENTE**. Isso exige decisão de privacidade, inventário de URLs persistidas e migração expandida; não pode ser “corrigido” apagando ou tornando objetos inacessíveis abruptamente.

### B.7 PWA e offline

- `public/sw.js` implementa precache, fallback para `offline.html`, cache de estáticos, cache de imagens de pet e push/notification click;
- `src/lib/registerSW.ts` registra o service worker em produção;
- `useNetworkStatus`, `NetworkStatusBanner`, `OfflineState` e `StaleDataNotice` já oferecem estados offline em várias telas;
- o manifest inicia em `/inicio` e ainda contém descrição/atalhos centrados em namoro;
- não há outbox durável identificada para mensagens; “offline” hoje significa principalmente leitura em cache e bloqueio de mutações;
- o cache de imagens de pet normaliza URLs assinadas removendo token da chave. A utilidade é real, mas a separação entre sessões, expiração e limpeza em logout precisa de teste de privacidade.

### B.8 Testes e validação

Existem sete testes:

- `tests/chat-e2e.test.ts`;
- `tests/messages-rls.test.ts`;
- `tests/moderation-rls.test.ts`;
- `tests/pretendentes-eligibility.test.ts`;
- `tests/realtime-messages.test.ts`;
- `tests/starter-bundle.test.ts`;
- `tests/use-long-press.test.ts`.

Os testes Supabase criam e removem usuários/dados com `SUPABASE_SERVICE_ROLE_KEY`. Não foram executados nesta tarefa, porque o ambiente não tinha Bun/dependências e sua execução contra um projeto conectado alteraria dados, vedado pelo escopo. Também não foram executados build, lint ou typecheck. Faltam cobertura sistemática de UI, acessibilidade, PWA, migração, permissões por papel, economia, inventário, pets e regressão visual.

### B.9 Assets e mídia

`public/` e `src/assets/` contêm 240 arquivos e aproximadamente 41,46 MiB. Há imagens de arcade, caixas, splash, compromisso e avatar-personagem. Nenhum asset deve ser removido antes de mapa de uso, telemetria, quarentena e rollback. Vídeos da futura Sala de Cinema devem ficar em Storage/CDN, nunca no Git.

### B.10 Riscos ativos priorizados

| Prioridade | Evidência | Achado | Estado |
|---|---|---|---|
| P0 | HEAD | `src/routes/api/public/hooks/push-dispatch.ts` aceita GET/POST sem autenticação e processa `push_queue` com `supabaseAdmin` | confirmado |
| P0 até prova contrária | TIPOS + MIGRATIONS | `grant_coin_event` recebe usuário/quantia, é `SECURITY DEFINER` e teve grant a `authenticated`; a versão posterior limita quantia a 3, mas não vincula `_user` a `auth.uid()` | produção pendente |
| P0 até prova contrária | TIPOS + MIGRATIONS | `award_xp` permite `_amount` e `_daily_cap` controlados pelo chamador autenticado | produção pendente |
| P0 até prova contrária | TIPOS + MIGRATIONS | overloads de `track_achievement` aceitam usuário/categoria/incremento e concedem recompensas; há grant a `authenticated` | produção pendente |
| P0 até prova contrária | TIPOS + MIGRATIONS | `progress_mission_action` recebe `_user_id`, ação e incremento; não foi localizado hardening global de default privileges | produção pendente |
| P1 | TIPOS + MIGRATIONS | `create_notification` é helper genérico `SECURITY DEFINER` com grant a `authenticated`, sem validar ator, destinatário ou tipo | produção pendente |
| P1 | HEAD | `/api/verify-photo` não tem rate limit/timeout/magic-byte validation e retorna `soft: true` em indisponibilidade, limite, parse, erro e exceção | confirmado |
| P1 | HEAD | `verifyProfilePhoto`, `perfil.tsx` e `ProfilePhotosManager.tsx` tratam `soft` como sucesso e publicam sem revisão | confirmado |
| P1 | MIGRATIONS + HEAD | `profile-photos` é declarado público na migration mais recente e consumido por URL pública | produção pendente |
| P1 | HEAD | `.env` versionado e três lockfiles; necessário inventário de histórico, rotação se houver segredo e fonte única de dependências | confirmado |
| P1 | HEAD | dispatch de push não faz claim atômico/idempotente; execuções concorrentes podem duplicar envio | confirmado |
| P1 | HEAD | não foram encontrados headers de segurança/CSP no repositório; configuração externa de deploy é desconhecida | pendente |
| P2 | HEAD | `photo-repair` autentica e exige admin/super_admin, mas usa operações amplas de Storage sem rate limit no app | confirmado, menor |
| Mitigado no histórico | MIGRATIONS | policy Realtime originalmente ampla foi substituída por allowlists de tópicos/participantes | produção pendente |

---

## C. Matriz de rastreabilidade

| ID | Decisão | Documento-fonte | Código atual | Destino | Ação | Dados protegidos | Dependências | Risco | Fase | Testes |
|---|---|---|---|---|---|---|---|---|---|---|
| PROD-01 | Comunidade é o núcleo; namoro é opcional | Prompt, Item 1, Item 5, Item 8 | metadata, nav e manifest são dating-first | produto social cristão | alterar posicionamento sob flag após separação de estado | usuários, links, sessões | capacidades e navegação | alto | 2–4 | navegação por estado |
| AUTH-01 | preservar Auth e RLS | Prompt, Itens 2, 3, 7 | `AuthProvider`, middleware, Supabase Auth | identidade única, autorização server/RLS | manter Auth; introduzir capabilities por domínio | contas, papéis, sessões | snapshot produção | crítico | 0–2 | Auth/RLS por papel |
| ONB-01 | onboarding comunitário; namoro opt-in | Prompt, Item 1, Item 5, Item 8 | `onboarding/index.tsx`, 13 etapas dating-first | mínimo comunitário + ativação explícita | caracterizar, reduzir e bifurcar sem apagar respostas | perfis/preferências | estado de membership | alto | 3 | retomada, idempotência, opt-in |
| HOME-01 | reconstruir Início social | Prompt, Item 8 | `inicio.tsx`, cards diretos e namoro | feed/novidades/conexões/destaques | criar agregador social e rollout progressivo | conteúdo, privacidade | comunidade/status | alto | 5 | feed, vazio, offline, perf |
| STATUS-01 | Status dura 24 h | Prompt, Itens 1 e 8 | inexistente | status efêmero moderável | especificar privacy/expiry/viewers; schema aditivo | mídia, viewers, denúncias | Storage/moderação | alto | 5 | expiração, visibilidade, RLS |
| COM-01 | Comunidade reconstruída do zero | Prompt, Itens 1, 4, 5, 8 | `/comunidade` redireciona ao chat global | presença, conexões, grupos, eventos, descoberta | implementar fatias verticais sob flag | perfis, bloqueios, conteúdo | decisões sociais e Sites | alto | 4–5 | RLS, bloqueio, moderação |
| NAV-01 | namoro invisível quando desligado | Prompt, Item 5 | `MobileBottomNav` e manifest expõem Pretendentes | nav por capability | filtrar rotas, atalhos, notificações e deep links | preferências | membership namoro | alto | 3 | matriz de navegação |
| DAT-01 | namoro desligado por padrão | Prompt, Item 5 | sem estado explícito | membership romântico independente | adicionar estado, termos e transições idempotentes | matches, interesses, prefs | snapshot e migration expand | crítico | 3 | transições/RLS |
| DAT-02 | remover experiência antiga Pretendentes | Prompt, Item 1 | `pretendentes/*` ativo | descoberta dentro de Namoro | construir paridade, redirecionar sob flag, depois retirar UI | matches, interesses, histórico | DAT-01 | alto | 7 | paridade/deep links |
| DAT-03 | não alterar regras românticas silenciosamente | Prompt, Item 5 | `pretendentesEligibility.ts` e RLS | regra versionada e auditável | testes de caracterização antes da mudança | elegibilidade, bloqueios | decisão do usuário | crítico | 2–7 | tabela de decisão |
| CHAT-01 | reconstruir conversas | Prompt, Item 8 | rotas de chat grandes; match como chave | inbox multi-contexto e chat fluido | facade, cursor estável, outbox, Realtime único | mensagens, leitura, anexos | snapshot, Sites/Vitra | crítico | 4 | paginação, reconnect, RLS |
| CHAT-02 | não usar mocks em produção | Prompt | queries reais Supabase | adapters reais, fixtures só em teste | manter backend durante strangler | mensagens | observabilidade | alto | 4 | integração real isolada |
| ANON-01 | recados apenas no namoro | Prompt, Itens 1 e 5 | `recados.tsx`, `anonymous_messages` | capability + opt-in “Receber recados?” | adicionar preferência e gates server/RLS | recados, dicas, revelações | DAT-01 | crítico | 7 | elegibilidade/RLS |
| PURPOSE-01 | Propósito pausa só romance | Prompt, Itens 1 e 5 | hoje esvazia interesses, matches, conversas e recados | pausa romântica sem afetar social | separar contextos e impedir auto-reativação | compromisso, chats, matches | CHAT/DAT | crítico | 7 | início/fim e invariantes |
| PROF-01 | perfil expressivo e modular | Prompt, Itens 1 e 8 | `perfil.tsx`, `CustomizacaoTab`, `DecoratedAvatar` | capa, módulos, vitrines e ordem | projection/composer; configuração contextual | fotos, itens, presentes | inventário e Sites | alto | 6 | reorder, a11y, responsive |
| PHOTO-01 | proteger foto e avatar legítimo | Prompt, Item 7 | `photo_url`, galeria, AI, moderação | foto preservada e moderada | corrigir fail-open e privacidade sem perda | fotos e fila | segurança/Storage | crítico | 0–1 | upload, quarentena, RLS |
| SHOP-01 | loja fornece itens; perfil equipa | Prompt, Itens 1 e 4 | `loja.tsx` mistura catálogo/UI/inventário | catálogo/economia separados de apresentação | extrair queries/commands idempotentes | compras, itens, saldo | RPC hardening | crítico | 8 | concorrência/reconciliação |
| ECO-01 | preservar moedas e transações | Prompt, Itens 2 e 7 | `user_coins`, logs e RPCs sensíveis | ledger íntegro, server-authoritative | conter grants; reconciliar saldo×ledger | saldo/histórico | snapshot produção | crítico | 0, 8 | fraude, idempotência |
| XP-01 | preservar XP e conquistas | Prompt, Itens 2 e 7 | RPCs client-controláveis | eventos validados por comandos | retirar quantia/alvo do cliente | XP, níveis, missões | snapshot produção | crítico | 0, 8 | caps/replay/reconciliação |
| INV-01 | preservar inventários/presentes | Prompt, Item 7 | múltiplas tabelas e rotas | propriedade única por domínio | inventário canônico sem consolidação precoce | itens, gifts | economia/perfil | crítico | 8 | propriedade/quantidade |
| PET-01 | redesenhar, não consolidar pets | Prompt, Itens 1 e 7 | `user_pets` e `user_pets_v2`, `meu-pet` | UI modular com dados preservados | adapters explícitos; manter ambos | pets, cuidado, expedição | lista de jogos | crítico | 8 | progressão/paridade |
| GAME-01 | não remover jogos até lista | Prompt | `pet-arcade` e assets ativos | catálogo controlado por flag futuramente | nenhuma remoção agora | partidas, recompensas, assets | decisão usuário | alto | 8/10 | saves/recompensas |
| AVATAR-01 | retirar só personagem | Prompt, Item 7 | `avatar*`, buckets/itens/looks | desativação lógica, quarentena, compensação | inventário, telemetria, flag, aviso, depois contrato | foto, decorações, compras | snapshot e política compensação | crítico | 10 | inventário/rollback |
| ADMIN-01 | redesenhar Admin por domínios | Prompt, Itens 1, 4, 8 | `admin/index.tsx` monolítico | rotas/capabilities por domínio | extrair UI mantendo regras | papéis, auditoria | AUTH-01 | alto | 9 | matriz de papel |
| MOD-01 | preservar/fortalecer moderação | Prompt, Item 2 | fotos, mensagens, flags, IA | filas comuns e políticas por conteúdo | rate limits, fail-safe, auditoria | denúncias, evidências | segurança | crítico | 0, 9 | abuso/falha de provedor |
| PWA-01 | preservar PWA/offline | Prompt, Item 8 | SW/manifest/offline existentes | cache seguro + outbox compatível | versionar cache, limpar sessão, testar outbox | caches/rascunhos | CHAT-01 | alto | 4 | install/offline/update |
| PUSH-01 | conter endpoint público | Item 2 + HEAD | GET/POST anônimos com admin client | POST autenticado por segredo e operação segura | PR-001 imediato; claim atômico posterior | queue/subscriptions | segredo de scheduler | crítico | 0 | 401/405/no side effect |
| NOTIF-01 | notificações por comando de domínio | Item 2, Item 4 | helper genérico exposto | emissão server-authoritative | revogar chamada genérica; commands estreitos | notificações | snapshot/grants | crítico | 0–2 | alvo/ator/tipo |
| CONTENT-01 | preservar conteúdo cristão atual | Prompt, Item 1 | devocional, oração, quiz, notícias | módulos comunitários integráveis | manter dados e extrair domínio gradualmente | conteúdo/progresso | HOME/COM | médio | 5/9 | publicação/progresso |
| VERBO-01 | criar futuramente, não no PR 1 | Prompt, Item 1 | inexistente | subproduto com mesmo login e fronteira própria | discovery técnico em fase própria | dados de estudo | referência Sites/escopo | alto | 11 | SSO/RLS/isolamento |
| CINEMA-01 | criar futuramente, não no PR 1 | Prompt, Item 1 | inexistente | watch party com upload/CDN/sync/chat | discovery, spike e rollout próprios | mídia, direitos, chat | referência/legal/CDN | crítico | 12 | sync/permissão/carga |
| SUPPORT-01 | preservar suporte | Itens 1 e 4 | rotas e anexos assinados | domínio isolado com papéis | manter contratos e testar bloqueio global | tickets/anexos | AUTH/Storage | alto | 9 | RLS por papel |
| MIG-01 | mudanças aditivas e reversíveis | Itens 3 e 7 | histórico complexo | expand/compare/switch/stabilize/contract | snapshot + backfill idempotente + métricas | todos os domínios | acesso produção | crítico | todas | dry-run/reconciliação |

---

## D. Contradições e lacunas

| ID | Fontes envolvidas | Interpretação recomendada | Impacto | Decisão do usuário? | Bloqueia PR-001? |
|---|---|---|---|---|---|
| D-01 | Guia vs pasta real | registrar `VDN_ITEM_1_MANUAL_SISTEMA_ATUAL.md` como ausente; usar HEAD como verdade atual | reduz contexto histórico | confirmar se o manual existe fora do repo | não |
| D-02 | Item 5 vs Item 8 | Item 5 propõe Início/Comunidade/Conversas/Descobrir/Perfil; Item 8 propõe Início/Comunidade/Criar/Conversas/Eu e fixação opcional do Namoro. Não fixar nav sem decisão/protótipo | arquitetura de navegação | sim | não |
| D-03 | Prompt/Item 8 vs referências ausentes | direção está definida, fidelidade visual não | bloqueia aceite visual | fornecer materiais Sites/Vitra | não |
| D-04 | “Namoro desativado por padrão” vs usuários históricos sem membership | preservar histórico; não inferir desligamento/ligamento em massa | risco de ocultar ou expor namoro | definir regra de migração/consentimento de legado | não; bloqueia PR de membership |
| D-05 | Pausar Namoro vs matches existentes | manter dados; falta decidir se chats/matches românticos ficam ativos ou somente leitura durante pausa | comportamento e notificações | sim | não |
| D-06 | Propósito Firmado vs chat atual acoplado a match | hoje pausar conversas equivale a pausar todo o inbox; no destino somente romance pausa | exige `conversation_context` antes do ajuste | interpretação funcional já fechada; detalhes de chat, sim | não |
| D-07 | Follow vs conexão bilateral nos documentos | modelar capacidades sem escolher ambos automaticamente | schema/RLS | sim: MVP social | não |
| D-08 | Privacidade comunitária e Status | requisitos exigem privacidade, mas defaults/audiências não estão fechados | exposição de conteúdo | sim | não |
| D-09 | Recados anônimos | permanência está fechada; default de “Receber recados?” e elegibilidade detalhada precisam confirmação/documento | consentimento e RLS | sim | não |
| D-10 | Elegibilidade romântica existente | `pretendentesEligibility.ts` contém regra por sexo; prompt proíbe mudança silenciosa | impacto direto em pessoas | sim antes de alterar | não |
| D-11 | Comprometido na comunidade | participação normal está fechada; visibilidade pública de badge/estado não | privacidade | sim | não |
| D-12 | Perfil Steam-like vs identidade própria | liberdade modular é obrigatória; número inicial de vitrines e tokens visuais não | escopo e performance | sim + Sites | não |
| D-13 | Jogos futuros | lista de remoção ainda não fornecida | impede retirada de rotas/tabelas/assets | sim | não |
| D-14 | Avatar-personagem | retirada está fechada; compensação, janela de quarentena e destino de compras não | economia e confiança | sim | não |
| D-15 | Verbo | produto futuro fechado, profundidade/SSO/modelo ausentes | não estimável para implementação | sim + referência | não |
| D-16 | Cinema | produto futuro fechado; direitos, limites de upload, retenção, CDN e moderação ausentes | custo/legal/segurança | sim | não |
| D-17 | Migrations vs produção | tipos e migrations não provam grants/policies/buckets aplicados | não aplicar hardening às cegas | requer acesso read-only e backup | não para contenção HTTP; sim para SQL |
| D-18 | `profile-photos` privado vs público no histórico | migration mais recente declara público; confirmar produção e definir política de privacidade antes de alternar | URLs quebradas ou exposição | sim | não |
| D-19 | Bun vs três lockfiles | CI torna Bun a referência de fato; formalizar lockfile canônico | builds não reproduzíveis | decisão técnica do mantenedor | não |
| D-20 | Testes integrados vs banco real | testes existentes mutam Supabase; precisam projeto isolado e dados descartáveis | risco operacional | fornecer ambiente de teste | não |

Nenhuma dessas lacunas justifica decisão silenciosa. D-02, D-03, D-04, D-05, D-07 a D-16 e D-18 bloqueiam os PRs funcionais correspondentes. O PR-001 de contenção HTTP permanece executável.

---

## E. Arquitetura-alvo

### E.1 Forma: monólito modular

Continuar em um único deploy React/TanStack Start + Supabase. Cada domínio terá UI, application services, queries, commands, events e adapters próprios. Rotas apenas compõem casos de uso. Não criar microserviços enquanto não houver necessidade operacional mensurada.

### E.2 Propriedade dos dados e fronteiras

| Domínio | Propriedade | Pode publicar | Não pode fazer diretamente |
|---|---|---|---|
| `identity-access` | sessão, papéis, capabilities, termos | `SessionChanged`, `CapabilityChanged` | conceder papel por UI |
| `profiles` | identidade pública, foto, módulos e privacidade | `ProfileUpdated`, `ProfileModuleEquipped` | alterar saldo/inventário |
| `community` | membership, conexões, grupos, eventos, presença | `CommunityJoined`, `ConnectionChanged` | ler disponibilidade romântica para filtrar comunidade |
| `feed-status` | posts, Status, audiência, views e denúncias | `PostPublished`, `StatusExpired` | burlar moderação/blocks |
| `dating` | opt-in, preferências, descoberta, interesses e matches | `DatingActivated`, `MatchCreated`, `DatingPaused` | afetar membership comunitário |
| `conversations` | threads, participantes, mensagens, recibos, drafts e anexos | `MessageSent`, `MessageRead` | decidir elegibilidade de namoro |
| `purpose` | compromisso e transições | `PurposeStarted`, `PurposeEnded` | apagar match/chat ou reativar namoro |
| `anonymous-notes` | recados, dicas, respostas e revelações | `AnonymousNoteSent` | operar fora da capability de namoro |
| `economy` | wallet, ledger, regras e compras | `BalanceChanged`, `PurchaseCommitted` | aceitar quantia/recompensa arbitrária do cliente |
| `inventory-gifts` | propriedade, quantidade, equipabilidade e presentes | `ItemGranted`, `GiftDelivered` | definir layout do perfil |
| `pets-games` | pets, progressão, cuidado, partidas e recompensas | `PetProgressed`, `GameRewardValidated` | consolidar `user_pets*` sem reconciliação |
| `content-faith` | devocionais, orações, quiz, notícias | `ContentPublished`, `StudyProgressed` | misturar modelo futuro do Verbo |
| `notifications` | preferências, templates, delivery e push queue | `NotificationDelivered` | expor helper genérico ao cliente |
| `moderation-safety` | denúncias, filas, evidências, bloqueios e decisões | `ContentQuarantined`, `ModerationDecided` | liberar conteúdo em falha sem política explícita |
| `support` | tickets, mensagens e anexos | `TicketUpdated` | ampliar acesso por papel de UI |
| `admin` | composição operacional por capability | eventos de auditoria | possuir dados dos demais domínios |
| `verbo` | futuro estudo bíblico | eventos de progresso contratados | compartilhar tabelas internas prematuramente |
| `cinema` | futuro catálogo, sessão, sync, participantes e chat | `WatchPartyStateChanged` | armazenar vídeos no Git |

### E.3 Camadas concretas

- **Queries**: funções somente leitura, tipadas, com chave de cache e paginação explícita; exemplos `listConversationThreads`, `getCommunityFeed`, `getDatingEligibility`.
- **Commands**: operações server-authoritative e idempotentes; exemplos `sendMessage`, `activateDating`, `purchaseItem`, `claimValidatedReward`.
- **Events internos**: contratos TypeScript locais e, quando necessário, outbox/transação no Supabase; não adotar event bus genérico antes de um consumidor real.
- **Services**: coordenam regras de um domínio; não retornam componentes nem importam rotas.
- **Adapters**: encapsulam Supabase/Storage/Realtime e permitem testes; não escondem RLS nem usam `service_role` no browser.
- **UI**: componentes por domínio; loading, vazio, erro e offline obrigatórios.

Dependências permitidas:

1. UI → application/query/command do próprio domínio;
2. domínio → contratos públicos de outro domínio;
3. adapters → Supabase e infraestrutura;
4. admin → contracts/capabilities dos domínios;
5. nenhum domínio → arquivos de rota de outro domínio;
6. `dating` pode consultar bloqueios e perfil público, mas `community` não consulta disponibilidade romântica para descoberta;
7. economia e recompensas só aceitam eventos validados no servidor.

### E.4 Estrutura futura de pastas

```text
src/
  domains/
    identity-access/
    profiles/
    community/
    feed-status/
    dating/
    conversations/
    purpose/
    anonymous-notes/
    economy/
    inventory-gifts/
    pets-games/
    content-faith/
    notifications/
    moderation-safety/
    support/
    admin/
    verbo/
    cinema/
  infrastructure/
    supabase/
    realtime/
    storage/
    pwa/
    telemetry/
  shared/
    ui/
    validation/
    types/
  routes/
```

A estrutura é destino incremental. Não mover arquivos em massa. Cada PR extrai uma fatia usada e mantém facade/redirect até paridade.

### E.5 Modelo de conversa alvo

Uma thread precisa declarar contexto (`social_direct`, `dating_match`, `group`, `event`, futuramente `verbo` ou `cinema`) e participantes autorizados. O ID do match não pode continuar sendo o identificador universal. A migração deve ser aditiva, mantendo mensagens antigas referenciáveis, com:

- cursor composto estável (`created_at`, `id`);
- envio otimista com `client_message_id` idempotente;
- estados local/enviando/enviado/entregue/lido/falhou;
- subscription única por thread e reconciliação após reconnect;
- outbox offline somente após política de conflito e segurança;
- anexos em Storage privado com metadados e scan/moderação;
- virtualização baseada em medição real;
- input de pelo menos 16 px no mobile;
- rascunhos por usuário/thread, sem expor conteúdo entre sessões.

---

## F. Fases de implementação

Cada PR deve ser pequeno, revisável, reversível e ter owner. “Migration: não” significa que nenhum SQL será incluído naquele PR.

### Fase 0 — segurança crítica

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-001 | autenticar e limitar o dispatch HTTP de push | `api/public/hooks/push-dispatch.ts`; helper server e teste novos | queue/subscriptions só após auth; migration não | kill switch server, default seguro | 401, 405, segredo inválido/válido, zero acesso DB sem auth | contadores auth_fail/run/result sem PII | manter endpoint desabilitado; não reabrir público | GET não processa; POST anônimo não toca dados; erros genéricos | segredo de scheduler; risco baixo e urgente |
| PR-002 | confirmar produção e conter RPCs de moedas/XP/conquistas/missões/notificação | nova migration estreita + testes SQL, somente após snapshot | grants/functions; migration sim, aditiva/revogação | rollout por função | ACL anon/auth/service; replay; auth.uid; valores-limite | rejeições e divergência de ledger | grant temporário somente para wrapper seguro; script reverso testado | cliente não escolhe alvo/quantia; fluxos legítimos passam | snapshot+backup; risco crítico |
| PR-003 | rate limit e fail-safe para moderação de foto | `api/verify-photo.ts`, `verifyPhoto.ts`, chamadas e testes | fila/evidência; idealmente sem migration inicial | modo `quarantine_on_provider_failure` | provider down, timeout, tamanho, MIME real, retry | latência, rate-limit, soft failures, fila | desativar autoaprovação, preservar fila | falha nunca publica “unflagged”; UX orienta retry/revisão | capacidade da fila; risco alto |
| PR-004 | baseline de RLS/Storage/Realtime/headers/segredos | scripts/tests de auditoria e configuração documentada | somente leitura primeiro; migrations separadas por achado | não | snapshot canônico e testes por papel | diff de grants/policies | cada hardening isolado | inventário de produção assinado e sem segredo versionado | acesso read-only/deploy; risco alto |

### Fase 1 — observabilidade e bases arquiteturais

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-005 | feature flags, correlation IDs e métricas de paridade | `src/infrastructure/telemetry`, contracts de flags, root | sem dados de usuário; migration não inicialmente | base | unit/build | adoção, erros, latência sem conteúdo sensível | flags default legacy | nenhuma mudança funcional com flags off | PR-001; risco baixo |
| PR-006 | facade de capabilities/Auth por domínio | `identity-access`, `auth.tsx`, guards | leitura de papéis/estado; migration não | `capabilities_v2` | matriz user/staff/admin/banned/offline | denied/allowed agregados | voltar ao guard legado | UI e server usam mesmo contrato; RLS segue autoridade | snapshot; risco médio |

### Fase 2 — separação Comunidade/Namoro

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-007 | introduzir memberships independentes | domínio `community`/`dating`, tipos e migration | estado aditivo + backfill idempotente; nunca apagar prefs | `membership_v2_read`, depois write | backfill, dupla leitura, matriz de transição, RLS | contagem/paridade e estados inválidos | ler legado; parar dual-write | novos usuários namoro off; legado reconciliado sem perda | decisão D-04 + snapshot; crítico |
| PR-008 | gate de rotas/nav/deep links/notificações | `MobileBottomNav`, manifest, rotas e notification resolver | não | `navigation_v2` | usuário off/on/paused/committed/staff | acessos bloqueados e fallback | flag para nav antiga | zero referência romântica quando off | PR-007 + D-02; alto |
| PR-009 | onboarding comunitário com opt-in | `onboarding/*`, domínio profiles/dating | preserva tabelas; eventual coluna aditiva | `onboarding_v2` por coorte | retomada, dupla submissão, abandono, opt-in | funil por etapa sem respostas sensíveis | nova coorte volta ao fluxo antigo | somente perguntas usadas; namoro nunca automático | PR-007 e decisões de perguntas; alto |

### Fase 3 — conversas

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-010 | caracterização e facade de chat legado | `conversations/queries`, `commands`, adapters; rotas sem alteração visual | não | `chat_facade_v1` | ordem, paginação, leitura, auth, subscriptions | query count, canais ativos, p95 | facade delega ao legado | resultados iguais e sem subscription duplicada | PR-005; médio |
| PR-011 | novo inbox e thread progressivos | domínio conversations e rotas novas/compatíveis | schema aditivo para threads/client IDs/read receipts, se validado | por coorte e por contexto | integração/RLS/Realtime/offline/a11y/perf | send success, reconnect, duplicates, p95 | route flag para legado; dual-read | paridade, cursor estável, envio idempotente | Sites/Vitra + snapshot; crítico |

### Fase 4 — Comunidade, Início, Status e perfil

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-012 | comunidade MVP em uma fatia vertical | domínio community, `/comunidade` | membership/conexão/grupo conforme decisão; aditivo | `community_v1` | RLS, blocks, moderation, empty/offline | criação/erro/abuso | redirect legado | comunidade funciona sem namoro e respeita bloqueios | D-07/D-08/Sites; alto |
| PR-013 | Status 24 h e feed social | `feed-status`, Storage, moderação, `/inicio` | posts/status/views; aditivo + TTL job | `status_v1`, `home_v2` | expiração, audiência, denúncia, upload | publicação/view/expiração | ocultar composer/feed novo; preservar dados | conteúdo some da distribuição no prazo e mantém auditoria | PR-012, D-08; crítico |
| PR-014 | perfil modular e configurador contextual | `profiles`, `perfil.tsx`, customização/presentes/pets | projeções/ordem aditivas | `profile_v2` | reorder, ownership, a11y, responsive, offline | save/error/render p95 | perfil legado | itens equipados e fotos preservados; configuração simples | Sites + inventário; alto |

### Fase 5 — Namoro opcional e legado romântico

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-015 | descoberta romântica nova e retirada lógica de Pretendentes | domínio dating, rotas dating, redirects de `pretendentes/*` | reutiliza histórico; eventual índice não destrutivo | `dating_discovery_v2` | elegibilidade, block, committed, deep links, paridade | funil e divergência | flag volta à UI antiga | somente opt-in vê; históricos intactos; paridade comprovada | PR-007/011 + regras decididas; crítico |
| PR-016 | recados e Propósito escopados ao romance | `anonymous-notes`, `purpose`, `recados.tsx`, `proposito/*` | preferência aditiva e contexto de conversa | flags próprias | RLS/elegibilidade/pausa/fim/não-reativação | recusas e transições | volta UI, mantém novos campos | comunidade/chats sociais nunca pausam; dados antigos preservados | D-05/D-09 + PR-011/015; crítico |

### Fase 6 — economia, pets, jogos e administração

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-017 | extrair loja/economia/inventário sem redesign simultâneo | `economy`, `inventory-gifts`, `loja.tsx` | sem consolidação; índices/wrappers só após snapshot | `economy_facade_v1` | concorrência, idempotência, ledger, gifts | divergência wallet/ledger | facade legacy | saldo/ownership sem diferença semântica | PR-002/005; crítico |
| PR-018 | redesenho gradual de pets/jogos | `pets-games`, `meu-pet`, `pet-arcade` | manter `user_pets` e `user_pets_v2` | por módulo/jogo | progressão, reward, saves, assets | paridade de recompensa | UI antiga por flag | nenhum jogo/dado/asset removido | lista de jogos; alto |
| PR-019 | Admin por rotas e capabilities | `admin/*`, domínio admin | nenhuma regra reescrita no primeiro corte | `admin_v2` por módulo | papel/permissão/auditoria/offline | ações negadas/erros | rota antiga por módulo | mesma capacidade, menor acoplamento | PR-006 e domínios; alto |

### Fase 7 — novos produtos

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-020+ | Verbo em fase própria | `domains/verbo`, rotas e contrato de identity | modelo próprio aditivo | `verbo` | login, isolamento, progresso, a11y/offline | uso/erro sem conteúdo pessoal | ocultar entrypoint | subproduto integrado sem contaminar domínios | escopo+Sites; alto |
| PR-021+ | Cinema: discovery, spike e MVP separados | `domains/cinema`, Storage/CDN, Realtime | sessões/participantes/catálogo aditivos | `cinema` | sync, host, permissão, moderação, carga/mobile | drift, buffering, abuso, custo | encerrar novas sessões; preservar catálogo | vídeo fora do Git, controles e moderação funcionais | legal/CDN/Sites; crítico |

### Fase 8 — retirada controlada e contração

| PR | Objetivo | Arquivos prováveis | Dados/migration | Flag | Testes | Telemetria | Rollback | Aceite | Dependências / risco |
|---|---|---|---|---|---|---|---|---|---|
| PR-022 | desativação lógica do avatar-personagem | rotas/avatar, catálogo/admin | sem delete; snapshot e relatório de owners | `avatar_character_enabled` | foto vs personagem, inventário, deep link | uso, ownership, impacto | reativar flag | foto/decorated avatar intactos; personagem inacessível só após aviso | compensação decidida; crítico |
| PR-023 | quarentena/compensação | economia/inventory/admin | grants idempotentes e auditados | lote controlado | dry-run, replay, total financeiro | progresso/lote/divergência | interromper lote; compensações já legítimas não revertidas cegamente | 100% owners reconciliados | PR-022 + backup; crítico |
| PR-024+ | contração física de legado | migrations e remoções cirúrgicas | destrutiva somente após janela e backup testado | n/a | restore, FK, semantic checksum | nenhum leitor/escritor legado | restore/forward fix ensaiado | zero uso, paridade sustentada, autorização explícita | último estágio; crítico |

---

## G. Primeiro PR recomendado

### PR-001 — conter o endpoint público de dispatch de push

**Objetivo:** impedir que qualquer visitante acione processamento administrativo de `push_queue`, sem redesenhar notificações e sem migration.

#### Escopo exato

1. Remover o comportamento de processamento por `GET`; responder `405 Method Not Allowed` com `Allow: POST`.
2. Exigir em `POST` um segredo dedicado do scheduler, obtido somente do ambiente server, com comparação constante e recusa por padrão quando ausente.
3. Validar autenticação **antes** de importar/usar `supabaseAdmin`, consultar `push_queue` ou enviar push.
4. Retornar `401`/`503` genéricos, sem revelar mensagens do banco, endpoints, stack ou configuração.
5. Adicionar kill switch server-side com default seguro para incidente/rollout.
6. Registrar apenas request ID, resultado agregado, duração e motivo categórico; nunca token, endpoint push, corpo da mensagem ou usuário.
7. Adicionar testes determinísticos com `processBatch` injetável/mockado, provando ausência de side effect quando não autorizado.

O segredo deve ser diferente de `SUPABASE_SERVICE_ROLE_KEY`, VAPID e chaves públicas. A rotação/configuração no scheduler/deploy é ação operacional separada e deve ocorrer antes da ativação.

#### O que não será tocado

- migrations, policies, grants, schema ou Supabase publicado;
- formato de `push_queue` e `push_subscriptions`;
- inscrição/desinscrição em `src/lib/push.functions.ts`;
- service worker, UI de notificações ou payloads;
- algoritmo de envio, retries, TTL e remoção de subscription;
- redesign, rotas de produto, Auth, economia, fotos ou dados existentes;
- claim atômico da fila, que requer projeto e validação próprios.

#### Arquivos candidatos

- `src/routes/api/public/hooks/push-dispatch.ts`;
- novo helper server específico, por exemplo `src/lib/pushDispatchAuth.server.ts`, se necessário para isolamento/teste;
- novo `tests/push-dispatch-auth.test.ts`;
- documentação de variáveis apenas com nome/sem valor, se já houver local apropriado. Não versionar segredo.

`src/lib/pushDispatch.server.ts` só deve mudar se for indispensável para injeção testável, sem alterar seu comportamento.

#### Validações

- `GET`, `HEAD` e métodos não suportados jamais chamam o processador;
- `POST` sem header, com esquema errado, token vazio ou token inválido jamais chama o processador;
- ausência de variável server mantém endpoint fechado;
- token válido chama uma vez e retorna somente agregados;
- erro interno não vaza mensagem bruta;
- segredo não aparece no bundle browser, logs, snapshots ou git diff;
- busca estática não encontra `SUPABASE_SERVICE_ROLE_KEY` em código browser;
- teste manual usa fila isolada/fixture, nunca a produção.

#### Comandos de teste propostos

Executar em ambiente com Bun e dependências reproduzíveis:

```bash
bun install --frozen-lockfile
bun run lint
bunx tsc --noEmit
bun run test -- tests/push-dispatch-auth.test.ts
bun run build
```

O suite completo Supabase deve rodar somente no projeto isolado de teste:

```bash
bun run test
```

#### Telemetria mínima

- `push_dispatch_auth_failed_total{reason}`;
- `push_dispatch_disabled_total`;
- `push_dispatch_runs_total{result}`;
- `push_dispatch_duration_ms`;
- `push_dispatch_processed_total` e `push_dispatch_failed_total`.

Não usar `user_id`, endpoint ou texto como label.

#### Riscos

- scheduler atual pode depender de GET ou não suportar header secreto;
- ativar código antes de configurar o segredo interrompe dispatch;
- comparação/uso de API Node incompatível com runtime Cloudflare;
- proxies podem remover header customizado;
- o endpoint continuará sem claim atômico, logo concorrência permanece P1 depois da contenção.

Mitigação: validar contrato do scheduler, usar primitives compatíveis com o runtime, deploy em duas etapas (segredo disponível → código exigindo segredo), monitorar fila e manter kill switch.

#### Rollback

Rollback não pode reabrir o endpoint anonimamente. Se a integração falhar:

1. desabilitar o endpoint pelo kill switch;
2. manter `GET` sem processamento;
3. corrigir header/configuração;
4. reativar somente após teste autenticado.

Reverter para o código público anterior não é rollback aceitável.

#### Definição de pronto

- todos os testes acima passam;
- revisão confirma que requests não autorizados têm zero acesso a banco/push;
- segredo configurado no ambiente e scheduler sem exposição;
- deploy monitorado sem crescimento inesperado da fila;
- nenhuma migration, dado ou policy alterado;
- achado P0 “endpoint público com `service_role`” encerrado;
- risco de claim/idempotência registrado para PR separado.

---

## H. Estratégia de testes

### H.1 Pirâmide e ambientes

1. **Unitários:** regras puras de capability, transição, elegibilidade, ordenação, cursor, cálculo e validação.
2. **Integração local:** adapters Supabase contra projeto descartável, fixtures determinísticas e clock controlado.
3. **Contrato/RLS:** anon, authenticated owner, outro usuário, staff por papel, admin e service role apenas no harness server.
4. **E2E:** jornadas por coorte/flag, mobile primeiro e desktop.
5. **Canário em produção:** somente leitura ou contas sintéticas autorizadas; nunca testes destrutivos sobre usuários reais.

### H.2 Cobertura obrigatória

| Área | Casos mínimos |
|---|---|
| Unitários | state machines de namoro/Propósito, recados, paginação, rewards, privacy e cache keys |
| Integração | Auth→profile, match→thread, compra→ledger→inventário, pet→reward, upload→moderação |
| RLS | SELECT/INSERT/UPDATE/DELETE/RPC por papel, owner e bloqueio; grants explícitos e default privileges |
| Realtime | tópico autorizado/não autorizado, reconnect, duplicate INSERT, out-of-order, unsubscribe e vazamento entre threads |
| Navegação | namoro off/on/paused/committed, usuário banido/pending/staff, deep links antigos e push links |
| PWA | install/update, cache version, logout/session switch, offline fallback, push click e limpeza |
| Offline | leitura stale, rascunho, outbox/retry idempotente, conflito e ação proibida offline |
| Responsividade | 320, 360, 390, 768, 1024 e desktop amplo; teclado móvel e safe areas |
| Acessibilidade | navegação por teclado, foco em drawer/modal, labels, contraste, screen reader, reduced motion e input ≥16 px |
| Performance | budgets de bundle, queries por tela, canais ativos, p75/p95 de lista/envio, memória e virtualização |
| Visual | snapshots dos estados loading/vazio/erro/offline/normal em mobile/desktop, comparados à referência fornecida |
| Migração | dry-run, backfill em lotes, reexecução, interrupção/retomada, dupla leitura/escrita e restore |
| Reconciliação | checksums semânticos, FKs, ownership, ordem, estados e ledger; não apenas row count |
| Permissões | user, moderator roles existentes, admin, super_admin, suporte, anon e service role |
| Segurança | rate limit, replay, IDOR, target/amount tampering, MIME spoof, oversized payload, failover e segredo ausente |

### H.3 Gates por PR

- lint, typecheck, unitários e build;
- testes focados da área alterada;
- testes de caracterização do legado tocado;
- nenhum decréscimo silencioso de cobertura em invariantes;
- migration somente com `up`, verificação, estratégia forward-fix/rollback e evidência de backup;
- feature flag default legacy/off quando houver mudança funcional;
- telemetria e alerta definidos antes do canário;
- acessibilidade e estados de falha fazem parte do aceite, não de fase posterior.

### H.4 Métricas iniciais propostas

Os valores exatos devem ser medidos no baseline antes de virar SLO. Como gates técnicos iniciais:

- zero subscription duplicada para a mesma finalidade/instância;
- zero mensagem duplicada por retry com mesmo `client_message_id`;
- ordenação total determinística por `created_at,id`;
- zero acesso cruzado em testes RLS;
- zero divergência monetária não explicada;
- zero conteúdo liberado sem política quando moderador externo falha;
- nenhuma regressão WCAG automatizada conhecida nas superfícies tocadas;
- budgets de performance definidos a partir do p75 atual e melhorados por coorte, sem números inventados.

---

## I. Critérios globais de preservação

Antes e depois de cada etapa com dados, gerar manifest de reconciliação sem PII em logs. Igualdade de número de linhas é necessária em alguns casos, mas nunca suficiente.

| Invariante | Validação mensurável |
|---|---|
| Usuários/Auth | conjunto de `auth.users.id` preservado; providers, estado de conta e vínculos 1:1 coerentes; nenhuma sessão privilegiada criada |
| Perfis | cada perfil mantém owner, identidade, privacidade e referências; campos movidos têm equivalência semântica por amostra e checksum |
| Fotos | objeto existe, owner/path/bucket corretos, URL/signed delivery funciona conforme política, estado de verificação/moderação e ordem da galeria preservados |
| Mensagens | todo ID histórico permanece recuperável; sender, thread/match, conteúdo, timestamps, reply, edição, exclusão e ordem total preservados |
| Matches/interesses | pares não se invertem/duplicam; estado, origem, timestamps, bloqueios e elegibilidade histórica preservados |
| Propósito Firmado | participantes, início/fim, estado, progresso e partner corretos; fim não ativa namoro; comunidade não é pausada |
| Moedas | saldo por usuário reconciliado com ledger e regras de cap; soma, direção, referência, idempotency key e causalidade verificadas |
| XP | total, nível, eventos, source e caps coerentes; nenhuma quantia arbitrária ou replay aceito |
| Transações/compras | toda compra tem payer, item, preço histórico, moeda, horário, efeito no ledger e ownership resultante |
| Inventários | owner + item + quantidade + estado equipado sem quantidade negativa, órfão ou duplicação semântica |
| Presentes | remetente, destinatário, item, transação, mensagem, visibilidade e entrega coerentes |
| Pets | identidades e owners preservados separadamente em `user_pets` e `user_pets_v2`; espécie/variante/stats/cuidado/itens/equipado coerentes |
| Jogos | partidas, resultado, recompensa, progresso, missão, álbum/coleção e referências de asset preservados |
| Conteúdo | autoria, publicação, moderação, ordem e progresso do usuário preservados |
| Permissões | diff de grants/RLS/policies por papel; nenhum novo acesso; helpers `SECURITY DEFINER` com `search_path`, auth e escopo explícitos |
| Realtime | publicação/subscrição apenas nos tópicos autorizados; source-table RLS e filtro por participante testados |
| Storage | inventário bucket/path/owner/size/hash/content-type; políticas, public/private, URLs persistidas e órfãos comparados |
| Bloqueios/moderação | bloqueio global vale em feed, grupo, chat, Cinema e namoro; evidências, decisão e auditoria continuam acessíveis só a papéis corretos |
| PWA/cache | logout e troca de usuário não revelam cache/rascunho anterior; versões antigas expiram sem perder outbox legítimo |
| Avatar-personagem | nenhum asset/tabela/ownership removido antes de inventário, janela, compensação, paridade e autorização; foto/`avatar_url` legítimo/`avatar_ai_verified`/`DecoratedAvatar` e decorações explicitamente fora da retirada |

### I.1 Gate para qualquer contração física

Uma coluna, tabela, identificador, bucket ou asset só pode ser removido quando todos os itens forem verdadeiros:

1. snapshot autenticado de produção e backup com restore testado;
2. nenhum leitor/escritor no código, jobs, RPCs, policies, views, Realtime ou integrações;
3. backfill idempotente concluído e reconciliado semanticamente;
4. dupla leitura/escrita estabilizada pelo período acordado;
5. telemetria mostra zero uso do legado;
6. feature flag e forward-fix ensaiados;
7. owners e impactos financeiros reconciliados;
8. aprovação explícita para a contração destrutiva.

---

## Decisões necessárias antes das fases funcionais

Não bloqueiam o PR-001, mas devem ser resolvidas antes dos PRs indicados:

1. fornecer as referências Sites/Vitra listadas em A.4;
2. localizar o manual ausente ou declarar sua obsolescência;
3. definir navegação inferior e posição opcional do Namoro;
4. definir migração/consentimento de usuários legados para membership romântico;
5. decidir comportamento de matches/chats românticos quando Namoro ou Propósito estiver pausado;
6. escolher modelo social inicial (seguir, conexão bilateral ou ambos) e defaults de privacidade;
7. definir audiência/defaults do Status e default de recados anônimos;
8. ratificar regras atuais de elegibilidade romântica antes de modificá-las;
9. escolher showcases iniciais e tokens de marca do perfil;
10. fornecer lista futura de jogos a retirar;
11. definir compensação e janela do avatar-personagem;
12. formular escopo/integração do Verbo;
13. definir política legal, de mídia, retenção, upload e CDN da Sala de Cinema;
14. fornecer acesso autenticado somente leitura ao Supabase publicado e um projeto isolado para testes mutáveis.

## Conclusão executiva

O primeiro movimento não deve ser visual. O HEAD ainda contém um P0 diretamente confirmado no endpoint de push e outros P0 condicionais cuja exposição em produção precisa ser provada por snapshot. O caminho seguro é conter o endpoint HTTP em PR pequeno, inventariar e endurecer RPCs/policies com evidência de produção, estabelecer telemetria e capabilities, então separar Comunidade/Namoro por modelo aditivo. Conversas, Comunidade, Início, Status e Perfil entram em rollout por flags. Economia, pets, jogos e Admin são redesenhados sem reescrever regras nem consolidar dados. Verbo e Cinema ficam em fases próprias. Pretendentes e avatar-personagem só chegam à retirada física depois de paridade, quarentena, reconciliação e autorização explícita.
