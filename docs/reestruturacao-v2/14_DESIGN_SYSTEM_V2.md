# V2-003 — Design System da Community Platform

## 1. Marco e limites

- Branch: `rebuild/v2-003-design-system`.
- Base imutável: `1a0ae59dd40eddc9a6a1ccc3cfcbd9c3b54c082b`.
- V2-001 preservada em `c3ffa967560fd56250fafe91924db8a5452a71c1`.
- V2-002 preservada em `b54f9bfe1a41b4bbf905bfa1aaa838cb272be4c2`.
- Escopo: tokens, temas, tipografia, primitivos visuais, acessibilidade,
  showcase isolado e estratégia de adoção.
- Fora do escopo: App Shell, rotas, páginas, navegação, produto comunitário,
  autenticação, Supabase, migrations e deploy.

O Design System não é importado pela aplicação atual. A existência dos arquivos
não altera a interface legada, não habilita domínio e não acrescenta rota.

## 2. Auditoria visual e técnica

A auditoria cobriu as entradas globais de estilo, o tema, os primitivos de
`src/components/ui`, as dependências visuais e uma amostra das superfícies de
produto. Foram encontrados 392 arquivos TypeScript/TSX/CSS no escopo de leitura,
492 ocorrências de cores hexadecimais e 201 valores hexadecimais distintos.

| Elemento auditado            | Implementação atual                                                                               | Divergência encontrada                                                                | Decisão V2                                                                            | Impacto futuro                                                       | Migração nesta etapa     |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| CSS global                   | `src/styles.css`, Tailwind CSS 4 com `@theme inline`                                              | tema, utilidades, safe areas e estilos de produto dividem o mesmo arquivo             | V2 usa folha própria e seletor `[data-vdn-v2]`                                        | App Shell poderá ativar a fundação por subtree                       | Não                      |
| Tailwind                     | fornecido por `@lovable.dev/vite-tanstack-config`; `components.json` aponta para `src/styles.css` | configuração é implícita e adicionar plugins duplicados quebra o build                | não alterar configuração; CSS V2 é compatível com Tailwind 4 sem plugin novo          | evita nova cadeia de build                                           | Não                      |
| Cores globais                | `--primary`, `--rose`, `--coral`, `--petal`, gradientes de amor                                   | rosa/coral domina a identidade e há 201 hex distintos no código                       | contrato semântico comunitário; violeta sóbrio como brand e coral contido como accent | páginas poderão migrar por intenção, não por nome de cor             | Não                      |
| Tema claro                   | `:root`, branco puro e paleta romântica                                                           | canvas principal não é o off-white acordado                                           | canvas V2 `#f7f7f5`, superfícies brancas e hierarquia moderada                        | reduz fadiga e separa conteúdo                                       | Sim, apenas no escopo V2 |
| Tema escuro                  | `.dark` no documento                                                                              | coerente com o legado, mas acoplado à classe global                                   | tema V2 completo por `data-vdn-v2-theme="dark"`                                       | permite integração futura sem alterar significado semântico          | Sim, apenas no escopo V2 |
| Poppins                      | declarada nos tokens globais e carregada no root por Google Fonts                                 | dependência remota em runtime; showcase isolado não deve criar uma segunda importação | manter stack Poppins com fallbacks de sistema; não adicionar import remoto            | App Shell deve decidir hospedagem local ou manter carregamento atual | Não                      |
| Fallback de fonte            | `system-ui`, `-apple-system`, `sans-serif`                                                        | fallback varia por plataforma                                                         | stack V2 explicita BlinkMacSystemFont e Segoe UI                                      | texto continua legível sem rede                                      | Sim                      |
| Componentes UI               | 49 arquivos em `src/components/ui`                                                                | mistura de gerações e densidades                                                      | preservar; V2 cria ponto de exportação separado                                       | migração gradual sem regressão visual                                | Não                      |
| Radix UI                     | 31 arquivos importam Radix                                                                        | base acessível disponível, mas nem todos os contratos são uniformes                   | usar `Slot` somente para composição segura de Button; manter compatibilidade          | futuros overlays podem usar Radix dentro da V2                       | Sim, pontual             |
| CVA                          | 9 arquivos importam CVA                                                                           | variantes não seguem uma taxonomia única                                              | variantes V2 usam intenção semântica e defaults explícitos                            | reduz combinações ad hoc                                             | Sim                      |
| `cn`                         | `src/lib/utils.ts`, baseado em clsx e tailwind-merge                                              | importaria utilitário do legado para dentro da fronteira V2                           | utilitário V2 mínimo com clsx                                                         | Design System não depende da camada legada                           | Sim                      |
| Ícones                       | Lucide em 194 arquivos                                                                            | tamanhos e stroke variam por contexto                                                 | 16/20/24 px, stroke 2, decoração sempre `aria-hidden`                                 | consistência no App Shell                                            | Sim                      |
| Framer Motion                | 22 arquivos importam Framer Motion                                                                | animações distribuídas e algumas contínuas                                            | primitivos V2 usam CSS curto; Framer fica disponível para composição futura           | movimento continua intencional e substituível                        | Não                      |
| Movimento CSS                | várias keyframes e utilidades globais                                                             | durações e curvas coexistem sem um contrato único                                     | tokens de duração/easing e redução para 0,01 ms                                       | feedback previsível                                                  | Sim                      |
| Botões                       | alturas legadas de 32, 36 e 40 px; icon button 36 px                                              | abaixo do mínimo de toque de 44 px                                                    | V2 usa 44, 48 e 52 px; IconButton exige nome acessível                                | navegação mobile mais segura                                         | Sim                      |
| Inputs                       | `h-9`; fonte 16 px no mobile por regra global, 14 px no desktop                                   | altura abaixo de 44 px; garantia de iOS depende do global                             | V2 mantém 16 px e altura mínima de 44 px no próprio componente                        | evita zoom e não depende do CSS legado                               | Sim                      |
| Labels e erros               | primitivas separadas; associação depende de cada página                                           | placeholder pode acabar carregando contexto demais                                    | TextField/TextArea exigem label e conectam ajuda/erro                                 | formulários futuros nascem acessíveis                                | Sim                      |
| Superfícies                  | Card legado com `rounded-xl` e sombra genérica                                                    | elevação e padding não são semânticos                                                 | Surface define tone, elevation e padding sem regra de produto                         | composição consistente                                               | Sim                      |
| Raios                        | token global de 1 rem mais valores arbitrários                                                    | arredondamento varia muito                                                            | 8, 12 e 16 px; pill só quando semanticamente adequado                                 | aparência moderna sem excesso                                        | Sim                      |
| Sombras                      | `soft`, `elegant`, `glow` mais classes locais                                                     | algumas sombras são pesadas ou decorativas                                            | dois níveis moderados e foco separado                                                 | hierarquia visual previsível                                         | Sim                      |
| Espaçamento                  | Tailwind e valores arbitrários                                                                    | densidade muda entre páginas                                                          | escala V2 de 2 a 64 px, gutters fluidos e larguras de conteúdo                        | base responsiva                                                      | Sim                      |
| Z-index                      | overlays legados concentram `z-50`                                                                | camadas diferentes competem no mesmo nível                                            | escala documentada base/raised/sticky/overlay/modal/toast                             | App Shell e overlays futuros poderão coordenar camadas               | Sim                      |
| Safe areas                   | utilidades globais e estilos inline distribuídos                                                  | tratamento é repetido por superfície                                                  | quatro tokens `env(safe-area-inset-*)` aplicados no showcase                          | shell futuro poderá consumir sem duplicação                          | Sim                      |
| Overlays                     | Dialog/Sheet/Drawer usam preto a 80% e `z-50`                                                     | overlay pesado e sem contrato semântico                                               | token overlay existe, mas nenhum modal V2 é criado agora                              | próxima etapa poderá padronizar sem reescrever produto               | Não                      |
| Reduced motion               | regra global ampla e exceções por componente                                                      | bom baseline, porém acoplado ao documento inteiro                                     | folha V2 contém regra escopada e remove shimmer/press                                 | respeito independente ao usuário                                     | Sim                      |
| Mistura produto/apresentação | UI base está relativamente neutra; componentes fora de `ui` consultam produto, auth e dados       | telas monolíticas combinam regras e aparência                                         | nenhum primitivo V2 importa produto, auth, router ou Supabase                         | fronteiras permanecem unidirecionais                                 | Sim                      |
| Divergências entre páginas   | cores, raios, fundos, gradients e densidades específicos de namoro, pets, loja e Admin            | produto parece composto por subsistemas diferentes                                    | adoção começa pelo App Shell e avança por paridade                                    | não haverá conversão indiscriminada                                  | Não                      |

## 3. Direção visual

A V2 usa uma base comunitária acolhedora e sóbria:

- canvas off-white, superfícies claras e separação por borda antes de sombra;
- brand violeta profundo no tema claro, com versão clara no tema escuro;
- coral histórico preservado como `accent`, sem dominar todas as superfícies;
- texto azul-carvão para confiança e legibilidade;
- estados funcionais distinguíveis por texto, ícone e contraste, não apenas cor;
- raios moderados e densidade confortável;
- tipografia Poppins, sem serifas;
- movimento curto, responsivo e nunca necessário para concluir uma ação.

O resultado não copia Instagram, Discord, WhatsApp ou outra plataforma e não usa
corações como estrutura da identidade.

## 4. Fonte única dos tokens

`src/v2/design-system/tokens.ts` é a fonte única dos valores.
`createV2CssVariables(theme)` converte a árvore tipada em custom properties
`--v2-*`. A folha CSS usa somente referências a essas propriedades e não contém
uma segunda paleta hardcoded.

Categorias:

- cores semânticas;
- tipografia;
- spacing;
- layout e gutters;
- controles;
- forma;
- bordas;
- sombras;
- elevação e z-index;
- movimento;
- ícones.

Os contratos públicos usam intenção, como `brand`, `danger` e `surfaceSubtle`;
nomes de pigmentos não fazem parte da API dos componentes.

## 5. Temas

`V2ThemeScope` é a fronteira explícita:

```tsx
<V2ThemeScope theme="light">{children}</V2ThemeScope>
```

Ele aplica:

- `data-vdn-v2`;
- `data-vdn-v2-theme="light" | "dark"`;
- variáveis geradas a partir da fonte TypeScript;
- `color-scheme` coerente;
- stack de fonte e smoothing apenas na subtree.

O tema claro é o default. O tema escuro possui todos os mesmos tokens
semânticos. Preferência do sistema poderá ser adicionada pelo App Shell; não há
seletor nem alteração do `ThemeProvider` legado nesta etapa.

### Poppins

O root atual carrega Poppins por:

`https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap`

A V2 não duplica essa chamada. Se a fonte não estiver instalada, carregada ou em
cache, usa fallbacks do sistema. A decisão entre self-host e o carregamento
existente deve ocorrer junto do App Shell, com análise de CSP, privacidade,
offline e performance.

## 6. Componentes

O ponto público é `src/v2/design-system/index.ts`.

| Componente           | Contrato                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `V2ThemeScope`       | aplica tema e tokens somente na subtree                                                                             |
| `V2Button`           | primary, secondary, outline, ghost, destructive e link; 44/48/52 px; loading, disabled, ícones e `asChild` restrito |
| `V2IconButton`       | exige `label` não vazio; ícone decorativo; loading acessível                                                        |
| `V2Surface`          | tone, elevation e padding; aceita elementos estruturais sem regra de produto                                        |
| `V2Text`             | body, bodyLarge, label, caption e navigation; tons semânticos                                                       |
| `V2Heading`          | nível HTML obrigatório separado do tamanho visual                                                                   |
| `V2StatusBadge`      | neutral, brand, success, warning, danger e info                                                                     |
| `V2TextField`        | label obrigatório, descrição, erro, required, disabled, readOnly e atributos nativos                                |
| `V2TextArea`         | mesmo contrato de associação, com resize vertical                                                                   |
| `V2Skeleton`         | dimensões explícitas, `aria-hidden` e shimmer removido em reduced motion                                            |
| `V2VisuallyHidden`   | conteúdo disponível a tecnologias assistivas                                                                        |
| `V2LoadingIndicator` | status anunciado, label visível ou oculto e três tamanhos                                                           |

`V2Button` com `asChild` não aceita `loading` nem ícones externos, evitando
estruturas ambíguas do Radix Slot. O consumidor compõe o conteúdo diretamente no
filho. Button de ícone isolado pertence exclusivamente a `V2IconButton`.

## 7. Acessibilidade

Garantias automatizadas:

- combinações críticas de texto e estados atendem WCAG AA em claro e escuro;
- borda forte e focus ring atingem pelo menos 3:1 contra a superfície;
- controles de ação têm pelo menos 44 × 44 px;
- campos usam 16 px, inclusive fora do breakpoint mobile;
- foco visível preserva outline e adiciona ring;
- labels, descrição e erro são conectados por IDs;
- erro usa `role="alert"` e `aria-invalid`;
- loading usa `role="status"` e `aria-live="polite"`;
- ícones decorativos usam `aria-hidden`;
- IconButton exige nome acessível;
- Heading separa semântica de estilo;
- Skeleton não é interativo;
- disabled usa atributo nativo quando disponível;
- nenhum `user-scalable=no` é introduzido.

WCAG não pode ser provado apenas por smoke visual. Leitor de tela, zoom extremo,
alto contraste do sistema e navegação completa por teclado devem ser repetidos
quando o App Shell integrar os componentes.

## 8. Movimento e profundidade

Durações: 80, 140, 220 e 320 ms. As curvas separam feedback, entrada e saída.
Press usa escala discreta de 0,98 somente quando motion é permitido.

Com `prefers-reduced-motion: reduce`:

- transições duram 0,01 ms;
- press não transforma;
- Skeleton perde shimmer;
- spinner fica estático;
- nenhuma animação contínua é necessária para compreender estado.

Nenhuma animação bloqueia interação.

## 9. Safe areas, conteúdo e densidade

Tokens independentes cobrem top, right, bottom e left. O showcase usa o maior
valor entre gutter e safe area. Controles preservam tamanho mínimo mesmo na
densidade compacta.

Larguras de conteúdo:

- narrow: 40 rem;
- standard: 64 rem;
- wide: 80 rem.

Gutter responsivo: `clamp(1rem, 3vw, 2rem)`.

## 10. Showcase isolado

`src/v2/design-system/showcase/V2DesignSystemShowcase.tsx` é um consumidor real
do barrel público e demonstra:

- paleta semântica;
- temas claro e escuro;
- tipografia;
- variantes e estados de Button;
- IconButton;
- badges;
- campos normal, required, erro e disabled;
- superfícies;
- Skeleton e loading.

O harness vive somente na pasta do showcase. Ele não:

- cria rota;
- altera `src/routeTree.gen.ts`;
- é exportado no barrel;
- é importado pelo root;
- acessa Supabase, auth ou dados;
- aparece na aplicação atual.

`styles.css` é a folha pública e todas as suas regras qualificadas começam na
fronteira `.vdn-v2[data-vdn-v2]`. `showcase.css` é a única exceção deliberada:
ele pode usar `:root` e `body` porque pertence exclusivamente ao harness, não é
exportado pelo barrel e não entra no bundle da aplicação.

Viewports de revisão: 390 × 844, 768 × 1024 e 1440 × 900.

Resultado do smoke local:

- nenhum overflow horizontal nos três viewports;
- nenhum Button, IconButton, input ou textarea abaixo de 44 px;
- inputs e textareas computados em 16 px;
- foco do TextField visível com outline sólido de 2 px;
- nenhum ID duplicado entre os painéis claro e escuro;
- claro e escuro aparecem em uma coluna no mobile/tablet e lado a lado no
  desktop;
- Poppins foi resolvida no ambiente de revisão;
- console sem erro de runtime;
- regra de reduced motion confirmada na folha carregada e por teste
  determinístico; o navegador de smoke não oferece emulação dessa preferência.

## 11. Fronteiras arquiteturais

O Design System pode importar React, Radix, CVA, Lucide e utilitários internos
neutros. Ele não pode importar:

- Supabase;
- auth ou sessão;
- router e rotas;
- domínios;
- componentes de produto;
- environment variables;
- dados de usuário;
- service role.

Dependência permitida:

`App Shell/domínios/páginas → Design System`

Dependência proibida:

`Design System → App Shell/domínios/páginas`

O barrel público e os componentes são SSR-safe. O `main.tsx` do showcase é uma
entrada executável isolada e, por definição, monta no DOM; ele não faz parte da
biblioteca pública.

## 12. Adoção incremental

1. estabilizar tokens e primitivos V2;
2. integrar `V2ThemeScope` no futuro App Shell;
3. criar componentes compartilhados sobre os primitivos;
4. construir superfícies comunitárias;
5. migrar páginas por domínio, com comparação e rollback;
6. ocultar superfícies legadas somente após paridade funcional.

Classificação do legado:

- **preservar:** componentes que continuam vinculados a páginas ainda não
  migradas;
- **adaptar:** wrappers finos quando o contrato de produto já é estável;
- **substituir:** apenas após o consumidor V2 cobrir estados, acessibilidade e
  telemetria equivalentes;
- **descontinuar:** depois de não haver consumidor, rollback necessário ou dado
  histórico dependente.

Avatar-personagem, foto, pets, loja, inventário, presentes e personalização
pertencem à plataforma compartilhada. Pretendentes é apenas um domínio.
Desativar Pretendentes não desativa capacidades compartilhadas. Nenhum dado ou
contrato legado pode ser removido por uma migração visual.

## 13. Paridade e critérios para ocultar legado

Uma interface antiga só pode ser ocultada quando houver evidência de:

- mesmos dados e propriedade;
- mesmas ações e efeitos autorizados;
- estados loading, vazio, erro e offline;
- permissões e papéis equivalentes;
- acessibilidade igual ou superior;
- navegação e deep links preservados;
- métricas de sucesso e erro;
- smoke mobile/tablet/desktop;
- rollback por feature flag ou rota sem alterar dados.

Contagem de linhas ou semelhança visual não prova paridade.

## 14. Riscos e limitações

- Poppins ainda depende do carregamento remoto existente no root para fidelidade
  completa; o fallback é seguro, mas visualmente diferente.
- O showcase não prova integração com o App Shell, porque essa integração é fora
  do escopo.
- Contraste automatizado cobre combinações críticas, não toda composição futura.
- CSS `color-mix()` exige browsers modernos compatíveis com a stack atual.
- Overlays, tooltip, modal, toast e componentes de navegação ainda não possuem
  primitivas V2.
- Migração de componentes legados poderá revelar regras de produto escondidas em
  apresentação.
- A preferência de sistema para tema ainda não foi conectada.

## 15. Rollback

Reverter o único commit V2-003:

1. remove `src/v2/design-system` adicionado/expandido;
2. remove testes V2-003;
3. remove este documento.

Nenhuma tela atual importa a V2, portanto o rollback não exige mudança de rota,
feature flag, banco ou ambiente. Não há migration, dado ou operação externa a
reverter.
