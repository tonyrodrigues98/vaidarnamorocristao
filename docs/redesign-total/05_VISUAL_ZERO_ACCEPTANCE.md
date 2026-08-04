# Visual Zero — pacote de aceitação

## Status

Este pacote substitui integralmente a apresentação interna rejeitada da Phase 01 nas cinco raízes. O shell responsivo aprovado permanece como infraestrutura. A camada Visual Zero fica isolada por `[data-vdn-redesign-total][data-vdn-visual-zero]` e não altera o default da feature flag.

## Superfícies

| Rota          | Nova apresentação                                | Fonte de dados preservada                          |
| ------------- | ------------------------------------------------ | -------------------------------------------------- |
| `/inicio`     | editorial contínua, prioridade e resumo em lista | `NativeInicioViewModel` criado uma vez pela rota   |
| `/comunidade` | chat em destaque e navegação local               | tabs e rotas reais existentes                      |
| `/explorar`   | diretório por grupos funcionais                  | `nativeExploreRegistry`                            |
| `/conversas`  | inbox contínua                                   | `useConversationsList` e modelo único              |
| `/perfil`     | identidade, mídia, formulários e recursos        | query, upload e mutations mantidos em `perfil.tsx` |

## Evidências

- Harness isolado: `scripts/redesign-zero/visual-harness/`.
- Execução visual: `node scripts/redesign-total/run-visual-qa.mjs`.
- Auditoria estrutural: `node scripts/redesign-zero/audit-visual-zero.mjs`.
- Matriz: `artifacts/redesign-zero/index.html`.
- Comparação Prototype 01 × Phase 01 × Visual Zero: `artifacts/redesign-zero/comparison/index.html`.
- Manifesto determinístico: `artifacts/redesign-zero/manifest.json`.

Os PNGs são evidência local e não são versionados. O harness usa fixtures determinísticas apenas na fronteira de teste; nenhuma fixture ou mock entra no runtime de produção.

## Contratos verificados

- cinco abas e ordem preservadas;
- nenhuma sexta aba;
- shell mobile, rail tablet e sidebar desktop preservados;
- nenhum Header legado dentro do redesign;
- imports visuais rejeitados proibidos por teste;
- classes de apresentação restritas ao prefixo `vz-`;
- queries, mutations, uploads e realtime permanecem nas rotas/hooks existentes;
- 69 rotas, zero migration, zero endpoint, zero dependência e zero secret novo;
- mínimo de 44 px e inputs de 16 px no mobile;
- avatar circular, mídia sem deformação e ausência de overflow horizontal.

## Limitações

O pacote comprova composição e contratos por harness isolado; não substitui uma sessão Supabase autenticada real. Tema escuro não é declarado congelado nesta fase. A revisão humana deve avaliar densidade, hierarquia editorial, leitura em conteúdo real e eventuais ajustes finos.

## Rollback

O rollback imediato permanece `VITE_FF_TOTAL_REDESIGN=false`. O rollback de código deve reverter os seis commits do Visual Zero na ordem inversa, sem alterar dados ou backend.
