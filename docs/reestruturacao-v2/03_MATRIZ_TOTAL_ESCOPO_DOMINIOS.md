# Matriz total de escopo e domínios — Vai Dar Namoro V2

Esta matriz impede que a reconstrução se limite às páginas já preparadas. Cada
linha deve ser rastreada até código, dados, testes, flags e critério de aceite.

## Decisões de destino

| Área                       | Estado futuro                     | Preservar                                                    | Reconstruir/criar                                                                             | Retirar somente depois                             |
| -------------------------- | --------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Aquisição e página pública | comunidade + live/eventos         | SEO, conteúdo real, auth e links                             | posicionamento community-first, páginas públicas premium, PWA install                         | chamadas dating-first obrigatórias                 |
| Identidade e acesso        | identidade única e capabilities   | contas, sessões, papéis, termos, aprovação                   | guards canônicos, dispositivos, estados de conta                                              | guards locais duplicados                           |
| Conta e configurações      | central simples e contextual      | RPCs e preferências legítimas                                | Conta, Privacidade, Segurança, Notificações, Aparência, Dados, Ajuda, perigo                  | duplicações e links inseguros                      |
| Onboarding                 | comunidade primeiro               | cadastro aprovado, foto, moderação                           | mínimo comunitário + trilha romântica opcional                                                | perguntas obrigatórias só de namoro                |
| Início                     | hub social diário                 | conteúdo e atalhos úteis                                     | feed, novidades, conexões, Status, eventos                                                    | cards românticos para namoro desligado             |
| Dashboard                  | painel analítico separado         | métricas legítimas                                           | UX e adapters por domínio                                                                     | redirect para Início                               |
| Perfil                     | identidade modular expressiva     | fotos, verificações, decorações, presentes, pets, conquistas | vitrines, capa, privacidade por módulo, editor lateral                                        | avatar-personagem                                  |
| Comunidade                 | núcleo do produto                 | chat global e conteúdo existente                             | feed, descoberta social, espaços, grupos, canais, eventos, presença                           | equivalência Comunidade = chat global              |
| Vínculos sociais           | independente de romance           | bloqueios e perfis                                           | seguir/conexão, solicitações, privacidade, antispam                                           | uso de match como amizade                          |
| Namoro                     | modo opt-in                       | interesses, matches, preferências, elegibilidade segura      | ativar/pausar/sair, perfil romântico, nova descoberta                                         | Pretendentes antigo após paridade                  |
| Conversas                  | inbox por contexto e núcleo único | mensagens, anexos, ordem, read receipts, histórico           | social, solicitações, grupos, romance, Propósito, Cinema                                      | infraestruturas paralelas duplicadas               |
| Propósito Firmado          | compromisso bilateral redesenhado | participantes, estado, datas, histórico, cápsulas            | orquestrador, página do casal, timeline                                                       | efeitos globais sobre comunidade                   |
| Recados anônimos           | romântico e opt-in                | histórico e dicas legítimas                                  | consentimento, limites, denúncia, revelação segura                                            | presença na comunidade geral                       |
| Conteúdo cristão           | hub integrado                     | devocional, orações, quiz, notícias, blog                    | contratos editoriais e distribuição social                                                    | gamificação espiritual nociva                      |
| Verbo                      | subproduto de estudo pessoal      | dados do projeto Verbo quando integrados                     | Bíblia, versões, leitura, marcações, notas, estudos, pesquisa, explorar e desafios educativos | exposição automática de hábitos privados           |
| Economia                   | autoridade única                  | moedas, XP, ledger, transações                               | comandos idempotentes, reconciliação, antifraude                                              | escrita direta do cliente                          |
| Inventário/Loja            | catálogo e propriedade claros     | compras, itens, equipados, raridade, histórico               | catálogo modular, preview, recibo, entrega atômica                                            | itens do avatar sem compensação                    |
| Presentes                  | social/romântico contextual       | propriedade, remetente, destinatário                         | consentimento, visibilidade e integração ao perfil                                            | duplicação de débito/entrega                       |
| Pets                       | subproduto preservado             | instâncias V1/V2, cuidado, progressão, itens                 | adapters, UX, histórico e admin                                                               | consolidação sem reconciliação                     |
| Jogos/Arcade               | decisão por jogo                  | progresso, missões, recompensas, coleções                    | hub lazy, regras versionadas, redesign dos mantidos                                           | qualquer jogo antes da lista de Antonio            |
| Cinema                     | watch party integrada             | n/a                                                          | upload, transcode, catálogo, sessão, host, sync, chat, reações, moderação, casal e histórico  | mídia no Git ou screen share como modelo principal |
| Notificações               | central categorizada              | histórico, push, preferências                                | categorias, privacidade, deep links seguros, agregação                                        | payload sensível na tela bloqueada                 |
| Confiança/moderação        | transversal                       | denúncias, bloqueios, verificações, evidências               | filas, rate limit, revisão, escopo contextual                                                 | fail-open silencioso                               |
| Suporte                    | ajuda e tickets                   | tickets, anexos, mensagens, estados                          | busca, categorias, protocolo, SLA real                                                        | perda de histórico                                 |
| Administração              | console por capacidades           | todas as capacidades legítimas                               | módulos, filtros URL, auditoria, ações seguras                                                | monólito único                                     |
| Métricas                   | saúde e evolução                  | Dashboard e dados operacionais                               | eventos sem PII, SLOs e alertas                                                               | métricas de vaidade/competição espiritual          |
| PWA/offline                | continuidade privada              | install, manifest, SW, push, deep links                      | cache por usuário/domínio, update seguro, outbox idempotente                                  | cache cruzado ou promessas falsas offline          |
| Legado                     | quarentena e retirada controlada  | histórico e dados necessários                                | telemetria de uso, compatibilidade, compensação                                               | exclusão por scan estático                         |

## Os 17 domínios canônicos

### 1. Aquisição e entrada

Responsável por landing, conteúdo público, página da live, SEO, instalação PWA,
cadastro/login visual e onboarding comunitário. Não decide aprovação,
elegibilidade romântica ou compra.

### 2. Identidade e acesso

Responsável por sessão, estado da conta, papéis, capabilities, termos,
aprovação, banimento, exclusão e guards. O restante da aplicação consulta um
contrato canônico em vez de reimplementar papéis.

### 3. Perfil e presença

Responsável por identidade pública, foto, galeria, bio, fé, presença, campos
visíveis, vitrines, capa, layout, privacidade e cartões compactos. Não é dono de
economia nem de preferências românticas.

### 4. Comunidade

Responsável por feed, descoberta social, vínculos, espaços, grupos, canais,
eventos, presença e convivência. Funciona plenamente sem Namoro.

### 5. Namoro

Responsável por opt-in, estado, perfil romântico, preferências, elegibilidade,
descoberta, interesse e match. Recebe do Perfil apenas dados autorizados.

### 6. Conversas

Responsável pelo motor de mensagens e experiência do inbox. Cada contexto
fornece a política de participação; Conversas não cria match nem membership.

### 7. Propósito Firmado

Responsável por pedido, aceite, término, exclusividade romântica, página do
casal, timeline e cápsulas. Publica eventos em vez de alterar domínios pelo
frontend.

### 8. Conteúdo cristão

Responsável por autoria, referências, publicação, integridade e progresso
pessoal de devocionais, Bíblia, orações, quiz, notícias, blog e Verbo.

### 9. Economia

Única autoridade sobre saldo, XP, ledger, rewards, limites, idempotência e
concessões auditadas.

### 10. Inventário e personalização

Responsável por catálogo, propriedade, equipamento, decorações, stickers,
presentes e temas. Perfil renderiza; Economia paga.

### 11. Pets

Responsável por catálogo, instâncias, necessidades, tempo, cuidado, itens,
benefícios e histórico. Famílias V1/V2 só convergem após prova.

### 12. Jogos e recompensas

Responsável por regras versionadas, partidas, missões, coleções, resultados e
pedidos de recompensa à Economia. Nenhum cliente decide prêmio.

### 13. Sala de Cinema

Responsável por catálogo de mídia, processamento, sessões, participantes,
controle, sincronização, chat contextual, reações, moderação e custos.

### 14. Notificações

Responsável por eventos de notificação, preferências, inbox, push, entrega,
deep links, privacidade e deduplicação. Não inventa eventos de domínio.

### 15. Confiança, segurança e moderação

Responsável por verificação, bloqueio global, denúncia, moderação de conteúdo,
sanção, evidência, rate limits e auditoria.

### 16. Suporte e operação administrativa

Responsável por tickets, ajuda, console operacional e capacidades administrativas,
sem absorver regras dos outros domínios.

### 17. Métricas e dashboard

Responsável por telemetria, saúde, evolução e dashboards sem coletar conteúdo
privado desnecessário.

## Dados protegidos em todas as etapas

- `auth.users`, sessões, providers, termos, roles e estado da conta;
- perfis, fotos, galeria, verificação e moderação;
- interesses, matches, mensagens, anexos e read receipts;
- Propósito Firmado, participantes, datas, estados e históricos;
- recados, dicas, revelações e denúncias legítimas;
- moedas, XP, ledger, compras e idempotency keys;
- catálogo, inventário, itens equipados, presentes e decorações;
- pets V1/V2, stats, itens, cuidado, benefícios e histórico;
- jogos, partidas, missões, recompensas, coleções e assets usados;
- devocionais, orações, comentários, reações, notícias e conteúdo;
- notificações, preferências, subscriptions e filas;
- bloqueios, denúncias, evidências, tickets e auditoria;
- buckets, paths, ownership, hashes e políticas de mídia.

## Critério global

Uma área não pode ser marcada como concluída sem:

- domínio e fonte de verdade;
- autorização server-side/RLS;
- compatibilidade e migração;
- estados universais;
- mobile/tablet/desktop;
- acessibilidade;
- performance;
- testes;
- feature flag/rollback quando aplicável;
- telemetria sem PII;
- reconciliação dos dados protegidos.
