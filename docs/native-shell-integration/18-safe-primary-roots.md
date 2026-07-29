# T46-07 — raízes seguras de Comunidade e Explorar

## Objetivo

Dois destinos da navegação futura agora possuem raízes estruturais protegidas, sem introduzir
navegação visual, dados fictícios ou integração de backend.

## Comunidade

`/comunidade` era e continua sendo uma rota de compatibilidade no registro. Com
`VITE_FF_NATIVE_SHELL` ausente ou diferente de `"true"`, preserva exatamente o redirect com
`replace` para `/conversas/comunidade`.

Com a flag ativa, a rota mostra uma estrutura documental de Agora, Espaços e Eventos atrás do
`RequireApproved`. O único CTA abre o chat geral real. O chat em
`/conversas/comunidade`, seus dados, proteção e comportamento não foram alterados.

## Explorar

`/explorar` é uma nova rota privada. Com a flag desligada, redireciona com `replace` para
`/inicio`. Com a flag ativa, mostra Continuar, Experiências e Descobertas atrás do mesmo gate de
autenticação e aprovação. Seus links apontam apenas para rotas V1 existentes: Devocional, Meu
Pet, Pet Arcade, Loja e Pretendentes.

## Isolamento

- As duas rotas usam metadata privada `noindex, nofollow`.
- Não existem queries, Supabase, fetch, mocks, perfis, contadores ou imagens.
- O placeholder é puramente estrutural e não representa o design final.
- Nenhuma bottom navigation, sidebar, top bar, feed, Espaço, Evento ou experiência funcional
  foi criada.
- O registro cobre 69 rotas. `/comunidade` mantém status `redirect` e recebe somente o destino
  futuro `community`; `/explorar` é `app`, exige aprovação documental e recebe `explore`.
- O registro não autoriza acesso; `RequireApproved` continua sendo o gate real das páginas.
- A elegibilidade do scaffold não foi ampliada: somente `app-home` (`/inicio`).

## Comportamento por flag

| Rota                    | Flag desligada          | Flag ligada               |
| ----------------------- | ----------------------- | ------------------------- |
| `/comunidade`           | `/conversas/comunidade` | raiz estrutural protegida |
| `/explorar`             | `/inicio`               | raiz estrutural protegida |
| `/conversas/comunidade` | chat real               | chat real                 |

Sem um Supabase local seguro, autenticação e aprovação são comprovadas por contratos e testes,
sem alegação de smoke autenticado real.

## Rollback

Definir `VITE_FF_NATIVE_SHELL=false` restaura imediatamente os redirects seguros. O rollback de
código é `git revert <commit-da-t46-07>`.
