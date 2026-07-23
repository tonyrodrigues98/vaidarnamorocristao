# Vai Dar Namoro V2

## Missão

Reconstruir o produto como comunidade cristã social `community-first`, preservando
dados e sistemas legítimos. Namoro é um modo opcional, reversível e invisível
quando desligado.

## Autoridade

1. instrução mais recente de Antonio;
2. revisão oficial do escopo;
3. projeto da nova experiência;
4. separação Comunidade/Namoro;
5. arquitetura por domínios;
6. preservação e migração;
7. segurança, desmontagem, snapshot e manual atual;
8. protótipos, somente para design.

## Execução

- Trabalhe até concluir o lote ou atingir bloqueador externo real.
- Use decisões reversíveis e continue em branch empilhada quando a base estiver
  em Draft.
- Nunca edite `main`, faça merge, deploy ou mutation no Supabase publicado.
- Preserve worktree e mudanças do usuário.
- Mantenha `docs/reestruturacao-v2/20_EXECUTION_STATE.md` curto e atual.
- Use testes focados durante a edição e gates completos nos marcos.

## Arquitetura

- Monólito modular, fatias por domínio, rotas finas, regras puras e adapters de
  dados.
- Servidor, RLS, grants e RPCs são autoridade; flags e estado do frontend não
  concedem acesso.
- Nenhum microserviço, tabela universal ou infraestrutura duplicada sem
  necessidade comprovada.
- Componentes não importam Supabase; adapters não renderizam UI.

## Segurança e dados

- Nunca confie no cliente para identidade, quantidade, progresso ou poder.
- Cache privado deve ser particionado ou removido no logout/troca de conta.
- Deep links aceitam somente destino relativo ou same-origin permitido.
- Secrets e `service_role` são exclusivamente server-side.
- Operações econômicas devem ser idempotentes e reconciliáveis.
- Mídia exige tipo real, tamanho, propriedade e moderação; falha de IA não
  aprova conteúdo.
- Nunca execute suíte mutável contra produção.
- Migrations seguem expandir, preencher, comparar, alternar, estabilizar e só
  então contrair.

## Produto

- Comunidade independe de Namoro; conexão social não é match.
- Propósito pausa somente romance; recado anônimo é romântico e opt-in.
- Perfil tem uma identidade com renderizações contextuais.
- `/inicio` e `/dashboard` são distintos.
- Inventário é fonte de propriedade.
- Nenhum jogo sai sem lista de Antonio.
- A retirada do avatar-personagem não atinge foto, decorações ou inventário.
- Cinema não é screen share; Verbo não cria competição espiritual.

## Design

- Mobile-first, Poppins, Lucide/Heroicons e nenhum emoji como ícone.
- Identidade própria e premium.
- Todo fluxo relevante prevê loading, vazio, erro, offline e permissão.
- Atender WCAG 2.2 AA, foco, teclado, reduced motion, safe areas e input mobile.
- Protótipos não são autoridade técnica.

## Git e pronto

- Commits revisáveis; PR sempre Draft durante execução autônoma.
- `--force-with-lease` somente quando a reescrita autorizada exigir.
- Não marcar Ready, fazer merge, deploy ou excluir branch.
- Uma fatia só está pronta com contrato e fonte de verdade claros, proteção de
  dados e permissões, UI real ou adapter explícito, estados completos,
  responsividade, acessibilidade, testes, rollback, preservação e estado/PR
  atualizados.
