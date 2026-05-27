import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BR_STATES } from "@/lib/constants";
import { Camera, Save, CheckCircle2, Clock, XCircle, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ROLE_CONFIG, COLOR_HEX, type RoleColor } from "@/lib/roles";
import { RoleBadge } from "@/components/RoleBadge";
import { MissionsPanel } from "@/components/MissionsPanel";
import { recomputeMyBadges } from "@/lib/recomputeBadges";
import { ProfileAdvancedForm } from "@/components/ProfileAdvancedForm";
import { ProfilePhotosManager } from "@/components/ProfilePhotosManager";
import { AdminWarningBanner } from "@/components/AdminWarningBanner";

export const Route = createFileRoute("/perfil")({ component: PerfilPage });

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(18).max(110),
  height_cm: z.coerce.number().int().min(120).max(230).optional().or(z.literal("")),
  sex: z.enum(["masculino", "feminino"]),
  marital: z.enum(["solteiro", "divorciado"]),
  city: z.string().trim().min(2).max(80),
  state: z.string().length(2),
  church: z.string().trim().min(2).max(120),
  years_baptized: z.coerce.number().int().min(0).max(100),
  bio: z.string().trim().max(600).optional(),
});

function PerfilPage() {
  const { user, loading, role, badgeColor, publicListing, refreshRole } = useAuth();
  const [savingRole, setSavingRole] = useState(false);
  const [localColor, setLocalColor] = useState<RoleColor | null>(null);
  const [localPublic, setLocalPublic] = useState(false);
  const [hasContributorBadge, setHasContributorBadge] = useState(false);
  const [contribHighlight, setContribHighlight] = useState(true);
  const [savingContrib, setSavingContrib] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [{ data: badgeData }, { data: profData }] = await Promise.all([
        supabase
          .from("user_badges")
          .select("active, expires_at, badges(code)")
          .eq("user_id", user.id)
          .eq("active", true),
        supabase
          .from("profiles")
          .select("contributor_highlight")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      if (!alive) return;
      const has = ((badgeData ?? []) as Array<{ active: boolean; expires_at: string | null; badges: { code: string } | null }>)
        .some((r) => r.badges?.code === "contributor" && (!r.expires_at || new Date(r.expires_at) > new Date()));
      setHasContributorBadge(has);
      setContribHighlight((profData as { contributor_highlight?: boolean | null } | null)?.contributor_highlight !== false);
    })();
    return () => { alive = false; };
  }, [user]);

  const toggleContribHighlight = async (next: boolean) => {
    if (!user) return;
    setSavingContrib(true);
    const prev = contribHighlight;
    setContribHighlight(next);
    const { error } = await supabase
      .from("profiles")
      .update({ contributor_highlight: next })
      .eq("id", user.id);
    setSavingContrib(false);
    if (error) {
      setContribHighlight(prev);
      toast.error("Não foi possível salvar a preferência.");
    } else {
      toast.success(next ? "Destaque verde ativado nas mensagens." : "Destaque verde desativado.");
    }
  };

  useEffect(() => {
    setLocalColor(badgeColor);
    setLocalPublic(publicListing);
  }, [badgeColor, publicListing]);

  const isStaff = role !== "user";
  const roleCfg = ROLE_CONFIG[role];

  const loadRoleSettingsFromDb = useCallback(async () => {
    if (!user || !isStaff) return null;
    const { data, error } = await supabase
      .from("user_roles")
      .select("badge_color, public_listing")
      .eq("user_id", user.id)
      .eq("role", role)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      setLocalColor((data.badge_color as RoleColor | null) ?? null);
      setLocalPublic(!!data.public_listing);
    }
    return data;
  }, [isStaff, role, user]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "banned" | null>(null);

  const [profile, setProfile] = useState({
    full_name: "",
    age: "",
    height_cm: "",
    sex: "" as "" | "masculino" | "feminino",
    marital: "" as "" | "solteiro" | "divorciado",
    city: "",
    state: "",
    church: "",
    years_baptized: "",
    bio: "",
  });

  const [prefs, setPrefs] = useState({
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
    (async () => {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profile_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) {
        setStatus(p.status);
        setProfile({
          full_name: p.full_name ?? "",
          age: String(p.age ?? ""),
          height_cm: p.height_cm ? String(p.height_cm) : "",
          sex: p.sex ?? "",
          marital: p.marital ?? "",
          city: p.city ?? "",
          state: p.state ?? "",
          church: p.church ?? "",
          years_baptized: String(p.years_baptized ?? ""),
          bio: p.bio ?? "",
        });
        if (p.photo_url) setPhotoPreview(p.photo_url);
      }
      if (pr) {
        setPrefs({
          age_min: String(pr.age_min),
          age_max: String(pr.age_max),
          location_scope: pr.location_scope,
          custom_states: pr.custom_states ?? [],
          desired_quality: pr.desired_quality ?? "",
          accepts_children: pr.accepts_children ? "sim" : "nao",
          looking_for_bio: pr.looking_for_bio ?? "",
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !isStaff) return;
    loadRoleSettingsFromDb().catch(() => {
      setLocalColor(badgeColor);
      setLocalPublic(publicListing);
    });
  }, [badgeColor, isStaff, loadRoleSettingsFromDb, publicListing, user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  async function saveRoleSettings() {
    if (!user || !isStaff) return;
    setSavingRole(true);
    const { data, error } = await supabase
      .from("user_roles")
      .update({
        badge_color: localColor ?? roleCfg.defaultColor,
        public_listing: localPublic,
      })
      .eq("user_id", user.id)
      .eq("role", role)
      .select("badge_color, public_listing");
    if (error || !data || data.length === 0) {
      setSavingRole(false);
      toast.error(error?.message ?? "Não foi possível salvar as configurações do cargo");
      return;
    }
    await loadRoleSettingsFromDb();
    await refreshRole();
    setSavingRole(false);
    toast.success("Configurações de cargo atualizadas");
  }

  async function togglePublicListing(next: boolean) {
    if (!user || !isStaff) return;
    const prev = localPublic;
    setLocalPublic(next);
    setSavingRole(true);
    const { data, error } = await supabase
      .from("user_roles")
      .update({ public_listing: next })
      .eq("user_id", user.id)
      .eq("role", role)
      .select("public_listing");
    if (error || !data || data.length === 0) {
      setLocalPublic(prev);
      setSavingRole(false);
      toast.error(error?.message ?? "Não foi possível salvar a preferência");
      return;
    }
    const fresh = await loadRoleSettingsFromDb();
    await refreshRole();
    setSavingRole(false);
    if (!fresh || fresh.public_listing !== next) {
      setLocalPublic(prev);
      toast.error("A preferência não foi confirmada no banco. Tente novamente.");
      return;
    }
    toast.success(next ? "Aparecendo em Pretendentes" : "Oculto de Pretendentes");
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Foto até 5MB");
      return;
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSavingProfile(true);
    let photo_url: string | undefined;
    let aiVerified = false;
    let aiConfidence: number | null = null;
    let needsReview = false;
    let aiReason = "";
    if (photoFile) {
      const { verifyProfilePhoto } = await import("@/lib/verifyPhoto");
      const verdict = await verifyProfilePhoto(photoFile);
      if (!verdict.ok) {
        toast.error(verdict.reason);
        setSavingProfile(false);
        return;
      }
      if ("soft" in verdict && verdict.soft) {
        // ok, segue
      } else if (verdict.approved) {
        aiVerified = true;
        aiConfidence = verdict.confidence;
      } else if (verdict.needsReview) {
        needsReview = true;
        aiConfidence = verdict.confidence;
        aiReason = verdict.reason;
      }
      const ext = photoFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (upErr) {
        toast.error("Falha ao enviar foto");
        setSavingProfile(false);
        return;
      }
      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      photo_url = `${pub.publicUrl}?t=${Date.now()}`;
      try {
        const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: logRows } = await supabase
          .from("photo_moderation_log")
          .select("id")
          .eq("user_id", user.id)
          .eq("scope", "avatar")
          .is("photo_url", null)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(1);
        const logId = logRows?.[0]?.id;
        if (logId) {
          await supabase.from("photo_moderation_log").update({ photo_url }).eq("id", logId);
        }
      } catch (e) {
        console.warn("backfill log url failed", e);
      }
      if (needsReview) {
        await supabase.from("photo_moderation_queue").insert({
          user_id: user.id,
          photo_url,
          scope: "avatar",
          ai_result: { confidence: aiConfidence, reason: aiReason },
          status: "pending",
        });
        toast.message("Foto enviada para análise rápida da equipe.");
      }
    }
    const payload = {
      id: user.id,
      full_name: parsed.data.full_name,
      age: parsed.data.age,
      sex: parsed.data.sex,
      marital: parsed.data.marital,
      city: parsed.data.city,
      state: parsed.data.state,
      church: parsed.data.church,
      years_baptized: parsed.data.years_baptized,
      bio: parsed.data.bio || null,
      ...(typeof parsed.data.height_cm === "number" ? { height_cm: parsed.data.height_cm } : {}),
      ...(photo_url ? { photo_url } : {}),
      ...(photoFile
        ? {
            avatar_ai_verified: aiVerified,
            avatar_ai_confidence: aiConfidence,
            avatar_ai_checked_at: new Date().toISOString(),
          }
        : {}),
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil atualizado!");
    setPhotoFile(null);
    void recomputeMyBadges(user?.id);
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const min = Number(prefs.age_min);
    const max = Number(prefs.age_max);
    if (max < min) {
      toast.error("Idade máxima deve ser maior que mínima");
      return;
    }
    setSavingPrefs(true);
    const { error } = await supabase.from("profile_preferences").upsert({
      user_id: user.id,
      age_min: min,
      age_max: max,
      location_scope: prefs.location_scope,
      custom_states: prefs.location_scope === "personalizado" ? prefs.custom_states : [],
      desired_quality: prefs.desired_quality || null,
      accepts_children: prefs.accepts_children === "sim",
      looking_for_bio: prefs.looking_for_bio || null,
    });
    setSavingPrefs(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Preferências salvas!");
  }

  const setP = <K extends keyof typeof profile>(k: K, v: (typeof profile)[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));
  const togglePrefState = (s: string) =>
    setPrefs((p) => ({
      ...p,
      custom_states: p.custom_states.includes(s)
        ? p.custom_states.filter((x) => x !== s)
        : [...p.custom_states, s],
    }));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <AdminWarningBanner />
        <div className="animate-fade-up flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Meu perfil</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Edite suas informações e preferências de match.
            </p>
          </div>
          <StatusPill status={status} />
        </div>

        <Tabs defaultValue="profile" className="mt-8">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="profile" className="flex-1 sm:flex-none">
              Sobre mim
            </TabsTrigger>
            <TabsTrigger value="prefs" className="flex-1 sm:flex-none">
              Preferências
            </TabsTrigger>
            <TabsTrigger value="missions" className="flex-1 sm:flex-none">
              Conquistas
            </TabsTrigger>
            {isStaff && (
              <TabsTrigger value="role" className="flex-1 sm:flex-none">
                Cargo
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile" className="mt-6">
            <form
              onSubmit={saveProfile}
              className="glass animate-fade-up space-y-6 rounded-3xl p-6 shadow-elegant sm:p-8"
            >
              <div className="flex flex-col items-center gap-3">
                <label className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[var(--rose-soft)] bg-card/60 shadow-soft transition hover:border-[var(--rose)]">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                      <Camera className="h-6 w-6" />
                      <span className="mt-1 text-xs">Foto</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </label>
                <p className="text-xs text-muted-foreground">Clique para trocar (até 5MB)</p>
              </div>

              {user && (
                <div className="rounded-2xl border bg-card/50 p-4">
                  <ProfilePhotosManager userId={user.id} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setP("full_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Idade</Label>
                  <Input
                    type="number"
                    min={18}
                    max={110}
                    value={profile.age}
                    onChange={(e) => setP("age", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input
                    type="number"
                    min={120}
                    max={230}
                    value={profile.height_cm}
                    onChange={(e) => setP("height_cm", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select
                    value={profile.sex}
                    onValueChange={(v) => setP("sex", v as "masculino" | "feminino")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado civil</Label>
                  <Select
                    value={profile.marital}
                    onValueChange={(v) => setP("marital", v as "solteiro" | "divorciado")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={profile.city}
                    onChange={(e) => setP("city", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={profile.state} onValueChange={(v) => setP("state", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BR_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Igreja que frequenta</Label>
                  <Input
                    value={profile.church}
                    onChange={(e) => setP("church", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Anos de batismo</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={profile.years_baptized}
                    onChange={(e) => setP("years_baptized", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Sobre você</Label>
                  <Textarea
                    rows={4}
                    maxLength={600}
                    value={profile.bio}
                    onChange={(e) => setP("bio", e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={savingProfile}>
                <Save className="mr-2 h-4 w-4" /> {savingProfile ? "Salvando..." : "Salvar perfil"}
              </Button>
            </form>
            {user && (
              <div className="mt-6">
                <ProfileAdvancedForm userId={user.id} mode="about" />
              </div>
            )}
          </TabsContent>

          {/* Preferences tab */}
          <TabsContent value="prefs" className="mt-6">
            <form
              onSubmit={savePrefs}
              className="glass animate-fade-up space-y-6 rounded-3xl p-6 shadow-elegant sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Idade mínima</Label>
                  <Input
                    type="number"
                    min={18}
                    max={110}
                    value={prefs.age_min}
                    onChange={(e) => setPrefs({ ...prefs, age_min: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Idade máxima</Label>
                  <Input
                    type="number"
                    min={18}
                    max={110}
                    value={prefs.age_max}
                    onChange={(e) => setPrefs({ ...prefs, age_max: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Localização desejada</Label>
                <RadioGroup
                  value={prefs.location_scope}
                  onValueChange={(v) =>
                    setPrefs({ ...prefs, location_scope: v as typeof prefs.location_scope })
                  }
                >
                  {[
                    { v: "regiao", l: "Minha região" },
                    { v: "brasil", l: "Qualquer lugar do Brasil" },
                    { v: "mundo", l: "Qualquer lugar do mundo" },
                    { v: "personalizado", l: "Personalizado (estados)" },
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

              {prefs.location_scope === "personalizado" && (
                <div className="animate-fade-in space-y-2">
                  <Label>Estados</Label>
                  <div className="flex flex-wrap gap-2">
                    {BR_STATES.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => togglePrefState(s)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          prefs.custom_states.includes(s)
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
                <Label>Qualidade que busca</Label>
                <Input
                  value={prefs.desired_quality}
                  onChange={(e) => setPrefs({ ...prefs, desired_quality: e.target.value })}
                  placeholder="Ex: temor a Deus, integridade..."
                />
              </div>

              <div className="space-y-3">
                <Label>Aceita pessoa com filhos?</Label>
                <RadioGroup
                  value={prefs.accepts_children}
                  onValueChange={(v) =>
                    setPrefs({ ...prefs, accepts_children: v as "sim" | "nao" })
                  }
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
                <Label>Sobre o que procura</Label>
                <Textarea
                  rows={4}
                  maxLength={600}
                  value={prefs.looking_for_bio}
                  onChange={(e) => setPrefs({ ...prefs, looking_for_bio: e.target.value })}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={savingPrefs}>
                <Save className="mr-2 h-4 w-4" />{" "}
                {savingPrefs ? "Salvando..." : "Salvar preferências"}
              </Button>
            </form>
            {user && (
              <div className="mt-6">
                <ProfileAdvancedForm userId={user.id} mode="prefs" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="missions" className="mt-6">
            {/* placeholder anchor */}
            <div className="mb-4">
              <CoinsCard />
            </div>
            {user && <MissionsPanel userId={user.id} />}
            {hasContributorBadge && (
              <div className="glass mt-4 flex items-center justify-between rounded-2xl p-4 shadow-soft sm:p-5">
                <div className="pr-4">
                  <p className="font-medium text-foreground">Destaque verde nas mensagens</p>
                  <p className="text-xs text-muted-foreground">
                    Como Contribuidor, suas mensagens na comunidade ganham um destaque verde.
                    A badge ao lado do seu nome continua visível mesmo desligada.
                  </p>
                </div>
                <Switch
                  checked={contribHighlight}
                  disabled={savingContrib}
                  onCheckedChange={toggleContribHighlight}
                />
              </div>
            )}
          </TabsContent>

          {isStaff && (
            <TabsContent value="role" className="mt-6">
              <div className="glass animate-fade-up space-y-6 rounded-3xl p-6 shadow-elegant sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Seu cargo</h2>
                    <p className="text-sm text-muted-foreground">{roleCfg.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Pré-visualização</Label>
                  <div className="rounded-xl border border-border bg-card/40 p-4">
                    <RoleBadge
                      role={role}
                      color={localColor ?? roleCfg.defaultColor}
                      size="md"
                      showDescription
                    />
                  </div>
                </div>

                {(roleCfg.availableColors?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <Label>Cor da badge</Label>
                    <div className="flex flex-wrap gap-2">
                      {roleCfg.availableColors.map((c) => {
                        const hex = COLOR_HEX[c];
                        const selected = (localColor ?? roleCfg.defaultColor) === c;
                        return (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setLocalColor(c)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${selected ? "border-foreground" : "border-border"}`}
                            style={selected ? { boxShadow: `0 0 0 2px ${hex.ring}` } : undefined}
                          >
                            <span
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: hex.bg }}
                            />
                            {hex.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-4">
                  <div className="pr-4">
                    <p className="font-medium">Aparecer em Pretendentes</p>
                    <p className="text-xs text-muted-foreground">
                      Ligado por padrão. Desative para ocultar seu perfil da busca de pretendentes —
                      suas preferências são salvas automaticamente.
                    </p>
                  </div>
                  <Switch
                    checked={localPublic}
                    disabled={savingRole}
                    onCheckedChange={togglePublicListing}
                  />
                </div>

                <Button
                  onClick={saveRoleSettings}
                  disabled={savingRole}
                  size="lg"
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" /> {savingRole ? "Salvando..." : "Salvar cargo"}
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/dashboard" className="hover:text-[var(--rose)]">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "approved" | "rejected" | "banned" | null }) {
  if (!status) return null;
  const map = {
    pending: { Icon: Clock, label: "Em análise", cls: "bg-amber-50 text-amber-700" },
    approved: { Icon: CheckCircle2, label: "Aprovado", cls: "bg-emerald-50 text-emerald-700" },
    rejected: { Icon: XCircle, label: "Rejeitado", cls: "bg-red-50 text-red-700" },
    banned: { Icon: XCircle, label: "Suspenso", cls: "bg-red-50 text-red-700" },
  }[status];
  const { Icon } = map;
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${map.cls}`}
    >
      <Icon className="h-3.5 w-3.5" /> {map.label}
    </span>
  );
}
