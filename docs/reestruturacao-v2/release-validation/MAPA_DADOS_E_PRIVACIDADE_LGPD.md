# Mapa de dados e privacidade — LGPD

> Revisão técnica de prontidão. Não substitui parecer jurídico nem define
> definitivamente base legal.

## Inventário

| Dado                     | Finalidade             | Origem/armazenamento      | Acesso/compartilhamento             | Retenção proposta          | Base sugerida                    | Sensibilidade/exclusão         |
| ------------------------ | ---------------------- | ------------------------- | ----------------------------------- | -------------------------- | -------------------------------- | ------------------------------ |
| nome real                | identidade e confiança | usuário/profiles          | audiência configurada, moderação    | conta + prazo legal        | contrato/legítimo interesse      | pessoal; corrigir/excluir      |
| username                 | identificação pública  | usuário/profiles          | público conforme perfil             | conta + aliases mínimos    | contrato                         | pessoal; portabilidade         |
| e-mail                   | Auth e segurança       | usuário/auth              | Auth/suporte restrito               | conta + antifraude legal   | contrato/obrigação               | oculto do público              |
| nascimento/idade         | elegibilidade adulta   | usuário/profiles          | segurança/moderação                 | enquanto necessário        | contrato/obrigação               | alto risco; minimizar          |
| sexo                     | perfil e preferências  | usuário/profiles          | conforme visibilidade               | conta                      | consentimento                    | potencialmente sensível        |
| religião/igreja/fé       | comunidade cristã      | usuário/profiles/conteúdo | audiência configurada               | conta                      | consentimento específico         | dado sensível                  |
| fotos/vídeos/áudios      | identidade e conteúdo  | usuário/Storage           | audiência/RLS/CDN                   | conta + moderação          | consentimento/contrato           | biométrico potencial           |
| mensagens                | comunicação            | usuário/messages          | participantes/moderação excepcional | política a aprovar         | contrato/legítimo interesse      | privado; não logar             |
| Namoro/preferências      | descoberta romântica   | usuário/dating            | elegíveis no modo                   | enquanto opt-in            | consentimento explícito          | íntimo/sensível                |
| filhos/intenção familiar | compatibilidade        | usuário/perfil namoro     | audiência romântica                 | enquanto opt-in            | consentimento explícito          | alta sensibilidade             |
| cidade                   | descoberta/contexto    | usuário/profiles          | audiência configurada               | conta                      | consentimento/contrato           | não coletar GPS sem motivo     |
| denúncias/evidências     | segurança e recurso    | usuário/moderação/Storage | trust restrito                      | prazo de disputa/legal     | legítimo interesse/obrigação     | acesso fortemente restrito     |
| bloqueios/bans           | segurança              | usuário/sistema           | sistema/trust                       | conta + antifraude         | legítimo interesse               | não expor ao bloqueado         |
| decisões de moderação    | integridade            | sistema/staff             | trust/recurso                       | prazo de recurso           | legítimo interesse               | revisão humana                 |
| presença/último acesso   | experiência social     | sistema/presence          | conforme privacidade                | curta, horas/dias          | consentimento/legítimo interesse | opt-out recomendado            |
| recibo de leitura        | comunicação            | sistema/messages          | participantes                       | junto da mensagem          | contrato/consentimento           | controle por usuário           |
| logs de acesso           | segurança              | sistema/logs              | segurança/SRE                       | 30–180 dias                | legítimo interesse               | pseudonimizar                  |
| analytics/dispositivo    | qualidade e fraude     | sistema/telemetria        | fornecedor aprovado                 | 13 meses máx. proposto     | consentimento/legítimo interesse | minimizar/fingerprint não      |
| moedas/transações        | economia virtual       | sistema/ledger            | usuário/admin autorizado            | prazo antifraude/auditoria | contrato/legítimo interesse      | integridade financeira         |
| inventário/presentes     | propriedade virtual    | sistema/inventory         | usuário/audiência                   | conta + disputas           | contrato                         | ownership preservado           |
| Verbo/notas              | estudo pessoal         | usuário/Verbo             | somente titular por padrão          | conta                      | consentimento/contrato           | religião sensível              |
| pedidos de oração        | comunidade/apoio       | usuário/conteúdo          | audiência escolhida                 | curto e configurável       | consentimento explícito          | religião/saúde possíveis       |
| admin impersonation      | suporte excepcional    | staff/audit               | super admin/segurança               | 180 dias ou prazo aprovado | legítimo interesse               | aviso e auditoria obrigatórios |
| cookies/cache            | sessão e PWA           | navegador                 | usuário/infra                       | sessão ou TTL documentado  | necessário/consentimento         | limpar no logout               |
| backup                   | recuperação            | cópia operacional         | DBA restrito                        | 35 dias propostos          | obrigação/legítimo interesse     | exclusão diferida documentada  |

## Direitos dos titulares

O produto deve fornecer canal verificável para confirmação, acesso, correção,
informação sobre compartilhamento, revogação, oposição, exclusão e revisão de
decisão automatizada. Portabilidade deve ser avaliada por categoria.

Existe conflito explícito entre “não oferecer download dos dados” e os direitos
de acesso/portabilidade. A decisão de produto não pode prevalecer
silenciosamente; jurídico e controlador devem definir escopo, formato,
autenticação e exceções.

## Retenção e exclusão

| Classe                   | Retenção proposta                    | Ao excluir                           | Backup                   |
| ------------------------ | ------------------------------------ | ------------------------------------ | ------------------------ |
| perfil/conteúdo comum    | 30 dias de arrependimento            | apagar/anonomizar após prazo         | expira no ciclo ≤35 dias |
| desativação              | até 90 dias conforme decisão vigente | reativável durante janela            | permanece protegido      |
| mensagens                | política ainda não aprovada          | conciliar direitos dos participantes | expiração documentada    |
| denúncias/evidências     | duração do caso + prazo legal        | acesso restrito/anonymize            | retenção jurídica        |
| segurança/bans           | mínimo necessário contra fraude      | pseudonimizar                        | acesso segurança         |
| consentimentos/auditoria | prova legal                          | preservar mínimo                     | retenção aprovada        |
| ledger/inventário        | disputa e integridade                | anonimizar titular quando possível   | reconciliar              |
| Storage privado          | igual ao registro proprietário       | tombstone + cleanup verificado       | cópia separada           |

Excluir posts e mensagens “totalmente” pode conflitar com evidência, direitos de
outros participantes, fraude e backup. Nenhuma exclusão irreversível deve ser
implementada antes da matriz ser aprovada.

## Menores e identidade

A proibição de menores depende hoje de nascimento autodeclarado; isso não prova
idade. Opções: age assurance proporcional, bloqueio de sinais de menor,
denúncia prioritária, revisão humana, recurso, limitação de contato/mídia e
política de guardian sem coletar documento excessivo. Foto obrigatória e IA
podem gerar falso positivo, viés e dado biométrico; exigem base, transparência,
retenção curta e revisão humana.

## Riscos críticos

- dados religiosos sem consentimento/governança específicos;
- ausência de política final de retenção/exclusão/backup;
- super admin ou impersonação sem auditoria completa;
- mídia privada/cache sobrevivendo à troca de conta;
- deep link externo sem allowlist;
- upload de Cinema sem limite/direitos;
- ausência de controle real de idade;
- conteúdo sensível em logs/analytics.

Os contratos V2 já fecham deep links same-origin e cache privado, mas isso ainda
exige E2E e observabilidade externa.
