# Runbook de rollback

## Autoridade e gatilhos

Release lead propõe; super admin e owner técnico autorizam. Incidente de
segurança permite pausa imediata pelo on-call. Rollback obrigatório para acesso
indevido, perda/associação cruzada, divergência financeira, Auth indisponível,
schema incompatível, push 401/503 persistente ou ausência de diagnóstico.

## Sequência

1. congelar deploys, migrations e expansão de coorte;
2. registrar SHA, schema version, horário e sinais sem PII;
3. preservar logs/evidências e abrir incidente;
4. desativar somente a feature flag afetada;
5. restaurar frontend anterior pelo artefato imutável;
6. reverter Edge Function somente se compatível com schema;
7. pausar backfills/jobs sem apagar fila;
8. para banco, escolher roll-forward, migration corretiva ou restore;
9. reconciliar operações ocorridas após o ponto de corte;
10. executar smoke e checksums;
11. comunicar impacto e status;
12. documentar causa, decisão e prevenção.

## Banco não é código

Não existe `down.sql` genérico. Migrations aditivas permanecem durante rollback
visual. Saldos, mensagens, matches, presentes, pets e ownership nunca são
restaurados cegamente por snapshot antigo. Restore total exige janela,
reconciliação de writes posteriores e autorização explícita.

## Validação pós-rollback

- Auth/sessão/logout;
- perfis/fotos;
- mensagens/matches/Propósito;
- ledger/saldo/inventário;
- pets/progresso;
- RLS/blocks/bans/Admin;
- Storage/Realtime/push;
- PWA/cache;
- versão frontend/schema;
- ausência de divergência nos checksums.

## Comunicação

Mensagem informa impacto, período, funcionalidades afetadas e próxima
atualização, sem detalhes exploráveis ou PII. O incidente termina somente após
reconciliação, estabilidade e post-mortem.
