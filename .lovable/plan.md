
# Plano: Avatar em molde + criação por etapas com faixa etária

## Visão geral

Dois movimentos complementares:

1. **Transformar as bases atuais em "molde neutro"**: remover olhos, sobrancelhas, boca, cabelo e barba da pintura da base. Esses elementos passam a ser **itens equipáveis** (PNGs com transparência alinhados ao mesmo canvas). Cabelo já é item — só precisa realinhar com a nova cabeça lisa.

2. **Criar `/avatar/criar` em etapas** (substitui a tela atual `/avatar` para quem ainda não tem avatar; quem já tem cai direto na edição/loja), com uma nova dimensão: **faixa etária**.

Estratégia de idade escolhida: **híbrido** — `36–50` usa overlay de envelhecimento sobre as bases existentes; `50+` ganha bases próprias (cabelo grisalho como variantes de item, postura levemente curvada nas poses elegantes).

---

## Etapa 1 — Molde neutro (bases sem rosto/cabelo)

### O que muda nas bases

Cada base em `avatar_bases` (hoje 96 linhas: 2 gêneros × 3 tons × 16 corpos/poses) é re-renderizada como **molde**:
- **Sem**: olhos, íris, sobrancelhas, boca, cabelo, barba
- **Com**: contorno do rosto, orelhas, pescoço, corpo, roupa base (mantida), tom de pele

A geração parte das bases atuais via edição programática (mantém a regra do `mem://features/avatar-consistency` — partir das bases, nunca gerar do zero).

### Novas camadas de itens

Aproveitando `LAYER_Z_INDEX` em `src/types/avatar.ts` (já tem `eyes`, `eyebrows`, `mouth`, `hairBack`, `hairFront`, `accessoryFace`):

| Camada | Z | Categoria nova/existente |
|---|---|---|
| `eyes` | 30 | nova categoria `olhos` |
| `eyebrows` | 31 | nova categoria `sobrancelhas` |
| `mouth` | 32 | nova categoria `boca` |
| `hairBack` / `hairFront` | 20 / 60 | categoria `cabelo` já existe — só realinhar |
| `accessoryFace` (barba) | 50 | nova subcategoria `barba` (masc) |

Cada PNG de olho/boca/sobrancelha é gerado num **canvas de referência** do mesmo tamanho da base, com o elemento posicionado no pixel exato onde a face fica. O renderer `AvatarRenderer.tsx` já empilha por `slot` em %, então basta padronizar o slot da cabeça.

### Catálogo inicial sugerido

- **Olhos**: 6 variações (formato amendoado/redondo × cor castanho/azul/verde)
- **Sobrancelhas**: 4 variações (fina/grossa × clara/escura)
- **Boca**: 4 (sorriso leve, sorriso aberto, neutra, séria)
- **Barba** (masc): 3 (sem barba/curta/cheia)

Tudo é "starter pack" gratuito no inventário do usuário ao criar o avatar; variações extras viram itens da loja depois.

### Risco e mitigação

- **Risco**: olho/boca não alinham entre poses (a cabeça desloca em `pose-elegant` e `pose-heart`).
  **Mitigação**: medir o centro do rosto em cada base e armazenar em `avatar_bases.metadata` (`head_anchor: {x, y, scale}`). O renderer aplica esse anchor por base ao posicionar as camadas faciais.

---

## Etapa 2 — Faixa etária (híbrido)

### Modelo de dados

Adicionar coluna `age_range` (`'20-35' | '36-50' | '50+'`) em:
- `avatar_bases` (para variantes 50+ com cabelo/postura próprios)
- `user_avatar_base` (escolha do usuário)

### Como cada faixa é renderizada

- **20–35**: base atual sem alteração.
- **36–50**: mesma base + **overlay de envelhecimento** (PNG com linhas finas, leve sombra sob olhos) como camada `effect` com z-index baixo, transparência alta. Itens de cabelo recebem **variantes "grisalho leve"** (mesma forma, paleta dessaturada).
- **50+**: **bases próprias** geradas a partir das bases adultas com tratamento (leve flacidez, postura levemente curvada nas poses elegantes/heart). Cabelos ganham variantes "branco/grisalho pleno". Sobrancelhas em variante clara.

Total de novos assets:
- ~12 overlays de envelhecimento (1 por gênero × pose, reutilizado entre tons)
- ~48 novas bases para `50+` (mesma matriz de tons × corpos × poses)
- Variantes grisalhas dos cabelos existentes (≈ 5 cabelos × 2 paletas = 10 PNGs)

---

## Etapa 3 — `/avatar/criar` em etapas

### Fluxo (segue padrão visual de `/onboarding`)

1. **Nome do avatar**
2. **Gênero** (masc/fem)
3. **Faixa etária** (20–35 / 36–50 / 50+) — explicar como cada faixa afeta visual
4. **Tom de pele** (porcelana, clara, bronzeada, oliva, marrom, profunda)
5. **Tipo de corpo** (padrão/magro/musculoso/acima do peso)
6. **Pose inicial** (5 poses)
7. **Rosto**: olhos → sobrancelhas → boca (preview ao vivo a cada escolha)
8. **Cabelo** (filtrado pela faixa etária — 50+ mostra variantes grisalhas primeiro)
9. **Barba** (só masc, opcional)
10. **Resumo + confirmação** → cria registros em `user_avatar_base`, `user_avatar_inventory` (com o starter pack) e `user_avatar_equipped`.

### Roteamento

- `/avatar/criar` — novo fluxo (route file `src/routes/avatar.criar.tsx`)
- `/avatar` — checa se usuário tem `user_avatar_base`. Se não tem, redireciona para `/avatar/criar`. Se tem, mostra a tela atual (edição + loja).

---

## Faseamento sugerido (entregas que rodam isoladas)

**Fase A — Molde + itens faciais básicos** *(maior valor, libera customização)*
- Gerar 96 bases-molde (sem rosto/cabelo)
- Medir `head_anchor` e gravar em `metadata`
- Criar categorias `olhos`, `sobrancelhas`, `boca` em `avatar_categories`
- Gerar catálogo inicial (6+4+4 itens) com alinhamento
- Atualizar `AvatarRenderer` para usar `head_anchor`
- Dar starter pack automático para usuários existentes
- Realinhar cabelos atuais com nova cabeça lisa

**Fase B — Faixa etária**
- Coluna `age_range` em `avatar_bases` e `user_avatar_base`
- 48 bases novas para `50+`
- 12 overlays de envelhecimento para `36–50`
- Variantes grisalhas de cabelo
- Filtros por faixa etária na loja

**Fase C — Onboarding `/avatar/criar`**
- Rota nova com fluxo passo a passo
- Redirecionamento condicional em `/avatar`
- Tela final de resumo + criação atômica dos registros
- Adicionar barba como categoria (masc)

---

## Detalhes técnicos

- **Geração de assets**: pipeline Python já usado nas correções de pele (`edit_image` + máscara por alpha) para "apagar" rosto/cabelo da base e gerar molde. Olhos/boca/sobrancelha gerados com `generate_image` `transparent_background=true` em canvas de referência.
- **Banco**:
  - Migração 1: `ALTER TABLE avatar_bases ADD COLUMN age_range text DEFAULT '20-35'; ALTER COLUMN ... ADD COLUMN head_anchor jsonb;`
  - Migração 2: `ALTER TABLE user_avatar_base ADD COLUMN age_range text;`
  - Inserts dos itens faciais via `supabase--insert`.
- **Tipos**: estender `AvatarCategoryKey` em `src/types/avatar.ts` com `"eyes" | "eyebrows" | "mouth" | "beard"`; adicionar `AvatarAgeRange` type.
- **Renderer**: `AvatarRenderer` passa a aceitar `headAnchor` opcional vindo da base e posiciona camadas faciais relativo a esse ponto.
- **Memória**: atualizar `mem://features/avatar-consistency` com a regra do molde neutro + `head_anchor` + faixa etária.

---

## Pontos abertos (podemos decidir agora ou na implementação)

1. **Usuários existentes**: aplicar starter pack automaticamente e equipar olhos/boca/sobrancelha "padrão" para não quebrarem visualmente — ok?
2. **Loja**: olhos/boca/sobrancelha extras (além do starter pack) entram já agora ou só depois?
3. **Barba**: entra na Fase A (molde) ou só na Fase C junto com o onboarding?
