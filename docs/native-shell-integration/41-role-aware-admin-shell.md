# T46-26 — Admin Shell baseado em papel

- As 13 rotas administrativas usam um registry único para título, grupo, ícone, active state e visibilidade.
- Flag off preserva Header e AdminTopNav legados; flag on, sessão e papel resolvidos montam o AdminShell especializado.
- `/admin` aceita os quatro papéis staff conforme o guard atual. Ferramentas especializadas seguem seus guards; Presentes mantém registrada a ausência de guard local explícito.
- Desktop usa sidebar de 272 px, tablet rail de 72 px e mobile drawer com Escape, fechamento ao navegar, bloqueio temporário de scroll e restauração de foco.
- Header e AdminTopNav retornam antes de montar seus efeitos quando o contexto administrativo está ativo.
- O shell não importa Supabase e não cria query, mutation, channel, provider de autenticação ou backend.
- As tabs e operações internas de `/admin` permanecem na rota original.
- Smoke é estrutural/harness e não representa E2E administrativo contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-26>`.
