import type { CSSProperties, ReactNode } from "react";
import { BookOpen, Compass, Home, MessageCircle, UserRound, UsersRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import type { FuturePrimaryTab } from "@/config/app-destinations";
import {
  NATIVE_TAB_RESELECT_EVENT,
  createNativeTabReselectDetail,
  nativePrimaryNavigation,
  resolveNativeReselectScrollBehavior,
  resolveNativeTabSelectionAction,
} from "@/config/native-primary-navigation";
import type { NativeViewportState } from "@/components/native-shell/useNativeViewportState";
import { getNativeSecondaryDestinationChrome } from "@/config/native-secondary-destinations";

import vdnLogo from "../assets/vdn-logo.png";
import { Prototype01SecondaryHeader } from "../components/Prototype01SecondaryHeader";
import "../styles/functional-extensions.css";
import "../styles/globals.css";

const icons = {
  home: Home,
  community: UsersRound,
  explore: Compass,
  messages: MessageCircle,
  profile: UserRound,
} as const;

type Prototype01ViewportStyle = CSSProperties & {
  "--app-viewport-height": string;
  "--app-visual-height": string;
  "--app-viewport-offset-top": string;
};

export type Prototype01ShellFrameProps = {
  activeTab: FuturePrimaryTab;
  destinationId: string;
  pathname: string;
  search?: string;
  hash?: string;
  userLabel: string;
  viewportState: NativeViewportState;
  children: ReactNode;
  contextPanel?: ReactNode;
};

const tabContext: Record<
  FuturePrimaryTab,
  { overline: string; title: string; description: string }
> = {
  home: {
    overline: "AGORA",
    title: "Seu dia",
    description: "Prioridades, continuidade e fé reunidas em um só lugar.",
  },
  community: {
    overline: "NA COMUNIDADE",
    title: "Conexões reais",
    description: "Chat, orações, notícias e devocionais da comunidade.",
  },
  explore: {
    overline: "EXPLORE",
    title: "Experiências",
    description: "Descubra as experiências que já fazem parte do produto.",
  },
  messages: {
    overline: "CONVERSAS",
    title: "Sua inbox",
    description: "Conversas privadas e o chat geral, com dados reais.",
  },
  profile: {
    overline: "SEU PERFIL",
    title: "Identidade e conta",
    description: "Perfil, segurança, personalização e inventário.",
  },
};

function initials(label: string): string {
  const normalized =
    label
      .split("@", 1)[0]
      ?.replace(/[._-]+/g, " ")
      .trim() || "Conta";
  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");
}

export function Prototype01ShellFrame({
  activeTab,
  destinationId,
  pathname,
  search = "",
  hash = "",
  userLabel,
  viewportState,
  children,
  contextPanel,
}: Prototype01ShellFrameProps) {
  const navigate = useNavigate();
  const context = tabContext[activeTab];
  const secondaryDestination = getNativeSecondaryDestinationChrome(destinationId);
  const viewportHeight = viewportState.visualHeight || viewportState.layoutHeight;
  const style: Prototype01ViewportStyle = {
    "--app-viewport-height": viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
    "--app-visual-height": viewportHeight > 0 ? `${viewportHeight}px` : "100dvh",
    "--app-viewport-offset-top": "0px",
  };

  const selectTab = (item: (typeof nativePrimaryNavigation)[number]) => {
    const action = resolveNativeTabSelectionAction({
      item,
      activeTab,
      pathname,
      search,
      hash,
    });
    if (action !== "scroll-top") {
      void navigate({ to: item.path });
      return;
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior = resolveNativeReselectScrollBehavior(Boolean(reducedMotion));
    document.querySelector<HTMLElement>("[data-prototype01-scroll]")?.scrollTo({
      top: 0,
      behavior,
    });
    window.dispatchEvent(
      new CustomEvent(NATIVE_TAB_RESELECT_EVENT, {
        detail: createNativeTabReselectDetail(item),
      }),
    );
  };

  const navigation = (className: "sidebar-item" | "bottom-nav-item") =>
    nativePrimaryNavigation.map((item) => {
      const Icon = icons[item.icon];
      const active = activeTab === item.id;
      return (
        <button
          key={item.id}
          type="button"
          className={`${className} pressable ${active ? "active" : ""}`}
          onClick={() => selectTab(item)}
          aria-current={active ? "page" : undefined}
          data-prototype01-primary-tab={item.id}
        >
          {className === "bottom-nav-item" ? (
            <>
              <span>
                <Icon size={21} />
              </span>
              <em>{item.label}</em>
            </>
          ) : (
            <>
              <Icon size={21} />
              <span>{item.label}</span>
            </>
          )}
        </button>
      );
    });

  return (
    <main
      className={`app-shell ${activeTab === "home" ? "home-active" : ""} ${
        viewportState.keyboardOpen ? "keyboard-open" : ""
      }`}
      style={style}
      data-vdn-prototype01
      data-active-tab={activeTab}
      data-keyboard-open={String(viewportState.keyboardOpen)}
      data-orientation={viewportState.orientation}
    >
      <aside className="desktop-sidebar" aria-label="Navegação principal">
        <div className="sidebar-brand">
          <img src={vdnLogo} alt="" />
          <span>VaiDarNamoro</span>
        </div>
        <nav>{navigation("sidebar-item")}</nav>
        <div className="sidebar-account">
          <div className="avatar avatar-sm">{initials(userLabel)}</div>
          <div>
            <strong>{userLabel.split("@", 1)[0] || "Sua conta"}</strong>
            <span>Conta aprovada</span>
          </div>
        </div>
      </aside>

      <div className="tab-stage">
        <div className="tab-pane active" data-prototype01-scroll>
          {secondaryDestination ? (
            <div className="prototype01-secondary-surface" data-prototype01-secondary>
              <Prototype01SecondaryHeader destinationId={destinationId} />
              <div className="prototype01-secondary-content">{children}</div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      <aside className="context-panel">
        {contextPanel ?? (
          <>
            <span className="section-overline">{context.overline}</span>
            <h2>{context.title}</h2>
            <div className="context-quote">
              <BookOpen size={18} />
              <p>{context.description}</p>
            </div>
          </>
        )}
      </aside>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {navigation("bottom-nav-item")}
      </nav>
    </main>
  );
}
