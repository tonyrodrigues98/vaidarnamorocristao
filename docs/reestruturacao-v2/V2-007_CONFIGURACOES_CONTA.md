# Superprompt autônomo — V2-007 Configurações/Conta e fundação reutilizável

Execute este trabalho de ponta a ponta. Não responda com um plano e não pare
depois da análise. Analise, implemente, teste, corrija, refatore, valide,
documente, publique a branch e abra/verifique o Draft PR antes de responder.

Use o maior raciocínio disponível. Trabalhe silenciosamente e com economia de
tokens. Não envie atualizações rotineiras. Só peça intervenção se um bloqueador
externo real impedir todo o lote.

## 1. Resultado esperado

Entregar a V2-007 como uma fatia vertical completa de
**Configurações/Conta**, usando-a para estabelecer a fundação reutilizável dos
próximos módulos.

Ao final, a base deve ter:

- módulo de Conta V2 real e integrado;
- comportamento útil do legado preservado ou substituído com paridade;
- fronteiras claras entre rota, apresentação, domínio e Supabase;
- autenticação, autorização, cache privado e mutations tratados corretamente;
- navegação e deep links seguros;
- UI premium, mobile-first, responsiva e acessível;
- estados de loading, vazio, erro, offline e sucesso;
- testes suficientes para permitir refatorações futuras;
- remoção apenas do legado exclusivo que estiver comprovadamente substituído;
- um estado persistente curto que permita outra sessão continuar sem receber
  novamente todo este prompt;
- Draft PR revisável, sem merge e sem deploy.

Não considere a tarefa concluída por ter criado arquivos ou uma tela. Conclua os
contratos, integrações, testes, validações e limpeza segura descritos abaixo.

## 2. Contexto do produto

O Vai Dar Namoro está sendo reconstruído de um produto percebido como “Tinder
cristão” para uma comunidade cristã completa. Namoro continua importante, mas
como um domínio paralelo dentro da comunidade.

Preserve os sistemas valiosos existentes e prepare a arquitetura para:

- Início community-first;
- comunidade;
- perfis;
- pretendentes e relacionamentos;
- conversas e Propósito;
- notificações;
- moedas e loja;
- avatares, molduras, auras, presentes e fundos;
- pets e jogos;
- Sala de Cinema/Assistir Juntos;
- administração.

Não implemente esses domínios neste lote. A fundação criada não pode impedir
essas migrações nem introduzir outra camada descartável.

## 3. Checkpoint conhecido

Use estes dados como checkpoint esperado, mas confirme tudo no repositório e no
Git remoto:

- repositório: `tonyrodrigues98/vaidarnamorocristao`;
- PR anterior: `#7 — docs(v2): audit legacy application`;
- estado do PR anterior: aberto, Draft e não mesclado;
- base auditada: `0659a9616562a08182581362a3dd9b60923a66af`;
- branch anterior: `rebuild/v2-006-legacy-audit`;
- head anterior: `79675aab2d97ef02ff40b320133b5be62225be3c`;
- `origin/main` esperado: `0659a9616562a08182581362a3dd9b60923a66af`;
- PR anterior: um commit, 14 arquivos e nenhuma alteração funcional;
- auditoria: 67 rotas e 445 referências tipadas;
- único destino de rota atualmente não resolvido: `/membros`;
- módulo recomendado para V2-007: Configurações/Conta.

O checkpoint não autoriza sobrescrever divergências. Se algum SHA mudou:

1. busque o estado remoto real;
2. determine se foi merge legítimo, atualização da branch ou trabalho alheio;
3. escolha a base correta preservando todo trabalho;
4. registre a divergência no estado;
5. continue quando houver uma derivação segura.

Só pare se continuar exigiria apagar ou sobrescrever trabalho não incorporado.

## 4. Estratégia de branch sem interromper o trabalho

Nunca altere `main` diretamente.

### Se o PR #7 já tiver sido mesclado

1. atualize `origin/main`;
2. confirme que o conteúdo do head `79675...` é ancestral de `origin/main` ou
   identifique o commit equivalente;
3. crie a branch:
   `rebuild/v2-007-account-foundation`
4. derive-a do `origin/main` atualizado.

### Se o PR #7 continuar aberto e Draft

1. não modifique, não faça merge e não marque o PR #7 como Ready;
2. confirme que o head remoto da branch anterior corresponde ao checkpoint ou
   a uma atualização legítima dele;
3. crie `rebuild/v2-007-account-foundation` a partir do head remoto verificado
   do PR #7;
4. trabalhe em branch empilhada;
5. ao publicar, abra o Draft PR da V2-007 contra
   `rebuild/v2-006-legacy-audit`;
6. informe na descrição que ele deverá ser retargetado para `main` somente após
   o merge do PR #7 e nova verificação do diff.

Não use o estado Draft do PR #7 como motivo para interromper este lote.

## 5. Instalar contexto permanente

Leia `02_REGRAS_PERMANENTES_AGENTS.md` no diretório do programa completo.

Inspecione o `AGENTS.md` existente:

- se não existir, crie um `AGENTS.md` raiz usando as regras permanentes;
- se existir, integre apenas as regras ausentes, preserve instruções válidas e
  respeite instruções mais específicas;
- não copie o checkpoint específico da V2-007 para o `AGENTS.md`;
- mantenha o arquivo conciso e operacional.

Crie ou atualize:

`docs/reestruturacao-v2/20_EXECUTION_STATE.md`

Limite: 200 linhas. Não crie diário. Registre somente estado atual, concluído,
próximo, riscos e gate. Esse arquivo passará a evitar a repetição de prompts
longos nas próximas sessões.

## 6. Preflight obrigatório e silencioso

Antes de editar:

1. leia integralmente todos os `AGENTS.md` aplicáveis;
2. verifique status, branch, remotes, HEAD, base e working tree;
3. atualize referências remotas sem alterar arquivos;
4. inspecione o PR #7 e sua base;
5. leia os documentos `00` a `19` de `docs/reestruturacao-v2/`, priorizando os
   documentos arquiteturais, autenticação, design system, app shell, auditoria,
   inventário de rotas e plano de desativação;
6. leia os sete artefatos JSON da auditoria;
7. inspecione scripts e testes de caracterização;
8. inspecione a rota Conta atual, todos os imports e entradas de navegação;
9. localize componentes, hooks, RPCs, tabelas, buckets, Realtime, feature flags,
   query keys e providers usados pelo fluxo;
10. identifique a baseline real de testes e builds;
11. confira mudanças não commitadas e preserve trabalho alheio.

Não produza um relatório de preflight. Use os achados diretamente na
implementação e registre somente fatos essenciais em `20_EXECUTION_STATE.md`.

## 7. Inventário funcional de Conta

Antes de substituir o fluxo, caracterize em testes e notas curtas no documento
de estado:

- rotas e aliases;
- requisitos de autenticação;
- redirects;
- seções exibidas;
- campos editáveis;
- valores iniciais;
- validação;
- ações de salvar;
- RPCs e tabelas reais;
- atualização de perfil ou sessão;
- preferências de privacidade;
- preferências de notificações;
- aparência/tema, se existir;
- logout e troca de conta;
- exclusão ou desativação, se existir;
- mensagens de erro e sucesso;
- estados offline;
- navegação de retorno;
- deep links de entrada;
- comportamento mobile;
- acessibilidade;
- analytics/telemetria já existentes;
- dependências com Perfil e outros módulos.

Não invente opção de configuração. Tudo que aparecer como ativo deve ler e
persistir dados reais ou executar uma ação real. Funcionalidade futura pode ser
omitida; não crie toggle decorativo.

Crie testes de caracterização apenas para comportamentos úteis e contratos
legítimos. Não congele bugs, ausência de segurança, duplicação ou detalhe
acidental do legado.

## 8. Contrato arquitetural da V2-007

Siga as convenções V2 existentes. Se houver lacunas, implemente uma fronteira
feature-first compatível, sem reestruturar domínios não relacionados.

O módulo deve separar:

1. **domínio**
   - tipos;
   - invariantes;
   - comandos;
   - resultado e erros;
2. **validação**
   - schemas de entrada;
   - normalização;
   - mensagens PT-BR;
3. **dados**
   - interface de repositório;
   - adapter Supabase;
   - mapeamento banco ↔ domínio;
4. **estado remoto**
   - query keys;
   - queries;
   - mutations;
   - invalidação/atualização;
5. **apresentação**
   - componentes;
   - formulários;
   - estados;
6. **rota**
   - proteção;
   - carregamento;
   - integração ao shell;
7. **testes**
   - domínio;
   - adapter;
   - hooks/controladores;
   - componentes;
   - integração de rota.

Não force exatamente esses nomes de pasta se o padrão V2 atual já resolver a
fronteira de outra forma. Preserve consistência com a base.

### Invariantes

- página e componentes não importam o cliente Supabase;
- adapter não renderiza UI;
- query keys privadas incluem o ID canônico do usuário;
- mutation não recebe identidade confiável do cliente quando a sessão pode
  fornecê-la;
- dados de um usuário não aparecem após logout/login de outro;
- providers existentes são reutilizados; nenhum provider global novo sem
  necessidade comprovada;
- listeners e subscriptions têm cleanup;
- nenhum segredo server-only entra no bundle cliente;
- erros não são engolidos;
- retry não repete ação não idempotente sem proteção;
- optimistic update só é usado quando rollback é correto;
- não use `any` ou cast para contornar incompatibilidade.

## 9. Segurança transversal que deve ser resolvida neste lote

Corrija no repositório, com testes, os riscos que bloqueiam uma fundação segura
para Conta. Faça somente mudanças necessárias e preserve funcionalidades.

### 9.1 Deep links e notificações

Crie ou consolide uma política canônica para destinos internos:

- aceite rotas relativas válidas;
- aceite URL absoluta somente quando protocolo e origem forem permitidos;
- rejeite `javascript:`, `data:`, protocolos inesperados e origem externa;
- normalize pathname, search e hash sem abrir redirecionamento externo;
- forneça fallback interno seguro;
- use a política em todo ponto relevante de abertura de notificação/deep link;
- evite cópias divergentes da regra;
- teste seguro, inseguro, relativo, absoluto same-origin, URL malformada e
  fallback.

Se o service worker não puder importar o mesmo módulo, use uma estratégia
manutenível e teste equivalência de comportamento. Não deixe a política apenas
na interface enquanto o `notificationclick` continua vulnerável.

### 9.2 Cache privado e troca de conta

Garanta que mídia e dados autenticados não sejam compartilhados entre usuários:

- prefira cache particionado por usuário com ciclo de vida claro;
- se identidade segura não estiver disponível no service worker, não armazene
  conteúdo privado em cache compartilhado;
- não use remoção de query assinada como chave compartilhada entre contas;
- limpe/invalide caches privados no logout e na troca de usuário;
- preserve cache público e comportamento offline que não exponha dados;
- cubra usuário A → logout → usuário B;
- cubra cold start, refresh, atualização do service worker e ausência de rede;
- teste a política em fixtures seguras e no código real.

Não preserve uma vulnerabilidade apenas por paridade com o legado.

### 9.3 Autenticação e autorização

- use o boundary canônico de autenticação;
- não crie guard local concorrente;
- preserve redirect pós-login de forma validada;
- não permita flash de conteúdo privado;
- não confie em role ou user ID vindo de query string/local storage não
  validado;
- mutation de Conta deve atuar no usuário autenticado;
- ações administrativas não podem entrar no módulo comum;
- diferencie sessão expirada, sem permissão e erro de rede.

### 9.4 Achados P0 históricos

Não acesse Supabase publicado. Inspecione código, migrations, tipos e testes
locais relacionados a:

- concessão de moedas;
- XP;
- conquistas;
- missões;
- criação genérica de notificações.

Se a V2-007 tocar esses contratos, corrija o boundary local e crie migration ou
teste seguro quando necessário, sem aplicar remotamente. Se não tocar, preserve
o achado no estado, não interrompa Conta e não amplie o escopo.

## 10. Implementação funcional de Configurações/Conta

Implemente a experiência completa com os recursos realmente existentes.

### Estrutura de informação

Agrupe as ações reais em seções coerentes, escolhidas após o inventário:

- conta e identidade;
- privacidade e visibilidade;
- notificações;
- segurança e sessão;
- aparência e acessibilidade, se houver persistência real;
- suporte/legal, quando já existir;
- ações de sessão;
- zona de risco para ações destrutivas reais.

Não use todas as seções por obrigação. Remova seções sem comportamento real.

### Interação

- formulário inicializado com dados reais;
- estado dirty claro;
- validação antes da mutation;
- salvar desabilitado somente por motivo correto;
- prevenção de duplo envio;
- sucesso perceptível e não intrusivo;
- erro acionável sem apagar edição;
- retry seguro;
- rollback em optimistic update;
- confirmação específica para ação destrutiva;
- retorno e deep link previsíveis;
- alterações refletidas no Auth/Profile state sem reload manual;
- nenhuma preferência “salva” apenas em memória, salvo preferência
  explicitamente local.

### Estados

Implemente e teste:

- carregando;
- carregado;
- sem dados opcionais;
- erro recuperável;
- sessão expirada;
- sem permissão;
- offline;
- salvando;
- salvo;
- validação inválida;
- conflito, se o backend permitir;
- ação destrutiva pendente;
- reduced motion.

### Design

- use Design System V2 existente;
- Poppins;
- Lucide ou ícones já padronizados;
- sem emoji como ícone;
- branco/off-white/`#f7f7f5` e identidade visual existente;
- hierarquia premium e minimalista;
- não copiar interface de iOS, Tinder ou outro produto;
- preservar safe area;
- input com pelo menos 16 px no mobile;
- alvos de toque adequados;
- sheet/modal sem overflow;
- navegação por teclado e foco visível;
- labels e descrição para controles;
- contraste adequado;
- feedback que não dependa apenas de cor;
- reduced motion;
- layout validado em 320, 360, 390, 430, tablet e desktop;
- nenhum elemento fora da tela e nenhum zoom involuntário ao focar input.

## 11. Rotas, shell, feature flag e compatibilidade

Inspecione a estratégia definida nos documentos V2. Não crie uma terceira
estratégia.

Resultado obrigatório:

- rota V2 direta funciona em navegação fria e interna;
- proteção é canônica;
- shell correto é montado;
- link de Conta em perfil/menu/settings aponta para destino correto;
- redirects não formam loop;
- SSR e cliente concordam;
- 404 e fallback permanecem corretos;
- links do manifest/sitemap só mudam se realmente afetados;
- deep links antigos continuam compatíveis;
- a feature flag possui fallback claro.

Implemente a rota de transição indicada pelo padrão atual, provavelmente
`/v2/conta`, mas confirme no código.

Só substitua `/conta` como rota canônica no mesmo lote se todos os critérios de
paridade, segurança e rollback forem atendidos. Caso contrário:

- mantenha o legado funcional;
- disponibilize a implementação V2 atrás do mecanismo existente;
- registre exatamente o critério pendente;
- não declare decommission concluído.

Não faça ativação em produção ou alteração externa de flag.

## 12. Redução de providers e duplicação

Use Conta para validar a arquitetura sem refatorar o aplicativo inteiro.

- meça quais providers o fluxo legado monta;
- monte na V2 somente os necessários;
- não replique `AuthProvider`, `QueryClientProvider`, tema ou bridge global;
- evite consulta adicional de perfil se o estado canônico já contém o dado;
- remova listener, timer ou subscription exclusivo do fluxo substituído somente
  após provar ausência de consumidor;
- não mova providers globais de outros domínios sem testes e necessidade do
  lote;
- registre redução mensurável quando houver.

## 13. Paridade e desativação

Crie uma matriz curta de paridade dentro do documento existente mais adequado
ou no estado, sem um novo relatório longo.

Para cada comportamento legado:

- preservado;
- substituído;
- removido intencionalmente por ser defeito/duplicação;
- não aplicável;
- pendente com bloqueador objetivo.

Antes de excluir qualquer legado de Conta:

1. confirme consumidores por `rg`;
2. verifique grafo de módulos;
3. verifique imports dinâmicos;
4. verifique route tree;
5. verifique registries, navegação, manifest, sitemap e service worker;
6. verifique testes;
7. verifique estilos e assets exclusivos;
8. execute a suíte após a remoção.

Remova somente o que estiver comprovadamente substituído. Quando remover:

- elimine o arquivo e seus resíduos exclusivos;
- atualize imports;
- não deixe wrapper vazio;
- não mantenha `Legacy`, `Old`, `New`, `V2Final` sem consumidor;
- preserve redirects necessários.

Se não houver item seguro, não force exclusão. O objetivo é remover com prova,
não aumentar o número de arquivos apagados.

## 14. Testes obrigatórios

Descubra o runner e padrões atuais. Adicione cobertura proporcional ao risco.

### Domínio e validação

- parsing e normalização;
- campos válidos e inválidos;
- invariantes;
- mensagens PT-BR;
- payload mínimo;
- ausência de campos opcionais.

### Adapter e mutations

- mapeamento banco ↔ domínio;
- usuário derivado da sessão;
- erros de autenticação;
- erros de autorização;
- erro de rede;
- resposta vazia ou inesperada;
- mutation bem-sucedida;
- invalidação correta;
- rollback;
- duplo envio;
- nenhuma chamada real ao Supabase.

### Cache e sessão

- query keys de usuário A e B são diferentes;
- logout limpa/invalida estado privado;
- login de B não mostra dado de A;
- conteúdo público continua reutilizável;
- comportamento offline não expõe conteúdo privado.

### Deep links

- relativa interna;
- absoluta same-origin;
- origem externa;
- protocolo proibido;
- URL malformada;
- fallback;
- `notificationclick` segue a mesma política.

### Componentes

- loading;
- conteúdo;
- erro;
- offline;
- validação;
- salvar;
- sucesso;
- ação destrutiva;
- teclado/foco;
- labels;
- reduced motion.

### Rota e integração

- visitante;
- autenticado;
- sessão expirada;
- navegação fria;
- navegação interna;
- redirect;
- feature flag ligada/desligada;
- fallback legado;
- sem loop;
- shell/providers esperados.

### Regressão

- testes de caracterização úteis continuam passando;
- testes de rotas, autenticação, sessão, cache, design system e app shell;
- `/membros` não deve ser corrigido incidentalmente neste lote, salvo se uma
  dependência real exigir; se for corrigido, atualize inventário sem criar
  contrato que exija o defeito;
- testes nunca devem exigir cache inseguro ou ausência de same-origin.

Não use snapshots enormes de markup como substituto para comportamento.

## 15. Validação contínua

Execute testes focados após cada unidade lógica. Antes do commit final, execute
o conjunto seguro completo aplicável:

1. instalação congelada conforme lockfile;
2. TypeScript;
3. testes novos;
4. testes afetados;
5. suíte segura V2 existente;
6. autenticação, sessão, cache, rotas, app shell e PWA;
7. lint focado nos arquivos alterados;
8. Prettier focado;
9. build cliente;
10. build SSR;
11. `git diff --check`;
12. auditoria legado reproduzível;
13. inventário de rotas e links;
14. imports e ciclos;
15. candidatos órfãos do escopo;
16. inspeção do bundle por:
    - `SUPABASE_SERVICE_ROLE_KEY`;
    - `PUSH_DISPATCH_SECRET`;
    - `service_role`;
    - `access_token`;
    - `refresh_token`;
    - JWT privilegiado;
    - `sk-proj`;
    - segredos privados;
17. working tree e diff final.

Não imprima valores encontrados. Diferencie identificador de código, chave
anon/publishable e segredo privilegiado.

Não execute teste que exija Supabase remoto ou ambiente descartável inexistente.
Não configure secrets. Não enfraqueça testes para fazê-los passar.

Se uma validação falhar, corrija e repita. Warnings preexistentes podem ser
registrados de forma curta, mas não use warning como desculpa para ignorar erro
introduzido.

## 16. Autorrevisão obrigatória

Antes de publicar:

- leia o diff completo;
- remova logs, arquivos temporários e código comentado;
- procure `TODO`, `FIXME`, placeholders, mocks runtime, casts amplos e
  tratamento de erro vazio;
- confirme que nenhuma opção falsa foi adicionada;
- confirme que não há cliente Supabase em componente/rota;
- confirme isolamento por usuário;
- confirme policy de deep link no cliente e service worker;
- confirme que nenhum provider global duplicado foi criado;
- confirme que o módulo pode ser reutilizado como padrão de Perfil;
- confirme que documentação e estado correspondem ao código;
- reexecute as validações afetadas após qualquer correção.

Não responda antes dessa revisão.

## 17. Commits e recuperação durante uma sessão longa

É permitido criar commits locais de checkpoint para não perder trabalho.

Antes de publicar o Draft PR:

- organize o histórico;
- deixe exatamente um commit funcional para a V2-007, salvo se o repositório
  tiver regra explícita diferente;
- mensagem:
  `feat(v2): rebuild account settings foundation`
- não inclua mudanças do PR #7 como se fossem da V2-007 no diff efetivo;
- não reescreva a branch anterior;
- envie somente `rebuild/v2-007-account-foundation`.

Use push normal para a nova branch. Se for indispensável reescrever somente a
branch V2-007 já publicada, valide o head remoto e use
`--force-with-lease`; nunca force `main` nem a branch V2-006.

## 18. Draft PR

Abra um Draft PR.

Base:

- `main`, se o PR #7 já estiver mesclado e a V2-006 for ancestral;
- `rebuild/v2-006-legacy-audit`, se o PR #7 continuar aberto.

Título:

`feat(v2): rebuild account settings foundation`

Descrição curta, sem relatório gigante:

- base e dependência do PR #7;
- objetivo;
- comportamento entregue;
- arquitetura criada;
- segurança/cache/deep links;
- legado removido ou mantido;
- migrations criadas e confirmação de não aplicação;
- validações;
- riscos ainda abertos;
- rollback;
- confirmação de ausência de deploy e merge.

Verifique:

- PR aberto;
- estado Draft;
- base correta;
- head correto;
- diff limitado;
- checks conhecidos;
- nenhum merge;
- nenhum deploy;
- `main` não alterada.

Não marque Ready e não peça review automaticamente a pessoas sem autorização.

## 19. Critérios de conclusão do lote

Todos devem ser verdadeiros:

- contexto permanente instalado sem destruir regras existentes;
- `20_EXECUTION_STATE.md` criado/atualizado e curto;
- Conta legado caracterizada;
- módulo V2 implementado com dados reais;
- UI funcional, responsiva e acessível;
- nenhuma configuração falsa;
- boundary de dados correto;
- query/cache privado isolado por usuário;
- logout/troca de conta segura;
- deep links e `notificationclick` protegidos por origem/protocolo;
- autenticação e route guard canônicos;
- estados completos;
- feature flag e fallback coerentes;
- paridade medida;
- legado exclusivo removido somente quando comprovado;
- nenhuma duplicação estrutural nova;
- testes novos e afetados verdes;
- suíte segura verde;
- TypeScript, lint, Prettier e builds verdes;
- auditoria e inventários coerentes;
- bundle sem credencial privilegiada;
- um commit final;
- Draft PR correto;
- nenhum merge, deploy ou alteração em produção.

Se algum critério interno puder ser corrigido na branch, corrija e continue. Se
depender de ambiente externo, registre o bloqueador preciso, conclua todo o
restante e mantenha o PR Draft.

## 20. Resposta final — limite estrito

Depois de abrir e verificar o Draft PR, responda em no máximo 20 linhas.

Inclua somente:

- resultado;
- branch;
- commit;
- número e URL do Draft PR;
- base do PR;
- testes/builds principais;
- legado removido ou motivo objetivo para mantê-lo;
- bloqueadores externos reais;
- confirmação de que não houve merge, deploy ou escrita em Supabase;
- próximo gate: revisão do Draft PR.

Não inclua lista de comandos, diário, explicação passo a passo, diff por arquivo,
hashes extensos ou repetição deste prompt.
