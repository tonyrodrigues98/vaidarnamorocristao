# T46-24.2 — Shells de autenticação, onboarding e documentos

- Auth usa um shell especializado com asset oficial, sem navegação principal, preservando os providers, validações, OAuth, recuperação e redirects existentes.
- Onboarding usa um shell próprio sem liberar o Native App Shell antes da aprovação da conta; passos, upload, moderação e saves permanecem nas rotas.
- Manual e Termos usam DocumentShell. Com sessão aprovada e flag ativa, o registry permite o Native Shell com Perfil ativo; fora disso, o documento permanece acessível no shell documental.
- Manual foi alinhado às cinco áreas reais, ao relacionamento opcional dentro de Explorar e aos temas Sistema, Claro e Escuro.
- Os Termos não foram reescritos. A auditoria em `docs/legal/terms-product-consistency-audit.md` exige revisão jurídica humana.
- Instalar usa PublicShell e preserva detecção e instruções PWA existentes.
- Nenhum provider, endpoint, query, mutation, rota, migration ou backend foi criado.
- Smoke local/harness não representa autenticação ou Supabase E2E.
- Rollback: `VITE_FF_NATIVE_SHELL=false` ou `git revert <commit-da-t46-24.2>`.
