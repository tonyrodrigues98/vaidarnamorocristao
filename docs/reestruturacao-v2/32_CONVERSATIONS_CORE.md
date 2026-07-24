# V2-012 — Núcleo de conversas

## Objetivo e estado

A V2-012 conecta `/v2/conversas` a uma caixa contextual, responsiva e
server-authoritative, sem substituir nem apagar `messages`, `global_messages`,
matches ou Propósito Firmado. A ativação continua fechada pela flag canônica
`VITE_FF_V2_MESSAGING=true`.

A migration `20260723000007_v2_conversation_core.sql` é somente um contrato
aditivo versionado. Ela não foi aplicada. RLS, RPCs, Realtime, índices, bucket e
compatibilidade precisam ser validados em um Supabase descartável antes de
qualquer rollout.

## Fronteiras

- Apresentação: `V2Conversations` recebe apenas `userId`, um repositório tipado e
  armazenamento de rascunho. Não importa Supabase, sessão ou regras de namoro.
- Integração: `V2ConversationsFeature` injeta o adapter real.
- Dados: `repository.ts` é a única fronteira Supabase do módulo e sanitiza
  payloads não confiáveis.
- Servidor: RPCs autenticadas decidem participação, privacidade, bloqueio,
  elegibilidade romântica, criação, envio, leitura e preferências.
- Cache: chaves incluem usuário e thread. Rascunhos incluem usuário e thread e
  falham fechados quando o storage não está disponível.

O shell monta o módulo apenas quando `messaging` está ativa e a rota canônica é
`conversas`. O fallback legado permanece inalterado.

## Contextos e compatibilidade

| Contexto          | Origem                                  | Estratégia                                                      |
| ----------------- | --------------------------------------- | --------------------------------------------------------------- |
| Social            | `conversation_*_v2`                     | Thread canônica, pedido explícito e privacidade `messages_from` |
| Match romântico   | `matches` + `messages`                  | Adapter sem cópia; somente membership ativa                     |
| Propósito Firmado | `relationship_commitments` + `messages` | Somente o match ativo durante `paused_by_commitment`            |
| Comunidade global | `global_messages`                       | Adapter com `client_message_id`, rate limit e bloqueio          |
| Espaços/Cinema    | Thread canônica preparada               | Criação fica para a integração vertical do domínio              |
| Suporte           | Thread canônica preparada               | Sem interface operacional nesta etapa                           |

Namoro desligado não expõe matches. `paused_by_commitment` libera somente o
match do Propósito ativo. Participação comunitária nunca depende de estado
romântico.

## Modelo aditivo

O contrato preserva os IDs e timestamps existentes e acrescenta:

- `client_message_id` nullable em `messages` e `global_messages`, com unicidade
  parcial por remetente;
- threads, participantes, mensagens, recibos e preferências canônicas;
- metadados de anexos e bucket privado `conversation-attachments`;
- RLS de leitura por participante e escrita somente via RPC;
- solicitação social com estado `requested`, aceite/recusa e respeito a
  bloqueio e `community_privacy_settings.messages_from`.

Não há `DROP`, `TRUNCATE`, job, webhook, backfill ou contração.

## Ordem, paginação e idempotência

- Ordem total: `(created_at, id)`.
- Cursor: último `(created_at, id)` da página.
- Tamanho: 40 por padrão, limitado a 80 no servidor.
- A consulta devolve páginas em ordem cronológica; o cliente reconcilia e
  ordena novamente para tolerar eventos fora de ordem.
- `client_message_id` é gerado uma vez por tentativa lógica e reutilizado no
  retry.
- Conflitos por remetente e `client_message_id` retornam a mensagem persistida,
  inclusive no chat global.
- O cliente exibe optimistic state, restaura o snapshot no erro e oferece retry
  explícito sem trocar a identidade.

## Realtime, leitura e offline

O adapter mantém no máximo um canal por thread selecionada e sempre chama
`removeChannel` no cleanup. Eventos invalidam apenas a inbox do usuário e a
thread atual. Reconexão/refcount global, typing, update/delete incremental e
telemetria p95 permanecem gates antes de rollout amplo.

Leitura marca todas as mensagens até o cursor observado e deduplica chamadas
por thread/cursor no cliente. O chat global não possui recibos individuais.

Offline nesta etapa significa:

- histórico já existente no cache do React Query;
- rascunho local privado por usuário/thread;
- retry manual idempotente;
- nenhum envio ou upload offline prometido.

O cache privado ainda depende do boundary global da V2-002 para limpeza em
logout/troca de usuário.

## Interface e acessibilidade

- mobile: lista e thread alternadas, composer acima da safe area;
- desktop/tablet: lista e thread simultâneas;
- input de pelo menos 16 px;
- botões de voltar, carregar histórico, retry, fixar, silenciar e arquivar
  acessíveis sem long-press;
- loading, vazio, erro, pedido recebido e pedido enviado explícitos;
- estilos integralmente escopados por `.vdn-v2[data-vdn-v2]`.

Busca é local sobre a página carregada. Virtualização, busca server-side,
scroll anchoring mensurado, anexos, edição, exclusão, reactions, typing,
denúncia e bloqueio pela UI não são declarados como concluídos.

## Rollout e reconciliação

1. Validar a migration em clone descartável representativo.
2. Comparar contagem, IDs, autores, conteúdo, ordem, replies, edits, deletes e
   `read_at` dos adapters legados.
3. Validar RLS por usuário, match, commitment, pedido, bloqueio e saída.
4. Validar retry concorrente e Realtime multi-device.
5. Validar bucket privado, MIME, tamanho, quarentena e cleanup antes de expor
   upload.
6. Ativar a flag somente para coorte interna e acompanhar duplicação, erro,
   latência e backlog.
7. Manter `/conversas` como rollback enquanto não houver paridade.

Rollback de frontend: desligar `VITE_FF_V2_MESSAGING`. Rollback de dados não
remove as estruturas aditivas nem desfaz mensagens legítimas. Contração só pode
ocorrer após snapshot autenticado, reconciliação e estabilização.

## Validação

Os testes determinísticos cobrem ordem com timestamp igual, reconciliação,
idempotência, rascunho isolado, payload não confiável, pedido social, gating de
Namoro/Propósito, RLS declarada, bucket privado, rate limit, SSR, feature flag,
fronteira de imports, canal único e isolamento CSS. Nenhum teste desta etapa
acessa Supabase.
