
# Fase 1 — Quarto Vivo (versão final aprovada)

Substitui a tela atual de `/meu-pet` (pilha de cards) por uma **cena única cinematográfica** estilo storybook 2.5D pintado à mão, paleta clara e arejada, com o pet real do usuário (vindo dos assets de espécie/variante já existentes) como protagonista no centro.

Sem rolagem vertical de cards. Cada objeto da cena É a interação.

---

## Decisões registradas

| Decisão | Escolha |
|---|---|
| Estilo visual | Storybook 2.5D pintado à mão, paleta **clara e arejada** (creme, sage suave, dusty rose pálido, âmbar dourado discreto, sem fundos escuros) |
| Pet | Usa o PNG real do pet do usuário via `resolvePetDisplayImage(pet.variant, stage)` — mesmo asset já usado em `PetEvolutionCard`. Sem gerar pets ilustrados novos. |
| Navegação entre zooms | **Pinch-out (mobile) + scroll-up (desktop) + botões explícitos** (ambos, p/ acessibilidade). Fase 1 só implementa Z1; o botão "Sair do quarto" fica disabled com tooltip "Em breve" |
| Escopo desta fase | Apenas Quarto Vivo (Z1). Mapa (Z2) e Constelação (Z3) ficam para fases 3 e 4 |
| Vida Autônoma | Idle simples nesta fase (3 estados: idle / dormindo / comendo). Diário cinematográfico fica para Fase 2 |

---

## Escopo de implementação

### 1. Assets do cenário (gerar 1x, reaproveitar)

Cena pintada em **camadas separadas PNG transparente** (para parallax), paleta clara, geradas via `imagegen` e subidas como `lovable-assets`:

- `room-bg-day.png` — parede + janela + chão (fundo)
- `room-bg-sunset.png` — variante pôr-do-sol
- `room-bg-night.png` — variante noite (janela escura, vagalumes)
- `room-furniture.png` — móveis (escrivaninha, estante, banheira, cama, baú, calendário, quadros) em camada única transparente
- `room-foreground.png` — tapete + tigela + plantas (na frente do pet em camadas baixas)

Day/night escolhe o `room-bg-*` automaticamente por `new Date().getHours()`. Móveis e foreground são compartilhados nas 3 variantes.

### 2. Componente principal — `PetLivingRoom.tsx`

Substitui o bloco principal de `/meu-pet`. Estrutura:

```text
<PetLivingRoom>
  ├── <RoomBackground />          // bg + day/night
  ├── <RoomFurniture />            // camada de móveis com hotspots
  ├── <PetSprite pet={pet} />      // PNG real do pet, animação CSS de respiração + bob
  ├── <RoomForeground />           // tapete + tigela
  ├── <StatsHUD stats={care} />    // 4 pontinhos no topo
  ├── <PetNameLabel />             // nome em serif
  └── <ZoomControls disabled />    // botões "Mapa" e "Constelação" (em breve)
</PetLivingRoom>
```

Parallax leve: cada camada se desloca ~5px com mouse/inclinação (CSS `transform: translate3d`).

### 3. Hotspots interativos (cada um abre o sheet/modal já existente)

| Objeto na cena | Abre |
|---|---|
| Tigela (chão) | `PetCareActionSheet` kind=`food` |
| Caminha (canto) | `PetCareActionSheet` kind=`sleep` |
| Banheira (lateral) | `PetCareActionSheet` kind=`hygiene` |
| Bolinha no tapete | `PetCareActionSheet` kind=`play` |
| Caderno na escrivaninha | `MissionsTodayCard` (em modal) |
| Bíblia na escrivaninha | navegar `/quiz-biblico` |
| Baú dourado pequeno (estante) | `PetCaixasEntryCard` (em modal) |
| Baú grande c/ velas (canto) | `PetWeeklyChestCard` (em modal) |
| Quadro grande (parede) | `PetEvolutionCard` (em modal) |
| Calendário a giz | `PetStreakCard` (em modal) |
| Diário sobre a cama | `PetCareHistorySheet` |
| Porta "Floresta" | `ExpeditionsCard` (em modal) |
| Cenário (trocar quarto) | `PetSceneryPanel` (em modal — bottom sheet) |

Cada hotspot é um `<button>` posicionado em `%` absoluto sobre a imagem, com:
- `aria-label` descritivo
- glow CSS pulsante quando a stat correspondente está baixa (rim-light dourado via `box-shadow` + `filter: drop-shadow`)
- escala 1.05 no hover/tap
- haptic light no tap (já existe `src/lib/haptics.ts`)

### 4. Pet sprite (`PetSprite.tsx`)

- Usa `resolvePetDisplayImage(pet.variant, lifeStageSlug)` — sem novos assets de pet
- 3 estados visuais via CSS:
  - `idle`: animação suave de respiração (scale 1 → 1.02 → 1) loop 4s
  - `sleeping`: ligeira inclinação + Z's emoji-substitute (3 `<Moon className="size-3" />` flutuando)
  - `eating`: bob vertical pequeno + posicionado próximo à tigela
- Estado escolhido pelo `petMood` (já existe `src/lib/petMood.ts`)
- Sombra suave embaixo no tapete

### 5. HUD minimalista

`<StatsHUD>` — 4 pontinhos coloridos no topo (fome, energia, higiene, felicidade). Cor verde quando >70, amarelo 40-70, vermelho <40. Tap expande pra mini-cartões flutuantes com nome + valor.

### 6. Day/Night

`src/lib/petDayNight.ts` já existe — só usar pra escolher o asset de bg correto. Sem nova lib.

### 7. Fallback desktop

Em viewports >1024px wide, cena fica centralizada com max-width 480px (formato vertical phone), com fundo gradiente claro ao redor. Mantém a experiência mobile-first sem layout esquisito.

### 8. Acessibilidade

- Botão "Ver modo lista" no canto superior direito → mostra a versão antiga em cards (mantém o JSX atual num componente `<PetDashboardLegacy>`)
- Cada hotspot com label e foco visível
- Reduced-motion: desliga parallax e animações de respiração

---

## Detalhes técnicos

**Arquivos novos:**
- `src/components/pet/PetLivingRoom.tsx`
- `src/components/pet/RoomBackground.tsx`
- `src/components/pet/RoomFurniture.tsx`
- `src/components/pet/PetSprite.tsx`
- `src/components/pet/StatsHUD.tsx`
- `src/components/pet/RoomHotspot.tsx`
- `src/assets/pet-room/room-bg-day.png.asset.json` (+sunset, +night)
- `src/assets/pet-room/room-furniture.png.asset.json`
- `src/assets/pet-room/room-foreground.png.asset.json`

**Arquivos modificados:**
- `src/routes/meu-pet.tsx` — substitui o bloco entre `<section profile>` e `<PetCareHistorySheet>` por `<PetLivingRoom>`, mantém providers/sheets
- Move o JSX antigo dos cards para `src/components/pet/PetDashboardLegacy.tsx` (toggle "modo lista")

**Sem alterações em:**
- Backend (nenhuma migração)
- Lógica de stats, missões, expedições, caixas, evolução — tudo continua igual, só muda a porta de entrada visual
- Outros routes

**Performance:**
- 3 PNGs de bg (~150kb cada otimizado) + 2 PNGs compartilhados = ~600kb total, lazy load
- CSS-only animations (sem Framer extra além do que já tem)
- Parallax via `transform`, GPU-accelerated

---

## Critério de "pronto"

1. Abrir `/meu-pet` mostra a cena (não a lista de cards)
2. Tigela / caminha / banheira / bolinha disparam as ações de cuidado
3. Todos os 13 hotspots abrem os modais corretos
4. Pet do usuário aparece no centro com idle de respiração
5. Stats HUD reflete os valores reais
6. Day/night muda o bg automaticamente
7. Toggle "modo lista" volta pra UI atual
8. Funciona em iPhone SE (375px) e iPad (1024px)

---

## Próximos passos depois de aprovar

1. Gerar os 5 PNGs do cenário (paleta clara aprovada)
2. Subir como `lovable-assets`
3. Construir os 6 componentes acima
4. Conectar hotspots aos modais existentes
5. QA visual + ajustes de posicionamento dos hotspots

Quando você apertar **Implement plan**, eu começo pela geração dos assets e construo na ordem acima.
