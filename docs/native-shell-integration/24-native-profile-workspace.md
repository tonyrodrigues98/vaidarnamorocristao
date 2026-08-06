# T46-16 — Workspace Native de Perfil

## Arquitetura

- `PerfilPage` continua como única camada de auth, query, effects, estado de formulário, mutations, upload e callbacks.
- O contexto do Native Shell seleciona somente a apresentação: headers e navegação interna legados com a flag desligada; root, identidade e tabs Native quando ativo.
- Nenhum componente Native consulta Supabase, cria query, mutation ou form state paralelo.

## Identidade e navegação

- A identidade reutiliza foto, `GradientName`, status, idade, localização, igreja, role, contributor, propósito e pet reais.
- O avatar mantém aspecto 1:1 e tratamento circular somente no escopo Native.
- Tabs horizontais acessíveis preservam `profile`, `prefs`, `customizacao`, `saldo`, `presentes`, `missions` e `role` para staff.
- `?tab=...&edit=1` continua controlando deep link e abertura da edição.
- Não há timeline, followers, likes ou contadores fictícios.

## Funcionalidades preservadas

- Perfil e preferências: visualização, edição, validação, save/cancel, formulários avançados, offline e proteção contra refetch durante edição.
- Fotos: normalização HEIC, verificação, fila de moderação, bucket existente e galeria atual.
- Visual, Moedas, Presentes e Conquistas reutilizam `CustomizacaoTab`, `SaldoTab`, `ReceivedGiftsTab` e `MissionsPanel`.
- Staff mantém badge, cor, listagem pública, contributor e confirmação do banco.
- Pet, propósito, warnings, status pending/rejected/banned e dados stale permanecem no mesmo fluxo.

## Responsividade e limites

- Mobile usa tabs roláveis, fonte mínima de 16 px, alvos de 44 px e o padding/safe area do shell.
- Tablet e desktop usam a largura do shell sem segunda sidebar interna.
- Claro e escuro usam tokens semânticos; o tema escuro não é declarado visualmente congelado.
- Nenhum backend, rota, migration ou dependência foi adicionado.

## Rollback

- Imediato: `VITE_FF_NATIVE_SHELL=false`.
- Código: `git revert <commit-da-t46-16>`.
