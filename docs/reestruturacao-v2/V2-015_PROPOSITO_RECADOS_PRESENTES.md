# V2-015 — Propósito Firmado, recados anônimos e presentes contextuais

## Objetivo

Redesenhar as experiências românticas especializadas sem permitir que seus
efeitos contaminem a vida comunitária ou a economia.

## Propósito Firmado

### State machine

Modelar transições explícitas:

- pedido;
- aceite;
- rejeição;
- cancelamento antes do aceite;
- ativo;
- encerramento;
- histórico/arquivado.

Cada comando valida:

- participantes;
- match/elegibilidade;
- estado atual;
- idempotência;
- bloqueio/restrição;
- autorização;
- concorrência.

### Efeitos

Ao aceitar:

- Namoro passa a `committed`;
- descoberta/interesses novos são pausados;
- Comunidade continua;
- conversas sociais continuam;
- grupos, Verbo, pets, jogos e Cinema continuam;
- eventos internos notificam domínios;
- não executar updates duplicados no frontend.

Ao encerrar:

- preservar histórico;
- não apagar página/cápsulas conforme política;
- não reativar Namoro;
- apresentar escolha posterior;
- aplicar privacidade correta.

### Experiência do casal

- página do casal;
- timeline;
- marcos;
- galeria;
- cápsulas;
- presentes;
- conquistas do casal quando legítimas;
- privacidade;
- consentimento bilateral;
- moderação.

## Recados anônimos

Condições obrigatórias:

1. remetente participa do Namoro e é elegível;
2. destinatário participa do Namoro;
3. destinatário ativou `Receber recados anônimos?`;
4. não há bloqueio/restrição;
5. limites/cooldown permitem.

Preservar:

- duas dicas e regras válidas;
- revelação mútua;
- histórico;
- custo/recompensa quando legítimos;
- denúncias/evidência.

Segurança:

- anonimato apenas para usuários, não para moderação;
- antispam;
- rate limit;
- conteúdo moderável;
- opt-in default off;
- saída do Namoro interrompe novos recados;
- nenhuma versão aberta na Comunidade.

## Presentes

Separar:

- presente social;
- romântico;
- Propósito;
- evento/Cinema quando aprovado.

Requisitos:

- consentimento/privacidade;
- debit/entrega atômicos;
- idempotência;
- ownership;
- mensagem moderada;
- visibilidade no perfil/casal;
- bloqueio e reembolso/erro conforme regra existente.

## Migração

- preservar propósitos, participantes, datas e estados;
- preservar recados e revelações;
- preservar presentes e transações;
- adicionar contexto sem reclassificar cegamente;
- compatibilidade com URLs;
- validar amostras dirigidas.

## Testes

- concorrência no aceite;
- pedido duplicado;
- término;
- Namoro não reativado;
- comunidade e chats sociais mantidos;
- recado opt-in/off;
- bloqueio;
- limite/replay;
- revelação;
- moderação;
- presente atômico;
- RLS;
- mobile/a11y.

## Critérios de conclusão

- Propósito isolado ao romance;
- state machine e eventos;
- página do casal redesenhada;
- recados consentidos e protegidos;
- presentes contextuais sem duplicar economia;
- dados históricos preservados;
- flag/rollback e telemetria.
