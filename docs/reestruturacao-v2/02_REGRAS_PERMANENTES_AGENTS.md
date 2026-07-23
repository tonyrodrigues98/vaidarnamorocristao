# Vai Dar Namoro V2 — regras permanentes para o Codex

Integre estas regras ao `AGENTS.md` da raiz. Preserve regras locais mais
específicas e instruções de segurança do ambiente.

## Missão permanente

Reconstruir o Vai Dar Namoro como comunidade cristã social `community-first`,
preservando sistemas e dados legítimos, isolando Namoro como modo opcional e
eliminando progressivamente monólitos, duplicações, gambiarras e regras
sensíveis no frontend.

## Fontes de verdade

1. instrução mais recente de Antonio;
2. revisão oficial do escopo;
3. projeto da nova experiência;
4. separação Comunidade/Namoro;
5. arquitetura por domínios;
6. preservação e migração;
7. plano de segurança;
8. desmontagem dos monólitos;
9. snapshot do Supabase;
10. manual atual;
11. protótipos, somente para design.

## Autonomia

- Continue trabalhando até concluir o lote ou atingir bloqueador externo real.
- Corrija obstáculos técnicos dentro do escopo sem pedir permissão rotineira.
- Use decisões reversíveis e padrões já definidos.
- Não peça confirmação para criar código, testes, docs, commits, branches ou
  Draft PRs necessários ao lote.
- Continue em branch empilhada quando a base anterior estiver em Draft.
- Não faça merge, deploy ou mutation no Supabase publicado.
- Quando um gate bloquear uma área, continue o trabalho independente.

## Economia de contexto

- Mantenha `docs/reestruturacao-v2/20_EXECUTION_STATE.md` curto.
- Não recopie contexto entre lotes.
- Não produza diário de comandos.
- Não releia todos os documentos após cada checkpoint.
- Use testes focados durante a edição e gates completos em marcos.
- A resposta final deve ser curta.

## Arquitetura

- monólito modular;
- fatias por domínio;
- rotas finas;
- regras puras no domínio;
- adapters de dados;
- servidor/banco como autoridade;
- eventos internos explícitos;
- import boundaries;
- nenhum microserviço sem necessidade real;
- nenhuma tabela universal prematura;
- nenhuma duplicação de infraestrutura entre Comunidade e Namoro.

## Segurança e dados

- nunca confiar no cliente para identidade, quantidade, progresso ou poder;
- RLS/grants/RPCs como autoridade;
- `SECURITY DEFINER` com `search_path`, autenticação e escopo explícitos;
- operações econômicas idempotentes e reconciliáveis;
- cache privado particionado por usuário;
- limpeza em logout/troca de conta;
- deep link relativo ou same-origin e allowlist por rota;
- secrets e `service_role` somente server-side;
- mídia validada por tipo real, tamanho, propriedade e moderação;
- falha de IA não aprova conteúdo silenciosamente;
- nenhuma suíte mutável contra produção;
- migrations seguem expandir, preencher, comparar, alternar, estabilizar e só
  então contrair.

## Produto

- Comunidade independe de Namoro.
- Namoro é opt-in, reversível e invisível quando desligado.
- Conexão social não é match.
- Propósito pausa apenas romance.
- Recado anônimo é romântico e opt-in.
- Perfil tem uma identidade e renderizações contextuais.
- `/inicio` e `/dashboard` são distintos.
- inventário é fonte de propriedade;
- nenhum jogo sai sem lista de Antonio;
- avatar-personagem sai sem atingir foto/decorações;
- Cinema não é screen share;
- Verbo não cria competição espiritual.

## Design

- mobile-first;
- Poppins;
- Lucide/Heroicons;
- sem emoji como ícone;
- identidade própria e premium;
- estados loading, vazio, erro, offline e permissão;
- WCAG 2.2 AA;
- foco, teclado, reduced motion, safe areas e input mobile correto;
- protótipos não são autoridade técnica.

## Git

- nunca editar `main` diretamente;
- preservar worktree e mudanças do usuário;
- commits revisáveis;
- `--force-with-lease` somente quando reescrita já autorizada exigir;
- PR sempre Draft durante execução autônoma;
- não marcar Ready, fazer merge ou deploy;
- registrar dependência de PR empilhado.

## Definição de pronto de uma fatia

Uma fatia só está pronta quando:

1. contrato de domínio e fonte de verdade estão claros;
2. dados e permissões estão protegidos;
3. UI usa dados reais ou adapter explícito;
4. loading, vazio, erro, offline e permissão existem;
5. mobile, tablet e desktop foram verificados;
6. acessibilidade e desempenho foram considerados;
7. testes de regressão e autorização passam;
8. flag/rollback existem quando necessários;
9. nenhum dado legítimo foi perdido;
10. estado persistente e Draft PR foram atualizados.

