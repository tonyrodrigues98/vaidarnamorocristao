# Evolução do pet: filhote → adulto in-place

## Conceito

No primeiro pet, o usuário só pode escolher **filhote**. Esse mesmo pet evolui pra adulto quando bater o gate — não vira "outro pet", é uma cerimônia de crescimento. A partir do 2º pet em diante, ele pode comprar/escolher já em adulto, se quiser.

A jornada vira parte da narrativa ("eu criei ele desde filhotinho"), não um paywall de tempo.

## Regras do gate

Evolui quando atender **ambos**:
- Nível do jogador ≥ **15** (≈ 1 mês casual, ≈ 1 semana intermediário)
- Streak de cuidado ≥ **14 dias** com o pet atual (usa `pet_care_streaks`)

A dupla condição evita dois cenários ruins:
- Quem só caça XP em outras áreas e ignora o pet
- Quem cuida muito mas é casual e demora demais

Atingidos os dois, aparece um banner persistente "Seu pet está pronto pra crescer" com botão **Fazer cerimônia**. A evolução NÃO é automática — o usuário aperta o botão (momento ritual).

## Mudanças por área

### 1. Onboarding/criação do 1º pet
- `src/routes/meu-pet.tsx` (seletor `stages`): se for o 1º pet do usuário (consultar `user_pets_v2`), filtrar `pet_life_stages` pra mostrar só `kind = 'baby'`. Esconder o step "stage" ou pré-selecionar baby + mostrar nota "Seu primeiro pet começa filhote — ele vai crescer com você".
- A partir do 2º pet: comportamento atual (escolhe livremente).

### 2. Banco de dados
Migração nova:
- Coluna `evolved_at timestamptz` em `user_pets_v2` (null = ainda não evoluiu / nasceu adulto).
- RPC `can_evolve_pet(_pet_id uuid)` retornando `{ ok, reason, level, streak, required_level, required_streak }`.
- RPC `evolve_pet(_pet_id uuid)`:
  - Valida dono, valida que `life_stage.kind = 'baby'`, valida gate (nível ≥ 15 e streak ≥ 14).
  - Troca `life_stage_id` pro stage adulto da mesma espécie/variante.
  - Seta `evolved_at = now()`.
  - Insere XP bônus em `xp_events` (sugestão: 200 XP, fonte `pet_evolved`).
  - Insere achievement `pet_first_evolution` em `pet_achievements`.
  - Retorna o pet atualizado.

Nenhuma mudança em `pet_life_stages`, `pet_species`, `pet_variants` — a arte adulta já existe (`image_url_adult`).

### 3. UI da evolução
- Novo componente `src/components/pet/PetEvolutionCard.tsx`: mostra progresso `nível X/15` + `streak Y/14 dias`, com barra. Quando ambos = 100%, vira CTA "Fazer cerimônia".
- Renderizar acima do `PetProgressionCard` quando o pet for filhote.
- Novo `PetEvolutionCeremonyModal.tsx`: animação curta (cross-fade filhote → adulto, confete sutil, `useHaptics` no clímax), texto "{nome} cresceu! +200 XP, conquista desbloqueada", botão "Continuar".
- Após confirmar, invalida caches do pet/XP/achievements (já existe `xpRefresh` no `meu-pet`).

### 4. Trocar pet (2º em diante)
- Fluxo de troca/compra continua liberando todas as fases. Sem mudança.

### 5. Compatibilidade com pets pré-existentes
Migração de dados:
- Pets já criados como adulto: `evolved_at = created_at` (tratar como "já cresceu", sem banner).
- Pets já criados como filhote: ficam no fluxo novo. Se o dono já bateu o gate, o banner aparece e ele pode fazer a cerimônia na hora — não força nada retroativo, mas reconhece o progresso.

## Por que esses números

- **Nível 15**: casual ≈ 25–30 dias, intermediário ≈ 7–10 dias, disciplinado ≈ 2–3 dias. Curva razoável pra todos.
- **14 dias de streak**: força engajamento real com o pet, não só XP em outras telas. Filtra "comprou e abandonou".
- **+200 XP de bônus**: equivale a ~1 dia bom de XP, marca o momento sem virar exploit.

## O que NÃO entra nesse plano
- Mudar curva de XP atual.
- Mexer em prestígio/rebirth.
- Adicionar nova arte (usa `image_url_adult` que já existe).
- Bloquear adulto pra quem já tem pet adulto comprado.

## Validação antes de mergear
- Casual (criar conta zerada): banner não aparece, gate visível em `PetEvolutionCard`.
- Conta com nível ≥ 15 e streak ≥ 14: cerimônia roda, life_stage muda, imagem troca, XP é creditado, achievement aparece.
- Conta com nível 15 mas streak 5: barra de streak mostra 5/14, CTA desabilitado.
- 2º pet: seletor de stage volta a mostrar baby + adult.
