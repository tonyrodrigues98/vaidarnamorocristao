# V2-009C — Onboarding comunitário e Namoro opt-in

## Objetivo

Separar a entrada na comunidade da participação romântica. O cadastro
comunitário coleta identidade pública, maioridade, foto, localização,
apresentação e contexto de fé. Sexo, estado civil, altura e preferências
românticas pertencem exclusivamente ao fluxo separado de Namoro.

Esta fatia é empilhada sobre a identidade canônica da V2-009A e a aquisição
pública da V2-009B. A migration é aditiva e permanece **não aplicada** até
snapshot autenticado, backup, ambiente descartável e autorização de rollout.

## Contratos de produto

- criar conta ou concluir o perfil comunitário não cria
  `dating_memberships`;
- o Namoro começa `inactive`;
- a ativação exige perfil comunitário aprovado, formulário romântico completo
  e confirmação explícita;
- `receive_anonymous` começa `false` e só pode ser ligado no fluxo romântico;
- pausar ou desativar Namoro não desativa a conta comunitária;
- desativar não apaga preferências, matches, mensagens ou históricos;
- encerrar/pausar não causa reativação automática;
- a rota antiga `/onboarding/etapa-2` só redireciona para o novo fluxo quando a
  Comunidade V2 está ativa; o fallback legado permanece intacto com flags
  desligadas.

## Fluxo comunitário

`CommunityOnboardingFlow` possui sete etapas versionadas:

1. `identity`;
2. `birth`;
3. `photo`;
4. `location`;
5. `introduction`;
6. `faith`;
7. `privacy`.

O progresso é salvo em `community_onboarding_progress`, isolado por RLS ao
próprio usuário. A chave é `user_id`, portanto salvamentos são idempotentes e
uma sessão retomada usa a etapa e as respostas da versão
`community_onboarding_v1`. Versões incompatíveis não são interpretadas
silenciosamente.

A foto é normalizada, enviada à verificação existente e o upload falha fechado
quando a moderação técnica falha. Mesmo quando o verificador do cliente aprova,
o RPC de conclusão grava `avatar_ai_verified = false`: o cliente não concede
aprovação administrativa. Perfis novos entram como `pending`; perfis existentes
preservam o status atual.

## Contrato persistido

A migration local `20260723000004_v2_community_onboarding_dating_opt_in.sql`:

- torna apenas `profiles.sex` e `profiles.marital` anuláveis, preservando
  valores históricos;
- adiciona versão e conclusão do onboarding comunitário a `profiles`;
- cria progresso comunitário owner-only;
- cria `dating_memberships` owner-read, sem escrita direta autenticada;
- cria `complete_community_onboarding`, com identidade derivada de
  `auth.uid()`, validação server-side e sem qualquer escrita em Namoro;
- cria `activate_dating_membership`, `pause_dating_membership` e
  `deactivate_dating_membership`;
- prepara `stage_legacy_dating_memberships`, uma função idempotente, em lotes,
  exclusiva de `service_role` e nunca executada automaticamente;
- concede execução apenas a `authenticated` e revoga `PUBLIC`/`anon`.

O browser nunca fornece `user_id` às RPCs de conclusão ou Namoro. O argumento
visual `userId` é usado somente pelo adapter de progresso e Storage; RLS e
`auth.uid()` continuam sendo a autoridade.

## Ativação romântica

`/onboarding/namoro` existe somente quando `VITE_FF_V2_DATING` é exatamente
`true`. A rota reutiliza `AuthProvider`, exige perfil aprovado e monta
`DatingOptInFlow` com um adapter estreito. O componente não importa Supabase,
Auth, router, sessão ou ambiente.

O RPC valida:

- usuário autenticado e perfil aprovado, não desativado e sem exclusão
  pendente;
- sexo e estado civil nos enums preservados;
- altura entre 120 e 230 cm;
- faixa etária entre 18 e 110;
- escopo geográfico e estados personalizados;
- comprimentos de textos;
- versão do questionário.

Preferências românticas existentes são atualizadas, não apagadas. A configuração
de recados anônimos é sincronizada com o opt-in explícito. A desativação força
recados anônimos para `false`.

### Usuários históricos

Novos usuários permanecem `inactive`. Para não desligar silenciosamente quem já
participava do produto anterior, o contrato também representa:

- `legacy_active_pending_confirmation`: experiência vigente temporariamente
  preservada, com solicitação de confirmação;
- `paused_by_commitment`: Propósito Firmado ativo pausa apenas Namoro;
- `restricted`: sanção que não pode ser removida pelo frontend.

O backfill **não roda na migration**. A função de staging exige um cutoff
operacional explícito, processa somente perfis anteriores ao cutoff que estejam
aprovados e possuam os campos e preferências legados completos, preserva a
configuração existente de recados e identifica compromissos ativos. Somente
`service_role` pode executá-la. O cutoff, a elegibilidade e os resultados devem
ser reconciliados em snapshot/ambiente descartável antes de qualquer execução
autorizada.

## Identidade e capabilities

`AuthProvider` consulta `dating_memberships` somente quando a flag pública de
Namoro está ativa. Com a flag desligada, o estado permanece `inactive` sem
consulta adicional. Com a flag ligada, erro de leitura produz
`recoverable-error` e fecha capabilities privadas; ausência de linha significa
`inactive`. `active` e o estado transitório legado concedem `dating:enter`;
`paused`, compromisso e restrição permanecem fechados.

Esse comportamento permite manter o runtime atual intacto enquanto a migration
não foi aplicada e também impede inferência de consentimento por dados
históricos.

## Estados, acessibilidade e privacidade

- restauração, upload, salvamento, revisão, erro e conclusão possuem estados
  explícitos;
- labels reais, `progressbar`, mensagens `role=alert`, foco visível e alvos de
  toque do Design System V2;
- inputs usam o contrato de 16 px do Design System;
- safe areas e layout mobile-first;
- nenhuma sessão, token, e-mail, telefone ou cliente Supabase atravessa a
  fronteira visual;
- logs do adapter são categóricos e não incluem PII ou detalhes internos.

## Rollout e verificação

Ordem obrigatória:

1. capturar snapshot autenticado e reconciliar nullability/constraints;
2. restaurar backup em Supabase descartável;
3. aplicar a migration no descartável;
4. executar testes RLS/RPC por papel, concorrência e rollback;
5. validar perfis antigos, preferências, recados e status sem perda semântica;
6. definir o cutoff, executar o staging em lotes no descartável e reconciliar;
7. publicar código com as flags desligadas;
8. habilitar Comunidade para coorte interna;
9. habilitar Namoro separadamente somente após validar a RPC e a observabilidade.

Nenhuma etapa deste documento foi executada no Supabase publicado.

## Testes

- `community-onboarding-v2.test.ts`: etapas, maioridade, retomada, RLS,
  nullability e ausência de ativação romântica;
- `dating-opt-in-v2.test.ts`: consentimento explícito, recados desligados,
  autoridade das RPCs, pausa/desativação e carregamento fail-closed;
- `onboarding-integration-v2.test.tsx`: import SSR-safe e fronteiras sem sessão,
  token ou chamada antecipada.

## Riscos e limitações

- os tipos TypeScript refletem a migration proposta, não o banco publicado;
- sem ambiente descartável, grants, constraints, RLS e comportamento das RPCs
  não estão confirmados no estado publicado;
- a verificação de foto existente depende de serviço externo e rate limit
  distribuído ainda é gate operacional;
- o salvamento de progresso e o upload ocorrem antes da conclusão atômica; um
  upload não concluído pode exigir coleta futura de objetos sem referência;
- o formulário usa os enums românticos atuais e não altera silenciosamente
  regras de elegibilidade.

## Rollback

Antes de ativar flags, o rollback do código é a reversão do commit. Se a
migration tiver sido aplicada em rollout autorizado, desligar as flags restaura
o caminho legado sem apagar as tabelas ou colunas expandidas. A contração física
fica proibida até estabilização e reconciliação; nenhum rollback apaga
progresso, preferências ou memberships legítimas.
