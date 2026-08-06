# V2-004 — App Shell responsivo da Community Platform

## 1. Marco e objetivo

- Repositório: `tonyrodrigues98/vaidarnamorocristao`
- Branch: `rebuild/v2-004-app-shell`
- Base exata: `cae139deb87878926488ee0ed35cbf22a2ef4d43`
- Dependências: V2-001, V2-002 e V2-003 já integradas na `main`
- Banco, Supabase, migrations, RLS, Storage, Vault, secrets, cron e Jobs: não
  alterados
- Publicação e deploy: fora do escopo

A V2-004 cria a primeira composição visual completa da Community Platform. O
shell organiza identidade, navegação, conteúdo e contexto, mas não implementa
feed, chat, Namoro, loja, pet, perfil ou qualquer persistência.

O resultado existe em duas camadas:

1. biblioteca pública, tipada e isolada em `src/v2/app-shell`;
2. showcase local navegável em `src/v2/app-shell/showcase`.

Nenhuma rota ou página legada consome o shell nesta etapa. A aplicação ativa
continua exatamente sob o shell anterior.

## 2. Fontes analisadas

Foram lidos os 14 arquivos acessíveis em `docs/reestruturacao-v2`, incluindo o
inventário SQL somente leitura. As decisões aplicadas aqui são:

- Comunidade é a plataforma; Namoro é uma experiência opcional;
- mobile possui Início, Comunidade, Criar, Conversas e Perfil;
- desktop usa sidebar, conteúdo central e rail contextual opcional;
- `/inicio` continua diferente de `/dashboard`;
- UI não acessa Supabase diretamente;
- feature flags permanecem fail-closed;
- o legado só pode ser ocultado após paridade;
- dados e integrações existentes permanecem protegidos.

A composição exata da navegação era uma lacuna registrada nos Itens 5, 8 e no
plano. O escopo explícito da V2-004 resolve a composição visual desta etapa sem
alterar regras de elegibilidade, capabilities ou rotas reais.

## 3. Auditoria rápida do shell legado

| Elemento      | Estado atual                                                                    | Limitação observada                                          | Tratamento na V2-004                                           |
| ------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| Root          | `src/routes/__root.tsx` monta providers, guards, banners, shell e footer        | responsabilidades de runtime e apresentação estão próximas   | não alterado; V2 permanece fora do root                        |
| Shell mobile  | `src/components/mobile/MobileAppShell.tsx` usa listas próprias de prefixos      | regras de visibilidade se repetem em mais de um módulo       | preservado; V2 recebe configuração tipada e não conhece rotas  |
| Bottom nav    | `MobileBottomNav` usa Início, Devocional, Conversas, Pretendentes e Perfil      | Namoro é destino estrutural e o componente consulta Supabase | preservado; V2 usa navegação comunitária e zero acesso a dados |
| Perfil na nav | `MobileBottomNav` busca `profiles` diretamente                                  | apresentação inicia query privada                            | V2 recebe `V2ShellUser` por propriedade                        |
| Header        | `src/components/layout/Header.tsx` agrega menus, badges, auth, queries e regras | componente mistura apresentação e produto                    | preservado; top bar V2 recebe callbacks e dados prontos        |
| Visibilidade  | `src/lib/layoutVisibility.ts` e o shell possuem prefixos próprios               | risco de deriva entre header, footer e bottom nav            | não migrado; integração futura deverá usar adaptador único     |
| Sidebar       | Admin possui implementação específica e o legado geral não possui rail único    | padrões diferentes por área                                  | V2 cria sidebar neutra, sem reutilizar regras administrativas  |
| Tema          | `ThemeProvider` legado controla a aplicação                                     | mudar o provider afetaria páginas atuais                     | V2 usa somente `V2ThemeScope` e não toca no provider           |

Comportamentos preservados para a integração futura:

- chats focados podem esconder a navegação;
- áreas públicas não montam providers privados;
- onboarding, banimento e Admin continuam sob suas autorizações próprias;
- deep links continuam sendo responsabilidade do router e da V2-002;
- notificações e perfil serão fornecidos ao shell por adaptadores, nunca buscados
  pelo componente visual.

## 4. Arquitetura

```text
src/v2/app-shell/
  index.ts                    barrel público
  types.ts                    API de composição
  navigation.ts               destinos e helpers neutros
  overlay-focus.ts            teclado, foco e Escape
  V2AppShell.tsx              composição
  V2MobileTopBar.tsx          contexto e ações globais
  V2BottomNavigation.tsx      cinco ações mobile
  V2DesktopSidebar.tsx        rail compacto/expandido
  V2ContextRail.tsx           coluna direita opcional
  V2PageHeader.tsx            contexto da página
  V2ShellContent.tsx          landmark e largura
  V2NavigationItem.tsx        item compartilhado
  V2CreateSheet.tsx           criação demonstrativa
  V2NotificationsPopover.tsx notificações recebidas por props
  V2ProfileMenu.tsx           identidade e tema
  V2MoreMenu.tsx              experiências secundárias
  V2ShellOverlaySurface.tsx   superfície acessível compartilhada
  styles.css                  CSS público escopado
  showcase/                   harness local, fora do barrel
```

Fluxo de dependências:

```text
Showcase / futuro adapter de rota
  → App Shell V2
    → Design System V2 público
      → React, Radix/CVA já encapsulados pela V2-003
```

O App Shell também usa Lucide como biblioteca de ícones aprovada. Ele não
importa:

- Supabase;
- auth ou sessão;
- TanStack Router;
- rotas;
- domínios;
- componentes legados;
- environment variables;
- dados do usuário em runtime;
- chamadas de rede.

## 5. API pública

O ponto de entrada é:

```ts
import { V2AppShell, V2_PRIMARY_NAVIGATION, V2_SECONDARY_NAVIGATION } from "@/v2/app-shell";
```

### `V2AppShell`

Recebe:

- `page`: título, subtítulo, eyebrow, breadcrumbs, voltar, ação principal,
  largura, modo concentrado e rail contextual;
- `activeNavigationId`: ID estável do destino ativo;
- `navigation` e `secondaryNavigation`: configuração tipada;
- `user`: apresentação pública já resolvida;
- `notifications` e `notificationCount`: dados já resolvidos;
- `theme`: `light` ou `dark`;
- `sidebarMode`: `compact` ou `expanded`;
- callbacks de navegação, criação, tema e busca;
- conteúdo da página.

O shell não deriva estado por pathname. O futuro adaptador do router fará a
tradução entre rota e `V2ShellNavigationId`.

### `V2ShellPageConfig`

```ts
interface V2ShellPageConfig {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: readonly V2ShellBreadcrumb[];
  primaryAction?: V2ShellAction;
  onBack?: () => void;
  contextRail?: ReactNode;
  focused?: boolean;
  width?: "narrow" | "standard" | "wide" | "fluid";
}
```

Essa API evita condicionais espalhadas por nomes de rota e permite que chat
imersivo, Cinema, edição de perfil ou Admin solicitem um shell concentrado no
futuro.

## 6. Navegação

### Mobile

Destinos fixos:

1. Início;
2. Comunidade;
3. Criar;
4. Conversas;
5. Perfil.

`Criar` abre uma sheet com ações preparatórias:

- criar publicação;
- compartilhar reflexão;
- fazer pergunta;
- criar evento;
- iniciar Sala de Cinema.

Todas são honestamente demonstrativas. O componente emite um callback e não
faz persistência.

### Experiências secundárias

O menu Mais contém:

- Pretendentes;
- Explorar pessoas;
- Loja;
- Avatar;
- Meu Pet;
- Configurações.

Essa lista prova que Pretendentes continua acessível sem ocupar o centro da
experiência. Capabilities e visibilidade romântica ainda deverão ser aplicadas
pelo adaptador de produto em uma etapa posterior.

### Desktop e tablet

- a partir de `48rem`, a bottom nav desaparece e surge um rail compacto;
- a partir de `64rem`, a sidebar pode ser compacta ou expandida;
- a partir de `80rem`, o rail contextual aparece quando fornecido;
- `focused=true` remove sidebar e rail, mantendo conteúdo e top bar;
- conteúdo usa larguras `narrow`, `standard`, `wide` ou `fluid`.

Os breakpoints são orientados ao conteúdo. Eles cobrem as resoluções de
aceitação 390 × 844, 768 × 1024, 1024 × 768 e 1440 × 900.

## 7. Isolamento e feature flag

`VITE_FF_V2_APP_SHELL` já existia na V2-001 e continua desligada quando:

- ausente;
- vazia;
- com `TRUE`, `1` ou qualquer valor diferente da string exata `true`.

A V2-004 não conecta a flag ao root. Isso é intencional: não existe ainda um
adaptador de capabilities, auth, PWA e router com paridade suficiente para
substituir o shell ativo.

Integração futura:

```text
flag false → shell legado
flag true + coorte autorizada → adapter V2 → V2AppShell
```

Rollback da futura integração será desligar a flag, sem alterar dados.

O CSS público:

- usa `.vdn-v2[data-vdn-v2]` em todas as regras qualificadas;
- não possui `:root`, `html` ou `body`;
- consome somente tokens `--v2-*`;
- não afeta páginas que não estejam dentro de `V2ThemeScope`.

`showcase.css` possui `:root` e `body` apenas porque é uma entrada local isolada,
não exportada pelo barrel nem carregada pela aplicação.

## 8. Acessibilidade

Contratos implementados:

- landmarks `header`, `nav`, `main` e `aside`;
- link “Pular para o conteúdo”;
- `aria-current="page"` no destino ativo;
- `aria-expanded` e `aria-controls` em busca, menus e criação;
- overlays com `role="dialog"`, nome, descrição e `aria-modal`;
- Escape fecha overlays;
- Tab e Shift+Tab permanecem dentro do overlay;
- foco inicial previsível;
- foco retorna ao acionador no fechamento;
- controles customizados têm no mínimo 44 px;
- campos usam o `V2TextField` de 16 px;
- foco visível é herdado do Design System;
- ícones decorativos usam `aria-hidden`;
- badges possuem nome quando carregam informação;
- reduced motion reduz animação e remove press transform;
- ações não dependem somente de hover;
- safe areas cobrem quatro lados.

Leitor de tela real, zoom extremo e alto contraste continuam sendo gates de
integração e não são provados somente pelos testes unitários.

## 9. Temas e tipografia

O shell usa `V2ThemeScope` e suporta temas claro e escuro completos. O showcase
permite alternar o tema pelo menu de perfil.

Poppins continua sendo a família principal. A biblioteca pública não adiciona
carregamento remoto. O harness reutiliza a mesma URL de Google Fonts já usada
pelo root apenas para revisão visual local; a estratégia de self-host/offline
continua pendente para integração do App Shell.

## 10. Showcase

Execução local:

```bash
bunx vite src/v2/app-shell/showcase --host 127.0.0.1 --port 4199
```

O showcase demonstra:

- navegação entre áreas fictícias;
- mobile, tablet, landscape e desktop;
- sidebar compacta e expandida;
- bottom navigation;
- tema claro e escuro;
- busca local;
- notificações;
- menu de perfil;
- menu Mais;
- criação;
- badges;
- loading com Skeleton;
- estado vazio;
- conteúdo longo;
- coluna contextual;
- feedback explícito de que nenhuma ação persiste dados.

O harness:

- não é rota;
- não entra em `src/routeTree.gen.ts`;
- não é exportado no barrel;
- não é importado pelo root;
- não acessa autenticação ou backend;
- não modifica dados.

## 11. Testes

Arquivos V2-004:

- `tests/app-shell-contracts-v2.test.ts`;
- `tests/app-shell-components-v2.test.tsx`;
- `tests/app-shell-responsive-v2.test.ts`;
- `tests/app-shell-boundaries-v2.test.ts`.

Cobertura:

- destinos mobile e navegação secundária;
- item ativo e badges;
- state machine de overlays;
- Escape e contenção de foco;
- SSR do barrel;
- landmarks e atributos ARIA;
- sheet e popovers;
- sidebar compacta/expandida;
- tema e showcase;
- breakpoints, safe areas e reduced motion;
- flag fail-closed;
- zero import proibido;
- zero chamada de backend;
- CSS público integralmente escopado;
- showcase fora do barrel e da árvore de rotas.

## 12. Limitações e riscos

- O shell ainda não está conectado ao router, Auth, NotificationsBridge ou
  capabilities reais.
- `Pretendentes` aparece no showcase para demonstrar arquitetura; sua
  visibilidade real dependerá do membership romântico.
- A busca não consulta dados.
- Menus não executam logout nem ações de conta.
- A sheet de criação não persiste conteúdo.
- O rail contextual recebe conteúdo pronto; regras de prioridade ainda serão
  definidas por cada domínio.
- Poppins ainda depende da estratégia remota existente para fidelidade completa.
- O showcase não prova comportamento com teclado virtual real em iOS.
- Nenhuma telemetria foi criada nesta etapa.

## 13. Adoção gradual

1. manter V2-004 isolada e revisar visualmente;
2. criar adaptador entre TanStack Router e `V2ShellNavigationId`;
3. conectar somente dados já autorizados e resolvidos;
4. montar o shell após sessão autenticada e autorização da V2-002;
5. ativar para ambiente/coorte interna pela flag existente;
6. comparar deep links, PWA, teclado, providers e navegação legada;
7. migrar uma superfície comunitária por vez;
8. manter rollback por flag;
9. ocultar shell legado apenas após paridade comprovada.

## 14. Rollback

Antes da integração, reverter o único commit V2-004:

1. remove `src/v2/app-shell`;
2. remove os quatro testes V2-004;
3. remove este documento.

Não há migration, dado, configuração externa, rota ou ambiente para reverter.
O shell legado continua sendo a implementação ativa.

## 15. Próximos passos

O próximo PR não deve implementar toda a Comunidade. A sequência segura é:

1. revisar e aprovar a composição do shell;
2. criar adapter de router/capabilities sob a flag existente;
3. integrar uma entrada autenticada interna sem substituir rotas;
4. testar PWA, auth, logout, troca de usuário e deep links;
5. iniciar a primeira superfície comunitária somente após esses gates.
