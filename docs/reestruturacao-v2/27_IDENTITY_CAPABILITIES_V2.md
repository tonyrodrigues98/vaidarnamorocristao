# V2-009A — Identidade, papéis e capabilities

## Objetivo

Esta primeira fatia da V2-009 consolida um contrato canônico de identidade e
acesso para novas superfícies. Ela não redesenha cadastro, não muda RLS, não
ativa Namoro e não remove os guards legados.

O contrato vive em `src/v2/platform/identity/` e é consumido pelo adapter estreito
do runtime V2. Componentes visuais continuam sem acesso ao cliente Supabase, à
sessão completa ou a credenciais.

## Fontes confirmadas

| Fato                                     | Fonte no código                                              |
| ---------------------------------------- | ------------------------------------------------------------ |
| sessão, login, logout e troca de usuário | `src/lib/auth.tsx` e `src/v2/app/auth/session-state.ts`      |
| papéis e prioridade                      | `src/lib/roles.ts` e `user_roles` nos tipos gerados          |
| aprovação                                | `profiles.status` nos tipos gerados                          |
| desativação e exclusão                   | `profiles.deactivated_at` e `profiles.deletion_requested_at` |
| termos                                   | RPC tipada `get_my_terms_status`                             |
| opt-in romântico canônico                | não existe no contrato publicado confirmado                  |

Migrations são apenas histórico. Nenhuma conclusão sobre RLS, grants ou estado
publicado foi adicionada por esta etapa.

## Estados canônicos

`accountStatus` distingue:

- `unauthenticated`;
- `resolving`;
- `unknown`, quando papéis ou perfil falham;
- `onboarding-required`;
- `pending-review`;
- `approved`;
- `rejected`;
- `banned`;
- `deactivated`;
- `deletion-pending`.

A precedência é conservadora: exclusão pendente supera desativação, que supera o
status de aprovação. Falha de resolução produz `unknown` e fecha capabilities
privadas, em vez de liberar conteúdo.

`primaryRole` reutiliza a prioridade atual:

1. `super_admin`;
2. `admin`;
3. `apresentador`;
4. `moderador`;
5. `user`.

Autenticação não concede Admin. `admin:enter` exige papel `admin` ou
`super_admin`; `moderation:enter` exige papel de moderação. Estado frontend não
substitui RLS nem autorização no servidor.

## Capabilities e domínios

| Domínio      | Capability            | Regra resumida                                     |
| ------------ | --------------------- | -------------------------------------------------- |
| `public`     | nenhuma               | sempre disponível                                  |
| `account`    | `account:manage`      | sessão autenticada                                 |
| `onboarding` | `onboarding:complete` | identidade resolvida e conta editável              |
| `community`  | `community:enter`     | aprovação efetiva e conta sem restrição            |
| `profile`    | `profile:view`        | identidade resolvida e conta editável              |
| `messaging`  | `messaging:use`       | mesma base segura da comunidade                    |
| `dating`     | `dating:enter`        | comunidade disponível **e** opt-in explícito ativo |
| `economy`    | `economy:use`         | mesma base segura da comunidade                    |
| `admin`      | `admin:enter`         | papel administrativo e conta operacional           |
| `moderation` | `moderation:enter`    | papel de moderação e conta operacional             |
| `support`    | `support:enter`       | agente de suporte/equipe e conta operacional       |

O método tipado `canEnter(domain)` é a interface canônica para novas rotas. A
lista `capabilities` é serializável, imutável e não contém ID, e-mail, telefone,
token ou objeto de sessão.

## Aprovação e restrição

`isApproved` preserva a compatibilidade histórica de equipe, mas
`isRestricted` continua prevalecendo no cálculo de capabilities. Assim, uma
conta de equipe banida ou desativada não recebe acesso apenas por ter um papel.

`RequireApproved` e `BanGuard` permanecem intactos para as rotas legadas. Eles
só poderão ser removidos após cada rota migrada usar a capability equivalente,
com testes e RLS confirmada.

## Termos e consentimentos

O AuthProvider lê `get_my_terms_status` depois da sessão. O resultado vira:

- `current`;
- `outdated`;
- `missing`;
- `unknown`.

Falha auxiliar na consulta de termos não bloqueia silenciosamente usuários
legados; ela permanece `unknown` e deverá ser tratada pela trilha de onboarding.
Termos não são inferidos de metadata ou da existência do perfil.

Consentimentos comunitários e românticos específicos ainda não possuem contrato
publicado confirmado. Eles serão adicionados de forma explícita na V2-009C.

## Namoro fechado por padrão

O `datingState` aceita `inactive`, `active`, `paused`, `committed`, `restricted`
e `unknown`. O default é sempre `inactive`.

O adapter atual fornece `inactive` porque não existe um campo canônico publicado
e verificado para o opt-in. Aprovação, perfil legado ou preferências antigas não
viram consentimento automaticamente. Portanto:

- `dating:enter` não é concedida por aprovação;
- Pretendentes é removido da navegação V2 sem a capability;
- uma URL V2 de domínio indisponível recebe estado genérico e não monta a área;
- as rotas legadas permanecem inalteradas até a migração dedicada.

## Ordem de inicialização e troca de usuário

1. `session-state` resolve a sessão canônica.
2. Mudança do ID autenticado limpa cache privado e publica identidade
   `resolving` imediatamente.
3. Papéis, perfil e termos são carregados para o ID atual.
4. Resultados atrasados são descartados pelo contador da requisição e pela
   comparação com o ID atual.
5. `rolesLoaded` só fica verdadeiro quando o snapshot pertence exatamente ao
   usuário autenticado atual.
6. Logout volta imediatamente ao snapshot não autenticado.

Isso fecha a janela em que um snapshot de autorização do usuário anterior
poderia ser observado durante uma troca de sessão.

## Integração do runtime

Cada descriptor em `src/v2/integration/route-registry.ts` declara
`requiredDomain`. O adapter:

- filtra navegação pela capability;
- valida a rota antes de montar seu conteúdo;
- mantém not-found localizado;
- não importa Supabase;
- não recebe o objeto completo de sessão.

O Design System e o App Shell continuam independentes de autenticação e dados.

## Testes

`identity-capabilities-v2.test.ts` cobre estados de conta, precedência do ciclo de
vida, papéis, separação Admin, falha fechada, termos, opt-in romântico e
navegação. `identity-integration-v2.test.ts` caracteriza a fronteira real do
AuthProvider e garante ausência de credenciais no contrato puro.

Os testes existentes de sessão continuam cobrindo precedência entre
`getSession` e `onAuthStateChange`, logout, expiração, refresh, troca de usuário e
cleanup.

## Limitações e próximos passos

- verdade publicada de roles/RLS/RPC ainda exige Supabase descartável;
- `termsStatus` é informativo nesta fatia;
- opt-in de Namoro depende de contrato de dados aditivo e não foi inventado;
- onboarding legado continua dating-first e será substituído na V2-009C;
- aquisição pública community-first será tratada na V2-009B;
- nenhum guard legado foi removido.

## Rollback

Reverter esta fatia remove o contrato e a filtragem do runtime V2. Como nenhuma
migration, escrita ou ativação de flag ocorre, o legado e seus dados permanecem
intactos. Não há rollback de banco.
