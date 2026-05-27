## Diagnóstico

A página `/comunidade` carrega até 100 mensagens e re-renderiza tudo a cada mudança de estado (digitar no input, hover, abrir menu, novo cooldown, nova mensagem em tempo real). Os pontos mais pesados:

1. **Renderização de todas as mensagens em uma única árvore**, sem `React.memo`, sem virtualização. Cada item monta `OnlineDot`, `UserBadges`, `RoleBadge`, `VerifiedBadge`, avatar, etc.
2. **`UserBadges` e `OnlineDot` por linha** — cada componente abre seu próprio fetch / subscription por `userId`. Com muitas mensagens repetidas do mesmo autor, são vários hooks duplicados.
3. **Busca O(n²) do "reply_to"**: `messages.find(x => x.id === m.reply_to_id)` dentro do `.map()`.
4. **`messages.some(...pinned)` e `messages.filter(...)` recomputados inline** a cada render.
5. **Pré-carga de stickers**: `fetchStickers({ activeOnly: true })` traz **todos** os stickers do banco (sem `limit`) só para o cache de miniaturas, mesmo que a comunidade só use alguns.
6. **`framer-motion` em cada sticker**: `StickerMessage` faz spring animation no mount de cada `<img>`, e o `StickerPicker` usa `motion.button` com `whileHover/whileTap` por sticker.
7. **Lookups de `staffMap`/`contribIds`/`flaggedIds`** ok, mas tudo dentro do mesmo componente gigante — qualquer setState global re-renderiza a lista inteira.

## Plano

### 1. Extrair e memoizar a linha de mensagem
- Criar `MessageRow` (componente novo, dentro de `comunidade.tsx`) envolvido em `React.memo` recebendo apenas o que precisa: `m`, `p` (profile), `repliedMsg`, `repliedName`, `senderStaff`, flags booleanas e callbacks estáveis.
- Estabilizar callbacks com `useCallback` (`onReply`, `onOpenActions`, `jumpToMessage`, `togglePin`, etc.).
- Resultado: digitar no input ou atualizar cooldown deixa de re-renderizar 100 linhas.

### 2. Índices pré-computados com `useMemo`
- `messagesById = useMemo(() => new Map(messages.map(m => [m.id, m])), [messages])` para o lookup de reply em O(1).
- `pinnedMessages = useMemo(...)` e `visibleMessages = useMemo(...)` (já com filtro de flagged).
- `hasPinned = pinnedMessages.length > 0` em vez de `messages.some(...)`.

### 3. Compartilhar badges/presence por autor
- Pré-calcular `uniqueSenderIds` com `useMemo` a partir de `messages`.
- Renderizar `UserBadges`/`OnlineDot` apenas uma vez por autor visível, passando o resultado já resolvido para `MessageRow` via prop (evita fetches/subscriptions duplicados). Alternativa simpler: manter `UserBadges` por linha mas garantir que o cache global é hit (já é) e que `MessageRow.memo` evita re-render redundante.

### 4. Pré-carga de stickers mais leve
- Limitar a pré-carga a stickers efetivamente usados na lista de mensagens carregadas: após `setMessages`, coletar os `sticker_id` distintos e buscar só esses por `in('id', ids)`.
- Quando chega nova mensagem com `sticker_id` não cacheado, buscar só aquele.
- Quando o usuário envia um sticker (já populado em cache via `sendSticker`), nada muda.

### 5. Aliviar animações
- `StickerMessage`: remover `framer-motion`, substituir o spring por uma animação CSS leve (`animate-scale-in` já existente em `styles.css`) ou simplesmente uma transição de opacity. Continua "vivo" mas sem custo de JS por sticker.
- `StickerPicker`: trocar `motion.button` com `whileHover/whileTap` por `<button>` com `transition active:scale-95 hover:scale-105` no Tailwind. Manter o `motion.div` do popover (é só 1 elemento).
- O botão "+" pode manter o `motion.span` (1 elemento), sem impacto.

### 6. Pequenos ajustes
- Adicionar `decoding="async"` e `width`/`height` explícitos nos `<img>` de avatar e de sticker para evitar layout shift e ajudar o navegador.
- Trocar `.slice().reverse()` por `[...data].reverse()` (mesma coisa, só estética).
- Garantir `loading="lazy"` nas miniaturas de sticker dentro de mensagens fora da viewport (o `StickerMessage` ainda não usa lazy quando renderizado direto).

## Detalhes técnicos

- Nada de alteração de schema, RLS, server functions ou rotas.
- Mudanças localizadas em: `src/routes/comunidade.tsx`, `src/components/stickers/StickerMessage.tsx`, `src/components/stickers/StickerPicker.tsx`.
- Sem novas dependências. Continuamos com `framer-motion` apenas onde realmente agrega (overlays únicos).
- Comportamento visual preservado: mesmas animações de entrada (via CSS), mesmas interações.

## Fora de escopo

- Virtualização (`react-window`) — só compensa acima de algumas centenas de itens; o limite atual é 100 e o ganho dos passos 1–3 já deve ser suficiente. Posso adicionar depois se ainda travar.
- Mudar o limite de 100 mensagens ou paginar histórico.
