# V2-017 — Pets, Pet Arcade, caixas e jogos

## Objetivo

Preservar e redesenhar pets e jogos como subprodutos modulares, sem misturar
regras de recompensa, inventário e UI nas rotas e sem remover nada antes da
decisão de Antonio.

## Pets

Mapear e encapsular:

- catálogos;
- espécies/categorias;
- variantes;
- instância do usuário;
- nome/estado;
- necessidades 0–100;
- decaimento por tempo;
- cuidado;
- cooldowns;
- progressão;
- itens/equipamentos;
- benefícios;
- missões;
- histórico;
- destaque no Perfil;
- Admin.

Famílias `user_pets` e `user_pets_v2` permanecem separadas até:

- mapa de ownership;
- equivalência semântica;
- reconciliação;
- decisão de modelo;
- backfill e rollback.

## Tempo e decaimento

- servidor como referência;
- clock controlado em testes;
- atualização idempotente;
- evitar múltiplos timers no cliente;
- comportamento após longo offline;
- limites;
- nenhuma punição duplicada por reconexão.

## Benefícios e rewards

- pet solicita reward à Economia;
- regra versionada;
- idempotência;
- limite/cap;
- causa registrada;
- nenhum valor controlado pelo cliente.

## Arcade

Criar hub lazy-load. Cada jogo declara:

- ID e versão;
- estado: manter/redesenhar, manter temporariamente ou aguardar decisão;
- engine/runtime;
- orientação;
- assets;
- regra;
- save/progresso;
- recompensa;
- acessibilidade;
- budget;
- telemetria;
- política offline;
- Admin.

Até Antonio fornecer a lista:

- nenhum jogo sai;
- nenhum progresso é apagado;
- nenhum asset é considerado órfão só por scan;
- nenhum reward é alterado silenciosamente.

## Caixas, sorteios e coleções

- regras/odds versionadas;
- resultado server-side;
- recibo/histórico;
- replay e concorrência;
- integração econômica;
- coleções/álbuns preservados;
- decisão comercial/legal isolada.

## Admin de pets/jogos

Desmontar monólito gradualmente:

- catálogo;
- espécies/variantes;
- itens;
- missões;
- rewards;
- jogos;
- assets;
- histórico/auditoria.

Preservar capacidades.

## Design

- coerente com a plataforma;
- divertido sem infantilizar todo o produto;
- carregamento sob demanda;
- touch controls;
- reduced motion/alternativas quando possível;
- orientação explícita;
- estados de erro/reconexão;
- não bloquear shell.

## Testes

- decaimento;
- cuidado concorrente;
- offline longo;
- reward/replay;
- ownership/item;
- V1/V2;
- save/load;
- missão;
- caixa/sorteio;
- bundle/lazy;
- mobile/orientação;
- Admin/capabilities.

## Critérios de conclusão

- pets isolados por contratos;
- V1/V2 preservados;
- rewards server-authoritative;
- Arcade lazy;
- inventário por jogo;
- nenhum jogo/asset removido;
- UX redesenhada por flags;
- telemetria e rollback.

