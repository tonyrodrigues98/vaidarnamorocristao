# Providers, feature flags e uso residual da V2

## Árvore de providers no root

Ordem observada em `src/routes/__root.tsx`:

```text
QueryClientProvider
└── ThemeProvider
    └── SupabaseRuntimeBoundary
        └── AuthProvider
            └── V2AwareRouteBoundary
                └── RouteProtectionBoundary
                    └── AuthenticatedProviderBoundary
                        ├── PresenceProvider
                        ├── NotificationsBridge
                        ├── BanGuard
                        └── MobileAppShell / Outlet
```

Também são montados no root:

- `NetworkStatusBanner`
- `InstallPromptBanner`
- registro do service worker por `registerAppServiceWorker`
- React Query Devtools somente em desenvolvimento

## Responsabilidades

| Provider/boundary | Responsabilidade | Side effects/custo |
|---|---|---|
| `QueryClientProvider` | Cache e coordenação de queries | Cache global; a camada de auth limpa dados privados na troca/logout. |
| `ThemeProvider` | Tema claro/escuro | Persistência local; preferência do sistema só participa da inferência inicial. |
| `SupabaseRuntimeBoundary` | Resolver configuração pública do Supabase | Pode buscar `/api/public/runtime-config`; não expõe service role. |
| `AuthProvider` | Fonte canônica de sessão | `getSession`, `onAuthStateChange`, ações de auth e isolamento de cache. |
| `V2AwareRouteBoundary` | Aplicar flag de shell sem mudar contratos V1 | `/v2/*` volta a `/inicio` se a flag estiver desligada. |
| `RouteProtectionBoundary` | Proteção compartilhada | Loading sem conteúdo privado; redirects internos seguros. |
| `AuthenticatedProviderBoundary` | Adiar providers privados | Só monta presença, notificações e banimento após autenticação. |
| `PresenceProvider` | Presence e atividade | Canal Realtime, listeners de visibilidade e heartbeat. |
| `NotificationsBridge` | Atualização de notificações/cache | Canal Realtime autenticado. |
| `BanGuard` | Reação a estado de banimento | Query/efeitos privados. |
| `MobileAppShell` | Shell visual V1 | Headers, footer e navegação conforme pathname. |

## Feature flags

As flags usam contrato estrito: apenas booleano `true` ou string exata `"true"`
ativa uma capacidade. Ausência, valor inválido ou outro casing mantém `false`.

| Variável | Domínio |
|---|---|
| `VITE_FF_V2_APP_SHELL` | App Shell |
| `VITE_FF_V2_COMMUNITY` | Comunidade |
| `VITE_FF_V2_DATING` | Namoro |
| `VITE_FF_V2_MESSAGING` | Mensagens |
| `VITE_FF_V2_PROFILE` | Perfil |
| `VITE_FF_V2_ECONOMY` | Economia |
| `VITE_FF_V2_CUSTOMIZATION` | Personalização |
| `VITE_FF_V2_PETS` | Pets |
| `VITE_FF_V2_ADMIN` | Administração |
| `VITE_FF_V2_CINEMA` | Cinema |

Todas permanecem desativadas por padrão. Nenhuma foi modificada.

## Imports V2 fora de `src/v2`

| Consumidor V1/root | Import V2 | Classificação |
|---|---|---|
| `src/router.tsx` | `AppRouterContext` | Infraestrutura técnica em uso. |
| `src/lib/auth.tsx` | máquina de estado de sessão | Infraestrutura técnica em uso. |
| `src/routes/inicio.tsx` | `AuthenticatedRouteGate` | Compatibilidade técnica em uso; preserva `/inicio`. |
| `src/routes/__root.tsx` | build info, flags, proteção e integração | Infraestrutura técnica em uso; runtime visual permanece flagado. |
| `src/routes/v2.tsx` | integração do runtime V2 | Compatibilidade isolada em `/v2/*`. |
| `src/routes/v2.index.tsx` | contratos da entrada V2 | Compatibilidade isolada. |
| `src/routes/v2.$section.tsx` | seção visual V2 | Compatibilidade isolada. |

## Classificação das pastas V2

- **Técnica usada pela V1:** `src/v2/app/auth`,
  `src/v2/app/routing`, `src/v2/foundation` e contratos mínimos de integração.
- **Compatibilidade compilada e flagada:** `src/v2/integration` e rotas
  `/v2/*`.
- **Visual antiga, não usada por páginas V1:** `src/v2/app-shell` e
  `src/v2/design-system`; alcançáveis somente pelo runtime V2 flagado.
- **Não encontrado como runtime V1:** módulos visuais de produto V2 não são
  importados diretamente pelas páginas V1.

Nenhuma pasta ou arquivo V2 deve ser removido com base apenas neste inventário.

## PWA e offline

- `public/sw.js` é registrado com escopo `/`.
- O registro é evitado em preview, iframe e contextos equivalentes a
  desenvolvimento.
- O root apresenta estado de rede e prompt de instalação.
- Este lote não alterou cache, service worker, manifest ou comportamento
  offline.

## Referência visual

Não foi localizado arquivo, hash, export, screenshot ou URL imutável com o
identificador `vdn-community-prototype-01`. Existem apenas referências textuais
genéricas a protótipos/Work em documentação histórica.

**REFERÊNCIA VISUAL NÃO CONGELADA.**
