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
- V2-009C está no Draft PR #17, branch `rebuild/v2-009-onboarding-opt-in`,
  commit `f3de66cb72f092a0c8b15edede2525021c177975`.
- V2-010 está no Draft PR #18, branch `rebuild/v2-010-social-home`, commit
  `68e6d4a8b42d0124bfb913f615cdae224a45f844`.
- V2-011 está no Draft PR #19, branch `rebuild/v2-011-community-spaces`, commit
  `14d475a66daf78ff070fb799f193b8378aa47d06`.
- V2-012 está no Draft PR #20, branch `rebuild/v2-012-conversations`, commit
  `77f6c635c6a327adf4920c29d011957a2de1a6f8`.
- V2-013 está no Draft PR #21, branch `rebuild/v2-013-modular-profile`, commit
  `15a8dacbaf9a4ffa406a15fbb4259956c73d8ae0`.
- V2-014 está no Draft PR #22, branch `rebuild/v2-014-dating-mode`, commit
  `105e920c00b29e7e135fdcd6709cdcf79cd68eba`.
- V2-015 está no Draft PR #23, branch `rebuild/v2-015-purpose-notes-gifts`, commit
  `ed212229ba5ff5e13b7b700d65c1a32214f72cd1`.
- V2-016 está no Draft PR #24, branch `rebuild/v2-016-economy-shop-inventory`,
  commit `6cf03449544b0d1751dc78557037d244ff321287`.
- V2-017 está no Draft PR #25, branch `rebuild/v2-017-pets-arcade-games`,
  commit `7e9645769f64e8707b6c9ffd4c6bd0b3f474c070`.
- Lote ativo: V2-018 em `rebuild/v2-018-christian-content-verbo`, empilhado
  sobre a V2-017.
  Nenhum PR da pilha foi mesclado ou publicado.

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
- Suíte segura: 61 arquivos e 448 testes aprovados.
- ESLint e Prettier focados: aprovados.
- Build TanStack/Vite cliente e SSR: aprovado; warnings de dependências são
  baseline.
- Auditoria reproduzível: 69 rotas, 499 referências, 506 módulos, 2.810 imports,
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

## V2-010 — Início, vínculos e Status

- `/v2/inicio` usa um agregador server-authoritative e cache segregado por
  usuário; `/dashboard` continua independente.
- Follow e conexão bilateral possuem comandos explícitos, privacidade,
  bloqueio bidirecional e limites anti-spam no contrato SQL aditivo.
- Feed, comentários e reações respeitam audiência, bloqueio e moderação.
- Status usa mídia privada, URLs assinadas em lote, audiência, visualização e
  expiração em 24 horas; o job de limpeza permanece gate operacional e não foi
  criado.
- `/membros` agora resolve por alias controlado para descoberta comunitária,
  com fallback `/inicio` quando as flags estão desligadas.
- Card romântico só aparece quando a capability `dating` está ativa.
- Migration local não aplicada cria somente estruturas aditivas; não houve
  acesso a banco publicado.

## V2-011 — Comunidade

- `/v2/comunidade` integra espaços, memberships, eventos, presença e o
  histórico existente de `global_messages`.
- Namoro, saldo, inventário e sanção global permanecem fora das fronteiras do
  domínio comunitário.
- Papéis owner/moderator/member e decisões de membership são server-authoritative
  e possuem auditoria append-only no contrato SQL aditivo.
- Bloqueio global prevalece sobre descoberta, mensagens e presença.
- O hub usa uma consulta agregada e uma subscription Realtime com cleanup.
- `/comunidade` e o chat global legado continuam preservados como fallback.
- Migration local não aplicada exige validação RLS/RPC/Realtime em Supabase
  descartável antes de qualquer flag.

## V2-012 — Conversas

- `/v2/conversas` usa uma inbox contextual com paginação estável, envio
  otimista, retry idempotente, leitura, rascunho segregado, preferências e
  Realtime com cleanup.
- `messages` e `global_messages` permanecem como fontes legadas por adapters;
  novas conversas sociais usam estruturas canônicas aditivas.
- Solicitações sociais respeitam bloqueio e `messages_from`; não dependem de
  matches.
- Matches aparecem somente com Namoro ativo. Durante Propósito Firmado, somente
  o match comprometido permanece acessível.
- Migration local não aplicada adiciona `client_message_id`, RLS, RPCs e
  metadados/bucket privado de anexos. Upload de anexos ainda não foi exposto.
- Edição, exclusão, reactions, typing, virtualização e telemetria operacional
  permanecem gates explícitos; o legado não foi removido.

## V2-013 — Perfil modular

- `/v2/perfil` monta uma experiência comunitária modular somente com a flag
  canônica de Perfil.
- Ordem, visibilidade e audiência são configurações separadas dos dados-fonte.
- Privacidade, bloqueios e propriedade de itens são aplicados no agregador
  server-side; preferências românticas não entram no payload.
- Foto, galeria, presentes, conquistas, pet e itens equipados continuam nas
  estruturas existentes.
- Migration local aditiva e não aplicada prepara configuração, RLS e RPCs com
  concorrência otimista.
- Perfil legado e edição dos dados-base permanecem como fallback.

## V2-014 — Modo Namoro opcional

- `/v2/pretendentes` integra descoberta romântica somente com flag e capability
  canônicas ativas; Comunidade não concede disponibilidade romântica.
- Estados inativo, ativo, pausado, confirmação legada, comprometido e restrito
  são distintos e falham fechados.
- A regra atual foi encapsulada como `legacy-opposite-sex-v1`; qualquer mudança
  bilateral futura exige decisão de produto explícita.
- Descoberta server-authoritative aplica membership ativa nos dois lados,
  preferências do observador, bloqueio bilateral, Propósito e staff oculto.
- Paginação por cursor, histórico de impressão, interesse idempotente, lock por
  dupla e match canônico são preparados por migration aditiva não aplicada.
- Pausa, desativação, bloqueio e denúncia preservam interesses, matches,
  conversas e histórico legítimo.
- O legado `/pretendentes` permanece reversível e nenhum dado foi removido.

## V2-015 — Propósito, recados e presentes

- `/v2/proposito` e `/v2/recados` exigem a flag e a capability canônicas de
  Namoro; não aparecem para participantes comunitários fora do modo romântico.
- Propósito usa máquina de estados explícita, lock, idempotência e eventos
  append-only; rejeição/cancelamento não apagam dados.
- Aceite pausa somente `dating_memberships`; encerramento não reativa Namoro.
- Página do casal agrega linha do tempo, mensagens, cápsulas protegidas e
  presentes sem criar uma segunda economia.
- Recados exigem opt-in estrito, elegibilidade, bloqueio, limite/cooldown e
  moderação; identidade não entra no payload antes da revelação mútua.
- Presentes contextuais envelopam `send_virtual_gift` na mesma transação e não
  reclassificam o histórico.
- Migration local aditiva e não aplicada preserva compromissos, recados,
  denúncias, transações, saldos, cápsulas e matches.

## V2-016 — Economia, loja e inventário

- `/v2/loja` monta o novo hub somente com flag e capability canônicas de
  economia; `/loja` e todas as fontes legadas permanecem preservadas.
- O browser envia somente intenção, item e UUID idempotente. Preço, saldo,
  propriedade, slot e entrega permanecem server-authoritative.
- Compras e equipamentos V2 envolvem as RPCs atômicas existentes e registram
  recibos sem consolidar `user_decorations`, fundos ou gradientes.
- Saldo, XP, ledger e equipamento possuem projeção de reconciliação sem
  correção automática.
- Badges, presentes, avatar legado e itens de pets permanecem em famílias
  independentes, visíveis somente como contagens de preservação no hub.
- Caixas de chance permanecem fechadas por gate server-only até decisão
  jurídica/comercial e transparência de odds.
- Migration local aditiva e não aplicada; nenhum saldo, inventário, policy ou
  dado remoto foi alterado.

## Próximo lote

- Validar as migrations de capabilities e push em Supabase descartável antes de
  qualquer rollout.
- Manter qualquer conclusão sobre ACL/RLS publicado como não verificada até
  existir snapshot autenticado e ambiente Supabase descartável.
- Validar o Draft PR da V2-018; depois implementar a V2-019 — Sala de Cinema
  em branch empilhada, sem aplicar migrations ou ativar flags.

## V2-017 — Pets e Pet Arcade

- `/v2/meu-pet` monta o hub somente com flag e capability dedicadas; `/meu-pet`
  e `/pet-arcade` permanecem fallbacks integrais.
- `user_pets` e `user_pets_v2` continuam separados e aparecem como contagens de
  preservação, sem backfill ou consolidação.
- Decay/regeneração usam âncoras e `server_now`; a UI não grava tempo nem abre
  timers concorrentes.
- Cuidado usa UUID idempotente e envolve `apply_pet_care`, preservando locks,
  compatibilidade, limites, economia e reward server-authoritative.
- Os 17 jogos existentes permanecem no manifesto como
  `awaiting-product-decision`; nenhum jogo, asset, progresso, odds ou reward foi
  removido ou alterado.
- Arcade é carregado de forma lazy e apenas consulta catálogo, uso e histórico;
  rodadas continuam no runtime legado.
- Migration local aditiva e não aplicada; nenhuma tabela, policy, saldo,
  inventário ou dado remoto foi alterado.

## V2-018 — Conteúdo cristão e Verbo

- `/v2/verbo` integra devocionais publicados e um leitor lazy sob flag e
  capability próprias.
- Fonte bíblica só pode ser habilitada com licença e revisão editorial
  aprovadas; nenhuma tradução ou texto foi importado.
- Notas, favoritos, progresso, estudos e desafios são privados por padrão e
  protegidos por RLS owner-only no contrato local.
- Notas usam versão e conflito otimista; não há sobrescrita silenciosa.
- Oração, quiz, blog, notícias, interações, moderação e Admin legados permanecem
  intactos.
- Ranking espiritual, prova pública de fé, IA paga, offline e progresso social
  permanecem fechados.
- Migration local aditiva e não aplicada; nenhum conteúdo, dado ou ambiente
  externo foi alterado.
