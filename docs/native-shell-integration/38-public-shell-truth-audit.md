# T46-25.3 — Shell público e comunicação verificável

- Home, Sobre, Como funciona, Histórias, Blog, Instalar, Manual e Termos para visitantes usam o PublicShell com asset oficial e menu mobile acessível.
- A Home apresenta comunidade cristã 18+ primeiro e preserva a Live e suas fontes de dados como seção real.
- Sobre e Como funciona descrevem amizade, fé, experiências, relacionamento opcional e moderação como redução de risco.
- Depoimentos sem fonte e seu JSON-LD Review foram removidos; não foram substituídos por histórias inventadas.
- Blog preserva loader, ordenação, metadata Article, relacionados, leitura e corpo estático. `dangerouslySetInnerHTML` permanece limitado ao catálogo estático versionado `BLOG_POSTS`; conteúdo de usuário não entra nessa fronteira.
- Canonicals públicos alterados usam `brand.origin`.
- `/v2` e `/v2/*` mantêm as rotas, mas redirecionam com replace para destinos V1/Native seguros sem importar `src/v2`.
- Nenhuma rota, query, mutation, backend, migration ou dependência foi criada.
- Smoke local/harness não representa E2E contra Supabase ou navegação visual em dispositivo real.
- Rollback: `git revert <commit-da-t46-25.3>`.
