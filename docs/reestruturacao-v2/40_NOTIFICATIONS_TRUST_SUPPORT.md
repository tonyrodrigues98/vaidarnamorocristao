# V2-020 — Notificações, confiança, moderação e suporte

## Resultado

`/v2/central` reúne inbox, preferências, bloqueios, silenciamentos, estado de
verificação e tickets preservados. A montagem exige
`VITE_FF_V2_TRUST_CENTER=true` e capability `trust:use`.

O módulo não altera o endpoint, o cron ou a fila operacional de push. A
migration é aditiva, local e não aplicada.

## Arquitetura de notificações

```text
evento de domínio
  -> regra de destinatário
  -> registro no inbox existente
  -> preferência por categoria/canal
  -> tentativa de entrega
  -> fila push preservada
  -> dispatch protegido existente
  -> entrega/falha
  -> abertura por destino interno validado
```

- `notification_domain_events_v2` guarda o fato e a chave de deduplicação;
- `notifications` continua como inbox canônico;
- `notification_preferences_v2` separa inbox, push, digest e som;
- `notification_delivery_attempts_v2` registra canal, retry e resultado sem
  conteúdo sensível;
- `push_queue` e o dispatch atômico existente não foram reimplementados;
- eventos de segurança forçam inbox e são essenciais;
- conteúdo romântico ou de mensagem aparece com texto neutro na Central;
- links absolutos externos, `//host`, esquemas e rotas de autenticação são
  descartados.

## Categorias

Comunidade, Conversas, Namoro, Propósito, Conteúdo/Verbo, Cinema, pets,
economia, segurança/conta e suporte possuem preferências independentes.
Segurança não pode ter o inbox desligado.

## Bloqueio, mute e denúncia

- `blocks` continua sendo a autoridade bilateral/global;
- `v2_community_users_blocked` permanece a função canônica;
- inbox V2 não entrega notificações de ator bloqueado;
- sessões e mídia de Cinema recebem policy restritiva relativa ao host/owner;
- feed, descoberta, perfil, conversa, grupos, Namoro e presentes já usam a
  mesma autoridade nas migrations V2 anteriores;
- `user_mutes_v2` reduz conteúdo ou entrega, mas não concede bloqueio;
- `moderation_cases_v2` referencia o report legado e preserva evidência por
  referência restrita;
- denunciar nunca cria um bloqueio automaticamente.

## Verificação

A Central só apresenta estado limitado. O endpoint de foto já protegido
continua a autoridade. Falha de IA, timeout ou erro de provider não são
convertidos em aprovação. Imagem, evidência, email, telefone e logs sensíveis
não entram no payload da Central.

## Moderação

O envelope V2 identifica tipo de sujeito, motivo, prioridade, estado, decisão,
recurso e referência de evidência. A decisão continua server-side e exige
papel/capability. Nenhuma fila Admin foi redesenhada nesta etapa.

## Suporte

`support_tickets`, `support_messages`, anexos, Realtime, protocolos e histórico
permanecem canônicos. `support_ticket_context_v2` acrescenta contexto opcional
sem copiar mensagens/anexos. A Central orienta busca em `/suporte/ajuda` e abre
o atendimento legado.

## Segurança

- RLS em todas as tabelas novas;
- leitura limitada ao titular, destinatário, reporter ou equipe autorizada;
- criação de evento de domínio somente para `service_role` server-side;
- o browser não lê fila push, evidência, anexos ou sessão;
- links usam allowlist same-origin;
- `service_role` e secrets não entram no bundle;
- nenhum secret ou dado pessoal é registrado.

## Testes

- classificação por domínio;
- destino interno, same-origin e rejeição de open redirect;
- preferências essenciais;
- deduplicação, retry e separação evento/entrega;
- block versus mute versus report;
- Cinema e notificação sob bloqueio;
- verificação fail-closed;
- preservação de suporte;
- parsers limitados, SSR e CSS escopado.

Push/service worker, RLS, Realtime e anexos exigem ambiente Supabase descartável.

## Adoção e rollback

1. validar a migration em ambiente descartável;
2. reconciliar categorias legadas e event types;
3. testar preferência e texto neutro;
4. testar block matrix por domínio;
5. ativar a Central para coorte interna;
6. manter páginas legadas como fallback;
7. migrar delivery apenas após paridade e observabilidade.

Rollback: desligar a flag, manter inbox, suporte, bloqueios, cases e delivery
intactos. Não desfazer eventos legítimos nem apagar evidências.
