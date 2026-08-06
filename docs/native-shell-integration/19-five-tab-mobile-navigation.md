# T46-08 — navegação mobile de cinco abas

## Contrato

- Ordem: Início, Comunidade, Explorar, Conversas e Perfil.
- Rotas: `/inicio`, `/comunidade`, `/explorar`, `/conversas` e `/perfil`.
- Rollout: somente com `VITE_FF_NATIVE_SHELL=true`, sessão autenticada e rota-raiz elegível.
- A flag permanece desligada por padrão. Com ela desligada, o `MobileAppShell` e a navegação V1 permanecem integrais.
- Os paths são derivados de `plannedPrimaryDestinations`; o componente visual não duplica rotas.
- `/conversas/comunidade` e `/conversas/$matchId` são classificados como `messages`, mas continuam no shell focado legado.

## Comportamento

- O item ativo usa `aria-current="page"`, indicador, ícone e label visível.
- Tocar uma aba inativa usa navegação do TanStack Router e preserva o histórico.
- Retocar a aba ativa na raiz, sem query ou hash, rola ao topo, respeita reduced motion e emite `vdn:native-tab-reselect`.
- Retocar a aba ativa com query ou hash navega para a raiz e limpa esse estado.
- A navegação desaparece em viewport mobile quando um input, textarea, select ou contenteditable aciona o teclado; VisualViewport confirma reduções relevantes.
- O slot usa safe areas laterais e inferior, cinco colunas e alvos mínimos de 44 px.
- A bottom navigation fica oculta a partir de `48rem`. Sidebar, top bar e memória por aba não pertencem a este lote.

## Fronteiras preservadas

- Nenhuma query, Supabase, avatar, badge, contador, portal ou import V2 foi adicionado.
- Nenhuma página, rota, chat, guard ou navegação V1 foi alterado.
- O frame usa um `div` estável com `data-native-shell-content`; cada página continua responsável por seu único landmark `<main>`.
- A diferença para a navegação legada existe somente sob a flag: Devocional e Pretendentes dão lugar a Comunidade e Explorar.

## Validação e limitação do smoke

Os contratos de mobile, desktop, teclado, active state, reselect, isolamento, cinco raízes e chats focados são cobertos deterministicamente. Sem sessão Supabase local segura, o smoke autenticado é estrutural e não usa produção.

## Rollback

Definir `VITE_FF_NATIVE_SHELL=false` restaura imediatamente o runtime legado. O rollback de código é `git revert <commit-da-t46-08>`.

## Próximo passo

T46-09 permanece não iniciada.
