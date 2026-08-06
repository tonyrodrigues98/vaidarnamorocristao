# Gates incrementais do Native Shell

## Princípio

A dívida global preexistente não é ocultada, mas também não autoriza dívida
nova. Todo arquivo de código tocado pelo Native Shell deve passar integralmente
por ESLint e Prettier.

Baseline global em T46-00.1:

- 12.688 erros `prettier/prettier` em 206 arquivos;
- 39 warnings;
- nenhum `no-empty`;
- 21 arquivos e 146 testes locais passando;
- cinco suítes Supabase dependentes de ambiente descartável.

## Scripts oficiais

| Script                                   | Contrato                                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:unit`                      | Executa as 21 suítes sem Supabase descartável; não usa secrets.                                                                              |
| `npm run test:supabase`                  | Executa somente `starter-bundle`, `moderation-rls`, `chat-e2e`, `realtime-messages` e `messages-rls`; sem credenciais, falha explicitamente. |
| `npm run test:all`                       | Executa unitários e, depois, as cinco suítes Supabase.                                                                                       |
| `npm run lint:changed -- <base>`         | Calcula merge-base, inclui arquivos rastreados e novos, filtra extensões ESLint e falha sem `--fix`.                                         |
| `npm run format:check:changed -- <base>` | Usa a mesma seleção Git e executa Prettier apenas em arquivos compatíveis, sem `--write`.                                                    |
| `npm run lint:global`                    | Mantém a dívida global visível com `eslint .`.                                                                                               |

Sem argumento, os scripts incrementais usam `NATIVE_SHELL_BASE_REF` ou `HEAD^`.
Em tarefas Codex, a base deve ser informada explicitamente para evitar
ambiguidade:

```text
npm run lint:changed -- <commit-base>
npm run format:check:changed -- <commit-base>
```

Arquivos gerados e diretórios ignorados não entram no gate:
`src/routeTree.gen.ts`, `node_modules`, `dist`, `.output`, `.vinxi`,
`.tanstack`, `.nitro`, `coverage` e equivalentes.

## CI existente

O workflow existente `.github/workflows/tests.yml` foi ampliado, sem pipeline
duplicado:

- job incremental em push para `integration/native-shell-v1`;
- job incremental em pull request com base `main`;
- checkout com histórico completo para `merge-base`;
- Node 22 e `npm ci`;
- build cliente/SSR;
- lint e Prettier somente nos arquivos alterados;
- 21 suítes locais;
- nenhuma suíte Supabase nesse job.

O job `rls-tests` continua separado, exige secrets de ambiente descartável e
agora chama somente `test:supabase`. Não há `continue-on-error`, bypass, deploy
ou mutation de Supabase no job incremental.

## Critérios para bloquear merge

Bloqueia merge do novo Native Shell:

- `npm ci` falhar;
- build falhar;
- qualquer arquivo alterado falhar em ESLint ou Prettier;
- qualquer um dos 146 testes locais regredir;
- teste novo depender silenciosamente de secrets;
- código de produto ser alterado fora do lote;
- suite Supabase ser apresentada como aprovada sem ambiente descartável.

O lint global permanece informativo até um lote mecânico dedicado. A contagem
não pode crescer por causa de arquivos tocados.

## Critérios para bloquear deploy

Além dos critérios de merge:

- suítes Supabase relevantes precisam passar em ambiente descartável;
- build implantável e smoke do adaptador de produção precisam passar;
- vulnerabilidade classificada como `BLOQUEIA DEPLOY` não pode permanecer;
- secrets no bundle, falha fatal SSR, autenticação sem gate ou 404 quebrado
  bloqueiam deploy.

A presente tarefa não faz deploy.

## Comandos mínimos por tarefa

```text
npm ci
npm run build
npm run test:unit
npm run lint:changed -- <commit-base>
npm run format:check:changed -- <commit-base>
git diff --check
```

Quando houver ambiente descartável autorizado:

```text
npm run test:supabase
```

`npm run lint:global` deve continuar periódico para detectar variação do
baseline, mas não substitui o gate incremental.
