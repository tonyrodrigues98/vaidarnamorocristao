## O que vamos construir

Quando o usuário tocar no card da expedição em andamento (`ActiveRunCard` em `ExpeditionsCard.tsx`), abrir um modal full-screen cinematográfico que mostra o pet vivendo a aventura em tempo real — não um log de texto, mas uma cena viva.

### Anatomia do modal

1. **Cena de fundo** — a imagem da expedição preenche o modal inteiro com:
   - Vinheta escura nas bordas pra dar profundidade
   - **Parallax sutil**: imagem amplia ~5% conforme o progresso avança (zoom cinematográfico lento)
   - **Camada de clima** sobreposta conforme o bioma da expedição (derivado do slug/nome):
     - Neve/montanha → flocos caindo
     - Deserto → poeira dourada flutuando
     - Floresta/jardim → folhas/pólen suaves
     - Caverna/santuário → partículas de luz subindo
     - Noite/aurora → estrelas piscando
   - **Ciclo dia→noite**: tonalização da cena muda do amanhecer (azul-laranja) → meio-dia (claro) → entardecer (âmbar) → noite (azul-índigo) conforme % de progresso
   - Avatar do pet em silhueta no canto inferior, com micro-animação de respiração/caminhada

2. **HUD superior** (overlay sobre a cena)
   - Título da expedição + badge de dificuldade
   - Barra de progresso fina e elegante (gradient indigo→fuchsia) com tempo restante tabular
   - Botão fechar

3. **Cards flutuantes de eventos** — sobrepostos na parte inferior central:
   - 3 cards visíveis máximo, empilhados com leve transparência (o mais recente em destaque)
   - Cada evento entra com `fade-in` de baixo, vive ~8s, depois desliza pra trás e desaparece
   - Cada card tem: ícone lucide pequeno, frase do evento (1-2 linhas), e timestamp relativo ("agora", "12min atrás")
   - Novo evento aparece a cada ~30-60s reais (ritmo varia por dificuldade — mais eventos em hard/extreme)

4. **Rodapé** — quando `ready === true`, substitui os cards flutuantes pelo botão grande "Coletar recompensas" com pulse sutil. Antes disso, mostra discreto "Volte mais tarde — sua aventura continua".

### Como os 500+ eventos funcionam (pool combinatório)

Em vez de 500 frases hard-coded, geramos via templates com slots — manutenção mínima, variedade altíssima, controle editorial total.

**Estrutura** (`src/lib/expeditionStoryEngine.ts`):

```ts
// Pools temáticos
const BIOMES = {
  mountain: { creatures: [...20], places: [...20], actions: [...20], discoveries: [...20] },
  desert:   { creatures: [...20], places: [...20], actions: [...20], discoveries: [...20] },
  forest:   { ... },
  sanctuary:{ ... },
  market:   { ... },
  night:    { ... },
  // ~6 biomas
};

// ~25 templates por categoria de fase × 4 fases = ~100 templates
// Ex: "Seu pet {action} perto de {place} e {discovery}."
//     "{creature} cruzou o caminho. Seu pet {reaction}."
```

Cada slot tem 15-25 opções → milhares de combinações únicas por bioma. Os eventos são determinísticos por `(expedition_id, run_id, event_index)` usando um seed PRNG, então o usuário vê a mesma sequência se reabrir o modal (continuidade narrativa), mas cada expedição tem sequência única.

**Mapeamento bioma**: derivamos do slug atual (`cume-da-alianca` → mountain, `travessia-do-deserto` → desert, etc.) via tabela simples — sem mudanças no DB.

**Eventos especiais raros (~5% dos slots)**:
- Achado de item ("Encontrou {item_reward_label} brilhando entre as folhas") — só aparece se a expedição tem item_reward
- Momento de oração/reflexão wholesome ("Parou e contemplou {place}")
- Pequeno susto que vira aprendizado

### Detalhes técnicos

- **Sem mudanças de schema**: tudo client-side. O modal calcula quantos eventos já "aconteceram" baseado em `(now - started_at) / event_interval` e renderiza os últimos 3.
- **Performance**: partículas são divs CSS com `transform` + `animation` (sem canvas). 15-25 partículas no máximo, animadas via keyframes.
- **Determinismo**: usar `mulberry32(hashStringToInt(run_id + event_index))` pra escolher slots, garantindo mesma narrativa em reaberturas.
- **Mobile-first**: modal usa `Dialog` do shadcn com `max-w-md` e altura quase full, design pensado pra 393x697.

### Estrutura de arquivos

**Novos:**
- `src/lib/expeditionStoryEngine.ts` — biomas, pools, templates, função `getEventAt(runId, index, context)`, mapping slug→bioma
- `src/components/pet/ExpeditionLiveSceneModal.tsx` — o modal completo (cena + HUD + partículas + cards de evento)
- `src/components/pet/SceneWeatherLayer.tsx` — partículas animadas por bioma (reutilizável)

**Editados:**
- `src/components/pet/ExpeditionsCard.tsx` — `ActiveRunCard` vira clicável (`role=button`), abre o modal; passa props necessárias (`active`, `now`, `onClaim`, `busy`)

### Fora do escopo

- Sem persistir eventos no DB (são deterministicamente recalculáveis)
- Sem áudio/som (pode ser fase 2)
- Sem mudar o card listado (só o ativo abre modal)
- Sem editor admin para os pools (texto fica no código por ora)

### Quality bar

- Abrir o modal numa expedição de 1h e voltar 20min depois mostra os 3 últimos eventos coerentes (não os mesmos primeiros)
- Trocar de expedição = clima e eventos visivelmente diferentes (montanha gelada ≠ deserto)
- Animações suaves a 60fps em mobile (transform/opacity only)
- Botão "Coletar" só aparece quando `ready === true`
