# T46-24.1 — Workspace Native de suporte

- `/suporte`, `/suporte/ajuda` e `/suporte/$id` possuem regras exatas/prefix separadas, herdam Perfil e exibem Suporte, Central de Ajuda e Chamado.
- Flag off preserva o V1; flag on usa o Native Shell sem Header legado.
- A lista preserva `support_tickets`, `support_tickets_list`, filtros, staff, limite 200, criação, cinco imagens de até 5 MB e bucket `support-attachments`.
- Após criar chamado, a navegação usa TanStack Router sem reload e mantém o ID real.
- O detalhe preserva `support_ticket_${id}`, messages, assignment, status, anexos privados e signed URLs de 3600 segundos.
- A ajuda preserva artigos, busca, categoria, drafts staff, views, RPC e CRUD existente.
- Nenhum channel, bucket, query, tabela, RPC ou backend novo foi criado.
- Smoke estrutural/harness não representa E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-24.1>`.
