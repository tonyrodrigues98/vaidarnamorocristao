import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AvatarAgeRange, AvatarPoseKey } from "@/types/avatar";

export const Route = createFileRoute("/avatar/criar")({
  component: AvatarCreatePage,
});

type Gender = "masculino" | "feminino";

type Base = {
  id: string;
  gender: string;
  image_url: string;
  body_type: string;
  pose_key: string;
  skin_tone: string;
};

const AGE_OPTIONS: { key: AvatarAgeRange; label: string; desc: string }[] = [
  { key: "20-35", label: "20 – 35 anos", desc: "Jovem adulto. Visual padrão e vibrante." },
  {
    key: "36-50",
    label: "36 – 50 anos",
    desc: "Adulto maduro. Em breve traços sutis de maturidade.",
  },
  {
    key: "50+",
    label: "50+ anos",
    desc: "Idade avançada. Em breve cabelos grisalhos e traços marcantes.",
  },
];

const SKIN_OPTIONS: { key: string; label: string; swatch: string }[] = [
  { key: "porcelain", label: "Porcelana", swatch: "#F9E2D0" },
  { key: "light", label: "Clara", swatch: "#EFC9A4" },
  { key: "default", label: "Padrão", swatch: "#F2CDA0" },
  { key: "tan", label: "Bronzeada", swatch: "#C99368" },
  { key: "olive", label: "Oliva", swatch: "#B68A5A" },
  { key: "brown", label: "Marrom", swatch: "#8A5A3B" },
  { key: "deep", label: "Profunda", swatch: "#4E2E1E" },
];

const BODY_OPTIONS: { key: string; label: string; desc: string }[] = [
  { key: "default", label: "Padrão", desc: "Equilibrado" },
  { key: "slim", label: "Magro", desc: "Mais esguio" },
  { key: "muscular", label: "Musculoso", desc: "Mais definido" },
  { key: "overweight", label: "Acima do peso", desc: "Mais robusto" },
];

const POSE_OPTIONS: { key: AvatarPoseKey; label: string; pose_key: string }[] = [
  { key: "standing_default", label: "Em pé", pose_key: "standing_default" },
  { key: "elegant", label: "Elegante", pose_key: "elegant" },
  { key: "praying", label: "Em oração", pose_key: "praying" },
  { key: "waving", label: "Acenando", pose_key: "waving" },
  { key: "holding_heart", label: "Com coração", pose_key: "holding_heart" },
];

const STEPS = ["Nome", "Gênero", "Idade", "Pele", "Corpo", "Pose", "Confirmar"] as const;
const LAST_STEP = STEPS.length - 1;

const nameSchema = z.string().trim().min(2, "Nome muito curto").max(40, "Nome muito longo");

function findBase(
  bases: Base[],
  gender: Gender,
  body: string,
  pose: string,
  skin: string,
): Base | null {
  return (
    bases.find(
      (b) =>
        b.gender === gender && b.body_type === body && b.pose_key === pose && b.skin_tone === skin,
    ) ??
    bases.find((b) => b.gender === gender && b.body_type === body && b.pose_key === pose) ??
    bases.find(
      (b) => b.gender === gender && b.body_type === "default" && b.pose_key === "standing_default",
    ) ??
    bases.find((b) => b.gender === gender) ??
    null
  );
}

function AvatarCreatePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingBases, setLoadingBases] = useState(true);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("masculino");
  const [ageRange, setAgeRange] = useState<AvatarAgeRange>("20-35");
  const [skinTone, setSkinTone] = useState<string>("default");
  const [bodyType, setBodyType] = useState<string>("default");
  const [pose, setPose] = useState<string>("standing_default");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [basesRes, profileRes, existingRes] = await Promise.all([
        supabase.from("avatar_bases").select("*").eq("is_active", true),
        supabase.from("profiles").select("sex, full_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_avatar_base").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setBases((basesRes.data ?? []) as Base[]);

      // Pre-fill from profile and any existing avatar choice
      const profileSex = (profileRes.data?.sex as string | undefined)?.toLowerCase();
      const guessedGender: Gender =
        profileSex === "f" || profileSex === "feminino" || profileSex === "mulher"
          ? "feminino"
          : "masculino";
      const existing = existingRes.data as {
        avatar_name?: string | null;
        skin_tone?: string | null;
        age_range?: string | null;
        base_id?: string | null;
      } | null;

      setName(existing?.avatar_name || profileRes.data?.full_name || "");
      setSkinTone(existing?.skin_tone ?? "default");
      setAgeRange((existing?.age_range as AvatarAgeRange) ?? "20-35");

      if (existing?.base_id) {
        const found = (basesRes.data ?? []).find((b: Base) => b.id === existing.base_id);
        if (found) {
          setGender(found.gender as Gender);
          setBodyType(found.body_type);
          setPose(found.pose_key);
        } else {
          setGender(guessedGender);
        }
      } else {
        setGender(guessedGender);
      }
      setLoadingBases(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const previewBase = useMemo(
    () => findBase(bases, gender, bodyType, pose, skinTone),
    [bases, gender, bodyType, pose, skinTone],
  );

  if (!authLoading && !user) return <Navigate to="/auth/login" />;

  function next() {
    if (step === 0) {
      const parsed = nameSchema.safeParse(name);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
    }
    setStep((s) => Math.min(LAST_STEP, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleConfirm() {
    if (!user || !previewBase) return;
    setSubmitting(true);
    const { error } = await supabase.from("user_avatar_base").upsert(
      {
        user_id: user.id,
        base_id: previewBase.id,
        skin_tone: skinTone,
        age_range: ageRange,
        avatar_name: name.trim(),
      },
      { onConflict: "user_id" },
    );
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao salvar avatar: " + error.message);
      return;
    }
    toast.success("Avatar criado!");
    navigate({ to: "/avatar" });
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#FFF7F3] to-[#FFEEE6] pb-32">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={step === 0 ? () => navigate({ to: "/avatar" }) : back}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Passo {step + 1} de {STEPS.length} · {STEPS[step]}
            </p>
            <Progress value={progress} className="mt-1 h-1.5" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4">
        <PreviewCard base={previewBase} loading={loadingBases} />

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          {step === 0 && (
            <StepBlock title="Como vai se chamar?" desc="Esse nome aparece no seu avatar.">
              <Label htmlFor="avatar-name" className="text-xs">
                Nome do avatar
              </Label>
              <Input
                id="avatar-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lucas"
                maxLength={40}
                autoFocus
              />
            </StepBlock>
          )}

          {step === 1 && (
            <StepBlock title="Gênero" desc="Escolha o estilo do personagem.">
              <div className="grid grid-cols-2 gap-3">
                {(["masculino", "feminino"] as Gender[]).map((g) => (
                  <OptionCard
                    key={g}
                    label={g === "masculino" ? "Masculino" : "Feminino"}
                    active={gender === g}
                    onClick={() => setGender(g)}
                  />
                ))}
              </div>
            </StepBlock>
          )}

          {step === 2 && (
            <StepBlock title="Faixa etária" desc="Define a aparência geral do avatar.">
              <div className="flex flex-col gap-2">
                {AGE_OPTIONS.map((opt) => (
                  <OptionRow
                    key={opt.key}
                    label={opt.label}
                    desc={opt.desc}
                    active={ageRange === opt.key}
                    onClick={() => setAgeRange(opt.key)}
                  />
                ))}
              </div>
            </StepBlock>
          )}

          {step === 3 && (
            <StepBlock title="Tom de pele" desc="Escolha o tom que combina com você.">
              <div className="grid grid-cols-4 gap-3">
                {SKIN_OPTIONS.map((opt) => (
                  <SwatchCard
                    key={opt.key}
                    label={opt.label}
                    color={opt.swatch}
                    active={skinTone === opt.key}
                    onClick={() => setSkinTone(opt.key)}
                  />
                ))}
              </div>
            </StepBlock>
          )}

          {step === 4 && (
            <StepBlock title="Tipo de corpo" desc="Escolha o formato do avatar.">
              <div className="grid grid-cols-2 gap-3">
                {BODY_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.key}
                    label={opt.label}
                    sublabel={opt.desc}
                    active={bodyType === opt.key}
                    onClick={() => setBodyType(opt.key)}
                  />
                ))}
              </div>
            </StepBlock>
          )}

          {step === 5 && (
            <StepBlock title="Pose" desc="Como seu avatar vai aparecer.">
              <div className="grid grid-cols-2 gap-3">
                {POSE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.key}
                    label={opt.label}
                    active={pose === opt.pose_key}
                    onClick={() => setPose(opt.pose_key)}
                  />
                ))}
              </div>
            </StepBlock>
          )}

          {step === 6 && (
            <StepBlock title="Tudo certo?" desc="Confira e confirme seu avatar.">
              <ReviewList
                rows={[
                  ["Nome", name || "—"],
                  ["Gênero", gender === "masculino" ? "Masculino" : "Feminino"],
                  ["Idade", AGE_OPTIONS.find((o) => o.key === ageRange)?.label ?? "—"],
                  ["Pele", SKIN_OPTIONS.find((o) => o.key === skinTone)?.label ?? "—"],
                  ["Corpo", BODY_OPTIONS.find((o) => o.key === bodyType)?.label ?? "—"],
                  ["Pose", POSE_OPTIONS.find((o) => o.pose_key === pose)?.label ?? "—"],
                ]}
              />
              {!previewBase && (
                <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Não encontramos uma variação para essa combinação. Volte e ajuste.
                </p>
              )}
            </StepBlock>
          )}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={back}
              className="flex-1"
              disabled={submitting}
            >
              Voltar
            </Button>
          )}
          {step < 6 ? (
            <Button type="button" onClick={next} className="flex-1">
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !previewBase}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> Criar avatar
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({ base, loading }: { base: Base | null; loading: boolean }) {
  return (
    <div className="relative mx-auto flex aspect-[3/4] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-white to-[#FFE4D6] shadow-sm">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : base ? (
        <img
          src={base.image_url}
          alt="Pré-visualização do avatar"
          className="h-full w-full object-contain p-3"
        />
      ) : (
        <p className="px-4 text-center text-xs text-muted-foreground">Combinação indisponível</p>
      )}
    </div>
  );
}

function StepBlock({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-4 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function OptionCard({
  label,
  sublabel,
  active,
  onClick,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border p-4 text-left transition",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-white hover:border-primary/40",
      )}
    >
      {active && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{label}</p>
      {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
    </button>
  );
}

function OptionRow({
  label,
  desc,
  active,
  onClick,
}: {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border p-4 text-left transition",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-white hover:border-primary/40",
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      {active && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}

function SwatchCard({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition",
        active ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40",
      )}
    >
      <div
        className="h-12 w-12 rounded-full border border-black/10"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] font-medium text-foreground">{label}</span>
    </button>
  );
}

function ReviewList({ rows }: { rows: [string, string][] }) {
  return (
    <div className="divide-y rounded-2xl border bg-secondary/30">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">{k}</span>
          <span className="text-sm font-medium text-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}
