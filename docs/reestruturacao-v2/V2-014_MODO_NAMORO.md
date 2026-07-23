# V2-014 — Modo Namoro opcional e nova descoberta

## Objetivo

Preservar o motor romântico legítimo e reconstruir sua experiência dentro de um
modo opt-in, separado da Comunidade. A rota antiga de Pretendentes deixa de ser
o centro do produto somente depois de paridade comprovada.

## Estados canônicos

- `inactive`: não participa e não recebe qualquer exposição romântica;
- `active`: participa segundo preferências, elegibilidade e privacidade;
- `paused`: pausa voluntária sem apagar histórico;
- `committed`: indisponível por Propósito Firmado;
- `restricted`: indisponível por segurança/moderação.

Separar:

- configuração escolhida pelo usuário;
- elegibilidade;
- disponibilidade efetiva;
- estado de compromisso;
- restrição administrativa.

## Ativação

- entrada voluntária;
- explicação clara;
- perguntas próprias;
- consentimentos;
- revisão de perfil romântico;
- preview;
- ativação explícita;
- possibilidade de cancelar;
- não afetar Comunidade.

## Pausa e saída

- pausa sem apagar interesses/matches;
- saída com explicação dos efeitos;
- política clara para conversas existentes;
- reativação manual;
- término de Propósito não reativa automaticamente;
- links e notificações respeitam estado.

## Perfil romântico

Renderização contextual da identidade única:

- campos autorizados;
- intenção e preferências;
- compatibilidade;
- fotos conforme política;
- fé e interesses relevantes;
- nunca expor campos românticos no perfil comunitário.

## Descoberta

- apenas usuários efetivamente ativos e elegíveis;
- filtros bilaterais conforme regra ratificada;
- bloqueio nos dois sentidos;
- exclusão de comprometidos/restritos;
- ranking explicável;
- paginação;
- evitar repetição;
- feedback/interesse;
- denúncia e bloqueio;
- privacidade.

Não alterar a regra de elegibilidade/sexo sem decisão explícita. Encapsular a
regra atual para posterior revisão.

## Interesse e match

- interesse unilateral;
- reciprocidade;
- criação atômica de match;
- idempotência;
- nenhum match duplicado/invertido;
- desfazer/encerrar com política clara;
- conversa autorizada somente a participantes;
- histórico preservado.

## Invisibilidade completa

Com Namoro desligado, remover da experiência:

- destino na navegação;
- cards;
- copy;
- badges;
- sugestões;
- filtros;
- recados;
- notificações;
- deep links que revelem conteúdo;
- aparição em descoberta de terceiros.

Rotas antigas podem mostrar explicação neutra/redirect compatível sem ativar o
modo.

## Migração do legado

- mapear usuários existentes;
- não inventar consentimento;
- preservar preferências/interesses/matches;
- dual-read/adapter;
- comparar resultados da descoberta antiga/nova;
- canário/coortes;
- flag volta para experiência antiga;
- nenhum delete.

## Testes

- todos os estados;
- ativação/pausa/saída;
- usuário existente;
- bloqueio;
- committed;
- restricted;
- filtros bilaterais;
- duplicação/replay;
- match e conversa;
- deep links;
- zero romance com modo off;
- RLS;
- mobile/a11y/performance.

## Critérios de conclusão

- Namoro realmente opcional;
- comunidade intacta;
- dados românticos preservados;
- descoberta e match server-authoritative;
- rota nova funcional;
- Pretendentes antigo ainda reversível;
- telemetria de paridade;
- flag/rollback;
- nenhum delete.

