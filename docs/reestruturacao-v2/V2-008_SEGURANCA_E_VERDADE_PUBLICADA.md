# V2-008 — Segurança, Supabase e verdade publicada

## Objetivo

Transformar os achados históricos e estáticos em uma baseline verificável,
testável e pronta para hardening, sem presumir que migrations equivalem ao
estado publicado e sem alterar produção.

Este lote não termina ao gerar outro relatório. Ele deve entregar contratos,
testes, migrations locais seguras, adapters e runbooks suficientes para que
cada P0/P1 seja confirmado, refutado ou corrigido de forma revisável.

## Fontes obrigatórias

- Item 2 — Plano de Segurança;
- Item 3 — Snapshot Canônico;
- SQL de inventário somente leitura;
- Item 7 — Preservação e Migração;
- V2-006 — auditoria de legado;
- código, tipos, migrations e testes do HEAD atual.

## Frentes

### 1. Matriz de evidência

Para cada achado SEG-001 a SEG-020 e P0–P4:

- localizar evidência no HEAD;
- localizar declaração nos tipos;
- reconstruir histórico relevante de migrations;
- classificar o que depende de produção;
- apontar teste que prova segurança;
- apontar mudança local proposta;
- registrar rollback/forward-fix;
- nunca chamar de vulnerabilidade publicada sem prova.

### 2. Snapshot somente leitura

Se houver acesso autenticado:

- executar somente a consulta read-only aprovada;
- não incluir PII ou valores secretos nos artefatos;
- capturar schema, policies, grants, default privileges, funções, owners,
  triggers, Realtime, buckets e configurações relevantes;
- comparar com tipos e migrations;
- registrar divergências.

Se não houver acesso:

- não parar o programa;
- preparar comando/runbook e schema do artefato;
- continuar hardening comprovável no código;
- marcar somente os gates que dependem da produção.

### 3. RPCs econômicas e de progresso

Cobrir, conforme existência atual:

- `grant_coin_event`;
- `award_xp`;
- `track_achievement`;
- `progress_mission_action`;
- helpers genéricos de notificação;
- qualquer função que aceite usuário, quantidade, cap, progresso ou metadata.

Requisitos:

- identidade derivada de `auth.uid()` ou capability server;
- quantidade e recompensa calculadas por regra confiável;
- idempotência;
- caps e cooldowns server-side;
- grants mínimos;
- `search_path` explícito;
- auditoria sem PII;
- testes owner/outro/replay/concorrência/valores extremos.

### 4. Push e filas

- confirmar autenticação do dispatch;
- métodos HTTP permitidos;
- segredo ausente = fechado;
- claim atômico/idempotente;
- retries e TTL;
- remoção de subscription inválida;
- logs agregados;
- zero token de push no log;
- nenhuma chave no cliente.

### 5. Fotos, IA e Storage

- rate limit, timeout, limite, MIME/magic bytes;
- falha técnica não aprova silenciosamente;
- fila/revisão conforme política;
- visibilidade de `profile-photos` confirmada;
- URLs persistidas e migração de delivery;
- signed/public cache seguro;
- reparo administrativo limitado e auditado.

### 6. Aplicação e supply chain

- `.env` e histórico sem reproduzir valores;
- fonte única de lockfile sem alterar por impulso;
- CSP/headers/deploy config;
- sanitização de blog/embeds/URLs;
- dependências sem uso apenas classificadas;
- bundle por credenciais privilegiadas;
- imports server-only;
- logs, source maps e mensagens de erro.

## Estrutura recomendada

- contratos em domínio `trust-security` ou plataforma equivalente;
- testes puros para classificadores;
- testes RLS/RPC em projeto descartável;
- migrations pequenas por achado, não uma migration monolítica;
- `docs/reestruturacao-v2/security-baseline/` apenas para artefatos sem PII;
- manifest de estado de cada achado.

## Testes obrigatórios

- matriz anon/owner/outro/staff/admin;
- chamadas RPC com identidade adulterada;
- valores negativos, zero, extremos e replay;
- concorrência;
- `SECURITY DEFINER` e grants;
- Realtime autorizado/não autorizado;
- bucket público/privado/signed;
- falha da IA;
- rate limit;
- push sem/invalid/valid secret;
- cache privado;
- deep links;
- bundle e imports.

Não executar testes mutáveis contra produção.

## Critérios de conclusão

- todo P0/P1 tem estado explícito e evidência;
- nenhum defeito é congelado em teste;
- migrations locais passam em Supabase descartável quando disponível;
- nenhum secret é criado, impresso ou versionado;
- nenhum dado real foi alterado;
- riscos dependentes de produção estão isolados;
- Draft PRs revisáveis;
- o próximo lote pode usar capabilities e adapters seguros.

## Proibições

- não aplicar migration;
- não revogar grant em produção;
- não girar chave;
- não tornar bucket privado abruptamente;
- não alterar saldo/dados;
- não publicar snapshot com PII;
- não encerrar o programa se o acesso read-only estiver ausente.
