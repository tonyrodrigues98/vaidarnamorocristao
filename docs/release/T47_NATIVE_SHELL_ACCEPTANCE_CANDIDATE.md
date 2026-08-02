# T47 Native Shell acceptance candidate

Status: **READY_FOR_HUMAN_ACCEPTANCE**

Este status não significa `PRODUCTION_READY`, autorização de deploy ou aprovação jurídica.

## Identificação

- Repository: `tonyrodrigues98/vaidarnamorocristao`
- Branch: `integration/native-shell-v1`
- SHA inicial T47: `c669d4393f9f55dd26c2af769b198e0c8af0ad77`
- SHA de retomada: `450b90457671eacf3f35404dee32465754a6bc9a`
- SHA visual T47-03: `14154e5e1e551366144b7fdd23d8788fb9efce4a`
- SHA final: commit que contém este manifesto, registrado no remoto e no relatório final da execução
- Feature flag: `VITE_FF_NATIVE_SHELL=false` por padrão
- Rotas: 69 geradas, 69 classificadas, zero rota nova neste lote

## Commits T47

- `0955b80c93d2bf49910b2e055c3da59c364a41ad` — autorização administrativa por URL direta.
- `c7dc5c7d7c2cfc224ca4744ce5e8f9200c5ee456` — gate global de formatação.
- `450b90457671eacf3f35404dee32465754a6bc9a` — qualificação automatizada do corte Native.
- `14154e5e1e551366144b7fdd23d8788fb9efce4a` — matriz visual no Chrome e harness isolado.
- `75752049861ef52fa7b490207ed0a7ef2fb4dec2` — asset original da Live incorporado ao artefato público.
- `b7c45686f4df0a847f7df694652f606930544120` — 404 público preservado fora das fronteiras privadas.
- Commit deste documento — pacote de aceitação humana.

## Cobertura estrutural

As 69 rotas estão classificadas entre Native App Shell, Focused Messaging Shell, Admin Shell, Auth Shell, Onboarding Shell, Document Shell, Public Shell, API/server e V2 tombstone. As rotas V2 não montam o runtime visual rejeitado.

A fronteira administrativa cobre as 13 rotas `/admin` com a feature flag ligada ou desligada. O acesso por URL direta aguarda sessão e papéis, não monta conteúdo negado e mantém guards locais e RLS como defesas adicionais. `/admin/presentes` está restrita a `admin` e `super_admin` por menor privilégio.

## Gates automatizados

- Node: `v22.15.1`
- npm: `10.9.2`
- Build cliente/SSR, flag off: passou.
- Build cliente/SSR, flag on: passou.
- Testes unitários, flag off/on: 480 passaram em cada execução.
- Qualificação de release: 69 rotas, PWA e resíduos visuais passaram.
- ESLint global: zero erros e 31 warnings inventariados.
- Prettier global: passou.
- `git diff --check`: passou.
- Scripts `typecheck`, `test:e2e` e `test:smoke`: não existem; o build executa a validação TypeScript disponível.

## Dependências e segurança

`npm audit --omit=dev` encontrou 8 ocorrências: 4 low, 4 high e zero critical. O audit completo encontrou 9: 4 low, 5 high e zero critical. Os highs identificados pertencem a ferramentas de build/dev ou caminhos transientes sem alcance de runtime comprovado no Worker publicado; nenhuma atualização major ou `audit fix --force` foi aplicada. A avaliação detalhada está em `t47-automated-qualification.md`.

Não houve migration, mudança de RLS, mudança de bucket, secret versionado ou dependência nova neste lote.

## PWA e performance

Manifest, `start_url`, standalone, ícones, service worker, offline e exclusão de respostas privadas do cache público foram qualificados. A instalação real e o ciclo de atualização em aparelho continuam pendentes.

Há dívida P2 de performance: assets individuais chegam a aproximadamente 2,96 MB e existem chunks acima de 500 kB. Não foi criado orçamento fictício nem feita otimização arriscada nesta qualificação.

## QA visual no Chrome

- Chrome: `150.0.7871.187`, headless, perfil temporário isolado e removido ao final.
- Motor: Chrome DevTools Protocol via WebSocket nativo do Node.
- Artefato real: Wrangler sobre `.output/server/wrangler.json`.
- Superfícies privadas: harness isolado, sem rota de produção e sem dados reais.
- Screenshots: 55.
- Viewports: `393x852`, `430x932`, `852x393`, `834x1194`, `1194x834`, `1440x900`.
- Temas: light, dark, system-light e system-dark.
- Motion: normal e prefers-reduced-motion.
- P0: 0.
- P1: 0.
- P2: 0.
- P3: 0.
- ZIP local: `artifacts/T47_VISUAL_QA.zip`.
- SHA-256: `b75ac4bf5737a592946332874d25fa3bab8086af779e3f86578a59155c5a6a62`.
- Manifesto: `docs/release/t47-visual-qa-manifest.md`.

Os dois achados P2 anteriores foram encerrados no artefato Wrangler: o JPEG original da Live foi carregado e decodificado pelo bundle sem `__l5e`, e `/rota-inexistente` retornou HTTP 404 com PublicShell em português, sem AuthShell ou redirect. As regressões de acesso de Admin, `/inicio`, blog e tombstones V2 também foram repetidas.

O dark mode foi validado estruturalmente, mas não está visualmente congelado.

## Limitações obrigatórias

O harness autenticado comprova shell, tokens, breakpoints, chrome, estados de autorização determinísticos e interações visuais. Ele não comprova backend, Supabase, RLS, realtime, uploads, signed URLs, câmera, push, PWA instalada ou mutações reais.

Continuam pendentes:

- E2E autenticado em Supabase real controlado;
- iPhone/Safari e PWA física;
- Android/Chrome e PWA física;
- teclado, rotação, câmera, upload, push e rede instável reais;
- validação operacional externa, observabilidade e backup;
- revisão humana do produto;
- revisão jurídica em `docs/legal/terms-product-consistency-audit.md`, marcada `REQUIRES_HUMAN_LEGAL_REVIEW`;
- autorização explícita posterior para qualquer corte.

## Rollback

Rollback imediato sem alteração de código: manter `VITE_FF_NATIVE_SHELL=false`.

Rollback dos commits T47, se necessário, deve ser feito em ordem inversa com `git revert`, começando pelo commit deste manifesto, seguido por `b7c45686f4df0a847f7df694652f606930544120`, `75752049861ef52fa7b490207ed0a7ef2fb4dec2` e pelos commits T47 anteriores. Nenhum rollback foi executado.

## Restrições de release

Não houve deploy, merge em `main`, tag, DNS, publicação, ativação da flag no host ou remoção do fallback legado. O candidato só pode avançar após o checklist humano, jurídico, E2E real, dispositivos físicos, operação externa e nova autorização do responsável pelo produto.
