# V2-014 — Modo Namoro opcional

## Resultado e fronteira de produto

`/v2/pretendentes` passa a montar a descoberta romântica V2 somente quando
`VITE_FF_V2_DATING=true` **e** a identidade canônica concede `dating:enter`.
Participar da comunidade não ativa, anuncia nem sugere disponibilidade
romântica. O opt-in e a revisão das preferências continuam na rota
`/onboarding/namoro`, entregue na V2-009C.

Esta etapa não remove `/pretendentes`, não altera dados existentes e não aplica
migration. Interesses, matches, mensagens, Propósito Firmado, recados anônimos,
bloqueios, denúncias e histórico permanecem nas estruturas atuais.

## Estados canônicos

| Estado V2             | Origem persistida                    | Efeito                                                       |
| --------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `inactive`            | `inactive` ou ausência               | Sem descoberta e sem capability romântica                    |
| `active`              | `active`                             | Descoberta permitida quando perfil e elegibilidade aprovarem |
| `paused`              | `paused`                             | Descoberta fechada; comunidade e histórico intactos          |
| `legacy-confirmation` | `legacy_active_pending_confirmation` | Exige confirmação explícita, sem inferir consentimento       |
| `committed`           | `paused_by_commitment`               | Pausa somente o domínio romântico                            |
| `restricted`          | `restricted`                         | Restrição server-authoritative                               |

Pausa e desativação reutilizam as RPCs da V2-009C. Depois do comando, o adapter
de runtime atualiza a identidade pelo `AuthProvider` existente e retorna para
`/v2/inicio`. Encerrar Propósito não reativa a membership.

## Regra de elegibilidade preservada

A função privada `v2_dating_users_eligible` nomeia o contrato atual como
`legacy-opposite-sex-v1`. Ela exige:

- ambos os perfis aprovados, não desativados, não anonimizados e sem exclusão;
- membership `active` nos dois lados;
- sexos diferentes, conforme a regra legada ratificada;
- faixa etária e localização escolhidas pelo observador;
- bloqueio bilateral ausente;
- nenhum Propósito Firmado ativo para observador ou candidato;
- candidato fora da lista de staff oculto.

A regra não consulta disponibilidade comunitária e não retorna preferências
privadas do observador. Um futuro modelo bilateral de gênero/sexo exige decisão
explícita de produto, nova versão e reconciliação; não pode mudar esta função
silenciosamente.

## Descoberta e paginação

`get_dating_discovery_v2` é uma RPC autenticada e server-authoritative. O
ranking possui somente critérios explicáveis:

1. ainda não visto;
2. mesmo estado;
3. perfil mais recente;
4. UUID como desempate total.

O cursor contém esses quatro campos e evita paginação por offset. Matches
existentes e interesses já enviados saem da descoberta; interesse recebido
permanece para permitir reciprocidade. A tabela aditiva
`dating_discovery_impressions_v2` reduz repetição sem alterar `profile_views`.
O cliente registra no máximo cinquenta impressões elegíveis por comando.

A página realiza duas requisições: leitura agregada e registro de impressões.
Não há consultas por card. Fotos aceitam somente caminho interno ou HTTPS.

## Interesse, match e segurança

`send_dating_interest_v2`:

- valida novamente a elegibilidade no servidor;
- adquire advisory lock pela dupla canônica;
- é idempotente para interesse já enviado e match existente;
- limita novos interesses a trinta em 24 horas;
- grava em `interests`;
- cria ou obtém `matches` com `user_a < user_b`;
- usa `ON CONFLICT` e preserva o trigger legado.

Bloqueio é bilateral para descoberta por meio da tabela `blocks`, mas o comando
não apaga interesse, match, conversa ou evidência. Denúncia usa motivos em
allowlist, limite diário e a tabela `reports`; o navegador não aplica sanção.
As duas ações possuem confirmação/feedback acessível.

## Interface e acessibilidade

- cards responsivos em uma, duas ou três colunas;
- loading, erro fechado, vazio, paginação, match e feedback;
- preferências, pausa e desativação explícitas;
- confirmação para pausa, saída e bloqueio;
- folha de denúncia com título acessível, foco inicial e Escape;
- botões e campos com alvo mínimo herdado do Design System;
- `select` com 16 px, safe area e reduced motion;
- estilos exclusivamente sob `.vdn-v2[data-vdn-v2]`;
- nenhuma chamada a Supabase fora de `repository.ts`.

Quando Namoro está desligado, a navegação é filtrada pela capability antes de o
shell montar a área. A página comunitária só recebe o booleano de capability e
não recebe membership, preferências, interesses ou pistas românticas.

## Migration aditiva e validação pendente

`20260723000009_v2_optional_dating_mode.sql` cria apenas:

- uma tabela de impressões V2 com RLS e acesso direto revogado;
- uma função privada de elegibilidade;
- cinco RPCs autenticadas para descoberta, impressões, interesse, bloqueio e
  denúncia;
- índices, grants e comentários correspondentes.

Não há `DELETE FROM`, `DROP`, `TRUNCATE`, alteração de coluna, backfill,
reescrita de saldo ou consolidação. A migration depende das estruturas
aditivas V2-009C/V2-010 e deve ser validada na ordem da pilha.

Antes de qualquer rollout:

1. capturar o snapshot autenticado do Supabase publicado;
2. aplicar V2-009C até V2-014 em projeto descartável;
3. testar RLS/RPC como anônimo, owner ativo, inativo, comprometido, restrito,
   bloqueado, staff oculto e service role;
4. testar concorrência de interesses e provar match único;
5. reconciliar a descoberta V2 contra a legada por coorte, sem expor PII;
6. validar índices e planos com volume representativo;
7. ativar as flags de App Shell e Dating somente para coorte interna.

## Rollback

O rollback imediato é desligar `VITE_FF_V2_DATING`; a rota e os dados legados
continuam disponíveis. Se a migration já tiver recebido impressões ou comandos
legítimos, suas estruturas ficam em quarentena. Rollback não apaga interesses,
matches, relatórios, bloqueios nem impressões. Contração física só pode ocorrer
depois de paridade, reconciliação, retenção definida e autorização própria.

## Limitações

- O Supabase publicado não foi consultado e a migration não foi aplicada.
- A regra de sexo oposto é compatibilidade histórica, não decisão sobre um
  modelo futuro mais inclusivo.
- Filtros avançados, telemetria de paridade, virtualização e desfazer interesse
  exigem etapas posteriores.
- Recados anônimos e Propósito Firmado serão integrados verticalmente na
  V2-015.
- Conversas de match continuam sob o adapter da V2-012.

## Validação

Os testes determinísticos cobrem estados, parsing não confiável, cursor,
sanitização de mídia, allowlist de denúncia, isolamento SSR/CSS/imports,
membership ativa bilateral, regra legada versionada, bloqueios, Propósito,
staff oculto, lock do par, match canônico, idempotência, rate limits, grants,
natureza aditiva e integração pela identidade/feature flag canônicas. Nenhum
teste acessa Supabase.
