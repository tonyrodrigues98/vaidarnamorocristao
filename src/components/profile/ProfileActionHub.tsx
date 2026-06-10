import { type ComponentType, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  IdCard,
  MessageSquareText,
  BookOpen,
  HeartHandshake,
  Settings,
  BadgeCheck,
  Trophy,
  Store,
  ShieldCheck,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";

export type HubSection =
  | "identity"
  | "about"
  | "faith"
  | "preferences";

type CardItem = {
  id: HubSection;
  title: string;
  desc: string;
  Icon: ComponentType<{ className?: string }>;
};

const CARDS: CardItem[] = [
  { id: "identity", title: "Identidade", desc: "Nome, foto, cidade e dados principais.", Icon: IdCard },
  { id: "about", title: "Sobre mim", desc: "Bio, personalidade e interesses.", Icon: MessageSquareText },
  { id: "faith", title: "Fé e caminhada", desc: "Igreja, batismo e rotina cristã.", Icon: BookOpen },
  { id: "preferences", title: "O que procuro", desc: "Preferências e intenção de relacionamento.", Icon: HeartHandshake },
];

export type ProfileActionHubProps = {
  activeTab: string;
  isStaff: boolean;
  onSelect: (id: HubSection) => void;
  onOpenResource: (id: "missions" | "role") => void;
};

export function ProfileActionHub({ activeTab, isStaff, onSelect, onOpenResource }: ProfileActionHubProps) {
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const activeId: HubSection | null =
    activeTab === "prefs"
      ? "preferences"
      : activeTab === "profile"
        ? "about"
        : null;

  return (
    <div className="w-full min-w-0 lg:hidden">
      <div className="mb-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
          Central do perfil
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Organize as áreas do seu perfil.
        </p>
      </div>

      <ul className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {CARDS.map(({ id, title, desc, Icon }) => {
          const active = activeId === id;
          return (
            <li key={id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-label={title}
                className={`app-pressable flex w-full min-w-0 items-center gap-3 rounded-2xl border bg-card/80 p-3 text-left shadow-soft transition active:scale-[0.98] ${
                  active
                    ? "border-[var(--rose)]/60 bg-[var(--rose-soft)]/35"
                    : "border-border/60 hover:border-[var(--rose-soft)]"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active ? "bg-[var(--rose)] text-white" : "bg-[var(--petal)] text-[var(--rose)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{desc}</span>
                </span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <button
          type="button"
          onClick={() => setResourcesOpen((v) => !v)}
          aria-expanded={resourcesOpen}
          className="app-pressable flex w-full min-w-0 items-center gap-3 rounded-2xl p-3 text-left active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--petal)] text-[var(--rose)]">
            <Settings className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              Ajustes e recursos
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Saldo, presentes, cargos e conta.
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
          />
        </button>

        {resourcesOpen && (
          <ul className="space-y-1.5 border-t border-border/60 p-2">
            <ResourceButton
              Icon={Trophy}
              title="Minhas conquistas"
              desc="Missões e badges desbloqueados."
              onClick={() => onOpenResource("missions")}
            />
            {isStaff && (
              <ResourceButton
                Icon={BadgeCheck}
                title="Meu papel na comunidade"
                desc="Seu cargo e visibilidade."
                onClick={() => onOpenResource("role")}
              />
            )}
            <ResourceLink
              Icon={Store}
              title="Loja"
              desc="Comprar novos itens."
              to="/loja"
            />
            <ResourceLink
              Icon={ShieldCheck}
              title="Conta e segurança"
              desc="Privacidade, ajustes e acesso."
              to="/conta"
            />
            {isStaff && (
              <ResourceLink
                Icon={LayoutDashboard}
                title="Painel administrativo"
                desc="Gerencie usuários e conteúdo."
                to="/admin"
              />
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function ResourceButton({
  Icon,
  title,
  desc,
  onClick,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        className="app-pressable flex w-full min-w-0 items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-rose-50/60 active:scale-[0.99] dark:hover:bg-rose-400/10"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-[var(--rose)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">{desc}</span>
        </span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}

function ResourceLink({
  Icon,
  title,
  desc,
  to,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  to: "/conta" | "/admin";
}) {
  return (
    <li className="min-w-0">
      <Link
        to={to}
        className="app-pressable flex w-full min-w-0 items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-rose-50/60 active:scale-[0.99] dark:hover:bg-rose-400/10"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-[var(--rose)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">{desc}</span>
        </span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}