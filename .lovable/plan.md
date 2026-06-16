
# Sistema Grab — Sorteio de Itens + Inventário

## Visão geral

Nova feature de pet que sorteia recompensas em pools configuráveis. Tudo que hoje é compra direta (consumíveis de cuidado) ou ganho cosmético (fundos, molduras, auras, gradientes) passa a poder ser sorteado. Consumíveis de cuidado ganham um **estoque**: ao usar um item, o estoque é consumido primeiro; só cobra moedas quando o estoque zera.

- **3 grabs grátis/dia + ilimitados pagos a 10 moedas** (configurável)
- **Múltiplos pools** (Comum / Raro / Evento), cada um com seus itens e probabilidades
- **CRUD admin** completo em `/admin/pets` → nova aba "Grab"

---

## 1. Schema (migração)

### `grab_pools` — pools/caixas
`id, slug, name, description, active, sort_order, cost_coins (override do preço padrão), free_daily_uses (override do default 3), weight (peso entre pools se houver sorteio de pool), created_at, updated_at`

### `grab_pool_prizes` — itens do pool com peso
`id, pool_id, prize_kind (enum: 'care_item'|'pet_background'|'decoration'|'name_gradient'|'coins'|'xp'|'pet_buff'), prize_ref_id (uuid nullable, FK lógica conforme kind), prize_amount (int, para coins/xp/quantidade de care_item), weight (int >0), active, created_at`
- Para `care_item`: `prize_ref_id` = `pet_care_items.id`, `prize_amount` = unidades estocadas
- Para `pet_background`/`decoration`/`name_gradient`: `prize_ref_id` = id do catálogo, ignora `prize_amount`
- Para `coins`/`xp`: `prize_ref_id` null, `prize_amount` = quantia
- Para `pet_buff`: `prize_ref_id` = pet_perk_effect id (futuro)

### `grab_config` — singleton de config global
`id (sempre 1), default_free_daily int (default 3), default_paid_cost_coins int (default 10), updated_at`

### `user_grab_inventory` — **NOVO inventário com quantidade**
`id, user_id, prize_kind, prize_ref_id, quantity int (>0), created_at, updated_at` + unique `(user_id, prize_kind, prize_ref_id)`. Inicialmente usado só para `care_item`; cosméticos vão direto para suas tabelas de ownership existentes.

### `user_daily_grabs` — quota diária
`id, user_id, day date, free_used int default 0, paid_used int default 0` + unique `(user_id, day)`.

### `user_grab_log` — histórico (auditoria + UI "últimos prêmios")
`id, user_id, pool_id, prize_kind, prize_ref_id, prize_amount, was_paid bool, rolled_at`

### RPCs
- `perform_grab(_pool_id uuid)` → sorteia por weight, decide free/paid, debita moedas se pago, credita prêmio (estoque ou ownership), insere log. Retorna `{ prize_kind, prize_ref_id, prize_amount, was_paid, new_balance, free_remaining }`.
- `get_grab_state()` → retorna pools ativos + `free_used` / `free_remaining` / `paid_cost` / últimos 5 prêmios do usuário.
- `consume_care_inventory(_item_id)` → decrementa `user_grab_inventory.quantity` em 1 se houver; retorna bool "consumiu do estoque".
- Modificar `apply_pet_care`: chamar `consume_care_inventory` ANTES de `spend_coin_for_pet_care`. Se consumiu do estoque, pular cobrança de moedas.

### RLS
- Catálogo (`grab_pools`, `grab_pool_prizes`, `grab_config`): SELECT `authenticated` ativos; ALL `service_role` + admin via `has_role`.
- Tabelas de usuário: SELECT/UPDATE/INSERT scoped a `auth.uid()`; ALL `service_role`.

---

## 2. Admin — `/admin/pets` aba "Grab"

Novo `<PetGrabPanel>` em `src/components/admin/PetGrabPanel.tsx`:

- **Seção config global** (card no topo): editar `default_free_daily`, `default_paid_cost_coins` (inputs `text` + `inputMode="numeric"`).
- **Lista de pools** (cards): nome, slug, ativo (switch), custo override, free/dia override, soma de pesos. Botão "Editar prêmios".
- **Modal de edição de pool**: form do pool + tabela de prêmios com colunas: tipo (select), item (combobox carregado por tipo), quantidade, peso, % calculada (peso/sum*100), ativo, ações. Adicionar/remover linhas inline.
- **Preview de probabilidades**: ao lado de cada prêmio, mostra `(weight / Σweight) * 100%` formatado.

Adicionar entrada na `TABS` de `src/routes/admin/pets.tsx` com ícone `Gift` (já importado).

---

## 3. UI usuário

Novo bloco "Grab" no card de pet (`src/components/pet/`):

- Botão grande "Sortear" com contador `2/3 grátis hoje` ou `10 moedas`.
- Modal de resultado com animação de revelação (reuso de padrões existentes), mostrando ícone do prêmio + nome + quantidade.
- Aba/lista "Meu estoque" mostrando `user_grab_inventory` agrupado por tipo, com badge de quantidade.
- Em `PetCareActionSheet`: badge "x3 em estoque" no item; ao usar, se houver estoque, label muda para "Usar (grátis)" em vez de mostrar custo. (Tudo via lucide icons — sem emojis.)

---

## 4. Detalhes técnicos

- **Sorteio**: random weighted via `random() * sum(weight)` em PL/pgSQL com `ORDER BY` cumulativo (padrão Postgres). Tudo server-side.
- **Atomicidade**: `perform_grab` numa única transação — quota → cobrança → sorteio → credit → log. Lança erro se quota esgotada e sem moedas.
- **Idempotência**: nenhum retry duplica prêmio (não há retry transparente; cliente mostra erro).
- **Tipos**: `src/types/petGrab.ts` com enums e interfaces.
- **Lib**: `src/lib/petGrab.ts` com helpers tipados (`performGrab`, `getGrabState`, `adminListPools`, `adminUpsertPool`, `adminUpsertPrize`).
- **Memória do projeto**: respeitar regras (inputs `text`+`inputMode`, zero emojis na UI, lucide icons).

---

## 5. Ordem de execução

1. Migração: tabelas + RLS + GRANTs + RPCs + alteração de `apply_pet_care` + seed inicial (1 pool "Comum" vazio + `grab_config` default).
2. Tipos + lib client (`petGrab.ts`, `types/petGrab.ts`).
3. `PetGrabPanel` admin + registro na aba.
4. Componente usuário (`GrabCard` + modal de resultado + lista de estoque).
5. Ajuste em `PetCareActionSheet` para mostrar estoque.
6. Smoke test: criar pool com 1 prêmio de carne (quantidade 3, peso 100%), sortear 1x, verificar estoque, usar carne e confirmar que não debitou moedas.

---

## Fora de escopo nesta entrega

- Itens de **avatar** (acessórios/roupas) como prêmio — você marcou apenas pet/cosméticos do perfil; fica trivial adicionar depois (mesma estrutura, novo `prize_kind`).
- Tickets de Grab como recompensa de outras ações (missão/expedição) — pode entrar numa próxima fase.
- Animação 3D/gacha elaborada — entrega com revelação simples mas polida; podemos iterar visual depois.
