# V2-005 — Integração controlada do App Shell

## Objetivo e marco

A V2-005 conecta o App Shell da V2-004 ao runtime real sem substituir a aplicação legada. A
implementação parte de `c7e7f806fd3426359879240a133f7efe35709b32` e cria uma entrada protegida
em `/v2`, fechada por padrão pela flag canônica `VITE_FF_V2_APP_SHELL`.

Esta etapa não implementa domínios de produto, não consulta dados nas páginas provisórias e não
altera Supabase, banco, RLS, migrations, secrets, Vault, cron, Jobs, buckets ou produção.

## Arquitetura

A integração possui quatro fronteiras:

1. o root identifica apenas se o caminho pertence a `/v2` e decide entre fallback legado e a
   proteção canônica;
2. `RouteProtectionBoundary` continua sendo a única fronteira de autenticação e preserva o
   `returnTo` interno já validado pela V2-002;
3. `V2ShellRuntimeRoute` é o único adaptador concreto entre Auth, Theme, TanStack Router e o shell;
4. `V2RuntimeShell` e as páginas provisórias recebem somente contratos tipados, sem Supabase,
   sessão, variáveis de ambiente ou chamadas de backend.

O App Shell continua com a direção de dependência correta:

`router/auth/theme → adaptador de runtime → App Shell → Design System`

O App Shell não importa router, autenticação ou Supabase. A integração não passa `session`, token,
e-mail, telefone, ID de usuário ou objetos de backend para a camada visual.

## Entrada e rotas

| URL                    | Navegação                                | Estado nesta etapa   |
| ---------------------- | ---------------------------------------- | -------------------- |
| `/v2`                  | redireciona localmente para `/v2/inicio` | entrada canônica     |
| `/v2/inicio`           | Início                                   | provisória           |
| `/v2/comunidade`       | Comunidade                               | provisória           |
| `/v2/conversas`        | Conversas                                | provisória           |
| `/v2/perfil`           | Perfil                                   | provisória           |
| `/v2/pretendentes`     | Pretendentes                             | provisória           |
| `/v2/explorar-pessoas` | Explorar pessoas                         | provisória           |
| `/v2/loja`             | Loja                                     | provisória           |
| `/v2/avatar`           | Avatar                                   | provisória           |
| `/v2/meu-pet`          | Meu Pet                                  | provisória           |
| `/v2/configuracoes`    | Configurações                            | provisória           |
| `/v2/<desconhecida>`   | sem item ativo                           | not-found localizado |

Todas as rotas usam a árvore real do TanStack Router. A navegação atualiza a URL sem reload,
suporta back/forward e refresh, e não intercepta caminhos legados. Os descritores de rota
centralizam título, contexto, item ativo, ícone e conteúdo provisório; o App Shell não contém
condicionais de pathname.

## Feature flag e ativação gradual

`VITE_FF_V2_APP_SHELL` é a flag pública e não secreta criada na fundação V2. Ela aceita somente o
valor exato `"true"`.

- desativada, ausente ou inválida: qualquer entrada `/v2` volta para `/inicio`, sem montar conteúdo
  V2;
- ativada e sessão autenticada: o shell é montado;
- ativada e sessão em restauração: somente o loading V2 é montado;
- ativada e sem sessão: a proteção canônica envia ao login uma única vez;
- erro recuperável de sessão: conteúdo privado não é montado e o usuário recebe um estado seguro.

Para avaliação local, use uma variável temporária no processo, sem criar arquivo versionado:

```powershell
$env:VITE_FF_V2_APP_SHELL='true'
bun run dev
```

Isso não concede papel, não substitui RLS e não é um mecanismo de autorização administrativa.
Remover a variável ou reiniciar o processo sem ela fecha a entrada novamente.

## Sessão e retorno pós-login

O ciclo de sessão permanece integralmente sob `AuthProvider` e `RouteProtectionBoundary`.
`getSession` e `onAuthStateChange` mantêm a precedência e o single-flight definidos na V2-002.

Ao abrir, por exemplo, `/v2/comunidade` sem sessão:

1. a fronteira cria `/auth/login?returnTo=%2Fv2%2Fcomunidade`;
2. `sanitizeReturnTo` restringe o destino a um caminho same-origin;
3. esquemas, URLs absolutas, `//host`, barras invertidas, rotas Auth e endpoints são rejeitados;
4. após autenticar, a fronteira de visitante retorna ao caminho seguro;
5. refresh e deep link usam a mesma árvore real.

Não existe um segundo redirect dentro do shell. Isso evita competição entre `Navigate`,
`navigate()` e `location.replace`.

## Adaptadores e dados do usuário

O adaptador lê do contexto real somente:

- `status`;
- referência mínima de `user` necessária para metadados visuais;
- ação `signOut`;
- tema e ação `setTheme`;
- funções de navegação do router.

O contrato visual gerado contém somente:

- nome de exibição obtido de `display_name`, `full_name` ou `name`;
- fallback `Pessoa da comunidade`;
- iniciais;
- avatar `http` ou `https`, quando válido;
- texto público genérico de participação;
- presença visual genérica.

Não são disponibilizados ao shell:

- `session`;
- access token ou refresh token;
- e-mail ou telefone;
- ID do usuário;
- papéis ou dados administrativos;
- objetos Supabase;
- secrets ou variáveis de ambiente;
- perfil completo.

Avatar ausente, inválido ou com falha de carregamento volta para as iniciais. Perfil ainda não
carregado não é confundido com sessão ausente.

## Logout, loading e erros

O menu do perfil chama o `signOut` real já existente. A ação:

- fica indisponível no showcase independente, onde não existe callback;
- indica progresso durante logout;
- não registra erros internos;
- mostra mensagem sanitizada e permite nova tentativa quando a operação falha;
- depende do AuthProvider para invalidar imediatamente a sessão e o cache privado.

O root fornece loading e erro recuperável específicos apenas para `/v2`. O error boundary
localizado cobre falhas de renderização do runtime e oferece recuperação sem tela branca ou
detalhes técnicos. Uma rota V2 desconhecida renderiza not-found dentro do próprio shell.

## Ações ainda indisponíveis

Busca, notificações reais, criação de publicação, reflexão, pergunta, evento e Sala de Cinema
continuam sem backend. O runtime não simula sucesso nem persistência. As ações exibem feedback
discreto com `role="status"` informando “Disponível em breve” e que nenhum dado foi enviado.

## Acessibilidade e responsividade

A integração preserva os contratos da V2-003 e V2-004:

- landmarks, skip link e hierarquia de headings;
- `aria-current` derivado da rota real;
- `aria-expanded`, `aria-controls` e labels acessíveis;
- fechamento de overlays com Escape, contenção e restauração de foco;
- anúncio de feedback e falhas de logout por região viva;
- navegação sem mouse e foco visível;
- controles mínimos de 44 px;
- inputs de 16 px no mobile;
- safe areas e bottom navigation sem cobrir o conteúdo;
- sidebar em tablet/desktop e painel contextual somente quando houver espaço;
- temas claro e escuro pelo ThemeProvider existente;
- `prefers-reduced-motion`.

O smoke visual deve cobrir 390 × 844, 768 × 1024, 1024 × 768 e 1440 × 900, incluindo
overflow, clipping, menus, scroll, tema, teclado e rota inexistente.

### Resultado do smoke local

O runtime real foi iniciado com a flag temporária e um adaptador Auth local removido antes do
commit. Nenhuma conta, secret ou Supabase foi usado.

| Viewport   | Navegação         | Painel contextual | Resultado                                       |
| ---------- | ----------------- | ----------------- | ----------------------------------------------- |
| 390 × 844  | bottom navigation | oculto            | sem overflow; conteúdo protegido do rodapé fixo |
| 768 × 1024 | sidebar compacta  | oculto            | sem overflow ou clipping                        |
| 1024 × 768 | sidebar expandida | oculto            | orientação paisagem funcional                   |
| 1440 × 900 | sidebar expandida | visível           | três áreas responsivas sem overflow             |

Também foram confirmados: navegação real, back/forward, refresh em rota filha, item ativo,
deep link, not-found localizado, tema escuro, fallback imediato de avatar, abertura e fechamento
de overlay com Escape, restauração de sessão sem montar o shell privado e logout com retorno para
`/auth/login?returnTo=%2Fv2%2Finicio`. Uma nova aba limpa apresentou zero erros ou warnings no
console. O smoke de autenticação real ficou deliberadamente limitado por não existir Supabase
descartável; os fluxos restantes são cobertos por mocks determinísticos.

## Testes e segurança

Os testes específicos validam:

- flag fechada e máquina de estados de acesso;
- identidade visual mínima e fallbacks;
- rejeição de avatar não HTTP(S);
- logout e erro sanitizado;
- registro completo e único das rotas;
- deep links, not-found localizado e preservação de caminhos legados;
- SSR do shell e dos estados;
- ausência de token, sessão ou `service_role` no markup;
- fronteira única para imports concretos de Auth e Router;
- páginas provisórias sem fetch, Supabase ou ambiente;
- estilos escopados pela fronteira V2;
- dependências e lockfile inalterados.

Os testes de integração usam mocks e renderização local. Nenhuma conta real ou Supabase publicado
é necessário.

## Limitações e riscos

- as páginas são deliberadamente provisórias e não possuem dados reais;
- a identidade visual usa somente metadados já presentes no objeto Auth, sem consultar perfil;
- a flag é de build/runtime frontend e não concede autorização de segurança;
- a produção não deve ativar a flag sem validação operacional e smoke em ambiente isolado;
- providers privados globais continuam sob a mesma fronteira autenticada do legado; sua migração
  por domínio pertence a etapas futuras;
- o comportamento real de login/logout é coberto deterministicamente por mocks quando não existe
  um Supabase descartável.

## Estratégia de adoção

1. validar `/v2` em desenvolvimento com a flag temporária;
2. validar em ambiente isolado com autenticação e dados não produtivos;
3. integrar cada domínio por PR e feature flag próprios;
4. medir paridade funcional e regressões;
5. habilitar coortes controladas somente após segurança e observabilidade;
6. manter fallback legado até paridade comprovada;
7. ocultar uma superfície antiga somente após aceite, reconciliação e rollback testado.

## Rollback

O rollback é desativar `VITE_FF_V2_APP_SHELL` ou reverter o commit da V2-005. Como não há
migration, escrita de dados ou alteração operacional, o legado volta a ser a única experiência e
nenhum dado precisa ser revertido. A branch e o histórico da V2 permanecem auditáveis.

## Próximo passo recomendado

Após validação e autorização separada, iniciar a integração de dados mínimos do perfil por um
adaptador dedicado e observável. Feed, Status, grupos, conversas e Namoro continuam fora do escopo
desta etapa.
