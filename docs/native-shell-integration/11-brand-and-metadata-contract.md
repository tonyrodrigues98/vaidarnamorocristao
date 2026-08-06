# Contrato de marca e metadados

## Fonte única

`src/config/brand.ts` é a fonte tipada para nome, origem, idioma, locale, cores
já existentes e caminhos dos assets oficiais. `src/lib/metadata.ts` compõe
título, canonical, robots, Open Graph e Twitter sem dependência nova.

Os assets continuam sendo:

- `/favicon.ico`;
- `/apple-touch-icon.png`;
- `/icon-192.png`;
- `/icon-512.png`;
- `/og-image.jpg`;
- `/splash-logo.png`;
- `/manifest.webmanifest`.

Nenhum asset foi criado, substituído ou alterado.

## Posicionamento

A configuração registra o posicionamento futuro de comunidade cristã e mantém
as mensagens de namoro e Live como contextos distintos. Isso prepara a futura
landing comunitária sem anunciar uma interface que ainda não existe.

## Exceção temporária da raiz

Enquanto `/` contém a página pública da Live da Caren, seus metadados continuam
descrevendo a Live, o canonical continua em `https://vaidarnamoro.com/` e o link
de identidade do TikTok permanece presente. A Live não foi movida e `/live` não
foi criada.

## Páginas migradas

- `/`: helper público, conteúdo e textos atuais da Live preservados;
- `/inicio`: helper privado com `noindex, nofollow`;
- `/loja`: helper privado com `noindex, nofollow`;
- `/instalar`: helper público com `noindex, follow`;
- raiz técnica: identidade, idioma, cores, assets e metadados-base centralizados.

As demais rotas permanecem pendentes. Não deve haver migração massiva: cada nova
rota deve usar o helper apropriado, manter sua intenção semântica e ter uma única
entrada por chave de metadado.

## Compartilhamento

O compartilhamento global do Header usa o nome, a origem e o posicionamento
comunitário centralizados. Web Share, cópia para clipboard, mensagens de retorno
e layout não mudaram.

## Regras

- URLs canônicas e sociais aceitam somente a origem configurada;
- páginas privadas não geram canonical nem metadados sociais;
- páginas públicas recebem Open Graph e Twitter completos;
- assets sociais são resolvidos para URL absoluta;
- metadados duplicados gerados pelo helper causam erro;
- PWA, providers, scripts, splash screens e build metadata são preservados.

## Próxima integração

A futura tarefa de Landing + Live decidirá quando a raiz deixará de representar
a Live e como essa experiência será movida. Esta tarefa não antecipa essa
alteração.

**REFERÊNCIA VISUAL NÃO CONGELADA**

Esta tarefa independe da referência visual porque não altera layout, CSS,
componentes visuais, navegação ou conteúdo renderizado.
