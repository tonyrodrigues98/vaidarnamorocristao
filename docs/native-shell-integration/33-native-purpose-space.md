# T46-23.2 — Espaço Native de Propósito

- `/proposito/$matchId` herda Conversas e recebe o título contextual `Propósito`.
- Flag off preserva o V1; flag on usa o Native Shell e o contrato já existente de teclado/safe areas.
- `CouplePage` continua como fonte única de autorização, commitment, perfis, mensagens, presentes, conquistas, cápsula, filtros e encerramento.
- Foram preservados `couple-chat-${matchId}`, INSERT/UPDATE/DELETE de mensagens, `mark_message_read`, `getCommitmentByMatch` e `endCommitment`.
- Não foi criado segundo chat, query, channel, RPC, listener de VisualViewport ou backend.
- Smoke é estrutural/harness, sem alegação de E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-23.2>`.
