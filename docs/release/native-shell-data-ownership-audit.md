# Native Shell — auditoria de ownership de dados

## Resultado

Não foi encontrada mutation, query Supabase ou channel nos componentes de shell. As apresentações Native recebem dados das rotas ou hooks existentes.

| Domínio      | Owner                                                      | Evidência de não duplicação                                                                                      |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Notificações | `NotificacoesPage` chama `useNotifications(100)` uma vez   | Header usa limite 20 somente no legado e não monta no Native Shell; o hook mantém cache/realtime compartilhado   |
| Inbox        | `/conversas` chama `useConversationsList(user.id)` uma vez | `ConversationDrawer` é consumidor funcional independente e o hook usa cache em memória/subscription com refcount |
| Meu Pet      | `/meu-pet` usa uma `myPetV2QueryOptions`                   | Arcade, sidekick e perfil são superfícies independentes com a mesma query key, deduplicada pelo Query Client     |
| Viewport     | `useNativeViewportState` no Native Shell                   | focused chat permanece no listener legado de `MobileAppShell`; os dois shells não montam simultaneamente         |
| Admin        | cada uma das 13 rotas                                      | AdminShell e `AdminRouteAccessBoundary` não acessam Supabase nem estado de domínio                               |

## Channels e cleanup

- Nomes e owners existentes permanecem nas rotas/hooks; nenhum nome foi alterado.
- Header e AdminTopNav legados retornam antes de montar suas implementações quando o shell correspondente está ativo.
- O hook de conversas mantém refcount por usuário; listeners do viewport cancelam RAF e removem listeners em cleanup.
- Timers de Pets, notificações e chat permanecem nos owners originais; não foram copiados para views Native.

## Imports V2 funcionais permitidos

Allowlist explícita fora de `src/v2`:

- `src/lib/auth.tsx` → contrato de sessão;
- `src/router.tsx` e `src/routes/__root.tsx` → contexto/build/routing funcional;
- `src/routes/inicio.tsx` → gate autenticado;
- `src/config/admin-route-access.ts` → sanitização central de `returnTo`.

Nenhum item da allowlist importa `app-shell`, `design-system` ou `integration` V2. O script `release:qualify` falha para qualquer novo import visual V2 fora da árvore tombstonada.

## Limitação

Esta é uma auditoria estrutural e de testes isolados. Realtime real, cleanup em desconexão e troca de conta ainda exigem E2E autenticado controlado.
