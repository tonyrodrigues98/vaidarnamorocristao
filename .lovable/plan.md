# Plano de Rebalanceamento Econômico

Premissas confirmadas pelo usuário:

- **Cap de 500 moedas permanece** (é proposital, força o jogador a gastar antes de acumular mais).
- **Teto diário ~60 moedas** se o jogador fizer tudo: 50 de ações + 10 do resgate diário.
- **Pets sempre grátis** (espécies, variantes e o próprio pet). Variedade existe para o usuário escolher algo parecido com o pet real dele, não como item de loja.
- Cosméticos de perfil/avatar/fundos continuam sendo o sink principal.

---

## Prioridade 1 — Reduzir faucets para caber em ~60/dia

**Resgate diário (login):**

- Hoje: 10–13/dia, com bônus eventuais maiores.
- Novo: fixo em **10** + streak progressivo discreto (10, 10, 12, 12, 15, 15, 20 em ciclo de 7 dias → média ~13). Sem bônus aleatórios grandes.

**Quiz bíblico (3 perguntas/dia):**

- Hoje: 3/3=40, 2/3=15, 1/3=5 → até 40/dia.
- Novo: 3/3=**15**, 2/3=**8**, 1/3=**3**. XP do quiz pode subir levemente para compensar a sensação de progresso.

**Missões diárias do pet (3 slots):**

- Hoje: 25–150 por missão, podendo passar de 200/dia.
- Novo: missão fácil=**8**, média=**12**, difícil=**20**. Teto = 8+12+20 = **40/dia** se completar as 3.

**Eventos aleatórios de cuidado:**

- Hoje: drops aleatórios de coins durante feed/play/etc.
- Novo: não remover o drop em moedas, porém deixar mais difícil; manter apenas XP e humor. Eventos raros podem dar **1–3** moedas, no máximo 1×/dia.

**Conquistas (one-shot):**

- Hoje: até 1.500 acumuladas, incluindo "Lendária" de 1.500.
- Novo: escalonar em 10/25/50/100/250 por conquista, com a Lendária = **500**. Total acumulado ainda significativo, mas distribuído ao longo de meses.

**Soma do teto diário sustentado:** 13 (login) + 15 (quiz) + 40 (missões) = **68/dia** — dentro do alvo, com folga para conquista pontual.

---

## Prioridade 2 — Pets 100% grátis (catálogo)

- `pet_species`: **todas em 0 moedas** (já está, manter regra explícita no admin).
- `pet_variants`: **todas em 0 moedas** (idem).
- `pet_backgrounds`: continuam **pagos se forem colocados como exclusivos que abrem aba de preço e raridade** (são cosméticos puros, não afetam a escolha do "tipo de pet").
- UI da troca de pet: remover qualquer indicação de preço/cadeado para species e variants. Serão adicionados novos pets que custarão dinheiro.

---

## Prioridade 3 — Reprecificar sinks para caber no ritmo novo

Com ~60/dia entrando e cap de 500, o usuário pode comprar algo de **50–100** a cada 1–2 dias, ou guardar para um item de 300–500 a cada 5–8 dias.

**Itens de cuidado do pet (consumíveis):**

- Básicos (ração, água, escova): **2–4** moedas.
- Intermediários (brinquedo, petisco): **6–10** moedas.
- Premium (spa, banho especial): **20–35** moedas, com bônus de humor/XP maior por coin gasto (inverter a curva atual onde premium é pior custo-benefício).

**Fundos do pet (cosméticos):**

- Comum: 0 (alguns de boas-vindas) ou **20**.
- Raro: **60**.
- Épico: **150**.
- Lendário: **400**.

**Fundos de perfil:** manter faixa atual (25–100), revisar para 30/60/100.

**Gradientes de nome:** manter 20–40.

**Decorações de avatar / itens de avatar / presentes virtuais:** manter como sink "aspiracional" de longo prazo (já estão acima de 50 e chegam a 2.000), só revisar os outliers gritantes.

---

## Prioridade 4 — Telemetria mínima para validar

Adicionar registro (sem UI nova) para acompanhar pós-mudança:

- `coin_transactions` já registra tudo — criar uma **view** `v_economy_daily` agregando por usuário/dia: total ganho, total gasto, vezes que bateu o cap, saldo final.
- Painel admin /economia: % de usuários no cap, gap entre coins "concedidas vs creditadas" (quando bate cap), itens mais/menos comprados.

---

## Prioridade 5 — Comunicação ao usuário

- Tooltip no contador de moedas explicando o cap de 500 e como destravar (gastando).

---

## Resumo das mudanças por camada

```text
Banco (migration):
  - UPDATE pet_species  SET price_coins = 0;
  - UPDATE pet_variants SET price_coins = 0;
  - Reprice pet_care_items (faixas novas)
  - Reprice pet_backgrounds por raridade
  - Reescrever award_xp/log_coin_tx? NÃO — só ajustar valores nos pontos de chamada
  - Ajustar pet_missions.reward_coins (8/12/20)
  - Ajustar bible_quiz scoring (15/8/3)
  - Ajustar daily_login (streak 10-20)
  - Ajustar achievement.reward_coins (10/25/50/100/250/500)
  - View v_economy_daily

Frontend:
  - Admin pets: desabilitar campo de preço para species/variants
  - SaldoTab: tooltip do cap
  - LevelRewardsRail: atualizar valores exibidos
  - Painel de missões: refletir novos valores
```

Nada será aplicado até sua aprovação. Quer que eu ajuste algum número, mantenha algum faucet maior, ou siga assim?