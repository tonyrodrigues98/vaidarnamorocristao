# V2-011 — Comunidade como núcleo do produto

## Objetivo

Substituir a equivalência atual `Comunidade = chat global` por uma experiência
social completa, acessível e independente do Namoro.

## Capacidades

- hub comunitário;
- feed e destaques;
- descoberta de pessoas;
- espaços/grupos temáticos;
- canais/tópicos quando necessários;
- membership e papéis locais;
- eventos;
- presença;
- conteúdo fixado;
- chat global integrado;
- reações/comentários;
- convites;
- moderação local e global;
- preferências de notificação;
- integração com conteúdo, Cinema, Verbo, pets e atividades.

## Modelo e fronteiras

Comunidade é dona de:

- membership;
- vínculo social;
- espaço/grupo/evento;
- regras de publicação/distribuição comunitária;
- descoberta social.

Não é dona de:

- match;
- saldo;
- inventário;
- thread genérica;
- autenticação;
- sanção global;
- conteúdo espiritual de origem.

Use adapters/eventos internos.

## Memberships e capacidades

Definir:

- público/privado/aprovado;
- owner/moderador/membro;
- convite/solicitação;
- mute/leave/ban local;
- visibilidade;
- capacidade de postar/comentar/convidar/moderar;
- auditoria.

Não usar role visual como autorização.

## Descoberta comunitária

- todos os membros elegíveis segundo privacidade;
- não filtrar por disponibilidade romântica;
- afinidades comunitárias transparentes;
- perfis comprometidos continuam visíveis;
- bloqueados não se descobrem;
- staff aparece conforme contexto, sem expor poderes.

## Eventos e presença

- criar/agendar/participar;
- timezone;
- capacidade/convite;
- lembrete;
- cancelamento;
- integração futura com Cinema;
- presença sem tracker invasivo;
- estados online/última atividade conforme privacidade.

## Chat global

Preservar histórico e comportamento válido de `global_messages`, mas:

- integrar ao hub;
- aplicar política central de bloqueio/moderação;
- controlar subscription;
- não duplicar núcleo de Conversas;
- manter compatibilidade de rota.

## Design

Inspirar-se na organização do Discord, não em sua aparência:

- espaços fáceis de compreender;
- presença e atividade perceptíveis;
- navegação mobile sem listas infinitas aninhadas;
- identidade própria;
- menos complexidade para usuário comum;
- desktop com rail/colunas somente quando útil.

## Testes

- usuário com Namoro desligado;
- membership público/privado;
- convite/solicitação;
- papéis;
- bloqueio global;
- mute/ban local;
- post/comentário/reação;
- chat global;
- evento/timezone;
- Realtime/cleanup;
- RLS;
- moderação;
- offline/cache;
- mobile/a11y/performance.

## Critérios de conclusão

- usuário usa Comunidade plenamente sem Namoro;
- chat global não é toda a Comunidade;
- membership e capacidades server-side;
- descoberta não-romântica;
- bloqueio global;
- eventos e presença;
- integração por eventos/adapters;
- flag e rollback;
- paridade de histórico.
