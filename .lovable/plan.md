
# Sistema de Pets — Fase 1 (Fundação)

Companheiro visual equipável, **1 pet por usuário**, sem preço nesta fase (catálogo livre). Foco em base sólida antes de qualquer UI bonita ou animação.

---

## 1. Banco de dados

### Tabela `pets` (catálogo, gerenciado por admin)
Campos: `id`, `name`, `slug` (único), `species`, `description`, `rarity` (`common|rare|epic|legendary`), `price_coins` (default 0, reservado para o futuro), `image_url`, `preview_url`, `is_active`, `sort_order`, `created_at`, `updated_at`.

Campos opcionais já previstos na migration (nullable, ignorados pela UI agora): `pose`, `animation_url`, `shadow_url`, `sound_url`, `event_tag`, `limited_until`. Adicioná-los agora evita migration nova quando entrarem em uso.

### Tabela `user_pets`
Campos: `id`, `user_id` (FK `auth.users`), `pet_id` (FK `pets`), `custom_name` (nullable, max 30), `acquired_at`, `is_equipped`.

Regra: índice único parcial garantindo **no máximo 1 pet equipado por usuário** (`WHERE is_equipped = true`).

### RLS
- `pets`: leitura pública apenas de `is_active = true`; admin (via `has_role`) gerencia tudo.
- `user_pets`: usuário lê/insere/edita/apaga apenas suas próprias linhas; leitura pública dos pets equipados (para mostrar no perfil de terceiros); admin enxerga tudo.

### GRANTs
`pets`: `SELECT` para `anon` + `authenticated`; `ALL` para `service_role`.
`user_pets`: `SELECT/INSERT/UPDATE/DELETE` para `authenticated` + `SELECT` para `anon` (limitado pela policy de leitura de equipados); `ALL` para `service_role`.

### Função utilitária
`equip_pet(user_pet_id uuid)` (SECURITY DEFINER) que desequipa os outros pets do usuário e marca o escolhido como `is_equipped = true` em uma transação — evita race e simplifica o client.

### Seed
3–5 pets iniciais com `image_url` placeholder (gerados na Fase 2 de assets). Slugs ex.: `gato-branco`, `coelho-rosa`, `cachorro-caramelo`, `passarinho-azul`, `raposa-laranja`.

---

## 2. Storage

Bucket **público** `pets` (apenas imagens de catálogo, nada sensível).
- RLS em `storage.objects`: leitura pública; escrita só para admins.
- Tamanho recomendado: 1024×1024 PNG transparente, pet centralizado, margem interna. Documentado no admin como hint.

---

## 3. Tipos & libs (frontend)

- `src/types/pet.ts`: `Pet`, `UserPet`, `PetRarity`, `PetDisplaySize` (`mini | profile | showcase`).
- `src/lib/pets.ts`: helpers `listActivePets()`, `getMyEquippedPet()`, `equipPet(userPetId)`, `claimPet(petId)`, `renamePet(userPetId, name)` — usando server functions com `requireSupabaseAuth` quando precisa de auth.

---

## 4. Admin

Nova rota **`/admin/pets`** (gate `has_role('admin')` como as outras rotas admin):
- Lista com thumbnail, nome, slug, espécie, raridade, ordem, switch ativo.
- Criar / editar / desativar.
- Upload de imagem direto no bucket `pets`.
- Reordenar via `sort_order`.

---

## 5. Página `/meu-pet`

Rota autenticada (`_authenticated` ou guard padrão do projeto). Layout moderno, mobile-first, casando com o tom do `/avatar`:
- **Pet equipado** em destaque (showcase 240–360px) com nome custom, espécie, raridade, descrição e vantagem.
- Botão **renomear** (inline, max 30 chars).
- Grid do catálogo (`is_active`) com estados: já tenho / equipado / disponível.
- Ação **Escolher este pet**: se ainda não está em `user_pets`, faz claim + equip; se já tem, apenas equipa via `equip_pet`.

Sem moedas, sem preço, sem loja nesta fase.

---

## 6. Exibição em outros lugares (mínimo viável)

- **Perfil próprio** e **perfil de terceiros**: badge "Pet:" com mini-pet (64–96px) + nome custom, lendo `user_pets` equipado público. Implementação só depois da fundação validada — fica como item final desta fase.

---

## 7. Fora do escopo desta fase

Animações, sombra dinâmica, som, pet andando, alimentação, XP, batalha, marketplace, múltiplos pets equipados, integração com loja/moedas, eventos limitados. Os campos já existem no schema mas ficam dormentes.

---

## Ordem de execução

1. Migration (`pets`, `user_pets`, índices, RLS, GRANTs, função `equip_pet`).
2. Bucket `pets` + policies de storage.
3. Seed inicial (placeholders).
4. Tipos + lib client (`pets.ts`, server fns).
5. `/admin/pets` (CRUD + upload).
6. `/meu-pet` (showcase + catálogo + claim/equip/rename).
7. Badge de pet nos cards de perfil.

Cada passo é um commit verificável antes do próximo.

---

## Detalhes técnicos (referência)

- Server fns ficam em `src/lib/pets.functions.ts`; chamadas que escrevem usam `requireSupabaseAuth`. Funções admin checam `has_role(auth.uid(),'admin')` no handler antes de carregar `supabaseAdmin`.
- Constraint de "1 equipado por user": `CREATE UNIQUE INDEX user_pets_one_equipped ON user_pets(user_id) WHERE is_equipped`.
- Trigger `update_updated_at_column` nas duas tabelas.
- Slug validado por regex `^[a-z0-9-]+$`.
- Imagens servidas direto da URL pública do bucket — sem proxy.
