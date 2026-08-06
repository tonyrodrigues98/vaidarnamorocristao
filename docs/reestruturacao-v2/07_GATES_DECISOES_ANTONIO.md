# Gates que realmente exigem Antonio

O Codex não deve usar esta lista para interromper cedo. Deve concluir toda
fundação neutra, reversível e independente antes de solicitar decisão.

## Decisões visuais e de produto

- identidade visual final e possível evolução da marca/ícone;
- composição final da bottom navigation;
- vitrines do primeiro lançamento do Perfil;
- limites gratuitos/premium de personalização;
- nome final e rota pública do Modo Namoro;
- regra romântica de elegibilidade/sexo, antes de alterá-la;
- modelo social inicial definitivo: seguir, conexão bilateral ou ambos;
- defaults de privacidade de conexões e Status;
- visibilidade/aprovação de grupos;
- criação de conteúdo por usuários.

Decisões reversíveis podem usar abstrações/configuração e permanecer atrás de
flag. Não interromper por elas antes do ponto de ativação.

## Jogos, caixas e avatar

- lista de jogos a manter, manter temporariamente ou retirar;
- destino comercial e jurídico de caixas/sorteios;
- política de compensação de itens exclusivos do avatar-personagem;
- janela de aviso e quarentena;
- aprovação de qualquer concessão econômica real.

Até decisão:

- não remover;
- preservar progresso e ownership;
- preparar inventário, telemetria, opções e dry-runs;
- bloquear apenas novas expansões do avatar quando o gate correspondente estiver
  aprovado.

## Sala de Cinema

- direitos de upload e exibição;
- conteúdo permitido/proibido;
- menores;
- takedown/denúncia;
- retenção;
- limites de tamanho/duração;
- quotas/custo;
- quem pode enviar/publicar;
- termos e responsabilidade do anfitrião;
- fornecedor/CDN/transcodificação, se houver custo.

Até decisão:

- concluir spike;
- arquitetura;
- modelo de domínio;
- sync;
- protótipo/MVP fechado com mídia autorizada;
- budgets;
- feature flag default off;
- não abrir upload/exibição ao público.

## Verbo

- licenças das versões bíblicas;
- profundidade de integração com o projeto existente;
- provedor/custo de exploração conversacional;
- política editorial e revisão;
- escopo inicial de offline/download.

Até decisão:

- contratos;
- UI;
- dados privados;
- adapters;
- conteúdo autorizado;
- feature flag;
- nenhum secret/API paga.

## Produção e dados

Exigem autorização explícita:

- acesso autenticado ao Supabase publicado, mesmo read-only quando ainda não
  concedido;
- projeto descartável para testes mutáveis;
- aplicação de migration;
- rotação/configuração de secret;
- deploy;
- alteração de scheduler/job;
- mudança de bucket/policy/grant;
- backfill real;
- coorte de usuários;
- merge;
- contração física.

## Formato da futura pergunta

Quando um gate for inevitável, perguntar uma única vez e de forma compacta:

1. decisão necessária;
2. por que bloqueia agora;
3. opção recomendada;
4. alternativas e impacto;
5. trabalho já concluído sem depender dela.

Não recopie o histórico inteiro.
