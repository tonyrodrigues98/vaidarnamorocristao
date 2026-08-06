# T46-20 — Santuário Native do Meu Pet

- Parent tab: `explore`; título contextual: `Meu Pet`.
- Flag off preserva integralmente o wrapper e a apresentação V1.
- Flag on usa o Native Shell e um wrapper semântico em torno do mesmo conteúdo funcional.
- Fonte única: `MeuPetPage` mantém autenticação, Query Client e uma chamada a `myPetV2QueryOptions`; `Showcase` e `Wizard` não foram copiados.
- Foram preservados criação, identidade, renomear, visibilidade, living room, cenário, dia/noite, modo cena/lista, cuidado, necessidades, buffs, long press, histórico, XP, streak, baú, progressão, evolução, missões, expedições, eventos, timers e polling.
- Custos, XP, recompensas, raridades, necessidades, RPCs e tabelas não mudaram.
- O wrapper Native não possui query, mutation, timer ou backend.
- Smoke estrutural cobre flag off/on, wizard e pet existente; não representa E2E contra Supabase.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-20>`.
