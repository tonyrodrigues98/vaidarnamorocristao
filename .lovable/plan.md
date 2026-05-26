# Sistema de Recados Anônimos (Mystery Match)

Implementação completa em 4 partes: banco de dados, RPCs, UI de envio/recebimento, e integrações (notificações, perfil, configurações).

## 1. Banco de Dados (migração)

### Enum de estado
```
anonymous_message_status:
  pending          -- recém-enviado
  hint_requested   -- destinatário pediu dica, aguardando remetente
  hint_sent        -- dica enviada, destinatário pode responder
  replied          -- destinatário respondeu
  reveal_requested -- alguém pediu revelação
  revealed         -- ambos aceitaram → match automático
  ignored          -- destinatário ignorou (terminal)
  reported         -- denunciado (terminal)
  expired          -- 5 dias sem ação (terminal)
```

### Tabelas

**`anonymous_messages`**
- id, sender_id, receiver_id, content (≤280)
- status, created_at, expires_at (+5 dias)
- reply_text, replied_at
- sender_reveal_requested_at, receiver_reveal_requested_at
- revealed_at, match_id (FK opcional)
- closed_at (para cooldown)

**`anonymous_message_hints`**
- id, message_id, requested_at, hint_category, hint_text, sent_at
- max 2 por message_id (validado em trigger)

**`anonymous_message_settings`** (opt-out)
- user_id PK, accept_anonymous bool default true

**`anonymous_message_reports`**
- id, message_id, reporter_id (= receiver), reason, created_at

### RLS
- Sender vê seus próprios (apenas se não revealed, e nunca o receiver_id real até revelado — mas como sender sabe a quem mandou, sender vê tudo dele).
- Receiver vê recados destinados a ele MAS sem sender_id exposto: usamos VIEW `anonymous_messages_for_me` que omite sender_id quando status != 'revealed'.
- Admins/super_admins veem tudo (denúncias).

### Triggers
- Bloquear envio se: mesmo sexo, sender não aprovado, receiver opt-out, receiver tem recado ativo do mesmo sender, sender já enviou 3 hoje, sender bloqueado/banido.
- Validar restricted_words no content/hint/reply.
- Auto-expirar via função `expire_anonymous_messages()` (chamada por cron ou on-read).
- Após `revealed`, criar `matches` row, copiar para match_id, notificar ambos.

## 2. RPCs (SECURITY DEFINER)

- `send_anonymous_message(_receiver_id uuid, _content text)` → valida tudo, insere, notifica receiver.
- `request_hint(_message_id uuid)` → receiver pede dica, status=hint_requested, notifica sender.
- `send_hint(_message_id uuid, _category text, _text text)` → sender envia uma das dicas permitidas (validar contra lista whitelist de categorias), status=hint_sent.
- `reply_anonymous_message(_message_id uuid, _reply text)` → receiver responde, status=replied, notifica sender.
- `request_reveal(_message_id uuid)` → marca sender ou receiver; se ambos marcados → status=revealed, cria match, notifica ambos.
- `ignore_anonymous_message(_message_id uuid)` → status=ignored, closed_at=now().
- `report_anonymous_message(_message_id uuid, _reason text)` → status=reported, insere em reports, notifica admins.
- `get_anonymous_cooldown(_receiver_id uuid)` → retorna segundos restantes (7 dias após closed_at do último encerrado, ou 0).
- `set_anonymous_optout(_accept bool)` → upsert settings.

### Helpers
- `can_send_anonymous_to(_sender, _receiver)` → bool + razão (opt-out, cooldown, sexo igual, ativo já existente, limite diário).

## 3. Frontend

### Componentes novos (`src/components/anonymous/`)
- `SendAnonymousButton.tsx` — botão no perfil do pretendente (e em moderadores/staff também). Mostra cooldown em tempo real se aplicável.
- `SendAnonymousDialog.tsx` — modal de envio (textarea 280 chars, contador, validação de palavras).
- `AnonymousInbox.tsx` — caixa de entrada com lista de recados recebidos.
- `AnonymousOutbox.tsx` — recados enviados (mostra estado, sem revelar receiver até revealed).
- `AnonymousMessageCard.tsx` — card individual com estados visuais (💌👀✨❤️🔓💞), blur/glow.
- `HintRequestDialog.tsx` — receiver escolhe categoria de dica.
- `HintSendDialog.tsx` — sender escolhe uma dica da whitelist (combobox por categoria).
- `RevealRequestBanner.tsx` — banner com botão "Revelar quem eu sou" + texto explicativo.
- `RevealAnimation.tsx` — animação de blur→glow→nome+foto.

### Rota nova
- `src/routes/recados.tsx` — página principal com tabs: Recebidos / Enviados / Configurações (opt-out switch).

### Integrações
- `src/routes/pretendentes/$id.tsx` — adicionar `<SendAnonymousButton />` (apenas se sexo oposto, aprovado, sem cooldown).
- Adicionar entrada no Header / menu para "Recados" com badge de não lidos.
- `src/lib/notifications.tsx` — já lida via realtime; adicionar tipos `anonymous_message`, `anonymous_hint_requested`, `anonymous_hint_sent`, `anonymous_reply`, `anonymous_reveal_requested`, `anonymous_revealed`.

### Realtime
- Habilitar realtime em `anonymous_messages` e `anonymous_message_hints` para atualização instantânea.

## 4. Design / UX

- Tokens novos em `src/styles.css`: `--mystery-glow`, `--mystery-blur`, gradient suave roxo/dourado para o envelope.
- Ícones: `Mail`, `MailOpen`, `Sparkles`, `Eye`, `EyeOff`, `Lock`, `Unlock`, `Heart`, `Flag` (lucide-react).
- Animações: `fade-in`, `scale-in` existentes; nova `reveal` (blur→clear + glow pulse).
- Mobile-first, sem overflow, contadores, tooltips de cooldown.

## Limites (constantes)
- MAX_CONTENT = 280
- MAX_PER_DAY = 3
- MAX_HINTS = 2
- EXPIRY_DAYS = 5
- COOLDOWN_DAYS = 7
- HINT_CATEGORIES = ['idade','regiao','personalidade','fe','compatibilidade'] com whitelist de frases por categoria.

## Ordem de execução
1. Migração SQL completa (tabelas + enum + RLS + triggers + RPCs).
2. Aguardar aprovação do usuário.
3. Frontend: componentes + rota + integração no perfil + header.
4. Verificar fluxo no preview.