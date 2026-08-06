# T46-27.1 — Confiança e moderação administrativa

## Arquitetura

- Rotas: `/admin`, `/admin/verificacoes` e `/admin/fotos`.
- Com a flag desligada, `Header` e `AdminTopNav` legados permanecem integrais.
- Com a flag ligada, o `AdminShell` fornece o chrome e `AdminPage` fornece apenas a superfície responsiva.
- Cada rota continua sendo a única proprietária de autenticação, estado, queries, mutations, dialogs e confirmações.

## Contratos preservados

- `/admin`: painéis internos, roles, moderação, denúncias, publicações, usuários, pré-cadastros, palavras restritas, flags, interesses, avisos, solicitações e apelações.
- `/admin/verificacoes`: `verification_requests`, `profiles`, bucket privado `verifications`, estados de revisão e Signed URLs de 5 minutos.
- `/admin/fotos`: fila, histórico, configurações e reparos; tabelas de moderação; Signed URLs de 1 hora; HEIC/HEIF; normalização; exclusão administrativa e `/api/photo-repair`.
- Guards locais continuam sendo a autoridade final. Nenhuma permissão foi ampliada.

## Responsividade

- Tabs podem rolar horizontalmente dentro do escopo administrativo.
- Conteúdo usa `min-width: 0`; tabelas preservam suas colunas e podem usar overflow interno.
- Campos e ações herdam os contratos de 16 px e 44 px do AdminShell.
- Dialogs e previews continuam acima do shell e limitados pelo viewport.

## Backend

Nenhuma query, mutation, channel, tabela, RPC, bucket, duração de assinatura ou API foi criada ou alterada.

## Smoke e limitações

- Smoke determinístico: flag off/on nas três rotas e contratos estáticos das operações sensíveis.
- Sem sessão Supabase administrativa segura, não há alegação de E2E real de aprovação, rejeição ou reparo.

## Rollback

Imediato: `VITE_FF_NATIVE_SHELL=false`.

Código: `git revert <commit-da-t46-27-1>`.
