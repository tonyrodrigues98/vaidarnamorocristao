# Falhas conhecidas do baseline

Esta lista registra o resultado bruto dos comandos obrigatórios no commit-base.
O bloco histórico abaixo permanece como evidência da captura T46-00. A
estabilização T46-00.1 corrigiu somente o lockfile, a política de fim de linha e
o `no-empty`, sem alterar comportamento.

## Estado após T46-00.1

| Validação       | Resultado atual                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`        | **Passou** em instalação limpa: 524 pacotes instalados.                                                                            |
| `npm run build` | **Passou**: cliente e SSR, 4.603 módulos transformados.                                                                            |
| `npm run lint`  | **Bloqueio preexistente não trivial**: 12.688 erros `prettier/prettier` em 206 arquivos e 39 warnings. O `no-empty` foi eliminado. |
| `npm test`      | 21 arquivos e 146 testes passaram; as mesmas cinco suítes Supabase falharam antes da coleta por ausência do ambiente descartável.  |

Adicionar `"endOfLine": "auto"` reduziu o lint de 105.557 para 12.688 erros,
mas provou que o restante não era apenas CRLF: existem divergências reais de
formatação em 206 arquivos. A tarefa proíbe formatação massiva, então esse
conjunto permanece como um único bloqueio sistêmico documentado, sem
desabilitar regras ou mascarar resultados.

O npm também reportou nove vulnerabilidades de dependências (quatro baixas e
cinco altas). Nenhum `npm audit fix` foi executado.

## Baseline histórico: `npm ci`

**Status: falhou antes da instalação.**

O npm retornou `EUSAGE` porque `package.json` e `package-lock.json` não estão
sincronizados. Exemplos relatados pelo próprio npm:

- `@cloudflare/vite-plugin`: lock `1.32.2`, requisito `1.48.0`
- `@lovable.dev/vite-tanstack-config`: lock `2.3.1`, requisito `2.7.7`
- `@supabase/supabase-js`: lock `2.105.3`, requisito `2.111.0`
- `@tailwindcss/vite`: lock `4.2.2`, requisito `4.3.3`
- `@tanstack/react-router`: lock `1.168.21`, requisito `1.170.18`
- ausências como `@noble/curves@2.2.0` e `web-push-neo@0.1.2`

O lockfile não foi regenerado. As dependências preexistentes do checkout
permitiram executar os comandos seguintes.

## Baseline histórico: `npm run build`

**Status: passou.**

- Vite `7.3.2`
- 4.606 módulos transformados
- build cliente e SSR gerados
- warnings preexistentes de diretivas `"use client"` ignoradas em dependências
- warning Nitro/Cloudflare de que `main` do Wrangler é sobrescrito/ignorado

O gerador atualizou temporariamente `src/routeTree.gen.ts`; o arquivo foi
restaurado ao blob do commit-base e não integra o diff.

## Baseline histórico: `npm run lint`

**Status: falhou.**

Resultado detalhado equivalente com saída JSON do ESLint:

- 466 arquivos com diagnósticos
- 105.557 erros
- 39 avisos
- 105.556 erros `prettier/prettier`, predominantemente diferenças de CRLF
- 1 erro não-Prettier:
  `src/lib/missions.ts:25:11` — `no-empty` (`Empty block statement`)

Os avisos incluem principalmente:

- `react-hooks/exhaustive-deps`
- `react-refresh/only-export-components`
- diretivas ESLint não utilizadas

O baseline global de formatação e os avisos não foram modificados.

## Baseline histórico: `npm test`

**Status: falhou no total; testes independentes passaram.**

Resumo:

- 26 arquivos detectados
- 21 arquivos passaram
- 5 arquivos falharam durante import/configuração
- 146 testes passaram
- 0 testes funcionais foram coletados nas cinco suítes dependentes do ambiente

Suítes sem configuração Supabase:

1. `tests/starter-bundle.test.ts`
2. `tests/moderation-rls.test.ts`
3. `tests/chat-e2e.test.ts`
4. `tests/realtime-messages.test.ts`
5. `tests/messages-rls.test.ts`

Causa: ausência de `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e/ou
`SUPABASE_SERVICE_ROLE_KEY`, conforme a suíte. Nenhum valor foi configurado e
nenhum Supabase foi acessado.

## Pendências após a estabilização

- O lint global ainda não possui baseline verde: 12.688 divergências reais de
  Prettier não podem ser corrigidas sem um lote mecânico separado.
- Cinco suítes exigem Supabase descartável configurado.
- Warnings do build dependem de configuração/dependências preexistentes.
- Nove vulnerabilidades do grafo npm exigem triagem separada.

O lockfile reproduzível, o build e o único `no-empty` foram resolvidos dentro do
escopo. As pendências restantes continuam explícitas e não foram ocultadas.
