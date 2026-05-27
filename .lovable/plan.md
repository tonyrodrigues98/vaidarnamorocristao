## Objetivo

Hoje, no `DecoratedAvatar`, o `size` representa o canvas total (moldura). A foto é renderizada como uma fração desse canvas (`size * photoScale`), então ao escolher uma moldura com furo pequeno (ex.: Floral Rosa com `photoScale: 0.38`) a foto encolhe visivelmente. O usuário quer o oposto: a foto deve manter sempre o mesmo tamanho, e a moldura cresce ao redor para envolvê-la.

## Mudança em `src/components/DecoratedAvatar.tsx`

Inverter a interpretação do prop `size`:

- `size` passa a representar o **diâmetro da foto** (constante, independente da moldura).
- Quando existe moldura, o canvas externo do componente vira `frameCanvas = size / placement.photoScale`. A moldura ocupa esse canvas inteiro (`inset-0`).
- A foto continua centralizada no furo da moldura usando `placement.centerX / centerY`, agora multiplicados por `frameCanvas` em vez de `size`.
- Sem moldura, o canvas continua sendo `size` (comportamento atual preservado).
- A aura passa a se basear em `frameCanvas` (quando há moldura) ou `size` (quando não há), para continuar envolvendo o conjunto.

Resultado: trocar de "Aliança de Ouro" para "Floral Rosa" mantém a foto idêntica; o que muda é o tamanho ocupado pela moldura ao redor.

## Impacto nos call sites

Os componentes que usam `DecoratedAvatar` (ex.: `DecorationsCard`, avatares de perfil, listas) hoje passam `size` esperando que esse seja o canvas total. Após a mudança:

- Em locais com **espaço fixo** (miniaturas do `DecorationsCard` — stage 80×80, preview grande 80px), o container externo do `DecoratedAvatar` pode passar de 80px para até ~210px (caso Floral). Precisamos:
  - Reduzir o `size` passado nessas miniaturas para um valor menor (ex.: foto de ~44–48px) para que o canvas com moldura caiba no stage de 80px.
  - Ou aumentar o stage. Sugestão: manter o stage em 80px e reduzir o `size` para `Math.round(80 * minPhotoScale)` ≈ 30 px no pior caso — porém isso deixa a foto pequena demais. Melhor solução: usar `size = 44` e aumentar o stage para `96×96` (cabe Floral: 44/0.38 ≈ 116 — ainda estoura). 
  - **Decisão proposta**: nas miniaturas usar `size = 40` e stage de `112×112`. Isso garante que mesmo o Floral (40/0.38 ≈ 105) caiba e que molduras menores fiquem visualmente equivalentes (foto sempre 40px). Para o preview grande do card selecionado, usar `size = 72` e stage `200×200`.
- Em outros lugares (avatar do header, listas de pretendentes, etc.) o efeito é o mesmo: a moldura passa a "vazar" do tamanho antigo. Vou inspecionar os principais usos e ajustar localmente o `size` para preservar a área visual existente, mantendo a foto consistente.

## Validação

1. Navegar para `/perfil` → seção Decorações.
2. Clicar em cada moldura (Aliança, Coroa, Louros, Floral, Vitral) e confirmar que a foto dentro do preview grande mantém o mesmo diâmetro.
3. Conferir as miniaturas: todas com foto do mesmo tamanho e moldura crescendo ao redor sem cortes.
4. Verificar avatares em outros pontos do app (header, lista de pretendentes) para garantir que não houve regressão de layout.
