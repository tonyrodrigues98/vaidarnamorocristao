
# Sistema de Decorações de Avatar

Decorações compradas com moedas que aparecem sobre a foto de perfil em: `/perfil` (seletor), perfil público, e lista de matches/conversas.

---

## Fase 1 — Mockups visuais (antes de qualquer código)

Gero PNGs transparentes de referência para você aprovar o estilo antes de construir o sistema. Cada item segue o tema cristão/romance do app.

### Molduras (frames circulares, PNG transparente)
1. **Aliança de Ouro** — anel dourado fino, brilho sutil
2. **Coroa de Espinhos** — discreta, cor bronze/oliva
3. **Louros Dourados** — ramos de oliveira em volta
4. **Moldura Floral Rosa** — pétalas e folhas suaves
5. **Vitral Sagrado** — arcos coloridos estilo igreja

### Auras (glow circular atrás da foto)
1. **Aura Dourada** — santidade
2. **Aura Rosa** — romance
3. **Aura Azul Celeste** — paz
4. **Aura Violeta** — fé/realeza

### Stickers (pequeno emblema sobreposto no canto)
1. **Pomba** (canto superior direito)
2. **Cruz Dourada** (canto inferior direito)
3. **Coração Sagrado**
4. **Estrela de Belém**

Total: ~13 imagens geradas com `imagegen` (PNG transparente, 512×512).
Apresento todas em grade para você escolher quais entram na v1 e o que ajustar.

---

## Fase 2 — Implementação (somente após aprovação dos mockups)

### Banco de dados
- `avatar_decorations` (catálogo): `id`, `type` ('frame'|'aura'|'sticker'), `name`, `image_url`, `price_coins`, `active`
- `user_decorations` (compras): `user_id`, `decoration_id`, `purchased_at`
- `profiles`: adicionar `equipped_frame_id`, `equipped_aura_id`, `equipped_sticker_id` (nullable)
- RLS: catálogo público; compras só do próprio user; equipar = update no próprio profile
- RPC `purchase_decoration(decoration_id)` — debita moedas atômico, insere em `user_decorations`

### Componente unificado `<DecoratedAvatar>`
Substitui usos de `<Avatar>` nestes locais:
- `/perfil` (própria foto grande)
- Perfil público de pretendente (`/pretendentes/$id`)
- Lista de matches (`/matches`)
- Conversas individuais (cabeçalho do chat `/conversas/$matchId`)

Estrutura: `<div relative>` com aura (absolute, z-0, blur), avatar (z-10), moldura (absolute inset, z-20), sticker (absolute canto, z-30).

Não aplicar em: card de pretendentes (lista), notificações, chat global — conforme pedido.

### UI em `/perfil` aba "Sobre mim"
Novo card abaixo de "Fotos adicionais": **"Decorações de Perfil"**
- 3 abas: Moldura / Aura / Stickers
- Cada aba lista itens do catálogo:
  - Já equipado → badge "Equipado"
  - Comprado mas não equipado → botão "Usar"
  - Não comprado → botão "Comprar (X moedas)" com ícone oficial de moeda
- Opção "Remover" para desequipar
- Salvamento automático ao clicar Usar/Remover
- Animação suave de troca (fade/scale)
- Saldo de moedas visível no topo do card

### Mobile
Layout vertical, abas com scroll horizontal, preview da decoração em tamanho real sobre avatar atual.

---

## Decisões abertas (responder antes de aprovar fase 2)
1. Pode equipar **1 de cada tipo simultaneamente** (1 moldura + 1 aura + 1 sticker)? Ou só 1 decoração total?
2. Faixa de preço sugerida: molduras 50–150 moedas, auras 30–80, stickers 20–60 — ok?
3. Stickers só no canto inferior direito, ou usuário escolhe o canto?

Aprove este plano para eu gerar os mockups na fase 1.
