# Inventário de Realtime

## Canais observados

Foram identificados 20 nomes/padrões de canal: 19 expressões literais e a
constante `global-chat-typing`.

| Canal/padrão | Origem | Eventos/dados | Limpeza observada |
|---|---|---|---|
| `profile-self-delete-${uid}` | Auth/profile | `DELETE` em `profiles` para o usuário | `removeChannel` |
| `conv-list-${userId}` | Lista de conversas | `messages`, `matches`, `relationship_commitments` | Cleanup com contagem de referências e `removeChannel` |
| `devotional-live` | Devocional | Reações, comentários, likes e posts diários | `removeChannel` |
| `notifications-${userId}-${instanceIdRef.current}` | Bridge de notificações | `notifications` do usuário | `removeChannel` |
| `chat-${matchId}` | Chat de match | Inserção/remoção de `messages` filtradas | `removeChannel` |
| `message-flags` | Moderação de mensagens | `message_flags` | `removeChannel` |
| `global-chat` | Conversa comunitária | `global_messages` | `removeChannel` |
| `recados-${user.id}` | Recados | Recados, dicas e compromissos | `removeChannel` |
| `matches-list` | Matches | `matches` e compromissos | `removeChannel` |
| `prayer-requests-live` | Orações | Pedidos, “orei” e denúncias | `removeChannel` |
| `daily-posts` | Conteúdo diário | `daily_posts` | `removeChannel` |
| `couple-chat-${matchId}` | Propósito/chat | `messages` filtradas | `removeChannel` |
| `interests-page` | Interesses | `interests`, `matches`, compromissos | `removeChannel` |
| `support_tickets_list` | Suporte | `support_tickets` | `removeChannel` |
| `support_ticket_${id}` | Ticket | `support_messages` filtradas | `removeChannel` |
| `global-presence` | PresenceProvider | Presence por `user.id`; heartbeat de atividade | `unsubscribe` e `removeChannel`; timer limpo |
| `notif-${user.id}` | Notificações/header | Interesses e eventos relacionados | `removeChannel` |
| `badges-${userId}` | Badges | `user_badges` do usuário | `unsubscribe` e `removeChannel` |
| `hdr-counters` | Cabeçalho | Interesses, mensagens, matches, posts e recados | `removeChannel` |
| `global-chat-typing` | Indicador de digitação | Broadcast `typing` | Dois consumidores com `removeChannel`; timer de varredura limpo |

## Providers e momento de montagem

`PresenceProvider`, `NotificationsBridge` e `BanGuard` ficam dentro de
`AuthenticatedProviderBoundary`. Eles não são montados enquanto a sessão está
inicializando nem para visitante.

`PresenceProvider`:

- entra em `global-presence` com chave `user.id`;
- registra callbacks de sync;
- chama `touch_my_activity`;
- mantém heartbeat de 60 segundos;
- remove timer e canal ao desmontar.

## Sobreposição conhecida

Há assinaturas parcialmente sobrepostas entre o bridge de notificações, hooks
de notificações e `hdr-counters`. Isso não prova duplicação incorreta, pois cada
consumidor atualiza uma superfície diferente, mas representa custo global e
deve ser preservado até uma refatoração acompanhada por testes.

## Contratos a preservar

- Nenhum canal privado antes da autenticação resolvida.
- Cleanup no unmount, logout e troca de usuário.
- Filtros por usuário/match/ticket quando aplicáveis.
- Estado atrasado de um usuário não deve repopular cache de outro.
- Canal de presence não concede autorização.
- Nenhum conteúdo privado deve ser registrado em logs.

## Não comprovado

- Publicação remota das tabelas no Realtime.
- Policies de `realtime.messages` efetivamente aplicadas.
- Conectividade, latência, reconexão e comportamento offline reais.
- Número de conexões simultâneas em produção.
