# Runbook de backup e restauração

## Responsabilidade e objetivo

O responsável do produto autoriza a janela; o operador de banco executa e registra a
evidência sanitizada. O objetivo é provar periodicamente que um backup pode ser
restaurado sem tocar no projeto real do Supabase.

## Frequência e retenção recomendadas

- confirmar diariamente o estado do backup automático oferecido pelo plano;
- gerar backup lógico antes de mudanças de alto risco e, no mínimo, mensalmente;
- executar restore descartável trimestralmente;
- manter 30 dias de cópias diárias e 12 cópias mensais somente quando o plano e a
  política de privacidade permitirem, sem criar custo sem autorização;
- revisar RPO e RTO após cada exercício real.

O RPO é a idade do backup restaurado em relação ao início do exercício. O RTO é medido
do início da preparação do ambiente vazio até a conclusão das verificações de
integridade. Valores planejados não devem ser apresentados como medidos.

## Onde nunca guardar backups

Não guardar dumps no repositório, GitHub Actions, artefatos públicos, pasta pública do
aplicativo, logs, tickets de suporte, chats ou armazenamento pessoal sem criptografia.
Não registrar senha, connection string, access token, service role, URLs assinadas ou
conteúdo pessoal no relatório.

## Verificação do backup

1. Confirmar projeto, região, plano, frequência, retenção, PITR e horário do backup.
2. Preferir download nativo do backup. Se indisponível, usar `pg_dump` compatível em
   formato custom, sem owners e ACLs quando necessário.
3. Manter credenciais somente no processo ou gerenciador seguro temporário.
4. Registrar horário, versão da ferramenta, método, tamanho e SHA-256.
5. Validar que o arquivo não é vazio e que `pg_restore --list` consegue enumerá-lo.
6. Nunca abrir ou imprimir linhas com dados pessoais.

## Restore descartável

1. Criar PostgreSQL/Supabase vazio em Docker local ou ambiente descartável gratuito
   explicitamente confirmado. Nunca selecionar o projeto real como destino.
2. Restaurar o dump e registrar início, fim e erros sem conteúdo de linhas.
3. Validar apenas metadados e agregados:
   - schemas, migrations, extensões, tabelas e funções esperadas;
   - triggers, policies e foreign keys;
   - contagens agregadas das tabelas principais;
   - metadados de buckets, sem baixar todos os objetos.
4. Confirmar que nenhuma credencial foi persistida em arquivo.
5. Calcular o RPO e RTO medidos.
6. Destruir o banco/volume descartável, apagar dump e arquivo de senha e confirmar que
   não restaram processos com dados.

Quando Docker/Supabase local não estiver disponível, é aceitável usar binários oficiais
do PostgreSQL compatíveis, instalados fora do repositório. Nesse modo, restaure a camada
de aplicação (`public`) e `supabase_migrations` em etapas pre-data, data e post-data.
Dependências gerenciadas pela plataforma podem receber stubs mínimos somente no banco
descartável, desde que sejam documentadas, não substituam a validação de tabelas,
funções, triggers, policies e foreign keys e jamais sejam aplicadas ao projeto real.

## Storage

O dump de PostgreSQL cobre metadados de Storage, não necessariamente os bytes dos
objetos. O plano de continuidade deve combinar inventário de buckets, política de
retenção dos objetos e um exercício separado de recuperação de amostra privada sem
expor URL assinada.

## Após incidente

- revogar e rotacionar credenciais potencialmente expostas;
- invalidar sessões quando o incidente envolver autenticação;
- preservar hash e cadeia de custódia do backup;
- não improvisar SQL, service role ou alterações de RLS;
- registrar decisão, responsável, horário, RPO/RTO e resultado.

## Checklist trimestral

- [ ] backup recente e íntegro identificado;
- [ ] SHA-256 e tamanho registrados sem dados pessoais;
- [ ] ambiente de restore comprovadamente descartável;
- [ ] restore concluído;
- [ ] schemas, migrations, policies, foreign keys e contagens validados;
- [ ] metadados de Storage inventariados;
- [ ] RPO e RTO medidos;
- [ ] ambiente, volume, dump e credenciais temporárias destruídos;
- [ ] runbook atualizado com lições aprendidas.
