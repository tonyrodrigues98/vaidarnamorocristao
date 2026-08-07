# Relatório — Etapa 2: /perfil offline (fotos e visual)

## Escopo desta etapa

- Fotos: `ProfilePhotosManager` (foto principal/avatar continua sendo
  gerenciado pelo `saveProfile` em `perfil.tsx`, fora de escopo aqui).
- Visual: `CustomizacaoTab` (molduras, auras, fundos, gradientes de nome).

Nada fora disso foi tocado.

## Arquivos alterados

- `src/components/ProfilePhotosManager.tsx`
- `src/components/CustomizacaoTab.tsx`

Não alterados: `PhotoImg.tsx`, `DecoratedAvatar.tsx`, `photoUrl.ts`,
`imageNormalize.ts`, `decorations.ts`, `profileBackgrounds.ts`,
`nameGradients.ts`, `perfil.tsx`, banco, RLS, schema, auth, regras de compra.
Nenhuma migration. Nenhuma biblioteca nova. Nenhum Capacitor/Workbox.

## Auditoria — como fotos eram carregadas antes

- `perfil.tsx` carrega a foto principal via `profiles.photo_url` na query
  `["profile-main", userId]` (etapa 1) e renderiza com `PhotoImg`.
- `ProfilePhotosManager` carregava as fotos adicionais com um `useEffect` +
  `supabase.from("profile_photos").select(...)`, guardando em `useState`.
- `PhotoImg` já trata cache de signed URLs via `useSignedPhotoUrlResult` —
  não foi tocado.
- Não havia leitura duplicada de fotos entre `perfil.tsx` e o manager.

## Fotos — mudanças

- Migrado `ProfilePhotosManager` para TanStack Query.
  - queryKey: `["profile-photos", userId]`
  - `enabled: !!userId` (não roda sem usuário)
  - `staleTime: 60_000`, `gcTime: 30 * 60_000`
  - `onUpload` e `remove` invalidam a query (`qc.invalidateQueries`) ao
    invés de mexerem em `setPhotos` local.
- Offline com cache: aparece `StaleDataNotice` discreto acima da grade —
  "Você está offline. Mostrando fotos carregadas anteriormente." As fotos
  continuam visíveis (URLs assinadas já cacheadas em memória pelo
  `useSignedPhotoUrlResult`; novas requisições de signed URL podem falhar
  silenciosamente quando o `<img>` recarregar — esse é o comportamento
  natural do browser offline, não introduzimos fallback falso).
- Offline sem cache: `OfflineState` compacto — "Fotos indisponíveis
  offline. Conecte-se para carregar suas fotos."
- Upload bloqueado offline:
  - Tile "Adicionar" troca para ícone `WifiOff` + label "Offline",
    `cursor-not-allowed`, opacidade 50%, `aria-disabled`, `title` com a
    mensagem.
  - `<input type="file">` recebe `disabled` quando offline.
  - `onUpload` faz guard no início: se `!isOnline`, mostra toast
    "Disponível online. Reconecte-se para enviar fotos." e aborta antes de
    qualquer normalização, IA ou upload.
- Remover foto também bloqueado offline: botão fica `disabled` + `title`,
  e `remove` tem o mesmo guard com toast.
- Online: fluxo idêntico ao anterior — normalize → verifyProfilePhoto →
  upload no storage → insert em `profile_photos` → backfill log → invalidar.

## Auditoria — como visual era carregado antes

- `CustomizacaoTab` carrega tudo internamente em um único `useEffect([user])`:
  catálogo (`fetchDecorationCatalog`), itens possuídos (`fetchMyOwnedIds`),
  saldo (`getMyCoins`), e duas leituras de `profiles` com os campos
  `equipped_frame_id/aura/sticker/background/name_gradient`. Em seguida,
  catálogo de fundos, posse de fundos, catálogo de gradientes, posse de
  gradientes.
- `perfil.tsx` NÃO duplica essas leituras; só passa `photoUrl` para
  preview.
- Botões "Equipar"/"Remover" existem para 4 tipos: frame, aura, background,
  name gradient.

## Visual — mudanças

Decisão consciente: NÃO migrei `CustomizacaoTab` inteiro para TanStack
Query nesta etapa. A superfície é grande (4 catálogos + posses + equipados +
previews + saldo), tem dependências cruzadas e mexer no `useEffect` único
aumentaria risco de regressão (estado de preview, troca de aba ativa,
invalidação correta entre as 4 mutations). Conforme orientação do brief
("Se for arriscado migrar... não migrar tudo; adicionar apenas estado
offline/aviso; documentar no relatório"), preservei o load existente e
apenas adicionei guards offline. Migração completa fica para uma etapa
futura com queryKeys `["user-decorations", userId]`,
`["equipped-decorations", userId]`, `["profile-backgrounds", userId]`,
`["name-gradients", userId]`.

O que foi feito:

- Offline com cache: `StaleDataNotice` no topo —
  "Você está offline. Mostrando visual carregado anteriormente." Catálogo,
  posses, equipados e preview permanecem como estavam em memória.
- Offline sem cache: helper `hasAnyData` detecta se nada carregou (catálogo,
  fundos, gradientes e equipados todos vazios). Quando offline + sem dados,
  retorna `OfflineState` — "Visual indisponível offline. Conecte-se para
  carregar seus itens." `DecoratedAvatar` não é renderizado nesse caminho,
  evitando avatar quebrado.
- Equipar/Desequipar bloqueado offline em todos os 4 tipos (frame, aura,
  background, name gradient):
  - Botões "Equipar" e "Remover" ficam `disabled` quando `!isOnline` e
    recebem `title` "Disponível online. Reconecte-se para alterar seu visual."
  - Cada handler (`handleEquip`, `handleUnequip`, `handleEquipBackground`,
    `handleUnequipBackground`, `handleEquipNameGradient`,
    `handleUnequipNameGradient`) tem guard no início que mostra toast e
    aborta antes de chamar a mutation no Supabase.
  - Nenhum optimistic update offline. Nenhuma alteração local de
    `equipped`/`equippedBackground`/`equippedNameGradient` quando offline.
- Online: comportamento idêntico ao anterior (equip → fetch equipados →
  setState → toast).

## UI/UX

- Padronização "Visual": já era "Visual" como label da aba em `perfil.tsx`
  (linha 664) e no atalho mobile (linha 830). Renomeei também o título
  interno do `CustomizacaoTab` ("Customização" → "Visual") e a mensagem de
  loading ("Carregando customização…" → "Carregando visual…"). O nome do
  arquivo/componente `CustomizacaoTab` foi preservado (apenas convenção
  interna). Não há mais texto visível ao usuário com "Customização" /
  "Personalizar" como rótulo de aba/seção concorrente.
- Overflow mobile: nenhuma classe nova de largura/posicionamento foi
  introduzida. A grade de fotos já usava `grid grid-cols-3 ... sm:grid-cols-6`
  e a grade de visual `grid grid-cols-2 ... sm:grid-cols-3 lg:grid-cols-4`,
  ambas responsivas. Os novos componentes (`StaleDataNotice`, `OfflineState`)
  são `max-w-md`/`w-full` com padding fluido, não causam overflow.
- `DecoratedAvatar` preservado integralmente — não tocamos no componente,
  z-index, object-contain, sizes, preview na loja/customização.

## Validação executada

- `bunx tsc --noEmit` — exit 0, sem erros.
- Análise estática: imports usados, nenhum hook movido de posição relativa,
  JSX balanceado em ambos os arquivos.
- Lint: não executado manualmente nesta etapa.

## Validação NÃO executada

- Não testei em iPhone/Android real.
- Não testei manualmente o toggle Airplane Mode no preview.
- Recomendado: o usuário verificar a) abrir `/perfil` aba Visual online,
  desligar a rede, abrir aba Visual de novo (deve aparecer notice + dados
  cacheados, botões Equipar/Remover desabilitados); b) abrir o app já
  offline, ir em Visual (deve aparecer `OfflineState`); c) tentar adicionar
  foto offline (tile mostra "Offline", clique em Adicionar não abre fluxo,
  toast aparece se algum caminho disparar).

## Confirmações

- Não mexi em banco, migrations, RLS, schema, auth.
- Não criei dados fake, fotos fake, itens fake, fila offline, persistência
  local de edição.
- Não alterei regra de compra, débito de moedas, `getMyCoins`, ou loja.
- Não toquei em `PhotoImg`, `DecoratedAvatar`, `photoUrl.ts`,
  `imageNormalize.ts`, `decorations.ts`, `profileBackgrounds.ts`,
  `nameGradients.ts`, `ProfileAdvancedForm`, preferências, dados principais
  do perfil, presentes, conquistas, cargos, admin, onboarding, pretendentes,
  conversas, devocional, notícias.
- Nenhuma biblioteca instalada. Sem Capacitor. Sem Workbox.
