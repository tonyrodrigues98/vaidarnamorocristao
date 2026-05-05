import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { RequireApproved } from "@/components/RequireApproved";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { friendlyError } from "@/lib/errors";
import { recomputeMyBadges } from "@/lib/recomputeBadges";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Hand, HandHeart, Plus, Check, Trash2, EyeOff, Eye, Sparkles, Flag,
  HeartPulse, Users as UsersIcon, HeartHandshake, Wallet, Flame, MoreHorizontal,
  ShieldCheck, ShieldAlert, ArchiveRestore, Ban, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/oracoes")({
  component: () => (<RequireApproved><Page /></RequireApproved>),
  head: () => ({
    meta: [
      { title: "Pedidos de oração — VaiDarNamoro" },
      { name: "description", content: "Compartilhe seus pedidos de oração e ore pelos irmãos da comunidade cristã." },
      { property: "og:title", content: "Pedidos de oração — VaiDarNamoro" },
    ],
  }),
});

type Category = "health" | "family" | "relationship" | "financial" | "spiritual" | "other";
type ModerationStatus = "visible" | "hidden" | "removed";
type PrayerRequest = {
  id: string; user_id: string; title: string; content: string;
  category: Category; is_anonymous: boolean; resolved: boolean;
  resolved_at: string | null; created_at: string;
  moderation_status?: ModerationStatus;
};
type ReportRow = { id: string; request_id: string; status: string };
type ProfileLite = { id: string; full_name: string; photo_url: string | null };

const CATEGORIES: { value: Category; label: string; Icon: typeof HeartPulse }[] = [
  { value: "health", label: "Saúde", Icon: HeartPulse },
  { value: "family", label: "Família", Icon: UsersIcon },
  { value: "relationship", label: "Relacionamento", Icon: HeartHandshake },
  { value: "financial", label: "Financeiro", Icon: Wallet },
  { value: "spiritual", label: "Espiritual", Icon: Flame },
  { value: "other", label: "Outro", Icon: Sparkles },
];

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Page() {
  const { user, loading, isAdmin, role } = useAuth();
  const canModerate = isAdmin || role === "moderador" || role === "super_admin";
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [prayedCounts, setPrayedCounts] = useState<Record<string, number>>({});
  const [myPrayed, setMyPrayed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "active" | "mine" | Category>("active");
  const [openCreate, setOpenCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportFor, setReportFor] = useState<PrayerRequest | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [myReports, setMyReports] = useState<Set<string>>(new Set());
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);

  // form state
  const [fTitle, setFTitle] = useState("");
  const [fContent, setFContent] = useState("");
  const [fCategory, setFCategory] = useState<Category>("other");
  const [fAnonymous, setFAnonymous] = useState(false);

  const loadProfiles = useCallback(async (ids: string[]) => {
    const missing = Array.from(new Set(ids.filter((id) => id && !profiles[id])));
    if (!missing.length) return;
    const { data } = await supabase.from("profiles").select("id, full_name, photo_url").in("id", missing);
    const map: Record<string, ProfileLite> = {};
    (data ?? []).forEach((p: any) => { map[p.id] = p; });
    setProfiles((prev) => ({ ...prev, ...map }));
  }, [profiles]);

  const loadAll = useCallback(async () => {
    const { data, error } = await supabase
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(friendlyError(error)); return; }
    const list = (data ?? []) as PrayerRequest[];
    setRequests(list);
    const nonAnon = list.filter((r) => !r.is_anonymous).map((r) => r.user_id);
    void loadProfiles(nonAnon);

    const { data: prayedData } = await supabase
      .from("prayer_request_prayed")
      .select("request_id, user_id");
    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    (prayedData ?? []).forEach((r: any) => {
      counts[r.request_id] = (counts[r.request_id] ?? 0) + 1;
      if (user && r.user_id === user.id) mine.add(r.request_id);
    });
    setPrayedCounts(counts);
    setMyPrayed(mine);

    // Load reports (RLS limits to own + staff)
    const { data: reportsData } = await supabase
      .from("prayer_request_reports")
      .select("id, request_id, reporter_id, status");
    const rCounts: Record<string, number> = {};
    const myR = new Set<string>();
    (reportsData ?? []).forEach((r: any) => {
      rCounts[r.request_id] = (rCounts[r.request_id] ?? 0) + 1;
      if (user && r.reporter_id === user.id) myR.add(r.request_id);
    });
    setReportCounts(rCounts);
    setMyReports(myR);
  }, [user, loadProfiles]);

  useEffect(() => {
    if (!user) return;
    void loadAll();
    const ch = supabase
      .channel("prayer-requests-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "prayer_requests" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "prayer_request_prayed" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "prayer_request_reports" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    let list = requests;
    if (filter === "active") list = list.filter((r) => !r.resolved);
    else if (filter === "mine") list = list.filter((r) => user && r.user_id === user.id);
    else if (filter !== "all") list = list.filter((r) => r.category === filter);
    return list;
  }, [requests, filter, user]);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const title = fTitle.trim();
    const content = fContent.trim();
    if (!title || !content) { toast.error("Preencha título e descrição"); return; }
    if (title.length > 120) { toast.error("Título muito longo"); return; }
    setBusy(true);
    const { error } = await supabase.from("prayer_requests").insert({
      user_id: user.id, title, content, category: fCategory, is_anonymous: fAnonymous,
    });
    setBusy(false);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success("Pedido de oração compartilhado");
    setFTitle(""); setFContent(""); setFCategory("other"); setFAnonymous(false);
    setOpenCreate(false);
    void recomputeMyBadges(user.id);
  }

  async function togglePrayed(req: PrayerRequest) {
    if (!user) return;
    const has = myPrayed.has(req.id);
    // optimistic
    setMyPrayed((prev) => {
      const n = new Set(prev);
      if (has) n.delete(req.id); else n.add(req.id);
      return n;
    });
    setPrayedCounts((c) => ({ ...c, [req.id]: Math.max(0, (c[req.id] ?? 0) + (has ? -1 : 1)) }));
    if (has) {
      const { error } = await supabase.from("prayer_request_prayed").delete().eq("request_id", req.id).eq("user_id", user.id);
      if (error) { toast.error(friendlyError(error)); void loadAll(); }
    } else {
      const { error } = await supabase.from("prayer_request_prayed").insert({ request_id: req.id, user_id: user.id });
      if (error) { toast.error(friendlyError(error)); void loadAll(); }
      else toast.success("Que Deus ouça sua oração");
    }
  }

  async function markResolved(req: PrayerRequest) {
    if (!user || req.user_id !== user.id) return;
    const newVal = !req.resolved;
    const { error } = await supabase.from("prayer_requests")
      .update({ resolved: newVal, resolved_at: newVal ? new Date().toISOString() : null })
      .eq("id", req.id);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success(newVal ? "Marcado como respondido" : "Reaberto");
  }

  async function deleteRequest(req: PrayerRequest) {
    if (!user) return;
    if (req.user_id !== user.id && !canModerate) return;
    if (!confirm("Apagar este pedido?")) return;
    const { error } = await supabase.from("prayer_requests").delete().eq("id", req.id);
    if (error) { toast.error(friendlyError(error)); return; }
  }

  async function setModeration(req: PrayerRequest, status: ModerationStatus) {
    if (!canModerate) return;
    const { error } = await supabase.from("prayer_requests")
      .update({ moderation_status: status })
      .eq("id", req.id);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success(
      status === "visible" ? "Pedido aprovado e visível"
      : status === "hidden" ? "Pedido ocultado"
      : "Pedido marcado como removido"
    );
    setActionsOpenId(null);
  }

  async function submitReport() {
    if (!user || !reportFor) return;
    const reason = reportReason.trim();
    if (!reason) { toast.error("Descreva o motivo"); return; }
    setReportBusy(true);
    const { error } = await supabase.from("prayer_request_reports").insert({
      request_id: reportFor.id, reporter_id: user.id, reason,
    });
    setReportBusy(false);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success("Denúncia enviada. Obrigado por cuidar da comunidade.");
    setReportFor(null);
    setReportReason("");
  }

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <header className="animate-fade-up flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            <HandHeart className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight">Pedidos de oração</h1>
            <p className="text-sm text-muted-foreground">
              Compartilhe e ore pelos irmãos. <Link to="/devocional" className="underline">Veja o devocional do dia</Link>.
            </p>
          </div>
          <Button onClick={() => setOpenCreate(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Pedir oração
          </Button>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>Ativos</FilterChip>
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Todos</FilterChip>
          <FilterChip active={filter === "mine"} onClick={() => setFilter("mine")}>Meus</FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c.value} active={filter === c.value} onClick={() => setFilter(c.value)}>
              {c.emoji} {c.label}
            </FilterChip>
          ))}
        </div>

        <section className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-muted-foreground shadow-soft">
              {filter === "mine" ? "Você ainda não fez pedidos." : "Nenhum pedido nessa categoria."}
            </div>
          ) : (
            filtered.map((req) => {
              const cat = CATEGORIES.find((c) => c.value === req.category) ?? CATEGORIES[5];
              const author = req.is_anonymous ? null : profiles[req.user_id];
              const count = prayedCounts[req.id] ?? 0;
              const iPrayed = myPrayed.has(req.id);
              const isMine = user?.id === req.user_id;
              return (
                <article key={req.id} className={`glass rounded-3xl p-5 shadow-soft animate-fade-up ${req.resolved ? "opacity-75" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {req.is_anonymous ? (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : author?.photo_url ? (
                        <img src={author.photo_url} alt={author.full_name} className="h-10 w-10 rounded-full object-cover shrink-0" loading="lazy" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {req.is_anonymous ? "Anônimo" : (author?.full_name ?? "Irmão(a)")}
                        </p>
                        <p className="text-xs text-muted-foreground">{relTime(req.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">{cat.emoji} {cat.label}</Badge>
                      {req.resolved && <Badge className="bg-emerald-500 hover:bg-emerald-500">✓ Respondido</Badge>}
                    </div>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold">{req.title}</h2>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{req.content}</p>

                  <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                    <Button
                      variant={iPrayed ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePrayed(req)}
                      disabled={req.resolved}
                    >
                      <Hand className={`h-4 w-4 mr-1 ${iPrayed ? "fill-current" : ""}`} />
                      {iPrayed ? "Estou orando" : "Orar por isso"}
                      {count > 0 && <span className="ml-2 text-xs opacity-80">· {count}</span>}
                    </Button>
                    <div className="flex items-center gap-2">
                      {isMine && (
                        <Button variant="ghost" size="sm" onClick={() => markResolved(req)}>
                          <Check className="h-4 w-4 mr-1" />
                          {req.resolved ? "Reabrir" : "Respondido"}
                        </Button>
                      )}
                      {(isMine || canModerate) && (
                        <Button variant="ghost" size="sm" onClick={() => deleteRequest(req)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Novo pedido de oração</DialogTitle>
            <DialogDescription>
              Compartilhe com a comunidade. Seja respeitoso e evite expor terceiros.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-3">
            <Input
              placeholder="Título (ex: Saúde da minha mãe)"
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              maxLength={120}
              required
            />
            <Textarea
              placeholder="Conte o que está no seu coração..."
              value={fContent}
              onChange={(e) => setFContent(e.target.value)}
              rows={5}
              maxLength={2000}
              required
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFCategory(c.value)}
                  className={`px-3 py-1 rounded-full text-xs border ${fCategory === c.value ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={fAnonymous} onChange={(e) => setFAnonymous(e.target.checked)} />
              Compartilhar como anônimo
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>{busy ? "Enviando..." : "Compartilhar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-border"
      }`}
    >
      {children}
    </button>
  );
}