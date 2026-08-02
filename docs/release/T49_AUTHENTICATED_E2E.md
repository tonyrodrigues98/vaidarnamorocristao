# T49 — E2E autenticado no preview HTTPS

Status: **BLOCKED**

Este resultado não significa liberação para produção. O preview testado foi
`https://potentially-tournament-pad-luis.trycloudflare.com`, com Native Shell ativa.

## Identificação

- Branch: `integration/native-shell-v1`
- SHA inicial: `376ff76f327ee7e5046ae008e832450a783a704c`
- Correções T49:
  - `397d49124fa8e02e96268773bb6dd2f8f7883f35`
  - `86d69d663e31fdc2d2ee11257d742d80a7b06d57`
- Conta anonimizada: `acct-A`
- Papel confirmado: `super_admin`
- Credenciais, tokens, URLs assinadas e identificadores pessoais: não registrados

## Autenticação e sessão

- Login por email/senha: passou.
- Retorno seguro para `/inicio`: passou.
- Sessão após reload: passou.
- Sessão em segunda aba do mesmo perfil: passou.
- Back/forward: passou.
- Logout: passou.
- Segunda aba após logout: voltou ao AuthShell e não reteve dados privados.
- Visitante em `/admin/presentes`: redirecionado ao login sem montar AdminShell.
- Troca real entre duas contas: `NOT_TESTED`.
- Refresh token forçado/expirado: `NOT_TESTED`.

## Native App Shell e dados reais

As cinco raízes carregaram queries reais, sem Header legado, sem sexta aba e na ordem
`Início · Comunidade · Explorar · Conversas · Perfil`.

Também foram abertas com dados reais, sem mutation intencional: Notícias, Devocional,
Orações, Quiz Bíblico, Notificações, Bloqueados, Loja, Presentes, Caixas, Avatar, Meu Pet,
Pet Arcade, Suporte e Verificação.

Sinais reais observados incluíram notificações, conversas, saldo de moedas, perfil,
catálogo da loja, avatar hidratado, pet, cuidado e catálogo do Arcade. Nenhum saldo,
inventário, avatar, pet ou conteúdo foi alterado.

## Chats e realtime

- Chat privado existente: abriu no Focused Messaging Shell, somente leitura.
- Chat comunitário: abriu no Focused Messaging Shell, somente leitura.
- Correção P1: a navegação móvel legada que cobria o composer comunitário foi suprimida.
- Teste de envio/reply/edit/delete/unread/reconnect com duas contas: `NOT_TESTED`.
- Motivo: não havia segunda conta consentida e as conversas existentes envolvem pessoas
  que não foram autorizadas a receber mensagens de teste.
- Nenhuma mensagem `[T49 TESTE — remover]` foi criada.

## Perfil, uploads, suporte e verificação

- Leitura do perfil: passou.
- Verificação já aprovada: estado real carregado.
- Edição reversível, foto, documento, attachment e chamado de teste: `NOT_EXECUTED`.
- Motivo: a única conta disponível continha dados existentes e não havia isolamento
  suficiente para criar arquivos ou conteúdo sem risco de impacto real.
- Signed URLs privadas não foram copiadas nem registradas.

## Administração

Como `super_admin`, as 13 rotas administrativas carregaram com AdminShell, sem Header,
AdminTopNav ou bottom navigation legados. Foram validados por leitura: painel,
verificações, fotos, presentes, stickers, fundos, molduras, auras, gradientes de nome,
avatar, pets, economia e equipe da Live.

- URL administrativa como visitante: negada antes da montagem do conteúdo.
- `user`, `moderador`, `apresentador` e `admin`: `NOT_TESTED` por falta de contas.
- Nenhuma role foi criada ou promovida.
- Nenhuma mutation administrativa foi executada.

## Segurança, rede e console

- Runtime config expõe somente `supabaseUrl` e `publishableKey`.
- Service role, push private key e dispatch secret não foram encontrados no bundle público.
- Nenhum vazamento entre contas foi observado, mas a troca real de conta ficou pendente.
- Nenhum erro RLS inesperado foi observado nas leituras executadas.
- P2: duas decorações de avatar ainda referenciam `__l5e/assets-v1` e retornam 404.
- P2: a página de Notificações registra erro de chave pública de push ausente no preview.
  O push dispatch permanece desativado e nenhum secret foi adicionado.
- Offline, rede lenta, abort e reconexão realtime: `NOT_TESTED` porque o controle disponível
  do Chrome não expôs emulação de rede sem interromper o tunnel ativo.

## Correção realizada

`397d49124fa8e02e96268773bb6dd2f8f7883f35` —
`fix(e2e): suppress legacy nav in community chat`.

`86d69d663e31fdc2d2ee11257d742d80a7b06d57` —
`fix(e2e): align focused chat regression contract`.

A correção define `mobileBottomNav: false` para `/conversas/comunidade`, possui teste de
registry e passou build isolado com `VITE_FF_NATIVE_SHELL=true`. O artefato foi copiado
para o diretório servido sem encerrar Wrangler ou Quick Tunnel e o cenário foi repetido
com sucesso.

## Dados de teste e limpeza

- Dados criados: nenhum.
- Mensagens, attachments, chamados, fotos e documentos de teste: nenhum.
- Preferência, perfil, avatar, pet, saldo e inventário: não alterados.
- Sessão: encerrada nas duas abas.
- Abas de automação: finalizadas.

## Classificação

- P0: 0
- P1: 0 após a correção e repetição do chat comunitário
- P2: 2 (assets decorativos `__l5e`; chave pública de push ausente no preview)
- P3: 0

O status permanece **BLOCKED** porque realtime entre duas contas, matriz completa de
papéis, troca real de conta, uploads/signed URLs e recuperação de rede não foram
executados. O próximo gate é fornecer contas de teste consentidas e isoladas para cada
papel e um segundo participante de chat.
