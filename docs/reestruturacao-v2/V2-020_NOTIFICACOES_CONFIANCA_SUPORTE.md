# V2-020 — Notificações, confiança, moderação e suporte

## Objetivo

Unificar experiências transversais sem transferir para elas as regras dos
domínios. Separar fatos de negócio, entrega de notificação, moderação, bloqueio
e atendimento.

## Notificações

Categorias:

- Comunidade;
- Conversas;
- Namoro;
- Propósito;
- Conteúdo/Verbo;
- Cinema/eventos;
- pets/jogos;
- economia;
- segurança/conta;
- suporte.

Cada categoria pode ter:

- inbox;
- push;
- resumo;
- som quando suportado;
- prioridade;
- privacidade.

Notificações essenciais de segurança não podem ser desativadas indevidamente.

## Arquitetura

Separar:

1. evento de domínio;
2. regra de destinatário;
3. registro de notificação;
4. preferência;
5. fila;
6. dispatch;
7. entrega/falha;
8. abertura/deep link.

Requisitos:

- idempotência/deduplicação;
- claim atômico;
- retry/TTL;
- preferência por canal;
- texto neutro para conteúdo sensível;
- same-origin/allowlist;
- autenticação antes de abrir;
- contagem unread;
- limpeza/arquivamento.

## Bloqueio, silenciamento e denúncia

- bloqueio corta interação global;
- silenciamento reduz conteúdo/notificação;
- denúncia abre caso;
- ban local de grupo é diferente de bloqueio global;
- evidência necessária pode ser preservada com acesso restrito;
- conteúdo compartilhado pode ser anonimizado quando necessário.

Centralizar efeito do bloqueio em:

- feed;
- descoberta;
- perfil;
- conversa;
- grupo;
- Cinema;
- Namoro;
- presentes;
- notificações.

## Verificação de foto/identidade

- explicar finalidade e consentimento;
- upload seguro;
- status;
- revisão;
- falha técnica = pendência, nunca aprovação silenciosa;
- recurso/reenvio;
- retenção;
- acesso restrito;
- rate limit;
- logs sem imagem/PII.

## Moderação

Fila contextual:

- perfil/foto;
- post/status;
- comentário;
- mensagem;
- grupo/evento;
- presente;
- Cinema;
- jogo/economia;
- conteúdo cristão.

Requisitos:

- motivo;
- prioridade;
- evidência;
- decisão;
- sanção proporcional;
- auditoria;
- recurso;
- capabilities;
- nenhuma decisão crítica apenas no cliente.

## Suporte

Preservar:

- tickets;
- mensagens;
- anexos;
- status;
- histórico.

Redesenhar:

- busca antes de ticket;
- categorias;
- formulário contextual;
- preview de anexo;
- protocolo;
- status;
- prazo apenas quando conhecido;
- escalonamento;
- conexão com moderação sem expor dados indevidos.

## Testes

- preferência por canal;
- deduplicação/retry;
- deep link externo;
- tela bloqueada;
- bloqueio em todos os domínios;
- mute versus block;
- denúncia/evidência;
- verificação/falha IA;
- role/capability;
- ticket/anexo;
- cache/logout;
- push/service worker;
- mobile/a11y.

## Critérios de conclusão

- central categorizada;
- evento e entrega separados;
- deep links seguros;
- bloqueio global consistente;
- moderação contextual;
- verificação fail-closed/pendente;
- suporte preservado;
- telemetria e auditoria;
- flag/rollback.
