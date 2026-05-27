# Ambientação Dinâmica por Horário — Estudo Conceitual

> Apenas planejamento. Nada será codado nesta etapa.

A imagem do `/inicio` (madrugada, "Boa madrugada, Tony", lua + estrelas discretas, gradiente lavanda→pêssego) já é a prova de conceito do tom certo: **emocional, premium, quase imperceptível**. A proposta é generalizar esse mesmo princípio para os 4 períodos, mantendo a identidade VaiDarNamoro intacta.

---

## 1. Princípios norteadores

- **Sutileza acima de tudo**: o usuário deve *sentir*, não *notar*. Se ele consegue descrever a mudança em palavras técnicas, foi longe demais.
- **Identidade preservada**: tokens primários (rosa/coral, gradiente do logo, botão "Ver pretendentes") **não mudam**. Só muda a *atmosfera ao redor*.
- **Mudança gradual, nunca abrupta**: transições em minutos, não em segundos. Crossfade longo (~60–90s) entre períodos. Sem flash ao virar a hora.
- **Camada cosmética, não estrutural**: zero alteração em layout, tipografia, espaçamento, hierarquia ou componentes. Só luz, cor de fundo e micro-partículas.
- **Opt-out respeitoso**: respeitar `prefers-reduced-motion` (sem partículas/animação) e oferecer toggle nas configurações.

---

## 2. Os 4 períodos

Faixas sugeridas (horário local do device):

| Período    | Faixa        | Metáfora sensorial                  |
|------------|--------------|-------------------------------------|
| Manhã      | 05:00–11:59  | Luz dourada entrando pela janela    |
| Tarde      | 12:00–17:59  | Luz natural, neutra, equilibrada    |
| Noite      | 18:00–23:59  | Aconchego, lâmpada quente, intimidade |
| Madrugada  | 00:00–04:59  | Silêncio, lua, contemplação         |

### Paleta atmosférica (apenas tokens de *ambiente*, não de marca)

- **Manhã** — overlay quente translúcido: dourado pálido + pêssego claro. Glow do hero levemente âmbar. Sombras suaves e altas (sol baixo).
- **Tarde** — quase neutro: branco levemente perolado, contraste limpo, sem glow extra. É o "estado base" — referência para os outros.
- **Noite** — overlay frio translúcido: índigo suave + violeta esfumaçado. Glow do hero rosa-quente (contraste lâmpada vs. fora). Sombras mais densas e curtas.
- **Madrugada** — exatamente o que está na imagem: lavanda → pêssego desbotado, lua crescente, estrelas mínimas, brilho global -10%.

Todos os overlays são **<8% de opacidade** sobre o fundo atual. Nenhum substitui cor existente.

---

## 3. O que pode mudar (camadas permitidas)

Em ordem de sutileza (do mais discreto ao mais expressivo):

1. **Temperatura de cor do background global** — gradiente atmosférico no `<body>` ou no card hero, deslocando ±3–5° de matiz.
2. **Glow do card principal** — `box-shadow` colorido do hero muda de tom (âmbar / neutro / rosa-quente / lavanda-frio).
3. **Saudação contextual** — "Bom dia / Boa tarde / Boa noite / Boa madrugada" + emoji discreto (☀️ ☀️ 🌙 ✨). *Já existe na imagem*.
4. **Ícone celestial no hero** — sol baixo / sol alto / lua cheia / lua crescente. Apenas no card de boas-vindas do `/inicio`.
5. **Partículas ambientais** — densidade e tipo variam:
   - Manhã: 2–3 motas de poeira douradas, flutuação muito lenta.
   - Tarde: nenhuma (silêncio visual).
   - Noite: 3–5 pontos de luz quentes, pulsação lenta.
   - Madrugada: 4–6 estrelinhas (como já existe), brilho intermitente lento.
6. **Intensidade de blur/glassmorphism** — +5% à noite/madrugada (sensação de neblina), padrão de dia.
7. **Microcopy de incentivo** — frase secundária do hero adaptada ao período (já existe parcialmente).

### O que NÃO muda (lista de proibições)

- Cores de marca (logo, primário, gradientes de CTA).
- Tipografia, tamanhos, pesos.
- Layout, grid, espaçamento, raios de borda.
- Ícones funcionais (menu, ações, navegação).
- Modo escuro vs claro — isso é controle do usuário, ortogonal à hora.
- Componentes de conteúdo do usuário (mensagens, fotos, cards de perfil).

---

## 4. Aplicação por página

| Página              | Recebe ambientação? | Intensidade | Justificativa                                                        |
|---------------------|---------------------|-------------|----------------------------------------------------------------------|
| `/inicio` (Home)    | **Sim — total**     | Alta        | Página emocional de boas-vindas, é o "lobby". Já tem hero perfeito.  |
| `/devocional`       | **Sim**             | Média       | Contemplativa por natureza; combina com atmosfera.                   |
| `/comunidade` (chat global) | **Sim — leve**| Baixa       | Só fundo + glow; sem partículas (distrai durante leitura/digitação). |
| `/perfil` (próprio) | **Sim — leve**      | Baixa       | Reforça "espaço seu", mas sem competir com fotos/dados.              |
| `/matches` / pretendentes | **Não**       | —           | Fotos dos usuários devem dominar; ambiente neutro evita interferir.  |
| Conversa privada 1:1| **Não** (ou mínimo) | Mínima      | Intimidade já é dada pelas mensagens; partícula seria ruído.         |
| Onboarding / Auth   | **Não**             | —           | Primeira impressão deve ser consistente para todos.                  |
| Admin / Moderação   | **Não**             | —           | Contexto de trabalho, ambientação atrapalha.                         |

---

## 5. Micro-detalhes premium (banco de ideias)

- **Lua que muda de fase** ao longo do mês (madrugada/noite) — detalhe de fidelidade absurda, custo zero de performance.
- **Sol que sobe/desce de altura** dentro do card hero conforme avança a manhã/tarde.
- **Estrelas com paralaxe sutilíssima** ao scroll (já temos as estrelas — falta o paralax de 2–4px).
- **Transições crepusculares** — nas janelas 5:00–6:00, 11:30–12:30, 17:30–18:30, 23:30–00:30, blend de 30–60min entre dois períodos em vez de switch.
- **Glow do CTA "Ver pretendentes"** ganha +3% de saturação à noite (lâmpada destacando).
- **Cursor/tap ripple** levemente dourado de manhã, levemente azul à noite (desktop).
- **Loader/skeleton shimmer** muda de tom quente↔frio.

---

## 6. UX — como não cansar nem poluir

- **Regra de ouro**: se o usuário fica numa página por >5min, *nada deve continuar se mexendo agressivamente*. Partículas com período de animação ≥8s.
- **Limite de elementos animados simultâneos**: máx. 6 partículas + 1 elemento celestial + 1 glow. Nada mais.
- **Sem som**, sem haptics, sem notificação da mudança ("Bom dia!" pop-up = ❌).
- **Acessibilidade**: `prefers-reduced-motion` → desliga partículas, mantém só a cor de fundo estática do período.
- **Toggle em Configurações**: "Ambiente dinâmico: ligado / só cores / desligado".

---

## 7. Performance

- **Tudo em CSS quando possível**: variáveis CSS atualizadas por um único hook que detecta o período. Crossfade via `transition: background 60s ease`.
- **Partículas em SVG/CSS, não canvas**: 4–6 nodes absolutos animados via `@keyframes`, GPU-friendly (`transform` + `opacity` apenas). Zero JS por frame.
- **Imagem da lua/sol**: SVG inline (<2KB cada), 4 assets totais. Sem requests.
- **Detecção de período**: 1 timer leve que recalcula a cada minuto e atualiza um `data-period` no `<html>`. CSS faz o resto.
- **Sem libs novas**: aproveita Framer Motion já presente apenas onde precisar de entrada/saída de partícula.
- **Custo total estimado**: <5KB de CSS extra, <8KB de SVGs, ~0% CPU em idle.

---

## 8. Arquitetura proposta (alto nível, sem código)

```text
useTimeOfDay() hook
   └─ retorna 'morning' | 'afternoon' | 'evening' | 'night'
   └─ aplica data-period no <html>

styles.css
   └─ [data-period="morning"]  { --atmos-overlay: ...; --atmos-glow: ...; }
   └─ [data-period="afternoon"]{ ... }
   └─ [data-period="evening"]  { ... }
   └─ [data-period="night"]    { ... }

<AtmosphereLayer />  (componente decorativo, opcional por página)
   └─ renderiza partículas + celestial conforme data-period
   └─ pointer-events: none, aria-hidden, respeita reduced-motion

Páginas escolhem se montam <AtmosphereLayer /> ou não.
```

---

## 9. Roadmap sugerido (quando for implementar)

1. **Fase 1 — Tokens atmosféricos**: definir as 4 paletas de overlay/glow em `styles.css`, aplicar só no `/inicio` (que já está pronto visualmente).
2. **Fase 2 — Hook + crossfade**: detecção de período + transição suave global.
3. **Fase 3 — Partículas modulares**: componente `<AtmosphereLayer>` plugável.
4. **Fase 4 — Expansão controlada**: aplicar em `/devocional`, depois `/comunidade` (leve), depois `/perfil`.
5. **Fase 5 — Toggle + acessibilidade**: configuração do usuário + `prefers-reduced-motion`.
6. **Fase 6 — Polimento**: fases da lua, paralaxe, microcopy contextual por período.

---

## 10. Riscos a evitar

- ❌ Virar "app temático" (estilo Halloween/Natal).
- ❌ Mudar cor de marca para combinar com período.
- ❌ Notificar a mudança ("Boa noite chegou!").
- ❌ Partículas em páginas de leitura intensa (chat, devocional longo).
- ❌ Dependência de timezone do servidor — sempre horário local do device.
- ❌ Confundir com modo escuro/claro — são sistemas independentes.

---

**Próximo passo possível**: definir as 4 paletas de overlay em hex/oklch e validar visualmente antes de qualquer código. Posso preparar mockups de cada período sobre o `/inicio` atual para você comparar lado a lado, ou avançamos direto para a Fase 1 do roadmap quando quiser construir.