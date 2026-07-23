# V2-008 — Capabilities confiáveis de recompensa

## Escopo

Este lote fecha, em migration local não aplicada, as funções genéricas:

- `grant_coin_event(uuid, integer, text)`;
- `award_xp(text, integer, integer, jsonb)`;
- `track_achievement(uuid, text, integer, text)`;
- `progress_mission_action(uuid, text, integer)`;
- `create_notification(uuid, text, text, text, text, uuid, uuid)`.

O inventário estático encontrou somente um chamador direto no browser:
`src/lib/xp.ts` chamava `award_xp` para cuidado do pet. As outras funções são
chamadas por triggers ou corpos `SECURITY DEFINER` do histórico.

Nenhuma conclusão sobre ACL publicada foi feita. Tipos não representam grants,
owners, `search_path` ou default privileges.

## Migration local

`20260723000001_v2_trusted_reward_capabilities.sql`:

1. falha em preflight se uma das cinco assinaturas finais esperadas não existir;
2. cria `trusted_reward_claims`, ledger sem escrita/leitura de cliente;
3. torna `pet_care_state` e inserções em `pet_care_events` server-owned;
4. cria `award_my_care_xp(uuid)`;
5. revoga as funções genéricas de `PUBLIC`, `anon` e `authenticated`;
6. concede as funções genéricas somente a `service_role`;
7. fixa `search_path = pg_catalog, public`;
8. revoga o default futuro de execução de funções para `PUBLIC` no owner da
   migration.

A migration é aditiva para dados: não remove tabela, coluna, linha, saldo,
evento, progresso ou histórico. Ela altera ACL/policy e, por isso, só poderá ser
aplicada depois do snapshot autenticado, backup, teste descartável, janela e
rollback operacional.

## Capability `award_my_care_xp`

O browser envia apenas `_user_pet_id`. O servidor:

- deriva o destinatário de `auth.uid()`;
- exige pet pertencente ao chamador;
- usa o evento de cuidado server-owned mais recente, limitado a cinco minutos;
- deriva o valor anterior da barra do estado e do delta persistidos;
- escolhe `care_rescue` (15 XP, cap diário 4) abaixo de 20;
- escolhe `care_low` (8 XP, cap diário 6) abaixo de 50;
- não concede fora dessas regras;
- registra claim único por usuário/evento;
- trata replay e concorrência sem segunda concessão;
- cria metadata categórica no servidor.

`src/lib/xp.ts` expõe apenas `awardCareXp(userPetId)`. O catálogo e os valores
antigos foram removidos do cliente. A UI continua mostrando o XP concedido, mas
não controla sua quantidade.

## Estado e eventos de cuidado

O histórico concedia `SELECT, INSERT, UPDATE, DELETE` em `pet_care_state` ao
usuário e uma policy `FOR ALL`. O helper exportado `consumeEnergyLocally` não tem
consumidor alcançável no grafo estático; o comando real `apply_pet_care` já
mantém estado e evento transacionalmente.

A migration troca a policy por leitura owner-only, revoga escrita direta no
estado e revoga inserção direta no log. O snapshot publicado deve confirmar que
não há outro consumidor externo antes do rollout.

## Matriz de autorização pretendida

| Operação                |  anon |  authenticated | service_role | trigger/owner |
| ----------------------- | ----: | -------------: | -----------: | ------------: |
| funções genéricas       | negar |          negar |     permitir |      permitir |
| `award_my_care_xp`      | negar | próprio evento |     permitir |      permitir |
| `trusted_reward_claims` | negar |          negar |     permitir |  função owner |
| `pet_care_state`        | negar |    ler próprio |     permitir |      escrever |
| `pet_care_events`       | negar |    ler próprio |     permitir |       inserir |

Autenticação no frontend não substitui esta matriz, e `service_role` não entra no
browser.

## Testes

`tests/trusted-capabilities-v2.test.ts` é puro e prova:

- preflight das cinco assinaturas;
- revoke de todos os papéis de browser;
- grant mínimo;
- identidade, valor, cap e metadata server-side;
- idempotência;
- ausência de SQL destrutivo;
- `search_path` e default privilege;
- inexistência de RPC genérica no código de aplicação.

`tests/trusted-capabilities-rls.test.ts` é preparado para Supabase descartável e
cobre:

- chamadas genéricas adulteradas;
- outro usuário;
- concorrência/replay;
- uma única concessão legítima.

Esse teste não é executado sem as três variáveis do projeto descartável e sem a
migration aplicada nesse projeto. Produção nunca é um substituto.

## Rollout

1. capturar snapshot read-only de assinaturas, owners, ACLs e default privileges;
2. reconciliar qualquer divergência ou overload adicional;
3. aplicar a migration em projeto descartável restaurado de estrutura compatível;
4. executar a matriz RPC e concorrência;
5. confirmar que `apply_pet_care` é o único writer legítimo do estado/evento;
6. publicar migration antes do bundle que chama `award_my_care_xp`;
7. monitorar erros categóricos e diferença de concessões;
8. manter `award_xp` genérica fechada.

## Rollback e forward-fix

O rollback preferido é de aplicação: desativar temporariamente o toast/reivindicação
de XP de cuidado enquanto a capability é corrigida. Não se deve reabrir
`award_xp` ao browser. Se uma assinatura publicada divergir, a migration deve
falhar no preflight e receber forward-fix específico; nenhum saldo ou evento
legítimo é desfeito.

## Gates pendentes

- snapshot autenticado do Supabase publicado;
- ambiente descartável com migrations reconciliadas;
- confirmação de consumers externos de `pet_care_state`;
- funções adicionais de economia ainda precisam de inventário próprio;
- claim atômico de push continua em lote separado.
