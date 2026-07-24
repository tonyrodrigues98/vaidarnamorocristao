# V2-024 — Reconciliação e preparação de contração

## Resultado executivo

O lote implementa a prova técnica necessária para avaliar uma contração futura,
mas conclui objetivamente que o sistema **não está elegível**. Nenhum snapshot
autenticado do banco publicado foi capturado, nenhum restore foi ensaiado, o
legado não está desativado em produção, não existe janela comprovada de uso zero
e a compensação do avatar-personagem continua sem decisão.

Não foi preparado SQL destrutivo: sem verdade publicada e alvo confirmado, um
script de `DROP` seria especulativo e perigoso. O único SQL criado é um
inventário de metadados read-only, fora de `supabase/migrations`, marcado como
não executado.

## Arquitetura da prova

`src/v2/platform/reconciliation` oferece contratos puros:

- seis domínios de reconciliação;
- status `PASS`, `EXPECTED_DIFF`, `REVIEW` e `FAIL`;
- comparação de contagem, checksum semântico, órfãos e relacionamentos;
- readiness com doze evidências obrigatórias;
- checksum SHA-256 determinístico, ordenado e sem retornar conteúdo;
- simulação de compensação que nunca gera grants ou mutations.

Mesmo quando todas as evidências sintéticas passam, o contrato desta etapa
mantém `physicalDeletionAllowed: false`. Autorização física exige mudança
separada, revisão humana e aprovação explícita.

## Manifests sem PII

### `audit/reconciliation-manifest.json`

Registra fontes protegidas e invariantes semânticos para:

1. identidade e perfil;
2. Namoro, conversas e Propósito;
3. economia e inventário;
4. pets e jogos;
5. Storage;
6. avatar-personagem.

Não contém contagens reais, IDs de usuário, e-mail, telefone, mensagem,
conteúdo, path de objeto ou URL privada.

### `audit/contraction-readiness.json`

Registra:

- `eligible: false`;
- doze evidências ausentes;
- todos os domínios em `REVIEW`;
- zero alvo seguro para remoção;
- zero SQL destrutivo preparado/aplicado;
- zero compensação aplicada;
- decisões ainda exigidas.

## Inventário publicado — procedimento futuro

`audit/V2_024_READONLY_INVENTORY.sql` consulta apenas catálogos:

- tabelas e colunas;
- routines;
- policies;
- triggers;
- grants;
- publicação Realtime;
- configuração agregada dos buckets.

Procedimento obrigatório:

1. obter autorização e uma sessão autenticada read-only;
2. confirmar backup/PITR e responsável;
3. executar o inventário em janela aprovada;
4. salvar somente metadados, sem conteúdo ou secrets;
5. comparar código, tipos, migrations e estado publicado;
6. restaurar o backup em ambiente isolado e registrar evidência;
7. gerar snapshot agregado/redigido para cada domínio;
8. produzir checksums semânticos;
9. classificar toda diferença;
10. repetir depois da janela de uso zero.

O SQL não foi executado neste lote.

## Reconciliação por domínio

| Domínio                    | Prova além de contagem                                         | Bloqueio atual                          |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------- |
| identidade/perfil          | ID estável, 1:1, privacidade, ordem de fotos, verificação      | snapshot publicado ausente              |
| Namoro/mensagens/Propósito | participantes, contexto, autoria, ordem, leitura, histórico    | snapshot publicado ausente              |
| economia/inventário        | ledger versus saldo, ownership, equipamento, compra e presente | ledger publicado não reconciliado       |
| pets/jogos                 | owner, instância, tempo do servidor, progresso e claim         | estruturas publicadas não inventariadas |
| Storage                    | bucket, path, owner, hash, tamanho, MIME e referência          | inventário autenticado ausente          |
| avatar-personagem          | owners, item exclusivo, custo, equipamento e looks             | owners/custo/compensação ausentes       |

Contagens iguais nunca bastam. Órfãos ou relacionamentos inválidos são `FAIL`;
checksum ausente é `REVIEW`; diferença esperada só passa quando documentada e
aprovada, sem defeito de integridade.

## Compensação do avatar-personagem

O simulador aceita contagens agregadas, custo histórico e uma política escolhida,
mas retorna sempre `mode: dry-run`, `grantCount: 0` e
`mutationAllowed: false`.

Opções ainda abertas para Antonio:

- moedas;
- itens substitutos;
- modelo híbrido;
- nenhuma compensação, somente se justificada e aprovada.

Antes de qualquer grant futuro serão exigidos owner snapshot, razão econômica,
idempotency key, dry-run por lote, limite financeiro, auditoria, replay seguro e
forward-fix. Este lote não escolhe política nem concede valor.

## Evidências obrigatórias

1. snapshot de produção;
2. schema publicado reconciliado;
3. backup verificado;
4. restore ensaiado;
5. retirada lógica ativa;
6. janela de uso zero observada;
7. paridade confirmada;
8. owners reconciliados;
9. retenção satisfeita;
10. readers removidos;
11. writers removidos;
12. aprovação destrutiva explícita.

Qualquer ausência bloqueia. `REVIEW` ou `FAIL` em qualquer domínio bloqueia.

## SQL destrutivo futuro

Somente depois das evidências acima poderá existir arquivo separado com
`NOT_APPLIED` no nome, alvo exato, preconditions fail-closed, ordem de FKs,
locks, timeout, validação, forward-fix e aprovador. Ele nunca poderá entrar no
pipeline automático nem compartilhar commit com uma expansão.

## Testes

Os testes cobrem checksum estável e sensível ao significado, contagem
insuficiente, diferenças aprovadas, órfãos, evidência ausente, readiness
sintética, compensação dry-run, integridade dos manifests e SQL estritamente
read-only. Não há conexão, credencial ou chamada ao Supabase.

## Rollback

O lote adiciona contratos, testes, documentos e artefatos. O rollback é reverter
o commit. Não há estado remoto, tabela, dado, grant ou compensação a desfazer.

## Próximo passo

A V2-025 pode consolidar gates e preparar o release, mas deve carregar estes
bloqueios como não dispensáveis. Release de frontend não autoriza migrations nem
contração.
