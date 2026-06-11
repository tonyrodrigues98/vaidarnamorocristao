# Relatório — Auditoria offline /loja

## Arquivos alterados
- `src/routes/loja.tsx` — guards offline em equip/unequip, StaleDataNotice quando offline com cache, `disabled || !isOnline` nos botões de ação principais.

## Auditoria (estado encontrado)

### Como os dados são carregados
A `/loja` **não usa TanStack Query**. Tudo é `useState` + um `useEffect` que dispara dois `Promise.all`:
1. `fetchDecorationCatalog()`, `fetchMyOwnedIds(user.id)`, `getMyCoins()`, `supabase.from("profiles").select(...equipped_frame_id, equipped_aura_id, equipped_sticker_id, photo_url).eq("id", user.id)`.
2. `fetchProfileBackgroundCatalog()`, `fetchMyOwnedBackgroundIds()`, `fetchNameGradientCatalog()`, `fetchMyOwnedNameGradientIds()`, `supabase.from("profiles").select("equipped_background_id, equipped_name_gradient_id")`.

Estado mantido em locais: `catalog`, `backgrounds`, `nameGradients`, `owned`, `ownedBackgrounds`, `ownedNameGradients`, `equipped`, `equippedBackground`, `equippedNameGradient`, `balance`, `photoUrl`.

### Queries / queryKeys
- **Nenhuma** queryKey existe hoje. Não há cache compartilhado entre páginas.
- Migrar tudo para `useQuery` exigiria reescrever ~300 linhas do arquivo (1549 linhas totais) e mover lógica de catalog/balance/inventory/equipped para `queryOptions` separados — fora do escopo "seguro e controlado" desta tarefa.

### Mutations
- `purchaseDecoration`, `purchaseProfileBackground`, `purchaseNameGradient` — compras.
- `equipDecoration`, `equipProfileBackground`, `equipNameGradient` — equipar.
- `unequipDecoration`, `unequipProfileBackground`, `unequipNameGradient` — desequipar.
- Todas chamadas diretamente (sem `useMutation`). Cache é atualizado via `setOwned`, `setBalance`, `setEquipped*` locais.

### O que já bloqueava offline (antes)
- `handleBuy`, `handleBuyBackground`, `handleBuyNameGradient` já tinham `if (!isOnline) toast.error(...)`.
- `PullToRefresh` já tinha `disabled={!user || !isOnline}`.
- `OfflineState` já era exibido em `!isOnline && catalog.length === 0`.

### O que NÃO bloqueava offline (gap encontrado)
- `handleEquip`, `handleUnequip` (decorations).
- `handleEquipBackground`, `handleUnequipBackground`.
- `handleEquipNameGradient`, `handleUnequipNameGradient`.
- Botões de ação ficavam clicáveis offline, podendo gerar erro de rede silencioso e estado visual inconsistente.
- Não havia `StaleDataNotice` quando offline com catálogo já carregado.

### Outros riscos avaliados (sem ação)
- **Saldo não zera offline**: `setBalance` só é chamado no `try` do load inicial e no sucesso das mutations. Se o fetch falha, balance fica no valor anterior (0 inicial). Não há regressão a partir desta tarefa.
- **Inventário não some**: mesmo padrão; `setOwned*` só é chamado em sucesso.
- **Skeleton infinito**: `setLoading(false)` está no `finally` do primeiro bloco. OK.
- **Refetch em loop**: `useEffect` depende de `[user?.id, refreshKey]`. Sem loop.

## Mudanças aplicadas

### 1. Guards offline em equip/unequip (6 handlers)
Cada handler agora começa com:
```ts
if (!isOnline) {
  toast.error("Disponível online. Reconecte-se para alterar seu visual.");
  return;
}
```
Aplicado em: `handleEquip`, `handleUnequip`, `handleEquipBackground`, `handleUnequipBackground`, `handleEquipNameGradient`, `handleUnequipNameGradient`.

### 2. StaleDataNotice
Renderizado no topo do `<main>` quando `!isOnline && !loading && catalog.length > 0`:
> "Você está offline. Mostrando itens carregados anteriormente. Compras e mudanças de visual estão indisponíveis."

### 3. Disable de botões de ação offline
Adicionado `|| !isOnline` ao `disabled` dos botões:
- Comprar (frame/aura inline, background inline, name-gradient inline).
- Equipar (mesmos três).
- Comprar nos diálogos de confirmação (decoration + background).

## Offline — comportamento final

| Situação | Comportamento |
|---|---|
| Online | Tudo normal, mutations executam, listas locais atualizam |
| Offline + catálogo em memória | Catálogo visível, StaleDataNotice no topo, botões Comprar/Equipar/Desequipar disabled, handlers retornam com toast se forçados via teclado/screen reader |
| Offline + catálogo vazio | `OfflineState` ocupa o conteúdo principal |
| Pull-to-refresh offline | Já estava bloqueado por `PullToRefresh disabled={!user || !isOnline}` |

## Ações bloqueadas offline
- Compra (decoration, background, name-gradient).
- Equipar (decoration, background, name-gradient).
- Desequipar (decoration, background, name-gradient).
- Pull-to-refresh.

## UI/UX — Loja vs Visual
Não alterado nesta tarefa. A `/loja` mantém "comprar / catálogo / inventário", e a `/perfil` (aba Visual, padronizada em parte 2) mantém "equipar / gerenciar aparência". Nenhum link duplicado foi introduzido.

## Mobile / Overflow
Auditoria visual do código:
- Grids `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (frames/auras) e `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (backgrounds/gradients). OK.
- Categorias em barra horizontal com `overflow-x-auto`, scrollbar ocultada. OK.
- Cards usam `line-clamp-1/2` em nomes/descrições. OK.
- Saldo mobile em widget compacto separado do hero desktop. Sem overflow detectado.
- Nenhuma mudança aplicada nesta tarefa em estrutura responsiva.

## Service Worker
Não alterado. `public/sw.js` continua com `SENSITIVE_PATHS` protegendo `/loja`. Offline é resolvido inteiramente em React (não via cache de respostas privadas).

## Validação
- `bunx tsc --noEmit` → **exit 0** (sem erros).
- Análise estática manual feita nas linhas relevantes.

## Confirmações
- Não mexeu em banco, migrations, RLS, schema, auth.
- Não alterou preços, regras de compra ou saldo.
- Não criou item, saldo, inventário ou fila offline fake.
- Não criou optimistic update offline.
- Não instalou biblioteca nova. Não usou Capacitor nem Workbox.
- Não testou em iPhone/Android real.

## Observação honesta
A migração completa para `useQuery` + `queryKey: ["shop-catalog"]`, `["user-balance", userId]`, `["user-inventory", userId]`, `["equipped-items", userId]` é viável mas requer uma tarefa separada dedicada — implica refatorar carregamento, mutations (para `useMutation` com `onSuccess` + `invalidateQueries`), e remover ~10 `useState`. Esta tarefa entregou apenas auditoria + correções cirúrgicas de offline conforme a regra "não reescrever a loja inteira".
