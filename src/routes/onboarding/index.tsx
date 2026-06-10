import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  User as UserIcon,
  Users as UsersIcon,
  MapPin,
  Ruler,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/NumericInput";
import { PhotoImg } from "@/components/PhotoImg";
import { BioPromptChips } from "@/components/profile/BioPromptChips";
import { normalizeImageFile } from "@/lib/imageNormalize";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOnboardingDraft,
  setOnboardingDraft,
  clearOnboardingDraft,
} from "@/lib/onboardingDraft";
import {
  FAITH_MOMENT,
  CHURCH_FREQUENCY,
  SPIRITUAL_ROUTINE,
  WORSHIP_STYLE,
  SEEKING,
  PACE,
} from "@/lib/profileAdvanced";

export const Route = createFileRoute("/onboarding/")({ component: OnboardingFlow });

// 1-7 required, 8-12 optional, 13 = welcome
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
const REQUIRED_STEPS = 7;
const TOTAL_STEPS = 12;
const WELCOME_STEP: Step = 13;

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};
const UF_LIST = Object.keys(UF_NAMES).sort();

function OnboardingFlow() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const draft = getOnboardingDraft();

  const [step, setStep] = useState<Step>(1);
  const [hydrated, setHydrated] = useState(false);

  const [name, setName] = useState(draft.full_name);
  const [birth, setBirth] = useState<{ d: number; m: number; y: number }>(() => {
    if (draft.birth_iso) {
      const [y, m, d] = draft.birth_iso.split("-").map(Number);
      return { d, m, y };
    }
    const now = new Date();
    return { d: 1, m: 1, y: now.getFullYear() - 25 };
  });
  const [sex, setSex] = useState<"masculino" | "feminino" | "">(draft.sex);
  const [photoFile, setPhotoFile] = useState<File | null>(draft.photoFile);
  const [photoPreview, setPhotoPreview] = useState<string>(draft.photoPreview);
  const [city, setCity] = useState(draft.city);
  const [stateUF, setStateUF] = useState(draft.state);
  const [heightCm, setHeightCm] = useState<string>(
    draft.height_cm ? String(draft.height_cm) : "",
  );
  const [marital, setMarital] = useState<"solteiro" | "divorciado" | "viuvo" | "">(
    draft.marital,
  );

  const [saving, setSaving] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string>("");

  // --- Complementary (optional) state ---
  const [bio, setBio] = useState("");
  const [church, setChurch] = useState("");
  const [yearsBaptized, setYearsBaptized] = useState<string>("");
  const [faithMoment, setFaithMoment] = useState<string>("");
  const [churchFrequency, setChurchFrequency] = useState<string>("");
  const [spiritualRoutine, setSpiritualRoutine] = useState<string[]>([]);
  const [worshipStyle, setWorshipStyle] = useState<string>("");
  const [seekingVal, setSeekingVal] = useState<string>("");
  const [pace, setPace] = useState<string>("");
  const [essentialQuality, setEssentialQuality] = useState<string>("");
  const [prefAgeMin, setPrefAgeMin] = useState<string>("");
  const [prefAgeMax, setPrefAgeMax] = useState<string>("");
  const [acceptsChildren, setAcceptsChildren] = useState<"" | "sim" | "nao">("");
  const [existingPrefScope, setExistingPrefScope] =
    useState<"regiao" | "brasil" | "mundo" | "personalizado">("brasil");
  const [existingPrefCustomStates, setExistingPrefCustomStates] = useState<string[]>([]);

  // Detect existing complete profile -> skip to welcome.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: adv }, { data: pr }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name, age, sex, photo_url, city, state, height_cm, marital, bio, church, years_baptized",
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_advanced")
          .select(
            "faith_moment, church_frequency, spiritual_routine, worship_style, seeking, pace, essential_quality",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_preferences")
          .select("age_min, age_max, accepts_children, location_scope, custom_states")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (p) {
        const requiredOk =
          p.full_name && p.age && p.sex && p.photo_url &&
          p.city && p.state && p.height_cm && p.marital;
        if (p.full_name) setName(p.full_name);
        if (p.sex) setSex(p.sex as "masculino" | "feminino");
        if (p.city) setCity(p.city);
        if (p.state) setStateUF(p.state);
        if (p.height_cm) setHeightCm(String(p.height_cm));
        if (p.marital) setMarital(p.marital as "solteiro" | "divorciado");
        if (p.photo_url) setPhotoPreview(p.photo_url);
        if (p.bio) setBio(p.bio);
        if (p.church && p.church !== "Não informado") setChurch(p.church);
        if (p.years_baptized) setYearsBaptized(String(p.years_baptized));
        if (requiredOk) {
          setWelcomeName(p.full_name);
          setStep(WELCOME_STEP);
        }
      }
      if (adv) {
        if (adv.faith_moment) setFaithMoment(adv.faith_moment);
        if (adv.church_frequency) setChurchFrequency(adv.church_frequency);
        if (Array.isArray(adv.spiritual_routine)) setSpiritualRoutine(adv.spiritual_routine);
        if (adv.worship_style) setWorshipStyle(adv.worship_style);
        if (adv.seeking) setSeekingVal(adv.seeking);
        if (adv.pace) setPace(adv.pace);
        if (adv.essential_quality) setEssentialQuality(adv.essential_quality);
      }
      if (pr) {
        setPrefAgeMin(String(pr.age_min));
        setPrefAgeMax(String(pr.age_max));
        setAcceptsChildren(pr.accepts_children ? "sim" : "nao");
        setExistingPrefScope(pr.location_scope);
        setExistingPrefCustomStates(pr.custom_states ?? []);
      }
      setHydrated(true);
    })();
  }, [user]);

  const ageFromBirth = useMemo(() => computeAge(birth.y, birth.m, birth.d), [birth]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  function goNext() {
    if (step === 1) {
      const trimmed = name.trim();
      if (trimmed.length < 2) return toast.error("Digite seu nome para continuar.");
      setOnboardingDraft({ full_name: trimmed });
      setStep(2);
    } else if (step === 2) {
      if (ageFromBirth < 18) return toast.error("Você precisa ter pelo menos 18 anos.");
      const iso = `${birth.y}-${String(birth.m).padStart(2, "0")}-${String(birth.d).padStart(2, "0")}`;
      setOnboardingDraft({ birth_iso: iso, age: ageFromBirth });
      setStep(3);
    } else if (step === 3) {
      if (!sex) return toast.error("Escolha uma opção.");
      setOnboardingDraft({ sex });
      setStep(4);
    } else if (step === 4) {
      if (!photoFile && !photoPreview) return toast.error("Adicione uma foto para continuar.");
      setOnboardingDraft({ photoFile, photoPreview });
      setStep(5);
    } else if (step === 5) {
      if (!city.trim() || !stateUF) return toast.error("Informe sua cidade e estado.");
      setOnboardingDraft({ city: city.trim(), state: stateUF });
      setStep(6);
    } else if (step === 6) {
      const h = Number(heightCm);
      if (!h || h < 120 || h > 230) {
        return toast.error("Informe uma altura entre 120 e 230 cm.");
      }
      setOnboardingDraft({ height_cm: h });
      setStep(7);
    } else if (step === 7) {
      if (!marital) return toast.error("Escolha uma opção.");
      setOnboardingDraft({ marital });
      void finalize();
    }
  }

  async function finalize() {
    if (!user) return;
    setSaving(true);
    try {
      // Upload photo if a new file was picked.
      let photo_url: string | undefined;
      if (photoFile) {
        const rawExt = (photoFile.name.split(".").pop() ?? "").toLowerCase();
        const allowed = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
        const ext = allowed.includes(rawExt) ? rawExt : "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(path, photoFile, {
            upsert: true,
            contentType: photoFile.type || "image/jpeg",
            cacheControl: "3600",
          });
        if (upErr) {
          toast.error(`Falha ao enviar foto: ${upErr.message}`);
          setSaving(false);
          return;
        }
        const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photo_url = `${pub.publicUrl}?t=${Date.now()}`;
      }

      // Load any existing profile so we preserve required NOT NULL fields
      // (church, years_baptized) that this onboarding does not collect.
      const { data: existing } = await supabase
        .from("profiles")
        .select("church, years_baptized")
        .eq("id", user.id)
        .maybeSingle();

      // The DB enum marital_status only accepts 'solteiro' | 'divorciado'.
      // Map 'viuvo' to the closest valid value to avoid schema breakage.
      const maritalDb: "solteiro" | "divorciado" =
        marital === "divorciado" || marital === "viuvo" ? "divorciado" : "solteiro";

      const payload = {
        id: user.id,
        full_name: name.trim(),
        age: ageFromBirth,
        sex: sex as "masculino" | "feminino",
        city: city.trim(),
        state: stateUF,
        height_cm: Number(heightCm),
        marital: maritalDb,
        church: existing?.church ?? "Não informado",
        years_baptized: existing?.years_baptized ?? 0,
        ...(photo_url ? { photo_url } : {}),
      };

      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      clearOnboardingDraft();
      setWelcomeName(name.trim());
      setStep(8);
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (step > 1 && step <= TOTAL_STEPS) setStep((step - 1) as Step);
  }

  // --- Optional step savers ---
  async function saveBio(): Promise<boolean> {
    if (!user) return false;
    const trimmed = bio.trim();
    if (trimmed.length === 0) return true;
    const { error } = await supabase.from("profiles").update({ bio: trimmed }).eq("id", user.id);
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  async function saveFaith(): Promise<boolean> {
    if (!user) return false;
    const profilePatch: { church?: string; years_baptized?: number } = {};
    if (church.trim()) profilePatch.church = church.trim();
    const yb = Number(yearsBaptized);
    if (yearsBaptized && !Number.isNaN(yb) && yb >= 0 && yb <= 80) {
      profilePatch.years_baptized = yb;
    }
    if (Object.keys(profilePatch).length > 0) {
      const { error } = await supabase.from("profiles").update(profilePatch).eq("id", user.id);
      if (error) { toast.error(error.message); return false; }
    }
    const advPatch: Record<string, unknown> = {};
    if (faithMoment) advPatch.faith_moment = faithMoment;
    if (churchFrequency) advPatch.church_frequency = churchFrequency;
    if (Object.keys(advPatch).length > 0) {
      const { error } = await supabase
        .from("profile_advanced")
        .upsert({ user_id: user.id, ...advPatch });
      if (error) { toast.error(error.message); return false; }
    }
    return true;
  }

  async function saveRoutine(): Promise<boolean> {
    if (!user) return false;
    const advPatch: Record<string, unknown> = {};
    if (spiritualRoutine.length > 0) advPatch.spiritual_routine = spiritualRoutine;
    if (worshipStyle) advPatch.worship_style = worshipStyle;
    if (Object.keys(advPatch).length === 0) return true;
    const { error } = await supabase
      .from("profile_advanced")
      .upsert({ user_id: user.id, ...advPatch });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  async function saveSeeking(): Promise<boolean> {
    if (!user) return false;
    const advPatch: Record<string, unknown> = {};
    if (seekingVal) advPatch.seeking = seekingVal;
    if (pace) advPatch.pace = pace;
    if (essentialQuality.trim()) advPatch.essential_quality = essentialQuality.trim();
    if (Object.keys(advPatch).length === 0) return true;
    const { error } = await supabase
      .from("profile_advanced")
      .upsert({ user_id: user.id, ...advPatch });
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  async function savePrefs(): Promise<boolean> {
    if (!user) return false;
    const min = Number(prefAgeMin);
    const max = Number(prefAgeMax);
    const hasAge = prefAgeMin && prefAgeMax;
    if (hasAge) {
      if (min < 18) { toast.error("Idade mínima deve ser ao menos 18."); return false; }
      if (max > 110) { toast.error("Idade máxima deve ser no máximo 110."); return false; }
      if (max < min) { toast.error("Idade máxima deve ser maior que a mínima."); return false; }
    }
    if (!hasAge && !acceptsChildren) return true;
    const payload = {
      user_id: user.id,
      age_min: hasAge ? min : 25,
      age_max: hasAge ? max : 45,
      accepts_children: acceptsChildren ? acceptsChildren === "sim" : true,
      location_scope: existingPrefScope,
      custom_states: existingPrefCustomStates,
    };
    const { error } = await supabase.from("profile_preferences").upsert(payload);
    if (error) { toast.error(error.message); return false; }
    return true;
  }

  async function handleOptional(saver: () => Promise<boolean>, nextStep: Step) {
    if (saving) return;
    setSaving(true);
    try {
      const ok = await saver();
      if (ok) setStep(nextStep);
    } finally {
      setSaving(false);
    }
  }

  function skipTo(nextStep: Step) {
    if (saving) return;
    setStep(nextStep);
  }

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-background text-foreground"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {step <= TOTAL_STEPS && (
        <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            aria-label="Voltar"
            className="app-pressable flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground disabled:opacity-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 px-3">
            <ProgressBar value={(step / TOTAL_STEPS) * 100} />
            <p className="mt-1 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {step <= REQUIRED_STEPS ? "Perfil básico" : "Complete se quiser"} · Etapa {step} de {TOTAL_STEPS}
            </p>
          </div>
          <div className="h-10 w-10" aria-hidden />
        </header>
      )}

      <main className="flex flex-1 flex-col px-6">
        {!hydrated && step !== 8 && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          </div>
        )}
        {hydrated && step === 1 && <StepName name={name} onChange={setName} onSubmit={goNext} />}
        {hydrated && step === 2 && (
          <StepBirth birth={birth} onChange={setBirth} ageFromBirth={ageFromBirth} />
        )}
        {hydrated && step === 3 && <StepSex value={sex} onChange={setSex} />}
        {hydrated && step === 4 && (
          <StepPhoto
            preview={photoPreview}
            onPick={(f, url) => {
              setPhotoFile(f);
              setPhotoPreview(url);
            }}
          />
        )}
        {hydrated && step === 5 && (
          <StepLocation
            city={city}
            stateUF={stateUF}
            onCity={setCity}
            onState={setStateUF}
          />
        )}
        {hydrated && step === 6 && (
          <StepHeight value={heightCm} onChange={setHeightCm} />
        )}
        {hydrated && step === 7 && (
          <StepMarital value={marital} onChange={setMarital} />
        )}
        {hydrated && step === 8 && (
          <StepBio
            value={bio}
            onChange={setBio}
            saving={saving}
            onSkip={() => skipTo(9)}
            onSave={() => handleOptional(saveBio, 9)}
          />
        )}
        {hydrated && step === 9 && (
          <StepFaith
            church={church}
            onChurch={setChurch}
            years={yearsBaptized}
            onYears={setYearsBaptized}
            faithMoment={faithMoment}
            onFaithMoment={setFaithMoment}
            churchFrequency={churchFrequency}
            onChurchFrequency={setChurchFrequency}
            saving={saving}
            onSkip={() => skipTo(10)}
            onSave={() => handleOptional(saveFaith, 10)}
          />
        )}
        {hydrated && step === 10 && (
          <StepRoutine
            routine={spiritualRoutine}
            onRoutine={setSpiritualRoutine}
            worship={worshipStyle}
            onWorship={setWorshipStyle}
            saving={saving}
            onSkip={() => skipTo(11)}
            onSave={() => handleOptional(saveRoutine, 11)}
          />
        )}
        {hydrated && step === 11 && (
          <StepSeeking
            seeking={seekingVal}
            onSeeking={setSeekingVal}
            pace={pace}
            onPace={setPace}
            quality={essentialQuality}
            onQuality={setEssentialQuality}
            saving={saving}
            onSkip={() => skipTo(12)}
            onSave={() => handleOptional(saveSeeking, 12)}
          />
        )}
        {hydrated && step === 12 && (
          <StepPrefs
            min={prefAgeMin}
            onMin={setPrefAgeMin}
            max={prefAgeMax}
            onMax={setPrefAgeMax}
            accepts={acceptsChildren}
            onAccepts={setAcceptsChildren}
            saving={saving}
            onSkip={() => skipTo(WELCOME_STEP)}
            onSave={() => handleOptional(savePrefs, WELCOME_STEP)}
          />
        )}
        {step === WELCOME_STEP && (
          <StepWelcome
            name={welcomeName || name.trim()}
            onContinue={() => navigate({ to: "/inicio" })}
            onCompletePerfil={() => navigate({ to: "/perfil" })}
          />
        )}
      </main>

      {hydrated && step <= REQUIRED_STEPS && (
        <footer className="px-6 pb-6 pt-3">
          <Button
            onClick={goNext}
            size="lg"
            disabled={saving}
            className="app-pressable h-14 w-full rounded-2xl text-base font-semibold"
          >
            {saving ? "Salvando..." : step === REQUIRED_STEPS ? "Finalizar" : "Continuar"}
          </Button>
        </footer>
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-[var(--rose)] transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* --- Step 1: Name --- */
function StepName({
  name, onChange, onSubmit,
}: { name: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
      <h1 className="text-3xl font-semibold leading-tight">Como você quer aparecer no app?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Use seu nome real ou o nome pelo qual as pessoas te conhecem.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="mt-8">
        <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Seu nome</label>
        <Input
          autoFocus value={name} onChange={(e) => onChange(e.target.value)}
          maxLength={100} placeholder="Ex.: Maria Silva"
          className="mt-2 h-14 rounded-2xl border-border bg-card/60 px-4 text-lg"
        />
      </form>
    </div>
  );
}

/* --- Step 2: Birth --- */
function computeAge(y: number, m: number, d: number) {
  if (!y || !m || !d) return 0;
  const today = new Date();
  let age = today.getFullYear() - y;
  const mDiff = today.getMonth() + 1 - m;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) age--;
  return age;
}
const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

function StepBirth({
  birth, onChange, ageFromBirth,
}: {
  birth: { d: number; m: number; y: number };
  onChange: (b: { d: number; m: number; y: number }) => void;
  ageFromBirth: number;
}) {
  const now = new Date();
  const yearMax = now.getFullYear() - 18;
  const yearMin = now.getFullYear() - 90;
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = yearMax; y >= yearMin; y--) arr.push(y);
    return arr;
  }, [yearMax, yearMin]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(
    () => Array.from({ length: daysInMonth(birth.y, birth.m) }, (_, i) => i + 1),
    [birth.y, birth.m],
  );
  const tooYoung = ageFromBirth < 18;
  function setPart(p: Partial<typeof birth>) {
    const next = { ...birth, ...p };
    const dim = daysInMonth(next.y, next.m);
    if (next.d > dim) next.d = dim;
    onChange(next);
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-6">
      <h1 className="text-3xl font-semibold leading-tight">Qual sua data de nascimento?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Usamos isso para manter a comunidade segura.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-2 rounded-3xl border border-border bg-card/40 p-3 shadow-soft">
        <Wheel items={days} value={birth.d} onChange={(d) => setPart({ d })} ariaLabel="Dia" />
        <Wheel items={months} value={birth.m} onChange={(m) => setPart({ m })}
          format={(v) => MONTHS[v - 1]} ariaLabel="Mês" />
        <Wheel items={years} value={birth.y} onChange={(y) => setPart({ y })} ariaLabel="Ano" />
      </div>
      <p className={cn("mt-4 text-center text-sm",
        tooYoung ? "text-destructive" : "text-muted-foreground")}>
        {tooYoung ? "Você precisa ter pelo menos 18 anos." : `Você tem ${ageFromBirth} anos.`}
      </p>
    </div>
  );
}

function Wheel({
  items, value, onChange, format, ariaLabel,
}: {
  items: number[]; value: number; onChange: (v: number) => void;
  format?: (v: number) => string; ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 40;
  const VISIBLE = 5;
  const PAD = ITEM_H * Math.floor(VISIBLE / 2);
  const [activeIdx, setActiveIdx] = useState(() => Math.max(0, items.indexOf(value)));
  const valueRef = useRef(value);
  valueRef.current = value;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const rafRef = useRef(0);
  const idleRef = useRef<number | null>(null);
  const lastHapticIdx = useRef(activeIdx);

  // Keep the wheel aligned with the external value when items change
  // (e.g. day count changes when month/year switch) or value updates.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, items.indexOf(value));
    el.scrollTop = idx * ITEM_H;
    setActiveIdx(idx);
    lastHapticIdx.current = idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  function vibrate() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(8); } catch { /* noop */ }
    }
  }

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el2 = ref.current;
      if (!el2) return;
      const raw = el2.scrollTop / ITEM_H;
      const idx = Math.max(0, Math.min(itemsRef.current.length - 1, Math.round(raw)));
      if (idx !== lastHapticIdx.current) {
        lastHapticIdx.current = idx;
        vibrate();
      }
      setActiveIdx(idx);
    });
    // Snap after momentum settles
    if (idleRef.current) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => {
      const el3 = ref.current;
      if (!el3) return;
      const idx = Math.max(0, Math.min(itemsRef.current.length - 1, Math.round(el3.scrollTop / ITEM_H)));
      const target = idx * ITEM_H;
      if (Math.abs(el3.scrollTop - target) > 0.5) {
        el3.scrollTo({ top: target, behavior: "smooth" });
      }
      const v = itemsRef.current[idx];
      if (v !== valueRef.current) onChange(v);
    }, 110);
  }

  return (
    <div
      className="relative select-none"
      style={{ height: ITEM_H * VISIBLE }}
      aria-label={ariaLabel}
    >
      {/* Center highlight bar */}
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-[var(--rose)]/8 ring-1 ring-inset ring-[var(--rose-soft)]/40"
        style={{ height: ITEM_H }}
      />
      {/* Top & bottom fade for depth (iOS feel) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20"
        style={{
          height: PAD,
          background:
            "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.85) 35%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
        style={{
          height: PAD,
          background:
            "linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.85) 35%, transparent 100%)",
        }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll overscroll-contain snap-y snap-mandatory [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        style={{
          perspective: "1000px",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)",
        }}
      >
        <div style={{ height: PAD }} />
        {items.map((it, i) => {
          const dist = i - activeIdx;
          const abs = Math.abs(dist);
          const rot = Math.max(-60, Math.min(60, dist * 18));
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.65 : abs === 2 ? 0.32 : 0.18;
          const scale = abs === 0 ? 1 : 0.92;
          const active = it === value;
          return (
            <button
              type="button"
              key={it}
              onClick={() => {
                const el = ref.current;
                if (!el) return;
                el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
              }}
              className={cn(
                "flex w-full snap-center items-center justify-center text-base tabular-nums transition-[color,font-weight] duration-150",
                active ? "font-semibold text-foreground" : "text-foreground",
              )}
              style={{
                height: ITEM_H,
                opacity,
                transform: `rotateX(${rot}deg) scale(${scale})`,
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
                willChange: "transform, opacity",
              }}
            >
              {format ? format(it) : it}
            </button>
          );
        })}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}

/* --- Step 3: Sex --- */
function StepSex({
  value, onChange,
}: { value: "masculino" | "feminino" | ""; onChange: (v: "masculino" | "feminino") => void }) {
  const options: Array<{ v: "masculino" | "feminino"; label: string; Icon: typeof UserIcon }> = [
    { v: "masculino", label: "Homem", Icon: UserIcon },
    { v: "feminino", label: "Mulher", Icon: UsersIcon },
  ];
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
      <h1 className="text-3xl font-semibold leading-tight">Você é?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Isso ajuda o app a te apresentar pessoas compatíveis.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {options.map(({ v, label, Icon }) => {
          const active = value === v;
          return (
            <button key={v} type="button" onClick={() => onChange(v)}
              className={cn("app-card-interactive flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl border-2 bg-card/60 p-4 transition",
                active ? "border-[var(--rose)] bg-[var(--rose)]/10 shadow-elegant"
                       : "border-border hover:border-[var(--rose-soft)]")}>
              <Icon className={cn("h-9 w-9", active ? "text-[var(--rose)]" : "text-muted-foreground")} />
              <span className={cn("text-base font-medium", active ? "text-foreground" : "text-foreground/80")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --- Step 4: Photo --- */
function StepPhoto({
  preview, onPick,
}: { preview: string; onPick: (file: File, url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0]; if (!raw) return;
    const nm = (raw.name || "").toLowerCase();
    const looksHeic = nm.endsWith(".heic") || nm.endsWith(".heif");
    if (!raw.type.startsWith("image/") && !looksHeic) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG, WEBP, HEIC).");
      return;
    }
    if (raw.size > 10 * 1024 * 1024) { toast.error("Foto muito grande (máx. 10MB)."); return; }
    const t = toast.loading("Preparando sua foto...");
    let f = raw;
    try { f = await normalizeImageFile(raw); } finally { toast.dismiss(t); }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Foto até 8MB após conversão. Tente uma imagem menor."); return;
    }
    onPick(f, URL.createObjectURL(f));
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-6">
      <h1 className="self-start text-3xl font-semibold leading-tight">Adicione sua melhor foto</h1>
      <p className="mt-3 self-start text-sm text-muted-foreground">
        Escolha uma foto nítida, com seu rosto visível.
      </p>
      <button type="button" onClick={() => inputRef.current?.click()}
        className="app-pressable mt-8 flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--rose-soft)] bg-card/60 shadow-soft transition hover:border-[var(--rose)]">
        {preview ? (
          <PhotoImg src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Camera className="h-8 w-8" />
            <span className="text-xs font-medium">Escolher foto</span>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*,image/heic,image/heif"
        onChange={handle} className="sr-only" tabIndex={-1} aria-hidden />
      <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
        Evite documentos, prints e imagens sem você.
      </p>
    </div>
  );
}

/* --- Step 5: Location --- */
function StepLocation({
  city, stateUF, onCity, onState,
}: {
  city: string; stateUF: string;
  onCity: (v: string) => void; onState: (v: string) => void;
}) {
  const [phase, setPhase] = useState<"ask" | "loading" | "auto" | "manual">(
    city && stateUF ? "auto" : "ask",
  );
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [search, setSearch] = useState("");
  const cityCache = useRef<Record<string, string[]>>({});

  async function loadCities(uf: string) {
    if (!uf) return;
    if (cityCache.current[uf]) { setCities(cityCache.current[uf]); return; }
    setLoadingCities(true); setCityError(false);
    try {
      const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      if (!r.ok) throw new Error("ibge");
      const data = (await r.json()) as Array<{ nome: string }>;
      const names = data.map((x) => x.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
      cityCache.current[uf] = names;
      setCities(names);
    } catch {
      setCityError(true); setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }

  useEffect(() => {
    if (phase === "manual" && stateUF) void loadCities(stateUF);
  }, [phase, stateUF]);

  function detect() {
    if (!("geolocation" in navigator)) { setPhase("manual"); return; }
    setPhase("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`,
          );
          if (!r.ok) throw new Error("geo");
          const data = (await r.json()) as {
            city?: string; locality?: string; principalSubdivisionCode?: string;
          };
          const detectedCity = data.city || data.locality || "";
          const sub = data.principalSubdivisionCode || ""; // e.g. "BR-SP"
          const uf = sub.startsWith("BR-") ? sub.slice(3) : "";
          if (detectedCity && uf && UF_NAMES[uf]) {
            onCity(detectedCity); onState(uf); setPhase("auto");
          } else { setPhase("manual"); }
        } catch { setPhase("manual"); }
      },
      () => setPhase("manual"),
      { timeout: 8000, maximumAge: 60000 },
    );
  }

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities.slice(0, 200);
    return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 200);
  }, [cities, search]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-6">
      <h1 className="text-3xl font-semibold leading-tight">De onde você é?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Vamos tentar preencher sua cidade automaticamente.
      </p>

      {phase === "ask" && (
        <div className="mt-8 space-y-3">
          <Button type="button" onClick={detect} size="lg"
            className="app-pressable h-14 w-full rounded-2xl text-base font-semibold">
            <MapPin className="mr-2 h-5 w-5" />
            Usar minha localização
          </Button>
          <button type="button" onClick={() => setPhase("manual")}
            className="app-pressable w-full rounded-2xl py-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
            Preencher manualmente
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="mt-10 flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--rose)] border-t-transparent" />
          <p>Detectando localização...</p>
        </div>
      )}

      {phase === "auto" && (
        <div className="mt-8 rounded-3xl border border-[var(--rose-soft)] bg-[var(--rose)]/5 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Encontramos</p>
          <p className="mt-1 text-xl font-semibold">{city} — {stateUF}</p>
          <button type="button" onClick={() => setPhase("manual")}
            className="app-pressable mt-4 text-sm font-medium text-[var(--rose)] underline-offset-4 hover:underline">
            Alterar manualmente
          </button>
        </div>
      )}

      {phase === "manual" && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estado</label>
            <Select value={stateUF} onValueChange={(v) => { onState(v); onCity(""); setSearch(""); }}>
              <SelectTrigger className="mt-2 h-14 rounded-2xl bg-card/60">
                <SelectValue placeholder="Selecione seu estado" />
              </SelectTrigger>
              <SelectContent>
                {UF_LIST.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf} — {UF_NAMES[uf]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {stateUF && (
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cidade</label>
              <Input
                value={city || search}
                onChange={(e) => { setSearch(e.target.value); onCity(""); }}
                placeholder={loadingCities ? "Carregando cidades..." : "Buscar sua cidade"}
                className="mt-2 h-14 rounded-2xl border-border bg-card/60 px-4 text-base"
              />
              {cityError && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Não conseguimos carregar a lista. Digite o nome da sua cidade e continue.
                </p>
              )}
              {!cityError && stateUF && !city && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-card/40">
                  {loadingCities && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">Carregando...</p>
                  )}
                  {!loadingCities && filteredCities.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                      Nenhuma cidade encontrada. Você pode continuar com o nome digitado.
                    </p>
                  )}
                  {filteredCities.map((c) => (
                    <button key={c} type="button"
                      onClick={() => { onCity(c); setSearch(""); }}
                      className="block w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60">
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {city && (
                <button type="button" onClick={() => { onCity(""); setSearch(""); }}
                  className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:underline">
                  Alterar cidade
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --- Step 6: Height --- */
function StepHeight({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
      <h1 className="text-3xl font-semibold leading-tight">Qual sua altura?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Essa informação ajuda a deixar seu perfil mais completo.
      </p>
      <div className="mt-8">
        <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Altura (cm)</label>
        <div className="relative mt-2">
          <Ruler className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <NumericInput
            autoFocus value={value} onChange={onChange}
            placeholder="175" maxLength={3}
            className="h-14 rounded-2xl border-border bg-card/60 pl-12 pr-4 text-lg"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Entre 120 e 230 cm.</p>
      </div>
    </div>
  );
}

/* --- Step 7: Marital --- */
function StepMarital({
  value, onChange,
}: {
  value: "solteiro" | "divorciado" | "viuvo" | "";
  onChange: (v: "solteiro" | "divorciado" | "viuvo") => void;
}) {
  const options: Array<{ v: "solteiro" | "divorciado" | "viuvo"; label: string }> = [
    { v: "solteiro", label: "Solteiro" },
    { v: "divorciado", label: "Divorciado" },
    { v: "viuvo", label: "Viúvo" },
  ];
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
      <h1 className="text-3xl font-semibold leading-tight">Qual seu estado civil?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Queremos manter a comunidade clara e respeitosa.
      </p>
      <div className="mt-8 space-y-3">
        {options.map(({ v, label }) => {
          const active = value === v;
          return (
            <button key={v} type="button" onClick={() => onChange(v)}
              className={cn("app-card-interactive flex w-full items-center gap-3 rounded-2xl border-2 bg-card/60 px-5 py-4 text-left transition",
                active ? "border-[var(--rose)] bg-[var(--rose)]/10 shadow-elegant"
                       : "border-border hover:border-[var(--rose-soft)]")}>
              <Heart className={cn("h-5 w-5", active ? "text-[var(--rose)]" : "text-muted-foreground")} />
              <span className={cn("text-base font-medium", active ? "text-foreground" : "text-foreground/80")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --- Optional helpers --- */
function OptionalFooter({
  saving, onSkip, onSave, saveLabel = "Salvar e continuar",
}: {
  saving: boolean; onSkip: () => void; onSave: () => void; saveLabel?: string;
}) {
  return (
    <div className="mt-8 space-y-2">
      <Button
        onClick={onSave}
        size="lg"
        disabled={saving}
        className="app-pressable h-14 w-full rounded-2xl text-base font-semibold"
      >
        {saving ? "Salvando..." : saveLabel}
      </Button>
      <button
        type="button"
        onClick={onSkip}
        disabled={saving}
        className="app-pressable mx-auto block py-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
      >
        Pular
      </button>
    </div>
  );
}

function ChipGroup({
  options, value, onChange,
}: {
  options: Array<{ v: string; l: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(active ? "" : o.v)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition",
              active
                ? "border-[var(--rose)] bg-[var(--rose)]/10 text-[var(--rose)]"
                : "border-border bg-card/40 text-foreground/80 hover:border-[var(--rose-soft)]",
            )}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function ChipMultiGroup({
  options, values, onChange,
}: {
  options: Array<{ v: string; l: string }>;
  values: string[];
  onChange: (vs: string[]) => void;
}) {
  function toggle(v: string) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = values.includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => toggle(o.v)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition",
              active
                ? "border-[var(--rose)] bg-[var(--rose)]/10 text-[var(--rose)]"
                : "border-border bg-card/40 text-foreground/80 hover:border-[var(--rose-soft)]",
            )}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

/* --- Step 8: Bio --- */
function StepBio({
  value, onChange, saving, onSkip, onSave,
}: {
  value: string; onChange: (v: string) => void;
  saving: boolean; onSkip: () => void; onSave: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-6">
      <h1 className="text-3xl font-semibold leading-tight">Conte um pouco sobre você</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Uma frase sincera já ajuda as pessoas certas a te conhecerem melhor.
      </p>
      <div className="mt-4">
        <BioPromptChips
          current={value}
          onApply={(starter: string) => onChange(starter + value)}
        />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        rows={6}
        placeholder="Gosto de conversar com calma, valorizo minha fé e quero conhecer alguém com propósito."
        className="mt-6 w-full resize-none rounded-2xl border border-border bg-card/60 p-4 text-base outline-none focus:border-[var(--rose-soft)]"
      />
      <p className="mt-2 text-right text-xs text-muted-foreground">{value.length}/500</p>
      <OptionalFooter saving={saving} onSkip={onSkip} onSave={onSave} />
    </div>
  );
}

/* --- Step 9: Faith --- */
function StepFaith({
  church, onChurch, years, onYears,
  faithMoment, onFaithMoment, churchFrequency, onChurchFrequency,
  saving, onSkip, onSave,
}: {
  church: string; onChurch: (v: string) => void;
  years: string; onYears: (v: string) => void;
  faithMoment: string; onFaithMoment: (v: string) => void;
  churchFrequency: string; onChurchFrequency: (v: string) => void;
  saving: boolean; onSkip: () => void; onSave: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-6">
      <h1 className="text-3xl font-semibold leading-tight">Sua fé e caminhada</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Essas informações ajudam a manter conexões com mais propósito.
      </p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Igreja</label>
          <Input
            value={church}
            onChange={(e) => onChurch(e.target.value)}
            maxLength={100}
            placeholder="Ex.: Comunidade da Graça"
            className="mt-2 h-12 rounded-2xl border-border bg-card/60 px-4"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Anos de batismo</label>
          <NumericInput
            value={years}
            onChange={onYears}
            placeholder="0"
            maxLength={2}
            className="mt-2 h-12 w-32 rounded-2xl border-border bg-card/60 px-4 text-base"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Momento de fé</label>
          <div className="mt-2">
            <ChipGroup options={FAITH_MOMENT} value={faithMoment} onChange={onFaithMoment} />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Frequência na igreja</label>
          <div className="mt-2">
            <ChipGroup options={CHURCH_FREQUENCY} value={churchFrequency} onChange={onChurchFrequency} />
          </div>
        </div>
      </div>
      <OptionalFooter saving={saving} onSkip={onSkip} onSave={onSave} />
    </div>
  );
}

/* --- Step 10: Routine --- */
function StepRoutine({
  routine, onRoutine, worship, onWorship,
  saving, onSkip, onSave,
}: {
  routine: string[]; onRoutine: (v: string[]) => void;
  worship: string; onWorship: (v: string) => void;
  saving: boolean; onSkip: () => void; onSave: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-6">
      <h1 className="text-3xl font-semibold leading-tight">Como é sua rotina?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Escolha o que combina com você. Pode pular se preferir.
      </p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rotina espiritual</label>
          <div className="mt-2">
            <ChipMultiGroup options={SPIRITUAL_ROUTINE} values={routine} onChange={onRoutine} />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estilo de culto</label>
          <div className="mt-2">
            <ChipGroup options={WORSHIP_STYLE} value={worship} onChange={onWorship} />
          </div>
        </div>
      </div>
      <OptionalFooter saving={saving} onSkip={onSkip} onSave={onSave} />
    </div>
  );
}

/* --- Step 11: Seeking --- */
function StepSeeking({
  seeking, onSeeking, pace, onPace, quality, onQuality,
  saving, onSkip, onSave,
}: {
  seeking: string; onSeeking: (v: string) => void;
  pace: string; onPace: (v: string) => void;
  quality: string; onQuality: (v: string) => void;
  saving: boolean; onSkip: () => void; onSave: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-6">
      <h1 className="text-3xl font-semibold leading-tight">O que você procura?</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Isso ajuda o app a te apresentar pessoas com intenção parecida.
      </p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Intenção</label>
          <div className="mt-2">
            <ChipGroup options={SEEKING} value={seeking} onChange={onSeeking} />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ritmo</label>
          <div className="mt-2">
            <ChipGroup options={PACE} value={pace} onChange={onPace} />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Qualidade essencial</label>
          <Input
            value={quality}
            onChange={(e) => onQuality(e.target.value)}
            maxLength={120}
            placeholder="Ex.: integridade, carinho, fé"
            className="mt-2 h-12 rounded-2xl border-border bg-card/60 px-4"
          />
        </div>
      </div>
      <OptionalFooter saving={saving} onSkip={onSkip} onSave={onSave} />
    </div>
  );
}

/* --- Step 12: Basic prefs --- */
function StepPrefs({
  min, onMin, max, onMax, accepts, onAccepts,
  saving, onSkip, onSave,
}: {
  min: string; onMin: (v: string) => void;
  max: string; onMax: (v: string) => void;
  accepts: "" | "sim" | "nao"; onAccepts: (v: "sim" | "nao") => void;
  saving: boolean; onSkip: () => void; onSave: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-6">
      <h1 className="text-3xl font-semibold leading-tight">Suas preferências</h1>
      <p className="mt-3 text-sm text-muted-foreground">Você poderá ajustar tudo depois.</p>
      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Idade mínima</label>
            <NumericInput
              value={min}
              onChange={onMin}
              placeholder="25"
              maxLength={3}
              className="mt-2 h-12 rounded-2xl border-border bg-card/60 px-4"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Idade máxima</label>
            <NumericInput
              value={max}
              onChange={onMax}
              placeholder="45"
              maxLength={3}
              className="mt-2 h-12 rounded-2xl border-border bg-card/60 px-4"
            />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Aceita pessoa com filhos?</label>
          <div className="mt-2 flex gap-2">
            {(["sim", "nao"] as const).map((v) => {
              const active = accepts === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onAccepts(v)}
                  className={cn(
                    "flex-1 rounded-2xl border-2 px-4 py-3 text-sm font-medium transition",
                    active
                      ? "border-[var(--rose)] bg-[var(--rose)]/10 text-[var(--rose)]"
                      : "border-border bg-card/40 text-foreground/80",
                  )}
                >
                  {v === "sim" ? "Sim" : "Não"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <OptionalFooter saving={saving} onSkip={onSkip} onSave={onSave} />
    </div>
  );
}

/* --- Final: Welcome --- */
function StepWelcome({
  name, onContinue, onCompletePerfil,
}: { name: string; onContinue: () => void; onCompletePerfil: () => void }) {
  const firstName = (name || "").split(" ")[0];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #ff9aa0 0%, #ff6b8a 35%, #d8456b 75%, #8b1f4a 100%)",
      }}>
      <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#ffd2c2]/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/80">Tudo pronto</p>
        <h1 className="mt-4 text-6xl font-semibold leading-none drop-shadow-sm">
          Bem-vindo{firstName ? "," : ""}
        </h1>
        {firstName && <h2 className="mt-2 text-4xl font-light text-white/95">{firstName}</h2>}
        <p className="mt-6 max-w-sm text-base text-white/90">
          Seu perfil já começou. Você pode entrar no app agora ou completar mais
          detalhes para aumentar suas chances.
        </p>
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col gap-3 px-6 pb-8"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}>
        <Button onClick={onContinue} size="lg"
          className="app-pressable h-14 rounded-2xl bg-white text-base font-semibold text-[var(--rose)] hover:bg-white/90">
          Continuar
        </Button>
        <button type="button" onClick={onCompletePerfil}
          className="app-pressable h-12 rounded-2xl text-sm font-medium text-white/90 underline-offset-4 hover:underline">
          Completar perfil
        </button>
      </div>
    </div>
  );
}
