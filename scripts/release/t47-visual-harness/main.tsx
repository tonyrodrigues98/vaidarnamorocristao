import { createRoot } from "react-dom/client";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  Bell,
  Compass,
  Home,
  Menu,
  MessageCircle,
  Moon,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AdminShellFrame } from "@/components/admin-shell/AdminShellFrame";
import { NativeShellFrame } from "@/components/native-shell/NativeShellFrame";
import {
  adminDestinations,
  getAdminDestination,
  getAdminNavigationForRole,
} from "@/config/admin-destinations";
import { brand } from "@/config/brand";
import { nativePrimaryNavigation } from "@/config/native-primary-navigation";
import type { AppRole } from "@/lib/roles";
import { ThemeProvider, useTheme } from "@/lib/theme";

import "@/styles.css";
import "@/styles/admin-shell.css";
import "@/styles/native-focused-chat.css";
import "@/styles/native-shell.tokens.css";
import "@/styles/native-shell.frame.css";
import "./visual-harness.css";

const icons = {
  home: Home,
  community: UsersRound,
  explore: Compass,
  messages: MessageCircle,
  profile: UserRound,
};
const params = new URLSearchParams(window.location.search);
const surface = params.get("surface") ?? "native";
const route = params.get("route") ?? "/inicio";
const role = (params.get("role") ?? "admin") as AppRole;

function getActiveTab() {
  return route.includes("conversa") || route.includes("proposito")
    ? "messages"
    : route.includes("perfil") ||
        route.includes("conta") ||
        route.includes("manual") ||
        route.includes("termos")
      ? "profile"
      : route.includes("comunidade") || route.includes("oracoes")
        ? "community"
        : route.includes("explorar") ||
            route.includes("loja") ||
            route.includes("pet") ||
            route.includes("avatar") ||
            route.includes("caixas") ||
            route.includes("pretendentes") ||
            route.includes("devocional")
          ? "explore"
          : "home";
}

function HarnessNavigation({ compact = false }: { compact?: boolean }) {
  const active = getActiveTab();
  return (
    <div className={compact ? "harness-bottom" : "vdn-native-adaptive-navigation"}>
      {!compact && (
        <a
          className="vdn-native-adaptive-navigation__brand"
          href="#main"
          aria-label={brand.displayName}
        >
          <img
            className="vdn-native-adaptive-navigation__brand-icon"
            src={brand.assets.icon192}
            alt=""
          />
          <span className="vdn-native-adaptive-navigation__brand-name">{brand.displayName}</span>
        </a>
      )}
      <ul
        className={
          compact ? "vdn-native-bottom-navigation__list" : "vdn-native-adaptive-navigation__list"
        }
      >
        {nativePrimaryNavigation.map((item) => {
          const Icon = icons[item.icon];
          const selected = item.id === active;
          return (
            <li
              key={item.id}
              className={
                compact
                  ? "vdn-native-bottom-navigation__item"
                  : "vdn-native-adaptive-navigation__item"
              }
            >
              <a
                href="#main"
                aria-current={selected ? "page" : undefined}
                data-active={String(selected)}
                data-native-primary-tab={item.id}
                className={
                  compact
                    ? "vdn-native-bottom-navigation__link"
                    : "vdn-native-adaptive-navigation__link"
                }
              >
                <span
                  className={
                    compact
                      ? "vdn-native-bottom-navigation__indicator"
                      : "vdn-native-adaptive-navigation__indicator"
                  }
                />
                <Icon
                  className={
                    compact
                      ? "vdn-native-bottom-navigation__icon"
                      : "vdn-native-adaptive-navigation__icon"
                  }
                  aria-hidden
                />
                <span
                  className={
                    compact
                      ? "vdn-native-bottom-navigation__label"
                      : "vdn-native-adaptive-navigation__label"
                  }
                >
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HarnessTopBar({ title }: { title: string }) {
  const { resolvedTheme, toggle } = useTheme();
  return (
    <div className="vdn-native-top-bar">
      <div className="vdn-native-top-bar__context">
        <img className="vdn-native-top-bar__brand-icon" src={brand.assets.icon192} alt="" />
        <strong className="vdn-native-top-bar__title">{title}</strong>
      </div>
      <div className="vdn-native-top-bar__actions">
        <button
          className="vdn-native-top-bar__action"
          onClick={toggle}
          aria-label={resolvedTheme === "light" ? "Usar tema escuro" : "Usar tema claro"}
        >
          <Moon aria-hidden />
        </button>
        <button className="vdn-native-top-bar__action" aria-label="Notificações">
          <Bell aria-hidden />
        </button>
        <button className="vdn-native-top-bar__profile" aria-label="Abrir perfil">
          AR
        </button>
      </div>
    </div>
  );
}

function Content({ title }: { title: string }) {
  const [keyboard, setKeyboard] = useState(false);
  return (
    <main id="main" className="harness-content" data-keyboard-fixture={String(keyboard)}>
      <p className="harness-eyebrow">isolated-harness · {route}</p>
      <h1>{title}</h1>
      <p>
        Superfície determinística com componentes, tokens e breakpoints reais. Dados abaixo são
        estados de teste claramente identificados.
      </p>
      <section className="harness-grid">
        <article>
          <h2>Prioridade atual</h2>
          <p>Complete as informações do seu perfil para fortalecer sua apresentação.</p>
          <progress value="68" max="100">
            68%
          </progress>
          <button>Abrir ação</button>
        </article>
        <article>
          <h2>Estado realista</h2>
          <p>Nenhuma atividade nova neste harness. O backend não é afirmado como validado.</p>
          <a href="#form">Ver detalhes</a>
        </article>
        <article>
          <h2>Seu ritmo</h2>
          <p>Progresso demonstrativo de layout, sem persistência.</p>
          <span className="harness-pill">Interface de teste</span>
        </article>
      </section>
      <section id="form" className="harness-form">
        <h2>Contrato de teclado</h2>
        <label>
          Input
          <input onFocus={() => setKeyboard(true)} onBlur={() => setKeyboard(false)} />
        </label>
        <label>
          Textarea
          <textarea onFocus={() => setKeyboard(true)} onBlur={() => setKeyboard(false)} />
        </label>
        <label>
          Select
          <select onFocus={() => setKeyboard(true)} onBlur={() => setKeyboard(false)}>
            <option>Opção segura</option>
          </select>
        </label>
        <div
          tabIndex={0}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => setKeyboard(true)}
          onBlur={() => setKeyboard(false)}
        >
          Campo editável
        </div>
      </section>
      <div className="harness-long">
        {Array.from({ length: 8 }, (_, i) => (
          <p key={i}>
            Linha de rolagem {i + 1}: conteúdo longo permanece acessível e não fica atrás do chrome.
          </p>
        ))}
      </div>
    </main>
  );
}

function NativeHarness() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const title = params.get("title") ?? route.split("/").filter(Boolean).at(-1) ?? "Início";
  return (
    <div
      onFocusCapture={(event) =>
        setKeyboardOpen(
          event.target instanceof HTMLElement &&
            (event.target.matches("input,textarea,select") || event.target.isContentEditable),
        )
      }
      onBlurCapture={() => setKeyboardOpen(false)}
    >
      <NativeShellFrame
        activePrimaryTab={getActiveTab()}
        primaryNavigation={<HarnessNavigation />}
        topBar={<HarnessTopBar title={title} />}
        bottomNavigation={<HarnessNavigation compact />}
        viewportState={{
          width: innerWidth,
          layoutHeight: innerHeight,
          visualHeight: keyboardOpen ? Math.max(320, innerHeight - 300) : innerHeight,
          keyboardHeight: keyboardOpen ? 300 : 0,
          keyboardOpen,
          orientation: innerWidth > innerHeight ? "landscape" : "portrait",
          compact: innerWidth < 768,
        }}
      >
        <Content title={title} />
      </NativeShellFrame>
    </div>
  );
}

function FocusedHarness() {
  return (
    <main data-vdn-native-focused-chat>
      <header className="native-focused-chat__header">
        <button aria-label="Voltar">←</button>
        <div>
          <strong>Conversa segura</strong>
          <small>online</small>
        </div>
        <button aria-label="Abrir conversas">
          <Menu />
        </button>
      </header>
      <section className="native-focused-chat__messages">
        <div className="bubble received">Olá! Como foi seu dia?</div>
        <div className="bubble sent">Foi muito bom. Obrigado por perguntar.</div>
        <div className="bubble received">Que alegria! Vamos conversar.</div>
      </section>
      <form className="native-focused-chat__composer">
        <textarea aria-label="Mensagem" placeholder="Escreva uma mensagem" />
        <button type="button" aria-label="Enviar">
          <Send />
        </button>
      </form>
    </main>
  );
}

function Restricted() {
  return (
    <main className="restricted">
      <h1>Acesso restrito</h1>
      <p>Você não tem permissão para acessar esta área.</p>
      <a href="#">Voltar ao início</a>
    </main>
  );
}

function AdminHarness() {
  const destination = getAdminDestination(route) ?? adminDestinations[0];
  const allowed = destination.allowedRoles.includes(role);
  if (!allowed) return <Restricted />;
  const destinations = getAdminNavigationForRole(role);
  return (
    <AdminShellFrame destination={destination} destinations={destinations} role={role}>
      <main data-vdn-admin-page className="harness-admin">
        <p className="harness-eyebrow">isolated-harness · {role}</p>
        <h1>{destination.title}</h1>
        <div role="tablist" className="harness-tabs">
          {["Pendentes", "Aprovados", "Rejeitados", "Histórico", "Configurações"].map((tab) => (
            <button role="tab" key={tab}>
              {tab}
            </button>
          ))}
        </div>
        <div className="harness-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th>Responsável</th>
                <th>Atualizado</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }, (_, i) => (
                <tr key={i}>
                  <td>Registro {i + 1}</td>
                  <td>Pendente</td>
                  <td>Equipe</td>
                  <td>Hoje</td>
                  <td>
                    <button>Revisar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AdminShellFrame>
  );
}

function App() {
  return surface === "admin" ? (
    <AdminHarness />
  ) : surface === "focused" ? (
    <FocusedHarness />
  ) : (
    <NativeHarness />
  );
}
const rootRoute = createRootRoute({ component: App });
const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>,
);
