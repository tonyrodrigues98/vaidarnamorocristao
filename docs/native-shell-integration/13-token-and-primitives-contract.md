# Contrato de tokens e primitives

## Tokens canônicos

`src/config/native-shell-tokens.ts` registra a referência futura do novo App
Shell:

- ação coral: `#EB4F68`, forte `#D93F59`, suave `#FDE8EC`;
- violeta secundário: `#6554D9`, `#7462E8`, suave `#EEEAFE`;
- canvas claro: `#FAFAFA`;
- superfícies: `#FFFFFF`, `#F6F6F6`, `#F8F8F8`;
- texto: `#1A1A1D` e `#696B73`;
- borda: `#E6E7EA`;
- motion: 100, 190, 260 e 280 ms;
- layout de referência: sidebar 244 px, contexto 300 px, toque 44 px e input
  mobile 16 px.

Esses valores não substituem `brand.theme` nem os tokens globais da V1. Os
valores legados `#ff4f68`, `#e6415b`, `#fff0f3` e `#fff7f8` continuam ativos
até uma migração visual explicitamente autorizada.

## Escopo CSS

`src/styles/native-shell.tokens.css` define variáveis somente em:

```text
[data-vdn-native-shell]
[data-vdn-native-shell][data-theme="dark"]
```

A folha não contém `:root`, `html`, `body`, `.dark` ou `@import` e não é
importada pelo root. Portanto não produz efeito no runtime atual.

## Primitives isolados

- `NativeAvatar`: quadrado, circular, incompressível, `object-fit: cover`,
  tamanhos tipados e fallback; ainda sem moldura ou aura.
- `NativeProgress`: título, metadado opcional e barra em linha própria, com
  clamp e ARIA.
- `NativeField`: compõe Input/Textarea existentes, associa label, descrição e
  erro, preserva 16 px no mobile e foco visível.

O barrel `src/components/native-shell/index.ts` exporta somente esses três
primitives. Nenhuma página os importa e `DecoratedAvatar` não foi substituído.

## Limitações

- nenhuma página, rota ou shell foi migrado;
- nenhum asset do protótipo foi copiado;
- molduras, auras e integrações de produto não fazem parte dos primitives;
- a referência é parcialmente congelada;
- o tema escuro é previsto, mas visualmente não aprovado;
- não há alegação de paridade pixel-perfect.

## Próxima tarefa

A próxima tarefa poderá consumir esses contratos somente dentro de um App Shell
isolado e após seu próprio gate. Esta etapa não ativa o shell nem inicia a
T46-04.
