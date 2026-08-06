# T47-01 — Autorização administrativa

## Resultado

As 13 rotas `/admin` agora passam por `AdminRouteAccessBoundary` independentemente da feature flag. A fronteira aguarda sessão e papéis, rejeita URL administrativa desconhecida, redireciona visitante para login com `returnTo` sanitizado e não monta os filhos quando o papel não é permitido.

| Destino                  | Papéis na fronteira                         | Defesa local/backend preservada              |
| ------------------------ | ------------------------------------------- | -------------------------------------------- |
| `/admin`                 | moderador, apresentador, admin, super_admin | tabs filtradas e guards atuais               |
| `/admin/verificacoes`    | admin, super_admin                          | guard local; RLS e bucket privado            |
| `/admin/fotos`           | admin, super_admin                          | guard local; moderação, bucket e API repair  |
| `/admin/presentes`       | admin, super_admin                          | RLS `virtual_gifts` e policies `gift-images` |
| `/admin/stickers`        | super_admin                                 | guard local e policies atuais                |
| `/admin/fundos`          | admin, super_admin                          | guard local e policies atuais                |
| `/admin/molduras`        | admin, super_admin                          | guard local e policies atuais                |
| `/admin/auras`           | admin, super_admin                          | guard local e policies atuais                |
| `/admin/gradientes-nome` | admin, super_admin                          | guard local e policies atuais                |
| `/admin/avatar`          | super_admin                                 | guard local; `avatar-items`                  |
| `/admin/pets`            | admin, super_admin                          | guard local e funções atuais                 |
| `/admin/economia`        | admin, super_admin                          | guard local e RPC atual                      |
| `/admin/equipe-live`     | admin, super_admin                          | guard local e bucket atual                   |

## Decisão de menor privilégio para Presentes

A rota não possuía guard local explícito. As policies versionadas permitem escrita em `virtual_gifts` e `gift-images` somente quando `has_role(..., 'admin')` ou `has_role(..., 'super_admin')`. O registry e a nova fronteira foram restringidos aos mesmos dois papéis. Nenhuma migration foi necessária.

## Limites

- O registry governa a fronteira e a navegação, mas não substitui guards locais ou RLS.
- Nenhuma query, channel, mutation, policy, RPC ou bucket foi criado.
- A auditoria confirma o SQL versionado; validação autenticada contra Supabase real permanece pendente.
- Não foi encontrada policy versionada que conceda escrita administrativa de Presentes a usuário comum.

## Rollback

`git revert <commit-t47-01>` ou manter o commit e desativar apenas o shell visual; a fronteira de autorização é deliberadamente independente da flag.
