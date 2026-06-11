import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { RequireApproved } from "@/components/RequireApproved";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Heart,
  Eye,
  Flag,
  EyeOff,
  Unlock,
  MessageCircle,
  Send,
  Lightbulb,
  Reply,
  HeartHandshake,
  Clock,
  Wand2,
  RefreshCw,
  Settings2,
  Inbox,
  ChevronDown,
  ShieldCheck,
  Info,
  Archive,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";
import { RevealCeremony, type RevealTarget } from "@/components/anonymous/RevealCeremony";
import { AnimatePresence, motion } from "framer-motion";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { UserCircle2 } from "lucide-react";
import {
  fetchSenderProfile,
  buildHintPool,
  pickThree,
  type GeneratedHint,
} from "@/lib/anonymousHints";
import { AnonymousExtrasCard } from "@/components/anonymous/AnonymousExtrasCard";
import { CommitmentPauseCard } from "@/components/commitment/CommitmentPauseCard";
import { getActiveCommitmentByUser, type RelationshipCommitment } from "@/lib/commitments";

export const Route = createFileRoute("/recados")({
  component: () => (
    <RequireApproved>
      <RecadosPage />
    </RequireApproved>
  ),
  head: () => ({ meta: [{ title: "Recados Anônimos · VaiDarNamoro" }] }),
});

type InboxRow = {
  id: string;
  sender_id: string | null;
  content: string;
  status: string;
  reply_text: string | null;
  sender_reveal_requested_at: string | null;
  receiver_reveal_requested_at: string | null;
  revealed_at: string | null;
  match_id: string | null;
  created_at: string;
  expires_at: string;
};
type OutboxRow = {
  id: string;
  receiver_id_revealed: string | null;
  content: string;
  status: string;
  reply_text: string | null;
  sender_reveal_requested_at: string | null;
  receiver_reveal_requested_at: string | null;
  revealed_at: string | null;
  match_id: string | null;
  created_at: string;
};
type Hint = {
  id: string;
  message_id: string;
  category: string | null;
  hint_text: string | null;
  sent_at: string | null;
  requested_at: string;
};

const STATUS_MAP: Record<string, { icon: React.ReactNode; label: string; tone: "neutral" | "accent" | "success" | "muted" }> = {
  pending: { icon: <Send className="h-3 w-3" />, label: "Aguardando", tone: "neutral" },
  hint_requested: { icon: <Eye className="h-3 w-3" />, label: "Dica solicitada", tone: "neutral" },
  hint_sent: { icon: <Lightbulb className="h-3 w-3" />, label: "Dica enviada", tone: "accent" },
  replied: { icon: <Reply className="h-3 w-3" />, label: "Respondido", tone: "accent" },
  reveal_requested: { icon: <Unlock className="h-3 w-3" />, label: "Revelação pedida", tone: "accent" },
  revealed: { icon: <HeartHandshake className="h-3 w-3" />, label: "Revelado", tone: "success" },
  expired: { icon: <Clock className="h-3 w-3" />, label: "Expirado", tone: "muted" },
};

function StatusPill({ status }: { status: string }) {
  const it = STATUS_MAP[status] ?? { icon: <Sparkles className="h-3 w-3" />, label: status, tone: "neutral" as const };
  const toneClass =
    it.tone === "success"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20"
      : it.tone === "accent"
      ? "bg-foreground/[0.06] text-foreground ring-foreground/10"
      : it.tone === "muted"
      ? "bg-muted/60 text-muted-foreground ring-border/40"
      : "bg-foreground/[0.04] text-foreground/70 ring-foreground/10";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${toneClass}`}>
      {it.icon}
      {it.label}
    </span>
  );
}

function RecadosPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"inbox" | "outbox" | "hidden">("inbox");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [hidden, setHidden] = useState<InboxRow[]>([]);
  const [hints, setHints] = useState<Record<string, Hint[]>>({});
  const [accept, setAccept] = useState(true);
  const [reveal, setReveal] = useState<RevealTarget | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [activeCommitment, setActiveCommitment] = useState<RelationshipCommitment | null>(null);
  const seenRevealed = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    const commitment = await getActiveCommitmentByUser(user.id);
    setActiveCommitment(commitment);
    if (commitment) {
      setInbox([]);
      setOutbox([]);
      setHidden([]);
      setHints({});
      setLoadingList(false);
      return;
    }
    await supabase.rpc("expire_anonymous_messages");
    const [{ data: inb }, { data: out }, { data: hid }, { data: settings }] = await Promise.all([
      supabase
        .from("anonymous_messages_inbox")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("anonymous_messages_outbox")
        .select("*")
        .order("created_at", { ascending: false }),
      // Ignored ("hidden") messages: query the base table directly. RLS
      // already restricts to receiver_id = auth.uid(); we mask sender_id
      // client-side so the receiver still can't see who sent it.
      supabase
        .from("anonymous_messages")
        .select(
          "id, sender_id, content, status, reply_text, sender_reveal_requested_at, receiver_reveal_requested_at, revealed_at, match_id, created_at, expires_at",
        )
        .eq("receiver_id", user.id)
        .eq("status", "ignored")
        .order("created_at", { ascending: false }),
      supabase
        .from("anonymous_message_settings")
        .select("accept_anonymous")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setInbox((inb ?? []) as InboxRow[]);
    setOutbox((out ?? []) as OutboxRow[]);
    setHidden(
      ((hid ?? []) as any[]).map((r) => ({
        ...r,
        // Never expose sender of a hidden/anonymous message.
        sender_id: null,
      })) as InboxRow[],
    );
    setAccept(settings?.accept_anonymous ?? true);

    const allRevealed = [
      ...((inb ?? []) as InboxRow[]).map((r: any) => ({ row: r, side: "inbox" as const })),
      ...((out ?? []) as OutboxRow[]).map((r: any) => ({ row: r, side: "outbox" as const })),
    ].filter(({ row }) => row.status === "revealed" && row.match_id);
    if (!initializedRef.current) {
      allRevealed.forEach(({ row }) => seenRevealed.current.add(row.id));
      initializedRef.current = true;
    } else {
      const fresh = allRevealed.find(({ row }) => !seenRevealed.current.has(row.id));
      if (fresh) {
        const otherUserId =
          fresh.side === "inbox"
            ? (fresh.row as any).sender_id
            : (fresh.row as any).receiver_id_revealed;
        if (otherUserId) {
          setReveal({
            messageId: fresh.row.id,
            matchId: fresh.row.match_id,
            otherUserId,
          });
        }
        allRevealed.forEach(({ row }) => seenRevealed.current.add(row.id));
      }
    }

    const allIds = [...(inb ?? []), ...(out ?? [])].map((r: any) => r.id);
    if (allIds.length) {
      const { data: h } = await supabase
        .from("anonymous_message_hints")
        .select("*")
        .in("message_id", allIds);
      const grouped: Record<string, Hint[]> = {};
      (h ?? []).forEach((row: any) => {
        (grouped[row.message_id] ||= []).push(row);
      });
      setHints(grouped);
    } else setHints({});
    setLoadingList(false);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`recados-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "anonymous_messages" }, load)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "anonymous_message_hints" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "relationship_commitments" },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  const toggleOptout = async (checked: boolean) => {
    setAccept(checked);
    const { error } = await supabase.rpc("set_anonymous_optout", { _accept: checked });
    if (error) toast.error(friendlyError(error));
  };

  // Stats derivadas (dados reais)
  const stats = useMemo(() => {
    const revealedCount =
      inbox.filter((m) => m.status === "revealed").length +
      outbox.filter((m) => m.status === "revealed").length;
    const repliedCount = inbox.filter((m) => !!m.reply_text).length;
    const pendingInbox = inbox.filter((m) => ["pending", "hint_sent", "hint_requested"].includes(m.status)).length;
    return { revealedCount, repliedCount, pendingInbox };
  }, [inbox, outbox]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <RevealCeremony target={reveal} onClose={() => setReveal(null)} />

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        {/* Apple-style large title */}
        <div className="flex items-start justify-between pt-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Privacidade primeiro
            </p>
            <h1 className="mt-1 text-[34px] font-semibold leading-[1.05] tracking-tight text-foreground">
              Recados
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <IconButton
              ariaLabel="Como funciona"
              onClick={() => setInfoOpen((v) => !v)}
              active={infoOpen}
            >
              <Info className="h-[17px] w-[17px]" />
            </IconButton>
            <IconButton ariaLabel="Configurações" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-[17px] w-[17px]" />
            </IconButton>
          </div>
        </div>

        {/* Info card (toggle) */}
        <AnimatePresence initial={false}>
          {infoOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground/[0.05] text-foreground/70">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold tracking-tight">
                      Como funcionam os recados
                    </h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      Mensagens 100% anônimas. Você pode pedir até <span className="font-medium text-foreground/80">2 dicas</span> e
                      responder sem revelar. A identidade só aparece se <span className="font-medium text-foreground/80">ambos aceitarem</span>.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        {!activeCommitment && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatTile label="Recebidos" value={inbox.length} />
            <StatTile label="Respondidos" value={stats.repliedCount} />
            <StatTile label="Revelados" value={stats.revealedCount} accent />
          </div>
        )}

        {activeCommitment ? (
          <CommitmentPauseCard
            matchId={activeCommitment.match_id}
            className="mt-8 animate-fade-up"
            description="Você está em um propósito ativo. Por isso, recados anônimos recebidos e enviados ficam arquivados até esse compromisso ser interrompido."
          />
        ) : loadingList ? (
          <div className="mt-6 space-y-3">
            <div className="h-28 animate-pulse rounded-3xl border border-border/50 bg-card/40" />
            <div className="h-28 animate-pulse rounded-3xl border border-border/50 bg-card/40" />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <SegmentedControl
                value={tab}
                onChange={setTab}
                segments={[
                  { value: "inbox", label: "Recebidos", count: inbox.length },
                  { value: "outbox", label: "Enviados", count: outbox.length },
                  { value: "hidden", label: "Ocultos", count: hidden.length },
                ]}
              />
            </div>

            <div className="mt-4 space-y-3">
              {tab === "hidden" ? (
                hidden.length === 0 ? (
                  <EmptyState
                    icon={<Archive className="h-6 w-6" />}
                    title="Nenhum recado oculto"
                    subtitle="Recados que você ocultar aparecem aqui. Você pode desocultar a qualquer momento."
                  />
                ) : (
                  hidden.map((m) => (
                    <HiddenCard key={m.id} m={m} onChange={load} />
                  ))
                )
              ) : tab === "inbox" ? (
                inbox.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="h-6 w-6" />}
                    title="Sua caixa está em silêncio"
                    subtitle="Quando alguém te enviar um recado anônimo, ele aparece aqui."
                  />
                ) : (
                  inbox.map((m) => (
                    <InboxCard key={m.id} m={m} hints={hints[m.id] ?? []} onChange={load} />
                  ))
                )
              ) : outbox.length === 0 ? (
                <EmptyState
                  icon={<Send className="h-6 w-6" />}
                  title="Nada enviado ainda"
                  subtitle="Encontre alguém em Pretendentes e envie um recado anônimo."
                />
              ) : (
                outbox.map((m) => (
                  <OutboxCard key={m.id} m={m} hints={hints[m.id] ?? []} onChange={load} />
                ))
              )}
            </div>
          </>
        )}

        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-[28px] border-t border-border/50 bg-background/90 backdrop-blur-2xl"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="text-[20px] font-semibold tracking-tight">
                Configurações
              </SheetTitle>
              <SheetDescription className="text-[13px]">
                Controle como você recebe recados anônimos.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <label className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium">Aceitar recados anônimos</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      Quando desativado, ninguém poderá te enviar recados.
                    </div>
                  </div>
                  <Switch checked={accept} onCheckedChange={toggleOptout} />
                </label>
              </div>
              <AnonymousExtrasCard />
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  ariaLabel,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={[
        "grid h-10 w-10 place-items-center rounded-full border transition active:scale-95",
        active
          ? "border-foreground/20 bg-foreground/[0.08] text-foreground"
          : "border-border/60 bg-card/60 text-foreground/70 hover:bg-card/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 px-3 py-3 backdrop-blur-md">
      <div
        className={[
          "text-[22px] font-semibold leading-none tracking-tight tabular-nums",
          accent ? "text-foreground" : "text-foreground/85",
        ].join(" ")}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
}: {
  value: T;
  onChange: (v: T) => void;
  segments: { value: T; label: string; count?: number }[];
}) {
  return (
    <div
      role="tablist"
      className="relative grid w-full gap-1 rounded-2xl border border-border/60 bg-foreground/[0.04] p-1"
      style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={[
              "relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(0,0,0,0.10)]"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {s.label}
            {typeof s.count === "number" && s.count > 0 && (
              <span
                className={[
                  "min-w-[20px] rounded-full px-1.5 text-[11px] font-semibold leading-[18px] tabular-nums",
                  active
                    ? "bg-foreground/[0.08] text-foreground"
                    : "bg-foreground/[0.06] text-foreground/60",
                ].join(" ")}
              >
                {s.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-foreground/[0.05] text-foreground/60">
        {icon}
      </div>
      <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_28px_-16px_rgba(0,0,0,0.16)]"
    >
      {children}
    </motion.div>
  );
}

function HiddenCard({ m, onChange }: { m: InboxRow; onChange: () => void }) {
  const online = useNetworkStatus();
  const [busy, setBusy] = useState(false);

  async function action(fn: () => PromiseLike<any>) {
    if (!online) {
      toast.error("Você está offline.");
      return;
    }
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Recado restaurado nos recebidos");
    onChange();
  }

  const date = new Date(m.created_at);
  const dateLabel = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <CardShell>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground/[0.05] text-foreground/55">
          <Archive className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground/70">Recado oculto</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">· {dateLabel}</span>
          </div>
          <p className="mt-2 line-clamp-3 rounded-2xl bg-foreground/[0.04] px-3 py-2 text-[14px] leading-relaxed text-foreground/85">
            {m.content}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Você ocultou este recado. O remetente continua anônimo e não é notificado.
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !online}
          onClick={() =>
            action(() => supabase.rpc("unignore_anonymous_message", { _message_id: m.id }))
          }
          className="h-9 gap-1.5 rounded-full px-3.5 text-[13px]"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Desocultar
        </Button>
      </div>
    </CardShell>
  );
}

function InboxCard({ m, hints, onChange }: { m: InboxRow; hints: Hint[]; onChange: () => void }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const { isOnline } = useNetworkStatus();

  const hasPending = hints.some((h) => !h.sent_at);
  const canReply = (m.status === "pending" || m.status === "hint_sent") && !hasPending;
  const canHint =
    (m.status === "pending" || m.status === "hint_sent") && hints.length < 2 && !hasPending;
  const canReveal = ["replied", "reveal_requested", "hint_sent"].includes(m.status);
  const myRevealed = !!m.receiver_reveal_requested_at;
  const isRevealed = m.status === "revealed";
  const sentHints = hints.filter((h) => h.sent_at);

  const action = async (fn: () => PromiseLike<any>) => {
    if (!isOnline) {
      toast.error("Sem conexão. Volte online para continuar.");
      return;
    }
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) toast.error(friendlyError(error));
    else onChange();
  };

  return (
    <CardShell>
      {/* Sender header */}
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0">
          <AnimatePresence mode="wait">
            {isRevealed ? (
              <motion.div
                key="revealed-avatar"
                initial={{ opacity: 0, filter: "blur(8px)", scale: 0.9 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300"
              >
                <HeartHandshake className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="masked-avatar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-foreground/[0.06] ring-1 ring-inset ring-border/60"
                aria-hidden
              >
                <UserCircle2 className="h-7 w-7 text-foreground/30 blur-[2.5px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold tracking-tight text-foreground">
            {isRevealed ? "Identidade revelada" : "Remetente anônimo"}
          </div>
          <div className="text-[11.5px] text-muted-foreground">
            {isRevealed
              ? "Vocês concordaram em se revelar"
              : `Expira em ${new Date(m.expires_at).toLocaleDateString("pt-BR")}`}
          </div>
        </div>
        <StatusPill status={m.status} />
      </div>

      {/* Message bubble — iMessage-like, neutral */}
      <div className="mt-3 mr-auto max-w-[94%] rounded-2xl rounded-tl-md bg-foreground/[0.04] px-4 py-3 ring-1 ring-inset ring-border/40">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {m.content}
        </p>
      </div>

      {sentHints.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Pistas
            <ChevronDown
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {sentHints.map((h, i) => (
                    <motion.span
                      key={h.id}
                      initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[12px] text-foreground/85"
                    >
                      <Sparkles className="h-3 w-3 shrink-0 text-foreground/60" />
                      <span className="truncate">{h.hint_text}</span>
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {hasPending && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-foreground/[0.04] px-3 py-2 text-[12px] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/30" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground/50" />
          </span>
          Aguardando o remetente escolher uma dica…
        </div>
      )}
      {m.reply_text && (
        <div className="mt-2 ml-auto max-w-[94%] rounded-2xl rounded-tr-md bg-foreground px-4 py-3 text-[14px] text-background">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-background/60">
            Você respondeu
          </span>
          <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">{m.reply_text}</p>
        </div>
      )}

      {m.status === "revealed" && m.match_id ? (
        <Button
          asChild
          size="sm"
          className="mt-3 h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          <Link to="/conversas/$matchId" params={{ matchId: m.match_id }}>
            <MessageCircle className="mr-2 h-4 w-4" /> Abrir conversa
          </Link>
        </Button>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {canReply && (
            <Button
              size="sm"
              className="h-9 rounded-full bg-foreground px-4 text-background hover:bg-foreground/90"
              disabled={!isOnline}
              onClick={() => {
                if (!isOnline) {
                  toast.error("Sem conexão. Volte online para responder.");
                  return;
                }
                setReplyOpen(true);
              }}
            >
              <Heart className="mr-1.5 h-3.5 w-3.5" /> Responder
            </Button>
          )}
          {canHint && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-full border-border/60 bg-background/60 px-3"
              disabled={busy || !isOnline}
              onClick={() =>
                action(() => supabase.rpc("request_anonymous_hint", { _message_id: m.id }))
              }
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Dica ({hints.length}/2)
            </Button>
          )}
          {canReveal && !myRevealed && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-full border-border/60 bg-background/60 px-3"
              disabled={busy || !isOnline}
              onClick={() =>
                action(() => supabase.rpc("request_anonymous_reveal", { _message_id: m.id }))
              }
            >
              <Unlock className="mr-1.5 h-3.5 w-3.5" /> Revelar
            </Button>
          )}
          {myRevealed && m.status !== "revealed" && (
            <span className="px-2 py-2 text-[12px] text-muted-foreground">
              Aguardando o outro lado aceitar revelar…
            </span>
          )}
          <div className="ml-auto flex gap-1">
            <button
              type="button"
              disabled={busy || !isOnline}
              aria-label="Ignorar"
              onClick={() =>
                action(() => supabase.rpc("ignore_anonymous_message", { _message_id: m.id }))
              }
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground active:scale-95 disabled:opacity-50"
            >
              <EyeOff className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Denunciar"
              disabled={!isOnline}
              onClick={() => {
                if (!isOnline) {
                  toast.error("Sem conexão. Denúncias precisam estar online.");
                  return;
                }
                setReportOpen(true);
              }}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive active:scale-95 disabled:opacity-50"
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="tracking-tight">Responder anonimamente</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            maxLength={280}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Sua resposta..."
            className="rounded-2xl"
          />
          <div className="text-right text-[11px] tabular-nums text-muted-foreground">
            {reply.length}/280
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setReplyOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
              disabled={busy || !reply.trim()}
              onClick={async () => {
                setBusy(true);
                const { error } = await supabase.rpc("reply_anonymous_message", {
                  _message_id: m.id,
                  _reply: reply.trim(),
                });
                setBusy(false);
                if (error) toast.error(friendlyError(error));
                else {
                  toast.success("Resposta enviada");
                  setReplyOpen(false);
                  setReply("");
                  onChange();
                }
              }}
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="tracking-tight">Denunciar recado</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            maxLength={500}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Descreva o motivo..."
            className="rounded-2xl"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setReportOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={busy || !reportReason.trim()}
              onClick={async () => {
                setBusy(true);
                const { error } = await supabase.rpc("report_anonymous_message", {
                  _message_id: m.id,
                  _reason: reportReason.trim(),
                });
                setBusy(false);
                if (error) toast.error(friendlyError(error));
                else {
                  toast.success("Denúncia enviada");
                  setReportOpen(false);
                  setReportReason("");
                  onChange();
                }
              }}
            >
              Enviar denúncia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardShell>
  );
}

function OutboxCard({ m, hints, onChange }: { m: OutboxRow; hints: Hint[]; onChange: () => void }) {
  const { user } = useAuth();
  const [hintOpen, setHintOpen] = useState(false);
  const [selected, setSelected] = useState<GeneratedHint | null>(null);
  const [pool, setPool] = useState<GeneratedHint[]>([]);
  const [shown, setShown] = useState<GeneratedHint[]>([]);
  const [usedTexts, setUsedTexts] = useState<Set<string>>(new Set());
  const [loadingPool, setLoadingPool] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingHint = hints.find((h) => !h.sent_at);
  const canReveal = ["replied", "reveal_requested", "hint_sent"].includes(m.status);
  const myRevealed = !!m.sender_reveal_requested_at;

  async function openHintDialog() {
    setSelected(null);
    setUsedTexts(new Set());
    setHintOpen(true);
    if (pool.length === 0 && user) {
      setLoadingPool(true);
      const profile = await fetchSenderProfile(user.id);
      const built = profile ? buildHintPool(profile) : [];
      setPool(built);
      const first = pickThree(built, new Set());
      setShown(first);
      setUsedTexts(new Set(first.map((h) => h.text)));
      setLoadingPool(false);
    } else {
      const first = pickThree(pool, new Set());
      setShown(first);
      setUsedTexts(new Set(first.map((h) => h.text)));
    }
  }

  function regenerate() {
    const next = pickThree(pool, usedTexts);
    setShown(next);
    setSelected(null);
    const merged = new Set(usedTexts);
    next.forEach((h) => merged.add(h.text));
    if (merged.size >= pool.length) setUsedTexts(new Set(next.map((h) => h.text)));
    else setUsedTexts(merged);
  }

  return (
    <CardShell>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground/[0.05] text-foreground/60">
            <Send className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight">Enviado</div>
            <div className="text-[11.5px] text-muted-foreground">
              {new Date(m.created_at).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>
        <StatusPill status={m.status} />
      </div>

      {/* Outgoing message — dark bubble like iMessage outgoing */}
      <div className="mt-3 ml-auto max-w-[94%] rounded-2xl rounded-tr-md bg-foreground px-4 py-3 text-background">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
      </div>

      {hints
        .filter((h) => h.sent_at)
        .map((h) => (
          <div
            key={h.id}
            className="mt-2 ml-auto max-w-[94%] rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-[12px] text-muted-foreground"
          >
            <span className="font-medium text-foreground/70">Dica enviada · </span>
            <span className="text-foreground/85">{h.hint_text}</span>
          </div>
        ))}

      {m.reply_text && (
        <div className="mt-2 mr-auto max-w-[94%] rounded-2xl rounded-tl-md bg-foreground/[0.04] px-4 py-3 text-[14px] ring-1 ring-inset ring-border/40">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
            Resposta
          </span>
          <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-foreground/90">
            {m.reply_text}
          </p>
        </div>
      )}

      {m.status === "revealed" && m.match_id ? (
        <Button
          asChild
          size="sm"
          className="mt-3 h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          <Link to="/conversas/$matchId" params={{ matchId: m.match_id }}>
            <MessageCircle className="mr-2 h-4 w-4" /> Abrir conversa
          </Link>
        </Button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pendingHint && (
            <Button
              size="sm"
              className="h-9 rounded-full bg-foreground px-4 text-background hover:bg-foreground/90"
              onClick={openHintDialog}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Enviar dica
            </Button>
          )}
          {canReveal && !myRevealed && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-full border-border/60 bg-background/60 px-3"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const { error } = await supabase.rpc("request_anonymous_reveal", {
                  _message_id: m.id,
                });
                setBusy(false);
                if (error) toast.error(friendlyError(error));
                else onChange();
              }}
            >
              <Unlock className="mr-1.5 h-3.5 w-3.5" /> Revelar
            </Button>
          )}
          {myRevealed && m.status !== "revealed" && (
            <span className="px-2 py-2 text-[12px] text-muted-foreground">
              Aguardando o outro lado aceitar revelar…
            </span>
          )}
        </div>
      )}

      <Dialog open={hintOpen} onOpenChange={setHintOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Wand2 className="h-4 w-4 text-foreground/70" /> Escolha uma dica
            </DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-muted-foreground">
            Sugestões geradas com base no seu perfil — sempre amplas, mantendo o mistério.
          </p>

          <div className="min-h-[140px] py-2">
            {loadingPool ? (
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 w-40 animate-pulse rounded-full bg-foreground/[0.06]" />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Preencha mais detalhes no seu perfil para receber dicas personalizadas.
              </p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={shown.map((h) => h.text).join("|")}
                  initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-wrap gap-2"
                >
                  {shown.map((h) => {
                    const isSel = selected?.text === h.text;
                    return (
                      <motion.button
                        key={h.text}
                        type="button"
                        onClick={() => setSelected(h)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className={[
                          "rounded-full border px-4 py-2 text-[13px] transition-all",
                          isSel
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/60 bg-background/60 text-foreground/85 hover:border-foreground/40",
                        ].join(" ")}
                      >
                        {h.text}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loadingPool || pool.length === 0}
              onClick={regenerate}
              className="rounded-full text-[12px] text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Gerar novas sugestões
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setHintOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
              disabled={busy || !selected}
              onClick={async () => {
                if (!selected) return;
                setBusy(true);
                const { error } = await supabase.rpc("send_anonymous_hint_text", {
                  _message_id: m.id,
                  _category: selected.category,
                  _text: selected.text,
                });
                setBusy(false);
                if (error) toast.error(friendlyError(error));
                else {
                  toast.success("Dica enviada");
                  setHintOpen(false);
                  setSelected(null);
                  onChange();
                }
              }}
            >
              Enviar dica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardShell>
  );
}
