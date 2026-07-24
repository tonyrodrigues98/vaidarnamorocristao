# Matriz final de paridade V2

## Legenda

- **Revisável:** código, contratos e testes locais concluídos;
- **Bloqueado externo:** depende de migration, ambiente, dados, direitos ou
  operação;
- **Paridade não provada:** não pode substituir o legado;
- **Futuro:** deliberadamente fora do primeiro release.

## Matriz

| Sistema                        | Legado preservado                                          | V2 entregue                                                         | Dados/permissões                                             | Offline/mobile/a11y/perf                         | Telemetria/rollback                  | Status                                     |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------ | ------------------------------------------ |
| Auth/Conta                     | AuthProvider, cadastro, recuperação e sessão               | estado canônico, route gate, cache isolado e Conta modular          | Auth/RLS continuam autoridade; shell não recebe sessão/token | loading sem flash, deep link seguro, responsivo  | logout limpa estado; fallback legado | Revisável; E2E externo pendente            |
| Onboarding                     | perguntas e perfil atuais                                  | onboarding comunitário e opt-in de Namoro separados                 | migration aditiva não aplicada; Namoro default off           | mobile/a11y testados localmente                  | flags e retorno ao legado            | Bloqueado externo                          |
| Início/Dashboard               | `/inicio` e `/dashboard` distintos                         | Início social, conexões e Status 24 h                               | repositories/RLS propostos, migration não aplicada           | estados e budget cobertos                        | flag e fallback                      | Bloqueado externo                          |
| Comunidade                     | chat global e conteúdos mantidos                           | espaços, posts, comentários, reações e eventos                      | migration/RLS não ensaiadas                                  | shell responsivo, loading/erro                   | flag por domínio                     | Bloqueado externo                          |
| Conversas                      | conversas e mensagens intactas                             | threads/contexto, paginação e comandos idempotentes                 | migration, RLS e Realtime não ensaiados                      | offline não inventa envio; UI responsiva         | adapter/fallback legado              | Paridade não provada                       |
| Perfil                         | perfil, fotos e decoração intactos                         | módulos, editor e visibilidade                                      | migration/RLS não ensaiadas; ownership preservado            | módulos responsivos e acessíveis                 | flag e rota antiga                   | Bloqueado externo                          |
| Namoro                         | Pretendentes, interesses, matches e elegibilidade intactos | membership/preferências/descoberta opt-in                           | regras atuais preservadas; migration não aplicada            | Namoro invisível quando off                      | retirada antiga exige 5 provas       | Paridade não provada                       |
| Propósito/recados              | histórico, mensagens e compromisso intactos                | contexto romântico, opt-in de recados e presentes                   | migration não aplicada; elegibilidade server-side            | estados mobile/a11y                              | não reativa Namoro; fallback         | Bloqueado externo                          |
| Economia/Loja/inventário       | ledger, saldo, itens, compras e ownership intactos         | authority commands, loja e inventário modular                       | migration/RPC não ensaiadas; frontend não concede valor      | mutation offline bloqueada                       | idempotência/reconciliação           | Paridade não provada                       |
| Pets/jogos                     | ambos `user_pets`, 17 jogos e progresso mantidos           | Pet hub, cuidado server-authoritative e catálogo lazy               | migration não aplicada; estruturas não consolidadas          | arcade lazy; offline fechado                     | flags e runtime legado               | Bloqueado externo; lista de jogos pendente |
| Conteúdo/Verbo                 | devocional, oração, quiz, blog e notícias mantidos         | Verbo, notas privadas e leitor lazy                                 | migration não aplicada; fonte bíblica não incluída           | leitor responsivo; offline fechado               | flag e fallback                      | Bloqueado por licença/editorial            |
| Cinema                         | nenhum backend/mídia legado substituído                    | catálogo, sessão sincronizada, papéis, drift e chat reutilizado     | migration não aplicada; upload/CDN fechados                  | player responsivo; offline bloqueado             | kill switch e sessão                 | Bloqueado jurídico/infra                   |
| Notificações/moderação/suporte | inbox, push, blocks, reports e tickets intactos            | central unificada, preferências e trust center                      | migration não aplicada; push protegido                       | cache seguro; deep links same-origin             | fila/lease/retry; fallback           | Bloqueado externo                          |
| Admin                          | monólito e permissões legadas intactos                     | console modular lazy e métricas sem PII                             | capability `admin:enter`; migration não aplicada             | responsivo/a11y local                            | actions auditáveis; fallback         | Bloqueado por matriz/RLS externa           |
| PWA                            | instalação, SW e push preservados                          | update explícito, cache público/privado, cleanup e policies offline | nenhuma mutation offline sem idempotência                    | budgets, safe area, 16 px, 44 px, reduced motion | update/rollback explícitos           | Revisável; dispositivos reais pendentes    |

## Retirada do legado

O índice antigo de Pretendentes e o avatar-personagem permanecem ativos por
padrão. A V2-023 fornece gates, mas o artefato V2-024 registra:

- paridade e telemetria não comprovadas;
- owner snapshot indisponível;
- compensação sem decisão;
- zero item seguro para remoção;
- contração física proibida.

Rotas de detalhe, histórico, dados românticos, fotos, ownership e inventários
permanecem protegidos.

## Funcionalidades futuras

- grupos/experiências além do núcleo entregue;
- expansão editorial completa do Verbo;
- upload/CDN real e catálogo licenciado do Cinema;
- contração física do legado;
- remoção de jogos após lista do usuário;
- default V2 e remoção do prefixo `/v2`;
- telemetria operacional completa.

## Critério de paridade

Uma linha só muda para “paridade provada” depois de migrations ensaiadas,
RLS/RPC/Realtime/E2E aprovados, reconciliação sem `FAIL`, dispositivos reais,
observabilidade e rollback demonstrado. Existência de UI ou mock não é prova.
