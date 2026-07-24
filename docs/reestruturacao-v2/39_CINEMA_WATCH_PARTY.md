# V2-019 — Sala de Cinema “Assistir Juntos”

## Resultado

`/v2/cinema` estabelece catálogo, sessão e player responsivo sob
`VITE_FF_V2_CINEMA=true` e capability `cinema:use`. A flag, os gates jurídicos
e os gates operacionais falham fechados. Nenhuma mídia foi adicionada ao Git,
nenhum bucket foi criado e nenhuma migration foi aplicada.

## Spike técnico

| Tema            | Opções avaliadas                             | Decisão antes do rollout                                            |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Ingestão        | upload simples ou resumível                  | resumível para arquivos acima do limite que será aprovado           |
| Formatos        | MP4/MOV/WebM de entrada                      | validar assinatura real do arquivo; nunca confiar só na extensão    |
| Distribuição    | HLS, DASH ou arquivo progressivo             | HLS é candidato inicial por compatibilidade iOS; validar CDN e CORS |
| Processamento   | job gerenciado ou worker dedicado            | adapter assíncrono; fornecedor ainda não escolhido                  |
| Legendas        | WebVTT e trilhas no manifest                 | obrigatórias para catálogo público quando aplicável                 |
| Storage         | bucket privado + CDN/signed playback         | criar somente após snapshot real, política de retenção e orçamento  |
| Observabilidade | estado do job, buffering, drift e falha      | sem título, chat, identidade ou URL assinada nos logs               |
| Concorrência    | snapshot + sequence + Realtime               | servidor é autoridade; cliente estima e corrige drift               |
| PWA/iOS         | HLS nativo, fullscreen, landscape e retomada | smoke em dispositivo real antes de ativação                         |
| Retenção        | expiração por item e takedown                | decisão jurídica pendente; remoção lógica antes da física           |
| Custos          | ingestão, transcode, Storage, CDN e egress   | orçamento depende de fornecedor, duração, resolução e audiência     |

Não é possível publicar um orçamento responsável sem fornecedor, bitrate,
retenção, horas assistidas e concorrência esperada. Esses parâmetros são um
gate, não valores inventados.

## Modelo

- `cinema_media_v2`: referência de Storage, estado editorial, direitos,
  moderação, duração e versão;
- `cinema_media_processing_v2`: tentativas de processamento;
- `cinema_sessions_v2`: evento e snapshot canônico de reprodução;
- `cinema_participants_v2`: papel e presença;
- `cinema_control_events_v2`: ações idempotentes e sequenciadas;
- `conversation_thread_id`: ligação ao núcleo de Conversas existente;
- `cinema_operation_gates_v2`: upload, playback público, jurídico, retenção e
  custo fechados por padrão.

Não existe tabela `cinema_chat` nem `cinema_messages`.

## Sincronização

O snapshot inclui mídia/versão, posição, playing, velocidade, sequence,
timestamp do servidor e última ação. Host e cohost controlam; moderador só pode
encerrar. A RPC verifica autenticação, participação, papel, estado, sequence e
UUID idempotente sob lock.

O cliente:

1. estima a posição pelo timestamp do servidor;
2. ignora drift até 250 ms;
3. corrige suavemente até 2 s com taxa entre 0,95 e 1,05;
4. faz seek acima desse limite;
5. pode solicitar novo snapshot;
6. nunca usa relógio local como autoridade única.

## Experiência

- mobile: player primeiro e painel de conversa/pessoas abaixo, sem cobrir safe
  areas;
- desktop: player e painel contextual lado a lado;
- o placeholder não finge reprodução e não recebe URL de Storage;
- controles ficam desabilitados sem papel;
- chat declara explicitamente a dependência do thread de Conversas;
- catálogo vazio explica os gates, em vez de simular mídia.

## Segurança e privacidade

- mídia pronta exige direitos e moderação aprovados;
- conteúdo privado exigirá URL assinada curta, produzida no servidor;
- caminhos de Storage e URL assinada não entram no contrato da apresentação;
- tabelas possuem RLS e grants mínimos;
- o browser não publica mídia, concede papel ou controla sequence;
- nenhuma PII entra nos eventos de controle;
- upload, playback público e criação de bucket continuam indisponíveis.

## Gate jurídico/operacional

Antonio ainda precisa decidir direitos de upload/exibição, termos, menores,
conteúdo proibido, denúncia/takedown, retenção, quotas, custo e quem pode
enviar/publicar. Até isso ocorrer, gates permanecem `false` e nenhuma mídia
pública deve ser carregada.

## Testes

- estados de mídia/sessão e transições terminais;
- host, cohost, moderador, participante e espectador;
- cálculo de posição, drift suave e seek;
- idempotência, sequence, lock e autorização;
- gates, RLS, direitos e moderação;
- reaproveitamento de Conversas;
- parser limitado, SSR e CSS escopado;
- ausência de mídia versionada.

Carga, iOS real, transcodificação, signed playback e Realtime precisam de
ambiente descartável e fornecedor aprovado.

## Adoção e rollback

1. validar a migration em Supabase descartável;
2. decidir fornecedor, orçamento, política e direitos;
3. criar Storage/processamento fora do Git;
4. testar mídia autorizada não pública;
5. testar sync, reconnect, late join e troca de host;
6. ativar por coorte;
7. somente então avaliar catálogo comunitário.

Rollback: manter a flag diferente de `true`, impedir novas sessões pelos gates,
encerrar as existentes de forma controlada e preservar sessões, participantes,
eventos e histórico. Nunca apagar mídia ou histórico como mecanismo de rollback.
