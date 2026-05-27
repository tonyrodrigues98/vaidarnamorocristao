## Diferenciar Manhã (inverno) vs Tarde (alaranjada)

Atualmente os dois períodos usam tons quentes amarelados muito parecidos (hue 65-90). Vou reposicionar cada um numa direção distinta, sem mexer em evening/night.

### Manhã — "manhã de inverno" (fria, suave, menos ensolarada)
Paleta deslocada para azul-pálido/lavanda frio + um toque dourado tímido só no canto. Sensação de neblina fria e luz baixa.

- `--atmos-overlay`: radial azul-acinzentado frio no topo (hue ~230, baixa saturação) + leve pêssego pálido no canto (hue ~50, opacidade reduzida ~0.15).
- `--atmos-glow`: glow frio sutil (hue ~220, opacidade menor ~0.35).
- `--atmos-tint`: véu branco-azulado leve (hue ~230, alpha ~0.10).
- `--atmos-particle`: partículas brancas frias (quase neutras, hue ~230).
- `--atmos-celestial`: sol pálido de inverno (claridade alta, croma baixíssimo ~0.05, hue ~80).

### Tarde — mais alaranjada (golden hour suave)
Deslocar do amarelo neutro atual para laranja-âmbar mais quente e visível.

- `--atmos-overlay`: radial âmbar-laranja no topo (hue ~50, alpha ~0.45) + segundo radial pêssego quente no canto (hue ~35, alpha ~0.30). Remover o azul atual.
- `--atmos-glow`: glow âmbar mais saturado (hue ~55, alpha ~0.65).
- `--atmos-tint`: véu âmbar quente (hue ~55, alpha ~0.14).
- `--atmos-particle`: partículas douradas-alaranjadas (hue ~55).
- `--atmos-celestial`: sol âmbar quente (hue ~60, croma ~0.18).

### Escopo
- Arquivo único: `src/styles.css`, blocos `:root[data-period="morning"]` e `:root[data-period="afternoon"]` (linhas 394–409).
- Sem mudanças em evening, night, lógica JS, componentes ou seletor de preview.
- Validação: usar o seletor manual em `/conta` para alternar Manhã ↔ Tarde e confirmar contraste visual claro.
