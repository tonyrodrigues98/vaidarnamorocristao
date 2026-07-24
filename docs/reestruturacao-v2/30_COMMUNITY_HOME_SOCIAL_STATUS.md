# V2-010 — Início social, vínculos e Status

## Resultado

A V2 passa a ter uma fatia vertical comunitária para `/v2/inicio` e
`/v2/explorar-pessoas`, condicionada simultaneamente às flags canônicas do App
Shell e de Comunidade. O `/inicio` legado e o `/dashboard` permanecem
inalterados. A rota histórica `/membros` deixa de ser um link quebrado: com as
flags ativas aponta para a descoberta comunitária e, com elas desligadas, volta
de forma segura para `/inicio`.

Nenhuma migration deste lote foi aplicada.

## Fronteiras

- `src/v2/features/home/contracts.ts`: modelos de leitura, cursor, audiência,
  estados universais e budget.
- `repository.ts`: único adapter que conhece Supabase, Storage, normalização de
  imagem e moderação.
- `V2CommunityHome.tsx` e `V2PeopleDiscovery.tsx`: apresentação e estado de
  interação; não importam Supabase, Auth ou Router.
- `V2CommunityHomeFeature.tsx`: composição do adapter real com a apresentação.
- `V2ShellRuntimeRoute.tsx`: fornece apenas `userId`, capability de Namoro e
  callbacks de navegação.

O shell não recebe sessão, tokens, e-mail, telefone, perfil completo ou cliente
Supabase.

## Budget e paginação

O carregamento inicial usa:

1. uma RPC agregadora para feed, Status, conteúdo editorial, sugestões e
   contadores;
2. no máximo uma chamada em lote para URLs assinadas de mídias de Status.

O budget é dois requests. Posts usam ordenação `created_at DESC, id DESC` e
cursor composto pelos mesmos campos. A explicação de ranking é `recent`; não há
score romântico, afinidade de match ou prefetch recursivo.

O cache React Query inclui o `userId`. A infraestrutura de autenticação já
cancela e remove todo cache não comprovadamente público no logout e na troca de
conta.

## Vínculos sociais

`social_relationships` representa:

- seguir, ativo de forma unilateral;
- conexão bilateral com solicitação, aceite, recusa, cancelamento e remoção;
- autoaceite quando duas solicitações de conexão se encontram;
- limite server-side de 20 novas solicitações por janela de 24 horas;
- bloqueio global bidirecional antes de qualquer comando ou leitura.

O modelo não referencia `matches`, interesses ou preferências românticas.
Seguir e conectar continuam duas capacidades possíveis enquanto a decisão
final de produto permanece reversível.

As configurações `community_privacy_settings` separam descoberta, mensagens e
audiências padrão. A experiência inicial publica somente a descoberta
comunitária mínima. A policy histórica ampla de leitura de perfis precisa ser
reconciliada em ambiente descartável antes de prometer invisibilidade total
fora dos adapters V2.

## Feed

`community_posts`, reações e comentários são aditivos. Escritas diretas ficam
fechadas; RPCs autenticadas validam:

- perfil aprovado e ativo;
- audiência semântica;
- limites de tamanho;
- palavras restritas;
- bloqueios e visibilidade;
- autoria e ownership.

O feed também aproveita `daily_posts` como conteúdo editorial já existente, sem
duplicar devocionais, comentários ou reações legadas. Nenhuma tabela histórica
é alterada ou preenchida.

## Status de 24 horas

`community_statuses` garante por constraint que `expires_at` não ultrapassa 24
horas após a criação. Leituras exigem:

- não expirado;
- não excluído;
- moderação visível;
- upload finalizado;
- audiência permitida;
- ausência de bloqueio em ambas as direções.

Fotos são normalizadas e passam pela moderação server-side existente no modo
seguro de mídia adicional. Somente resultado aprovado é enviado ao bucket
privado `community-status-media`. A linha começa como `upload_pending` e
permanece invisível até o upload e o attach atômico do path. Falhas tentam
remover mídia e tombar o Status. Mídias são lidas por URL assinada e policy de
audiência.

Views são registradas por RPC idempotente. Somente autor e o próprio viewer
podem ler a linha de visualização. Exclusão antecipada é lógica; um job físico
de TTL não foi criado porque exige gate operacional.

## Estados e acessibilidade

A superfície cobre loading, vazio, erro, offline, paginação e falha de mídia.
Status abre como diálogo, recebe foco inicial, fecha por `Escape` e clique no
overlay. Controles possuem labels, `aria-live`, foco visível, 44 px mínimos,
inputs de 16 px e reduced motion. O layout é uma coluna no mobile e usa grades
somente quando há largura.

## Flags e rollout

Ordem obrigatória antes de qualquer ativação:

1. snapshot autenticado do estado publicado;
2. aplicar e testar a migration em Supabase descartável;
3. confirmar RLS, grants, Storage, bloqueios e media signing por papéis;
4. testar moderação e rate limit sem produção;
5. aplicar a migration aditiva em janela autorizada;
6. ativar `VITE_FF_V2_APP_SHELL=true` e
   `VITE_FF_V2_COMMUNITY=true` somente em ambiente isolado;
7. observar erros, latência, paginação e expiração;
8. liberar por coorte somente depois da reconciliação.

As flags continuam `false` por padrão neste commit.

## Limitações e riscos

- O estado publicado do schema/RLS/Storage não foi consultado.
- A migration não foi executada por parser PostgreSQL real neste ambiente.
- A moderação atual reaproveita o contrato de fotos adicionais; uma fila
  específica de mídia comunitária continua recomendada.
- A remoção física de Status expirado e arquivos órfãos depende de job futuro,
  métricas e rollback operacional.
- Silenciamento separado de bloqueio será implementado junto ao domínio de
  moderação; bloqueio global já prevalece.
- Comentários possuem contrato e command server-side, mas a primeira tela
  expõe apenas contagem e reação para manter a fatia revisável.
- `/dashboard` ainda faz queries legadas diretas; não foi movido neste lote.

## Rollback

Desligar `VITE_FF_V2_COMMUNITY` restaura imediatamente o placeholder do shell e
mantém `/inicio` e `/dashboard` legados. Antes da aplicação da migration, o
rollback é somente reverter o commit. Após aplicação futura, as estruturas
aditivas devem permanecer em quarentena; não apagar tabelas, bucket ou dados até
reconciliação e autorização de contração.
