# Matriz de migracao das superficies

Fonte: as 69 rotas classificadas em `docs/native-shell-integration/40-surface-coverage-final.md` e protegidas por `tests/surface-shell-coverage.test.ts`.

| Rotas                                                                                                     | Classificacao nesta fase |
| --------------------------------------------------------------------------------------------------------- | ------------------------ |
| `/inicio`, `/comunidade`, `/explorar`, `/conversas`, `/perfil`                                            | `REDESIGN_PHASE_01`      |
| `/conversas/$matchId`, `/conversas/comunidade`                                                            | `IMMERSIVE_PENDING`      |
| `/`, `/sobre`, `/como-funciona`, `/depoimentos`, `/blog`, `/blog/$slug`, `/instalar`                      | `PUBLIC_PENDING`         |
| `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`                            | `AUTH_PENDING`           |
| `/admin` e as 12 subrotas administrativas                                                                 | `ADMIN_PENDING`          |
| `/api/photo-repair`, `/api/verify-photo`, `/api/public/runtime-config`, `/api/public/hooks/push-dispatch` | `NO_VISUAL_CHANGE`       |
| `/v2`, `/v2/`, `/v2/$section`                                                                             | `NO_VISUAL_CHANGE`       |
| Demais rotas Native App, Onboarding e Document                                                            | `REDESIGN_PENDING`       |

## Inventario completo

Todas as rotas permanecem `FROZEN_FUNCTIONAL`. A classificacao visual adicional nao altera shell, acesso ou fonte de dados.

`/`, `/avatar`, `/bloqueados`, `/caixas`, `/como-funciona`, `/comunidade`, `/conquistas`, `/conta`, `/dashboard`, `/depoimentos`, `/devocional`, `/explorar`, `/inicio`, `/instalar`, `/interesses`, `/loja`, `/manual`, `/matches`, `/meu-pet`, `/notificacoes`, `/oracoes`, `/perfil`, `/pet-arcade`, `/quiz-biblico`, `/recados`, `/sobre`, `/termos`, `/v2`, `/verificacao`, `/admin/`, `/admin/auras`, `/admin/avatar`, `/admin/economia`, `/admin/equipe-live`, `/admin/fotos`, `/admin/fundos`, `/admin/gradientes-nome`, `/admin/molduras`, `/admin/pets`, `/admin/presentes`, `/admin/stickers`, `/admin/verificacoes`, `/api/photo-repair`, `/api/verify-photo`, `/auth/forgot-password`, `/auth/login`, `/auth/reset-password`, `/auth/signup`, `/avatar/criar`, `/blog/`, `/blog/$slug`, `/conversas/`, `/conversas/$matchId`, `/conversas/comunidade`, `/noticias/`, `/onboarding/`, `/onboarding/etapa-1`, `/onboarding/etapa-2`, `/presentes/`, `/pretendentes/`, `/pretendentes/$id`, `/proposito/$matchId`, `/suporte/`, `/suporte/$id`, `/suporte/ajuda`, `/v2/`, `/v2/$section`, `/api/public/runtime-config`, `/api/public/hooks/push-dispatch`.

Uma rota visual nova deve falhar no teste de cobertura antes de ser aceita.
