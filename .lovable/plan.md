## Objetivo
Fazer o PWA do VaiDarNamoro parecer **100% app nativo** quando instalado no iOS e Android, sem App Store e sem Capacitor. Aproveitar o que já existe (manifest standalone, SW, meta Apple, `InstallAppButton`, `usePwaInstall`) e polir os pontos que ainda denunciam "é um site".

## O que muda

### 1. Remover o Capacitor (não vamos usar)
- Desinstalar: `@capacitor/core`, `cli`, `ios`, `android`, `haptics`, `status-bar`, `splash-screen`, `push-notifications`, `app`, `keyboard`.
- Deletar: `capacitor.config.ts`, `public/capacitor-fallback/`, `src/lib/native.ts`, `CAPACITOR.md`.
- Remover scripts `cap:*` do `package.json`.
- Remover `initNativeShell()` do `src/routes/__root.tsx`.

### 2. Splash screens iOS (acaba a tela branca ao abrir)
- Gerar splash com o logo centralizado em fundo `#fff7f8` nas resoluções que o iOS exige (iPhone SE até Pro Max, retrato), salvar em `public/splash/`.
- Adicionar `<link rel="apple-touch-startup-image" media="..." href="...">` no `__root.tsx` com a `media query` correta de cada device.

### 3. Status bar edge-to-edge no iOS
- Trocar `apple-mobile-web-app-status-bar-style` de `default` para `black-translucent`.
- `theme-color` dinâmico: claro `#fff7f8`, escuro `#0b0b0d` via `media="(prefers-color-scheme: ...)"`.
- Garantir `viewport-fit=cover` (já tem) + `env(safe-area-inset-*)` em header/bottom-nav/composer de chat (verificar `MobileAppHeader`, `MobileBottomNav`, `MobileChatScreen` e ajustar o que faltar).

### 4. Travas de UX nativa (CSS global em `src/styles.css`)
- `touch-action: manipulation` no `html` (mata 300ms / duplo-toque zoom).
- `-webkit-tap-highlight-color: transparent`, `-webkit-touch-callout: none` em botões/links.
- `overscroll-behavior-y: none` no `body` em modo standalone (mata o "bounce" que mostra a página por baixo).
- `user-select: none` por padrão, com `user-select: text` liberado em mensagens, bio, textareas e inputs.
- Quando `display-mode: standalone`, desabilitar o pull-to-refresh do Chrome via `overscroll-behavior: contain`.

### 5. Banner discreto de instalação + página `/instalar`
- **Banner**: novo `InstallPromptBanner` que aparece só quando `isInstallAvailable && !isStandalone`, ancorado acima do `MobileBottomNav`, dispensável com X (lembra em `localStorage` por 7 dias). Em Android usa o `beforeinstallprompt`; em iOS abre a página `/instalar`.
- **Página `/instalar`** (`src/routes/instalar.tsx`): passo-a-passo com abas iOS/Android, prints/ícones (Compartilhar → Adicionar à Tela), benefícios ("notificações, abre como app, sem barra do navegador"), botão "Já instalei". Acessível pelo banner, pelo Perfil e por link direto.

### 6. Atalhos do app (long-press no ícone)
Adicionar `shortcuts` no `manifest.webmanifest`:
- Pretendentes → `/pretendentes`
- Conversas → `/conversas`
- Devocional → `/devocional`
- Notificações → `/notificacoes`
Cada um com `icons` reutilizando os já existentes.

### 7. Service Worker — manter
O `sw.js` já está bom e seguro (não cacheia rotas sensíveis, mantém o web push). Sem mudança aqui.

## Tecnicidades

- **Splash gen**: gero os PNGs com o `imagegen` (logo centralizado sobre `#fff7f8`) nos tamanhos 2048×2732, 1668×2388, 1536×2048, 1290×2796, 1179×2556, 1284×2778, 1170×2532, 1125×2436, 828×1792, 750×1334, 640×1136. Aceitável usar 6 principais e cair para o fallback genérico nos demais.
- **`theme-color` dinâmico**: dois `<meta name="theme-color">` com `media` (light/dark). Já vi suporte iOS 15+ e Chrome Android.
- **Status bar `black-translucent`**: a área da barra fica *transparente* e o conteúdo passa por baixo dela. Por isso o header mobile precisa ter `padding-top: env(safe-area-inset-top)` — checar `MobileAppHeader` e ajustar se ainda não tiver.
- **Banner dispensável**: `localStorage["install-banner-dismissed-at"]` com TTL de 7 dias; some definitivamente quando `matchMedia('(display-mode: standalone)').matches`.
- **`/instalar`**: detecta iOS/Android/desktop via `usePwaInstall` (já existe) e mostra a aba certa por padrão, mas permite alternar.
- **SEO**: `/instalar` com `head()` próprio (title "Instalar VaiDarNamoro", description curta) e `noindex` (página utilitária).

## Fora do escopo (pra não inflar)
- Push notifications nativas adicionais (já existe Web Push).
- Compartilhamento via `share_target` no manifest (posso fazer depois se quiser receber fotos/links de outros apps).
- Empacotamento real iOS/Android (precisaria Mac + Apple Developer, foi descartado).

## Resultado esperado
Depois de instalado pela tela inicial: abre direto sem barra do Safari/Chrome, com splash do logo, status bar imersiva, sem bounce, sem zoom acidental, atalhos no long-press do ícone, e novos visitantes recebem um banner discreto explicando como instalar.