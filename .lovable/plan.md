## Auditoria profunda de legibilidade — diagnóstico + reforma estrutural

### Diagnóstico raiz (não é problema de página, é sistêmico)

A app combina 4 camadas que se acumulam por cima do texto e roubam contraste:

```
[ texto / chip / botão ]      ← muitas vezes em /60–/70 (translúcido)
[ blur backdrop ]             ← 14–20px, amplia hue do fundo
[ atmos-tint ]                ← véu de cor (azul/lilás/âmbar) global
[ atmos-overlay ]             ← radiais coloridos fortes (0.45–0.65 alpha)
[ background base ]
```

Quando o fundo é claro e a atmosfera é morna isso passa. Quando a atmosfera vira Noite/Madrugada (radiais azul/lilás 0.65) qualquer chip com `bg-card/60` desaparece. Os sintomas que você lista — "lavado", "elementos sumindo", "estado inativo apagado", "tabs sem peso" — todos saem disto.

Outros vetores que pioram:

- `shadow-glow` aplicado a **fundos brancos** (cards `bg-card/70 backdrop-blur`) — borra o contorno e tira definição.
- Estado ativo de pills/chips com `shadow-glow` rose por cima de overlay rose-tintado → o ativo "vaza" e se confunde com o inativo.
- `text-muted-foreground` em subtítulos longos sobre `atmos-tint` colorido (já reforcei o token; ainda há casos de `text-foreground/70` em cima de gradiente que precisam virar `/85`).
- Cores arbitrárias (`text-orange-500`, `text-amber-500` em ícones de stat) que ignoram o sistema e mudam de leitura entre temas.

### Princípios da reforma (regras globais, aplicadas como sistema)

1. **Pirâmide de superfícies**: cada elemento tem uma "altitude" e sua opacidade mínima cresce com a importância.

   | Camada | Uso | Opacidade mínima |
   |---|---|---|
   | Tela / fundo | bg da página | n/a (recebe atmosfera) |
   | Superfície base | grandes painéis (`.glass`, hero cards) | 0.85 (era 0.7) |
   | Superfície de conteúdo | cards de post, listas | **1.0 (opaco)** |
   | Controle inativo | chips, pills, tabs inativas | **1.0 (opaco)** + borda visível |
   | Controle ativo | chip ativo, botão primário | 1.0 + cor de marca cheia |
   | Overlay efêmero (modal, popover) | dialog/dropdown | 0.95 + blur |

   Regra: **nenhum controle clicável < 0.85 de opacidade**. Para isso troco `bg-card/60`, `bg-background/60`, `bg-muted/40` em chips/pills/botões por classes opacas com borda.

2. **Blur intencional**: blur é só para overlays flutuantes (header sticky, modal, popover, sticker picker). Cards de conteúdo perdem `backdrop-blur`. Padronizo só duas intensidades:

   - `backdrop-blur-sm` (8px) → header sticky, footer chat, dropdown.
   - `backdrop-blur-md` (12px) → modal/sheet/dialog overlay.
   - Remover de: cards do `/inicio` (`bg-card/70 backdrop-blur`), chips de seta do carrossel, listas de stats. Esses viram superfície opaca.

3. **Glow controlado**: `shadow-glow` só em CTAs primários ("Iniciar agora", "Demonstrar interesse", "Novo chamado"). Removido de chips ativos (filtros do devocional já trocados; vou padronizar como ring de marca em vez de glow) e de logo do header (já é pequeno o suficiente para não atrapalhar).

4. **Hierarquia de texto** (3 níveis, oklch fixo):
   - Título → `text-foreground` (token).
   - Subtítulo / lead → **novo token `--foreground-soft`** (light 0.30, dark 0.86) — mais legível que `muted-foreground` mas sem virar título. Aplicado via nova classe utilitária `.text-soft`.
   - Auxiliar / metadado → `text-muted-foreground` (já reforçado).
   - Aboli o uso de `text-foreground/70` solto: vira `.text-soft`.

5. **Estado de controles segmentados** (tabs, filtros, pills) — padrão único:
   - Inativo: `bg-card` opaco + `border-border` + `text-foreground/85`.
   - Hover: `bg-accent` + `text-foreground`.
   - Ativo: `bg-[var(--rose)]` + `text-white` + **`ring-2 ring-[var(--rose)]/30`** (substitui `shadow-glow`, que vazava).
   - Diferença ativo vs inativo: cor de fundo cheia, não brilho. Funciona em qualquer atmosfera.

6. **Atmosfera mais discreta nas áreas de leitura**: reduzir alpha do `--atmos-tint` em ~25% (já que o overlay radial já dá ambiente). Subtítulos param de "lavar".

### Mudanças concretas

#### Em `src/styles.css`
- Adicionar token `--foreground-soft` (light + dark) e classe `.text-soft`.
- Diminuir alpha de `--atmos-tint` nos 4 períodos em ~25%.
- Atualizar `.glass` para 0.85/0.82 (era 0.7/0.7) e blur 12px (era 14px).
- Definir utilitárias `.surface-1` (card opaco com border + shadow-soft) e `.surface-control` (controle opaco interativo) para reuso.

#### Em `src/components/ui/tabs.tsx`
- Aplicar padrão segmentado: TabsList com `bg-muted/70` opaco; TabsTrigger inativo `text-foreground/85`, ativo com `ring-2 ring-ring/25` em vez de `shadow`.

#### Em `src/routes/devocional.tsx`
- `FilterChip` ativo: trocar `shadow-glow` por `ring-2 ring-[var(--rose)]/30`.
- Chips de reação inativos: já estão opacos; só ajustar texto para `.text-soft`.
- Subtítulo do header → `.text-soft`.

#### Em `src/routes/inicio.tsx` (foco mobile)
- Remover `backdrop-blur` dos 6 cards de seção principais (`bg-card/70` → `bg-card` + `shadow-soft`).
- Botões secundários com `bg-white/40 backdrop-blur` viram `variant="outline"` padrão (opaco).
- Itens de lista `bg-background/40` → `bg-card` + border.

#### Em `src/routes/comunidade.tsx`
- Subtítulo do header e prévia de mensagens citadas → `.text-soft`.
- Item de mensagem fixada (`bg-background/60`) → opaco.

#### Em `src/routes/perfil.tsx`
- Subtítulo → `.text-soft`.
- Card de role (`text-muted-foreground` em descrição) → `.text-soft`.

#### Em `src/components/layout/Header.tsx`
- Confirmar que mobile menu sticky (`bg-card/95 backdrop-blur`) mantém — está no nível "overlay efêmero".

#### Em `src/routes/conversas/$matchId.tsx`
- Footer do chat (`bg-background/80 backdrop-blur`) → mantém (header sticky), reduz blur para `backdrop-blur-sm`.
- `shadow-glow` em mensagem destacada → `ring-2 ring-primary/40`.

#### Cores arbitrárias para alinhamento ao sistema
- `text-orange-500`, `text-amber-500` (ícones de stat) → `text-[var(--rose)]` e `text-[var(--gold)]`. Mantém a função semântica e responde ao tema.

### O que NÃO muda

- Identidade visual: rose/coral/petal/gold intactos.
- Animações e micro-interações.
- Tipografia (fontes, escalas).
- Lógica de atmosfera (apenas o tint ganha alpha menor).
- Modais, dialogs, sheets: já estão no nível correto.

### Como vou validar (mobile-first 390x844)

Checklist por página, em modo claro e escuro, alternando os 4 períodos via seletor de `/conta`:

1. `/inicio` — hero, cards de seção, listas.
2. `/devocional` — filtros, reações, post.
3. `/comunidade` — header, lista de mensagens, input.
4. `/perfil` — header, tabs, cards de role.
5. `/conversas/:id` — bolhas, footer.
6. `/matches` — cards de match.
7. Modais (criar recado, novo chamado).

Critério de aprovação por elemento:
- Texto principal: contraste ≥ 7:1.
- Texto secundário: ≥ 5:1.
- Controle inativo: identificável sem hover, em qualquer atmosfera.
- Controle ativo: distinguível do inativo por cor (não só por brilho).
- Nenhum chip clicável transparente sobre o radial da atmosfera.

### Escopo desta entrega

A reforma é grande mas localizada a:
- 1 arquivo de tokens (`src/styles.css`)
- 1 primitivo (`tabs.tsx`)
- 6 rotas (`inicio`, `devocional`, `comunidade`, `perfil`, `conversas/$matchId`, `notificacoes`)
- 1 utilitário compartilhado novo: classe `.text-soft`

Sem novas dependências, sem mudança de layout, sem mudança de identidade.
