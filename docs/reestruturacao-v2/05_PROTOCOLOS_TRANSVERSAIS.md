# Protocolos transversais — segurança, dados, design, testes e release

Estas regras valem para todos os lotes.

## 1. Segurança

### Identidade e autorização

- Derivar usuário de sessão/token validado, nunca de parâmetro do cliente.
- Centralizar capabilities.
- UI oculta não é autorização.
- RLS/policy/RPC/server function decide acesso final.
- Testar owner, outro usuário, bloqueado, staff, admin, super_admin e anon.

### RPCs e `SECURITY DEFINER`

- `search_path` explícito;
- grants mínimos;
- revogar execução genérica quando inadequada;
- validar `auth.uid()`, papel, alvo, limites e estado;
- quantidade, progresso, recompensa e cap nunca vêm como autoridade do cliente;
- idempotência e auditoria em operações críticas.

### Web e cliente

- CSP/headers quando compatíveis com deploy;
- sanitização de HTML e URLs;
- iframe/embeds por allowlist;
- deep link relativo ou same-origin;
- nenhum segredo no bundle;
- mensagens de erro sem vazamento;
- rate limit, timeout, tamanho e validação de MIME real em upload/IA.

### Moderação

- indisponibilidade de IA resulta em pendência/revisão conforme política, não
  aprovação silenciosa;
- evidência é protegida;
- denúncia é contextual;
- bloqueio global é aplicado por contrato central;
- logs não carregam conteúdo privado desnecessário.

## 2. Supabase e dados

### Níveis de evidência

- HEAD: código atual;
- TIPOS: geração do schema, não prova produção;
- MIGRATIONS: histórico declarado;
- PRODUÇÃO: snapshot autenticado;
- INFERIDO: conclusão ainda não provada.

Nunca apresentar TIPOS ou MIGRATIONS como estado publicado.

### Sequência de mudança

1. expandir;
2. preencher em lotes idempotentes;
3. comparar estrutura, contagem, identidade e semântica;
4. alternar leitura;
5. alternar autoridade de escrita;
6. estabilizar por coorte;
7. contrair somente após gate.

### Migration

Toda migration deve ter:

- objetivo;
- classificação aditiva ou destrutiva;
- dependências;
- impacto;
- lock/tempo esperado;
- execução idempotente quando possível;
- validação pré/pós;
- backfill separado;
- estratégia de rollback ou forward-fix;
- teste em ambiente descartável;
- estado de aplicação registrado.

Criar migration local não autoriza aplicá-la.

### Reconciliação

Não basta contar linhas. Validar:

- IDs e ownership;
- relacionamentos;
- ordem e timestamps;
- estados;
- ledger e saldo;
- inventário e equipados;
- mensagens e threads;
- objetos de Storage;
- policies/grants;
- tópicos Realtime;
- checksums semânticos;
- amostras dirigidas.

### Storage

- inventariar bucket/path/owner/size/hash/content-type;
- diferenciar público, privado e signed delivery;
- não invalidar URLs existentes sem migração;
- cache não remove token e compartilha bytes entre usuários sem partição;
- uploads de usuário e Cinema nunca entram no Git.

## 3. Preservação e rollback

Antes de substituir uma superfície:

- caracterizar comportamento atual;
- mapear dados e integrações;
- criar flag;
- implementar nova leitura/escrita;
- comparar;
- canário/coorte;
- manter retorno ao legado;
- registrar divergência.

Rollback não pode reabrir vulnerabilidade conhecida. Quando não for seguro
voltar ao código antigo, use kill switch e forward-fix.

## 4. Design system e UX

- Poppins;
- Lucide/Heroicons;
- identidade própria;
- mobile-first;
- uma coluna principal no compacto;
- desktop com rail/coluna contextual somente quando útil;
- bottom navigation coerente e não dating-first;
- painéis laterais no desktop e tela contextual no mobile;
- input mobile de 16 px ou mais;
- sem dependência de hover;
- gestos possuem alternativa;
- tabelas viram listas detalhadas no compacto;
- chat ocupa tela inteira no mobile;
- Cinema suporta paisagem.

### Estados universais

Toda tela inclui:

- loading/skeleton;
- vazio com próxima ação válida;
- erro humano com retry;
- offline honesto;
- permissão/privacidade;
- conteúdo normal;
- ação em progresso;
- sucesso ou confirmação quando necessário.

### Acessibilidade

- WCAG 2.2 AA;
- contraste inclusive com personalização;
- foco visível;
- ordem semântica;
- teclado;
- leitor de tela;
- texto escalável;
- reduced motion;
- feedback não dependente só de cor;
- labels para ícones ambíguos;
- touch targets adequados;
- zoom e rotação sem quebra.

## 5. Performance

Cada lote deve observar:

- JS inicial e assíncrono;
- CSS;
- imagens above-the-fold;
- fontes;
- queries críticas;
- subscriptions;
- cache;
- service worker;
- memória em listas;
- lazy loading.

Admin, jogos, pets, Verbo e Cinema não entram no bundle inicial comum.

Listas grandes usam paginação/virtualização conforme medição. Não fazer prefetch
indiscriminado. Medir Core Web Vitals por rota e p75/p95 das ações críticas.

## 6. Conversas e Realtime

- um canal por finalidade/instância;
- cleanup determinístico;
- reconexão;
- deduplicação;
- ordenação por chave estável;
- `client_message_id` para retry;
- cursor que não perde itens com mesmo timestamp;
- read receipts em lote quando possível;
- políticas de tópico e participante;
- nenhum vazamento entre threads;
- cache e draft particionados por usuário.

## 7. Economia

- saldo oficial não vem do cache;
- todo crédito/débito tem ledger;
- preço histórico é registrado;
- compra e entrega atômicas;
- replay seguro;
- concorrência testada;
- reward calculada server-side;
- concessão administrativa auditada;
- nenhuma compensação inventada.

## 8. PWA e offline

- cache versionado;
- dados privados por usuário;
- limpeza em logout e troca de conta;
- navegação network-first com fallback definido;
- update/reload controlado;
- push click com allowlist;
- offline não promete mutation concluída;
- outbox apenas quando idempotência e resolução de conflito existem;
- conteúdo baixável é explícito;
- mídia sensível não é cacheada indiscriminadamente.

## 9. Testes

### Camadas

1. unitários de regras puras;
2. componentes;
3. integração com adapters;
4. contrato/RLS em Supabase descartável;
5. Realtime;
6. E2E de jornadas;
7. visual/responsivo;
8. acessibilidade;
9. performance;
10. migração e reconciliação.

### Casos transversais

- usuário novo, existente, pending, aprovado, banido;
- Namoro off/on/paused/committed/restricted;
- owner/outro/bloqueado/staff;
- online/offline/reconectando;
- cache após logout/troca de conta;
- retry/replay/concorrência;
- mobile estreito, mobile padrão, tablet e desktop;
- reduced motion e teclado;
- deep link antigo e notificação;
- rollback de flag.

### Regra de caracterização

Caracterize o que precisa ser preservado. Não escreva teste que exija a
permanência de vulnerabilidade, link quebrado, cache inseguro ou outro defeito.
Detectores devem aceitar código seguro e identificar fixtures inseguras.

## 10. Gate de Draft PR

Antes de publicar:

- diff completo revisado;
- escopo coerente;
- sem secrets;
- sem mudança operacional acidental;
- testes focados;
- typecheck;
- lint/format;
- builds cliente e SSR;
- `git diff --check`;
- status limpo;
- docs/estado atualizados;
- rollback e flags claros;
- PR Draft e base correta.

## 11. Gate de produção

Este pacote não autoriza produção. Um futuro release exige:

- PRs aprovados/mesclados;
- snapshot e backup;
- restore testado;
- migrations validadas;
- secrets/configuração por fluxo seguro;
- canário/coortes;
- dashboards/alertas;
- runbook;
- rollback;
- aprovação explícita.
