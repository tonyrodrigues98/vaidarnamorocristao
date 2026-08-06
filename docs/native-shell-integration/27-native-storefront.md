# T46-19 — Loja Native

- Parent tab: `explore`; a navegação principal continua com cinco destinos.
- Título contextual: `Loja`, resolvido pelo registry secundário.
- Flag desligada: `/loja` mantém integralmente a apresentação V1.
- Flag ligada: a rota usa o Native Shell com Explorar ativo e cabeçalho/categorias Native.
- Fonte única: `LojaPage` continua dona de autenticação, rede, categoria, busy state, dialogs, pull-to-refresh, Query Client, catálogos, saldo, inventários, equipados, brindes e mutations.
- Query keys preservadas: `shop-catalog`, `user-balance`, `user-decoration-inventory`, `user-background-inventory`, `user-name-gradient-inventory`, `shop-equipped-items` e `freebie-status`.
- Compras, equipar/remover, preços, raridades, previews, saldo, itens possuídos/equipados, inventário, brindes e confirmações permanecem nos componentes e handlers existentes.
- O cabeçalho Native é puramente apresentacional e não acessa Supabase.
- Offline, cache antigo, skeleton, bloqueios de compra/visual, pull-to-refresh e resolução após settle continuam na rota.
- Não houve moeda, pagamento, backend, schema, preço ou dependência nova.
- Limitação: smoke é estrutural, sem sessão Supabase local segura ou E2E remoto.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-19>`.
