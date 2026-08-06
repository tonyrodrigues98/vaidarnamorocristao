# VDN Structural Zero

Esta branch remove toda a camada de apresentação do aplicativo para permitir uma reconstrução visual a partir de uma fundação neutra.

Removido:

- páginas visuais e rotas de produto;
- componentes e bibliotecas de interface;
- shells, temas, tokens e folhas de estilo;
- assets, ícones e imagens decorativas;
- protótipos e documentação de redesign;
- testes específicos das apresentações removidas.

Preservado:

- integração Supabase;
- rotas de API e middleware de autenticação do servidor;
- tipos e contratos de domínio;
- funções de dados, RPCs, Storage, realtime, economia, Pets e suporte que não dependem da apresentação;
- PWA estrutural, monitoramento e runbooks operacionais.

O estado anterior permanece recuperável no commit `17f8b66ec2aec2d9dace7dfb7b9b75812e6f6fd2` e na branch `redesign/prototype-01-transplant`.
