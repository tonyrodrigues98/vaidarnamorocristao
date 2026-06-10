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

export const Route = createFileRoute("/onboarding/")({ component: OnboardingFlow });

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 8 = welcome
const TOTAL_STEPS = 7;

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

  // Detect existing complete profile -> skip to welcome.
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, age, sex, photo_url, city, state, height_cm, marital")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.full_name && data.age && data.sex && data.photo_url &&
            data.city && data.state && data.height_cm && data.marital) {
          setWelcomeName(data.full_name);
          setStep(8);
        } else if (data) {
          // Pre-fill from saved profile so user can resume.
          if (data.full_name) setName(data.full_name);
          if (data.sex) setSex(data.sex as "masculino" | "feminino");
          if (data.city) setCity(data.city);
          if (data.state) setStateUF(data.state);
          if (data.height_cm) setHeightCm(String(data.height_cm));
          if (data.marital) setMarital(data.marital as "solteiro" | "divorciado");
          if (data.photo_url) setPhotoPreview(data.photo_url);
        }
        setHydrated(true);
      });
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

      const payload: Record<string, unknown> = {
        id: user.id,
        full_name: name.trim(),
        age: ageFromBirth,
        sex,
        city: city.trim(),
        state: stateUF,
        height_cm: Number(heightCm),
        marital: maritalDb,
        church: existing?.church ?? "Não informado",
        years_baptized: existing?.years_baptized ?? 0,
      };
      if (photo_url) payload.photo_url = photo_url;

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
              Etapa {step} de {TOTAL_STEPS}
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
        {step === 8 && (
          <StepWelcome
            name={welcomeName || name.trim()}
            onContinue={() => navigate({ to: "/inicio" })}
            onCompletePerfil={() => navigate({ to: "/perfil" })}
          />
        )}
      </main>

      {hydrated && step <= TOTAL_STEPS && (
        <footer className="px-6 pb-6 pt-3">
          <Button
            onClick={goNext}
            size="lg"
            disabled={saving}
            className="app-pressable h-14 w-full rounded-2xl text-base font-semibold"
          >
            {saving ? "Salvando..." : step === TOTAL_STEPS ? "Finalizar" : "Continuar"}
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
  const ITEM_H = 40; const VISIBLE = 5; const PAD = ITEM_H * Math.floor(VISIBLE / 2);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const idx = Math.max(0, items.indexOf(value));
    el.scrollTop = idx * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  function handleScroll() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current; if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const target = clamped * ITEM_H;
      if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target, behavior: "smooth" });
      const v = items[clamped];
      if (v !== value) onChange(v);
    }, 90);
  }
  return (
    <div className="relative" style={{ height: ITEM_H * VISIBLE }} aria-label={ariaLabel}>
      <div className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-xl border-y border-[var(--rose-soft)]/50 bg-[var(--rose)]/5"
        style={{ height: ITEM_H }} />
      <div ref={ref} onScroll={handleScroll}
        className="h-full overflow-y-scroll scroll-smooth snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div style={{ height: PAD }} />
        {items.map((it) => {
          const active = it === value;
          return (
            <button type="button" key={it}
              onClick={() => {
                const el = ref.current; if (!el) return;
                el.scrollTo({ top: items.indexOf(it) * ITEM_H, behavior: "smooth" });
              }}
              className={cn("flex w-full snap-center items-center justify-center text-base transition",
                active ? "font-semibold text-foreground" : "text-muted-foreground/70")}
              style={{ height: ITEM_H }}>
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

/* --- Step 8: Welcome --- */
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
