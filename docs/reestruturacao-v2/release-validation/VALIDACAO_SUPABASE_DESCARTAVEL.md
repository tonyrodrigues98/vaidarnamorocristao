# Validação com Supabase descartável

## Conclusão atual

**Aprovada no ambiente descartável.** O run
[`30119994966`](https://github.com/tonyrodrigues98/vaidarnamorocristao/actions/runs/30119994966)
usou Supabase local no runner efêmero, sem secrets do repositório e sem acesso
a projeto remoto. Instalação limpa, schema, upgrade, falha transacional,
backup/restore e as oito suítes externas passaram.

O Realtime local pode anunciar `SUBSCRIBED` antes de a replicação estar pronta
para entregar o primeiro evento. Um probe permissivo e exclusivo do banco
descartável passou a emitir marcadores sintéticos até observar a primeira
entrega real. Só então o teste de domínio provou que A e B recebem o `INSERT` e
C não o recebe. O probe é removido antes do cenário de upgrade e não pertence às
migrations do produto.

O host local não possui Docker, Podman, PostgreSQL, Supabase CLI ou distribuição
WSL; por isso a execução externa isolada foi necessária. Nenhum valor de
credencial foi persistido nos relatórios.

O fallback aprovado é o workflow
`.github/workflows/release-validation.yml`: runner efêmero, Supabase local via
Docker do GitHub Actions, sem secrets do repositório, sem `supabase link` e sem
acesso a projeto remoto. O runner recusa URL que não seja `localhost` ou
`127.0.0.1`.

## Escopo real

- 213 migrations encontradas;
- 196 migrations formam o baseline anterior à V2;
- 1 migration auxiliar aditiva cobre compatibilidade de bootstrap limpo;
- 16 migrations V2 formam o lote de upgrade;
- dados exclusivamente sintéticos com domínio `example.invalid`;
- nenhum nome, e-mail, foto, mensagem ou documento real;
- evidências retidas por 14 dias como artefato de CI.

## Cenários automatizados

1. **Banco limpo:** `supabase db reset --no-seed`, assert de schema V2 e oito
   suítes externas.
2. **Upgrade representativo:** reset até `20260622200000`, seed sintético,
   snapshot semântico, execução individual das 16 migrations e comparação.
3. **Falha intermediária:** migration 3 dentro de transação seguida de falha
   forçada; prova de rollback e reaplicação.
4. **Repetição controlada:** reaplicação das 16, registrando quais não são
   repetíveis sem mascarar erro.
5. **Backup/restore:** dump custom, manifesto, SHA-256, novo database, restore e
   comparação semântica.

## Suítes externas

- `starter-bundle.test.ts`;
- `messages-rls.test.ts`;
- `moderation-rls.test.ts`;
- `chat-e2e.test.ts`;
- `realtime-infrastructure.test.ts` (probe descartável de prontidão);
- `realtime-messages.test.ts`;
- `push-dispatch-atomic-rls.test.ts`;
- `trusted-capabilities-rls.test.ts`.

Elas criam somente usuários sintéticos e removem seus registros. A service role
é obtida do Supabase local e existe apenas no processo server-side do runner.

## Matriz mínima de permissões

| Papel            | Leitura                                | Escrita                   | Administração          | Evidência prevista             |
| ---------------- | -------------------------------------- | ------------------------- | ---------------------- | ------------------------------ |
| visitante        | somente conteúdo público permitido     | nenhuma ação privada      | não                    | chamadas anon negativas        |
| autenticado      | dados próprios e audiências permitidas | comandos próprios         | não                    | RLS/mensagens/chat             |
| bloqueado/banido | nenhuma descoberta indevida            | bloqueado por regra       | não                    | fixtures de block/status       |
| moderador        | filas permitidas                       | moderação limitada        | não recebe super admin | moderation RLS                 |
| suporte          | contexto mínimo de ticket              | comandos auditáveis       | não                    | migration 15 + matriz jurídica |
| apresentador     | somente sessão atribuída               | controles da sessão       | não                    | Cinema pendente de E2E         |
| administrador    | domínio administrativo permitido       | comandos auditados        | capability necessária  | admin migration/testes         |
| super admin      | escopo excepcional                     | ações sensíveis auditadas | sim                    | revisão humana obrigatória     |
| service role     | somente harness server-side            | setup/cleanup sintético   | não representa usuário | runner local isolado           |

## Resultado comprovado

| Verificação                                             | Resultado      |
| ------------------------------------------------------- | -------------- |
| URL e banco exclusivamente locais                       | passou         |
| instalação limpa das 213 migrations                     | passou em 34 s |
| schema, funções, triggers, policies e buckets esperados | passou         |
| upgrade representativo das 16 migrations V2             | passou em 32 s |
| oito suítes externas                                    | passaram       |
| Realtime de infraestrutura e isolamento A/B/C           | passou         |
| acesso a produção                                       | não ocorreu    |

O artefato sanitizado tem digest
`sha256:799a34ac6f8c85d7e7c1a1eb374a0d03a451e10de10557ff46a955c1b3b0abfc`
e expira em 7 de agosto de 2026. O resumo verificável está em
`evidence/disposable-run-30119994966.json`. O ponto 4 está aprovado no ambiente
descartável; isso não substitui a campanha de dispositivos nem um smoke
pré-produção posteriormente autorizado.
