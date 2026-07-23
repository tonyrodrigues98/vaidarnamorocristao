# VaiDarNamoro — Item 7: Plano de Preservação e Migração

**Status:** especificação documental; nenhuma alteração aplicada  
**Data-base:** 22 de julho de 2026  
**Repositório:** `tonyrodrigues98/vaidarnamorocristao`  
**Branch de referência:** `main`  
**Commit documental de referência:** `1de94bca421c36d32b1a4d96b2fc96f2330129aa`  
**Itens utilizados:** 1 — Manual Atual; 2 — Segurança; 3 — Snapshot Supabase; 4 — Domínios; 5 — Comunidade/Namoro; 6 — Monólitos

---

## 1. Objetivo

Este documento define como o VaiDarNamoro poderá ser reestruturado sem perder, duplicar, reinterpretar ou expor indevidamente dados existentes.

O plano protege:

- contas, identidades e cargos;
- perfis, fotos e verificações;
- interesses, matches e mensagens;
- bloqueios, denúncias e evidências de moderação;
- Propósito Firmado e cápsulas do tempo;
- recados anônimos;
- moedas, XP e razão de transações;
- presentes, itens, inventários e equipamentos;
- molduras, auras, fundos e gradientes;
- pets, cuidado, progressão, missões, expedições e álbum;
- Pet Arcade, caixas, sorteios e respectivos históricos;
- conteúdo cristão, interações e pedidos de oração;
- notificações, push, suporte e configurações administrativas;
- arquivos do Storage e referências a eles;
- comportamento mobile, PWA e Realtime que depende desses dados.

O Item 7 não cria migrations, não executa SQL, não altera o Supabase, não modifica código e não decide apagar nenhum dado.

---

## 2. Conclusão executiva

A reestruturação deve seguir uma estratégia de **migração expandir → preencher → comparar → alternar → estabilizar → contrair**.

Isso significa:

1. confirmar o estado publicado antes de escrever;
2. criar somente estruturas aditivas e compatíveis;
3. fazer backfill idempotente e retomável;
4. comparar origem e destino por contagem, chaves e significado;
5. liberar a nova leitura por feature flag;
6. observar e reconciliar divergências;
7. manter o caminho antigo disponível durante a janela de segurança;
8. remover legado apenas depois de prova, retenção e autorização explícita.

Não haverá migração “big bang”. Redesign de páginas, extração de monólitos e mudança de dados não devem acontecer no mesmo passo operacional.

As principais decisões deste plano são:

- UUIDs e identificadores atuais são patrimônio do produto e devem ser preservados;
- operações econômicas continuam atômicas e server-side;
- históricos não serão recalculados a partir do estado visual;
- mensagens não serão copiadas sem preservar ordem, autoria, leitura e relacionamento;
- Propósito Firmado não será transformado em um simples campo de perfil;
- `user_pets` e `user_pets_v2` não serão consolidados antes de análise publicada;
- retirada do avatar-personagem será uma aposentadoria controlada, não um `DROP` imediato;
- `avatar_decorations`, foto de perfil, molduras e auras não pertencem ao avatar removível;
- rollback de frontend não poderá exigir desfazer dados de produção;
- toda contração será uma decisão posterior e separada.

---

## 3. Princípios obrigatórios

### 3.1 Preservar significado, não apenas linhas

Uma migração não está correta apenas porque origem e destino possuem a mesma quantidade de registros.

Exemplos:

- um saldo pode existir, mas estar divergente do razão;
- uma mensagem pode existir, mas ligada ao match errado;
- um item pode existir, mas perder seu estado de equipado;
- um pet pode existir, mas perder estágio, personalidade ou progressão;
- um compromisso pode existir, mas deixar de pausar corretamente o namoro;
- uma denúncia pode existir sem a evidência necessária à moderação.

Cada domínio terá invariantes semânticos próprios.

### 3.2 Origem permanece autoritativa até o corte aprovado

Durante a migração:

- a fonte atual continua sendo a fonte de verdade;
- o novo modelo é inicialmente uma projeção;
- divergências não são resolvidas silenciosamente a favor do novo;
- troca de autoridade exige critério de aceitação e registro;
- o ponto exato de corte deve ser conhecido.

### 3.3 Identidades estáveis

Sempre que tecnicamente possível, preservar:

- `auth.users.id`;
- `profiles.id`/`user_id` conforme contrato publicado;
- IDs de matches e mensagens;
- IDs de transações;
- IDs de instâncias de pet;
- IDs de itens possuídos;
- IDs de compromissos, denúncias e tickets;
- timestamps originais.

Se um novo identificador for inevitável, manter tabela de correspondência imutável e auditável.

### 3.4 Migrations aditivas primeiro

Na fase de expansão, é permitido conceitualmente:

- criar tabela;
- criar coluna opcional;
- criar índice de forma segura;
- criar view de compatibilidade;
- criar função versionada;
- adicionar constraint inicialmente não validada, quando apropriado;
- adicionar policy devidamente testada.

Não é permitido nessa fase:

- apagar coluna;
- renomear objeto usado em produção sem compatibilidade;
- alterar enum de forma destrutiva;
- reutilizar uma coluna com novo significado;
- tornar coluna obrigatória antes do backfill;
- apagar histórico por parecer “antigo”.

### 3.5 Backfill idempotente

Todo backfill futuro deve:

- poder ser executado novamente sem duplicar registros;
- trabalhar em lotes;
- registrar progresso;
- tolerar interrupção;
- possuir chave determinística;
- respeitar limites operacionais;
- produzir relatório de inseridos, ignorados e divergentes;
- nunca depender de ordem implícita;
- evitar manter transação longa sobre toda a base.

### 3.6 Dual-write é exceção

Escrita dupla cria duas fontes potencialmente divergentes. Só deve existir quando não houver alternativa por:

- view;
- adapter de leitura;
- trigger temporário bem testado;
- projeção derivada;
- janela curta de manutenção.

Quando indispensável, dual-write terá:

- dono;
- prazo de retirada;
- idempotency key;
- telemetria;
- política para falha parcial;
- reconciliador;
- teste de concorrência;
- ordem explícita de autoridade.

### 3.7 Remoção lógica precede remoção física

Aposentar uma feature significa primeiro:

1. bloquear novas aquisições ou criação;
2. retirar entradas de navegação;
3. manter leitura administrativa;
4. exportar e classificar dados;
5. resolver compensações;
6. observar dependências residuais;
7. arquivar conforme retenção;
8. somente depois considerar exclusão física.

### 3.8 RLS não pode ser afrouxada para facilitar migração

Scripts privilegiados deverão operar com:

- ambiente autorizado;
- escopo mínimo;
- consultas e mudanças previamente revisadas;
- logs de execução;
- dry-run quando possível;
- validação pós-execução.

Não se deve tornar tabelas públicas temporariamente.

### 3.9 Dados reais não serão usados em ambientes inseguros

Testes de restauração e migração devem usar:

- projeto descartável protegido;
- dados sintéticos; ou
- cópia devidamente anonimizada e controlada.

Mensagens, fotos, documentos de verificação, denúncias e conteúdo privado não devem ser baixados para dispositivos pessoais sem necessidade e autorização.

---

## 4. Pré-condições antes da primeira migration futura

Nenhuma mudança de schema da reestruturação deve começar antes de:

1. corrigir os riscos P0 do Item 2;
2. executar o inventário somente leitura do Item 3 no Supabase publicado;
3. comparar banco real, migrations e tipos gerados;
4. registrar todos os buckets reais e policies;
5. confirmar rotinas de backup/PITR disponíveis no plano contratado;
6. realizar uma restauração ensaiada em ambiente isolado;
7. definir ambiente de staging representativo;
8. estabilizar instalação e CI;
9. executar testes RLS com credenciais próprias de teste;
10. criar testes de caracterização dos fluxos críticos;
11. definir responsáveis, janela e protocolo de incidente;
12. congelar mudanças paralelas no domínio durante cada corte crítico.

### 4.1 Evidências obrigatórias

Antes da execução, deverá existir um pacote datado contendo:

- commit do frontend/backend;
- versão dos tipos gerados;
- inventário publicado de tabelas, views, funções, triggers e policies;
- contagens por tabela;
- contagens por status relevante;
- checks de órfãos;
- checksum ou assinatura lógica de conjuntos críticos;
- inventário de Storage;
- lista de subscriptions Realtime;
- configuração de secrets sem expor seus valores;
- resultado dos testes de restauração;
- plano e responsável pelo rollback.

### 4.2 Bloqueadores absolutos

Interromper a migração se:

- backup não puder ser confirmado;
- restauração não tiver sido testada;
- schema publicado divergir sem explicação;
- funções econômicas críticas ainda estiverem expostas indevidamente;
- testes RLS falharem;
- houver órfãos graves não classificados;
- o script não for idempotente;
- não houver métrica para detectar perda ou duplicação;
- uma mudança destrutiva estiver misturada à expansão.

---

## 5. Classificação dos dados

### 5.1 Classe A — identidade e acesso

Inclui:

- usuário de autenticação;
- perfil base;
- cargos;
- aceite de termos;
- status da conta;
- verificações;
- advertências, apelações e solicitações administrativas.

**Tolerância a perda:** zero.  
**Tolerância a associação incorreta:** zero.  
**Rollback:** obrigatório.

### 5.2 Classe B — comunicação e relacionamentos

Inclui:

- interesses;
- matches;
- mensagens;
- leitura;
- bloqueios;
- denúncias;
- Propósito Firmado;
- cápsulas;
- recados anônimos;
- chat comunitário;
- suporte.

**Tolerância a perda:** zero.  
**Risco especial:** privacidade, autoria, ordem temporal e evidência.

### 5.3 Classe C — valor econômico e propriedade digital

Inclui:

- moedas;
- razão de transações;
- XP;
- presentes;
- itens comprados ou recebidos;
- inventários;
- equipamentos;
- brindes, caixas e recompensas.

**Tolerância a perda:** zero.  
**Tolerância a duplicação:** zero.  
**Risco especial:** inflação, saldo negativo, dupla concessão e disputa do usuário.

### 5.4 Classe D — progressão e subprodutos

Inclui:

- pets;
- cuidado;
- missões;
- expedições;
- buffs;
- prestígio;
- álbum;
- Pet Arcade;
- streaks e conquistas.

**Tolerância a perda:** zero para propriedade e progresso persistente.  
**Risco especial:** estados distribuídos entre várias tabelas.

### 5.5 Classe E — conteúdo e mídia

Inclui:

- fotos;
- imagens de catálogo;
- fundos;
- assets de presentes e pets;
- devocionais;
- pedidos de oração;
- comentários;
- notícias e conteúdo editorial.

**Tolerância a perda:** zero para conteúdo do usuário e conteúdo publicado ativo.  
**Risco especial:** referência no banco continuar existindo após objeto desaparecer.

### 5.6 Classe F — derivado, cache e operacional

Inclui:

- caches locais;
- filas reprocessáveis;
- projeções recriáveis;
- métricas derivadas;
- previews e temporários.

Pode ser reconstruído somente quando a origem e o algoritmo estiverem preservados. “Derivado” não significa automaticamente “descartável”.

---

## 6. Registro canônico de migração

Cada mudança futura deverá possuir uma ficha:

| Campo | Obrigatório |
|---|---|
| ID da migração | identificador único e imutável |
| Domínio | dono funcional |
| Origem | tabelas, colunas, buckets e funções atuais |
| Destino | estruturas novas ou adaptadas |
| Transformação | regra determinística de conversão |
| Autoridade | fonte de verdade antes/durante/depois |
| Invariantes | condições que nunca podem quebrar |
| Volume esperado | linhas, bytes e usuários afetados |
| Backfill | lotes, cursor e idempotência |
| Compatibilidade | leitura/escrita velha e nova |
| Verificação | contagens, checks e amostras |
| Segurança | RLS, privilégios e dados sensíveis |
| Rollout | flag, percentual e duração |
| Rollback | ação e limite temporal |
| Contração | pré-condições para remover legado |
| Responsável | pessoa ou equipe aprovadora |

Nenhuma migration deve existir apenas como SQL sem esta intenção documentada.

---

## 7. Estratégia geral em nove fases

### Fase 0 — congelar o retrato

- confirmar commit;
- capturar schema e métricas;
- registrar bugs conhecidos;
- impedir mudanças concorrentes no domínio;
- abrir janela de observação.

### Fase 1 — ensaiar

- restaurar cópia segura em staging;
- executar dry-run;
- medir duração e locks;
- testar interrupção e retomada;
- executar reconciliação;
- testar rollback.

### Fase 2 — expandir

- adicionar estruturas novas sem remover antigas;
- criar índices e constraints com estratégia segura;
- configurar RLS antes de expor objetos;
- gerar novos tipos;
- publicar código ainda sem ativar a nova leitura.

### Fase 3 — preencher

- executar backfill em lotes;
- registrar cursor e erros;
- reprocessar somente divergentes;
- preservar timestamps e identificadores;
- não bloquear todo o produto.

### Fase 4 — sincronizar

- manter novos eventos alinhados durante a janela;
- preferir projeção/trigger temporário a dual-write no cliente;
- monitorar atraso;
- reconciliar continuamente.

### Fase 5 — comparar

- contar;
- verificar órfãos;
- comparar chaves;
- validar invariantes;
- revisar amostra dirigida;
- gerar relatório assinado.

### Fase 6 — alternar leitura

- ativar por flag para equipe;
- ampliar para pequena coorte;
- comparar resultados sombra;
- acompanhar erros, latência e divergência;
- retornar à leitura antiga por flag se necessário.

### Fase 7 — alternar autoridade de escrita

- somente após paridade comprovada;
- registrar instante de corte;
- manter compatibilidade do leitor antigo;
- observar ao menos uma janela completa de uso;
- não contrair schema.

### Fase 8 — estabilizar e contrair depois

- encerrar sincronização temporária;
- manter legado read-only;
- cumprir retenção;
- aprovar remoção em mudança separada;
- criar backup/arquivo final;
- remover apenas consumidores comprovadamente inexistentes.

---

## 8. Identidade, autenticação e perfis

### 8.1 Objetos protegidos

- `auth.users`;
- `profiles`;
- `profile_advanced`;
- `profile_preferences`;
- `profile_photos`;
- `terms_acceptances`;
- `user_roles`;
- `verification_requests`;
- `photo_moderation_log`;
- `photo_moderation_queue`;
- solicitações, avisos e apelações administrativas.

### 8.2 Invariantes

1. cada perfil continua ligado ao mesmo usuário autenticado;
2. nenhum usuário recebe cargo por migração;
3. aprovação, banimento e verificação não mudam silenciosamente;
4. foto principal continua pertencendo à pessoa correta;
5. ordem e visibilidade das fotos são preservadas;
6. aceite de termos mantém versão e timestamp;
7. dados românticos não se tornam públicos no perfil comunitário;
8. campos ausentes não recebem valores inventados.

### 8.3 Separação de perfil comunitário e romântico

A separação definida no Item 5 deve ser inicialmente aditiva.

Recomendação:

- identidade compartilhada continua em `profiles`;
- estados comunitários e românticos ganham contratos próprios;
- dados atuais são projetados para o novo modelo por regras documentadas;
- usuários existentes preservam disponibilidade atual até revisão consciente;
- novos usuários entram primeiro na comunidade;
- nenhum campo atual é reutilizado com significado incompatível.

### 8.4 Verificação

- número de usuários autenticados × perfis esperados;
- perfis sem usuário e usuários sem perfil;
- distribuição de status antes/depois;
- cargos por tipo;
- fotos por usuário e posição;
- verificações por estado;
- campos comunitários/românticos sem vazamento de privacidade.

### 8.5 Rollback

Desligar o novo renderizador e as novas capacidades deve devolver a aplicação ao perfil atual sem reversão de dados. Colunas/tabelas novas permanecem inertes até correção.

---

## 9. Comunidade, vínculos sociais e descoberta

### 9.1 Migração aditiva

Feed, espaços, eventos, seguidores e conexões serão entidades novas. Não devem ser inferidos retroativamente de matches.

Regras:

- match não vira amizade automaticamente;
- conversa romântica não vira conversa social automaticamente;
- participação no chat global pode indicar presença histórica, não consentimento para conexão;
- staff não ganha seguidores/conexões artificiais;
- usuários bloqueados não podem ser conectados por backfill;
- contadores serão derivados de relações, não escritos como verdade isolada.

### 9.2 Chat comunitário atual

`global_messages` deve continuar operando durante a criação do novo domínio Comunidade.

- mensagens antigas permanecem no mesmo espaço histórico;
- autoria, cargo exibido e moderação são preservados;
- o novo feed não substitui automaticamente o chat;
- stickers e reações existentes não são reinterpretados;
- denúncias e flags continuam ligadas à evidência original.

### 9.3 Invariantes

- desligar namoro não remove presença comunitária;
- compromisso ativo não apaga participação social;
- bloqueio global prevalece em feed, grupos, eventos, cinema e mensagens;
- novas relações sociais exigem consentimento conforme tipo;
- conteúdo removido pela moderação não reaparece por migração.

---

## 10. Namoro, interesses, matches e mensagens

### 10.1 Objetos protegidos

- `interests`;
- `matches`;
- `messages`;
- `blocks`;
- `reports`;
- `message_flags`;
- estados de entregue/lido;
- referências a anexos e respostas.

### 10.2 Invariantes de interesse e match

1. os dois participantes permanecem os mesmos;
2. um par lógico não deve ganhar dois matches ativos por migração;
3. direção e data dos interesses são preservadas;
4. bloqueio prevalece sobre descoberta e contato;
5. unmatch não é revertido;
6. match histórico não reativa namoro;
7. status não é recalculado apenas pelo conteúdo atual da tela.

### 10.3 Invariantes de mensagens

1. `sender_id` não muda;
2. conversa/match de destino não muda;
3. `created_at` mantém a ordem histórica;
4. resposta continua apontando para a mensagem correta;
5. entregue/lido não volta para não lido;
6. mensagens moderadas ou removidas mantêm estado e trilha;
7. nenhuma mensagem privada entra em índice ou feed público;
8. anexos continuam acessíveis somente a quem tem permissão;
9. reprocessamento não duplica envio nem notificação.

### 10.4 Conversas sociais futuras

O modelo futuro deverá tipar contexto sem reclassificar automaticamente o passado.

Estratégia segura:

- conversas existentes ligadas a match recebem contexto romântico derivado;
- conversa global continua comunitária;
- novas conversas sociais usam entidade/canal próprio;
- contexto desconhecido fica explicitamente `legacy_unknown`, nunca presumido;
- a caixa pode unificar visualmente, mas o banco mantém distinção.

### 10.5 Verificação

- matches por status e participante;
- pares duplicados;
- mensagens por match;
- mensagens órfãs;
- respostas órfãs;
- leitura por usuário;
- bloqueios simétricos no efeito, mesmo quando registro é direcional;
- amostras de conversas antigas, ativas, encerradas e moderadas.

### 10.6 Realtime durante migração

- não publicar simultaneamente origem e projeção para o mesmo evento sem deduplicação;
- usar ID estável como chave de reconciliação;
- invalidar queries de forma canônica;
- testar reconexão, atraso e evento fora de ordem;
- evitar que backfill dispare push ou notificação ao usuário.

---

## 11. Propósito Firmado e cápsulas do casal

### 11.1 Objetos protegidos

- `relationship_commitments`;
- `couple_time_capsules`;
- vínculos com match e participantes;
- status, solicitação, aceite, encerramento e timestamps;
- efeitos atuais sobre descoberta e conversas.

### 11.2 Invariantes

1. um compromisso continua ligado às mesmas duas pessoas;
2. status ativo não é perdido nem duplicado;
3. datas originais são mantidas;
4. cápsulas continuam ligadas ao compromisso correto;
5. conteúdo privado continua privado;
6. pessoa comprometida não volta a Pretendentes por falha de migração;
7. a comunidade permanece disponível no modelo futuro;
8. encerrar não reativa namoro automaticamente;
9. matches antigos são arquivados, não apagados;
10. nenhuma pessoa pode ganhar dois compromissos ativos incompatíveis.

### 11.3 Mudança do efeito sistêmico

Hoje páginas podem retornar listas vazias ao detectar compromisso ativo. No modelo futuro, o efeito será orquestrado por domínio.

Migração segura:

1. preservar `relationship_commitments` como verdade;
2. criar uma projeção de disponibilidade romântica;
3. comparar projeção com comportamento atual;
4. ativar nova capacidade somente no namoro;
5. manter comunidade independente;
6. não editar o compromisso para representar estado comunitário.

### 11.4 Casos de teste

- solicitação pendente;
- compromisso ativo;
- compromisso encerrado;
- cápsula futura;
- bloqueio entre ex-participantes;
- conta banida;
- um participante excluído conforme política;
- tentativa concorrente de criar dois compromissos.

---

## 12. Recados anônimos

### 12.1 Objetos protegidos

- `anonymous_messages`;
- `anonymous_message_settings`;
- `anonymous_message_hints`;
- `anonymous_hint_options`;
- `anonymous_message_reports`;
- views de inbox/outbox;
- transações eventualmente associadas.

### 12.2 Regras

- permanecem exclusivamente no namoro;
- opt-in futuro não apaga recados antigos;
- remetente real continua protegido do destinatário, mas rastreável pela moderação;
- revelação válida não é revertida;
- denúncia mantém evidência;
- bloqueio encerra progressão;
- nenhuma migração força revelação;
- compra de dica não pode ser cobrada duas vezes.

### 12.3 Validação

- recados por status;
- dicas por recado;
- remetentes/destinatários existentes;
- denúncias por recado;
- settings ausentes tratados com padrão seguro;
- transações reconciliadas com extras entregues.

---

## 13. Economia, moedas e XP

### 13.1 Fontes protegidas

- `user_coins`;
- `coin_transactions`;
- `user_xp`;
- `xp_events`;
- starter bundle;
- freebies;
- doações;
- conquistas e badges;
- RPCs atômicas legítimas.

### 13.2 Princípio contábil

`coin_transactions` deve funcionar como razão auditável. `user_coins` é o saldo materializado/atual.

Nenhuma migração pode:

- recalcular saldo apenas com o número mostrado na interface;
- criar crédito compensatório sem transação correspondente;
- apagar transações por serem antigas;
- alterar sinal ou unidade;
- converter moeda silenciosamente;
- permitir escrita direta do cliente.

### 13.3 Invariantes econômicos

1. saldo antes + movimentos válidos = saldo depois, conforme regra canônica;
2. cada operação possui ID/idempotency key;
3. nenhuma compra é cobrada duas vezes;
4. nenhuma recompensa é concedida duas vezes;
5. saldo não fica negativo fora de regra explicitamente permitida;
6. transação preserva usuário, motivo, valor e timestamp;
7. ações administrativas preservam ator e justificativa;
8. XP não diminui por migração;
9. nível é derivado da mesma curva/versionamento;
10. rollback visual não reverte uma compra já concluída.

### 13.4 Reconciliação

Produzir, por usuário:

- saldo materializado;
- soma auditável por categoria;
- primeiro e último evento;
- operações duplicadas;
- chaves ausentes;
- saldo negativo;
- diferença absoluta;
- classificação da divergência.

Divergências devem entrar em fila de revisão; não se deve “corrigir” todos os saldos com uma regra genérica sem entender o histórico.

### 13.5 Corte seguro

- corrigir RPCs críticas antes;
- criar funções versionadas;
- testar concorrência;
- ativar para equipe;
- executar compras/recompensas sintéticas;
- comparar razão e saldo;
- liberar gradualmente;
- manter função antiga bloqueada ou compatível até estabilização.

---

## 14. Loja, presentes, inventários e personalização

### 14.1 Objetos protegidos

- catálogos ativos e inativos;
- `virtual_gifts` e `gift_transactions`;
- `avatar_decorations` e `user_decorations`;
- `profile_backgrounds` e `user_profile_backgrounds`;
- `name_gradients` e `user_name_gradients`;
- stickers e categorias;
- badges e conquistas;
- estado de equipado;
- preço pago e origem da aquisição quando disponível.

### 14.2 Invariantes de inventário

1. item possuído continua pertencendo ao mesmo usuário;
2. item único não duplica;
3. item consumível mantém quantidade correta;
4. item equipado continua equipado quando ainda compatível;
5. item removido do catálogo continua no histórico do comprador;
6. mudança de preço não altera transação passada;
7. presente mantém remetente, destinatário, estado e valor;
8. resgate não acontece duas vezes;
9. item gratuito não vira compra paga;
10. desligar namoro não remove personalização.

### 14.3 Separação de catálogo e propriedade

Catálogo pode mudar; propriedade do usuário é registro histórico.

Logo:

- desativar item não apaga posse;
- substituir asset exige compatibilidade visual ou versão;
- renomear categoria não altera tipo econômico;
- novo perfil Steam consome inventário existente por adapter;
- módulos do perfil não devem ser condicionados à presença na loja.

### 14.4 Presentes

Na futura separação social/romântica, adicionar contexto de forma aditiva:

- registros antigos mantêm contexto legado;
- não presumir que todo presente foi romântico;
- contexto novo não modifica valor ou resgate;
- bloqueio impede novos envios, não apaga histórico;
- privacidade controla exibição, não existência contábil.

---

## 15. Protocolo de retirada do avatar-personagem

### 15.1 Escopo exato que será aposentado

- `avatar_bases`;
- `avatar_categories`;
- `avatar_items`;
- `user_avatar_base`;
- `user_avatar_equipped`;
- `user_avatar_inventory`;
- `user_avatar_looks`;
- `purchase_avatar_item` e consumidores exclusivos confirmados.

### 15.2 Escopo que obrigatoriamente permanece

- foto principal em `profiles`;
- `profile_photos`;
- moderação de fotos;
- escopo de moderação chamado `avatar`;
- componente visual de foto decorada;
- `avatar_decorations`;
- `user_decorations`;
- molduras;
- auras;
- fundos de perfil;
- gradientes de nome;
- presentes e stickers.

### 15.3 Fase A — inventariar

Levantar:

- usuários com base criada;
- usuários com itens comprados;
- usuários com itens gratuitos;
- itens equipados;
- moedas gastas;
- recompensas concedidas em outros sistemas;
- assets no Storage;
- componentes, rotas, hooks, RPCs, policies e admin consumidores;
- referências em missões, caixas, conquistas e notificações.

### 15.4 Fase B — bloquear expansão

- impedir novos itens no catálogo;
- desativar novas compras;
- retirar recompensas futuras que concedem itens do personagem;
- manter visualização e suporte;
- comunicar a decisão antes de qualquer compensação.

### 15.5 Fase C — política de compensação

Deve ser decidida explicitamente, com opções como:

- reembolso integral em moedas;
- conversão para créditos de personalização do perfil;
- item comemorativo equivalente;
- preservação histórica sem restituição para itens gratuitos;
- combinação baseada na origem do item.

Regras mínimas:

- compensação é idempotente;
- uma linha por direito convertido;
- transação econômica correspondente;
- itens pagos e gratuitos não são confundidos;
- usuário não recebe duas vezes;
- relatório administrativo e canal de suporte;
- data de corte pública.

### 15.6 Fase D — retirar consumo do produto

- remover rota e entradas por flag;
- substituir referências do perfil;
- manter ferramenta administrativa read-only;
- confirmar zero chamadas às RPCs antigas;
- observar por janela definida;
- preservar exportação por usuário.

### 15.7 Fase E — arquivar

Criar um snapshot protegido contendo:

- propriedade por usuário;
- base/look/equipamentos;
- catálogo e preços;
- origem/compensação;
- assets necessários à auditoria;
- versão do schema;
- checksum e data.

### 15.8 Fase F — considerar contração

Somente após:

- compensações concluídas;
- disputas resolvidas;
- zero consumidores por período acordado;
- backup restaurável;
- aprovação de produto, segurança e dados;
- migration destrutiva isolada;
- teste de restauração;
- confirmação de que “avatar” remanescente significa foto/decoração.

### 15.9 Testes antiacidente

- foto principal continua aparecendo;
- upload e moderação de foto funcionam;
- moldura e aura continuam equipadas;
- fundos e gradientes continuam no perfil;
- loja não mostra categoria aposentada;
- saldo compensado reconcilia;
- recompensas não concedem item inexistente;
- admin não chama tabela removida;
- tipos gerados não eliminam campos legítimos por engano.

---

## 16. Pets: catálogo, instâncias e cuidado

### 16.1 Regra de coexistência

`user_pets` e `user_pets_v2` coexistem. Até confirmação publicada:

- não declarar uma como obsoleta;
- não copiar cegamente todas as linhas;
- não unir por nome do pet;
- não apagar duplicatas aparentes;
- mapear origem, chaves e consumidores;
- identificar se uma é catálogo legado, projeção ou instância histórica.

### 16.2 Objetos protegidos

Todos os 40 objetos catalogados no Item 3, incluindo:

- catálogos e variantes;
- instâncias do usuário;
- personalidade e benefícios;
- cenários;
- estado e eventos de cuidado;
- streaks;
- buffs e eventos aleatórios;
- missões e confissões;
- prestígio, renascimento e desbloqueios;
- expedições;
- álbum, pacotes e recompensas.

### 16.3 Invariantes por instância

1. mesmo dono;
2. mesma espécie/variante;
3. mesmo estágio de vida;
4. nome e criação preservados;
5. progressão não regride;
6. prestígio e renascimentos permanecem auditáveis;
7. necessidades respeitam timestamps e regra de decaimento;
8. benefícios não duplicam;
9. cenário equipado permanece compatível;
10. missões e expedições não podem ser resgatadas novamente;
11. stickers e recompensas do álbum mantêm unicidade;
12. histórico de cuidado não dispara recompensa em backfill.

### 16.4 Tempo e decaimento

Migração não deve materializar horas offline como múltiplos eventos falsos.

É necessário preservar:

- timestamp da última atualização;
- timezone/uso de UTC;
- limites mínimo e máximo;
- versão da fórmula;
- cooldowns;
- eventos já consumidos.

### 16.5 Benefícios e economia

- buffs não são recalculados duas vezes;
- concessão de moeda/XP continua no backend;
- backfill não aciona triggers de recompensa indevidamente;
- recompensas são marcadas como migradas, não recém-conquistadas;
- inventário de cuidado não é confundido com inventário da loja.

### 16.6 Verificação

Por usuário e pet:

- existência;
- dono;
- espécie/variante/estágio;
- nível/XP/prestígio;
- necessidades;
- cenário;
- perks/buffs;
- missões e claims;
- expedições e claims;
- álbum e recompensas;
- referências órfãs.

---

## 17. Pet Arcade, caixas e sorteios

### 17.1 Princípio

Histórico de rodada é evidência econômica. Não deve ser descartado como telemetria comum.

### 17.2 Objetos protegidos

- configurações e versões;
- rodadas;
- eventos de jogo;
- resultados;
- entradas/custos;
- recompensas;
- limites diários;
- missões;
- ovos e tesouros;
- Grab pools, pity, cooldowns, inventário e logs.

### 17.3 Invariantes

1. rodada concluída não pode finalizar novamente;
2. recompensa resgatada não pode ser resgatada novamente;
3. rodada pendente preserva possibilidade legítima de retomada;
4. custo e prêmio reconciliam com o razão econômico;
5. seed/resultado não é recalculado no frontend;
6. pity e cooldown não reiniciam;
7. limite diário não zera durante o dia por migração;
8. configuração usada na rodada histórica continua identificável;
9. backfill não publica animação/push de vitória;
10. lazy loading do frontend não altera contrato do resultado.

### 17.4 Versão de regras

Quando uma mecânica mudar, registrar versão. Uma rodada antiga deve ser interpretada segundo a configuração vigente quando começou, não pelas regras atuais.

### 17.5 Reconciliação econômica

Para cada rodada paga:

- uma entrada/custo esperado;
- zero ou uma finalização válida;
- prêmio compatível;
- zero ou um claim quando necessário;
- transações correspondentes;
- nenhuma duplicação por retry.

---

## 18. Conteúdo cristão e interações

### 18.1 Objetos protegidos

- devocionais/daily posts;
- comentários, reações e curtidas;
- pedidos de oração;
- marcações de oração;
- denúncias;
- perguntas de quiz;
- tentativas do usuário;
- palavras restritas.

### 18.2 Invariantes

- autoria e moderação permanecem;
- contagem é derivada das relações reais;
- reação única não duplica;
- “orei” não duplica por backfill;
- pedido privado não se torna público;
- conteúdo removido não reaparece;
- tentativa de quiz preserva resultado e data;
- mudança editorial não altera tentativa histórica;
- palavras restritas continuam disponíveis à moderação.

### 18.3 Migração para uma Comunidade integrada

Conteúdo pode ganhar novos pontos de entrada, mas os registros existentes não devem ser copiados como posts duplicados. Preferir referências/projeções com ID de origem.

---

## 19. Moderação, bloqueios, denúncias e suporte

### 19.1 Evidência é dado protegido

Preservar:

- denunciante e alvo;
- contexto;
- conteúdo/referência;
- timestamps;
- decisões;
- moderador responsável;
- apelações;
- anexos;
- trilha de status.

### 19.2 Regras

- bloqueio global continua prevalecendo;
- migração não desbloqueia usuários;
- registros anonimizados ao usuário continuam rastreáveis internamente conforme política;
- evidência não pode ser exposta ao denunciado por uma nova view;
- cargos não podem ganhar acesso geral a mensagens privadas;
- tickets mantêm prioridade, categoria e histórico;
- remoção de conta segue retenção e obrigações definidas, não `CASCADE` improvisado.

### 19.3 Verificação de autorização

Testar cada novo objeto como:

- anônimo;
- usuário dono;
- outro usuário;
- usuário bloqueado;
- moderador;
- suporte;
- admin;
- super admin;
- service role somente em fluxo interno autorizado.

---

## 20. Notificações, push e filas

### 20.1 Separar fato de entrega

A notificação representa um evento destinado ao usuário. Push é um canal de entrega.

- migrar notificação não deve reenviar push;
- backfill não entra automaticamente em `push_queue`;
- subscription expirada não é reativada;
- preferências de categoria são preservadas;
- conteúdo sensível não passa a aparecer na tela bloqueada.

### 20.2 Endpoint crítico

Antes de qualquer migração relacionada:

- proteger o dispatcher com segredo/assinatura;
- aceitar somente método necessário;
- aplicar rate limit;
- impedir concorrência duplicada;
- registrar tentativas;
- assegurar idempotência do envio.

### 20.3 Invariantes

- uma notificação lógica possui ID estável;
- retry não duplica entrega indevidamente;
- estado lido não regride;
- link continua apontando para rota válida ou adapter;
- usuário não recebe evento privado de outro usuário;
- mudança de rotas mantém redirecionamento compatível.

---

## 21. Storage e mídia

### 21.1 Inventário antes da mudança

Para cada bucket real, registrar:

- nome;
- público/privado;
- MIME types;
- limite de tamanho;
- policies;
- número de objetos;
- bytes totais;
- prefixos usados;
- tabelas que guardam referências;
- objetos sem referência;
- referências sem objeto.

### 21.2 Buckets declarados

O Item 3 identificou oito buckets nas migrations, incluindo fotos, imagens de presentes, fundos e assets de pets. O estado publicado deve ser consultado antes de considerar essa lista absoluta.

### 21.3 Migração de objeto

- copiar antes de trocar referência;
- verificar tamanho e hash;
- preservar metadata necessária;
- manter objeto antigo durante a janela;
- atualizar referências por lote;
- não tornar bucket privado em público para simplificar;
- testar URL assinada e cache;
- remover somente após relatório de zero referências.

### 21.4 Mídia pesada futura

Vídeos da Sala de Cinema e assets grandes ficarão em Storage/CDN, não no Git.

Requisitos futuros:

- upload resiliente;
- processamento/transcodificação;
- versão e status;
- acesso autorizado;
- expiração/retention;
- moderação;
- limpeza de upload abandonado;
- contabilização de espaço;
- nenhum download público acidental.

### 21.5 Service Worker e cache

Ao trocar URLs ou versões:

- incrementar versão de cache;
- manter fallback durante rollout;
- não servir imagem privada de cache a outra sessão;
- limpar caches legados seletivamente;
- testar atualização de PWA instalada;
- evitar cachear resposta autenticada como pública.

---

## 22. RLS, funções, triggers e enums

### 22.1 RLS

Cada novo objeto nasce com:

- RLS ativada;
- policy mínima;
- teste negativo;
- teste por cargo;
- validação de ownership;
- tratamento de bloqueio quando aplicável.

### 22.2 `SECURITY DEFINER`

Antes de copiar ou versionar função:

- fixar `search_path` seguro;
- validar `auth.uid()`;
- validar cargo/capacidade;
- validar parâmetros;
- restringir `EXECUTE`;
- impedir chamada direta de helper interno;
- testar abuso e concorrência;
- registrar operação sensível.

### 22.3 Triggers

Backfills podem acionar triggers indevidamente. Para cada tabela, documentar:

- triggers ativos;
- efeitos colaterais;
- notificações;
- recompensas;
- timestamps automáticos;
- cascatas;
- comportamento em `INSERT ... ON CONFLICT`.

Não desativar triggers globalmente sem plano e sem substituir os invariantes que eles garantem.

### 22.4 Enums

- não remover valor ainda usado;
- não reutilizar rótulo com novo significado;
- adicionar valor com compatibilidade;
- migrar linhas antes de descontinuar valor;
- atualizar tipos frontend e testes;
- manter adapter para clientes antigos durante rollout.

---

## 23. Backups, restauração e retenção

### 23.1 Backup não é prova até restaurar

Antes de cortes críticos, confirmar:

- backup de banco;
- capacidade de point-in-time recovery quando disponível;
- snapshot/inventário de Storage;
- commit e artefatos implantados;
- secrets/configuração recuperáveis por processo seguro;
- tempo estimado de restauração.

### 23.2 Ensaio de restauração

O ensaio deve provar:

- schema sobe;
- dados relacionam corretamente;
- auth/identidades podem ser representadas com segurança;
- funções e policies compilam;
- Storage é recuperável ou referenciável;
- testes críticos passam;
- relatório de contagem coincide;
- equipe conhece o procedimento.

### 23.3 Retenção

Definir por classe:

- dados ativos;
- histórico econômico;
- mensagens e relacionamentos;
- evidência de moderação;
- logs operacionais;
- dados de feature aposentada;
- backups;
- solicitações de exclusão.

Retenção precisa considerar produto, privacidade e obrigações aplicáveis; este plano não inventa prazo legal.

---

## 24. Validação quantitativa e semântica

### 24.1 Camada 1 — estrutura

- objetos esperados existem;
- tipos e nulabilidade corretos;
- constraints presentes;
- índices presentes;
- policies e grants corretos;
- funções com assinatura correta.

### 24.2 Camada 2 — contagem

- total por tabela;
- total por status;
- total por usuário/domínio;
- total por período;
- total de objetos no Storage;
- total de relações órfãs.

### 24.3 Camada 3 — identidade

- conjunto de IDs origem = conjunto de IDs destino, quando 1:1;
- mapeamentos completos quando N:1/1:N;
- nenhum ID duplicado;
- timestamps preservados.

### 24.4 Camada 4 — invariantes

- economia reconcilia;
- mensagens preservam conversa e ordem;
- inventário preserva posse/equipamento;
- compromisso preserva casal/status;
- pet preserva dono/progressão;
- rodada preserva custo/prêmio/claim;
- bloqueio preserva efeito global.

### 24.5 Camada 5 — amostra dirigida

Selecionar casos, não apenas amostra aleatória:

- usuário antigo e novo;
- perfil incompleto e completo;
- membro comum e staff;
- usuário banido;
- usuário com muitos itens;
- saldo zero, alto e divergente;
- match sem mensagens e com muitas mensagens;
- propósito ativo e encerrado;
- pet bebê, adulto e prestigiado;
- rodada pendente e concluída;
- arquivos HEIC/JPEG/WebP quando aplicável.

### 24.6 Resultado permitido

Cada verificação termina em:

- `PASS` — igualdade/invariante comprovada;
- `EXPECTED_DIFF` — diferença prevista e documentada;
- `REVIEW` — requer decisão humana;
- `FAIL` — bloqueia corte.

Não usar “parece correto”.

---

## 25. Observabilidade durante rollout

### 25.1 Métricas técnicas

- erros por versão e rota;
- falhas RLS/RPC;
- latência p50/p95/p99;
- deadlocks/timeouts;
- atraso de sincronização;
- divergência origem/destino;
- duplicação de evento;
- falhas de Storage;
- canais Realtime e reconexões;
- tamanho de filas.

### 25.2 Métricas de integridade

- diferenças de saldo;
- compras sem item;
- itens sem aquisição válida;
- mensagens órfãs;
- matches duplicados;
- compromissos conflitantes;
- pets órfãos;
- claims duplicados;
- referências a arquivos ausentes;
- notificações reenviadas.

### 25.3 Privacidade dos logs

Logs devem usar IDs técnicos e códigos de erro. Não registrar texto integral de mensagens, fotos, documentos, oração ou conteúdo privado sem necessidade estrita.

---

## 26. Rollout por coortes

Ordem recomendada:

1. testes automatizados;
2. staging sintético;
3. equipe técnica;
4. super admins designados;
5. staff interno;
6. 1% de usuários elegíveis;
7. 5%;
8. 20%;
9. 50%;
10. 100%;
11. janela de estabilidade;
12. desativação do caminho antigo.

Percentuais são orientação e podem mudar conforme volume. Domínios econômicos e relacionais devem usar coortes mais conservadoras.

### 26.1 Critérios para avançar

- zero perda conhecida;
- zero divergência financeira não explicada;
- zero quebra de autorização;
- taxa de erro dentro do limite definido;
- latência aceitável;
- suporte sem padrão novo de reclamação;
- reconciliador sem crescimento de pendências;
- rollback testado.

### 26.2 Critérios para parar

- qualquer acesso cruzado a dados privados;
- saldo ou item duplicado;
- mensagem ligada à pessoa errada;
- propósito ativo ignorado;
- bloqueio contornado;
- pet/progresso perdido;
- volume crescente de órfãos;
- impossibilidade de reconciliar.

---

## 27. Estratégia de rollback

### 27.1 Rollback de apresentação

- desligar feature flag;
- voltar para componentes antigos;
- preservar estruturas novas;
- não desfazer transações válidas.

### 27.2 Rollback de leitura

- retornar origem como fonte;
- manter destino para diagnóstico;
- pausar backfill/sincronização;
- registrar instante de retorno.

### 27.3 Rollback de escrita

É mais delicado. Exige:

- saber quais escritas ocorreram após o corte;
- reproduzi-las com idempotência na origem quando necessário;
- reconciliar antes de reabrir;
- impedir escrita concorrente durante o ponto crítico;
- nunca restaurar backup apagando operações legítimas recentes sem plano.

### 27.4 Restauração completa

Último recurso para incidente severo. Deve considerar banco, Storage, auth, deploy e eventos externos. A decisão precisa de responsável claro e comunicação de incidente.

### 27.5 Contração não tem rollback simples

Por isso `DROP`, exclusão de objetos e limpeza de arquivos ficam muito depois do corte e em mudança separada.

---

## 28. Ordem recomendada das migrações futuras

### Onda 0 — segurança e verdade publicada

1. conter riscos críticos;
2. executar inventário real;
3. confirmar backups/restauração;
4. criar suíte de integridade.

### Onda 1 — fundação sem mudança de dados

1. contratos de domínio;
2. repositories/adapters;
3. feature flags;
4. telemetria;
5. testes de caracterização.

### Onda 2 — comunidade e namoro em paralelo

1. estados independentes;
2. capacidades;
3. onboarding comunitário;
4. projeção de namoro atual;
5. vínculos sociais novos;
6. caixas de conversa por contexto.

### Onda 3 — perfil modular

1. módulos e layout;
2. visibilidade;
3. adapter do inventário existente;
4. novo renderizador;
5. redesign estilo Steam;
6. configurações simples.

### Onda 4 — economia e inventário

1. corrigir/fechar RPCs;
2. versionar comandos;
3. reconciliar razão;
4. unificar contratos sem unificar tabelas prematuramente;
5. migrar leitura da Loja.

### Onda 5 — Pets e jogos

1. resolver mapa `user_pets`/`user_pets_v2`;
2. criar controller do Pet;
3. versionar regras do Arcade;
4. lazy loading;
5. reconciliar recompensas.

### Onda 6 — aposentadorias

1. avatar-personagem;
2. features redundantes aprovadas;
3. assets sem uso comprovado;
4. tabelas somente após retenção.

### Onda 7 — novas experiências

1. feed, grupos e eventos;
2. Sala de Cinema;
3. mídia pesada em Storage/CDN;
4. novas vitrines de perfil;
5. futuras experiências sociais.

---

## 29. Matriz resumida de preservação

| Domínio | Fonte atual | Invariante principal | Estratégia inicial | Contração |
|---|---|---|---|---|
| Identidade | auth + profiles | mesmo usuário/status/cargo | projeção aditiva | não prevista |
| Perfil | profiles + extensões | privacidade e fotos | adapter + novos módulos | muito posterior |
| Namoro | interests/matches | mesmos pares e estados | capacidades derivadas | não apagar histórico |
| Mensagens | messages | autoria, ordem e leitura | leitura compatível | nunca sem retenção |
| Propósito | commitments | mesmo casal/status | projeção de disponibilidade | preservar histórico |
| Comunidade | global/content | autoria e moderação | entidades novas | manter chat histórico |
| Economia | ledger + saldo | reconciliação exata | RPCs versionadas | ledger permanente |
| Inventário | ownership tables | posse/equipamento | adapter comum | item inativo permanece |
| Avatar-personagem | 7 tabelas | direito/compensação | aposentadoria em fases | somente após arquivo |
| Pets | 40 tabelas | dono e progressão | mapear legado/v2 | decisão futura |
| Arcade/Grab | rounds/logs | custo, resultado e claim | regras versionadas | manter histórico econômico |
| Storage | buckets + refs | objeto e referência | cópia verificada | após zero referência |
| Moderação | reports/logs | evidência e acesso | preservar IDs | segundo retenção |
| Push | queue/subscriptions | sem reenvio duplicado | separar evento/entrega | filas reprocessáveis |

---

## 30. Cenários obrigatórios de aceitação

### 30.1 Conta e perfil

- usuário antigo entra com a mesma conta;
- foto principal e galeria aparecem na ordem;
- membro banido continua bloqueado;
- moderador mantém apenas capacidades corretas;
- perfil comunitário não expõe campos românticos privados;
- `/inicio` e `/dashboard` permanecem distintos.

### 30.2 Namoro e comunidade

- usuário desliga namoro e continua na comunidade;
- usuário comprometido não aparece em Pretendentes;
- usuário comprometido continua em grupos/eventos/cinema;
- match antigo preserva mensagens;
- conexão social não cria match;
- bloqueio impede interação em todos os contextos.

### 30.3 Economia e inventário

- saldo coincide antes/depois;
- compra concorrente não duplica cobrança;
- recompensa com retry é concedida uma vez;
- moldura, aura, fundo e gradiente permanecem;
- presente mantém estado e participantes;
- avatar aposentado recebe compensação uma vez.

### 30.4 Pets e jogos

- pet mantém nome, espécie, estágio e progresso;
- cuidado não é contado novamente;
- expedição concluída não reabre;
- pacote do álbum não resgata de novo;
- pity/cooldown permanece;
- rodada pendente pode retomar legitimamente;
- rodada concluída não duplica prêmio.

### 30.5 Mensagens e Realtime

- mensagem aparece uma vez;
- resposta abre a referência correta;
- estado lido permanece;
- reconexão não duplica;
- backfill não envia push;
- usuário bloqueado não recebe evento privado.

### 30.6 PWA e Storage

- atualização de app instalado não quebra sessão;
- caches antigos são atualizados com segurança;
- imagens equipadas continuam disponíveis;
- arquivo privado exige autorização;
- URL antiga possui compatibilidade durante a janela;
- modo offline não fabrica confirmação de mutação.

---

## 31. Critério de pronto da migração de um domínio

Um domínio só está migrado quando:

- origem e destino estão documentados;
- backup e restauração foram provados;
- scripts são idempotentes;
- backfill terminou;
- nenhuma divergência `FAIL` permanece;
- diferenças esperadas estão justificadas;
- RLS/RPC passaram em testes negativos e positivos;
- invariantes semânticos passaram;
- coortes foram ampliadas sem incidente;
- leitura e escrita novas estão estáveis;
- caminho antigo ficou read-only pela janela definida;
- suporte e administração conseguem diagnosticar;
- rollback ainda é possível;
- contrato do domínio e tipos foram atualizados.

Reduzir o uso da tabela antiga não significa concluir a migração.

---

## 32. O que não fazer

- não criar banco novo e importar tudo em uma única virada;
- não reescrever o sistema inteiro antes de testar paridade;
- não renomear tabelas para “organizar” enquanto o produto as consome;
- não usar `DROP ... CASCADE` para limpar dependências;
- não transformar match em amizade automaticamente;
- não transformar conversas antigas em sociais sem evidência;
- não recalcular saldo pelo frontend;
- não reexecutar recompensas em backfill;
- não apagar transações antigas;
- não consolidar `user_pets`/`user_pets_v2` por aparência;
- não migrar mensagens sem preservar autoria e ordem;
- não disparar triggers de notificação durante backfill;
- não mover arquivos sem hash e verificação de referência;
- não tornar bucket público temporariamente;
- não desativar RLS para “facilitar”;
- não usar dados privados reais em ambiente informal;
- não apagar avatar-personagem junto com `avatar_decorations`;
- não confundir foto de perfil com personagem;
- não compensar usuários sem razão econômica;
- não remover legado no mesmo deploy do corte;
- não considerar contagem igual como prova suficiente;
- não misturar redesign, migração e correção crítica no mesmo PR.

---

## 33. Decisões fechadas neste Item 7

1. migrações serão progressivas e aditivas;
2. nenhuma contração ocorre na primeira fase;
3. origem permanece autoritativa até corte formal;
4. backfills serão idempotentes, em lotes e retomáveis;
5. dual-write será exceção temporária;
6. identificadores e timestamps serão preservados;
7. validação será quantitativa e semântica;
8. economia será reconciliada pelo razão;
9. mensagens preservarão autoria, ordem, leitura e contexto;
10. Propósito Firmado continuará como entidade própria;
11. comunidade e namoro serão migrados como estados independentes;
12. matches não serão convertidos automaticamente em conexões;
13. bloqueio continuará global;
14. `user_pets` e `user_pets_v2` não serão consolidados sem prova;
15. rounds, claims e logs de jogos são histórico econômico;
16. Storage será migrado por cópia, hash, troca e retenção;
17. backfill não enviará notificações ou recompensas;
18. rollback de frontend dependerá de flags, não de reversão destrutiva;
19. avatar-personagem será aposentado por protocolo de compensação e arquivo;
20. foto, molduras, auras, fundos e gradientes permanecerão;
21. `/inicio` e `/dashboard` continuam rotas distintas;
22. nenhum dado será removido sem aprovação posterior explícita.

---

## 34. Decisões ainda necessárias antes da implementação

- período de retenção por classe de dado;
- capacidade de backup/PITR do plano Supabase atual;
- política de compensação do avatar-personagem;
- tempo mínimo de janela read-only do legado;
- SLOs de divergência e latência;
- tamanho de lote por tabela;
- primeira coorte de usuários;
- destino futuro de `user_pets` e `user_pets_v2` após diagnóstico;
- representação física de conversas sociais;
- política de arquivamento de matches durante Propósito;
- privacidade padrão dos módulos do perfil;
- regras de exclusão/anonymização por solicitação de conta;
- estratégia de Storage/CDN para Sala de Cinema;
- responsáveis operacionais por cada domínio.

Essas decisões não autorizam mudança imediata. Elas serão resolvidas na preparação de cada implementação.

---

## 35. Entregáveis necessários quando a execução começar

Para cada onda:

1. RFC curta da mudança;
2. mapa origem/destino;
3. migration aditiva;
4. script de backfill dry-run/apply;
5. reconciliador;
6. relatório pré-migração;
7. testes RLS/RPC;
8. testes de caracterização/E2E;
9. dashboard de observabilidade;
10. feature flags;
11. runbook de rollout;
12. runbook de rollback;
13. relatório pós-migração;
14. aprovação antes de contração.

---

## 36. Registro de integridade desta etapa

Durante a produção deste Item 7:

- foram usados os contratos documentados nos Itens 1–6;
- o catálogo de 140 tabelas do Item 3 foi respeitado;
- a separação Comunidade/Namoro do Item 5 foi preservada;
- o plano estrutural do Item 6 foi mantido;
- os riscos críticos do Item 2 foram tratados como pré-condição;
- nenhuma migration foi criada ou executada;
- nenhuma consulta foi executada no Supabase publicado;
- nenhum dado foi copiado, exportado ou alterado;
- nenhum bucket ou arquivo foi modificado;
- nenhum código do produto foi editado;
- nenhum commit ou pull request foi criado.

**Resultado:** existe agora um contrato operacional para transformar a arquitetura e o design do VaiDarNamoro preservando identidade, privacidade, histórico, valor econômico, progressão e possibilidade de retorno.

---

## 37. Próximo item

O Item 8 deverá transformar as decisões dos Itens 1–7 no projeto completo da nova experiência:

- mapa de navegação futuro;
- perfil comunitário modular inspirado na Steam;
- configurações simples;
- nova Comunidade;
- Namoro paralelo e opcional;
- conversas por contexto;
- redesign das páginas preservadas;
- destino das páginas substituídas;
- retirada visual do avatar-personagem;
- integração de pets, economia, conteúdo cristão e Sala de Cinema;
- comportamento mobile, desktop e PWA;
- ordem de construção sem violar o plano de migração.

O Item 8 continuará documental. Nenhum redesign será aplicado ao projeto antes da revisão conjunta das decisões de produto.
