# VaiDarNamoro — Item 8: Projeto Completo da Nova Experiência

## 1. Finalidade

Este documento define a experiência futura do VaiDarNamoro antes de qualquer implementação.

Ele converte os Itens 1–7 em uma visão de produto navegável e verificável, descrevendo:

- o posicionamento do produto;
- a arquitetura de informação;
- a navegação mobile e desktop;
- o destino de cada superfície atual;
- as experiências novas;
- o perfil modular inspirado na liberdade da Steam;
- configurações simples inspiradas na clareza do WhatsApp;
- a separação visível entre Comunidade e Namoro;
- estados de carregamento, vazio, erro, offline e permissão;
- acessibilidade, desempenho e responsividade;
- a ordem futura de redesign e implantação;
- critérios que permitirão comparar protótipos do Sites com o produto real.

Este é um projeto documental. Ele não autoriza alteração de código, banco, políticas, arquivos publicados ou dados.

---

## 2. Marco de referência

| Campo                        | Valor                                          |
| ---------------------------- | ---------------------------------------------- |
| Repositório                  | `tonyrodrigues98/vaidarnamorocristao`          |
| Branch                       | `main`                                         |
| Commit de referência         | `1de94bca421c36d32b1a4d96b2fc96f2330129aa`     |
| Estado do GitHub             | Sem commit posterior aos Itens 3–7             |
| Escala informada pelo GitHub | Aproximadamente 469 MB                         |
| Backend                      | Supabase                                       |
| Aplicação                    | React, TanStack Router/Query, Nitro/Vite e PWA |
| Escopo desta etapa           | Somente projeto de experiência                 |

### 2.1 Bases obrigatórias

Este item herda as decisões anteriores:

1. Comunidade cristã é a plataforma principal.
2. Namoro é um modo paralelo, opcional e reversível.
3. `/inicio` e `/dashboard` permanecem rotas legítimas e diferentes.
4. O perfil será modular, expressivo e altamente personalizável.
5. A edição e as configurações precisam continuar simples.
6. Molduras, auras, fundos, gradientes, presentes e inventários legítimos permanecem.
7. O avatar-personagem será retirado por protocolo seguro.
8. Foto de perfil não é o avatar-personagem e permanece protegida.
9. Propósito Firmado pausa apenas a experiência romântica futura.
10. Recados anônimos continuam exclusivos do contexto romântico.
11. Conversas sociais terão consentimento e solicitações de mensagem.
12. Bloqueio será global.
13. Pets e jogos são subprodutos isoláveis.
14. Sala de Cinema é uma experiência social e de mídia nova.
15. Vídeos, sprites e mídia pesada ficam em Storage/CDN, não no Git.
16. Migrações futuras seguem: expandir, preencher, comparar, alternar, estabilizar e contrair.

---

## 3. Visão do produto

### 3.1 Definição

O VaiDarNamoro será uma comunidade cristã digital onde uma pessoa pode:

- construir presença e identidade;
- participar de conversas e grupos;
- criar conexões sociais;
- estudar, compartilhar e interagir com conteúdo cristão;
- participar de eventos e sessões de cinema;
- cuidar de um pet e acessar experiências de entretenimento;
- personalizar seu perfil e sua presença;
- ativar, quando quiser e se for elegível, a experiência de namoro;
- construir um Propósito Firmado sem desaparecer da comunidade.

### 3.2 Promessa central

> Pertencer primeiro. Conectar-se com propósito. Namorar somente quando fizer sentido.

### 3.3 O que o produto deixa de ser

O produto não deve mais se apresentar como:

- um Tinder cristão com várias abas extras;
- uma coleção de minissistemas sem hierarquia;
- uma home que tenta exibir todos os recursos de uma vez;
- uma plataforma em que disponibilidade romântica define participação social;
- um repositório usado como armazenamento de mídia.

### 3.4 Pilares da experiência

| Pilar         | Resultado perceptível                                                |
| ------------- | -------------------------------------------------------------------- |
| Pertencimento | Usuário encontra pessoas, espaços e assuntos sem ativar Namoro       |
| Identidade    | Perfil comunica fé, história, interesses e personalidade             |
| Controle      | Privacidade e configuração são compreensíveis                        |
| Propósito     | Relações românticas possuem contexto, limites e intenção             |
| Expressão     | Personalização é rica, mas nunca prejudica leitura ou acessibilidade |
| Segurança     | Consentimento, bloqueio e denúncia funcionam em todos os módulos     |
| Continuidade  | Dados e conquistas atuais sobrevivem ao redesign                     |
| Leveza        | Cada rota carrega apenas o necessário                                |

---

## 4. Princípios de design

### 4.1 Identidade própria

Steam, WhatsApp, Instagram, Discord e outros produtos podem ensinar padrões. Nenhum deles será copiado visualmente.

- Steam inspira expressão, capa, vitrines, inventário e organização modular.
- WhatsApp inspira clareza de configurações, privacidade e ações previsíveis.
- Discord inspira espaços comunitários e presença, sem copiar sua taxonomia inteira.
- Plataformas de conteúdo inspiram feed e descoberta, sem transformar o produto em disputa por alcance.

### 4.2 Mobile-first real

Mobile-first significa:

- ações principais alcançáveis com o polegar;
- bottom navigation estável;
- sheets e páginas completas no lugar de modais apertados;
- suporte correto ao teclado virtual;
- alvos de toque com pelo menos 44 × 44 px;
- áreas seguras de iPhone e Android respeitadas;
- conteúdo essencial disponível antes de adornos;
- desktop expandindo a experiência, não apenas esticando o mobile.

### 4.3 Personalização com limites

O usuário pode personalizar muito, mas não pode:

- esconder ações obrigatórias de segurança;
- reduzir contraste abaixo do mínimo;
- reposicionar elementos críticos;
- usar animação automática agressiva;
- inserir scripts, HTML ou URLs arbitrárias;
- transformar o perfil em uma página impossível de ler;
- forjar badges, cargos ou estados do sistema.

### 4.4 Fé sem gamificação espiritual

Conteúdo cristão pode incentivar constância, estudo e participação. Não deve:

- medir superioridade espiritual;
- criar ranking de “mais crente”;
- vender autoridade religiosa;
- usar culpa para gerar retenção;
- confundir moedas ou XP com mérito diante de Deus.

### 4.5 Produto sereno, vivo e premium

Direção visual:

- tipografia Poppins;
- fundos claros, off-white e superfícies bem definidas;
- cor de marca com uso intencional;
- profundidade por camadas, luz, bordas e sombras suaves;
- motion curto, responsivo e explicativo;
- Lucide ou Heroicons para ações funcionais;
- ilustrações e assets próprios quando agregarem identidade;
- nenhuma dependência de emojis de teclado como ícones.

---

## 5. Arquitetura de informação

### 5.1 Cinco destinos principais no mobile

| Destino    | Missão                              | Conteúdo principal                                 |
| ---------- | ----------------------------------- | -------------------------------------------------- |
| Início     | Orientar o dia do usuário           | resumo, atalhos, convites e continuidade           |
| Comunidade | Participar e descobrir              | feed, espaços, pessoas, grupos e eventos           |
| Criar      | Publicar ou iniciar ação contextual | post, oração, evento, sessão ou mídia permitida    |
| Conversas  | Comunicar com consentimento         | sociais, românticas, grupos e solicitações         |
| Eu         | Acessar identidade e conta          | perfil, inventário, pet, configurações e dashboard |

O botão central `Criar` pode ser substituído por uma ação contextual em áreas onde publicar não faça sentido. Ele não deve abrir uma lista enorme e indiferenciada.

### 5.2 Namoro não ocupa obrigatoriamente a bottom navigation

O modo Namoro fica disponível em:

- card de acesso no Início;
- seção clara dentro de Descobrir/Comunidade;
- atalho configurável;
- área `Namoro` dentro de `Eu`;
- notificações categorizadas.

Usuários que utilizam o modo com frequência podem fixá-lo como destino, substituindo `Criar` ou outro atalho não estrutural. `Início`, `Conversas` e `Eu` não podem ser removidos.

### 5.3 Navegação desktop

Desktop usa três regiões:

1. rail lateral persistente com destinos principais;
2. coluna central de conteúdo;
3. coluna contextual opcional para presença, próximos eventos, chat ou detalhes.

A terceira coluna desaparece quando prejudicar foco, por exemplo em edição de perfil, chat imersivo, jogos ou Sala de Cinema.

### 5.4 Centro `Eu`

O centro pessoal organiza:

- Ver meu perfil;
- Editar perfil;
- Inventário e personalização;
- Meu Pet;
- Conquistas;
- Dashboard;
- Modo Namoro;
- Conta e privacidade;
- Bloqueados;
- Suporte;
- Instalar aplicativo.

Essa área substitui menus espalhados, mas não funde `/inicio` e `/dashboard`.

---

## 6. Sistema visual e de interface

### 6.1 Tokens essenciais

O redesign deverá definir tokens, não cores soltas em componentes:

- background-base;
- surface-1, surface-2 e surface-elevated;
- text-primary, secondary e muted;
- brand-primary e brand-accent;
- success, warning, danger e info;
- border-subtle e border-strong;
- radius-sm, md, lg e xl;
- shadow-sm, md e overlay;
- spacing em escala coerente;
- motion-fast, normal e deliberate.

### 6.2 Hierarquia de superfícies

- página: fundo neutro;
- seção: agrupamento sem excesso de cartões;
- card: unidade interativa ou de conteúdo;
- overlay/sheet: tarefa temporária;
- página dedicada: tarefas complexas ou sensíveis.

Não transformar cada texto em card. Cartões devem indicar agrupamento ou ação real.

### 6.3 Motion

Motion deve explicar:

- mudança de estado;
- origem de um painel;
- progresso de ação;
- ordenação e rearranjo de vitrines;
- entrada de uma recompensa;
- sincronização da Sala de Cinema.

Regras:

- respeitar `prefers-reduced-motion`;
- evitar parallax em textos essenciais;
- não bloquear toque durante animações;
- limitar loops a elementos decorativos controláveis;
- manter feedback de ação abaixo de 200 ms quando possível.

### 6.4 Temas e fundos personalizados

Fundos premium atuam em camadas seguras:

1. mídia de fundo;
2. filtro/overlay automático;
3. superfície legível do conteúdo;
4. componentes críticos com tokens protegidos.

O sistema calcula contraste e aplica fallback. O usuário vê um preview mobile e desktop antes de equipar.

---

## 7. Experiência pública e aquisição

### 7.1 Landing `/`

Destino: reconstruir visualmente, preservando objetivo e conteúdo válido.

A nova landing deve comunicar nesta ordem:

1. comunidade cristã;
2. pertencimento e conexões reais;
3. experiências sociais e conteúdo;
4. namoro opcional com propósito;
5. segurança e moderação;
6. instalação como aplicativo.

Estrutura recomendada:

- header que nunca se esconda atrás do hero;
- hero com uma promessa única;
- demonstração real do produto;
- trilhas “Comunidade”, “Conteúdo”, “Namoro” e “Experiências”;
- prova social verificável;
- segurança e privacidade;
- FAQ;
- CTA final;
- footer institucional.

### 7.2 Como funciona, Sobre e Depoimentos

Destino: preservar conteúdo útil e redesenhar como sistema editorial coerente.

- `/como-funciona`: duas jornadas separadas, Comunidade e Namoro.
- `/sobre`: propósito, princípios, equipe e governança.
- `/depoimentos`: somente conteúdo real e moderado; filtros por contexto.

### 7.3 Blog e páginas institucionais

Blog preserva URLs e SEO. Leitura recebe:

- largura confortável;
- sumário quando necessário;
- autor e revisão;
- data de atualização;
- compartilhamento;
- recomendações relacionadas;
- sinalização explícita quando conteúdo não representa aconselhamento profissional.

Termos, privacidade e manual devem ser pesquisáveis, versionados e legíveis no mobile.

---

## 8. Autenticação e entrada

### 8.1 Login e cadastro

Destino: preservar autenticação e reconstruir apresentação.

Requisitos:

- poucos campos por tela;
- erros junto ao campo;
- senha visível sob controle;
- recuperação clara;
- estado de carregamento sem duplo envio;
- retorno seguro à rota pretendida;
- linguagem acolhedora sem prometer aprovação.

### 8.2 Novo onboarding

O onboarding deixa de obrigar o usuário a construir imediatamente um perfil romântico.

#### Trilha obrigatória comunitária

1. boas-vindas e proposta;
2. nome, foto e identidade básica;
3. localização com granularidade e privacidade;
4. fé, interesses e assuntos desejados;
5. regras, segurança e consentimentos;
6. preview do perfil comunitário;
7. envio para aprovação quando aplicável.

#### Trilha romântica opcional

Após a entrada, um convite separado explica:

- quem pode participar;
- quais campos adicionais serão públicos no contexto romântico;
- preferências e critérios atuais;
- como pausar;
- como o Propósito Firmado afeta o modo.

### 8.3 Estados de aprovação

| Estado    | Experiência                                                         |
| --------- | ------------------------------------------------------------------- |
| Pendente  | checklist, conteúdo permitido e previsão honesta sem data inventada |
| Aprovado  | entrada completa e tour contextual opcional                         |
| Rejeitado | motivo permitido, correção orientada e reenvio                      |
| Banido    | explicação segura, suporte/recurso e rotas autorizadas              |

---

## 9. Início `/inicio`

### 9.1 Missão

Início é o hub de continuidade. Ele responde: “o que vale minha atenção agora?”.

### 9.2 Composição

Ordem adaptativa:

1. saudação e estado essencial;
2. continuar de onde parou;
3. ações pendentes;
4. atividade de conexões e espaços;
5. conteúdo cristão recomendado;
6. eventos e Sala de Cinema;
7. pet ou jogos, se usados;
8. entrada do modo Namoro, se habilitado;
9. recomendações de configuração.

### 9.3 Personalização

Usuário pode:

- ocultar módulos não essenciais;
- reordenar grupos permitidos;
- definir atalhos;
- reduzir recomendações de namoro;
- escolher densidade.

Alertas críticos, segurança e pendências obrigatórias não podem ser ocultados.

### 9.4 O que Início não é

- não é dashboard analítico;
- não é feed completo;
- não é perfil;
- não é loja;
- não é mural de todos os módulos.

---

## 10. Dashboard `/dashboard`

### 10.1 Missão preservada

Dashboard é o painel analítico pessoal e continua separado de `/inicio`.

### 10.2 Métricas possíveis

- completude do perfil;
- atividade e conexões;
- participação em conteúdo;
- histórico de moedas e recompensas;
- progressão do pet;
- conquistas;
- uso do modo Namoro;
- configurações de segurança pendentes.

### 10.3 Regras éticas

- não criar score de valor pessoal;
- não ranquear espiritualidade;
- não expor métricas privadas a terceiros;
- explicar período e origem dos números;
- distinguir dado real, estimativa e ausência de informação.

---

## 11. Comunidade

### 11.1 Rota conceitual `/comunidade`

O redirect legado passa futuramente a uma experiência real composta por:

- feed;
- descobrir pessoas;
- espaços/grupos;
- eventos;
- conteúdo cristão;
- chat global como uma das experiências, não a comunidade inteira.

### 11.2 Feed

Tipos iniciais:

- publicação de texto e imagem;
- reflexão;
- pedido de oração;
- atualização de grupo;
- evento;
- sessão de Cinema;
- marco de perfil opcional.

Cada post mostra contexto, audiência e opções de moderação. A publicação deve selecionar audiência antes do envio.

### 11.3 Descoberta comunitária

Filtros não românticos:

- assuntos e interesses;
- localização aproximada;
- grupos em comum;
- participação recente;
- conteúdo e espaços;
- conexões em comum, respeitando privacidade.

Sexo e disponibilidade romântica não filtram participação comunitária.

### 11.4 Seguir e Conexão

- Seguir é unilateral e controlável.
- Conexão é bilateral.
- Conexão não é match.
- Conexão não ativa Namoro.
- Remover conexão não bloqueia automaticamente.
- Bloquear remove visibilidade e relações conforme política global.

### 11.5 Espaços e grupos

Estrutura futura:

- nome, propósito e regras;
- visibilidade pública, privada ou por aprovação;
- feed/conversa do espaço;
- membros e funções locais;
- eventos;
- moderação;
- arquivos/mídia permitidos;
- notificações por nível.

### 11.6 Chat global atual

`/conversas/comunidade` permanece funcionando durante a transição. Depois passa a ser um espaço oficial da Comunidade, preservando:

- Realtime;
- teclado mobile;
- reações;
- moderação;
- histórico conforme política;
- bloqueios.

---

## 12. Perfil modular

### 12.1 Objetivo

O perfil é a principal superfície de identidade do produto. Deve parecer pessoal sem ser confuso.

### 12.2 Estrutura visual

1. capa/fundo responsivo;
2. foto com moldura e aura;
3. nome, badge legítimo, presença e ações;
4. resumo e identidade;
5. navegação por seções quando necessária;
6. vitrines modulares;
7. rodapé de segurança e denúncia no perfil de terceiros.

### 12.3 Camadas do perfil

| Camada        | Conteúdo                                                       |
| ------------- | -------------------------------------------------------------- |
| Compartilhada | nome, foto, bio, localização aproximada e interesses           |
| Comunitária   | grupos, posts, conexões, conteúdo e vitrines sociais           |
| Romântica     | intenção, preferências, detalhes consentidos e ações de namoro |
| Privada       | configurações, inventário, rascunhos e controles               |

### 12.4 Vitrines iniciais

- Sobre mim;
- Minha fé;
- Interesses;
- Conteúdos publicados;
- Comunidades e grupos;
- Conquistas selecionadas;
- Pet em destaque;
- Presentes recebidos selecionados;
- Galeria;
- Versículo ou reflexão favorita;
- Coleções visuais;
- Marco de Propósito Firmado, somente com consentimento bilateral.

### 12.5 Editor simples

O editor usa três modos:

1. **Conteúdo** — editar textos e seleções;
2. **Aparência** — fundo, moldura, aura, gradiente e tema;
3. **Organização** — adicionar, remover e arrastar vitrines.

Cada modo possui preview ao vivo e botão `Visualizar como visitante`.

### 12.6 Regras das vitrines

- quantidade limitada por plano/regra transparente;
- nenhuma compra remove acesso a informações essenciais;
- ordem persistida por usuário;
- módulos indisponíveis explicam por quê;
- conteúdo vazio não ocupa espaço público;
- privacidade configurada por vitrine;
- desktop pode usar duas colunas;
- mobile sempre volta a uma ordem linear explícita.

### 12.7 Perfil de terceiros

A ação principal depende do contexto:

- Comunidade: seguir, conectar ou mensagem;
- Namoro: demonstrar interesse, se ambos elegíveis;
- Conexão existente: conversar;
- Bloqueado: nenhuma interação;
- Perfil próprio: editar.

Não mostrar ações românticas fora do contexto romântico.

### 12.8 Retirada do avatar-personagem

Serão retirados futuramente:

- editor do personagem;
- criação do personagem;
- loja de peças do personagem;
- looks e renderização do personagem;
- entradas de navegação relacionadas.

Permanecem:

- foto de perfil;
- verificação e moderação da foto;
- molduras;
- auras;
- fundos;
- gradientes;
- presentes;
- stickers;
- inventários desses itens.

Nenhuma exclusão física ocorrerá nesta etapa. Compensação e quarentena seguem o Item 7.

---

## 13. Namoro

### 13.1 Entrada do modo

O modo possui uma home própria que mostra:

- estado: ativo, pausado, inelegível ou bloqueado por compromisso;
- privacidade atual;
- preferências;
- descoberta;
- interesses;
- matches;
- recados;
- orientação de segurança.

### 13.2 Descoberta `/pretendentes`

Destino: preservar motor e reconstruir experiência.

Requisitos:

- cards com informação suficiente antes da ação;
- filtros explicáveis;
- afinidade com fatores visíveis, sem falsa precisão;
- lista e modo focado, se ambos forem úteis;
- ação de interesse deliberada;
- ocultar pessoas inelegíveis no servidor;
- nenhum usuário novo ativado automaticamente.

### 13.3 Perfil romântico

`/pretendentes/$id` passa a renderizar a camada romântica do mesmo perfil, não uma identidade paralela desconectada.

Deve mostrar:

- informações compartilhadas;
- intenção e valores;
- campos românticos consentidos;
- compatibilidades explicáveis;
- ações de interesse, recado ou presente conforme permissão;
- segurança, denunciar e bloquear.

### 13.4 Interesses e matches

Interesses terão estados claros: recebido, enviado, correspondido, expirado ou indisponível conforme regra aprovada.

Matches preservam:

- participantes;
- origem;
- data;
- conversa;
- histórico necessário;
- possibilidade de desfazer com confirmação e consequência explicada.

### 13.5 Recados anônimos

Permanecem no Namoro e continuam opt-in.

- anonimato existe diante do destinatário, não da equipe de segurança;
- dicas e revelação seguem regras existentes até revisão explícita;
- não viram mensagem anônima comunitária;
- bloqueio e compromisso impedem ações incompatíveis;
- dados históricos são preservados.

---

## 14. Conversas

### 14.1 Caixa unificada, contextos separados

Abas/filtros:

- Todas;
- Sociais;
- Namoro;
- Grupos;
- Solicitações;
- Arquivadas.

O contexto aparece visualmente em cada conversa. Uma conversa social nunca é convertida silenciosamente em romântica.

### 14.2 Solicitações de mensagem

Antes da aceitação:

- remetente envia uma introdução limitada;
- destinatário aceita, recusa, bloqueia ou denuncia;
- mídia e links podem ser limitados;
- spam repetido é bloqueado por regras do servidor.

### 14.3 Chat individual

Preservar integralmente:

- Realtime;
- envio otimista seguro;
- entregue e lido;
- continuidade de histórico;
- adaptação ao teclado mobile e `visualViewport`;
- bloqueio;
- anexos permitidos;
- notificações e deep link.

Adicionar gradualmente:

- contexto da relação;
- ações de segurança acessíveis;
- busca na conversa;
- respostas e reações, se suportadas pelo modelo;
- estados offline honestos.

### 14.4 Offline

Mensagens digitadas podem permanecer como rascunho local. Envio offline só poderá ser oferecido com fila idempotente, status visível e prevenção de duplicata.

---

## 15. Propósito Firmado

### 15.1 Papel no futuro produto

Propósito Firmado continua sendo domínio próprio e uma das experiências mais valiosas.

Ao ser ativado:

- pausa o modo Namoro de ambos;
- remove ambos da descoberta romântica;
- impede novos interesses e recados;
- preserva presença comunitária;
- preserva conversas sociais;
- não esconde automaticamente toda a caixa de entrada.

### 15.2 Área do casal

Pode evoluir para:

- linha do tempo;
- acordos e objetivos;
- devocional compartilhado;
- cápsulas e memórias;
- marcos;
- privacidade bilateral;
- encerramento seguro e auditável.

Qualquer publicação pública do casal exige consentimento dos dois.

---

## 16. Conteúdo cristão

### 16.1 Hub de conteúdo

Devocional, orações, quiz, Bíblia/notícias e futuros estudos ganham entrada unificada, mas mantêm rotas e responsabilidades próprias.

### 16.2 Devocional

Preservar posts, comentários, reações, oração e moderação. Redesenhar com:

- leitura focada;
- autoria e data;
- contexto bíblico;
- salvar e continuar;
- comentários recolhíveis;
- distinção entre conteúdo editorial e do usuário.

### 16.3 Orações

- audiência e anonimato explícitos;
- opção de atualização do pedido;
- reações apropriadas;
- proteção contra exposição sensível;
- moderação;
- nunca usar ranking espiritual.

### 16.4 Quiz e desafios

Podem gerar progresso educacional, não competição espiritual. Toda resposta precisa ter referência e correção editorial.

### 16.5 Notícias

Separar:

- aviso da plataforma;
- reflexão editorial;
- notícia externa;
- atualização comunitária.

Cada tipo possui fonte, autoria, data e política de revisão.

---

## 17. Loja, economia e inventário

### 17.1 Loja `/loja`

Destino: preservar catálogo e propriedade; reconstruir navegação e compra.

Áreas:

- Destaques;
- Fundos;
- Molduras;
- Auras;
- Gradientes;
- Presentes;
- Stickers;
- Pets e itens de pet, quando aplicável;
- Coleções;
- Meu inventário.

Categorias do avatar-personagem ficam congeladas e depois removidas conforme protocolo.

### 17.2 Compra segura

Fluxo:

1. visualizar item;
2. preview no contexto real;
3. ver preço, saldo e restrições;
4. confirmar;
5. servidor/RPC processa uma vez;
6. recibo mostra resultado;
7. inventário é atualizado;
8. equipar é uma ação separada ou opção explícita.

### 17.3 Inventário

Deve permitir:

- filtrar por tipo e raridade;
- ver adquirido, equipado e bloqueado;
- testar combinação;
- equipar/des-equipar;
- identificar origem;
- entender itens legados ou compensados.

### 17.4 Caixas

Se permanecerem, devem mostrar antes da abertura:

- conteúdo possível;
- raridades;
- probabilidades reais ou regra aprovada;
- custo;
- duplicatas e compensação;
- pity, quando existir;
- histórico e recibo.

Emoção visual não pode ocultar resultado previamente determinado nem criar padrão enganoso.

---

## 18. Presentes

Presentes podem ser sociais ou românticos, sempre com contexto explícito.

- destinatário controla quem pode enviar;
- presente não concede acesso à conversa;
- presente recusado segue política clara;
- presente público no perfil depende de seleção do recebedor;
- moderação e bloqueio continuam aplicáveis;
- histórico econômico não é apagado pelo redesign.

---

## 19. Pets

### 19.1 Meu Pet

Destino: preservar e modularizar.

Superfícies:

- ambiente principal;
- necessidades;
- ação contextual/radial;
- inventário do pet;
- aparência e decoração;
- progressão;
- missões;
- conquistas;
- acesso ao Arcade.

### 19.2 Clareza de estado

Cada barra deve explicar:

- valor atual;
- por que mudou;
- próxima mudança estimada;
- ações que recuperam;
- custo e efeito antes da confirmação.

### 19.3 `user_pets` e `user_pets_v2`

A experiência futura não escolhe uma fonte apenas pelo nome. O corte depende da comparação com o banco publicado definida nos Itens 3 e 7.

---

## 20. Pet Arcade e jogos

### 20.1 Hub

Jogos carregam sob demanda por registry tipado. O hub exibe:

- capa;
- gênero;
- duração;
- controles;
- acessibilidade;
- recompensas;
- status de manutenção;
- última sessão.

### 20.2 Avaliação individual

Cada jogo será classificado na revisão do Item 1:

- preservar;
- redesenhar visualmente;
- reconstruir mecânica;
- arquivar;
- substituir.

### 20.3 Qualidade mínima

- identidade visual consistente;
- profundidade e textura apropriadas;
- feedback de toque;
- tutorial curto;
- pausa e retomada;
- sem recompensa duplicada;
- servidor autoritativo para economia;
- desempenho aceitável em aparelho intermediário.

---

## 21. Sala de Cinema

### 21.1 Proposta

Experiência de assistir juntos a um vídeo previamente enviado e processado pela plataforma. Não é compartilhamento da tela do anfitrião.

### 21.2 Fluxo do anfitrião

1. criar sessão;
2. selecionar vídeo autorizado;
3. upload multipart/resumível;
4. processamento e geração de versões;
5. definir título, capa, horário, público e regras;
6. convidar ou publicar;
7. abrir lobby;
8. iniciar sessão;
9. moderar chat e participantes;
10. encerrar e definir destino da gravação/arquivo.

### 21.3 Fluxo do participante

1. descobrir ou receber convite;
2. entrar no lobby;
3. verificar compatibilidade e conexão;
4. assistir sincronizado;
5. abrir/fechar chat no mobile;
6. reagir e comentar;
7. recuperar sincronização;
8. sair sem encerrar a sessão.

### 21.4 Layout

Mobile:

- player dominante;
- controles essenciais;
- participantes e qualidade em sheet;
- chat recolhível;
- modo paisagem imersivo;
- retorno simples ao chat.

Desktop:

- player principal;
- chat lateral redimensionável;
- lista/presença contextual;
- modo cinema que reduz distrações.

### 21.5 Sincronização

O servidor/sala mantém estado canônico:

- mídia;
- posição;
- playing/paused;
- velocidade permitida;
- versão do estado;
- timestamp da última ação;
- papel de controle.

Clientes corrigem desvio suavemente e oferecem `Sincronizar novamente`.

### 21.6 Segurança e direitos

Antes da implementação devem existir decisões sobre:

- direitos de upload e exibição;
- limite e retenção;
- denúncia;
- moderação do chat;
- conteúdo proibido;
- acesso de menores;
- exclusão;
- logs de ação;
- custo de armazenamento e transcodificação.

---

## 22. Notificações

### 22.1 Central

Categorias:

- Comunidade;
- Conversas;
- Namoro;
- Propósito;
- Conteúdo;
- Cinema e eventos;
- Pets e jogos;
- Economia;
- Segurança e conta.

### 22.2 Preferências

Cada categoria separa:

- dentro do app;
- push;
- resumo;
- som quando suportado.

Notificações de segurança não podem ser desligadas quando essenciais.

### 22.3 Privacidade

Push na tela bloqueada usa texto neutro quando a categoria for sensível. Tocar abre a rota e o contexto corretos após autenticação.

---

## 23. Conta, privacidade e segurança

### 23.1 Estrutura inspirada na clareza do WhatsApp

`/conta` passa a uma lista curta de áreas:

- Conta;
- Privacidade;
- Segurança;
- Notificações;
- Aparência e acessibilidade;
- Dados e armazenamento;
- Ajuda;
- Sessões e dispositivos;
- Zona de perigo.

Cada linha explica o estado atual sem exigir abertura, quando útil.

### 23.2 Privacidade contextual

Controles separados para:

- perfil comunitário;
- perfil romântico;
- seguidores;
- conexões;
- mensagens;
- presentes;
- presença e atividade;
- localização;
- notificações sensíveis;
- grupos e eventos.

### 23.3 Bloqueados

`/bloqueados` mostra efeito do bloqueio e confirmação ao desbloquear. Bloqueio é global, mas conteúdo compartilhado pode permanecer anonimizado quando necessário à integridade de discussões ou evidência.

### 23.4 Exclusão e exportação

Zona de perigo precisa explicar:

- desativar versus excluir;
- prazo e reversibilidade;
- efeitos em mensagens, compras e conteúdo;
- dados legalmente retidos;
- exportação disponível;
- confirmação reforçada.

---

## 24. Verificação, moderação e confiança

### 24.1 Verificação

Fluxo mostra:

- por que é solicitado;
- o que será analisado;
- consentimento;
- status;
- necessidade de refazer;
- tratamento de falha técnica;
- canal de recurso.

Falha da IA não deve aprovar silenciosamente. O sistema usa revisão ou estado pendente conforme política.

### 24.2 Denúncia

Denúncia é contextual:

- perfil;
- mensagem;
- post;
- comentário;
- grupo;
- presente;
- sessão de Cinema;
- jogo/economia.

O usuário seleciona motivo, pode fornecer descrição e recebe protocolo sem acesso indevido ao andamento interno.

### 24.3 Bloqueio, silenciamento e denúncia

- bloquear corta interação;
- silenciar reduz visibilidade/notificações;
- denunciar envia para análise;
- nenhuma dessas ações deve ser apresentada como equivalente.

---

## 25. Suporte

Preservar tickets, conversa, anexos e base de ajuda.

Redesign:

- busca antes de abrir ticket;
- categorias claras;
- formulário contextual;
- anexos com preview;
- protocolo e status;
- prazo somente quando realmente conhecido;
- histórico completo;
- escalonamento para agente autorizado.

---

## 26. Administração

### 26.1 Princípio

Admin deixa de ser uma página gigantesca e vira console por capacidades.

### 26.2 Navegação

- Visão geral;
- Usuários e aprovação;
- Moderação;
- Verificações;
- Comunidade;
- Namoro;
- Conversas e denúncias;
- Conteúdo;
- Economia;
- Catálogos e personalização;
- Pets;
- Jogos e recompensas;
- Cinema e mídia;
- Suporte;
- Equipe e permissões;
- Auditoria e sistema.

### 26.3 Padrões obrigatórios

- tabela/lista responsiva;
- filtros persistentes na URL;
- busca com debounce;
- seleção e ação em lote restritas;
- confirmação para ações irreversíveis;
- motivo obrigatório em decisões sensíveis;
- trilha de auditoria;
- nenhuma concessão econômica diretamente pelo cliente;
- permissão real no servidor/banco.

### 26.4 Dashboard administrativo

Mostra saúde operacional, não vaidade:

- fila de aprovação;
- denúncias por prioridade;
- verificações pendentes;
- tickets;
- anomalias econômicas;
- falhas de jobs;
- uso de Storage;
- sessões de Cinema;
- alertas de segurança.

---

## 27. Estados universais

Toda superfície deve especificar:

### 27.1 Carregamento

- skeleton compatível com o layout;
- sem salto excessivo;
- ação desabilitada quando necessário;
- timeout com saída.

### 27.2 Vazio

- explicar por que está vazio;
- oferecer próxima ação válida;
- não culpar o usuário;
- diferenciar “não existe” de “filtro sem resultado”.

### 27.3 Erro

- linguagem humana;
- código/protocolo copiável quando útil;
- tentar novamente;
- preservar entrada do usuário;
- suporte quando recorrente.

### 27.4 Offline

- banner discreto;
- mostrar conteúdo realmente disponível em cache;
- não prometer mutação concluída;
- fila visível somente onde houver idempotência;
- nova abertura privada sem internet precisa de estratégia explícita, não apenas `offline.html`.

### 27.5 Permissão

- explicar requisito;
- oferecer caminho legítimo;
- não revelar dados protegidos;
- diferenciar falta de aprovação, privacidade, bloqueio e inexistência.

---

## 28. Acessibilidade

Critérios mínimos:

- WCAG 2.2 AA como referência;
- contraste testado inclusive com fundos personalizados;
- navegação por teclado;
- foco visível;
- labels e nomes acessíveis;
- ordem semântica igual à visual;
- zoom sem quebra;
- texto escalável;
- alternativas a gesto de arrastar e long-press;
- legendas na Sala de Cinema quando disponíveis;
- redução de movimento;
- feedback não dependente apenas de cor;
- ícones acompanhados de label quando ambíguos.

---

## 29. Responsividade

### 29.1 Faixas conceituais

- compacto: celular estreito;
- mobile: celular padrão/grande;
- médio: tablet e janela reduzida;
- amplo: desktop;
- extra-amplo: desktop com coluna contextual.

Breakpoints técnicos serão definidos pelo conteúdo, não por modelos específicos.

### 29.2 Regras

- mobile mantém uma coluna principal;
- vitrines reordenadas no desktop possuem ordem linear salva;
- tabelas administrativas viram listas detalhadas no compacto;
- chat ocupa tela inteira no mobile;
- Cinema oferece paisagem;
- jogos definem orientação suportada;
- nenhuma ação depende de hover.

---

## 30. Desempenho e mídia

### 30.1 Metas iniciais

- shell inicial enxuto;
- rota atual carregada sob demanda;
- nenhuma importação de jogo/admin/pet na entrada comum;
- imagens responsivas em formatos modernos;
- vídeo com streaming adaptativo;
- listas virtualizadas quando justificável;
- evitar prefetch indiscriminado;
- monitorar Core Web Vitals por rota.

### 30.2 Orçamento por experiência

Cada feature futura deverá declarar:

- JavaScript inicial e assíncrono;
- CSS;
- imagens acima da dobra;
- fontes;
- chamadas críticas;
- cache;
- impacto no service worker.

### 30.3 Repositório

Não entram no Git:

- uploads de usuários;
- vídeos;
- catálogos massivos de sprites;
- variações geradas de imagens;
- mídia de Cinema;
- backups.

Assets antigos pesados só serão removidos após inventário, substituição, prova e rollback conforme Item 7.

---

## 31. PWA e continuidade

Preservar:

- instalação;
- manifest;
- ícones e splash screens;
- push;
- deep links;
- comportamento mobile.

Evoluir:

- shell offline autenticado com limites claros;
- cache por domínio;
- invalidação versionada;
- rascunhos locais;
- download explícito de conteúdo quando aplicável;
- nenhum cache indiscriminado de dados sensíveis;
- tela de atualização controlada.

---

## 32. Matriz de destino das rotas atuais

Legenda:

- **P** preservar comportamento;
- **D** preservar e redesenhar;
- **R** refatorar internamente;
- **S** substituir a experiência;
- **X** retirar com protocolo;
- **N** criar.

| Rota/área                | Decisão | Destino futuro                                   |
| ------------------------ | ------: | ------------------------------------------------ |
| `/`                      |       S | Landing da comunidade com Namoro opcional        |
| `/como-funciona`         |       D | Jornadas Comunidade e Namoro                     |
| `/sobre`                 |       D | Propósito, princípios e governança               |
| `/depoimentos`           |       D | Prova social real e contextual                   |
| `/blog`, `/blog/$slug`   |       D | Sistema editorial coerente                       |
| `/termos`                |     P/D | Documento legível e versionado                   |
| `/manual`                |       S | Central de ajuda contextual                      |
| `/instalar`              |       D | Instalação PWA por dispositivo                   |
| `/auth/*`                |     P/D | Mesma base de auth, UX reconstruída              |
| `/onboarding`            |     S/R | Onboarding comunitário + Namoro opcional         |
| `/onboarding/etapa-*`    |     R/X | Compatibilidade temporária e retirada controlada |
| `/inicio`                |     D/R | Hub diário adaptativo                            |
| `/dashboard`             |     D/R | Painel analítico separado                        |
| `/perfil`                |     S/R | Perfil modular e editor simples                  |
| `/conta`                 |     D/R | Configurações claras por área                    |
| `/notificacoes`          |     D/R | Central categorizada                             |
| `/verificacao`           |     P/D | Fluxo transparente e seguro                      |
| `/bloqueados`            |     P/D | Gestão do bloqueio global                        |
| `/pretendentes`          |   P/S/R | Motor preservado, experiência reconstruída       |
| `/pretendentes/$id`      |   P/S/R | Camada romântica do perfil único                 |
| `/interesses`            |   P/D/R | Estados claros e regras no domínio               |
| `/matches`               |   P/D/R | Dados preservados, UX atualizada                 |
| `/conversas`             |   P/S/R | Inbox unificada por contexto                     |
| `/conversas/$matchId`    |   P/D/R | Chat maduro preservado                           |
| `/proposito/$matchId`    |   P/D/R | Área do casal ampliada                           |
| `/recados`               |   P/D/R | Exclusivo do Namoro                              |
| `/presentes`             |   P/D/R | Contexto social/romântico explícito              |
| `/comunidade`            |     N/S | Hub comunitário real                             |
| `/conversas/comunidade`  |   P/D/R | Espaço oficial dentro da Comunidade              |
| `/devocional`            |   P/D/R | Conteúdo focado e integrado                      |
| `/oracoes`               |   P/D/R | Pedidos com audiência e segurança                |
| `/quiz-biblico`          |     P/D | Aprendizado sem ranking espiritual               |
| `/noticias`              |     D/R | Tipos editoriais separados                       |
| `/loja`                  |   P/S/R | Catálogo modular e compra segura                 |
| `/caixas`                |   P/D/R | Transparência, recibo e regra versionada         |
| `/conquistas`            |   P/D/R | Conquistas sem confundir mérito espiritual       |
| `/avatar`                |       X | Retirar personagem customizável                  |
| `/avatar/criar`          |       X | Retirar criação do personagem                    |
| `/meu-pet`               |   P/D/R | Central modular do pet                           |
| `/pet-arcade`            |     R/D | Hub lazy-load; avaliar cada jogo                 |
| `/suporte/*`             |   P/D/R | Ajuda e tickets preservados                      |
| `/admin/*`               |   P/S/R | Console por capacidade                           |
| Sala de Cinema           |       N | Domínio social e de mídia novo                   |
| Espaços/grupos           |       N | Comunidade estruturada                           |
| Conexões sociais         |       N | Vínculo bilateral não romântico                  |
| Solicitações de mensagem |       N | Consentimento antispam                           |

Esta matriz será revisada com o proprietário ao redesenhar o Item 1. Ela não é autorização de remoção ou implementação.

---

## 33. Como usar os protótipos do Sites

### 33.1 Papel correto

Protótipos do Sites são referências de:

- direção visual;
- composição;
- densidade;
- ideia de navegação;
- motion;
- microinterações;
- hipóteses de produto.

Não são automaticamente:

- código de produção;
- schema de dados;
- política de segurança;
- fonte de verdade de regras;
- prova de acessibilidade;
- prova de desempenho;
- especificação completa de estados.

### 33.2 Ficha de avaliação por protótipo

Cada tela criada no Sites será avaliada por:

| Critério       | Pergunta                                          |
| -------------- | ------------------------------------------------- |
| Objetivo       | Qual problema resolve?                            |
| Contexto       | Comunidade, Namoro ou ambos?                      |
| Dados          | Quais dados reais alimentam a tela?               |
| Ações          | Quais comandos ela executa?                       |
| Permissões     | Quem pode ver e agir?                             |
| Estados        | Há loading, vazio, erro, offline e bloqueio?      |
| Mobile         | Funciona com teclado, toque e área segura?        |
| Desktop        | Expande sem virar espaço vazio?                   |
| Acessibilidade | Contraste, foco e leitor de tela estão previstos? |
| Performance    | Quais assets e módulos carrega?                   |
| Preservação    | O que atual não pode ser perdido?                 |
| Decisão        | adotar, adaptar, combinar ou descartar            |

### 33.3 Perfil Steam-like

O protótipo será aceito somente se:

- vitrines usam dados reais;
- configuração continua simples;
- privacidade existe por módulo;
- mobile possui ordem linear clara;
- personalização não quebra contraste;
- inventário e equipamento atuais continuam válidos;
- avatar-personagem não é reintroduzido;
- ações sociais e românticas não são confundidas.

---

## 34. Ordem futura de redesign

Esta ordem começa somente depois das pré-condições de segurança e snapshot publicado.

### Fase 0 — Fundação

- corrigir riscos P0 do Item 2;
- confirmar banco publicado com consulta do Item 3;
- aprovar revisão do Item 1;
- definir tokens e componentes-base;
- criar testes de caracterização;
- estabelecer métricas e feature flags.

### Fase 1 — Navegação e identidade

- app shell;
- bottom navigation;
- centro `Eu`;
- configurações;
- notificações;
- perfil modular em flag.

### Fase 2 — Comunidade separada

- estado comunitário;
- perfil comunitário;
- conexões e seguir;
- solicitações de mensagem;
- hub Comunidade;
- chat global integrado.

### Fase 3 — Namoro separado

- ativação/pausa;
- perfil romântico contextual;
- descoberta;
- interesses e matches;
- recados;
- novo efeito do Propósito Firmado.

### Fase 4 — Conteúdo e experiências

- hub cristão;
- grupos e eventos;
- Sala de Cinema;
- inbox categorizada.

### Fase 5 — Economia e subprodutos

- loja/inventário modular;
- pets;
- Arcade por jogo;
- caixas e conquistas.

### Fase 6 — Administração

- console por capacidades;
- moderação contextual;
- operação de Cinema;
- auditoria e métricas.

### Fase 7 — Aposentadorias e otimização

- retirar avatar-personagem da navegação e consumo;
- aplicar compensação aprovada;
- arquivar dados;
- remover assets comprovadamente órfãos;
- otimizar bundles, PWA e Storage;
- contrair schema somente após estabilidade.

---

## 35. Critério de pronto por tela

Uma tela futura só está pronta quando:

1. objetivo e público estão definidos;
2. dados reais e fonte de verdade estão mapeados;
3. permissões são avaliadas no servidor/banco;
4. ações possuem idempotência quando necessário;
5. loading, vazio, erro, offline e permissão existem;
6. mobile, tablet e desktop foram verificados;
7. teclado e áreas seguras foram testados;
8. acessibilidade passou nos critérios acordados;
9. orçamento de desempenho foi respeitado;
10. analytics não coleta conteúdo sensível;
11. feature flag e rollback existem quando a mudança é relevante;
12. comportamento anterior protegido possui teste;
13. nenhum dado é perdido;
14. copy está em português correto e consistente;
15. o protótipo visual corresponde à regra real.

---

## 36. Métricas de sucesso

### 36.1 Comunidade

- novos usuários que concluem onboarding comunitário;
- pessoas ativas sem modo Namoro;
- conexões aceitas sem aumento de bloqueios;
- participação saudável em espaços e conteúdo;
- retenção por valor, não apenas notificação.

### 36.2 Namoro

- ativação voluntária;
- qualidade de interesses e matches;
- conversas iniciadas com consentimento;
- denúncias e bloqueios por coorte;
- Propósitos Firmados preservados e bem-sucedidos conforme definição de produto.

### 36.3 Perfil

- conclusão do perfil;
- uso de vitrines;
- tempo para configurar;
- taxa de abandono no editor;
- incidência de contraste/falha visual;
- carregamento por faixa de dispositivo.

### 36.4 Saúde técnica

- erro por rota;
- latência de consultas e comandos;
- tamanho de bundle;
- Core Web Vitals;
- falhas Realtime;
- divergências de saldo/inventário;
- falhas de jobs e push;
- uso de Storage/CDN.

Métricas nunca devem expor conteúdo privado ou incentivar comparação espiritual.

---

## 37. Decisões fechadas nesta etapa

1. O produto se apresenta primeiro como comunidade cristã.
2. Namoro é opcional e não domina a navegação de todos.
3. Mobile usa cinco destinos principais com personalização limitada.
4. Desktop usa rail, conteúdo e coluna contextual opcional.
5. `/inicio` continua hub; `/dashboard` continua analítico.
6. Perfil é modular, mas suas configurações são simples.
7. Inspiração Steam significa expressão e vitrines, não cópia visual.
8. Inspiração WhatsApp significa clareza de configuração, não cópia visual.
9. Perfil comunitário e romântico são renderizações contextuais da mesma identidade.
10. Comunidade ganha feed, descoberta, grupos e eventos.
11. Chat global deixa de ser sinônimo de toda a Comunidade.
12. Conexão social não é match.
13. Inbox separa contextos sem duplicar o núcleo de conversa.
14. Propósito Firmado não elimina presença comunitária.
15. Recados permanecem românticos.
16. Avatar-personagem será retirado; foto e decorações permanecem.
17. Sala de Cinema usa vídeo enviado/processado, não screen share.
18. Mídia pesada não entra no Git.
19. Admin será organizado por capacidades.
20. Protótipos do Sites precisam passar por avaliação funcional.
21. Nenhuma implementação começa antes das pré-condições dos Itens 2, 3 e 7.

---

## 38. Decisões que continuam abertas

Precisam de validação do proprietário antes da implementação:

- identidade visual final e nova marca/ícone;
- composição exata da bottom navigation;
- quais vitrines entram no primeiro lançamento;
- limites gratuitos/premium de personalização;
- regra romântica atual de elegibilidade e sexo;
- política de visibilidade e aprovação de grupos;
- quais jogos permanecem;
- destino comercial das caixas;
- compensação por itens do avatar-personagem;
- modelo jurídico e operacional da Sala de Cinema;
- limites de upload e retenção;
- criação de conteúdo por usuários;
- política editorial do conteúdo cristão;
- nível de offline realmente suportado;
- ordem final das telas a prototipar no Sites.

---

## 39. Próxima ação recomendada

Voltar ao Item 1 e revisar, junto ao proprietário, cada módulo usando o destino agora definido:

- preservar;
- preservar e redesenhar;
- refatorar;
- reconstruir/substituir;
- retirar;
- criar.

A primeira revisão deve começar pelas decisões já citadas pelo proprietário:

1. Avatar — retirar;
2. Perfil — reconstruir com módulos e vitrines;
3. Comunidade — expandir para núcleo do produto;
4. Namoro — preservar como modo paralelo;
5. navegação — redesenhar;
6. jogos — avaliar individualmente;
7. features boas — preservar comportamento e alterar apenas design quando possível.

Depois dessa revisão, será possível montar o backlog de implementação por épicos sem transformar o documento arquitetural em uma lista prematura de tarefas.

---

## 40. Registro de integridade

Para produzir esta Etapa 8:

- o GitHub foi consultado somente em leitura;
- a `main` foi confirmada no commit `1de94bca421c36d32b1a4d96b2fc96f2330129aa`;
- os documentos dos Itens 1, 4, 5, 6 e 7 foram usados como base;
- rotas reais do retrato local do repositório foram confrontadas com o inventário;
- nenhuma branch foi criada;
- nenhum commit foi criado;
- nenhum arquivo do repositório foi editado;
- nenhuma migration foi executada;
- nenhuma tabela, policy, RPC, trigger, bucket ou dado foi alterado;
- nenhuma remoção do avatar-personagem foi executada;
- nenhum protótipo do Sites foi tratado como código canônico;
- este arquivo descreve a experiência futura, não uma funcionalidade já implantada.

**Resultado:** o projeto completo da nova experiência está definido e pronto para orientar a revisão do Item 1 e, somente depois, o backlog seguro de implementação.
