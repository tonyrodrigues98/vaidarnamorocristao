import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Music2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { normalizeImageFile } from "@/lib/imageNormalize";
import {
  LIVE_TEAM_BUCKET,
  LIVE_TEAM_CATEGORIES,
  LIVE_TEAM_CATEGORY_LABELS,
  LIVE_HIGHLIGHT_TYPES,
  LIVE_HIGHLIGHT_TYPE_LABELS,
  createLiveTeamMember,
  createMonthlyHighlight,
  deleteLiveTeamMember,
  deleteMonthlyHighlight,
  fetchAllMonthlyHighlightsAdmin,
  fetchAllLiveTeamMembersAdmin,
  getCurrentHighlightPeriod,
  getLiveTeamUploadPath,
  reorderLiveTeamMembers,
  updateMonthlyHighlight,
  updateLiveTeamMember,
  type LiveHighlightType,
  type LiveMonthlyHighlight,
  type LiveTeamCategory,
  type LiveTeamMember,
} from "@/lib/liveTeam";

export const Route = createFileRoute("/admin/equipe-live")({
  component: LiveTeamAdminPage,
});

const EMPTY_FORM = {
  name: "",
  role_title: "",
  category: "host" as LiveTeamCategory,
  chip_text: "",
  tiktok_url: "",
  photo_url: "",
  storage_path: null as string | null,
  display_url: "",
  sort_order: 0,
  is_active: true,
};

const CURRENT_PERIOD = getCurrentHighlightPeriod();

const EMPTY_HIGHLIGHT_FORM = {
  ranking_type: "viewer" as LiveHighlightType,
  position: 1 as 1 | 2 | 3,
  name: "",
  chip_text: "",
  tiktok_url: "",
  photo_url: "",
  storage_path: null as string | null,
  display_url: "",
  month: CURRENT_PERIOD.month,
  year: CURRENT_PERIOD.year,
  is_active: true,
};

function adminErrorMessage(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : fallback;
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (code === "42P01" || message.includes("live_team_members")) {
    return "Banco ainda sem a migration da Equipe da Live. Aplique a migration 20260604170000_live_team_members.sql no Supabase.";
  }

  if (message.includes("live_monthly_highlights")) {
    return "Banco ainda sem a migration do Top 3 do mês. Aplique a migration 20260604183000_live_monthly_highlights.sql no Supabase.";
  }

  if (code === "23505") {
    return "Já existe um destaque ativo nesta posição, tipo e mês. Ajuste a posição ou desative o registro antigo.";
  }

  return message;
}

function withSequentialSort(items: LiveTeamMember[]) {
  const counters = new Map<LiveTeamCategory, number>();
  return items.map((item) => {
    const nextOrder = (counters.get(item.category) ?? 0) + 1;
    counters.set(item.category, nextOrder);
    return { ...item, sort_order: nextOrder };
  });
}

function moveItem(items: LiveTeamMember[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function LiveTeamAdminPage() {
  const { user, loading: authLoading, isAdmin, role } = useAuth();
  const canAccess = isAdmin || role === "super_admin";
  const [items, setItems] = useState<LiveTeamMember[]>([]);
  const [highlights, setHighlights] = useState<LiveMonthlyHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [highlightForm, setHighlightForm] = useState(EMPTY_HIGHLIGHT_FORM);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [highlightCreateOpen, setHighlightCreateOpen] = useState(false);
  const [highlightEditOpen, setHighlightEditOpen] = useState(false);
  const [selected, setSelected] = useState<LiveTeamMember | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<LiveMonthlyHighlight | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.name} ${item.role_title} ${item.chip_text ?? ""}`.toLowerCase().includes(term),
    );
  }, [items, search]);

  useEffect(() => {
    if (!canAccess) return;
    void load();
  }, [canAccess]);

  async function load() {
    setLoading(true);
    try {
      const [teamItems, highlightItems] = await Promise.all([
        fetchAllLiveTeamMembersAdmin(),
        fetchAllMonthlyHighlightsAdmin(),
      ]);
      setItems(teamItems);
      setHighlights(highlightItems);
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel carregar a equipe da live"));
    } finally {
      setLoading(false);
    }
  }

  async function persistOrder(nextItems: LiveTeamMember[]) {
    const previous = items;
    const ordered = withSequentialSort(nextItems);
    setItems(ordered);
    setOrdering(true);
    try {
      await reorderLiveTeamMembers(
        ordered.map((item) => ({ id: item.id, sort_order: item.sort_order })),
      );
      toast.success("Ordem salva");
    } catch (e) {
      setItems(previous);
      toast.error(adminErrorMessage(e, "Nao foi possivel salvar a ordem"));
    } finally {
      setOrdering(false);
    }
  }

  function handleDropOn(targetId: string) {
    if (!draggingId || draggingId === targetId || search.trim()) return;
    const fromIndex = items.findIndex((item) => item.id === draggingId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    const source = items[fromIndex];
    const target = items[toIndex];
    setDraggingId(null);
    setDragOverId(null);
    if (!source || !target || source.category !== target.category || fromIndex === toIndex) return;
    void persistOrder(moveItem(items, fromIndex, toIndex));
  }

  function moveByButton(itemId: string, direction: -1 | 1) {
    if (search.trim()) return;
    const fromIndex = items.findIndex((item) => item.id === itemId);
    const item = items[fromIndex];
    if (!item) return;
    const sameCategory = items
      .map((member, index) => ({ member, index }))
      .filter(({ member }) => member.category === item.category);
    const categoryPosition = sameCategory.findIndex(({ member }) => member.id === itemId);
    const target = sameCategory[categoryPosition + direction];
    if (!target) return;
    void persistOrder(moveItem(items, fromIndex, target.index));
  }

  async function uploadImage(file: File) {
    setSaving(true);
    try {
      const normalized = await normalizeImageFile(file);
      const storagePath = getLiveTeamUploadPath(normalized);
      const { error } = await supabase.storage
        .from(LIVE_TEAM_BUCKET)
        .upload(storagePath, normalized, {
          contentType: normalized.type || "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });

      if (error) throw error;

      const objectUrl = URL.createObjectURL(normalized);
      setForm((current) => ({
        ...current,
        photo_url: storagePath,
        storage_path: storagePath,
        display_url: objectUrl,
      }));
      toast.success("Foto enviada");
    } catch (e) {
      toast.error(adminErrorMessage(e, "Falha ao enviar foto"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadHighlightImage(file: File) {
    setSaving(true);
    try {
      const normalized = await normalizeImageFile(file);
      const storagePath = `highlights/${getLiveTeamUploadPath(normalized)}`;
      const { error } = await supabase.storage
        .from(LIVE_TEAM_BUCKET)
        .upload(storagePath, normalized, {
          contentType: normalized.type || "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });

      if (error) throw error;

      const objectUrl = URL.createObjectURL(normalized);
      setHighlightForm((current) => ({
        ...current,
        photo_url: storagePath,
        storage_path: storagePath,
        display_url: objectUrl,
      }));
      toast.success("Foto enviada");
    } catch (e) {
      toast.error(adminErrorMessage(e, "Falha ao enviar foto"));
    } finally {
      setSaving(false);
    }
  }

  async function saveCreate() {
    setSaving(true);
    try {
      await createLiveTeamMember({
        ...form,
        sort_order: nextSortOrder(form.category),
      });
      toast.success("Card criado");
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel criar o card"));
    } finally {
      setSaving(false);
    }
  }

  function hasActiveHighlightConflict(
    candidate: typeof EMPTY_HIGHLIGHT_FORM,
    currentId?: string | null,
  ) {
    if (!candidate.is_active) return false;
    return highlights.some(
      (item) =>
        item.id !== currentId &&
        item.is_active &&
        item.ranking_type === candidate.ranking_type &&
        item.position === candidate.position &&
        item.month === candidate.month &&
        item.year === candidate.year,
    );
  }

  async function saveHighlightCreate() {
    if (hasActiveHighlightConflict(highlightForm)) {
      toast.error("Já existe destaque ativo nesta posição, tipo e mês.");
      return;
    }
    setSaving(true);
    try {
      await createMonthlyHighlight(highlightForm);
      toast.success("Destaque criado");
      setHighlightCreateOpen(false);
      setHighlightForm(EMPTY_HIGHLIGHT_FORM);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel criar o destaque"));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    try {
      await updateLiveTeamMember(selected.id, form);
      toast.success("Card atualizado");
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel salvar"));
    } finally {
      setSaving(false);
    }
  }

  async function saveHighlightEdit() {
    if (!selectedHighlight) return;
    if (hasActiveHighlightConflict(highlightForm, selectedHighlight.id)) {
      toast.error("Já existe destaque ativo nesta posição, tipo e mês.");
      return;
    }
    setSaving(true);
    try {
      await updateMonthlyHighlight(selectedHighlight.id, highlightForm);
      toast.success("Destaque atualizado");
      setHighlightEditOpen(false);
      setSelectedHighlight(null);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel salvar o destaque"));
    } finally {
      setSaving(false);
    }
  }

  function nextSortOrder(category: LiveTeamCategory) {
    const categoryItems = items.filter((item) => item.category === category);
    return Math.max(0, ...categoryItems.map((item) => item.sort_order ?? 0)) + 1;
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM, sort_order: nextSortOrder("host") });
    setCreateOpen(true);
  }

  function openEdit(item: LiveTeamMember) {
    setSelected(item);
    setForm({
      name: item.name,
      role_title: item.role_title,
      category: item.category,
      chip_text: item.chip_text ?? "",
      tiktok_url: item.tiktok_url ?? "",
      photo_url: item.photo_url,
      storage_path: item.storage_path,
      display_url: item.photo_url,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setEditOpen(true);
  }

  function openHighlightCreate(type: LiveHighlightType = "viewer") {
    setHighlightForm({ ...EMPTY_HIGHLIGHT_FORM, ranking_type: type });
    setHighlightCreateOpen(true);
  }

  function openHighlightEdit(item: LiveMonthlyHighlight) {
    setSelectedHighlight(item);
    setHighlightForm({
      ranking_type: item.ranking_type,
      position: item.position,
      name: item.name,
      chip_text: item.chip_text ?? "",
      tiktok_url: item.tiktok_url ?? "",
      photo_url: item.photo_url ?? "",
      storage_path: item.storage_path,
      display_url: item.photo_url ?? "",
      month: item.month,
      year: item.year,
      is_active: item.is_active,
    });
    setHighlightEditOpen(true);
  }

  if (!authLoading && !user) return <Navigate to="/auth/login" />;
  if (!authLoading && !canAccess) return <Navigate to="/admin" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminTopNav compact />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Admin
          </Link>
        </Button>

        <section className="overflow-hidden rounded-3xl border bg-gradient-to-r from-zinc-950 via-rose-950 to-zinc-900 p-6 text-white shadow-elegant sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Users className="h-8 w-8" />
                <h1 className="text-3xl font-bold sm:text-4xl">Equipe da Live</h1>
              </div>
              <p className="max-w-2xl text-sm text-white/80">
                Gerencie os cards da home oficial da Caren e organize host, administradores,
                moderadores e midia.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={openCreate}
              className="bg-white text-black hover:bg-white/90"
            >
              <Plus className="mr-2 h-5 w-5" />
              Novo Card
            </Button>
          </div>
        </section>

        <div className="my-6 rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, funcao ou chip..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Arraste cards dentro da mesma categoria para reorganizar. A ordem e salva
            automaticamente.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            Carregando equipe da live...
          </div>
        ) : (
          <div className="space-y-8">
            {LIVE_TEAM_CATEGORIES.map((category) => {
              const categoryItems = filtered.filter((item) => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <section key={category} className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold">{LIVE_TEAM_CATEGORY_LABELS[category]}</h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {categoryItems.map((item) => {
                      const sameCategory = items.filter(
                        (member) => member.category === item.category,
                      );
                      const categoryIndex = sameCategory.findIndex(
                        (member) => member.id === item.id,
                      );
                      const dragDisabled = Boolean(search.trim()) || ordering;

                      return (
                        <Card
                          key={item.id}
                          draggable={!dragDisabled}
                          onDragStart={(event) => {
                            if (dragDisabled) return;
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", item.id);
                            setDraggingId(item.id);
                          }}
                          onDragOver={(event) => {
                            if (dragDisabled || !draggingId || draggingId === item.id) return;
                            const dragged = items.find((member) => member.id === draggingId);
                            if (dragged?.category !== item.category) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            setDragOverId(item.id);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleDropOn(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverId(null);
                          }}
                          className={`overflow-hidden transition ${
                            draggingId === item.id ? "opacity-60" : ""
                          } ${dragOverId === item.id ? "ring-2 ring-[var(--rose)]" : ""}`}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <button
                              type="button"
                              className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-sm backdrop-blur transition ${
                                dragDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-grab active:cursor-grabbing"
                              }`}
                              aria-label="Arrastar card para ordenar"
                              disabled={dragDisabled}
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <div className="absolute left-3 top-3 flex gap-2">
                              <Badge
                                className={item.is_active ? "bg-green-600 text-white" : ""}
                                variant={item.is_active ? "default" : "secondary"}
                              >
                                {item.is_active ? "Ativo" : "Oculto"}
                              </Badge>
                              {item.chip_text && (
                                <Badge className="bg-[#ff4f68] text-white">{item.chip_text}</Badge>
                              )}
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 text-white">
                              <h3 className="line-clamp-1 text-xl font-black">{item.name}</h3>
                              <p className="line-clamp-1 text-sm text-white/72">
                                {item.role_title}
                              </p>
                            </div>
                          </div>

                          <CardContent className="space-y-4 p-5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                Ordem {item.sort_order}
                              </span>
                              {item.tiktok_url && (
                                <a
                                  href={item.tiktok_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--rose)] hover:underline"
                                >
                                  <Music2 className="h-3.5 w-3.5" /> TikTok
                                </a>
                              )}
                            </div>

                            <div className="grid grid-cols-6 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={dragDisabled || categoryIndex <= 0}
                                onClick={() => moveByButton(item.id, -1)}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  dragDisabled ||
                                  categoryIndex < 0 ||
                                  categoryIndex >= sameCategory.length - 1
                                }
                                onClick={() => moveByButton(item.id, 1)}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await updateLiveTeamMember(item.id, {
                                    is_active: !item.is_active,
                                  });
                                  await load();
                                }}
                              >
                                {item.is_active ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="col-span-2"
                                onClick={async () => {
                                  if (!confirm("Excluir este card da live?")) return;
                                  await deleteLiveTeamMember(item);
                                  toast.success("Card excluido");
                                  await load();
                                }}
                              >
                                <Trash2 className="mr-1 h-4 w-4" /> Excluir
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-10 space-y-5 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Award className="h-7 w-7 text-[var(--rose)]" />
                <h2 className="text-2xl font-bold">Top 3 do mês</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Cadastre os destaques da home em Telespectadores e Presenteadores. Cada tipo aceita
                as posições 1, 2 e 3 por mês.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => openHighlightCreate("viewer")}>
                <Plus className="mr-2 h-4 w-4" />
                Telespectador
              </Button>
              <Button onClick={() => openHighlightCreate("gifter")}>
                <Plus className="mr-2 h-4 w-4" />
                Presenteador
              </Button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {LIVE_HIGHLIGHT_TYPES.map((type) => {
              const typeItems = highlights.filter((item) => item.ranking_type === type);
              return (
                <div key={type} className="rounded-2xl border bg-background/45 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-bold">{LIVE_HIGHLIGHT_TYPE_LABELS[type]}</h3>
                    <Badge variant="secondary">
                      {typeItems.filter((item) => item.is_active).length} ativos
                    </Badge>
                  </div>

                  {typeItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Nenhum destaque cadastrado ainda.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {typeItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-2xl border bg-card p-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--rose)] text-sm font-black text-white">
                            {item.position}
                          </div>
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                            {item.photo_url ? (
                              <img
                                src={item.photo_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-muted-foreground">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{item.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.chip_text || "Sem chip"} · {item.month}/{item.year}
                            </p>
                          </div>
                          <Badge variant={item.is_active ? "default" : "secondary"}>
                            {item.is_active ? "Ativo" : "Oculto"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openHighlightEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await updateMonthlyHighlight(item.id, {
                                is_active: !item.is_active,
                              });
                              await load();
                            }}
                          >
                            {item.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (!confirm("Excluir este destaque do mês?")) return;
                              await deleteMonthlyHighlight(item);
                              toast.success("Destaque excluido");
                              await load();
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <LiveTeamDialog
          open={createOpen}
          title="Novo Card da Live"
          form={form}
          saving={saving}
          onOpenChange={setCreateOpen}
          onFormChange={setForm}
          onUpload={uploadImage}
          onSave={saveCreate}
          saveLabel="Criar Card"
        />
        <LiveTeamDialog
          open={editOpen}
          title="Editar Card da Live"
          form={form}
          saving={saving}
          onOpenChange={setEditOpen}
          onFormChange={setForm}
          onUpload={uploadImage}
          onSave={saveEdit}
          saveLabel="Salvar Alteracoes"
        />
        <MonthlyHighlightDialog
          open={highlightCreateOpen}
          title="Novo Destaque do Mês"
          form={highlightForm}
          saving={saving}
          onOpenChange={setHighlightCreateOpen}
          onFormChange={setHighlightForm}
          onUpload={uploadHighlightImage}
          onSave={saveHighlightCreate}
          saveLabel="Criar Destaque"
        />
        <MonthlyHighlightDialog
          open={highlightEditOpen}
          title="Editar Destaque do Mês"
          form={highlightForm}
          saving={saving}
          onOpenChange={setHighlightEditOpen}
          onFormChange={setHighlightForm}
          onUpload={uploadHighlightImage}
          onSave={saveHighlightEdit}
          saveLabel="Salvar Destaque"
        />
      </main>
    </div>
  );
}

function LiveTeamDialog({
  open,
  title,
  form,
  saving,
  onOpenChange,
  onFormChange,
  onUpload,
  onSave,
  saveLabel,
}: {
  open: boolean;
  title: string;
  form: typeof EMPTY_FORM;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: typeof EMPTY_FORM) => void;
  onUpload: (file: File) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  const canSave = form.name.trim() && form.role_title.trim() && form.photo_url.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo/Função</Label>
              <Input
                value={form.role_title}
                onChange={(e) => onFormChange({ ...form, role_title: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  onFormChange({ ...form, category: value as LiveTeamCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIVE_TEAM_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {LIVE_TEAM_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chip</Label>
              <Input
                placeholder="Ex: Apresentadora"
                value={form.chip_text}
                onChange={(e) => onFormChange({ ...form, chip_text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="text" inputMode="decimal"
                value={form.sort_order}
                onChange={(e) => onFormChange({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link do TikTok</Label>
            <Input
              placeholder="https://www.tiktok.com/@usuario ou @usuario"
              value={form.tiktok_url}
              onChange={(e) => onFormChange({ ...form, tiktok_url: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Foto do card</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition hover:bg-muted/50">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="font-medium">Clique para enviar foto</span>
              <span className="text-sm text-muted-foreground">JPG, PNG, WEBP ou HEIC</span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                }}
              />
            </label>
            {(form.display_url || form.photo_url) && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
                <img
                  src={form.display_url || form.photo_url}
                  alt="Preview do card"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-lg font-black">{form.name || "Nome"}</p>
                  <p className="text-sm text-white/70">{form.role_title || "Cargo/Função"}</p>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center justify-between rounded-xl border bg-card/50 p-4">
            <span className="text-sm font-medium">Ativo na home</span>
            <Switch
              checked={form.is_active}
              onCheckedChange={(value) => onFormChange({ ...form, is_active: value })}
            />
          </label>

          <Button disabled={saving || !canSave} onClick={onSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MonthlyHighlightDialog({
  open,
  title,
  form,
  saving,
  onOpenChange,
  onFormChange,
  onUpload,
  onSave,
  saveLabel,
}: {
  open: boolean;
  title: string;
  form: typeof EMPTY_HIGHLIGHT_FORM;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: typeof EMPTY_HIGHLIGHT_FORM) => void;
  onUpload: (file: File) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  const canSave = form.name.trim() && form.position >= 1 && form.position <= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de ranking</Label>
              <Select
                value={form.ranking_type}
                onValueChange={(value) =>
                  onFormChange({ ...form, ranking_type: value as LiveHighlightType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIVE_HIGHLIGHT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LIVE_HIGHLIGHT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Posição</Label>
              <Select
                value={String(form.position)}
                onValueChange={(value) =>
                  onFormChange({ ...form, position: Number(value) as 1 | 2 | 3 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º lugar</SelectItem>
                  <SelectItem value="2">2º lugar</SelectItem>
                  <SelectItem value="3">3º lugar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Chip personalizado</Label>
              <Input
                placeholder="Ex: Presença marcante"
                value={form.chip_text}
                onChange={(e) => onFormChange({ ...form, chip_text: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Input
                type="text" inputMode="decimal"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => onFormChange({ ...form, month: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input
                type="text" inputMode="decimal"
                min={2026}
                value={form.year}
                onChange={(e) => onFormChange({ ...form, year: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link do TikTok</Label>
            <Input
              placeholder="https://www.tiktok.com/@usuario ou @usuario"
              value={form.tiktok_url}
              onChange={(e) => onFormChange({ ...form, tiktok_url: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Foto do destaque</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition hover:bg-muted/50">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="font-medium">Clique para enviar foto</span>
              <span className="text-sm text-muted-foreground">JPG, PNG, WEBP ou HEIC</span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                }}
              />
            </label>
            {(form.display_url || form.photo_url) && (
              <div className="relative overflow-hidden rounded-2xl border bg-muted p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={form.display_url || form.photo_url}
                    alt="Preview do destaque"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-lg font-black">{form.name || "Nome"}</p>
                    <p className="text-sm text-muted-foreground">
                      {LIVE_HIGHLIGHT_TYPE_LABELS[form.ranking_type]} · {form.position}º lugar
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center justify-between rounded-xl border bg-card/50 p-4">
            <span className="text-sm font-medium">Ativo na home</span>
            <Switch
              checked={form.is_active}
              onCheckedChange={(value) => onFormChange({ ...form, is_active: value })}
            />
          </label>

          <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
            A home exibe somente destaques ativos do mês atual. Não cadastre duas pessoas na mesma
            posição do mesmo tipo e mês.
          </div>

          <Button disabled={saving || !canSave} onClick={onSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
