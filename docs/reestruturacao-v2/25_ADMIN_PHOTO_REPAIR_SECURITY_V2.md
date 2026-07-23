# V2-008 — reparo administrativo de fotos

## Objetivo

Endurecer o endpoint server-only `/api/photo-repair` sem executar a migration,
alterar Storage ou reparar qualquer foto real. O contrato continua exclusivo
para `admin` e `super_admin`, mas agora também é fechado por configuração,
limitado, confirmável, auditável e seguro contra alvos arbitrários.

## Estado local

- `PHOTO_REPAIR_ENABLED` precisa ser exatamente `true`;
- a variável é server-only e não possui equivalente `VITE_`;
- sem a flag, o endpoint retorna `503` antes de autenticação ou acesso ao
  Supabase;
- a migration aditiva `20260723000003_v2_photo_repair_audit.sql` foi criada,
  mas não aplicada;
- nenhuma operação foi executada contra o banco ou Storage.

O rollout deve aplicar a expansão do schema primeiro e só então habilitar o
runtime. Assim, uma publicação incompleta permanece fechada.

## Autorização e requisição

O endpoint preserva a validação de bearer pelo Supabase Auth e a consulta
server-side de `user_roles`. Sessão autenticada não equivale a administração.

Mutations também exigem:

- `Origin` exatamente igual à origem da requisição;
- `Sec-Fetch-Site: same-origin`, quando o browser enviar o header;
- content type `application/json` ou `multipart/form-data`;
- tamanho declarado dentro do limite;
- UUIDs válidos e escopo explícito;
- `X-Photo-Repair-Confirm: execute`, salvo em dry-run.

O cliente administrativo existente envia a confirmação nas duas operações
mutáveis. Não há token ou identidade em logs.

## Dry-run

`X-Photo-Repair-Dry-Run: true` valida autenticação, papel, origem, limite, alvo,
payload e JPEG, mas não escreve em tabela, perfil, foto ou Storage. O evento de
dry-run entra na trilha de auditoria.

Para limpeza de avatar, o dry-run pode consultar se existe foto adicional
promovível, retornando apenas um booleano. URLs não são devolvidas nesse modo.

## Arquivos JPEG e Storage

- multipart é limitado a 8,5 MB;
- o arquivo JPEG é limitado a 8 MB;
- MIME e magic bytes `FF D8 FF` precisam coincidir;
- upload usa caminho único dentro do prefixo UUID do usuário;
- `upsert` é proibido;
- a referência no banco só muda depois do upload;
- falha de atualização tenta remover o novo objeto;
- o objeto antigo só é removido depois da troca e apenas quando o path pertence
  ao mesmo usuário;
- falha de limpeza posterior não desfaz a referência válida e gera evento
  categórico sem PII.

## Limites

O rate limit em memória separa scans de mutations:

- dois scans por administrador a cada cinco minutos;
- oito mutations por administrador a cada minuto.

Isso contém uma instância e evita varreduras repetidas acidentais, mas não é
limite distribuído. Antes de produção, o operador deve configurar rate limit no
edge por identidade/autorização sem registrar bearer.

As varreduras permanecem limitadas a 2.000 perfis, 5.000 fotos e 300 achados.
Paginação incremental é forward-fix posterior; aumentar os limites
silenciosamente não é permitido.

## Auditoria

`photo_repair_audit` é uma tabela aditiva e privada:

- nenhum grant para `PUBLIC`, `anon` ou `authenticated`;
- RLS e `FORCE RLS` habilitados;
- somente inserts server-only pelo endpoint;
- trigger rejeita `UPDATE` e `DELETE`;
- eventos append-only `started`, `dry_run`, `succeeded` e `failed`;
- ator, alvo, ação, escopo, resultado, código categórico e request id;
- nenhum bearer, URL de foto, nome, e-mail ou detalhe interno.

O evento `started` precisa ser persistido antes de qualquer mutation. Se isso
falhar, a ação fecha com `503`. Como Storage e Postgres não compartilham uma
transação, o evento final é best-effort depois da mudança; o evento inicial
permanece para reconciliação.

Logs do runtime contêm somente componente, evento, operação, status, duração e
contagem agregada.

## Erros

Respostas públicas usam códigos categóricos:

- `service_unavailable`;
- `unauthorized` ou `forbidden`;
- `forbidden_origin`;
- `rate_limited`;
- `request_too_large` ou `unsupported_media_type`;
- erros de validação do alvo/JPEG;
- `confirmation_required`;
- `internal_error`.

Mensagens do Supabase, paths, stacks e conteúdo do provedor não são retornados.

## Testes

`photo-repair-security-v2.test.ts` cobre flag exata, Origin, fetch metadata,
confirmação, dry-run, UUIDs, limites, MIME/magic bytes, ownership de path, rate
limit, staging do upload, cliente administrativo e migration append-only. A
suíte é local, determinística e não importa um cliente Supabase.

A migration precisa ser validada depois em um Supabase descartável com:

- anon/authenticated sem SELECT/INSERT/UPDATE/DELETE;
- service role podendo inserir;
- update/delete rejeitados pelo trigger;
- nenhum efeito sobre `profiles`, `profile_photos` ou objetos existentes.

## Rollout

1. criar snapshot e rollback da versão publicada;
2. validar a migration em Supabase descartável;
3. aplicar somente a migration aditiva autorizada;
4. confirmar grants/RLS/trigger e insert server-only;
5. publicar o runtime ainda com a flag ausente;
6. executar dry-run administrativo em ambiente isolado;
7. configurar `PHOTO_REPAIR_ENABLED=true` server-only;
8. executar uma operação controlada e reconciliar eventos;
9. confirmar rate limit do edge, retenção e alertas.

## Rollback

1. definir `PHOTO_REPAIR_ENABLED=false` ou retirar a variável;
2. preservar tabela e eventos para investigação;
3. não apagar registros, objetos ou referências;
4. restaurar o runtime anterior somente após reconciliar ações iniciadas;
5. contrair a tabela apenas em lote futuro, com retenção aprovada.

## Limitações

- migration não aplicada e estado publicado não verificado;
- rate limit local não substitui limite distribuído;
- conclusão de auditoria após Storage não é transacional;
- limites atuais ainda não implementam cursor;
- retenção e acesso de consulta da auditoria exigem decisão operacional;
- nenhum reparo real foi executado.
