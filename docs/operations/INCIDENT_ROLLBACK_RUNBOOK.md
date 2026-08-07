# Runbook de incidente e rollback

## Severidade

- **P0:** vazamento, bypass de autorização, perda/corrupção de dados ou indisponibilidade
  generalizada.
- **P1:** fluxo principal indisponível, regressão de autenticação ou falha ampla sem perda
  confirmada.
- **P2:** degradação relevante com alternativa segura.
- **P3:** polimento ou impacto pequeno sem risco operacional.

## Detectar e declarar

1. Confirmar horário, superfície, alcance e primeiro sinal em logs/monitoramento.
2. Abrir registro privado de incidente com líder, severidade e linha do tempo.
3. Não copiar dados pessoais, secrets, connection strings ou signed URLs para o ticket.
4. Tratar suspeita de vazamento ou acesso administrativo indevido como P0 até triagem.

## Conter

1. Desligar `VITE_FF_NATIVE_SHELL` no ambiente afetado quando o incidente estiver no
   corte Native e o fallback legado for seguro.
2. Pausar canário ou rollout; não fazer mudança simultânea de banco e aplicação.
3. Revogar sessões comprometidas pelo mecanismo oficial de Auth.
4. Revogar/rotacionar credenciais somente após preservar a evidência necessária.
5. Bloquear operações destrutivas afetadas sem improvisar SQL ou service role.

## Preservar evidência

- exportar logs no intervalo mínimo necessário e com acesso restrito;
- registrar SHAs, configurações, horário UTC, request IDs e hashes;
- preservar trilha de auditoria do Supabase, Cloudflare e GitHub;
- não alterar RLS, schema ou dados antes de capturar o estado relevante.

## Rollback de aplicação

1. Identificar o último SHA aprovado e confirmar compatibilidade com o schema atual.
2. Reverter commits em ordem inversa ou promover o artefato aprovado pelo processo de
   release; nunca usar `git reset --hard` na branch compartilhada.
3. Manter a feature flag `false` até validação do artefato.
4. Executar build, testes, `release:qualify` e `ops:smoke` antes do canário.
5. Verificar autenticação, runtime config, 404, tombstones e ausência de cache privado.
6. Registrar quem autorizou e executou o rollback.

Rollback de código não reverte dados. Qualquer restauração de banco exige o runbook de
backup/restore, ambiente descartável de ensaio e autorização específica.

## Vazamento ou acesso indevido

1. Conter o vetor e revogar sessões/tokens afetados.
2. Rotacionar credenciais oficiais; nunca publicar novos valores em código ou logs.
3. Verificar RLS, Storage privado, URLs assinadas e escopo temporal.
4. Avaliar obrigação legal de notificação com revisão humana.
5. Preservar evidência e limitar acesso pelo princípio do menor privilégio.

## Comunicação

- P0/P1: atualização interna inicial assim que o alcance for confirmado e cadência
  definida pelo líder do incidente;
- comunicar fatos, impacto conhecido, mitigação e próxima atualização;
- não prometer prazo ou segurança absoluta;
- comunicação externa exige aprovação do produto e jurídico.

## Recuperação e pós-incidente

1. Confirmar métricas, logs, smoke e funções críticas antes de encerrar.
2. Monitorar canário e manter rollback pronto.
3. Documentar causa raiz, impacto, linha do tempo e ações preventivas.
4. Criar responsáveis e prazos para P2/P3 remanescentes.
5. Repetir restore trimestral se o incidente envolveu integridade ou backup.

## Proibições

Não improvisar SQL, service role, alterações de RLS, edição manual de Storage, exclusão
de evidência, deploy fora do processo, mudança de DNS ou ativação ampla da flag para
diagnosticar um incidente.
