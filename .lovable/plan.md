# Fase 3 — Mapa do Reino (Z2)

Sai do Quarto Vivo (Z1) com um **zoom-out cinematográfico** e revela o mundo onde o pet vive: um mapa pintado à mão, mesma paleta clara da Fase 1, com regiões que pulsam de acordo com o progresso real do usuário (expedições, streak, missões, evolução).

Não é uma tela de menu nem um grid de cards. É uma ilustração viva.

---

## Decisões registradas

| Decisão           | Escolha                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Estilo            | Mesmo storybook 2.5D pintado à mão, paleta clara (creme, sage, dusty rose, âmbar)                                                            |
| Transição Z1 → Z2 | Zoom-out animado (scale + fade) ~700ms via CSS. Pinch-out no mobile, scroll-up no desktop, botão "Ver o reino" no canto                      |
| Volta Z2 → Z1     | Toca no telhado da casa central ou botão "Voltar pro quarto"                                                                                 |
| Regiões           | 5 fixas nesta fase: **Casa do Pet** (centro), **Floresta das Expedições**, **Vale das Missões**, **Lago do Descanso**, **Torre da Evolução** |
| Vida no mapa      | Nuvens passando lento, água do lago brilhando, fumaça da chaminé, dia/noite igual Z1                                                         |
| Escopo            | Apenas navegação visual + abrir os modais existentes. Sem novo backend. Constelação (Z3) fica pra Fase 4                                     |

---

## Escopo de implementação

### 1. Assets do mapa (gerar 1x)

Pintura única do reino visto de cima em ângulo isométrico suave:

- `kingdom-map-day.png` — mapa completo com as 5 regiões, luz de dia
- `kingdom-map-night.png` — variante noturna (lago refletindo lua, janelas acesas)
- `kingdom-clouds.png` — nuvens transparentes em camada superior (loop horizontal)

Paleta clara aprovada. Gerados via `imagegen` standard quality, salvos como `lovable-assets` em `src/assets/pet-kingdom/`.

### 2. Componente principal — `PetKingdomMap.tsx`

```text
<PetKingdomMap>
  ├── <MapBackground />          // bg + day/night
  ├── <MapClouds />              // camada animada
  ├── <RegionHotspot id="home" />        // casa central
  ├── <RegionHotspot id="forest" />      // floresta
  ├── <RegionHotspot id="valley" />      // vale missões
  ├── <RegionHotspot id="lake" />        // lago descanso
  ├── <RegionHotspot id="tower" />       // torre evolução
  ├── <KingdomHUD />             // streak + level no topo
  └── <ZoomBackButton />         // "Voltar pro quarto"
</PetKingdomMap>
```

### 3. Regiões e ações

| Região                  | Glow quando                             | Ao tocar                               |
| ----------------------- | --------------------------------------- | -------------------------------------- |
| Casa do Pet             | sempre suave                            | volta pra Z1 (Quarto Vivo)             |
| Floresta das Expedições | há expedição disponível ou em andamento | abre `ExpeditionsCard` em sheet        |
| Vale das Missões        | há missões diárias pendentes            | abre `MissionsTodayCard` em sheet      |
| Lago do Descanso        | energia do pet < 40                     | abre `PetCareActionSheet kind="sleep"` |
| Torre da Evolução       | pet pronto pra evoluir                  | abre `PetEvolutionCard` em sheet       |

Cada região é um `<RoomHotspot>` (reaproveita o componente da Fase 1) posicionado em `%`, com glow pulsante condicional. Pulse mais forte quando há ação urgente.

### 4. Transição Z1 ↔ Z2

Em `PetLivingRoom`, novo state `zoomLevel: "room" | "kingdom"`. Quando `kingdom`:

- `<PetLivingRoom>` aplica `scale-50 opacity-0` em 600ms
- `<PetKingdomMap>` aparece com `scale-100 opacity-100` em 700ms (delay 200ms)

Gesto pinch-out (`@use-gesture/react` se já existir — senão, swipe-up de 2 dedos detectado manualmente). Scroll wheel up no desktop dispara o mesmo. Botão `<ZoomControls>` (já existe disabled) vira ativo: "Ver o reino" / "Voltar pro quarto".

Reduced-motion: cross-fade simples sem scale.

### 5. Vida ambiente

- Nuvens: 2 PNGs deslocando 60s em loop, `translateX` de -100% a 100%
- Lago: `filter: brightness` oscilando 4s
- Chaminé: 3 `<div>` de fumaça com `animation-delay` escalonado (CSS puro)
- Pássaros: 2 SVG silhuetas cruzando o céu a cada 25s
- Day/night: reusa `usePetDayNight()` da Fase 1

### 6. KingdomHUD

Topo minimalista: nome do reino (gerado uma vez via `petName + "'s Realm"` salvo em localStorage), streak atual (chama de fogo + número), nível do pet (estrela + número). Sem cards, só texto sobreposto com `drop-shadow`.

### 7. Persistência

- `localStorage["pet:last-zoom"]` lembra se o usuário estava em Z1 ou Z2 e restaura ao abrir `/meu-pet`
- Nenhuma migração de banco

---

## Detalhes técnicos

**Arquivos novos:**

- `src/components/pet/PetKingdomMap.tsx`
- `src/components/pet/MapBackground.tsx`
- `src/components/pet/MapClouds.tsx`
- `src/components/pet/KingdomHUD.tsx`
- `src/components/pet/RegionHotspot.tsx` (wrapper sobre `RoomHotspot` com lógica de glow por região)
- `src/assets/pet-kingdom/kingdom-map-day.png.asset.json`
- `src/assets/pet-kingdom/kingdom-map-night.png.asset.json`
- `src/assets/pet-kingdom/kingdom-clouds.png.asset.json`

**Arquivos modificados:**

- `src/components/pet/PetLivingRoom.tsx` — adiciona `zoomLevel` state, gesto pinch-out, animação de saída, renderiza `<PetKingdomMap>` quando `zoomLevel === "kingdom"`
- `src/routes/meu-pet.tsx` — nenhuma mudança estrutural; modais já são compartilhados via Sheet
- `src/styles.css` — keyframes `cloud-drift`, `water-shimmer`, `chimney-smoke`, `bird-cross`

**Sem alterações em:**

- Backend
- Modais (`ExpeditionsCard`, `MissionsTodayCard`, `PetEvolutionCard`, `PetCareActionSheet`) — reaproveitados inteiros
- Fase 1 (Quarto Vivo continua funcionando exatamente igual quando `zoomLevel === "room"`)

**Performance:**

- 2 PNGs de mapa (~250kb cada) + 1 PNG de nuvens (~80kb) = ~580kb, lazy load só quando `zoomLevel === "kingdom"` pela primeira vez
- Animações CSS-only, GPU-accelerated

---

## Critério de "pronto"

1. Pinch-out ou clique em "Ver o reino" sai do quarto e abre o mapa com transição suave
2. As 5 regiões aparecem nas posições corretas
3. Glow pulsa nas regiões com ação pendente (testar zerando energia / forçando expedição)
4. Tocar em cada região abre o modal correto
5. Tocar na casa central volta pro Quarto Vivo com zoom-in
6. Day/night muda o bg do mapa também
7. Nuvens e ambiente animam suavemente
8. Reduced-motion respeitado
9. Funciona em iPhone SE (375px) e iPad (1024px)
10. localStorage restaura o último zoom ao recarregar
