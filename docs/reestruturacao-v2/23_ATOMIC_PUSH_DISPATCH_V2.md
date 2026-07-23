# V2-008 — claim atômico da fila push

## Objetivo

Impedir que duas execuções autorizadas do scheduler processem simultaneamente a
mesma linha de `push_queue`. O lote preserva a autenticação do endpoint e o envio
existentes, adicionando lease, token de claim, retry exponencial, TTL e conclusão
condicional.

Nenhuma migration foi aplicada e nenhum Job, scheduler, secret, Vault ou ambiente
foi alterado.

## Contrato

### Claim

`claim_push_dispatch_batch(_batch_limit, _lease_seconds)`:

- é `SECURITY DEFINER` com `search_path = pg_catalog, public`;
- aceita somente lotes de 1 a 100 e leases de 15 a 600 segundos;
- torna expiradas ou esgotadas as linhas terminais antes do claim;
- filtra `processed_at`, `dead_lettered_at`, TTL, tentativas e backoff;
- usa `FOR UPDATE SKIP LOCKED`;
- atualiza claim, lease e tentativa na mesma instrução;
- retorna um token aleatório por item;
- é executável somente por `service_role`.

### Conclusão

`complete_push_dispatch_item(_queue_id, _lease_token, _outcome, _error_code)`:

- altera somente o claim ativo cujo ID e token coincidem;
- aceita `success`, `retry` ou `dead`;
- agenda retry exponencial entre 30 segundos e uma hora;
- encerra após cinco tentativas;
- armazena apenas código categórico sanitizado;
- limpa lease e token;
- retorna `false` para conclusão atrasada ou token obsoleto;
- é executável somente por `service_role`.

O modelo continua sendo **at-least-once**. Uma queda depois da entrega ao provedor
e antes da conclusão pode repetir a notificação após expirar o lease. Resolver
exactly-once depende de idempotência aceita pelo provedor/cliente e não deve ser
simulada pelo banco.

## Alteração aditiva

A migration `20260723000002_v2_atomic_push_dispatch.sql` adiciona:

- `claim_token`;
- `claimed_at`;
- `next_attempt_at`;
- `expires_at`;
- `dead_lettered_at`;
- `last_error_code`;
- índices parciais de despacho e lease;
- duas RPCs server-only.

Não apaga, renomeia ou reescreve payloads. `last_error` é preservado por
compatibilidade, mas passa a receber somente o mesmo código categórico de
`last_error_code`.

Os tipos gerados não foram alterados: migrations não representam o Supabase
publicado. A regeneração só pode ocorrer depois de uma aplicação autorizada em
ambiente descartável e posterior reconciliação.

## Adapter

`pushDispatchBatchCore.server.ts` contém o fluxo determinístico e injetável:

1. reivindica até 50 itens;
2. carrega subscriptions dos destinatários reivindicados;
3. envia para todas as subscriptions do usuário;
4. conclui sucesso quando houve entrega, não há subscription ou todas expiraram;
5. conclui retry com erro categórico em falha;
6. remove endpoints 404/410 depois da conclusão dos itens.

`pushDispatchBatch.server.ts` é o adapter Supabase server-only. O endpoint continua
importando esse módulo somente depois de validar método, kill switch e bearer.

O sender deixou de registrar endpoint, resposta do provedor, exceção ou stack. O
handler HTTP existente mantém o único log agregado: contagens, duração, status e
request ID sem PII.

## Testes

- `push-dispatch-atomic-v2.test.ts`: SQL estático, ACL, lease, backoff, TTL,
  comportamento do core, subscriptions inválidas e ausência de logs sensíveis.
- `push-dispatch-atomic-rls.test.ts`: matriz de grants, concorrência real,
  token obsoleto e conclusão; preparado para Supabase descartável e não executado.
- `push-dispatch-auth.test.ts`: autenticação, método, segredo, kill switch e
  ausência de efeitos antes da autorização.

## Rollout obrigatório

1. capturar snapshot read-only do schema publicado e confirmar a tabela;
2. criar backup e validar rollback;
3. aplicar a migration em Supabase descartável;
4. executar concorrência, grants e retry no ambiente descartável;
5. medir fila atual, idade, tentativas e volume sem ler conteúdo;
6. aplicar a migration aditiva antes de publicar o adapter novo;
7. manter `PUSH_DISPATCH_ENABLED=false` durante a janela de troca;
8. publicar o adapter e reativar o Job sem mudar nome, URL ou frequência;
9. confirmar HTTP 200 e métricas agregadas;
10. observar leases expirados, retries, dead letters e duplicações.

Publicar o adapter antes da migration fecha o endpoint com erro 500 e interrompe o
processamento. Aplicar a migration antes do adapter é compatível com o código
antigo, mas ainda não elimina a corrida até a troca.

## Rollback

1. usar o kill switch;
2. restaurar o bundle anterior;
3. manter colunas e RPCs aditivas no banco;
4. limpar somente leases expirados por procedimento revisado;
5. reativar o bundle anterior;
6. investigar sem apagar linhas ou desfazer entregas legítimas.

Não remover colunas ou funções no rollback imediato. Contração exige janela
posterior, comprovação de ausência de consumidores e backup testado.

## Gates restantes

- schema, owners, ACLs, volume e Job publicados ainda não foram capturados;
- a migration não foi compilada em Supabase descartável;
- o teste RLS/concorrência não foi executado;
- não há métrica operacional publicada para dead letters;
- duplicação após crash entre envio e conclusão continua possível pelo contrato
  at-least-once.
