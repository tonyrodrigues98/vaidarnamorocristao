# Relatório — /loja Parte 1 (catálogo público via TanStack Query)

## Arquivos alterados

- `src/routes/loja.tsx`

Nenhum outro arquivo foi tocado. Nenhuma migration, schema, RLS, lib nova ou edge function.

## Catálogo: antes x depois

**Antes:** três `useState` (`catalog`, `backgrounds`, `nameGradients`) populados dentro de um `useEffect` que misturava catálogo público + dados do usuário (saldo/inventário/equipados). Cada montagem da rota refazia o fetch.

**Depois:** três `useQuery` independentes, sem dependência de `userId`:

- `["shop-catalog", "decorations"]` → `fetchDecorationCatalog`
- `["shop-catalog", "backgrounds"]` → `fetchProfileBackgroundCatalog`
- `["shop-catalog", "name-gradients"]` → `fetchNameGradientCatalog`

Configuração de todas:

- `staleTime: 5 * 60_000` (catálogo muda pouco)
- `gcTime: 30 * 60_000`
- `refetchOnReconnect: true`
- `refetchOnWindowFocus: false` (herdado do `createAppQueryClient`)

`catalog`, `backgrounds`, `nameGradients` agora são `useMemo` derivados de `query.data ?? []`, então o resto do componente (filtros, grids, `grouped`, `HighlightsView`, `InventoryView`) continua recebendo os mesmos tipos sem mudança de assinatura.

Optei por **queries separadas** em vez de uma única para minimizar diff: cada lib já tem sua função `fetch*Catalog`, e a falha em um não derruba os outros — segue o comportamento original do `try/catch` duplo.

## useEffect antigo

- **Removido:** `fetchDecorationCatalog`, `fetchProfileBackgroundCatalog`, `fetchNameGradientCatalog` e seus `setCatalog/setBackgrounds/setNameGradients`. O `setBackgrounds([])` do `catch` também saiu (a query cuida do estado de erro do catálogo).
- **Mantido intacto:** `fetchMyOwnedIds`, `getMyCoins`, leitura de `profiles` (photo*url + equipped*\*), `fetchMyOwnedBackgroundIds`, `fetchMyOwnedNameGradientIds`, `setOwned`, `setOwnedBackgrounds`, `setOwnedNameGradients`, `setBalance`, `setPhotoUrl`, `setEquipped`, `setEquippedBackground`, `setEquippedNameGradient`. O `refreshKey` continua disparando este efeito para o pull-to-refresh.
- A flag `loading` virou `userDataLoading` (dados do usuário) combinada com `catalogLoading` das queries; o consumidor final (`loading`) preserva a semântica anterior.
- `handlePullRefresh` agora também chama `queryClient.invalidateQueries({ queryKey: ["shop-catalog"] })` para que o pull recarregue o catálogo via Query.

Não há mais fetch duplicado de catálogo.

## Offline

- `hasCatalogCache = catalog.length > 0 || backgrounds.length > 0 || nameGradients.length > 0`.
- **Offline com cache:** `StaleDataNotice` no topo + grade renderiza normalmente (Query devolve o `data` anterior do cache em memória durante a sessão).
- **Offline sem cache:** `OfflineState` (mesma copy/estado anterior).
- **Loading:** `ShopSkeleton cards={8}` — sem tela branca, sem skeleton infinito.

## Garantias (não tocado)

- Saldo (`balance`, `getMyCoins`) — inalterado.
- Inventário (`owned`, `ownedBackgrounds`, `ownedNameGradients`) — inalterado.
- Equipados (`equipped`, `equippedBackground`, `equippedNameGradient`) — inalterado.
- Mutations: `handleBuy`, `handleBuyBackground`, `handleBuyNameGradient`, `handleEquip*`, `handleUnequip*` — não alteradas (continuam usando `setState` direto; viram `useMutation` na Parte 5).
- Regras de preço, posse, moedas, RLS, schema, auth — não tocadas.
- Nenhum dado fake, item fake, fila offline, lib nova ou Capacitor/Workbox.

## Validação

- `bunx tsc --noEmit` → exit 0 (sem erros, sem warnings).
- Build: não executei `bun run build` para evitar custo extra; o harness roda build automático após edição.
- Análise estática: confirmei que `catalog`/`backgrounds`/`nameGradients` continuam sendo `Decoration[] / ProfileBackground[] / NameGradient[]`, então `HighlightsView`, `InventoryView`, `grouped` e todos os grids não precisaram de mudança.

## Confirmações honestas

- Não mexi em banco/Supabase/migrations/RLS/schema.
- Não criei dados fake, catálogo fake, item fake, saldo fake nem fila offline.
- Não instalei biblioteca nova (`@tanstack/react-query` já estava no projeto).
- Não testei em iPhone/Android real — apenas typecheck e leitura estática.
