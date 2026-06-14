
# Personalidades com efeitos no cuidado

Objetivo: cada uma das 5 personalidades vira um conjunto de **modificadores sutis (10–30%)** aplicados em runtime sobre o sistema atual (`pet_care_items`, `pet_care_state`, `apply_pet_care`), com eventos aleatórios configuráveis e integração com o ciclo dia/noite que já existe.

## 1. Modelo de dados (admin-editável, nada hardcoded)

Nova tabela `pet_personality_effects` ligando `pet_personalities` a regras:

```text
personality_id  | kind (feed|play|hygiene|sleep|affection|energy|all)
restore_mult    | 1.20  → multiplica restore_amount
energy_cost_mult| 0.50  → multiplica energy_cost
decay_mult      | 0.70  → afeta decay daquela barra (config global × mult)
cap_max         | 70    → barra não passa desse valor após restauração
daypart         | any | day | night   → bônus só vale na janela
condition_kind  | play  → condicional (ex.: humor>70)
condition_op    | gt | lt
condition_value | 70
```

Uma personalidade pode ter N linhas (ex.: Carinhoso tem 3 regras). O admin edita tudo no painel de personalidades.

Tabelas auxiliares:
- `pet_random_events` — `item_id` ou `kind`, `chance` (0–1), `payload` JSON (`{type:'coins', min:1, max:5}` | `{type:'buff', kind:'play', mult:1.5, duration_min:30}`), `personality_id` opcional (chance × 2 quando bate).
- `user_pet_buffs` — buffs temporários ativos por pet (kind, mult, expires_at). Aplicados em runtime junto com `restore_mult`.

## 2. Mapeamento das personalidades (valores propostos, ajustáveis no admin)

**Calmo**
- ✅ Energia regenera 25% mais rápido (`kind=energy, restore_mult=1.25`, mexe no `energy_regen_minutes_per_point` via fator)
- ✅ Decay de humor 20% mais lento (`kind=play, decay_mult=0.80`)
- ✅ Bônus de +15% noturno em todas restaurações (`kind=all, restore_mult=1.15, daypart=night`)
- ❌ Sono restaura no máximo 70% (`kind=sleep, cap_max=70`)

**Brincalhão**
- ✅ Brincar restaura +30% humor (`kind=play, restore_mult=1.30`)
- ✅ +15% diurno em brincar (`kind=play, daypart=day, restore_mult=1.15`)
- ❌ Decay de humor 25% mais rápido (`kind=play, decay_mult=1.25`)
- ❌ Banho restaura 80% (`kind=hygiene, restore_mult=0.80`)

**Curioso**
- ✅ Evento aleatório: 12% de chance ao brincar de ganhar 1–5 moedas (`pet_random_events` com `personality_id=curioso` dobra a chance base)
- ✅ 5% de chance ao explorar (qualquer ação) de buff temporário "petisco" (+15% próxima restauração de fome por 1h)
- ❌ Higiene decai 20% mais rápido
- ❌ Todas ações custam +10% energia

**Energético**
- ✅ Todas ações custam 30% menos energia (`kind=all, energy_cost_mult=0.70`) — ajustado de 50% pra ficar dentro da faixa sutil
- ✅ Brincar restaura +20% humor diurno
- ❌ Fome decai 25% mais rápido
- ❌ Sono restaura 80%

**Carinhoso — modelo "termômetro emocional"**
- ✅ Carinho restaura +30% (afeição) e +15% humor na mesma ação
- ✅ Decay de carência 30% mais lento **quando humor ≥ 70** (`kind=affection, decay_mult=0.70, condition_kind=play, condition_op=gt, condition_value=70`)
- ❌ Decay de carência 50% mais rápido **quando humor < 30** (`condition_op=lt, condition_value=30, decay_mult=1.50`)
- ❌ Sem carinho por 24h: buff negativo `-10% restore_mult global` até receber carinho (gerado por job/heurística no cálculo runtime)

## 3. Onde os modificadores entram

- **`apply_pet_care` (RPC)**: lê regras da personalidade do pet equipado, aplica `restore_mult` no `restore_amount`, `energy_cost_mult` no consumo, e respeita `cap_max` antes de gravar. Avalia `condition_*` consultando `pet_care_state` no momento. Rola dados de `pet_random_events` e grava resultado (moedas via `coin_transactions`, buff via `user_pet_buffs`).
- **`deriveCurrentValue` (client + futura função SQL)**: aplica `decay_mult` por kind, considerando condicionais e janela dia/noite usando o helper existente `petDayNight.ts`. Inclui buffs ativos de `user_pet_buffs`.
- **`getCareConfig`**: passa a retornar também os modificadores resolvidos do pet equipado pra o tick de 1s já existente em `meu-pet.tsx` calcular tudo localmente sem refresh.

## 4. Feedback ao jogador

- Toast da ação mostra os modificadores aplicados: "✨ Brincalhão: +30% humor" / "🌙 Calmo (noite): +15%".
- `PetNeedsHud` ganha um ícone discreto sobre a barra quando há buff ativo ou condicional ativo (ex.: coração pulsando na barra de carência do Carinhoso quando humor alto/baixo).
- Quando o evento aleatório dispara, animação curta + toast ("🪙 +3 moedas encontradas!" / "🍪 Petisco encontrado").

## 5. Admin

- Painel **Personalidades** ganha aba "Efeitos" — CRUD das regras (kind, mult, cap, daypart, condition).
- Painel **Itens de cuidado** ganha aba "Eventos aleatórios" pra configurar chance/payload por item ou por kind.
- Tudo respeita a regra de inputs (`type="text" inputMode="decimal"`).

## 6. Etapas de implementação (ordem sugerida)

1. Migration: `pet_personality_effects`, `pet_random_events`, `user_pet_buffs` + GRANTs + RLS + seeds com os valores acima.
2. Reescrita do `apply_pet_care` aplicando mult/cap/condicional + rolagem de eventos + persistência de buffs/moedas.
3. `petCare.ts` (client): carregar efeitos da personalidade do pet equipado, aplicar em `deriveCurrentValue` e expor toasts ricos.
4. Integração `petDayNight` no cálculo.
5. UI HUD: indicadores de buff/condicional + animação de evento aleatório.
6. Admin: telas de regras e eventos.
7. Seed inicial dos 5 perfis e teste manual de cada bônus/maléfico.

## Pontos abertos pra fechar antes de codar

- Buff negativo do Carinhoso após 24h sem carinho: aplicar via job (cron) ou calcular puramente em runtime a partir do `last_affection_at`? (Recomendo runtime, evita cron.)
- Eventos aleatórios devem ter cooldown por pet (ex.: máximo 3 moedas/dia) pra não virar farm?
- Mostrar os efeitos da personalidade na ficha do pet (transparência total) ou manter como descoberta pelo jogador?
