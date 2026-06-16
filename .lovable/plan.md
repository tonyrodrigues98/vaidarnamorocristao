# Plano: Página Dedicada de Caixas

Nova seção visual e gameplay para o sistema de grab, expandindo de uma única roleta para um catálogo completo de caixas temáticas.

---

## 1. Nova rota e navegação

- Criar `/meu-pet/caixas` com banner hero próprio (estilo loot-box gamer: bordas brilhantes, partículas, dark com glow por raridade).
- No `/meu-pet`, substituir o `PetGrabCard` atual por um **card de entrada** ("Caixas — abrir agora", mostra quantas grátis disponíveis hoje) que leva pra nova página.
- Header da página: banner animado destacando a "Caixa da Semana" (rotaciona via campo `featured_until` na pool).

---

## 2. Catálogo de caixas no lançamento

Total de **11 caixas** divididas em 4 famílias, cada uma com sua arte/cor de raridade:

### Família A — Caixa do Iniciante (migração da atual)

- **Caixa do Iniciante** — barata (~30 moedas), drops fracos garantidos, foco em onboarding. Migra a pool atual renomeada + pesos rebalanceados.

### Família B — Por recurso (3 caixas)

- **Cofre de Moedas** — só moedas, 5 faixas (10/25/50/100/jackpot 250).
- **Cápsula de XP** — só XP pro pet (50/200/500/1500).
- **Baú de Cuidado** — só itens de cuidado (comida/brinquedo/remédio).

### Família C — Por categoria visual (3 caixas)

- **Caixa de Cenários** — só `pet_background`. 
- **Caixa de Decorações** — só `decoration` de perfil.
- **Caixa de Gradientes** — só `name_gradient` (mais cara, drops raros).

### Família D — Por raridade (4 caixas)

- **Comum** (10 moedas) — mix amplo, drops baixos.
- **Rara** (25) — mix médio.
- **Épica** (60) — chance real de itens fortes.
- **Lendária** (80, **cooldown 7 dias**) —  chance alta de lendário exclusivo.

### Mantida

- **Roleta da Sorte Original** — caixa única com TODOS os tipos de prêmio, pesos brutais, custo médio (200). Preserva sua ideia inicial como sink de loteria.

---

## 3. Mecânica: Pity Counter

Sistema anti-frustração por caixa:

- Cada usuário×caixa acumula um contador de aberturas sem prêmio raro+.
- Ao atingir o limite configurado (ex: 10 na comum, 5 na épica), próxima abertura **garante** raro+.
- Contador zera quando o pity é ativado ou quando o usuário tira raro+ naturalmente.

---

## 4. UX da página

- **Grid de cards** das caixas: arte, borda colorida por raridade, custo, badge "grátis hoje" quando aplicável, contador de pity.
- **Modal de detalhe** ao tocar uma caixa: nome, descrição, custo, lista de prêmios possíveis (sem %, só raridades), botão "Abrir".
- **Animação de abertura** por raridade: comum = spin simples; épica = flash + shake; lendária = cerimônia (overlay tela cheia, partículas, som).
- **Histórico pessoal** ("Suas últimas aberturas") em accordion no fim da página, usando `user_grab_log` existente.

---

## 5. Backend (migrações)

- `grab_pools`: adicionar `rarity` (enum: starter/common/rare/epic/legendary/special), `cooldown_hours`, `featured_until`, `icon_key`.
- Nova tabela `grab_pool_pity`: `user_id`, `pool_id`, `rolls_since_rare`, `last_rolled_at`.
- Nova tabela `grab_pool_cooldowns`: `user_id`, `pool_id`, `available_at` (pra lendária).
- Migrar pool atual → `rarity = 'starter'`, renomear pra "Caixa do Iniciante".
- Seed das 10 novas pools com prêmios e pesos.
- RPC `grab_open(pool_id)` atualizado pra: validar cooldown, aplicar pity, decidir prêmio, atualizar contadores, registrar no log — tudo numa transação.
- GRANTs e RLS nas novas tabelas (user_id = auth.uid()).

---

## 6. Detalhes técnicos

### Arquivos novos

- `src/routes/meu-pet/caixas.tsx` (página dedicada, dentro de `_authenticated` se aplicável)
- `src/components/pet/grab/GrabHeroBanner.tsx`
- `src/components/pet/grab/GrabPoolCard.tsx`
- `src/components/pet/grab/GrabPoolDetailSheet.tsx`
- `src/components/pet/grab/GrabOpenCeremony.tsx` (animação por raridade)
- `src/components/pet/grab/GrabHistoryList.tsx`
- `src/lib/grabRarity.ts` (tokens de cor/glow por raridade)

### Arquivos editados

- `src/types/petGrab.ts` — novos campos (rarity, pity, cooldown).
- `src/lib/petGrab.ts` — funções: `getPoolsWithPity`, `getCooldown`, `openPool`.
- `src/components/pet/PetGrabCard.tsx` — vira card de atalho pra `/meu-pet/caixas`.
- `src/styles.css` — tokens semânticos: `--rarity-common/rare/epic/legendary` + glows.

### Migrações SQL

1. `alter_grab_pools_add_rarity_and_cooldown.sql`
2. `create_grab_pool_pity.sql`
3. `create_grab_pool_cooldowns.sql`
4. `seed_grab_pools_v2.sql` (renomear iniciante + inserir 10 novas + prêmios)
5. `update_grab_open_rpc.sql` (pity + cooldown logic)

---

## 7. Fora do escopo desta entrega

- Caixas comunitárias / pity global.
- Proteção de duplicata (pode entrar em v2).
- Preview de % exato de cada prêmio.
- Feed comunitário de drops recentes.
- Caixas sazonais/temáticas (entram via admin depois).

Se quiser que algum desses entre no v1, me avise antes de implementar.