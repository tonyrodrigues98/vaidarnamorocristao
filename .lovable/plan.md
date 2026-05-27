## Melhorar legibilidade — subtítulos e abas

### Diagnóstico

Os pontos circulados nas screenshots têm a mesma causa raiz:

1. **Subtítulos de página** (`"Edite suas informações..."`, `"Chat global em tempo real..."`) usam `text-muted-foreground`. Esse token tem contraste apertado contra o `background` e, com o overlay de atmosfera por cima, fica abaixo do limite confortável de leitura — visível em modo claro com atmosfera ativa, ainda pior na atmosfera noite/madrugada.
2. **Abas inativas do shadcn Tabs** (`Sobre mim` / `Preferências` / `Conquistas` / `Cargo`) herdam `text-muted-foreground` do `TabsList`, ficando quase indistinguíveis do fundo da lista (`bg-muted`).
3. O mesmo padrão se repete em outras telas: descrições de cards, labels de role, "Sticker" em prévias de respostas, etc.

### Solução (2 mudanças cirúrgicas, escopo global)

#### A. Reforçar o token `--muted-foreground` em `src/styles.css`

Aumentar contraste sem mudar a hue (mantém harmonia visual):

- Claro: `oklch(0.48 0.02 30)` → `oklch(0.40 0.02 30)` (de ~4.6:1 para ~6.5:1).
- Escuro: `oklch(0.72 0.02 30)` → `oklch(0.78 0.02 30)` (de ~5.0:1 para ~7.0:1).

Isso corrige automaticamente todos os subtítulos, labels secundários e descrições da app, inclusive dentro do header `Comunidade` e do header `Meu perfil`.

#### B. Aumentar contraste de abas inativas em `src/components/ui/tabs.tsx`

- `TabsList`: remover `text-muted-foreground` (não deve ditar a cor dos triggers).
- `TabsTrigger`: adicionar estado explícito inativo — `data-[state=inactive]:text-foreground/70 hover:text-foreground` — e manter `data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow`.

### Sem alterações
- Atmosfera (overlays/tints/celestial): intactos.
- Tema dark vs light, gradientes, marca (rose/coral/petal): intocados.
- Componentes shadcn fora do Tabs: intocados.

### Verificação
- `/perfil` modo claro e escuro: subtítulo "Edite suas informações..." legível; abas "Preferências/Conquistas/Cargo" claramente visíveis.
- `/comunidade`: "Chat global em tempo real..." legível em ambos os modos e em todas as 4 atmosferas (Manhã, Tarde, Noite, Madrugada) via seletor de `/conta`.
- Outras páginas (`/inicio`, `/pretendentes`, `/conta`, `/dashboard`): textos secundários ganham contraste sem efeitos colaterais.
