# T47 cutover plan

Plano futuro apenas. Nenhuma etapa deste documento foi executada ou autorizada pelo lote T47.

## Pré-condições

1. Aprovação humana do candidato e da evidência de encerramento dos achados P2.
2. Resolução e assinatura da revisão jurídica humana.
3. E2E autenticado em Supabase real controlado.
4. Validação física em iPhone/Safari/PWA e Android/Chrome/PWA.
5. Validação desktop em Chrome, Safari/WebKit e Firefox disponíveis.
6. Observabilidade, alertas, backup e restauração confirmados.
7. Responsáveis, janela de corte e critérios de rollback registrados.
8. Autorização explícita do responsável pelo produto para produção.

## Sequência de corte proposta

1. Congelar o SHA aprovado e confirmar working tree/remoto.
2. Repetir build, testes, lint, format, audit e qualificação de rotas.
3. Confirmar backup preventivo e preservar Storage.
4. Confirmar variáveis sem expor secrets.
5. Publicar o mesmo artefato aprovado sem alterar schema.
6. Ativar `VITE_FF_NATIVE_SHELL` de forma controlada no ambiente autorizado.
7. Executar canário operacional com contas controladas.
8. Validar login, cinco raízes, secundárias críticas, focused chat e Admin por papel.
9. Monitorar erros, latência, auth, realtime, Storage, PWA e indicadores operacionais.
10. Expandir somente se os critérios permanecerem verdes.
11. Em falha extrema, desativar a flag e verificar recuperação antes de qualquer outra ação.
12. Registrar o resultado e preservar o SHA implantado.

## Rollback

Primeira ação prevista: `VITE_FF_NATIVE_SHELL=false`. O fallback legado permanece no código neste candidato.

Rollback de código, se explicitamente autorizado, deve usar `git revert` em ordem inversa dos commits. Não usar force push ou reset destrutivo.

## Pós-corte futuro

A remoção do fallback legado e a retirada da feature flag exigem outro ciclo, evidência de estabilidade e autorização específica. Não fazem parte do T47 e não devem ocorrer no mesmo corte inicial.
