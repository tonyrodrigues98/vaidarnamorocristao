# T47-02 — Qualificação automatizada

## Toolchain e gates

- Node: `v22.15.1`; npm: `10.9.2`.
- Build cliente/SSR: passou com flag ausente/false e com `VITE_FF_NATIVE_SHELL=true`.
- Testes: 468/468 em ambos os modos antes da inclusão dos testes deste lote; testes focados adicionais passaram.
- Lint global: zero erros; 31 warnings inventariados abaixo.
- Prettier global: passou após correção mecânica em commit separado.
- `typecheck`, `test:e2e` e `test:smoke`: scripts inexistentes; não inventados.

## Artefato de produção local

Executado com Wrangler contra `.output/server/wrangler.json` e `.output/public`:

| Recurso                      | HTTP | Resultado                                           |
| ---------------------------- | ---: | --------------------------------------------------- |
| `/`                          |  200 | HTML SSR servido                                    |
| `/manifest.webmanifest`      |  200 | manifest servido                                    |
| `/sw.js`                     |  200 | service worker servido                              |
| `/offline.html`              |  307 | normalização do runtime; recurso existe no artefato |
| `/v2`                        |  200 | layout tombstone; redirect ocorre no router cliente |
| `/rota-inexistente`          |  404 | not-found real                                      |
| `/api/public/runtime-config` |  503 | esperado sem secrets/runtime Supabase local         |

Uma primeira tentativa na porta 4173 atingiu um processo local residual e retornou 500; o processo foi identificado e encerrado. A execução limpa na porta 4174 confirmou o artefato saudável.

## Dependências e vulnerabilidades

`npm audit --omit=dev`: 8 vulnerabilidades — 4 low e 4 high; zero critical. `npm audit`: 9 — 4 low e 5 high; zero critical.

| Pacote                  | Severidade | Produção/dev                          | Caminho e decisão                                                                                                                      |
| ----------------------- | ---------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `vite`                  | high       | ferramenta direta listada em produção | advisories afetam servidor dev/launch-editor; não é executado no worker publicado; atualizar em ciclo compatível, sem major automático |
| `postcss`               | high       | transitiva de build                   | stringify/source maps com entrada controlada no build; não exposta como serviço runtime                                                |
| `js-yaml`               | high       | transitiva de toolchain               | DoS ao analisar YAML hostil; build usa arquivos versionados, não entrada de usuário                                                    |
| `node-fetch`            | high       | transitiva via TensorFlow/face-api    | redirects/size; aplicação não chama `node-fetch` diretamente nem encaminha credenciais por ele                                         |
| `brace-expansion`       | high       | somente audit completo/dev            | DoS de expansão; ferramenta local, não runtime                                                                                         |
| `face-api.js`           | low        | direta                                | herda TensorFlow/node-fetch; processamento no cliente e sem fetch direto pelo pacote auditado                                          |
| `@tensorflow/tfjs-core` | low        | transitiva                            | caminho de `node-fetch`; mesma mitigação                                                                                               |
| `@babel/core`           | low        | transitiva de build                   | leitura via source map limitada a fontes versionadas                                                                                   |
| `esbuild`               | low        | transitiva de build                   | advisory de dev server no Windows; não executado em produção                                                                           |

Não há vulnerabilidade crítica nem high comprovadamente alcançável no runtime Cloudflare. As highs permanecem dívida de atualização e devem ser reavaliadas antes do corte final.

## Warnings globais

- 16 `react-refresh/only-export-components`: organização de exports em desenvolvimento, sem impacto no bundle de produção.
- 14 `react-hooks/exhaustive-deps`: devem receber revisão funcional específica; não foram silenciados nem alterados mecanicamente.
- 1 `eslint-disable` não utilizado em Admin Avatar.

## PWA

- `start_url=/inicio`, `display=standalone`, scope `/`, ícones 192/512 e variantes maskable presentes.
- Apple touch icon, splash e theme colors são emitidos pelo root.
- SW fornece fallback de navegação offline e limita cache compartilhado a assets estáticos same-origin e imagens públicas de Pets.
- Paths sensíveis e Signed URLs privadas não entram no cache público.
- Instalação real, atualização em aparelho e push continuam pendentes.

## Performance estrutural

- Vite reporta chunks acima de 500 kB; não foi criado orçamento fictício.
- Maiores itens observados: `open-book` 2,96 MB, `card-pack` 1,76 MB, `heic2any` 1,35 MB e vários assets de Arcade/Caixas entre 0,9 e 1,4 MB.
- Rotas continuam code-split; Admin, Arcade e editores têm chunks próprios.
- Otimização de imagens e carregamento do conversor HEIC são dívidas P2 de performance, não falhas funcionais automatizadas.

## Erros e degradação

Cobertura existente/focada inclui runtime Supabase ausente, sessão recuperável, offline, 404, acesso administrativo negado, tombstones V2, Signed URL, flag ausente, storage local/VisualViewport indisponíveis e reduced motion. E2E real continua obrigatório para validar rede, sessão e storage reais.
