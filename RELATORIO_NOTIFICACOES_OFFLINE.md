# Relatório — /notificacoes como Central de Atividades

## Arquivos alterados

- `src/routes/notificacoes.tsx` — guards offline em markAll/delete, StaleDataNotice quando offline com cache, mapeamento de links legados, disable do botão "Marcar todas" offline.

## Auditoria (estado encontrado)

A página já estava em estado avançado — nenhuma reescrita necessária.

### Dados

- Hook: `useNotifications(100)` em `src/lib/notifications.tsx`.
- **Já usa `useQuery`** com `queryKey: ["notifications", userId, limit]` (privado, userId incluso). `staleTime: 30s`, `enabled: !!userId`.
- Realtime via canal Supabase `notifications-{userId}-{instance}` que aplica `setQueriesData` em todas as variantes de limit (Header usa 20, página usa 100) — sem refetch em loop.

### Tipos reais já mapeados em `iconMeta(type)`

`interest`, `match`, `message`, `profile_approved`, `profile_verified`, `anonymous_message`, `anonymous_hint_requested`, `anonymous_hint_sent`, `anonymous_reply`, `anonymous_reveal_requested`, `anonymous_revealed`, `anonymous_report`, `gift`/`gift_received`, `devotional`, `news`/`noticia`, `community`/`conversation`, `system`, fallback `Bell`. Cada tipo já tem ícone lucide + cor.

### Mutations existentes

- `markRead(id)` — patch optimistic + `UPDATE notifications set read_at`.
- `markAllRead()` — patch optimistic + `rpc("mark_all_notifications_read")`.
- `remove(id)` — patch + `DELETE notifications`.
- Delete via swipe usa undo de 5s antes de chamar Supabase.

### UI já presente

- Header contextual com título "Atividades" + subtítulo.
- Resumo compacto com contagem real de não lidas + botão "Marcar todas".
- Filtro chips: "Todas" / "Não lidas" (contagens reais).
- `EnableNotificationsCard` para opt-in de push.
- Agrupamento por data: Hoje / Ontem / Esta semana / Anteriores.
- Empty states: nenhuma notificação (CTA → `/pretendentes`), filtro vazio "Tudo em dia", `OfflineState` quando vazio offline.
- Skeleton durante load.
- Swipe-to-delete com animação framer-motion.
- Navegação ao clicar: `markRead` + `router.history.push(n.link)`.

### Gaps identificados (corrigidos)

1. `markAllRead`, `markRead` (via click), `delete` rodavam offline sem aviso — causariam erro de rede silencioso e cache inconsistente.
2. Não havia `StaleDataNotice` quando offline com notificações em cache.
3. Botão "Marcar todas" não desabilitava offline.
4. Links legados (`/dashboard`, `/comunidade`) seguiam diretamente — `/dashboard` ainda existe mas convenção atual é `/inicio`, e `/comunidade` é página informativa, não a central de conversas.

## Mudanças aplicadas

### 1. Guards offline

- `handleMarkAll`: retorna com toast `"Disponível online. Reconecte-se para atualizar suas atividades."` se offline.
- `handleDelete`: retorna com toast `"Disponível online. Reconecte-se para apagar notificações."` se offline.
- `onClick` (abrir notificação): só chama `markRead` se `isOnline`; navegação continua funcionando (rotas internas com cache TanStack Router resolvem).
- Botão "Marcar todas" recebeu `disabled={markingAll || !isOnline}`.

### 2. StaleDataNotice

Renderizado no topo do `<main>` quando `!isOnline && visible.length > 0`:

> "Você está offline. Mostrando atividades carregadas anteriormente."

`OfflineState` continua sendo mostrado quando `visible.length === 0 && !isOnline` (vazio offline).

### 3. Rewrite de links legados

Helper `rewriteNotificationLink(link)`:

- `/dashboard*` → `/inicio*`
- `/comunidade` ou `/comunidade/*` → `/conversas`
- Outros links: passam intactos.

Aplicado em `onClick` antes de `router.history.push`.

## Offline — comportamento final

| Situação                | Comportamento                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Online                  | Tudo normal: mark read/all/delete, realtime, push                                                     |
| Offline + cache         | Lista visível, StaleDataNotice no topo, navegação funciona, ações de mark/delete bloqueadas com toast |
| Offline + vazio         | `OfflineState` com botão "Tentar novamente" (no-op até reconectar)                                    |
| Pull-to-refresh offline | Já desabilitado por `PullToRefresh disabled={!isOnline}`                                              |

## Navegação por tipo (todos via `n.link` real + rewrite)

- Interesses → `/interesses` (ou `/pretendentes/$id` se o link já vier assim).
- Match → `/matches` ou `/conversas/...` conforme `n.link` salvo no banco.
- Mensagem/conversation → `/conversas/...`.
- Recados anônimos → link real (visual e ícone próprios já existem por tipo).
- Presente → link real (`/perfil` ou seção específica).
- Notícia → `/noticias` ou `/noticias/$id`.
- Devocional → `/devocional`.
- Sistema/admin → link real ou sem navegação se ausente.

Não foi criada nenhuma lógica de fallback que pudesse abrir rota inexistente — quando `n.link` é null, o item só marca como lida (online).

## Validação

- `bunx tsc --noEmit` → **exit 0**, sem erros.
- Análise estática: imports OK, sem variáveis não usadas, nenhum emoji no código.
- Não testado em iPhone/Android real.

## Confirmações

- Não mexeu em banco, migrations, RLS, schema, auth, regras de match/interesse/conversa/recado/presentes/admin.
- Não criou notificações, contadores, tipos ou rotas fake.
- Não criou fila offline (mark read offline é bloqueado, não enfileirado).
- Não alterou `src/lib/notifications.tsx` (mutations e realtime intocados).
- Não instalou biblioteca. Não usou Capacitor nem Workbox.
