## Escopo

Dois ajustes no `PetCareHistorySheet` e uma verificação de push.

### 1. Resumo do dia no topo do log

Adicionar uma faixa entre o strip de datas e a lista de eventos, recalculada a partir de `filtered` (eventos do dia selecionado):

- **Ações**: total de eventos no dia.
- **Ganho**: soma de `delta` positivos (recurso recuperado).
- **Gasto**: soma de `cost_coins`.
- **Tipos**: contagem de `kind` distintos (ex.: "3 tipos de cuidado").

Layout: 3–4 mini-cards em grid horizontal, com ícone lucide (`Activity`, `TrendingUp`, `Coins`, `Layers`), número grande e label pequena. Mesma identidade visual minimalista (neutral-200 border, sem emoji). Esconde quando `filtered.length === 0` (aí entra o empty state abaixo).

### 2. Empty state ilustrado por dia

Substituir o texto seco "Nenhuma ação registrada neste dia" por um bloco centralizado com:

- Ícone grande (`PawPrint` ou `Moon` se o dia for hoje/futuro vs. passado) num círculo neutral-100.
- Título: "Dia tranquilo" (passado) / "Nada por aqui ainda" (hoje).
- Subtítulo curto contextual: passado → "Seu pet não recebeu cuidados neste dia."; hoje → "Cuide do seu pet para registrar o primeiro evento."
- CTA opcional só quando `selectedDay === hoje`: botão "Ir para cuidados" que fecha o sheet (chama `onOpenChange(false)`) e volta o foco pro card de needs.

Mantém a tela "viva" em vez de branca, sem virar ruído.

### 3. Push de cuidado do pet — apenas verificar

Já confirmei via cron: o job `pet-care-reminders-daily` (`0 12 * * *`) está com `active: true` chamando `public.enqueue_pet_care_reminders()`. Nada a fazer no código — só registrar isso na resposta final pro usuário.

## Detalhes técnicos

- Arquivo único alterado: `src/components/pet/PetCareHistorySheet.tsx`.
- Resumo: `useMemo` derivado de `filtered`, evitando recomputar a cada render.
- Ícones: importar `Activity`, `Coins`, `Layers`, `PawPrint`, `Moon` de `lucide-react` (zero emoji, conforme core memory).
- O empty-state CTA usa `onOpenChange(false)` — não precisa de navegação extra, o card de cuidados já está na mesma rota `/meu-pet`.
- Sem mudança em schema, RLS, server functions ou push pipeline.
- Sem mexer em swipe-to-close, strip de datas ou fetch.

## Fora de escopo (ideias anteriores não pedidas agora)

Filtro por tipo, scroll além de 7 dias, agrupamento por sessão, share/export, indicador de atividade no strip, recibo do bundle, missões diárias, conquistas.