# V2-018 — Conteúdo cristão e Verbo

## Resultado

`/v2/verbo` passa a ser a fronteira V2 de conteúdo cristão, Bíblia e estudo.
Ela é montada somente quando `VITE_FF_V2_CONTENT=true` e a identidade possui
`content:use`. Devocionais, orações, quiz, notícias, blog e respectivas
superfícies administrativas legadas permanecem intactos.

A etapa adiciona contratos e uma migration local, ainda não aplicada. Nenhum
texto bíblico foi importado, copiado ou buscado remotamente.

## Auditoria atual

| Conteúdo             | Autoridade observada                               | Decisão                                          |
| -------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Devocionais/notícias | `daily_posts`                                      | preservar; Conteúdo mantém integridade editorial |
| Reações/comentários  | `devotional_*`                                     | preservar                                        |
| Oração               | `prayer_requests` e tabelas auxiliares             | preservar anonimato, moderação e histórico       |
| Quiz                 | `bible_quiz_questions`, `user_quiz_attempts`, RPCs | preservar perguntas, progresso e reward          |
| Blog                 | `src/data/blog-posts`                              | preservar conteúdo estático                      |
| Topologia bíblica    | `src/data/bible-pt.json`                           | reutilizar apenas livros/capítulos/contagem      |
| Texto bíblico atual  | `bible-api.com` no seletor Admin                   | não promover a fonte canônica                    |

O seletor legado consulta uma API externa e tolera salvar somente a referência
quando a busca falha. A V2 não chama essa API: uma versão só aparece quando
fonte, licença, atribuição e revisão editorial estiverem aprovadas no servidor.

## Arquitetura

```text
V2ShellRuntimeRoute
  └─ V2ChristianContentFeature
      └─ V2ChristianContentHub
          ├─ devocionais publicados
          ├─ links seguros para oração e quiz preservados
          └─ lazy(V2VerboReader)
              └─ ChristianContentRepository
                  └─ repository.ts (único adapter Supabase)
```

O shell fornece somente `userId`; sessão, token, e-mail, telefone, papéis e
cliente Supabase não entram na apresentação.

## Modelo editorial e licenças

`christian_content_sources_v2` registra fonte, editora, estado de licença,
referência, atribuição e revisão. Um `CHECK` impede `enabled=true` sem licença e
revisão `approved`. `bible_versions_v2` declara copyright e permissões
independentes de pesquisa e offline.

As policies e RPCs só entregam passagens quando:

- fonte está habilitada;
- licença está aprovada;
- revisão editorial está aprovada;
- versão está habilitada.

Esse gate falha fechado. Nenhuma seed habilitada acompanha a migration.

## Privacidade

Notas, favoritos, progresso, estudos e desafios pessoais são owner-only por
RLS. O hub devolve apenas dados do usuário autenticado. Nada é distribuído para
feed, Perfil ou Comunidade automaticamente.

Notas usam concorrência otimista:

1. leitura obtém `version`;
2. criação aceita `expected_version=null`;
3. atualização exige a versão atual;
4. lock serializa concorrentes;
5. conflito retorna `note_conflict`;
6. a UI pede recarregamento, sem sobrescrever silenciosamente.

Compartilhamento futuro precisa de ação explícita, referência interna válida,
preview e confirmação. Progresso social e ranking espiritual permanecem
proibidos.

## Leitor

O leitor lazy permite:

- escolher versão licenciada;
- navegar por 66 livros e capítulos;
- ler passagens entregues pelo servidor;
- selecionar versículo;
- favoritar;
- manter anotação privada;
- reconhecer conflito sem fingir persistência.

Sem versão licenciada, mostra um estado honesto de gate fechado. A topologia de
livros não contém os textos dos versículos e não substitui uma licença.

## Conteúdo existente

`get_christian_content_hub_v2` projeta os 12 devocionais publicados mais
recentes sem modificar autoria, referência ou corpo. Oração e quiz continuam
nas rotas atuais, inclusive moderação, limites e rewards existentes.

Comunidade pode distribuir links ou previews futuramente, mas não passa a ser
dona do texto editorial. Conteúdo decide fonte, revisão, publicação e retirada.

## Desafios

O schema prepara desafios de quiz, ordem de livros, personagens,
acontecimentos, memorização e revisão. Cada item exige explicação e referência.
Progresso é privado; não há leaderboard, `faith_rank`, prova pública de oração
ou monetização.

Nenhuma nova lógica de reward foi criada. O quiz legado continua canônico até
uma migração vertical própria.

## Offline, pesquisa e IA

Gates iniciais:

- `offline_download=false`;
- `conversational_exploration=false`;
- `social_progress=false`.

Download só poderá existir se a licença permitir, com manifesto versionado,
consentimento explícito, quota, invalidação e remoção. Pesquisa deve indexar
texto licenciado sem misturar notas privadas.

IA/conversa exige provedor e custo aprovados, fonte visível, separação entre
texto e explicação, proteção de dados, citação verificável e falha honesta.
Nenhuma chave, API paga ou integração de IA foi adicionada.

## Acessibilidade e desempenho

- leitor em chunk lazy;
- largura de leitura limitada;
- controles com 44 px e fonte móvel mínima de 16 px;
- landmarks, labels, loading e alertas acessíveis;
- tema claro/escuro via Design System;
- CSS escopado à V2;
- teclado, foco visível e reduced motion;
- sem fonte serif obrigatória ou animação contínua.

## Testes

Cobertura determinística:

- topologia de 66 livros sem texto incorporado;
- parsing e gate fechado;
- licenciamento e revisão;
- RLS owner-only;
- conflito de notas;
- favorito e payload privado;
- desafios sem ranking;
- flag/capability;
- ausência da API externa e de IA paga;
- SSR, lazy, imports e CSS;
- ausência de persistência simulada.

RLS/RPC/sync real precisa de Supabase descartável antes de qualquer rollout.

## Ativação e rollback

1. validar migration em Supabase descartável;
2. importar somente conteúdo com licença comprovada;
3. validar hashes, atribuição, pesquisa e offline;
4. testar RLS por proprietário e atacante;
5. testar conflito e exportação de dados;
6. ativar flag somente em ambiente isolado;
7. liberar coorte interna;
8. manter devocional, oração e quiz legados até paridade.

Rollback desliga `VITE_FF_V2_CONTENT`. Dados pessoais legítimos não devem ser
apagados. Uma fonte revogada é desabilitada e retirada da leitura, preservando
auditoria e tratando exportação/notas conforme política jurídica.

## Limitações

- migration não aplicada;
- nenhuma licença ou tradução fornecida;
- nenhuma versão habilitada;
- offline, pesquisa e IA fechados;
- compartilhamento ainda não implementado;
- Admin editorial ainda legado;
- estado publicado não verificado.
