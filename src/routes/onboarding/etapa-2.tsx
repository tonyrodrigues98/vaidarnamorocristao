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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { BR_STATES } from "@/lib/constants";
import { v2FeatureFlags } from "@/v2/platform/feature-flags";

const schema = z
  .object({
    age_min: z.coerce.number().int().min(18).max(110),
    age_max: z.coerce.number().int().min(18).max(110),
    location_scope: z.enum(["regiao", "brasil", "mundo", "personalizado"]),
    custom_states: z.array(z.string()).default([]),
    desired_quality: z.string().trim().max(120).optional(),
    accepts_children: z.enum(["sim", "nao"]),
    looking_for_bio: z.string().trim().max(600).optional(),
  })
  .refine((d) => d.age_max >= d.age_min, {
    message: "Idade máxima deve ser maior",
    path: ["age_max"],
  });

export const Route = createFileRoute("/onboarding/etapa-2")({ component: Etapa2Route });

function Etapa2Route() {
  if (v2FeatureFlags.community) {
    return <Navigate to={v2FeatureFlags.dating ? "/onboarding/namoro" : "/inicio"} />;
  }
  return <Etapa2 />;
}

function Etapa2() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    age_min: "25",
    age_max: "45",
    location_scope: "brasil" as "regiao" | "brasil" | "mundo" | "personalizado",
    custom_states: [] as string[],
    desired_quality: "",
    accepts_children: "sim" as "sim" | "nao",
    looking_for_bio: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profile_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            age_min: String(data.age_min),
            age_max: String(data.age_max),
            location_scope: data.location_scope,
            custom_states: data.custom_states ?? [],
            desired_quality: data.desired_quality ?? "",
            accepts_children: data.accepts_children ? "sim" : "nao",
            looking_for_bio: data.looking_for_bio ?? "",
          });
        }
      });
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("profile_preferences").upsert({
      user_id: user.id,
      age_min: parsed.data.age_min,
      age_max: parsed.data.age_max,
      location_scope: parsed.data.location_scope,
      custom_states:
        parsed.data.location_scope === "personalizado" ? parsed.data.custom_states : [],
      desired_quality: parsed.data.desired_quality || null,
      accepts_children: parsed.data.accepts_children === "sim",
      looking_for_bio: parsed.data.looking_for_bio || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cadastro enviado para aprovação!");
    navigate({ to: "/inicio" });
  }

  const toggleState = (s: string) =>
    setForm((p) => ({
      ...p,
      custom_states: p.custom_states.includes(s)
        ? p.custom_states.filter((x) => x !== s)
        : [...p.custom_states, s],
    }));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--rose)]">Etapa 2 de 2</p>
          <h1 className="mt-2 text-4xl font-semibold">O que você busca</h1>
          <Progress value={100} className="mt-4 h-1.5" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass animate-fade-up space-y-6 rounded-3xl p-8 shadow-elegant"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Idade mínima</Label>
              <Input
                type="text" inputMode="decimal"
                min={18}
                max={110}
                value={form.age_min}
                onChange={(e) => setForm({ ...form, age_min: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Idade máxima</Label>
              <Input
                type="text" inputMode="decimal"
                min={18}
                max={110}
                value={form.age_max}
                onChange={(e) => setForm({ ...form, age_max: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Localização desejada</Label>
            <RadioGroup
              value={form.location_scope}
              onValueChange={(v) =>
                setForm({ ...form, location_scope: v as typeof form.location_scope })
              }
            >
              {[
                { v: "regiao", l: "Minha região" },
                { v: "brasil", l: "Qualquer lugar do Brasil" },
                { v: "mundo", l: "Qualquer lugar do mundo" },
                { v: "personalizado", l: "Personalizado (selecionar estados)" },
              ].map((o) => (
                <label
                  key={o.v}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card/40 p-3 transition hover:border-[var(--rose-soft)]"
                >
                  <RadioGroupItem value={o.v} />
                  <span className="text-sm">{o.l}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {form.location_scope === "personalizado" && (
            <div className="animate-fade-in space-y-2">
              <Label>Estados</Label>
              <div className="flex flex-wrap gap-2">
                {BR_STATES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleState(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      form.custom_states.includes(s)
                        ? "border-[var(--rose)] bg-[var(--rose)] text-white"
                        : "border-border bg-card/60 text-muted-foreground hover:border-[var(--rose-soft)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Uma qualidade que busca na pessoa</Label>
            <Input
              value={form.desired_quality}
              onChange={(e) => setForm({ ...form, desired_quality: e.target.value })}
              placeholder="Ex: temor a Deus, paciência, integridade..."
            />
          </div>

          <div className="space-y-3">
            <Label>Aceita pessoa com filhos?</Label>
            <RadioGroup
              value={form.accepts_children}
              onValueChange={(v) => setForm({ ...form, accepts_children: v as "sim" | "nao" })}
              className="flex gap-3"
            >
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card/40 p-3">
                <RadioGroupItem value="sim" /> Sim
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card/40 p-3">
                <RadioGroupItem value="nao" /> Não
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Breve descrição do que procura</Label>
            <Textarea
              rows={4}
              maxLength={600}
              value={form.looking_for_bio}
              onChange={(e) => setForm({ ...form, looking_for_bio: e.target.value })}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Enviando..." : "Concluir e enviar para aprovação"}
          </Button>
        </form>
      </main>
    </div>
  );
}
