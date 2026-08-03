# T49 — E2E autenticado no preview HTTPS

Status: **BLOCKED**

O bloqueio remanescente é de limpeza: o chamado de suporte foi fechado e a conta
temporária foi excluída, mas o chamado e seu attachment privado continuam visíveis para
staff porque o produto não oferece uma operação segura de exclusão. Nenhuma exclusão
direta em Storage, SQL ou uso de service role foi improvisada.

Este resultado não autoriza produção. O preview testado foi
`https://potentially-tournament-pad-luis.trycloudflare.com`, com Native Shell ativa.

## Identificação e segurança

- Branch: `integration/native-shell-v1`
- Base da continuação T49.1: `fdb203d949634aa590408cd277fab0707ac45f4e`
- Contas anonimizadas: `acct-A` e `acct-B`
- `acct-A`: conta autorizada com papel `super_admin`
- `acct-B`: conta temporária criada para esta execução e posteriormente excluída
- Credenciais, emails completos, tokens, URLs assinadas e IDs pessoais: não registrados
- Service role, migrations, schema, RLS, policies e buckets: não alterados
- Wrangler e Quick Tunnel: mantidos em execução

## Autenticação, sessão e troca de conta

- Criação, onboarding mínimo e aprovação da `acct-B`: passaram.
- Login e sessão persistida após reload: passaram.
- Cinco raízes autenticadas: passaram.
- Logout em uma aba removeu o acesso privado da segunda aba: passou.
- Troca `acct-B → acct-A` no mesmo perfil temporário não exibiu dados residuais de B.
- Retorno para B por novo login não foi repetido porque as credenciais não estavam mais
  disponíveis; a conta já havia sido identificada pelo ID mascarado, restaurada para
  `user` e excluída pelo fluxo administrativo.
- Expiração forçada de refresh token: `NOT_TESTED`.

## Cinco áreas principais

Com `acct-B` no papel `user`, as rotas `/inicio`, `/comunidade`, `/explorar`,
`/conversas` e `/perfil` carregaram dados reais no Native App Shell. A ordem observada
foi exatamente `Início · Comunidade · Explorar · Conversas · Perfil`, sem Header legado
e sem sexta aba.

## Matriz administrativa

A mesma conta temporária foi alterada exclusivamente pelo painel real da `acct-A`, com
novo carregamento dos claims entre os papéis:

- `user`: todas as 13 rotas administrativas negadas antes de montar AdminShell ou dados.
- `moderador`: `/admin` permitido; as 12 ferramentas especializadas negadas.
- `apresentador`: `/admin` permitido com as tabs internas previstas; ferramentas
  especializadas, presentes, stickers e avatar negados.
- `admin`: permitidos painel, verificações, fotos, presentes, fundos, molduras, auras,
  gradientes de nome, pets, economia e equipe da Live; stickers e avatar negados.
- `super_admin`: as 13 rotas já haviam sido comprovadas em leitura na T49.

O menu e o acesso direto respeitaram a mesma matriz. Não foi observada leitura de dados
administrativos antes da autorização. Nenhuma mutation administrativa de domínio foi
executada.

## Realtime e conversas

No chat comunitário, usando dois contextos isolados:

- `acct-B → acct-A`: recebimento sem reload passou.
- `acct-A → acct-B`: recebimento sem reload passou.
- ordem e timestamps: passaram.
- offline simulado por CDP exibiu o estado offline e não entregou a tentativa de envio.
- reconexão: a mensagem de teste chegou exatamente uma vez ao contexto A.
- duplicação após reconnect: não observada.
- navegação inferior ausente no focused chat e composer descoberto: passaram.
- mensagens e replies de teste: removidos ao final.
- unread: não comprovado de forma conclusiva.
- chat privado: `PRIVATE_CHAT_NOT_EXECUTED`, pois não havia criação e remoção segura de
  match sem risco de deixar estado residual.

## Upload privado, suporte e verificação

Foi criada uma imagem neutra 256×256, sem rosto ou dados pessoais, fora do repositório.

- chamado `[T49 TESTE — remover]`: criado e aberto no detalhe.
- attachment PNG: upload passou.
- URL assinada privada: HTTPS, `image/png`, temporária e não registrada neste documento.
- cache público: nenhum header público de cache foi observado.
- chamado: fechado por staff.
- exclusão de chamado/attachment: indisponível na UI; ambos permanecem como resíduo
  fechado após a exclusão da conta.
- foto extra de perfil: `NOT_EXECUTED`.
- verificação: UI, tipos de arquivo, limite e contrato privado conferidos; nenhum
  documento ou selfie foi enviado.

## Limpeza da conta temporária

- mensagens de realtime e reconnect: removidas.
- papel de `acct-B`: restaurado para `user`.
- identificação antes do hard delete: nome de teste, ID mascarado, status aprovado e
  papel `user` conferidos novamente.
- conta temporária: excluída pelo fluxo administrativo existente.
- card da conta: ausente após a exclusão.
- perfis temporários do Chrome: removidos ao final.
- resíduo: chamado fechado e attachment privado, sem operação segura de exclusão.

## Achados e correções

### Focused chat

- `397d49124fa8e02e96268773bb6dd2f8f7883f35` —
  `fix(e2e): suppress legacy nav in community chat`
- `86d69d663e31fdc2d2ee11257d742d80a7b06d57` —
  `fix(e2e): align focused chat regression contract`

### Assets decorativos

- `cf8b878e4207b8ea3f4d082f817255c63e310f8c` —
  `fix(assets): bundle remaining public decorations`
- origens autorizadas e verificáveis: assets correspondentes no ambiente público atual
- PNG 500×500, 230471 bytes, SHA-256
  `2dddd302963a2731ea49acd78f3f7dd1dcd505780993f584470311c1f2d10735`
- PNG 1024×1024, 740925 bytes, SHA-256
  `73f34612165348921fd9f79ae0268ba96295caa60c72660fbf98127eda00b3b4`
- ambos os assets autocontidos responderam HTTP 200 no preview atualizado.

### Chave pública de push

- `d787816` — `fix(push): serve public key in secretless preview`
- quando `WEB_PUSH_PRIVATE_KEY` não está configurada, o endpoint devolve apenas a chave
  VAPID pública já versionada.
- erros não relacionados continuam sendo propagados.
- nenhuma chave privada foi criada, copiada ou exposta.
- push dispatch permanece desativado no preview sem a configuração privada.

## Gates finais

- Build flag off: passou.
- Build flag on: passou.
- Testes flag off: 68 arquivos, 485 testes passaram.
- Testes flag on: 68 arquivos, 485 testes passaram.
- Lint global: zero erros; 31 warnings preexistentes inventariados.
- Format check global: passou.
- Release qualify: 69 rotas, PWA e residue guards passaram.
- Migrações novas: zero.
- Dependências novas: zero.
- Feature flag padrão no repositório: `false`.
- Main e produção: inalteradas.

## Classificação

- P0: 0
- P1: 0
- P2: 1 — resíduo do chamado/attachment de suporte sem exclusão segura pela UI
- P3: 0
- Security findings: nenhum vazamento entre contas, bypass administrativo, service role
  no cliente ou acesso público ao attachment foi observado.

O próximo gate é a remoção operacional segura do chamado e attachment de teste por um
fluxo autorizado que preserve RLS, Storage e trilha de auditoria. Até isso ocorrer, o
status permanece **BLOCKED**, apesar da matriz funcional autenticada ter passado.
