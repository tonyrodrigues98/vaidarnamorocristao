import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
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
  Mail,
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string }> = {
    pending: { icon: <Send className="h-3 w-3" />, label: "Aguardando" },
    hint_requested: { icon: <Eye className="h-3 w-3" />, label: "Dica solicitada" },
    hint_sent: { icon: <Lightbulb className="h-3 w-3" />, label: "Dica enviada" },
    replied: { icon: <Reply className="h-3 w-3" />, label: "Respondido" },
    reveal_requested: { icon: <Unlock className="h-3 w-3" />, label: "Revelação pedida" },
    revealed: { icon: <HeartHandshake className="h-3 w-3" />, label: "Revelado" },
    expired: { icon: <Clock className="h-3 w-3" />, label: "Expirado" },
  };
  const it = map[status] ?? { icon: <Sparkles className="h-3 w-3" />, label: status };
  return (
    <span className="inline-flex items-center gap-1">
      {it.icon} {it.label}
    </span>
  );
}

function RecadosPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"inbox" | "outbox">("inbox");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
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
      setHints({});
      setLoadingList(false);
      return;
    }
    await supabase.rpc("expire_anonymous_messages");
    const [{ data: inb }, { data: out }, { data: settings }] = await Promise.all([
      supabase
        .from("anonymous_messages_inbox")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("anonymous_messages_outbox")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("anonymous_message_settings")
        .select("accept_anonymous")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setInbox((inb ?? []) as InboxRow[]);
    setOutbox((out ?? []) as OutboxRow[]);
    setAccept(settings?.accept_anonymous ?? true);

    // Detect newly revealed messages (skip the first load to avoid retriggering on refresh)
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

  return (
    <div className="min-h-screen">
      <Header />
      <RevealCeremony target={reveal} onClose={() => setReveal(null)} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        {/* Large iOS-style title */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-[34px] font-bold leading-tight tracking-tight">Recados</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Mistério leve. Identidade revelada só com consentimento mútuo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Configurações"
            className="grid h-10 w-10 place-items-center rounded-full border border-border/60 bg-background/60 backdrop-blur-md transition active:scale-95"
          >
            <Settings2 className="h-[18px] w-[18px] text-foreground/70" />
          </button>
        </div>

        {activeCommitment ? (
          <CommitmentPauseCard
            matchId={activeCommitment.match_id}
            className="mt-8 animate-fade-up"
            description="Você está em um propósito ativo. Por isso, recados anônimos recebidos e enviados ficam arquivados até esse compromisso ser interrompido."
          />
        ) : loadingList ? (
          <div className="mt-8 space-y-3">
            <div className="glass h-24 animate-pulse rounded-2xl" />
            <div className="glass h-24 animate-pulse rounded-2xl" />
          </div>
        ) : (
          <>
            {/* iOS-style segmented control */}
            <SegmentedControl
              value={tab}
              onChange={setTab}
              segments={[
                { value: "inbox", label: "Recebidos", count: inbox.length },
                { value: "outbox", label: "Enviados", count: outbox.length },
              ]}
            />

            <div className="mt-5 space-y-3">
              {tab === "inbox" ? (
                inbox.length === 0 ? (
                  <EmptyState
                    icon={<Inbox className="h-7 w-7" />}
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
                  icon={<Send className="h-7 w-7" />}
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

        {/* Settings Sheet */}
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl border-t bg-background/95 backdrop-blur-xl">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl">Configurações</SheetTitle>
              <SheetDescription>
                Controle como você recebe recados anônimos.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border bg-card/50 p-4">
                <label className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium">Aceitar recados anônimos</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
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
      className="relative grid w-full gap-1 rounded-2xl bg-muted/60 p-1 backdrop-blur"
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
              "relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[14px] font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(0,0,0,0.12)]"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {s.label}
            {typeof s.count === "number" && s.count > 0 && (
              <span
                className={[
                  "min-w-[20px] rounded-full px-1.5 text-[11px] font-semibold leading-[18px]",
                  active ? "bg-[var(--rose)]/15 text-[var(--rose)]" : "bg-foreground/10 text-foreground/70",
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
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function InboxCard({ m, hints, onChange }: { m: InboxRow; hints: Hint[]; onChange: () => void }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="recado-paper relative overflow-hidden rounded-3xl p-4"
    >
      {/* Sender header — blurred placeholder until revealed */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0">
          <AnimatePresence mode="wait">
            {isRevealed ? (
              <motion.div
                key="revealed-avatar"
                initial={{ opacity: 0, filter: "blur(8px)", scale: 0.9 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--rose)]/15 text-[var(--rose)]"
              >
                <HeartHandshake className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="masked-avatar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--rose)]/25 via-[var(--rose-soft)]/30 to-primary/20"
                aria-hidden
              >
                <UserCircle2 className="h-7 w-7 text-foreground/40 blur-[3px]" />
                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold tracking-tight text-foreground/90">
            {isRevealed ? "Identidade revelada" : "Alguém especial"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {isRevealed
              ? "Vocês concordaram em se revelar"
              : "Recado anônimo · identidade protegida"}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-1 font-medium">
          <StatusBadge status={m.status} />
        </span>
        <span>Expira em {new Date(m.expires_at).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="rounded-2xl bg-background/55 px-4 py-3 ring-1 ring-inset ring-[var(--rose)]/10 backdrop-blur-sm">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {m.content}
        </p>
      </div>

      {sentHints.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pistas
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sentHints.map((h, i) => (
              <motion.span
                key={h.id}
                initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--rose)]/25 bg-[var(--rose)]/8 px-3 py-1 text-[12px] text-foreground/85"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-[var(--rose)]" />
                <span className="truncate">{h.hint_text}</span>
              </motion.span>
            ))}
          </div>
        </div>
      )}
      {hasPending && (
        <div className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Aguardando o remetente escolher uma dica…
        </div>
      )}
      {m.reply_text && (
        <div className="mt-2 rounded-2xl border border-border/50 bg-background/60 px-4 py-3 text-[14px]">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Você respondeu
          </span>
          <p className="mt-1 text-foreground/90">{m.reply_text}</p>
        </div>
      )}

      {m.status === "revealed" && m.match_id ? (
        <Button asChild size="sm" className="mt-3 h-10 w-full rounded-full shadow-glow">
          <Link to="/conversas/$matchId" params={{ matchId: m.match_id }}>
            <MessageCircle className="mr-2 h-4 w-4" /> Abrir conversa
          </Link>
        </Button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {canReply && (
            <Button
              size="sm"
              className="h-9 rounded-full px-4"
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
              className="h-9 rounded-full px-3"
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
              className="h-9 rounded-full px-3"
              disabled={busy || !isOnline}
              onClick={() =>
                action(() => supabase.rpc("request_anonymous_reveal", { _message_id: m.id }))
              }
            >
              <Unlock className="mr-1.5 h-3.5 w-3.5" /> Revelar
            </Button>
          )}
          {myRevealed && m.status !== "revealed" && (
            <span className="px-2 py-2 text-xs text-muted-foreground">
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
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted/70 hover:text-foreground active:scale-95 disabled:opacity-50"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder anonimamente</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            maxLength={280}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Sua resposta..."
          />
          <div className="text-right text-xs text-muted-foreground">{reply.length}/280</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Cancelar
            </Button>
            <Button
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar recado</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            maxLength={500}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Descreva o motivo..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancelar
            </Button>
            <Button
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
    </motion.div>
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
    // Reset cycle once we've exhausted the pool
    if (merged.size >= pool.length) setUsedTexts(new Set(next.map((h) => h.text)));
    else setUsedTexts(merged);
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-1 font-medium">
          <StatusBadge status={m.status} />
        </span>
        <span>{new Date(m.created_at).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="ml-auto max-w-[92%] rounded-2xl bg-primary/10 px-4 py-3">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {m.content}
        </p>
      </div>

      {hints
        .filter((h) => h.sent_at)
        .map((h) => (
          <div key={h.id} className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-[12px] text-muted-foreground">
            Dica enviada: <span className="font-medium text-foreground/80">{h.hint_text}</span>
          </div>
        ))}

      {m.reply_text && (
        <div className="mt-2 mr-auto max-w-[92%] rounded-2xl bg-[var(--rose)]/10 px-4 py-3 text-[14px]">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Resposta
          </span>
          <p className="mt-1 text-foreground/90">{m.reply_text}</p>
        </div>
      )}

      {m.status === "revealed" && m.match_id ? (
        <Button asChild size="sm" className="mt-3 h-10 w-full rounded-full shadow-glow">
          <Link to="/conversas/$matchId" params={{ matchId: m.match_id }}>
            <MessageCircle className="mr-2 h-4 w-4" /> Abrir conversa
          </Link>
        </Button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pendingHint && (
            <Button size="sm" className="h-9 rounded-full px-4" onClick={openHintDialog}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Enviar dica
            </Button>
          )}
          {canReveal && !myRevealed && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-full px-3"
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
            <span className="px-2 py-2 text-xs text-muted-foreground">
              Aguardando o outro lado aceitar revelar…
            </span>
          )}
        </div>
      )}

      <Dialog open={hintOpen} onOpenChange={setHintOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[var(--rose)]" /> Escolha uma dica
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Sugestões geradas com base no seu perfil — sempre amplas, mantendo o mistério.
          </p>

          <div className="min-h-[140px] py-2">
            {loadingPool ? (
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 w-40 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Preencha mais detalhes no seu perfil para receber dicas personalizadas.
              </p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={shown.map((h) => h.text).join("|")}
                  initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-wrap gap-2"
                >
                  {shown.map((h) => {
                    const isSel = selected?.text === h.text;
                    return (
                      <motion.button
                        key={h.text}
                        type="button"
                        onClick={() => setSelected(h)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={[
                          "rounded-full border px-4 py-2 text-sm transition-all",
                          "backdrop-blur-sm",
                          isSel
                            ? "border-[var(--rose)] bg-[var(--rose)]/15 text-foreground shadow-[0_0_20px_-4px_var(--rose)]"
                            : "border-border bg-background/60 text-foreground/85 hover:border-[var(--rose)]/40 hover:bg-[var(--rose)]/5",
                        ].join(" ")}
                      >
                        <Sparkles className="mr-1 inline h-3 w-3 text-[var(--rose)]" />
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
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Gerar novas sugestões
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHintOpen(false)}>
              Cancelar
            </Button>
            <Button
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
    </div>
  );
}
