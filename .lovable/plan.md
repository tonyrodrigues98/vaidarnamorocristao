## Objetivo

Adicionar uma nova entidade **Pet Backgrounds** ao catálogo de pets. Admin cria/edita backgrounds com versão dia + noite, raridade, preço (se exclusivo), e regras de compatibilidade por categoria/espécie. Em `/meu-pet`, o usuário escolhe um background compatível com o pet equipado; comuns precisam de 1 clique de "desbloquear" grátis, exclusivos custam coins. O quadrado do pet alterna automaticamente entre versão dia (06:00–17:59 SP) e noite (18:00–05:59 SP) com crossfade suave (~30 min de transição nas bordas).

Esta fase entrega apenas a feature de background. Outras ideias do brainstorm (radial menu de ações, barras, missões etc.) ficam para depois.

## Banco de dados (1 migration)

Tabela `pet_backgrounds` (catálogo):
- `name`, `slug`, `description`
- `image_url_day` (storage path no bucket `pets`, pasta `backgrounds/`)
- `image_url_night` (idem)
- `rarity` (`common|rare|epic|legendary`, igual aos pets)
- `is_exclusive` (boolean) + `price_coins` (int, default 0)
- `active`, `sort_order`, `created_at`, `updated_at`

Tabela `pet_background_compat` (regras de compatibilidade, granular):
- `background_id` → `pet_backgrounds.id`
- `category_id` → `pet_categories.id` (obrigatório)
- `species_id` → `pet_species.id` (nullable — quando NULL = categoria inteira; quando preenchido = apenas aquela espécie da categoria)
- UNIQUE `(background_id, category_id, species_id)`

Tabela `user_pet_backgrounds` (desbloqueios + equipado):
- `user_id`, `background_id`, `acquired_at`, `is_equipped` (default false)
- UNIQUE `(user_id, background_id)`
- Trigger/RPC `equip_pet_background(_id)` que desequipa os demais do usuário

RLS:
- `pet_backgrounds` / `pet_background_compat`: SELECT público em `active=true`; INSERT/UPDATE/DELETE só admin (via `has_role(auth.uid(),'admin')`)
- `user_pet_backgrounds`: dono lê/escreve o próprio
- GRANTs explícitos para `anon` (SELECT em catálogo ativo), `authenticated` (CRUD próprio em `user_pet_backgrounds`) e `service_role`

RPC `unlock_pet_background(_background_id uuid)`:
- Se `is_exclusive=false` → insere em `user_pet_backgrounds` (idempotente)
- Se `is_exclusive=true` → debita `price_coins` via lógica já usada nos pets e insere
- Retorna o novo `user_pet_backgrounds.id`

## Admin (`/admin/pets`)

Nova aba **"Backgrounds"** ao lado das abas existentes (categorias, espécies etc.). Reutiliza padrões já presentes em `src/routes/admin/pets.tsx` e helpers de `src/lib/petCatalog.ts`:
- Lista com thumbnail (dia), nome, raridade, badge "exclusivo + preço", toggle ativo
- Form (modal/drawer) com:
  - Nome, slug (auto), descrição
  - **Upload imagem dia** + **upload imagem noite** (ambos obrigatórios) → bucket `pets`, prefixo `backgrounds/`
  - Raridade
  - Checkbox "exclusivo" → revela campo "preço em coins"
  - **Compatibilidade**: árvore de categorias; cada categoria tem checkbox "categoria inteira" OU expansão para marcar espécies específicas. Salva linhas em `pet_background_compat` (categoria com `species_id=NULL` cobre tudo; senão uma linha por espécie marcada)
- Ações: criar, editar, ativar/desativar, deletar

Helpers novos em `src/lib/petBackgrounds.ts`: `listAdminBackgrounds`, `createBackground`, `updateBackground`, `deleteBackground`, `setCompat`, `uploadBackgroundImage`, e leitura do storage path (assinado, igual `resolvePetImage`).

## `/meu-pet` — seletor de background

Abaixo (ou ao lado, em desktop) do quadrado do pet, nova seção **"Cenário"** com:
- Galeria horizontal scrollável dos backgrounds compatíveis com o pet equipado (filtra via `pet_background_compat` casando `category_id` do pet e/ou `species_id`)
- Cada card mostra thumb dia, nome, raridade; badge "Desbloquear" (grátis) ou "X 🪙" (exclusivo); se já desbloqueado, badge "Aplicar" / "Equipado"
- Clique:
  - Não desbloqueado comum → confirma e chama `unlock_pet_background` (grátis)
  - Não desbloqueado exclusivo → modal de confirmação de compra com saldo → `unlock_pet_background` (debita)
  - Desbloqueado → `equip_pet_background`
- Pequeno toggle "Remover cenário" volta ao fundo default atual

O quadrado do pet (componente atual em `src/routes/meu-pet.tsx`, possivelmente um `PetStage` extraído) ganha o background equipado como camada de fundo absoluta atrás do PNG do pet, sem afetar posicionamento já calibrado.

## Dia/noite com crossfade

Helper novo `src/lib/petDayNight.ts`:
- `getPetDayNightState(now = new Date())` retorna `{ phase: 'day'|'night', dayOpacity: number }` calculado em America/Sao_Paulo usando `Intl.DateTimeFormat` com `timeZone: 'America/Sao_Paulo'` (sem dependência extra)
- Janelas de transição de 30 min:
  - 05:45–06:15 → fade noite→dia (`dayOpacity` 0→1)
  - 17:45–18:15 → fade dia→noite (`dayOpacity` 1→0)
  - Fora disso: dia puro (1) ou noite puro (0)
- Hook `usePetDayNight()` que re-renderiza a cada 60s (e nas bordas das transições com `setTimeout` mais fino)

Render no `PetStage`:
- Duas `<img>` absolute inset-0 (dia e noite) com `style.opacity = dayOpacity` / `1 - dayOpacity` e `transition: opacity 600ms`
- Quando nenhum background equipado, mantém o fundo atual

## Tipos / código auxiliar

- `src/types/petBackground.ts`: `PetBackground`, `PetBackgroundCompat`, `UserPetBackground`, `UserPetBackgroundFull`
- Estender `src/lib/petCatalog.ts` apenas com leituras que cruzam (ex.: `getEquippedBackgroundForUser`) ou criar arquivo novo se ficar pesado

## Detalhes técnicos

- Bucket `pets` já existe e já hospeda imagens de catálogo → reutilizado (subpasta `backgrounds/`)
- URLs assinadas com TTL longo, mesmo padrão de `resolvePetImage`
- Validação no insert: ao menos 1 linha de compatibilidade obrigatória (senão background não aparece pra ninguém)
- Em `/meu-pet`, se o usuário tinha um background equipado mas trocou o pet pra uma categoria incompatível, o background é silenciosamente "pausado" (mantém na coleção, só não renderiza e cai para fundo default)
- Sem cron / sem edge functions; a alternância dia/noite é puramente cliente
- Sem geração por IA nesta fase (upload manual confirmado)

## Não está no escopo desta fase

- Geração de imagens por IA no admin
- Outras ações interativas do pet (alimentar, carinho, missões)
- Sincronização do background com avatar/quarto
- Backgrounds sazonais / litúrgicos

## Diagrama de dependências

```text
pet_categories ──┐
                 ├──► pet_background_compat ──► pet_backgrounds ──► user_pet_backgrounds ──► /meu-pet (PetStage)
pet_species ─────┘                                                      ▲
                                                                        │
                                                                  unlock_pet_background (RPC)
                                                                  equip_pet_background  (RPC)
```

Posso seguir com a migration assim que aprovar.