# Prototype 01 data adapters

## Runtime boundary

`Prototype01RuntimeContext` is presentation-only and carries no Supabase access. Primary route adapters receive the existing route-owned view models and callbacks. Secondary routes keep their existing data layer and are framed by `Prototype01SecondaryHeader` plus scoped canonical CSS; no data operation is moved into the shell.

The route remains the owner of authentication, queries, mutations, uploads, realtime subscriptions, and navigation. Prototype 01 components are presentational and receive stable view models and callbacks.

| Surface    | Route owner                                             | Adapter contract               | Preserved real sources                                                                      | Runtime fixtures |
| ---------- | ------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- | ---------------- |
| Início     | `src/routes/inicio.tsx`                                 | `Prototype01InicioAdapter`     | `NativeInicioViewModel`, priorities, devotional continuity, summaries, navigation callbacks | Forbidden        |
| Comunidade | `src/routes/comunidade.tsx` and linked community routes | `Prototype01ComunidadeAdapter` | Chat, Orações, Notícias, Devocional and real route availability                             | Forbidden        |
| Explorar   | `src/routes/explorar.tsx`                               | `Prototype01ExplorarAdapter`   | Native explore registry, destination access, real navigation                                | Forbidden        |
| Conversas  | `src/routes/conversas/index.tsx`                        | `Prototype01ConversasAdapter`  | `useConversationsList`, unread state, timestamps, presence, focused-chat routes             | Forbidden        |
| Perfil     | `src/routes/perfil.tsx`                                 | `Prototype01PerfilAdapter`     | Profile queries, edits, uploads, verification, security, inventory and decoration state     | Forbidden        |

## Ownership invariants

- Adapters contain no Supabase client access.
- Adapters do not open realtime channels.
- Adapters do not duplicate route queries or mutations.
- Test fixtures live only under the parity harness and are never imported by production routes.
- Empty and unavailable data is represented honestly using canonical Prototype 01 components.
