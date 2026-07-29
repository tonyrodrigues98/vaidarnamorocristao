# T46-10 — Top bar e contrato de viewport

## Escopo entregue

- `NativeTopBar` aparece somente nas cinco raízes elegíveis quando `VITE_FF_NATIVE_SHELL=true`.
- Os títulos vêm de `nativePrimaryNavigation`: Início, Comunidade, Explorar, Conversas e Perfil.
- A marca usa `brand.assets.icon192`.
- As únicas ações são tema, `/notificacoes` e `/perfil`; não há busca, contador, menu ou consulta.
- O perfil usa apenas iniciais derivadas de `user.email ?? user.id`, sem expor o identificador completo.
- `NativeAvatar` usa narrowing estrutural, nunca passa `undefined` ao `<img>` e restaura a imagem quando `src` muda.

## Viewport, teclado e orientação

`useNativeViewportState` concentra `VisualViewport`, resize, orientationchange, foco e blur. O frame recebe:

- `data-keyboard-open`;
- `data-orientation`;
- `data-viewport-compact`;
- `--vdn-native-viewport-width`;
- `--vdn-native-layout-height`;
- `--vdn-native-visual-height`;
- `--vdn-native-keyboard-height`.

O shell usa visual height como `min-height`, sem altura fixa ou scroll container adicional. Em viewport compacto, foco editável ou redução relevante do `VisualViewport` ocultam somente a bottom navigation. A top bar sticky continua visível.

## Compatibilidade

- `MobileAppHeader` não monta dentro do Native Shell, evitando duplicação em `/conversas`.
- Fora do provider, com flag desligada, durante loading, sem sessão e nos focused chats, o Header e o MobileAppHeader legados permanecem integrais.
- Focused chats continuam fora do viewport Native.
- Rail em 48rem, sidebar em 80rem e bottom navigation mobile permanecem inalterados.
- Não foram alteradas páginas, rotas, providers, guards, backend ou conteúdo funcional.

## Limitações

O smoke autenticado usa harness isolado porque não existe sessão Supabase local. Busca global, painel contextual, overlay funcional, avatar remoto e contadores não fazem parte deste lote.

## Rollback

- Operacional: `VITE_FF_NATIVE_SHELL=false`.
- Código: `git revert <commit-da-t46-10>`.

Esta fundação prepara os lotes T46-11 a T46-13; nenhum deles foi iniciado.
