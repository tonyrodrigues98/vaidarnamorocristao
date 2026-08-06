# Contratos Supabase usados pela V1

## Escopo da coleta

Foram localizados 113 arquivos TypeScript/TSX em `src` com import do cliente
Supabase ou de tipos do SDK. A inspeção é estática e read-only: não houve
conexão com projeto remoto, execução de query, migration ou função.

O cliente browser é criado em `src/integrations/supabase/client.ts` e os
endpoints server-side criam clientes adequados ao contexto. O root pode obter
somente configuração pública sanitizada em `/api/public/runtime-config` quando
as variáveis públicas de build não estão presentes.

## Auth

Métodos encontrados:

`getClaims`, `getSession`, `getUser`, `onAuthStateChange`,
`resetPasswordForEmail`, `setSession`, `signInWithPassword`, `signOut`,
`signUp` e `updateUser`.

O contrato canônico de sessão fica em `src/lib/auth.tsx`, apoiado pela máquina
de estado técnica `src/v2/app/auth/session-state.ts`. Há um provider de sessão,
uma restauração inicial e uma subscription por instância do provider.

## Relações PostgREST

Foram encontrados 63 nomes literais em `.from("...")`. O catálogo de pets
também aceita seis nomes tipados dinamicamente. A lista abaixo registra o
contrato observado, não a existência remota.

### Identidade, conta e acesso

- `profiles`, `profile_advanced`, `profile_preferences`, `profile_views`
- `profile_photos`, `verification_requests`, `terms_acceptances`
- `user_activity`, `user_roles`, `user_ban_appeals`
- `user_admin_requests`, `user_admin_warnings`, `blocks`, `reports`

### Namoro, recados, propósito e mensagens

- `interests`, `matches`, `relationship_commitments`
- `anonymous_messages`, `anonymous_messages_inbox`,
  `anonymous_messages_outbox`, `anonymous_message_hints`,
  `anonymous_message_settings`
- `messages`, `message_flags`, `conversations`, `couple_time_capsules`
- `global_messages`

### Conteúdo, oração e notificações

- `daily_posts`, `devotional_comments`, `devotional_comment_likes`,
  `devotional_comment_reports`, `devotional_prayed`,
  `devotional_reactions`
- `prayer_requests`, `prayer_request_prayed`, `prayer_request_reports`
- `notifications`, `push_queue`, `push_subscriptions`

### Economia, presentes e personalização

- `user_coins`, `gift_transactions`
- `avatar_bases`, `avatar_categories`, `avatar_items`
- `user_avatar_base`, `user_avatar_equipped`, `user_avatar_inventory`,
  `user_avatar_looks`
- `user_badges`, `stickers`, `sticker_categories`

### Pets

- Literais: `pets`, `user_pets`, `pet_care_events`, `pet_confessions`
- Dinâmicas limitadas pelo tipo `PetCatalogTable`: `pet_categories`,
  `pet_species`, `pet_variants`, `pet_life_stages`,
  `pet_personalities`, `pet_benefits`

### Moderação, suporte e pré-cadastro

- `photo_moderation_log`, `photo_moderation_queue`,
  `photo_moderation_settings`, `restricted_words`
- `support_articles`, `support_messages`, `support_tickets`
- `pre_cadastros`, `pre_cadastro_matches`

## RPCs

Foram encontrados 91 nomes literais:

```text
admin_add_user_coins
admin_ban_user
admin_delete_user_photo
admin_economy_summary
admin_grant_coins
admin_hard_delete_user
admin_remove_badge
admin_search_users
admin_unban_user
admin_user_economy
apply_pet_care
award_contributor_badge
award_xp
buy_anonymous_extra
cancel_account_deletion
check_text_restricted
claim_daily_coins
claim_expedition
claim_free_frame
claim_freebie
claim_pet_weekly_chest
claim_starter_bundle
collect_pet_reward
equip_decoration
equip_name_gradient
equip_pet
equip_pet_background
equip_profile_background
evolve_my_pet
expire_anonymous_messages
get_active_expedition
get_active_pet_perks
get_anonymous_cooldown
get_anonymous_quota
get_grab_state
get_hidden_staff_ids
get_my_coins
get_my_missions
get_my_prestige
get_my_rebirth_history
get_my_starter_bundle
get_my_xp_state
get_pet_dream_match
get_pet_evolution_status
get_pet_streak
get_pet_weekly_chest
get_prayer_streak
get_received_gifts_public
get_today_expeditions
get_today_missions
get_today_quiz
ignore_anonymous_message
increment_article_views
list_my_freebie_status
mark_all_notifications_read
mark_message_read
perform_grab
perform_grab_multi
pet_care_uses_today
pet_runtime_modifiers
prestige_rebirth
purchase_avatar_item
purchase_decoration
purchase_name_gradient
purchase_profile_background
recompute_user_badges
redeem_virtual_gift
reply_anonymous_message
report_anonymous_message
request_account_deactivation
request_account_deletion
request_account_reactivation
request_anonymous_hint
request_anonymous_reveal
request_reverification
roll_daily_expeditions
roll_daily_missions
send_anonymous_hint_text
send_anonymous_message
send_virtual_gift
set_anonymous_optout
spend_coin
start_expedition
touch_my_activity
unequip_decoration
unequip_name_gradient
unequip_profile_background
unignore_anonymous_message
unlock_adult_pet_with_coins
unlock_pet_background
unmatch
```

RPCs administrativas, econômicas e de concessão de benefícios são contratos
server-side relevantes. A presença no cliente não prova, sozinha, que a
autorização remota esteja correta; isso depende das functions e policies
aplicadas.

## Storage observado no código

Buckets literais em `storage.from(...)`:

- `avatar-items`
- `avatar-looks`
- `gift-images`
- `photo-moderation-rejects`
- `profile-photos`
- `stickers`
- `support-attachments`
- `verifications`

Buckets adicionais referenciados por constantes:

- `pets`
- `pet-expeditions`
- `live-team`

Arquivos com `createSignedUrl`: `src/lib/expeditionImageUrl.ts`,
`src/lib/liveTeam.ts`, `src/lib/petImageUrl.ts`, `src/lib/photoUrl.ts`,
`src/routes/admin/economia.tsx`, `src/routes/admin/fotos.tsx`,
`src/routes/admin/verificacoes.tsx` e `src/routes/suporte/$id.tsx`.

O contrato atual diferencia URL pública estável e assinatura privada em helpers
de foto/pet. A classificação efetiva de bucket no projeto publicado não foi
consultada nesta etapa.

## Endpoints internos

| Endpoint                          | Papel observado                                                    |
| --------------------------------- | ------------------------------------------------------------------ |
| `/api/photo-repair`               | Reparação controlada de caminhos de foto; usa cliente server-side. |
| `/api/public/hooks/push-dispatch` | Dispatch de push autenticado por segredo server-side.              |
| `/api/public/runtime-config`      | Expõe apenas configuração pública necessária ao cliente.           |
| `/api/verify-photo`               | Validação server-side de foto.                                     |

Não existe diretório versionado `supabase/functions` no commit-base.

## O que não está comprovado

- Quais migrations estão aplicadas no Supabase publicado.
- Estado real de tabelas, dados, policies, buckets, Auth, Realtime e funções.
- Existência/valor de secrets, Vault, cron ou Jobs remotos.
- Paridade entre tipos locais e schema remoto.
- Sucesso funcional dos RPCs ou das permissões.
