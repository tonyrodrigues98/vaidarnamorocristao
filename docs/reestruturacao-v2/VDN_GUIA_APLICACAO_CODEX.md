# VaiDarNamoro — Guia de aplicação com o Codex

## Objetivo

Este arquivo explica como entregar ao Codex toda a documentação da reestruturação do VaiDarNamoro e fazê-lo trabalhar com segurança, usando os protótipos criados no Sites como referências visuais sem confundi-los com a fonte de verdade do produto ou do banco.

O projeto é um produto existente, conectado ao Supabase, com usuários, dados, economia, inventários, mensagens, matches, Propósito Firmado, pets, jogos e administração. A reconstrução não deve ser executada como uma substituição total em uma única tarefa.

A estratégia obrigatória é:

> documentar → confirmar o estado real → proteger → criar fundações → migrar por domínio → comparar → ativar gradualmente → estabilizar → retirar o legado

---

## 1. O que baixar

Baixe estes dez arquivos:

1. `VDN_ITEM_1_MANUAL_SISTEMA_ATUAL.md`
2. `VDN_ITEM_1_REVISAO_OFICIAL_ESCOPO.md`
3. `VDN_ITEM_2_PLANO_SEGURANCA.md`
4. `VDN_ITEM_3_SNAPSHOT_CANONICO_SUPABASE.md`
5. `VDN_ITEM_3_SUPABASE_INVENTARIO_READONLY.sql`
6. `VDN_ITEM_4_ARQUITETURA_POR_DOMINIOS.md`
7. `VDN_ITEM_5_SEPARACAO_COMUNIDADE_NAMORO.md`
8. `VDN_ITEM_6_PLANO_DESMONTAGEM_MONOLITOS.md`
9. `VDN_ITEM_7_PLANO_PRESERVACAO_MIGRACAO.md`
10. `VDN_ITEM_8_PROJETO_NOVA_EXPERIENCIA.md`

Baixe também este próprio arquivo:

11. `VDN_GUIA_APLICACAO_CODEX.md`

Não é necessário transformar os documentos em PDF. O formato Markdown é melhor para o Codex pesquisar, citar e comparar.

---

## 2. Onde colocar no repositório

Na raiz do repositório do VaiDarNamoro, crie esta estrutura:

```text
docs/
  reestruturacao-v2/
    00_GUIA_APLICACAO_CODEX.md
    01_MANUAL_SISTEMA_ATUAL.md
    02_REVISAO_OFICIAL_ESCOPO.md
    03_PLANO_SEGURANCA.md
    04_SNAPSHOT_CANONICO_SUPABASE.md
    05_SUPABASE_INVENTARIO_READONLY.sql
    06_ARQUITETURA_POR_DOMINIOS.md
    07_SEPARACAO_COMUNIDADE_NAMORO.md
    08_PLANO_DESMONTAGEM_MONOLITOS.md
    09_PLANO_PRESERVACAO_MIGRACAO.md
    10_PROJETO_NOVA_EXPERIENCIA.md
    referencias-sites/
      README.md
      perfil-steam/
      inicio-instagram/
      comunidade-discord/
      conversas-whatsapp/
      verbo/
      sala-cinema/
```

Renomeie apenas as cópias colocadas nessa pasta, seguindo a ordem acima. Os números ajudam o Codex a entender a sequência, mas a hierarquia de autoridade definida neste guia continua sendo obrigatória.

Não coloque vídeos grandes, exportações pesadas ou arquivos temporários no Git. Para referências visuais, prefira imagens WebP/PNG otimizadas, pequenos vídeos de demonstração ou links no `README.md`.

---

## 3. Como entregar as referências do Sites

O Codex não deve presumir que consegue ler automaticamente um projeto criado em outra conversa do Sites. Para cada referência, forneça pelo menos uma das opções abaixo:

- código exportado do protótipo;
- link público acessível;
- captura da versão mobile;
- captura da versão desktop;
- gravação curta mostrando animações e interações;
- descrição objetiva do comportamento que deve ser aproveitado.

Em `docs/reestruturacao-v2/referencias-sites/README.md`, use este modelo:

```md
# Referências visuais criadas no Sites

## Perfil estilo Steam

- Link: [COLE O LINK, SE EXISTIR]
- Arquivos: `perfil-steam/`
- Aproveitar: capa, identidade visual, vitrines reorganizáveis, inventário equipado e liberdade de expressão.
- Não copiar: navegação global, dados falsos, backend, nomes de tabelas e qualquer elemento que conflite com o projeto real.

## Início estilo Instagram

- Link: [COLE O LINK, SE EXISTIR]
- Arquivos: `inicio-instagram/`
- Aproveitar: novidades logo na entrada, feed social, status de 24 horas e sensação de comunidade viva.
- Não copiar: marca Instagram, ícones proprietários, conteúdo fictício e arquitetura de dados.

## Comunidade inspirada no Discord

- Link: [COLE O LINK, SE EXISTIR]
- Arquivos: `comunidade-discord/`
- Aproveitar: organização de espaços, canais, presença, acontecimentos e conversa comunitária.
- Não copiar: identidade do Discord ou sua interface literalmente.

## Conversas inspiradas no WhatsApp/Vitra

- Link: [COLE O LINK, SE EXISTIR]
- Arquivos: `conversas-whatsapp/`
- Aproveitar: fluidez, simplicidade, leitura imediata, navegação mobile-first e painel lateral de configurações.
- Não copiar: identidade, ícones proprietários ou aparência literal do WhatsApp.

## Verbo

- Link: [COLE O LINK, SE EXISTIR]
- Arquivos: `verbo/`
- Aproveitar: experiência completa de Bíblia e estudo pessoal como feature independente ligada ao login do usuário.

## Sala de Cinema

- Link: [COLE O LINK, SE EXISTIR]
- Arquivos: `sala-cinema/`
- Aproveitar: assistir juntos, player sincronizado, participantes, chat em tempo real e experiência cinematográfica integrada ao VaiDarNamoro.
```

As referências do Sites são autoridade sobre direção visual, composição, interação e sensação de uso. Elas não são autoridade sobre autenticação, banco, RLS, migrations, economia, permissões ou nomes das entidades existentes.

---

## 4. Hierarquia obrigatória dos documentos

Quando houver conflito, o Codex deve aplicar esta precedência:

1. A solicitação mais recente e explícita do proprietário do projeto.
2. `02_REVISAO_OFICIAL_ESCOPO.md` — destino oficial aprovado.
3. `10_PROJETO_NOVA_EXPERIENCIA.md` — experiência futura consolidada.
4. `07_SEPARACAO_COMUNIDADE_NAMORO.md` — regras funcionais de Comunidade e Namoro.
5. `06_ARQUITETURA_POR_DOMINIOS.md` — fronteiras e responsabilidades futuras.
6. `09_PLANO_PRESERVACAO_MIGRACAO.md` — limites de segurança dos dados.
7. `03_PLANO_SEGURANCA.md` — riscos e correções prioritárias.
8. `08_PLANO_DESMONTAGEM_MONOLITOS.md` — método de refatoração.
9. `04_SNAPSHOT_CANONICO_SUPABASE.md` — retrato documental do backend.
10. `01_MANUAL_SISTEMA_ATUAL.md` — comportamento existente que precisa ser compreendido e preservado durante a transição.
11. Referências do Sites — direção visual e de interação, nunca fonte de verdade técnica.

O manual atual não perde valor quando algo é marcado para reconstrução. Ele explica dados, integrações e comportamentos que não podem desaparecer por acidente.

---

## 5. Decisões de produto que não podem ser reinterpretadas

### Produto principal

O VaiDarNamoro será uma comunidade cristã social completa. Namoro será um modo opcional, paralelo, reversível e desativado por padrão.

### Perfil

- Reconstruir.
- Altamente customizável, expressivo, fácil e divertido.
- Inspirar-se na liberdade de composição da Steam, sem copiar sua aparência.
- Configurações simples com páginas/painéis laterais, inspiradas na clareza do WhatsApp.
- Preservar foto principal, galeria, verificação, moderação, molduras, auras, fundos, gradientes, presentes, stickers e inventários legítimos.

### Início e identidade pública

- Reconstruir.
- Mostrar imediatamente o que acontece na comunidade.
- Feed, novidades, amigos/conexões e status com duração de 24 horas.
- Inspirar-se na compreensão imediata do Instagram sem cloná-lo.
- `/inicio` continua sendo hub diário.
- `/dashboard` continua sendo área analítica separada; não transformar em redirect de `/inicio`.

### Cadastro e onboarding

- Reconstruir perguntas e organização.
- Manter somente dados realmente necessários para criar o perfil e configurar as experiências escolhidas.
- Não ativar Namoro automaticamente.

### Comunidade

- Reconstruir do zero.
- Criar espaços sociais, canais/grupos, eventos, presença e descoberta comunitária.
- Inspirar-se nos princípios de organização do Discord, sem copiar marca ou interface.

### Namoro e Pretendentes

- Retirar a rota e a experiência antiga de Pretendentes.
- Não apagar os dados românticos legítimos.
- Reconstruir a descoberta romântica dentro de uma área exclusiva do Modo Namoro.
- Quem não ativou Namoro não deve ver cards, textos, chamadas, filtros, notificações ou insinuações românticas.
- Matches, interesses, conversas, recados e Propósito Firmado devem ser preservados e migrados de forma segura.

### Conversas e recados anônimos

- Reconstruir totalmente o sistema de conversas.
- Prioridade máxima para fluidez, estabilidade, envio otimista, sincronização, estados de entrega/leitura e experiência mobile.
- Interface simples, minimalista e moderna, usando o protótipo Vitra/WhatsApp como referência.
- Separar conversas sociais e românticas sem criar duas infraestruturas conflitantes.
- Recados anônimos existem apenas no contexto romântico.
- Exigir Namoro ativo e consentimento explícito em `Receber recados anônimos?`.

### Propósito Firmado

- Preservar função e dados.
- Redesenhar a experiência.
- Deve pausar somente o domínio romântico, nunca retirar a pessoa da comunidade ou ocultar suas conversas sociais.

### Loja, moedas e inventário

- Preservar funcionalidade e dados.
- Redesenhar.
- Toda operação econômica deve ser server-authoritative e reconciliável.

### Pets e jogos

- Preservar função, dados, progressão e inventários.
- Redesenhar.
- Alguns jogos serão removidos posteriormente, somente após lista explícita do proprietário.
- Não antecipar exclusões.

### Verbo

- Criar como experiência de Bíblia e estudo pessoal independente, ligada ao mesmo login.
- A formulação técnica e a integração definitiva serão aprovadas em uma fase própria.

### Sala de Cinema

- Criar como experiência social integrada.
- Vídeo enviado à plataforma e reproduzido sincronizadamente; não é compartilhamento de tela.
- Mídia pesada fica em Storage/CDN, nunca no repositório.

### Administração e moderação

- Preservar capacidades e dados.
- Redesenhar para ficar minimalista, moderno e dividido por capacidades.
- Não reduzir permissões ou ferramentas legítimas do administrador durante uma mudança apenas visual.

### Avatar

- Retirar somente o avatar-personagem customizável e a rota de criação correspondente.
- A palavra `avatar` também é usada no projeto para foto de perfil e moderação. Essas áreas não devem ser apagadas.
- A retirada deve seguir inventário, bloqueio, compensação, retirada do produto, arquivo e somente depois possível contração física.

---

## 6. Ordem segura de implementação

Não implementar tudo ao mesmo tempo. Usar uma branch exclusiva e pull requests pequenas ou médias por fase.

### Fase 0 — Confirmação e contenção

- Confirmar branch, commit e working tree.
- Executar build, lint, typecheck e testes atuais.
- Confirmar o Supabase publicado com a consulta somente leitura, se houver acesso autorizado.
- Corrigir primeiro riscos críticos de segurança do Item 2.
- Criar feature flags e observabilidade mínimas.
- Não redesenhar páginas ainda.

### Fase 1 — Fundação modular

- Introduzir fronteiras por domínio sem mudar comportamento.
- Extrair acesso a dados, comandos, contratos e adaptadores.
- Criar testes de caracterização dos fluxos atuais.
- Aplicar a estratégia do Item 6 progressivamente.

### Fase 2 — Identidade, onboarding e estados independentes

- Separar estado comunitário, elegibilidade romântica, preferência de mensagens e vínculos sociais.
- Reconstruir onboarding sem ativar Namoro por padrão.
- Preservar IDs e dados existentes.

### Fase 3 — Início, feed, conexões e status

- Reconstruir `/inicio`.
- Implementar feed social e status de 24 horas.
- Manter `/dashboard` independente.

### Fase 4 — Comunidade

- Implementar a nova experiência comunitária do zero sobre domínios e permissões corretas.
- Entregar por feature flag.

### Fase 5 — Conversas

- Reconstruir chat com foco em desempenho e confiabilidade.
- Preservar mensagens, autores, ordem, anexos, entrega, leitura, bloqueios e Realtime.
- Migrar gradualmente e comparar o comportamento antigo e novo.

### Fase 6 — Perfil modular

- Reconstruir perfil expressivo e editor lateral.
- Integrar itens já possuídos sem duplicar inventário ou saldo.
- Testar perfis simples, premium, staff, comprometidos e com Namoro desativado.

### Fase 7 — Modo Namoro e Propósito Firmado

- Criar a nova área opcional de descoberta romântica.
- Migrar a experiência antiga de Pretendentes sem apagar dados.
- Redesenhar Propósito Firmado.
- Aplicar isolamento total para quem não ativou Namoro.

### Fase 8 — Redesign dos sistemas preservados

- Loja, moedas, inventário, pets, jogos, administração e moderação.
- Mudanças visuais não podem alterar regras econômicas ou permissões silenciosamente.

### Fase 9 — Novos produtos

- Sala de Cinema.
- Verbo.
- Cada um recebe especificação técnica, riscos, orçamento de mídia/performance e rollout próprios.

### Fase 10 — Retirada de legado

- Retirar avatar-personagem pelo protocolo aprovado.
- Retirar a experiência antiga de Pretendentes somente depois da paridade do novo Modo Namoro.
- Excluir fisicamente dados apenas com aprovação explícita, backup restaurável e reconciliação concluída.

---

## 7. Prompt-mestre para colar no Codex

Copie integralmente o texto entre as linhas abaixo e envie no Codex com o repositório do VaiDarNamoro aberto.

---

### INÍCIO DO PROMPT

Você trabalhará no repositório existente do VaiDarNamoro, um produto real conectado ao Supabase. Não trate esta tarefa como criação de um site novo nem como simples troca de layout.

Sua primeira responsabilidade é compreender o sistema, proteger dados e preparar uma implementação incremental da reestruturação V2.

Leia integralmente, antes de propor ou alterar qualquer coisa, todos os arquivos em `docs/reestruturacao-v2/`, incluindo a consulta SQL somente leitura e o índice de referências em `docs/reestruturacao-v2/referencias-sites/README.md`.

Use obrigatoriamente esta hierarquia quando houver conflito:

1. Minha solicitação mais recente e explícita.
2. `02_REVISAO_OFICIAL_ESCOPO.md`.
3. `10_PROJETO_NOVA_EXPERIENCIA.md`.
4. `07_SEPARACAO_COMUNIDADE_NAMORO.md`.
5. `06_ARQUITETURA_POR_DOMINIOS.md`.
6. `09_PLANO_PRESERVACAO_MIGRACAO.md`.
7. `03_PLANO_SEGURANCA.md`.
8. `08_PLANO_DESMONTAGEM_MONOLITOS.md`.
9. `04_SNAPSHOT_CANONICO_SUPABASE.md`.
10. `01_MANUAL_SISTEMA_ATUAL.md`.
11. Referências do Sites, apenas como direção visual e de interação.

O código atual é evidência do comportamento presente. Os documentos de revisão e nova experiência determinam o destino. Não use um protótipo do Sites como fonte de verdade para banco, autenticação, RLS, permissões, economia ou nomes de tabelas.

Decisões obrigatórias:

- O produto principal será uma comunidade cristã social completa.
- Namoro será um modo opcional, reversível, separado e desativado por padrão.
- Quem não ativou Namoro não verá nenhuma referência romântica.
- A rota/experiência antiga de Pretendentes será retirada, mas a descoberta romântica será reconstruída no Modo Namoro.
- Não apagar matches, interesses, conversas, recados, Propósito Firmado ou históricos legítimos.
- Perfil será reconstruído como espaço altamente customizável e expressivo, inspirado na liberdade da Steam, com configuração simples em painéis laterais.
- `/inicio` será reconstruído como hub social com feed, novidades, conexões e status de 24 horas.
- `/dashboard` continuará sendo painel analítico separado de `/inicio`; não criar redirect entre eles.
- Comunidade será reconstruída do zero, inspirada na organização social do Discord sem cloná-lo.
- Conversas serão reconstruídas com prioridade máxima para fluidez, estabilidade, envio otimista, offline, Realtime, entrega e leitura, usando o protótipo Vitra/WhatsApp como referência visual.
- Recados anônimos existem somente para quem ativou Namoro e habilitou explicitamente `Receber recados anônimos?`.
- Propósito Firmado será preservado e redesenhado; ele pausa somente o namoro, não a vida comunitária.
- Loja, moedas, inventário, pets, jogos, administração e moderação serão preservados funcionalmente e redesenhados.
- Nenhum jogo será removido até eu fornecer uma lista explícita.
- Verbo e Sala de Cinema são novos produtos e serão implementados em fases próprias.
- Retirar somente o avatar-personagem customizável. Preservar foto principal, galeria, verificação, moderação, molduras, auras, fundos, gradientes, presentes, stickers e inventários legítimos.

Restrições obrigatórias:

- Não executar reescrita total ou substituir o repositório inteiro.
- Não apagar tabelas, colunas, buckets, policies, migrations, dados ou arquivos em massa.
- Não executar `DROP`, `TRUNCATE`, limpeza de Storage ou migrations destrutivas sem aprovação explícita.
- Não aplicar migrations no Supabase publicado sem apresentar antes o SQL, impacto, rollback, reconciliação e teste.
- Não alterar saldos, inventários, XP, recompensas, matches ou mensagens diretamente pelo cliente.
- Não expor `service_role`, secrets ou operações privilegiadas no frontend.
- Não confundir avatar-personagem com foto de perfil.
- Não confundir retirada da experiência Pretendentes com exclusão do domínio de Namoro.
- Não mudar contratos públicos e schema silenciosamente para encaixar um protótipo visual.
- Não adicionar dependências grandes sem justificar necessidade, tamanho, manutenção e alternativa existente.
- Não duplicar sistemas já funcionais.
- Não apagar mudanças existentes do usuário nem arquivos não relacionados.
- Não fazer commit, push, merge, deploy ou aplicar alteração externa sem que o escopo correspondente tenha sido autorizado.

Padrões do produto:

- Mobile-first real, também excelente em desktop e tablet.
- PWA preservada.
- Tipografia Poppins.
- Ícones Lucide ou Heroicons; não usar emojis de teclado como ícones de interface.
- Design moderno, expressivo e premium, sem copiar marcas de terceiros.
- Acessibilidade, teclado, leitores de tela, contraste, reduced motion e áreas de toque adequadas.
- Evitar zoom de input no iOS usando tipografia e viewport corretos, não bloqueando acessibilidade.
- Imagens e vídeos pesados fora do Git, em Storage/CDN com políticas adequadas.
- Queries, comandos, regras e UI separados por domínio conforme os documentos.

Trabalhe inicialmente apenas na Fase 0. Antes de editar:

1. Leia todos os documentos completamente.
2. Leia `AGENTS.md` e demais instruções locais existentes.
3. Inspecione branch, commit, status do Git e mudanças não commitadas.
4. Confirme stack, scripts, rotas, estrutura de pastas, Supabase, Realtime, PWA e testes disponíveis.
5. Compare a documentação com o código atual e registre divergências.
6. Localize cada achado crítico do Item 2 no código atual e confirme se ainda existe.
7. Identifique quais referências do Sites estão realmente acessíveis e quais estão ausentes.
8. Não invente conteúdo de referência ausente.

Depois dessa leitura, entregue um relatório chamado `docs/reestruturacao-v2/11_PLANO_EXECUCAO_CODEX.md` contendo:

- commit e branch analisados;
- estado do working tree;
- scripts de validação disponíveis;
- divergências entre documentação e código;
- referências visuais acessíveis e ausentes;
- riscos críticos ainda presentes;
- sequência de pull requests por fase;
- arquivos previstos em cada primeira alteração;
- migrations previstas, sem executá-las;
- feature flags necessárias;
- testes de caracterização e aceitação;
- plano de rollback;
- pontos que exigem decisão minha;
- definição objetiva de pronto para a Fase 0.

Nesta primeira tarefa, não implemente o redesign e não aplique migrations. Você está autorizado apenas a inspecionar e criar o relatório de execução. Se encontrar um risco crítico, documente a contenção exata proposta, mas aguarde aprovação antes de modificar o sistema.

Ao terminar, apresente:

1. resumo executivo em linguagem simples;
2. riscos e bloqueios;
3. primeiro pull request recomendado;
4. lista exata dos arquivos que esse PR alterará;
5. testes que provarão que ele não quebrou o sistema;
6. pergunta objetiva solicitando autorização para iniciar esse primeiro PR.

### FIM DO PROMPT

---

## 8. O que fazer quando o Codex responder

Não responda apenas `pode fazer tudo`.

Confira se ele:

- leu os dez documentos;
- reconheceu a revisão oficial como autoridade superior ao manual antigo;
- separou avatar-personagem de foto de perfil;
- separou retirada de Pretendentes da preservação do Namoro;
- manteve `/inicio` e `/dashboard` distintos;
- começou pela segurança e fundação;
- apresentou arquivos exatos, testes e rollback;
- não propôs migration destrutiva;
- não tentou reconstruir todas as páginas de uma vez.

Se estiver correto, responda com este segundo prompt:

```text
Autorizo somente o primeiro PR proposto para a Fase 0.

Implemente exatamente o escopo aprovado, sem expandi-lo. Preserve todas as mudanças existentes e não relacionadas. Antes de editar, registre o baseline dos testes. Depois de editar, execute build, typecheck, lint e testes relevantes.

Não faça push, merge, deploy nem aplique migration no Supabase publicado. Se uma migration for necessária, crie o arquivo versionado, documente impacto e rollback, valide localmente quando possível e pare antes da aplicação externa.

Ao concluir, informe:
- arquivos alterados;
- motivo de cada alteração;
- testes executados e resultados;
- diferenças em relação ao plano;
- riscos restantes;
- procedimento de rollback;
- próximo PR recomendado.
```

Repita o processo para cada PR. Uma fase só avança após seus critérios de aceitação estarem cumpridos.

---

## 9. Como pedir cada referência visual ao Codex

Quando chegar a hora de implementar uma superfície, use um pedido específico. Exemplo para Conversas:

```text
Implemente apenas a fatia aprovada de Conversas. Antes de editar, leia novamente as seções correspondentes de `02_REVISAO_OFICIAL_ESCOPO.md`, `07_SEPARACAO_COMUNIDADE_NAMORO.md`, `08_PLANO_DESMONTAGEM_MONOLITOS.md`, `09_PLANO_PRESERVACAO_MIGRACAO.md` e `10_PROJETO_NOVA_EXPERIENCIA.md`.

Use `referencias-sites/conversas-whatsapp/` como referência de composição, fluidez e interação. Não copie o protótipo cegamente e não substitua o acesso real ao Supabase por dados falsos.

Preserve mensagens existentes, IDs, autores, ordem, anexos, bloqueios, status de entrega/leitura e Realtime. Implemente atrás da feature flag aprovada. Entregue testes de comportamento, desempenho e responsividade mobile antes de propor remoção da experiência antiga.
```

Troque o módulo e a pasta de referência conforme a fase.

---

## 10. Regra de ouro

O Codex deve receber o contexto completo uma vez, mas deve executar uma mudança limitada por vez.

O objetivo não é impedir iniciativa. É garantir que cada decisão seja verificável, reversível e compatível com o produto real. Um redesign visual pode ser amplo; a aplicação técnica deve continuar incremental.
