import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { PhotoImg } from "@/components/PhotoImg";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { OfflineState } from "@/components/ui/OfflineState";
import { normalizeImageFile } from "@/lib/imageNormalize";
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
import { BioPromptChips } from "@/components/profile/BioPromptChips";
import { HomeStarterSection } from "@/components/home/HomeStarterSection";
import { BR_STATES } from "@/lib/constants";
import {
  Camera,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  User as UserIcon,
  Heart,
  Trophy,
  Briefcase,
  Wallet,
  Sparkles,
  MapPin,
  Church,
  CalendarHeart,
  Store,
  Eye,
  Gift as GiftIcon,
  PencilLine,
  Settings,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ROLE_CONFIG, COLOR_HEX, type RoleColor } from "@/lib/roles";
import { RoleBadge } from "@/components/RoleBadge";
import { MissionsPanel } from "@/components/MissionsPanel";
import { SaldoTab } from "@/components/SaldoTab";
import { recomputeMyBadges } from "@/lib/recomputeBadges";
import commitmentRing from "@/assets/commitment-ring.webp";
import { getActiveCommitmentByUser, type RelationshipCommitment } from "@/lib/commitments";
import {
  ProfileAdvancedForm,
  type ProfileAdvancedFormHandle,
} from "@/components/ProfileAdvancedForm";
import { NumericInput } from "@/components/ui/NumericInput";
import { ProfileAdvancedView } from "@/components/ProfileAdvancedView";
import { ProfilePhotosManager } from "@/components/ProfilePhotosManager";
import { AdminWarningBanner } from "@/components/AdminWarningBanner";
import { CustomizacaoTab } from "@/components/CustomizacaoTab";
import { ReceivedGiftsTab } from "@/components/gifts/ReceivedGiftsTab";
import { GradientName } from "@/components/GradientName";
import { fetchNameGradientsByIds, type NameGradient } from "@/lib/nameGradients";
import { ProfileActionHub, type HubSection } from "@/components/profile/ProfileActionHub";
import { PetProfileCard } from "@/components/PetProfileCard";
import { EquippedPetSidekick } from "@/components/EquippedPetSidekick";
import { prefetchPetEssentials } from "@/lib/petQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useNativeShellRuntime } from "@/components/native-shell/NativeShellRuntimeContext";
import { NativeProfileTabs } from "@/components/profile/native/NativeProfileTabs";
import { useRedesignRuntime } from "@/components/redesign-total/RedesignRuntimeContext";
import { RedesignProfileHero } from "@/components/redesign-total/profile/RedesignProfileHero";
import { RedesignProfileTabs } from "@/components/redesign-total/profile/RedesignProfileTabs";
import { VisualZeroProfile } from "@/components/redesign-zero/profile/VisualZeroProfile";
import "@/styles/native-profile.css";

export const Route = createFileRoute("/perfil")({
  component: PerfilPage,
  validateSearch: (search: Record<string, unknown>) => {
    const rawTab = search.tab;
    const allowed = new Set([
      "profile",
      "prefs",
      "customizacao",
      "saldo",
      "presentes",
      "missions",
      "role",
    ]);
    const tab = typeof rawTab === "string" && allowed.has(rawTab) ? rawTab : undefined;
    const edit = search.edit === 1 || search.edit === "1" || search.edit === true ? 1 : undefined;
    return { tab, edit } as { tab?: string; edit?: 1 };
  },
  head: () => ({
    meta: [
      { title: "Meu Perfil — VaiDarNamoro" },
      {
        name: "description",
        content:
          "Edite seu perfil no VaiDarNamoro: fotos, bio, interesses e preferências para encontrar relacionamentos cristãos sérios com propósito.",
      },
      { property: "og:title", content: "Meu Perfil — VaiDarNamoro" },
      {
        property: "og:description",
        content: "Gerencie suas fotos, bio e preferências no VaiDarNamoro.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(18).max(110),
  height_cm: z.coerce.number().int().min(120).max(230).optional().or(z.literal("")),
  sex: z.enum(["masculino", "feminino"]),
  marital: z.enum(["solteiro", "divorciado", "viuvo"]),
  city: z.string().trim().min(2).max(80),
  state: z.string().length(2),
  church: z.string().trim().min(2).max(120),
  years_baptized: z.coerce.number().int().min(0).max(100),
  bio: z.string().trim().max(600).optional(),
});

function PerfilPage() {
  const { user, loading, role, badgeColor, publicListing, refreshRole } = useAuth();
  const { isOnline } = useNetworkStatus();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { active: nativeShellActive } = useNativeShellRuntime();
  const { active: totalRedesignActive } = useRedesignRuntime();

  // Pré-aquece os dados do pet/cenário assim que o /perfil monta — ao
  // navegar para /meu-pet (ou aos cards de pet no próprio perfil) a UI
  // pinta sem flash de loading.
  useEffect(() => {
    if (!user?.id) return;
    void prefetchPetEssentials(queryClient, user.id);
  }, [user?.id, queryClient]);

  const [savingRole, setSavingRole] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("profile");
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
        supabase.from("profiles").select("contributor_highlight").eq("id", user.id).maybeSingle(),
      ]);
      if (!alive) return;
      const has = (
        (badgeData ?? []) as Array<{
          active: boolean;
          expires_at: string | null;
          badges: { code: string } | null;
        }>
      ).some(
        (r) =>
          r.badges?.code === "contributor" &&
          (!r.expires_at || new Date(r.expires_at) > new Date()),
      );
      setHasContributorBadge(has);
      setContribHighlight(
        (profData as { contributor_highlight?: boolean | null } | null)?.contributor_highlight !==
          false,
      );
    })();
    return () => {
      alive = false;
    };
  }, [user]);
  useEffect(() => {
    if (!user) return;

    (async () => {
      const commitment = await getActiveCommitmentByUser(user.id);

      setActiveCommitment(commitment);

      if (!commitment) return;

      const partnerId = commitment.user_a === user.id ? commitment.user_b : commitment.user_a;

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", partnerId)
        .maybeSingle();

      setCommitmentPartner(data?.full_name ?? null);
    })();
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const advancedAboutRef = useRef<ProfileAdvancedFormHandle | null>(null);
  const advancedPrefsRef = useRef<ProfileAdvancedFormHandle | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);

  // Apply ?tab=...&edit=1 deep-links (e.g. coming from /inicio missions).
  useEffect(() => {
    if (search?.tab) {
      setActiveTab(search.tab);
    }
    if (search?.edit === 1) {
      if (!search.tab || search.tab === "profile") setEditingProfile(true);
      if (search.tab === "prefs") setEditingPrefs(true);
    }
    if (search?.tab || search?.edit) {
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          document
            .getElementById("perfil-tabs")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    }
  }, [search?.tab, search?.edit]);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "banned" | null>(null);
  const [activeCommitment, setActiveCommitment] = useState<RelationshipCommitment | null>(null);
  const [profileNameGradient, setProfileNameGradient] = useState<NameGradient | null>(null);

  const [commitmentPartner, setCommitmentPartner] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    full_name: "",
    age: "",
    height_cm: "",
    sex: "" as "" | "masculino" | "feminino",
    marital: "" as "" | "solteiro" | "divorciado" | "viuvo",
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

  // Main profile data — cached via TanStack Query so revisiting /perfil
  // shows instantly (no white flash) and works while offline as long as
  // it was loaded once. Preferences stay in their own effect (out of scope
  // for this etapa).
  const profileMainQuery = useQuery({
    queryKey: ["profile-main", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Sync query data into the existing local form state. Only run when the
  // user is NOT currently editing — otherwise a refetch would overwrite
  // text the user is typing.
  useEffect(() => {
    const p = profileMainQuery.data;
    if (!p) return;
    if (editingProfile) return;
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
    if (p.photo_url && !photoFile) setPhotoPreview(p.photo_url);
    // photoFile intentionally not in deps — we only care about the current
    // value at sync time and re-syncing on every file change is wrong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileMainQuery.data, editingProfile]);

  // Gradient lookup is async and depends on the equipped id — keep it as a
  // separate effect so it can re-run independently.
  useEffect(() => {
    const p = profileMainQuery.data;
    if (!p) return;
    let alive = true;
    (async () => {
      const gradients = await fetchNameGradientsByIds([p.equipped_name_gradient_id]);
      if (!alive) return;
      setProfileNameGradient(
        p.equipped_name_gradient_id ? (gradients[p.equipped_name_gradient_id] ?? null) : null,
      );
    })();
    return () => {
      alive = false;
    };
  }, [profileMainQuery.data]);

  // Preferences — load is unchanged from before; kept out of this etapa's
  // refactor scope to avoid touching the prefs form behaviour.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data: pr } = await supabase
        .from("profile_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive || !pr) return;
      setPrefs({
        age_min: String(pr.age_min),
        age_max: String(pr.age_max),
        location_scope: pr.location_scope,
        custom_states: pr.custom_states ?? [],
        desired_quality: pr.desired_quality ?? "",
        accepts_children: pr.accepts_children ? "sim" : "nao",
        looking_for_bio: pr.looking_for_bio ?? "",
      });
    })();
    return () => {
      alive = false;
    };
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

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const name = (raw.name || "").toLowerCase();
    const looksHeic = name.endsWith(".heic") || name.endsWith(".heif");
    if (!raw.type.startsWith("image/") && !looksHeic) {
      toast.error("Selecione uma imagem (JPG, PNG, WEBP, HEIC).");
      return;
    }
    if (raw.size > 10 * 1024 * 1024) {
      toast.error("Foto muito grande (máx. 10MB).");
      return;
    }
    const t = toast.loading("Preparando sua foto...");
    let f = raw;
    try {
      f = await normalizeImageFile(raw);
    } finally {
      toast.dismiss(t);
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Foto até 8MB após conversão. Tente uma imagem menor.");
      return;
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para salvar alterações.");
      return;
    }
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
    // Also persist the embedded "Sobre mim" advanced section under the same click.
    const advOk = (await advancedAboutRef.current?.saveAdvanced()) ?? true;
    if (!advOk) return;
    toast.success("Perfil atualizado!");
    setPhotoFile(null);
    setEditingProfile(false);
    void recomputeMyBadges(user?.id);
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para salvar alterações.");
      return;
    }
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
    if (error) {
      setSavingPrefs(false);
      toast.error(error.message);
      return;
    }
    // Also persist the embedded "preferences" advanced section.
    const advOk = (await advancedPrefsRef.current?.saveAdvanced()) ?? true;
    setSavingPrefs(false);
    if (!advOk) return;
    toast.success("Preferências salvas!");
    setEditingPrefs(false);
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

  const panelClass = totalRedesignActive
    ? "rd-profile-panel"
    : "rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-[0_20px_70px_rgba(31,41,55,0.08)] backdrop-blur sm:p-6 dark:bg-card/80 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

  const scrollToTabs = () => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      document
        .getElementById("perfil-tabs")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const handleHubSelect = (id: HubSection) => {
    if (id === "preferences") {
      setActiveTab("prefs");
    } else {
      setActiveTab("profile");
      if (id === "identity" || id === "faith") {
        setEditingProfile(true);
      }
    }
    scrollToTabs();
  };

  const handleHubResource = (id: "missions" | "role" | "customizacao" | "saldo" | "presentes") => {
    setActiveTab(id);
    scrollToTabs();
  };

  const tabItems = [
    { value: "profile", label: "Sobre mim", icon: UserIcon, hint: "Dados, fotos e historia" },
    { value: "prefs", label: "O que procuro", icon: Heart, hint: "Suas preferencias" },
    {
      value: "customizacao",
      label: "Visual",
      icon: Sparkles,
      hint: "Molduras, auras e fundos",
    },
    { value: "saldo", label: "Minhas moedas", icon: Wallet, hint: "Saldo e compras" },
    { value: "presentes", label: "Presentes", icon: GiftIcon, hint: "Recebidos no perfil" },
    { value: "missions", label: "Minhas conquistas", icon: Trophy, hint: "Missoes e badges" },
    ...(isStaff
      ? [{ value: "role", label: "Meu papel", icon: Briefcase, hint: "Badge e visibilidade" }]
      : []),
  ];
  const nativeTabItems = tabItems.map(({ value }) => ({
    value,
    label:
      value === "profile"
        ? "Perfil"
        : value === "prefs"
          ? "Preferências"
          : value === "saldo"
            ? "Moedas"
            : value === "missions"
              ? "Conquistas"
              : value === "role"
                ? "Meu papel"
                : value === "customizacao"
                  ? "Visual"
                  : "Presentes",
  }));

  if (totalRedesignActive) {
    return (
      <VisualZeroProfile
        userId={user?.id}
        profile={profile}
        preferences={prefs}
        photoUrl={photoPreview}
        nameGradient={profileNameGradient}
        status={status}
        activeTab={activeTab}
        online={isOnline}
        loading={profileMainQuery.isLoading}
        stale={!isOnline && Boolean(profileMainQuery.data)}
        savingProfile={savingProfile}
        savingPreferences={savingPrefs}
        commitment={
          activeCommitment
            ? { matchId: activeCommitment.match_id, partner: commitmentPartner }
            : null
        }
        isStaff={isStaff}
        roleLabel={roleCfg.label}
        roleColor={localColor ?? roleCfg.defaultColor}
        availableRoleColors={roleCfg.availableColors}
        publicListing={localPublic}
        savingRole={savingRole}
        contributor={hasContributorBadge}
        contributorHighlight={contribHighlight}
        savingContributor={savingContrib}
        onTabChange={setActiveTab}
        onProfileFieldChange={setP}
        onPreferenceFieldChange={(key, value) =>
          setPrefs((current) => ({ ...current, [key]: value }))
        }
        onPhotoChange={handlePhoto}
        onSaveProfile={saveProfile}
        onSavePreferences={savePrefs}
        onRoleColorChange={setLocalColor}
        onPublicListingChange={(value) => void togglePublicListing(value)}
        onSaveRole={() => void saveRoleSettings()}
        onContributorHighlightChange={(value) => void toggleContribHighlight(value)}
      />
    );
  }

  return (
    <div
      data-vdn-native-profile={nativeShellActive ? "" : undefined}
      data-vdn-total-redesign-profile={totalRedesignActive ? "" : undefined}
      className="min-h-screen overflow-x-hidden bg-background"
    >
      {!nativeShellActive && <Header />}
      {!nativeShellActive && <MobileAppHeader title="Perfil" subtitle="Sua conta e seu visual" />}
      <main className="native-profile__main relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div
          aria-hidden="true"
          className="native-profile__ambient pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-white dark:bg-[linear-gradient(120deg,rgba(10,16,34,0.98),rgba(17,31,63,0.82)_34%,rgba(18,44,82,0.78)_70%,rgba(42,35,22,0.44))]"
        />
        <AdminWarningBanner />
        {!isOnline && profileMainQuery.data && (
          <div className="mb-4">
            <StaleDataNotice />
          </div>
        )}
        {!isOnline && !profileMainQuery.data && !profileMainQuery.isLoading && (
          <div className="mb-6">
            <OfflineState
              compact
              title="Perfil indisponível offline"
              description="Abra esta tela conectado para carregar seus dados."
            />
          </div>
        )}
        {totalRedesignActive ? (
          <>
            <RedesignProfileHero
              photoUrl={photoPreview}
              name={
                <GradientName
                  name={profile.full_name}
                  gradient={profileNameGradient}
                  fallback="Meu perfil"
                />
              }
              status={
                status === "approved"
                  ? "Aprovado"
                  : status === "rejected"
                    ? "Revisão necessária"
                    : status === "banned"
                      ? "Acesso restrito"
                      : "Em análise"
              }
              roleBadge={
                isStaff ? (
                  <RoleBadge role={role} color={localColor ?? roleCfg.defaultColor} size="sm" />
                ) : undefined
              }
              contributor={hasContributorBadge}
              age={profile.age}
              state={profile.state || null}
              range={`${prefs.age_min}-${prefs.age_max}`}
              location={[profile.city, profile.state].filter(Boolean).join(", ")}
              church={profile.church}
              baptism={
                profile.years_baptized ? `${profile.years_baptized} ano(s)` : "Não informado"
              }
              userId={user?.id}
              petCard={user ? <PetProfileCard userId={user.id} linkToManager /> : undefined}
              commitment={
                activeCommitment ? (
                  <div className="rd-profile-hero__commitment">
                    <img src={commitmentRing} alt="" />
                    <span>
                      <strong>Propósito firmado</strong>
                      <small>
                        {commitmentPartner
                          ? `Você está em propósito com ${commitmentPartner}.`
                          : "Você está em propósito."}
                      </small>
                    </span>
                    <Link to="/proposito/$matchId" params={{ matchId: activeCommitment.match_id }}>
                      Abrir
                    </Link>
                  </div>
                ) : undefined
              }
              onPhotoClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/heic,image/heif"
              onChange={handlePhoto}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </>
        ) : (
          <section className="native-profile__identity animate-fade-up overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/75 shadow-[0_26px_90px_rgba(31,41,55,0.10)] backdrop-blur dark:bg-card/72 dark:shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
            <div className="grid w-full min-w-0 gap-0 lg:grid-cols-[380px_minmax(0,1fr)]">
              <div className="native-profile__identity-media relative w-full min-w-0 overflow-hidden min-h-[320px] bg-[linear-gradient(145deg,#fff7ed,#fdf2f8_45%,#eff6ff)] p-4 dark:bg-[linear-gradient(145deg,rgba(49,22,38,0.88),rgba(20,20,34,0.94)_46%,rgba(15,35,58,0.88))] sm:p-8">
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-card/80 to-transparent" />
                <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
                      Meu espaco
                    </span>
                    <StatusPill status={status} />
                  </div>

                  <div className="flex w-full min-w-0 flex-col items-center text-center">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Trocar foto de perfil"
                        className="native-profile__avatar app-pressable group relative h-36 w-36 max-w-full cursor-pointer overflow-hidden rounded-[2rem] border border-border/70 bg-background/70 p-2 shadow-[0_22px_60px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.22)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:h-44 sm:w-44"
                      >
                        <span className="block h-full w-full overflow-hidden rounded-[1.55rem] bg-card">
                          {photoPreview ? (
                            <PhotoImg
                              src={photoPreview}
                              alt=""
                              className="pointer-events-none h-full w-full object-cover"
                            />
                          ) : (
                            <span className="pointer-events-none flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                              <Camera className="h-7 w-7" />
                              <span className="mt-2 text-sm">Adicionar foto</span>
                            </span>
                          )}
                        </span>
                        <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--rose)] text-white shadow-lg">
                          <Camera className="h-5 w-5" />
                        </span>
                      </button>
                      {user && (
                        <EquippedPetSidekick
                          userId={user.id}
                          size={95}
                          className="-right-14 bottom-2 sm:-right-16 sm:bottom-3"
                        />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,image/heic,image/heif"
                      onChange={handlePhoto}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    />

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      {isStaff && (
                        <RoleBadge
                          role={role}
                          color={localColor ?? roleCfg.defaultColor}
                          size="sm"
                        />
                      )}
                      {hasContributorBadge && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                          Contribuidor
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid w-full min-w-0 grid-cols-3 gap-2 text-center">
                    <div className="min-w-0 rounded-2xl bg-background/70 p-2 shadow-soft backdrop-blur dark:bg-background/35 sm:p-3">
                      <p className="truncate text-base font-semibold text-foreground sm:text-lg">
                        {profile.age || "--"}
                      </p>
                      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                        anos
                      </p>
                    </div>
                    <div className="min-w-0 rounded-2xl bg-background/70 p-2 shadow-soft backdrop-blur dark:bg-background/35 sm:p-3">
                      <p className="truncate text-base font-semibold text-foreground sm:text-lg">
                        {profile.state || "--"}
                      </p>
                      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                        estado
                      </p>
                    </div>
                    <div className="min-w-0 rounded-2xl bg-background/70 p-2 shadow-soft backdrop-blur dark:bg-background/35 sm:p-3">
                      <p className="truncate text-base font-semibold text-foreground sm:text-lg">
                        {prefs.age_min}-{prefs.age_max}
                      </p>
                      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                        busca
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 p-4 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 w-full">
                    <p className="hidden text-sm font-medium text-[var(--rose)] sm:block">
                      Perfil pessoal
                    </p>
                    <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl [overflow-wrap:anywhere]">
                      <GradientName
                        name={profile.full_name}
                        gradient={profileNameGradient}
                        fallback="Meu perfil"
                      />
                    </h1>
                    <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-muted-foreground sm:block sm:text-base">
                      Organize sua apresentacao, fotos, preferencias e personalizacoes em um painel
                      mais claro e bonito.
                    </p>
                  </div>

                  <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                    {user && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-full bg-background/70 backdrop-blur sm:size-default"
                      >
                        <Link to="/pretendentes/$id" params={{ id: user.id }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver público
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="sm" className="shrink-0 rounded-full sm:size-default">
                      <Link to="/loja">
                        <Store className="mr-2 h-4 w-4" />
                        Loja
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* MOBILE: quick actions row */}
                {user && (
                  <div className="mt-4">
                    <PetProfileCard userId={user.id} linkToManager />
                  </div>
                )}
                <div className="mt-5 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[
                    {
                      label: "Editar",
                      icon: Eye,
                      onClick: () => {
                        setActiveTab("profile");
                        setEditingProfile(true);
                      },
                    },
                    {
                      label: "Visual",
                      icon: Sparkles,
                      onClick: () => setActiveTab("customizacao"),
                    },
                    { label: "Saldo", icon: Store, onClick: () => setActiveTab("saldo") },
                    { label: "Presentes", icon: Heart, onClick: () => setActiveTab("presentes") },
                  ].map((q) => {
                    const QIcon = q.icon;
                    return (
                      <button
                        key={q.label}
                        type="button"
                        onClick={q.onClick}
                        className="app-pressable flex min-w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-background/80 px-3 py-2.5 text-center shadow-sm backdrop-blur"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--petal)] text-[var(--rose)]">
                          <QIcon className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-semibold leading-tight text-foreground">
                          {q.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 hidden gap-3 sm:mt-8 sm:grid sm:grid-cols-3">
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 dark:border-rose-400/20 dark:bg-rose-400/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-200">
                      <MapPin className="h-4 w-4" />
                      Localizacao
                    </div>
                    <p className="mt-2 truncate text-sm text-foreground">
                      {[profile.city, profile.state].filter(Boolean).join(", ") || "Nao informada"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-400/20 dark:bg-sky-400/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-200">
                      <Church className="h-4 w-4" />
                      Igreja
                    </div>
                    <p className="mt-2 truncate text-sm text-foreground">
                      {profile.church || "Nao informada"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-200">
                      <CalendarHeart className="h-4 w-4" />
                      Batismo
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      {profile.years_baptized
                        ? `${profile.years_baptized} ano(s)`
                        : "Nao informado"}
                    </p>
                  </div>
                </div>

                {activeCommitment && (
                  <div className="mt-5 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-card to-teal-50 p-3.5 shadow-soft dark:border-emerald-400/25 dark:from-emerald-500/15 dark:via-card/80 dark:to-teal-500/10 sm:mt-6 sm:p-5">
                    <div className="flex flex-row items-center gap-3 sm:gap-4">
                      <img
                        src={commitmentRing}
                        alt=""
                        className="h-11 w-11 shrink-0 object-contain drop-shadow-sm sm:h-14 sm:w-14"
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 sm:text-base">
                          Proposito Firmado
                        </h2>
                        <p className="truncate text-xs text-emerald-700 dark:text-emerald-100/80 sm:text-sm">
                          {commitmentPartner
                            ? `Voce esta em proposito com ${commitmentPartner}.`
                            : "Voce esta em proposito."}
                        </p>
                      </div>
                      <Button asChild size="sm" className="shrink-0 rounded-full sm:size-default">
                        <Link
                          to="/proposito/$matchId"
                          params={{
                            matchId: activeCommitment.match_id,
                          }}
                        >
                          Página
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {user && (
          <HomeStarterSection
            userId={user.id}
            topSpacing
            onAction={(id) => {
              const scrollTop = () => {
                if (typeof window === "undefined") return;
                window.setTimeout(() => {
                  const el = document.getElementById("perfil-tabs");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 60);
              };
              if (id === "photo" || id === "extra_photos") {
                setActiveTab("profile");
                setEditingProfile(true);
                scrollTop();
                return true;
              }
              if (
                id === "name" ||
                id === "bio" ||
                id === "city" ||
                id === "marital" ||
                id === "church" ||
                id === "height" ||
                id === "seeking"
              ) {
                setActiveTab("profile");
                setEditingProfile(true);
                scrollTop();
                return true;
              }
              if (id === "looking_for_bio") {
                setActiveTab("prefs");
                setEditingPrefs(true);
                scrollTop();
                return true;
              }
              if (id === "free_frame") {
                setActiveTab("customizacao");
                scrollTop();
                return true;
              }
              return false;
            }}
          />
        )}
        <div id="perfil-tabs" />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          {nativeShellActive &&
            (totalRedesignActive ? (
              <RedesignProfileTabs
                activeTab={activeTab}
                items={nativeTabItems}
                onTabChange={setActiveTab}
              />
            ) : (
              <NativeProfileTabs
                activeTab={activeTab}
                items={nativeTabItems}
                onTabChange={setActiveTab}
              />
            ))}
          <div
            className={`grid gap-6 ${
              nativeShellActive ? "" : "lg:grid-cols-[292px_minmax(0,1fr)]"
            }`}
          >
            {!nativeShellActive && (
              <aside className="hidden lg:block">
                <div className="sticky top-24 rounded-[2rem] border border-border/70 bg-card/80 p-3 shadow-[0_18px_60px_rgba(31,41,55,0.08)] backdrop-blur dark:shadow-[0_22px_70px_rgba(0,0,0,0.36)]">
                  <div className="px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Editar perfil
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Escolha uma area para ajustar.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {tabItems.map(({ value, label, hint, icon: Icon }) => {
                      const active = activeTab === value;
                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() => setActiveTab(value)}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                            active
                              ? "bg-[var(--rose)] text-white shadow-[0_12px_30px_rgba(190,18,60,0.22)]"
                              : "text-muted-foreground hover:bg-rose-50 hover:text-foreground dark:hover:bg-rose-400/10"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              active ? "bg-white/20" : "bg-background"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{label}</span>
                            <span
                              className={`block truncate text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}
                            >
                              {hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>
            )}

            <div className="min-w-0">
              {!nativeShellActive && (
                <ProfileActionHub
                  activeTab={activeTab}
                  isStaff={isStaff}
                  onSelect={handleHubSelect}
                  onOpenResource={handleHubResource}
                />
              )}

              {/* Profile tab */}
              <TabsContent value="profile" className="mt-6 lg:mt-0">
                {!editingProfile ? (
                  <div className={`${panelClass} animate-fade-up space-y-6`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
                          Sobre mim
                        </p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight">
                          <GradientName
                            name={profile.full_name}
                            gradient={profileNameGradient}
                            fallback="Meu perfil"
                          />
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Resumo público das principais informações do seu perfil.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setEditingProfile(true)}
                        className="rounded-full max-sm:h-[58px] max-sm:w-[58px] max-sm:flex-col max-sm:gap-1 max-sm:px-0 max-sm:text-[11px]"
                      >
                        <Settings className="h-5 w-5 sm:hidden" />
                        <PencilLine className="mr-2 h-4 w-4 max-sm:hidden" />
                        <span className="max-sm:hidden">Editar perfil</span>
                        <span className="hidden max-sm:inline">Editar</span>
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <SummaryItem
                        label="Idade"
                        value={profile.age ? `${profile.age} anos` : "Não informada"}
                      />
                      <SummaryItem
                        label="Localização"
                        value={
                          [profile.city, profile.state].filter(Boolean).join(", ") ||
                          "Não informada"
                        }
                      />
                      <SummaryItem label="Igreja" value={profile.church || "Não informada"} />
                      <SummaryItem
                        label="Batismo"
                        value={
                          profile.years_baptized
                            ? `${profile.years_baptized} ano(s)`
                            : "Não informado"
                        }
                      />
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/55 p-4 dark:bg-background/25">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Bio
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                        {profile.bio || "Você ainda não adicionou uma apresentação."}
                      </p>
                    </div>

                    {user && <ProfileAdvancedView userId={user.id} />}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingProfile(false)}
                        className="rounded-full"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Fechar edição
                      </Button>
                    </div>
                    <form
                      onSubmit={saveProfile}
                      className={`${panelClass} animate-fade-up space-y-6`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Trocar foto de perfil"
                          className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[var(--rose-soft)] bg-card/60 shadow-soft transition hover:border-[var(--rose)]"
                        >
                          {photoPreview ? (
                            <PhotoImg
                              src={photoPreview}
                              alt=""
                              className="pointer-events-none h-full w-full object-cover"
                            />
                          ) : (
                            <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                              <Camera className="h-6 w-6" />
                              <span className="mt-1 text-xs">Foto</span>
                            </div>
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,image/heic,image/heif"
                          onChange={handlePhoto}
                          className="sr-only"
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                        <p className="text-xs text-muted-foreground">
                          Clique para trocar (até 5MB)
                        </p>
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
                          <NumericInput
                            min={18}
                            max={110}
                            maxLength={3}
                            value={profile.age}
                            onChange={(v) => setP("age", v)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Altura (cm)</Label>
                          <NumericInput
                            min={120}
                            max={230}
                            maxLength={3}
                            value={profile.height_cm}
                            onChange={(v) => setP("height_cm", v)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sexo</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { v: "masculino", l: "Homem" },
                              { v: "feminino", l: "Mulher" },
                            ].map((o) => {
                              const active = profile.sex === o.v;
                              return (
                                <button
                                  key={o.v}
                                  type="button"
                                  onClick={() => setP("sex", o.v as "masculino" | "feminino")}
                                  className={`app-pressable rounded-full border px-4 py-2 text-sm transition ${
                                    active
                                      ? "border-[var(--rose)] bg-[var(--rose)] text-white"
                                      : "border-border bg-background text-foreground"
                                  }`}
                                >
                                  {o.l}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Estado civil</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { v: "solteiro", l: "Solteiro(a)" },
                              { v: "divorciado", l: "Divorciado(a)" },
                              { v: "viuvo", l: "Viúvo(a)" },
                            ].map((o) => {
                              const active = profile.marital === o.v;
                              return (
                                <button
                                  key={o.v}
                                  type="button"
                                  onClick={() =>
                                    setP("marital", o.v as "solteiro" | "divorciado" | "viuvo")
                                  }
                                  className={`app-pressable rounded-full border px-4 py-2 text-sm transition ${
                                    active
                                      ? "border-[var(--rose)] bg-[var(--rose)] text-white"
                                      : "border-border bg-background text-foreground"
                                  }`}
                                >
                                  {o.l}
                                </button>
                              );
                            })}
                          </div>
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
                          <NumericInput
                            min={0}
                            max={100}
                            maxLength={3}
                            value={profile.years_baptized}
                            onChange={(v) => setP("years_baptized", v)}
                            required
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Sobre você</Label>
                          <BioPromptChips
                            current={profile.bio}
                            onApply={(starter: string) =>
                              setP("bio", starter + (profile.bio ?? ""))
                            }
                          />
                          <Textarea
                            rows={4}
                            maxLength={600}
                            value={profile.bio}
                            onChange={(e) => setP("bio", e.target.value)}
                          />
                        </div>
                      </div>

                      {user && (
                        <div className="-mx-1">
                          <ProfileAdvancedForm
                            ref={advancedAboutRef}
                            userId={user.id}
                            mode="about"
                            hideSubmit
                            silentToast
                          />
                        </div>
                      )}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={savingProfile || !isOnline}
                        title={
                          !isOnline
                            ? "Disponível online. Reconecte-se para salvar alterações."
                            : undefined
                        }
                      >
                        <Save className="mr-2 h-4 w-4" />{" "}
                        {!isOnline
                          ? "Salvar (offline)"
                          : savingProfile
                            ? "Salvando..."
                            : "Salvar sobre mim"}
                      </Button>
                    </form>
                  </>
                )}
              </TabsContent>

              {/* Preferences tab */}
              <TabsContent value="prefs" className="mt-6 lg:mt-0">
                {!editingPrefs ? (
                  <div className={`${panelClass} animate-fade-up space-y-6`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
                          Preferências
                        </p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight">
                          O que você busca
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Um resumo das suas escolhas para conexões e compatibilidade.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setEditingPrefs(true)}
                        className="rounded-full max-sm:h-[58px] max-sm:w-[58px] max-sm:flex-col max-sm:gap-1 max-sm:px-0 max-sm:text-[11px]"
                      >
                        <Settings className="h-5 w-5 sm:hidden" />
                        <PencilLine className="mr-2 h-4 w-4 max-sm:hidden" />
                        <span className="max-sm:hidden">Editar preferências</span>
                        <span className="hidden max-sm:inline">Editar</span>
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <SummaryItem label="Idade" value={`${prefs.age_min}-${prefs.age_max} anos`} />
                      <SummaryItem
                        label="Localização"
                        value={
                          prefs.location_scope === "personalizado"
                            ? prefs.custom_states.length
                              ? prefs.custom_states.join(", ")
                              : "Estados personalizados"
                            : prefs.location_scope === "regiao"
                              ? "Minha região"
                              : prefs.location_scope === "brasil"
                                ? "Brasil todo"
                                : "Mundo todo"
                        }
                      />
                      <SummaryItem
                        label="Filhos"
                        value={
                          prefs.accepts_children === "sim" ? "Aceita filhos" : "Não aceita filhos"
                        }
                      />
                      <SummaryItem
                        label="Qualidade"
                        value={prefs.desired_quality || "Não informada"}
                      />
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/55 p-4 dark:bg-background/25">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Sobre o que procura
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                        {prefs.looking_for_bio || "Você ainda não descreveu o que procura."}
                      </p>
                    </div>

                    {user && <ProfileAdvancedView userId={user.id} />}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingPrefs(false)}
                        className="rounded-full"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Fechar edição
                      </Button>
                    </div>
                    <form
                      onSubmit={savePrefs}
                      className={`${panelClass} animate-fade-up space-y-6`}
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Idade mínima</Label>
                          <NumericInput
                            min={18}
                            max={110}
                            maxLength={3}
                            value={prefs.age_min}
                            onChange={(v) => setPrefs({ ...prefs, age_min: v })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Idade máxima</Label>
                          <NumericInput
                            min={18}
                            max={110}
                            maxLength={3}
                            value={prefs.age_max}
                            onChange={(v) => setPrefs({ ...prefs, age_max: v })}
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
                        <BioPromptChips
                          variant="looking_for"
                          current={prefs.looking_for_bio}
                          onApply={(starter: string) =>
                            setPrefs({
                              ...prefs,
                              looking_for_bio: starter + (prefs.looking_for_bio ?? ""),
                            })
                          }
                        />
                        <Textarea
                          rows={4}
                          maxLength={600}
                          value={prefs.looking_for_bio}
                          onChange={(e) => setPrefs({ ...prefs, looking_for_bio: e.target.value })}
                        />
                      </div>

                      {user && (
                        <div className="-mx-1">
                          <ProfileAdvancedForm
                            ref={advancedPrefsRef}
                            userId={user.id}
                            mode="prefs"
                            hideSubmit
                            silentToast
                          />
                        </div>
                      )}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={savingPrefs || !isOnline}
                        title={
                          !isOnline
                            ? "Disponível online. Reconecte-se para salvar alterações."
                            : undefined
                        }
                      >
                        <Save className="mr-2 h-4 w-4" />{" "}
                        {!isOnline
                          ? "Salvar (offline)"
                          : savingPrefs
                            ? "Salvando..."
                            : "Salvar preferências"}
                      </Button>
                    </form>
                  </>
                )}
              </TabsContent>

              <TabsContent value="missions" className="mt-6 lg:mt-0">
                {user && <MissionsPanel userId={user.id} />}
                {hasContributorBadge && (
                  <div className="glass mt-4 flex items-center justify-between rounded-2xl p-4 shadow-soft sm:p-5">
                    <div className="pr-4">
                      <p className="font-medium text-foreground">Destaque verde nas mensagens</p>
                      <p className="text-xs text-muted-foreground">
                        Como Contribuidor, suas mensagens na comunidade ganham um destaque verde. A
                        badge ao lado do seu nome continua visível mesmo desligada.
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

              <TabsContent value="saldo" className="mt-6 lg:mt-0">
                <div className={panelClass}>{user && <SaldoTab />}</div>
              </TabsContent>

              <TabsContent value="customizacao" className="mt-6 lg:mt-0">
                <div className={panelClass}>
                  {user && <CustomizacaoTab photoUrl={photoPreview ?? null} />}
                </div>
              </TabsContent>

              <TabsContent value="presentes" className="mt-6 lg:mt-0">
                <div className={panelClass}>{user && <ReceivedGiftsTab userId={user.id} />}</div>
              </TabsContent>

              {isStaff && (
                <TabsContent value="role" className="mt-6 lg:mt-0">
                  <div className={`${panelClass} animate-fade-up space-y-6`}>
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
                                style={
                                  selected ? { boxShadow: `0 0 0 2px ${hex.ring}` } : undefined
                                }
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
                          Ligado por padrão. Desative para ocultar seu perfil da busca de
                          pretendentes — suas preferências são salvas automaticamente.
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
                      <Save className="mr-2 h-4 w-4" />{" "}
                      {savingRole ? "Salvando..." : "Salvar cargo"}
                    </Button>
                  </div>
                </TabsContent>
              )}
            </div>
          </div>
        </Tabs>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/inicio" className="hover:text-[var(--rose)]">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/65 p-4 shadow-soft dark:bg-background/30">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "approved" | "rejected" | "banned" | null }) {
  if (!status) return null;
  const map = {
    pending: {
      Icon: Clock,
      label: "Em análise",
      cls: "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
    },
    approved: {
      Icon: CheckCircle2,
      label: "Aprovado",
      cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    },
    rejected: {
      Icon: XCircle,
      label: "Rejeitado",
      cls: "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-200",
    },
    banned: {
      Icon: XCircle,
      label: "Suspenso",
      cls: "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-200",
    },
  }[status];
  const { Icon } = map;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${map.cls}`}
    >
      <Icon className="h-3.5 w-3.5" /> {map.label}
    </span>
  );
}
