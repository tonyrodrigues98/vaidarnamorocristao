## Sistema de Presentes Virtuais

Feature grande. Vou implementar em camadas: backend → admin → loja `/presentes` → perfil → notificações.

### 1. Backend (migration única)

**Tabelas novas:**

- `virtual_gifts` — catálogo (id, name, slug, image_url, price_coins, category, rarity, active, sort_order)
- `gift_transactions` — envios (id, sender_id, receiver_id, gift_id, price_paid, message, status: held|redeemed, created_at, redeemed_at, redeemed_coins)

**Enums:** `gift_category` (romantic, spiritual, caring, friendship, fun, legendary), `gift_rarity` (common, rare, epic, legendary, exclusive)

**Funções RPC (SECURITY DEFINER):**

- `send_virtual_gift(_receiver_id, _gift_id, _message)` — debita moedas, cria transação, envia notificação, loga `coin_transactions`
- `redeem_virtual_gift(_tx_id)` — devolve 30% das moedas (arredondado, mínimo 1), marca `redeemed`
- `get_received_gifts(_user_id)` — lista para perfil próprio/público (limita públicos a held)

**RLS:**

- `virtual_gifts`: SELECT público para `active=true`; ALL para admins
- `gift_transactions`: SELECT para sender/receiver; INSERT/UPDATE só via RPC

**Storage bucket:** `gift-images` público (SELECT all, INSERT/UPDATE admins)

### 2. Catálogo inicial

Seed ~18 presentes cobrindo as 6 categorias com emojis/placeholders (Rosa Encantada, Coração de Cristal, Oração, Café, etc.). Imagens via geração ou emoji renderizado.

### 3. Rota `/presentes`

`src/routes/presentes/index.tsx` — fora da loja, identidade própria:

- Header 220px gradiente `#FF5FA2 → #FF7BC3 → #A855F7 → #6D5BFF`, blur orbs flutuantes, partículas CSS
- Card saldo glassmorphism + botão "Ver Extrato" → `/loja?tab=saldo`
- Filtros por categoria (chips com ícones lucide)
- Grid 2/3/4 colunas
- `GiftCard` com glow por raridade (border + box-shadow coloridos), hover scale, badge raridade
- `SendGiftModal` — escolhe pretendente (autocomplete pretendentes aprovados) ou recebe `?to=<id>`, campo mensagem 120 chars, confirma
- `GiftSendAnimation` — overlay com presente subindo + partículas (CSS keyframes)

### 4. Integração perfil

- Nova aba "Presentes" em `/perfil` (junto com Sobre, Preferências, Saldo, etc.) — grid de recebidos com ações Guardar/Resgatar
- Seção "🎁 Destaques" em `/pretendentes/$id` — carrossel horizontal últimos 6 presentes held
- Botão "Enviar Presente" no perfil público → `/presentes?to=<id>`

### 5. Admin

`src/routes/admin/presentes.tsx` (super_admin only) — CRUD: nome, preço, imagem (upload), categoria, raridade, ativo. Lista com toggle.

### 6. Notificações

Notification type `gift_received` já cabe no schema existente (`create_notification`). Link `/perfil?tab=presentes`.

### 7. Tokens visuais

Adicionar em `src/styles.css`:

- `--gift-gradient`, `--rarity-common/rare/epic/legendary/exclusive` (cores + glow shadows)
- Keyframes `gift-float`, `gift-sparkle`, `gift-rise`

---

### Arquivos a criar/editar

**Backend (migration):**

- `supabase/migrations/<ts>_virtual_gifts.sql`
- `supabase/migrations/<ts>_seed_gifts.sql` (ou via insert tool após primeira migration)

**Frontend novo:**

- `src/routes/presentes/index.tsx`
- `src/routes/admin/presentes.tsx`
- `src/components/gifts/GiftCard.tsx`
- `src/components/gifts/SendGiftModal.tsx`
- `src/components/gifts/GiftSendAnimation.tsx`
- `src/components/gifts/CategoryFilter.tsx`
- `src/components/gifts/ReceivedGiftsGrid.tsx` (aba perfil)
- `src/components/gifts/GiftHighlights.tsx` (carrossel perfil público)
- `src/lib/gifts.ts` (RPC wrappers)

**Frontend editado:**

- `src/routes/perfil.tsx` (adicionar aba)
- `src/routes/pretendentes/$id.tsx` (seção destaques + botão enviar)
- `src/routes/admin/index.tsx` (link menu)
- `src/styles.css` (tokens raridade + keyframes)

### Notas

- Tipos do Supabase regeneram automaticamente após a migration; usaremos `as never` temporariamente nos casts onde necessário, como em `coinTx.ts`
- Imagens dos presentes: uso emojis grandes renderizados sobre fundo gradiente como fallback (não bloqueia entrega); admin pode trocar depois
- Resgate: 30% (configurável) — segue regra "sink de moedas"
- Mobile-first: testar viewport 393px (atual do user)
