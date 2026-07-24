# V2-025 — Convergência e readiness de release

## Veredito

O programa V2-007 a V2-025 está **apto para revisão técnica da pilha de Draft
PRs**, mas **não está apto para staging nem autorizado para produção**.

Motivo: a base local compila e passa na suíte segura, porém 16 migrations estão
somente versionadas; RLS/RPC, Realtime e E2E precisam de Supabase descartável;
schema publicado, backup/restore, jobs, secrets, dispositivos reais e
observabilidade operacional ainda não foram confirmados. Cinema e Verbo também
possuem decisões jurídicas/editoriais abertas.

Não houve merge, deploy, ativação de flag, execução de migration ou acesso ao
Supabase publicado.

Validação local final desta etapa:

- 3 arquivos e 19 testes específicos da V2-025;
- 89 arquivos e 612 testes na suíte segura acumulada;
- nenhum dos 7 arquivos dependentes de Supabase descartável foi executado.

## Inventário final

| Item                         | Estado                                                   |
| ---------------------------- | -------------------------------------------------------- |
| main oficial                 | `fde3efd08cc59510006138e490ccd85350a905cf`               |
| rotas auditadas              | 69                                                       |
| referências internas tipadas | 513                                                      |
| domínios V2 funcionais       | 14, além das plataformas compartilhadas                  |
| flags de domínio             | 12, fechadas por padrão e habilitadas apenas por `true`  |
| gates de retirada            | 9, fechados por padrão                                   |
| migrations V2                | 16, versionadas e não aplicadas                          |
| ciclos V2                    | 0                                                        |
| ciclo total                  | 1, gerado e type-only: `router.tsx` ↔ `routeTree.gen.ts` |
| Draft PRs anteriores         | #7–#32                                                   |
| contração física             | não elegível; zero alvo autorizado                       |

O inventário reproduzível está em:

- `audit/release-inventory.json`;
- `audit/draft-pr-stack.json`;
- `audit/release-readiness.json`;
- inventários de rotas, imports, providers, Supabase e dependências existentes.

## Arquitetura convergente

A V2 preserva o monólito modular e as fronteiras:

- App Shell, Design System, Auth/sessão, flags, identidade/capabilities,
  segurança, resiliência, reconciliação e readiness são plataforma;
- Conta, onboarding, Início, Comunidade, Conversas, Perfil, Namoro,
  Propósito/recados, Economia, Pets, Conteúdo, Cinema, Confiança e Admin são
  módulos;
- cada repository V2 concentra a fronteira Supabase do domínio;
- UI não recebe `service_role`, secrets ou objeto completo de sessão;
- autorização de frontend não substitui RLS/RPC;
- legado permanece disponível até paridade e evidência operacional.

## Migrations

As 16 migrations aparecem em ordem em `audit/release-inventory.json`.

Estado comum:

- somente locais/versionadas;
- não ensaiadas em Supabase descartável;
- não aplicadas ao publicado;
- nenhuma pode ser incluída automaticamente em deploy;
- ordem, locks, RLS, RPC, Realtime, backfill e rollback ainda exigem rehearsal.

Migrations são histórico proposto, não prova do schema publicado.

## Gates locais

Os gates locais obrigatórios são:

1. instalação congelada;
2. TypeScript;
3. suíte segura explícita;
4. lint focado;
5. format focado;
6. build cliente/SSR;
7. quality budget;
8. scan de credenciais;
9. rotas, links, imports e ciclos;
10. integridade do diff.

O artefato só marca `technicalReviewReady` quando todos passam e não há gate
faltante ou `FAIL`.

## Gates externos bloqueados

| Gate                    | Evidência necessária                                     | Owner operacional   |
| ----------------------- | -------------------------------------------------------- | ------------------- |
| Supabase descartável    | RLS/RPC positivos e negativos sem dados reais            | engenharia/backend  |
| rehearsal de migrations | ordem, duração, locks, backfill, retry e rollback        | DBA/engenharia      |
| verdade publicada       | snapshot autenticado e reconciliação código/tipos/schema | DBA/segurança       |
| Realtime/E2E            | reconexão, concorrência, leitura, bloqueio e isolamento  | QA/engenharia       |
| backup/restore          | restauração completa ensaiada em ambiente isolado        | operações/DBA       |
| dispositivo/visual/a11y | iPhone, Android, tablet, desktop e leitor de tela        | QA/design           |
| jobs/endpoints/secrets  | nomes presentes, Bearer, status real e job único         | operações/segurança |
| observabilidade         | dashboards, alertas, SLOs, runbooks e owners de plantão  | SRE/produto         |
| Cinema/Verbo            | direitos, mídia, retenção, tradução e revisão editorial  | jurídico/editorial  |
| decisões de produto     | compensação, retenção, coortes e jogos                   | Antonio/produto     |

Nenhum desses gates pode ser marcado como `PASS` apenas por inspeção local.

## Observabilidade mínima

| Área          | Sinais sem PII                                  | Alerta                      | Owner              |
| ------------- | ----------------------------------------------- | --------------------------- | ------------------ |
| rotas/runtime | taxa de erro, versão, rota normalizada, p95/p99 | erro crítico ou regressão   | frontend/SRE       |
| Auth          | falha de restauração, logout, refresh e loop    | falha acima do SLO          | identidade         |
| Realtime      | conexões, reconexões, atraso, duplicação        | atraso/duplicação           | mensagens          |
| push          | fila, lease, retry, dead letter e HTTP final    | fila crescente/401/503      | operações          |
| economia      | divergência ledger/saldo e idempotência         | qualquer divergência        | economia/segurança |
| Storage       | falha, órfão, referência ausente                | objeto referenciado ausente | mídia              |
| Cinema        | sessões, drift, CDN e moderação                 | drift/entrega indevida      | Cinema             |
| cache/PWA     | versão, update aceito, cache cleanup            | bundle antigo persistente   | frontend           |
| flags/coortes | flag, coorte agregada, rollback                 | erro por coorte             | produto/SRE        |

Logs não podem conter mensagem, foto, oração, evidência, e-mail, telefone, token,
URL assinada ou identificador desnecessário.

## Blockers e decisões humanas

### Antonio/produto

- política de compensação do avatar-personagem;
- lista de jogos a retirar;
- retenção mínima do legado por classe;
- primeira coorte e ritmo de expansão;
- critérios de default V2 e retirada do prefixo `/v2`.

### Jurídico/editorial

- direitos de mídia da Sala de Cinema;
- retenção e moderação de uploads;
- tradução bíblica/licença do Verbo;
- política editorial e tratamento de conteúdo sensível.

### Produção

- snapshot publicado e reconciliação;
- backup/PITR e restore;
- staging/Supabase descartável;
- secrets por nome e jobs confirmados;
- domínio, PWA e service worker em ensaio;
- observabilidade, SLOs, plantão e comunicação.

## Riscos aceitos na revisão técnica

- baseline global CRLF/Prettier separado;
- identificadores OAuth do SDK no bundle, sem valores de token;
- ciclo type-only gerado;
- legado mantido no bundle para rollback;
- Draft PRs empilhados exigem merge/rebase ordenado e revalidação.

Esses riscos não equivalem a aceitação para produção.

## Conclusão

A implementação autônoma termina com código e documentação revisáveis, flags
fechadas, dados preservados e operação externa intocada. O próximo ato não é
desenvolvimento automático: é revisão humana da pilha, validação em ambiente
descartável e autorização separada por gate.
