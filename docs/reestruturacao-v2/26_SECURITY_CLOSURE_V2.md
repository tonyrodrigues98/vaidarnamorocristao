# V2-008 — fechamento da baseline de segurança

## Decisão

A V2-008 está concluída no limite autorizado do repositório. Isso significa que
todo P0/P1 possui estado, evidência, teste ou teste preparado, gate publicado e
rollback/forward-fix. Não significa que o Supabase ou o domínio publicado foram
inspecionados, migrados ou declarados seguros.

Nenhum acesso ao Supabase publicado ou descartável ocorreu. Nenhuma migration foi
executada.

## Estado dos achados

O manifest canônico contém exatamente 20 achados:

| Prioridade | Estado                             | Total |
| ---------- | ---------------------------------- | ----: |
| P0         | `locally_contained`                |     1 |
| P0         | `production_verification_required` |     5 |
| P1         | `locally_contained`                |     4 |
| P1         | `locally_mitigated`                |     3 |
| P1         | `production_verification_required` |     3 |
| P2         | `confirmed_in_head`                |     2 |
| P2         | `locally_mitigated`                |     1 |
| P3         | `locally_mitigated`                |     1 |

Não existe P0/P1 em `confirmed_in_head` sem contenção ou gate explícito.

## Entregas locais

### HTTP, IA e conteúdo

- push dispatch autenticado e fechado por flag;
- moderação de fotos limitada por instância, com tamanho/MIME/magic bytes,
  timeout e falha fechada;
- logs categóricos sem token, imagem, usuário ou resposta do provedor;
- `.env` rastreado removido e exemplo público vazio;
- HTML do blog sanitizado;
- URLs e iframes limitados por protocolo/origem;
- headers defensivos, CSP intermediária e CSRF de server functions.

### Capabilities e fila

- cinco RPCs genéricas críticas recebem revogação explícita em migration local;
- capability estreita de XP de cuidado deriva identidade, valor, cap e metadata
  no servidor;
- fila push usa claim transacional, lease, token, retry exponencial, TTL e dead
  letter em migration local;
- adapters server-only não registram endpoint, subscription, provider body ou
  stack.

### Operação administrativa

- reparo de fotos fechado por `PHOTO_REPAIR_ENABLED`;
- Origin, confirmação, dry-run, UUID, limite, JPEG e path validados;
- staging não sobrescreve objeto existente;
- auditoria append-only preparada por migration aditiva.

## Migrations preparadas e não aplicadas

1. `20260723000001_v2_trusted_reward_capabilities.sql`;
2. `20260723000002_v2_atomic_push_dispatch.sql`;
3. `20260723000003_v2_photo_repair_audit.sql`.

As migrations pertencem a rollouts diferentes. Não devem ser agrupadas em uma
execução cega. Cada uma exige ambiente descartável, preflight, snapshot,
telemetria e rollback/forward-fix próprios.

## Gates que dependem da verdade publicada

### Banco

- assinaturas, overloads, owners, `prosecdef`, `search_path`, ACLs e default
  privileges;
- policies reais por papel;
- membership de `supabase_realtime`;
- schema atual da fila;
- tabela de auditoria e seus grants depois de aplicação autorizada.

### Storage e privacidade

- visibilidade real de `profile-photos`;
- policies e grants de buckets;
- inventário sem PII de URLs persistidas;
- compatibilidade de delivery público/assinado e cache.

### Runtime

- scheduler push único, POST e bearer preservados;
- headers/CSP efetivos no domínio;
- rate limits distribuídos de moderação e reparo;
- suporte de Origin atrás do proxy;
- retenção, alertas e consulta das trilhas.

## Ordem operacional recomendada

1. provisionar Supabase descartável isolado;
2. executar testes RPC/RLS/concorrência preparados;
3. capturar snapshot read-only do projeto correto, sem PII;
4. reconciliar snapshot, tipos e migrations;
5. revisar cada migration separadamente;
6. aplicar primeiro expansão/grants de menor blast radius;
7. manter flags fechadas durante schema rollout;
8. validar dry-run, telemetria e rollback;
9. habilitar uma capability por vez;
10. executar smoke e reconciliação antes do próximo gate.

## Critérios que impedem rollout

- snapshot ausente ou de projeto não confirmado;
- teste descartável falhando;
- overload/ACL não compreendido;
- Job push incompatível com o novo claim;
- fila sem caminho de liberação de leases;
- bucket/URLs sem plano de dupla leitura;
- auditoria não gravável antes da operação;
- rate limit de edge ausente para expansão de tráfego;
- rollback que apaga operação legítima.

## Evidência de validação

A suíte segura inclui todos os testes V2, segurança, autenticação e
push-dispatch que não exigem banco. Testes `*-rls`, chat, moderação,
Realtime e starter bundle permanecem excluídos por dependerem de Supabase
descartável.

O bundle público é inspecionado por nomes privilegiados. Identificadores de SDK
como `access_token` e `refresh_token` não são classificados como credencial sem
valor embutido; nenhuma credencial é reproduzida nos artefatos.

## Rollback

- flags server-only fecham push/reparo sem apagar dados;
- capabilities usam forward-fix e nunca revertem saldo/XP legítimo;
- leases expirados são liberados, nunca apagados cegamente;
- conteúdo seguro não volta a sinks diretos;
- eventos de auditoria são preservados;
- mudança de Storage usa dupla leitura, nunca privatização abrupta.

## Próximo lote

O próximo lote é V2-009 — Perfis Modulares e Identidade Pública. Ele deve consumir
as fronteiras seguras existentes e não depende de aplicar as migrations da
V2-008 para construir contratos e UI locais. Integrações de dados reais continuam
atrás de flags e adapters.
