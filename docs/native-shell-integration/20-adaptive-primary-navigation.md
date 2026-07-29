# T46-09 — navegação primária adaptativa

## Contrato responsivo

- Mobile abaixo de `48rem`: bottom navigation da T46-08.
- Tablet de `48rem` a `79.999rem`: rail sticky de `72px`, marca oficial e labels acessíveis visualmente ocultas.
- Desktop a partir de `80rem`: sidebar sticky de `244px`, marca e labels visíveis.
- A fonte única de ordem, labels e paths permanece `nativePrimaryNavigation`: Início, Comunidade, Explorar, Conversas e Perfil.
- A marca usa `brand.assets.icon192` e `brand.displayName`.

## Runtime e legado

`NativeShellRuntimeProvider` envolve somente o ramo nativo autenticado e informa `active` e `activeTab`. Fora dele, o valor é inativo. O `Header` consulta esse contexto antes de montar `LegacyHeader`; assim, consulta de perfil, counters, notifications e canal `hdr-counters` não iniciam dentro do Native Shell.

Com `VITE_FF_NATIVE_SHELL=false`, em focused chats e em qualquer rota não elegível, o provider não envolve a página e o Header legado permanece integral. Não há top bar, painel contextual, bloco de usuário, botão Criar, menu Mais, avatar, badge ou contador na lateral.

## Interação e isolamento

- Bottom navigation e lateral usam `useNativePrimaryTabSelection`.
- Active state combina `aria-current`, indicador coral, texto e peso.
- Reselect preserva scroll ao topo, reduced motion e `vdn:native-tab-reselect`.
- Nenhum path, label, query, Supabase, portal ou import V2 foi duplicado.
- A navegação lateral é sticky, respeita safe areas e nunca usa `position: fixed`.

## Diagnóstico pendente

Diagnóstico TypeScript isolado: o estreitamento `Boolean(src)` não garante `src`/`alt` para o JSX em `NativeAvatar.tsx`. A correção é obrigatória antes do primeiro uso do primitive, mas ele não é consumido neste lote.

## Smoke e limitação

Os breakpoints, exclusividade entre navegações, Header suprimido, ausência de queries e focused chats legados são validados deterministicamente. Sem sessão Supabase local segura, o smoke autenticado usa harness isolado; nenhuma conta ou ambiente de produção é acessado.

## Rollback

Definir `VITE_FF_NATIVE_SHELL=false` preserva integralmente o caminho legado. O rollback de código é `git revert <commit-da-t46-09>`.

## Próximo passo

T46-10 permanece não iniciada.
