# Sistema de Stickers — Chat Global

## Visão geral
Adicionar envio de stickers no chat global (`/comunidade`) com biblioteca curada gerenciada por super_admin em nova aba `/admin/stickers`.

## Banco de dados (migração única)

**Novas tabelas:**
- `sticker_categories` — `id`, `name`, `slug`, `sort_order`, `created_at`
- `stickers` — `id`, `category_id`, `name`, `storage_path`, `public_url`, `mime_type`, `is_animated`, `active`, `sort_order`, `created_at`, `created_by`

**Storage:**
- Bucket público `stickers` (somente super_admin escreve; leitura pública)

**Alteração em `global_messages`:**
- Coluna `sticker_id uuid REFERENCES stickers(id)` (nullable)
- Relaxar `content_check` para permitir `content` curto quando sticker é enviado (ex: usar conteúdo fixo `"[sticker]"`), ou tornar content nullable quando `sticker_id IS NOT NULL` via novo CHECK.

**RLS:**
- `stickers` / `sticker_categories`: SELECT para `authenticated` (apenas ativos); INSERT/UPDATE/DELETE apenas `super_admin`.
- GRANTs explícitos para `authenticated` e `service_role`.

**Storage policies:**
- SELECT público no bucket `stickers`
- INSERT/UPDATE/DELETE apenas super_admin

## Frontend — Chat global (`src/routes/comunidade.tsx`)

- Adicionar botão `+` na barra de envio → menu com opção "Sticker" (framer-motion, fade+scale).
- Componente novo `src/components/stickers/StickerPicker.tsx`:
  - Desktop: popover ancorado ao botão
  - Mobile: `Drawer` (bottom sheet) usando `@/components/ui/drawer`
  - Tabs horizontais por categoria, grid 4 colunas, scroll vertical
  - Lazy load com `loading="lazy"`, hover scale, tap bounce
- Ao tocar em sticker: insert em `global_messages` com `sticker_id` e content `"[sticker]"`.
- Renderização: detectar `sticker_id` na lista de mensagens; renderizar imagem (max ~140px) com pop animation de entrada (framer-motion initial scale 0.6 → 1 spring).

## Frontend — Admin (`src/routes/admin/stickers.tsx`)

- Rota nova, gated por `has_role(uid, 'super_admin')` (checar via `useAuth` + roles client).
- Link na nav admin visível só para super_admin.
- UI:
  - Sidebar de categorias (criar/renomear/excluir)
  - Grid de stickers da categoria selecionada, com preview, toggle ativo, editar nome, excluir
  - Botão upload (drag&drop) — aceita .webp/.png, multi-arquivo
  - Upload via `supabase.storage.from('stickers').upload()` direto (RLS bloqueia não-super_admin)

## Animações
- Framer Motion: picker slide-up + fade; sticker enter pop/bounce; chips hover; "+" menu micro.

## Arquivos
```text
supabase/migrations/<ts>_stickers.sql        (NOVA)
src/components/stickers/StickerPicker.tsx    (NOVA)
src/components/stickers/StickerMessage.tsx   (NOVA)
src/routes/admin/stickers.tsx                (NOVA)
src/routes/admin/index.tsx                   (link condicional)
src/routes/comunidade.tsx                    (botão +, render sticker)
src/lib/stickers.ts                          (helpers: list, upload)
```

## Observações
- Sem stickers iniciais — super_admin sobe a primeira leva pelo painel.
- Sem fallback de GIF; apenas WEBP/PNG.
- Cobertura de testes não incluída neste escopo.
