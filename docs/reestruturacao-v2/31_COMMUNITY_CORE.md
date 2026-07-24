# V2-011 — Comunidade como núcleo do produto

## Resultado

A rota `/v2/comunidade` deixa de ser uma página provisória quando
`VITE_FF_V2_APP_SHELL=true` e `VITE_FF_V2_COMMUNITY=true`. Ela monta um hub com
espaços, eventos, presença e o histórico existente de `global_messages`. O
legado `/comunidade` continua redirecionando para `/conversas/comunidade` e
nenhuma rota canônica foi substituída.

Namoro não participa da consulta, da descoberta, dos memberships ou das
capacidades locais. Uma pessoa com Namoro desligado usa integralmente o domínio
comunitário quando sua identidade de plataforma permite `community`.

## Arquitetura e fronteiras

| Camada                      | Responsabilidade                                       |
| --------------------------- | ------------------------------------------------------ |
| `contracts.ts`              | DTOs, estados de membership e funções puras            |
| `repository.ts`             | único adapter Supabase, agregador, comandos e Realtime |
| `V2CommunityHub.tsx`        | apresentação, estados, acessibilidade e mutations      |
| `V2CommunityHubFeature.tsx` | composição substituível para runtime/testes            |
| migration `000006`          | memberships, eventos, RLS, capacidades e auditoria     |

Comunidade é dona de espaços, memberships, papéis locais, eventos e descoberta
social. Não é dona de autenticação, sessão, match, saldo, inventário, sanção
global, origem de conteúdo espiritual ou núcleo genérico de mensagens.

## Membership e autorização

- espaços podem ser `public`, `approval` ou `private`;
- memberships possuem `requested`, `invited`, `active`, `muted`, `banned`,
  `left` e `declined`;
- papéis locais são `owner`, `moderator` e `member`;
- capacidade de gestão é calculada por
  `v2_can_manage_community_space`, nunca por badge visual;
- pedidos possuem limite diário;
- owner não sai sem transferência explícita futura;
- toda decisão de membership é registrada em log append-only;
- bloqueio global prevalece sobre visibilidade local.

A migration é aditiva e está somente versionada. RLS, grants e funções precisam
ser executados e testados primeiro em um Supabase descartável.

## Eventos, timezone e presença

Eventos guardam o instante em `timestamptz` e o identificador IANA de timezone.
Capacidade gera waitlist, sem sobrescrever presença legítima. O campo
`cinema_session_id` é apenas uma integração futura e não implementa Cinema.

Presença usa somente `presence_last_seen` das últimas 24 horas, respeita
privacidade de descoberta, bloqueio e aprovação. Não cria tracker, timer ou
canal novo; o hub exibe `online` para cinco minutos e `recent` para o restante.

## Chat global e Realtime

O hub lê e escreve o mesmo `global_messages`, preservando o histórico. O envio
V2 usa RPC autenticada, aprovação, texto restrito e limite de oito mensagens
por minuto. A apresentação abre exatamente um canal Realtime e remove o canal
no cleanup. A reconstrução completa do núcleo de Conversas permanece posterior.

## Acessibilidade, offline e desempenho

- landmarks e títulos semânticos por seção;
- campos rotulados e controles com o Design System V2;
- feedback por `role=status` e erros por `role=alert`;
- UI funciona por teclado e respeita reduced motion herdado;
- grid vira coluna única no mobile e não cria listas aninhadas;
- snapshot inicial usa uma RPC agregadora;
- falha de rede preserva a tela de erro sem fingir persistência;
- cache React Query é segregado por `userId`.

## Testes e gates

Os testes cobrem estados, parsing não confiável, timezone, capacidades,
bloqueio, auditoria, preservação de `global_messages`, cleanup de Realtime,
SSR, isolamento visual e ausência de credenciais. Testes RLS/Realtme mutáveis
continuam bloqueados até existir Supabase descartável autorizado.

## Adoção e rollback

1. validar migration/RLS/RPCs em ambiente descartável;
2. validar bloqueio, papéis, private/approval, capacity e Realtime entre duas
   contas sintéticas;
3. medir payload e subscriptions;
4. ativar primeiro para coorte interna;
5. manter `/conversas/comunidade` como fallback e histórico canônico;
6. somente após paridade, mudar o destino público de `/comunidade`.

Rollback imediato: desativar `VITE_FF_V2_COMMUNITY`. Nenhuma tabela, mensagem,
rota ou dado legado é removido. A contração das estruturas só pode ocorrer
depois de paridade, reconciliação e backup testado.
