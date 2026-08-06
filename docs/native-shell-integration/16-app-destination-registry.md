# Registro central de destinos

## Problema resolvido

As decisões de layout estavam duplicadas em `layoutVisibility.ts` e
`MobileAppShell.tsx`: famílias de rotas, exceções de chat, footer, shell mobile, bottom navigation,
viewport visual e transição eram resolvidos por listas independentes. A T46-05 move essas decisões
para `src/config/app-destinations.ts` sem alterar rotas, navegação ou autorização.

## Inventário dos consumidores

| Consumidor                                                      | Regra anterior                                             | Resultado                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/lib/layoutVisibility.ts`                                   | Prefixos separados para footer, chat e Header mobile       | Agora é um conjunto de wrappers retrocompatíveis sobre o registro.          |
| `src/components/mobile/MobileAppShell.tsx`                      | Quatro arrays locais para shell, exceções e chats          | Agora resolve uma vez `DestinationBehavior`; teclado e cleanup não mudaram. |
| `src/routes/__root.tsx`                                         | Consome `shouldShowFooter` e `isChatRoute`                 | Preservado sem alteração.                                                   |
| `src/components/layout/Header.tsx`                              | Consome `isMobileAppRoute`                                 | Preservado sem alteração visual.                                            |
| `src/components/mobile/MobileRouteTransition.tsx`               | Consome `isChatRoute`                                      | Preservado; chat continua sem transição.                                    |
| `MobileBottomNav`, `AdminTopNav`, install prompt e notificações | Verificações de item ativo ou regras operacionais próprias | Não migradas: não duplicam a decisão de layout do shell.                    |

## Contrato e precedência

Cada `AppDestination` é serializável e declara padrão, tipo de match, shell, acesso documental,
tab atual/futura, shell mobile, bottom nav, Header, footer, viewport, transição e status.

O pathname é normalizado sem query, hash ou barra final. O matching calcula precedência
explicitamente:

1. prioridade declarada;
2. `exact` antes de `prefix`;
3. padrão mais específico (mais longo).

Assim, `/conversas/comunidade` vence a família `/conversas`, `/admin/*` nunca herda o app e
`/api/*` nunca recebe layout. A rota desconhecida usa fallback público seguro, sem footer
automático.

## Matriz resumida

| Rota/família                         | Shell         | Acesso documental | Bottom nav | Header mobile | Footer          | Viewport | Status    |
| ------------------------------------ | ------------- | ----------------- | ---------- | ------------- | --------------- | -------- | --------- |
| `/`                                  | public        | public            | não        | global        | não             | não      | active    |
| páginas institucionais/blog/notícias | public        | public            | não        | global        | sim             | não      | active    |
| `/auth/*`                            | public        | public            | não        | global        | não             | não      | active    |
| `/onboarding/*`                      | app           | authenticated     | não        | global        | não             | não      | active    |
| destinos mobile atuais               | app           | authenticated     | sim        | contextual    | conforme legado | não      | active    |
| `/conversas`                         | app           | authenticated     | sim        | contextual    | não             | não      | active    |
| `/conversas/$matchId`                | focused       | authenticated     | não        | contextual    | não             | sim      | active    |
| `/conversas/comunidade`              | focused       | authenticated     | sim        | contextual    | não             | sim      | active    |
| app fora do shell mobile             | app           | authenticated     | não        | global        | conforme legado | não      | active    |
| `/suporte/*`                         | app           | authenticated     | não        | global        | não             | não      | active    |
| `/admin/*`                           | admin         | admin             | não        | global        | não             | não      | active    |
| `/api/*`                             | api           | public            | não        | hidden        | não             | não      | api       |
| `/v2*`                               | compatibility | authenticated     | não        | global        | não             | não      | legacy-v2 |
| `/comunidade`                        | compatibility | authenticated     | não        | global        | sim             | não      | redirect  |
| desconhecida                         | public        | public            | não        | global        | não             | não      | active    |

## Cobertura e validação

Os 68 `fullPath` gerados em `src/routeTree.gen.ts` possuem pathname representativo classificado.
O arquivo gerado não é alterado. O validador detecta IDs e padrões duplicados, prioridades
conflitantes, regras inalcançáveis e combinações incompatíveis.

O campo `access` é apenas documentação. `RouteProtectionBoundary`, guards de aprovação, Admin,
Suporte e `BanGuard` continuam sendo a autoridade de runtime; o registro não concede acesso.

## Destinos futuros inativos

`plannedPrimaryDestinations` registra somente o contrato futuro:

- home → `/inicio`;
- community → `/comunidade`;
- explore → `/explorar`;
- messages → `/conversas`;
- profile → `/perfil`.

A lista não é consumida pela navegação atual. `/explorar` não foi criado, `/comunidade` continua
redirect e o bottom navigation permanece Início, Devocional, Conversas, Pretendentes e Perfil.

## Como adicionar uma rota

1. Adicionar a rota normalmente pelo TanStack Router.
2. Reutilizar uma família existente ou criar a regra mínima específica.
3. Declarar comportamento de layout e acesso documental.
4. Executar os testes de cobertura e validação.
5. Manter autorização em seu guard/RLS correspondente.

## Limitações

- O registro não substitui autorização.
- Regras operacionais de install prompt, notificações e item ativo permanecem locais.
- O fallback seguro omite footer em URLs desconhecidas; não cria rota nem redirect.
- Nenhum destino futuro, App Shell ou CSS Native Shell foi ativado.
