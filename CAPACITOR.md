# Vaidarnamoro — Capacitor (iOS + Android)

Este projeto roda como app web SSR (TanStack Start + Cloudflare) e também
como app nativo via Capacitor. O nativo carrega a mesma URL publicada,
então toda a lógica continua única.

## Pré-requisitos

- Node 20+ e `bun install` rodado
- iOS: macOS + Xcode 15+ + CocoaPods (`sudo gem install cocoapods`)
- Android: Android Studio + JDK 17

## Setup inicial (uma vez)

```bash
bun run cap:add:ios       # cria a pasta ios/
bun run cap:add:android   # cria a pasta android/
bun run cap:sync          # copia config e plugins
```

Por padrão o app aponta para `https://vaidarnamoro.com`. Para apontar pro
preview Lovable durante o desenvolvimento:

```bash
CAP_SERVER_URL=https://id-preview--<id>.lovable.app bun run cap:sync
```

## Rodar

```bash
bun run cap:open:ios       # abre Xcode (Run no simulador ou device)
bun run cap:open:android   # abre Android Studio
```

## Plugins instalados

- `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`,
  `@capacitor/app` — inicializados em `src/lib/native.ts` (`initNativeShell`).
- `@capacitor/haptics` — chamável via `haptic("light"|"medium"|...)`.
- `@capacitor/push-notifications` — `registerNativePush()` retorna o token
  APNs/FCM para você persistir junto às inscrições já existentes.

No web tudo isso é no-op (`isNative()` retorna false), então nada do
nativo vaza para o bundle do navegador.

## Publicação

- iOS: Xcode → Product → Archive → Distribute (TestFlight / App Store).
  Requer conta Apple Developer (US$ 99/ano).
- Android: Android Studio → Build → Generate Signed Bundle (Play Store).

## Notas

- `webDir` aponta para `public/capacitor-fallback/` apenas como fallback
  offline (redireciona pro domínio publicado).
- Mudanças no `capacitor.config.ts` exigem `bun run cap:sync` para
  propagar pros projetos nativos.
- iOS bundle ID: `com.vaidarnamoro.app` · Nome: `Vaidarnamoro`.