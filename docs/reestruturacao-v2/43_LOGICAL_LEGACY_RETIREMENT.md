# V2-023 — Retirada lógica e quarentena reversível

## Resultado

A etapa cria controles fail-closed para retirar duas superfícies legadas somente
depois de evidência explícita. No estado atual nenhuma retirada está ativa:
migrations V2 não foram aplicadas, reconciliação publicada e telemetria de
coorte não estão disponíveis e a compensação do avatar-personagem aguarda
decisão de Antonio.

Não houve remoção de rota, código, tabela, coluna, asset, ownership ou histórico.

## Superfícies controladas

| Superfície                                  | Comportamento depois de todos os gates                           | Compatibilidade preservada                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| índice `/pretendentes`                      | sai da navegação universal e redireciona para `/v2/pretendentes` | detalhes `/pretendentes/$id`, interesses, matches, mensagens, recados e propósito continuam legados |
| `/avatar`, `/avatar/criar`, `/admin/avatar` | exibe quarentena informativa e aponta para perfil/Admin          | implementação completa permanece no bundle para rollback                                            |

O avatar deste documento é somente o personagem composto por base, roupa, pose e
assets. Foto principal, `avatar_url` legítimo, galeria, moderação, molduras,
auras, fundos, presentes, stickers e `DecoratedAvatar` não pertencem à retirada.

## Gates

As flags são públicas de build, não concedem autorização e só aceitam o valor
exato `true`. Cada superfície exige a flag-mestre e todas as provas:

- Namoro: App Shell, substituto V2, paridade, telemetria e reconciliação;
- avatar-personagem: App Shell, Perfil e Personalização V2, paridade,
  inventário de owners, telemetria e compensação aprovada.

| Gate                     | Variável                                            |
| ------------------------ | --------------------------------------------------- |
| retirar índice antigo    | `VITE_FF_V2_RETIRE_LEGACY_DATING_INDEX`             |
| paridade do Namoro       | `VITE_FF_V2_LEGACY_DATING_PARITY_CONFIRMED`         |
| telemetria do Namoro     | `VITE_FF_V2_LEGACY_DATING_TELEMETRY_CONFIRMED`      |
| reconciliação do Namoro  | `VITE_FF_V2_LEGACY_DATING_DATA_RECONCILED`          |
| quarentena do personagem | `VITE_FF_V2_QUARANTINE_CHARACTER_AVATAR`            |
| paridade do personagem   | `VITE_FF_V2_CHARACTER_AVATAR_PARITY_CONFIRMED`      |
| inventário do personagem | `VITE_FF_V2_CHARACTER_AVATAR_INVENTORY_CONFIRMED`   |
| telemetria do personagem | `VITE_FF_V2_CHARACTER_AVATAR_TELEMETRY_CONFIRMED`   |
| compensação aprovada     | `VITE_FF_V2_CHARACTER_AVATAR_COMPENSATION_APPROVED` |

As capabilities e autorizações existentes continuam soberanas. Nenhum gate
frontend substitui RLS, papel Admin, elegibilidade romântica ou decisão do
servidor.

## Arquitetura

`src/v2/platform/legacy-retirement` contém:

- contratos puros de readiness e disposição de rotas;
- resolução única do ambiente;
- helper compartilhado de navegação;
- aviso acessível de quarentena;
- eventos locais estruturados, sem PII e sem sink de rede.

O arquivo `audit/legacy-retirement-readiness.json` registra o estado real:
nenhuma superfície pronta e nenhum item seguro para remoção física.

## Preservação

São invariantes mensuráveis:

- zero exclusão física ou contração de schema nesta etapa;
- mensagens, matches, interesses, preferências, recados e propósito preservados;
- ownership, inventários, looks, catálogo e assets do personagem preservados;
- fotos e personalização compartilhada fora do escopo;
- rollback apenas desabilitando a flag-mestre;
- rotas antigas permanecem compiladas e testadas.

## Telemetria

O contrato emite somente nome do evento, superfície, família de rota e timestamp
local por `CustomEvent`. Não envia rede e não inclui ID, e-mail, perfil,
parâmetros da rota ou conteúdo. Um sink operacional futuro exige revisão
separada de privacidade e observabilidade.

## Testes

Os testes cobrem fechamento por padrão, valor exato das flags, todas as
pré-condições, rollback, dados protegidos, índice versus detalhe de
Pretendentes, quarentena conjunta, distinção entre foto e personagem,
ausência de contração e integração única da navegação.

## Riscos e limitações

- flags de build exigem nova publicação para alternar;
- ainda não há telemetria de coorte ou métricas de paridade publicadas;
- nenhuma migration V2 foi validada/aplicada no banco publicado;
- a política de compensação ainda depende de decisão do usuário;
- a rota de detalhe antiga continua necessária até haver paridade;
- a implementação antiga permanece no bundle durante a quarentena.

## Rollback

Desabilitar somente a flag-mestre da superfície restaura navegação e página
legadas na publicação seguinte. Não desfazer operações legítimas de usuários,
não reverter dados e não remover os demais gates de evidência.

## Próximo gate

A V2-024 deve produzir reconciliação read-only e critérios objetivos de
contração. Na ausência de snapshot autenticado, backup testado, zero
divergência, telemetria e compensação decidida, o resultado obrigatório
continua sendo “não contrair”.
