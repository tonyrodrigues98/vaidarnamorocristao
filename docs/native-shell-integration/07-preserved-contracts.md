# Contratos preservados para a integração Native Shell V1

## Produto e interface

- A V1 continua sendo a aplicação principal.
- `/inicio` continua em `/inicio`.
- Nenhuma rota V1 pode redirecionar automaticamente para `/v2/*`.
- Nenhuma flag V2 é ativada por padrão.
- Rotas, textos, cores, tipografia, espaçamentos, layouts, navegação e páginas
  atuais permanecem inalterados nesta captura.
- Nenhum componente visual antigo da V2 foi restaurado no runtime V1.
- O runtime `/v2/*` existente permanece apenas como compatibilidade isolada e
  flagada; não é referência visual para o Native Shell.

## Autenticação e sessão

- `AuthProvider` é a única fonte canônica de sessão.
- A restauração inicial distingue inicialização, autenticação, ausência de
  sessão e erro recuperável.
- Evento novo de auth deve prevalecer sobre resultado assíncrono antigo.
- Refresh do mesmo usuário não desmonta desnecessariamente a experiência.
- Logout/expiração invalidam a sessão imediatamente.
- Troca de usuário não reutiliza cache privado da conta anterior.
- Providers privados só montam após sessão autenticada.
- Google Auth e a configuração atual do Supabase Auth não serão substituídos
  sem evidência e escopo explícito.

## Rotas e redirects

- Durante inicialização não há redirect nem montagem de conteúdo privado.
- Destino pós-login aceita somente caminho interno seguro.
- URLs absolutas, `//host`, esquemas inseguros, valores malformados e rotas de
  autenticação como retorno são rejeitados.
- Fallback canônico é `/inicio`.
- Onboarding, banimento e autorização administrativa não são equivalentes à
  autenticação.
- Rotas públicas permanecem públicas e endpoints não são tratados como páginas.

## Dados, cache e Realtime

- Cache privado deve ser cancelado/removido no logout e na troca de conta.
- Cache comprovadamente público pode ser preservado.
- Objetos completos de sessão, tokens, e-mail, telefone e dados pessoais não
  devem ser passados a shells visuais nem registrados em logs.
- Canais privados só existem após autenticação e precisam de cleanup.
- Respostas atrasadas não podem repopular estado de outro usuário.
- Conteúdo privado não pode entrar em cache público do service worker.

## Supabase e autorização

- Estado frontend e feature flags não substituem RLS.
- Sessão autenticada não concede papel Admin.
- `service_role` nunca pode entrar no navegador.
- Cliente não é autoridade para moedas, XP, inventário, recompensas ou papéis.
- Mudanças em schema, migrations, policies, buckets, Vault, secrets, cron,
  Jobs e dados exigem tarefa e autorização próprias.
- Esta baseline não valida nem altera o estado remoto.

## Mídia

- Mídia pública aprovada pode usar URL pública estável.
- Documentos, evidências, anexos privados e conteúdo moderado continuam
  privados e usam autorização/assinatura apropriada.
- Signed URL não é fonte de verdade persistente.
- Cache de assinatura privada deve ser particionado por usuário, deduplicado,
  renovado antes da expiração e limpo na troca/logout.
- Bucket não deve ser tornado público por inferência ou conveniência.

## PWA e offline

- O service worker atual permanece sem alteração.
- Cache privado deve ser isolado por usuário.
- Logout deve remover tokens, filas privadas e mídia sensível.
- Operações offline não devem simular confirmação definitiva do servidor.
- Atualizações não devem interromper uma tarefa crítica ativa.

## Referência visual obrigatória

A busca no repositório não localizou um artefato imutável para
`vdn-community-prototype-01`: não há arquivo, hash, export, screenshot versionado
ou URL congelada que permita provar fidelidade.

As menções históricas a protótipos do ChatGPT Work/Vitra não substituem um
artefato verificável.

> **REFERÊNCIA VISUAL NÃO CONGELADA**

Consequência: uma futura tarefa visual não deve inventar, reconstruir de memória
ou usar a antiga V2 como substituta. Antes de implementação visual, a referência
precisa ser anexada/versionada com identificador e viewport verificáveis.

## Escopo desta baseline

Foram criados apenas oito documentos em `docs/native-shell-integration`.
Nenhum código de produção, teste, configuração, lockfile, migration ou asset foi
modificado. O próximo lote não está autorizado por esta captura.
