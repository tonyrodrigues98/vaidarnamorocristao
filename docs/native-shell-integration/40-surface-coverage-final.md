# Cobertura final das superfícies

Fonte: 69 `fullPath` gerados em `src/routeTree.gen.ts`. A classificação é protegida por `surface-shell-coverage.test.ts`; o arquivo gerado não foi editado.

| Rota                              | Shell             | Acesso              | Parent/título           | Fonte preservada       | Smoke         |
| --------------------------------- | ----------------- | ------------------- | ----------------------- | ---------------------- | ------------- |
| `/`                               | Public            | público             | Início                  | Live/landing real      | estrutural    |
| `/avatar`                         | Native App        | aprovado            | Explorar/Avatar         | avatar atual           | harness       |
| `/bloqueados`                     | Native App        | autenticado         | Perfil/Bloqueados       | query/mutation atuais  | harness       |
| `/caixas`                         | Native App        | aprovado            | Explorar/Caixas         | Grab atual             | harness       |
| `/como-funciona`                  | Public            | público             | Como funciona           | conteúdo estático      | estrutural    |
| `/comunidade`                     | Native App        | aprovado            | Comunidade              | links reais            | harness       |
| `/conquistas`                     | Native App        | aprovado            | Explorar/Conquistas     | achievements/XP        | harness       |
| `/conta`                          | Native App        | autenticado         | Perfil/Configurações    | auth/conta             | harness       |
| `/dashboard`                      | Native App        | aprovado            | Perfil/Insights         | métricas atuais        | harness       |
| `/depoimentos`                    | Public            | público             | Depoimentos             | conteúdo verificável   | estrutural    |
| `/devocional`                     | Native App        | aprovado            | Explorar/Devocional     | daily posts/realtime   | harness       |
| `/explorar`                       | Native App        | aprovado            | Explorar                | registry local         | harness       |
| `/inicio`                         | Native App        | aprovado            | Início                  | queries atuais         | harness       |
| `/instalar`                       | Public            | público             | Instalar                | PWA atual              | estrutural    |
| `/interesses`                     | Native App        | aprovado            | Explorar/Interesses     | interesses/realtime    | harness       |
| `/loja`                           | Native App        | aprovado            | Explorar/Loja           | economia/inventário    | harness       |
| `/manual`                         | Document          | público/autenticado | Perfil/Manual           | conteúdo estático      | estrutural    |
| `/matches`                        | Native App        | aprovado            | Explorar/Matches        | matches/realtime       | harness       |
| `/meu-pet`                        | Native App        | aprovado            | Explorar/Meu Pet        | pet atual              | harness       |
| `/notificacoes`                   | Native App        | autenticado         | Início/Notificações     | hook/realtime atual    | harness       |
| `/oracoes`                        | Native App        | aprovado            | Comunidade/Orações      | pedidos/realtime       | harness       |
| `/perfil`                         | Native App        | autenticado         | Perfil                  | perfil/uploads atuais  | harness       |
| `/pet-arcade`                     | Native App        | aprovado            | Explorar/Arcade         | 17 jogos atuais        | harness       |
| `/quiz-biblico`                   | Native App        | aprovado            | Explorar/Quiz Bíblico   | RPCs atuais            | harness       |
| `/recados`                        | Native App        | aprovado            | Explorar/Recados        | recados atuais         | harness       |
| `/sobre`                          | Public            | público             | Sobre                   | conteúdo estático      | estrutural    |
| `/termos`                         | Document          | público/autenticado | Perfil/Termos           | termos existentes      | estrutural    |
| `/v2`                             | V2 tombstone      | qualquer            | redirect `/inicio`      | nenhum runtime V2      | teste         |
| `/verificacao`                    | Native App        | autenticado         | Perfil/Verificação      | verificação/upload     | harness       |
| `/admin/`                         | Admin             | staff permitido     | Visão geral             | painéis atuais         | harness roles |
| `/admin/auras`                    | Admin             | admin/super         | Auras                   | DecorationAdminPage    | contrato      |
| `/admin/avatar`                   | Admin             | super               | Avatar                  | catálogos/avatar-items | contrato      |
| `/admin/economia`                 | Admin             | admin/super         | Economia                | RPC/ledger atuais      | contrato      |
| `/admin/equipe-live`              | Admin             | admin/super         | Equipe da Live          | liveTeam atual         | contrato      |
| `/admin/fotos`                    | Admin             | admin/super         | Fotos                   | moderação/reparo       | contrato      |
| `/admin/fundos`                   | Admin             | admin/super         | Fundos                  | backgrounds atuais     | contrato      |
| `/admin/gradientes-nome`          | Admin             | admin/super         | Gradientes              | nameGradients atual    | contrato      |
| `/admin/molduras`                 | Admin             | admin/super         | Molduras                | DecorationAdminPage    | contrato      |
| `/admin/pets`                     | Admin             | admin/super         | Pets                    | petCatalog/pets        | contrato      |
| `/admin/presentes`                | Admin             | guard atual         | Presentes               | gift-images atual      | contrato      |
| `/admin/stickers`                 | Admin             | super               | Stickers                | stickers atuais        | contrato      |
| `/admin/verificacoes`             | Admin             | admin/super         | Verificações            | requests/profiles      | contrato      |
| `/api/photo-repair`               | API/server        | bearer autorizado   | API                     | repair atual           | teste         |
| `/api/verify-photo`               | API/server        | contrato atual      | API                     | verificação atual      | teste         |
| `/auth/forgot-password`           | Auth              | visitante           | Recuperar senha         | Supabase Auth          | estrutural    |
| `/auth/login`                     | Auth              | visitante           | Entrar                  | Supabase Auth          | estrutural    |
| `/auth/reset-password`            | Auth              | token               | Redefinir senha         | Supabase Auth          | estrutural    |
| `/auth/signup`                    | Auth              | visitante           | Criar conta             | Supabase Auth          | estrutural    |
| `/avatar/criar`                   | Native App        | aprovado            | Explorar/Criar avatar   | editor atual           | harness       |
| `/blog/`                          | Public            | público             | Blog                    | BLOG_POSTS             | estrutural    |
| `/blog/$slug`                     | Public            | público             | Artigo                  | BLOG_POSTS/loader      | estrutural    |
| `/conversas/`                     | Native App        | aprovado            | Conversas               | useConversationsList   | harness       |
| `/conversas/$matchId`             | Focused Messaging | participante        | Conversa                | chat privado atual     | harness       |
| `/conversas/comunidade`           | Focused Messaging | aprovado            | Chat geral              | chat/realtime atual    | harness       |
| `/noticias/`                      | Native App        | aprovado            | Comunidade/Notícias     | daily posts            | harness       |
| `/onboarding/`                    | Onboarding        | autenticado         | Onboarding              | fluxo atual            | estrutural    |
| `/onboarding/etapa-1`             | Onboarding        | autenticado         | Etapa 1                 | saves atuais           | estrutural    |
| `/onboarding/etapa-2`             | Onboarding        | autenticado         | Etapa 2                 | uploads/moderação      | estrutural    |
| `/presentes/`                     | Native App        | aprovado            | Explorar/Presentes      | gifts/economia         | harness       |
| `/pretendentes/`                  | Native App        | aprovado            | Explorar/Namoro         | query atual            | harness       |
| `/pretendentes/$id`               | Native App        | aprovado            | Explorar/Perfil         | perfil/actions atuais  | harness       |
| `/proposito/$matchId`             | Native App        | participante        | Conversas/Propósito     | commitment/realtime    | harness       |
| `/suporte/`                       | Native App        | autenticado         | Perfil/Suporte          | tickets atuais         | harness       |
| `/suporte/$id`                    | Native App        | autorizado          | Perfil/Chamado          | messages/realtime      | harness       |
| `/suporte/ajuda`                  | Native App        | autenticado/staff   | Perfil/Central de Ajuda | articles/RPC           | harness       |
| `/v2/`                            | V2 tombstone      | qualquer            | redirect `/inicio`      | nenhum runtime V2      | teste         |
| `/v2/$section`                    | V2 tombstone      | qualquer            | redirect mapeado        | nenhum runtime V2      | teste         |
| `/api/public/runtime-config`      | API/server        | público             | API                     | config sanitizada      | teste         |
| `/api/public/hooks/push-dispatch` | API/server        | assinatura atual    | API                     | dispatch atual         | teste         |

## Invariantes

- Nenhuma rota visual funcional fica sem shell.
- Admin nunca recebe bottom navigation; chat focado não recebe App Shell; páginas públicas não recebem navegação privada.
- APIs não montam UI; `/v2` não monta o visual rejeitado; unknown/404 permanece no PublicShell.
- Flag off preserva o chrome legado. Nenhuma migration, dependência, rota ou backend foi criada.
