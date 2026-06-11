
# Plano: Avatar Composicional (bases neutras + tonalização em runtime)

## Objetivo

Sair do modelo "renderizar cada combinação como PNG final" (matriz de milhares de assets) e adotar **composição em runtime**: poucas bases neutras em escala de cinza + tonalização/idade/face aplicadas dinamicamente via canvas/SVG.

## Princípios

1. **Cada eixo de variação vira uma camada independente**, nunca uma multiplicação na matriz de assets.
2. **Cor é dado, não pixel**: pele, idade, cabelo etc. são tokens aplicados em runtime sobre máscaras neutras.
3. **Face é modular**: olhos/boca/sobrancelha são layers compostos sobre um "molde" facial neutro, swappáveis sem tocar na base.
4. **Renderização pesada só no "Salvar Look"**: o stage usa DOM/CSS; o snapshot final virá de um único canvas compose.

## Arquitetura proposta

### 1. Bases neutras (escala de cinza + máscaras)

Reduzir de **240 → 40 bases** (gênero × corpo × pose, sem pele).

Cada base vira **3 PNGs alinhados pixel-a-pixel** no mesmo canvas:
- `body-luminance.png` — silhueta em tons de cinza com sombreamento (canal de luminância)
- `skin-mask.png` — máscara branca/preta marcando apenas a pele visível (rosto, braços, mãos, pernas)
- `face-anchor.json` — coordenadas normalizadas do centro do rosto, escala da cabeça (para encaixar olhos/boca/sobrancelha de qualquer pose)

```text
                base neutra                tonalizada em runtime
                ┌──────────┐               ┌──────────┐
   luminance →  │  ░▒▓█▓▒░ │  + skin_tone │  🟤🟫🟤  │
   skin-mask →  │  ◻◼◼◻    │  + age_layer │  ▒░ rugas │
                └──────────┘               └──────────┘
```

### 2. Tonalização em runtime (sem regenerar imagem)

Aplicar pele via **SVG `feColorMatrix` + `feComposite`** ou **canvas 2D `globalCompositeOperation: "multiply"`**:
- Skin tone vira um **token de cor** (`SKIN_PALETTE[skinTone] = { base, shadow, highlight }`)
- O filtro multiplica a cor no luminance, mascarado pelo `skin-mask`
- Para roupas/cabelo o mesmo truque permite "recolorir" um item neutro

Resultado: **adicionar um novo tom de pele = adicionar 1 entrada no objeto de cores**, zero PNG.

### 3. Idade como overlay (não como base nova)

- `age-overlay-36-50.png` e `age-overlay-50plus.png`: PNGs transparentes com rugas/manchas posicionadas pelo `face-anchor` da pose ativa
- Pose troca? O anchor já existe na base; o overlay re-ancora sozinho
- Cabelo grisalho/branco para 50+ = **mesmo PNG de cabelo recolorido em runtime** (token de cor por faixa etária)

**Custo**: 6 PNGs (3 faixas × leve/forte) em vez de regerar 240 bases por faixa.

### 4. Face modular (olhos, boca, sobrancelha como itens)

- Manter as categorias `eyes`, `mouth`, `eyebrows` já criadas no banco
- Cada item facial é **um PNG pequeno em transparência** (não precisa de variação por pose: o `face-anchor` da pose reposiciona)
- Layer ordering já está pronto em `LAYER_Z_INDEX` (`eyes: 30, eyebrows: 31, mouth: 32`)
- O "molde" facial atual no body-luminance fica **neutro** (sem traços), e os itens completam por cima

**Resultado**: gerar um novo conjunto de olhos = **5 PNGs** (variantes de forma), não 5 × poses × corpos × peles.

### 5. Item visual (roupa/sapato/cabelo) com slot universal

- Cada item tem **1 PNG canônico** + um manifesto `{ anchor: "torso"|"feet"|"head", scale }`
- O renderer já tem `LAYER_SLOTS` — estender para indexar por **anchor da pose ativa**, não por slot fixo
- Itens deformam-se levemente entre poses via escala/translação (não distorção real). Para poses muito diferentes (orando vs em pé), permitir `pose_overrides` opcional só onde realmente quebrar

### 6. Snapshot ("Salvar Look")

- Stage continua em DOM (rápido, interativo)
- "Salvar Look" compõe em um **único `<canvas>`** aplicando a mesma pipeline (luminance → tint → mask → overlays → itens) e gera o PNG final pra `avatar-looks`
- Cache: hash do snapshot já está pronto pra deduplicar

## Diagrama de camadas (z-index)

```text
   80 ┃ effect (auras, brilhos)
   70 ┃ pet
   60 ┃ hairFront
   52 ┃ accessoryHand
   51 ┃ accessoryNeck
   50 ┃ accessoryFace
   45 ┃ shoes
   42 ┃ fullOutfit / 41 bottom / 40 top
   32 ┃ mouth        ┐
   31 ┃ eyebrows     │ ← itens faciais modulares
   30 ┃ eyes         ┘
   25 ┃ face-base (molde neutro, no body-luminance)
   20 ┃ hairBack
   15 ┃ age-overlay  ← NOVO
   10 ┃ body (luminance + skin-tint via filter)
    0 ┃ background (cenário)
```

## Migração faseada (sem quebrar o que existe)

**Fase 1 — Prova de conceito (1 base)**: criar 1 luminance + skin-mask para `male × default × standing_default`, validar tonalização em runtime no `AvatarRenderer`. Comparar visual com PNG colorido atual.

**Fase 2 — Bases neutras completas**: gerar as 40 bases (gênero × corpo × pose) em luminance + mask. Deletar as 240 bases coloridas e os 6 diretórios `avatar-skins/*`. Tabela `avatar_bases` perde a coluna `skin_tone` (vira eixo runtime).

**Fase 3 — Itens faciais**: popular `eyes/mouth/eyebrows` com 5–8 itens cada (PNGs neutros pequenos). Limpar o "molde" facial das bases.

**Fase 4 — Overlay de idade + cabelo recolorível**: gerar os 2 overlays e fazer cabelo aceitar tinta de cor (cinza/branco para 50+).

**Fase 5 — Limpeza de itens**: itens hoje pré-renderizados por pose passam a usar `anchor` da pose; manter `pose_overrides` só onde necessário.

## Detalhes técnicos

- **Filtro de pele**: SVG inline com `<filter><feColorMatrix .../></filter>` aplicado via CSS `filter: url(#skin-tint)`. Funciona em img/canvas, performático, e o mesmo nó pode ser parametrizado por React state.
- **Renderer**: estender `AvatarRenderer` para receber `skinTone`, `ageRange`, montar 3 sub-layers (luminance, age-overlay, skin-tint mask) antes dos itens.
- **Snapshot canvas**: replicar a mesma matemática do filtro em `ctx.filter` / `globalCompositeOperation` para sair pixel-equivalente ao preview.
- **Storage**: bucket `avatar-bases-v2/` recebe os novos PNGs neutros; bases v1 ficam para rollback.
- **DB**: nova coluna `avatar_bases.luminance_url` + `mask_url`; manter `image_url` deprecada por 1 release.

## O que NÃO muda

- Tabelas de inventário, equipped, looks, moedas, RPCs de compra — todas continuam idênticas.
- UX da página (`/avatar`) — só o pipeline interno do renderer muda.
- Itens já carregados continuam funcionando enquanto a migração rola (fallback no renderer).

## Economia esperada

| Eixo                    | Hoje    | Depois | Redução |
|-------------------------|---------|--------|---------|
| Bases                   | 240     | 40     | 83%     |
| Variantes de pele       | ×6 tudo | token  | 100%    |
| Faixa etária 36–50/50+  | impossível sem ×3 | 2 overlays | viabilizado |
| Itens faciais           | bloqueado | 5–8 por categoria | viabilizado |
| Custo de novo tom de pele | gerar 40 PNGs | 1 entrada JSON | 99% |
