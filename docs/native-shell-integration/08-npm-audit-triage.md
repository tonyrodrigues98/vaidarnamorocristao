# Triagem do `npm audit`

## Evidência

Comando executado em 28 de julho de 2026:

```text
npm audit --json
```

Resultado: 9 vulnerabilidades, sendo 4 baixas, 5 altas e nenhuma crítica.
Nenhum `npm audit fix`, atualização ou override foi aplicado.

## Vulnerabilidades altas

### `brace-expansion`

| Campo                    | Avaliação                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Direta/transitiva        | Transitiva                                                                                                                        |
| Produção/desenvolvimento | Tooling de desenvolvimento                                                                                                        |
| Caminho                  | `eslint > minimatch > brace-expansion` e `typescript-eslint > @typescript-eslint/typescript-estree > minimatch > brace-expansion` |
| Recurso afetado          | Expansão de padrões durante lint/tooling                                                                                          |
| Exploração no projeto    | Exige padrões maliciosos chegando ao processo de tooling; não integra o bundle browser nem recebe entrada de usuário em produção. |
| Correção disponível      | Sim, atualização transitiva.                                                                                                      |
| Breaking change          | Não indicado pelo audit, mas exige novo lockfile e repetição dos gates.                                                           |
| Decisão                  | **PODE SER CORRIGIDA EM TAREFA ISOLADA**                                                                                          |

Não bloqueia a implementação nem o deploy do artefato atual. Bloqueia o uso do
tooling sobre padrões não confiáveis até a atualização.

### `js-yaml`

| Campo                    | Avaliação                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Direta/transitiva        | Transitiva                                                                                                             |
| Produção/desenvolvimento | Tooling/build                                                                                                          |
| Caminho                  | `eslint > @eslint/eslintrc > js-yaml` e `@tanstack/react-start > @tanstack/start-plugin-core > xmlbuilder2 > js-yaml`  |
| Recurso afetado          | Parsing de YAML/configuração em ferramentas de build e lint                                                            |
| Exploração no projeto    | As entradas observadas são arquivos versionados e confiáveis; não há parsing de YAML fornecido por usuário no runtime. |
| Correção disponível      | Sim.                                                                                                                   |
| Breaking change          | Não indicado pelo audit; a cadeia TanStack precisa de compatibilidade validada.                                        |
| Decisão                  | **PODE SER CORRIGIDA EM TAREFA ISOLADA**                                                                               |

Não bloqueia a implementação nem o deploy atual. Passa a bloquear se arquivos
YAML não confiáveis forem aceitos pelo build ou runtime.

### `node-fetch`

| Campo                    | Avaliação                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Direta/transitiva        | Transitiva de uma dependência direta                                                                                                                                                                   |
| Produção/desenvolvimento | Dependência de produção                                                                                                                                                                                |
| Caminho                  | `face-api.js > @tensorflow/tfjs-core > node-fetch`                                                                                                                                                     |
| Recurso afetado          | Fallback Node do TensorFlow/face-api; advisory envolve encaminhamento de headers após redirect                                                                                                         |
| Exploração no projeto    | `face-api.js` é importado dinamicamente por `src/lib/faceDetection.ts` para detecção no navegador. Não há import direto de `node-fetch` no código e o fluxo browser não usa o fallback Node observado. |
| Correção disponível      | O audit sugere `face-api.js@0.20.0`.                                                                                                                                                                   |
| Breaking change          | Sim segundo o audit; é downgrade fora da faixa declarada e exige reteste de detecção facial.                                                                                                           |
| Decisão                  | **ACEITA TEMPORARIAMENTE COM JUSTIFICATIVA**                                                                                                                                                           |

Não bloqueia a implementação ou o deploy deste lote porque o caminho vulnerável
não foi identificado no runtime browser. A aceitação termina se face-api passar
a executar server-side ou se headers sensíveis forem enviados por esse caminho.

### `postcss`

| Campo                    | Avaliação                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Direta/transitiva        | Transitiva                                                                                  |
| Produção/desenvolvimento | Build                                                                                       |
| Caminho                  | `vite > postcss`                                                                            |
| Recurso afetado          | Parsing/stringify de CSS e source maps durante build                                        |
| Exploração no projeto    | O build processa CSS versionado; uploads e conteúdo de usuário não são compilados como CSS. |
| Correção disponível      | Sim.                                                                                        |
| Breaking change          | Não indicado pelo audit; requer atualização controlada do grafo Vite.                       |
| Decisão                  | **PODE SER CORRIGIDA EM TAREFA ISOLADA**                                                    |

Não bloqueia o artefato atual. Bloqueia qualquer pipeline que compile CSS ou
source maps fornecidos por origem não confiável.

### `vite`

| Campo                    | Avaliação                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Direta/transitiva        | Direta                                                                                                                            |
| Produção/desenvolvimento | Desenvolvimento/build                                                                                                             |
| Caminho                  | `vite` direto, também compartilhado por plugins Cloudflare, Lovable, Tailwind e TanStack                                          |
| Recurso afetado          | Servidor de desenvolvimento no Windows: UNC/NTLM e bypass de `server.fs.deny`                                                     |
| Exploração no projeto    | Afeta servidor de desenvolvimento exposto a requisições não confiáveis; não é código executado no servidor de produção compilado. |
| Correção disponível      | Sim, versão corrigida acima das faixas reportadas.                                                                                |
| Breaking change          | Não indicado, mas o ecossistema de plugins exige validação conjunta.                                                              |
| Decisão                  | **PODE SER CORRIGIDA EM TAREFA ISOLADA**                                                                                          |

Não executar o dev server em interface pública ou rede não confiável até a
correção. O advisory não bloqueia o deploy do bundle, mas exige tarefa curta de
atualização e repetição de build/smoke.

## Vulnerabilidades baixas

| Pacote                  | Cadeia/uso                                                | Decisão                                               |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| `@babel/core`           | Tooling de transformação                                  | Corrigir em atualização isolada do grafo.             |
| `@tensorflow/tfjs-core` | Transitiva de `face-api.js`                               | Aceita junto à decisão documentada para `node-fetch`. |
| `esbuild`               | Transitiva de Vite/tsx, dev server Windows                | Corrigir junto de Vite; não expor dev server.         |
| `face-api.js`           | Direta; agrega a vulnerabilidade transitiva de TensorFlow | Retestar antes de qualquer troca/downgrade.           |

## Gates resultantes

- **Bloqueia implementação:** nenhuma vulnerabilidade na utilização atual.
- **Bloqueia deploy:** nenhuma na utilização comprovada atual.
- Uma mudança que exponha Vite, CSS/YAML ou padrões de glob a entrada não
  confiável invalida esta triagem.
- Uma mudança que leve `face-api.js` ao servidor invalida a aceitação temporária.
- Atualizações devem ocorrer em tarefa isolada, sem `npm audit fix` automático.
