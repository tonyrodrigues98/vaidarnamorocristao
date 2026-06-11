## Objetivo

Separar descrição de vantagens no catálogo de pets, criar um CRUD admin de Vantagens com **efeitos reais** (chaves de comportamento) aplicados em todo o sistema, e adicionar preview completo da imagem ao subir no admin. Tudo administrável: você pode criar, editar, ativar/desativar e excluir vantagens.

---

## 1. Banco — vantagens com motor de efeitos

Migration nova:

### `pet_perk_effects` (catálogo de efeitos disponíveis — fixo no código, espelhado em tabela só para o admin escolher por nome)

Campos: `key` (PK, ex.: `daily_coins_plus_1`), `label`, `description`, `category` (`coins | missions | anonymous | gifts | cosmetic | pet_collect | avatar_fx`), `numeric_param` (boolean — se aceita valor), `default_param`, `active`. Seed com os 22 efeitos listados.

### Refatorar `pet_benefits`

- Adicionar coluna `effect_key text references pet_perk_effects(key)` (nullable — vantagem pode ser puramente cosmética/explicativa).
- Adicionar `effect_param int` (ex.: quantas moedas, qual decoration_id).
- Adicionar `effect_target_id uuid` (para "Moldura X desbloqueada pelo pet" apontar para `avatar_decorations.id` etc.).
- Renomear conceito: campo `description` continua para texto livre do admin; UI separa "Descrição" de "Vantagem (efeito)".

### `user_pet_perk_state` (estado por usuário/pet)

`user_id`, `benefit_id`, `last_collected_at`, `accumulated_coins`, etc. — para vantagens coletáveis ("Recompensa diária do pet", "Pet encontra moedas").

GRANTs + RLS padrão (user lê/escreve só o próprio).

---

## 2. Motor de efeitos no backend

Função SQL `public.get_active_pet_perks(_user_id uuid)` → retorna `effect_key, effect_param, effect_target_id` das vantagens ativas do pet equipado em `user_pets_v2` (escopo global/categoria/espécie/variante compatível).

Integrações reais (alteração das funções existentes):

| Efeito | Onde integra |
|---|---|
| `daily_coins_plus_{1,2,3}` | `claim_daily_coins()` — soma extra ao `award` |
| `mission_coins_plus_1` / `mission_bonus_chance` | nova RPC `claim_mission_reward` consultando perks |
| `anonymous_hint_plus_1` | `request_anonymous_hint` — limite 2 → 3 |
| `gift_cashback` / `gift_discount` | RPC de envio de presente (aplicar % no débito ou cashback no `coin_transactions`) |
| `pet_finds_coins_daily` / `pet_daily_reward` | nova RPC `collect_pet_reward()` — 1×/dia, grava em `user_pet_perk_state` |
| `unlock_frame/background/aura/badge` | grant automático em `user_decorations` / `user_profile_backgrounds` / `user_badges` ao equipar pet (trigger em `user_pets_v2`) |
| `pet_message_fx` | flag lida pelo chat para aplicar leve efeito visual nas mensagens do usuário |
| `pet_accessory_slot_plus_1` / `pet_collectible_slot_plus_1` | metadados consumidos pela UI do pet |

---

## 3. Admin `/admin/pets` — aba "Vantagens"

Refatorar a aba existente:

- Campo **Descrição** (texto livre, separado).
- Campo **Efeito**: select com todos os `pet_perk_effects` ativos (agrupados por categoria). Botão "Sem efeito (cosmético)".
- Campo dinâmico conforme efeito escolhido:
  - Numéricos → input "Quantidade".
  - `unlock_*` → select do recurso real (`avatar_decorations` tipo frame/aura, `profile_backgrounds`, `badges`).
- Escopo (global/categoria/espécie/variante) já existe — mantém.
- Ativar/desativar, ordenar, excluir.
- Hook `useBenefitEffects` lista efeitos do banco para popular o select — você pode adicionar/editar/desativar efeitos diretamente em outra mini-aba ("Tipos de efeito"), assim você cria novas regras sem precisar de código (apenas as que tiverem `key` reconhecida pelo backend produzem efeito real; as outras ficam como tags informativas).

### Preview completo da imagem

Em **todas** as abas do admin de pets (categorias/espécies/variantes/fases/personalidades/vantagens), o upload mostra agora:

- Preview grande (até 320px), proporção preservada, fundo xadrez transparência.
- Nome do arquivo, tamanho, dimensões.
- Botões "Trocar" e "Remover".
- Drag & drop além do clique.

---

## 4. Onboarding `/meu-pet` e showcase

- Etapa de vantagens mostra `description` em destaque e o `effect.label` como chip ("⚡ +2 moedas no resgate diário").
- Showcase do pet equipado em `/perfil` lista todas as vantagens ativas do pet.

---

## 5. Seed dos 22 efeitos

Migration insere todos com `key` estáveis. Você pode desativar/renomear o label, mas a `key` não muda (é o que o backend reconhece).

---

## Fora de escopo desta entrega

- Sistema de moderação de vantagens criadas por terceiros (só admin cria).
- Animações WebGL no efeito de mensagem — usaremos um glow CSS leve.
- Reescrita do envio de presentes: vou adicionar uma RPC nova `send_virtual_gift_with_perks` que reaproveita a lógica existente; o componente passa a chamá-la.

Se aprovar, implemento a migration + motor + UI numa sequência só.