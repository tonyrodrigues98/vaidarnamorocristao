# Estado de execução V2

## Base atual

- Repositório: `tonyrodrigues98/vaidarnamorocristao`.
- `origin/main`: `fde3efd08cc59510006138e490ccd85350a905cf`.
- PR #7 permanece Draft em `rebuild/v2-006-legacy-audit`.
- O conteúdo auditado do PR #7 foi reaplicado sem alteração semântica sobre a
  documentação adicionada à `main`; o patch-id permaneceu idêntico.
- V2-007 usa a branch empilhada `rebuild/v2-007-account-foundation`.

## Concluído

- V2-001 a V2-005 estão na `main`.
- V2-006 produziu auditoria, inventário, plano de desativação e testes read-only.
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

## Evidência de validação

- Instalação congelada e TypeScript: aprovados.
- Suíte segura: 27 arquivos e 188 testes aprovados.
- ESLint e Prettier focados: aprovados.
- Build TanStack/Vite cliente e SSR: aprovado; warnings de dependências são
  baseline.
- Auditoria reproduzível: 67 rotas, 465 referências, 449 módulos, 2.616 imports,
  um ciclo gerado conhecido e zero ciclos em `src/v2`.
- Smoke isolado aprovado em 320, 360, 390, 430, 768, 1024 e 1440 px, sem overflow
  horizontal; nenhum backend foi carregado.
- Bundle público: nenhum segredo server-only ou `service_role`; o único JWT
  embutido é a chave pública legada com papel `anon`.

## Próximo gate

- Publicar o Draft PR empilhado da V2-007 sem merge.
- Iniciar V2-008 somente sobre a branch publicada e manter qualquer conclusão
  sobre ACL/RLS publicado como não verificada até existir snapshot autenticado
  e ambiente Supabase descartável.
