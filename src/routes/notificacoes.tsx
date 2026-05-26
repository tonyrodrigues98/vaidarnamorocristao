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
  const { items, unread, loading, markRead, markAllRead, remove } = useNotifications(100);
  const router = useRouter();

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
              {unread > 0 ? `${unread} não lida${unread > 1 ? "s" : ""}` : "Tudo em dia"}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead()}>
              <Check className="mr-1 h-4 w-4" /> Marcar todas
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className={`group flex items-start gap-3 rounded-2xl border p-4 transition ${
                  n.read_at
                    ? "border-border bg-card/40"
                    : "border-[var(--rose)]/30 bg-[var(--petal)]/30"
                }`}
              >
                <button
                  onClick={() => onClick(n)}
                  className="flex flex-1 items-start gap-3 text-left"
                >
                  {(() => {
                    const meta = iconMeta(n.type);
                    return (
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.fg}`}>
                        {meta.icon}
                      </span>
                    );
                  })()}
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
                  onClick={() => remove(n.id)}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
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
