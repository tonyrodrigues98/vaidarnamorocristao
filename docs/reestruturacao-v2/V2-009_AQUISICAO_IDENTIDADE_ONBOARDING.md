# V2-009 — Aquisição, identidade e onboarding comunitário

## Objetivo

Fazer a entrada no produto respirar comunidade desde o primeiro contato,
preservando Auth, aprovação, página pública da live e dados atuais. Separar
identidade comunitária de configuração romântica.

## Resultado esperado

- landing community-first;
- acesso à comunidade claro;
- página da live/eventos integrada e preservada;
- Auth reutilizada e endurecida;
- estado de conta/capabilities canônico;
- onboarding comunitário mínimo;
- ativação do Namoro em fluxo posterior e opt-in;
- migração compatível para usuários existentes.

## Aquisição pública

Revisar:

- `/`;
- `/como-funciona`;
- `/sobre`;
- `/depoimentos`;
- blog/notícias públicas;
- `/instalar`;
- termos/manual;
- página e cards da live da Caren;
- CTA `Acessar comunidade`;
- CTA separado para participar da live;
- SEO, metadata, manifest e social cards.

Preservar regras reais da live e conteúdo administrativo. Atualizar
posicionamento sem apagar a identidade pública `Vai Dar Namoro Cristão` antes
de decisão explícita de marca.

## Identidade e acesso

Criar contratos:

- `accountStatus`;
- `primaryRole`;
- `capabilities`;
- `canEnter(domain)`;
- `isApproved`;
- `isRestricted`;
- sessão e troca de usuário;
- termos/consentimentos;
- exclusão/reativação.

Eliminar gradualmente guards locais duplicados, sem reduzir RLS.

## Onboarding comunitário

Trilha obrigatória deve conter somente:

- conta e segurança;
- idade/termos/consentimentos;
- identidade básica;
- foto e moderação;
- apresentação comunitária;
- privacidade inicial;
- dados de fé/comunidade realmente necessários;
- acessibilidade/preferências essenciais quando aplicável.

Requisitos:

- salvamento por etapa idempotente;
- retomada;
- back/forward;
- erro sem perder entrada;
- upload seguro;
- estado pending/review;
- versão do questionário;
- compatibilidade com respostas existentes;
- mobile/teclado/safe area;
- analytics sem conteúdo sensível.

## Trilha romântica

Fica fora do cadastro obrigatório e é aberta apenas quando o usuário ativa
Namoro. Deve conter:

- disponibilidade;
- intenção;
- preferências;
- critérios de compatibilidade;
- visibilidade;
- consentimentos específicos;
- recados anônimos, desligados por padrão;
- possibilidade de cancelar sem perder acesso comunitário.

Não ativar Namoro automaticamente para novos usuários.

## Usuários legados

- preservar IDs, perfis e respostas;
- classificar estado atual sem inventar consentimento;
- não desligar ou ativar todos em massa;
- fornecer banner/fluxo de confirmação quando necessário;
- manter deep links e rotas antigas durante transição;
- não apagar campos dating-first antes de migração.

## Design

- aparência premium, humana e cristã sem clichês visuais;
- Poppins e ícones Lucide/Heroicons;
- progressivo e curto;
- explicar por que uma informação é solicitada;
- não misturar aprovação administrativa com disponibilidade romântica;
- estados de revisão e recurso claros;
- nenhum clone de app conhecido.

## Testes

- visitante/cadastro/login/logout;
- sessão expirada e retomada;
- pending/aprovado/rejeitado/banido;
- role/capability;
- onboarding novo e legado;
- interrupção/reentrada;
- upload/falha da IA;
- Namoro não ativado;
- deep link antigo;
- mobile 320/390/tablet/desktop;
- teclado, foco, screen reader e reduced motion;
- offline honesto.

## Critérios de conclusão

- entrada community-first;
- Auth e IDs preservados;
- capability canônica usada pelas novas rotas;
- onboarding comunitário completo sem perguntas românticas obrigatórias;
- trilha de Namoro separada;
- usuários existentes não perdem dados;
- metadata/manifest não expõem Pretendentes como destino universal;
- flags e rollback;
- Draft PRs e estado persistente.
