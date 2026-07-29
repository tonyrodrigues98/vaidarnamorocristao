# Segurança, RLS e Storage

## Evidência versionada

O diretório `supabase/migrations` contém **198 migrations SQL** no commit-base.
Esta contagem é do repositório atual e não afirma que todas foram aplicadas.

A varredura estática encontrou:

| Sinal | Resultado |
|---|---:|
| Ocorrências `CREATE POLICY` | 446 |
| Alvos distintos aproximados de policies | 140 |
| Tabelas distintas com `ENABLE ROW LEVEL SECURITY` | 139 |
| Ocorrências `SECURITY DEFINER` | 384 |
| Funções `SECURITY DEFINER` distintas aproximadas | 245 |
| Triggers distintos aproximados | 112 |
| Ocorrências `GRANT` | 423 |

As contagens “aproximadas” vêm de normalização estática de SQL e podem incluir
redefinições históricas do mesmo objeto. A autoridade é o estado remoto, que
não foi consultado.

## Fronteiras críticas preservadas

- Autenticação de frontend não equivale a autorização administrativa.
- Funções econômicas e administrativas permanecem RPCs server-side.
- `service_role` aparece somente em contextos server-side/configuração; não deve
  entrar no bundle browser.
- Endpoints de reparação/verificação validam contexto antes de operar.
- Arquivos de suporte, verificação e moderação não devem ser tratados como mídia
  pública apenas porque o frontend consegue exibir uma URL temporária.
- Signed URLs não são fonte persistente de verdade.

## Histórico de buckets nas migrations

O histórico versionado contém mudanças sucessivas; portanto, a última migration
relevante é mais importante que uma declaração antiga isolada.

| Bucket | Evidência versionada | Classificação esperada pelo código atual |
|---|---|---|
| `profile-photos` | Criado público, depois privado e posteriormente tornado público novamente por `20260726000000_public_profile_and_pet_media_delivery.sql`. | Foto aprovada usa URL pública estável; caminhos privados/legados ainda possuem fallback controlado. |
| `pets` | Policies de Storage existentes; a migration de 2026-07-26 define `public=true`. | Imagem pública de pet usa URL pública; helper mantém compatibilidade defensiva. |
| `verifications` | Criado privado, com acesso do proprietário/admin. | Privado. |
| `support-attachments` | Criado privado, com acesso do proprietário/equipe. | Privado. |
| `photo-moderation-rejects` | Criado privado, com políticas por pasta/administrador. | Privado. |
| `stickers` | Evidência de bucket público. | Público. |
| `gift-images` | Evidência de bucket público. | Público. |
| `profile-backgrounds` | Evidência de bucket público nas migrations. | Público. |
| `live-team` | Evidência de bucket público nas migrations. | Público. |
| `avatar-items`, `avatar-looks` | Policies e uso observados; criação/flag pública não foi comprovada na busca versionada. | Exige confirmação remota antes de qualquer mudança. |
| `pet-expeditions` | Uso por helper observado; estado remoto não comprovado. | Exige confirmação remota. |

Não é seguro inferir que “bucket público” autoriza upload/alteração por qualquer
usuário: leitura pública e escrita são controles separados.

## Cron e Jobs versionados

Foram encontradas referências versionadas a:

- `purge-global-messages-midnight-sp`
- `reactivation-reminders-daily`
- `cleanup-photo-moderation-rejects`
- `pet-care-reminders-daily`
- `rotate-grab-featured-pool`

O Job remoto historicamente citado como `push-dispatch-every-minute` não foi
localizado como definição versionada nesta base. Sua existência e configuração
remotas permanecem **não comprovadas no repositório**.

## Riscos que não devem ser “corrigidos” nesta tarefa

- Divergência possível entre o histórico SQL e o estado publicado.
- Buckets com evolução pública/privada precisam de confirmação remota antes de
  qualquer mudança.
- Policies repetidas no histórico podem ter sido substituídas por migrations
  posteriores.
- Funções `SECURITY DEFINER` exigem revisão individual de `search_path`,
  ownership, grants e validação de ator; a contagem não prova segurança.
- Não há evidência nesta etapa de execução externa de RLS, Storage ou RPC.

## Proibições mantidas

Nenhuma migration foi executada, nenhuma policy/bucket foi alterado e nenhum
secret foi lido. Este documento não autoriza mudança remota.
