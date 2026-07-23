# V2-008 — Baseline de segurança

## Estado deste lote

O HEAD auditado deriva de `249b4c8aca9ea8f82a3e6e68f55894c780b0e182`.
Nenhum acesso ao Supabase publicado foi feito. O manifest
`security-baseline/findings.json` diferencia evidência do código, tipos, histórico
de migrations e gates que só podem ser concluídos com metadados autenticados do
banco publicado.

O manifest cobre `SEG-001` a `SEG-020`, define P0–P4 e não chama uma hipótese
histórica de vulnerabilidade publicada. O contrato tipado e seu validador ficam em
`src/v2/platform/trust-security/security-evidence.ts`.

## Resultado imediato

- `SEG-001`: contenção HTTP do push permanece comprovada por teste; atomicidade
  continua em `SEG-019`.
- `SEG-007`: limite de seis verificações por minuto por usuário e por instância,
  limite de corpo, MIME permitido e magic bytes foram adicionados.
- `SEG-008`: timeout, indisponibilidade, limite, parse e exceção da IA passaram a
  bloquear o upload. Não existe mais o caminho `soft:true` que publicava sem
  moderação.
- `SEG-017`: logs da moderação são categóricos, sem usuário, imagem, resposta do
  provedor, token ou exceção.
- RPCs, grants, RLS, Realtime, buckets e headers publicados continuam marcados
  `production_verification_required`.

O limite de `SEG-007` é contenção local compatível com o runtime, não um limite
global distribuído. Uma capability durável ou binding de rate limit ainda é gate
operacional antes de ampliar uploads sociais.

## Contrato fail-closed de foto

Ordem da requisição:

1. exigir `application/json` e rejeitar corpo declarado acima do limite;
2. validar bearer com o projeto Supabase existente;
3. aplicar limite por identidade autenticada, sem registrar a identidade;
4. validar base64, tamanho, MIME e assinatura real da imagem;
5. buscar settings administrativos somente depois dessas fronteiras;
6. abortar o provedor em 15 segundos;
7. retornar erro genérico e `retryable:true` em falha técnica;
8. o cliente interrompe o upload e orienta nova tentativa.

O comportamento deliberadamente preservado é a revisão manual de respostas
válidas mas inconclusivas da IA. Mudar visibilidade de fotos pendentes exige
contrato de dados e rollout de Storage próprios; não foi fingido neste lote.

## Matriz resumida

| Achado      | Prioridade | Estado local                           | Gate publicado                             |
| ----------- | ---------: | -------------------------------------- | ------------------------------------------ |
| SEG-001     |         P0 | contido                                | revalidar scheduler/HTTP                   |
| SEG-002–006 |         P0 | evidência histórica/tipos              | ACL, owner, definição e default privileges |
| SEG-007     |         P1 | mitigado por instância                 | rate limit distribuído                     |
| SEG-008     |         P1 | contido fail-closed                    | smoke isolado                              |
| SEG-009     |         P1 | uso público no código/histórico        | bucket e URLs persistidas                  |
| SEG-010     |         P1 | `.env` rastreado                       | histórico/rotação pelo operador            |
| SEG-011     |         P1 | headers não comprovados                | resposta do domínio publicado              |
| SEG-012     |         P2 | persistência existente isolada pela V2 | nenhum                                     |
| SEG-013–014 |         P1 | sinks confirmados no HEAD              | origem dos conteúdos/URLs                  |
| SEG-015–016 |         P1 | histórico insuficiente                 | policies e Realtime publicados             |
| SEG-017     |         P3 | logs locais reduzidos                  | retenção e sinks                           |
| SEG-018     |         P2 | autorização server-side existente      | limites e auditoria                        |
| SEG-019     |         P1 | não atômico no HEAD                    | schema e Job publicados                    |
| SEG-020     |         P2 | três locks confirmados                 | nenhum                                     |

Detalhes, caminhos, testes e estratégia de correção estão no JSON, que é a fonte
reproduzível desta matriz.

## Snapshot somente leitura

### Pré-condições

- autorização explícita para o projeto correto;
- sessão SQL read-only;
- saída em diretório temporário não versionado;
- nenhuma linha de negócio, URL assinada, token, chave, e-mail, telefone, conteúdo
  de mensagem ou path de usuário;
- revisão do resultado antes de qualquer artefato entrar no Git.

### Execução preparada, não executada

1. confirmar visualmente o project ref sem copiá-lo para logs;
2. iniciar transação `READ ONLY`;
3. executar
   `docs/reestruturacao-v2/05_SUPABASE_INVENTARIO_READONLY.sql`;
4. exportar somente metadados de relations, policies, functions, default
   privileges, triggers, publication/Realtime e buckets;
5. substituir o project ref por SHA-256;
6. validar contra `security-baseline/snapshot.schema.json`;
7. revisar manualmente ausência de PII/segredos;
8. comparar com tipos, migrations e `findings.json`;
9. encerrar a transação sem comandos mutáveis.

Se qualquer query exigir escrita, extensão, função auxiliar, bypass de RLS ou
`service_role` fora do canal administrativo autorizado, a captura deve parar.

### Interpretação

- Código confirma somente comportamento do HEAD.
- Tipos confirmam nomes e assinaturas geradas.
- Migrations confirmam história, não estado publicado.
- Snapshot autenticado confirma metadados do instante capturado.
- Teste descartável confirma a mudança proposta, não a produção.

## Testes

`tests/photo-moderation-security-v2.test.ts` cobre magic bytes, MIME, tamanho,
rate limit por identidade, reset da janela, timeout, corpo fail-closed e ausência
do caminho `soft:true`. `tests/security-evidence-v2.test.ts` exige exatamente os
20 achados, metadados P0–P4, rollback/forward-fix e gate explícito.

Testes mutáveis de RPC/RLS/Realtime/Storage serão preparados nas próximas
mudanças do V2-008 e só executados contra Supabase descartável autorizado.

## Rollback e forward-fix

- Foto: rollback seguro é desabilitar temporariamente o upload; reabrir
  `soft:true` não é rollback aceitável.
- Rate limit: ajustar o limite por revisão; o forward-fix é contador distribuído.
- Evidências: corrigir o manifest com nova prova e manter histórico no Git.
- Banco: nenhuma migration deste lote foi aplicada ou criada.

## Limitações e próximos gates

- não há snapshot autenticado publicado;
- não há ambiente Supabase descartável;
- rate limit não é distribuído;
- `SEG-019` ainda exige claim atômico;
- `SEG-002` a `SEG-006` exigem capabilities, migrations e matriz RPC;
- privacidade de `profile-photos` não pode mudar antes do inventário de URLs e
  rollout expandir → preencher → comparar → alternar → estabilizar → contrair.
