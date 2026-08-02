# T46-21 — Pet Arcade Native

- Parent tab: `explore`; título contextual: `Arcade`.
- Flag off preserva a apresentação V1; flag on aplica o chrome Native à mesma rota.
- `PetArcadePage` continua como fonte única de autenticação, pet, cuidado, saldo, catálogo, configuração, uso, histórico, rounds e jogo ativo.
- As query keys e invalidações existentes foram preservadas, sem segunda instância de query ou estado de jogo.
- Os 17 tipos e componentes reais permanecem mapeados: treasure, flight, plinko, keno, wheel, hilo, towers, coinflip, race, memory, piggybank, dice, scratch, egg, album, capsule e missions.
- Custos, recompensas, odds, limites, rounds, moedas internas e mutations não mudaram. Não há dinheiro real nem backend novo.
- O cabeçalho Native é exclusivamente apresentacional e usa pet, cuidado, saldo e uso já carregados pela rota.
- Smoke estrutural cobre flag off/on, catálogo e estágio de jogo; não representa E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-21>`.
