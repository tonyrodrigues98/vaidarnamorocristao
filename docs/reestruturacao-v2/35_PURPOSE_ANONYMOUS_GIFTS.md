# V2-015 — Propósito Firmado, recados anônimos e presentes contextuais

## Marco e escopo

- Base empilhada: commit da V2-014 `105e920c00b29e7e135fdcd6709cdcf79cd68eba`.
- Branch: `rebuild/v2-015-purpose-notes-gifts`.
- Rotas V2: `/v2/proposito` e `/v2/recados`.
- Flag reutilizada: `VITE_FF_V2_DATING`, fechada salvo valor exato `true`.
- Capability: `dating`; participação comunitária nunca concede acesso romântico.
- Migration preparada: `20260723000010_v2_purpose_anonymous_contextual_gifts.sql`.
- Migration não aplicada e estado publicado do Supabase não verificado.

Esta etapa preserva `relationship_commitments`, `anonymous_messages`,
`anonymous_message_hints`, `anonymous_message_reports`, `gift_transactions`,
`virtual_gifts`, `couple_time_capsules`, `matches`, conversas, saldos e
históricos. Nenhuma tabela, coluna ou linha legada é removida.

## Fontes atuais e decisões

| Contexto        | Fonte preservada                          | Camada V2                                          | Decisão                                        |
| --------------- | ----------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Propósito       | `relationship_commitments`                | máquina de estados e eventos append-only           | rejeição deixa de apagar pedido na V2          |
| Namoro          | `dating_memberships`                      | aceite muda `active` para `paused_by_commitment`   | encerramento nunca reativa                     |
| Recados         | `anonymous_messages` e RPCs legadas       | wrappers com opt-in e elegibilidade estritos       | default V2 é desligado                         |
| Dicas/revelação | hints e RPCs existentes                   | allowlist e elegibilidade bilateral                | identidade continua oculta até revelação mútua |
| Presentes       | `send_virtual_gift` e `gift_transactions` | envelope contextual idempotente                    | economia não é duplicada                       |
| Cápsulas        | `couple_time_capsules`                    | leitura participante e conteúdo fechado até a data | criação permanece no legado                    |

As regras publicadas não foram consultadas. A migration histórica é proposta,
não prova de que as funções ou colunas existem no banco publicado.

## Máquina de estados do Propósito

```text
sem propósito -> requested
requested -> active        (aceite apenas pelo destinatário)
requested -> rejected      (rejeição apenas pelo destinatário)
requested -> cancelled     (cancelamento apenas pelo solicitante)
active    -> ended         (qualquer participante)
rejected/cancelled/ended -> archived (qualquer participante)
```

Cada transição:

1. exige `auth.uid()`;
2. bloqueia a linha do compromisso com `FOR UPDATE`;
3. verifica que o ator é participante;
4. verifica estado e lado autorizado;
5. é idempotente quando a mesma transição já venceu;
6. grava evento em `relationship_commitment_events_v2`;
7. nunca apaga a linha original.

Pedidos usam chave UUID de idempotência, lock transacional por par e match já
existente. Aceite revalida elegibilidade bilateral antes de pausar somente
`dating_memberships`. Comunidade, perfil, grupos, pets, jogos e conversas
sociais não são atualizados. Encerramento registra data, ator e motivo, mas não
faz `UPDATE` na membership do Namoro.

## Experiência do casal

O agregador `get_relationship_purpose_hub_v2` entrega somente ao participante:

- compromisso atual e parceiro;
- pedidos elegíveis derivados de matches;
- histórico encerrado/arquivado;
- linha do tempo dos eventos V2;
- contagem de mensagens existentes;
- cápsulas existentes, sem conteúdo antes da abertura;
- presentes com contexto `purpose`;
- catálogo real de presentes.

A UI oferece pedido, aceite, rejeição, cancelamento, encerramento confirmado,
arquivamento, conversa, linha do tempo, cápsulas e envio de presente. Galeria e
conquistas do casal não ganharam fonte inventada: foto legítima do parceiro e
presentes existentes compõem a superfície; criação de cápsula, galeria
bilateral e conquistas aguardam contrato publicado e consentimento próprios.

## Recados anônimos

Novos recados exigem simultaneamente:

- membership `active` nos dois lados;
- elegibilidade romântica;
- perfis aprovados;
- ausência de bloqueio;
- `dating_memberships.receive_anonymous = true`;
- `anonymous_message_settings.accept_anonymous = true`;
- limites, cooldown e moderação das RPCs legadas.

O default de `accept_anonymous` passa a `false` somente para novos registros;
valores históricos não são sobrescritos. O agregador trata ausência de
configuração como opt-out. Sair ou pausar o Namoro interrompe novos recados.

O payload da caixa não contém `sender_id` nem `receiver_id`. Moderação continua
com a evidência original no banco. Resposta, duas dicas, pedido de revelação,
ignorar e denunciar reutilizam comandos existentes. A revelação exige
elegibilidade bilateral no momento do comando e a RPC legada mantém o
consentimento mútuo.

## Presentes contextuais

`send_contextual_gift_v2` aceita `social`, `romantic` ou `purpose`, mas:

- valida bloqueio e modera a mensagem;
- valida o contexto e seus participantes;
- usa chave de idempotência por remetente;
- serializa o comando em `contextual_gift_commands_v2`;
- chama uma única vez `send_virtual_gift`;
- anota contexto na mesma transação;
- deixa débito, cashback, descontos, notificação e ledger na economia existente.

Linhas antigas ficam com contexto nulo. Não existe backfill por inferência e
nenhum saldo ou preço é recalculado.

## Fronteiras do frontend

- Componentes visuais recebem apenas `userId` e um repositório tipado.
- Supabase existe somente em `repository.ts`.
- Auth, sessão, router e variáveis de ambiente não entram no módulo visual.
- Erros de backend viram mensagem sanitizada.
- URLs de mídia aceitam apenas caminho relativo ou HTTPS.
- Chaves idempotentes vêm de `crypto.randomUUID()`; não há fallback fraco.
- CSS permanece sob `.vdn-v2[data-vdn-v2]`.

## Migração e reconciliação

Ordem autorizável futura:

1. snapshot autenticado das tabelas e assinaturas das RPCs;
2. backup restaurável e Supabase descartável;
3. aplicar migration aditiva;
4. confirmar constraints, grants e RLS;
5. amostrar compromissos pending/active/ended, recados em todos os estados,
   extras, presentes, saldos e cápsulas;
6. testar concorrência e replay;
7. comparar participantes, datas, estados, propriedade, saldo/ledger e
   relacionamentos, não apenas quantidade de linhas;
8. liberar a flag em coorte interna;
9. observar erros, latência, fila de moderação e divergência financeira;
10. ampliar somente com paridade.

Backfill não é necessário para contexto de presentes. Compromissos antigos
continuam legíveis; eventos V2 começam nas novas transições e não falsificam
história anterior.

## Testes e evidência

Os testes locais cobrem:

- ciclo completo, concorrência e idempotência por inspeção do contrato SQL;
- pause apenas romântico e ausência de reativação;
- opt-in estrito, bloqueio, limites e wrappers moderáveis;
- revelação bilateral;
- envelope atômico/idempotente de presentes;
- ausência de exclusão e reclassificação histórica;
- parser de payload não confiável;
- SSR fail-closed;
- fronteiras de import, sessão e CSS;
- rotas e capability de Namoro.

RLS, concorrência real, rollback e reconciliação financeira exigem Supabase
descartável. Não usar produção para fechar esses gates.

## Telemetria mínima antes de rollout

- contagem por resultado de comando, sem PII;
- conflitos/idempotent replays;
- latência e erros por RPC;
- transições inválidas;
- opt-in/opt-out agregado;
- bloqueios de limite/cooldown;
- divergência entre comando de presente, transação e ledger;
- falha de leitura de cápsula/evento.

Nenhum conteúdo, identidade anônima, mensagem, token, saldo individual ou
identificador pessoal deve aparecer nos logs.

## Rollback

Rollback imediato: desligar `VITE_FF_V2_DATING`; as rotas ficam inacessíveis e
o legado permanece. Reverter o commit remove somente frontend, testes,
documentação e migration ainda não aplicada.

Se a migration for aplicada futuramente, primeiro revogar EXECUTE das RPCs V2.
Tabelas, colunas, índices e eventos devem permanecer em quarentena até
reconciliação e janela de contração própria. Não apagar eventos, contexto,
chaves de idempotência ou histórico para executar rollback. Memberships
`paused_by_commitment` só podem mudar por decisão explícita do usuário.

## Limitações e gates

- schema publicado e RLS ainda não foram capturados;
- criação/abertura de cápsulas continua no fluxo legado;
- galeria e conquistas do casal aguardam fonte legítima;
- rate limit distribuído depende das funções legadas publicadas;
- política jurídica de retenção de recados denunciados precisa de validação;
- monitoramento e alertas não foram configurados;
- nenhuma migration ou flag foi aplicada.
