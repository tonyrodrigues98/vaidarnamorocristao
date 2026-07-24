import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coffee,
  MessageCircle,
  Music2,
  Plus,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  V2Button,
  V2Heading,
  V2Skeleton,
  V2StatusBadge,
  V2Surface,
  V2Text,
  type V2ThemeName,
} from "@/v2/design-system";
import {
  V2AppShell,
  V2_PRIMARY_NAVIGATION,
  V2_SECONDARY_NAVIGATION,
  type V2CreateAction,
  type V2ShellNavigationId,
  type V2ShellNavigationItem,
  type V2ShellNotification,
  type V2ShellPageConfig,
  type V2SidebarMode,
} from "../index";

const notifications = [
  {
    id: "community-welcome",
    title: "Boas-vindas do Grupo Recomeços",
    description: "Ana publicou uma mensagem para novos participantes.",
    timeLabel: "Há 8 minutos",
    unread: true,
  },
  {
    id: "event-reminder",
    title: "Encontro começa hoje",
    description: "Café & Conversa está marcado para 20h.",
    timeLabel: "Há 32 minutos",
    unread: true,
  },
  {
    id: "conversation",
    title: "Nova resposta em Conversas",
    description: "Rafael respondeu sobre o projeto de voluntariado.",
    timeLabel: "Ontem",
  },
] satisfies readonly V2ShellNotification[];

const pageCopy: Record<
  V2ShellNavigationId,
  Pick<V2ShellPageConfig, "title" | "subtitle" | "eyebrow" | "width">
> = {
  home: {
    title: "Início",
    eyebrow: "Quarta-feira, 23 de julho",
    subtitle: "Um resumo sereno do que está acontecendo na sua comunidade.",
    width: "standard",
  },
  community: {
    title: "Comunidade",
    eyebrow: "Pessoas, grupos e eventos",
    subtitle: "Descubra conversas que aproximam fé, amizade e vida real.",
    width: "standard",
  },
  create: { title: "Criar", subtitle: "Escolha uma ação para começar.", width: "narrow" },
  conversations: {
    title: "Conversas",
    eyebrow: "Social, grupos e solicitações",
    subtitle: "Continue conversas no seu tempo e com contexto claro.",
    width: "standard",
  },
  profile: {
    title: "Meu perfil",
    eyebrow: "Identidade e presença",
    subtitle: "Seu espaço para contar sua história e organizar o que importa.",
    width: "wide",
  },
  explore: {
    title: "Explorar pessoas",
    eyebrow: "Descoberta comunitária",
    subtitle: "Encontre pessoas por interesses e participação, sem filtros românticos.",
    width: "standard",
  },
  dating: {
    title: "Pretendentes",
    eyebrow: "Modo Namoro",
    subtitle: "Uma experiência opcional e separada da participação comunitária.",
    width: "standard",
  },
  purpose: {
    title: "Propósito Firmado",
    eyebrow: "Modo Namoro",
    subtitle: "Um compromisso bilateral sem interromper a vida comunitária.",
    width: "standard",
  },
  anonymous: {
    title: "Recados anônimos",
    eyebrow: "Modo Namoro",
    subtitle: "Contato consentido, moderável e protegido.",
    width: "standard",
  },
  shop: {
    title: "Loja",
    eyebrow: "Personalização",
    subtitle: "Itens cosméticos para expressar sua identidade na plataforma.",
    width: "wide",
  },
  avatar: {
    title: "Avatar",
    eyebrow: "Personalização legada",
    subtitle: "Acesso preservado enquanto a migração segura é planejada.",
    width: "standard",
  },
  pets: {
    title: "Meu Pet",
    eyebrow: "Companheiro virtual",
    subtitle: "Seu progresso e histórico continuam protegidos.",
    width: "standard",
  },
  verbo: {
    title: "Verbo",
    eyebrow: "Bíblia & Estudo",
    subtitle: "Leitura e anotações pessoais com privacidade por padrão.",
    width: "wide",
  },
  cinema: {
    title: "Sala de Cinema",
    subtitle: "Sessões sincronizadas para assistir junto.",
    eyebrow: "Assistir Juntos",
    width: "wide",
  },
  settings: {
    title: "Configurações",
    eyebrow: "Conta e privacidade",
    subtitle: "Controle sua experiência com opções simples e contextuais.",
    width: "narrow",
  },
};

const communityPosts = [
  {
    author: "Ana Clara",
    context: "Grupo Recomeços",
    time: "Há 12 min",
    text: "Hoje conversamos sobre como acolher quem está chegando. Qual gesto simples fez você se sentir parte de uma comunidade?",
    tag: "Convivência",
  },
  {
    author: "Lucas Menezes",
    context: "Música & Adoração",
    time: "Há 1 h",
    text: "Estamos montando uma lista colaborativa para o encontro de sábado. Compartilhe uma canção que trouxe paz nesta semana.",
    tag: "Música",
  },
  {
    author: "Mariana Costa",
    context: "Voluntariado",
    time: "Há 3 h",
    text: "A ação de arrecadação alcançou a primeira meta. Ainda precisamos de pessoas para organizar as caixas na sexta à tarde.",
    tag: "Serviço",
  },
  {
    author: "Thiago Alves",
    context: "Leitura em comunidade",
    time: "Ontem",
    text: "O próximo encontro será sobre hospitalidade. Deixei três perguntas para quem quiser chegar com a leitura preparada.",
    tag: "Estudo",
  },
];

function ContextRailContent() {
  return (
    <>
      <V2Surface as="section" padding="medium" elevation="one">
        <div className="vdn-v2-shell-showcase-card-heading">
          <CalendarDays aria-hidden="true" />
          <div>
            <V2Heading level={2} size="small">
              Próximos encontros
            </V2Heading>
            <V2Text variant="caption" tone="muted">
              Nesta semana
            </V2Text>
          </div>
        </div>
        <ol className="vdn-v2-shell-showcase-event-list">
          <li>
            <time>Hoje, 20h</time>
            <strong>Café & Conversa</strong>
            <span>Grupo Recomeços</span>
          </li>
          <li>
            <time>Sábado, 19h</time>
            <strong>Noite de música</strong>
            <span>Auditório virtual</span>
          </li>
        </ol>
      </V2Surface>
      <V2Surface as="section" padding="medium">
        <div className="vdn-v2-shell-showcase-card-heading">
          <UsersRound aria-hidden="true" />
          <div>
            <V2Heading level={2} size="small">
              Pessoas por perto
            </V2Heading>
            <V2Text variant="caption" tone="muted">
              Presença compartilhada
            </V2Text>
          </div>
        </div>
        <ul className="vdn-v2-shell-showcase-people">
          {["Ana Clara", "Lucas Menezes", "Mariana Costa"].map((name) => (
            <li key={name}>
              <span aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>
              <strong>{name}</strong>
              <small>online</small>
            </li>
          ))}
        </ul>
      </V2Surface>
    </>
  );
}

function HomeContent({
  loading,
  onLoadingChange,
}: {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}) {
  return (
    <>
      <V2Surface
        as="section"
        className="vdn-v2-shell-showcase-welcome"
        tone="inverse"
        elevation="one"
        padding="large"
      >
        <div>
          <V2StatusBadge tone="info" icon={<Sparkles />}>
            Sua comunidade hoje
          </V2StatusBadge>
          <V2Heading level={2} size="medium">
            Boa noite, Marina.
          </V2Heading>
          <V2Text variant="bodyLarge" tone="inverse">
            Há novas conversas, um encontro começando às 20h e pessoas esperando para acolher quem
            chegou agora.
          </V2Text>
        </div>
        <V2Button variant="secondary" size="small">
          Ver o que está acontecendo
        </V2Button>
      </V2Surface>

      <div className="vdn-v2-shell-showcase-section-heading">
        <div>
          <V2Heading level={2} size="medium">
            Continue de onde parou
          </V2Heading>
          <V2Text variant="body" tone="muted">
            Conteúdo, encontros e conversas organizados sem pressa.
          </V2Text>
        </div>
        <V2Button variant="ghost" size="small" onClick={() => onLoadingChange(!loading)}>
          {loading ? "Mostrar conteúdo" : "Simular loading"}
        </V2Button>
      </div>

      {loading ? (
        <V2Surface as="section" padding="large" aria-label="Carregando destaques">
          <div className="vdn-v2-shell-showcase-skeleton">
            <V2Skeleton width="7rem" height="1.25rem" />
            <V2Skeleton width="72%" height="1.75rem" />
            <V2Skeleton width="100%" height="5.5rem" />
            <V2Skeleton width="9rem" height="2.75rem" />
          </div>
        </V2Surface>
      ) : (
        <div className="vdn-v2-shell-showcase-quick-grid">
          <V2Surface as="article" padding="medium" elevation="one">
            <Coffee aria-hidden="true" />
            <V2Text variant="caption" tone="muted">
              Evento hoje
            </V2Text>
            <V2Heading level={3} size="small">
              Café & Conversa
            </V2Heading>
            <V2Text variant="body" tone="secondary">
              Um encontro leve para quem quer conhecer gente nova.
            </V2Text>
          </V2Surface>
          <V2Surface as="article" padding="medium">
            <BookOpenText aria-hidden="true" />
            <V2Text variant="caption" tone="muted">
              Reflexão da semana
            </V2Text>
            <V2Heading level={3} size="small">
              Hospitalidade no cotidiano
            </V2Heading>
            <V2Text variant="body" tone="secondary">
              Uma leitura curta e três perguntas para conversar.
            </V2Text>
          </V2Surface>
          <V2Surface as="article" padding="medium">
            <MessageCircle aria-hidden="true" />
            <V2Text variant="caption" tone="muted">
              Conversa
            </V2Text>
            <V2Heading level={3} size="small">
              Projeto de voluntariado
            </V2Heading>
            <V2Text variant="body" tone="secondary">
              Rafael respondeu há poucos minutos.
            </V2Text>
          </V2Surface>
        </div>
      )}

      <V2Surface as="section" className="vdn-v2-shell-showcase-empty" padding="large">
        <UsersRound aria-hidden="true" />
        <V2Heading level={2} size="small">
          Seus grupos favoritos aparecerão aqui
        </V2Heading>
        <V2Text variant="body" tone="muted">
          Você ainda não fixou nenhum grupo. Explore espaços e escolha os que fazem sentido para sua
          caminhada.
        </V2Text>
        <V2Button variant="outline" size="small" leadingIcon={<Plus />}>
          Explorar grupos
        </V2Button>
      </V2Surface>
    </>
  );
}

function CommunityContent() {
  return (
    <>
      <div className="vdn-v2-shell-showcase-filter-row" aria-label="Filtros demonstrativos">
        <V2Button variant="secondary" size="small">
          Para você
        </V2Button>
        <V2Button variant="ghost" size="small">
          Seguindo
        </V2Button>
        <V2Button variant="ghost" size="small">
          Grupos
        </V2Button>
        <V2Button variant="ghost" size="small">
          Eventos
        </V2Button>
      </div>
      <div className="vdn-v2-shell-showcase-feed">
        {communityPosts.map((post) => (
          <V2Surface key={`${post.author}-${post.time}`} as="article" padding="large">
            <header>
              <span className="vdn-v2-shell-showcase-avatar" aria-hidden="true">
                {post.author.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{post.author}</strong>
                <V2Text as="span" variant="caption" tone="muted">
                  {post.context} · {post.time}
                </V2Text>
              </span>
              <V2StatusBadge tone="brand">{post.tag}</V2StatusBadge>
            </header>
            <V2Text variant="bodyLarge">{post.text}</V2Text>
            <footer>
              <button type="button">Apoiar</button>
              <button type="button">Conversar</button>
              <button type="button">Salvar</button>
            </footer>
          </V2Surface>
        ))}
      </div>
    </>
  );
}

function GenericContent({ activeId }: { activeId: V2ShellNavigationId }) {
  const copy = pageCopy[activeId];
  const Icon =
    activeId === "conversations"
      ? MessageCircle
      : activeId === "profile"
        ? CheckCircle2
        : activeId === "shop"
          ? Sparkles
          : Music2;
  return (
    <>
      <V2Surface
        as="section"
        className="vdn-v2-shell-showcase-placeholder"
        padding="large"
        elevation="one"
      >
        <Icon aria-hidden="true" />
        <div>
          <V2StatusBadge tone="info">Demonstração do shell</V2StatusBadge>
          <V2Heading level={2} size="medium">
            {copy.title} está pronta para receber seu módulo.
          </V2Heading>
          <V2Text variant="bodyLarge" tone="secondary">
            Nesta etapa, a navegação e a composição são reais. Dados, persistência e regras de
            produto continuam intencionalmente fora do showcase.
          </V2Text>
        </div>
      </V2Surface>
      <div className="vdn-v2-shell-showcase-detail-grid">
        {["Estado vazio", "Estado de carregamento", "Conteúdo com contexto"].map((title, index) => (
          <V2Surface key={title} as="article" padding="medium">
            <Clock3 aria-hidden="true" />
            <V2Heading level={3} size="small">
              {title}
            </V2Heading>
            <V2Text variant="body" tone="muted">
              {index === 0
                ? "Explica o que aconteceu e oferece uma próxima ação legítima."
                : index === 1
                  ? "Preserva o layout sem prometer que uma operação foi concluída."
                  : "Usa a coluna contextual apenas quando ela melhora a tarefa atual."}
            </V2Text>
          </V2Surface>
        ))}
      </div>
    </>
  );
}

export function V2AppShellShowcase() {
  const [activeId, setActiveId] = useState<V2ShellNavigationId>("home");
  const [theme, setTheme] = useState<V2ThemeName>("light");
  const [sidebarMode, setSidebarMode] = useState<V2SidebarMode>("expanded");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(
    "Showcase local: nenhuma ação acessa backend ou persiste dados.",
  );

  const navigation = useMemo(
    () =>
      V2_PRIMARY_NAVIGATION.map((item) =>
        item.id === "conversations" ? { ...item, badge: 3 } : item,
      ),
    [],
  );

  const navigate = (item: V2ShellNavigationItem) => {
    setActiveId(item.id);
    setFeedback(`Navegação demonstrativa para “${item.label}”.`);
  };

  const currentCopy = pageCopy[activeId];
  const page: V2ShellPageConfig = {
    ...currentCopy,
    breadcrumbs:
      activeId === "home"
        ? undefined
        : [{ label: "Início", href: "#inicio" }, { label: currentCopy.title }],
    primaryAction:
      activeId === "community"
        ? {
            label: "Participar",
            icon: Plus,
            onSelect: () => setFeedback("Ação demonstrativa: participar da comunidade."),
          }
        : undefined,
    contextRail: <ContextRailContent />,
  };

  const onCreateAction = (action: V2CreateAction) => {
    setFeedback(`“${action.label}” foi selecionado. Nenhum conteúdo foi publicado.`);
  };

  return (
    <V2AppShell
      page={page}
      activeNavigationId={activeId}
      navigation={navigation}
      secondaryNavigation={V2_SECONDARY_NAVIGATION}
      user={{
        displayName: "Marina Oliveira",
        supportingText: "Participa desde 2024",
        initials: "MO",
        status: "online",
      }}
      notifications={notifications}
      theme={theme}
      sidebarMode={sidebarMode}
      onSidebarModeChange={setSidebarMode}
      onThemeChange={setTheme}
      onNavigate={navigate}
      onCreateAction={onCreateAction}
      onSearch={(query) =>
        setFeedback(
          query
            ? `Busca demonstrativa por “${query}”. Nenhuma consulta foi enviada.`
            : "Digite algo para demonstrar a busca.",
        )
      }
    >
      <V2Surface
        className="vdn-v2-shell-showcase-feedback"
        padding="small"
        tone="subtle"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 aria-hidden="true" />
        <V2Text variant="caption" tone="secondary">
          {feedback}
        </V2Text>
      </V2Surface>
      {activeId === "home" ? (
        <HomeContent loading={loading} onLoadingChange={setLoading} />
      ) : activeId === "community" ? (
        <CommunityContent />
      ) : (
        <GenericContent activeId={activeId} />
      )}
    </V2AppShell>
  );
}
