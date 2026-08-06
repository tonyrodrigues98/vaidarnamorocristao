# Auditoria de compatibilidade de tema

## Escopo

Auditoria estática da T46-04 sobre superfícies claras explícitas (`bg-white`, textos pretos ou
neutros escuros, bordas/gradientes brancos, estilos inline e hexadecimais claros). A classificação
não afirma paridade visual completa; ela indica o risco observado no arquivo da rota e em seus
componentes imediatos.

| Rota                  | Estado       | Evidência                                                                                                                                           |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                   | COMPATÍVEL   | Landing possui composição escura deliberada e contraste próprio, independente do tema global.                                                       |
| `/inicio`             | PARCIAL      | Usa tokens semânticos, mas também possui várias superfícies brancas em cards editoriais; existem poucas variantes `dark:`.                          |
| `/comunidade`         | COMPATÍVEL   | Apenas redirect de compatibilidade para `/conversas/comunidade`; não renderiza superfície própria.                                                  |
| `/conversas`          | PARCIAL      | A lista usa superfícies semânticas e variantes escuras, mas componentes internos ainda precisam de inspeção visual completa.                        |
| `/conversas/$matchId` | PARCIAL      | Superfícies principais são semânticas; brancos encontrados pertencem sobretudo às bolhas, mas o fluxo completo ainda não foi congelado visualmente. |
| `/perfil`             | PARCIAL      | Possui variantes `dark:` extensas, porém mantém gradientes e superfícies claras explícitas com alternativas locais.                                 |
| `/loja`               | COMPATÍVEL   | Superfícies principais usam tokens semânticos; branco não foi encontrado como fundo estrutural fixo na rota.                                        |
| `/meu-pet`            | INCOMPATÍVEL | Fundo, cards, controles e textos usam repetidamente `bg-white`, `text-neutral-*` e gradientes claros sem variantes escuras.                         |
| `/pet-arcade`         | INCOMPATÍVEL | Canvas e diversas superfícies são claros e hardcoded, sem contrato escuro equivalente.                                                              |
| `/conta`              | COMPATÍVEL   | Usa tokens semânticos e variantes escuras; a T46-04 altera somente o controle de preferência.                                                       |
| `/admin`              | INCOMPATÍVEL | Navegação e cards ainda usam `bg-white` e `text-black` estruturais apesar de variantes escuras pontuais.                                            |
| `/instalar`           | PARCIAL      | Estrutura usa tokens semânticos, mas o estado instalado usa paleta clara fixa sem alternativa escura.                                               |

## Padrões encontrados

- Compatibilidade forte quando a rota usa `bg-background`, `bg-card`, `text-foreground`,
  `text-muted-foreground` e `border-border`.
- Compatibilidade parcial quando branco é efeito sobre mídia/colorido ou quando há alternativa
  `dark:` local, mas falta confirmação visual de todos os estados.
- Incompatibilidade quando branco e neutros escuros formam o canvas ou cards estruturais sem
  alternativa.
- A landing `/` é uma composição escura fixa por direção visual existente; não foi redesenhada.

## Limites

- Nenhuma rota, além de `/conta`, foi corrigida.
- Estados autenticados e dados remotos não foram considerados evidência visual nesta auditoria
  estática.
- O tema escuro da referência permanece `not-frozen`.
- A correção progressiva deve ocorrer por rota, sem troca global de tokens ou importação do CSS
  isolado do Native Shell.
