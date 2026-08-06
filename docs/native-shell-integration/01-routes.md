# Inventário confirmatório de rotas

## Método e total

O inventário usa os 68 registros `createFileRoute(...)` encontrados em
`src/routes`. `src/routes/__root.tsx` é a raiz estrutural do TanStack Router e
não acrescenta um pathname. `src/routeTree.gen.ts` é gerado e permaneceu
inalterado no diff.

A classificação de acesso foi confrontada com
`src/v2/app/routing/route-access.ts`. A montagem visual foi confrontada com
`src/routes/__root.tsx`, `src/components/layout/MobileAppShell.tsx` e
`src/lib/layoutVisibility.ts`. “Privada” significa sessão autenticada no
boundary compartilhado; não significa autorização administrativa.

## Árvore resumida

```text
/
├── auth/ (login, signup, recuperação e reset)
├── onboarding/ (raiz e etapas 1–2)
├── admin/ (13 superfícies)
├── api/ (4 endpoints server-side)
├── conversas/ (lista, comunidade e $matchId)
├── pretendentes/ (lista e $id)
├── presentes/
├── proposito/$matchId
├── suporte/ (lista, ajuda e $id)
├── blog/ (lista e $slug)
├── v2/ (container, índice e $section; compatibilidade flagada)
└── 31 rotas de produto e conteúdo no primeiro nível
```

## Rotas

|   # | Pathname                          | Arquivo                                        | Acesso       | Observação de shell/contrato                                        |
| --: | --------------------------------- | ---------------------------------------------- | ------------ | ------------------------------------------------------------------- |
|   1 | `/`                               | `src/routes/index.tsx`                         | Pública      | Landing; footer legado permitido.                                   |
|   2 | `/como-funciona`                  | `src/routes/como-funciona.tsx`                 | Pública      | Conteúdo institucional.                                             |
|   3 | `/depoimentos`                    | `src/routes/depoimentos.tsx`                   | Pública      | Conteúdo institucional.                                             |
|   4 | `/instalar`                       | `src/routes/instalar.tsx`                      | Pública      | Instalação/PWA.                                                     |
|   5 | `/manual`                         | `src/routes/manual.tsx`                        | Pública      | Manual público.                                                     |
|   6 | `/sobre`                          | `src/routes/sobre.tsx`                         | Pública      | Conteúdo institucional.                                             |
|   7 | `/termos`                         | `src/routes/termos.tsx`                        | Pública      | Termos.                                                             |
|   8 | `/blog/`                          | `src/routes/blog.index.tsx`                    | Pública      | Índice do blog.                                                     |
|   9 | `/blog/$slug`                     | `src/routes/blog.$slug.tsx`                    | Pública      | Parâmetro `slug`.                                                   |
|  10 | `/auth/login`                     | `src/routes/auth/login.tsx`                    | Só visitante | Consome `returnTo` interno validado.                                |
|  11 | `/auth/signup`                    | `src/routes/auth/signup.tsx`                   | Só visitante | Cadastro.                                                           |
|  12 | `/auth/forgot-password`           | `src/routes/auth/forgot-password.tsx`          | Só visitante | Recuperação.                                                        |
|  13 | `/auth/reset-password`            | `src/routes/auth/reset-password.tsx`           | Pública      | Fluxo por link de recuperação.                                      |
|  14 | `/onboarding/`                    | `src/routes/onboarding/index.tsx`              | Onboarding   | Sessão exigida; regra específica preservada.                        |
|  15 | `/onboarding/etapa-1`             | `src/routes/onboarding/etapa-1.tsx`            | Onboarding   | Etapa específica.                                                   |
|  16 | `/onboarding/etapa-2`             | `src/routes/onboarding/etapa-2.tsx`            | Onboarding   | Etapa específica.                                                   |
|  17 | `/inicio`                         | `src/routes/inicio.tsx`                        | Privada      | Shell mobile; `AuthenticatedRouteGate`; sem redirect V2 automático. |
|  18 | `/comunidade`                     | `src/routes/comunidade.tsx`                    | Privada      | Rota real V1 preservada.                                            |
|  19 | `/dashboard`                      | `src/routes/dashboard.tsx`                     | Privada      | Shell mobile.                                                       |
|  20 | `/devocional`                     | `src/routes/devocional.tsx`                    | Privada      | Shell mobile.                                                       |
|  21 | `/perfil`                         | `src/routes/perfil.tsx`                        | Privada      | Shell mobile; footer oculto.                                        |
|  22 | `/conta`                          | `src/routes/conta.tsx`                         | Privada      | Shell mobile; footer oculto.                                        |
|  23 | `/verificacao`                    | `src/routes/verificacao.tsx`                   | Privada      | Shell mobile; footer oculto.                                        |
|  24 | `/bloqueados`                     | `src/routes/bloqueados.tsx`                    | Privada      | Shell mobile; footer oculto.                                        |
|  25 | `/notificacoes`                   | `src/routes/notificacoes.tsx`                  | Privada      | Shell mobile; footer oculto.                                        |
|  26 | `/interesses`                     | `src/routes/interesses.tsx`                    | Privada      | Shell mobile.                                                       |
|  27 | `/matches`                        | `src/routes/matches.tsx`                       | Privada      | Shell mobile.                                                       |
|  28 | `/recados`                        | `src/routes/recados.tsx`                       | Privada      | Shell mobile.                                                       |
|  29 | `/oracoes`                        | `src/routes/oracoes.tsx`                       | Privada      | Shell mobile.                                                       |
|  30 | `/loja`                           | `src/routes/loja.tsx`                          | Privada      | Shell mobile; footer oculto.                                        |
|  31 | `/caixas`                         | `src/routes/caixas.tsx`                        | Privada      | Economia/caixas.                                                    |
|  32 | `/conquistas`                     | `src/routes/conquistas.tsx`                    | Privada      | Conquistas.                                                         |
|  33 | `/avatar`                         | `src/routes/avatar.tsx`                        | Privada      | Avatar legado.                                                      |
|  34 | `/avatar/criar`                   | `src/routes/avatar.criar.tsx`                  | Privada      | Criação de avatar legado.                                           |
|  35 | `/meu-pet`                        | `src/routes/meu-pet.tsx`                       | Privada      | Shell mobile; footer oculto.                                        |
|  36 | `/pet-arcade`                     | `src/routes/pet-arcade.tsx`                    | Privada      | Arcade de pets.                                                     |
|  37 | `/quiz-biblico`                   | `src/routes/quiz-biblico.tsx`                  | Privada      | Quiz.                                                               |
|  38 | `/noticias/`                      | `src/routes/noticias.index.tsx`                | Privada      | Notícias.                                                           |
|  39 | `/presentes/`                     | `src/routes/presentes/index.tsx`               | Privada      | Shell mobile; footer oculto.                                        |
|  40 | `/pretendentes/`                  | `src/routes/pretendentes/index.tsx`            | Privada      | Domínio de namoro.                                                  |
|  41 | `/pretendentes/$id`               | `src/routes/pretendentes/$id.tsx`              | Privada      | Parâmetro `id`.                                                     |
|  42 | `/conversas/`                     | `src/routes/conversas/index.tsx`               | Privada      | Lista; shell mobile.                                                |
|  43 | `/conversas/comunidade`           | `src/routes/conversas/comunidade.tsx`          | Privada      | Chat comunitário; bottom nav permanece.                             |
|  44 | `/conversas/$matchId`             | `src/routes/conversas/$matchId.tsx`            | Privada      | Chat focado; bottom nav ocultada; parâmetro `matchId`.              |
|  45 | `/proposito/$matchId`             | `src/routes/proposito/$matchId.tsx`            | Privada      | Parâmetro `matchId`; shell mobile.                                  |
|  46 | `/suporte/`                       | `src/routes/suporte/index.tsx`                 | Privada      | Shell principal oculto.                                             |
|  47 | `/suporte/ajuda`                  | `src/routes/suporte/ajuda.tsx`                 | Privada      | Shell principal oculto.                                             |
|  48 | `/suporte/$id`                    | `src/routes/suporte/$id.tsx`                   | Privada      | Parâmetro `id`; shell principal oculto.                             |
|  49 | `/admin/`                         | `src/routes/admin/index.tsx`                   | Admin        | Sessão não concede papel; guard administrativo existente permanece. |
|  50 | `/admin/auras`                    | `src/routes/admin/auras.tsx`                   | Admin        | Shell principal oculto.                                             |
|  51 | `/admin/avatar`                   | `src/routes/admin/avatar.tsx`                  | Admin        | Shell principal oculto.                                             |
|  52 | `/admin/economia`                 | `src/routes/admin/economia.tsx`                | Admin        | Shell principal oculto.                                             |
|  53 | `/admin/equipe-live`              | `src/routes/admin/equipe-live.tsx`             | Admin        | Shell principal oculto.                                             |
|  54 | `/admin/fotos`                    | `src/routes/admin/fotos.tsx`                   | Admin        | Shell principal oculto.                                             |
|  55 | `/admin/fundos`                   | `src/routes/admin/fundos.tsx`                  | Admin        | Shell principal oculto.                                             |
|  56 | `/admin/gradientes-nome`          | `src/routes/admin/gradientes-nome.tsx`         | Admin        | Shell principal oculto.                                             |
|  57 | `/admin/molduras`                 | `src/routes/admin/molduras.tsx`                | Admin        | Shell principal oculto.                                             |
|  58 | `/admin/pets`                     | `src/routes/admin/pets.tsx`                    | Admin        | Shell principal oculto.                                             |
|  59 | `/admin/presentes`                | `src/routes/admin/presentes.tsx`               | Admin        | Shell principal oculto.                                             |
|  60 | `/admin/stickers`                 | `src/routes/admin/stickers.tsx`                | Admin        | Shell principal oculto.                                             |
|  61 | `/admin/verificacoes`             | `src/routes/admin/verificacoes.tsx`            | Admin        | Shell principal oculto.                                             |
|  62 | `/api/photo-repair`               | `src/routes/api/photo-repair.ts`               | Endpoint     | Server-side; não é página.                                          |
|  63 | `/api/public/hooks/push-dispatch` | `src/routes/api/public/hooks/push-dispatch.ts` | Endpoint     | Autenticação server-side própria.                                   |
|  64 | `/api/public/runtime-config`      | `src/routes/api/public/runtime-config.ts`      | Endpoint     | Configuração pública sanitizada.                                    |
|  65 | `/api/verify-photo`               | `src/routes/api/verify-photo.ts`               | Endpoint     | Server-side; não é página.                                          |
|  66 | `/v2`                             | `src/routes/v2.tsx`                            | Privada/flag | Container de compatibilidade; V1 não redireciona para ele.          |
|  67 | `/v2/`                            | `src/routes/v2.index.tsx`                      | Privada/flag | Redireciona internamente para `/v2/inicio` quando acessível.        |
|  68 | `/v2/$section`                    | `src/routes/v2.$section.tsx`                   | Privada/flag | Runtime visual V2 isolado; desativado por padrão.                   |

## Regras globais preservadas

- `RouteProtectionBoundary` não monta conteúdo privado durante restauração.
- Rotas privadas sem sessão usam o login com destino interno seguro.
- Rotas de visitante não concorrem com redirects imperativos.
- Onboarding, banimento e autorização administrativa continuam fronteiras
  distintas da mera autenticação.
- Endpoints `/api/*` não são tratados como páginas.
- `/v2/*` retorna a `/inicio` quando `VITE_FF_V2_APP_SHELL` não é exatamente
  `true`; nenhuma rota V1 redireciona automaticamente para `/v2/*`.
- O shell legado é ocultado em autenticação, onboarding, admin, suporte e V2.
- Em conversa focada, a bottom navigation é ocultada; em
  `/conversas/comunidade`, ela permanece.

## Limites de comprovação

Este documento prova contratos estáticos do commit-base. Não prova que todas as
rotas tenham sido exercitadas em navegador, nem que cada query remota tenha
permissão válida no Supabase publicado.
