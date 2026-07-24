# Backup e restauração

## Estado

**Banco e Auth restaurados com sucesso em ambiente descartável.** O run
`30119994966` criou dump custom, validou o manifesto, restaurou em um novo banco,
comparou snapshots byte a byte, repetiu o schema check, reiniciou os serviços e
passou o smoke de Auth/dados. Nenhuma produção foi acessada.

## Cobertura

| Componente                                      | Dump Postgres          | Processo separado                                 |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------- |
| schema, tabelas, dados, RLS, funções e triggers | sim                    | validar owners/extensões                          |
| Auth (`auth.*`)                                 | sim no local full dump | identities externas/OAuth exigem configuração     |
| metadados Storage (`storage.*`)                 | sim                    | objetos binários exigem cópia/verificação própria |
| buckets e policies                              | metadados/SQL          | conteúdo dos buckets separado                     |
| Realtime/publications                           | parcial                | confirmar publicação após restore                 |
| Edge Functions                                  | não                    | código versionado e deploy separado               |
| secrets/Vault                                   | não exportar valores   | recriar por nome em canal seguro                  |
| cron/Jobs/webhooks                              | inventário separado    | reconciliar sem duplicar                          |
| logs/auditoria externa                          | não                    | política do provedor                              |

## Ensaio

O runner:

1. cria dados sintéticos e aplica o lote;
2. captura snapshot semântico;
3. executa `pg_dump` custom com owners e ACLs dentro do próprio container
   Supabase, usando a mesma versão PostgreSQL do servidor; as roles continuam
   sendo responsabilidade do cluster de destino e são verificadas antes do
   restore;
4. valida manifesto e SHA-256;
5. pausa os serviços auxiliares do stack local, preserva o banco-fonte como
   `source_validation` e cria um novo banco vazio `postgres` (nome obrigatório
   para extensões Supabase);
6. restaura com `--exit-on-error` no banco novo;
7. repete snapshot e schema check;
8. exige igualdade byte a byte dos snapshots;
9. reinicia os serviços locais e executa smoke de Auth/perfil/economia.

Storage binário, OAuth real, secrets e integrações não são simulados como
restaurados.

O primeiro ensaio excluía ACLs e deixou o Auth indisponível após o restore. A
causa raiz foi corrigida no próprio harness: o dump passou a preservar owners e
ACLs, enquanto roles preexistentes continuam sendo pré-condição explícita do
cluster de destino. O reteste completo passou. Essa falha e seu reteste provam
por que concluir `pg_dump` isoladamente não valida recuperação.

O arquivo de dump é destruído ao fim da validação. Apenas checksum, tamanho,
manifesto sanitizado e resultados de integridade podem ser publicados como
evidência, porque dumps podem conter material de autenticação mesmo quando os
dados funcionais são totalmente sintéticos.

## Objetivos propostos para validação humana

- **RPO:** 15 minutos para dados transacionais; 24 horas para objetos
  regeneráveis;
- **RTO:** 4 horas para banco/autenticação; 8 horas incluindo Storage;
- backup diário e PITR conforme plano contratado;
- retenção: 35 dias operacional, 12 meses somente quando base legal exigir;
- criptografia em trânsito e repouso;
- cópia separada com proteção contra exclusão;
- restore trimestral em ambiente isolado;
- owner: operações/DBA; aprovador: super admin + segurança.

Esses valores são proposta, não SLO aprovado.
