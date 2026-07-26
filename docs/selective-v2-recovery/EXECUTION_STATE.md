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

- Pendente: TypeScript, testes focados, lint focado e build após finalizar os ajustes.

## Bloqueadores reais

- Nenhum até agora.

## Próximo passo

- Validar, corrigir regressões de TypeScript/testes, commitar em lotes pequenos e não fazer deploy/merge/migrations.
