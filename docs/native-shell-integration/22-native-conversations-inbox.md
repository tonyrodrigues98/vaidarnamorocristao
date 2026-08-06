# T46-14 — Caixa de entrada Native

## Contrato

- `/conversas` mantém `RequireApproved`, autenticação e a mesma chamada única a `useConversationsList(user?.id)`.
- A rota mantém busca e rede e escolhe somente a apresentação: legado com a flag desligada, Native com o Native Shell ativo.
- O hook existente continua responsável pelo cache em memória, carregamento, compromisso e subscription Realtime com refcount.
- Nenhuma query, mutation, RPC, channel ou fetch foi adicionada aos componentes Native.

## Apresentação Native

- Heading semântico, busca local e Chat geral fixado em `/conversas/comunidade`.
- Conversas privadas mantêm ordem, `/conversas/$matchId`, avatar decorado, online, verificação, badges, última mensagem, data e não lida.
- `CommitmentPauseCard` continua ocultando as demais conversas durante propósito ativo.
- Loading inicial, atualização sem apagar lista, offline sem cache, vazio, busca sem resultado e pull-to-refresh são preservados.
- O input usa fonte de 16 px e os destinos interativos mantêm alvo mínimo de 44 px.

## Flag e limites

- `VITE_FF_NATIVE_SHELL=false`: apresentação V1 inalterada.
- `VITE_FF_NATIVE_SHELL=true`: apresentação Native somente na raiz `/conversas` elegível.
- Chats focados, backend, schema, rotas e cache keys não foram alterados neste lote.

## Rollback

- Imediato: `VITE_FF_NATIVE_SHELL=false`.
- Código: `git revert <commit-da-t46-14>`.
