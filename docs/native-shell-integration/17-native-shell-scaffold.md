# T46-06 — scaffold isolado do Native Shell

## Contrato

- Flag pública de build: `VITE_FF_NATIVE_SHELL`.
- Padrão: desligada. Apenas o booleano `true` ou a string exata `"true"` ativam.
- A flag é independente de `VITE_FF_V2_APP_SHELL`; nenhuma flag ou implementação visual V2 foi alterada ou reutilizada.
- Allowlist inicial: somente `/inicio`, classificada como `destinationId = app-home`.
- Não existem overrides por storage, cookie ou query string.

## Boundary e fallback

`NativeShellRuntimeBoundary` ocupa o antigo ponto único de montagem de `MobileAppShell` no
root. Ele resolve a rota pelo registro central e consulta a autenticação canônica existente.

| Condição                                                       | Resultado                 |
| -------------------------------------------------------------- | ------------------------- |
| Flag desligada                                                 | `MobileAppShell` integral |
| Flag ligada, sessão resolvida, usuário autenticado e `/inicio` | `NativeShellFrame`        |
| Loading, visitante ou qualquer outro destino                   | `MobileAppShell` integral |

Não há redirect, persistência de flag, segunda autenticação, segunda árvore de providers ou
renderização simultânea dos shells.

## Frame

O frame possui slots opcionais para navegação principal, top bar, painel contextual, navegação
inferior e overlay host. Nesta etapa nenhum slot recebe navegação real. Slots ausentes não
renderizam regiões nem reservam espaço. O conteúdo atual é preservado em
`main#vdn-native-shell-main`.

Os atributos `data-theme` e `data-theme-preference` vêm do `ThemeProvider` atual. A referência
visual está marcada como `partially-frozen` e o scaffold como `scaffold-1`.

## CSS e responsividade

Os tokens e estilos são importados apenas pelo frame. Todos os seletores públicos começam em
`[data-vdn-native-shell]`; não existem regras para `:root`, `html`, `body`, `.dark` ou classes
legadas. O scaffold é uma coluna sem slots e apenas prepara composição em grid quando slots
forem fornecidos. Safe areas e redução de movimento estão contempladas sem `position: fixed`.

## Providers preservados

A ordem e responsabilidade de Query Client, tema, runtime Supabase, autenticação, boundary V2,
providers privados, presença, notificações, banimento, proteção de rotas, banners, toaster,
footer, splash e service worker permanecem no root.

## Smoke

- Flag ausente/desligada: rotas públicas, autenticadas, admin e auth permanecem no fallback.
- Flag ligada: somente uma sessão autenticada em `/inicio` escolhe o scaffold.
- Sem Supabase local seguro, a seleção autenticada é comprovada por testes puros e SSR do frame;
  não é alegada paridade visual autenticada.
- O frame isolado é estruturalmente fluido nos viewports 393 × 852, 1200 × 750 e 1440 × 900,
  sem navegação ou regiões vazias.

## Rollback

Imediato: manter `VITE_FF_NATIVE_SHELL` ausente ou `false`.

Código: `git revert <commit-da-t46-06>`.

## Próxima tarefa

Somente um lote posterior autorizado poderá preencher slots ou ampliar a allowlist.
