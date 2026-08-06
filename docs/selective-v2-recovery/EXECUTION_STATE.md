# Recuperação seletiva V2 sobre V1

- Branch: `architecture/selective-v2-recovery-v1`
- Commit-base: `9b254369fb9fb9286143621b2aff42421f7c146b`
- Lote atual: Lote 1 + correção inicial do Lote 2, sem banco e sem visual.

## Alterações feitas

- Cache privado centralizado em `src/lib/privateSessionCache.ts`.
- Signed URLs privadas isoladas por `bucket + path + userId` em `src/lib/privateSignedUrlCache.ts`.
- Logout e troca de conta agora limpam React Query, mutations e caches privados registrados.
- Redirect pós-login passa por sanitização same-origin/interna em `src/lib/safeRedirect.ts`.
- Fotos públicas de perfil passam a resolver URL pública estável do bucket `profile-photos`.
- Imagens públicas de pets passam a resolver URL pública estável do bucket `pets`.
- Mídia explicitamente `sign`/`authenticated` continua assinada e escopada por usuário.
- Service worker não cacheia mais URLs assinadas/autenticadas de Storage; somente `/object/public/pets/`.

## Testes executados

- `bun install --frozen-lockfile`: passou, sem mudanças.
- `bunx tsc --noEmit`: passou.
- Testes focados: `tests/selective-v2-recovery-*.test.ts`, 8 testes passando.
- Suíte segura: 21 arquivos, 145 testes passando.
- `bunx eslint` focado: 0 erros; 1 warning legado em `src/lib/auth.tsx`.
- `bunx prettier --check` focado: passou.
- `bun run build`: passou; warnings conhecidos de bundling/Cloudflare.
- `git diff --check`: passou.

## Escopo preservado

- Sem migrations, deploy, merge, push para `main`, alteração de Supabase, secrets ou produção.
- Nenhuma alteração visual planejada: V1 continua como experiência principal.
- `/inicio` não foi redirecionado para `/v2`; referências `/v2` encontradas pertencem ao código/documentação V2 já existente.

## Bloqueadores reais

- Nenhum até agora.

## Próximo passo

- Validar, corrigir regressões de TypeScript/testes, commitar em lotes pequenos e não fazer deploy/merge/migrations.
