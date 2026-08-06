# T46-22 — Modo namoro opcional

- As superfícies `/pretendentes`, `/pretendentes/$id`, `/interesses`, `/matches` e `/recados` herdam `explore`; nenhuma aba principal foi criada.
- Os títulos contextuais são `Namoro`, `Perfil`, `Interesses`, `Matches` e `Recados`. Detalhes e áreas auxiliares retornam para `/pretendentes`.
- A navegação local usa somente Descobrir, Interesses, Matches e Recados, com rotas reais e sem queries, badges ou contadores.
- Flag off preserva as apresentações V1. Flag on usa o Native Shell e mantém a camada de dados de cada rota como fonte única.
- Pretendentes usa lista/grid no modo Native, preserva filtros, ordenação, fotos, chips reais, bloqueios, commitments e aprovação; a variante Native não mostra swipe nem porcentagem.
- O detalhe preserva galeria, identidade, fé, propósito, interesse, match, conversa, presente, recado, bloqueio e denúncia, sem score percentual.
- Interesses preserva recebidos/enviados, reciprocidade, cancelamento e `interests-page`.
- Matches preserva lista, conversa, perfil, unmatch e `matches-list`.
- Recados preserva inbox/outbox/hidden, configurações, pistas, respostas, revelação, denúncia, restauração, privacidade e realtime.
- Nenhuma query, channel, RPC, tabela, rota ou backend foi adicionado.
- Smoke estrutural cobre flag off/on e os contratos determinísticos; não representa E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-22>`.
