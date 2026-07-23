# V2-009B — Aquisição pública community-first

## Objetivo

Reposicionar a entrada pública do Vai Dar Namoro como comunidade cristã sem
apagar a marca, a live da Caren ou o quadro de relacionamento existente. Esta
fatia muda composição, linguagem pública e metadados; não muda autenticação,
aprovação, dados, regras da live ou disponibilidade romântica.

## Auditoria e decisões

| Superfície        | Antes                                                    | Decisão V2-009B                                                                                       |
| ----------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/`               | A live era a primeira e principal proposta               | Comunidade vem primeiro; a experiência completa da live permanece logo abaixo                         |
| navegação pública | marca representada por coração e CTA de cadastro         | identidade comunitária, CTA `Acessar comunidade` e CTA externo separado para a live                   |
| `/como-funciona`  | sequência centrada em aprovação e relacionamento         | participação comunitária como fluxo principal; Namoro apresentado como opção separada                 |
| `/sobre`          | missão predominantemente romântica                       | missão de fé, amizade e convivência; relacionamento preservado como área opcional                     |
| `/depoimentos`    | prova social apresentada como proposta inteira           | histórias de relacionamento reconhecidas como parte da história do produto                            |
| blog              | editorial centrado em relacionamento                     | escopo editorial inclui fé, comunidade e convivência                                                  |
| cadastro          | mensagem genérica de jornada                             | entrada na comunidade e indicação explícita de que Namoro é opcional                                  |
| manifesto PWA     | descrição romântica e atalho universal para Pretendentes | descrição comunitária, atalhos para Início e Comunidade; Pretendentes removido dos atalhos universais |
| metadados globais | produto descrito como plataforma de relacionamentos      | comunidade cristã, com Namoro como área opcional                                                      |

## Contratos públicos

- `PUBLIC_COMMUNITY_ROUTE` aponta para `/inicio`, preservando a proteção e o
  fluxo de autenticação existentes.
- `PUBLIC_SIGNUP_ROUTE` aponta para `/auth/signup`.
- `CAREN_TIKTOK_LIVE_URL` mantém o destino externo já utilizado.
- Os três objetivos possuem CTAs distintos: entrar na comunidade, criar conta e
  participar da live.
- Links externos usam nova aba com `noopener noreferrer`.
- Os componentes novos de aquisição não importam Supabase, Auth, ambiente ou
  regras de domínio.

## Preservação da live

`CarenLiveHero` ganhou apenas o modo de composição `embedded`. O modo padrão
continua exibindo a navegação própria; no início público, o modo incorporado
remove somente essa navegação duplicada e fornece a âncora
`#experiencia-live`. Permanecem montados:

- hero e link atual da live;
- dinâmica e horários;
- equipe carregada pela fonte real existente;
- participação;
- destaques mensais;
- plataforma comunitária;
- FAQ;
- CTA final.

Nenhum dado administrativo da live, consulta ou regra de participação foi
substituído por mock.

## Identidade, responsividade e acessibilidade

- canvas público off-white `#f7f7f5`;
- violeta profundo como cor comunitária;
- coral restrito ao destaque histórico e à live;
- tipografia e stack existentes preservadas;
- controles públicos com altura mínima de 44 px;
- foco visível em CTAs e links;
- um único `main` na página inicial;
- ícones Lucide decorativos com `aria-hidden`;
- textos e CTAs permanecem legíveis de mobile a desktop.

## SEO e PWA

Metadados globais e das páginas públicas passam a descrever comunidade, fé,
amizades, conteúdo e experiências. O manifesto mantém `start_url: /inicio`,
escopo, ícones, instalação e atalhos existentes não românticos. A remoção do
atalho de Pretendentes não remove a rota ou o domínio: apenas deixa de
apresentá-lo como destino universal.

## Limites deliberados

- Termos e manual não foram reescritos: conteúdo jurídico e instruções
  operacionais exigem revisão própria e decisões explícitas.
- A identidade histórica `Vai Dar Namoro Cristão` continua nas referências da
  live e em conteúdo já publicado.
- A home ainda carrega equipe e destaques pelos adapters existentes para
  preservar o runtime da live.
- Onboarding comunitário e ativação opt-in de Namoro pertencem à V2-009C.
- Nenhuma feature flag, rota privada, banco, migration, RLS, secret, Job ou
  ambiente foi alterado.

## Testes e rollback

`tests/public-acquisition-v2.test.ts` caracteriza a ordem da home, preservação
das seções da live, separação dos CTAs, ausência de backend nos componentes
novos, copy de Namoro opcional e manifesto sem Pretendentes universal.

O smoke visual utilizou um harness local descartável, sem Auth ou Supabase, nas
áreas de 390 × 844, 768 × 1024, 1024 × 768 e 1440 × 900. Todas mantiveram um
único `main`, hierarquia responsiva e `scrollWidth` menor ou igual à largura do
documento. O harness e sua configuração foram removidos antes do commit.

Rollback consiste em reverter este commit. Como não há schema, escrita de
dados, alteração operacional ou novo contrato persistido, o retorno restaura
somente composição, copy e metadados públicos.
