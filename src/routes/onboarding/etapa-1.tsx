import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BR_STATES } from "@/lib/constants";
import { Camera } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(18).max(110),
  height_cm: z.coerce.number().int().min(120).max(230).optional(),
  sex: z.enum(["masculino", "feminino"]),
  marital: z.enum(["solteiro", "divorciado"]),
  city: z.string().trim().min(2).max(80),
  state: z.string().length(2),
  church: z.string().trim().min(2).max(120),
  years_baptized: z.coerce.number().int().min(0).max(100),
  bio: z.string().trim().max(600).optional(),
});

export const Route = createFileRoute("/onboarding/etapa-1")({ component: Etapa1 });

function Etapa1() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "", age: "", height_cm: "", sex: "" as "" | "masculino" | "feminino",
    marital: "" as "" | "solteiro" | "divorciado", city: "", state: "",
    church: "", years_baptized: "", bio: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          full_name: data.full_name ?? "", age: String(data.age ?? ""),
          height_cm: data.height_cm ? String(data.height_cm) : "",
          sex: data.sex ?? "", marital: data.marital ?? "",
          city: data.city ?? "", state: data.state ?? "",
          church: data.church ?? "", years_baptized: String(data.years_baptized ?? ""),
          bio: data.bio ?? "",
        });
        if (data.photo_url) setPhotoPreview(data.photo_url);
      }
    });
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) { toast.error("Foto até 5MB"); return; }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    // Foto de perfil é obrigatória para cadastro.
    if (!photoFile && !photoPreview) {
      toast.error("Adicione uma foto de perfil para continuar. Ela é obrigatória.");
      // Foca o seletor de foto
      document.getElementById("profile-photo-input")?.click();
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);

    let photo_url: string | undefined;
    if (photoFile) {
      const rawExt = (photoFile.name.split(".").pop() ?? "").toLowerCase();
      const allowed = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
      const ext = allowed.includes(rawExt) ? rawExt : "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("profile-photos")
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type || "image/jpeg", cacheControl: "3600" });
      if (upErr) {
        toast.error(`Falha ao enviar foto: ${upErr.message}`);
        setSubmitting(false);
        return;
      }
      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      photo_url = `${pub.publicUrl}?t=${Date.now()}`;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...parsed.data,
      ...(photo_url ? { photo_url } : {}),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Etapa 1 concluída!");
    navigate({ to: "/onboarding/etapa-2" });
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--rose)]">Etapa 1 de 2</p>
          <h1 className="mt-2 text-4xl font-semibold">Sobre você</h1>
          <Progress value={50} className="mt-4 h-1.5" />
        </div>

        <form onSubmit={handleSubmit} className="glass animate-fade-up space-y-6 rounded-3xl p-8 shadow-elegant">
          <div className="flex flex-col items-center gap-3">
            <label
              htmlFor="profile-photo-input"
              className={`group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed bg-card/60 shadow-soft transition ${photoPreview ? "border-[var(--rose-soft)] hover:border-[var(--rose)]" : "border-destructive/60 hover:border-destructive"}`}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                  <Camera className="h-6 w-6" />
                  <span className="mt-1 text-xs">Foto</span>
                </div>
              )}
              <input id="profile-photo-input" type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Foto de perfil obrigatória</span> · Clique para enviar (até 5MB)
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome completo</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Idade</Label>
              <Input type="number" min={18} max={110} value={form.age} onChange={(e) => set("age", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input type="number" min={120} max={230} value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={form.sex} onValueChange={(v) => set("sex", v as "masculino" | "feminino")}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado civil</Label>
              <Select value={form.marital} onValueChange={(v) => set("marital", v as "solteiro" | "divorciado")}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {BR_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Igreja que frequenta</Label>
              <Input value={form.church} onChange={(e) => set("church", e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Quantos anos de batismo</Label>
              <Input type="number" min={0} max={100} value={form.years_baptized} onChange={(e) => set("years_baptized", e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Breve descrição pessoal</Label>
              <Textarea rows={4} maxLength={600} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Conte um pouco sobre você, sua fé e seus sonhos..." />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      </main>
    </div>
  );
}
