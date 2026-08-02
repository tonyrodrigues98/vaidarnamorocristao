import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { useNotifications, type AppNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { NotificationSkeleton } from "@/components/ui/AppSkeletons";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { OfflineState } from "@/components/ui/OfflineState";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Heart,
  MessageCircle,
  Sparkles,
  Shield,
  BadgeCheck,
  Mail,
  Lightbulb,
  Reply,
  Unlock,
  HeartHandshake,
  Flag,
  Gift,
  BookOpen,
  Newspaper,
  UsersRound,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EnableNotificationsCard } from "@/components/EnableNotificationsCard";
import { NativeNotificationsView } from "@/components/notifications/native/NativeNotificationsView";
import { useNativeShellRuntime } from "@/components/native-shell/NativeShellRuntimeContext";
import { rewriteNotificationLink } from "@/config/notification-links";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — VaiDarNamoro" },
      {
        name: "description",
        content:
          "Sua central de notificações no VaiDarNamoro: novos interesses, mensagens, matches e atualizações da comunidade em um só lugar.",
      },
      { property: "og:title", content: "Notificações — VaiDarNamoro" },
      {
        property: "og:description",
        content: "Acompanhe novos interesses, mensagens e matches da sua jornada no VaiDarNamoro.",
      },
    ],
  }),
  component: NotificacoesPage,
});

const EMOJI_RE =
  /\p{Extended_Pictographic}|\u{1F3FB}|\u{1F3FC}|\u{1F3FD}|\u{1F3FE}|\u{1F3FF}|\u{FE0F}|\u200D/gu;
const stripEmoji = (s: string) => s.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();

function iconMeta(type: string): { icon: React.ReactNode; bg: string; fg: string } {
  switch (type) {
    case "interest":
      return { icon: <Sparkles className="h-4 w-4" />, bg: "bg-amber-100", fg: "text-amber-600" };
    case "match":
      return { icon: <Heart className="h-4 w-4" />, bg: "bg-pink-100", fg: "text-pink-600" };
    case "message":
      return { icon: <MessageCircle className="h-4 w-4" />, bg: "bg-sky-100", fg: "text-sky-600" };
    case "profile_approved":
      return { icon: <Shield className="h-4 w-4" />, bg: "bg-emerald-100", fg: "text-emerald-600" };
    case "profile_verified":
      return {
        icon: <BadgeCheck className="h-4 w-4" />,
        bg: "bg-indigo-100",
        fg: "text-indigo-600",
      };
    case "anonymous_message":
      return { icon: <Mail className="h-4 w-4" />, bg: "bg-violet-100", fg: "text-violet-600" };
    case "anonymous_hint_requested":
    case "anonymous_hint_sent":
      return {
        icon: <Lightbulb className="h-4 w-4" />,
        bg: "bg-yellow-100",
        fg: "text-yellow-700",
      };
    case "anonymous_reply":
      return { icon: <Reply className="h-4 w-4" />, bg: "bg-rose-100", fg: "text-rose-600" };
    case "anonymous_reveal_requested":
      return { icon: <Unlock className="h-4 w-4" />, bg: "bg-amber-100", fg: "text-amber-700" };
    case "anonymous_revealed":
      return {
        icon: <HeartHandshake className="h-4 w-4" />,
        bg: "bg-fuchsia-100",
        fg: "text-fuchsia-600",
      };
    case "anonymous_report":
      return { icon: <Flag className="h-4 w-4" />, bg: "bg-red-100", fg: "text-red-600" };
    case "gift":
    case "gift_received":
      return { icon: <Gift className="h-4 w-4" />, bg: "bg-amber-100", fg: "text-amber-700" };
    case "devotional":
      return { icon: <BookOpen className="h-4 w-4" />, bg: "bg-violet-100", fg: "text-violet-600" };
    case "news":
    case "noticia":
      return { icon: <Newspaper className="h-4 w-4" />, bg: "bg-amber-100", fg: "text-amber-700" };
    case "community":
    case "conversation":
      return { icon: <UsersRound className="h-4 w-4" />, bg: "bg-sky-100", fg: "text-sky-600" };
    case "system":
      return { icon: <Info className="h-4 w-4" />, bg: "bg-slate-100", fg: "text-slate-600" };
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        bg: "bg-[var(--petal)]",
        fg: "text-[var(--rose)]",
      };
  }
}

type DateGroup = "Hoje" | "Ontem" | "Esta semana" | "Anteriores";
const GROUP_ORDER: DateGroup[] = ["Hoje", "Ontem", "Esta semana", "Anteriores"];

function groupNotificationsByDate(list: AppNotification[]): Record<DateGroup, AppNotification[]> {
  const groups: Record<DateGroup, AppNotification[]> = {
    Hoje: [],
    Ontem: [],
    "Esta semana": [],
    Anteriores: [],
  };
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  for (const n of list) {
    const t = new Date(n.created_at).getTime();
    if (isNaN(t)) {
      groups["Anteriores"].push(n);
    } else if (t >= startOfToday) {
      groups["Hoje"].push(n);
    } else if (t >= startOfYesterday) {
      groups["Ontem"].push(n);
    } else if (t >= startOfWeek) {
      groups["Esta semana"].push(n);
    } else {
      groups["Anteriores"].push(n);
    }
  }
  return groups;
}

function NotificacoesPage() {
  const { items, unread, loading, markRead, markAllRead, reload } = useNotifications(100);
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { isOnline } = useNetworkStatus();
  const { active: nativeShellActive } = useNativeShellRuntime();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  const visible = useMemo(() => items.filter((n) => !hidden.has(n.id)), [items, hidden]);
  const visibleUnread = visible.filter((n) => !n.read_at).length;
  const filtered = useMemo(
    () => (filter === "unread" ? visible.filter((n) => !n.read_at) : visible),
    [visible, filter],
  );
  const grouped = useMemo(() => groupNotificationsByDate(filtered), [filtered]);
  void unread;

  const handleMarkAll = async () => {
    if (markingAll || visibleUnread === 0) return;
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para atualizar suas atividades.");
      return;
    }
    setMarkingAll(true);
    try {
      await markAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = (n: AppNotification) => {
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para apagar notificações.");
      return;
    }
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(n.id);
      return next;
    });
    const t = setTimeout(async () => {
      pendingTimers.current.delete(n.id);
      const { error } = await supabase.from("notifications").delete().eq("id", n.id);
      if (error) {
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(n.id);
          return next;
        });
        toast.error("Não foi possível apagar");
        reload();
      }
    }, 5000);
    pendingTimers.current.set(n.id, t);
    toast("Notificação apagada", {
      action: {
        label: "Desfazer",
        onClick: () => {
          const timer = pendingTimers.current.get(n.id);
          if (timer) clearTimeout(timer);
          pendingTimers.current.delete(n.id);
          setHidden((prev) => {
            const next = new Set(prev);
            next.delete(n.id);
            return next;
          });
        },
      },
      duration: 5000,
    });
  };

  const onClick = async (n: AppNotification) => {
    if (!n.read_at && isOnline) await markRead(n.id);
    const target = rewriteNotificationLink(n.link, nativeShellActive);
    if (target) {
      try {
        router.history.push(target);
      } catch {
        window.location.assign(target);
      }
    }
  };

  if (nativeShellActive) {
    return (
      <NativeNotificationsView
        visibleCount={visible.length}
        unreadCount={visibleUnread}
        loading={loading}
        isOnline={isOnline}
        markingAll={markingAll}
        filter={filter}
        groups={GROUP_ORDER.map((label) => ({ label, items: grouped[label] }))}
        onFilterChange={setFilter}
        onMarkAll={() => void handleMarkAll()}
        onOpen={(notification) => void onClick(notification)}
        onDelete={handleDelete}
        onRefresh={reload}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <MobileAppHeader title="Atividades" subtitle="Suas novidades no VaiDarNamoro" />
      <PullToRefresh onRefresh={reload} disabled={!isOnline}>
        <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
          {!isOnline && visible.length > 0 && (
            <StaleDataNotice
              className="mb-4"
              message="Você está offline. Mostrando atividades carregadas anteriormente."
            />
          )}
          {/* Summary panel */}
          <div className="mb-4 rounded-2xl border border-[var(--rose)]/20 bg-gradient-to-br from-[var(--petal)]/60 via-white to-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[var(--rose)] shadow-sm">
                {visibleUnread > 0 ? (
                  <BellRing className="h-5 w-5" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {visibleUnread > 0
                    ? `Você tem ${visibleUnread} novidade${visibleUnread > 1 ? "s" : ""}`
                    : "Tudo em dia"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {visibleUnread > 0
                    ? "Toque para abrir e responder."
                    : "Você já viu tudo por aqui."}
                </p>
              </div>
              {visibleUnread > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAll}
                  disabled={markingAll || !isOnline}
                  className="app-pressable shrink-0"
                >
                  <CheckCheck className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Marcar todas</span>
                  <span className="sm:hidden">Lidas</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filter chips */}
          <div className="mb-4 flex items-center gap-2">
            {[
              { id: "all" as const, label: "Todas", count: visible.length },
              { id: "unread" as const, label: "Não lidas", count: visibleUnread },
            ].map((chip) => {
              const active = filter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilter(chip.id)}
                  className={`app-pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[var(--rose)] bg-[var(--rose)] text-white shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={active}
                >
                  {chip.label}
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          <EnableNotificationsCard />

          {loading ? (
            <NotificationSkeleton rows={6} />
          ) : visible.length === 0 && !isOnline ? (
            <OfflineState actionLabel="Tentar novamente" onAction={() => reload()} />
          ) : visible.length === 0 ? (
            <AppEmptyState
              icon={<BellOff className="h-5 w-5" />}
              title="Nenhuma notificação por enquanto"
              description="Quando alguém interagir com você, suas novidades aparecerão aqui."
              actionLabel="Explorar pretendentes"
              actionTo="/pretendentes"
            />
          ) : filtered.length === 0 ? (
            <AppEmptyState
              icon={<CheckCheck className="h-5 w-5" />}
              title="Tudo em dia"
              description="Você já viu todas as suas novidades."
            />
          ) : (
            <div className="space-y-5">
              {GROUP_ORDER.map((group) => {
                const list = grouped[group];
                if (!list || list.length === 0) return null;
                return (
                  <section key={group}>
                    <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </h2>
                    <ul className="space-y-2">
                      <AnimatePresence initial={false}>
                        {list.map((n) => (
                          <NotificationRow
                            key={n.id}
                            n={n}
                            onOpen={onClick}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/inicio" className="text-sm text-muted-foreground hover:underline">
              Voltar ao início
            </Link>
          </div>
        </main>
      </PullToRefresh>
    </div>
  );
}

function NotificationRow({
  n,
  onOpen,
  onDelete,
}: {
  n: AppNotification;
  onOpen: (n: AppNotification) => void;
  onDelete: (n: AppNotification) => void;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const ACTION_W = 96; // width of the revealed delete action
  const OPEN_X = -ACTION_W;
  const bgOpacity = useTransform(x, [OPEN_X, -20, 0], [1, 0.35, 0]);
  const iconScale = useTransform(x, [OPEN_X, -40, -10], [1, 0.9, 0.6]);
  const meta = iconMeta(n.type);

  const snapTo = (to: number) =>
    controls.start({
      x: to,
      transition: { type: "spring", stiffness: 500, damping: 40, mass: 0.6 },
    });

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const current = x.get();
    // Strong fling left → delete immediately
    if (velocity < -900 || current < -ACTION_W * 1.6) {
      onDelete(n);
      return;
    }
    // Past threshold (or moderate left velocity) → snap open
    if (current < -ACTION_W / 2 || velocity < -350) {
      snapTo(OPEN_X);
    } else {
      snapTo(0);
    }
  };

  const handleActionDelete = () => {
    onDelete(n);
  };

  const handleOpenItem = () => {
    // If revealed, tapping the row should close it instead of opening
    if (x.get() < -8) {
      snapTo(0);
      return;
    }
    onOpen(n);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -400, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Swipe action background (red gradient that follows the swipe) */}
      <motion.div
        aria-hidden
        style={{ opacity: bgOpacity }}
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-l from-red-500 to-red-500/70"
      />
      {/* Tappable delete action revealed by the swipe */}
      <button
        type="button"
        onClick={handleActionDelete}
        aria-label="Apagar notificação"
        style={{ width: ACTION_W }}
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-2xl text-white"
      >
        <motion.span style={{ scale: iconScale }} className="flex flex-col items-center gap-1">
          <Trash2 className="h-5 w-5" />
          <span className="text-xs font-medium">Apagar</span>
        </motion.span>
      </button>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_W * 1.8, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        animate={controls}
        style={{ x }}
        className={`app-card-interactive group relative flex items-start gap-3 rounded-2xl border p-3.5 backdrop-blur-sm transition-colors ${
          n.read_at ? "border-border bg-card/80" : "border-[var(--rose)]/30 bg-[var(--petal)]/40"
        }`}
      >
        <button onClick={handleOpenItem} className="flex flex-1 items-start gap-3 text-left">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.fg}`}
          >
            {meta.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-medium">{stripEmoji(n.title)}</span>
            {n.body && (
              <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                {stripEmoji(n.body)}
              </span>
            )}
            {n.image_url && (
              <img
                src={n.image_url}
                alt="Imagem anexada à notificação"
                loading="lazy"
                className="mt-2 h-24 w-24 rounded-lg border object-cover"
              />
            )}
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(n.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </span>
        </button>
        <button
          onClick={() => onDelete(n)}
          className="hidden rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-red-50 hover:text-red-500 hover:shadow-[0_0_12px_-2px_rgba(239,68,68,0.45)] group-hover:opacity-100 sm:inline-flex"
          aria-label="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.li>
  );
}
