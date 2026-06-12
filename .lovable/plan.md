## Objetivo

Tratar `pet_species` e `pet_variants` como "produto final": cada um carrega imagem filhote + adulto, raridade, exclusividade e preço em moedas. A imagem exibida no perfil do usuário é escolhida a partir da fase de vida (filhote/adulto) selecionada no onboarding. No onboarding, mover a escolha de espécie/tipo para o final.

## Mudanças no banco (migration)

Adicionar colunas em `pet_species` e `pet_variants`:
- `image_url_baby text` (imagem filhote)
- `image_url_adult text` (imagem adulto — copia do `image_url` atual na migration)
- `rarity pet_rarity` (enum reaproveitado de `pets`: common/rare/epic/legendary; default 'common')
- `is_exclusive boolean default false`
- `price_coins integer default 0`

Manter `image_url` como fallback. Backfill: `image_url_adult = image_url` para registros existentes.

Adicionar coluna em `pet_life_stages`:
- `kind text` com check `kind in ('baby','adult')` (nullable; admin marca quais stages são filhote vs adulto). Usado para decidir qual imagem renderizar.

## `src/routes/admin/pets.tsx`

- Na aba **Espécies/Tipos** e **Variações/Estilos**, agrupar visualmente por categoria (já existe `CatalogRowsView`). Em cada linha mostrar miniatura filhote + adulto lado a lado, badge de raridade, badge de exclusivo, preço.
- No formulário de criar/editar species e variants, adicionar:
  - Upload separado para `image_url_baby` e `image_url_adult`
  - Select de raridade (common/rare/epic/legendary)
  - Switch `is_exclusive`
  - Input numérico `price_coins`
- Na aba **Fases**, adicionar select `kind` (filhote/adulto/nenhum) para cada life stage.

## `src/lib/petCatalog.ts`

- Estender tipos `PetSpecies` e `PetVariant` com os novos campos.
- Estender `PetLifeStage` com `kind`.
- `hydrateImage` agora resolve `image_url`, `image_url_baby`, `image_url_adult`.
- Novo helper `resolvePetDisplayImage(entity, lifeStageKind)` que retorna a URL adequada (baby/adult com fallback para `image_url`).

## `src/routes/meu-pet.tsx` (onboarding)

Reordenar `order` para: `category → variant → stage → personality → benefit → species → name → review`.

Justificativa: a espécie/tipo define a imagem final → escolher por último permite preview correto já mostrando filhote/adulto conforme a fase escolhida.

Na etapa species, exibir cada card usando a imagem correspondente à `life_stage.kind` selecionado.

No card final do perfil (`PetProfileCard` / `EquippedPetSidekick` / `EquippedPetBadge`), exibir a imagem do species ou variant escolhido conforme o `life_stage.kind`.

## Componentes de perfil

Atualizar `PetProfileCard.tsx`, `EquippedPetSidekick.tsx`, `EquippedPetBadge.tsx` para usar `resolvePetDisplayImage` em vez de `pet.image_url` direto, lendo `life_stage.kind`.

## Detalhes técnicos

- Enum `pet_rarity` já existe (usado por `pets`). Reaproveitar.
- Storage: continuar usando bucket `pets`, prefixos `catalog/species-baby/`, `catalog/species-adult/`, idem para variants.
- Sem breaking change: `image_url` continua existindo como fallback enquanto admin não preenche os novos campos.
- RLS/GRANTs das tabelas não mudam — apenas `ALTER TABLE ADD COLUMN`.

## Fora de escopo

- Não mexer em `pet_categories`, `pet_personalities`, `pet_benefits`, `pet_perk_effects`.
- Não alterar fluxo de coins/perks.
- Não tocar em `src/integrations/supabase/*` autogerados.
