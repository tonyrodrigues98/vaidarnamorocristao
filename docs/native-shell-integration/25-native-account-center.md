# T46-17 — Central Native de Configurações e Conta

- Parent tab: `profile`; a navegação principal continua com cinco destinos.
- Título contextual: `Configurações`, resolvido pelo registry de destinos secundários.
- Flag desligada: `/conta` mantém a apresentação V1.
- Flag ligada e sessão resolvida: `/conta` usa o Native Shell com Perfil ativo.
- Fonte única: `ContaPage` continua dona de autenticação, tema, rede, logout e metadados.
- A apresentação Native não consulta Supabase. `AccountDangerZone` permanece dona exclusiva de sua consulta e RPCs e só monta na apresentação ativa.
- Foram preservados Perfil, Verificação, Bloqueados, Notificações, Tema (Sistema/Claro/Escuro), Suporte, Manual, Termos, logout, painel de staff e todos os fluxos de desativação/exclusão.
- Limitação: o resumo usa somente metadata de autenticação; não existe consulta adicional a `profiles`.
- Smoke estrutural: `/conta` legado com flag off e Native/Perfil/Configurações com flag on.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-17>`.
