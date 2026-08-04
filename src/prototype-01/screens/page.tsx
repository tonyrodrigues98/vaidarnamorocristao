"use client";

import {
  ArrowLeft,
  Bell,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Clapperboard,
  Clock3,
  Compass,
  Gamepad2,
  Heart,
  HeartHandshake,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Flag,
  Globe2,
  LogOut,
  LockKeyhole,
  MapPin,
  Medal,
  MessageCircle,
  MoreHorizontal,
  Moon,
  Palette,
  PawPrint,
  Pin,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trophy,
  UserPlus,
  UsersRound,
  Video,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { CinemaExperience } from "../components/CinemaExperience";
import { PetsExperience } from "../components/PetsExperience";
import { ChatComposer } from "../components/ChatComposer";
import CreateCenterExperience, { type CreateContext } from "../components/CreateCenterExperience";
import GlobalSearchExperience, { type SearchContext } from "../components/GlobalSearchExperience";
import ResilienceLayer from "../components/ResilienceLayer";
import ImmersiveMediaLayer from "../components/ImmersiveMediaLayer";
import UniversalActions from "../components/UniversalActions";
import type { GiftsAction, GiftsTab } from "../components/GiftsRewardsExperience";
import type {
  ActivityTab as MyActivityTab,
  MyActivityItem,
} from "../components/MyActivityExperience";
import type { ConversationKind } from "../components/ConversationDetailsExperience";
import "../styles/globals.css";
import "../styles/ImmersiveRefinement.css";
import "../styles/NativeFirstConvergence.css";
import "../styles/ThemeDark.css";

const ArcadeExperience = lazy(() => import("../components/ArcadeExperience"));
const StoreExperience = lazy(() => import("../components/StoreExperience"));
const VerboExperience = lazy(() => import("../components/VerboExperience"));
const PeopleExperience = lazy(() => import("../components/PeopleExperience"));
const DatingExperience = lazy(() => import("../components/DatingExperience"));
const SettingsExperience = lazy(() => import("../components/SettingsExperience"));
const EventsExperience = lazy(() => import("../components/EventsExperience"));
const AdminExperience = lazy(() => import("../components/AdminExperience"));
const OnboardingExperience = lazy(() => import("../components/OnboardingExperience"));
const ActivityExperience = lazy(() => import("../components/ActivityExperience"));
const ProfileStudioExperience = lazy(() => import("../components/ProfileStudioExperience"));
const ProgressionExperience = lazy(() => import("../components/ProgressionExperience"));
const GiftsRewardsExperience = lazy(() => import("../components/GiftsRewardsExperience"));
const LiveExperience = lazy(() => import("../components/LiveExperience"));
const TrustCenterExperience = lazy(() => import("../components/TrustCenterExperience"));
const MyActivityExperience = lazy(() => import("../components/MyActivityExperience"));
const PublicExperience = lazy(() => import("../components/PublicExperience"));
const EditorialExperience = lazy(() => import("../components/EditorialExperience"));
const ConversationDetailsExperience = lazy(
  () => import("../components/ConversationDetailsExperience"),
);

type TabId = "home" | "community" | "explore" | "messages" | "profile";
type Overlay = "account" | "search" | "notifications" | null;
type CommunitySection = "Agora" | "Espaços" | "Eventos";
type SpaceTab = "Mural" | "Conversa" | "Eventos" | "Sobre";
type AppearanceMode = "system" | "light" | "dark";

const tabs = [
  { id: "home" as const, label: "Início", icon: Home },
  { id: "community" as const, label: "Comunidade", icon: UsersRound },
  { id: "explore" as const, label: "Explorar", icon: Compass },
  { id: "messages" as const, label: "Conversas", icon: MessageCircle, badge: 3 },
  { id: "profile" as const, label: "Perfil", icon: CircleUserRound },
];

const availableShortcuts = [
  { id: "verbo", label: "Verbo", icon: BookOpen, tone: "verbo" },
  { id: "cinema", label: "Cinema", icon: Clapperboard, tone: "cinema" },
  { id: "pet", label: "Pet", icon: PawPrint, tone: "pet" },
  { id: "jogos", label: "Jogos", icon: Gamepad2, tone: "jogos" },
  { id: "comunidade", label: "Comunidade", icon: UsersRound, tone: "community" },
  { id: "loja", label: "Loja", icon: Store, tone: "store" },
  { id: "progresso", label: "Progresso", icon: Trophy, tone: "progress" },
  { id: "live", label: "Live", icon: Radio, tone: "live" },
] as const;

type ShortcutId = (typeof availableShortcuts)[number]["id"];

const defaultShortcutIds: ShortcutId[] = ["verbo", "cinema", "pet", "jogos"];

function IconButton({
  label,
  children,
  onClick,
  dot,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  dot?: boolean;
}) {
  return (
    <button className="icon-button pressable" aria-label={label} onClick={onClick}>
      {children}
      {dot && <span className="notification-dot" aria-label="Há novidades" />}
    </button>
  );
}

function HomeScreen({
  openOverlay,
  showToast,
  openConversation,
  openDiscovery,
  openLive,
}: {
  openOverlay: (overlay: Overlay) => void;
  showToast: (message: string) => void;
  openConversation: (name: string) => void;
  openDiscovery: () => void;
  openLive: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [shortcutIds, setShortcutIds] = useState<ShortcutId[]>(defaultShortcutIds);
  const [showPriority, setShowPriority] = useState(true);
  const [showConversation, setShowConversation] = useState(true);
  const greeting = "Boa noite";

  const selectedShortcuts = shortcutIds
    .map((id) => availableShortcuts.find((shortcut) => shortcut.id === id))
    .filter((shortcut): shortcut is (typeof availableShortcuts)[number] => Boolean(shortcut));

  const continueReading = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      showToast("Leitura de João 8 aberta");
    }, 650);
  };

  const chooseShortcut = (id: ShortcutId) => {
    if (shortcutIds.includes(id)) {
      showToast("Quatro atalhos devem permanecer ativos");
      return;
    }

    setShortcutIds((current) => [...current.slice(1), id]);
    showToast("Atalho substituído");
  };

  const restoreHome = () => {
    setShortcutIds(defaultShortcutIds);
    setShowPriority(true);
    setShowConversation(true);
    showToast("Painel padrão restaurado");
  };

  return (
    <section className="screen home-screen" aria-labelledby="home-title">
      <div className="page-scroll home-page-scroll">
        <header className="topbar home-topbar">
          <div className="brand">
            <img src="/logo-oficial-transparente.png" alt="" className="brand-logo" />
            <span>VaiDarNamoro</span>
          </div>
          <div className="topbar-actions">
            <IconButton label="Abrir busca" onClick={() => openOverlay("search")}>
              <Search size={20} />
            </IconButton>
            <IconButton label="Abrir notificações" onClick={() => openOverlay("notifications")} dot>
              <Bell size={20} />
            </IconButton>
            <button
              className="avatar avatar-md topbar-avatar-button pressable"
              aria-label="Abrir conta de Antonio"
              onClick={() => openOverlay("account")}
            >
              AR
            </button>
          </div>
        </header>

        <div className="home-content">
          <div className="home-layout">
            <div className="home-main-column">
              <div className="greeting">
                <h1 id="home-title">{greeting}, Antonio</h1>
              </div>

              <button
                className="verse-panel pressable"
                onClick={() => showToast("Salmos 28 aberto no Verbo")}
              >
                <span className="verse-orbit verse-orbit-one" />
                <span className="verse-orbit verse-orbit-two" />
                <span className="verse-kicker">
                  <BookOpen size={15} />
                  PALAVRA DO DIA
                </span>
                <blockquote>
                  “O Senhor é a minha força e o meu escudo; nele o meu coração confia.”
                </blockquote>
                <span className="verse-reference">Salmos 28:7 · NAA</span>
                <span className="verse-support">Para guardar no coração ao longo do dia.</span>
                <span className="verse-open">
                  Abrir no Verbo <ChevronRight size={16} />
                </span>
              </button>

              {showPriority && (
                <section className="section-block priority-section" aria-label="Prioridade">
                  <button className="priority-object pressable" onClick={continueReading}>
                    {loading ? (
                      <div className="priority-skeleton" aria-label="Carregando leitura">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : (
                      <>
                        <div className="priority-icon">
                          <BookOpen size={21} />
                        </div>
                        <div className="priority-copy">
                          <strong>Continue sua leitura</strong>
                          <span>João 8 · 4 minutos restantes</span>
                        </div>
                        <span className="priority-action">
                          Continuar <ChevronRight size={16} />
                        </span>
                      </>
                    )}
                  </button>
                </section>
              )}

              <section className="section-block shortcuts-section">
                <div className="section-heading">
                  <h2>Seus atalhos</h2>
                  <button onClick={() => setCustomizeOpen(true)}>Personalizar</button>
                </div>
                <div className="shortcut-grid">
                  {selectedShortcuts.map(({ id, label, icon: Icon, tone }) => (
                    <button
                      key={id}
                      className={`shortcut pressable shortcut-${tone}`}
                      onClick={() => {
                        if (id === "progresso") {
                          window.dispatchEvent(
                            new CustomEvent("vdn-open-experience", { detail: "progresso" }),
                          );
                          return;
                        }
                        if (id === "live") {
                          openLive();
                          return;
                        }
                        showToast(`${label} aberto em modo de demonstração`);
                      }}
                    >
                      <span className="shortcut-icon">
                        <Icon size={23} />
                      </span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <button className="home-live-object pressable" onClick={openLive}>
                <span className="home-live-visual">
                  <span>
                    <i /> AO VIVO
                  </span>
                  <Radio size={30} />
                  <small>186 assistindo</small>
                </span>
                <span className="home-live-copy">
                  <span className="section-overline">LIVE OFICIAL</span>
                  <strong>Comunidade que acolhe</strong>
                  <small>Com Lucas Almeida e convidados</small>
                  <em>
                    Assistir agora <ChevronRight size={16} />
                  </em>
                </span>
              </button>

              <button className="discovery-object pressable" onClick={openDiscovery}>
                <div className="discovery-art">
                  <span className="discovery-date">HOJE · 20H</span>
                  <Clapperboard size={28} />
                </div>
                <div className="discovery-copy">
                  <span className="section-overline">ACONTECENDO HOJE</span>
                  <h2>Cinema em comunidade</h2>
                  <p>Uma sessão leve, conversa boa e gente nova para conhecer.</p>
                  <span className="discovery-action">
                    Ver sessão <ChevronRight size={16} />
                  </span>
                </div>
              </button>
            </div>

            <aside className="home-day-panel" aria-label="Painel do dia">
              <span className="day-panel-label">Painel do dia</span>
              <section className="section-block quiet-progress">
                <div className="section-heading">
                  <div>
                    <span className="section-overline">SEU RITMO</span>
                    <h2>Hoje</h2>
                  </div>
                  <span className="progress-caption">3 de 5 dias</span>
                </div>
                <div className="rhythm-strip">
                  <span>
                    <BookOpen size={16} />
                    <strong>68%</strong>
                    <small>Verbo</small>
                  </span>
                  <span>
                    <PawPrint size={16} />
                    <strong>Nível 7</strong>
                    <small>Pet</small>
                  </span>
                  <span>
                    <Trophy size={16} />
                    <strong>3/5</strong>
                    <small>Desafio</small>
                  </span>
                </div>
              </section>

              {showConversation && (
                <button
                  className="conversation-prompt pressable"
                  onClick={() => openConversation("Ana Clara")}
                >
                  <div className="avatar avatar-md avatar-ana">AC</div>
                  <span className="conversation-copy">
                    <span className="section-overline">CONVERSA RELEVANTE</span>
                    <strong>Ana Clara</strong>
                    <span>“Também gostei muito daquele texto de João…”</span>
                  </span>
                  <span className="conversation-time">14:32</span>
                  <span className="conversation-unread" aria-label="2 mensagens não lidas">
                    2
                  </span>
                </button>
              )}
            </aside>
          </div>

          <footer className="end-of-day">
            <Sparkles size={18} />
            <strong>Você chegou ao fim do seu painel.</strong>
            <span>Volte quando quiser. Sem pressa.</span>
          </footer>
        </div>
      </div>

      <Sheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        title="Personalizar Início"
      >
        <div className="home-customization">
          <p>Escolha quatro experiências. Uma nova escolha substitui a mais antiga.</p>
          <div className="shortcut-options">
            {availableShortcuts.map(({ id, label, icon: Icon }) => {
              const selected = shortcutIds.includes(id);
              return (
                <button
                  key={id}
                  className={selected ? "selected" : ""}
                  onClick={() => chooseShortcut(id)}
                  aria-pressed={selected}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                  {selected && <Check size={17} />}
                </button>
              );
            })}
          </div>
          <div className="home-module-options">
            <button onClick={() => setShowPriority((visible) => !visible)}>
              <span>
                <strong>Prioridade do dia</strong>
                <small>Continuar leitura ou outra ação importante</small>
              </span>
              <span className={`switch ${showPriority ? "on" : ""}`} />
            </button>
            <button onClick={() => setShowConversation((visible) => !visible)}>
              <span>
                <strong>Conversa relevante</strong>
                <small>Exibir apenas quando houver algo importante</small>
              </span>
              <span className={`switch ${showConversation ? "on" : ""}`} />
            </button>
          </div>
          <button className="restore-home" onClick={restoreHome}>
            Restaurar padrão
          </button>
        </div>
      </Sheet>
    </section>
  );
}

function CommunityPostHeader({
  name,
  initials,
  context,
  time,
  avatarClass = "",
  contextAction = "Conteúdo relacionado aberto",
  openProfile,
  showToast,
}: {
  name: string;
  initials: string;
  context: string;
  time: string;
  avatarClass?: string;
  contextAction?: string;
  openProfile: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <header className="post-author">
      <button
        className={`avatar avatar-md ${avatarClass} post-profile-trigger`}
        onClick={openProfile}
        aria-label={`Abrir perfil de ${name}`}
      >
        {initials}
      </button>
      <div>
        <button className="post-author-name" onClick={openProfile}>
          {name}
        </button>
        <span>
          <button onClick={() => showToast(contextAction)}>{context}</button>
          <b>·</b> {time}
        </span>
      </div>
      <button
        aria-label={`Mais opções da publicação de ${name}`}
        onClick={() => showToast("Opções da publicação abertas")}
      >
        <MoreHorizontal size={20} />
      </button>
    </header>
  );
}

function CommunityScreen({
  showToast,
  openProfile,
  onKeyboard,
  onSpaceContextChange,
}: {
  showToast: (message: string) => void;
  openProfile: () => void;
  onKeyboard: (open: boolean) => void;
  onSpaceContextChange: (open: boolean) => void;
}) {
  const [section, setSection] = useState<CommunitySection>("Agora");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [praying, setPraying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPosts, setNewPosts] = useState(0);
  const [online, setOnline] = useState(true);
  const [dataSaver] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [demoState, setDemoState] = useState("normal");
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [spaceTab, setSpaceTab] = useState<SpaceTab>("Mural");
  const [spaceSearch, setSpaceSearch] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("Todos");
  const [spaceMembership, setSpaceMembership] = useState<"joined" | "available" | "pending">(
    "joined",
  );
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [spaceDraft, setSpaceDraft] = useState("");
  const [spaceCreateOpen, setSpaceCreateOpen] = useState(false);
  const [spaceCreateStep, setSpaceCreateStep] = useState(1);
  const [spaceCreated, setSpaceCreated] = useState(false);
  const [setupDone, setSetupDone] = useState<string[]>([]);
  const communityRef = useRef<HTMLElement | null>(null);
  const spaceThreadRef = useRef<HTMLDivElement | null>(null);
  const videoPreviewRef = useRef<HTMLButtonElement | null>(null);
  const pullStartRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const sectionScrollRef = useRef<Record<CommunitySection, number>>({
    Agora: 0,
    Espaços: 0,
    Eventos: 0,
  });
  const spaceScrollRef = useRef<Record<SpaceTab, number>>({
    Mural: 0,
    Conversa: 0,
    Eventos: 0,
    Sobre: 0,
  });
  const reactionTimerRef = useRef<number | null>(null);
  const getCommunityScroller = () =>
    communityRef.current?.querySelector<HTMLElement>(".community-section-pane.active") ?? null;

  const moments = [
    ["Seu Momento", "AR", "own", "Seu Momento"],
    ["Ana Clara", "AC", "unseen", "Amiga"],
    ["Lucas", "LA", "seen", "Amigo"],
    ["Café & Bíblia", "CB", "space", "Espaço"],
    ["Encontro hoje", "21", "event", "Evento"],
    ["Marina", "MS", "unseen", "Amiga"],
  ];

  useEffect(() => {
    const savedSection = window.localStorage.getItem("vdn-community-section");
    const requestedState =
      new URLSearchParams(window.location.search).get("communityState") ?? "normal";
    const initializeState = window.setTimeout(() => {
      if (savedSection === "Agora" || savedSection === "Espaços" || savedSection === "Eventos") {
        setSection(savedSection);
      }
      setDemoState(requestedState);
      setOnline(navigator.onLine);
    }, 0);

    const finishLoading = window.setTimeout(() => setLoading(false), 620);
    const announceNewPosts = window.setTimeout(() => {
      if (requestedState === "normal") setNewPosts(3);
    }, 4800);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.clearTimeout(initializeState);
      window.clearTimeout(finishLoading);
      window.clearTimeout(announceNewPosts);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const preview = videoPreviewRef.current;
    if (!preview) return;
    const observer = new IntersectionObserver(([entry]) => setVideoVisible(entry.isIntersecting), {
      threshold: 0.65,
    });
    observer.observe(preview);
    return () => observer.disconnect();
  }, [loading, demoState]);

  useEffect(() => {
    const openSection = (event: Event) => {
      const requested = (event as CustomEvent<string>).detail;
      if (requested !== "Agora" && requested !== "Espaços" && requested !== "Eventos") return;
      setSpaceOpen(false);
      setSection(requested);
      window.localStorage.setItem("vdn-community-section", requested);
      window.requestAnimationFrame(() => {
        getCommunityScroller()?.scrollTo({ top: 0, behavior: "auto" });
      });
    };
    window.addEventListener("vdn-open-community-section", openSection);
    return () => window.removeEventListener("vdn-open-community-section", openSection);
  }, []);

  useEffect(() => {
    const savedTab = window.localStorage.getItem("vdn-space-tab");
    const restoreTab = window.setTimeout(() => {
      if (
        savedTab === "Mural" ||
        savedTab === "Conversa" ||
        savedTab === "Eventos" ||
        savedTab === "Sobre"
      ) {
        setSpaceTab(savedTab);
      }
    }, 0);
    return () => {
      window.clearTimeout(restoreTab);
      onKeyboard(false);
      onSpaceContextChange(false);
    };
  }, [onKeyboard, onSpaceContextChange]);

  useEffect(() => {
    onSpaceContextChange(spaceOpen);
  }, [onSpaceContextChange, spaceOpen]);

  useEffect(() => {
    if (!spaceOpen || spaceTab !== "Conversa") return;
    window.requestAnimationFrame(() => {
      const thread = spaceThreadRef.current;
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }, [spaceOpen, spaceTab]);

  const changeSection = (nextSection: CommunitySection) => {
    const scroller = getCommunityScroller();
    if (scroller) sectionScrollRef.current[section] = scroller.scrollTop;
    setSection(nextSection);
    window.localStorage.setItem("vdn-community-section", nextSection);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        getCommunityScroller()?.scrollTo({
          top: sectionScrollRef.current[nextSection],
          behavior: "auto",
        });
      });
    });
  };

  const changeSpaceTab = (nextTab: SpaceTab) => {
    const scroller = getCommunityScroller();
    if (scroller) spaceScrollRef.current[spaceTab] = scroller.scrollTop;
    setSpaceTab(nextTab);
    window.localStorage.setItem("vdn-space-tab", nextTab);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        getCommunityScroller()?.scrollTo({
          top: spaceScrollRef.current[nextTab],
          behavior: "auto",
        });
      });
    });
  };

  const openSpace = (tab: SpaceTab = "Mural") => {
    setSpaceOpen(true);
    setSpaceTab(tab);
    window.localStorage.setItem("vdn-space-tab", tab);
    window.requestAnimationFrame(() =>
      getCommunityScroller()?.scrollTo({ top: 0, behavior: "auto" }),
    );
  };

  const closeSpace = () => {
    setSpaceOpen(false);
    setSpaceTab("Mural");
    onKeyboard(false);
    window.requestAnimationFrame(() => {
      getCommunityScroller()?.scrollTo({
        top: sectionScrollRef.current.Espaços,
        behavior: "auto",
      });
    });
  };

  const sendSpaceMessage = () => {
    if (!spaceDraft.trim()) return;
    setSpaceDraft("");
    showToast("Mensagem enviada ao Espaço");
    window.requestAnimationFrame(() => {
      const thread = spaceThreadRef.current;
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  };

  const triggerRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setNewPosts(3);
      showToast("Novas publicações prontas");
    }, 720);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const scroller = getCommunityScroller();
    if ((scroller?.scrollTop ?? 0) <= 2) {
      pullStartRef.current = event.touches[0]?.clientY ?? null;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (pullStartRef.current === null) return;
    pullDistanceRef.current = Math.max(
      0,
      (event.touches[0]?.clientY ?? pullStartRef.current) - pullStartRef.current,
    );
  };

  const handleTouchEnd = () => {
    if (pullDistanceRef.current > 64 && !refreshing) triggerRefresh();
    pullStartRef.current = null;
    pullDistanceRef.current = 0;
  };

  const beginReactionHold = () => {
    reactionTimerRef.current = window.setTimeout(() => setReactionOpen(true), 460);
  };

  const cancelReactionHold = () => {
    if (reactionTimerRef.current) {
      window.clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
  };

  const loadingState = loading || demoState === "loading";
  const offlineState = !online || demoState === "offline";

  return (
    <section
      ref={communityRef}
      className="screen community-screen"
      aria-label="Comunidade"
      data-action-context="publication"
      data-action-title="Comunidade"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!spaceOpen && (
        <>
          <header className="topbar contextual-topbar">
            <h1>Comunidade</h1>
            <div className="community-topbar-actions">
              <button
                className="community-search-button pressable"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("vdn-open-global-search", {
                      detail: section === "Espaços" ? "Espaços" : "Comunidade",
                    }),
                  )
                }
              >
                <Search size={18} />
                <span>Buscar</span>
              </button>
              <button
                className="create-button pressable"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("vdn-open-create-center", {
                      detail: section === "Espaços" ? "Espaços" : "Comunidade",
                    }),
                  )
                }
              >
                <Plus size={18} /> Criar
              </button>
            </div>
          </header>

          <div className="community-tabs tab-strip" role="tablist">
            {(["Agora", "Espaços", "Eventos"] as CommunitySection[]).map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={section === item}
                className={section === item ? "active" : ""}
                onClick={() => changeSection(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}

      <div
        className={`community-section-pane ${!spaceOpen && section === "Agora" ? "active" : ""}`}
      >
        <div className="community-flow">
          <div className={`pull-indicator ${refreshing ? "active" : ""}`}>
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Atualizando" : "Puxe para atualizar"}
          </div>

          {offlineState && (
            <div className="community-status-banner" role="status">
              <WifiOff size={15} />
              Você está offline. Exibindo atividades já carregadas.
            </div>
          )}

          <div className="moments-scroller" aria-label="Momentos">
            {loadingState
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div className="moment moment-skeleton" key={index}>
                    <span className="skeleton-circle" />
                    <span className="skeleton-line" />
                  </div>
                ))
              : moments.map(([name, initials, tone], index) => (
                  <button
                    key={name}
                    className="moment pressable"
                    aria-label={tone === "own" ? "Criar seu Momento" : `Abrir Momento de ${name}`}
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("vdn-open-media", {
                          detail: {
                            kind: tone === "own" ? "create" : "moment",
                            title: name,
                            index: Math.max(0, index - 1),
                          },
                        }),
                      )
                    }
                  >
                    <span className={`moment-ring moment-${tone}`}>
                      <span className="avatar">{initials}</span>
                      {tone === "own" && <Plus size={13} />}
                    </span>
                    <em>{name}</em>
                  </button>
                ))}
          </div>

          {newPosts > 0 && !loadingState && (
            <button
              className="new-posts-notice pressable"
              onClick={() => {
                setNewPosts(0);
                getCommunityScroller()?.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
                showToast(`${newPosts} novas publicações carregadas`);
              }}
            >
              <RefreshCw size={15} />
              {newPosts} novas publicações
            </button>
          )}

          {loadingState ? (
            <div className="community-post-skeleton" aria-label="Carregando publicações">
              <div className="skeleton-post-head">
                <span className="skeleton-circle" />
                <span>
                  <i />
                  <i />
                </span>
              </div>
              <span className="skeleton-copy" />
              <span className="skeleton-media" />
            </div>
          ) : demoState === "empty" ? (
            <div className="community-empty-state">
              <UsersRound size={30} />
              <h2>Ainda não há novidades por aqui</h2>
              <p>Participe de Espaços ou adicione Amigos para ver mais atividades.</p>
              <button className="pressable" onClick={() => changeSection("Espaços")}>
                Explorar Espaços
              </button>
            </div>
          ) : (
            <>
              <article className="social-post photo-post">
                <CommunityPostHeader
                  name="Lucas Almeida"
                  initials="LA"
                  avatarClass="avatar-lucas"
                  context="publicou para a Comunidade"
                  time="18 min"
                  openProfile={openProfile}
                  showToast={showToast}
                />
                <p>
                  Fé também é encontrar gente boa no caminho. O pôr do sol de hoje veio acompanhado
                  de conversas que fizeram bem.
                </p>
                <img
                  src="/community-peruibe.png"
                  alt="Grupo de amigos caminhando no calçadão de Peruíbe ao pôr do sol"
                />
                <div className="post-meta">
                  <span>{liked ? "39" : "38"} pessoas curtiram</span>
                  <button onClick={() => setCommentsOpen(true)}>7 comentários</button>
                </div>
                <div className="post-actions">
                  <button
                    className={`pressable ${liked ? "active" : ""}`}
                    onClick={() => setLiked((current) => !current)}
                    onPointerDown={beginReactionHold}
                    onPointerUp={cancelReactionHold}
                    onPointerLeave={cancelReactionHold}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setReactionOpen(true);
                    }}
                  >
                    <Heart size={18} fill={liked ? "currentColor" : "none"} />
                    {liked ? "Curtido" : "Curtir"}
                  </button>
                  <button className="pressable" onClick={() => setCommentsOpen(true)}>
                    <MessageCircle size={18} /> Comentar
                  </button>
                </div>
                <div className="comment-preview">
                  <p>
                    <strong>Ana Clara</strong> Que tarde linda! Foi muito bom estar com vocês.
                  </p>
                  <p>
                    <strong>Marina Souza</strong> Essa comunidade me faz tão bem.
                  </p>
                  <button onClick={() => setCommentsOpen(true)}>Ver todos os comentários</button>
                </div>
              </article>

              {demoState === "error" ? (
                <div className="community-partial-error" role="alert">
                  <div>
                    <strong>Algumas atividades não carregaram</strong>
                    <span>O restante da Comunidade continua disponível.</span>
                  </div>
                  <button
                    onClick={() => {
                      setDemoState("normal");
                      showToast("Atividades carregadas");
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <>
                  <article className="social-post prayer-post">
                    <CommunityPostHeader
                      name="Ana Clara"
                      initials="AC"
                      avatarClass="avatar-ana"
                      context="pediu oração"
                      time="42 min"
                      openProfile={openProfile}
                      showToast={showToast}
                    />
                    <div className="prayer-context">
                      <div className="prayer-title">
                        <span className="prayer-symbol">
                          <HeartHandshake size={18} />
                        </span>
                        <div>
                          <span>Pedido de oração</span>
                          <h2>Uma semana importante pela frente</h2>
                        </div>
                      </div>
                      <p>
                        Se puderem, orem pela minha família. Estamos tomando uma decisão importante
                        e precisamos de paz e sabedoria.
                      </p>
                    </div>
                    <div className="post-meta">
                      <span>{praying ? "24" : "23"} pessoas estão orando</span>
                      <button onClick={() => setCommentsOpen(true)}>4 comentários</button>
                    </div>
                    <div className="post-actions">
                      <button
                        className={`pressable ${praying ? "active" : ""}`}
                        onClick={() => {
                          setPraying(!praying);
                          showToast(
                            praying ? "Oração removida" : "Ana saberá que você está orando",
                          );
                        }}
                      >
                        {praying ? <Check size={18} /> : <HeartHandshake size={18} />}
                        Estou orando
                      </button>
                      <button className="pressable" onClick={() => setCommentsOpen(true)}>
                        <MessageCircle size={18} /> Comentar
                      </button>
                    </div>
                    <div className="comment-preview compact">
                      <p>
                        <strong>Rafael Lima</strong> Estamos com vocês em oração.
                      </p>
                    </div>
                  </article>

                  <article className="social-post vertical-video-post">
                    <CommunityPostHeader
                      name="Marina Souza"
                      initials="MS"
                      avatarClass="avatar-marina"
                      context="no Espaço Café, Bíblia & Amizade"
                      time="1 h"
                      contextAction="Espaço Café, Bíblia & Amizade aberto"
                      openProfile={openProfile}
                      showToast={showToast}
                    />
                    <p className="video-intro">
                      Uma pergunta simples que mudou toda a conversa de ontem.
                    </p>
                    <button
                      ref={videoPreviewRef}
                      className={`video-poster pressable ${
                        videoVisible && !dataSaver ? "playing" : ""
                      }`}
                      aria-label="Abrir vídeo vertical em modo imersivo"
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("vdn-open-media", {
                            detail: { kind: "video", title: "Marina Souza", index: 4 },
                          }),
                        )
                      }
                    >
                      <img
                        src="/community-peruibe.png"
                        alt="Amigos da comunidade durante encontro"
                      />
                      <span className="video-play">
                        <Play size={22} fill="currentColor" />
                      </span>
                      <span className="video-duration">0:28</span>
                      <span className="video-muted">
                        {dataSaver ? <WifiOff size={13} /> : <VolumeX size={13} />}
                        {dataSaver ? "Economia de dados" : "Sem som"}
                      </span>
                    </button>
                    <div className="post-meta">
                      <span>31 pessoas celebraram</span>
                      <button onClick={() => setCommentsOpen(true)}>6 comentários</button>
                    </div>
                    <div className="post-actions">
                      <button
                        className="pressable"
                        onClick={() => showToast("Você celebrou este momento")}
                      >
                        <Sparkles size={18} /> Celebrar
                      </button>
                      <button className="pressable" onClick={() => setCommentsOpen(true)}>
                        <MessageCircle size={18} /> Comentar
                      </button>
                    </div>
                  </article>

                  <article className="social-post space-post">
                    <CommunityPostHeader
                      name="Café, Bíblia & Amizade"
                      initials="CB"
                      avatarClass="avatar-space"
                      context="publicou no Espaço"
                      time="2 h"
                      contextAction="Espaço Café, Bíblia & Amizade aberto"
                      openProfile={openProfile}
                      showToast={showToast}
                    />
                    <div className="space-post-content">
                      <span className="space-mark">
                        <BookOpen size={19} />
                      </span>
                      <div>
                        <h2>Conversa sobre João 8 hoje</h2>
                        <p>
                          Não precisa ter lido antes — só chegar como você está. O encontro começa
                          às 21h30.
                        </p>
                        <span className="space-members">Ana, Lucas e mais 246 participam</span>
                      </div>
                    </div>
                    <div className="space-post-footer">
                      <span>Hoje · 21h30 · Online</span>
                      <button
                        className="secondary-button pressable"
                        onClick={() => showToast("Participação confirmada")}
                      >
                        Participar
                      </button>
                    </div>
                  </article>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className={`community-section-pane space-detail-pane ${spaceOpen ? "active" : ""}`}>
        <div className={`space-detail ${spaceTab === "Conversa" ? "space-chat-active" : ""}`}>
          <header className="space-chat-mobile-header">
            <button aria-label="Voltar ao Mural do Espaço" onClick={() => changeSpaceTab("Mural")}>
              <ArrowLeft size={21} />
            </button>
            <span className="space-mini-icon">CB</span>
            <div>
              <strong>Café, Bíblia & Amizade</strong>
              <small>18 pessoas ativas</small>
            </div>
            <button aria-label="Mais opções">
              <MoreHorizontal size={21} />
            </button>
          </header>

          <div className="space-detail-header">
            <div className="space-cover">
              <button
                className="space-back-button"
                aria-label="Voltar para descoberta de Espaços"
                onClick={closeSpace}
              >
                <ArrowLeft size={21} />
              </button>
              <span>Café · Palavra · Gente real</span>
              <BookOpen size={34} />
              <button
                className="space-menu-button"
                aria-label="Mais opções do Espaço"
                onClick={() => showToast("Opções do Espaço abertas")}
              >
                <MoreHorizontal size={21} />
              </button>
            </div>
            <div className="space-detail-identity">
              <span className="space-detail-icon">CB</span>
              <div>
                <h1>Café, Bíblia & Amizade</h1>
                <p>Conversas leves, estudos e amizade cristã para viver a fé sem formalidade.</p>
                <button onClick={() => setMembersOpen(true)}>
                  248 membros · Ana e Lucas participam
                </button>
              </div>
              <button
                className="space-membership-button"
                onClick={() => {
                  setSpaceMembership(spaceMembership === "joined" ? "available" : "joined");
                  showToast(
                    spaceMembership === "joined" ? "Você saiu do Espaço" : "Você entrou no Espaço",
                  );
                }}
              >
                {spaceMembership === "joined" ? "Participando" : "Participar"}
              </button>
            </div>
          </div>

          <div className="space-tabs-shell">
            <nav className="space-tabs" aria-label="Áreas do Espaço">
              {(["Mural", "Conversa", "Eventos", "Sobre"] as SpaceTab[]).map((item) => (
                <button
                  key={item}
                  className={spaceTab === item ? "active" : ""}
                  aria-current={spaceTab === item ? "page" : undefined}
                  onClick={() => changeSpaceTab(item)}
                >
                  <span>{item}</span>
                </button>
              ))}
            </nav>
          </div>

          {spaceTab === "Mural" && (
            <div className="space-wall">
              {spaceCreated && setupDone.length < 5 && (
                <section className="space-setup-list">
                  <div>
                    <span className="section-overline">PREPARAÇÃO INICIAL</span>
                    <h2>Deixe seu Espaço pronto para receber pessoas</h2>
                  </div>
                  {[
                    "Adicionar capa",
                    "Escrever regras",
                    "Criar primeira publicação",
                    "Convidar pessoas",
                    "Criar evento",
                  ].map((item) =>
                    setupDone.includes(item) ? null : (
                      <button
                        key={item}
                        onClick={() => {
                          setSetupDone((current) => [...current, item]);
                          showToast(`${item}: concluído`);
                        }}
                      >
                        <span>{item}</span>
                        <ChevronRight size={17} />
                      </button>
                    ),
                  )}
                </section>
              )}

              {pinnedOpen && (
                <section className="pinned-post">
                  <Pin size={17} />
                  <div>
                    <span>PUBLICAÇÃO FIXADA</span>
                    <strong>Como cuidamos das conversas por aqui</strong>
                    <p>
                      Ouça antes de responder, preserve a história do outro e sinalize a moderação
                      quando algo não parecer seguro.
                    </p>
                  </div>
                  <button
                    aria-label="Recolher publicação fixada"
                    onClick={() => setPinnedOpen(false)}
                  >
                    <X size={17} />
                  </button>
                </section>
              )}

              {!pinnedOpen && (
                <button className="pinned-collapsed" onClick={() => setPinnedOpen(true)}>
                  <Pin size={15} /> Ver publicação fixada
                </button>
              )}

              {demoState === "space-wall-empty" ? (
                <div className="space-state-panel">
                  <MessageCircle size={29} />
                  <h2>Este Espaço está começando</h2>
                  <p>Crie a primeira publicação ou convide pessoas.</p>
                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("vdn-open-create-center", {
                          detail: "Espaços",
                        }),
                      )
                    }
                  >
                    Criar publicação
                  </button>
                </div>
              ) : (
                <div className="space-wall-posts">
                  <article className="space-wall-post">
                    <CommunityPostHeader
                      name="Ana Clara"
                      initials="AC"
                      avatarClass="avatar-ana"
                      context="Moderadora"
                      time="26 min"
                      openProfile={openProfile}
                      showToast={showToast}
                    />
                    <p>
                      Qual trecho de João 8 mais ficou com você nesta semana? Pode ser uma frase
                      curta — a ideia é conversar sem pressa.
                    </p>
                    <div className="post-meta">
                      <span>18 pessoas celebraram</span>
                      <button onClick={() => setCommentsOpen(true)}>5 comentários</button>
                    </div>
                    <div className="post-actions">
                      <button onClick={() => showToast("Você celebrou")}>
                        <Sparkles size={18} /> Celebrar
                      </button>
                      <button onClick={() => setCommentsOpen(true)}>
                        <MessageCircle size={18} /> Comentar
                      </button>
                    </div>
                    <div className="comment-preview compact">
                      <p>
                        <strong>Lucas Almeida</strong> “A verdade vos libertará” voltou comigo para
                        casa.
                      </p>
                    </div>
                  </article>

                  <article className="space-wall-post">
                    <CommunityPostHeader
                      name="Lucas Almeida"
                      initials="LA"
                      avatarClass="avatar-lucas"
                      context="Membro"
                      time="1 h"
                      openProfile={openProfile}
                      showToast={showToast}
                    />
                    <p>
                      Separei três perguntas simples para a conversa de hoje. Quem chegar depois
                      pode acompanhar normalmente.
                    </p>
                    <img src="/community-peruibe.png" alt="Amigos reunidos ao entardecer" />
                    <div className="post-meta">
                      <span>27 pessoas curtiram</span>
                      <button onClick={() => setCommentsOpen(true)}>8 comentários</button>
                    </div>
                    <div className="post-actions">
                      <button onClick={() => showToast("Publicação curtida")}>
                        <Heart size={18} /> Curtir
                      </button>
                      <button onClick={() => setCommentsOpen(true)}>
                        <MessageCircle size={18} /> Comentar
                      </button>
                    </div>
                  </article>
                </div>
              )}
            </div>
          )}

          {spaceTab === "Conversa" && (
            <div className="space-conversation">
              <div className="space-message-thread" ref={spaceThreadRef}>
                <div className="date-divider">Hoje</div>
                <div className="space-chat-message">
                  <span className="avatar avatar-sm avatar-ana">AC</span>
                  <div>
                    <strong>
                      Ana Clara <small>20:42</small>
                    </strong>
                    <p>Boa noite! Vamos começar João 8 em alguns minutos.</p>
                  </div>
                </div>
                <div className="space-chat-message">
                  <span className="avatar avatar-sm avatar-lucas">LA</span>
                  <div>
                    <strong>
                      Lucas Almeida <small>20:44</small>
                    </strong>
                    <p>Já estou por aqui. Trouxe as perguntas que comentei.</p>
                  </div>
                </div>
                <div className="space-chat-message own">
                  <span className="avatar avatar-sm">AR</span>
                  <div>
                    <strong>
                      Você <small>20:45</small>
                    </strong>
                    <p>Cheguei também. Quero ouvir vocês primeiro.</p>
                  </div>
                </div>
              </div>
              <ChatComposer
                className="space-chat-composer"
                value={spaceDraft}
                onChange={setSpaceDraft}
                onAttach={() => showToast("Anexos do Espaço abertos")}
                onFocus={() => {
                  onKeyboard(true);
                  window.requestAnimationFrame(() => {
                    const thread = spaceThreadRef.current;
                    if (thread) thread.scrollTop = thread.scrollHeight;
                  });
                }}
                onBlur={() => window.setTimeout(() => onKeyboard(false), 120)}
                placeholder="Mensagem no Espaço"
                label="Mensagem no Espaço"
                onSend={sendSpaceMessage}
              />
            </div>
          )}

          {spaceTab === "Eventos" && (
            <div className="space-events">
              <div className="space-section-intro">
                <span className="section-overline">PRÓXIMOS ENCONTROS</span>
                <h2>Momentos para participar sem sair daqui</h2>
              </div>
              {[
                ["28", "JUL", "Conversa sobre João 8", "Hoje · 21h30", "Ana Clara", "Online"],
                [
                  "30",
                  "JUL",
                  "Cinema — A Jornada da Esperança",
                  "Quarta · 20h",
                  "Lucas Almeida",
                  "Cinema",
                ],
                ["03", "AGO", "Café e Palavra", "Domingo · 19h", "Marina Souza", "Recorrente"],
              ].map(([day, month, title, time, owner, kind]) => (
                <article className="space-event-row" key={title}>
                  <div className="event-date">
                    <strong>{day}</strong>
                    <span>{month}</span>
                  </div>
                  <div>
                    <span>{kind}</span>
                    <h3>{title}</h3>
                    <p>
                      {time} · Organizado por {owner}
                    </p>
                  </div>
                  <button onClick={() => showToast("Interesse confirmado")}>Tenho interesse</button>
                </article>
              ))}
            </div>
          )}

          {spaceTab === "Sobre" && (
            <div className="space-about">
              <section>
                <span className="section-overline">SOBRE O ESPAÇO</span>
                <h2>Conversas simples, vínculos reais</h2>
                <p>
                  Um lugar para estudar a Bíblia, dividir a rotina e fazer amizades com respeito ao
                  tempo de cada pessoa.
                </p>
                <dl>
                  <div>
                    <dt>Categoria</dt>
                    <dd>Amizade</dd>
                  </div>
                  <div>
                    <dt>Visibilidade</dt>
                    <dd>Público</dd>
                  </div>
                  <div>
                    <dt>Criado em</dt>
                    <dd>12 de março de 2026</dd>
                  </div>
                  <div>
                    <dt>Membros</dt>
                    <dd>248</dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3>Regras</h3>
                <ol>
                  <li>Escute antes de responder.</li>
                  <li>Não exponha histórias de outras pessoas.</li>
                  <li>Discorde sem atacar.</li>
                </ol>
              </section>
              <section>
                <h3>Equipe</h3>
                {[
                  ["Ana Clara", "Proprietária", "AC"],
                  ["Lucas Almeida", "Administrador", "LA"],
                  ["Marina Souza", "Moderadora", "MS"],
                ].map(([name, role, initials]) => (
                  <div className="space-team-row" key={name}>
                    <span className="avatar avatar-sm">{initials}</span>
                    <span>
                      <strong>{name}</strong>
                      <small>{role}</small>
                    </span>
                  </div>
                ))}
                <button onClick={() => setMembersOpen(true)}>
                  Ver todos os membros <ChevronRight size={16} />
                </button>
              </section>
              <div className="space-danger-actions">
                <button onClick={() => showToast("Denúncia aberta")}>
                  <Flag size={16} /> Denunciar
                </button>
                <button onClick={() => showToast("Confirmação para sair aberta")}>
                  <LogOut size={16} /> Sair do Espaço
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`community-section-pane ${!spaceOpen && section === "Espaços" ? "active" : ""}`}
      >
        <div className="spaces-discovery">
          {offlineState && (
            <div className="spaces-offline" role="status">
              <WifiOff size={15} />
              Conteúdo salvo disponível. Ações de participação estão pausadas.
            </div>
          )}

          <div className="spaces-search-row">
            <label>
              <Search size={17} />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={spaceSearch}
                onChange={(event) => setSpaceSearch(event.target.value)}
                placeholder="Buscar Espaços"
                aria-label="Buscar Espaços"
              />
            </label>
            <button
              className="spaces-filter-button"
              onClick={() =>
                setSpaceFilter((current) => (current === "Todos" ? "Amigos participam" : "Todos"))
              }
            >
              <SlidersHorizontal size={17} />
              <span>{spaceFilter}</span>
            </button>
          </div>

          {loadingState || demoState === "space-loading" ? (
            <div className="spaces-loading" aria-label="Carregando Espaços">
              <span />
              <div>
                <i />
                <i />
                <i />
              </div>
              <span />
              <div>
                <i />
                <i />
              </div>
            </div>
          ) : demoState === "space-empty" ? (
            <div className="space-state-panel">
              <UsersRound size={30} />
              <h2>Você ainda não participa de nenhum Espaço</h2>
              <p>Descubra comunidades sobre temas que combinam com você.</p>
              <button onClick={() => setDemoState("normal")}>Descobrir Espaços</button>
            </div>
          ) : (
            <>
              <section className="space-discovery-section your-spaces">
                <div className="spaces-section-heading">
                  <div>
                    <span className="section-overline">SEUS ESPAÇOS</span>
                    <h2>Lugares onde você já pertence</h2>
                  </div>
                  <button onClick={() => showToast("Todos os seus Espaços")}>Ver todos</button>
                </div>
                <div className="your-spaces-scroller">
                  {[
                    ["Café, Bíblia & Amizade", "18 ativos agora", "CB", "3"],
                    ["Cristãos do Litoral Sul", "6 novas conversas", "CL", "6"],
                    ["Leitura de João", "Encontro amanhã", "LJ", ""],
                    ["Louvor em Casa", "2 novidades", "LC", "2"],
                  ].map(([name, status, initials, badge], index) => (
                    <button
                      key={name}
                      className={`your-space-card tone-${index + 1} pressable`}
                      onClick={() => openSpace()}
                    >
                      <span className="space-card-icon">{initials}</span>
                      {badge && <small>{badge}</small>}
                      <strong>{name}</strong>
                      <em>{status}</em>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-discovery-section recommended-space">
                <span className="section-overline">RECOMENDADO PARA VOCÊ</span>
                <article>
                  <div className="recommended-cover">
                    <span>amizade · estudo · rotina</span>
                    <BookOpen size={28} />
                  </div>
                  <div className="recommended-copy">
                    <div className="recommended-title">
                      <div>
                        <h2>Café, Bíblia & Amizade</h2>
                        <p>
                          Conversas leves, estudos e amizade cristã para viver a fé sem formalidade.
                        </p>
                      </div>
                      <button aria-label="Abrir Café, Bíblia & Amizade" onClick={() => openSpace()}>
                        <ChevronRight size={19} />
                      </button>
                    </div>
                    <div className="space-facts">
                      <span>Amizade · 248 membros</span>
                      <span>Ana e Lucas participam</span>
                      <span>Ativo hoje</span>
                    </div>
                    <div className="space-card-actions">
                      <span className="visibility-chip">
                        <Globe2 size={13} /> Público
                      </span>
                      <button
                        disabled={offlineState}
                        onClick={() => {
                          setSpaceMembership("joined");
                          showToast("Você entrou no Espaço");
                        }}
                      >
                        {spaceMembership === "joined" ? "Participando" : "Participar"}
                      </button>
                    </div>
                  </div>
                </article>
              </section>

              <section className="space-discovery-section friends-spaces">
                <div className="spaces-section-heading">
                  <div>
                    <span className="section-overline">AMIGOS PARTICIPAM</span>
                    <h2>Chegue com alguém conhecido</h2>
                  </div>
                </div>
                {[
                  ["Cristãos do Litoral Sul", "Ana, Marina e 3 amigos", "Público", "CL"],
                  ["Fotografia com Propósito", "Lucas e Rafael", "Por solicitação", "FP"],
                ].map(([name, friends, visibility, initials]) => (
                  <div className="friend-space-row" key={name}>
                    <button className="friend-space-main" onClick={() => openSpace()}>
                      <span className="space-row-icon">{initials}</span>
                      <span>
                        <strong>{name}</strong>
                        <small>{friends}</small>
                      </span>
                    </button>
                    <span>{visibility}</span>
                    <button
                      onClick={() => {
                        if (visibility === "Por solicitação") {
                          setSpaceMembership("pending");
                          showToast("Solicitação enviada");
                        } else {
                          setSpaceMembership("joined");
                          showToast("Você entrou no Espaço");
                        }
                      }}
                    >
                      {visibility === "Por solicitação"
                        ? spaceMembership === "pending"
                          ? "Pendente"
                          : "Solicitar"
                        : "Participar"}
                    </button>
                  </div>
                ))}
                {spaceMembership === "pending" && (
                  <div className="pending-request">
                    <span>Solicitação pendente em Fotografia com Propósito</span>
                    <button
                      onClick={() => {
                        setSpaceMembership("available");
                        showToast("Solicitação cancelada");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </section>

              <section className="space-discovery-section new-categories">
                <div className="spaces-section-heading">
                  <div>
                    <span className="section-overline">NOVOS E CATEGORIAS</span>
                    <h2>Explore por assunto</h2>
                  </div>
                </div>
                <div className="space-category-chips">
                  {["Todos", "Amizade", "Estudo", "Louvor", "Vida prática"].map((item) => (
                    <button
                      key={item}
                      className={spaceFilter === item ? "active" : ""}
                      onClick={() => setSpaceFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="new-space-list">
                  {[
                    ["Rotina com Propósito", "Vida prática", "Público", "Ativo hoje", "RP"],
                    ["Mulheres que Edificam", "Amizade", "Por solicitação", "Novo", "ME"],
                    ["Leitura sem Pressa", "Estudo", "Privado", "Ativo esta semana", "LP"],
                  ]
                    .filter(([name, category]) => {
                      const matchesSearch = `${name} ${category}`
                        .toLowerCase()
                        .includes(spaceSearch.toLowerCase());
                      const matchesFilter =
                        spaceFilter === "Todos" ||
                        spaceFilter === "Amigos participam" ||
                        category === spaceFilter;
                      return matchesSearch && matchesFilter;
                    })
                    .map(([name, category, visibility, activity, initials]) => (
                      <button
                        key={name}
                        className="new-space-row"
                        onClick={() =>
                          visibility === "Privado" ? setDemoState("space-private") : openSpace()
                        }
                      >
                        <span className="space-row-icon">{initials}</span>
                        <span>
                          <strong>{name}</strong>
                          <small>
                            {category} · {activity}
                          </small>
                        </span>
                        <em>{visibility}</em>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                </div>
              </section>

              {demoState === "space-private" && (
                <div className="private-space-state">
                  <LockKeyhole size={24} />
                  <div>
                    <strong>Este Espaço é privado</strong>
                    <span>O conteúdo fica visível somente para pessoas convidadas.</span>
                  </div>
                  <button onClick={() => setDemoState("normal")}>Entendi</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className={`community-section-pane ${!spaceOpen && section === "Eventos" ? "active" : ""}`}
      >
        <Suspense fallback={<div className="experience-loading">Abrindo Eventos…</div>}>
          <EventsExperience showToast={showToast} onKeyboard={onKeyboard} />
        </Suspense>
      </div>

      <Sheet
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        title="Membros do Espaço"
        size="large"
      >
        <div className="members-panel">
          <label>
            <Search size={17} />
            <input placeholder="Buscar membro" aria-label="Buscar membro" />
          </label>
          <div className="member-filter-row">
            {["Todos", "Equipe", "Ativos"].map((item) => (
              <button key={item}>{item}</button>
            ))}
          </div>
          {[
            ["Ana Clara", "Proprietária", "Online", "12 mar 2026", "AC"],
            ["Lucas Almeida", "Administrador", "Ativo hoje", "12 mar 2026", "LA"],
            ["Marina Souza", "Moderadora", "Ativo hoje", "18 mar 2026", "MS"],
            ["Rafael Lima", "Membro", "Ativo ontem", "02 abr 2026", "RL"],
            ["Juliana Prado", "Membro", "Ativo esta semana", "11 mai 2026", "JP"],
          ].map(([name, role, status, joined, initials]) => (
            <div className="member-row" key={name}>
              <span className="avatar avatar-sm">{initials}</span>
              <span>
                <strong>{name}</strong>
                <small>
                  {status} · entrou em {joined}
                </small>
              </span>
              <em>{role}</em>
              <button
                aria-label={`Moderar ${name}`}
                onClick={() => showToast(`Ações de ${name} abertas`)}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        title="Comentários"
        size="large"
      >
        <div className="comment-list">
          {[
            ["Ana Clara", "Que tarde linda! Foi muito bom estar com vocês.", "AC"],
            ["Marina Souza", "Essa comunidade me faz tão bem.", "MS"],
            ["Rafael Lima", "Na próxima eu vou também!", "RL"],
          ].map(([name, comment, initials], index) => (
            <div key={name} className="comment-row">
              <div className="avatar avatar-sm">{initials}</div>
              <div>
                <strong>{name}</strong>
                <p>{comment}</p>
                <button>Responder</button>
                {index === 0 && (
                  <div className="comment-reply">
                    <div className="avatar">LA</div>
                    <p>
                      <strong>Lucas Almeida</strong> Foi especial mesmo. Vamos repetir!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="sheet-composer">
          <input placeholder="Escreva um comentário..." aria-label="Comentário" />
          <button aria-label="Enviar comentário">
            <Send size={18} />
          </button>
        </div>
      </Sheet>

      {spaceCreateOpen && (
        <div className="space-create-flow" role="dialog" aria-modal="true">
          <header>
            <button aria-label="Fechar criação de Espaço" onClick={() => setSpaceCreateOpen(false)}>
              <X size={21} />
            </button>
            <div>
              <strong>Criar Espaço</strong>
              <span>Etapa {spaceCreateStep} de 6</span>
            </div>
            <button
              onClick={() => {
                window.localStorage.setItem("vdn-space-draft", String(spaceCreateStep));
                showToast("Rascunho salvo neste aparelho");
              }}
            >
              Salvar
            </button>
          </header>
          <div className="space-create-progress">
            <span style={{ width: `${(spaceCreateStep / 6) * 100}%` }} />
          </div>
          <div className="space-create-content">
            {spaceCreateStep === 1 && (
              <section>
                <span className="section-overline">IDENTIDADE BÁSICA</span>
                <h2>Como as pessoas encontrarão seu Espaço?</h2>
                <label>
                  Nome
                  <input defaultValue="Café de Domingo" />
                </label>
                <label>
                  Categoria
                  <select defaultValue="Amizade">
                    <option>Amizade</option>
                    <option>Estudo</option>
                    <option>Louvor</option>
                    <option>Vida prática</option>
                  </select>
                </label>
              </section>
            )}
            {spaceCreateStep === 2 && (
              <section>
                <span className="section-overline">DESCRIÇÃO E IDENTIDADE</span>
                <h2>Dê personalidade sem sair do VaiDarNamoro</h2>
                <label>
                  Descrição
                  <textarea defaultValue="Conversas simples para terminar a semana em boa companhia." />
                </label>
                <div className="approved-palettes">
                  <span>Paleta aprovada</span>
                  {["café", "violeta", "oceano", "folha"].map((tone) => (
                    <button key={tone} aria-label={`Paleta ${tone}`} />
                  ))}
                </div>
              </section>
            )}
            {spaceCreateStep === 3 && (
              <section>
                <span className="section-overline">VISIBILIDADE</span>
                <h2>Quem pode entrar?</h2>
                {[
                  [Globe2, "Público", "Qualquer pessoa pode participar."],
                  [UserPlus, "Por solicitação", "A equipe aprova cada pedido."],
                  [LockKeyhole, "Privado", "Somente pessoas convidadas."],
                ].map(([Icon, title, copy]) => {
                  const VisibilityIcon = Icon as typeof Globe2;
                  return (
                    <button className="creation-choice" key={String(title)}>
                      <VisibilityIcon size={20} />
                      <span>
                        <strong>{String(title)}</strong>
                        <small>{String(copy)}</small>
                      </span>
                      <Check size={17} />
                    </button>
                  );
                })}
              </section>
            )}
            {spaceCreateStep === 4 && (
              <section>
                <span className="section-overline">ÁREAS ATIVAS</span>
                <h2>Escolha o que faz sentido agora</h2>
                {["Mural", "Conversa", "Eventos"].map((item) => (
                  <button className="creation-toggle" key={item}>
                    <span>
                      <strong>{item}</strong>
                      <small>Pode ser alterado depois.</small>
                    </span>
                    <span className="switch on" />
                  </button>
                ))}
              </section>
            )}
            {spaceCreateStep === 5 && (
              <section>
                <span className="section-overline">REGRAS</span>
                <h2>Defina o tom da convivência</h2>
                <label>
                  Regra 1<input defaultValue="Escute antes de responder." />
                </label>
                <label>
                  Regra 2<input defaultValue="Discorde sem atacar." />
                </label>
                <button className="add-rule">
                  <Plus size={17} /> Adicionar regra
                </button>
              </section>
            )}
            {spaceCreateStep === 6 && (
              <section>
                <span className="section-overline">REVISÃO</span>
                <h2>Seu Espaço está pronto para começar</h2>
                <div className="space-review-card">
                  <span className="space-detail-icon">CD</span>
                  <div>
                    <strong>Café de Domingo</strong>
                    <p>Conversas simples para terminar a semana em boa companhia.</p>
                    <small>Amizade · Público · Mural, Conversa e Eventos</small>
                  </div>
                </div>
                <p className="review-note">Nenhuma publicação ou membro fictício será criado.</p>
              </section>
            )}
          </div>
          <footer>
            <button
              disabled={spaceCreateStep === 1}
              onClick={() => setSpaceCreateStep((current) => Math.max(1, current - 1))}
            >
              Voltar
            </button>
            <button
              onClick={() => {
                if (spaceCreateStep < 6) {
                  setSpaceCreateStep((current) => current + 1);
                  return;
                }
                setSpaceCreateOpen(false);
                setSpaceCreateStep(1);
                setSpaceCreated(true);
                setSpaceOpen(true);
                setSpaceTab("Mural");
                showToast("Espaço criado");
              }}
            >
              {spaceCreateStep === 6 ? "Criar Espaço" : "Continuar"}
            </button>
          </footer>
        </div>
      )}

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Buscar na comunidade">
        <div className="community-search-sheet">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Pessoas, Espaços e publicações"
            aria-label="Buscar na comunidade"
          />
        </div>
        <div className="community-search-suggestions">
          <span>Buscas recentes</span>
          <button onClick={() => showToast("Espaço Café, Bíblia & Amizade aberto")}>
            Café, Bíblia & Amizade
          </button>
          <button onClick={() => showToast("Pedidos de oração encontrados")}>
            Pedidos de oração
          </button>
        </div>
      </Sheet>

      <Sheet open={reactionOpen} onClose={() => setReactionOpen(false)} title="Reagir à publicação">
        <div className="reaction-sheet">
          {[
            ["Curtir", Heart],
            ["Celebrar", Sparkles],
            ["Apoiar", HeartHandshake],
          ].map(([label, Icon]) => {
            const ReactionIcon = Icon as typeof Heart;
            return (
              <button
                key={String(label)}
                onClick={() => {
                  setReactionOpen(false);
                  showToast(`Você reagiu: ${String(label)}`);
                }}
              >
                <ReactionIcon size={20} />
                {String(label)}
              </button>
            );
          })}
        </div>
      </Sheet>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Criar na comunidade">
        <div className="create-grid">
          {[
            [MessageCircle, "Publicação"],
            [Sparkles, "Momento"],
            [ImageIcon, "Foto"],
            [Video, "Vídeo"],
            [HelpCircle, "Pergunta"],
            [HeartHandshake, "Pedido de oração"],
            [BookOpen, "Testemunho"],
            [MessageCircle, "Enquete"],
            [Clock3, "Evento"],
          ].map(([Icon, label]) => {
            const CreateIcon = Icon as typeof MessageCircle;
            return (
              <button
                key={String(label)}
                className="pressable"
                onClick={() => {
                  setCreateOpen(false);
                  showToast(`${String(label)} selecionado`);
                }}
              >
                <CreateIcon size={21} />
                <span>{String(label)}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </section>
  );
}

function ExploreScreen({
  showToast,
  openProfile,
  openSettings,
  openConversation,
}: {
  showToast: (message: string) => void;
  openProfile: (name: string) => void;
  openSettings: () => void;
  openConversation: (name: string) => void;
}) {
  const [cinemaOpen, setCinemaOpen] = useState(false);
  const [cinemaVisited, setCinemaVisited] = useState(false);
  const [petsOpen, setPetsOpen] = useState(false);
  const [petsVisited, setPetsVisited] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);
  const [arcadeVisited, setArcadeVisited] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [storeVisited, setStoreVisited] = useState(false);
  const [verboOpen, setVerboOpen] = useState(false);
  const [verboVisited, setVerboVisited] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleVisited, setPeopleVisited] = useState(false);
  const [datingOpen, setDatingOpen] = useState(false);
  const [datingVisited, setDatingVisited] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [progressionVisited, setProgressionVisited] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveVisited, setLiveVisited] = useState(false);
  const [editorialMode, setEditorialMode] = useState("Tudo");
  const [loading, setLoading] = useState(true);
  const [demoState, setDemoState] = useState("normal");
  const experiences = [
    [BookOpen, "Verbo", "Leia, ouça e aprofunde", "coral"],
    [Clapperboard, "Cinema", "Assista junto", "violet"],
    [PawPrint, "Pets", "Cuide do Bento", "gold"],
    [Gamepad2, "Arcade", "Partidas rápidas", "ink"],
    [Store, "Loja", "Expresse sua identidade", "warm"],
    [UsersRound, "Pessoas", "Encontre novas amizades", "sage"],
    [HeartHandshake, "Modo Namoro", "Conheça com propósito", "coral"],
    [Trophy, "Progresso", "Conquistas sem pressão", "violet"],
    [Radio, "Live", "Transmissões oficiais", "live"],
  ];

  useEffect(() => {
    const requestedState =
      new URLSearchParams(window.location.search).get("exploreState") ?? "normal";
    const initialize = window.setTimeout(() => setDemoState(requestedState), 0);
    const finishLoading = window.setTimeout(() => setLoading(false), 520);
    const requestedArea = new URLSearchParams(window.location.search).get("area");
    const openRequestedArea = window.setTimeout(() => {
      if (requestedArea === "cinema") {
        setCinemaVisited(true);
        setCinemaOpen(true);
      } else if (requestedArea === "pets") {
        setPetsVisited(true);
        setPetsOpen(true);
      } else if (requestedArea === "arcade") {
        setArcadeVisited(true);
        setArcadeOpen(true);
      } else if (requestedArea === "loja") {
        setStoreVisited(true);
        setStoreOpen(true);
      } else if (requestedArea === "verbo") {
        setVerboVisited(true);
        setVerboOpen(true);
      } else if (requestedArea === "pessoas") {
        setPeopleVisited(true);
        setPeopleOpen(true);
      } else if (requestedArea === "namoro") {
        setDatingVisited(true);
        setDatingOpen(true);
      } else if (requestedArea === "progresso") {
        setProgressionVisited(true);
        setProgressionOpen(true);
      } else if (requestedArea === "live") {
        setLiveVisited(true);
        setLiveOpen(true);
      }
    }, 0);
    return () => {
      window.clearTimeout(initialize);
      window.clearTimeout(finishLoading);
      window.clearTimeout(openRequestedArea);
    };
  }, []);

  useEffect(() => {
    const openExperience = (event: Event) => {
      const requested = (event as CustomEvent<string>).detail;
      if (requested === "cinema") {
        setCinemaVisited(true);
        setCinemaOpen(true);
      } else if (requested === "pets") {
        setPetsVisited(true);
        setPetsOpen(true);
      } else if (requested === "arcade") {
        setArcadeVisited(true);
        setArcadeOpen(true);
      } else if (requested === "loja") {
        setStoreVisited(true);
        setStoreOpen(true);
      } else if (requested === "verbo") {
        setVerboVisited(true);
        setVerboOpen(true);
      } else if (requested === "pessoas") {
        setPeopleVisited(true);
        setPeopleOpen(true);
      } else if (requested === "progresso") {
        setProgressionVisited(true);
        setProgressionOpen(true);
      } else if (requested === "live") {
        setLiveVisited(true);
        setLiveOpen(true);
      }
      if (requested) {
        const url = new URL(window.location.href);
        url.searchParams.set("area", requested);
        window.history.replaceState({}, "", url);
      }
    };
    window.addEventListener("vdn-open-experience", openExperience);
    return () => window.removeEventListener("vdn-open-experience", openExperience);
  }, []);

  const openCinema = () => {
    setCinemaVisited(true);
    setCinemaOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("area", "cinema");
      window.history.replaceState({}, "", url);
    }
  };

  const closeCinema = () => {
    setCinemaOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("area");
      window.history.replaceState({}, "", url);
    }
  };

  const openPets = () => {
    setPetsVisited(true);
    setPetsOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("area", "pets");
      window.history.replaceState({}, "", url);
    }
  };

  const closePets = () => {
    setPetsOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("area");
      window.history.replaceState({}, "", url);
    }
  };

  const openArcade = () => {
    setArcadeVisited(true);
    setArcadeOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "arcade");
    window.history.replaceState({}, "", url);
  };

  const closeArcade = () => {
    setArcadeOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    window.history.replaceState({}, "", url);
  };

  const openStore = () => {
    setStoreVisited(true);
    setStoreOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "loja");
    window.history.replaceState({}, "", url);
  };

  const closeStore = () => {
    setStoreOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    window.history.replaceState({}, "", url);
  };

  const openVerbo = () => {
    setVerboVisited(true);
    setVerboOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("area", "verbo");
      window.history.replaceState({}, "", url);
    }
  };

  const closeVerbo = () => {
    setVerboOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("area");
      window.history.replaceState({}, "", url);
    }
  };

  const openPeople = () => {
    setPeopleVisited(true);
    setPeopleOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("area", "pessoas");
      window.history.replaceState({}, "", url);
    }
  };

  const closePeople = () => {
    setPeopleOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("area");
      window.history.replaceState({}, "", url);
    }
  };

  const openDating = () => {
    setDatingVisited(true);
    setDatingOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "namoro");
    window.history.replaceState({}, "", url);
  };

  const closeDating = () => {
    setDatingOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    window.history.replaceState({}, "", url);
  };

  const openProgression = () => {
    setProgressionVisited(true);
    setProgressionOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "progresso");
    window.history.replaceState({}, "", url);
  };

  const closeProgression = () => {
    setProgressionOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    window.history.replaceState({}, "", url);
  };

  const openLive = () => {
    setLiveVisited(true);
    setLiveOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "live");
    window.history.replaceState({}, "", url);
  };

  const closeLive = () => {
    setLiveOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    url.searchParams.delete("liveState");
    window.history.replaceState({}, "", url);
  };

  const loadingState = loading || demoState === "loading";
  const emptyState = demoState === "empty";
  const offlineState = demoState === "offline";
  const partialError = demoState === "error";

  return (
    <section className="screen explore-screen" aria-label="Explorar">
      <div className="page-scroll explore-page-scroll">
        <header className="topbar contextual-topbar">
          <h1>Explorar</h1>
          <IconButton
            label="Buscar experiências"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("vdn-open-global-search", {
                  detail: "Tudo",
                }),
              )
            }
          >
            <Search size={20} />
          </IconButton>
        </header>

        <div className="explore-content">
          {offlineState && (
            <div className="explore-state-banner" role="status">
              <WifiOff size={16} />
              <span>Você está offline. Mostrando experiências já carregadas.</span>
            </div>
          )}

          <div className="editorial-switcher" aria-label="Filtrar Explorar">
            {["Tudo", "Fé", "Pessoas"].map((item) => (
              <button
                key={item}
                className={editorialMode === item ? "active" : ""}
                onClick={() => setEditorialMode(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {loadingState ? (
            <div className="explore-skeleton" aria-label="Carregando Explorar">
              <span />
              <div>
                <i />
                <i />
              </div>
              <span />
              <i />
            </div>
          ) : emptyState ? (
            <div className="explore-empty-state">
              <Compass size={30} />
              <h2>Seu Explorar está ficando pronto</h2>
              <p>Quando houver algo relevante para continuar ou descobrir, aparecerá aqui.</p>
              <button onClick={() => setDemoState("normal")}>Ver experiências</button>
            </div>
          ) : (
            <>
              <section className="continue-section">
                <div className="section-heading">
                  <h2>Continuar</h2>
                  <button onClick={() => showToast("Histórico aberto")}>Ver histórico</button>
                </div>
                <div className="continue-list">
                  <button className="continue-item pressable" onClick={openVerbo}>
                    <span className="continue-icon">
                      <BookOpen size={19} />
                    </span>
                    <span className="continue-copy">
                      <strong>João 8</strong>
                      <small>Verbo · 68% concluído</small>
                      <span className="continue-progress" aria-label="68% concluído">
                        <i />
                      </span>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                  <button
                    className="continue-item pressable"
                    onClick={() => showToast("Bento aberto")}
                  >
                    <span className="continue-icon pet">
                      <PawPrint size={19} />
                    </span>
                    <span>
                      <strong>Bento está descansando</strong>
                      <small>Pet · Tudo tranquilo</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                  <button
                    className="continue-item pressable"
                    onClick={() => showToast("Espaço Café, Bíblia & Amizade aberto")}
                  >
                    <span className="continue-icon space">
                      <UsersRound size={19} />
                    </span>
                    <span>
                      <strong>Café, Bíblia & Amizade</strong>
                      <small>Espaço · 4 novidades</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                </div>
              </section>

              <section className="happening-section">
                <span className="section-overline">ACONTECENDO AGORA</span>
                <button className="live-official-card pressable" onClick={openLive}>
                  <span className="live-official-art">
                    <span>
                      <i /> AO VIVO
                    </span>
                    <Radio size={38} />
                    <small>186 assistindo</small>
                  </span>
                  <span>
                    <small>TRANSMISSÃO OFICIAL</small>
                    <strong>Comunidade que acolhe</strong>
                    <em>Com Lucas Almeida e convidados</em>
                    <b>
                      Assistir agora <ChevronRight size={17} />
                    </b>
                  </span>
                </button>
                <button className="live-cinema pressable" onClick={openCinema}>
                  <div className="cinema-visual">
                    <span className="live-pill">AO VIVO</span>
                    <Clapperboard size={38} />
                    <span>86 assistindo</span>
                  </div>
                  <div>
                    <span>CINEMA DA COMUNIDADE</span>
                    <h2>A Jornada da Esperança</h2>
                    <p>Entrou agora? Você será sincronizado automaticamente.</p>
                    <strong>
                      Entrar na sala <ChevronRight size={17} />
                    </strong>
                  </div>
                </button>
              </section>

              <section className="experiences-section">
                <div className="section-heading">
                  <h2>Experiências</h2>
                  <span>Entre quando fizer sentido</span>
                </div>
                <div className="experience-grid">
                  {experiences.map(([Icon, title, copy, tone], index) => {
                    const ExperienceIcon = Icon as typeof BookOpen;
                    return (
                      <button
                        key={String(title)}
                        className={`experience-card experience-${String(tone)} pressable ${
                          index === 0 || index === 3 ? "wide" : ""
                        }`}
                        onClick={() => {
                          if (title === "Cinema") openCinema();
                          else if (title === "Pets") openPets();
                          else if (title === "Arcade") openArcade();
                          else if (title === "Loja") openStore();
                          else if (title === "Pessoas") openPeople();
                          else if (title === "Modo Namoro") openDating();
                          else if (title === "Progresso") openProgression();
                          else if (title === "Live") openLive();
                          else if (title === "Verbo") openVerbo();
                          else showToast(`${String(title)} aberto`);
                        }}
                      >
                        {title === "Pets" && (
                          <img src="/pet-bento.png" alt="Bento, seu Pet caramelo" />
                        )}
                        <span className="experience-icon">
                          <ExperienceIcon size={22} />
                        </span>
                        <span>
                          <strong>{String(title)}</strong>
                          <small>{String(copy)}</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="discoveries-section">
                <div className="section-heading">
                  <h2>Descobertas</h2>
                  <span>Escolhidas para você</span>
                </div>
                {partialError ? (
                  <div className="explore-partial-error" role="alert">
                    <RefreshCw size={18} />
                    <div>
                      <strong>Algumas descobertas não carregaram</strong>
                      <span>O restante de Explorar continua disponível.</span>
                    </div>
                    <button onClick={() => setDemoState("normal")}>Tentar de novo</button>
                  </div>
                ) : (
                  <div className="discovery-layout">
                    <article className="editorial-discovery">
                      <div>
                        <span>ESPAÇO RECOMENDADO</span>
                        <h2>Gente da sua cidade, conversas que fazem sentido.</h2>
                        <p>Cristãos do Litoral Sul · 92 participantes</p>
                        <button onClick={() => showToast("Espaço aberto")}>Conhecer Espaço</button>
                      </div>
                      <MapPin size={28} />
                    </article>
                    <button className="person-discovery pressable" onClick={openPeople}>
                      <span className="avatar avatar-md avatar-ana">AC</span>
                      <span>
                        <small>PESSOA PARA CONHECER</small>
                        <strong>Ana Clara</strong>
                        <em>Leitura, música e amizade · 3 Espaços em comum</em>
                      </span>
                      <span>Conhecer</span>
                    </button>
                    <button className="store-discovery pressable" onClick={openStore}>
                      <span>
                        <Palette size={20} />
                      </span>
                      <span>
                        <small>NA LOJA</small>
                        <strong>Coleção Costa Serena</strong>
                        <em>Fundos e molduras para contar sua história.</em>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {cinemaVisited && (
        <CinemaExperience visible={cinemaOpen} onClose={closeCinema} showToast={showToast} />
      )}
      {liveVisited && (
        <Suspense fallback={<div className="experience-loading">Abrindo Live…</div>}>
          <LiveExperience visible={liveOpen} onClose={closeLive} showToast={showToast} />
        </Suspense>
      )}
      {petsVisited && (
        <PetsExperience visible={petsOpen} onClose={closePets} showToast={showToast} />
      )}
      {arcadeVisited && (
        <Suspense fallback={<div className="experience-loading">Abrindo Arcade…</div>}>
          <ArcadeExperience visible={arcadeOpen} onClose={closeArcade} showToast={showToast} />
        </Suspense>
      )}
      {storeVisited && (
        <Suspense fallback={<div className="experience-loading">Abrindo Loja…</div>}>
          <StoreExperience visible={storeOpen} onClose={closeStore} showToast={showToast} />
        </Suspense>
      )}
      {verboVisited && (
        <Suspense fallback={<div className="experience-loading">Abrindo Verbo…</div>}>
          <VerboExperience visible={verboOpen} onClose={closeVerbo} showToast={showToast} />
        </Suspense>
      )}
      {peopleVisited && (
        <Suspense fallback={<div className="experience-loading">Abrindo Pessoas…</div>}>
          <PeopleExperience
            visible={peopleOpen}
            onClose={closePeople}
            onOpenProfile={(name) => {
              closePeople();
              openProfile(name);
            }}
            showToast={showToast}
          />
        </Suspense>
      )}
      {datingVisited && (
        <Suspense fallback={<div className="experience-loading">Abrindo Modo Namoro…</div>}>
          <DatingExperience
            visible={datingOpen}
            onClose={closeDating}
            onOpenSettings={() => {
              closeDating();
              openSettings();
            }}
            onOpenConversation={(name) => {
              closeDating();
              openConversation(name);
            }}
            showToast={showToast}
          />
        </Suspense>
      )}
      {progressionVisited && (
        <Suspense fallback={<div className="experience-loading">Abrindo Progresso…</div>}>
          <ProgressionExperience
            visible={progressionOpen}
            onClose={closeProgression}
            showToast={showToast}
          />
        </Suspense>
      )}

      <Sheet open={searchOpen} title="Buscar em Explorar" onClose={() => setSearchOpen(false)}>
        <label className="search-field">
          <Search size={18} />
          <input
            autoFocus
            aria-label="Buscar em Explorar"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Experiências, pessoas e Espaços"
          />
        </label>
        <div className="explore-search-suggestions">
          <span className="section-overline">SUGESTÕES</span>
          {["Cinema da Comunidade", "Ana Clara", "Café, Bíblia & Amizade"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setSearchOpen(false);
                showToast(`${item} aberto`);
              }}
            >
              <span>{item}</span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </Sheet>
    </section>
  );
}

type ChatKind = "person" | "group" | "space" | "event";

function MessagesScreen({
  showToast,
  onKeyboard,
  requestedChat,
  onCreateGroup,
  onOpenDetails,
}: {
  showToast: (message: string) => void;
  onKeyboard: (open: boolean) => void;
  requestedChat: { name: string; requestId: number } | null;
  onCreateGroup: () => void;
  onOpenDetails: (kind: ConversationKind, title: string) => void;
}) {
  const [section, setSection] = useState("Conversas");
  const [filter, setFilter] = useState("Todas");
  const [activeChat, setActiveChat] = useState<string | null>(requestedChat?.name ?? null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement | null>(null);
  const threadAtEndRef = useRef(true);
  const chats: Array<[string, string, string, string, ChatKind, number]> = [
    ["Ana Clara", "Também gostei daquele texto de João…", "14:32", "AC", "person", 2],
    ["Café, Bíblia & Amizade", "Lucas: Hoje às 21h30, pessoal!", "13:10", "CB", "space", 1],
    ["Trio de Peruíbe", "Marina enviou uma foto", "Ontem", "TP", "group", 0],
    ["Cinema — Jornada", "A sala abre às 19h50", "Ontem", "CJ", "event", 0],
  ];

  const activeKind: ConversationKind = chats.find(([name]) => name === activeChat)?.[4] ?? "person";

  const send = () => {
    if (!draft.trim()) return;
    showToast("Mensagem enviada");
    setDraft("");
  };

  useEffect(() => {
    if (!activeChat) return;
    window.requestAnimationFrame(() => {
      const thread = threadRef.current;
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const keepThreadAnchored = () => {
      window.requestAnimationFrame(() => {
        if (!threadAtEndRef.current) return;
        const thread = threadRef.current;
        if (thread) thread.scrollTop = thread.scrollHeight;
      });
    };

    visualViewport.addEventListener("resize", keepThreadAnchored);
    visualViewport.addEventListener("scroll", keepThreadAnchored);

    return () => {
      visualViewport.removeEventListener("resize", keepThreadAnchored);
      visualViewport.removeEventListener("scroll", keepThreadAnchored);
    };
  }, [activeChat]);

  if (activeChat) {
    return (
      <section
        className="screen chat-screen"
        aria-label={`Conversa com ${activeChat}`}
        data-action-context="conversation"
        data-action-title={`Conversa com ${activeChat}`}
      >
        <header className="topbar chat-topbar">
          <button
            className="icon-button pressable"
            aria-label="Voltar para conversas"
            onClick={() => {
              setActiveChat(null);
              onKeyboard(false);
            }}
          >
            <ArrowLeft size={21} />
          </button>
          <div className="avatar chat-header-avatar avatar-ana">AC</div>
          <div className="chat-identity">
            <strong>{activeChat}</strong>
            <span>online agora</span>
          </div>
          <button
            className="icon-button"
            aria-label="Abrir detalhes da conversa"
            onClick={() => onOpenDetails(activeKind, activeChat)}
          >
            <MoreHorizontal size={21} />
          </button>
        </header>
        <div
          className="message-thread"
          ref={threadRef}
          onScroll={(event) => {
            const thread = event.currentTarget;
            threadAtEndRef.current =
              thread.scrollHeight - thread.scrollTop - thread.clientHeight < 32;
          }}
        >
          <div className="date-divider">Hoje</div>
          <div className="message-bubble received">
            <p>Oi, Antonio! Você chegou a continuar João 8?</p>
            <span>14:27</span>
          </div>
          <div className="message-bubble sent">
            <p>Continuei sim. A parte sobre a verdade me fez pensar bastante.</p>
            <span>14:29 · Lida</span>
          </div>
          <div className="message-bubble received">
            <p>Também gostei daquele texto de João… parece uma conversa pra hoje.</p>
            <span>14:32</span>
          </div>
          <button
            className="chat-media-message pressable"
            aria-label="Abrir foto enviada por Ana Clara"
            data-action-context="conversation-media"
            data-action-title="Foto de Ana Clara"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("vdn-open-media", {
                  detail: { kind: "chat", title: activeChat, index: 0 },
                }),
              )
            }
          >
            <img src="/community-peruibe.png" alt="Amigos caminhando no litoral" />
            <span>Foto · 14:34</span>
          </button>
          <div className="shared-verse">
            <BookOpen size={19} />
            <span>“E conhecereis a verdade, e a verdade vos libertará.”</span>
            <small>João 8:32 · NAA</small>
          </div>
        </div>
        <ChatComposer
          className="chat-composer"
          value={draft}
          onChange={setDraft}
          onAttach={() => setAttachmentsOpen(true)}
          onFocus={() => {
            onKeyboard(true);
          }}
          onBlur={() => window.setTimeout(() => onKeyboard(false), 120)}
          placeholder="Mensagem"
          label="Mensagem"
          onSend={send}
        />
        <Sheet open={attachmentsOpen} onClose={() => setAttachmentsOpen(false)} title="Enviar">
          <div className="attachment-grid">
            {[
              [ImageIcon, "Fotos"],
              [Camera, "Câmera"],
              [Video, "Vídeo"],
              [BookOpen, "Verbo"],
              [CircleUserRound, "Perfil"],
              [Clock3, "Evento"],
            ].map(([Icon, label]) => {
              const AttachmentIcon = Icon as typeof ImageIcon;
              return (
                <button
                  key={String(label)}
                  onClick={() => {
                    setAttachmentsOpen(false);
                    showToast(`${String(label)} selecionado`);
                  }}
                >
                  <AttachmentIcon size={21} />
                  <span>{String(label)}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      </section>
    );
  }

  return (
    <section
      className="screen messages-screen"
      aria-label="Conversas"
      data-action-context="conversation"
      data-action-title="Conversas"
    >
      <div className="page-scroll messages-page-scroll">
        <header className="topbar contextual-topbar">
          <div>
            <span className="section-overline">SUAS CONEXÕES</span>
            <h1>Conversas</h1>
          </div>
          <div className="topbar-actions">
            <IconButton label="Criar novo grupo" onClick={onCreateGroup}>
              <Plus size={20} />
            </IconButton>
            <IconButton
              label="Buscar conversas"
              onClick={() => showToast("Busca de conversas aberta")}
            >
              <Search size={20} />
            </IconButton>
          </div>
        </header>
        <div className="message-sections tab-strip">
          {["Conversas", "Solicitações"].map((item) => (
            <button
              key={item}
              className={section === item ? "active" : ""}
              onClick={() => setSection(item)}
            >
              {item}
              {item === "Solicitações" && <small>2</small>}
            </button>
          ))}
        </div>
        {section === "Conversas" ? (
          <>
            <div className="filter-scroller">
              {["Todas", "Pessoais", "Grupos", "Espaços", "Eventos", "Não lidas"].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="chat-list">
              {chats
                .filter(([, , , , kind, unread]) => {
                  if (filter === "Todas") return true;
                  if (filter === "Pessoais") return kind === "person";
                  if (filter === "Grupos") return kind === "group";
                  if (filter === "Espaços") return kind === "space";
                  if (filter === "Eventos") return kind === "event";
                  return unread > 0;
                })
                .map(([name, preview, time, initials, kind, unread]) => (
                  <button
                    key={name}
                    className="chat-row pressable"
                    onClick={() => setActiveChat(name)}
                  >
                    <span className={`avatar avatar-md chat-avatar chat-${kind}`}>{initials}</span>
                    <span className="chat-copy">
                      <strong>{name}</strong>
                      <small>{preview}</small>
                    </span>
                    <span className="chat-status">
                      <time>{time}</time>
                      {unread > 0 && <small>{unread}</small>}
                    </span>
                  </button>
                ))}
            </div>
          </>
        ) : (
          <div className="requests-list">
            {[
              ["Marcos Vieira", "Vocês participam do mesmo Espaço.", "MV"],
              ["Juliana Prado", "3 amigos em comum.", "JP"],
            ].map(([name, context, initials]) => (
              <div key={name} className="request-row">
                <div className="avatar avatar-md">{initials}</div>
                <div>
                  <strong>{name}</strong>
                  <span>{context}</span>
                </div>
                <button onClick={() => showToast("Solicitação aceita")}>Aceitar</button>
                <button onClick={() => showToast("Solicitação recusada")}>Recusar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProfileScreen({
  showToast,
  onOpenActivity,
  onOpenStudio,
}: {
  showToast: (message: string) => void;
  onOpenActivity: () => void;
  onOpenStudio: (tab?: "Visual" | "Identidade" | "Módulos" | "Vitrine" | "Áudio") => void;
}) {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoState, setDemoState] = useState("normal");
  const [moduleOrder, setModuleOrder] = useState([
    "overview",
    "walk",
    "pet",
    "showcase",
    "gallery",
    "collections",
  ]);
  const [hiddenModules, setHiddenModules] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<Record<string, string>>({
    overview: "Público",
    walk: "Amigos",
    pet: "Público",
    showcase: "Público",
    gallery: "Amigos",
    collections: "Público",
  });

  useEffect(() => {
    const requestedState =
      new URLSearchParams(window.location.search).get("profileState") ?? "normal";
    const initialize = window.setTimeout(() => setDemoState(requestedState), 0);
    const finishLoading = window.setTimeout(() => setLoading(false), 520);
    return () => {
      window.clearTimeout(initialize);
      window.clearTimeout(finishLoading);
    };
  }, []);

  const moveModule = (id: string, direction: -1 | 1) => {
    setModuleOrder((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const modulePrivacy = (id: string) => (
    <button
      className="module-privacy"
      onClick={(event) => {
        event.stopPropagation();
        const levels = ["Público", "Amigos", "Somente eu"];
        const next = levels[(levels.indexOf(privacy[id] ?? "Público") + 1) % levels.length];
        setPrivacy((current) => ({ ...current, [id]: next }));
        showToast(`Privacidade: ${next}`);
      }}
      aria-label={`Privacidade: ${privacy[id]}`}
    >
      {privacy[id] === "Público" ? (
        <Globe2 size={13} />
      ) : privacy[id] === "Amigos" ? (
        <UsersRound size={13} />
      ) : (
        <LockKeyhole size={13} />
      )}
      {privacy[id]}
    </button>
  );

  const modules: Record<string, React.ReactNode> = {
    overview: (
      <section
        className="profile-module overview-module"
        onClick={() => setActiveModule("Visão geral")}
      >
        <div className="module-heading">
          <div>
            <span className="section-overline">VISÃO GERAL</span>
            <h2>Um pouco sobre mim</h2>
          </div>
          {modulePrivacy("overview")}
        </div>
        <p>Peruíbe, São Paulo · aberto a novas amizades e boas conversas.</p>
        <div className="interest-row">
          <span>Fé prática</span>
          <span>Tecnologia</span>
          <span>Praia</span>
          <span>Cinema</span>
        </div>
      </section>
    ),
    walk: (
      <section
        className="profile-module walk-module"
        onClick={() => setActiveModule("Minha caminhada")}
      >
        <div className="module-heading">
          <div>
            <span className="section-overline">MINHA CAMINHADA</span>
            <h2>Fé que aparece na vida real</h2>
          </div>
          {modulePrivacy("walk")}
        </div>
        <p>
          Tenho aprendido que caminhar com Deus também significa aprender a ouvir, servir e
          recomeçar sem medo.
        </p>
        <blockquote>
          “Entrega o teu caminho ao Senhor, confia nele, e o mais ele fará.”
          <span>Salmos 37:5 · NAA</span>
        </blockquote>
        <div className="walk-facts">
          <span>
            <MapPin size={15} /> Peruíbe, São Paulo
          </span>
          <span>
            <Clock3 size={15} /> 8 anos de caminhada
          </span>
          <span>
            <ShieldCheck size={15} /> Batizado · visível para amigos
          </span>
        </div>
      </section>
    ),
    pet: (
      <section className="profile-module pet-module" onClick={() => setActiveModule("Pet ativo")}>
        <img src="/pet-bento.png" alt="Bento, Pet ativo de Antonio" />
        <div>
          <span className="section-overline">PET ATIVO</span>
          <h2>Bento</h2>
          <p>Caramelo · Nível 12</p>
          <span className="pet-state">
            <i /> Descansando no cantinho dele
          </span>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            showToast("Bento aberto");
          }}
        >
          Visitar
        </button>
      </section>
    ),
    showcase: (
      <section
        className="profile-module showcase-module"
        onClick={() => setActiveModule("Vitrine")}
      >
        <div className="showcase-feature">
          <div>
            <span className="section-overline">VITRINE EM DESTAQUE</span>
            <h2>Plano “30 dias em João”</h2>
            <p>Uma conquista rara da coleção Verbo, concluída com constância.</p>
            <button
              onClick={(event) => {
                event.stopPropagation();
                showToast("Vitrine aberta");
              }}
            >
              Abrir vitrine
            </button>
          </div>
          <span>
            <Medal size={30} />
            <small>RARO</small>
          </span>
        </div>
      </section>
    ),
    gallery: (
      <section
        className="profile-gallery"
        data-action-context="profile-media"
        data-action-title="Galeria de Antonio"
        data-action-own="true"
      >
        <div className="section-heading">
          <h2>Galeria</h2>
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("vdn-open-media", {
                  detail: { kind: "album", title: "Galeria de Antonio", index: 0 },
                }),
              )
            }
          >
            Ver 8 fotos
          </button>
        </div>
        <div className="gallery-grid">
          {[
            ["/community-peruibe.png", "Amigos no calçadão"],
            ["/profile-coast-dusk.png", "Costa ao entardecer"],
            ["/pet-bento.png", "Bento no cantinho de leitura"],
          ].map(([src, alt], index) => (
            <button
              key={src}
              aria-label={`Abrir foto ${index + 1} da Galeria`}
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("vdn-open-media", {
                    detail: { kind: "profile", title: "Galeria de Antonio", index },
                  }),
                )
              }
            >
              <img src={src} alt={alt} />
            </button>
          ))}
        </div>
      </section>
    ),
    collections: (
      <section className="collection-strip" onClick={() => setActiveModule("Coleções")}>
        <div>
          <span className="section-overline">COLEÇÕES</span>
          <h2>24 itens mostram um pouco da sua história.</h2>
        </div>
        <div className="collection-icons">
          <span>
            <Palette size={20} />
          </span>
          <span>
            <Medal size={20} />
          </span>
          <span>
            <PawPrint size={20} />
          </span>
          <span>
            <Gamepad2 size={20} />
          </span>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            setActiveModule("Coleções");
          }}
        >
          Explorar coleções <ChevronRight size={17} />
        </button>
      </section>
    ),
  };

  const loadingState = loading || demoState === "loading";
  const emptyState = demoState === "empty";
  const offlineState = demoState === "offline";
  const partialError = demoState === "error";

  return (
    <section
      className="screen profile-screen"
      aria-label="Perfil de Antonio Rodrigues"
      data-action-context="profile"
      data-action-title="Perfil de Antonio Rodrigues"
      data-action-own="true"
    >
      <div className="page-scroll profile-page-scroll">
        <header className="topbar profile-compact-topbar">
          <strong>Antonio Rodrigues</strong>
          <div className="topbar-actions">
            <button
              className="icon-button pressable"
              aria-label="Criar no Perfil"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("vdn-open-create-center", {
                    detail: "Perfil",
                  }),
                )
              }
            >
              <Plus size={20} />
            </button>
            <button
              className="icon-button pressable"
              aria-label="Abrir Estúdio de Personalização"
              onClick={() => onOpenStudio("Visual")}
            >
              <Palette size={20} />
            </button>
          </div>
        </header>
        <header className="profile-hero">
          <img
            src="/profile-coast-dusk.png"
            alt="Fundo de perfil inspirado no litoral ao entardecer"
          />
          <div className="profile-top-actions">
            <span className="profile-inventory-label">Costa Serena · Fundo equipado</span>
          </div>
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <span className="profile-aura" />
              <div className="profile-frame">
                <span>AR</span>
              </div>
            </div>
            <div className="profile-name">
              <h1>Antonio Rodrigues</h1>
              <span>@antoniorodrigues</span>
              <p>Construindo coisas, vivendo a fé e conhecendo gente boa.</p>
            </div>
            <button className="primary-button pressable" onClick={() => onOpenStudio("Identidade")}>
              Personalizar
            </button>
          </div>
        </header>

        <div className="profile-content">
          <div className="profile-title-row">
            <span className="profile-title">Construtor de caminhos · 12 amigos em comum</span>
            <span className="profile-status">
              <i /> Disponível para conversar
            </span>
          </div>
          <div className="badge-row" aria-label="Badges">
            <button onClick={() => window.dispatchEvent(new CustomEvent("vdn-open-trust"))}>
              <ShieldCheck size={15} /> Perfil verificado
            </button>
            <span>
              <BookOpen size={15} /> Leitor constante
            </span>
            <span>
              <HeartHandshake size={15} /> Bom amigo
            </span>
          </div>

          <nav className="profile-tabs" aria-label="Atalhos do perfil">
            <button className="active" onClick={() => setActiveModule("Visão geral")}>
              Visão geral
            </button>
            <button onClick={() => setActiveModule("Minha caminhada")}>Caminhada</button>
            <button onClick={() => setActiveModule("Galeria")}>Galeria</button>
            <button onClick={() => setActiveModule("Coleções")}>Coleções</button>
          </nav>

          {offlineState && (
            <div className="profile-state-banner">
              <WifiOff size={16} /> Perfil salvo neste dispositivo
            </div>
          )}

          {loadingState ? (
            <div className="profile-skeleton" aria-label="Carregando Perfil">
              <span />
              <i />
              <i />
              <span />
            </div>
          ) : emptyState ? (
            <div className="profile-empty-state">
              <CircleUserRound size={30} />
              <h2>Seu perfil ainda está começando</h2>
              <p>
                Adicione sua caminhada, um destaque e interesses para deixar sua identidade viva.
              </p>
              <button onClick={() => setDemoState("normal")}>Montar meu perfil</button>
            </div>
          ) : (
            <div className="profile-modules">
              {moduleOrder.map((id) =>
                hiddenModules.includes(id) ? null : <div key={id}>{modules[id]}</div>,
              )}
            </div>
          )}

          {partialError && (
            <div className="profile-partial-error" role="alert">
              <RefreshCw size={18} />
              <span>
                <strong>Galeria indisponível</strong>
                <small>Os demais módulos continuam visíveis.</small>
              </span>
              <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
            </div>
          )}

          <button className="activity-button pressable" onClick={onOpenActivity}>
            <UsersRound size={20} />
            <span>
              <strong>Ver atividade na comunidade</strong>
              <small>Publicações e participações, sem transformar o Perfil em timeline</small>
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Sheet
        open={customizeOpen}
        title="Personalizar perfil"
        onClose={() => setCustomizeOpen(false)}
      >
        <div className="profile-customizer">
          <button
            className="open-profile-studio"
            onClick={() => {
              setCustomizeOpen(false);
              onOpenStudio("Módulos");
            }}
          >
            <Palette size={18} />
            <span>
              <strong>Abrir Estúdio completo</strong>
              <small>Visual, identidade, módulos, vitrine e áudio</small>
            </span>
            <ChevronRight size={18} />
          </button>
          <p>
            Reordene alguns módulos, oculte os opcionais ou altere a privacidade. A estrutura
            principal permanece organizada.
          </p>
          {moduleOrder.map((id, index) => (
            <div key={id}>
              <span>
                {
                  (
                    {
                      overview: "Visão geral",
                      walk: "Minha caminhada",
                      pet: "Pet",
                      showcase: "Vitrine",
                      gallery: "Galeria",
                      collections: "Coleções",
                    } as Record<string, string>
                  )[id]
                }
              </span>
              <button
                disabled={index === 0}
                onClick={() => moveModule(id, -1)}
                aria-label={`Mover ${id} para cima`}
              >
                ↑
              </button>
              <button
                disabled={index === moduleOrder.length - 1}
                onClick={() => moveModule(id, 1)}
                aria-label={`Mover ${id} para baixo`}
              >
                ↓
              </button>
              <button
                className={hiddenModules.includes(id) ? "hidden" : ""}
                onClick={() =>
                  setHiddenModules((current) =>
                    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
                  )
                }
              >
                {hiddenModules.includes(id) ? "Mostrar" : "Ocultar"}
              </button>
            </div>
          ))}
          <button
            className="restore-profile"
            onClick={() => {
              setModuleOrder(["overview", "walk", "pet", "showcase", "gallery", "collections"]);
              setHiddenModules([]);
              showToast("Perfil restaurado ao padrão");
            }}
          >
            Restaurar padrão
          </button>
        </div>
      </Sheet>

      <Sheet
        open={Boolean(activeModule)}
        title={activeModule ?? "Perfil"}
        onClose={() => setActiveModule(null)}
      >
        <div className="profile-module-detail">
          <span className="section-overline">IDENTIDADE DE ANTONIO</span>
          <h2>{activeModule}</h2>
          <p>
            Esta área abre o conteúdo completo do módulo sem transformar o Perfil em uma timeline.
          </p>
          <button
            onClick={() => {
              setActiveModule(null);
              showToast(`${activeModule} aberto`);
            }}
          >
            Continuar
          </button>
        </div>
      </Sheet>
    </section>
  );
}

function Sheet({
  open,
  title,
  onClose,
  children,
  size = "medium",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "medium" | "large";
}) {
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef({ startY: 0, startedAt: 0, pointerId: -1 });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section
        className={`sheet sheet-${size} ${dragY > 0 ? "is-dragging" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ "--sheet-drag-y": `${dragY}px` } as React.CSSProperties}
      >
        <div
          className="sheet-handle"
          role="button"
          tabIndex={0}
          aria-label="Arraste para fechar"
          onPointerDown={(event) => {
            dragRef.current = {
              startY: event.clientY,
              startedAt: performance.now(),
              pointerId: event.pointerId,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (dragRef.current.pointerId !== event.pointerId) return;
            setDragY(Math.max(0, event.clientY - dragRef.current.startY));
          }}
          onPointerUp={(event) => {
            if (dragRef.current.pointerId !== event.pointerId) return;
            const elapsed = Math.max(1, performance.now() - dragRef.current.startedAt);
            const velocity = dragY / elapsed;
            event.currentTarget.releasePointerCapture(event.pointerId);
            dragRef.current.pointerId = -1;
            if (dragY > 96 || velocity > 0.7) onClose();
            setDragY(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "ArrowDown") onClose();
          }}
        />
        <div className="sheet-header">
          <h2>{title}</h2>
          <IconButton label="Fechar" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  );
}

function AccountSheet({
  open,
  onClose,
  onOpenSettings,
  onOpenAppearance,
  onOpenAdmin,
  onOpenOnboarding,
  onOpenTrust,
  onOpenMyActivity,
  appearanceMode,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenAppearance: () => void;
  onOpenAdmin: () => void;
  onOpenOnboarding: () => void;
  onOpenTrust: () => void;
  onOpenMyActivity: () => void;
  appearanceMode: AppearanceMode;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Sua conta">
      <div className="account-summary">
        <div className="avatar avatar-lg">AR</div>
        <div>
          <strong>Antonio Rodrigues</strong>
          <span>@antoniorodrigues</span>
          <span className="account-state">
            <ShieldCheck size={14} /> Conta aprovada
          </span>
        </div>
      </div>
      <div className="coin-row">
        <span className="coin-mark">V</span>
        <div>
          <span>Seu saldo</span>
          <strong>1.280 moedas</strong>
        </div>
        <ChevronRight size={18} />
      </div>
      <div className="settings-list">
        {[
          [Clock3, "Minha atividade", "Salvos e rascunhos"],
          [
            Moon,
            "Tema",
            appearanceMode === "system"
              ? "Sistema"
              : appearanceMode === "dark"
                ? "Escuro"
                : "Claro",
          ],
          [Settings, "Configurações", ""],
          [ShieldCheck, "Central de confiança", "Ação necessária"],
          [ShieldCheck, "Administração", "Super Admin"],
          [HelpCircle, "Ajuda", ""],
          [LogOut, "Sair", ""],
        ].map(([Icon, label, detail]) => {
          const ItemIcon = Icon as typeof Moon;
          return (
            <button
              key={String(label)}
              className="settings-row pressable"
              onClick={() => {
                if (label === "Minha atividade") {
                  onClose();
                  onOpenMyActivity();
                }
                if (label === "Tema") {
                  onClose();
                  onOpenAppearance();
                }
                if (label === "Configurações") {
                  onClose();
                  onOpenSettings();
                }
                if (label === "Administração") {
                  onClose();
                  onOpenAdmin();
                }
                if (label === "Central de confiança") {
                  onClose();
                  onOpenTrust();
                }
                if (label === "Sair") {
                  onClose();
                  onOpenOnboarding();
                }
              }}
            >
              <ItemIcon size={20} />
              <span>{String(label)}</span>
              <small>{String(detail)}</small>
              <ChevronRight size={17} />
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function NotificationsSheet({
  open,
  onClose,
  onNavigate,
  onOpenSettings,
  showToast,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (
    destination:
      | "messages"
      | "community"
      | "profile"
      | "people"
      | "events"
      | "cinema"
      | "live"
      | "trust"
      | "verbo"
      | "pets"
      | "store"
      | "gifts"
      | "security",
  ) => void;
  onOpenSettings: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <Suspense fallback={<div className="experience-loading">Abrindo Atividade…</div>}>
      <ActivityExperience
        visible={open}
        onClose={onClose}
        onNavigate={onNavigate}
        onOpenSettings={onOpenSettings}
        showToast={showToast}
      />
    </Suspense>
  );
}

export default function App() {
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(() => {
    if (typeof document === "undefined") return "system";
    const current = document.documentElement.dataset.appearance;
    return current === "light" || current === "dark" || current === "system" ? current : "system";
  });
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [searchContext, setSearchContext] = useState<SearchContext>("Tudo");
  const [createOpen, setCreateOpen] = useState(false);
  const [createContext, setCreateContext] = useState<CreateContext>("Comunidade");
  const [toast, setToast] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [communitySpaceOpen, setCommunitySpaceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [publicOpen, setPublicOpen] = useState(false);
  const [editorialOpen, setEditorialOpen] = useState(false);
  const [editorialPublic, setEditorialPublic] = useState(false);
  const [editorialPage, setEditorialPage] = useState("home");
  const [trustOpen, setTrustOpen] = useState(false);
  const [myActivityOpen, setMyActivityOpen] = useState(false);
  const [myActivityTab, setMyActivityTab] = useState<MyActivityTab>("Atividade");
  const [myActivityFilter, setMyActivityFilter] = useState("Tudo");
  const [myActivitySource, setMyActivitySource] = useState("Perfil");
  const [conversationDetailsOpen, setConversationDetailsOpen] = useState(false);
  const [conversationDetailsMode, setConversationDetailsMode] = useState<"create" | "details">(
    "details",
  );
  const [conversationDetailsKind, setConversationDetailsKind] = useState<ConversationKind>("group");
  const [conversationDetailsTitle, setConversationDetailsTitle] = useState("");
  const [conversationDetailsSource, setConversationDetailsSource] = useState("Conversas");
  const [datingFromSettings, setDatingFromSettings] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<
    "Visual" | "Identidade" | "Módulos" | "Vitrine" | "Áudio"
  >("Visual");
  const [studioSource, setStudioSource] = useState("Perfil");
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [giftsTab, setGiftsTab] = useState<GiftsTab>("Recebidos");
  const [giftsAction, setGiftsAction] = useState<GiftsAction>("none");
  const [giftsItem, setGiftsItem] = useState<string | undefined>();
  const [giftsSource, setGiftsSource] = useState("");
  const [requestedChat, setRequestedChat] = useState<{
    name: string;
    requestId: number;
  } | null>(null);
  const scrollRefs = useRef<Record<TabId, HTMLElement | null>>({
    home: null,
    community: null,
    explore: null,
    messages: null,
    profile: null,
  });

  const tactileFeedback = (pattern: number | number[] = 8) => {
    if (window.localStorage.getItem("vdn-haptics") === "false") return;
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  };

  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;

    const updateVisualHeight = () => {
      const height = visualViewport?.height ?? window.innerHeight;
      const offsetTop = visualViewport?.offsetTop ?? 0;
      root.style.setProperty("--app-viewport-height", `${Math.round(height)}px`);
      root.style.setProperty("--app-viewport-offset-top", `${Math.round(offsetTop)}px`);
    };

    const reduced =
      window.localStorage.getItem("vdn-reduce-motion") === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.dataset.reduceMotion = reduced ? "true" : "false";
    updateVisualHeight();
    window.addEventListener("resize", updateVisualHeight);
    visualViewport?.addEventListener("resize", updateVisualHeight);
    visualViewport?.addEventListener("scroll", updateVisualHeight);

    return () => {
      window.removeEventListener("resize", updateVisualHeight);
      visualViewport?.removeEventListener("resize", updateVisualHeight);
      visualViewport?.removeEventListener("scroll", updateVisualHeight);
      root.style.removeProperty("--app-viewport-height");
      root.style.removeProperty("--app-viewport-offset-top");
    };
  }, []);

  useEffect(() => {
    const keyboardSelector = [
      "textarea",
      "select",
      "[contenteditable='true']",
      "input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='button']):not([type='submit'])",
    ].join(",");
    let closeTimer = 0;

    const isKeyboardTarget = (target: EventTarget | null) =>
      target instanceof HTMLElement && target.matches(keyboardSelector);

    const handleFocusIn = (event: FocusEvent) => {
      if (!isKeyboardTarget(event.target)) return;
      window.clearTimeout(closeTimer);
      setKeyboardOpen(true);
    };

    const handleFocusOut = () => {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        if (!isKeyboardTarget(document.activeElement)) setKeyboardOpen(false);
      }, 160);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      window.clearTimeout(closeTimer);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    const applyAppearance = () => {
      const effectiveTheme =
        appearanceMode === "system" ? (systemTheme.matches ? "dark" : "light") : appearanceMode;
      root.dataset.appearance = appearanceMode;
      root.dataset.theme = effectiveTheme;
      root.style.colorScheme = effectiveTheme;
      root.dataset.textSize = window.localStorage.getItem("vdn-text-size") ?? "standard";
      root.dataset.highContrast =
        window.localStorage.getItem("vdn-high-contrast") === "true" ? "true" : "false";
      root.dataset.reduceMotion =
        window.localStorage.getItem("vdn-reduce-motion") === "true" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "true"
          : "false";
      root.dataset.reduceTransparency =
        window.localStorage.getItem("vdn-reduce-transparency") === "true" ? "true" : "false";
      root.dataset.dataSaver =
        window.localStorage.getItem("vdn-data-saver") === "true" ? "true" : "false";
      root.dataset.captions =
        window.localStorage.getItem("vdn-captions") === "false" ? "false" : "true";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", effectiveTheme === "dark" ? "#101114" : "#FAFAFA");
    };

    applyAppearance();
    systemTheme.addEventListener("change", applyAppearance);
    window.addEventListener("vdn-appearance-change", applyAppearance);
    return () => {
      systemTheme.removeEventListener("change", applyAppearance);
      window.removeEventListener("vdn-appearance-change", applyAppearance);
    };
  }, [appearanceMode]);

  const updateAppearanceMode = (next: AppearanceMode) => {
    window.localStorage.setItem("vdn-theme", next);
    setAppearanceMode(next);
  };

  const getTabScroller = (id: TabId) => {
    const pane = scrollRefs.current[id];
    if (!pane) return null;
    const selectors: Record<TabId, string> = {
      home: ".home-page-scroll",
      community: ".community-section-pane.active",
      explore: ".explore-page-scroll",
      messages: ".message-thread, .messages-page-scroll",
      profile: ".profile-page-scroll",
    };
    return pane.querySelector<HTMLElement>(selectors[id]) ?? pane;
  };

  useEffect(() => {
    const openGlobalSearch = (event: Event) => {
      const requested = (event as CustomEvent<SearchContext>).detail;
      const allowed: SearchContext[] = [
        "Tudo",
        "Pessoas",
        "Comunidade",
        "Espaços",
        "Eventos",
        "Verbo",
        "Cinema",
        "Loja",
        "Configurações",
      ];
      setSearchContext(allowed.includes(requested) ? requested : "Tudo");
      setOverlay("search");
    };
    const openCreateCenter = (event: Event) => {
      const requested = (event as CustomEvent<CreateContext>).detail;
      const allowed: CreateContext[] = ["Comunidade", "Espaços", "Verbo", "Perfil", "Cinema"];
      setCreateContext(allowed.includes(requested) ? requested : "Comunidade");
      setCreateOpen(true);
    };
    const openProfileStudio = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: typeof studioTab; source?: string } | string>)
        .detail;
      const requestedTab = typeof detail === "string" ? detail : detail?.tab;
      const allowedTabs = ["Visual", "Identidade", "Módulos", "Vitrine", "Áudio"] as const;
      setStudioTab(
        allowedTabs.includes(requestedTab as (typeof allowedTabs)[number])
          ? (requestedTab as typeof studioTab)
          : "Visual",
      );
      setStudioSource(typeof detail === "object" && detail?.source ? detail.source : "Perfil");
      setStudioOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set("area", "estudio");
      window.history.replaceState({}, "", url);
    };
    const openGifts = (event: Event) => {
      const detail = (
        event as CustomEvent<
          { tab?: GiftsTab; action?: GiftsAction; item?: string; source?: string } | undefined
        >
      ).detail;
      const allowedTabs: GiftsTab[] = [
        "Recebidos",
        "Enviados",
        "Caixas",
        "Recompensas",
        "Histórico",
      ];
      setGiftsTab(detail?.tab && allowedTabs.includes(detail.tab) ? detail.tab : "Recebidos");
      setGiftsAction(detail?.action === "send" ? "send" : "none");
      setGiftsItem(detail?.item);
      setGiftsSource(detail?.source ?? "");
      setGiftsOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set("area", "presentes");
      window.history.replaceState({}, "", url);
    };
    const openTrust = () => {
      setTrustOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set("area", "confianca");
      window.history.replaceState({}, "", url);
    };
    const openMyActivity = (event: Event) => {
      const detail = (
        event as CustomEvent<
          | {
              tab?: MyActivityTab;
              filter?: string;
              source?: string;
            }
          | undefined
        >
      ).detail;
      const allowedTabs: MyActivityTab[] = ["Atividade", "Salvos", "Rascunhos", "Histórico"];
      const requestedTab =
        detail?.tab && allowedTabs.includes(detail.tab) ? detail.tab : "Atividade";
      setMyActivityTab(requestedTab);
      setMyActivityFilter(detail?.filter ?? (requestedTab === "Atividade" ? "Tudo" : "Todos"));
      setMyActivitySource(detail?.source ?? "Aplicativo");
      setMyActivityOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set("area", "minha-atividade");
      window.history.replaceState({}, "", url);
    };
    const openConversationDetails = (event: Event) => {
      const detail = (
        event as CustomEvent<
          | {
              mode?: "create" | "details";
              kind?: ConversationKind;
              title?: string;
              source?: string;
            }
          | undefined
        >
      ).detail;
      setConversationDetailsMode(detail?.mode ?? "details");
      setConversationDetailsKind(detail?.kind ?? "group");
      setConversationDetailsTitle(detail?.title ?? "");
      setConversationDetailsSource(detail?.source ?? "Conversas");
      setConversationDetailsOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set("area", detail?.mode === "create" ? "novo-grupo" : "detalhes-conversa");
      window.history.replaceState({}, "", url);
    };
    window.addEventListener("vdn-open-global-search", openGlobalSearch);
    window.addEventListener("vdn-open-create-center", openCreateCenter);
    window.addEventListener("vdn-open-profile-studio", openProfileStudio);
    window.addEventListener("vdn-open-gifts", openGifts);
    window.addEventListener("vdn-open-trust", openTrust);
    window.addEventListener("vdn-open-my-activity", openMyActivity);
    window.addEventListener("vdn-open-conversation-details", openConversationDetails);
    return () => {
      window.removeEventListener("vdn-open-global-search", openGlobalSearch);
      window.removeEventListener("vdn-open-create-center", openCreateCenter);
      window.removeEventListener("vdn-open-profile-studio", openProfileStudio);
      window.removeEventListener("vdn-open-gifts", openGifts);
      window.removeEventListener("vdn-open-trust", openTrust);
      window.removeEventListener("vdn-open-my-activity", openMyActivity);
      window.removeEventListener("vdn-open-conversation-details", openConversationDetails);
    };
  }, []);

  useEffect(() => {
    const area = new URLSearchParams(window.location.search).get("area");
    const savedTab = window.localStorage.getItem("vdn-active-tab") as TabId | null;
    const restoreDirectArea = window.setTimeout(() => {
      if (savedTab && tabs.some((tab) => tab.id === savedTab)) {
        setActiveTab(savedTab);
        window.requestAnimationFrame(() => {
          const savedScroll = Number(
            window.sessionStorage.getItem(`vdn-scroll-${savedTab}`) ?? "0",
          );
          getTabScroller(savedTab)?.scrollTo({ top: savedScroll });
        });
      }
      if (area === "settings") setSettingsOpen(true);
      if (area === "admin") setAdminOpen(true);
      if (area === "onboarding") setOnboardingOpen(true);
      if (area === "publico") setPublicOpen(true);
      if (area === "editorial" || area === "publico-editorial") {
        setEditorialPublic(area === "publico-editorial");
        setEditorialPage(new URLSearchParams(window.location.search).get("conteudo") ?? "home");
        setEditorialOpen(true);
      }
      if (area === "confianca") setTrustOpen(true);
      if (area === "minha-atividade") setMyActivityOpen(true);
      if (area === "novo-grupo") {
        setActiveTab("messages");
        setConversationDetailsMode("create");
        setConversationDetailsOpen(true);
      }
      if (area === "detalhes-conversa") {
        setActiveTab("messages");
        setConversationDetailsMode("details");
        setConversationDetailsOpen(true);
      }
      if (area === "estudio") {
        setActiveTab("profile");
        setStudioOpen(true);
      }
      if (area === "presentes") {
        setGiftsOpen(true);
      }
      if (area === "namoro") {
        setActiveTab("explore");
        setDatingFromSettings(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreDirectArea);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("vdn-active-tab", activeTab);
    const restoreScroll = window.requestAnimationFrame(() => {
      const savedScroll = Number(window.sessionStorage.getItem(`vdn-scroll-${activeTab}`) ?? "0");
      const scroller = getTabScroller(activeTab);
      if (savedScroll > 0 && scroller?.scrollTop === 0) {
        scroller.scrollTo({ top: savedScroll });
      }
    });
    return () => window.cancelAnimationFrame(restoreScroll);
  }, [activeTab]);

  useEffect(() => {
    const saveScrollPositions = () => {
      tabs.forEach(({ id }) => {
        const top = getTabScroller(id)?.scrollTop ?? 0;
        window.sessionStorage.setItem(`vdn-scroll-${id}`, String(top));
      });
    };
    window.addEventListener("pagehide", saveScrollPositions);
    document.addEventListener("visibilitychange", saveScrollPositions);
    return () => {
      window.removeEventListener("pagehide", saveScrollPositions);
      document.removeEventListener("visibilitychange", saveScrollPositions);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const openSettingsExperience = () => {
    setSettingsOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "settings");
    window.history.replaceState({}, "", url);
  };

  const closeSettingsExperience = () => {
    setSettingsOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    url.searchParams.delete("settingsSection");
    window.history.replaceState({}, "", url);
  };

  const openSettingsSection = (
    section: "Conta" | "Notificações" | "Aparência e acessibilidade" | "PWA e dispositivo",
  ) => {
    setSettingsOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "settings");
    url.searchParams.set("settingsSection", section);
    window.history.replaceState({}, "", url);
  };

  const openAdminExperience = () => {
    setAdminOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "admin");
    window.history.replaceState({}, "", url);
  };

  const closeAdminExperience = () => {
    setAdminOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    window.history.replaceState({}, "", url);
  };

  const openOnboardingExperience = () => {
    setOnboardingOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "onboarding");
    window.history.replaceState({}, "", url);
  };

  const closeOnboardingExperience = () => {
    setOnboardingOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    window.history.replaceState({}, "", url);
  };

  const closePublicExperience = () => {
    setPublicOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    url.searchParams.delete("conteudo");
    window.history.replaceState({}, "", url);
  };

  const openEditorialExperience = (page = "home", publicSource = false) => {
    setEditorialPage(page);
    setEditorialPublic(publicSource);
    setEditorialOpen(true);
    if (publicSource) setPublicOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("area", publicSource ? "publico-editorial" : "editorial");
    url.searchParams.set("conteudo", page);
    window.history.replaceState({}, "", url);
  };

  const closeEditorialExperience = () => {
    setEditorialOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("conteudo");
    if (editorialPublic) {
      setPublicOpen(true);
      url.searchParams.set("area", "publico");
    } else {
      url.searchParams.delete("area");
    }
    window.history.replaceState({}, "", url);
  };

  const openTrustExperience = () => {
    setTrustOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set("area", "confianca");
    window.history.replaceState({}, "", url);
  };

  const closeTrustExperience = () => {
    setTrustOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("area");
    url.searchParams.delete("trustState");
    window.history.replaceState({}, "", url);
  };

  const changeTab = (id: TabId) => {
    if (id === activeTab) {
      getTabScroller(id)?.scrollTo({ top: 0, behavior: "smooth" });
      tactileFeedback(6);
      showToast(`${tabs.find((tab) => tab.id === id)?.label} voltou ao topo`);
      return;
    }
    window.sessionStorage.setItem(
      `vdn-scroll-${activeTab}`,
      String(getTabScroller(activeTab)?.scrollTop ?? 0),
    );
    tactileFeedback(7);
    setActiveTab(id);
    window.dispatchEvent(new CustomEvent("vdn-useful-action"));
  };

  return (
    <main
      className={`app-shell ${activeTab === "home" ? "home-active" : ""} ${
        keyboardOpen ? "keyboard-open" : ""
      } ${createOpen ? "create-open" : ""}`}
      data-active-tab={activeTab}
    >
      <aside className="desktop-sidebar" aria-label="Navegação principal">
        <div className="sidebar-brand">
          <img src="/vdn-logo.png" alt="" />
          <span>VaiDarNamoro</span>
        </div>
        <nav>
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={`sidebar-item pressable ${activeTab === id ? "active" : ""}`}
              onClick={() => changeTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={21} />
              <span>{label}</span>
              {badge && <small>{badge}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="avatar avatar-sm">AR</div>
          <div>
            <strong>Antonio</strong>
            <span>Conta aprovada</span>
          </div>
        </div>
      </aside>

      <div className="tab-stage">
        <div
          ref={(node) => {
            scrollRefs.current.home = node;
          }}
          className={`tab-pane ${activeTab === "home" ? "active" : ""}`}
        >
          <HomeScreen
            openOverlay={(nextOverlay) => {
              if (nextOverlay === "search") setSearchContext("Tudo");
              setOverlay(nextOverlay);
            }}
            showToast={showToast}
            openConversation={(name) => {
              setRequestedChat({ name, requestId: Date.now() });
              setActiveTab("messages");
              showToast(`Conversa com ${name} aberta`);
            }}
            openDiscovery={() => {
              setActiveTab("explore");
              showToast("Cinema em comunidade aberto");
            }}
            openLive={() => {
              setActiveTab("explore");
              window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: "live" }));
              showToast("Live oficial aberta");
            }}
          />
        </div>
        <div
          ref={(node) => {
            scrollRefs.current.community = node;
          }}
          className={`tab-pane ${activeTab === "community" ? "active" : ""}`}
        >
          <CommunityScreen
            showToast={showToast}
            onKeyboard={setKeyboardOpen}
            onSpaceContextChange={setCommunitySpaceOpen}
            openProfile={() => {
              setActiveTab("profile");
              showToast("Perfil aberto");
            }}
          />
        </div>
        <div
          ref={(node) => {
            scrollRefs.current.explore = node;
          }}
          className={`tab-pane ${activeTab === "explore" ? "active" : ""}`}
        >
          <ExploreScreen
            showToast={showToast}
            openSettings={openSettingsExperience}
            openConversation={(name) => {
              setRequestedChat({ name, requestId: Date.now() });
              setActiveTab("messages");
            }}
            openProfile={(name) => {
              setActiveTab("profile");
              showToast(`Perfil de ${name} aberto`);
            }}
          />
        </div>
        <div
          ref={(node) => {
            scrollRefs.current.messages = node;
          }}
          className={`tab-pane ${activeTab === "messages" ? "active" : ""}`}
        >
          <MessagesScreen
            key={requestedChat?.requestId ?? "messages"}
            showToast={showToast}
            onKeyboard={setKeyboardOpen}
            requestedChat={requestedChat}
            onCreateGroup={() => {
              setConversationDetailsMode("create");
              setConversationDetailsKind("group");
              setConversationDetailsTitle("");
              setConversationDetailsSource("Conversas");
              setConversationDetailsOpen(true);
              const url = new URL(window.location.href);
              url.searchParams.set("area", "novo-grupo");
              window.history.replaceState({}, "", url);
            }}
            onOpenDetails={(kind, title) => {
              setConversationDetailsMode("details");
              setConversationDetailsKind(kind);
              setConversationDetailsTitle(title);
              setConversationDetailsSource("Conversa aberta");
              setConversationDetailsOpen(true);
              const url = new URL(window.location.href);
              url.searchParams.set("area", "detalhes-conversa");
              window.history.replaceState({}, "", url);
            }}
          />
        </div>
        <div
          ref={(node) => {
            scrollRefs.current.profile = node;
          }}
          className={`tab-pane ${activeTab === "profile" ? "active" : ""}`}
        >
          <ProfileScreen
            showToast={showToast}
            onOpenStudio={(tab = "Visual") => {
              setStudioTab(tab);
              setStudioSource("Perfil");
              setStudioOpen(true);
              const url = new URL(window.location.href);
              url.searchParams.set("area", "estudio");
              window.history.replaceState({}, "", url);
            }}
            onOpenActivity={() => {
              setMyActivityTab("Atividade");
              setMyActivityFilter("Tudo");
              setMyActivitySource("Perfil");
              setMyActivityOpen(true);
              const url = new URL(window.location.href);
              url.searchParams.set("area", "minha-atividade");
              window.history.replaceState({}, "", url);
            }}
          />
        </div>
      </div>

      <aside className="context-panel">
        {activeTab === "community" ? (
          communitySpaceOpen ? (
            <>
              <span className="section-overline">NESTE ESPAÇO</span>
              <h2>Café, Bíblia & Amizade</h2>
              <div className="space-context-summary">
                <span className="visibility-chip">
                  <Globe2 size={13} /> Público
                </span>
                <p>Conversas leves, estudos e amizade cristã para viver a fé sem formalidade.</p>
                <button>
                  <UsersRound size={16} /> 248 membros
                </button>
              </div>
              <div className="community-context-event">
                <span>PRÓXIMO EVENTO</span>
                <strong>Conversa sobre João 8</strong>
                <small>Hoje · 21h30 · Online</small>
                <button>Tenho interesse</button>
              </div>
              <div className="space-context-rules">
                <span>REGRAS ESSENCIAIS</span>
                <p>Escute antes de responder.</p>
                <p>Discorde sem atacar.</p>
              </div>
              <div className="community-active-friends">
                <span>EQUIPE</span>
                <div className="active-avatar-row">
                  <div className="avatar avatar-sm avatar-ana">AC</div>
                  <div className="avatar avatar-sm avatar-lucas">LA</div>
                  <div className="avatar avatar-sm avatar-marina">MS</div>
                </div>
                <p>Ana, Lucas e Marina cuidam deste Espaço.</p>
              </div>
            </>
          ) : (
            <>
              <span className="section-overline">NA COMUNIDADE</span>
              <h2>Acontecendo agora</h2>
              <div className="community-context-block">
                <span>SEUS ESPAÇOS</span>
                <button>
                  <div className="context-space-icon">
                    <BookOpen size={17} />
                  </div>
                  <div>
                    <strong>Café, Bíblia & Amizade</strong>
                    <small>18 pessoas ativas</small>
                  </div>
                  <ChevronRight size={16} />
                </button>
                <button>
                  <div className="context-space-icon violet">
                    <UsersRound size={17} />
                  </div>
                  <div>
                    <strong>Cristãos do Litoral Sul</strong>
                    <small>6 novas conversas</small>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="community-context-event">
                <span>PRÓXIMO EVENTO</span>
                <strong>Conversa sobre João 8</strong>
                <small>Hoje · 21h30 · Online</small>
                <button>Tenho interesse</button>
              </div>
              <div className="community-active-friends">
                <span>AMIGOS ATIVOS</span>
                <div className="active-avatar-row">
                  <div className="avatar avatar-sm avatar-ana">AC</div>
                  <div className="avatar avatar-sm avatar-lucas">LA</div>
                  <div className="avatar avatar-sm avatar-marina">MS</div>
                  <small>+8</small>
                </div>
                <p>Ana e Lucas estão conversando em Café, Bíblia & Amizade.</p>
                <button>Participar da conversa</button>
              </div>
            </>
          )
        ) : (
          <>
            <span className="section-overline">AGORA</span>
            <h2>Seu domingo</h2>
            <div className="context-item">
              <span className="context-time">20:00</span>
              <div>
                <strong>Cinema em comunidade</strong>
                <span>12 amigos demonstraram interesse</span>
              </div>
            </div>
            <div className="context-item">
              <span className="context-time">21:30</span>
              <div>
                <strong>Encontro do Espaço</strong>
                <span>Café, Bíblia & Amizade</span>
              </div>
            </div>
            <button className="secondary-button pressable">Ver agenda</button>
            <div className="context-quote">
              <BookOpen size={18} />
              <p>“O Senhor é a minha força e o meu escudo.”</p>
              <span>Salmos 28:7</span>
            </div>
          </>
        )}
      </aside>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            className={`bottom-nav-item pressable ${activeTab === id ? "active" : ""}`}
            onClick={() => changeTab(id)}
            aria-current={activeTab === id ? "page" : undefined}
          >
            <span>
              <Icon size={21} />
              {badge && <small>{badge}</small>}
            </span>
            <em>{label}</em>
          </button>
        ))}
      </nav>

      <AccountSheet
        open={overlay === "account"}
        onClose={() => setOverlay(null)}
        onOpenSettings={openSettingsExperience}
        onOpenAppearance={() => openSettingsSection("Aparência e acessibilidade")}
        onOpenAdmin={openAdminExperience}
        onOpenOnboarding={openOnboardingExperience}
        onOpenTrust={openTrustExperience}
        onOpenMyActivity={() => {
          setMyActivityTab("Atividade");
          setMyActivityFilter("Tudo");
          setMyActivitySource("Conta");
          setMyActivityOpen(true);
          const url = new URL(window.location.href);
          url.searchParams.set("area", "minha-atividade");
          window.history.replaceState({}, "", url);
        }}
        appearanceMode={appearanceMode}
      />
      <GlobalSearchExperience
        visible={overlay === "search"}
        context={searchContext}
        onClose={() => setOverlay(null)}
        onNavigate={(destination, label) => {
          setOverlay(null);
          if (destination === "profile") {
            setActiveTab("profile");
            showToast(`Perfil de ${label} aberto`);
            return;
          }
          if (destination === "community" || destination === "community-space") {
            setActiveTab("community");
            if (destination === "community-space") {
              window.localStorage.setItem("vdn-community-section", "Espaços");
              window.dispatchEvent(
                new CustomEvent("vdn-open-community-section", {
                  detail: "Espaços",
                }),
              );
            }
            showToast(`${label} aberto na Comunidade`);
            return;
          }
          setActiveTab("explore");
          const area = destination === "store" ? "loja" : destination;
          window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: area }));
          showToast(`${label} aberto`);
        }}
      />
      <CreateCenterExperience
        visible={createOpen}
        context={createContext}
        onClose={() => setCreateOpen(false)}
        showToast={showToast}
        onNavigate={(destination) => {
          setCreateOpen(false);
          if (destination === "events") {
            setActiveTab("community");
            window.localStorage.setItem("vdn-community-section", "Eventos");
            window.dispatchEvent(
              new CustomEvent("vdn-open-community-section", {
                detail: "Eventos",
              }),
            );
            showToast("Criação de Evento aberta");
            return;
          }
          if (destination === "new-space") {
            setActiveTab("community");
            window.localStorage.setItem("vdn-community-section", "Espaços");
            window.dispatchEvent(
              new CustomEvent("vdn-open-community-section", {
                detail: "Espaços",
              }),
            );
            showToast("Fluxo de novo Espaço aberto");
          }
        }}
      />
      <NotificationsSheet
        open={overlay === "notifications"}
        onClose={() => setOverlay(null)}
        onOpenSettings={() => {
          setOverlay(null);
          openSettingsSection("Notificações");
        }}
        showToast={showToast}
        onNavigate={(destination) => {
          setOverlay(null);
          if (destination === "messages") {
            setActiveTab("messages");
            return;
          }
          if (destination === "community" || destination === "events") {
            if (destination === "events") {
              window.localStorage.setItem("vdn-community-section", "Eventos");
              window.dispatchEvent(
                new CustomEvent("vdn-open-community-section", { detail: "Eventos" }),
              );
            }
            setActiveTab("community");
            return;
          }
          if (destination === "profile") {
            setActiveTab("profile");
            return;
          }
          if (destination === "gifts") {
            window.dispatchEvent(
              new CustomEvent("vdn-open-gifts", {
                detail: { tab: "Recebidos", source: "Notificações" },
              }),
            );
            return;
          }
          if (destination === "security") {
            openSettingsSection("Conta");
            showToast("Segurança da conta aberta");
            return;
          }
          if (destination === "trust") {
            openTrustExperience();
            return;
          }
          setActiveTab("explore");
          const area = destination === "store" ? "loja" : destination;
          window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: area }));
        }}
      />
      <Suspense fallback={<div className="experience-loading">Abrindo Configurações…</div>}>
        <SettingsExperience
          visible={settingsOpen}
          appearanceMode={appearanceMode}
          onAppearanceChange={updateAppearanceMode}
          onClose={closeSettingsExperience}
          onOpenDating={() => {
            setSettingsOpen(false);
            setDatingFromSettings(true);
            setActiveTab("explore");
            const url = new URL(window.location.href);
            url.searchParams.set("area", "namoro");
            window.history.replaceState({}, "", url);
          }}
          showToast={showToast}
        />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Abrindo Administração…</div>}>
        <AdminExperience visible={adminOpen} onClose={closeAdminExperience} showToast={showToast} />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Resolvendo sua sessão…</div>}>
        <OnboardingExperience
          visible={onboardingOpen}
          onClose={closeOnboardingExperience}
          showToast={showToast}
        />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Abrindo apresentação pública…</div>}>
        <PublicExperience
          visible={publicOpen}
          onExit={closePublicExperience}
          onAuthenticated={() => {
            closePublicExperience();
            showToast("Entrada concluída; App Shell preservado");
          }}
          onOpenEditorial={(page) => openEditorialExperience(page ?? "home", true)}
          showToast={showToast}
        />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Abrindo conteúdo editorial…</div>}>
        <EditorialExperience
          key={`${editorialPublic ? "public" : "authenticated"}-${editorialPage}`}
          visible={editorialOpen}
          isPublic={editorialPublic}
          initialPage={editorialPage}
          onClose={closeEditorialExperience}
          onOpenLogin={() => {
            setEditorialOpen(false);
            setEditorialPublic(true);
            setPublicOpen(true);
            const url = new URL(window.location.href);
            url.searchParams.set("area", "publico");
            url.searchParams.delete("conteudo");
            window.history.replaceState({}, "", url);
            showToast("Entrada pública aberta");
          }}
          onOpenVerbo={() => {
            setEditorialOpen(false);
            setEditorialPublic(false);
            setActiveTab("explore");
            const url = new URL(window.location.href);
            url.searchParams.delete("area");
            url.searchParams.delete("conteudo");
            window.history.replaceState({}, "", url);
            window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: "verbo" }));
            showToast("João 8 aberto no Verbo");
          }}
          showToast={showToast}
        />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Abrindo Central de confiança…</div>}>
        <TrustCenterExperience
          visible={trustOpen}
          onClose={closeTrustExperience}
          showToast={showToast}
        />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Abrindo Minha Atividade…</div>}>
        <MyActivityExperience
          visible={myActivityOpen}
          initialTab={myActivityTab}
          initialFilter={myActivityFilter}
          source={myActivitySource}
          onClose={() => {
            setMyActivityOpen(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("area");
            window.history.replaceState({}, "", url);
          }}
          onContinue={(item: MyActivityItem) => {
            setMyActivityOpen(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("area");
            window.history.replaceState({}, "", url);
            if (item.type === "Cinema") {
              setActiveTab("explore");
              window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: "cinema" }));
            } else if (item.type === "Verbo" || item.type === "Estudo") {
              setActiveTab("explore");
              window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: "verbo" }));
            } else if (item.type === "Pessoa") {
              setActiveTab("profile");
            } else if (item.tab === "Rascunhos") {
              setCreateContext(
                item.context.includes("Verbo")
                  ? "Verbo"
                  : item.context.includes("Perfil")
                    ? "Perfil"
                    : "Comunidade",
              );
              setCreateOpen(true);
            } else {
              setActiveTab("community");
            }
            showToast(`${item.title} aberto com contexto preservado`);
          }}
          showToast={showToast}
        />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Abrindo detalhes da conversa…</div>}>
        <ConversationDetailsExperience
          visible={conversationDetailsOpen}
          mode={conversationDetailsMode}
          kind={conversationDetailsKind}
          title={conversationDetailsTitle}
          source={conversationDetailsSource}
          onClose={() => {
            setConversationDetailsOpen(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("area");
            window.history.replaceState({}, "", url);
          }}
          onCreate={(name) => {
            setConversationDetailsOpen(false);
            setRequestedChat({ name, requestId: Date.now() });
            setActiveTab("messages");
            const url = new URL(window.location.href);
            url.searchParams.delete("area");
            window.history.replaceState({}, "", url);
          }}
          showToast={showToast}
        />
      </Suspense>
      {datingFromSettings && (
        <Suspense fallback={<div className="experience-loading">Abrindo Modo Namoro…</div>}>
          <DatingExperience
            visible
            onClose={() => {
              setDatingFromSettings(false);
              const url = new URL(window.location.href);
              url.searchParams.delete("area");
              window.history.replaceState({}, "", url);
            }}
            onOpenSettings={() => {
              setDatingFromSettings(false);
              openSettingsExperience();
            }}
            onOpenConversation={(name) => {
              setDatingFromSettings(false);
              setRequestedChat({ name, requestId: Date.now() });
              setActiveTab("messages");
            }}
            showToast={showToast}
          />
        </Suspense>
      )}
      <Suspense fallback={<div className="experience-loading">Abrindo Estúdio…</div>}>
        <ProfileStudioExperience
          visible={studioOpen}
          initialTab={studioTab}
          source={studioSource}
          onClose={() => {
            setStudioOpen(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("area");
            window.history.replaceState({}, "", url);
          }}
          showToast={showToast}
        />
      </Suspense>
      <Suspense fallback={<div className="experience-loading">Abrindo Presentes…</div>}>
        <GiftsRewardsExperience
          visible={giftsOpen}
          initialTab={giftsTab}
          initialAction={giftsAction}
          initialItem={giftsItem}
          onClose={() => {
            setGiftsOpen(false);
            setGiftsAction("none");
            const url = new URL(window.location.href);
            if (giftsSource === "Loja") url.searchParams.set("area", "loja");
            else url.searchParams.delete("area");
            window.history.replaceState({}, "", url);
          }}
          showToast={showToast}
        />
      </Suspense>

      <ResilienceLayer
        onOpenSettings={() => openSettingsSection("PWA e dispositivo")}
        onOpenLogin={openOnboardingExperience}
      />

      <ImmersiveMediaLayer />
      <UniversalActions />

      <div
        className={`toast ${toast ? "show" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <Sparkles size={17} />
        {toast}
      </div>
    </main>
  );
}
