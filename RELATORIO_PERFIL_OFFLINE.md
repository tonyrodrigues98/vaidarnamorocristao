# Relatório — Etapa 1: /perfil offline/cache (dados principais)

## Escopo desta etapa

Apenas o carregamento dos dados principais do perfil exibidos no hero / card / aba "Sobre mim":
`full_name`, `age`, `height_cm`, `sex`, `marital`, `city`, `state`, `church`,
`years_baptized`, `bio`, `photo_url` (apenas como preview de leitura), `status`,
`equipped_name_gradient_id`.

Não foram tocados: upload de fotos, `ProfilePhotosManager`, `CustomizacaoTab`,
molduras, auras, fundos, presentes, saldo/moedas, conquistas, cargos, loja, admin.

## Arquivos alterados

- `src/routes/perfil.tsx` — migrou o load principal para `useQuery`,
  adicionou notice offline com cache, estado offline sem cache e
  bloqueio dos botões de salvar offline.

Nenhum outro arquivo foi alterado. Nenhuma migration, nenhuma mudança de
schema/RLS/auth, nenhuma biblioteca nova instalada.

## O que foi migrado para TanStack Query

- Antes: um `useEffect([user])` único disparava em paralelo
  `supabase.from("profiles").select("*")` e `supabase.from("profile_preferences").select("*")`,
  populando o estado local via `setProfile(...)` / `setPrefs(...)`.
- Agora: a leitura de `profiles` (dados principais) virou `useQuery`:

  ```ts
  useQuery({
    queryKey: ["profile-main", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  ```

- O `useEffect` de `profile_preferences` foi mantido (fora do escopo desta
  etapa), apenas isolado em seu próprio efeito.
- O carregamento do gradiente do nome (`fetchNameGradientsByIds`) ficou em
  um efeito separado consumindo o `profileMainQuery.data`.

### queryKey usada

`["profile-main", user?.id]` — sempre inclui o `userId`, e `enabled: !!user?.id`
impede a query de rodar sem usuário autenticado.

### Cache

- `staleTime: 60_000` — voltar para `/perfil` em menos de 60s renderiza
  imediato sem refetch.
- `gcTime: 30 * 60_000` — mantém o cache em memória por 30 min mesmo
  trocando de rota, evitando tela em branco ao reabrir.

## Preservação do estado de edição

O `setProfile({...})` agora vem de um `useEffect` que observa `profileMainQuery.data`
E `editingProfile`. Quando o usuário está editando (`editingProfile === true`),
a sincronização é ignorada — o que ele digitou não é sobrescrito por um refetch
em background. Quando ele fecha a edição (salvando ou cancelando) a próxima
passagem do efeito repopula com os dados frescos do servidor.

O `photoPreview` só é atualizado a partir do servidor quando não há `photoFile`
local pendente, para não apagar a preview de um upload em andamento.

## Comportamento offline

### Offline com cache (já visitou a página antes nesta sessão)

- A UI continua renderizando normalmente com os dados do cache do React Query.
- Um aviso discreto `StaleDataNotice` aparece logo abaixo do `AdminWarningBanner`:
  "Você está offline. Mostrando informações carregadas anteriormente."
- Nenhuma tela branca, nenhum reset de campos.

### Offline sem cache (entrou direto offline)

- Renderiza `OfflineState` compacto no topo:
  "Perfil indisponível offline. Abra esta tela conectado para carregar seus dados."
- O restante do hero permanece visível com placeholders (`"--"`), como já era
  o comportamento natural quando `profile` está vazio. Nada quebra.

### Botões bloqueados offline

- "Salvar sobre mim" — `disabled` quando `!isOnline`, label muda para
  "Salvar (offline)", `title` mostra "Disponível online. Reconecte-se para
  salvar alterações.".
- "Salvar preferências" — mesmo tratamento.
- Além do `disabled`, as funções `saveProfile` e `savePrefs` têm um guard
  no início: se `!isOnline`, exibem `toast.error("Disponível online...")` e
  abortam antes de tocar qualquer endpoint. Isso protege contra qualquer
  caminho que ignore o `disabled` (ex.: enter no form).

### O que continua igual online

- `saveProfile` segue idêntico (upload de foto, verificação por IA, upsert
  em `profiles`, `recomputeMyBadges`, `advancedAboutRef.saveAdvanced()`).
- `savePrefs` segue idêntico (upsert em `profile_preferences` + advanced prefs).
- Nenhum nome de campo, nenhum payload, nenhuma regra de negócio alterada.
- O card de completude (`HomeStarterSection`) continua lendo `user.id` e
  consultando os mesmos dados — não foi alterado e não cai para 0%.

## O que NÃO foi tocado (confirmações)

- Fotos/upload: `ProfilePhotosManager`, `PhotoImg`, `handlePhoto`,
  `verifyProfilePhoto`, `photo_moderation_queue` — intactos.
- Visual/customização: `CustomizacaoTab`, `DecoratedAvatar`, molduras, auras,
  fundos, gradientes (apenas leitura via efeito separado) — intactos.
- Loja/saldo/moedas/presentes: `SaldoTab`, `ReceivedGiftsTab` — intactos.
- Conquistas/cargos: `MissionsPanel`, `RoleBadge`, aba `role`, `saveRoleSettings`,
  `togglePublicListing`, `toggleContribHighlight` — intactos.
- Onboarding, `ProfileAdvancedForm`, `ProfileAdvancedView` — intactos.
- Banco / Supabase / migrations / RLS / schema / auth — não alterados.
- Nenhum dado fake, nenhum mock, nenhuma fila offline, nenhuma persistência
  local de edição. Não há Capacitor, não há Workbox, nenhuma dependência nova.

## Validação executada

- `bunx tsc --noEmit` — exit 0, sem erros.
- Análise estática: imports usados, sem variáveis órfãs introduzidas, JSX
  balanceado, hooks na ordem correta (mesma posição relativa do antes).

## Validação NÃO executada

- Não testei em iPhone/Android real.
- Não testei manualmente o toggle "Airplane Mode" no preview.
- Recomendado: o usuário verificar no preview a) abrir `/perfil` online,
  navegar para outra rota e voltar (deve aparecer instantâneo),
  b) cortar a rede no devtools e recarregar (deve ver `OfflineState` ou
  `StaleDataNotice` dependendo do cache), c) ficar offline e tentar salvar
  (botão desabilitado + toast).

## Próximas etapas sugeridas (fora deste escopo)

- Migrar `profile_preferences` para `useQuery` com `queryKey: ["profile-prefs", userId]`.
- Migrar `user_badges` / `contributor_highlight` para `useQuery`.
- Migrar `getActiveCommitmentByUser` e o lookup de parceiro.
- Avaliar fotos/customização separadamente, etapa por etapa.
