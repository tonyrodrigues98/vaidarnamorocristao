## Objetivo

Refatorar o sistema de pets para ser totalmente administrável pelo banco. Nada de categoria, espécie, raça, fase, personalidade ou benefício hardcoded no frontend. O onboarding em `/meu-pet` consome o catálogo do banco e monta as etapas dinamicamente, pulando o que não tiver dados.

---

## 1. Banco de dados (migration nova)

Criar tabelas de catálogo, todas com `id`, `name`, `slug` (único), `description`, `image_url`, `active`, `sort_order`, `created_at`, `updated_at`.

- `pet_categories` — Cachorros, Gatos, Aves, Peixes, Roedores, Répteis…
- `pet_species` — vinculada a `category_id` (Coelho, Hamster, Calopsita, Betta…)
- `pet_variants` — `category_id` (nullable) + `species_id` (nullable). Golden, Gato preto, Betta azul…
- `pet_life_stages` — Filhote, Adulto, Sênior…
- `pet_personalities` — Carinhoso, Brincalhão, Calmo…
- `pet_benefits` — com escopo: `scope` (`global|category|species|variant`) + `scope_id` (nullable). Bônus de moedas, dica em recado anônimo etc.

Tabela de uso do usuário:

- `user_pets_v2` (nova, para não quebrar a atual): `user_id`, `category_id`, `species_id?`, `variant_id?`, `life_stage_id`, `personality_id`, `benefit_id?`, `custom_name`, `is_equipped`, `visibility` (`public|private`), timestamps. Constraint: 1 equipado por usuário.

Migration vai:
1. CREATE TABLE de cada uma + GRANTs (`authenticated` + `service_role`; `anon` SELECT apenas em catálogo ativo).
2. RLS:
   - Catálogo: `SELECT` para `authenticated` quando `active = true`; admin/super_admin pode ver/escrever tudo.
   - `user_pets_v2`: dono faz CRUD; leitura pública apenas quando `is_equipped = true AND visibility = 'public'`.
3. Função `equip_user_pet(uuid)` (desequipa os outros).
4. Trigger `updated_at` em todas.
5. Seed mínimo: categorias, algumas espécies/variações, 2 fases, 4 personalidades, 2 benefícios — só para testes; tudo administrável no admin.

A tabela atual `pets` / `user_pets` continua existindo (compatibilidade com `EquippedPetBadge`, gifts, etc.) — não é removida nesta entrega.

---

## 2. Admin (`/admin/pet`)

Rota nova `src/routes/admin/pet.tsx` com abas no mesmo visual do `/admin/index` (pills brancas com bolha rose):

- Categorias
- Espécies/Tipos
- Variações
- Fases
- Personalidades
- Benefícios (com seletor de escopo + alvo)

Cada aba: lista (ativos/inativos), criar, editar, ativar/desativar, ordenar, upload de imagem (bucket `pets` existente). Apenas admin/super_admin.

Helpers em `src/lib/petCatalog.ts` (list/create/update/delete por entidade + resolução de imagem signed URL).

A rota antiga `src/routes/admin/pets.tsx` (catálogo legado) permanece intacta.

---

## 3. Onboarding `/meu-pet`

Reescrever `src/routes/meu-pet.tsx` como wizard dinâmico:

Etapas (cada uma é pulada se a query retornar vazio):
1. Categoria — `pet_categories` ativas.
2. Espécie — `pet_species` ativas onde `category_id = escolhida`.
3. Variação — `pet_variants` ativas compatíveis (por `species_id` ou `category_id`).
4. Fase — `pet_life_stages` ativas.
5. Nome — input com limite.
6. Personalidade — `pet_personalities` ativas.
7. Benefício — `pet_benefits` ativos com escopo compatível com as escolhas (`global` + categoria + espécie + variação selecionadas). Pula se vazio.
8. Confirmação — preview do pet (imagem por prioridade) e botão "Criar meu pet".

Imagem resolvida por prioridade: variante → espécie → categoria → placeholder do banco.

Se o usuário já tem pet em `user_pets_v2`, mostra showcase + botões "Editar nome", "Trocar pet" (reabre wizard), "Visibilidade pública/privada".

Sem nenhum array fixo no componente — tudo via TanStack Query consumindo o banco.

---

## 4. Integrações

- `/perfil`: mostrar pet equipado (`user_pets_v2`) ao lado do badge atual quando existir; o badge antigo continua para usuários no sistema legado.
- `/pretendentes/$id`: mostrar pet equipado se `visibility = 'public'`.
- Nenhuma alteração em molduras, auras, fundos, presentes, moedas, recados.

---

## 5. Design

Mobile-first, Poppins (já no projeto), cards arredondados, glassmorphism leve no card showcase, ícones Lucide, animações com transitions Tailwind, dark/light via tokens semânticos de `styles.css`. Respeitar safe-area no shell mobile existente.

---

## Detalhes técnicos

- Migration única com todas as tabelas + GRANTs + RLS + seed.
- Schemas Zod nos handlers de upload do admin (não em serverFn — usaremos Supabase client direto, como o resto do admin já faz).
- `image_url` armazena storage path; resolução para signed URL no helper (mesmo padrão de `src/lib/pets.ts`).
- Types em `src/types/petCatalog.ts`.
- Sem mexer em `src/integrations/supabase/*`.

---

## Fora de escopo desta entrega

- Migrar dados existentes de `user_pets` legado para `user_pets_v2`.
- Combinações imagem variante+fase (campo previsto, UI fica para depois).
- Sistema de raridade/preço nesse novo catálogo (mantém apenas no legado por ora).

Pronto para implementar assim que aprovar.
