import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { useNotifications, type AppNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — VaiDarNamoro" },
      { name: "description", content: "Sua central de notificações." },
    ],
  }),
  component: NotificacoesPage,
});

const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u200D]/gu;
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
      return { icon: <BadgeCheck className="h-4 w-4" />, bg: "bg-indigo-100", fg: "text-indigo-600" };
    case "anonymous_message":
      return { icon: <Mail className="h-4 w-4" />, bg: "bg-violet-100", fg: "text-violet-600" };
    case "anonymous_hint_requested":
    case "anonymous_hint_sent":
      return { icon: <Lightbulb className="h-4 w-4" />, bg: "bg-yellow-100", fg: "text-yellow-700" };
    case "anonymous_reply":
      return { icon: <Reply className="h-4 w-4" />, bg: "bg-rose-100", fg: "text-rose-600" };
    case "anonymous_reveal_requested":
      return { icon: <Unlock className="h-4 w-4" />, bg: "bg-amber-100", fg: "text-amber-700" };
    case "anonymous_revealed":
      return { icon: <HeartHandshake className="h-4 w-4" />, bg: "bg-fuchsia-100", fg: "text-fuchsia-600" };
    case "anonymous_report":
      return { icon: <Flag className="h-4 w-4" />, bg: "bg-red-100", fg: "text-red-600" };
    default:
      return { icon: <Bell className="h-4 w-4" />, bg: "bg-[var(--petal)]", fg: "text-[var(--rose)]" };
  }
}

function NotificacoesPage() {
  const { items, unread, loading, markRead, markAllRead, reload } = useNotifications(100);
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const visible = useMemo(() => items.filter((n) => !hidden.has(n.id)), [items, hidden]);
  const visibleUnread = visible.filter((n) => !n.read_at).length;

  const handleDelete = (n: AppNotification) => {
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
    if (!n.read_at) await markRead(n.id);
    if (n.link) {
      try {
        router.history.push(n.link);
      } catch {
        window.location.assign(n.link);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {visibleUnread > 0 ? `${visibleUnread} não lida${visibleUnread > 1 ? "s" : ""}` : "Tudo em dia"}
            </p>
          </div>
          {visibleUnread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead()}>
              <Check className="mr-1 h-4 w-4" /> Marcar todas
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : visible.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {visible.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onOpen={onClick}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}

        <div className="mt-6 text-center">
          <Link to="/inicio" className="text-sm text-muted-foreground hover:underline">
            Voltar ao início
          </Link>
        </div>
      </main>
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
  const bgOpacity = useTransform(x, [-160, -40, 0], [1, 0.35, 0]);
  const iconScale = useTransform(x, [-160, -60, -20], [1.15, 1, 0.6]);
  const meta = iconMeta(n.type);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -140 || velocity < -600) {
      onDelete(n);
    }
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
      {/* Swipe action background */}
      <motion.div
        aria-hidden
        style={{ opacity: bgOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-gradient-to-l from-red-500 to-red-500/70 pr-6"
      >
        <motion.div style={{ scale: iconScale }} className="flex items-center gap-2 text-white">
          <Trash2 className="h-5 w-5" />
          <span className="text-sm font-medium">Apagar</span>
        </motion.div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        style={{ x }}
        className={`group relative flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-sm transition-colors ${
          n.read_at
            ? "border-border bg-card/80"
            : "border-[var(--rose)]/30 bg-[var(--petal)]/40"
        }`}
      >
        <button
          onClick={() => onOpen(n)}
          className="flex flex-1 items-start gap-3 text-left"
        >
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
                alt=""
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
