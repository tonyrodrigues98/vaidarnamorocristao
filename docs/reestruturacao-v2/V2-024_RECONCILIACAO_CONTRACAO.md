# V2-024 — Reconciliação e preparação de contração

## Objetivo

Produzir a prova necessária para qualquer remoção física futura. Este lote pode
preparar SQL destrutivo separado e runbooks, mas não executá-los.

## Pré-condições

- snapshot de produção;
- backup;
- restore ensaiado;
- janela de observação;
- legado logicamente desligado;
- zero uso;
- paridade;
- owners identificados;
- decisão de compensação;
- aprovação explícita ainda pendente para destruição.

## Manifests

Gerar sem PII:

- tabelas/colunas;
- views;
- RPCs;
- policies/grants;
- triggers;
- enums;
- Realtime;
- buckets/paths;
- assets;
- readers/writers;
- owners por contagem;
- dependências;
- telemetria;
- status de backfill;
- checksums semânticos.

## Reconciliação por domínio

### Identidade/perfil

- IDs;
- 1:1;
- privacidade;
- fotos;
- URLs;
- verificações.

### Namoro/conversas/Propósito

- pares;
- estados;
- mensagens;
- ordem;
- read receipts;
- participantes;
- históricos.

### Economia/inventário

- ledger/saldo;
- XP;
- compra;
- ownership;
- equipamento;
- presentes;
- caixas/rewards.

### Pets/jogos

- instâncias;
- stats;
- tempo;
- itens;
- progressão;
- partidas;
- missões;
- coleções.

### Storage

- objeto;
- owner;
- hash;
- tamanho;
- tipo;
- referência;
- policy/delivery.

## Avatar-personagem

Preparar:

- relatório de owners;
- itens exclusivos;
- custo histórico quando disponível;
- opções de compensação sem escolher por Antonio;
- grants idempotentes/dry-run;
- arquivo/quarentena;
- SQL de contração separado.

Nenhuma compensação é aplicada neste lote.

## SQL destrutivo futuro

Se preparado:

- arquivo claramente nomeado `NOT_APPLIED`;
- alvo exato;
- preconditions que falham fechado;
- backup/restore;
- ordem FK;
- locks;
- impacto;
- validação;
- forward-fix;
- aprovação necessária;
- nunca incluído em pipeline automático.

## Testes

- dry-run;
- reexecução;
- interrupção/retomada;
- mismatch intencional;
- restore;
- FK;
- readers/writers;
- checksums;
- compensação replay;
- rollback/forward-fix.

## Critérios de conclusão

- prova objetiva de elegibilidade;
- divergência zero ou explicada;
- restore demonstrado;
- SQL separado e não aplicado;
- decisões de Antonio listadas;
- nenhuma exclusão, compensação ou mutation externa;
- Draft PR documental/técnico.
