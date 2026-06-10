import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import {
  createNameGradient,
  deleteNameGradient,
  fetchAllNameGradientsAdmin,
  nameGradientStyle,
  updateNameGradient,
  type NameGradient,
} from "@/lib/nameGradients";

export const Route = createFileRoute("/admin/gradientes-nome")({
  component: NameGradientsAdminPage,
});

const DEFAULT_FORM = {
  name: "",
  color_a: "#ff4f68",
  color_b: "#7c3aed",
  price: "120",
  sort_order: "0",
  is_active: true,
};

function NameGradientsAdminPage() {
  const { user, isAdmin, role, loading } = useAuth();
  const canManage = isAdmin || role === "super_admin";
  const [items, setItems] = useState<NameGradient[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editing, setEditing] = useState<NameGradient | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setItems(await fetchAllNameGradientsAdmin());
  };

  useEffect(() => {
    if (canManage) load().catch(() => toast.error("Nao foi possivel carregar gradientes"));
  }, [canManage]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (!loading && !canManage) return <Navigate to="/inicio" />;

  const startEdit = (item: NameGradient) => {
    setEditing(item);
    setForm({
      name: item.name,
      color_a: item.color_a,
      color_b: item.color_b,
      price: String(item.price),
      sort_order: String(item.sort_order),
      is_active: item.is_active,
    });
  };

  const reset = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Informe o nome do gradiente");
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        color_a: form.color_a,
        color_b: form.color_b,
        price: Math.max(0, Number(form.price) || 0),
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };
      if (editing) await updateNameGradient(editing.id, payload);
      else await createNameGradient(payload);
      toast.success(editing ? "Gradiente atualizado" : "Gradiente criado");
      reset();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminTopNav compact />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-[#111f3f] to-slate-900 p-6 text-white shadow-elegant sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#ff9aac]">
            <Sparkles className="h-3.5 w-3.5" /> Produto premium
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">Gradientes no nome</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Cadastre duas cores, defina valor em moedas e veja o preview em tempo real.
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-lg font-black">
              {editing ? (
                <Save className="h-5 w-5 text-[var(--rose)]" />
              ) : (
                <Plus className="h-5 w-5 text-[var(--rose)]" />
              )}
              {editing ? "Editar gradiente" : "Novo gradiente"}
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cor inicial</Label>
                  <Input
                    type="color"
                    value={form.color_a}
                    onChange={(e) => setForm({ ...form, color_a: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cor final</Label>
                  <Input
                    type="color"
                    value={form.color_b}
                    onChange={(e) => setForm({ ...form, color_b: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border bg-muted/30 p-3">
                <Label>Ativo na loja</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
              <div className="rounded-2xl border bg-background p-4 text-center">
                <p className="text-xs text-muted-foreground">Preview</p>
                <p className="mt-2 text-3xl font-black" style={nameGradientStyle(form)}>
                  Nome em destaque
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={save} disabled={busy}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar
                </Button>
                {editing && (
                  <Button variant="outline" onClick={reset}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-3xl border bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black" style={nameGradientStyle(item)}>
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.price} moedas · {item.is_active ? "ativo" : "inativo"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={async () => {
                        await deleteNameGradient(item.id);
                        await load();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
