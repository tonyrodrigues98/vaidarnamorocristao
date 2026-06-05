import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  ChevronDown,
  Coins,
  Crown,
  Gift,
  Heart,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  currentUser,
  gifts,
  profiles,
  type Badge,
  type Gift as GiftType,
  type MockProfile,
  type StoreItem,
} from "@/data/mockApp";

export function GradientText({ children }: { children: ReactNode }) {
  return <span className="vdn-gradient-text">{children}</span>;
}

export function BadgePill({ badge }: { badge: Badge }) {
  const tone = {
    rose: "border-neutral-200 bg-neutral-100 text-neutral-700",
    gold: "border-neutral-200 bg-white text-neutral-800",
    emerald: "border-neutral-300 bg-neutral-950 text-white",
    slate: "border-neutral-200 bg-neutral-100 text-neutral-700",
  }[badge.tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {badge.tone === "emerald" ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
      {badge.label}
    </span>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
      <a href="/inicio" className="hover:text-foreground">
        Inicio
      </a>
      {items.map((item) => (
        <span key={item} className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-neutral-300" />
          <span className="text-foreground/75">{item}</span>
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs = [],
}: {
  eyebrow?: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  breadcrumbs?: string[];
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-8 pt-8 sm:px-6 lg:px-8">
      {breadcrumbs.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function PrimaryButton({
  children,
  href,
  onClick,
  icon,
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const className =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-55";

  if (href) {
    return (
      <a href={href} className={className}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  href,
  onClick,
  icon,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  const className =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-50";

  if (href) {
    return (
      <a href={href} className={className}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

export function MockModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-5 backdrop-blur-sm sm:items-center"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Prototipo visual
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-muted-foreground transition hover:bg-neutral-100 hover:text-foreground"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProfileAvatar({
  profile,
  size = "lg",
}: {
  profile: Pick<
    MockProfile,
    "name" | "photos" | "online" | "verified" | "equippedAura" | "equippedFrame"
  >;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };

  return (
    <div className={`relative ${sizes[size]} shrink-0`}>
      <div className="absolute inset-[-10%] rounded-full bg-[radial-gradient(circle,rgba(17,24,39,0.14),rgba(17,24,39,0.04),transparent_70%)] blur-md" />
      <img
        src={profile.photos[0]}
        alt={profile.name}
        className="relative h-full w-full rounded-full border-4 border-white object-cover shadow-[0_16px_36px_rgba(0,0,0,0.14)]"
      />
      <div className="pointer-events-none absolute inset-[-3px] rounded-full border border-neutral-300" />
      {profile.verified ? (
        <span className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-neutral-950 text-white">
          <BadgeCheck className="h-4 w-4" />
        </span>
      ) : null}
      {profile.online ? (
        <span className="absolute left-1 bottom-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
      ) : null}
    </div>
  );
}

export function ProfileCard({ profile }: { profile: MockProfile }) {
  const [interestSent, setInterestSent] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);

  return (
    <GlassCard className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={profile.photos[0]}
          alt={profile.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          {profile.verified ? <BadgePill badge={{ label: "Verificada", tone: "emerald" }} /> : null}
          {profile.status === "committed" ? (
            <BadgePill badge={{ label: "Em Proposito", tone: "gold" }} />
          ) : null}
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold">
                {profile.name}, {profile.age}
              </h3>
              <p className="text-sm text-white/82">
                {profile.city}/{profile.state} - {profile.distance}
              </p>
            </div>
            <span className="rounded-full bg-white/18 px-3 py-1 text-sm font-semibold backdrop-blur">
              {profile.compatibilityPercent}%
            </span>
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm font-medium text-foreground">{profile.church}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{profile.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.faithTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <SecondaryButton
            href={`/pretendentes/${profile.id}`}
            icon={<UserRound className="h-4 w-4" />}
          >
            Ver perfil
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              if (profile.status === "committed") {
                toast.info("Perfil em Proposito Firmado no prototipo.");
                return;
              }
              setInterestSent(true);
              toast.success("Interesse enviado no prototipo.");
            }}
            disabled={interestSent}
            icon={interestSent ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          >
            {interestSent ? "Enviado" : "Interesse"}
          </PrimaryButton>
        </div>
        <button
          onClick={() => setGiftOpen(true)}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
        >
          <Gift className="h-4 w-4" />
          Enviar presente
        </button>
      </div>
      <GiftModal open={giftOpen} onClose={() => setGiftOpen(false)} recipient={profile.name} />
    </GlassCard>
  );
}

export function GiftModal({
  open,
  onClose,
  recipient = "Ana Clara",
}: {
  open: boolean;
  onClose: () => void;
  recipient?: string;
}) {
  const [selected, setSelected] = useState(gifts[0].id);

  return (
    <MockModal open={open} onClose={onClose} title={`Enviar presente para ${recipient}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {gifts.slice(0, 4).map((gift) => (
          <button
            key={gift.id}
            onClick={() => setSelected(gift.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selected === gift.id
                ? "border-neutral-950 bg-neutral-100"
                : "border-neutral-200 bg-white"
            }`}
          >
            <div className="mb-3 h-20 rounded-xl" style={{ background: gift.image }} />
            <p className="font-semibold">{gift.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{gift.price} moedas</p>
          </button>
        ))}
      </div>
      <textarea
        className="mt-4 min-h-24 w-full rounded-2xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-neutral-950"
        placeholder="Mensagem opcional com respeito e proposito..."
      />
      <div className="mt-4 flex justify-end gap-3">
        <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
        <PrimaryButton
          onClick={() => {
            toast.success("Presente enviado visualmente.");
            onClose();
          }}
          icon={<Send className="h-4 w-4" />}
        >
          Enviar
        </PrimaryButton>
      </div>
    </MockModal>
  );
}

export function MockTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative shrink-0 px-3 py-3 text-sm font-semibold transition ${
              active === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {active === tab.id ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-neutral-950" />
            ) : null}
          </button>
        ))}
      </div>
      <div className="pt-5">{current?.content}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  detail?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-900">
          {icon ?? <Sparkles className="h-5 w-5" />}
        </span>
      </div>
    </GlassCard>
  );
}

export function StoreItemCard({ item }: { item: StoreItem }) {
  const [owned, setOwned] = useState(Boolean(item.owned));
  const [equipped, setEquipped] = useState(Boolean(item.equipped));

  return (
    <GlassCard className="overflow-hidden p-4">
      <div
        className="h-36 rounded-2xl border border-black/5"
        style={{ background: item.preview }}
      />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{item.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        </div>
        <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-semibold capitalize text-neutral-700">
          {item.rarity}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-sm font-semibold">
          <Coins className="h-4 w-4 text-neutral-600" />
          {item.price}
        </span>
        <PrimaryButton
          onClick={() => {
            if (!owned) {
              setOwned(true);
              toast.success(`${item.name} comprado no prototipo.`);
              return;
            }
            setEquipped(true);
            toast.success(`${item.name} equipado visualmente.`);
          }}
          icon={equipped ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
        >
          {equipped ? "Equipado" : owned ? "Equipar" : "Comprar"}
        </PrimaryButton>
      </div>
    </GlassCard>
  );
}

export function GiftCard({ gift, onSend }: { gift: GiftType; onSend?: () => void }) {
  return (
    <GlassCard className="p-4">
      <div className="h-32 rounded-2xl border border-black/5" style={{ background: gift.image }} />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{gift.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{gift.note}</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold capitalize">
          {gift.rarity}
        </span>
      </div>
      <button
        onClick={onSend}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        <Gift className="h-4 w-4" />
        Enviar por {gift.price}
      </button>
    </GlassCard>
  );
}

export function ChatMock({
  messages,
  personName,
}: {
  messages: { from: string; text: string; time: string }[];
  personName: string;
}) {
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState(messages);

  function sendMessage() {
    if (!draft.trim()) return;
    setItems((prev) => [...prev, { from: "me", text: draft.trim(), time: "agora" }]);
    setDraft("");
    toast.success("Mensagem enviada no prototipo.");
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-neutral-200 bg-white p-4">
        <p className="font-semibold">{personName}</p>
        <p className="text-sm text-muted-foreground">Conversa com proposito e respeito</p>
      </div>
      <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
        {items.map((message, index) => (
          <div
            key={`${message.time}-${index}`}
            className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                message.from === "me"
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-200 bg-white text-foreground"
              }`}
            >
              <p>{message.text}</p>
              <p
                className={`mt-1 text-[11px] ${message.from === "me" ? "text-white/70" : "text-muted-foreground"}`}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          {personName.split(" ")[0]} esta digitando...
        </p>
      </div>
      <div className="flex gap-2 border-t border-neutral-200 bg-white p-3">
        <button className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700">
          <Sparkles className="h-4 w-4" />
        </button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-950"
          placeholder="Escreva com respeito..."
        />
        <button
          onClick={sendMessage}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-white"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </GlassCard>
  );
}

export function SearchBar({
  placeholder = "Buscar no prototipo...",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm shadow-sm">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        className="min-w-0 flex-1 bg-transparent outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

export function AdminFrame({ children, title }: { children: ReactNode; title: string }) {
  const links = [
    ["/admin", "Visao geral"],
    ["/admin/fundos", "Fundos"],
    ["/admin/molduras", "Molduras"],
    ["/admin/auras", "Auras"],
    ["/admin/presentes", "Presentes"],
    ["/admin/stickers", "Stickers"],
    ["/admin/verificacoes", "Verificacoes"],
    ["/admin/fotos", "Fotos"],
    ["/admin/equipe-live", "Equipe live"],
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-12 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:h-fit">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Admin
        </p>
        <nav className="grid gap-1">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-neutral-100 hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <div>
        <Breadcrumbs items={["Admin", title]} />
        {children}
      </div>
    </div>
  );
}

export function DataTable({ rows }: { rows: Record<string, string>[] }) {
  const keys = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-neutral-100 text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              {keys.map((key) => (
                <th key={key} className="px-4 py-3 font-semibold">
                  {key}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold">Acao</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-neutral-200">
                {keys.map((key) => (
                  <td key={key} className="px-4 py-3 text-foreground/82">
                    {row[key]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <button
                    onClick={() => toast.success("Acao administrativa simulada.")}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold transition hover:bg-neutral-100"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AccountChip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold shadow-sm"
      >
        <img
          src={currentUser.photo}
          alt={currentUser.name}
          className="h-9 w-9 rounded-full object-cover"
        />
        <span className="hidden sm:inline">{currentUser.name.split(" ")[0]}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
          <a
            href="/perfil"
            className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            Ver perfil
          </a>
          <a
            href="/loja"
            className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            Loja e personalizacao
          </a>
          <a
            href="/conta"
            className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            Conta
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderQuickStats() {
  return (
    <div className="hidden items-center gap-2 lg:flex">
      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-semibold text-neutral-800">
        <Coins className="h-4 w-4" />
        {currentUser.coins}
      </span>
      <button className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white">
        <Bell className="h-4 w-4" />
      </button>
    </div>
  );
}

export const primaryNav = [
  { href: "/", label: "Live" },
  { href: "/inicio", label: "Inicio" },
  { href: "/pretendentes", label: "Pretendentes" },
  { href: "/loja", label: "Loja" },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/admin", label: "Admin" },
];

export const megaNavGroups = [
  {
    title: "Publico",
    links: [
      ["/", "Home da live"],
      ["/como-funciona", "Como funciona"],
      ["/sobre", "Sobre"],
      ["/depoimentos", "Depoimentos"],
      ["/blog", "Blog"],
      ["/termos", "Termos"],
    ],
  },
  {
    title: "Comunidade",
    links: [
      ["/inicio", "Dashboard pessoal"],
      ["/pretendentes", "Pretendentes"],
      ["/matches", "Matches"],
      ["/interesses", "Interesses"],
      ["/conversas", "Conversas"],
      ["/oracoes", "Oracoes"],
      ["/devocional", "Devocional"],
      ["/noticias", "Noticias"],
    ],
  },
  {
    title: "Perfil e suporte",
    links: [
      ["/perfil", "Meu perfil"],
      ["/presentes", "Presentes"],
      ["/recados", "Recados anonimos"],
      ["/verificacao", "Verificacao"],
      ["/suporte", "Suporte"],
      ["/manual", "Manual"],
    ],
  },
];

export function PremiumIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-900">
      {children}
    </span>
  );
}

export const actionIcons = {
  shield: <ShieldCheck className="h-5 w-5" />,
  crown: <Crown className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  message: <MessageCircle className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
};

export function MiniProfiles() {
  return (
    <div className="flex -space-x-3">
      {profiles.slice(0, 5).map((profile) => (
        <img
          key={profile.id}
          src={profile.photos[0]}
          alt={profile.name}
          className="h-11 w-11 rounded-full border-2 border-white object-cover"
        />
      ))}
    </div>
  );
}
