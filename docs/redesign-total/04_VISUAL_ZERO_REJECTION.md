# Visual Zero — rejeição da apresentação da Fase 01

## Decisão

A apresentação interna entregue na Fase 01 foi rejeitada pelo responsável do produto. O frame adaptativo foi aprovado e permanece como infraestrutura; as composições internas das cinco raízes serão substituídas integralmente.

## Preservado

- `RedesignAppFrame`, top bar, bottom navigation, rail, sidebar e painel contextual;
- `VITE_FF_TOTAL_REDESIGN`, com valor padrão `false`;
- tokens escopados, safe areas, viewport e contratos responsivos;
- rotas, guards, permissões, autenticação, queries, mutations, realtime e uploads;
- view models de Início e Conversas, registry de Explorar e contrato de tabs da Comunidade;
- infraestrutura do harness e congelamento funcional das 69 rotas.

## Rejeitado

- `RedesignInicioView`;
- `RedesignCommunityView`;
- `RedesignExploreView`;
- `RedesignConversationsView`;
- `RedesignProfileHero` e `RedesignProfileTabs`;
- primitives, cards, grids, skeletons, estados vazios e listas visuais usados por essas apresentações.

Esses componentes não são referência compatível para Visual Zero e não podem ser importados pelas cinco novas raízes.

## Contrato Visual Zero

O escopo é `[data-vdn-redesign-total][data-vdn-visual-zero]`. Dentro dele, as superfícies usam somente HTML semântico, Radix sem estilo quando indispensável, TanStack Link, Lucide e classes `vz-*`.

As telas devem apresentar superfícies contínuas, seções agrupadas, listas inset, rows nativas, headers editoriais, segmented controls e ações claras. Não devem repetir grids de cards, bordas em todos os elementos ou aparência de dashboard.

## Fonte única funcional

As rotas continuam proprietárias de seus dados e operações. Visual Zero recebe valores, tipos e callbacks já existentes; não cria query, mutation, channel, endpoint, mock ou estado de domínio paralelo no runtime.

## Flag off/on

- flag ausente ou desligada: apresentação anterior integralmente preservada;
- `VITE_FF_TOTAL_REDESIGN=true`: shell aprovado com as cinco apresentações Visual Zero;
- o default do repositório permanece `false`.

## Rollback

Imediato: omitir ou definir `VITE_FF_TOTAL_REDESIGN=false`.

Código: reverter os commits Visual Zero em ordem inversa. Nenhuma alteração de backend, schema, RLS, Storage ou dependência será necessária.
