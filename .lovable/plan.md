## "Noite" (evening) mais noturna, mas distinta da madrugada

Hoje o evening usa um overlay rosado/violeta + laranja forte que parece pôr-do-sol, e não "noite". A madrugada já ocupa o território roxeado/lilás. Vou mover o evening para **azul-noite profundo** com apenas um resquício morno bem baixo (último brilho do horizonte) — claramente noturno, e visualmente separado da madrugada lilás.

### Eixos de diferenciação evening ↔ night (madrugada)

| Eixo | Evening (proposto) | Night/Madrugada (mantém) |
|------|--------------------|--------------------------|
| Hue dominante | Azul profundo (~250–265) | Lilás/violeta (~285) |
| Temperatura | Fria + filete morno no horizonte | Frio puro, lilás |
| Brilho | Mais escuro, denso | Mais claro, etéreo |
| Astro | Lua cheia (já é) | Lua crescente (já é) |
| Partículas | Estrelas frias começando a aparecer | Estrelas brancas brilhantes |

### Mudanças em `src/styles.css` — bloco `:root[data-period="evening"]`

- `--atmos-overlay`: trocar o radial roxo+laranja por:
  - radial principal **azul-noite profundo** no topo (hue ~255, L ~0.35, alpha ~0.65)
  - radial secundário **âmbar baixo e tênue** no canto inferior (hue ~45, alpha ~0.18) — sugere o último resquício do pôr-do-sol no horizonte, sem dominar
  - linear sutil escurecendo de cima pra baixo (azul-noite, alpha ~0.20)
- `--atmos-glow`: glow azul-noite (hue ~255, alpha ~0.65) — não mais rosa.
- `--atmos-tint`: véu azul frio (hue ~255, alpha ~0.18).
- `--atmos-particle`: partículas brancas levemente azuladas (hue ~250, alta claridade) — começam a parecer estrelas, mas menos brilhantes que madrugada.
- `--atmos-celestial`: lua cheia em branco-azulado frio (hue ~250, croma baixo ~0.04) — em vez do tom dourado quente atual.

### Sem alterações
- `night` (madrugada): permanece lilás/roxeado como definido.
- Lógica JS, componentes, `CelestialIcon` (lua cheia para evening já está correta), seletor de preview: intocados.
- `morning` e `afternoon`: intocados.

### Validação
Alternar no seletor de `/conta` entre **Noite** e **Madrugada** e confirmar:
- Evening = céu claramente noturno, azul profundo, com lua cheia branca-fria e um resíduo morno discreto no horizonte.
- Madrugada = continua lilás/roxeada com crescente — visualmente inconfundível com evening.
