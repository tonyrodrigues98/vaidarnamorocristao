# Relatório final de prontidão de lançamento

## Resumo executivo

**NÃO APTO PARA PRODUÇÃO.** O banco descartável foi usado, as 213 migrations
foram instaladas, as 16 migrations V2 foram ensaiadas sobre dados sintéticos, a
falha intermediária foi recuperada e o backup foi restaurado em outro banco com
integridade e smoke de Auth aprovados. As oito suítes externas, incluindo
Realtime, passaram. A liberação continua bloqueada pela ausência de campanha em
dispositivos físicos, observabilidade externa não configurada, recuperação dos
objetos binários do Storage não ensaiada e validação jurídica humana pendente.
Nenhuma produção foi acessada.

## Resultado por ponto

| Ponto                       | Status                   | Evidência                                  | Bloqueios                                 | Próxima ação                         |
| --------------------------- | ------------------------ | ------------------------------------------ | ----------------------------------------- | ------------------------------------ |
| 4. Supabase descartável     | aprovado                 | run `30119994966`; 8/8 suítes              | nenhum no escopo descartável              | manter execução como gate            |
| 5. Migrations               | aprovado com ressalva    | clean 34 s; upgrade 32 s; A–D passaram     | 13 não repetíveis exigem runbook          | preservar ordem e rehearsal          |
| 6. Backup/restauração       | aprovado para banco/Auth | novo DB, snapshots idênticos, smoke passou | Storage binário/secrets/jobs fora do dump | campanha separada desses componentes |
| 7. Dispositivos             | parcial por emulação     | Chromium em 390/768/1024/1440              | nenhum dispositivo/PWA físico             | campanha iOS/Android/desktop         |
| 8. Observabilidade/rollback | preparado com ressalvas  | sanitizador testado + alertas + runbook    | provider, owners e SLOs não aprovados     | configurar após autorização          |
| 9. Jurídico/privacidade     | bloqueado humano         | mapa LGPD + matriz de retenção + checklist | base legal, idade, retenção, Cinema/Verbo | parecer jurídico/DPO                 |

## Falhas encontradas

| Severidade              | Causa raiz                                                     | Impacto                                     | Correção/reteste                                            | Risco residual                               |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| P1 corrigido no harness | `SUBSCRIBED` precedia a prontidão da replicação local          | primeiro evento do ensaio podia ser perdido | probe efêmero aguarda entrega real; isolamento A/B/C passou | aplicação deve manter refetch/reconexão      |
| P1 corrigido no harness | dump excluía ACLs                                              | Auth 503 após restore                       | owners/ACLs preservados; restore e smoke passaram           | roles e configs ainda precisam de inventário |
| alto                    | Storage binário, secrets e jobs não pertencem ao dump Postgres | recuperação integral não comprovada         | procedimento separado documentado                           | bloqueia aprovação de DR completo            |
| alto                    | nenhum iOS/Android/PWA físico disponível                       | regressões específicas não provadas         | quatro viewports Chromium aprovados parcialmente            | campanha física obrigatória                  |
| crítico                 | religião e dados românticos sem governança jurídica final      | risco LGPD e de confiança                   | mapa/consentimentos especificados                           | requer decisão humana                        |
| crítico                 | idade autodeclarada sem assurance formal                       | risco de acesso por menores                 | opções de mitigação documentadas                            | requer política e implementação              |

## Migrations

- encontradas: **213**;
- baseline anterior à V2: **196**;
- compatibilidade auxiliar aditiva: **1**;
- lote V2: **16**;
- executadas no clean install: **213/213**;
- executadas no upgrade representativo: **16/16**;
- aprovadas quanto à aplicação/preservação: **16**;
- repetíveis: **3**; não repetíveis por desenho: **13**;
- falha intermediária: revertida transacionalmente e reaplicada;
- tempo: 34 s no cenário A e 32 s no cenário B;
- `DROP TABLE`, `DROP COLUMN` ou `TRUNCATE` no lote V2: **zero**;
- intervenção manual em produção: não autorizada nem executada.

Os CSVs individuais ficam no artefato sanitizado do run; o resumo verificável e
seu digest estão em `evidence/disposable-run-30119994966.json`.

## Backup

- criado: **sim**, em ambiente sintético descartável;
- restaurado em outro banco: **sim**;
- schema e snapshot pós-restore: **passaram, byte a byte idênticos**;
- Auth/dados após restore: **passaram**;
- não coberto: conteúdo binário de Storage, OAuth real, secrets, Edge Functions,
  cron/jobs, webhooks e observabilidade externa;
- RPO/RTO propostos: 15 minutos/4 horas para dados centrais, ainda sujeitos à
  aprovação operacional e contratual.

## Dispositivos

- testado fisicamente: **nenhum dispositivo móvel**;
- testado por emulação: Chromium em 390×844, 768×1024, 1024×768 e 1440×900,
  sem overflow horizontal; inputs de Auth observados com 16 px;
- não testado: iOS Safari/PWA, Android Chrome/PWA, Safari macOS, Edge, Firefox,
  OAuth, upload real, offline e troca de conta em hardware.

## Observabilidade e rollback

O contrato local sanitiza rota, restringe campos, remove PII e não transmite
eventos. Alertas, health checks e runbook diferenciam rollback de frontend,
functions, roll-forward de banco e restore. Fornecedor, owners, thresholds,
retenção e canais ainda precisam de autorização; portanto observabilidade
externa não é declarada configurada.

## Jurídico e privacidade

Foram mapeados dados pessoais e sensíveis, finalidades, armazenamento, acessos,
bases sugeridas, exclusão e backup. Permanecem decisões humanas sobre religião,
Namoro, idade, portabilidade/download, retenção 30/90 dias, mensagens,
denúncias, bans, auditoria/impersonação, Cinema, Verbo, vendors e transferências.
Os documentos são especificações técnicas, não parecer jurídico.

## Decisões do super admin

- aprovar campanha de dispositivos físicos;
- aprovar RPO/RTO, retenção, owners e teste periódico;
- escolher e autorizar fornecedor de observabilidade;
- aprovar base legal, consentimentos, idade e direitos dos titulares;
- validar direitos/licenças de Cinema e Verbo;
- somente depois avaliar uma autorização separada de produção.

## Produção

`NÃO APTO PARA PRODUÇÃO`

Não houve deploy, migration remota, leitura ou escrita em produção. O próximo
gate técnico é a campanha física e a validação de recuperação de
Storage/integrações, seguidas das aprovações operacional e jurídica; preparação
não autoriza aplicação produtiva.
