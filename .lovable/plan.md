Trabalho grande dividido em 6 partes independentes. Vou implementar em ordem, validando cada parte antes de seguir. Nada fora do escopo será tocado, design atual preservado, apenas ícones lucide/heroicons.

## Parte 1 — Histórico de Moderação de Fotos (admin/fotos)
- Mostrar a foto real (thumbnail) em cada item do histórico, lendo `photo_url` do log.
- Botão "Ver foto" abre modal responsivo (desktop + mobile) com:
  - Imagem grande
  - Resumo do perfil (nome, idade, cidade, igreja, status, link p/ perfil completo)
  - Decisão da IA + confiança + motivo
- Botões de ação rápida no modal e no card:
  - **Ver perfil** → abre `/pretendentes/$id` (ou `/admin/usuarios/$id` se existir) destacando a foto.
  - **Apagar foto** → abre prompt para motivo obrigatório, então:
    - Remove a foto do `profile_photos` (ou zera `photo_url` no `profiles` se for principal) **imediatamente**.
    - Remove o arquivo do storage.
    - Cria notificação para o usuário: "Sua foto foi removida por um administrador. Motivo: …".
    - Registra em `photo_moderation_log` decisão `admin_deleted`.

## Parte 2 — Ícone do "Bom dia" no /inicio
- Localizar o emoji estilo whatsapp (👋 / 🙋 / etc.) na saudação e substituir por ícone Lucide (`Sun` para manhã, `Sunset` tarde, `Moon` noite — ou `Hand` simples). Manter exatamente o mesmo layout.

## Parte 3 — Gerenciamento de Usuário em /admin (engrenagem)
Adicionar botão de engrenagem em cada usuário listado em /admin com menu:
1. **Requisitar alteração** — admin escolhe tipo (foto, bio, comportamento, outro) + texto. Cria registro em nova tabela `user_admin_requests` e notificação. Aparece em `/inicio` em nova seção abaixo de "Seu Espaço" → "Solicitações da equipe" (somente quando existir).
2. **Aviso (warning)** — destaque maior no perfil do usuário (alert vermelho/âmbar no topo de `/perfil` e em `/inicio`). Tabela `user_admin_warnings`. Notificação enviada.
3. **Ver perfil completo** — link para a página do perfil.
4. **Excluir permanentemente** — apaga `profiles` + dados relacionados imediatamente via RPC `admin_hard_delete_user(uuid, reason)`. NÃO apaga `auth.users` para permitir recadastro com mesmo email (limpa só dados públicos do schema public). Confirmação dupla obrigatória.

## Parte 4 — Sistema de Banimento
- Adicionar coluna `banned_at`, `banned_reason`, `banned_by` em `profiles` (ou nova tabela `user_bans`).
- Botão "Banir" no menu de engrenagem com motivo obrigatório.
- Guard global: usuário banido só acessa `/inicio`, `/notificacoes`, `/conta`, `/suporte` + logout. Outras rotas redirecionam para `/inicio`.
- `/inicio` para banido:
  - Esconde seções: "Comunidade viva", "Possíveis conexões", "Devocional do dia", "Como começar".
  - Mostra alerta de banimento dentro de "Seu espaço" com mensagem acolhedora + motivo.
  - Botão **Recorrer** (ícone `MessageCircleWarning`/`Gavel`) → abre textarea para apelação.
- Tabela `user_ban_appeals` (status: pending/answered/ignored, appeal_text, response_text).
- Aba **Banidos** em /admin: lista contas banidas. Onde houver apelação pendente, botão "Ver apelação" → modal com:
  - Texto da apelação
  - Botão **Responder** (cria resposta exibida em nova section em /inicio do usuário banido, junto da mensagem de banimento)
  - Botão **Ignorar** (marca apelação como ignorada e deixa o card "cinza")

## Parte 5 — Recompensas Pessoais novas em /perfil
**Antes de codar**, vou apresentar 10 sugestões em checkbox para você escolher. (pergunta abaixo)

## Parte 6 — QA final
- Build limpo, rotas geradas, RLS testada.
- Verificar que nada fora do solicitado foi alterado.
- Verificar mobile (viewport 714px informado pelo usuário).

---

### Ordem de execução
1. Parte 2 (rápida, isolada)
2. Parte 1 (modal + ações no histórico)
3. Parte 3 (engrenagem + requisições/avisos/exclusão)
4. Parte 4 (banimento + apelações)
5. Aguardar resposta da pergunta abaixo → Parte 5 (recompensas)
6. Parte 6 (QA)

### Migrações de banco previstas
- `user_admin_requests` (id, user_id, created_by, kind, message, status, created_at, resolved_at)
- `user_admin_warnings` (id, user_id, created_by, message, severity, created_at, acknowledged_at)
- `user_ban_appeals` (id, user_id, appeal_text, status, response_text, responded_by, responded_at, created_at)
- Em `profiles`: `banned_at`, `banned_reason`, `banned_by`
- RPC `admin_hard_delete_user(_user_id, _reason)` — security definer, restrito a admin/super_admin
- RPC `admin_ban_user`, `admin_unban_user`
- Decisão extra `admin_deleted` em `photo_moderation_log`
- Política RLS para todas tabelas novas (admin/super_admin gerenciam; usuário lê o que é dele)

### Pergunta obrigatória
Vou perguntar quais das 10 recompensas você quer implementar antes de codar a Parte 5.