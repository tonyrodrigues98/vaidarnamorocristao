# Central de Ações do Pet

Reestruturar `/meu-pet` para suportar um **menu radial** acionado por long-press no pet, com 6 barras de necessidades e ações configuráveis no admin.

## 1. Barras de necessidades (stats)

Seis barras 0–100 por `user_pets_v2.id`:

| Barra      | Diminui com  | Recupera com                    | Ícone Lucide  |
|------------|--------------|---------------------------------|---------------|
| Fome       | tempo        | **Alimentar** (itens)           | `Utensils`    |
| Energia    | uso/tempo    | **apenas tempo** (regen passivo)| `Zap`         |
| Humor      | tempo        | **Brincar** (brinquedos)        | `Smile`       |
| Higiene    | tempo        | **Banho** (ações)               | `Droplet`     |
| Sono       | tempo        | **Ninar** (caminhas)            | `Moon`        |
| Carência   | tempo        | **Carinho** (ações de afeto)    | `Heart`       |

Decaimento padrão: -1 por hora (configurável por estado global ou pet category).
Energia regenera passivamente (+1 a cada X minutos, X configurável).

Cálculo é **derivado em runtime** a partir de `last_action_at` + `value_at_last_action` — sem cron, sem trigger.

## 2. Menu radial (UI)

- Long-press de 400ms no pet abre o radial centralizado no pet.
- 6 setores (um por barra). Tap em um setor abre um **sub-painel** com as ações/itens daquele cuidado.
- Cada item mostra: ícone/imagem, nome, custo em moedas, ganho da barra (+N).
- Confirmar consome moedas, aplica delta na barra (clamp 100), registra `pet_care_events`.
- Mobile-first: radial usa `position: absolute` dentro do palco do pet, `max-w-full`, `overflow-visible` no palco e `overflow-hidden` no contêiner externo. Sub-painel é um `Sheet` (bottom sheet) pra caber em 320px+.
- HUD com as 6 barras fica no topo do palco, em grid 3×2 no mobile (`grid-cols-3 sm:grid-cols-6`), cada barra com `min-w-0 truncate`.

## 3. Admin (/admin/pets)

Nova aba **"Cuidados"** com sub-abas por barra. Cada sub-aba lista os itens daquela barra e permite criar/editar:

- **Alimentar**: nome, imagem (upload), `cost_coins`, `restore_amount` (+fome)
- **Humor**: nome, imagem, custo, +humor (brinquedos/ações tipo "pega-pega")
- **Higiene**: nome, imagem, custo, +higiene (banho, tosa, mangueira…)
- **Sono**: nome, imagem, custo, +sono (caminhas)
- **Carência**: nome, imagem, custo, +carência (carinho, colo…)
- **Energia**: sem itens — apenas campo global `energy_regen_minutes_per_point`

Cada item tem **compatibilidade** (igual ao padrão de `pet_background_compat`):
- linha em `pet_care_item_compat` (category_id, species_id NULL = categoria inteira, species_id preenchido = restringe à espécie)
- na criação do item, multi-select de categorias + multi-select opcional de espécies dentro delas

Exemplo: "Ração" → categorias `cachorros` + `gatos` (todas espécies); "Carne crua" → categoria `exoticos` apenas espécies `cobra`, `jacare`.

## 4. Schema (migration)

```sql
-- enum dos tipos de cuidado
create type public.pet_care_kind as enum
  ('feed','play','hygiene','sleep','affection');
-- (energia não tem itens)

-- itens configuráveis pelo admin
create table public.pet_care_items (
  id uuid pk default gen_random_uuid(),
  kind pet_care_kind not null,
  name text not null,
  slug text not null,
  image_url text,
  cost_coins int not null default 0,
  restore_amount int not null default 10, -- 1..100
  active bool default true,
  sort_order int default 0,
  created_at/updated_at
);

-- compat por categoria/espécie
create table public.pet_care_item_compat (
  id uuid pk,
  item_id uuid references pet_care_items on delete cascade,
  category_id uuid references pet_categories on delete cascade,
  species_id uuid references pet_species on delete cascade, -- NULL = categoria inteira
  unique(item_id, category_id, species_id)
);

-- estado por pet (uma linha por pet × barra)
create table public.pet_care_state (
  id uuid pk,
  user_pet_id uuid references user_pets_v2 on delete cascade,
  kind text not null, -- inclui 'energy'
  value_at_anchor int not null default 80,
  anchor_at timestamptz not null default now(),
  unique(user_pet_id, kind)
);

-- log de eventos (auditoria + replay)
create table public.pet_care_events (
  id uuid pk,
  user_pet_id uuid references user_pets_v2 on delete cascade,
  user_id uuid not null,
  kind text not null,
  item_id uuid references pet_care_items,
  delta int not null,
  cost_coins int not null default 0,
  created_at timestamptz default now()
);

-- config global (decay, regen energia)
create table public.pet_care_config (
  id int pk default 1 check (id=1),
  decay_per_hour int default 1,
  energy_regen_minutes_per_point int default 6
);
```

Tudo com GRANT + RLS:
- `pet_care_items`/`compat`/`config`: select `authenticated` + `anon`; admin escreve via has_role.
- `pet_care_state`/`events`: usuário só vê/escreve as próprias linhas (via `user_pets_v2.user_id = auth.uid()`).

## 5. RPC para aplicar uma ação

`apply_pet_care(_user_pet_id uuid, _item_id uuid)` — SECURITY DEFINER:
1. Valida ownership do pet
2. Valida compat (categoria/espécie do pet × item)
3. Debita moedas (reusa fn de coins existente)
4. Atualiza `pet_care_state` (clamp 0..100, computando valor atual via decay antes de somar)
5. Insere `pet_care_events`

## 6. Arquivos

**Novos:**
- `src/types/petCare.ts`
- `src/lib/petCare.ts` (queries + decay derivation client-side)
- `src/components/pet/PetNeedsHud.tsx` (6 barras)
- `src/components/pet/PetRadialMenu.tsx` (radial + long-press)
- `src/components/pet/PetCareActionSheet.tsx` (bottom-sheet com itens)
- `src/components/admin/PetCareItemsPanel.tsx` (CRUD + compat)
- `supabase/migrations/<ts>_pet_care.sql`

**Editados:**
- `src/routes/meu-pet.tsx`: monta HUD + ativa long-press no `PetArtwork`
- `src/routes/admin/pets.tsx`: adiciona aba "Cuidados"

## 7. Responsividade

- HUD: `grid-cols-3 sm:grid-cols-6 gap-1.5`, cada barra com label de 1 ícone + número, sem texto longo no mobile
- Radial: raio responsivo `clamp(96px, 28vw, 144px)`, ícones 20px no mobile / 24px desktop
- Sub-painel: `Sheet side="bottom"`, lista vertical de itens, scroll interno
- Stage do pet: `overflow-visible` para o radial não cortar, container externo segura overflow

## 8. Fora de escopo desta entrega

- Notificações push de fome/sono baixos
- Mini-jogos de verdade (apenas botão "brincar" que aplica delta)
- Animações elaboradas no pet ao executar ação (placeholder de pulse)
