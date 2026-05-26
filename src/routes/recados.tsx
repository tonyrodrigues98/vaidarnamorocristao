import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { RequireApproved } from "@/components/RequireApproved";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Mail, Sparkles, Heart, Eye, Flag, EyeOff, Unlock, MessageCircle, Send, Lightbulb, Reply, HeartHandshake, Clock } from "lucide-react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/recados")({
  component: () => (<RequireApproved><RecadosPage /></RequireApproved>),
  head: () => ({ meta: [{ title: "Recados Anônimos · VaiDarNamoro" }] }),
});

type InboxRow = {
  id: string; sender_id: string | null; content: string; status: string;
  reply_text: string | null; sender_reveal_requested_at: string | null;
  receiver_reveal_requested_at: string | null; revealed_at: string | null;
  match_id: string | null; created_at: string; expires_at: string;
};
type OutboxRow = {
  id: string; receiver_id_revealed: string | null; content: string; status: string;
  reply_text: string | null; sender_reveal_requested_at: string | null;
  receiver_reveal_requested_at: string | null; revealed_at: string | null;
  match_id: string | null; created_at: string;
};
type HintOption = { id: string; category: string; text: string };
type Hint = { id: string; message_id: string; category: string | null; hint_text: string | null; sent_at: string | null; requested_at: string };

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
  const [tab, setTab] = useState("inbox");
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [hints, setHints] = useState<Record<string, Hint[]>>({});
  const [hintOptions, setHintOptions] = useState<HintOption[]>([]);
  const [accept, setAccept] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    await supabase.rpc("expire_anonymous_messages");
    const [{ data: inb }, { data: out }, { data: opts }, { data: settings }] = await Promise.all([
      supabase.from("anonymous_messages_inbox").select("*").order("created_at", { ascending: false }),
      supabase.from("anonymous_messages_outbox").select("*").order("created_at", { ascending: false }),
      supabase.from("anonymous_hint_options").select("*").eq("active", true).order("category"),
      supabase.from("anonymous_message_settings").select("accept_anonymous").eq("user_id", user.id).maybeSingle(),
    ]);
    setInbox((inb ?? []) as InboxRow[]);
    setOutbox((out ?? []) as OutboxRow[]);
    setHintOptions((opts ?? []) as HintOption[]);
    setAccept(settings?.accept_anonymous ?? true);
    const allIds = [...(inb ?? []), ...(out ?? [])].map((r: any) => r.id);
    if (allIds.length) {
      const { data: h } = await supabase.from("anonymous_message_hints").select("*").in("message_id", allIds);
      const grouped: Record<string, Hint[]> = {};
      (h ?? []).forEach((row: any) => { (grouped[row.message_id] ||= []).push(row); });
      setHints(grouped);
    } else setHints({});
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`recados-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "anonymous_messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "anonymous_message_hints" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const toggleOptout = async (checked: boolean) => {
    setAccept(checked);
    const { error } = await supabase.rpc("set_anonymous_optout", { _accept: checked });
    if (error) toast.error(friendlyError(error));
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl font-semibold">
            <Sparkles className="h-6 w-6 text-[var(--rose)]" /> Recados Anônimos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mistério, leveza e consentimento mútuo. A identidade só é revelada se ambos aceitarem.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inbox"><Mail className="mr-1 h-4 w-4" /> Recebidos</TabsTrigger>
            <TabsTrigger value="outbox"><Eye className="mr-1 h-4 w-4" /> Enviados</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-3">
            {inbox.length === 0 && (
              <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Nenhum recado por enquanto.
                </span>
              </p>
            )}
            {inbox.map((m) => (
              <InboxCard key={m.id} m={m} hints={hints[m.id] ?? []} hintOptions={hintOptions} onChange={load} />
            ))}
          </TabsContent>

          <TabsContent value="outbox" className="space-y-3">
            {outbox.length === 0 && (
              <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Você ainda não enviou recados.
              </p>
            )}
            {outbox.map((m) => (
              <OutboxCard key={m.id} m={m} hints={hints[m.id] ?? []} hintOptions={hintOptions} onChange={load} />
            ))}
          </TabsContent>

          <TabsContent value="config">
            <div className="rounded-2xl border p-5">
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Aceitar recados anônimos</div>
                  <div className="text-xs text-muted-foreground">Quando desativado, ninguém poderá enviar recados anônimos para você.</div>
                </div>
                <Switch checked={accept} onCheckedChange={toggleOptout} />
              </label>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function InboxCard({ m, hints, hintOptions, onChange }: { m: InboxRow; hints: Hint[]; hintOptions: HintOption[]; onChange: () => void; }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);

  const hasPending = hints.some((h) => !h.sent_at);
  const canReply = (m.status === "pending" || m.status === "hint_sent") && !hasPending;
  const canHint = (m.status === "pending" || m.status === "hint_sent") && hints.length < 2 && !hasPending;
  const canReveal = ["replied", "reveal_requested", "hint_sent"].includes(m.status);
  const myRevealed = !!m.receiver_reveal_requested_at;

  const action = async (fn: () => PromiseLike<any>) => {
    setBusy(true); const { error } = await fn(); setBusy(false);
    if (error) toast.error(friendlyError(error)); else onChange();
  };

  return (
    <div className="glass rounded-2xl p-5 shadow-soft">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <StatusBadge status={m.status} />
        <span>Expira em {new Date(m.expires_at).toLocaleDateString("pt-BR")}</span>
      </div>
      <p className="whitespace-pre-wrap text-foreground/90">{m.content}</p>

      {hints.filter((h) => h.sent_at).map((h) => (
        <div key={h.id} className="mt-3 rounded-xl bg-[var(--rose)]/10 px-3 py-2 text-sm">
          <Sparkles className="mr-1 inline h-3 w-3 text-[var(--rose)]" /> {h.hint_text}
        </div>
      ))}
      {hasPending && (
        <div className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
          Aguardando o remetente escolher uma dica…
        </div>
      )}
      {m.reply_text && (
        <div className="mt-3 rounded-xl border px-3 py-2 text-sm">
          <span className="text-xs text-muted-foreground">Você respondeu:</span>
          <p className="mt-1">{m.reply_text}</p>
        </div>
      )}

      {m.status === "revealed" && m.match_id ? (
        <Button asChild size="sm" className="mt-4 w-full shadow-glow">
          <Link to="/conversas/$matchId" params={{ matchId: m.match_id }}>
            <MessageCircle className="mr-2 h-4 w-4" /> Abrir conversa
          </Link>
        </Button>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {canReply && (
            <Button size="sm" variant="default" onClick={() => setReplyOpen(true)}>
              <Heart className="mr-1 h-3 w-3" /> Responder
            </Button>
          )}
          {canHint && (
            <Button size="sm" variant="outline" disabled={busy}
              onClick={() => action(() => supabase.rpc("request_anonymous_hint", { _message_id: m.id }))}>
              <Eye className="mr-1 h-3 w-3" /> Pedir dica ({hints.length}/2)
            </Button>
          )}
          {canReveal && !myRevealed && (
            <Button size="sm" variant="outline" disabled={busy}
              onClick={() => action(() => supabase.rpc("request_anonymous_reveal", { _message_id: m.id }))}>
              <Unlock className="mr-1 h-3 w-3" /> Revelar quem eu sou
            </Button>
          )}
          {myRevealed && m.status !== "revealed" && (
            <span className="text-xs text-muted-foreground">Aguardando o outro lado aceitar revelar…</span>
          )}
          <Button size="sm" variant="outline" disabled={busy}
            onClick={() => action(() => supabase.rpc("ignore_anonymous_message", { _message_id: m.id }))}>
            <EyeOff className="mr-1 h-3 w-3" /> Ignorar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setReportOpen(true)}>
            <Flag className="mr-1 h-3 w-3" /> Denunciar
          </Button>
        </div>
      )}

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Responder anonimamente</DialogTitle></DialogHeader>
          <Textarea rows={4} maxLength={280} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Sua resposta..." />
          <div className="text-right text-xs text-muted-foreground">{reply.length}/280</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>Cancelar</Button>
            <Button disabled={busy || !reply.trim()} onClick={async () => {
              setBusy(true);
              const { error } = await supabase.rpc("reply_anonymous_message", { _message_id: m.id, _reply: reply.trim() });
              setBusy(false);
              if (error) toast.error(friendlyError(error));
              else { toast.success("Resposta enviada"); setReplyOpen(false); setReply(""); onChange(); }
            }}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Denunciar recado</DialogTitle></DialogHeader>
          <Textarea rows={4} maxLength={500} value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Descreva o motivo..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancelar</Button>
            <Button disabled={busy || !reportReason.trim()} onClick={async () => {
              setBusy(true);
              const { error } = await supabase.rpc("report_anonymous_message", { _message_id: m.id, _reason: reportReason.trim() });
              setBusy(false);
              if (error) toast.error(friendlyError(error));
              else { toast.success("Denúncia enviada"); setReportOpen(false); setReportReason(""); onChange(); }
            }}>Enviar denúncia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OutboxCard({ m, hints, hintOptions, onChange }: { m: OutboxRow; hints: Hint[]; hintOptions: HintOption[]; onChange: () => void; }) {
  const [hintOpen, setHintOpen] = useState(false);
  const [hintId, setHintId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const pendingHint = hints.find((h) => !h.sent_at);
  const canReveal = ["replied", "reveal_requested", "hint_sent"].includes(m.status);
  const myRevealed = !!m.sender_reveal_requested_at;

  return (
    <div className="glass rounded-2xl p-5 shadow-soft">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <StatusBadge status={m.status} />
        <span>{new Date(m.created_at).toLocaleDateString("pt-BR")}</span>
      </div>
      <p className="whitespace-pre-wrap text-foreground/90">{m.content}</p>

      {hints.filter((h) => h.sent_at).map((h) => (
        <div key={h.id} className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs">
          Dica enviada: <span className="font-medium">{h.hint_text}</span>
        </div>
      ))}

      {m.reply_text && (
        <div className="mt-3 rounded-xl border bg-[var(--rose)]/5 px-3 py-2 text-sm">
          <span className="text-xs text-muted-foreground">Resposta:</span>
          <p className="mt-1">{m.reply_text}</p>
        </div>
      )}

      {m.status === "revealed" && m.match_id ? (
        <Button asChild size="sm" className="mt-4 w-full shadow-glow">
          <Link to="/conversas/$matchId" params={{ matchId: m.match_id }}>
            <MessageCircle className="mr-2 h-4 w-4" /> Abrir conversa
          </Link>
        </Button>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {pendingHint && (
            <Button size="sm" variant="default" onClick={() => setHintOpen(true)}>
              <Sparkles className="mr-1 h-3 w-3" /> Enviar dica
            </Button>
          )}
          {canReveal && !myRevealed && (
            <Button size="sm" variant="outline" disabled={busy}
              onClick={async () => {
                setBusy(true);
                const { error } = await supabase.rpc("request_anonymous_reveal", { _message_id: m.id });
                setBusy(false);
                if (error) toast.error(friendlyError(error)); else onChange();
              }}>
              <Unlock className="mr-1 h-3 w-3" /> Revelar quem eu sou
            </Button>
          )}
          {myRevealed && m.status !== "revealed" && (
            <span className="text-xs text-muted-foreground">Aguardando o outro lado aceitar revelar…</span>
          )}
        </div>
      )}

      <Dialog open={hintOpen} onOpenChange={setHintOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escolha uma dica para enviar</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">As dicas são amplas e mantêm o mistério.</p>
          <Select value={hintId} onValueChange={setHintId}>
            <SelectTrigger><SelectValue placeholder="Selecione uma dica..." /></SelectTrigger>
            <SelectContent>
              {hintOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>[{o.category}] {o.text}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHintOpen(false)}>Cancelar</Button>
            <Button disabled={busy || !hintId} onClick={async () => {
              setBusy(true);
              const { error } = await supabase.rpc("send_anonymous_hint", { _message_id: m.id, _hint_option_id: hintId });
              setBusy(false);
              if (error) toast.error(friendlyError(error));
              else { toast.success("Dica enviada"); setHintOpen(false); setHintId(""); onChange(); }
            }}>Enviar dica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}