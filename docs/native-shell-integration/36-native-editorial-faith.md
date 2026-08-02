# T46-25.1 — Editorial e fé no Native Shell

- Devocional e Quiz Bíblico herdam Explorar; Notícias e Orações herdam Comunidade.
- `/noticias` agora é classificada corretamente como destino app aprovado, mantendo a URL e o gate real.
- Flag off preserva as apresentações V1; flag on fornece chrome Native contextual sem duplicar estado.
- Devocional preserva `daily_posts`, paginação, perfis, reações, orações, streak, comentários, replies, likes, reports, moderação e `devocional-live`.
- Notícias preserva a query `news-posts`, `daily_posts`, seen state e o channel `daily-posts`.
- Orações preserva pedidos, anonimato, prayed state, reports, moderação e `prayer-requests-live`.
- Quiz preserva `get_today_quiz`, `answer_quiz`, perguntas, resposta posterior, explicação, XP e bônus atuais.
- Nenhuma query, mutation, channel, RPC, tabela, rota ou backend foi criado.
- Smoke local/harness não representa E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-25.1>`.
