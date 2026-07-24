# Estado de execução V2

## Base atual

- Repositório: `tonyrodrigues98/vaidarnamorocristao`.
- `origin/main`: `fde3efd08cc59510006138e490ccd85350a905cf`.
- PR #7 permanece Draft em `rebuild/v2-006-legacy-audit`.
- O conteúdo auditado do PR #7 foi reaplicado sem alteração semântica sobre a
  documentação adicionada à `main`; o patch-id permaneceu idêntico.
- V2-007 foi publicada no Draft PR #8, branch
  `rebuild/v2-007-account-foundation`, commit
  `249b4c8aca9ea8f82a3e6e68f55894c780b0e182`.
- V2-008 foi dividida em Draft PRs empilhados de baseline, capabilities, push,
  aplicação e reparo administrativo.
- V2-009A está no Draft PR #15, branch
  `rebuild/v2-009-identity-capabilities`, commit
  `feac4d40c3f5fce10ba30e11c1bb273bb01a5cd7`.
- V2-009B está no Draft PR #16, branch
  `rebuild/v2-009-community-acquisition`, commit
  `053b4d3c7f56bfdea174420d8f5fb0fe0fff2b3f`.
- Lote ativo: V2-009C em `rebuild/v2-009-onboarding-opt-in`, empilhado sobre a
  aquisição pública. Nenhum PR da pilha foi mesclado ou publicado.

## Concluído

- V2-001 a V2-005 estão na `main`.
- V2-006 produziu auditoria, inventário, plano de desativação e testes read-only.
- V2-007 está concluída no Draft PR empilhado de Conta.
- V2-008 está concluída localmente: todo P0/P1 possui estado explícito,
  evidência, gate publicado e rollback/forward-fix.
- Contexto permanente instalado em `AGENTS.md`.

## V2-007 concluída no branch

- V2-007 — Configurações/Conta e fundação reutilizável implementada.
- Rota alvo: `/v2/configuracoes`, protegida pela flag e pelo boundary canônicos.
- Legado `/conta` permanece como fallback até paridade e ambiente descartável.
- A UI cobre loading, vazio, erro, offline, atualização, sucesso, desativação,
  reativação, cancelamento e solicitação de exclusão.
- O shell recebe apenas `userId` canônico no boundary de runtime; sessão, token,
  e-mail, telefone e cliente Supabase não atravessam a fronteira visual.

## Contratos reais de Conta

- Leitura: `profiles.deactivated_at`, `deletion_requested_at` e
  `deletion_scheduled_for` para o usuário autenticado.
- Comandos: `request_account_deactivation`,
  `request_account_reactivation`, `request_account_deletion` e
  `cancel_account_deletion`.
- Aparência usa o `ThemeProvider` local existente.
- Perfil, verificação, bloqueados, notificações, suporte, manual e termos
  permanecem destinos legados explícitos.

## Riscos e gates

- Sem Supabase descartável não é possível confirmar RLS/grants/RPCs publicados
  nem executar testes mutáveis; produção não será usada.
- Achados P0 históricos de economia/XP/missões/notificações continuam fora do
  escopo funcional de Conta e precisam de snapshot autenticado próprio.
- Não há merge, deploy, migration, secret, Vault, Job ou mutação externa
  autorizada.

## V2-008 — checkpoint de segurança

- Manifest tipado cobre `SEG-001` a `SEG-020` e diferencia HEAD, tipos,
  migrations e verdade publicada.
- Snapshot publicado não foi capturado; schema e runbook read-only estão
  preparados sem PII ou segredos.
- Moderação de foto valida corpo, base64, MIME e magic bytes, limita seis
  requisições por minuto por usuário/instância e aborta a IA em 15 segundos.
- Falha técnica agora bloqueia o upload; o caminho `soft:true` foi removido.
- Logs de moderação são categóricos e não incluem identidade, imagem, token,
  resposta do provedor ou exceção.
- Migration local não aplicada fecha cinco RPCs genéricas de
  moeda/XP/missões/conquistas/notificações e cria uma capability idempotente para
  XP de cuidado.
- O browser não envia mais source, quantidade, cap ou metadata de XP.
- Migration local não aplicada adiciona claim atômico do push com
  `FOR UPDATE SKIP LOCKED`, lease por token, retries exponenciais, TTL e dead
  letter. O adapter deixou de registrar endpoint, resposta do provedor ou stack.
- Moderação de fotos possui limite local; rate limit distribuído continua como
  gate operacional da V2-008.
- Reparo administrativo agora fecha por flag server-only, exige Origin e
  confirmação, oferece dry-run, valida bytes JPEG e registra eventos em tabela
  append-only preparada por migration não aplicada.
- `.env` rastreado foi retirado; o exemplo contém somente placeholders públicos.
- HTML do blog passa por allowlist SSR-safe; previews administrativos exigem
  origem exata, HTTPS, sandbox e política de referrer.
- Headers defensivos e CSP compatível com o legado foram registrados no request
  middleware. O domínio publicado continua sem verificação.

## Evidência de validação

- Instalação congelada e TypeScript: aprovados.
- Suíte segura: 40 arquivos e 304 testes aprovados.
- ESLint e Prettier focados: aprovados.
- Build TanStack/Vite cliente e SSR: aprovado; warnings de dependências são
  baseline.
- Auditoria reproduzível: 68 rotas, 485 referências, 465 módulos, 2.666 imports,
  um ciclo gerado conhecido e zero ciclos em `src/v2`.
- Smoke isolado aprovado em 320, 360, 390, 430, 768, 1024 e 1440 px, sem overflow
  horizontal; nenhum backend foi carregado.
- Bundle público: nenhum segredo server-only ou `service_role`; o único JWT
  embutido é a chave pública legada com papel `anon`.

## V2-009 em execução

- A primeira fatia cria `accountStatus`, `primaryRole`, `capabilities`,
  `canEnter(domain)`, `isApproved` e `isRestricted`.
- A identidade canônica deriva somente de sessão, `user_roles`, perfil e termos
  confirmados pelo código/tipos.
- O runtime V2 declara o domínio exigido por rota e filtra a navegação por
  capability.
- Namoro permanece `inactive` por padrão; nenhum dado legado é interpretado
  como consentimento.
- Aquisição pública e onboarding são entregues em Draft PRs separados.

## V2-009B — aquisição pública

- A entrada `/` apresenta primeiro a comunidade, com CTA para `/inicio` e
  cadastro, e mantém a experiência completa da live logo abaixo.
- A live da Caren conserva link, equipe, destaques, dinâmica, FAQ e CTA; o modo
  `embedded` remove somente a navegação duplicada na composição da home.
- Navegação, páginas institucionais, blog, cadastro, metadados e manifesto PWA
  usam posicionamento community-first.
- Pretendentes saiu dos atalhos universais do manifesto, sem remoção da rota ou
  dos dados do domínio.
- Namoro é descrito como opcional e não é ativado por cadastro ou participação
  comunitária.
- Termos e manual permanecem intactos até revisão jurídica/operacional própria.

## V2-009C — onboarding e opt-in

- O onboarding comunitário versionado coleta identidade, maioridade, foto,
  localização, apresentação, fé e privacidade.
- Sexo, estado civil, altura e preferências foram isolados na rota opcional
  `/onboarding/namoro`.
- Namoro e recados anônimos começam desligados; somente RPC autenticada ativa a
  membership.
- Migration aditiva local, ainda não aplicada, expande perfis, progresso e
  memberships com RLS owner-only e comandos server-authoritative.
- O caminho legado permanece integral quando as flags estão desligadas.
- TypeScript, 40 arquivos/304 testes seguros, lint e Prettier focados, build
  cliente/SSR e inspeção do bundle foram aprovados sem acesso remoto.

## Próximo lote

- Validar as migrations de capabilities e push em Supabase descartável antes de
  qualquer rollout.
- Manter qualquer conclusão sobre ACL/RLS publicado como não verificada até
  existir snapshot autenticado e ambiente Supabase descartável.
- Validar e publicar o Draft PR da V2-009C; depois iniciar a V2-010 em branch
  empilhada, sem aplicar migrations ou ativar flags.
