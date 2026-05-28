import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Loader2, Paperclip, Send, ShieldCheck, X, Image as ImageIcon,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIES, PRIORITIES, STATUSES, statusBadge, priorityBadge,
  type Ticket, type TicketMessage,
} from "@/lib/support";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhotoAvatarImage } from "@/components/PhotoImg";

type ProfileLite = { id: string; full_name: string; photo_url: string | null };
type StaffOption = { user_id: string; full_name: string; photo_url: string | null; role: string };

export const Route = createFileRoute("/suporte/$id")({
  component: TicketPage,
});

function TicketPage() {
  const { id } = Route.useParams();
  const { user, isAdmin, role, isSupportAgent, loading } = useAuth();
  const isStaff = isAdmin || role === "super_admin" || ((role === "moderador" || role === "apresentador") && isSupportAgent);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [msgs, setMsgs] = useState<TicketMessage[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [busy, setBusy] = useState(true);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const load = async () => {
      setBusy(true);
      const [{ data: t }, { data: m }] = await Promise.all([
        supabase.from("support_tickets").select("*").eq("id", id).maybeSingle(),
        supabase.from("support_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true }),
      ]);
      if (!ignore) {
        setTicket((t as Ticket) ?? null);
        const messages = (m ?? []) as TicketMessage[];
        setMsgs(messages);
        setBusy(false);
        // load profiles for senders + ticket owner
        const ids = Array.from(new Set([
          ...(t ? [(t as Ticket).user_id, (t as Ticket).assigned_to].filter(Boolean) as string[] : []),
          ...messages.map((mm) => mm.sender_id),
        ]));
        if (ids.length) {
          const { data: ps } = await supabase.from("profiles").select("id, full_name, photo_url").in("id", ids);
          if (ps && !ignore) {
            const map: Record<string, ProfileLite> = {};
            ps.forEach((p: any) => { map[p.id] = p; });
            setProfiles((prev) => ({ ...prev, ...map }));
          }
        }
        // sign attachments
        const paths = messages.flatMap((mm) => (mm.attachments ?? []).map((a) => a.path));
        if (paths.length) {
          const { data: urls } = await supabase.storage.from("support-attachments").createSignedUrls(paths, 3600);
          if (urls && !ignore) {
            const map: Record<string, string> = {};
            urls.forEach((u, i) => { if (u.signedUrl) map[paths[i]] = u.signedUrl; });
            setSigned((prev) => ({ ...prev, ...map }));
          }
        }
      }
    };
    load();
    const ch = supabase
      .channel(`support_ticket_${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${id}` },
        async (payload) => {
          const m = payload.new as TicketMessage;
          setMsgs((prev) => [...prev, m]);
          if (!profiles[m.sender_id]) {
            const { data: p } = await supabase.from("profiles").select("id, full_name, photo_url").eq("id", m.sender_id).maybeSingle();
            if (p) setProfiles((prev) => ({ ...prev, [p.id]: p as ProfileLite }));
          }
          if (m.attachments?.length) {
            const paths = m.attachments.map((a) => a.path);
            const { data: urls } = await supabase.storage.from("support-attachments").createSignedUrls(paths, 3600);
            if (urls) {
              const map: Record<string, string> = {};
              urls.forEach((u, i) => { if (u.signedUrl) map[paths[i]] = u.signedUrl; });
              setSigned((prev) => ({ ...prev, ...map }));
            }
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${id}` },
        (payload) => setTicket(payload.new as Ticket))
      .subscribe();
    return () => { ignore = true; supabase.removeChannel(ch); };
  }, [id, user]);

  // Load staff list for assignment (admins only)
  useEffect(() => {
    if (!isStaff) return;
    let ignore = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "super_admin", "moderador", "apresentador"] as any);
      const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
      if (!ids.length) return;
      const { data: ps } = await supabase.from("profiles").select("id, full_name, photo_url").in("id", ids);
      if (ignore) return;
      const profMap = new Map((ps ?? []).map((p: any) => [p.id, p]));
      const list: StaffOption[] = (roles ?? []).map((r: any) => {
        const p: any = profMap.get(r.user_id);
        return p ? { user_id: r.user_id, full_name: p.full_name, photo_url: p.photo_url, role: r.role } : null;
      }).filter(Boolean) as StaffOption[];
      // dedupe by user_id
      const seen = new Set<string>();
      setStaffList(list.filter((s) => { if (seen.has(s.user_id)) return false; seen.add(s.user_id); return true; }));
    })();
    return () => { ignore = true; };
  }, [isStaff]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send() {
    if (!user || !ticket) return;
    if (!text.trim() && files.length === 0) return;
    if (ticket.status === "closed") return toast.error("Este chamado está fechado.");
    if (files.length > 5) return toast.error("Máximo de 5 anexos por mensagem.");
    setSending(true);
    try {
      const attachments: TicketMessage["attachments"] = [];
      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name} acima de 5MB`);
        if (!f.type.startsWith("image/")) throw new Error("Somente imagens são aceitas.");
        const path = `${user.id}/${ticket.id}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60)}`;
        const up = await supabase.storage.from("support-attachments").upload(path, f, { contentType: f.type });
        if (up.error) throw up.error;
        attachments.push({ path, name: f.name, type: f.type, size: f.size });
      }
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        content: text.trim() || "(anexo)",
        attachments,
      });
      if (error) throw error;
      setText(""); setFiles([]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  async function updateField(patch: Partial<Pick<Ticket, "status" | "priority" | "category">>) {
    if (!ticket) return;
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", ticket.id);
    if (error) toast.error(error.message);
    else toast.success("Atualizado");
  }

  async function assignTo(userId: string | null) {
    if (!ticket) return;
    const { error } = await supabase.from("support_tickets").update({ assigned_to: userId }).eq("id", ticket.id);
    if (error) return toast.error(error.message);
    toast.success(userId ? "Atribuído" : "Atribuição removida");
  }

  const canChat = useMemo(() => ticket && ticket.status !== "closed", [ticket]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (busy) return (
    <div className="min-h-screen"><Header />
      <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
    </div>
  );
  if (!ticket) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p>Chamado não encontrado.</p>
        <Link to="/suporte" className="text-[var(--rose)] hover:underline">Voltar</Link>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/suporte" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="glass mt-3 rounded-2xl p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-semibold">{ticket.title}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <PhotoAvatarImage src={profiles[ticket.user_id]?.photo_url ?? undefined} />
                  <AvatarFallback>{(profiles[ticket.user_id]?.full_name ?? "?").charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{profiles[ticket.user_id]?.full_name ?? "Usuário"}</span>
                <span className="text-xs text-muted-foreground">
                  • aberto em {new Date(ticket.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              {ticket.assigned_to && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <UserCog className="h-3 w-3" /> Responsável: {profiles[ticket.assigned_to]?.full_name ?? "—"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {priorityBadge(ticket.priority)}
              {statusBadge(ticket.status)}
            </div>
          </div>

          {isStaff && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select value={ticket.status} onValueChange={(v) => updateField({ status: v as Ticket["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>Status: {s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={ticket.priority} onValueChange={(v) => updateField({ priority: v as Ticket["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>Prioridade: {p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={ticket.category} onValueChange={(v) => updateField({ category: v as Ticket["category"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>Cat: {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={ticket.assigned_to ?? "__none__"} onValueChange={(v) => assignTo(v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Atribuir a..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem responsável</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      Responsável: {s.full_name} ({s.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="glass mt-4 flex max-h-[60vh] flex-col gap-3 overflow-y-auto rounded-2xl p-4 shadow-soft">
          {msgs.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
          )}
          {msgs.map((m) => {
            const mine = m.sender_id === user?.id;
            const sender = profiles[m.sender_id];
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <PhotoAvatarImage src={sender?.photo_url ?? undefined} />
                    <AvatarFallback>{(sender?.full_name ?? "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-soft ${
                  m.is_staff
                    ? "bg-[var(--rose)]/15 text-foreground border border-[var(--rose)]/30"
                    : mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                }`}>
                  <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    {m.is_staff && <ShieldCheck className="h-3 w-3 text-[var(--rose)]" />}
                    <span className={m.is_staff ? "text-[var(--rose)]" : ""}>{sender?.full_name ?? (mine ? "Você" : "Usuário")}</span>
                    {m.is_staff && <span className="text-[var(--rose)]">• Equipe</span>}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  {m.attachments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((a) => (
                        <a key={a.path} href={signed[a.path] ?? "#"} target="_blank" rel="noreferrer"
                          className="block overflow-hidden rounded-lg border border-border">
                          {signed[a.path]
                            ? <img src={signed[a.path]} alt={a.name} className="h-24 w-24 object-cover" />
                            : <span className="flex h-24 w-24 items-center justify-center text-xs"><ImageIcon className="h-4 w-4" /></span>}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] opacity-60">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {canChat ? (
          <div className="glass mt-4 rounded-2xl p-3 shadow-soft">
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                    {f.name}
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border hover:bg-muted">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])].slice(0, 5))}
                />
              </label>
              <Textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="min-h-[40px] flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
              />
              <Button onClick={send} disabled={sending} className="rounded-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            Este chamado está fechado.
          </div>
        )}
      </main>
    </div>
  );
}