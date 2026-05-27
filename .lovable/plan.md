## Plano de correção

1. **Padronizar o card das molduras**
   - Ajustar cada item para ter medidas fixas e consistentes, seguindo a referência: card com largura/altura padronizadas, conteúdo centralizado e espaçamento igual.
   - No mobile, manter grid de 2 colunas; em telas maiores, aumentar para 3/4/5 colunas conforme espaço disponível.
   - Evitar que uma moldura maior empurre ou desalinha o nome/preço do card.

2. **Criar uma área fixa para imagem + moldura dentro do card**
   - Separar o tamanho do card do tamanho da moldura.
   - Usar um “palco” interno fixo para todos os modelos, onde foto e moldura sempre ficam centralizadas.
   - A imagem/moldura no card ficará visualmente equivalente entre Aliança, Coroa, Louros, Floral e Vitral, sem variação de altura ou deslocamento.

3. **Corrigir o componente `DecoratedAvatar`**
   - Substituir a lógica atual de `frameScale/photoScale` por uma lógica mais estável: canvas fixo, moldura centralizada e foto circular posicionada por metadados por modelo.
   - Garantir que a foto fique sempre no centro visual da abertura da moldura.
   - Ajustar individualmente os modelos que têm abertura fora do centro, como Vitral e Louros.

4. **Ajustar os tamanhos conforme a referência**
   - Miniatura nos cards: equivalente a aproximadamente 80px dentro de uma área fixa.
   - Card: proporção estável, com nome e preço sempre nos mesmos níveis verticais.
   - Pré-visualização grande: manter maior, mas com a mesma lógica de alinhamento dos cards.

5. **Validar visualmente no preview**
   - Testar na viewport mobile atual.
   - Clicar nas molduras e verificar a pré-visualização grande.
   - Conferir se todas ficam com mesmo alinhamento, mesmo centro, mesma distância entre moldura, nome e preço.