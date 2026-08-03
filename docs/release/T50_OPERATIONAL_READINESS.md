# T50 — Backup, restauração e observabilidade operacional

Status: **OPERATIONAL_READINESS_PASSED**

Produção continua não autorizada.

## Escopo e identificação

- Branch: `integration/native-shell-v1`
- SHA inicial: `d7b23c7b2ec25c8371764a3e4902b7c3c4112d80`
- Project ref sanitizado: `fngc…jtyn`
- Projeto Lovable: Christian Connect
- Região observada: US East (N. Virginia)
- Instância observada: Tiny, PostgreSQL `17.6.1.111`
- Uso de disco observado: aproximadamente 0,54 GB de 2 GB
- Catálogo observado: 192 tabelas e 3 views
- Buckets observados no painel integrado: 14
- Feature flag padrão: `false`

## Backup e restauração

- Sessão Lovable Cloud: autenticada. A sessão direta do painel Supabase não foi usada;
  o inventário e o export foram executados pelo painel integrado do projeto.
- Plano direto do Supabase, backup automático, retenção e PITR: não ficam expostos no
  painel integrado e não foram confirmados sem a sessão direta do Supabase.
- Export nativo real solicitado em 2026-08-03 pelo painel integrado, sem alteração do
  banco. O arquivo privado `vaidarnamorocristao_260803.backup` foi gerado com 4,9 MB e
  MIME `application/octet-stream` no bucket privado de exportação.
- A cópia foi transferida pelo controle nativo do painel, sem extrair cookies, tokens,
  URLs assinadas ou credenciais. O ZIP tinha 5.127.269 bytes; o dump custom PostgreSQL
  tinha 5.127.105 bytes, assinatura `PGDMP` e SHA-256
  `f4e3456d59a68b61fcbce50e657d6ec24e3c0263c19b9ba8f1a7f80d1f3e1d4b`.
- Dump versionado: não.
- Secrets registrados: não.
- Docker local e WSL com distribuição: indisponíveis. A Supabase CLI oficial `2.111.0`
  também exigiria Docker para o runtime local.
- Runtime usado: binários portáteis oficiais PostgreSQL `17.10` da EDB, fora do
  repositório, em cluster local descartável com acesso restrito ao loopback.
- Restore real: `public` e `supabase_migrations` restaurados com `pg_restore`, sem owner
  nem ACL. Dependências gerenciadas pela plataforma (`auth.uid`, usuários referenciados,
  Storage e publicação realtime) receberam somente stubs locais mínimos; nenhum stub
  foi aplicado ao projeto real.
- Restore final: exit code zero, após restauração separada de pre-data, data e post-data.
- Integridade: 192 tabelas, 3 views, 351 funções, 110 triggers, 363 policies, 200 foreign
  keys validadas, zero foreign key não validada e 207 migrations registradas.
- Contagens: 13.404 linhas agregadas em 192 tabelas; hash SHA-256 da matriz
  `tabela:contagem`:
  `ed00d05a4bd5131ec2e776cf72050470fb214ffc9e7aeaa99cad0cb16e8a588a`.
- Storage: 14 buckets inventariados pelo painel; hash dos nomes ordenados
  `57de30e04bcd96d5e751f1f2c809ff4488144469607bc207c16798c32730f4d5`.
- RPO observado: inferior a 35 minutos, limitado pela granularidade relativa do horário
  exibido pelo painel para o export sob demanda.
- RTO medido do início do cluster local até o fim das verificações: 366 segundos
  (6 minutos e 6 segundos), incluindo ajustes de compatibilidade da primeira execução.

Não foi feita inspeção superficial para substituir o restore. Nenhum projeto
descartável pago foi criado e nenhuma configuração do projeto real foi alterada.

## Monitoramento

- `scripts/ops/smoke-url.mjs` monitora `/`, `/auth/login`,
  `/manifest.webmanifest`, `/sw.js`, `/rota-inexistente`, `/v2` e
  `/api/public/runtime-config`.
- HTTPS é obrigatório fora de loopback; redirects externos são rejeitados.
- Runtime config é validado sem imprimir a publishable key.
- Timeout, status por rota, user-agent identificável e exit code de falha estão
  implementados.
- Testes usam servidor HTTP local falso e cobrem sucesso, status inesperado, redirect
  externo e exigência de HTTPS.
- `.github/workflows/production-smoke.yml` aceita `workflow_dispatch` e agenda a cada
  seis horas somente quando `vars.PRODUCTION_BASE_URL` está definida. Não faz deploy,
  não exige secret e não cria issue.
- O monitor foi executado contra o artefato Wrangler local em `127.0.0.1`: as sete
  rotas passaram, incluindo 404 público, tombstone V2 e runtime config. O processo local
  e a configuração efêmera foram removidos depois do teste.

## Cloudflare observability

O schema da versão local do Wrangler suporta `observability.logs`,
`head_sampling_rate`, `invocation_logs` e persistência. `wrangler.jsonc` habilita logs
persistidos de invocações/exceções com amostragem de 10%. Nenhum token foi adicionado e
nenhum deploy foi executado. O config gerado preservou a configuração e o dry-run do
Wrangler passou.

## Runbooks

- `docs/operations/BACKUP_RESTORE_RUNBOOK.md`
- `docs/operations/INCIDENT_ROLLBACK_RUNBOOK.md`

Os runbooks cobrem responsabilidade, frequência, retenção, validação, RPO/RTO medidos,
Storage, restore trimestral, severidade P0–P3, contenção, evidência, feature flag,
rollback, sessões, vazamento, comunicação e pós-incidente.

## Evidências temporárias

Nenhum dump, senha, connection string, access token, cookie, signed URL ou dado pessoal
foi criado no repositório. O cluster local foi parado e removido, o dump, ZIP, logs,
binários portáteis e diretório temporário foram apagados, e o export privado temporário
foi excluído do painel após a validação. A porta local não permaneceu em escuta.

## Limitações não bloqueadoras

O painel integrado não expõe plano direto do Supabase, retenção automática ou PITR;
essas configurações devem ser confirmadas antes de alterar a política de retenção ou
contratar recurso pago. O exercício comprovou o backup lógico sob demanda e a
restauração da camada de aplicação, não uma recuperação integral dos serviços internos
gerenciados pelo Supabase nem dos bytes dos objetos de Storage.

Produção, corte da feature flag, domínio e DNS continuam fora do escopo e não foram
autorizados.
