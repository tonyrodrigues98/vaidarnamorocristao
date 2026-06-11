# Relatório — /dashboard como Analytics Center

## Arquivos alterados
- `src/routes/dashboard.tsx` — refatoração completa (UI, TanStack Query, offline, performance).

Nenhum outro arquivo foi modificado. `DashboardCharts.tsx` permaneceu intacto (já estava bem isolado).

---

## Auditoria do estado anterior

### Métricas reais já carregadas
- `profile_views` (últimos 30 dias, fixo) — visitas, únicas, tendência 7d vs 7d anterior, faixa etária, top cidades.
- `interests` — contagem total recebida.
- `matches` — lista (para derivar `unread`).
- `messages` — contagem `unread` por `match_id IN (...)`.
- `daily_posts` (kind=news, published) — última notícia.
- `profiles` — status do próprio usuário + `equipped_name_gradient_id`.

### Queries
- Todas via `useEffect` + `supabase.from(...)` direto. Sem `useQuery`.
- Sem `staleTime`, sem `refetchOnReconnect`, sem `queryKey` estável.

### Recharts / bundle
- Já estava lazy via `React.lazy(() => import("@/components/dashboard/DashboardCharts"))` com `<Suspense fallback={...}>`. **Mantido**.

### Problemas encontrados
- Sem filtro de período (fixo 30d).
- Sem offline awareness.
- Grid `sm:grid-cols-2 lg:grid-cols-4` em KPIs — empilhava demais no mobile (1 coluna < 640px).
- Cards grandes (`p-5`, `text-3xl`) com cara de landing.
- Hero `text-4xl font-black` desperdiçando espaço acima da informação.
- Gráficos sempre renderizam, mesmo com `views.length === 0`.
- Sem seção "Atenção necessária".
- `useState`/`useEffect` triplo, sem dedupe entre montagens.

Não havia dados/gráficos fake. Não havia duplicidade com `/inicio` (são telas distintas).

---

## Estrutura final do /dashboard

```
Header
  ├─ "Dashboard"
  ├─ "Sua atividade e evolução"
  └─ "<Nome> · métricas dos N dias"
StaleDataNotice (somente offline + cache)
Period chips: [7d] [30d] [90d] [Tudo]
Status card (pending/approved/rejected/banned)
[se aprovado]
  ProfileCompletenessAlert
  OfflineState (somente offline sem cache)
  KPIs (grid 2 mobile / 4 desktop): Visitas | Tendência 7d | Interesses | Matches
  Atenção necessária (mensagens não lidas, interesses) ou "Tudo certo por aqui."
  Tendências (Recharts lazy) — só renderiza se totalViews > 0
    fallback: "Dados insuficientes para exibir tendência."
  Visitantes recentes
Última notícia (se houver)
Atalhos (grid 2/3/4): /perfil /conversas /pretendentes /interesses /matches /noticias
```

`/dashboard` continua existindo, não redireciona para `/inicio`, e `/inicio` não foi tocado.

---

## TanStack Query

Três queries com chaves estáveis:

| queryKey | enabled | staleTime |
|---|---|---|
| `["dashboard-profile", userId]` | `!!user` | 60s |
| `["dashboard-latest-news", userId]` | `!!user` | 60s |
| `["dashboard-metrics", userId, period]` | `!!user && profile.status === "approved"` | 30s |

Todas com `refetchOnReconnect: true`. `period` entra na chave porque o range de `profile_views.gte("created_at", since)` muda com ela.

Migrei `useEffect`+`supabase.from` para `useQuery` em todas as leituras. Mantidas as **mesmas tabelas e colunas** — nenhuma query nova, nenhuma RPC nova, nada no banco mudou.

---

## Performance

- **Recharts continua lazy** via `React.lazy`/`Suspense`. Nada foi importado de `recharts` em `dashboard.tsx`.
- **Gating real**: charts só montam quando `totalViews > 0`. Antes renderizavam com array vazio.
- **Memoização**: `dailySeries`, `ageBucketSeries`, `topCities`, `uniqueViewers`, `last7`, `prev7`, `recentVisitors` em `useMemo` (já existia; mantido + dep `periodDays` adicionada).
- **Dedupe de fetch entre montagens** via cache do TanStack Query (antes recarregava em todo mount).
- Skeletons leves substituíram tela branca durante `profileQuery.isLoading`.
- Sem nova dependência instalada.

---

## Offline

- `useNetworkStatus()` lê `navigator.onLine`.
- **Offline com cache**: `<StaleDataNotice message="Você está offline. Mostrando métricas carregadas anteriormente." />` no topo.
- **Offline sem cache + aprovado**: `<OfflineState title="Métricas indisponíveis offline" ... />` no lugar dos KPIs/charts.
- **Offline sem perfil carregado**: `<OfflineState title="Dashboard indisponível offline" />` em vez de redirecionar para `/onboarding`.
- **Chips de período**: `disabled` quando offline e sem cache (evita disparar fetch que vai falhar).
- Nenhuma fila offline. Nenhuma mutação no dashboard (só leitura).

---

## Admin vs usuário comum

Auditado: o `/dashboard` atual é **pessoal** (lê `viewed_id = user.id`, `receiver_id = user.id`, `user_a/user_b = user.id`). Não há query global de admin existente, nem RPC agregada de plataforma. **Não criei métricas globais fake**. Mantive o foco em "Sua atividade e evolução". Caso queira visão admin no futuro, sugiro adicionar RPCs agregadas (`count_users`, `count_pending_profiles` etc.) em migration dedicada e ramificar por `has_role(uid, 'admin')` — isso ficou de fora desta tarefa por princípio (sem inventar métricas, sem mexer em banco).

Permissão real usada: `profile.status === "approved"` (mesma que o código original).

---

## UI / Mobile

- KPI grid: `grid-cols-2` no mobile (antes era 1 coluna), `sm:grid-cols-4`. Cards compactos (`p-4`, `text-2xl`).
- Header com `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `truncate` (sem overflow).
- Chips de período com `overflow-x-auto` + `shrink-0`.
- Atalhos compactos (`grid-cols-2` mobile → `sm:grid-cols-3` → `lg:grid-cols-4`).
- `pb-24` no main para não colidir com bottom nav.
- Nenhum `w-screen`. Nenhum `overflow-hidden` global.
- `tabular-nums` nos valores grandes.

Sem emojis no código. Sem novas libs.

---

## Validação

- `bunx tsc --noEmit` → **exit 0**, sem erros nem warnings.
- `npm run build` manual: **não executado** (o harness do Lovable roda build automaticamente após a edição).
- Análise estática: leitura do arquivo após escrita; imports balanceados; JSX balanceado; sem variáveis órfãs.

---

## Confirmações honestas

- Não mexi em banco, migrations, RLS, schema, autenticação.
- Não criei métricas/gráficos/contadores/dados/permissões fake.
- Não alterei `/inicio`.
- Não redirecionei `/dashboard`.
- Não removi `/dashboard`.
- Não criei fila offline.
- Não instalei biblioteca nova.
- Não usei Capacitor/Workbox/emojis.
- **Não testei em iPhone/Android real.** Validação só por typecheck e leitura do código.
