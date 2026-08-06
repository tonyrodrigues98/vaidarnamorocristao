# T46-15 — Chats focados Native

## Decisão de runtime

- `/conversas/$matchId` e `/conversas/comunidade` continuam classificados como focused e fora do `NativeShellFrame`.
- A flag desligada preserva integralmente headers, MobileAppHeader e apresentação legada.
- A flag ligada aplica apenas o frame local `data-vdn-native-focused-chat`, sem bottom navigation ou segundo listener de VisualViewport.
- `/conversas`, admin, rotas públicas e desconhecidas não são selecionadas pelo helper.

## Funcionalidade preservada

- Privado: autorização, bloqueio, propósito, paginação, query key, INSERT/UPDATE/DELETE Realtime, cache, envio otimista, retry, leitura, reply, edição, exclusão, sugestões, drawer e offline.
- Comunitário: aprovação, mensagens globais, paginação, Realtime, cooldown, retry, flags, moderação, pin, roles, contributor, gradientes, badges, stickers, Moedas, typing, reply, edição, exclusão e drawer.
- Nenhuma query, mutation, RPC, tabela, cache key ou nome de canal foi alterado.

## Apresentação e teclado

- Um único header local permanece visível; headers globais são desmontados somente no modo Native.
- A altura continua vindo de `--app-visual-height`, mantida pelo shell focado legado.
- O viewport de mensagens mantém scroll próprio e o composer permanece acima do teclado e da safe area.
- Inputs preservam 16 px e ações têm alvo mínimo de 44 px no escopo Native.

## Limites e rollback

- Não foram adicionados anexos, áudio, chamadas, rotas ou backend.
- O refinamento visual não é declarado como congelamento final do tema escuro.
- Rollback imediato: `VITE_FF_NATIVE_SHELL=false`.
- Rollback de código: `git revert <commit-da-t46-15>`.
