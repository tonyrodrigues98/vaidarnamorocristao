# V2-012 — Conversas confiáveis e contextuais

## Objetivo

Reconstruir lista, thread e infraestrutura de Conversas para obter fluidez,
estabilidade e experiência mobile impecável, preservando todas as mensagens e
sem criar infraestruturas paralelas para social e romance.

## Contextos suportados

- solicitação social;
- conversa social;
- match romântico;
- Propósito Firmado;
- grupo/espaço;
- chat global;
- Sala de Cinema;
- suporte, em canal operacional separado.

## Arquitetura

O núcleo compartilha:

- identidade de thread;
- política de participante fornecida pelo domínio;
- mensagem;
- `client_message_id`;
- paginação/cursor;
- envio otimista;
- ack/retry/falha;
- entrega/leitura;
- edição/exclusão;
- reply/reação quando suportados;
- anexos;
- busca;
- typing;
- Realtime;
- reconciliação.

Não unificar tabelas apenas por elegância. Use adapter sobre o legado e schema
aditivo somente quando houver ganho comprovado e migração segura.

## Lista de conversas

- categorias/filtros claros;
- unread confiável;
- preview e timestamp;
- pin/archive/mute quando suportados;
- busca;
- requests separadas;
- nenhum vazamento romântico com Namoro off;
- paginação/virtualização;
- cache por usuário;
- skeleton/vazio/erro/offline.

## Thread

- ordem total `created_at + id` ou equivalente;
- cursor estável com timestamps iguais;
- scroll anchoring;
- carregar histórico sem salto;
- enviar/retry sem duplicar;
- preservar rascunho por usuário/thread;
- input acima do teclado/safe area;
- anexos com progresso/cancelamento;
- upload validado;
- mark read eficiente;
- bloqueio/denúncia/silêncio;
- ações acessíveis sem depender de long-press.

## Realtime

- registry com refcount quando apropriado;
- uma subscription por finalidade;
- cleanup;
- reconnect;
- deduplicação;
- eventos fora de ordem;
- update/delete;
- auth/token refresh;
- nenhum canal cruzado;
- métricas de falha/latência.

## Offline

- leitura somente do que está realmente em cache;
- rascunho local privado;
- outbox somente com idempotência;
- status claro;
- retry controlado;
- logout/troca de conta apagam estado privado;
- anexos offline não prometidos sem suporte real.

## Design

Inspirar-se na clareza e fluidez do WhatsApp/Vitra sem copiar:

- lista rápida;
- thread limpa;
- hierarquia clara;
- mobile fullscreen;
- desktop com lista + thread + detalhes quando houver espaço;
- painel lateral de detalhes/configurações;
- Poppins e ícones próprios;
- nenhum zoom no input iOS.

## Migração

- preservar IDs, autores, conteúdo, anexos, ordem, replies, edits, deletes,
  delivered/read e timestamps;
- dual-read/adapter quando necessário;
- comparar contagem e checksums semânticos;
- compatibilidade com deep links;
- não mover dados em massa sem snapshot.

## Testes

- conversa longa;
- mesmo timestamp;
- retry/replay;
- reconnect;
- duplicação;
- multi-device;
- blocked/unblocked;
- Namoro off/paused/committed;
- request social;
- group membership;
- Cinema join/leave;
- anexo/falha;
- offline/logout;
- RLS e Realtime;
- teclado mobile;
- a11y e performance p75/p95.

## Critérios de conclusão

- núcleo confiável e políticas por contexto;
- inbox contextual;
- zero duplicação em retry conhecido;
- ordem e paginação estáveis;
- histórico preservado;
- mobile/desktop completos;
- cache privado;
- flag/rollback;
- telemetria;
- Draft PRs revisáveis.
