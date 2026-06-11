# Auditoria Offline — VaiDarNamoro (índice)

> **Este documento foi consolidado.** Veja o relatório completo e atualizado em [`RELATORIO_CONSOLIDADO_OFFLINE.md`](./RELATORIO_CONSOLIDADO_OFFLINE.md).

## Relatórios por escopo

| Escopo | Documento |
|---|---|
| Visão geral consolidada (mais atual) | `RELATORIO_CONSOLIDADO_OFFLINE.md` |
| Perfil — Parte 1 (dados principais) | `RELATORIO_PERFIL_OFFLINE.md` |
| Perfil — Parte 2 (fotos e visual) | `RELATORIO_PERFIL_OFFLINE_PARTE2.md` |
| Loja | `RELATORIO_LOJA_OFFLINE.md` |
| Conta (settings) | `RELATORIO_CONTA_SETTINGS.md` |
| Notificações | `RELATORIO_NOTIFICACOES_OFFLINE.md` |

## Resumo executivo

Foram aplicadas melhorias de cache/offline em **8 páginas** (`/bloqueados`, `/noticias`, `/devocional`, `/admin`, `/perfil`, `/loja`, `/conta`, `/notificacoes`) e criado o componente compartilhado `StaleDataNotice`. Padrão final em todas: `StaleDataNotice` discreto quando offline com cache, `OfflineState` de tela cheia quando offline sem cache, guards `!isOnline` em todas as mutations sensíveis, e nenhuma fila/optimistic update offline. Nenhuma alteração em banco, RLS, schema, autenticação, Service Worker ou regras de negócio.

Para detalhes técnicos completos, consulte `RELATORIO_CONSOLIDADO_OFFLINE.md`.
