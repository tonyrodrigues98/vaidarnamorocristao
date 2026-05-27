## Legibilidade — chips e superfícies translúcidas sobre a atmosfera

### Diagnóstico

O problema circulado no print é o filtro `Mais comentados` / `Mais reações` em `/devocional`. O chip inativo usa `bg-card/60` (40% transparente). Por baixo passa o `--atmos-overlay` azul da Noite/Madrugada — o chip "desaparece" sobre o azul e a borda `border-border` quase some.

Esse mesmo padrão (`bg-card/60`, `bg-background/60`, `bg-muted/40` em superfícies pequenas) aparece em vários pontos. Os casos que mais sofrem com a atmosfera são os **interativos pequenos**, onde o usuário precisa identificar rapidamente o controle:

| Componente | Arquivo | Problema |
|---|---|---|
| `FilterChip` (Mais recentes / comentados / reações) | `src/routes/devocional.tsx` (linha 672) | inativo translúcido, sem peso visual |
| Chips de reação (curtir/amar/etc.) no PostCard | `src/routes/devocional.tsx` (linha 818) | inativo translúcido sobre fundo do post |
| Stats compactos do header devocional | já são `glass` opacas — OK |

### Solução (mudanças localizadas)

#### A. `FilterChip` em `/devocional` (linhas 672–693)
- Inativo: `bg-card/60` → `bg-card` (opaco) + `border-border/80` + `shadow-soft` discreto.
- Ativo: manter `bg-[var(--rose)]` + `text-white` + `shadow-glow`.
- Texto inativo: `text-foreground/70` → `text-foreground/85` para ganhar contraste.
- Estado `hover` inativo: `hover:bg-muted` → `hover:bg-accent` para feedback mais nítido.

#### B. Chips de reação no PostCard (linha 818)
- Inativo: `bg-card/50` → `bg-card` (opaco) + `border-border/80`.
- Ativo: já tem fundo rose tintado, mantém.
- Ícone inativo: `text-muted-foreground` → `text-foreground/70`.

#### C. Nada mais
- Não mexer em superfícies grandes (`.glass`, cards de post, footers) — elas já têm tamanho suficiente para contraste e a translucidez faz parte da estética.
- Não tocar em `comunidade`, `inicio`, `__root`, `conversas`: as superfícies translúcidas ali são grandes (footers, painéis de chat) e não causam o mesmo problema de identificação rápida.
- Tokens globais (`--muted-foreground`, atmosfera, marca): intactos.

### Verificação
- `/devocional` em Manhã, Tarde, Noite e Madrugada via seletor em `/conta`: os 3 chips de filtro continuam claramente visíveis em todas as atmosferas; o chip ativo se destaca.
- Reações em um post: igualmente legíveis.
