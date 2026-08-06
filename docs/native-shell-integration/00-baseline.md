# Baseline imutável da integração Native Shell V1

## Identificação

| Item                    | Valor                                                        |
| ----------------------- | ------------------------------------------------------------ |
| Repositório             | `tonyrodrigues98/vaidarnamorocristao`                        |
| Remoto                  | `https://github.com/tonyrodrigues98/vaidarnamorocristao.git` |
| Branch de trabalho      | `integration/native-shell-v1`                                |
| Branch remota padrão    | `main`                                                       |
| Commit-base             | `150e847d5ff2cb6833f8bfe7474e6c2fd8d596e1`                   |
| `origin/main` no início | `150e847d5ff2cb6833f8bfe7474e6c2fd8d596e1`                   |
| Data da coleta (UTC)    | `2026-07-29T01:23:04Z`                                       |
| Sistema                 | Windows 10 Pro `10.0.19045`, 64-bit                          |
| Node.js                 | `v22.15.1`                                                   |
| npm                     | `10.9.2`                                                     |
| Submódulos              | Nenhum                                                       |
| Working tree inicial    | Limpa                                                        |

O commit-base foi confirmado depois de `git fetch --prune origin`. A branch foi
criada diretamente desse commit. Nenhum arquivo de produção foi modificado.

## Stack confirmada

- React 19, TypeScript, Vite 7 e TanStack Router com árvore gerada.
- Tailwind CSS 4, Radix UI, CVA, Lucide e Framer Motion.
- TanStack Query para cache cliente.
- Supabase para Auth, PostgREST, Storage e Realtime.
- Nitro/Cloudflare no build SSR.
- Vitest para testes e ESLint/Prettier para qualidade estática.
- PWA própria por `public/sw.js`, registrada pelo root da aplicação.

Arquivos de lock encontrados: `package-lock.json`, `bun.lock` e `bun.lockb`.
Nenhum deles foi alterado. O script oficial solicitado nesta etapa foi executado
com npm, sem tentar sincronizar ou reescrever os locks.

## Scripts do pacote

| Script      | Comando                         |
| ----------- | ------------------------------- |
| `dev`       | `vite dev`                      |
| `build`     | `vite build`                    |
| `build:dev` | `vite build --mode development` |
| `preview`   | `vite preview`                  |
| `lint`      | `eslint .`                      |
| `format`    | `prettier --write .`            |
| `test`      | `vitest run`                    |

## Execução confirmatória

Os comandos foram executados na ordem solicitada, sem correções neste lote.

| Comando         | Resultado  | Evidência resumida                                                                                                                                                                             |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`        | **Falhou** | `EUSAGE`: `package.json` e `package-lock.json` estão fora de sincronia. Exemplos: `@cloudflare/vite-plugin` 1.32.2/1.48.0, `@supabase/supabase-js` 2.105.3/2.111.0 e pacotes ausentes no lock. |
| `npm run build` | **Passou** | Vite 7.3.2; 4.606 módulos; artefatos cliente e SSR gerados.                                                                                                                                    |
| `npm run lint`  | **Falhou** | 105.557 erros e 39 avisos; 105.556 erros são `prettier/prettier`, predominantemente baseline CRLF. Há um erro funcional isolado `no-empty` em `src/lib/missions.ts:25`.                        |
| `npm test`      | **Falhou** | 21 arquivos passaram; 5 suítes não foram coletadas por ausência das variáveis Supabase; 146 testes passaram. Nenhum Supabase foi acessado.                                                     |

O build regenerou `src/routeTree.gen.ts`, como previsto pelo gerador. O arquivo
foi restaurado imediatamente ao blob do commit-base. O mesmo ocorreu durante os
testes. Portanto, não há alteração versionada na árvore de rotas.

## Variáveis referenciadas

Não existe `.env.example` no checkout. Os nomes abaixo foram localizados no
código/configuração; valores não foram lidos nem registrados:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `PUSH_DISPATCH_ENABLED`
- `PUSH_DISPATCH_SECRET`
- `PUSH_PRIVATE_KEY`
- `PUSH_SUBJECT`
- `VITE_FF_V2_APP_SHELL`
- `VITE_FF_V2_COMMUNITY`
- `VITE_FF_V2_DATING`
- `VITE_FF_V2_MESSAGING`
- `VITE_FF_V2_PROFILE`
- `VITE_FF_V2_ECONOMY`
- `VITE_FF_V2_CUSTOMIZATION`
- `VITE_FF_V2_PETS`
- `VITE_FF_V2_ADMIN`
- `VITE_FF_V2_CINEMA`

## Invariantes desta captura

- V1 permanece a aplicação principal.
- Nenhuma rota, provider, componente, estilo, migration ou configuração foi alterado.
- Nenhuma flag V2 foi ativada.
- Nenhuma chamada remota ao Supabase foi executada.
- Nenhuma falha encontrada foi corrigida nesta tarefa.
- A referência visual solicitada não foi localizada de forma congelada; ver
  `07-preserved-contracts.md`.
