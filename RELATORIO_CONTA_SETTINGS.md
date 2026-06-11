# Relatório — /conta como Settings app-like

## Arquivos alterados
- `src/routes/conta.tsx` — adicionado aviso offline (StaleDataNotice) e bloqueio visual/interativo da Zona de perigo offline.

## Estado encontrado (auditoria)
A /conta já estava bem estruturada como settings app-like antes desta tarefa:
- Layout em `SettingsGroup` + `SettingsItem` (ícone, título, descrição, chevron, área de toque confortável).
- Mini card de perfil no topo linkando para `/perfil`.
- Tema light/dark via `useTheme()` de `src/lib/theme.tsx` (local, funciona offline).
- Grupo "Equipe" condicionado a `role !== "user"` — fonte real vinda do `useAuth()`.
- `AccountDangerZone` já cobria desativar/excluir conta com fluxo de 3 etapas e signOut próprio.

Rotas confirmadas existentes (sem links quebrados): `/perfil`, `/verificacao`, `/bloqueados`, `/notificacoes`, `/suporte`, `/manual`, `/termos`, `/admin`. Não há rota `/privacidade` no projeto — corretamente não foi adicionada.

## Estrutura final da /conta

| Grupo | Itens | Destino real |
|---|---|---|
| (topo) | Mini card do usuário | `/perfil` |
| Equipe (só staff) | Painel administrativo | `/admin` |
| Perfil e segurança | Perfil e dados pessoais / Verificação de perfil / Pessoas bloqueadas | `/perfil`, `/verificacao`, `/bloqueados` |
| Preferências | Notificações / Tema do app (Switch inline) | `/notificacoes`, local |
| Suporte e documentos | Ajuda e suporte / Manual do app / Termos de uso | `/suporte`, `/manual`, `/termos` |
| Sessão | Sair da conta | onClick → `signOut()` |
| Zona de perigo | `AccountDangerZone` (desativar/excluir) | inline (modal multi-etapa) |

## Tema
- Hook: `useTheme()` em `src/lib/theme.tsx`. Persistência local (localStorage), 100% offline.
- Caminho principal: `/conta` → grupo Preferências → Switch "Tema do app" (descrição reflete estado atual).
- Não duplicado em /perfil nem em outras telas dentro do escopo desta tarefa.

## Offline
- **Aviso usado**: `StaleDataNotice` no topo da página quando `!isOnline`:
  > "Você está offline. Algumas ações de conta ficam disponíveis somente online."
- **Continua funcionando offline**: alternar tema (local), navegar para links internos (TanStack Router), abrir mini card de perfil, ler texto da página.
- **Bloqueado offline**: Zona de perigo recebe banner vermelho próprio e fica com `pointer-events-none opacity-60` + `aria-disabled`. Mensagem:
  > "Disponível online. Reconecte-se para alterar dados de segurança ou excluir a conta."
- **Sair da conta**: mantido funcional (Supabase signOut limpa sessão local mesmo offline; em caso de erro o handler já mostra toast). Decisão: per spec "se for seguro manter, manter".

## Admin
- Fonte real: `role` retornado por `useAuth()` (mesma fonte usada pelo restante do app, baseada em `user_roles`).
- Aparece quando `role !== "user"` (staff: admin, moderator, operator, super_admin etc.).
- Oculto para usuários comuns. Sem fallback fake.

## Links
Todas as rotas referenciadas existem no `src/routes/`:
- `/perfil`, `/verificacao`, `/bloqueados`, `/notificacoes`, `/suporte`, `/manual`, `/termos`, `/admin`.
- Nenhuma rota nova criada. Nenhum link quebrado.

## Mobile / overflow
Sem alterações estruturais nesta tarefa. Layout já usa `max-w-2xl`, `min-w-0`, `truncate` no nome/email do mini card, e padding consistente. Os botões da Sessão e Zona de perigo continuam acima do bottom nav (page já tem `pb-24` implícito via main container; main usa `py-6 sm:py-10` mas o card final inclui `pb-6` de texto). Nenhum overflow horizontal introduzido.

## Validação
- `bunx tsc --noEmit` → **exit 0**, sem erros.
- Revisão estática: imports OK, sem variáveis não usadas.
- Não testado em iPhone/Android real.

## Confirmações
- Não mexeu em banco, migrations, RLS, schema, auth interno.
- Não criou rotas, dados, permissões, toggles ou preferências fake.
- Não instalou biblioteca. Não usou Capacitor nem Workbox.
- Não alterou `AccountDangerZone` internamente — apenas envolveu com camada offline.
- Não alterou `useTheme` nem `useAuth`.
