# V2-008 — segurança da aplicação e supply chain

## Objetivo

Conter os P1 locais de HTML, URLs, iframes, headers e configuração de ambiente
sem alterar banco, infraestrutura publicada ou dependências. Este lote não
afirma que os headers do domínio ou o histórico Git foram saneados: ambos exigem
verificação operacional separada.

## Configuração de ambiente

O `.env` rastreado foi removido. `.gitignore` continua ignorando arquivos de
ambiente e abre exceção apenas para `.env.example`, que contém nomes públicos com
valores vazios.

O exemplo não admite `service_role`, segredo do push dispatch, VAPID privado ou
credencial de provedor. Configurações server-only continuam exclusivamente no
runtime.

Os valores removidos eram configuração pública já destinada ao navegador. Isso
não substitui a auditoria do histórico nem autoriza presumir que nunca houve
outro valor. Revisão histórica e eventual rotação pertencem ao operador e não
devem copiar credenciais para artefatos.

## HTML do blog

`sanitizeBlogHtml` aplica uma allowlist pequena e determinística:

- `h2`, `h3`, `h4`, `p`, `strong`, `em`;
- listas, blockquote, `pre`, `code` e `br`;
- links internos ou HTTPS com `noopener noreferrer`;
- nenhum `style`, handler `on*`, imagem, iframe, script ou atributo arbitrário.

Blocos `script` e `style` são removidos com seu conteúdo. Tags desconhecidas são
removidas e texto é escapado. A implementação não acessa `window`, `document` ou
`DOMParser`, portanto a importação e a renderização inicial são SSR-safe.

O conteúdo versionado atual usa somente `h2`, `p`, `strong` e `em`; esses elementos
mantêm a apresentação. A origem e qualquer sanitização anterior do conteúdo
publicado ainda são gates de produção.

## URLs e mídia administrativa

`normalizeTrustedUrl`:

- rejeita caracteres de controle, barra invertida, URLs maiores que 2.048
  caracteres, `javascript:`, `data:`, protocolos não HTTPS e entradas malformadas;
- aceita caminhos internos somente quando explicitamente permitido;
- rejeita URLs scheme-relative;
- exige correspondência exata de origem para mídia remota.

O preview de verificação aceita apenas a origem atual e a origem pública do
projeto Supabase. O iframe de PDF usa `sandbox=""`, título acessível e
`Referrer-Policy: no-referrer`. Se a origem não estiver autorizada, a mídia não é
carregada.

URLs do time da live passam a aceitar somente perfis HTTPS em
`tiktok.com`, `www.tiktok.com` ou `m.tiktok.com`, inclusive ao ler registros
antigos. Entradas administrativas fora da allowlist tornam-se `null`; não há
redirecionamento para outro domínio.

## Headers defensivos

`securityHeadersMiddleware` está registrado uma vez no `startInstance` e
acrescenta:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Cross-Origin-Opener-Policy: same-origin`;
- `Permissions-Policy` restritiva, preservando geolocalização same-origin;
- HSTS e CSP quando `NODE_ENV=production`.

O middleware CSRF recomendado pelo TanStack Start foi registrado antes dos
headers e filtra somente server functions. Rotas HTTP dedicadas, inclusive o
dispatch autenticado por bearer, preservam seu contrato próprio.

A CSP fecha `object-src`, `frame-ancestors`, base e form action; limita frames a
same-origin/Supabase e explicita fontes, imagens, mídia, workers e conexões.

O legado ainda contém script e CSS inline, portanto `script-src` e `style-src`
mantêm `'unsafe-inline'`. Isso é uma mitigação intermediária, não a política
final. Nonces/hashes e retirada dos blocos inline devem preceder a remoção dessas
exceções. O header efetivo em `vaidarnamoro.com` precisa ser capturado depois de
um deploy autorizado; este lote não publicou nada.

## Testes

`application-security-v2.test.ts` cobre:

- URLs internas, origens exatas e protocolos proibidos;
- allowlist TikTok;
- fixtures de script, style, handlers, iframe, imagem e `javascript:`;
- compatibilidade do vocabulário atual do blog;
- import SSR-safe;
- conteúdo e registro dos headers;
- sandbox e referrer policy;
- ausência de valores no `.env.example`.

Os testes não fazem rede, não importam Supabase e não congelam defeitos como
contrato.

## Rollout

1. revisar a CSP em ambiente isolado com relatório de violações;
2. inventariar origens reais de mídia sem expor URLs assinadas;
3. confirmar previews administrativos de imagem/PDF;
4. capturar headers efetivos antes e depois da publicação autorizada;
5. observar erros de CSP, fontes, Storage, Realtime, PWA e service worker;
6. remover `'unsafe-inline'` somente após nonce/hash e paridade;
7. auditar histórico de configuração sem publicar valores.

## Rollback

- HTML: renderizar texto escapado é o fallback seguro; voltar ao sink direto não é
  rollback aceitável.
- iframe: desabilitar o preview e preservar os dados; não ampliar a allowlist sem
  inventário.
- headers: retirar uma diretiva incompatível por vez; preservar `nosniff`,
  referrer policy e proibição de frame/object sempre que possível.
- ambiente: restaurar apenas `.env.example` vazio; secrets nunca voltam ao Git.

## Limitações

- CSP publicada não foi verificada;
- `'unsafe-inline'` ainda existe por compatibilidade legada;
- origens persistidas de fotos dependem do snapshot sem PII;
- histórico Git e rotação dependem do operador;
- o endpoint administrativo de reparo ainda requer lote de rate limit, dry-run e
  auditoria próprios;
- nenhuma dependência ou lockfile foi alterado.
