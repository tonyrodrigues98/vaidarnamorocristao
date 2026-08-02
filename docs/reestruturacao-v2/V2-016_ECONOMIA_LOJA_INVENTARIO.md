# V2-016 — Economia, Loja, inventário e personalização

## Objetivo

Criar uma autoridade econômica única e adapters de inventário antes de
redesenhar Loja, caixas, presentes e equipamentos. Preservar cada saldo, compra
e item legítimo.

## Economia

Contratos:

- consultar saldo/projeção;
- creditar evento permitido;
- debitar;
- comprar;
- conceder reward;
- conceder administrativamente;
- reconciliar;
- consultar ledger.

Invariantes:

- usuário/alvo derivados de contexto autorizado;
- valores calculados no servidor;
- ledger em toda mudança;
- idempotency key;
- atomicidade;
- cap/cooldown;
- reason/source versionados;
- nenhum saldo negativo não permitido;
- logs/auditoria.

XP e níveis seguem os mesmos princípios. Cliente envia ação, não quantidade
arbitrária.

## Loja

- catálogo por tipo;
- categorias/filtros;
- raridade;
- disponibilidade;
- preço/moeda;
- preview real;
- compatibilidade;
- compra;
- recibo;
- estado possuído/equipado;
- loading/vazio/erro/offline;
- mobile/desktop.

Não misturar query, compra, equipamento e UI na rota.

## Inventário

Separar:

- catálogo;
- propriedade;
- quantidade;
- item equipado;
- histórico/origem;
- compatibilidade;
- estado ativo;
- asset.

Tipos:

- molduras;
- auras;
- fundos/capas;
- gradientes;
- stickers;
- badges;
- presentes;
- itens de pet;
- coleções;
- itens legados do avatar-personagem.

## Equipamento

- validar ownership;
- regras por slot;
- equipar/desequipar idempotente;
- preview não altera estado;
- conflito/concorrência;
- item inativo continua preservado;
- perfil renderiza somente seleção autorizada.

## Caixas e rewards

- odds/regras versionadas;
- resultado server-side;
- recibo;
- proteção contra replay;
- transparência conforme produto;
- atomicidade entre custo e prêmio;
- histórico;
- reconciliação.

Não redesenhar mecânicas que pareçam apostas sem decisão comercial/legal. Isolar
o gate sem bloquear o restante da Economia.

## Migração/reconciliação

- saldo por usuário versus ledger;
- compras versus ownership;
- equipados versus inventário;
- presentes versus transações;
- caixas versus resultados;
- itens V1/V2 e tabelas específicas;
- nenhuma consolidação prematura;
- manifests sem PII.

## Design

- desejável e premium;
- preço/propriedade claros;
- preview integrado ao Perfil;
- sem padrões manipulativos;
- confirmação sensível;
- acessível;
- animação não oculta resultado/custo.

## Testes

- replay;
- concorrência;
- saldo insuficiente;
- preço alterado;
- item inativo;
- compra duplicada;
- entrega falha;
- equipar não possuído;
- reward adulterada;
- admin sem capability;
- ledger/reconciliação;
- RLS;
- mobile/offline.

## Critérios de conclusão

- autoridade econômica única;
- Loja/Inventário em adapters;
- compra/entrega idempotentes;
- saldo reconciliável;
- equipamentos preservados;
- nenhum item apagado;
- UI nova atrás de flag;
- testes de segurança e concorrência.
