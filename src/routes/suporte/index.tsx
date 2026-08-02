import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { LifeBuoy, Plus, Loader2, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  statusBadge,
  priorityBadge,
  type Ticket,
} from "@/lib/support";

export const Route = createFileRoute("/suporte/")({
  component: SuportePage,
});

function SuportePage() {
  const navigate = useNavigate();
  const { user, isAdmin, role, isSupportAgent, loading } = useAuth();
  const isStaff =
    isAdmin ||
    role === "super_admin" ||
    ((role === "moderador" || role === "apresentador") && isSupportAgent);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const load = async () => {
      setBusy(true);
      let qry = supabase
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(200);
      if (!isStaff) qry = qry.eq("user_id", user.id);
      const { data, error } = await qry;
      if (!ignore) {
        if (error) toast.error(error.message);
        setTickets((data ?? []) as Ticket[]);
        setBusy(false);
      }
    };
    load();
    const ch = supabase
      .channel("support_tickets_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () =>
        load(),
      )
      .subscribe();
    return () => {
      ignore = true;
      supabase.removeChannel(ch);
    };
  }, [user, isStaff]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filterStatus, filterPriority, filterCategory, q]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold">
              <LifeBuoy className="h-7 w-7 text-[var(--rose)]" /> Central de Suporte
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isStaff
                ? "Gerencie todos os chamados, responda em tempo real e mantenha a equipe organizada."
                : "Abra um chamado e nossa equipe responderá o mais breve possível."}
            </p>
          </div>
          {!isStaff && (
            <NewTicketDialog
              open={open}
              setOpen={setOpen}
              onCreated={(id) => {
                void navigate({ to: "/suporte/$id", params: { id } });
              }}
            />
          )}
        </div>

        <Link
          to="/suporte/ajuda"
          className="glass mt-4 flex items-center gap-3 rounded-2xl p-4 shadow-soft transition-all hover:shadow-glow"
        >
          <BookOpen className="h-6 w-6 text-[var(--rose)]" />
          <div className="flex-1">
            <p className="font-semibold">Central de Ajuda e FAQ</p>
            <p className="text-xs text-muted-foreground">
              Veja respostas para dúvidas comuns antes de abrir um chamado.
            </p>
          </div>
          <span className="text-sm text-[var(--rose)]">Abrir →</span>
        </Link>

        <div className="glass mt-6 flex flex-wrap items-center gap-3 rounded-2xl p-3 shadow-soft">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título"
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-2">
          {busy && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {!busy && filtered.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
              {tickets.length === 0
                ? "Nenhum chamado ainda."
                : "Nenhum chamado para os filtros selecionados."}
            </div>
          )}
          {filtered.map((t) => (
            <Link
              key={t.id}
              to="/suporte/$id"
              params={{ id: t.id }}
              className="glass flex items-center justify-between gap-3 rounded-xl p-4 shadow-soft transition-all hover:shadow-glow"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{t.title}</p>
                  {priorityBadge(t.priority)}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === t.category)?.label} • atualizado{" "}
                  {new Date(t.last_message_at).toLocaleString("pt-BR")}
                </p>
              </div>
              {statusBadge(t.status)}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function NewTicketDialog({
  open,
  setOpen,
  onCreated,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [priority, setPriority] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) return;
    if (title.trim().length < 4) return toast.error("Título muito curto.");
    if (description.trim().length < 10) return toast.error("Descreva melhor o problema.");
    if (files.length > 5) return toast.error("Máximo de 5 anexos.");
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) return toast.error(`${f.name} acima de 5MB`);
      if (!f.type.startsWith("image/")) return toast.error("Somente imagens são aceitas.");
    }
    setBusy(true);
    try {
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category: category as Ticket["category"],
          priority: priority as Ticket["priority"],
        })
        .select("id")
        .single();
      if (error) throw error;
      const ticketId = ticket!.id;
      const attachments: { path: string; name: string; type: string; size: number }[] = [];
      for (const f of files) {
        const path = `${user.id}/${ticketId}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60)}`;
        const up = await supabase.storage
          .from("support-attachments")
          .upload(path, f, { contentType: f.type });
        if (up.error) throw up.error;
        attachments.push({ path, name: f.name, type: f.type, size: f.size });
      }
      const { error: mErr } = await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: user.id,
        content: description.trim(),
        attachments,
      });
      if (mErr) throw mErr;
      toast.success("Chamado criado!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setFiles([]);
      setCategory("other");
      setPriority("medium");
      onCreated(ticketId);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar chamado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-glow">
          <Plus className="mr-1 h-4 w-4" /> Novo chamado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir novo chamado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Resumo do problema"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              placeholder="Descreva o problema com o máximo de detalhes possível."
            />
          </div>
          <div>
            <Label>Anexos (imagens, até 5MB cada, máx 5)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {files.length} arquivo(s) selecionado(s)
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
