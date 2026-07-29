# Smoke de runtime após a troca do lockfile

## Escopo

Smoke local, sem Supabase, conta real, escrita de dados ou deploy. Build gerado
por `npm run build` após instalação limpa pelo lockfile sincronizado.

## Tentativa com o script de preview

Comando:

```text
npm run preview -- --host 127.0.0.1 --port 4178
```

O processo iniciou, mas as cinco rotas responderam HTTP 500. Causa registrada:

```text
ERR_MODULE_NOT_FOUND: dist/server/server.js
```

O plugin de preview do TanStack procurou `dist/server/server.js`, enquanto o
build Cloudflare/Nitro produziu `.output/server/index.mjs`. Isso é uma
incompatibilidade do runner local após a mudança efetiva do grafo, não uma
aprovação de runtime. O script `preview` requer tarefa isolada antes de ser
usado como gate.

## Smoke do artefato Cloudflare/Nitro

O próprio `.output/nitro.json` declara o comando Wrangler. O artefato foi
iniciado sem instalar dependências:

```text
npx --no-install wrangler --cwd .output dev --port 4179
```

Resultados HTTP:

| Rota                    | Status | Resultado                                                                                                   |
| ----------------------- | -----: | ----------------------------------------------------------------------------------------------------------- |
| `/`                     |    200 | SSR respondeu, título público presente e sem exceção fatal.                                                 |
| `/auth/login`           |    200 | SSR da rota pública respondeu.                                                                              |
| `/instalar`             |    200 | SSR respondeu com título da instalação.                                                                     |
| `/inicio`               |    200 | SSR respondeu sem exceção fatal; o gate autenticado após hidratação não foi exercitado sem Supabase/sessão. |
| `/rota-inexistente-t46` |    404 | Not-found respondeu corretamente.                                                                           |

Logs do Wrangler confirmaram os cinco requests e nenhum erro server-side.

## Limites explícitos

- Redirect/gate hidratado de `/inicio`: **NÃO TESTADO POR AMBIENTE**.
- Estado visual de erro da configuração Supabase: **NÃO TESTADO EM BROWSER**.
- Login e restauração de sessão: **NÃO TESTADOS POR AMBIENTE**.
- Console e comportamento cliente após hidratação: não fazem parte deste smoke
  HTTP.
- O smoke prova que o artefato Cloudflare/Nitro inicia e responde SSR; não prova
  funcionamento de Auth, banco, Storage ou Realtime.

## Resultado

- Build implantável pelo adaptador Cloudflare/Nitro: **APROVADO NO SMOKE HTTP**.
- Script local `npm run preview`: **BLOQUEADO POR INCOMPATIBILIDADE DE OUTPUT**.
- Nenhuma alteração de runtime foi feita para contornar o resultado.
