# V2-021 — Administração por capacidades e métricas

## Objetivo

Desmontar gradualmente os monólitos administrativos e entregar um console
modular, rápido e seguro sem perder nenhuma capacidade legítima.

## Navegação

- Visão geral;
- usuários/aprovação;
- verificação;
- moderação;
- Comunidade;
- Namoro;
- Conversas/denúncias;
- Conteúdo/Verbo;
- economia;
- catálogos/personalização;
- pets;
- jogos/recompensas;
- Cinema/mídia;
- notificações/jobs;
- suporte;
- equipe/permissões;
- auditoria/sistema.

## Fronteira de domínio

Admin chama comandos públicos dos domínios. Não replica:

- cálculo de saldo;
- regra de match;
- mudança de Propósito;
- ownership;
- reward;
- moderação de arquivo;
- membership.

Cada módulo declara capabilities e audit events.

## UX operacional

- filtros na URL;
- busca com debounce/cancelamento;
- paginação;
- colunas/configuração;
- lista responsiva no mobile;
- seleção em lote restrita;
- confirmação;
- motivo obrigatório;
- preview do impacto;
- optimistic somente quando reversível;
- estados loading/vazio/erro/offline/permission;
- retry seguro;
- export sem PII indevida.

## Ações sensíveis

- nenhuma concessão econômica no cliente;
- reautenticação/step-up quando aprovado;
- capability real no servidor/banco;
- motivo;
- request ID;
- before/after mínimo;
- autor;
- timestamp;
- alvo;
- resultado;
- correlação com ticket/caso;
- proteção contra replay.

## Dashboard administrativo

Priorizar saúde:

- fila de aprovação;
- verificações;
- denúncias;
- tickets;
- anomalias econômicas;
- falhas de jobs/push;
- Realtime;
- Storage;
- sessões de Cinema;
- segurança;
- performance/erro por rota.

Não exibir métricas de vaidade sem ação possível.

## Métricas de produto

Comunidade:

- onboarding comunitário;
- pessoas ativas sem Namoro;
- conexões;
- participação saudável;
- retenção.

Namoro:

- opt-in;
- interesse/match;
- conversas consentidas;
- bloqueios/denúncias;
- Propósitos.

Perfil:

- conclusão;
- vitrines;
- tempo/abandono do editor;
- performance/contraste.

Saúde:

- erro;
- latência;
- bundle;
- CWV;
- Realtime;
- saldo/inventário;
- jobs;
- Storage/CDN.

Eventos não devem coletar conteúdo privado ou incentivar competição espiritual.

## Desmontagem

Para cada monólito Admin:

1. caracterizar;
2. extrair queries;
3. extrair commands;
4. extrair módulos UI;
5. manter rota compatível;
6. comparar capacidades;
7. ativar por módulo;
8. retirar código somente após prova.

## Testes

- matriz de roles/capabilities;
- ação permitida/negada;
- lote parcial;
- replay;
- auditoria;
- busca/filtro/paginação;
- erro/retry;
- mobile;
- export;
- economia;
- moderação;
- bundle/lazy;
- nenhuma service role no cliente.

## Critérios de conclusão

- console por domínios;
- paridade de capacidades;
- autorização server-side;
- auditoria;
- dashboard de saúde;
- módulos lazy;
- monólitos reduzidos sem big bang;
- flags/rollback;
- documentação operacional.

