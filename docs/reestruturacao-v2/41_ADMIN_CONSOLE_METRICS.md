# V2-021 — Administração por capacidades e métricas

## Resultado

`/v2/admin` apresenta saúde operacional e navegação modular sob a flag já
existente `VITE_FF_V2_ADMIN=true`. A rota continua protegida por
`admin:enter`; cada módulo aplica uma matriz conservadora de papéis. O console
não concede capacidades.

## Auditoria do legado

O Admin atual possui um arquivo central com aproximadamente 3.880 linhas e
rotas especializadas de até cerca de 2.000 linhas para pets, 1.091 para equipe
live, 1.043 para fotos e 820 para economia. As verificações de `isAdmin`,
`super_admin`, `moderador`, `apresentador` e agente de suporte variam por rota.

A V2 não remove nem reescreve essas regras. Cada módulo aponta para a operação
legada preservada até que sua paridade seja comprovada.

## Módulos

Visão geral, usuários/aprovação, verificação, moderação, Comunidade, Namoro,
Conversas/denúncias, Conteúdo/Verbo, economia, catálogos, pets, jogos, Cinema,
notificações/jobs, suporte, equipe/permissões e auditoria/sistema.

Cada descritor possui:

- ID de domínio;
- capability declarada;
- papéis conservadores observados;
- destino legado;
- indicação de sensibilidade;
- carregamento do painel por `lazy()`.

## Fronteira

O console não calcula saldo, match, Propósito, ownership ou reward. Não modera
arquivo no cliente, não concede membership e não acessa `service_role`.
Operações reais continuam chamando comandos/RPCs públicos de cada domínio.

`admin_command_requests_v2` é somente envelope de request, motivo, capability,
alvo, correlação e idempotência. `admin_action_audit_v2` guarda resultado e
digests SHA-256 mínimos, nunca payloads before/after.

## Saúde operacional

`get_admin_console_v2` retorna apenas contagens acionáveis:

- cadastros aguardando aprovação;
- casos de moderação abertos;
- tickets aguardando resposta;
- comandos econômicos falhos;
- push em dead letter;
- processamento de mídia falho.

Não retorna perfis, emails, mensagens, saldos, evidências ou conteúdo privado.
Métricas de vaidade não entram no contrato.

## Métricas de produto

Eventos futuros devem medir funil comunitário, participação saudável, opt-in
romântico, perfil, conversa consentida e saúde técnica. Eles não podem capturar
conteúdo, notas do Verbo, mensagens, prova pública de fé ou criar competição
espiritual. Métricas de produto não foram ativadas nesta etapa.

## Segurança

- `get_admin_console_v2` exige papel real server-side;
- `user` recebe zero módulos;
- equipe/permissões e auditoria ficam apenas para `super_admin`;
- requests e audit não aceitam INSERT direto do browser;
- ação sensível exige motivo, request ID, target e UUID idempotente;
- nenhuma reautenticação foi simulada: step-up permanece gate futuro;
- RLS restringe tabelas novas.

## UX e acessibilidade

Busca local, navegação por módulos, cards acionáveis, estados
loading/erro/permissão, layout responsivo e foco do Design System. Filtros URL,
paginação, export, lote parcial e commands reais entram somente ao migrar cada
módulo vertical.

## Testes

- matriz de papéis e módulos;
- capabilities e destinos;
- autorização server-side;
- audit/idempotência/motivo;
- dashboard sem PII;
- parser limitado;
- lazy module, SSR e CSS escopado;
- ausência de regra de domínio no cliente.

RLS, commands, replay, lote e step-up precisam de Supabase descartável.

## Adoção e rollback

1. validar migration e papéis publicados;
2. ativar somente visão geral para equipe interna;
3. migrar um módulo por vez;
4. comparar lista de operações, permissões e auditoria;
5. só então retirar o trecho correspondente do monólito.

Rollback: desligar a flag e usar as rotas Admin preservadas. Tabelas de request
e audit são append-only e não devem ser apagadas.
