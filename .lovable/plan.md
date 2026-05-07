## Objetivo

Aproximar a sensação do site da fluidez de um app nativo iOS — respostas instantâneas ao toque, transições suaves, sem aquele "delay de webapp".

A lentidão percebida raramente vem de FPS baixo: vem de **3 fontes principais** que vamos atacar em camadas.

---

## 1. Resposta instantânea ao toque (a maior diferença percebida)

Hoje os botões/links só mostram efeito visual no `:hover`, e em mobile o navegador adiciona ~100-300ms de delay antes do clique. Isso é o que mais dá "sensação de webapp".

- Adicionar feedback visual **imediato no `:active`** (escala 0.96, opacidade 0.85) em todos os botões, cards e links interativos — igual ao "tap" do iOS.
- Adicionar `touch-action: manipulation` global para eliminar o delay de 300ms do double-tap.
- Adicionar `-webkit-tap-highlight-color: transparent` (já existe parcialmente) e substituir por highlight customizado.
- Criar utilitário `.tap` no `styles.css` com `transition: transform 80ms, opacity 80ms` + `:active { transform: scale(0.97) }`.
- Aplicar `.tap` (ou variante) no `Button` base (`src/components/ui/button.tsx`) e nos Cards clicáveis principais.

## 2. Navegação entre páginas com transição suave

Hoje a troca de rota é um "flash" — conteúdo some e o novo aparece bruscamente.

- Habilitar **View Transitions API** no router (`src/router.tsx`) usando `defaultViewTransition: true` do TanStack Router.
- Adicionar CSS `::view-transition` no `styles.css` com fade + leve slide (180ms, curva ease-out tipo iOS `cubic-bezier(.32,.72,0,1)`).
- Em rotas com loaders pesados, manter conteúdo antigo até o novo estar pronto (já é comportamento padrão do Router quando há View Transition).
- Pré-carregar rotas no hover/touch: `defaultPreload: 'intent'` no `createRouter` (já temos `defaultPreloadStaleTime: 0`, falta o `defaultPreload`). Isso faz dados/JS começarem a carregar quando o dedo encosta no link.

## 3. Animações com a "curva iOS" e sem jank

Substituir transições genéricas por timings que parecem nativos:

- Definir tokens CSS:
  - `--ease-ios: cubic-bezier(.32,.72,0,1)` (curva da Apple)
  - `--dur-fast: 120ms`, `--dur-base: 200ms`, `--dur-slow: 320ms`
- Reduzir durações longas (várias animações estão em 0.3s–0.8s — derrubar pra 150–250ms exceto fade-in inicial).
- Forçar `transform`/`opacity` em vez de `top`/`height` onde possível (o `.hover-lift` e `.animate-fade-up` já estão ok).
- Adicionar `will-change: transform` apenas durante interação (via classe `:active`) — não global, pra não comer GPU.

## 4. Scroll com inércia tipo iOS

- `-webkit-overflow-scrolling: touch` no `body` e em containers com scroll interno.
- `overscroll-behavior: contain` em modais/sheets pra não "vazar" scroll pro fundo.
- `scroll-behavior: smooth` no `html` pra navegação por âncora.

## 5. Inputs e formulários sem "delay fantasma"

- `font-size: 16px` mínimo nos inputs em mobile (evita zoom automático do iOS, que dá sensação de lag).
- `autocomplete`, `inputmode` e `enterkeyhint` corretos onde faltam — teclado abre mais rápido e com botão certo.
- Validar isso especialmente em `auth/login`, `auth/signup`, `admin/index`, `onboarding/etapa-*`.

## 6. Headers sticky / glass mais leves

O `.glass` usa `backdrop-filter: blur(14px)` — em scroll com muito conteúdo isso pode causar repaint pesado em mobile. Vamos:

- Manter o blur só no header principal (já é o caso).
- Garantir `transform: translateZ(0)` no header pra promover a uma camada GPU dedicada.

## 7. PWA / standalone polish (opcional, fase final)

Se quiser ir mais longe ainda em direção a "app":
- `manifest.webmanifest` com `display: "standalone"`, ícones, theme color.
- `apple-mobile-web-app-capable` meta + splash screens iOS.
- Permite "Adicionar à tela de início" e o site abre sem barra do Safari, indistinguível de um app.

---

## Arquivos que serão tocados

- `src/styles.css` — utilitário `.tap`, view-transition CSS, tokens de easing/duração, ajustes de scroll
- `src/router.tsx` — `defaultPreload: 'intent'`, `defaultViewTransition: true`
- `src/components/ui/button.tsx` — feedback `:active` no `buttonVariants`
- `src/routes/__root.tsx` — meta `apple-mobile-web-app-capable`, ajustes mobile-web-app
- (opcional fase 7) `public/manifest.webmanifest` + link no `__root.tsx`

## Detalhes técnicos

```css
/* styles.css — adições principais */
:root {
  --ease-ios: cubic-bezier(.32,.72,0,1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
}

html { touch-action: manipulation; scroll-behavior: smooth; }

.tap {
  transition: transform var(--dur-fast) var(--ease-ios),
              opacity   var(--dur-fast) var(--ease-ios);
}
.tap:active { transform: scale(.97); opacity: .85; }

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 220ms;
  animation-timing-function: var(--ease-ios);
}
```

```ts
// router.tsx
createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultViewTransition: true,
  scrollRestoration: true,
  defaultErrorComponent: DefaultErrorComponent,
});
```

## O que NÃO vamos fazer agora

- Não vamos reescrever páginas pra usar Framer Motion em massa (custo alto, ganho pequeno depois das mudanças acima).
- Não vamos transformar em PWA full offline — só o polish standalone, se você confirmar.
- Não vamos mexer em lógica de dados/Realtime — fluidez percebida vem de UI, não de queries (que já são rápidas).

## Pergunta antes de implementar

Quer incluir a **fase 7 (PWA standalone, "Adicionar à tela de início")** nesta entrega ou deixar para depois? Se sim, preciso de um ícone 512×512 (uso o favicon atual se não tiver outro).
