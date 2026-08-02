# Roadmap executável — V2-007 a V2-025

Este roadmap transforma o plano documental em lotes autônomos. A numeração é
um mecanismo de coordenação, não autorização para ignorar o estado real.

## Regras de sequência

- Não refazer lote já concluído.
- Reordenar somente quando dependências técnicas reais exigirem.
- Não eliminar escopo por reordenação.
- Um lote pode ser dividido em vários Draft PRs.
- PRs podem ser empilhados.
- Nenhum PR é mesclado automaticamente.
- Lotes de dados podem preparar migration, fixture, teste e runbook sem aplicar
  nada em produção.
- Quando faltar decisão externa, concluir a fundação neutra e isolar o gate.

## Visão geral

| Lote   | Objetivo                              | Depende de                        | Saída mínima                                                         |
| ------ | ------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| V2-007 | Conta e configurações                 | fundação V2 e auditoria           | domínio, adapter, rota, cache/deep links seguros                     |
| V2-008 | segurança e verdade publicada         | auditoria + acesso disponível     | snapshot, testes RLS/RPC, hardening proposto/implementado localmente |
| V2-009 | aquisição, identidade e onboarding    | Conta + capabilities              | entrada community-first e namoro opt-in                              |
| V2-010 | Início, vínculos e Status             | identidade/perfil base            | hub social, social graph e status 24 h                               |
| V2-011 | Comunidade                            | vínculos + moderação base         | hub, descoberta, espaços/grupos/eventos                              |
| V2-012 | Conversas                             | identidade + capabilities         | inbox contextual e núcleo confiável                                  |
| V2-013 | Perfil modular                        | inventário adapter + social state | perfil expressivo e editor lateral                                   |
| V2-014 | Modo Namoro                           | identidade + conversas + perfil   | opt-in, descoberta, interesse e match                                |
| V2-015 | Propósito e recados                   | namoro + conversas                | casal, pausa romântica e recados opt-in                              |
| V2-016 | economia, Loja e inventário           | segurança RPC + perfil contracts  | ledger/ownership e UX redesenhada                                    |
| V2-017 | pets e jogos                          | economia/inventário               | adapters, redesign e classificação sem remoção                       |
| V2-018 | conteúdo e Verbo                      | identidade + PWA base             | hub cristão e subproduto de estudo                                   |
| V2-019 | Cinema                                | comunidade + conversas + mídia    | spike, MVP e operação de watch party                                 |
| V2-020 | notificações, confiança e suporte     | eventos dos domínios              | central, moderação e suporte contextual                              |
| V2-021 | Administração e métricas              | capabilities + domínios estáveis  | console modular e observabilidade                                    |
| V2-022 | PWA, offline, performance e a11y      | superfícies V2 principais         | hardening transversal e budgets                                      |
| V2-023 | retirada lógica do legado             | paridade e telemetria             | flags, redirects e quarentena                                        |
| V2-024 | reconciliação e contração autorizável | snapshots/backups/gates           | manifests, dry-runs e proposta destrutiva                            |
| V2-025 | convergência e release                | todos os lotes                    | matriz final, rollout, rollback e readiness                          |

## V2-007 — Configurações/Conta

Escopo detalhado em `lotes/V2-007_CONFIGURACOES_CONTA.md`.

Gate de saída:

- rota V2 funcional;
- adapters para as quatro RPCs/contratos atuais;
- sessão/cache por usuário;
- deep links same-origin/allowlist;
- estados universais;
- compatibilidade com rota antiga;
- testes de mutation/autorização;
- Draft PR.

## V2-008 — Segurança e verdade publicada

Gate de saída:

- diferenças entre HEAD, tipos, migrations e produção classificadas;
- snapshot autenticado somente leitura quando acesso existir;
- P0/P1 confirmados, refutados ou tratados;
- grants, RLS, RPCs, `SECURITY DEFINER`, Realtime, Storage e funções server
  cobertos por teste;
- migrations de hardening preparadas e validadas em ambiente descartável;
- nenhum acesso/mutation de produção sem gate.

Pode avançar em paralelo com trabalho frontend que não muda dados.

## V2-009 — Aquisição, identidade e onboarding

Gate de saída:

- landing e página pública apresentam comunidade primeiro;
- live/eventos existentes preservados;
- Auth não foi reescrita sem necessidade;
- capabilities substituem guards duplicados;
- onboarding mínimo cria perfil comunitário;
- trilha romântica é opcional, retomável e reversível;
- usuários existentes mantêm IDs e dados;
- namoro não é ativado automaticamente.

## V2-010 — Início, vínculos sociais e Status

Gate de saída:

- `/inicio` e `/dashboard` seguem distintos;
- feed e agregadores têm adapters claros;
- vínculo social não usa match;
- privacidade/bloqueio funcionam;
- Status expira, pode ser removido e moderado;
- mídia e viewers respeitam RLS;
- estados mobile/offline/performance.

## V2-011 — Comunidade

Gate de saída:

- Comunidade funciona sem Namoro;
- chat global é um componente, não toda a Comunidade;
- espaços/grupos/eventos têm memberships e capacidades;
- descoberta social respeita bloqueio, privacidade e moderação;
- canais Realtime têm ciclo de vida controlado;
- feature flag e rollback.

## V2-012 — Conversas

Gate de saída:

- inbox separa contextos;
- política de participação é fornecida por domínio;
- envio otimista usa `client_message_id`/idempotência;
- ordem total estável;
- retry não duplica;
- reconnect/realtime não perde nem repete;
- paginação, read receipts, anexos e busca;
- teclado mobile e cache privado;
- mensagens históricas preservadas.

## V2-013 — Perfil modular

Gate de saída:

- identidade comunitária e romântica são renderizações contextuais;
- vitrines usam dados reais;
- ordem, privacidade e preview funcionam;
- inventário é validado antes de equipar;
- perfil mobile e desktop;
- decoração não quebra contraste;
- avatar-personagem não é reintroduzido.

## V2-014 — Modo Namoro

Gate de saída:

- estados `inactive`, `active`, `paused`, `committed`, `restricted`;
- ativação/pausa/saída explícitas;
- zero romance visível quando inativo;
- descoberta, interesse e match preservam motor legítimo;
- bloqueios/elegibilidade server-side;
- links antigos compatíveis;
- dados antigos preservados.

## V2-015 — Propósito Firmado, recados e presentes

Gate de saída:

- Propósito usa transições explícitas e auditáveis;
- aceitar compromisso não remove comunidade;
- terminar não reativa Namoro;
- conversas sociais continuam;
- recados exigem Namoro ativo + opt-in do destinatário;
- limites, denúncias e revelação são seguros;
- presente declara contexto sem duplicar economia.

## V2-016 — Economia, Loja e inventário

Gate de saída:

- saldo e XP não aceitam valores arbitrários;
- ledger e saldo reconciliam;
- compra e entrega são atômicas/idempotentes;
- propriedade e equipamento não se confundem;
- Loja, inventário, presentes, caixas e decorações usam adapters;
- nenhum item legítimo desaparece;
- concurrency e replay testados.

## V2-017 — Pets, Arcade, caixas e jogos

Gate de saída:

- V1/V2 caracterizados e isolados;
- cuidado/tempo/progressão reproduzíveis;
- rewards passam pela Economia;
- assets carregam sob demanda;
- cada jogo recebe classificação provisória;
- nenhum jogo, progresso ou asset é removido;
- admin mantém catálogos e operações.

## V2-018 — Conteúdo cristão e Verbo

Gate de saída:

- contratos de conteúdo separam autoria, publicação e distribuição;
- devocional, orações, quiz, notícias e blog preservados;
- Verbo usa mesma identidade e dados privados;
- leitura, pesquisa, favoritos, marcações, notas e estudos funcionam;
- offline/sync têm limites claros;
- desafios bíblicos ensinam sem ranking espiritual.

## V2-019 — Sala de Cinema

Gate de saída do trabalho que não depende de decisão jurídica:

- arquitetura de upload/processamento/streaming;
- state machine de sessão e sync;
- papéis e permissões;
- catálogo, eventos, histórico e modo casal;
- player e chat mobile;
- moderação e recuperação;
- orçamento de Storage/CDN;
- spike e MVP atrás de flag.

Ativação pública depende de política legal, retenção, conteúdo e custo.

## V2-020 — Notificações, confiança, moderação e suporte

Gate de saída:

- eventos e entrega separados;
- preferências por categoria/canal;
- deep links seguros;
- payload sensível neutro;
- verificação não é fail-open;
- bloqueio/silêncio/denúncia distintos;
- evidência preservada;
- suporte mantém histórico e anexos.

## V2-021 — Administração e métricas

Gate de saída:

- console por capability;
- rotas e módulos revisáveis;
- filtros persistentes, busca, estados e mobile;
- ações sensíveis com confirmação/motivo/auditoria;
- métricas de saúde, fila e anomalia;
- nenhum poder legítimo perdido;
- nenhuma permissão apenas visual.

## V2-022 — PWA, offline, performance e acessibilidade

Gate de saída:

- caches privados particionados;
- logout/troca de usuário limpos;
- update de bundle controlado;
- outbox somente para ações idempotentes;
- budgets por rota;
- lazy loading de admin/pets/jogos/Cinema;
- WCAG, reduced motion, teclado, foco, safe area e iOS;
- matriz de dispositivos e conectividade.

## V2-023 — Retirada lógica do legado

Gate de saída:

- telemetria prova uso/paridade;
- Pretendentes antigo tem substituto e redirects;
- avatar-personagem sem novas aquisições e fora da navegação;
- candidatos órfãos reavaliados com runtime/build/telemetria;
- dados permanecem intactos;
- reativação por flag possível.

## V2-024 — Reconciliação e contração autorizável

Gate de saída:

- backup e restore testado;
- manifests sem PII;
- zero leitor/escritor do legado;
- owners e impacto financeiro reconciliados;
- compensação proposta, nunca inventada;
- SQL destrutivo separado, revisável e não aplicado;
- rollback/forward-fix ensaiado;
- lista objetiva de decisões de Antonio.

## V2-025 — Convergência e preparação de release

Gate de saída:

- matriz de rotas e flags final;
- suíte completa;
- segurança e bundle;
- migrações em estados conhecidos;
- documentação operacional;
- observabilidade e alertas;
- plano de coortes;
- rollback por domínio;
- pendências externas explícitas;
- nenhum merge/deploy automático.

## Dependências que não podem ser invertidas

- segurança/verdade de dados antes de mutation estrutural;
- capabilities antes de Admin modular e fluxos sensíveis;
- identidade comunitária antes de Namoro opt-in;
- social graph antes de descoberta comunitária madura;
- políticas de participação antes do novo chat por contexto;
- economia antes de redesenhar rewards;
- inventário antes de Perfil equipável;
- Comunidade + Conversas antes de Cinema social;
- paridade antes de retirada lógica;
- reconciliação/restore antes de contração física.
