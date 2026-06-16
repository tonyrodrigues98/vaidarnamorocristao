# Expedições de Pet

Sistema novo, separado das "missões diárias" existentes (que são tarefas de progresso). Aqui o pet é **enviado** por um tempo real e volta com loot.

## Conceito

- 3 expedições sorteadas por dia (rotação à meia-noite, igual missões diárias).
- Apenas 1 ativa por vez — escolha estratégica.
- Enquanto ativa: tudo do pet vira read-only com grayscale + blur + contador de tempo restante.
- Decaimento das necessidades **1.5×** mais rápido durante a viagem (cria pressão pós-retorno).
- Custo de envio: energia (escala com dificuldade) + nível mínimo do pet.
- Resultado revelado ao "Coletar": **Sucesso normal / Crítico (2× recompensa, ~10%) / Falha (recompensa parcial 30%)** — chances variam por dificuldade.

## Modelo de dados

Duas tabelas novas:

`**pet_expeditions**` (catálogo, admin)

- `id`, `slug`, `title`, `description`, `icon` (nome lucide), `image_url` (opcional)
- `difficulty`: `easy | medium | hard | extreme`
- `duration_minutes` (ex.: 240 = 4h)
- `energy_cost`, `min_pet_level`
- `xp_reward`, `coin_reward`, `item_reward_id` (nullable, FK futura)
- `success_rate`, `crit_rate` (0–100) — preenchido por default da dificuldade no admin, editável
- `active`, `sort_order`, `created_at`, `updated_at`

`**user_pet_expedition_runs**` (ativas + histórico)

- `id`, `user_id`, `user_pet_id` (FK `user_pets_v2`), `expedition_id`
- `started_at`, `ends_at`, `claimed_at` (null = ativa ou pendente claim)
- `outcome`: `pending | success | crit | fail` (calculado no claim)
- `xp_awarded`, `coin_awarded`, `item_awarded_id`
- Index parcial `WHERE claimed_at IS NULL` para garantir 1 ativa por pet.

`**user_daily_expeditions**` (sorteio diário de 3)

- `id`, `user_id`, `day`, `expedition_id`, `sent_at` (null = ainda disponível pra enviar)

## RPCs (server-side, transacional)

- `roll_daily_expeditions()` — idempotente por usuário+dia, sorteia 3 de `pet_expeditions` ativas.
- `get_today_expeditions()` — retorna as 3 do dia + estado (disponível / esta foi enviada).
- `start_expedition(_expedition_id, _user_pet_id)` — valida: nenhuma ativa, energia suficiente, nível mínimo, foi sorteada hoje, ainda não enviada. Debita energia, cria run, marca `sent_at`.
- `claim_expedition(_run_id)` — valida `now() >= ends_at`, sorteia outcome via `success_rate`/`crit_rate`, credita XP (via `xp_events`) + moedas (via `coin_transactions`) + item, marca `claimed_at`.
- Trigger / função auxiliar para o **decaimento 1.5×**: registrar buff temporário em `user_pet_buffs` com `decay_mult: 1.5, kind: 'all', source: 'expedition'`, expirando junto com `ends_at`. Reaproveita o pipeline atual de buffs (já aparece no HUD de buffs).

## UI

`**/admin/pets` — nova aba "Expedições"**
CRUD igual às outras abas (`PetCareItemsPanel` como referência estrutural):

- Lista com título, dificuldade, duração, recompensas, ativo, ordem.
- Form: título, descrição, ícone (lucide picker), imagem opcional, dificuldade (select com presets de duração/energia/min level/taxas — editáveis após), recompensas, ativo.

`**/meu-pet` — novo card "Expedições" abaixo de "Missões diárias"**

- Header: "Expedições — 1/3 enviada hoje" + contador de reset.
- 3 kistas ( como em missões pra fácil leitura ) com ícone/imagem, título, badge de dificuldade colorida, duração, recompensas e botão **Enviar** (ou "Indisponível: energia/nível").
- Se uma run está ativa: card grande no topo com barra de progresso + tempo restante; outros 2 cards bloqueados.
- Quando termina: card vira **Coletar recompensa** com animação de revelação (success/crit/fail) usando padrão do `PetRandomEventModal` existente.

**Overlay "Pet em missão"**
Quando há run ativa:

- `<PetArtwork>` ganha classe `grayscale blur-[2px]` + overlay translúcido com ícone da expedição + countdown grande.
- `PetRadialMenu`, `PetCareActionSheet`, `PetNeedsHud` (cliques) ficam desabilitados (botões com `disabled`, tooltip "Em missão — volta em Xh Xm").
- Badge sticky pequena no header: "Em missão: Caverna de Tundra • 3h 12min".

## Melhorias sugeridas (incluídas no plano)

1. **Buff de retorno**: ao completar com sucesso/crítico, aplicar buff curto (ex.: +20% restore em "affection" por 1h) — reaproveita `user_pet_buffs`/HUD.
2. **Sinergia com personalidade**: pet com personalidade compatível ganha +5% crit_rate (campo opcional `personality_bonus_id` na expedição).
3. **Histórico**: aba no card mostrando últimas 5 expedições com outcome — gera identidade.
4. **Push opcional**: quando faltar 5min ou ao terminar, dispara notificação (reusar `push_queue`). Default off, toggle em conta.
5. **Defaults inteligentes no admin** por dificuldade:
  - Fácil: 1h, energia 20, lvl 1, sucesso 100%, crit 10%
  - Média: 4h, energia 40, lvl 3, sucesso 85%, crit 12%
  - Difícil: 8h, energia 60, lvl 5, sucesso 70%, crit 15%
  - Extrema: 16h, energia 80, lvl 10, sucesso 50%, crit 20%

## Detalhes técnicos

- **RLS**: catálogo `pet_expeditions` leitura `authenticated`, escrita só admin via `has_role`. Tabelas de usuário com policies escopadas em `auth.uid()`. GRANTs explícitos.
- **Server fns** (`src/lib/petExpeditions.functions.ts`): `getTodayExpeditions`, `startExpedition`, `claimExpedition`, `getActiveRun` — todas com `requireSupabaseAuth`.
- **Catálogo admin** (`src/lib/petExpeditionsAdmin.ts`): CRUD direto via supabase com policy admin.
- **Hook `useActiveExpedition(petId)**`: polling de 30s + tick local de 1s pro countdown.
- **Item reward**: por ora `item_reward_id` é nullable; sistema de itens fica no campo de texto livre + flag — quando inventário for criado, vira FK real.
- **Atomicidade**: `start_expedition` e `claim_expedition` em transação SQL (RPC) — evita double-claim e race com energia.

## Arquivos novos

- `supabase` migration (tabelas, GRANTs, RLS, RPCs, trigger de buff)
- `src/types/petExpedition.ts`
- `src/lib/petExpeditions.functions.ts`
- `src/lib/petExpeditionsAdmin.ts`
- `src/components/admin/PetExpeditionsPanel.tsx`
- `src/components/pet/ExpeditionsCard.tsx`
- `src/components/pet/ActiveExpeditionOverlay.tsx`

## Arquivos editados

- `src/routes/admin/pets.tsx` — nova aba.
- `src/routes/meu-pet.tsx` — render do card + overlay + disable das ações quando ativa.
- `src/components/pet/PetCareActionSheet.tsx` e `PetRadialMenu.tsx` — respeitar prop `disabled`.

## Fora do escopo (deixa pra depois)

- Sistema de inventário/itens reais (campo já fica preparado).
- Expedições em grupo / convite de amigos.