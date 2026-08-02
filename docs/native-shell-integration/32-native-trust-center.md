# T46-23.1 — Central Native de confiança

- `/verificacao`, `/bloqueados` e `/dashboard` herdam Perfil com títulos Verificação, Bloqueados e Insights.
- A flag desligada mantém a apresentação V1; ligada usa o Native Shell sem montar o Header legado.
- As rotas permanecem donas das queries, mutations, uploads e estados; nenhum componente de dados foi duplicado.
- Verificação preserva `profiles.verified`, `verification_requests`, bucket `verifications`, documentos, selfie, limite de 8 MB e paths atuais.
- Bloqueados preserva query key `blocked-users`, cache/offline e mutation otimista de desbloqueio.
- Insights preserva as três query keys, períodos e métricas reais, sem ranking ou estimativas.
- Nenhuma tabela, RPC, policy, bucket ou rota foi criada.
- Smoke é estrutural/harness; não representa E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-23.1>`.
