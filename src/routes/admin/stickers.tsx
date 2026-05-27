import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCategories,
  fetchStickers,
  uploadStickerFile,
  deleteSticker,
  type Sticker,
  type StickerCategory,
} from "@/lib/stickers";
import { Plus, Trash2, Upload, Pencil, Check, X, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/stickers")({ component: StickersAdmin });

function StickersAdmin() {
  const { user, role, loading, rolesLoaded } = useAuth();
  const isSuperAdmin = role === "super_admin";

  const [cats, setCats] = useState<StickerCategory[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingStickerId, setEditingStickerId] = useState<string | null>(null);
  const [editingStickerName, setEditingStickerName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCat, setDragOverCat] = useState<string | "none" | null>(null);

  async function reload() {
    try {
      const [c, s] = await Promise.all([fetchCategories(), fetchStickers()]);
      setCats(c);
      setStickers(s);
      if (!activeCat && c.length > 0) setActiveCat(c[0].id);
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? "Erro ao carregar stickers");
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) return;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const filtered = useMemo(
    () => stickers.filter((s) => (activeCat ? s.category_id === activeCat : s.category_id === null)),
    [stickers, activeCat]
  );

  if (loading || (user && !rolesLoaded)) return null;
  if (!user) return <Navigate to="/auth/login" />;
  if (!isSuperAdmin) return <Navigate to="/admin" />;

  async function createCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setBusy(true);
    const { error } = await supabase.from("sticker_categories").insert({ name, slug });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setNewCatName("");
    toast.success("Categoria criada");
    await reload();
  }

  async function renameCategory(id: string) {
    const name = editingCatName.trim();
    if (!name) return;
    const { error } = await supabase.from("sticker_categories").update({ name }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingCatId(null);
    setEditingCatName("");
    await reload();
  }

  async function removeCategory(id: string) {
    if (!confirm("Excluir esta categoria? Os stickers ficarão sem categoria.")) return;
    const { error } = await supabase.from("sticker_categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (activeCat === id) setActiveCat(null);
    await reload();
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      if (!["image/webp", "image/png", "image/gif"].includes(f.type)) {
        toast.error(`${f.name}: formato não suportado (use WEBP ou PNG).`);
        continue;
      }
      if (f.size > 1024 * 1024) {
        toast.error(`${f.name}: arquivo maior que 1MB.`);
        continue;
      }
      try {
        await uploadStickerFile(f, activeCat, f.name.replace(/\.[^.]+$/, ""));
        ok++;
      } catch (e: unknown) {
        toast.error(`${f.name}: ${(e as Error)?.message ?? "falhou"}`);
      }
    }
    setBusy(false);
    if (ok > 0) toast.success(`${ok} sticker(s) enviados`);
    if (fileRef.current) fileRef.current.value = "";
    await reload();
  }

  async function toggleActive(s: Sticker) {
    const { error } = await supabase.from("stickers").update({ active: !s.active }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    setStickers((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !s.active } : x)));
  }

  async function renameSticker(id: string) {
    const name = editingStickerName.trim();
    if (!name) return;
    const { error } = await supabase.from("stickers").update({ name }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingStickerId(null);
    setEditingStickerName("");
    await reload();
  }

  async function removeSticker(s: Sticker) {
    if (!confirm(`Excluir sticker "${s.name}"?`)) return;
    try {
      await deleteSticker(s);
      setStickers((prev) => prev.filter((x) => x.id !== s.id));
      toast.success("Sticker excluído");
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? "Erro ao excluir");
    }
  }

  async function moveStickerToCategory(stickerId: string, categoryId: string | null) {
    const sticker = stickers.find((x) => x.id === stickerId);
    if (!sticker) return;
    if (sticker.category_id === categoryId) return;
    // optimistic update
    setStickers((prev) => prev.map((x) => (x.id === stickerId ? { ...x, category_id: categoryId } : x)));
    const { error } = await supabase.from("stickers").update({ category_id: categoryId }).eq("id", stickerId);
    if (error) {
      toast.error(error.message);
      // revert
      setStickers((prev) => prev.map((x) => (x.id === stickerId ? { ...x, category_id: sticker.category_id } : x)));
      return;
    }
    const target = categoryId ? cats.find((c) => c.id === categoryId)?.name ?? "categoria" : "Sem categoria";
    toast.success(`Movido para ${target}`);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">Stickers</h1>
            <p className="text-sm text-muted-foreground">Gerencie a biblioteca usada no chat global</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Categories */}
          <aside className="space-y-3 rounded-2xl border border-border bg-card/40 p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void createCategory(); }}
              />
              <Button onClick={createCategory} disabled={busy || !newCatName.trim()} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveCat(null)}
                  onDragOver={(e) => { if (draggingId) { e.preventDefault(); setDragOverCat("none"); } }}
                  onDragLeave={() => setDragOverCat((v) => (v === "none" ? null : v))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/sticker-id") || draggingId;
                    setDragOverCat(null);
                    if (id) void moveStickerToCategory(id, null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${activeCat === null ? "bg-primary/10 font-semibold text-primary" : "hover:bg-accent"} ${dragOverCat === "none" ? "ring-2 ring-primary/60 bg-primary/5" : ""}`}
                >
                  Sem categoria
                  <span className="text-xs text-muted-foreground">{stickers.filter((s) => !s.category_id).length}</span>
                </button>
              </li>
              {cats.map((c) => {
                const count = stickers.filter((s) => s.category_id === c.id).length;
                const editing = editingCatId === c.id;
                return (
                  <li key={c.id} className="group">
                    {editing ? (
                      <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1">
                        <Input
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          autoFocus
                          className="h-8"
                        />
                        <Button size="icon" variant="ghost" onClick={() => renameCategory(c.id)}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingCatId(null); setEditingCatName(""); }}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { if (draggingId) { e.preventDefault(); setDragOverCat(c.id); } }}
                        onDragLeave={() => setDragOverCat((v) => (v === c.id ? null : v))}
                        onDrop={(e) => {
                          e.preventDefault();
                          const id = e.dataTransfer.getData("text/sticker-id") || draggingId;
                          setDragOverCat(null);
                          if (id) void moveStickerToCategory(id, c.id);
                        }}
                        className={`flex items-center rounded-lg transition ${activeCat === c.id ? "bg-primary/10" : "hover:bg-accent"} ${dragOverCat === c.id ? "ring-2 ring-primary/60 bg-primary/5" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveCat(c.id)}
                          className={`flex flex-1 items-center justify-between px-3 py-2 text-sm ${activeCat === c.id ? "font-semibold text-primary" : ""}`}
                        >
                          {c.name}
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); }}
                          className="px-2 opacity-0 transition group-hover:opacity-100"
                          aria-label="Renomear"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategory(c.id)}
                          className="px-2 opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Stickers grid */}
          <section className="space-y-4 rounded-2xl border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{activeCat ? cats.find((c) => c.id === activeCat)?.name ?? "Categoria" : "Sem categoria"}</h2>
                <p className="text-xs text-muted-foreground">{filtered.length} sticker(s) · WEBP, PNG (até 1MB)</p>
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/webp,image/png,image/gif"
                  onChange={(e) => onFiles(e.target.files)}
                  className="hidden"
                />
                <Button onClick={() => fileRef.current?.click()} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Enviar stickers
                </Button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                Nenhum sticker nesta categoria. Envie alguns acima.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {filtered.map((s) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingId(s.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/sticker-id", s.id);
                    }}
                    onDragEnd={() => { setDraggingId(null); setDragOverCat(null); }}
                    className={`group relative flex cursor-grab flex-col items-center gap-1 rounded-xl border border-border bg-background/60 p-2 active:cursor-grabbing ${!s.active ? "opacity-50" : ""} ${draggingId === s.id ? "opacity-40" : ""}`}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted/30 p-2">
                      <img src={s.public_url} alt={s.name} loading="lazy" className="h-full w-full object-contain" />
                    </div>
                    {editingStickerId === s.id ? (
                      <div className="flex w-full items-center gap-1">
                        <Input
                          value={editingStickerName}
                          onChange={(e) => setEditingStickerName(e.target.value)}
                          autoFocus
                          className="h-7 text-xs"
                        />
                        <Button size="icon" variant="ghost" onClick={() => renameSticker(s.id)}><Check className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingStickerId(s.id); setEditingStickerName(s.name); }}
                        className="line-clamp-1 w-full text-center text-xs text-muted-foreground hover:text-foreground"
                        title={s.name}
                      >
                        {s.name}
                      </button>
                    )}
                    <div className="flex w-full items-center justify-between pt-1">
                      <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} aria-label="Ativo" />
                      <button
                        type="button"
                        onClick={() => removeSticker(s)}
                        className="rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Excluir sticker"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}