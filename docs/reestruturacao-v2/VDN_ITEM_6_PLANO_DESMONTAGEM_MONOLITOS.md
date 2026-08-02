# VaiDarNamoro — Item 6: Plano de Desmontagem dos Monólitos

**Status:** especificação documental; nenhuma alteração aplicada  
**Data-base:** 22 de julho de 2026  
**Repositório analisado:** `tonyrodrigues98/vaidarnamorocristao`  
**Branch:** `main`  
**Commit de referência:** `1de94bca421c36d32b1a4d96b2fc96f2330129aa`  
**Itens anteriores utilizados:** Manual do Sistema Atual, Plano de Segurança, Snapshot Canônico do Supabase, Arquitetura por Domínios e Separação entre Comunidade e Namoro

---

## 1. Objetivo

Este documento define como desmontar progressivamente os maiores arquivos do VaiDarNamoro sem interromper o produto, sem perder comportamentos existentes e sem transformar a reestruturação em uma reescrita total.

O plano cobre:

1. Perfil;
2. Administração geral;
3. Administração de Pets;
4. Loja;
5. Comunidade atual;
6. Onboarding;
7. Meu Pet;
8. Pet Arcade.

O termo “desmontar” significa:

- reduzir as rotas a pontos de composição;
- mover regras para os domínios que realmente as possuem;
- isolar acesso ao Supabase;
- separar estado remoto de estado visual;
- criar contratos estáveis entre módulos;
- permitir redesign sem reabrir toda a lógica do sistema;
- manter cada etapa implantável, testável e reversível.

Este Item 6 **não** move arquivos, não altera imports, não cria componentes, não executa migrations e não modifica o GitHub ou o Supabase.

---

## 2. Conclusão executiva

O VaiDarNamoro não precisa de uma reescrita completa. Precisa de uma extração progressiva orientada por domínio.

A estratégia recomendada é:

1. congelar comportamento com testes de caracterização;
2. criar contratos de dados ao redor do código atual;
3. extrair acesso ao Supabase antes de redesenhar a interface;
4. extrair regras puras e comandos;
5. extrair blocos visuais por responsabilidade;
6. transformar a rota em composição;
7. somente depois substituir o design ou introduzir o modelo futuro.

Não será usado um “big bang”. Em qualquer momento da implementação futura, a versão publicada deverá continuar funcional.

O alvo é um **monólito modular**, conforme definido no Item 4. Não há justificativa atual para microserviços.

---

## 3. Estado atual medido

### 3.1 Arquivos principais

| Arquivo                               | Linhas aproximadas | Papel atual                                                 | Risco   |
| ------------------------------------- | -----------------: | ----------------------------------------------------------- | ------- |
| `src/routes/admin/index.tsx`          |              3.999 | painel administrativo multi-domínio                         | crítico |
| `src/routes/admin/pets.tsx`           |              2.062 | catálogo, benefícios e central de operações de pets         | alto    |
| `src/routes/loja.tsx`                 |              1.764 | catálogo, compras, equipamentos, brindes e inventário       | alto    |
| `src/routes/perfil.tsx`               |              1.746 | leitura, edição, personalização, saldo, missões e presentes | alto    |
| `src/routes/conversas/comunidade.tsx` |              1.528 | chat global, Realtime, moderação, stickers e presença       | alto    |
| `src/routes/onboarding/index.tsx`     |              1.460 | fluxo de 12 etapas, rascunho, uploads e persistência        | alto    |
| `src/routes/meu-pet.tsx`              |              1.369 | vitrine, cuidado, progressão, cenário e criação do pet      | alto    |
| `src/routes/pet-arcade.tsx`           |                789 | catálogo e carregamento de aproximadamente 17 jogos         | médio   |

Total: aproximadamente **14.700 linhas** concentradas em oito rotas.

### 3.2 Indicadores de acoplamento direto

| Arquivo    | Imports |              `useState` | `useEffect` | Consultas `.from(...)` diretas | RPCs diretas | Canais Realtime |
| ---------- | ------: | ----------------------: | ----------: | -----------------------------: | -----------: | --------------: |
| Perfil     |      47 |                      11 |           9 |                             16 |            0 |               0 |
| Admin      |      32 |                      32 |           9 |                             61 |            6 |               0 |
| Admin Pets |      26 |                       7 |           5 |    encapsuladas em bibliotecas | encapsuladas |               0 |
| Loja       |      26 | estado remoto via Query |           1 |                              1 | encapsuladas |               0 |
| Comunidade |      34 |                      13 |           9 |                             23 |            0 |               2 |
| Onboarding |      16 | múltiplos campos locais |           3 |                             15 |            0 |               0 |
| Meu Pet    |      48 |                      10 |           6 |                   encapsuladas | encapsuladas |               0 |
| Pet Arcade |      46 |                       1 |           1 |                   encapsuladas | encapsuladas |               0 |

Esses números não são uma métrica de qualidade isolada. Eles mostram onde uma alteração visual pode acidentalmente atingir persistência, autorização, economia ou Realtime.

### 3.3 Três tipos de monólito encontrados

#### Tipo A — monólito multi-domínio

Exemplo principal: `admin/index.tsx`.

O arquivo reúne módulos que possuem dados, permissões e jornadas diferentes. A solução é separar por capacidade administrativa e rota.

#### Tipo B — monólito vertical incompleto

Exemplos: Perfil, Loja, Comunidade e Onboarding.

A rota contém interface, estado, consulta, mutação e regra de negócio. A solução é formar fatias verticais completas dentro do respectivo domínio.

#### Tipo C — orquestrador sobrecarregado

Exemplos: Meu Pet e Pet Arcade.

Muitos componentes já existem, mas a rota ainda conhece detalhes demais e importa experiências pesadas simultaneamente. A solução é criar um controlador de tela, contratos por subproduto e carregamento sob demanda.

---

## 4. Regras obrigatórias da desmontagem

### 4.1 Rota fina

Uma rota futura deve conter apenas:

- declaração da rota;
- guardas e redirecionamentos;
- leitura de parâmetros de URL;
- carregamento de um componente de página;
- metadados da página.

Meta recomendada: normalmente entre 20 e 120 linhas. Isso não é uma regra rígida; é um sinal arquitetural.

### 4.2 Um dono para cada regra

Exemplos:

- saldo pertence à Economia;
- propriedade e equipamento pertencem ao Inventário;
- renderização do perfil pertence a Perfil;
- disponibilidade romântica pertence a Namoro;
- compromisso pertence a Propósito Firmado;
- bloqueio pertence a Confiança e Segurança;
- resultado e recompensa dos jogos pertencem a Jogos + Economia no backend.

Uma página pode consumir esses contratos, mas não deve recriar suas regras.

### 4.3 Nenhuma mudança de comportamento escondida

Extrair código não autoriza:

- alterar texto;
- mudar regra de elegibilidade;
- trocar ordenação;
- remover campo;
- mudar autorização;
- substituir query;
- mudar valor de recompensa;
- alterar navegação;
- redesenhar tela.

Mudança estrutural e mudança de produto devem ser entregues separadamente.

### 4.4 Supabase atrás de repositórios do domínio

Componentes visuais não devem conhecer nomes de tabelas, colunas ou RPCs.

O fluxo desejado é:

```text
Rota → Página → Caso de uso/hook → Repositório do domínio → Supabase
```

### 4.5 Estado remoto não é estado visual

- TanStack Query: dados do servidor, cache, invalidação e sincronização;
- estado local: aba aberta, modal, texto em edição, seleção temporária;
- URL: aba compartilhável, filtro, paginação ou seção navegável;
- formulário: React Hook Form + Zod quando aplicável;
- Realtime: eventos que atualizam/invalida o estado remoto.

### 4.6 Compatibilidade durante a transição

Enquanto uma fatia ainda não foi extraída:

- a rota antiga continua sendo a fonte funcional;
- o novo módulo pode ser ativado por flag;
- dados continuam no mesmo banco;
- nenhuma migration destrutiva acompanha uma simples extração de frontend;
- contratos novos devem conseguir ler o formato atual.

### 4.7 Tamanho de mudança controlado

Cada implementação futura deve preferir uma mudança pequena e revisável:

- um contrato;
- uma seção;
- um painel;
- um comando;
- uma família de testes.

Evitar PRs que misturem desmontagem de cinco módulos, redesign e migration.

---

## 5. Estrutura-alvo comum

Estrutura conceitual recomendada:

```text
src/
├── routes/
│   └── ... rotas finas
├── domains/
│   ├── profile/
│   │   ├── api/
│   │   ├── application/
│   │   ├── model/
│   │   ├── queries/
│   │   └── ui/
│   ├── community/
│   ├── conversations/
│   ├── onboarding/
│   ├── economy/
│   ├── inventory/
│   ├── pets/
│   ├── games/
│   ├── moderation/
│   └── administration/
├── shared/
│   ├── ui/
│   ├── hooks/
│   ├── errors/
│   └── infrastructure/
└── integrations/
    └── supabase/
```

Essa árvore é um destino, não uma ordem para mover tudo de uma vez.

### 5.1 Responsabilidade das camadas

| Camada          | Pode conhecer                    | Não deve conhecer    |
| --------------- | -------------------------------- | -------------------- |
| rota            | URL, guardas, página             | schema do banco      |
| UI              | view model, comandos             | tabelas e RPCs cruas |
| aplicação       | casos de uso e coordenação       | detalhes visuais     |
| modelo          | tipos, invariantes, regras puras | React e Supabase     |
| queries         | cache e chaves                   | markup da tela       |
| API/repositório | Supabase e mapeamento            | estado de modal      |

---

## 6. Estratégia transversal em sete ondas

### Onda 0 — linha de base

Antes de mover qualquer código:

1. executar TypeScript, build e testes atuais;
2. capturar rotas críticas em desktop e mobile;
3. registrar queries e mutações importantes;
4. criar testes de caracterização;
5. registrar bundle por rota;
6. definir feature flag quando o módulo for sensível.

### Onda 1 — contratos e tipos

1. criar tipos de domínio independentes do `Database` gerado;
2. mapear linhas do Supabase para modelos do domínio;
3. padronizar erros;
4. declarar interfaces dos repositórios;
5. manter a implementação atual por trás desses contratos.

### Onda 2 — leitura

1. extrair consultas;
2. consolidar query keys;
3. definir cache e invalidação;
4. remover consultas duplicadas da rota;
5. preservar loading, empty, stale e offline.

### Onda 3 — comandos

1. extrair criação, edição, compra, equipamento e moderação;
2. centralizar autorização e validação;
3. garantir idempotência quando necessária;
4. padronizar feedback e erro;
5. impedir que componentes escrevam diretamente no saldo.

### Onda 4 — seções visuais

1. extrair uma seção por vez;
2. passar view models pequenos;
3. eliminar props que expõem schema;
4. preservar acessibilidade e comportamento mobile;
5. não redesenhar durante a extração.

### Onda 5 — composição

1. criar a página-orquestradora do domínio;
2. mover aba e filtro adequado para URL;
3. reduzir a rota;
4. ativar a nova composição por flag;
5. comparar antiga e nova em paralelo.

### Onda 6 — limpeza

Somente após estabilidade:

1. remover caminhos antigos;
2. eliminar imports mortos;
3. impedir novas consultas diretas em rotas;
4. documentar a API interna do domínio;
5. medir bundle e regressões.

---

## 7. Perfil — `src/routes/perfil.tsx`

### 7.1 Situação atual

O arquivo possui aproximadamente 1.746 linhas e 47 imports. Ele reúne:

- carregamento e atualização do perfil básico;
- validação Zod;
- upload e moderação de foto;
- preferências;
- perfil avançado;
- configuração de cargo e badge;
- missões;
- saldo;
- customização;
- presentes recebidos;
- Propósito Firmado;
- gradiente de nome;
- card e sidekick do pet;
- comportamento offline;
- seleção de abas e recursos do hub.

Há consultas diretas a `profiles`, `profile_preferences`, `user_roles`, `user_badges`, fila e log de moderação de foto, além de acesso ao bucket de fotos.

O problema principal não é a quantidade de JSX. É a página ser simultaneamente:

- editor de identidade;
- painel de conta;
- vitrine social;
- entrada para economia;
- entrada para missões;
- superfície de relacionamento;
- superfície de pet.

### 7.2 Decisão de destino

O perfil futuro inspirado na Steam será uma apresentação modular. A configuração será simples, mas a renderização poderá ser rica.

O arquivo atual não deve ser usado como base direta do redesign. Primeiro serão extraídos os contratos que preservam:

- foto e identidade;
- informações pessoais;
- dados de fé;
- preferências românticas atuais;
- itens equipados;
- presentes;
- badges e cargos;
- compromisso;
- integração opcional com pet.

### 7.3 Fronteiras obrigatórias

| Responsabilidade               | Domínio dono           |
| ------------------------------ | ---------------------- |
| nome, foto, bio e presença     | Perfil                 |
| configuração do perfil modular | Perfil                 |
| preferências românticas        | Namoro                 |
| cargo e poderes                | Identidade/Autorização |
| saldo                          | Economia               |
| itens equipados                | Inventário             |
| presentes recebidos            | Presentes/Inventário   |
| missões e recompensas          | Progressão             |
| compromisso                    | Propósito Firmado      |
| pet exibido                    | Pets                   |

### 7.4 Estrutura-alvo

```text
domains/profile/
├── api/
│   ├── profileRepository.ts
│   ├── profilePhotosRepository.ts
│   └── profilePresentationRepository.ts
├── application/
│   ├── getMyProfile.ts
│   ├── updateBasicProfile.ts
│   ├── updateProfilePhoto.ts
│   └── updateProfileLayout.ts
├── model/
│   ├── profile.ts
│   ├── profileVisibility.ts
│   └── profileModules.ts
├── queries/
│   ├── profileKeys.ts
│   ├── useMyProfile.ts
│   └── useProfilePresentation.ts
└── ui/
    ├── ProfilePage.tsx
    ├── ProfileHeader.tsx
    ├── ProfileIdentitySection.tsx
    ├── ProfileFaithSection.tsx
    ├── ProfileModuleGrid.tsx
    ├── ProfileSettings.tsx
    └── ProfileEditor.tsx
```

Integrações como saldo, presentes e pet entram por adapters ou slots, não por consultas próprias do Perfil.

### 7.5 Ordem de extração

1. extrair `profileSchema` e tipos;
2. encapsular leitura do perfil básico;
3. encapsular atualização e upload de foto;
4. extrair formulário básico sem mudar o layout;
5. extrair preferências para o domínio Namoro;
6. transformar saldo, missões, presentes e customização em módulos independentes;
7. criar `ProfilePage` de composição;
8. reduzir `/perfil` a rota fina;
9. só então iniciar o redesign modular.

### 7.6 Regra do avatar-personagem

A retirada futura do avatar-personagem não pode remover:

- foto principal do perfil;
- `avatar_ai_verified` ou campos equivalentes de verificação da foto;
- escopos de moderação que usam a palavra `avatar` para foto;
- `DecoratedAvatar`, quando ele significa foto com moldura/aura;
- molduras, auras, fundos, gradientes e stickers;
- itens de perfil que não dependam do corpo customizável.

Durante a extração, toda referência deverá ser classificada como:

- `profile_photo`;
- `decorated_profile_photo`;
- `custom_character_avatar_legacy`.

### 7.7 Testes de preservação

- carregar perfil online e com cache;
- editar cada campo aceito atualmente;
- validar campos inválidos;
- trocar foto e enviar para moderação;
- manter foto anterior em falha;
- abrir cada aba por URL;
- carregar cargo, badge, saldo e itens equipados;
- não vazar preferências românticas na futura apresentação comunitária;
- preservar Propósito Firmado;
- preservar integração com pet quando habilitada.

---

## 8. Administração geral — `src/routes/admin/index.tsx`

### 8.1 Situação atual

É o maior monólito: aproximadamente 3.999 linhas, 32 estados locais, 61 acessos diretos `.from(...)`, seis RPCs e dezenas de diálogos.

O arquivo reúne pelo menos:

- usuários;
- aprovação, rejeição, banimento e exclusão;
- cargos e suporte;
- concessão de moedas;
- badges;
- pré-cadastros;
- pré-matches;
- denúncias de perfil;
- flags de mensagens;
- palavras restritas;
- notícias e devocionais;
- pedidos de oração denunciados;
- avisos administrativos;
- apelações de banimento e rejeição;
- interesses;
- notificações.

Esses módulos não compartilham a mesma jornada nem o mesmo risco.

### 8.2 Decisão de destino

`/admin` deve virar um cockpit com métricas, alertas e links. O trabalho operacional deve viver em rotas dedicadas por capacidade.

Administração não será um domínio que “possui todos os dados”. Será uma interface privilegiada que chama comandos dos domínios donos.

### 8.3 Rotas-alvo

```text
/admin
/admin/usuarios
/admin/aprovacoes
/admin/cargos
/admin/suporte
/admin/pre-cadastros
/admin/matches
/admin/moderacao/perfis
/admin/moderacao/mensagens
/admin/moderacao/oracoes
/admin/moderacao/palavras
/admin/conteudo
/admin/apelacoes
/admin/economia
/admin/inventario
/admin/pets
/admin/jogos
/admin/configuracoes
```

Rotas já existentes para auras, molduras, fundos, presentes, stickers, fotos e verificações devem ser preservadas e alinhadas, não duplicadas.

### 8.4 Estrutura-alvo

```text
domains/administration/
├── shell/
│   ├── AdminShell.tsx
│   ├── AdminSidebar.tsx
│   └── AdminTopNav.tsx
├── dashboard/
├── users/
├── approvals/
├── moderation/
├── content/
├── appeals/
└── shared/
    ├── AdminDataTable.tsx
    ├── AdminAuditNote.tsx
    ├── ConfirmAdminAction.tsx
    └── useAdminCapability.ts
```

Cada módulo administrativo chama o domínio correspondente:

```text
Admin Usuários → Identidade
Admin Moedas → Economia
Admin Conteúdo → Conteúdo cristão
Admin Denúncias → Moderação
Admin Pets → Pets
Admin Jogos → Jogos
```

### 8.5 Ordem de extração

1. congelar matriz de permissões por cargo;
2. extrair `AdminShell` e navegação já existentes;
3. transformar `/admin` em índice sem remover painéis;
4. extrair painéis de leitura simples;
5. extrair palavras restritas e conteúdo;
6. extrair pré-cadastros e pré-matches;
7. extrair flags e denúncias;
8. extrair apelações;
9. extrair usuários, cargos, banimento e exclusão por último;
10. eliminar writes diretos quando houver comando seguro do domínio.

Usuários e ações destrutivas ficam por último porque concentram maior risco.

### 8.6 Regras de segurança obrigatórias

- interface não substitui RLS/RPC;
- toda ação sensível valida cargo no backend;
- super admin não pode ser rebaixado por fluxo comum;
- exclusão definitiva exige confirmação reforçada;
- concessão de moedas usa comando auditável;
- toda ação registra ator, alvo, motivo e horário;
- listas administrativas devem paginar no servidor;
- busca não deve baixar toda a base para filtrar no cliente;
- ações em lote têm limite, preview e resultado por item.

### 8.7 Testes de preservação

Matriz mínima por `super_admin`, `admin`, `apresentador`, `moderador` e `user`:

- acesso à rota;
- visibilidade de cada módulo;
- leitura permitida;
- mutação permitida;
- mutação negada;
- erro parcial;
- auditoria;
- paginação;
- busca;
- estado offline;
- prevenção de clique duplo;
- preservação dos dados após recarregar.

---

## 9. Administração de Pets — `src/routes/admin/pets.tsx`

### 9.1 Situação atual

O arquivo possui aproximadamente 2.062 linhas. Ele já está parcialmente melhor estruturado porque delega áreas a:

- `PetBackgroundsPanel`;
- `PetCareItemsPanel`;
- `PetPersonalityEffectsPanel`;
- `PetExpeditionsPanel`;
- `PetGrabPanel`;
- `PetArcadePanel`.

O peso restante está no CRUD genérico do catálogo e nas variações de formulário para:

- categorias;
- espécies;
- variantes;
- fases de vida;
- personalidades;
- benefícios;
- tipos de efeito;
- pets legados.

### 9.2 Decisão de destino

Preservar a central `/admin/pets`, mas transformar cada aba em módulo carregado sob demanda.

Não criar uma abstração genérica tão ampla que esconda diferenças importantes. Categoria, espécie, variante e benefício podem compartilhar infraestrutura, mas continuam entidades distintas.

### 9.3 Estrutura-alvo

```text
domains/pets/admin/
├── PetAdminPage.tsx
├── PetAdminNavigation.tsx
├── catalog/
│   ├── categories/
│   ├── species/
│   ├── variants/
│   ├── life-stages/
│   └── personalities/
├── benefits/
├── care/
├── backgrounds/
├── expeditions/
├── grab/
├── arcade/
└── legacy/
```

### 9.4 Ordem de extração

1. mover a definição das abas para configuração tipada;
2. extrair shell e navegação;
3. extrair preview e upload reutilizáveis;
4. separar cada entidade do catálogo;
5. manter helpers comuns somente onde o comportamento é idêntico;
6. carregar aba ativa por lazy import;
7. isolar legado;
8. impedir novas funcionalidades no legado.

### 9.5 Testes de preservação

- criar, editar, ativar, desativar e excluir cada entidade;
- upload e preview;
- relações categoria → espécie → variante;
- fases bebê/adulto;
- raridade;
- benefícios e efeitos;
- ordenação;
- erro de integridade referencial;
- acesso somente administrativo;
- Pet Arcade e Grab continuam com regras de backend.

---

## 10. Loja — `src/routes/loja.tsx`

### 10.1 Situação atual

O arquivo possui aproximadamente 1.764 linhas. Ele combina:

- catálogo de molduras;
- catálogo de auras;
- fundos;
- gradientes de nome;
- stickers/equipamentos relacionados;
- saldo;
- propriedade de itens;
- compra;
- equipar e desequipar;
- brindes;
- destaques;
- inventário;
- preview na foto decorada;
- offline, stale e pull-to-refresh.

Embora use TanStack Query e bibliotecas especializadas, a página ainda orquestra muitas famílias de item e fluxos diferentes.

### 10.2 Decisão de destino

Separar claramente:

- **Loja:** descoberta e oferta;
- **Economia:** autorização da compra e saldo;
- **Inventário:** propriedade;
- **Loadout:** item equipado;
- **Perfil:** renderização do resultado.

### 10.3 Modelo comum de apresentação

Criar um view model canônico sem forçar todas as tabelas a serem iguais imediatamente:

```ts
type StoreItemView = {
  id: string;
  kind: string;
  name: string;
  description?: string;
  price: number;
  rarity?: string;
  preview: StoreItemPreview;
  owned: boolean;
  equipped: boolean;
  purchasable: boolean;
};
```

O adapter de cada catálogo converte seu formato atual para esse view model.

### 10.4 Estrutura-alvo

```text
domains/store/
├── api/
├── application/
│   ├── listStoreItems.ts
│   ├── purchaseStoreItem.ts
│   └── claimStoreFreebie.ts
├── queries/
├── model/
└── ui/
    ├── StorePage.tsx
    ├── StoreCategoryNav.tsx
    ├── StoreHighlights.tsx
    ├── StoreCatalogGrid.tsx
    ├── StoreItemCard.tsx
    ├── PurchaseDialog.tsx
    └── StorePreview.tsx

domains/inventory/
├── application/
├── queries/
└── ui/
    ├── InventoryPage.tsx
    └── EquipmentPanel.tsx
```

### 10.5 Ordem de extração

1. consolidar query keys;
2. criar adapters por categoria;
3. extrair saldo como leitura da Economia;
4. extrair compra como comando único e seguro;
5. extrair equipar/desequipar para Inventário;
6. extrair brindes;
7. separar destaques, catálogo e inventário;
8. mover categoria/filtro para URL;
9. reduzir a rota;
10. otimizar imagens e lazy loading.

### 10.6 Invariantes

- saldo nunca é calculado como autoridade no cliente;
- compra é atômica;
- clique duplo não compra duas vezes;
- item não pode ser equipado sem propriedade;
- apenas um item por slot quando a regra exigir;
- compra concluída invalida saldo e inventário;
- falha parcial não deixa saldo e item divergentes;
- brindes respeitam limite no backend.

### 10.7 Avatar-personagem

Itens exclusivos do personagem customizável serão marcados como legado e removidos em plano próprio. A Loja não deve apagar ou esconder automaticamente molduras, auras, fundos, gradientes ou qualquer personalização da foto/perfil.

---

## 11. Comunidade atual — `src/routes/conversas/comunidade.tsx`

### 11.1 Situação atual

O arquivo possui aproximadamente 1.528 linhas e implementa uma conversa global madura:

- carregamento inicial;
- paginação reversa;
- scroll e badge de mensagens novas;
- Realtime de mensagens;
- perfis e cargos;
- presença e digitação;
- envio otimista;
- cooldown;
- edição e exclusão;
- resposta;
- pin;
- flags e denúncias;
- palavras restritas;
- stickers;
- gasto de moeda;
- ações por cargo;
- drawer de conversas.

Ele consulta diretamente mensagens globais, perfis, cargos, badges, compromissos, stickers e flags.

### 11.2 Decisão de destino

Esta rota deve ser tratada como **Chat Global da Comunidade**, não como o domínio Comunidade inteiro.

O futuro feed, grupos, eventos, espaços e Sala de Cinema não devem ser adicionados a esse arquivo.

### 11.3 Fronteiras

| Capacidade                    | Domínio dono           |
| ----------------------------- | ---------------------- |
| sala e mensagens              | Conversas              |
| elegibilidade para participar | Comunidade             |
| cargos                        | Identidade/Autorização |
| palavras e flags              | Moderação              |
| stickers e propriedade        | Inventário             |
| custo de ação                 | Economia               |
| presença e digitação          | Conversas/Presença     |
| compromisso exibido           | Propósito Firmado      |

### 11.4 Estrutura-alvo

```text
domains/conversations/
├── core/
│   ├── message.ts
│   ├── messageRepository.ts
│   ├── conversationPermissions.ts
│   └── realtimeAdapter.ts
├── global-chat/
│   ├── GlobalChatPage.tsx
│   ├── useGlobalMessages.ts
│   ├── useGlobalChatRealtime.ts
│   ├── useGlobalChatComposer.ts
│   └── globalChatRepository.ts
└── ui/
    ├── MessageList.tsx
    ├── MessageBubble.tsx
    ├── MessageActions.tsx
    ├── ReplyPreview.tsx
    ├── ChatComposer.tsx
    └── TypingPresence.tsx
```

### 11.5 Ordem de extração

1. criar tipo canônico de mensagem e perfil resumido;
2. extrair repositório de mensagens;
3. extrair paginação;
4. extrair Realtime com deduplicação;
5. extrair envio otimista e reconciliação;
6. extrair moderação;
7. extrair composer;
8. extrair lista e bolha;
9. criar `GlobalChatPage`;
10. manter `/conversas/comunidade` como rota compatível.

### 11.6 Regras delicadas

- mensagens não podem duplicar entre fetch e Realtime;
- ordem deve permanecer determinística;
- mensagem otimista deve reconciliar com a persistida;
- falha de envio deve permitir retry;
- carregar antigas não pode mover o scroll abruptamente;
- editar/excluir respeita autoria e moderação;
- bloquear alguém deve afetar a visualização conforme Item 5;
- gasto de moeda precisa ocorrer no backend e não liberar ação em falha;
- perfil resumido não deve vazar dados românticos.

### 11.7 Testes de preservação

- dois usuários enviando simultaneamente;
- reconexão após perda de rede;
- paginação com novas mensagens chegando;
- edição e exclusão;
- resposta a mensagem antiga;
- sticker;
- cooldown;
- palavra restrita;
- denúncia;
- pin por cargo;
- presença;
- digitação;
- scroll mobile com teclado;
- usuário bloqueado;
- staff e usuário comum.

---

## 12. Onboarding — `src/routes/onboarding/index.tsx`

### 12.1 Situação atual

O arquivo possui aproximadamente 1.460 linhas e contém:

- 12 etapas mais boas-vindas;
- sete etapas obrigatórias;
- campos opcionais de fé e preferências;
- rascunho local;
- normalização e upload de foto;
- detecção de perfil existente;
- persistência distribuída entre `profiles`, `profile_advanced`, `profile_preferences` e Storage;
- múltiplos componentes de etapa no mesmo arquivo.

### 12.2 Mudança de produto já definida

O Item 5 exige separar:

- onboarding comunitário obrigatório;
- ativação/configuração romântica posterior e opcional.

Portanto, a desmontagem deve primeiro preservar o fluxo atual e depois permitir a separação sem duplicar a identidade.

### 12.3 Estrutura-alvo

```text
domains/onboarding/
├── model/
│   ├── onboardingState.ts
│   ├── onboardingSteps.ts
│   └── onboardingValidation.ts
├── application/
│   ├── loadOnboarding.ts
│   ├── saveOnboardingDraft.ts
│   ├── submitCommunityOnboarding.ts
│   └── submitDatingSetup.ts
├── queries/
├── ui/
│   ├── OnboardingShell.tsx
│   ├── OnboardingProgress.tsx
│   ├── CommunityOnboardingFlow.tsx
│   ├── DatingSetupFlow.tsx
│   └── steps/
└── draft/
    ├── onboardingDraftStore.ts
    └── onboardingDraftMigration.ts
```

### 12.4 Ordem de extração

1. declarar schema único do estado atual;
2. versionar o rascunho local;
3. extrair validadores por etapa;
4. extrair cada etapa visual sem alterar sequência;
5. extrair persistência para um caso de uso transacional/idempotente;
6. criar máquina de estados explícita;
7. reduzir rota a shell;
8. após paridade, dividir comunitário e romântico;
9. criar migração de rascunhos antigos;
10. ativar por feature flag.

### 12.5 Máquina de estados recomendada

Estados mínimos:

```text
loading → editing → validating → saving → completed
                   ↘ invalid
                         saving → failed → editing
```

Etapa visual não deve decidir diretamente como escrever em quatro destinos.

### 12.6 Regras de preservação

- usuário não perde rascunho ao atualizar;
- rascunho antigo é migrado ou descartado com aviso claro;
- idade é derivada de nascimento de forma consistente;
- foto só substitui estado final após sucesso;
- submissão repetida não duplica dados;
- perfil básico pode existir sem modo namoro;
- novos usuários não entram automaticamente no namoro;
- usuários atuais não perdem preferências existentes.

### 12.7 Testes

- concluir apenas etapas obrigatórias;
- concluir todas as etapas;
- fechar e voltar em cada etapa;
- upload HEIC/JPEG/PNG;
- falha de upload;
- falha parcial do banco;
- submissão duplicada;
- perfil já completo;
- rascunho de versão anterior;
- mobile com teclado;
- ativação posterior do namoro.

---

## 13. Meu Pet — `src/routes/meu-pet.tsx`

### 13.1 Situação atual

O arquivo possui aproximadamente 1.369 linhas e 48 imports. Muitos componentes já foram extraídos, mas a rota coordena:

- carregamento do pet;
- criação e edição;
- wizard de categoria, espécie, variante e personalidade;
- imagem por fase de vida;
- cenário, dia/noite e clima;
- necessidades e humor;
- buffs;
- cuidado;
- evolução;
- XP e progressão;
- missões;
- expedições;
- Grab/caixas;
- streak e baú semanal;
- eventos aleatórios;
- confissões e diário;
- histórico;
- Pet Arcade;
- cache local.

### 13.2 Decisão de destino

Separar três superfícies:

1. **Pet Home:** experiência principal e cuidado;
2. **Pet Creation/Editor:** wizard de adoção e edição;
3. **Pet Activities:** missões, expedições, diário, Grab e Arcade.

O pet continua como subproduto isolável, mas usa contratos de Economia e Jogos.

### 13.3 Estrutura-alvo

```text
domains/pets/
├── core/
│   ├── pet.ts
│   ├── petNeeds.ts
│   ├── petMood.ts
│   └── petRepository.ts
├── home/
│   ├── PetHomePage.tsx
│   ├── PetScene.tsx
│   ├── PetHud.tsx
│   └── usePetHomeController.ts
├── care/
├── progression/
├── evolution/
├── creation/
│   ├── PetCreationFlow.tsx
│   └── steps/
├── activities/
├── scenery/
└── queries/
```

### 13.4 Controlador de tela

`usePetHomeController` poderá compor leituras e comandos, mas não deve virar um novo monólito invisível. Ele retorna view models pequenos:

- `petIdentity`;
- `sceneState`;
- `needsState`;
- `availableActions`;
- `progressionSummary`;
- `activitySummary`.

### 13.5 Ordem de extração

1. separar wizard do showcase;
2. extrair criação/edição;
3. centralizar query keys do pet;
4. extrair estado derivado de necessidades e humor;
5. extrair comandos de cuidado;
6. extrair cena e HUD;
7. transformar cards de atividade em entradas independentes;
8. criar `PetHomePage`;
9. carregar atividades pesadas sob demanda;
10. reduzir a rota.

### 13.6 Invariantes

- decaimento usa tempo confiável e regra única;
- cuidado não concede benefício duas vezes;
- moeda/XP não são autoridades do cliente;
- fase adulta respeita desbloqueio;
- background não muda regra do pet;
- cache local é aceleração, não autoridade;
- ausência temporária de rede não corrompe snapshot;
- um usuário não modifica pet de outro;
- efeitos de personalidade são determinísticos e auditáveis.

### 13.7 Testes

- usuário sem pet;
- criação completa;
- edição permitida;
- troca de fase;
- long press e menu radial;
- todas as ações de cuidado;
- cálculo após horas ausente;
- cenário dia/noite;
- missão, expedição e streak;
- evento aleatório;
- navegação para Arcade;
- cache stale e reconexão;
- mobile PWA.

---

## 14. Pet Arcade — `src/routes/pet-arcade.tsx`

### 14.1 Situação atual

Com aproximadamente 789 linhas, é menor que os demais, mas importa diretamente cerca de 17 experiências e muitos assets de card.

Ele reúne:

- catálogo e filtros;
- configuração global;
- saldo;
- pet ativo e necessidades;
- limites diários;
- rounds ativos;
- históricos diferentes;
- seleção e palco do jogo;
- carregamento de todos os jogos.

O maior risco é de bundle e acoplamento entre lobby e jogos.

### 14.2 Decisão de destino

Separar:

- lobby;
- sessão/round;
- histórico;
- registro de jogos;
- cada implementação de jogo.

Cada jogo deve ser carregado somente quando aberto.

### 14.3 Registro tipado de jogos

```ts
type ArcadeGameDefinition = {
  type: ArcadeGameType;
  category: ArcadeCategory;
  title: string;
  cardAsset: () => Promise<string>;
  loadGame: () => Promise<{ default: React.ComponentType<GameProps> }>;
  requirements: ArcadeRequirement[];
};
```

O catálogo do backend continua sendo autoridade para ativo, custo, limite e recompensa. O registry do frontend decide apenas como apresentar e carregar a implementação.

### 14.4 Estrutura-alvo

```text
domains/games/pet-arcade/
├── lobby/
│   ├── PetArcadeLobbyPage.tsx
│   ├── ArcadeFilters.tsx
│   └── ArcadeGameCard.tsx
├── session/
│   ├── ArcadeSessionPage.tsx
│   ├── ArcadeSessionBoundary.tsx
│   └── useArcadeSession.ts
├── history/
├── registry/
│   └── arcadeGameRegistry.ts
└── games/
    ├── wheel/
    ├── plinko/
    ├── keno/
    ├── race/
    └── ...
```

### 14.5 Ordem de extração

1. criar registry sem mudar os jogos;
2. extrair lobby;
3. extrair histórico;
4. extrair sessão/round;
5. lazy-load de um jogo piloto;
6. medir bundle e tempo de abertura;
7. migrar os demais jogos em pequenos grupos;
8. isolar error boundary por jogo;
9. remover imports eager;
10. manter contratos de resultado no backend.

### 14.6 Invariantes

- cliente não escolhe resultado premiado;
- round tem id único;
- retomada de round ativo é determinística;
- limite diário é do backend;
- custo e prêmio são atômicos;
- recarregar não duplica prêmio;
- falha visual de um jogo não derruba o lobby;
- jogo inativo no catálogo não abre por URL direta.

### 14.7 Testes

- abrir lobby sem pet;
- saldo insuficiente;
- requisito de cuidado;
- limite diário;
- iniciar e concluir cada tipo;
- recarregar no meio;
- round expirado;
- histórico;
- jogo desativado;
- falha no lazy import;
- bundle por jogo;
- mobile e baixa memória.

---

## 15. Dependências cruzadas que precisam ser cortadas

### 15.1 Perfil ↔ Economia ↔ Inventário

Hoje a mesma tela pode carregar saldo, propriedade, equipamento e renderização. No destino:

```text
Economia autoriza gasto
Inventário registra propriedade/equipamento
Perfil renderiza apresentação
Loja oferece item
```

### 15.2 Comunidade ↔ Conversas

Comunidade define participação, espaços e vínculos. Conversas define mensagens, presença, leitura e Realtime.

O chat global é um espaço da Comunidade implementado pelo domínio Conversas.

### 15.3 Pets ↔ Jogos ↔ Economia

Pets fornece identidade e estado necessário. Jogos administra a sessão. Economia movimenta moedas/XP por operação segura.

### 15.4 Admin ↔ todos os domínios

Admin não acessa livremente todas as tabelas. Ele usa comandos administrativos explícitos dos domínios.

### 15.5 Onboarding ↔ Perfil ↔ Namoro

Onboarding coordena a entrada. Perfil possui identidade comunitária. Namoro possui configuração romântica opcional.

---

## 16. Contratos internos recomendados

### 16.1 Resultados de comando

```ts
type CommandResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string; retryable: boolean };
```

O código de UI não deve interpretar texto cru do Postgres para decidir regra.

### 16.2 Capacidades

```ts
type Capability =
  | "profile.update.self"
  | "community.chat.post"
  | "community.chat.moderate"
  | "admin.users.review"
  | "admin.economy.grant"
  | "pets.catalog.manage";
```

Capacidade melhora legibilidade, mas a decisão final continua no backend.

### 16.3 Query keys

Cada domínio publica sua fábrica:

```ts
const profileKeys = {
  all: ["profile"] as const,
  me: (userId: string) => ["profile", "me", userId] as const,
};
```

Não criar strings soltas repetidas pela aplicação.

### 16.4 Eventos internos

Eventos úteis:

- `profile.updated`;
- `profile.photo.updated`;
- `inventory.item.purchased`;
- `inventory.loadout.changed`;
- `economy.balance.changed`;
- `pet.care.completed`;
- `arcade.round.completed`;
- `moderation.action.applied`.

Inicialmente podem ser apenas invalidações coordenadas no cliente e eventos do banco. Não exigem um broker externo.

---

## 17. Estratégia de testes

### 17.1 Pirâmide mínima

1. regras puras e mapeadores;
2. repositórios com Supabase mockado/ambiente de teste;
3. hooks de query e comando;
4. componentes críticos;
5. integração por rota;
6. E2E das jornadas essenciais;
7. testes reais de RLS/RPC.

### 17.2 Testes de caracterização

Antes de extrair, os testes devem registrar como o sistema se comporta hoje, mesmo quando o comportamento ainda não é ideal.

Quando houver um bug conhecido:

- documentar como bug;
- não congelá-lo como comportamento desejado;
- corrigir em mudança separada;
- adicionar teste do comportamento correto.

### 17.3 Matriz transversal

Toda rota sensível deve ser testada com:

- usuário deslogado;
- usuário pendente;
- usuário aprovado;
- usuário rejeitado/banido;
- moderador;
- apresentador;
- admin;
- super admin;
- online;
- offline/cache;
- mobile;
- desktop.

### 17.4 Observabilidade

Durante rollout, medir:

- erros por rota;
- tempo de carregamento;
- falha de mutação;
- invalidações repetidas;
- duplicação de mensagens;
- compra/recompensa divergente;
- abandono do onboarding;
- falha de upload;
- bundle carregado por rota;
- memória em Pet Arcade.

---

## 18. Estratégia de rollout e rollback

### 18.1 Feature flags sugeridas

- `profile_modular_v1`;
- `admin_split_routes_v1`;
- `store_domain_v1`;
- `global_chat_modular_v1`;
- `community_onboarding_v1`;
- `pet_home_modular_v1`;
- `pet_arcade_lazy_games_v1`.

### 18.2 Implantação gradual

1. equipe interna;
2. administradores;
3. pequena porcentagem de usuários;
4. aumento progressivo;
5. ativação geral;
6. remoção do caminho antigo após janela de estabilidade.

### 18.3 Rollback

Rollback de frontend deve consistir em desligar a flag ou reverter o deploy, sem exigir reversão de dados.

Por isso:

- migrations aditivas precedem o uso;
- escrita dupla, se necessária, tem prazo curto e telemetria;
- remoção de coluna só ocorre muito depois;
- o caminho antigo continua lendo os dados durante a transição;
- nenhuma extração estrutural deve depender de `DROP`.

---

## 19. Ordem global recomendada de implementação

### Fase A — fundação

1. corrigir riscos P0 do Item 2;
2. confirmar snapshot publicado do Item 3;
3. estabilizar testes e CI;
4. padronizar Bun como gerenciador;
5. criar convenções de domínio, query keys e erros.

### Fase B — extrações de baixo risco

1. shell do Admin;
2. registry e lazy loading do Pet Arcade;
3. shell do Admin Pets;
4. componentes de etapa do Onboarding;
5. adapters visuais da Loja.

### Fase C — dados e comandos

1. repositório de Perfil;
2. comandos de Loja/Inventário;
3. repositório do Chat Global;
4. controlador do Pet Home;
5. comandos administrativos por domínio.

### Fase D — rotas finas

1. Pet Arcade;
2. Admin Pets;
3. Loja;
4. Onboarding;
5. Meu Pet;
6. Comunidade/Chat Global;
7. Perfil;
8. Admin geral.

Admin geral fica por último porque contém o maior número de ações críticas. Perfil fica próximo do fim porque será influenciado pelo redesign e pela separação Comunidade/Namoro.

### Fase E — evolução de produto

Após paridade estrutural:

1. separar onboarding comunitário e romântico;
2. construir perfil comunitário modular;
3. criar descoberta social;
4. ampliar Comunidade além do chat;
5. retirar avatar-personagem;
6. redesenhar páginas;
7. adicionar Sala de Cinema sobre domínios estabilizados.

---

## 20. Critério de pronto por monólito

Um arquivo só é considerado desmontado quando:

- rota contém apenas composição e guardas;
- consultas diretas saíram da UI;
- mutações têm comando explícito;
- regras puras são testadas;
- autorização crítica continua no backend;
- query keys são centralizadas;
- loading, empty, error, stale e offline foram preservados;
- mobile e desktop passaram;
- bundle não piorou sem justificativa;
- caminho antigo pode ser removido com segurança;
- documentação do domínio foi atualizada.

Reduzir linhas sem cumprir esses critérios não conclui a desmontagem.

---

## 21. O que não fazer

- não copiar o arquivo grande para vários arquivos igualmente acoplados;
- não criar um hook de 2.000 linhas;
- não criar um “service.ts” que conhece todas as tabelas;
- não mover lógica de segurança para o frontend;
- não redesenhar enquanto extrai comportamento crítico;
- não unificar entidades apenas porque possuem campos parecidos;
- não substituir todas as queries de uma vez;
- não alterar schema para satisfazer uma organização visual;
- não criar microserviços para resolver tamanho de componente;
- não apagar avatar-personagem antes do inventário de dependências;
- não colocar feed, grupos ou Cinema dentro do chat global;
- não permitir que Admin escreva saldo diretamente;
- não carregar todos os jogos do Arcade na entrada;
- não perder estados offline já existentes.

---

## 22. Riscos do plano

| Risco                           | Impacto                   | Mitigação                                           |
| ------------------------------- | ------------------------- | --------------------------------------------------- |
| extração muda comportamento     | regressão silenciosa      | testes de caracterização e diffs pequenos           |
| duplicação de fontes de verdade | dados divergentes         | dono por domínio e período curto de compatibilidade |
| abstração genérica demais       | código difícil de evoluir | abstrair apenas comportamento realmente comum       |
| flags permanentes               | complexidade acumulada    | dono e data de remoção por flag                     |
| bundle piora                    | PWA mais lenta            | medição por rota e lazy loading                     |
| cache inconsistente             | telas desatualizadas      | query keys e eventos canônicos                      |
| Admin perde capacidade          | operação bloqueada        | matriz de paridade por módulo                       |
| Realtime duplica estado         | mensagens duplicadas      | id estável e reconciliação                          |
| avatar removido incorretamente  | perda de foto/decorações  | taxonomia explícita das três noções de avatar       |
| redesign invade refatoração     | escopo incontrolável      | entregas separadas                                  |

---

## 23. Decisões fechadas neste Item 6

1. a reestruturação será progressiva;
2. o alvo é monólito modular, não microserviços;
3. rotas serão finas;
4. acesso ao Supabase ficará atrás dos domínios;
5. Admin será dividido por capacidades;
6. `/admin` será cockpit, não depósito de todas as operações;
7. Perfil será modular, mas só será redesenhado após extração de contratos;
8. Chat Global não será confundido com todo o domínio Comunidade;
9. Onboarding comunitário e configuração romântica terão fluxos separados no futuro;
10. Loja, Economia, Inventário e Perfil terão donos diferentes;
11. Meu Pet será separado em Home, Criação e Atividades;
12. jogos do Pet Arcade serão carregados sob demanda;
13. avatar-personagem será retirado por protocolo próprio;
14. foto, `DecoratedAvatar`, molduras, auras, fundos e gradientes permanecem;
15. cada extração terá testes de paridade e rollback.

---

## 24. Pontos reservados para decisão futura

Estes pontos não impedem o plano estrutural, mas serão decididos na revisão de produto:

- quais módulos inauguram o perfil estilo Steam;
- quais módulos o usuário poderá reordenar;
- quais módulos serão privados, públicos ou por conexão;
- quais abas permanecem dentro de `/perfil`;
- destino visual de saldo, missões e presentes;
- primeira versão do feed comunitário;
- se o chat global continuará como espaço principal ou secundário;
- quantidade de etapas do onboarding comunitário;
- quais atividades de Pet ficam na Home;
- quais jogos permanecem ativos após avaliação de qualidade;
- ordem e UX final das rotas administrativas.

Essas decisões devem mudar componentes e composição, não reintroduzir consultas diretas nas rotas.

---

## 25. Entregáveis futuros de implementação

Quando a execução for autorizada, cada monólito deverá gerar:

1. inventário de comportamento congelado;
2. mapa de dependências;
3. contratos e tipos;
4. plano de PRs;
5. testes de caracterização;
6. módulos extraídos;
7. comparação antes/depois;
8. relatório de bundle;
9. checklist mobile/PWA;
10. plano de remoção do legado.

---

## 26. Registro de integridade

Para este Item 6:

- o repositório foi analisado no commit informado;
- os oito arquivos foram medidos;
- imports, estados, efeitos, consultas, RPCs e Realtime foram confrontados;
- componentes já extraídos foram considerados;
- os contratos dos Itens 4 e 5 foram preservados;
- a retirada do avatar-personagem foi tratada separadamente da foto de perfil;
- nenhuma alteração foi feita no código do produto;
- nenhuma migration foi criada ou executada;
- nenhuma tabela, função, policy, bucket ou dado foi modificado;
- nenhum commit ou pull request foi criado.

**Resultado:** existe agora uma ordem técnica segura para transformar aproximadamente 14.700 linhas concentradas em rotas em módulos por domínio, mantendo o produto operacional e preparando o redesign futuro.

---

## 27. Próximo item

O Item 7 deve definir o plano de preservação e migração dos dados e comportamentos durante a futura reestruturação, incluindo:

- inventário protegido;
- compatibilidade de schema;
- migrations aditivas;
- dual-read/dual-write somente quando indispensável;
- backfill;
- validação de contagem e integridade;
- rollback;
- remoção controlada do avatar-personagem;
- preservação de usuários, mensagens, matches, Propósito Firmado, economia, itens, pets e jogos.
