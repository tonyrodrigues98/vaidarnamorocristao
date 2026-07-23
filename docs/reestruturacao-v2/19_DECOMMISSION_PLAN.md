# V2-006 — Plano de substituição e desativação do legado

## Princípios

1. Substituir verticalmente, nunca por limpeza horizontal ampla.
2. Expandir → preencher → comparar → alternar → estabilizar → contrair.
3. Preservar dados, relações, propriedade, ordem, saldos, histórico e arquivos; igualdade de
   linhas não basta.
4. A implementação antiga permanece disponível por feature flag até paridade observável.
5. Toda rota canônica ganha redirect de compatibilidade antes da retirada física.
6. Migrations, quando futuras e autorizadas, são aditivas, idempotentes, em lotes e reversíveis.
7. Frontend autenticado não substitui autorização nem RLS.
8. `user_pets` e `user_pets_v2` não serão consolidados; personagem-avatar não será confundido
   com foto.
9. Pretendentes/Namoro é opcional e não condiciona participação comunitária.
10. Nenhum candidato está seguro para exclusão apenas por análise estática.
11. Achados atuais não são contratos permanentes: testes devem aceitar que uma correção reduza
    links não resolvidos ou riscos de PWA sem exigir a permanência do defeito.

Os artefatos da auditoria registram a base auditada e o estado pré-commit da árvore de trabalho,
não o SHA autorreferencial do commit que os publica. Sua integridade é comprovada por geração
determinística e comparação de hashes.

## Template obrigatório de uma substituição vertical

Cada módulo futuro deve entregar, em PRs pequenos:

1. caracterização do comportamento legado;
2. contrato de dados e invariantes;
3. UI V2 real atrás de flag;
4. adapter para dados reais sem expor sessão/cliente ao componente;
5. paridade funcional mínima, acessibilidade e responsividade;
6. leitura comparada/telemetria sem PII;
7. mudança controlada da navegação canônica;
8. redirects/deep links de compatibilidade;
9. período de estabilização e critérios de rollback;
10. remoção da rota/UI antiga;
11. remoção posterior de hooks, queries, estilos e assets exclusivos;
12. verificação final de órfãos e contração apenas com autorização própria.

## Definição de paridade

Paridade exige:

- mesmos usuários elegíveis e mesmas regras de papel/ban/onboarding;
- mesmas entidades visíveis e mesma propriedade;
- ordenação, paginação, estados e filtros semanticamente equivalentes;
- mutations idempotentes e tratamento de concorrência;
- arquivos e URLs do Storage acessíveis somente aos mesmos papéis;
- deep link, refresh, back/forward, offline/error e logout funcionais;
- WCAG AA e touch targets;
- métricas de erro, latência e divergência dentro do limite aceito;
- testes unitários, integração, RLS em Supabase descartável, cliente, SSR e smoke;
- rollback que não reverta operações legítimas já realizadas.

## Quando algo é “seguro para excluir”

Todos os itens abaixo precisam ser verdadeiros:

- nenhum import estático/dinâmico, string, route tree, manifest, SW, sitemap, teste ou script usa o
  alvo;
- integrações externas e notificações persistidas foram verificadas;
- a substituição esteve ativa pelo período de estabilização definido;
- não há reads/writes observados na implementação antiga;
- assets carregados foram verificados em Network e catálogos;
- a exclusão não altera schema, Storage ou histórico;
- build cliente/SSR, suíte segura, smoke por papel e rollback passaram;
- a remoção possui PR próprio e revisão de domínio.

Nesta auditoria: **0 arquivos e 0 assets** atendem a todos os critérios.

## Sequência recomendada

| Onda | Módulo                            | Por que nesta posição                                            | Pré-condições                                      | Legado potencialmente contraível depois                |
| ---- | --------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| 0    | Segurança crítica                 | moedas/XP/missões/notificações e moderação precedem expansão     | snapshot/ACL publicada e Supabase descartável      | nenhum visual; apenas superfícies vulneráveis contidas |
| 1    | Configurações/Conta               | corte pequeno, alto valor arquitetural, baixo acoplamento visual | V2-005, auth canônico, contrato de conta           | `conta.tsx` e helpers exclusivos, só após paridade     |
| 2    | Perfil — identidade e fotos       | fornece identidade para toda a comunidade                        | rate limit/fail-closed da foto; adapter de profile | partes equivalentes de `perfil.tsx`; nunca dados/fotos |
| 3    | Perfil — módulos e personalização | valida inventário/equipamento compartilhado                      | invariantes de economia e catálogo                 | cards/abas antigas após equivalência                   |
| 4    | Início                            | torna a V2 útil como destino principal                           | decisão do feed, profile V2 mínimo, notificações   | `inicio.tsx` por etapas                                |
| 5    | Comunidade/feed                   | depende de identidade, moderação e criação                       | modelo de posts, Status, privacidade, RLS          | dashboard/notícias/alias conforme decisão              |
| 6    | Pretendentes/Namoro               | alto risco de regra/histórico; deve ser opt-in                   | separação de elegibilidade, Propósito, recados     | UI antiga, nunca matches/mensagens                     |
| 7    | Conversas                         | maior risco de Realtime/ordem/offline                            | serviço único, paginação, receipts e reconciliação | chats duplicados e helpers exclusivos                  |
| 8    | Administração                     | segue domínios já estabilizados                                  | matriz de permissões e RLS testada                 | monólito Admin em ondas                                |
| 9    | PWA/rotas finais                  | só após rotas V2 canônicas                                       | cache seguro e catálogo de deep links              | prefixo `/v2`, flags e assets legados                  |

## Avaliação comparativa do primeiro módulo

Escala 1 (favorável/pequeno) a 5 (desfavorável/grande).

| Candidato           | Dependências | Risco de dados | Valor para validar arquitetura | Legado removível | Bloqueadores                              |
| ------------------- | -----------: | -------------: | -----------------------------: | ---------------: | ----------------------------------------- |
| Configurações/Conta |            2 |              3 |                              5 |                2 | garantir semântica das RPCs de conta      |
| Perfil              |            5 |              5 |                              5 |                5 | foto/moderação, inventário, badges, roles |
| Início              |            4 |              4 |                              5 |                4 | decisão de feed e conteúdo comunitário    |
| Comunidade          |            5 |              5 |                              5 |                3 | modelo novo, moderação, RLS               |
| Pretendentes        |            5 |              5 |                              4 |                4 | Namoro opt-in, compromissos, recados      |
| Conversas           |            5 |              5 |                              5 |                4 | Realtime, paginação, offline, receipts    |

Configurações/Conta vence por permitir um ciclo completo de adapter → UI V2 → mutation real →
logout/cache → rollback, sem envolver ainda o monólito visual de Perfil, feed novo ou mensagens.

## V2-007 recomendada — Configurações e Conta

### Escopo

- rota V2 real `/v2/configuracoes`;
- resumo seguro da conta, preferências de aplicação e ações existentes;
- adaptar os fluxos atuais de desativação, reativação e exclusão;
- manter Bloqueados e Suporte como links legados na primeira fatia, sem reimplementar ambos;
- usar AuthProvider, RouteProtectionBoundary, DS/App Shell públicos e feature flag existente;
- zero migration na primeira fatia, salvo descoberta futura formalmente autorizada.

### Evidência

- `/conta` é uma única file route e não realiza queries Supabase literais diretamente;
- as mutations vivem em `AccountDangerZone.tsx` e chamam quatro RPCs nomeadas;
- a rota já está separada de `perfil.tsx`;
- não depende de feed, matches, Realtime, pets, loja ou inventário para renderizar;
- valida uma ação de alto impacto, portanto força disciplina de confirmação, erro, auth, cache e
  rollback antes de módulos maiores.

### Contrato de dados

Fornecer à UI somente:

- estado sanitizado de sessão/autorização;
- estado atual de desativação/exclusão necessário à regra;
- ações tipadas `requestDeactivation`, `requestReactivation`, `requestDeletion` e cancelamento;
- resultados sanitizados, sem token, e-mail, telefone, objeto Session ou cliente Supabase.

Confirmar no Supabase descartável:

- RPC deriva o usuário de `auth.uid()`;
- outra conta não pode ler/alterar o estado;
- confirmação para exclusão é validada no servidor;
- logout limpa cache privado;
- repetir ação é idempotente ou falha previsvisivelmente;
- reativação não altera Namoro automaticamente.

### PRs sugeridos

| PR      | Objetivo                             | Banco           | Flag                    | Testes                       | Rollback                     |
| ------- | ------------------------------------ | --------------- | ----------------------- | ---------------------------- | ---------------------------- |
| V2-007A | caracterizar `/conta` e adapter puro | nenhum          | V2 atual                | contrato/SSR/auth            | remover rota/adaptador       |
| V2-007B | UI V2 read-only e estados            | nenhum          | usuário/ambiente        | a11y/responsivo/smoke        | flag off                     |
| V2-007C | mutations existentes com confirmação | nenhum previsto | capability específica   | integração + RLS descartável | flag off; manter rota antiga |
| V2-007D | navegação canônica e métricas        | nenhum          | rollout gradual         | deep link/back/error         | apontar nav à rota antiga    |
| V2-007E | estabilização e depreciação          | nenhum          | legado ainda reativável | regressão completa           | reativar `/conta`            |
| V2-007F | remoção física separada              | nenhum          | após janela             | órfãos/build/smoke           | revert do PR de remoção      |

### Critérios de aceite

- flag off mantém `/conta` byte a byte;
- sessão em restauração não monta conteúdo;
- usuário sem sessão retorna ao login e volta ao deep link seguro;
- mutations usam apenas RPCs atuais e não fingem sucesso;
- erros não vazam detalhes internos;
- confirmação de exclusão é acessível e segura;
- comportamento por papel/RLS validado em projeto descartável;
- nenhum dado, RPC, policy ou rota legada é removido;
- métricas não contêm PII.

### Legado potencialmente removível

Somente após todos os PRs: `src/routes/conta.tsx`, `AccountDangerZone.tsx` e estilos/imports
comprovadamente exclusivos. `bloqueados`, `suporte`, AuthProvider e RPCs permanecem. A lista final
deve ser recalculada; esta não é autorização de exclusão.

## Planos por módulo

### Perfil

1. separar identidade/fotos de customização/economia;
2. caracterizar `perfil.tsx`, verificação, galeria e moderação;
3. conter fail-open/rate limit;
4. adapter para profile/photos/preferences;
5. módulos V2 com ordem configurável;
6. dupla leitura comparada;
7. nav canônica e redirects;
8. retirar abas legadas uma a uma.

Rollback: flag por módulo; nenhum write novo deve exigir downgrade de schema.

### Início

1. decidir o que é feed, notícia, devocional e oração;
2. caracterizar admin banners, status e redirects de onboarding;
3. página V2 read-only;
4. telemetria de latência/erros;
5. habilitar criação/interação somente após moderação/RLS;
6. trocar `/inicio`;
7. retirar blocos legados por composição.

Rollback: nav volta à rota antiga; dados novos permanecem válidos.

### Comunidade

1. não tratar o chat global atual como modelo final;
2. definir post/comment/reaction/Status/grupo/evento e ownership;
3. migrations apenas aditivas em PR próprio;
4. moderação e privacidade antes da criação;
5. feed/grupos atrás de capabilities;
6. `/comunidade` muda somente depois de paridade;
7. redirect do chat global preservado em URL própria.

Rollback: desabilitar capabilities; nunca apagar posts criados.

### Pretendentes/Namoro

1. caracterizar profiles/preferences/interests/matches/commitments/recados;
2. introduzir disponibilidade romântica independente e default off;
3. preservar usuários/dados históricos;
4. UI V2 no namespace Namoro;
5. comparar elegibilidade e impedir staff/bloqueios;
6. migrar navegação;
7. retirar apenas UI antiga.

Rollback: reativar UI antiga sem reativar Namoro automaticamente.

### Conversas

1. congelar invariantes de ordem, ownership, read receipt e anexos;
2. medir queries/subscriptions duplicadas;
3. serviço paginado e idempotente;
4. UI V2 com optimistic/reconnect/offline;
5. comparar Realtime e reconciliação;
6. migrar 1:1, depois social, depois integração com Propósito;
7. retirar drawers/screens/helpers antigos.

Rollback: alternar leitor/UI; writes permanecem no modelo compatível.

## Redirects e compatibilidade

- manter URLs legadas durante ao menos uma janela de release observada;
- preservar query/hash quando seguro;
- usar somente destinos same-origin aprovados;
- não redirecionar endpoints como páginas;
- notificações antigas devem resolver para um catálogo de aliases;
- atualizar manifest/SW/sitemap somente quando a rota canônica estiver estabilizada;
- evitar cadeias: cada alias deve apontar diretamente ao destino final.

## Critérios para trocar uma rota canônica

- paridade funcional aceita;
- segurança/RLS e acessibilidade aprovadas;
- erro/latência dentro do limite;
- deep links e refresh passam;
- rollback exercitado;
- consumidores (Header, mobile, desktop, push, manifest, notificações) atualizados;
- nenhuma divergência de dados;
- janela de monitoramento definida.

## Critérios para retirar feature flags

- 100% do público elegível utiliza a V2 estável;
- zero fallback legítimo observado na janela;
- nenhuma capability ainda depende de retorno ao legado;
- rollback muda de “flag” para “versão anterior” e foi testado;
- flags não guardam autorização;
- documentação/runbook e ownership estão definidos.

## Critérios para remover o prefixo `/v2`

- Início, Comunidade, Perfil, Configurações e Conversas canônicos estão estabilizados;
- Namoro opcional tem namespace/destinos definidos;
- aliases legados e notificações antigas foram reconciliados;
- manifest, SW, sitemap, SEO e analytics usam os destinos finais;
- nenhuma rota V2 provisória finge backend;
- redirect `/v2/*` → final não cria ciclo nem perde query/hash;
- rollback preserva o prefixo por uma janela.

## Ondas de remoção

1. **Ocultar** a entrada antiga com flag/nav, mantendo rota.
2. **Observar** ausência de uso e comparar dados.
3. **Redirecionar** a rota antiga ao destino V2.
4. **Desmontar** providers/queries exclusivos.
5. **Remover UI** antiga em PR isolado.
6. **Remover helpers/testes/styles/assets** comprovadamente exclusivos.
7. **Contrair banco** somente em projeto posterior, com snapshot, backup, reconciliação e
   autorização explícita.

## Testes por onda

- unitários de contratos e normalização;
- componentes/a11y/SSR;
- integração com adapters mockados;
- RLS/RPC por papel em Supabase descartável;
- Realtime e concorrência;
- build cliente e SSR;
- deep link/refresh/back/forward;
- PWA/cache/update;
- reconciliação semântica e propriedade;
- smoke mobile/tablet/desktop;
- regressão visual;
- rollback ensaiado.

## Rollback global

Desativar a capability do módulo, restaurar a navegação anterior e manter dados novos. Não executar
rollback destrutivo de dados; operações legítimas ocorridas durante rollout devem continuar
visíveis. Se uma migration aditiva futura existir, o rollback de aplicação deve tolerá-la. O
service worker precisa de versão compatível para não servir bundles/rotas incompatíveis.

## Próximo passo

Após este PR de auditoria e a contenção dos P0, autorizar explicitamente a V2-007A
Configurações/Conta. Este documento não inicia nem implementa a V2-007.
