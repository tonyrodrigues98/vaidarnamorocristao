# T46-18 — Central Native de Notificações

- Parent tab: `home`; a navegação principal continua com cinco destinos.
- Título contextual: `Notificações`, resolvido pelo registry secundário.
- Flag desligada: `/notificacoes` mantém integralmente a apresentação V1.
- Flag ligada: a rota usa o Native Shell com Início ativo.
- Fonte única: `NotificacoesPage` chama `useNotifications(100)` uma vez e continua dona de filtros, cache, timers, rede, marcação, exclusão e navegação.
- O hook e seus contratos de query/realtime INSERT, UPDATE e DELETE não foram alterados nem duplicados.
- Foram preservados contagens reais, filtros, agrupamento, push card, loading, offline/cache antigo, mark-read, mark-all, swipe, apagar, atraso, desfazer e rollback em erro.
- Links de Comunidade vão a `/conversas` no legado e a `/comunidade` no rollout Native; `/dashboard`, links desconhecidos e nulos permanecem intactos.
- A apresentação Native não acessa Supabase; a exclusão existente continua pertencendo à rota.
- Limitação: smoke é estrutural, sem sessão Supabase local segura ou E2E remoto.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-18>`.
