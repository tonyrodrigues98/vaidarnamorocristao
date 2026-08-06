# T46-25.2 — Experiências Native restantes

- Avatar, Criar avatar, Caixas, Conquistas e Presentes herdam Explorar sem criar aba principal.
- Flag off preserva o V1; flag on aplica chrome Native contextual às mesmas rotas e camadas de dados.
- Avatar preserva base, categorias, layers, cores, inventário, favoritos, moedas, preview, looks e autosave de 400 ms.
- Caixas preserva estado, pools, inventário, single/multi, cooldown, grátis diário, custos, odds, raridade, roleta, resultados, áudio e assets.
- Conquistas preserva `pet_achievements`, `user_achievements`, XP, níveis, progresso e recompensas reais.
- Presentes preserva catálogo, destinatário real, categorias, saldo, preço, modal e animação de envio.
- Nenhuma query, mutation, preço, odd, XP, recompensa, rota ou backend foi alterado.
- Smoke local/harness não representa E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-25.2>`.
