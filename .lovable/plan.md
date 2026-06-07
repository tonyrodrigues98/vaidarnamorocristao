# Plano

## 1. Componente compartilhado `MobileChatScreen`

Criar `src/components/mobile/MobileChatScreen.tsx` com a casca usada hoje nas duas páginas:

- Wrapper `mobile-chat-screen` (flex coluna, altura `--app-visual-height`).
- Slot `header` (Header global + barra do chat).
- Slot `pinned` opcional (mensagens fixadas / progresso de propósito).
- Slot `messages` — área rolável única (`mobile-chat-scroll`, `flex-1 min-h-0 overflow-y-auto w-full`).
- Slot `composer` — colado ao rodapé via `mobile-chat-composer`.
- `ref` para o scroll exposto via `forwardRef` para auto-scroll ao chegar mensagem nova.

Refatorar:

- `src/routes/comunidade.tsx` → usar `MobileChatScreen` (remove a `glass` wrapper com `max-w-3xl` que limita largura; força full-width no mobile, mantém `max-w-3xl` só no desktop via prop).
- `src/routes/conversas/$matchId.tsx` → usar o mesmo componente.

Sem mexer em lógica (envio, realtime, stickers, flags, edição). Só a casca de layout.

## 2. Fallback de altura via VisualViewport

Ampliar o effect já em `MobileAppShell`:

- Manter `--app-visual-height` em sync com `visualViewport.height`.
- Adicionar fallback: quando `visualViewport` é indisponível, escutar `window.resize` + `orientationchange` e usar `window.innerHeight`.
- Forçar reflow ao `focusin`/`focusout` de inputs dentro de telas de chat (iOS às vezes não dispara `resize`).
- Em `styles.css`, garantir que `.mobile-chat-screen`, `.mobile-chat-composer` e o wrapper de scroll usem `height: var(--app-visual-height, 100dvh)` consistentemente e que não exista padding extra abaixo do composer.

## 3. Endpoint Web Push

Backend:

- Migração: criar `public.push_subscriptions` (`user_id`, `endpoint UNIQUE`, `p256dh`, `auth`, `user_agent`, timestamps) com RLS (usuário só vê/manipula as próprias; service_role total) e GRANTs.

Server function (autenticada):

- `src/lib/push.functions.ts` com `subscribePush` e `unsubscribePush` usando `requireSupabaseAuth`.
- `usePushNotifications` chama essas serverFns no lugar de `VITE_PUSH_SUBSCRIPTION_ENDPOINT`.

Chaves VAPID:

- `VITE_WEB_PUSH_PUBLIC_KEY` (publishable, vai no `.env`/secret) + `WEB_PUSH_PRIVATE_KEY` + `WEB_PUSH_SUBJECT` (secrets do servidor).
- Sem dispatcher de push agora (só persistência da subscription). Envio real ficará para um próximo passo, pois exige biblioteca `web-push` compatível com Workers (avaliar `@negrel/webpush` ou chamada HTTP direta ao FCM/Apple).

## Fora do escopo

- Reescrever lógica de mensagens/stickers/flags.
- Implementar o dispatcher de push notifications (envio real). Só persistência da subscription neste turno.

## Pergunta

Para o Web Push você já tem um par de chaves VAPID gerado? Se não, gero localmente e te passo as três variáveis (`VITE_WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT` — o subject é um `mailto:` ou URL de contato).
