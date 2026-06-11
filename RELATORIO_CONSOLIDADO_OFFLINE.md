# Relatório Consolidado — Auditoria e Melhorias Offline/PWA

Este documento consolida todas as alterações reais aplicadas no projeto **Christian Connect / VaiDarNamoro** ao longo das tarefas de auditoria offline/cache desde o trabalho do PWA. Substitui/atualiza o `RELATORIO_OFFLINE_AUDIT.md` original.

## Sumário das tarefas

| # | Escopo | Status |
|---|---|---|
| 1 | Auditoria geral offline (`/bloqueados`, `/noticias`, `/devocional`, `/admin`) | Concluído |
| 2 | Perfil — Parte 1 (dados principais) | Concluído |
| 3 | Perfil — Parte 2 (fotos e visual) | Concluído |
| 4 | Loja — auditoria e guards offline | Concluído |
| 5 | Conta — settings app-like com offline awareness | Concluído |
| 6 | Notificações — central de atividades offline-safe | Concluído |
| 7 | Dashboard — refatoração para Analytics Center app-like | Concluído |

Toda implementação foi feita sem mexer em banco, migrations, RLS, schema, autenticação ou criar dados/permissões/itens/contadores fake. Nenhuma biblioteca foi instalada; nenhum Capacitor/Workbox usado.

---

## 1. Componentes/utilitários compartilhados criados

### `src/components/ui/StaleDataNotice.tsx`
Aviso âmbar discreto exibido no topo de páginas quando o usuário está **offline com cache** visível. Usa `WifiOff` + `role="status"` + `aria-live="polite"`. Suporta `message` e `className` customizados.

### Hooks já existentes reaproveitados
- `useNetworkStatus()` (`src/hooks/useNetworkStatus.ts`) — `isOnline` reativo.
- `OfflineState` (`src/components/ui/OfflineState.tsx`) — placeholder de tela cheia para offline sem cache.

---

## 2. /bloqueados

**Arquivo:** `src/routes/bloqueados.tsx`

- Migrado de `useEffect` para **`useQuery`** (`queryKey: ["blocked-users", userId]`).
- Desbloqueio migrado para **`useMutation`** com **optimistic update**.
- Fallback `OfflineState` quando offline sem cache.
- Realtime/refresh continua consistente via `invalidateQueries`.

---

## 3. /noticias

**Arquivo:** `src/routes/noticias.index.tsx`

- Migrado para `useQuery` com `staleTime: 60s`.
- Listeners realtime agora chamam `invalidateQueries` em vez de re-fetch manual.
- Cache compartilhado entre montagens.

---

## 4. /devocional

**Arquivo:** `src/routes/devocional.tsx`

- Helper `requireOnline()` interceptando **8 mutations**: reações, comentários, orações, reports.
- Quando offline, cada handler retorna com toast `"Disponível online…"` sem chamar o backend.
- Nenhuma alteração na lógica de leitura ou nas regras de moderação.

---

## 5. /admin

**Arquivo:** `src/routes/admin/index.tsx`

- Banner **"Modo somente leitura"** no topo do painel quando offline.
- Não tocou em permissões, RLS, ou edge cases administrativos sensíveis.
- `SENSITIVE_PATHS` do Service Worker continua protegendo a rota (sem cache HTML privado).

---

## 6. /perfil — Parte 1 (dados principais)

**Arquivo:** `src/routes/perfil.tsx`

### Mudanças
- Bloco de dados principais migrado para `useQuery`:
  - `queryKey: ["profile-main", user?.id]`
  - `staleTime: 60_000`, `gcTime: 30 * 60_000`, `enabled: !!user?.id`.
- `useEffect` que sincronizava estado local agora só dispara quando `!editingProfile` (preserva edição em andamento).
- `StaleDataNotice` abaixo de `AdminWarningBanner` quando offline com cache.
- `OfflineState` compacto quando offline sem cache.
- `saveProfile` e `savePrefs` verificam `!isOnline` antes do request:
  - Mostram `toast.error("Disponível online…")` e abortam.
  - Botões Salvar ficam `disabled` com label `"Salvar (offline)"` e `title` tooltip.
- Preferências (`profile_preferences`) mantidas em `useEffect` separado (fora do escopo da Parte 1).

### Escopo respeitado
Sem alterações em fotos, visual/customização, loja, banco, schema ou regras de moderação nesta parte.

---

## 7. /perfil — Parte 2 (fotos e visual)

**Arquivos:** `src/components/ProfilePhotosManager.tsx`, `src/routes/perfil.tsx` (aba Visual)

### Mudanças
- `ProfilePhotosManager` migrado para `useQuery(["profile-photos", userId])` para leitura.
- Mutations de upload/remover continuam, **bloqueadas offline** via guard `!isOnline` no início de cada handler com toast amigável.
- `CustomizacaoTab` (equipar/desequipar moldura, aura, fundo, gradiente) — todos os botões com guard offline; nenhum optimistic update offline; `DecoratedAvatar` nunca mostra item não salvo.
- Aba renomeada/padronizada como **"Visual"** (sem duplicidade "Customização").
- Sem nova fila offline; sem alteração em compra ou moedas.

---

## 8. /loja

**Arquivo:** `src/routes/loja.tsx`

### Auditoria (estado encontrado)
A loja **não usa TanStack Query** — toda leitura está em `useState`+`useEffect` (catalog, owned, balance, equipped, backgrounds, name gradients). Migrar tudo para `useQuery` reescreveria ~300 linhas de um arquivo de 1549 linhas → fora do escopo "seguro e controlado". Foram aplicadas correções cirúrgicas:

### Mudanças aplicadas
1. **Guards offline** em **6 handlers** de equip/desequip:
   - `handleEquip`, `handleUnequip` (decorations)
   - `handleEquipBackground`, `handleUnequipBackground`
   - `handleEquipNameGradient`, `handleUnequipNameGradient`
   - Cada um retorna com `toast.error("Disponível online. Reconecte-se para alterar seu visual.")` quando offline.
   - Compras (decoration/background/name-gradient) já tinham guard.

2. **StaleDataNotice** no topo do `<main>` quando `!isOnline && catalog.length > 0`:
   > "Você está offline. Mostrando itens carregados anteriormente. Compras e mudanças de visual estão indisponíveis."

3. **Disable de botões** offline (`|| !isOnline`):
   - Buy inline (frame/aura/background/name-gradient)
   - Equip inline
   - Buy nos diálogos de confirmação (decoration + background)

4. `PullToRefresh` já estava com `disabled={!user || !isOnline}` — mantido.
5. `OfflineState` continua sendo mostrado quando offline + catálogo vazio.

### Observação honesta
A migração completa para `useQuery` com `["shop-catalog"]`, `["user-balance", userId]`, `["user-inventory", userId]`, `["equipped-items", userId]` é viável mas requer tarefa dedicada (refatorar 10+ `useState`, transformar mutations em `useMutation` com `onSuccess`+`invalidateQueries`).

---

## 9. /conta — Settings app-like

**Arquivo:** `src/routes/conta.tsx`

### Estado encontrado
Página já estava bem estruturada como settings nativo (SettingsGroup + SettingsItem, ícone + título + descrição + chevron, mini card de perfil no topo, grupos: Equipe/Perfil e segurança/Preferências/Suporte e documentos/Sessão/Zona de perigo).

### Mudanças aplicadas
1. **`StaleDataNotice`** no topo quando `!isOnline`:
   > "Você está offline. Algumas ações de conta ficam disponíveis somente online."

2. **Zona de perigo** offline:
   - Banner vermelho próprio: "Disponível online. Reconecte-se para alterar dados de segurança ou excluir a conta."
   - `AccountDangerZone` recebe wrapper com `pointer-events-none opacity-60` + `aria-disabled` quando offline.

3. **Tema light/dark** continua via `useTheme()` em `src/lib/theme.tsx` — **local (localStorage), funciona 100% offline**, caminho principal em /conta → Preferências.

4. **Admin** continua aparecendo apenas para staff real (`role !== "user"` de `useAuth()`, baseado em `user_roles`). Sem fallback fake.

5. **Logout** mantido funcional (Supabase signOut limpa sessão local mesmo offline; handler tem try/catch com toast).

### Estrutura final
| Grupo | Itens | Destino real |
|---|---|---|
| Mini card | usuário | `/perfil` |
| Equipe (staff) | Painel administrativo | `/admin` |
| Perfil e segurança | Perfil / Verificação / Bloqueados | `/perfil`, `/verificacao`, `/bloqueados` |
| Preferências | Notificações / Tema (Switch) | `/notificacoes`, local |
| Suporte e documentos | Suporte / Manual / Termos | `/suporte`, `/manual`, `/termos` |
| Sessão | Sair | onClick → `signOut()` |
| Zona de perigo | Desativar/excluir | inline (3 etapas) |

Todas as rotas confirmadas existentes. Sem links quebrados. Sem rota `/privacidade` criada.

---

## 10. /notificacoes — Central de Atividades

**Arquivo:** `src/routes/notificacoes.tsx`

### Estado encontrado
Já praticamente uma central de atividades:
- `useNotifications` em `src/lib/notifications.tsx` com `queryKey: ["notifications", userId, limit]`, `staleTime: 30s`, realtime via canal Supabase aplicando `setQueriesData` (sem refetch).
- Tipos reais mapeados em `iconMeta()`: `interest`, `match`, `message`, `profile_approved`, `profile_verified`, `anonymous_*` (message/hint/reply/reveal/report), `gift`/`gift_received`, `devotional`, `news`/`noticia`, `community`/`conversation`, `system`.
- Mutations: `markRead`, `markAllRead` (rpc `mark_all_notifications_read`), `remove`.
- UI: resumo compacto, chips Todas/Não lidas, agrupamento Hoje/Ontem/Esta semana/Anteriores, swipe-to-delete com undo 5s, empty states, `OfflineState` quando vazio offline, `EnableNotificationsCard` para push.

### Mudanças aplicadas
1. **Guards offline** em ações:
   - `handleMarkAll`: toast `"Disponível online. Reconecte-se para atualizar suas atividades."`
   - `handleDelete`: toast `"Disponível online. Reconecte-se para apagar notificações."`
   - `onClick`: só chama `markRead` se `isOnline` (navegação continua via TanStack Router).
   - Botão "Marcar todas" ganhou `disabled={markingAll || !isOnline}`.

2. **`StaleDataNotice`** no topo quando `!isOnline && visible.length > 0`.

3. **Rewrite de links legados** via helper `rewriteNotificationLink`:
   - `/dashboard*` → `/inicio*`
   - `/comunidade*` → `/conversas`
   - Outros: intactos.

`useNotifications` e suas mutations/realtime **não foram alterados** — toda mudança ficou na camada de página.

---

## Padrão final offline aplicado em todas as páginas

| Situação | UI |
|---|---|
| Online | Comportamento normal |
| Offline + cache | `StaleDataNotice` discreto no topo + dados visíveis + ações sensíveis bloqueadas |
| Offline + sem cache | `OfflineState` de tela cheia |
| Pull-to-refresh offline | `PullToRefresh disabled={!isOnline}` |
| Mutations offline | Guard no handler + toast amigável + nenhum optimistic / nenhuma fila |

## O que NÃO foi alterado

- **Banco / migrations / RLS / schema** — zero alterações.
- **Autenticação** (`src/lib/auth.tsx`), `useTheme`, clientes Supabase.
- **`useNotifications`** (mutations + realtime).
- **`AccountDangerZone`** internamente.
- **Service Worker** (`public/sw.js`) — `SENSITIVE_PATHS` continua protegendo páginas privadas; offline é resolvido via React/TanStack Query, não via cache de respostas privadas.
- **Edge functions / Supabase functions.**
- Onboarding, pretendentes, matches, conversas (chat realtime), recados, push internals, presentes/moedas, regras de match/interesse.

## Validação técnica

- `bunx tsc --noEmit` rodado após cada parte → **exit 0** sem erros.
- Revisão estática: imports OK, sem variáveis não usadas, nenhum emoji em código.
- Sem novas dependências (`bun add` não foi usado).
- Sem alterações em `package.json` / `bun.lockb`.

## Validações NÃO feitas (honestidade)

- **Não testado em iPhone/Android real.** Instalação PWA, "modo avião" no aparelho, e comportamento do Service Worker em browsers móveis reais precisam de validação humana.
- Não rodei `npm run build` manualmente (o harness do dev server cobre isso automaticamente).
- Não houve testes E2E / Vitest específicos para os novos guards offline.

## Arquivos alterados (consolidado)

**Criados:**
- `src/components/ui/StaleDataNotice.tsx`
- `RELATORIO_OFFLINE_AUDIT.md` (original, mantido)
- `RELATORIO_PERFIL_OFFLINE.md`
- `RELATORIO_PERFIL_OFFLINE_PARTE2.md`
- `RELATORIO_LOJA_OFFLINE.md`
- `RELATORIO_CONTA_SETTINGS.md`
- `RELATORIO_NOTIFICACOES_OFFLINE.md`
- `RELATORIO_CONSOLIDADO_OFFLINE.md` (este documento)

**Editados:**
- `src/routes/bloqueados.tsx`
- `src/routes/noticias.index.tsx`
- `src/routes/devocional.tsx`
- `src/routes/admin/index.tsx`
- `src/routes/perfil.tsx`
- `src/routes/loja.tsx`
- `src/routes/conta.tsx`
- `src/routes/notificacoes.tsx`
- `src/components/ProfilePhotosManager.tsx`
- `src/routeTree.gen.ts` (auto-gerado pelo plugin)
- `src/routes/dashboard.tsx`

---

## Mudanças por data

Datas relativas à sessão de trabalho atual (11/06/2026). O projeto usa sincronização bidirecional com GitHub via integração Lovable; commits/PRs individuais não são gerados manualmente pelo agente, portanto **não há URLs diretas de commit/PR para anexar** aqui. Para auditar diffs reais, consultar o histórico do repositório GitHub conectado (aba *Code → History* em cada arquivo abaixo).

| Data | Escopo | Arquivos principais editados |
|---|---|---|
| 11/06/2026 | Auditoria offline geral | `src/routes/bloqueados.tsx`, `src/routes/noticias.index.tsx`, `src/routes/devocional.tsx`, `src/routes/admin/index.tsx`, `src/components/ui/StaleDataNotice.tsx` (novo) |
| 11/06/2026 | Perfil — Parte 1 (dados principais) | `src/routes/perfil.tsx` |
| 11/06/2026 | Perfil — Parte 2 (fotos e visual) | `src/routes/perfil.tsx`, `src/components/ProfilePhotosManager.tsx`, `src/components/CustomizacaoTab.tsx` |
| 11/06/2026 | Loja — guards offline | `src/routes/loja.tsx` |
| 11/06/2026 | Conta — settings offline-aware | `src/routes/conta.tsx` |
| 11/06/2026 | Notificações — central offline-safe | `src/routes/notificacoes.tsx` |
| 11/06/2026 | Consolidação documental | `RELATORIO_CONSOLIDADO_OFFLINE.md`, `RELATORIO_OFFLINE_AUDIT.md` |

> **Honestidade:** não há tags Git, números de PR ou SHAs disponíveis para o agente neste ambiente. Se forem necessários links clicáveis, eles devem ser preenchidos manualmente após localizar os commits correspondentes no GitHub conectado.

---

## Checklist de validação

| Item | Resultado | Observação |
|---|---|---|
| `bunx tsc --noEmit` após cada parte | ✅ exit 0 | Última execução: agora, exit 0 sem output (sessão atual) |
| `npm run build` / `bun run build` manual | ❌ não executado | O harness do Lovable roda build automaticamente após cada edição; nenhum build manual foi disparado pelo agente |
| Análise estática (leitura de cada rota editada) | ✅ feita | Confirmação de imports, hooks, JSX balance |
| Testes E2E / Vitest para guards offline | ❌ não criados | Nenhum teste novo escrito |
| Teste em dispositivo real (iPhone/Android) | ❌ não realizado | Apenas verificação via tipos e leitura de código |
| Lighthouse / PWA audit | ❌ não executado | Fora do escopo desta tarefa |
| Service Worker regenerado | ❌ não alterado | Nenhuma mudança em `vite.config`/SW |
| Banco/Supabase/migrations | ❌ não tocado | Nenhuma migration criada ou alterada |
| Dados fake (saldo, inventário, notificações, permissões) | ❌ não criados | Confirmação por leitura: nenhum mock/seed adicionado |
| Fila offline de mutações | ❌ não criada | Mutações sensíveis apenas **bloqueadas** offline com toast |

### Como reproduzir a validação localmente

```bash
bunx tsc --noEmit          # typecheck estrito (esperado: exit 0)
bun run build              # opcional: build de produção
```

Para validação manual offline:
1. Abrir DevTools → Network → Offline.
2. Navegar para `/perfil`, `/loja`, `/conta`, `/notificacoes`, `/bloqueados`.
3. Confirmar `StaleDataNotice` quando há cache, `OfflineState` quando não há.
4. Tentar mutações sensíveis (salvar perfil, comprar, equipar, marcar como lida, excluir conta) e confirmar toast `"Disponível online. Reconecte-se…"`.
