# Runbook de rollout controlado da V2

## Regra de entrada

Este runbook prepara o rollout, mas não o executa. Iniciar somente depois de:

- todos os Draft PRs revisados e integrados na ordem;
- CI do commit candidato concluído;
- migrations ensaiadas em ambiente descartável;
- snapshot, backup e restore comprovados;
- gates externos de `45_RELEASE_READINESS.md` em `PASS`;
- autorização nominal para a janela.

Não configurar secrets, aplicar migrations ou ativar flags durante a revisão do
PR de readiness.

## Papéis

| Papel                  | Responsabilidade                                     |
| ---------------------- | ---------------------------------------------------- |
| release lead           | commit candidato, go/no-go, cronologia e comunicação |
| engenharia frontend    | bundle, rotas, PWA, flags e rollback visual          |
| engenharia backend/DBA | schema, RLS/RPC, backups, locks e reconciliação      |
| segurança              | secrets, capabilities, logs e testes negativos       |
| QA/design              | E2E, dispositivos, acessibilidade e regressão visual |
| produto/Antonio        | coortes, compensação, jogos e critérios de paridade  |
| suporte/moderação      | filas, incidentes, respostas e evidências            |
| jurídico/editorial     | Cinema, mídia, Verbo e retenção                      |

## Fase 0 — candidato imutável

1. registrar SHA candidato e SHA publicado;
2. confirmar working tree e lockfile;
3. congelar mudanças paralelas;
4. executar todos os gates locais;
5. gerar SBOM/inventário de assets se a infraestrutura suportar;
6. confirmar que o bundle público não contém credencial;
7. registrar todos os blockers conhecidos.

Qualquer alteração cria novo candidato e reinicia os gates.

## Fase 1 — Supabase descartável

1. restaurar somente dados sintéticos ou cópia autorizada e anonimizada;
2. aplicar as 16 migrations na ordem versionada;
3. medir duração, locks e tamanho;
4. testar interrupção/reexecução;
5. executar RLS/RPC positivos e negativos por papel;
6. testar Realtime, concorrência e idempotência;
7. executar reconciliação e checksums;
8. ensaiar rollback/forward-fix;
9. descartar o ambiente conforme a política.

Nenhum teste pode apontar para produção.

## Fase 2 — verdade publicada e restore

1. executar somente o inventário read-only aprovado;
2. comparar schema, tipos, migrations, buckets, RLS, RPCs e jobs;
3. confirmar backup/PITR;
4. restaurar em ambiente isolado;
5. verificar Auth, Storage e relações;
6. assinar o relatório de restore;
7. interromper se houver divergência não explicada.

## Fase 3 — ambiente interno

1. publicar o mesmo commit candidato em ambiente isolado;
2. manter flags V2 fechadas;
3. executar smoke do legado;
4. habilitar App Shell para contas sintéticas;
5. habilitar um domínio por vez;
6. validar logs, métricas e kill switches;
7. executar acessibilidade, PWA e dispositivos reais.

Ordem recomendada: Conta → onboarding → Início → Comunidade → Conversas →
Perfil → Namoro → Propósito → Economia → Pets → Conteúdo → Cinema → Confiança
→ Admin.

## Fase 4 — coortes

Progressão recomendada, nunca automática:

1. staff designado;
2. coorte pequena explicitamente escolhida;
3. 1%;
4. 5%;
5. 20%;
6. 50%;
7. 100%;
8. janela de estabilidade;
9. default V2;
10. retirada lógica posterior.

Cada avanço exige nova decisão registrada.

## Critérios para avançar

- zero incidente de segurança;
- zero perda, duplicação ou associação cruzada;
- zero divergência financeira não explicada;
- Auth, erro e latência dentro dos SLOs aprovados;
- RLS/RPC e Realtime sem regressão;
- jobs, push, cache e PWA estáveis;
- suporte sem padrão novo crítico;
- reconciliação sem backlog crescente;
- rollback testado no mesmo candidato.

## Critérios para pausar

- SLO não cumprido;
- telemetria incompleta;
- aumento de erro sem causa;
- fila ou reconciliação crescendo;
- problema de acessibilidade ou dispositivo relevante;
- owner operacional indisponível;
- decisão de produto/jurídico pendente na coorte.

Pausa mantém a coorte e não tenta corrigir produção às cegas.

## Critérios para rollback

- acesso indevido ou vazamento;
- saldo, ownership, mensagem, match, propósito, pet ou reward incorreto;
- bloqueio/RLS contornado;
- Auth indisponível ou loop;
- migration incompleta sem forward-fix seguro;
- Job push em 401/503 ou duplicado;
- cache impede recuperar versão válida;
- ausência de observabilidade para diagnosticar.

## Rollback

1. parar expansão de coorte;
2. desabilitar a flag do domínio;
3. preservar novas estruturas e operações legítimas;
4. restaurar o bundle anterior quando necessário;
5. não reverter saldo/histórico por restauração cega;
6. pausar backfill/sincronização;
7. reconciliar operações posteriores ao corte;
8. aplicar forward-fix revisado quando rollback de dados não for seguro;
9. comunicar escopo, impacto e próxima decisão.

Contração física não faz parte deste rollout.

## Push dispatch

Preservar:

- job único `push-dispatch-every-minute`;
- agenda `* * * * *`;
- método POST;
- Bearer exclusivo via Vault;
- `PUSH_DISPATCH_ENABLED=true` quando operacionalmente autorizado;
- `PUSH_DISPATCH_SECRET` server-only;
- resposta HTTP real, lease, retry e dead letter.

Não revelar valores, recriar Job ou usar anon/publishable/service role como
Bearer.

## Secrets exigidos por nome

Documentar existência, nunca valor:

- `PUSH_DISPATCH_SECRET`;
- `PUSH_DISPATCH_ENABLED`;
- variáveis server-only Supabase já existentes;
- VAPID server-only quando aplicável;
- secrets de provedores externos aprovados.

Nenhum secret pode usar prefixo `VITE_`.

## Smoke pós-publicação

- domínio e assets;
- login/logout/sessão/recuperação;
- `/inicio`, `/v2` e deep links;
- perfil, fotos, feed, comunidade e conversas;
- Namoro on/off, matches e Propósito;
- moedas, ledger, inventário e presentes;
- pets, jogos e progresso;
- notificações e push HTTP 200;
- Admin por papel;
- PWA install/update/offline;
- safe areas, teclado e inputs mobile;
- console/logs sem erro crítico;
- dados anteriores íntegros.

## Encerramento

Registrar commit publicado, resultados, incidentes, coorte, decisão e próximo
checkpoint. Não remover flags, prefixo `/v2`, rotas ou schema durante a primeira
janela de estabilidade.
