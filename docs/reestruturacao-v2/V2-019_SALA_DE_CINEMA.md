# V2-019 — Sala de Cinema “Assistir Juntos”

## Objetivo

Criar uma experiência social integrada ao Vai Dar Namoro na qual um vídeo
previamente enviado à plataforma é processado e reproduzido de forma
sincronizada para todos. Não é compartilhamento de tela.

## Entregas em camadas

### Camada A — spike técnico

- formatos de upload;
- tamanho e duração;
- Storage/CDN;
- transcodificação;
- HLS/DASH ou alternativa adequada;
- thumbnails/legendas;
- custo;
- retenção;
- latência;
- compatibilidade iOS/PWA;
- concorrência;
- observabilidade;
- direitos e moderação.

O spike não ativa exibição pública.

### Camada B — modelo de domínio

Entidades:

- mídia;
- processamento;
- catálogo;
- sessão;
- evento/agendamento;
- participante;
- papel;
- estado de reprodução;
- ação de controle;
- chat;
- reação;
- moderação;
- histórico.

Estados de mídia:

- uploading;
- processing;
- ready;
- failed;
- quarantined;
- removed.

Estados de sessão:

- draft;
- scheduled;
- lobby;
- live;
- paused;
- ended;
- cancelled.

### Camada C — sincronização

Estado canônico:

- media ID/version;
- posição;
- playing/paused;
- velocidade permitida;
- versão/sequence;
- timestamp do servidor;
- host/control role;
- última ação.

Clientes:

- estimam posição;
- corrigem drift suavemente;
- aplicam seek/play/pause autorizado;
- recuperam snapshot;
- oferecem `Sincronizar novamente`;
- não usam o relógio local como autoridade única;
- registram buffering/drift sem PII.

### Camada D — experiência

- home/catálogo cinematográfico;
- sessões em destaque;
- criar/agendar;
- lobby;
- player;
- participantes;
- chat em tempo real;
- reações;
- controles por papel;
- convite;
- evento comunitário;
- histórico;
- modo casal;
- moderação;
- Admin/biblioteca/upload/sessões.

Mobile:

- player prioritário;
- chat abre/fecha como drawer;
- modo paisagem;
- safe areas;
- teclado sem cobrir input;
- reações sem bloquear vídeo;
- retorno ao sync.

Desktop:

- player + chat/participantes;
- modo cinema que reduz distrações;
- detalhes em painel.

## Papéis

- owner/admin da mídia;
- anfitrião;
- cohost/moderador;
- participante;
- espectador quando aplicável.

Capabilities controlam:

- criar;
- enviar;
- publicar;
- agendar;
- convidar;
- play/pause/seek;
- remover participante;
- moderar chat;
- encerrar.

## Chat

Usar núcleo de Conversas com política da sessão. Não criar implementação
paralela de mensagens. Preservar moderação, bloqueio e rate limit.

## Mídia e segurança

- upload resumível se necessário;
- validação real de arquivo;
- antivírus/moderação conforme política;
- isolamento por owner;
- signed playback quando privado;
- URLs expiráveis;
- processamento server/job;
- limites e quotas;
- remoção/retention;
- logs de ação;
- nenhuma mídia no Git.

## Gate jurídico/operacional

Antes de ativar upload/exibição pública, Antonio precisa definir:

- direitos de upload/exibição;
- termos;
- conteúdo proibido;
- menores;
- denúncia/takedown;
- retenção;
- custo/limites;
- quem pode enviar/publicar;
- responsabilidade do anfitrião.

Na ausência, concluir arquitetura, protótipo funcional com mídia autorizada de
teste e feature flag fechada.

## Testes

- state machines;
- host/cohost/participante;
- ação não autorizada;
- drift/buffering/reconnect;
- late join;
- troca de host;
- chat/moderação/bloqueio;
- upload/processamento/falha;
- signed access;
- encerramento;
- mobile/paisagem/teclado;
- carga e custo;
- a11y/legendas.

## Critérios de conclusão

- spike e orçamento;
- modelo de domínio;
- sync reproduzível;
- player/chat mobile e desktop;
- catálogo/eventos/histórico/modo casal;
- permissions/moderação;
- mídia fora do Git;
- flag fechada;
- gates jurídicos explícitos;
- rollback que encerra novas sessões sem perder histórico.
