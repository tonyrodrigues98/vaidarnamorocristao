# VaiDarNamoro — Item 3: Snapshot Canônico Documental do Supabase

**Status:** concluído no nível documental; comparação direta com o banco publicado pendente de execução da consulta de inventário em ambiente autenticado  
**Data de corte:** 22 de julho de 2026  
**Repositório:** `tonyrodrigues98/vaidarnamorocristao`  
**Branch:** `main`  
**Commit canônico:** `1de94bca421c36d32b1a4d96b2fc96f2330129aa`  
**Projeto Supabase declarado:** `fngczifztngaanqsjtyn`  
**Escopo:** somente leitura; nenhuma migration, policy, função, tabela, bucket ou dado foi alterado

---

## 1. Conclusão executiva

O backend do VaiDarNamoro não pode ser representado corretamente apenas pela pasta de migrations.

Existem hoje três versões conceituais do schema:

1. **Histórico declarado:** as 196 migrations mostram como o banco evoluiu.
2. **Contrato consumido pelo aplicativo:** `src/integrations/supabase/types.ts` mostra o que o frontend acredita existir.
3. **Estado publicado:** o catálogo PostgreSQL do projeto Supabase é a única fonte capaz de provar o que existe agora em produção.

Este documento congela as duas primeiras camadas e define o procedimento de leitura para confirmar a terceira. O resultado já é suficiente para desenhar os domínios futuros, identificar dependências e impedir remoções acidentais. Ele ainda não deve ser usado como migration de substituição ou baseline executável.

### Números canônicos do contrato tipado

| Objeto                      | Quantidade |
| --------------------------- | ---------: |
| Tabelas públicas            |        140 |
| Views públicas              |          3 |
| Funções/RPCs públicas       |        201 |
| Enums públicos              |         26 |
| Relacionamentos tipados     |         91 |
| Migrations no repositório   |        196 |
| Linhas SQL nas migrations   |     21.890 |
| Migrations de maio de 2026  |         84 |
| Migrations de junho de 2026 |        112 |

### Evidências de acúmulo histórico

| Operação encontrada nas migrations | Ocorrências históricas |
| ---------------------------------- | ---------------------: |
| `CREATE TABLE`                     |                    151 |
| `ALTER TABLE`                      |                    286 |
| `CREATE/REPLACE FUNCTION`          |                    394 |
| `CREATE POLICY`                    |                    446 |
| `DROP POLICY`                      |                    169 |
| `CREATE TRIGGER`                   |                    114 |
| `SECURITY DEFINER`                 |                    384 |
| habilitações de RLS                |                    153 |
| `GRANT EXECUTE`                    |                    214 |
| `REVOKE`                           |                    191 |

Há 394 definições históricas para apenas 201 funções finais tipadas. Isso não significa 193 funções abandonadas: muitas foram redefinidas várias vezes. Da mesma forma, 151 criações históricas de tabela resultam em 140 tabelas expostas atualmente.

---

## 2. Fontes e nível de confiança

### Fonte A — GitHub no commit canônico

Foram verificados:

- `supabase/config.toml`;
- as 196 migrations em ordem cronológica;
- `src/integrations/supabase/types.ts`;
- os quatro commits posteriores à auditoria inicial.

Os quatro commits entre `7fb5c97` e `1de94bca` alteraram apenas 16 imagens de ícones e splash screens. Não houve mudança de migration ou tipos nesse intervalo.

### Fonte B — Tipos gerados do Supabase

O arquivo tipado declara PostgREST `14.5` e é a melhor fotografia versionada do contrato consumido pelo frontend. Ele confirma tabelas, colunas, views, argumentos/retornos de RPCs, enums e parte dos relacionamentos.

Ele não confirma:

- se os tipos foram regenerados após a última alteração manual no banco;
- policies RLS atuais;
- grants efetivos;
- triggers efetivos;
- índices atuais;
- buckets presentes fora das migrations;
- tabelas realmente habilitadas no Realtime;
- migrations aplicadas ou reparadas manualmente no projeto publicado.

### Fonte C — Reconstituição estática das migrations

A reconstituição em ordem cronológica permite estimar o último `CREATE`, `DROP` ou `ALTER` conhecido. Ela é útil para encontrar intenção e dependências, mas não substitui um dump do catálogo porque:

- uma migration pode ter falhado parcialmente;
- SQL pode ter sido executado pelo painel fora do Git;
- funções e policies podem ter sido ajustadas manualmente;
- comandos condicionais podem produzir resultados diferentes conforme o estado anterior;
- algumas migrations redefinem objetos sem registrar uma remoção completa do anterior.

### Classificação de confiança

| Marca        | Significado                                      |
| ------------ | ------------------------------------------------ |
| Confirmado-T | objeto presente no contrato tipado atual         |
| Confirmado-G | conteúdo confirmado no GitHub no commit canônico |
| Inferido-M   | estado final inferido pela ordem das migrations  |
| Pendente-P   | precisa ser confirmado no PostgreSQL publicado   |

---

## 3. Divisão canônica por domínios

As 140 tabelas foram atribuídas uma única vez a 12 domínios documentais. Esta divisão não muda o banco; serve de base para a futura arquitetura modular.

| Domínio documental                        | Tabelas | Estado futuro preliminar                         |
| ----------------------------------------- | ------: | ------------------------------------------------ |
| Identidade, perfil e governança de conta  |      17 | preservar e separar melhor                       |
| Namoro e relacionamento                   |       8 | preservar, redesenhar e desacoplar da comunidade |
| Recados anônimos                          |       5 | revisar como feature autônoma                    |
| Comunidade e conteúdo cristão             |      13 | expandir como domínio principal                  |
| Suporte                                   |       3 | preservar/refatorar                              |
| Notificações e push                       |       3 | preservar e corrigir segurança                   |
| Economia, loja e personalização de perfil |      21 | preservar e modularizar                          |
| Avatar-personagem customizável            |       7 | retirar futuramente com migração controlada      |
| Pré-cadastro e equipe da live             |       4 | revisar finalidade futura                        |
| Pets, cuidado, progressão e álbum         |      40 | preservar como subproduto modular                |
| Grab/caixas                               |       9 | preservar com controles econômicos               |
| Pet Arcade                                |      10 | preservar/refatorar como subproduto modular      |
| **Total**                                 | **140** |                                                  |

---

## 4. Catálogo das 140 tabelas

### 4.1 Identidade, perfil e governança — 17

- `profiles`: identidade pública, status, dados básicos, foto principal e campos de apresentação.
- `profile_advanced`: dados de fé, rotina, objetivos e demais informações avançadas.
- `profile_preferences`: preferências de descoberta/relacionamento.
- `profile_photos`: galeria e ordenação de fotos.
- `profile_views`: registro de visualizações de perfil.
- `presence_last_seen`: presença e última atividade visível.
- `user_activity`: eventos de atividade do próprio usuário.
- `terms_acceptances`: aceite versionado de termos.
- `user_roles`: cargos e metadados de exibição da equipe.
- `verification_requests`: solicitações e decisões de verificação.
- `photo_moderation_log`: histórico de moderação de imagens.
- `photo_moderation_queue`: fila de análise de fotos.
- `photo_moderation_settings`: configuração administrativa da moderação.
- `reactivation_reminders`: lembretes de reativação.
- `user_admin_requests`: solicitações administrativas direcionadas ao usuário.
- `user_admin_warnings`: advertências administrativas.
- `user_ban_appeals`: apelações de banimento.

Regra de preservação: remover o avatar-personagem não permite remover a foto principal, `profile_photos`, a fila de moderação nem o escopo de moderação chamado `avatar`.

### 4.2 Namoro e relacionamento — 8

- `interests`;
- `matches`;
- `messages`;
- `blocks`;
- `reports`;
- `relationship_commitments`;
- `couple_time_capsules`;
- `message_flags`.

Este domínio sustenta interesse recíproco, match, chat privado, bloqueio, denúncia, Propósito Firmado e cápsulas do casal. Ele deve ser desacoplado da futura presença comunitária, mas seus dados e regras não podem ser apagados.

### 4.3 Recados anônimos — 5

- `anonymous_hint_options`;
- `anonymous_message_hints`;
- `anonymous_message_reports`;
- `anonymous_message_settings`;
- `anonymous_messages`.

As views `anonymous_messages_inbox` e `anonymous_messages_outbox` também pertencem a este domínio.

### 4.4 Comunidade e conteúdo cristão — 13

- `global_messages`;
- `daily_posts`;
- `devotional_comment_likes`;
- `devotional_comment_reports`;
- `devotional_comments`;
- `devotional_prayed`;
- `devotional_reactions`;
- `prayer_request_prayed`;
- `prayer_request_reports`;
- `prayer_requests`;
- `bible_quiz_questions`;
- `user_quiz_attempts`;
- `restricted_words`.

Hoje a comunidade está centrada em mensagens globais e conteúdos separados. Na arquitetura futura, este domínio deve assumir feed, grupos/espaços, eventos e descoberta social sem depender da elegibilidade romântica.

### 4.5 Suporte — 3

- `support_articles`;
- `support_messages`;
- `support_tickets`.

### 4.6 Notificações e push — 3

- `notifications`;
- `push_queue`;
- `push_subscriptions`.

O domínio deve ser preservado, mas o endpoint público que processa `push_queue` precisa da contenção descrita no Item 2.

### 4.7 Economia, loja e personalização de perfil — 21

- `coin_transactions`;
- `user_coins`;
- `virtual_gifts`;
- `gift_transactions`;
- `avatar_decorations`;
- `user_decorations`;
- `profile_backgrounds`;
- `user_profile_backgrounds`;
- `name_gradients`;
- `user_name_gradients`;
- `sticker_categories`;
- `stickers`;
- `badges`;
- `user_badges`;
- `user_achievements`;
- `pet_achievements`;
- `xp_events`;
- `user_xp`;
- `user_starter_bundle`;
- `user_freebie_claims`;
- `user_donations`.

Observação essencial: `avatar_decorations` representa molduras, auras e decorações aplicadas à foto/perfil. Apesar do nome, não é a mesma coisa que o personagem customizável e deve ser preservada para o futuro perfil no estilo Steam.

### 4.8 Avatar-personagem customizável — 7

- `avatar_bases`;
- `avatar_categories`;
- `avatar_items`;
- `user_avatar_base`;
- `user_avatar_equipped`;
- `user_avatar_inventory`;
- `user_avatar_looks`.

Função diretamente associada: `purchase_avatar_item`.

Decisão de produto: este conjunto será removido futuramente. No momento, deve permanecer intacto. A retirada exigirá antes:

1. provar que nenhuma recompensa, compra ou tela ainda depende desses registros;
2. separar itens comprados e eventuais moedas gastas;
3. decidir compensação ou conversão de inventário;
4. remover referências do frontend;
5. bloquear novas compras;
6. arquivar/exportar dados;
7. só depois remover RPCs, policies e tabelas.

Não pertencem à remoção:

- `profiles` e a foto principal;
- `profile_photos`;
- `photo_moderation_*`;
- enum `photo_moderation_scope = 'avatar' | 'extra'`;
- `avatar_decorations`;
- `user_decorations`;
- molduras, auras, fundos e gradientes.

### 4.9 Pré-cadastro e equipe da live — 4

- `pre_cadastros`;
- `pre_cadastro_matches`;
- `live_team_members`;
- `live_monthly_highlights`.

### 4.10 Pets, cuidado, progressão e álbum — 40

- catálogo e instâncias: `pets`, `user_pets`, `user_pets_v2`, `pet_categories`, `pet_species`, `pet_variants`, `pet_life_stages`;
- personalidade e benefícios: `pet_personalities`, `pet_benefits`, `pet_perk_effects`, `user_pet_perk_state`, `pet_personality_effects`;
- cenários: `pet_backgrounds`, `pet_background_compat`, `user_pet_backgrounds`;
- cuidado: `pet_care_items`, `pet_care_item_compat`, `pet_care_state`, `pet_care_events`, `pet_care_config`, `pet_care_push_log`, `pet_care_streaks`;
- eventos e buffs: `pet_random_events`, `user_pet_buffs`, `user_pet_random_event_log`;
- missões e confissões: `pet_missions`, `user_daily_missions`, `pet_confessions`, `user_pet_confession_log`;
- progressão: `user_pet_chest_claims`, `user_prestige`, `pet_rebirth_history`, `user_pet_unlocks`;
- expedições: `pet_expeditions`, `user_daily_expeditions`, `user_pet_expedition_runs`;
- álbum: `pet_album_stickers`, `user_pet_album_stickers`, `pet_album_pack_openings`, `pet_album_rewards_claimed`.

Há coexistência de `user_pets` e `user_pets_v2`. Isso é sinal de migração evolutiva e deve ser resolvido por compatibilidade, não por exclusão direta.

### 4.11 Grab/caixas — 9

- `grab_config`;
- `grab_pool_cooldowns`;
- `grab_pool_pity`;
- `grab_pool_prizes`;
- `grab_pools`;
- `user_daily_grabs`;
- `user_daily_grabs_by_pool`;
- `user_grab_inventory`;
- `user_grab_log`.

### 4.12 Pet Arcade — 10

- `pet_arcade_config`;
- `pet_arcade_daily_missions`;
- `pet_arcade_flight_rounds`;
- `pet_arcade_game_configs`;
- `pet_arcade_game_events`;
- `pet_arcade_rounds`;
- `pet_arcade_settings`;
- `pet_arcade_surprise_eggs`;
- `pet_arcade_treasure_rounds`;
- `user_pet_arcade_daily_missions`.

---

## 5. Views canônicas

| View                        | Domínio          | Finalidade                      |
| --------------------------- | ---------------- | ------------------------------- |
| `anonymous_messages_inbox`  | recados anônimos | caixa de entrada derivada       |
| `anonymous_messages_outbox` | recados anônimos | caixa de saída derivada         |
| `v_economy_daily`           | economia/admin   | consolidação diária da economia |

As views dependem de tabelas e policies subjacentes. A futura baseline deve preservar explicitamente `security_invoker`/privilégios conforme o estado confirmado no banco publicado.

---

## 6. Funções e RPCs

O contrato tipado expõe 201 funções. Elas se dividem em seis grandes responsabilidades.

### 6.1 Administração e governança

Inclui `admin_add_user_coins`, `admin_grant_coins`, `admin_ban_user`, `admin_unban_user`, `admin_hard_delete_user`, `admin_delete_user_photo`, `admin_search_users`, `admin_user_economy`, `admin_economy_summary`, `admin_remove_badge`, helpers de cargo como `has_role`, `is_staff`, `is_support_staff`, `get_admin_ids` e `get_user_primary_role`.

### 6.2 Relacionamento, mensagens e conta

Inclui `is_match_participant`, `mark_message_read`, `unmatch`, `check_text_restricted`, `create_notification`, `request_account_deactivation`, `request_account_deletion`, `cancel_account_deletion`, `request_account_reactivation`, `request_reverification`, `current_terms_version`, `has_accepted_current_terms` e `run_reactivation_reminders`.

### 6.3 Economia, loja e perfil

Inclui `get_my_coins`, `claim_daily_coins`, `grant_coin_event`, `spend_coin`, `log_coin_tx`, compras/equipamentos de decoração, fundo e gradiente, `send_virtual_gift`, `redeem_virtual_gift`, `claim_starter_bundle`, `claim_freebie`, `award_xp`, `get_my_xp_state`, `level_from_xp`, `xp_for_level`, badges e conquistas.

As funções `grant_coin_event`, `award_xp`, `track_achievement` e `progress_mission_action` precisam obedecer ao plano de contenção do Item 2 antes de qualquer expansão.

### 6.4 Recados anônimos

Inclui envio, resposta, dica, revelação, denúncia, ignore/unignore, quota, cooldown, expiração, opt-out e compra de capacidade extra.

### 6.5 Pets, missões, Grab e progressão

Inclui cuidado, evolução, streak, baú semanal, missões, expedições, confissões, perks, fundos, desbloqueios, prestígio, rebirth, álbum, packs, Grab, pity/cooldown e estado de progressão.

### 6.6 Pet Arcade

Inclui helpers internos prefixados por `_pet_arcade_`, início/finalização de jogos, resultados, resgate, retomada, limites, histórico, catálogo, métricas administrativas e configuração.

### Diagnóstico de manutenção

- 201 funções aparecem no tipo final.
- 394 criações/redefinições aparecem no histórico.
- 110 das 196 migrations criam ou redefinem ao menos uma função.
- 384 ocorrências de `SECURITY DEFINER` exigem confirmação de `search_path`, autenticação e grants finais.

Conclusão: a futura baseline deve ser gerada a partir do banco publicado e revisada função por função. Concatenar as migrations não produz uma fonte canônica legível.

---

## 7. Enums canônicos

O contrato tipado expõe 26 enums:

`anonymous_hint_category`, `anonymous_message_status`, `app_role`, `couple_status`, `daily_post_kind`, `decoration_type`, `devotional_reaction`, `gift_category`, `gift_rarity`, `gift_tx_status`, `grab_prize_kind`, `location_scope`, `marital_status`, `pet_care_kind`, `pet_rarity`, `photo_moderation_scope`, `photo_moderation_status`, `prayer_category`, `prayer_moderation_status`, `profile_status`, `report_status`, `sex_type`, `support_category`, `support_priority`, `support_status`, `verification_status`.

Enums de maior impacto arquitetural:

- `app_role`: `admin`, `user`, `super_admin`, `apresentador`, `moderador`;
- `profile_status`: `pending`, `approved`, `rejected`, `banned`;
- `sex_type`: `masculino`, `feminino`;
- `marital_status`: `solteiro`, `divorciado`, `viuvo`;
- `couple_status`: `aceitaram_conversar`, `namorando`, `casamento_marcado`;
- `photo_moderation_scope`: `avatar`, `extra`.

Para separar comunidade de namoro, não é obrigatório remover `sex_type` ou `marital_status`; é necessário impedir que esses enums governem presença comunitária e descoberta social geral.

---

## 8. Relacionamentos e centros de dependência

Os tipos declaram 91 relacionamentos. Os alvos com maior número de referências são:

| Relação de destino    | Referências tipadas |
| --------------------- | ------------------: |
| `user_pets_v2`        |                   7 |
| `pet_categories`      |                   6 |
| `grab_pools`          |                   5 |
| `pet_arcade_rounds`   |                   5 |
| `pet_species`         |                   4 |
| `avatar_decorations`  |                   4 |
| `devotional_comments` |                   3 |
| `daily_posts`         |                   3 |
| `pet_care_items`      |                   3 |
| `pet_personalities`   |                   3 |
| `pet_benefits`        |                   3 |

Isso confirma dois centros de acoplamento:

1. `user_pets_v2` é o núcleo real do pet moderno e não pode ser refeito isoladamente.
2. `avatar_decorations` é uma dependência da personalização de foto/perfil, não do avatar-personagem removível.

Relacionamentos para `auth.users` nem sempre aparecem integralmente nos tipos de `public`, portanto a contagem de 91 não representa todas as foreign keys físicas.

---

## 9. RLS e policies

O histórico contém 446 `CREATE POLICY` e 169 `DROP POLICY`. Uma reconstituição estática ordenada encontrou aproximadamente 353 policies finais em 140 alvos, incluindo `storage.objects` e o schema de Realtime.

Essa quantidade é **Inferido-M**, não **Confirmado-P**. Ela pode variar no banco publicado por:

- políticas criadas manualmente;
- renomes e recriações condicionais;
- migrations parcialmente aplicadas;
- diferenças de capitalização e nomes com aspas;
- objetos gerenciados pelo próprio Supabase.

### Famílias críticas de RLS

- identidade: proprietário do perfil versus staff;
- chat: participante do match;
- Propósito Firmado: participantes do compromisso;
- comunidade: usuário aprovado, autor e moderador;
- suporte: dono do ticket e equipe autorizada;
- economia: leitura própria, mutações por RPC;
- pets: dono da instância, catálogo público e admin;
- Pet Arcade: leitura própria/admin, liquidação no backend;
- Storage: pasta do usuário, leitura pública ou equipe;
- verificação/moderação: proprietário limitado e administrador.

### Regra para a futura baseline

Nenhuma policy deve ser copiada por nome apenas. Para cada tabela será necessário registrar:

- comando: `SELECT`, `INSERT`, `UPDATE`, `DELETE` ou `ALL`;
- papéis alcançados;
- expressão `USING`;
- expressão `WITH CHECK`;
- dependências de helpers `SECURITY DEFINER`;
- teste positivo e negativo por cargo.

---

## 10. Storage

As migrations declaram oito buckets:

| Bucket                     | Visibilidade declarada | Finalidade                          |
| -------------------------- | ---------------------- | ----------------------------------- |
| `profile-photos`           | público                | fotos de perfil e pré-cadastros     |
| `verifications`            | privado                | documentos/arquivos de verificação  |
| `support-attachments`      | privado                | anexos de suporte                   |
| `photo-moderation-rejects` | privado                | evidências de rejeição/moderação    |
| `stickers`                 | público                | stickers da plataforma              |
| `gift-images`              | público                | imagens de presentes                |
| `profile-backgrounds`      | público                | fundos premium de perfil            |
| `live-team`                | público                | imagens da equipe/destaques da live |

Foram encontradas 52 policies historicamente reconstituídas em `storage.objects`, incluindo políticas relacionadas a pets e avatar looks que podem operar sobre buckets não criados explicitamente pelas migrations ou sobre objetos em buckets já existentes.

Ponto pendente: listar os buckets reais, limites de tamanho, MIME types e policies publicadas diretamente no catálogo do projeto.

---

## 11. Realtime

A aplicação ordenada dos comandos `ADD TABLE` e `DROP TABLE` das migrations resulta na seguinte allowlist inferida de 17 tabelas:

- `anonymous_message_hints`;
- `anonymous_messages`;
- `daily_posts`;
- `devotional_comment_likes`;
- `devotional_comments`;
- `devotional_prayed`;
- `devotional_reactions`;
- `global_messages`;
- `interests`;
- `matches`;
- `messages`;
- `notifications`;
- `prayer_request_prayed`;
- `prayer_requests`;
- `support_messages`;
- `support_tickets`;
- `user_badges`.

Esse conjunto é **Inferido-M**. Deve ser comparado com `pg_publication_tables` no banco publicado.

Tabelas explicitamente removidas da publicação ao longo do histórico incluem `message_flags`, `profile_views`, `presence_last_seen`, `prayer_request_reports`, `user_admin_warnings`, `user_admin_requests` e `user_ban_appeals`. Algumas tabelas de suporte foram removidas e adicionadas novamente depois.

---

## 12. Triggers e índices

A reconstituição estática encontrou aproximadamente:

- 111 triggers finais distribuídos por 66 tabelas;
- 114 índices nomeados criados sem remoção posterior detectada.

Principais famílias de triggers:

- criação de perfil/moedas após cadastro em `auth.users`;
- criação de match em interesse recíproco;
- notificações de interesse, match, mensagem e status;
- proteção de campos administrativos;
- validação de palavras restritas;
- atualização de `updated_at`;
- fila de push;
- progresso de missões e conquistas;
- limites e progressão de pets;
- limites e missões do Pet Arcade;
- sincronização de stickers do álbum.

Os valores são inferidos por análise estática. O catálogo publicado deve confirmar nome, tabela, evento, condição, função executada e estado habilitado de cada trigger.

---

## 13. Divergências e dívidas documentais já comprovadas

### D-01 — Histórico maior que o contrato final

151 criações de tabela versus 140 tabelas tipadas e 394 definições de função versus 201 funções tipadas. O histórico é evolutivo, não canônico.

### D-02 — Dois modelos de pet de usuário

`user_pets` e `user_pets_v2` coexistem. A reestruturação precisa mapear dados, consumidores e compatibilidade de ambos.

### D-03 — Palavra “avatar” tem dois sentidos

O schema mistura:

- avatar-personagem customizável, que sairá;
- foto principal e decorações do perfil, que permanecerão.

Uma renomeação futura deve evitar exclusão errada.

### D-04 — Policies não aparecem nos tipos

O contrato TypeScript não prova segurança. RLS precisa de inventário próprio.

### D-05 — Realtime possui adições e remoções sucessivas

O estado final só pode ser confirmado pela publicação real.

### D-06 — Storage pode conter estado fora das migrations

Policies citam categorias de objetos que não correspondem diretamente aos oito buckets criados no histórico. É necessário listar o estado real.

### D-07 — Migrations concentradas em seis semanas

Foram 196 migrations entre maio e junho de 2026, sendo 112 apenas em junho. A velocidade de evolução explica redefinições, sobreposições e ausência de baseline.

### D-08 — Segurança depende de funções

Há 384 ocorrências históricas de `SECURITY DEFINER`. O snapshot futuro precisa registrar grants e corpo efetivo de cada função, não apenas assinatura.

---

## 14. Procedimento para confirmar o banco publicado

Foi preparado o arquivo `VDN_ITEM_3_SUPABASE_INVENTARIO_READONLY.sql`. Ele contém somente consultas `SELECT` e não altera o banco.

Quando executado por uma conta autorizada no SQL Editor do projeto correto, deve produzir inventários de:

1. versão e projeto;
2. migrations aplicadas;
3. tabelas e views;
4. colunas;
5. foreign keys e constraints;
6. enums;
7. funções, argumentos, retorno, owner, segurança e grants;
8. RLS e policies;
9. triggers;
10. índices;
11. publicação Realtime;
12. buckets e policies de Storage;
13. extensões.

### Comparações obrigatórias

| Comparação                               | Resultado esperado                                        |
| ---------------------------------------- | --------------------------------------------------------- |
| migrations GitHub × migrations aplicadas | nenhuma ausente, extra ou fora de ordem sem justificativa |
| tipos × tabelas/views                    | mesmos nomes e colunas públicas                           |
| tipos × RPCs                             | mesmas assinaturas e retornos                             |
| histórico × RLS real                     | diferenças documentadas e testadas                        |
| histórico × Realtime real                | allowlist confirmada                                      |
| histórico × Storage real                 | buckets, privacidade e policies confirmados               |

### Classificação de divergência

- **Legítima:** ajuste manual conhecido e que será versionado.
- **Drift:** diferença não documentada entre produção e Git.
- **Obsoleto no Git:** objeto versionado que não existe mais no banco.
- **Obsoleto no banco:** objeto publicado sem consumidor ou sem fonte versionada.
- **Crítico:** diferença que afeta autorização, saldo, XP, inventário, mensagens ou dados pessoais.

---

## 15. Como criar a baseline futura sem risco

A baseline executável não deve ser criada agora. Após confirmar o banco publicado:

1. gerar dump somente de schema do ambiente correto;
2. remover ownership e detalhes específicos de ambiente que não devam ser portáveis;
3. separar extensões, tipos, tabelas, constraints, índices, views, funções, triggers, grants, RLS, Realtime e Storage;
4. revisar todas as funções `SECURITY DEFINER`;
5. validar em um projeto Supabase descartável;
6. regenerar `types.ts` e comparar sem diferenças inesperadas;
7. executar a suíte de RLS;
8. testar restauração com dados fictícios;
9. manter as 196 migrations como histórico imutável;
10. usar a baseline somente para novos ambientes, nunca reaplicá-la sobre produção.

---

## 16. Contrato de preservação para os próximos itens

Até que a comparação publicada esteja concluída:

- não apagar tabelas ou colunas;
- não renomear objetos no banco;
- não consolidar `user_pets` e `user_pets_v2`;
- não retirar o avatar-personagem diretamente;
- não confundir `avatar_decorations` com o avatar-personagem;
- não substituir as 196 migrations por um SQL único;
- não alterar enums usados por dados existentes;
- não reduzir RLS para facilitar o redesign;
- não mover lógica econômica crítica para o cliente;
- não remover triggers de match, notificações, missões ou progressão sem mapa de consumidores.

---

## 17. Critério de conclusão do Item 3

### Concluído agora

- commit canônico confirmado;
- migrations enumeradas e analisadas em ordem;
- contrato tipado inventariado;
- 140 tabelas classificadas por domínio;
- 3 views, 201 funções, 26 enums e 91 relações documentados;
- Storage e Realtime inferidos;
- fronteira de remoção do avatar-personagem registrada;
- divergências documentais identificadas;
- consulta segura de inventário publicada preparada.

### Pendente para confirmação absoluta

- executar a consulta somente leitura no projeto Supabase publicado;
- exportar os resultados;
- comparar objeto por objeto;
- registrar drift;
- só então produzir a baseline executável para novos ambientes.

O Item 4 — divisão futura por domínios — pode ser desenhado com este snapshot documental. Qualquer implementação no banco deve aguardar a confirmação publicada e as correções P0 do Item 2.
