# VaiDarNamoro — Auditoria e Plano de Segurança

## Item 2 — Riscos, prioridades e projeto de correção sem alterações

**Repositório:** `tonyrodrigues98/vaidarnamorocristao`  
**Branch analisada:** `main`  
**Commit congelado:** `7fb5c9747aa5afa26132407958bbf5ab68c83c5c`  
**Data da análise:** 22 de julho de 2026  
**Natureza:** auditoria estática e plano técnico; nenhuma correção aplicada  
**Dependência:** complementa o Item 1 — Manual do Sistema Atual

---

## 1. Resultado executivo

O VaiDarNamoro possui boas fundações de segurança: autenticação centralizada no Supabase, RLS em grande parte das tabelas, operações econômicas atômicas, validações administrativas dentro de várias RPCs, buckets privados para evidências sensíveis e separação do cliente `service_role` em arquivo server-side.

Entretanto, a auditoria encontrou riscos que precisam ser resolvidos antes da grande reestruturação. Os mais importantes não são visuais:

1. um endpoint público pode processar a fila de push usando `service_role`, sem autenticação;
2. existem RPCs privilegiadas de moedas, XP e conquistas concedidas a qualquer usuário autenticado, com parâmetros controláveis pelo chamador;
3. o histórico de 196 migrations torna difícil provar quais permissões estão efetivamente ativas sem consultar o Supabase publicado;
4. a moderação por IA não possui rate limit e adota comportamento de liberação quando o serviço falha;
5. fotos de perfil foram tornadas públicas no Storage;
6. não foi encontrada configuração explícita de cabeçalhos HTTP defensivos no repositório;
7. o `.env` está versionado, ainda que as chaves encontradas sejam publicáveis;
8. a cobertura de testes de segurança é pequena diante de 140 tabelas e 201 funções/RPCs tipadas.

### 1.1 Nível geral de risco

| Camada                      | Avaliação  | Motivo principal                                                      |
| --------------------------- | ---------- | --------------------------------------------------------------------- |
| Endpoints server-side       | Crítico    | `push-dispatch` público opera com `service_role`                      |
| Economia e progressão       | Crítico    | RPCs internas executáveis por usuários autenticados                   |
| Banco e RLS                 | Alto       | grande superfície e permissões acumuladas em migrations               |
| Fotos e mídia               | Alto       | moderação sem limite; fotos principais em bucket público              |
| Administração               | Alto       | ações muito poderosas; dependência forte de autorização distribuída   |
| Autenticação                | Médio      | base correta, mas sessão persiste em `localStorage`                   |
| Frontend e navegador        | Médio      | ausência de política de cabeçalhos/CSP verificável                    |
| Dependências                | Médio/alto | lock oficial é Bun, mas há alerta confirmado para Vite fixado no lock |
| Auditoria e observabilidade | Médio      | logs e testes ainda não cobrem toda a superfície crítica              |

### 1.2 Regra de leitura

Este relatório diferencia três níveis de certeza:

- **Confirmado no código:** comportamento presente no commit congelado.
- **Provável se todas as migrations da branch foram aplicadas:** conclusão baseada na ordem do histórico SQL.
- **Pendente de validação no ambiente:** precisa de inventário real do Supabase publicado, credenciais de teste ou inspeção do deploy.

Não foi realizado teste ofensivo contra o ambiente publicado.

---

## 2. Superfície analisada

Foram examinados:

- três endpoints server-side;
- cliente Supabase do navegador e cliente `service_role`;
- 196 migrations;
- ocorrências de `SECURITY DEFINER`, RLS, políticas e permissões `EXECUTE`;
- autenticação, cargos e proteções administrativas;
- moedas, XP, conquistas, recompensas, pets e Pet Arcade;
- fotos, moderação por IA e Storage;
- push notifications e Service Worker;
- conteúdo HTML, URLs externas e iframes;
- arquivos de ambiente e configurações de deploy;
- testes de RLS existentes;
- dependências registradas em `package.json`, `bun.lock` e `package-lock.json`.

### 2.1 Indicadores encontrados no histórico SQL

| Indicador no histórico                    | Quantidade |
| ----------------------------------------- | ---------: |
| Ocorrências de `SECURITY DEFINER`         |        384 |
| Definições/redefinições de funções        |        394 |
| Ativações de RLS                          |        153 |
| Criações de políticas                     |        446 |
| Ocorrências de `FORCE ROW LEVEL SECURITY` |          0 |

Esses números são ocorrências acumuladas nas migrations, não o número de objetos finais ativos. O Item 3 deverá reconstruir o estado canônico real.

---

## 3. Achados críticos

## SEG-001 — Processamento público da fila de push

**Severidade:** crítica  
**Evidência:** `src/routes/api/public/hooks/push-dispatch.ts`  
**Estado:** confirmado no código

O endpoint `/api/public/hooks/push-dispatch` aceita `GET` e `POST` sem autenticação. Ele utiliza `supabaseAdmin`, que carrega a chave `SUPABASE_SERVICE_ROLE_KEY` e ignora RLS.

Qualquer pessoa que conheça ou descubra a rota pode provocar:

- processamento repetido da fila;
- consumo de recursos do servidor;
- chamadas ao provedor de Web Push;
- concorrência entre execuções;
- alteração de `push_queue` e `push_subscriptions`;
- exposição indireta de mensagens de erro operacionais.

O uso de `GET` para uma operação com efeitos colaterais aumenta o risco de execução acidental por crawlers, prefetch, scanners e ferramentas de monitoramento.

### Correção projetada

1. remover `GET`;
2. aceitar somente `POST`;
3. exigir segredo dedicado de cron/webhook;
4. comparar o segredo em tempo constante;
5. opcionalmente validar assinatura HMAC e janela de tempo;
6. implementar trava de execução ou reivindicação atômica dos registros;
7. tornar o processamento idempotente;
8. aplicar rate limit no endpoint;
9. retornar erros genéricos externamente e registrar detalhes internamente;
10. restringir a origem/chamador conforme o mecanismo real de cron do deploy.

### Testes de aceitação

- `GET` retorna `405`;
- `POST` sem segredo retorna `401`;
- segredo inválido retorna `401` sem revelar detalhes;
- duas chamadas simultâneas não processam o mesmo item duas vezes;
- uma falha parcial não marca como concluído um item não enviado;
- nenhuma resposta expõe endpoint de assinatura, stack ou erro do banco.

---

## SEG-002 — RPC de moedas chamável diretamente

**Severidade:** crítica  
**Evidência:** migrations que criam e concedem `grant_coin_event(uuid, int, text)`  
**Estado:** confirmado no histórico; provável no banco se todas as migrations foram aplicadas

`grant_coin_event` é `SECURITY DEFINER` e foi concedida a `authenticated`. A versão mais recente localizada limita cada concessão a três moedas e o saldo a 500, mas:

- aceita `_user` informado pelo cliente;
- não exige `_user = auth.uid()`;
- não prova que um evento de pet realmente ocorreu;
- não possui chave de idempotência real;
- não possui limite de chamadas;
- pode ser repetida até atingir o teto;
- pode creditar outro usuário e poluir seu histórico.

O comentário “idempotente” não corresponde ao comportamento: `_ref` é apenas gravado no texto/metadado e não é protegido por unicidade.

### Correção projetada

- revogar `EXECUTE` de `PUBLIC`, `anon` e `authenticated`;
- manter a função somente como helper interno, ou incorporá-la ao fluxo transacional que valida o evento;
- nunca aceitar usuário-alvo do cliente em um helper de recompensa;
- derivar usuário de `auth.uid()` quando a função for realmente pública;
- exigir evento previamente criado, pertencente ao usuário e ainda não resgatado;
- proteger o resgate com constraint única/idempotency key;
- registrar saldo anterior, saldo posterior, origem confiável e identificador do evento.

### Testes de aceitação

- chamada RPC direta por usuário autenticado é negada;
- repetir o mesmo evento não gera duas recompensas;
- usuário A não consegue creditar usuário B;
- prêmio legítimo continua funcionando dentro de `apply_pet_care` ou fluxo equivalente.

---

## SEG-003 — XP arbitrário por usuário autenticado

**Severidade:** crítica  
**Evidência:** `award_xp(text, integer, integer, jsonb)`  
**Estado:** confirmado no histórico; provável no banco se aplicada a migration

A RPC `award_xp`:

- usa `auth.uid()`, o que impede premiar outro usuário;
- porém aceita `_amount` controlado pelo chamador;
- aceita `_daily_cap = NULL`;
- concede execução a `authenticated`;
- registra e soma o valor fornecido diretamente.

Um usuário pode chamar a RPC fora da interface e atribuir a si mesmo grande quantidade de XP.

### Correção projetada

- revogar execução direta de usuários;
- transformar em helper interno;
- substituir `_amount` por uma chave de evento permitida;
- manter os valores de recompensa em configuração confiável no banco;
- validar idempotência e limites por evento/dia;
- aplicar teto absoluto por transação mesmo para chamadas internas;
- criar trilha de auditoria com origem e entidade causadora.

### Testes de aceitação

- usuário autenticado não executa `award_xp` diretamente;
- quantidade de XP não pode vir do cliente;
- reenvio do mesmo evento não duplica XP;
- nível e total permanecem coerentes após concorrência.

---

## SEG-004 — Conquistas e missões aceitam identidade/progresso fornecidos

**Severidade:** crítica  
**Evidência:** `track_achievement(uuid, text, integer)` e `progress_mission_action(uuid, text, integer)`  
**Estado:** parte confirmada; permissões finais de `progress_mission_action` exigem validação no banco

`track_achievement` é concedida a `authenticated` e aceita:

- usuário-alvo;
- categoria;
- incremento.

Ela pode desbloquear conquistas, conceder moedas e disparar notificações. Não valida `auth.uid()` contra `_user_id`, nem prova que a ação aconteceu.

`progress_mission_action` segue padrão semelhante e é usada corretamente por triggers, mas precisa ter sua permissão final verificada. Em PostgreSQL, uma função nova pode herdar execução de `PUBLIC` se não houver revogação explícita após sua criação.

### Correção projetada

- tornar ambas helpers exclusivamente internas;
- revogar permissões de chamada direta;
- permitir progresso somente por triggers ou serviços confiáveis;
- remover `_user_id` do contrato público;
- validar incremento máximo e origem;
- impedir que o mesmo fato conte repetidamente;
- separar “registrar fato” de “conceder recompensa”.

---

## 4. Achados de severidade alta

## SEG-005 — Deriva de permissões em funções `SECURITY DEFINER`

**Severidade:** alta  
**Estado:** confirmado no histórico

Uma migration de endurecimento revoga todas as funções existentes e concede novamente uma allowlist. Porém dezenas de funções foram criadas depois dela. Cada função posterior volta a depender de `REVOKE`/`GRANT` individual.

Essa sequência produziu permissões perigosas como as descritas acima. O problema não é somente uma RPC isolada; é o modelo de governança.

### Correção projetada

1. revogar por padrão execução de funções do schema `public` para `PUBLIC` e `anon`;
2. definir `ALTER DEFAULT PRIVILEGES` para impedir concessão implícita;
3. criar allowlist canônica de RPCs públicas;
4. separar helpers internos em schema não exposto pela API, por exemplo `private`;
5. exigir `SET search_path` seguro em toda função privilegiada;
6. impedir SQL dinâmico com nomes/valores não validados;
7. auditar dono da função e privilégios por assinatura completa;
8. criar teste automatizado que falhe quando nova função privilegiada nasce exposta.

### Observação

As 384 ocorrências de `SECURITY DEFINER` incluem redefinições. O Item 3 deve produzir a lista final por OID/assinatura diretamente do banco.

---

## SEG-006 — Função genérica de notificação exposta

**Severidade:** alta  
**Evidência:** `create_notification(uuid, text, text, text, text, uuid, uuid)`  
**Estado:** provável se a permissão final está ativa

A função genérica foi explicitamente concedida a `authenticated` para servir a outras RPCs/triggers. Isso permite que um cliente tente criar notificações arbitrárias para qualquer usuário, com título, corpo e link escolhidos.

Impactos possíveis:

- spam;
- phishing dentro do aplicativo;
- falsificação de avisos administrativos;
- criação de links enganosos;
- crescimento artificial da fila de push.

### Correção projetada

- remover execução direta;
- mover helper para schema privado;
- cada ação legítima deve chamar uma função específica, que monta texto e link no servidor;
- nunca aceitar título e link completos do cliente;
- validar tipo de notificação contra enum/allowlist.

---

## SEG-007 — Moderação por IA sem rate limit

**Severidade:** alta  
**Evidência:** `/api/verify-photo`  
**Estado:** confirmado no código

O endpoint valida o bearer token e o usuário, mas não limita chamadas por usuário, IP, sessão ou período. Cada chamada pode enviar até aproximadamente 8 milhões de caracteres base64 ao gateway de IA.

Impactos:

- consumo financeiro;
- esgotamento de cota;
- carga de CPU/memória ao decodificar evidências;
- abuso automatizado;
- indisponibilidade da moderação para usuários legítimos.

### Correção projetada

- rate limit distribuído por usuário e IP;
- limite diário e janela curta;
- limite de corpo no edge antes de `request.json()`;
- validação real dos bytes/magic number, dimensões e formato;
- normalização server-side para JPEG/WebP;
- timeout e cancelamento da chamada de IA;
- idempotência por hash da imagem;
- auditoria de custo por usuário;
- backoff para erros 429/402.

---

## SEG-008 — Falha da IA libera foto sem sinalização de revisão

**Severidade:** alta  
**Evidência:** `src/lib/verifyPhoto.ts`  
**Estado:** confirmado no código

O comentário e o tipo `soft` mostram que, quando a IA está indisponível, a foto pode prosseguir “unflagged”. Isso é um fail-open deliberado.

Essa escolha reduz atrito, mas permite contornar moderação aguardando ou provocando indisponibilidade, e é especialmente inadequada para fotos adicionais que podem conter documento, nudez ou dados sensíveis.

### Correção projetada

- foto principal: permitir upload somente como `pending_review`, sem publicação imediata;
- foto adicional: armazenar em bucket de quarentena e não publicar até verificação;
- falha técnica nunca deve equivaler a aprovação;
- fila manual precisa diferenciar `ai_unavailable`, `low_confidence` e `policy_flag`;
- definir prazo de retenção e exclusão automática.

---

## SEG-009 — Fotos de perfil em bucket público

**Severidade:** alta para privacidade  
**Evidência:** migration `20260604153000_profile_photos_public_delivery.sql`  
**Estado:** confirmado no histórico; depende de aplicação no ambiente

O bucket `profile-photos` foi definido como público para facilitar entrega entre navegadores. A RLS da tabela controla quais perfis aparecem, mas não impede acesso direto a uma URL pública conhecida.

Consequências:

- remoção de um perfil da listagem não revoga a URL;
- bloqueio entre usuários não bloqueia acesso direto à mídia;
- banimento ou rejeição não tornam imagens privadas;
- URLs compartilhadas fora do app continuam funcionando;
- caminhos com UUID do usuário podem ser correlacionados.

### Correção projetada

- avaliar bucket privado com signed URLs curtas;
- usar transformação/CDN que preserve cache sem tornar o original público;
- separar foto pública aprovada de originais e fotos pendentes;
- remover metadados EXIF e localização;
- invalidar/remover objetos ao excluir foto ou conta;
- não reutilizar URL permanente para evidência de moderação.

---

## SEG-010 — `.env` versionado

**Severidade:** alta como prática; impacto atual médio  
**Estado:** confirmado no Git

O `.env` está rastreado. As variáveis encontradas são URL, project ID e chave publicável do Supabase, que não são segredos equivalentes a `service_role`. Ainda assim:

- normaliza versionamento de credenciais;
- facilita inclusão acidental de segredo futuro;
- liga o repositório diretamente ao projeto publicado;
- dificulta separação entre ambientes.

### Correção projetada

- retirar `.env` do versionamento;
- manter `.env.example` sem valores;
- confirmar que nunca houve `service_role`, VAPID private key ou Lovable API key no histórico;
- usar secret scanning no CI;
- separar development, preview e production;
- rotacionar qualquer segredo encontrado no histórico, não apenas removê-lo do commit atual.

---

## SEG-011 — Ausência de cabeçalhos defensivos verificáveis

**Severidade:** alta  
**Estado:** não encontrados no repositório; pode haver proteção externa no deploy

Não foi localizada configuração explícita para:

- Content-Security-Policy;
- frame ancestors / X-Frame-Options;
- Strict-Transport-Security;
- Referrer-Policy;
- Permissions-Policy;
- X-Content-Type-Options;
- políticas cross-origin.

Isso precisa ser confirmado na resposta real do domínio publicado. A ausência no código não prova ausência no Cloudflare/Lovable.

### Correção projetada

- declarar os cabeçalhos como código versionado;
- começar CSP em modo `Report-Only`;
- mapear Supabase, Google Fonts, gateway de mídia e demais origens;
- eliminar scripts inline ou adotar nonce/hash;
- bloquear framing por terceiros;
- restringir câmera, microfone, geolocalização e demais permissões ao necessário.

---

## 5. Achados médios e pontos de endurecimento

## SEG-012 — Sessão persistida em `localStorage`

O cliente Supabase guarda sessão em `localStorage`. Isso é comum em SPAs/PWAs, mas qualquer XSS executado na origem pode alcançar o token.

Prioridade prática:

- prevenir XSS com CSP e sanitização;
- não registrar tokens;
- reduzir duração e renovar corretamente;
- encerrar todas as sessões após troca de senha ou evento de segurança;
- avaliar cookies `HttpOnly` quando a arquitetura SSR for amadurecida.

---

## SEG-013 — HTML inserido diretamente no blog

`blog.$slug.tsx` usa `dangerouslySetInnerHTML`. Hoje o conteúdo vem de arquivo TypeScript local, o que reduz o risco. Se o blog migrar para admin/CMS, HTML não sanitizado se tornará XSS armazenado.

Regra futura: conteúdo remoto deve passar por sanitizador com allowlist e URLs seguras; scripts, handlers `on*`, iframes e esquemas perigosos devem ser removidos.

---

## SEG-014 — URLs e iframe administráveis

Há várias imagens e links carregados de campos configuráveis, além de iframe na área de verificações. Mesmo em telas administrativas, URLs precisam de validação.

Controles projetados:

- permitir somente `https:` e origens aprovadas;
- bloquear `javascript:`, `data:` onde não for estritamente necessário e esquemas desconhecidos;
- aplicar `rel="noopener noreferrer"` em links externos;
- usar `sandbox` restritivo no iframe;
- não permitir que uma URL arbitrária navegue o contexto privilegiado do admin.

---

## SEG-015 — Políticas de leitura amplas

O histórico contém políticas `USING (true)` para usuários autenticados em estruturas como:

- `profile_preferences`;
- presença/último acesso;
- configurações de recados anônimos;
- reações e orações;
- algumas estruturas de pets e jogos.

Algumas são catálogos públicos legítimos. Outras podem revelar preferências românticas, disponibilidade, atividade ou comportamento social.

O Item 3 deve classificar coluna por coluna:

- público;
- somente autenticado;
- somente dono;
- participantes de uma relação;
- staff;
- serviço interno.

---

## SEG-016 — Realtime amplo

Foi localizada política de leitura ampla em `realtime.messages`. Isso pode ser necessário para o mecanismo usado, mas deve ser validado junto aos canais efetivamente assinados e às políticas das tabelas de origem.

Teste obrigatório: um usuário não participante não pode receber payload de chat privado, ticket, moderação ou outra entidade sensível, mesmo conhecendo IDs.

---

## SEG-017 — Logs operacionais podem carregar dados excessivos

O push registra parte do endpoint e stack/erro. A moderação guarda resultado da IA, URL, caminho e evidência. Isso ajuda na investigação, mas requer:

- redaction de tokens e endpoints;
- retenção definida;
- acesso restrito;
- trilha de consulta administrativa;
- remoção consistente com exclusão de conta e política de privacidade.

---

## SEG-018 — Endpoint administrativo de reparo de fotos

`/api/photo-repair` possui autenticação e checagem de `admin`/`super_admin`, o que é positivo. Porém usa `service_role` para listar, substituir e excluir objetos e registros.

Endurecimentos necessários:

- rate limit para administradores;
- log imutável de ator, alvo, ação e resultado;
- tamanho máximo de multipart no edge;
- validação de bytes JPEG, não apenas `file.type`;
- proteção CSRF/Origin como camada adicional;
- evitar apagar o objeto anterior antes de confirmar consistência total;
- limitar paginação e evitar varreduras repetidas custosas.

---

## SEG-019 — Push sem reivindicação atômica da fila

O processamento seleciona itens pendentes e os marca depois do envio. Duas execuções podem selecionar o mesmo lote antes de qualquer uma atualizar `processed_at`.

A solução deve usar uma RPC transacional ou padrão de claim com status/lock e `SKIP LOCKED`, além de chave idempotente no evento de notificação.

---

## SEG-020 — Dependências e locks inconsistentes

O gerenciador oficial indicado pelo CI é Bun. O `package-lock.json` está desatualizado, portanto o resultado do `npm audit` não representa fielmente a instalação oficial.

Mesmo assim, o `bun.lock` confirma Vite `7.3.2`, dentro da faixa afetada por advisory de leitura arbitrária/bypass de `server.fs.deny` em versões até `7.3.4`. O risco principal é ambiente de desenvolvimento exposto, especialmente no Windows.

O lock oficial já contém versões corrigidas para alguns alertas que o lock do npm ainda reporta, como `sharp 0.34.5`, `undici 7.28.0` e `ws 8.21.0`. Portanto:

- não usar a contagem de 142 alertas do `package-lock.json` como retrato real do deploy;
- remover locks obsoletos;
- executar auditoria compatível com Bun no CI;
- revisar vulnerabilidades de produção separadamente das ferramentas de build/dev;
- atualizar Vite para versão corrigida compatível com TanStack/Lovable e validar build/testes.

---

## 6. Pontos positivos confirmados

A auditoria também registrou controles que devem ser preservados:

- `client.server.ts` exige `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor;
- o cliente normal usa chave publicável e depende de RLS;
- `/api/verify-photo` valida o bearer token com o Supabase;
- `/api/photo-repair` exige `admin` ou `super_admin` no servidor;
- várias RPCs administrativas validam cargo internamente;
- compras principais usam lock de saldo e transações atômicas;
- o bucket `photo-moderation-rejects` é privado;
- evidências de moderação têm rotina de limpeza prevista em sete dias;
- há proteção contra remoção/downgrade do `super_admin`;
- funções sensíveis antigas receberam revogações explícitas em migrations de hardening;
- chat, mensagens e alguns fluxos de moderação possuem testes de RLS existentes;
- segredos de IA, VAPID privado e `service_role` não foram encontrados no `.env` versionado.

---

## 7. Plano de correção por ondas

Este é o projeto de implementação futura. Nada abaixo foi executado.

## Onda 0 — Contenção imediata

Ordem recomendada:

1. proteger `push-dispatch` e remover `GET`;
2. revogar execução direta de `grant_coin_event`;
3. revogar execução direta de `award_xp`;
4. revogar execução direta de `track_achievement`;
5. verificar e revogar `progress_mission_action` para clientes;
6. retirar acesso direto a `create_notification`;
7. consultar o catálogo real `pg_proc`/ACL no Supabase publicado;
8. revisar logs de moedas, XP e conquistas em busca de abuso anterior;
9. ativar rate limit emergencial em `/api/verify-photo`.

**Condição de saída:** nenhuma função interna de recompensa ou notificação pode ser chamada diretamente por um usuário comum.

## Onda 1 — Baseline de autorização

1. inventariar permissões finais de tabelas, views, funções, sequences e schemas;
2. criar allowlist de RPCs públicas;
3. mover helpers internos para schema privado;
4. configurar privilégios padrão restritivos;
5. revisar todas as políticas `USING (true)`;
6. testar papéis `anon`, usuário A, usuário B, moderador, admin e super_admin;
7. garantir que UI guards não sejam tratados como controle de segurança.

**Condição de saída:** o estado real do banco coincide com uma matriz de autorização versionada.

## Onda 2 — Fotos, arquivos e privacidade

1. colocar uploads pendentes em quarentena;
2. substituir fail-open por `pending_review`;
3. validar magic bytes, formato, dimensões e tamanho;
4. remover EXIF;
5. revisar bucket público de fotos;
6. definir retenção de evidências e logs;
7. validar todos os buckets e políticas por pasta/dono;
8. revisar URLs externas, iframes e tipos MIME.

**Condição de saída:** uma falha de IA nunca publica conteúdo não verificado, e bloqueios/privacidade se aplicam também à mídia.

## Onda 3 — Aplicação, sessões e navegador

1. configurar CSP em `Report-Only`;
2. remover dependência de scripts inline ou usar nonce/hash;
3. aplicar cabeçalhos defensivos;
4. avaliar estratégia de sessão;
5. sanitizar qualquer conteúdo HTML futuro;
6. validar redirects e links externos;
7. aplicar limites de request e timeouts.

**Condição de saída:** testes automáticos confirmam cabeçalhos e nenhum fluxo legítimo é bloqueado pela CSP final.

## Onda 4 — Supply chain e CI

1. escolher somente Bun ou migrar integralmente para npm;
2. remover locks obsoletos;
3. atualizar Vite para versão corrigida;
4. executar auditoria de dependências no lock oficial;
5. ativar secret scanning;
6. gerar SBOM;
7. fixar CI por lock imutável;
8. separar alertas de runtime e dev/build.

**Condição de saída:** instalação reproduzível, sem advisory crítico/alto aplicável ao runtime e sem segredo versionado.

## Onda 5 — Observabilidade e resposta

1. auditoria imutável de ações administrativas;
2. alertas de anomalia para moedas, XP, caixas e jogos;
3. alertas para taxa de moderação e push;
4. retenção e redaction de logs;
5. playbook de incidente;
6. revogação de sessões e rotação de segredos;
7. rotina de backup/restauração testada.

---

## 8. Matriz mínima de testes de segurança

| Domínio      | Teste obrigatório                                             |
| ------------ | ------------------------------------------------------------- |
| Perfis       | usuário A não altera campos protegidos de B                   |
| Fotos        | URL/objeto privado não é acessível após bloqueio ou remoção   |
| Roles        | usuário não cria, remove ou promove o próprio cargo           |
| Admin        | moderador não executa ação exclusiva de admin/super_admin     |
| Mensagens    | terceiro não lê, envia, edita ou recebe Realtime do match     |
| Comunidade   | usuário banido/rejeitado não publica quando a regra proíbe    |
| Propósito    | terceiro não consulta nem modifica compromisso                |
| Moedas       | cliente não credita saldo, altera ledger ou repete recompensa |
| XP           | cliente não escolhe quantidade nem repete evento              |
| Conquistas   | progresso só nasce de fato validado                           |
| Pet Arcade   | resultado e recompensa não são definidos pelo cliente         |
| Presentes    | compra, envio, resgate e cashback são idempotentes            |
| Notificações | usuário não cria alerta arbitrário para terceiros             |
| Push         | endpoint exige assinatura e não duplica envio concorrente     |
| Storage      | dono só grava em sua pasta; admin conforme allowlist          |
| Suporte      | somente participante/staff autorizado lê ticket e anexo       |
| Verificação  | documento e evidência permanecem privados                     |
| Exclusão     | remoção de conta elimina ou anonimiza dados conforme política |

### 8.1 Papéis de teste

Cada suíte deve usar identidades separadas:

- anônimo;
- usuário pendente;
- usuário aprovado A;
- usuário aprovado B;
- usuário bloqueado;
- usuário em Propósito Firmado;
- moderador;
- apresentador;
- admin;
- super_admin.

---

## 9. Segurança da futura retirada do avatar

### 9.1 Decisão registrada

O **avatar customizável/personagem** sairá do projeto na futura reestruturação.

Isso abrange, em princípio:

- rotas `/avatar` e `/avatar/criar`;
- editor e renderizador em camadas;
- bases corporais, peles, roupas, cabelos, sapatos e acessórios;
- loja e inventário exclusivos do personagem;
- looks salvos;
- administração de itens de avatar;
- buckets e assets exclusivos desse sistema;
- RPCs de compra/equipamento exclusivas do personagem.

### 9.2 O que não deve ser removido por engano

No código atual, “avatar” também nomeia a **foto principal de perfil** e sua moderação. A retirada do personagem não autoriza remover:

- `profiles.photo_url`;
- foto do usuário em chats, perfil e navegação;
- verificação da foto principal;
- campos `avatar_ai_verified`, `avatar_ai_confidence` e `avatar_ai_checked_at` enquanto ainda forem usados;
- escopo `avatar` do log de moderação, até que ele seja renomeado/migrado;
- componentes genéricos de foto circular conhecidos na UI como Avatar.

### 9.3 Protocolo futuro de retirada

1. congelar novas compras do personagem;
2. decidir política de moedas para itens comprados;
3. inventariar tabelas, buckets, RPCs, assets e referências;
4. exportar ou preservar histórico necessário para auditoria;
5. remover navegação e escrita antes de excluir dados;
6. revogar RPCs e políticas do avatar customizável;
7. manter compatibilidade de leitura durante janela de migração;
8. remover jobs, triggers e integrações órfãs;
9. apagar assets/tabelas somente após backup e confirmação de não uso;
10. validar que foto de perfil, molduras, auras, fundos e gradientes continuam funcionando.

### 9.4 Decisão ainda necessária

A política econômica dos itens comprados do avatar deverá ser escolhida mais adiante:

- reembolso integral em moedas;
- crédito proporcional;
- conversão em item comemorativo/badge;
- simples aposentadoria, se nunca houve compra real relevante.

Essa decisão não será presumida nem aplicada neste item.

---

## 10. Backlog priorizado

| ID         | Prioridade | Trabalho futuro                               | Risco evitado                             |
| ---------- | ---------: | --------------------------------------------- | ----------------------------------------- |
| SEG-001    |         P0 | autenticar e tornar atômico o push dispatcher | abuso de `service_role`, duplicidade, DoS |
| SEG-002    |         P0 | fechar `grant_coin_event`                     | fraude de moedas                          |
| SEG-003    |         P0 | fechar `award_xp`                             | progressão arbitrária                     |
| SEG-004    |         P0 | fechar conquistas/missões internas            | recompensas forjadas                      |
| SEG-006    |         P0 | privatizar helper de notificação              | spam/phishing interno                     |
| SEG-005    |      P0/P1 | baseline de ACL das funções                   | novas exposições silenciosas              |
| SEG-007    |      P0/P1 | rate limit da IA                              | custo e indisponibilidade                 |
| SEG-008    |         P1 | quarentena em falha de IA                     | publicação sem moderação                  |
| SEG-009    |         P1 | rever bucket público de fotos                 | vazamento de mídia                        |
| SEG-010    |         P1 | retirar `.env` e escanear histórico           | vazamento futuro de segredos              |
| SEG-011    |         P1 | cabeçalhos e CSP                              | XSS, framing, abuso de browser APIs       |
| SEG-015    |         P1 | revisar leituras amplas                       | exposição de preferências/atividade       |
| SEG-016    |         P1 | testar Realtime por participante              | vazamento em tempo real                   |
| SEG-018    |         P2 | endurecer reparo administrativo               | abuso/erro operacional                    |
| SEG-020    |         P2 | consolidar locks e atualizar dependências     | supply chain e CVEs                       |
| AVATAR-RET |     Futuro | retirada segura do avatar customizável        | perda de dados e quebra de foto/perfil    |

---

## 11. Evidências que dependem do Supabase publicado

Antes de aplicar qualquer migration corretiva, será necessário extrair do ambiente real:

- lista final de schemas, tabelas, views e funções;
- proprietário e `proconfig` de cada função;
- ACL completa por assinatura;
- funções executáveis por `PUBLIC`, `anon` e `authenticated`;
- políticas RLS ativas;
- grants diretos em tabelas/sequences;
- buckets, visibilidade e políticas de `storage.objects`;
- publicações Realtime;
- extensões e jobs cron;
- triggers ativos;
- configurações de Auth;
- URLs permitidas de redirect;
- logs de chamadas RPC e anomalias de saldo/progressão;
- secrets/config do deploy sem revelar seus valores.

Esse levantamento pertence ao Item 3 e deve comparar “o banco publicado” com “o que as migrations parecem produzir”.

---

## 12. Limitações desta etapa

Não foram realizados:

- chamadas contra produção;
- exploração de RPCs;
- leitura de dados de usuários;
- alteração de permissões;
- execução de migration;
- rotação de chaves;
- verificação dos cabeçalhos do domínio publicado;
- teste integral de Auth/RLS sem credenciais controladas;
- auditoria confiável via Bun, pois o binário não estava disponível no ambiente desta análise.

O `npm audit` foi consultado apenas como sinal auxiliar, mas seu lock está desatualizado e não representa a instalação oficial. As versões relevantes foram confrontadas com o `bun.lock` sem modificar dependências.

---

## 13. Contrato de não alteração

Durante o Item 2:

- nenhum arquivo do repositório foi editado;
- nenhuma migration foi criada ou aplicada;
- nenhuma política RLS foi alterada;
- nenhuma RPC foi revogada;
- nenhum segredo foi rotacionado;
- nenhum endpoint foi modificado;
- nenhum dado ou asset de avatar foi removido;
- nenhum commit ou pull request foi criado.

Este documento é o plano de segurança para implementação posterior, com validação e rollback por onda.

---

## 14. Conclusão

A prioridade imediata do VaiDarNamoro não deve ser redesenhar o Item 1 nem iniciar a remoção do avatar. Primeiro é preciso fechar as superfícies que permitem contornar fluxos confiáveis do servidor.

O maior aprendizado desta etapa é que as operações econômicas foram corretamente movidas para SQL transacional, mas algumas funções auxiliares internas ficaram expostas como RPCs. Isso reduz a proteção esperada: o cálculo acontece no servidor, porém o usuário ainda pode acionar diretamente o mecanismo de prêmio.

Depois da contenção P0, o Item 3 deverá produzir o snapshot canônico do Supabase. Só então será possível afirmar com precisão quais permissões estão ativas e preparar migrations corretivas sem depender da interpretação de 196 arquivos históricos.
