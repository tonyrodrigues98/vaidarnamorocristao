
# Plano: desempenho e sensação iOS nativo

Foco: deixar o app rápido, fluido e indistinguível de um app iOS — sem tocar em banco, RLS, schema, regras de negócio, chat realtime, uploads, ou criar dados fake. Tudo é otimização de runtime, rede, render e UX.

Dividido em 3 níveis de impacto, do maior para o menor.

---

## NÍVEL 1 — Ganhos grandes (a maior parte da sensação "nativa" vem daqui)

### 1.1 Bundle e code-split por rota
Hoje o app tem rotas gigantes que entram juntas no bundle inicial. Pesos atuais:
- `src/routes/admin/index.tsx` — 3889 linhas
- `src/routes/perfil.tsx` — 1618
- `src/routes/loja.tsx` — 1549
- `src/routes/conversas/comunidade.tsx` — 1528
- `src/routes/onboarding/index.tsx` — 1461
- `src/routes/devocional.tsx` — 1443
- `src/routes/inicio.tsx` — 1265

Ações:
- Garantir code-splitting automático do TanStack (não exportar `function Page()` em rotas — manter como `function` privada dentro do arquivo) para que o componente vire chunk separado.
- Mover bibliotecas pesadas usadas só em poucas rotas para `import()` dinâmico:
  - `recharts` (apenas `/dashboard`) → `React.lazy` + `Suspense`.
  - `framer-motion` (poucas telas) → importar só onde anima de verdade.
  - `face-api.js` + arquivos em `public/models/` → carregar só quando o usuário entra em verificação/upload de foto.
  - `heic2any` → `await import("heic2any")` apenas quando detecta arquivo HEIC.
  - `embla-carousel-react` → manter só em rotas que usam.
- Dividir `admin/*` em chunks pequenos: cada subrota admin já é um arquivo, mas o splitter precisa de componentes não exportados.

### 1.2 Imagens (LCP e scroll suave)
Hoje `PhotoImg` retorna `<img src={signedUrl}>` sem dimensões nem `decoding`/`loading`/`fetchpriority`.

Ações:
- Em todo `PhotoImg`/`<img>`: adicionar `width`, `height` (ou `aspect-ratio` no wrapper), `decoding="async"`, `loading="lazy"` (exceto na primeira foto visível, que recebe `fetchpriority="high"` e `loading="eager"`).
- Cards de pretendentes/matches/recados/feed: fixar `aspect-[4/5]` (já fazem) e adicionar `width`/`height` no `<img>` para o navegador reservar espaço (zero CLS).
- `head().links` da rota raiz / `/inicio` / `/pretendentes`: `rel="preload" as="image"` apenas para a imagem LCP real.
- Servir thumbnails menores para listagem (usar transform do Supabase Storage: `?width=400&quality=70` em `getPublicUrl`/signed URL onde aplicável).
- `<link rel="preconnect">` para o host do Storage no `__root.tsx`.

### 1.3 Listas longas — virtualização
Telas com chat e feeds longos (`/conversas/comunidade`, `/conversas/$matchId`, `/notificacoes`, `/pretendentes`) renderizam centenas de DOM nodes.

Ações:
- Avaliar virtualização sem nova dependência: `react-window` já costuma existir em projetos shadcn; se não, manter abordagem manual com `IntersectionObserver` + janela visível.
- Mensagens antigas: paginação por scroll reverso, mantendo no DOM só ~50 mensagens.
- `/pretendentes`: paginar em blocos de 20–30 e descartar imagens fora da viewport.

### 1.4 Realtime / Supabase — higiene
Cada tela hoje abre seu próprio canal Realtime e refaz `select` no `useEffect`. Em mobile isso pesa em rede e bateria.

Ações:
- Centralizar canais por entidade num provider único (notificações, conversas, presença) — reaproveitar em vez de criar/derrubar canal a cada navegação.
- Trocar `useEffect`+`supabase.from(...)` ad-hoc por **TanStack Query** (já instalado) com `queryKey` + `staleTime`. Resultado: navegação instantânea entre telas já visitadas, sem nova requisição.
- Eventos Realtime invalidam a query, não disparam `await select(...)` inline.

---

## NÍVEL 2 — Sensação "iOS nativo"

### 2.1 Empacotar com Capacitor (opcional, mas é o salto real para iOS)
A coisa mais próxima de "app iOS" não é PWA — é Capacitor. O app continua sendo o mesmo TanStack Start, com:
- Splash screen e ícone nativos.
- Status bar e safe-area integradas.
- Haptics (`@capacitor/haptics`) — vibração tátil em tap, match, recado enviado.
- Push nativo via APNs (substitui Web Push no iOS, que é frágil).
- Câmera nativa para upload de foto.
- Deep links e share sheet do iOS.
- Distribuível na App Store / TestFlight.

Plano só prepara a estrutura; publicar exige conta Apple Developer (decidir depois).

### 2.2 Gestos e transições
- **Swipe-back** (voltar arrastando da borda) — implementar via `touchstart`/`touchmove` no shell mobile, integrando com `router.history.back()`.
- **Transição de rota iOS-like**: page-slide horizontal entre telas filhas (push) e fade no topo (modal). Hoje existe `MobileRouteTransition`; refinar timing para 280–320ms com curva `cubic-bezier(0.32, 0.72, 0, 1)` (curva oficial do iOS) e desativar em rotas que não fazem sentido (modais).
- **Pull-to-refresh** já existe — calibrar threshold e resistência para o padrão iOS.
- **Tap highlight**: globalmente `-webkit-tap-highlight-color: transparent` + estado `:active` com escala `0.97` (já parcialmente feito via `app-pressable`).
- **Momentum scroll**: garantir `overflow-y: auto` + `-webkit-overflow-scrolling: touch` em todos os scrollers internos.

### 2.3 Bottom nav, safe-area e teclado
- Bottom nav já respeita `env(safe-area-inset-bottom)` — verificar todas as outras telas (chat, modais).
- Em entradas de texto, usar `visualViewport` (já feito no chat) para todas as telas com input fixo.
- Inputs com `font-size: 16px` mínimo (iOS evita zoom automático).
- `<meta name="viewport" content="viewport-fit=cover, ...">` para o app ocupar a área embaixo do notch.

### 2.4 Tipografia e renderização
- `font-display: swap` em todas as `@font-face`.
- Pré-carregar a fonte principal via `<link rel="preload" as="font" crossorigin>` no `__root.tsx`.
- `-webkit-font-smoothing: antialiased` no body para a renderização "iOS-like".

### 2.5 PWA — manter limpa
PWA atual (`public/sw.js`, `public/manifest.webmanifest`) já existe. Não vamos reescrever. Apenas:
- Garantir `display: "standalone"`, `theme_color`, `background_color`, `apple-touch-icon` corretos.
- Não tocar em SW além de checar se não está cacheando HTML cache-first (causa de tela branca após deploy).

---

## NÍVEL 3 — Polimento e medição

### 3.1 Medição contínua
- Rodar `browser--performance_profile` antes e depois para ter LCP/CLS/INP do `/inicio` e `/pretendentes` mobile (390x844).
- Profilar `/conversas/comunidade` (a maior tela de runtime) com `start_profiling` + scroll.

### 3.2 Componentes pesados
- Memoizar listas de cards (`React.memo` + chave estável) para evitar re-render do feed ao receber um evento Realtime.
- `useDeferredValue`/`useTransition` no input do `/pretendentes` (filtros) e busca.
- Reduzir Radix duplicado: `Dialog`/`Sheet`/`Drawer` muitas vezes fazem a mesma coisa — escolher um por contexto.

### 3.3 Dados reais sob demanda
- `lib/photoUrl`: cachear signed URLs em memória + `sessionStorage` com TTL próximo da validade real do token. Hoje cada `<PhotoImg>` revalida.
- `usePushNotifications`, `usePresence`: garantir que registram listeners uma única vez no app, não por tela.

### 3.4 Build/CDN
- `vite.config.ts`: confirmar `build.target: "es2022"` (Safari iOS recente suporta) para gerar bundles menores sem polyfill.
- `manualChunks` para isolar `recharts`, `framer-motion`, `face-api` cada um em seu chunk.

---

## O que NÃO está no plano (proteções)
- Banco, migrations, RLS, schema — intocado.
- Regras de match, interesse, recado anônimo, loja, moedas, presentes — intocadas.
- Service Worker — apenas verificado, não reescrito.
- Onboarding lógica — intocada.
- Sem nova biblioteca, exceto se você aprovar Capacitor (NÍVEL 2.1).

---

## Sugestão de execução em fases
1. **Fase 1 (alto impacto, baixo risco)**: 1.1 code-split + lazy de `recharts`/`face-api`/`heic2any` + 1.2 imagens + 2.3 safe-area/teclado.
2. **Fase 2**: 1.4 TanStack Query como camada padrão de leitura + 2.2 transições e gestos.
3. **Fase 3**: 1.3 virtualização de listas + 3.x medição e polimento.
4. **Fase 4 (opcional)**: 2.1 Capacitor → iOS de verdade.

## Decisões que preciso de você antes de implementar
1. Quer que eu já comece pela **Fase 1** completa, ou prefere ir item por item?
2. Capacitor entra ou fica fora? (decide se preparo estrutura iOS agora ou não)
3. Posso adotar **TanStack Query** como padrão de leitura nas telas mais quentes? (já está instalado, mas a maior parte do app usa `useEffect`+`supabase` direto)
