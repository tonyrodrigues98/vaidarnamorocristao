# V2-023 — Retirada lógica e quarentena do legado

## Objetivo

Retirar da experiência ativa somente o legado que já possui substituto,
paridade, telemetria e rollback. Não excluir fisicamente dados ou assets.

## Pré-condições

- experiência V2 estável;
- flags;
- deep links mapeados;
- usuários legados migrados/compatíveis;
- telemetria de uso;
- testes de paridade;
- suporte/admin preparados;
- estado dos dados conhecido;
- rollback por rota.

## Pretendentes antigo

Antes de retirar:

- nova descoberta do Modo Namoro completa;
- interesses/matches preservados;
- perfis românticos;
- filtros/elegibilidade;
- conversas;
- links/notificações;
- coortes e divergência;
- zero impacto para Namoro off.

Retirada lógica:

- remover da navegação universal;
- redirects/contexto;
- feature flag;
- rota antiga read-only/compatibilidade quando necessário;
- telemetria;
- não apagar tabelas/matches.

## Avatar-personagem

Escopo a retirar:

- criação/edição do personagem;
- catálogo exclusivo;
- novas aquisições;
- rota e navegação;
- renderização específica quando substituída.

Escopo a preservar:

- foto principal;
- `avatar_url` quando foto;
- galeria;
- verificação/moderação;
- `DecoratedAvatar`;
- molduras;
- auras;
- fundos/capas;
- gradientes;
- presentes;
- stickers;
- inventários não exclusivos;
- histórico e ownership.

Fases:

1. inventário de tabelas/assets/owners;
2. bloquear expansão;
3. telemetria;
4. política de compensação, ainda aguardando Antonio;
5. retirar consumo por flag;
6. quarentena;
7. considerar contração apenas no V2-024.

## Monólitos e duplicações

Reavaliar:

- routes grandes;
- guards;
- providers;
- chats paralelos;
- navegações;
- temas/tokens;
- Admin;
- pets V1/V2;
- arquivos candidatos órfãos;
- dependências.

Para remover código:

- zero import/runtime;
- zero rota/deep link;
- zero build/config;
- zero teste necessário;
- zero job/RPC/policy;
- prova por telemetria quando possível;
- diff pequeno;
- rollback.

## Assets

Não remover por basename. Considerar:

- catálogos;
- URLs;
- metadata `.asset.json`;
- CSS;
- imports dinâmicos;
- Storage;
- runtime;
- referências administrativas.

Quarentena antes de exclusão.

## Testes

- links antigos;
- flags on/off;
- usuários legados;
- Namoro off/on;
- foto versus personagem;
- ownership;
- Admin;
- cache/PWA;
- build/imports;
- rollback.

## Critérios de conclusão

- Pretendentes antigo fora da navegação com substituto;
- avatar-personagem sem expansão e fora da experiência conforme gate;
- dados intactos;
- candidatos órfãos com evidência;
- flags reativáveis;
- nenhum delete físico;
- lista objetiva para compensação e contração.

