# Rehearsal das 16 migrations V2

## Inventário confirmado

O repositório contém **213 migrations**, não 16. As primeiras 196 são o
histórico/baseline; existe 1 migration auxiliar, aditiva e anterior ao lote V2,
que materializa `relationship_commitments` somente quando a relação publicada
não existe em uma instalação limpa; e as 16 abaixo são o lote V2, ordenado de
`20260723000001` a `20260723000016`. O inventário reproduzível com contagens e
SHA-256 de cada fonte é gerado por
`scripts/release-validation/analyze-migrations.mjs`.

| Ordem | Migration                   | Objetivo                               | Dependências principais       | Risco   | Destrutiva na aplicação | Reversível                | Status                 |
| ----: | --------------------------- | -------------------------------------- | ----------------------------- | ------- | ----------------------- | ------------------------- | ---------------------- |
|     1 | trusted reward capabilities | fechar helpers genéricos de recompensa | RPCs legadas, pets, XP        | alto    | não                     | roll-forward/grants       | aprovada               |
|     2 | atomic push dispatch        | claim, lease, retry e dead letter      | push_queue, pgcrypto          | alto    | não                     | kill switch/forward-fix   | aprovada               |
|     3 | photo repair audit          | auditoria append-only                  | perfis e fotos                | médio   | não                     | desativar fluxo           | aprovada               |
|     4 | onboarding/dating opt-in    | separar comunidade e Namoro            | profiles/preferences/blocks   | alto    | não                     | flags/adapters            | aprovada               |
|     5 | social home/status          | vínculos, feed e Status                | profiles/blocks/Storage       | alto    | não                     | flags                     | aprovada               |
|     6 | community spaces/events     | espaços, membros e eventos             | profiles/blocks/chat          | alto    | não                     | flags                     | aprovada               |
|     7 | conversation core           | threads, mensagens e idempotência      | matches/messages/blocks       | alto    | não                     | adapter legado            | aprovada com ressalva¹ |
|     8 | modular profiles            | módulos e projeção pública             | fotos/inventários/pets        | alto    | não                     | perfil legado             | aprovada               |
|     9 | optional dating             | descoberta romântica opt-in            | membership/interests/matches  | alto    | não                     | rotas legadas             | aprovada               |
|    10 | purpose/anonymous/gifts     | contexto romântico e presentes         | matches/recados/gifts         | alto    | não                     | flags/histórico           | aprovada               |
|    11 | economy authority           | saldo, ledger, loja e inventário       | user_coins/transactions/items | crítico | não                     | kill switch/reconciliação | aprovada               |
|    12 | pets care authority         | cuidado/recompensa confiável           | ambos user_pets/economia      | alto    | não                     | runtime legado            | aprovada               |
|    13 | Christian content/Verbo     | fontes, notas e estudos                | profiles/conteúdo             | médio   | não                     | flag                      | aprovada               |
|    14 | Cinema                      | mídia, sessões e sincronização         | profiles/blocks/conversas     | alto    | não                     | kill switch               | aprovada               |
|    15 | notifications/trust/support | eventos, preferências e casos          | notifications/push/reports    | alto    | não                     | fila/flags                | aprovada               |
|    16 | admin metrics               | comandos e métricas sem PII            | roles/auditoria/domínios      | alto    | não                     | admin legado              | aprovada               |

¹ A migration 7 aplicou e preservou dados; a ressalva é operacional: o teste
externo do canal Realtime associado a mensagens não recebeu o evento.

“Não destrutiva na aplicação” significa ausência de `DROP TABLE`,
`DROP COLUMN` e `TRUNCATE` no SQL executado pela migration. Existem três
`DELETE FROM` dentro de funções de negócio nas migrations 5 e 13; eles são
ações de usuário/cleanup em runtime, não exclusões executadas ao aplicar o
arquivo. Isso ainda exige teste de autorização.

## Evidência produzida

- `migration-execution.csv`: as 16 migrations passaram, com duração individual;
- `migration-repeat.csv`: 3 repetíveis e 13 não repetíveis;
- snapshots JSON antes/depois;
- logs sanitizados por migration;
- schema/RLS/policies/functions/triggers/buckets/Realtime;
- falha transacional e recuperação;
- backup restaurado e snapshot semântico byte a byte idêntico.

O run `30119994966` registrou 34 s para a instalação limpa e 32 s para o upgrade
representativo. A falha forçada dentro da transação reverteu integralmente e a
migration 3 foi reaplicada com sucesso. O artefato do run preserva o CSV
individual por 14 dias; o resumo e o digest estão em
`evidence/disposable-run-30119994966.json`.

## Critérios

- **aprovada:** aplica em clean e upgrade, preserva snapshot e passa segurança;
- **aprovada com ressalva:** aplica, mas repetição/lock/tempo exige runbook;
- **bloqueada:** falha ou viola integridade;
- **não executada:** infraestrutura indisponível.

Nenhuma migration será editada silenciosamente por este rehearsal. Se uma já
compartilhada falhar, a correção deve ser uma migration posterior.

### Correções de bootstrap comprovadas

O ensaio limpo expôs três lacunas do histórico versionado:

1. uma policy de presença era recriada sem `DROP POLICY IF EXISTS`;
2. migrations do Arcade chamavam `digest` sem o schema `extensions`;
3. `relationship_commitments` existe no contrato publicado/tipos gerados, mas
   nunca foi criada pelo histórico versionado;
4. a migration 14 combinava uma variável `%ROWTYPE` e um escalar no mesmo
   `SELECT INTO`, sintaxe recusada pelo PostgreSQL;
5. o bootstrap limpo não reproduzia os grants server-side de `service_role`
   existentes no projeto publicado, impedindo a preparação isolada de fixtures.

As duas primeiras foram corrigidas na origem histórica para que um banco vazio
possa reproduzir o mesmo estado; a terceira recebeu a migration auxiliar
`20260722999999_release_validation_bootstrap_compatibility.sql`. Ela usa
`to_regclass` e não altera ambientes onde a tabela já existe. Nenhuma dessas
correções foi aplicada em produção.

O reparo auxiliar concede privilégios somente a `service_role`, nunca a
`anon`, e apenas no ramo de instalação limpa. Para `authenticated`, repõe
somente `SELECT` em `profiles`; a visibilidade continua limitada pelas policies
RLS. Isso permite ao harness server-side preparar e remover dados sintéticos
sem conceder escrita direta adicional a clientes.

Os usuários sintéticos agora registram a versão vigente dos Termos, assim como
o cadastro real. Isso evita interpretar uma rejeição legítima por ausência de
consentimento como falha da função de mensagens.

A migration 14 foi corrigida antes de qualquer aplicação produtiva, separando o
lock/leitura da sessão da leitura da duração da mídia. O comportamento da
função permanece o mesmo e o cenário limpo é sempre reiniciado do zero após
cada correção.
