# V2-002 — Autenticação, sessão e proteção de rotas

## 1. Marco e limites

- Branch: `rebuild/v2-002-auth-session-routing`
- Base imutável: `57fef3febc6006ea510ac80bdfb19f18b60c3618`
- V2-001 preservada: `rebuild/community-platform-v2` em
  `c3ffa967560fd56250fafe91924db8a5452a71c1`
- Escopo: infraestrutura de autenticação, sessão, deep links, fronteira de
  rotas e isolamento de cache.
- Fora do escopo: aparência, App Shell V2, funcionalidades comunitárias,
  migrations, schema, RLS, Supabase publicado, secrets, Vault, cron, Jobs e
  deploy.

`src/routeTree.gen.ts` continua sendo um artefato gerado e não pode ser editado
manualmente.

## 2. Auditoria do estado anterior

### 2.1 Autenticação e sessão

| Responsabilidade | Implementação encontrada              | Risco anterior                                                         |
| ---------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Cliente Supabase | `src/integrations/supabase/client.ts` | configuração correta de persistência, porém sem coordenar consumidores |
| Estado global    | `src/lib/auth.tsx`                    | `getSession` lento podia sobrescrever evento mais novo                 |
| Subscription     | `onAuthStateChange` em `AuthProvider` | uma subscription, mas sem precedência temporal                         |
| Login            | `src/routes/auth/login.tsx`           | chamada direta e destino fixo `/inicio`                                |
| Cadastro         | `src/routes/auth/signup.tsx`          | chamada direta; segue para onboarding                                  |
| Recuperação      | `src/routes/auth/forgot-password.tsx` | fluxo público por email                                                |
| Redefinição      | `src/routes/auth/reset-password.tsx`  | precisa continuar pública mesmo com sessão de recovery                 |
| Logout           | `AuthProvider.signOut`                | aguardava o servidor antes de invalidar o estado local                 |
| Papéis/perfil    | queries de `user_roles` e `profiles`  | respostas antigas podiam atualizar outro usuário                       |
| Perfil excluído  | canal `profile-self-delete-{uid}`     | preservado, agora vinculado ao usuário canônico                        |

O cliente mantém `persistSession: true` e `autoRefreshToken: true`. Esta etapa não
altera essas configurações.

Chamadas pontuais de `getSession` permanecem em
`src/integrations/supabase/auth-attacher.ts`, `src/lib/verifyPhoto.ts` e
`src/routes/admin/fotos.tsx`. Elas obtêm credencial no momento de uma operação e
não criam uma segunda fonte reativa de verdade.

### 2.2 Redirects e proteções legadas

Foram encontrados redirects locais com `Navigate`, `navigate()`,
`window.location.href` e verificações duplicadas de `user/loading`. A remoção em
massa é insegura nesta etapa. A fronteira compartilhada impede que páginas
privadas sejam montadas antes da sessão; assim, os guards locais deixam de
concorrer no primeiro acesso e permanecem como compatibilidade.

Proteções preservadas:

- `RequireApproved`: aprovação/onboarding;
- `BanGuard`: banimento e rejeição;
- checks de `role`, `isAdmin`, `super_admin` e permissões específicas nas telas
  administrativas;
- `AuthenticatedRouteGate` de `/inicio`, incluindo o single-flight criado na
  V2-001.

Autenticação não concede papel, não substitui as verificações administrativas e
não substitui RLS.

### 2.3 Providers e dados privados

Antes da V2-002, `PresenceProvider`, `NotificationsBridge` e `BanGuard` eram
montados no root antes da resolução da sessão. Presence abre Realtime e chama
`touch_my_activity`; Notifications cria subscriptions e consultas privadas.

Agora esses consumidores só montam com `status === "authenticated"` e `user`
presente. Conteúdo público continua disponível sem eles. `QueryClientProvider`,
tema, banners de rede/PWA e Toaster não dependem de dados privados e permanecem
no nível compartilhado.

## 3. Estado canônico

O contrato de `AuthProvider` expõe:

- `status`: `initializing`, `authenticated`, `unauthenticated` ou
  `recoverable-error`;
- `session` e `user`;
- erro de restauração sanitizado;
- `initialResolutionFinished`;
- compatibilidade `loading`;
- ações de login e logout;
- papéis, status do perfil e suas flags legadas, carregados separadamente.

### 3.1 Ordem de inicialização

1. registrar uma única subscription de `onAuthStateChange`;
2. capturar a revisão atual dos eventos;
3. iniciar uma única chamada `getSession`;
4. aplicar `getSession` somente se nenhum evento ocorreu desde a captura;
5. cancelar atualizações e remover a subscription no unmount.

Um evento sempre incrementa a revisão. Portanto, login, logout, expiração ou
troca de usuário ocorridos antes do término de `getSession` prevalecem. Refresh
de token do mesmo usuário atualiza a sessão sem reiniciar a carga de papéis nem
desmontar a área privada.

Erros de restauração produzem apenas `session_restore_failed` e uma mensagem
genérica. Tokens, sessão, email, telefone e detalhes internos não são
registrados.

### 3.2 Papéis e perfil

Papéis e `profiles.status` possuem geração própria por usuário. Logout ou troca
de identidade:

1. invalida a geração anterior;
2. retorna autorizações locais aos valores mínimos;
3. ignora qualquer resposta tardia vinculada ao usuário anterior;
4. inicia nova carga somente para o usuário canônico atual.

`rolesLoaded` não participa da resolução da sessão. Assim, profile loading não
é confundido com ausência de autenticação.

## 4. Matriz de rotas

| Classe                     | Rotas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Fronteira compartilhada                                             | Proteção adicional                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| Pública                    | `/`, `/como-funciona`, `/sobre`, `/depoimentos`, `/blog`, `/blog/$slug`, `/termos`, `/manual`, `/instalar`, `/auth/reset-password`                                                                                                                                                                                                                                                                                                                                                           | sempre monta                                                        | regras próprias do fluxo quando existentes                    |
| Exclusiva para visitante   | `/auth/login`, `/auth/signup`, `/auth/forgot-password`                                                                                                                                                                                                                                                                                                                                                                                                                                       | visitante monta; autenticado retorna ao destino seguro ou `/inicio` | validação de formulário existente                             |
| Autenticada                | `/inicio`, `/avatar`, `/avatar/criar`, `/bloqueados`, `/caixas`, `/comunidade`, `/conquistas`, `/conta`, `/dashboard`, `/devocional`, `/interesses`, `/loja`, `/matches`, `/meu-pet`, `/noticias`, `/notificacoes`, `/oracoes`, `/perfil`, `/pet-arcade`, `/presentes`, `/pretendentes`, `/pretendentes/$id`, `/proposito/$matchId`, `/quiz-biblico`, `/recados`, `/verificacao`, `/conversas`, `/conversas/$matchId`, `/conversas/comunidade`, `/suporte`, `/suporte/$id`, `/suporte/ajuda` | espera sessão; autenticado monta; visitante redireciona uma vez     | guards legados específicos preservados                        |
| Autenticada com onboarding | `/onboarding`, `/onboarding/etapa-1`, `/onboarding/etapa-2`                                                                                                                                                                                                                                                                                                                                                                                                                                  | exige sessão                                                        | regras e redirects de etapas preservados                      |
| Administrativa             | `/admin` e todas as rotas `/admin/*`                                                                                                                                                                                                                                                                                                                                                                                                                                                         | exige sessão, sem conceder papel                                    | checks atuais de Admin, super_admin, moderador e apresentador |
| Endpoint server-side       | `/api/public/hooks/push-dispatch`, `/api/verify-photo`, `/api/photo-repair`                                                                                                                                                                                                                                                                                                                                                                                                                  | nunca tratado como página                                           | contrato próprio do endpoint, RLS ou autenticação server-side |

Rotas desconhecidas são classificadas como autenticadas por padrão
(`fail closed`). O not-found público conhecido continua sendo responsabilidade
do router; esta escolha deverá ser revisitada quando a árvore V2 adotar metadados
de acesso por rota.

## 5. Contrato de deep link

Ao bloquear uma rota privada, a fronteira cria:

`/auth/login?returnTo=<caminho-interno-codificado>`

O destino aceito:

- começa com uma única `/`;
- é resolvido contra origem fixa e permanece same-origin;
- preserva query string e hash;
- tem até 2.048 caracteres;
- não contém barra invertida nem caracteres de controle;
- não é URL absoluta, `//host`, esquema, endpoint `/api/*` ou rota `/auth/*`.

Destino ausente, malformado ou recursivo retorna para `/inicio`. Login por senha
é consumido pela fronteira canônica após o evento de sessão. O redirect OAuth
existente ainda usa `/inicio`; transportar `returnTo` pelo callback OAuth fica
pendente para uma etapa específica, pois exige validar o estado do provedor.

## 6. Isolamento de cache

Toda troca de `user.id`, incluindo logout, executa:

1. cancelamento de queries em andamento;
2. remoção de queries privadas;
3. limpeza de mutations armazenadas;
4. invalidação das cargas de papel/perfil do usuário anterior;
5. desmontagem dos providers privados.

A auditoria não encontrou nenhuma query TanStack cuja chave e resposta fossem
comprovadamente públicas e independentes da sessão/RLS. Por isso, a allowlist
pública começa vazia e explícita. Ela só deverá crescer com contrato e teste de
dados públicos. Isso evita reutilizar saldo, perfil, inventário, pets, Admin ou
catálogo resolvido sob o contexto do usuário anterior.

Promessas Supabase disparadas por efeitos legados nem sempre aceitam
cancelamento físico. A fronteira impede novos mounts e os módulos canônicos
ignoram respostas antigas; a extração gradual desses efeitos para queries
abortáveis continua pendente.

## 7. Responsabilidades de segurança

| Camada               | Responsabilidade                                                       |
| -------------------- | ---------------------------------------------------------------------- |
| Autenticação         | provar e restaurar sessão; invalidar imediatamente em logout/expiração |
| Onboarding/aprovação | decidir completude e acesso funcional após autenticação                |
| Banimento            | limitar rotas conforme `profiles.status`                               |
| Admin                | validar papel/permissão existente para cada função                     |
| Feature flags        | habilitar código de produto; nunca conceder acesso                     |
| RLS                  | autorização final de leitura/escrita no banco                          |

Nenhuma chave `service_role` é usada no navegador. Nenhum segredo foi adicionado,
e nenhuma variável `VITE_*` foi criada para autenticação privilegiada.

## 8. Testes e rollback

Testes determinísticos cobrem restauração com e sem sessão, precedência de
eventos, resultados antigos, eventos duplicados, refresh, login, logout,
expiração, troca de usuário, cleanup/unmount, erro sanitizado, matriz de rotas,
deep links, montagem tardia de providers e limpeza de cache.

Rollback do PR:

1. reverter o commit da V2-002;
2. restaurar `AuthProvider`, root e login ao estado da base;
3. remover módulos e testes V2-002.

Não há rollback de banco ou de ambiente porque esta etapa não altera dados,
schema, migrations, policies, secrets, Jobs ou deploy.

## 9. Limitações pendentes

- redirects locais legados ainda existem, embora não concorram antes da
  fronteira compartilhada;
- OAuth ainda retorna ao fallback `/inicio`;
- carregamentos Supabase legados fora do TanStack Query podem não ser
  fisicamente abortáveis;
- autorização administrativa continua distribuída nas telas atuais;
- testes integrados de RLS/chat/moderação exigem Supabase descartável e não
  podem usar produção;
- a árvore de rotas ainda não declara metadados de acesso junto a cada arquivo;
- erro recuperável de restauração mantém conteúdo privado fechado e exige nova
  tentativa/reload; uma superfície visual de retry pertence a etapa posterior.
