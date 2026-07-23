# V2-010 — Início, feed, vínculos sociais e Status de 24 horas

## Objetivo

Reconstruir `/inicio` como hub social vivo e criar a fundação de vínculos não
românticos e Status de 24 horas, mantendo `/dashboard` independente.

## 1. Contrato de Início

O hub pode apresentar:

- Status;
- feed relevante;
- novidades de conexões;
- acontecimentos da Comunidade;
- grupos/espaços/eventos;
- conteúdo cristão;
- convites para Cinema;
- atalhos pessoais;
- recomendações sociais;
- cards de Namoro apenas quando o modo estiver ativo.

Evitar uma rota que faça queries diretas em todos os domínios. Criar agregadores
e contratos de leitura com budgets.

## 2. Vínculos sociais

Implementar modelo aprovado pelos documentos com capacidade para:

- seguir;
- conexão bilateral;
- solicitação;
- aceitar/recusar/cancelar;
- remover;
- privacidade de mensagens;
- bloqueio global;
- limites antispam;
- descoberta por afinidade comunitária.

Resolver o destino histórico `/membros` dentro da arquitetura real de
descoberta comunitária. A solução pode criar rota canônica, alias ou redirect
documentado, mas não deve manter o link quebrado nem transformá-lo em contrato.

Se a decisão final entre seguir/conexão ainda estiver aberta:

- criar contrato capaz de representar ambos;
- lançar somente a menor experiência reversível;
- não usar `matches`;
- registrar gate sem bloquear feed/status.

## 3. Feed

- posts/atualizações existentes via adapter;
- paginação determinística;
- autoria e audiência;
- bloqueio/silenciamento;
- moderação;
- comentários/reações existentes sem duplicar regras;
- ranking explicável e não romântico;
- estados vazio/loading/erro/offline;
- cache por usuário;
- evitar loops de query e prefetch.

## 4. Status de 24 horas

Capacidades:

- foto/mídia;
- audiência configurável;
- publicação e exclusão antecipada;
- expiração automática;
- viewers conforme privacidade;
- indicador no perfil;
- denúncia, bloqueio e silenciamento;
- moderação equivalente a outras mídias;
- navegação por toque/teclado;
- pause com interação;
- reduced motion;
- upload/resume conforme suporte.

Schema/migration, se necessários, devem ser aditivos. TTL/job só é aplicado em
produção após gate operacional.

## 5. Dashboard

- manter `/dashboard`;
- mover queries para adapters;
- diferenciar métricas pessoais de feed;
- não gamificar fé;
- não redirecionar para `/inicio`;
- preservar relatórios existentes.

## 6. Design

Ritmo de uso inspirado na clareza do Instagram, sem copiar:

- conteúdo compreensível logo na entrada;
- hierarquia visual calma;
- cards compactos;
- bottom nav coerente;
- desktop com coluna contextual apenas quando útil;
- status acessível;
- personalização que não quebra legibilidade.

## 7. Testes

- usuário novo sem conexões;
- usuário com feed longo;
- Namoro off/on;
- bloqueio bidirecional;
- conta privada;
- solicitação/replay/antispam;
- status audiência/expiração/exclusão;
- viewers;
- moderação;
- cache/logout;
- paginação;
- performance;
- mobile e acessibilidade.

## Critérios de conclusão

- `/inicio` é social e não dating-first;
- `/dashboard` continua legítimo;
- vínculo social não depende de match;
- Status cumpre duração e privacidade;
- feed respeita bloqueio/moderação;
- adapters e budgets;
- flags/rollback;
- dados antigos preservados.
