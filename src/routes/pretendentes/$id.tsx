import { friendlyError } from "@/lib/errors";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MapPin, Church, Heart, Flag, Ban, MessageCircle, Check, Sparkles, Baby, Globe2, ShieldOff, MoreVertical, Send, HandHeart, Ruler, BookOpen, UserRound, Quote, Crown } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";
import { ProfileAdvancedView } from "@/components/ProfileAdvancedView";
import { ROLE_PRIORITY, type AppRole, type RoleColor } from "@/lib/roles";
import { SendAnonymousButton } from "@/components/anonymous/SendAnonymousButton";
import { PhotoImg } from "@/components/PhotoImg";
import { cn } from "@/lib/utils";

type Full = {
  id: string; full_name: string; age: number; height_cm: number | null;
  city: string; state: string; church: string; bio: string | null;
  photo_url: string | null; marital: string; years_baptized: number; sex: string; verified?: boolean;
};
type Prefs = {
  age_min: number;
  age_max: number;
  accepts_children: boolean;
  desired_quality: string | null;
  looking_for_bio: string | null;
  location_scope: string;
  custom_states: string[] | null;
};

export const Route = createFileRoute("/pretendentes/$id")({ component: () => (<RequireApproved><Detail /></RequireApproved>) });

function Detail() {
  const { id } = Route.useParams();
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Full | null | undefined>(undefined);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [interestSent, setInterestSent] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportAlsoBlock, setReportAlsoBlock] = useState(true);
  const [mySex, setMySex] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<{ role: AppRole; color: RoleColor | null } | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<"sobre" | "fe" | "estilo" | "chamado" | "mais">("sobre");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role, badge_color")
        .eq("user_id", id);
      const rows = (data ?? []) as Array<{ role: AppRole; badge_color: string | null }>;
      let best: { role: AppRole; color: RoleColor | null } | null = null;
      for (const r of rows) {
        if (r.role === "user") continue;
        if (!best || ROLE_PRIORITY.indexOf(r.role) < ROLE_PRIORITY.indexOf(best.role)) {
          best = { role: r.role, color: (r.badge_color as RoleColor | null) ?? null };
        }
      }
      setTargetRole(best);
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("sex").eq("id", user.id).maybeSingle();
      setMySex((data?.sex as string | undefined) ?? null);
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data: prof } = await supabase
        .from("profiles").select("*").eq("id", id).eq("status", "approved").maybeSingle();
      setProfile(prof as Full | null);
      const { data: pr } = await supabase
        .from("profile_preferences")
        .select("age_min,age_max,accepts_children,desired_quality,looking_for_bio,location_scope,custom_states")
        .eq("user_id", id).maybeSingle();
      setPrefs((pr ?? null) as Prefs | null);
      const { data: ph } = await supabase
        .from("profile_photos")
        .select("url, sort_order, created_at")
        .eq("user_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      setExtraPhotos(((ph ?? []) as Array<{ url: string }>).map((r) => r.url));
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [intRes, matchRes, blockRes] = await Promise.all([
        supabase.from("interests").select("id").eq("sender_id", user.id).eq("receiver_id", id).maybeSingle(),
        supabase.from("matches").select("id").or(`and(user_a.eq.${user.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${user.id})`).maybeSingle(),
        supabase.from("blocks").select("id").eq("blocker_id", user.id).eq("blocked_id", id).maybeSingle(),
      ]);
      setInterestSent(!!intRes.data);
      setMatchId(matchRes.data?.id ?? null);
      setBlocked(!!blockRes.data);
    })();
  }, [user, id]);

  // Register a profile view (throttled to once per 30 min per pair, viewer-side).
  useEffect(() => {
    if (!user || user.id === id) return;
    const key = `pv:${user.id}:${id}`;
    const last = typeof window !== "undefined" ? Number(window.sessionStorage.getItem(key) ?? 0) : 0;
    if (Date.now() - last < 30 * 60 * 1000) return;
    (async () => {
      const { data: me } = await supabase
        .from("profiles")
        .select("age, city, state")
        .eq("id", user.id)
        .maybeSingle();
      const { error } = await supabase.from("profile_views").insert({
        viewer_id: user.id,
        viewed_id: id,
        viewer_age: me?.age ?? null,
        viewer_city: me?.city ?? null,
        viewer_state: me?.state ?? null,
      });
      if (!error && typeof window !== "undefined") {
        window.sessionStorage.setItem(key, String(Date.now()));
      }
    })();
  }, [user, id]);

  async function demonstrarInteresse() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("interests").insert({ sender_id: user.id, receiver_id: id });
    setBusy(false);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success("Interesse enviado 💗");
    setInterestSent(true);
    // refresh match
    const { data: m } = await supabase.from("matches").select("id").or(`and(user_a.eq.${user.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${user.id})`).maybeSingle();
    if (m) setMatchId(m.id);
  }

  async function bloquear() {
    if (!user) return;
    if (!confirm("Bloquear este perfil? Vocês não aparecerão mais um para o outro.")) return;
    setBusy(true);
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: id });
    setBusy(false);
    toast.success("Perfil bloqueado");
    setBlocked(true);
  }

  async function desbloquear() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("blocks").delete()
      .eq("blocker_id", user.id).eq("blocked_id", id);
    setBusy(false);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success("Perfil desbloqueado");
    setBlocked(false);
  }

  async function enviarDenuncia() {
    if (!user || reportReason.trim().length < 3) { toast.error("Descreva o motivo (mín. 3 caracteres)"); return; }
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id, reported_id: id, reason: reportReason.trim().slice(0, 1000),
    });
    if (error) { setBusy(false); toast.error(friendlyError(error)); return; }
    if (reportAlsoBlock && !blocked) {
      await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: id });
      setBlocked(true);
    }
    setBusy(false);
    toast.success(reportAlsoBlock ? "Denúncia enviada e perfil bloqueado." : "Denúncia enviada. Nossa equipe vai analisar.");
    setReportReason(""); setReportOpen(false);
  }

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (profile === undefined) return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mt-6 grid gap-8 md:grid-cols-[2fr_3fr]">
          <div className="aspect-[4/5] animate-pulse rounded-3xl bg-muted shadow-elegant" />
          <div className="space-y-4">
            <div className="h-9 w-2/3 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-2/5 animate-pulse rounded-md bg-muted" />
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    </div>
  );
  if (!profile) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p>Perfil não encontrado.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/pretendentes">Voltar</Link></Button>
      </main>
    </div>
  );

  if (blocked) return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="glass rounded-3xl p-8 shadow-soft">
          <Ban className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold">Perfil bloqueado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você bloqueou este perfil. Mensagens e informações ficam ocultas até você desbloquear.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={desbloquear} disabled={busy} className="w-full">
              <ShieldOff className="mr-2 h-4 w-4" /> Desbloquear
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/pretendentes">Voltar</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[460px] px-0 pb-36 sm:max-w-2xl sm:px-4 sm:pb-32">
        {/* HERO */}
        <section className="relative animate-fade-in">
          <div className="relative h-[260px] overflow-hidden sm:h-[320px] sm:rounded-b-[28px]">
            {profile.photo_url ? (
              <PhotoImg
                src={profile.photo_url}
                alt={profile.full_name}
                eager
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-love">
                <span className="text-7xl text-white">{profile.full_name.charAt(0)}</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/45" />

            {/* Top buttons */}
            <div className="absolute inset-x-0 top-3 flex items-center justify-between px-4">
              <button
                onClick={() => navigate({ to: "/pretendentes" })}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white shadow-sm backdrop-blur-md transition hover:bg-white/40"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white shadow-sm backdrop-blur-md transition hover:bg-white/40"
                      aria-label="Opções"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Denunciar perfil</DialogTitle></DialogHeader>
                    <Textarea rows={4} maxLength={1000} value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Conte o que aconteceu..." />
                    <label className="mt-2 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
                      <Checkbox
                        checked={reportAlsoBlock}
                        onCheckedChange={(c) => setReportAlsoBlock(c === true)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium">Também bloquear este perfil</span>
                        <span className="block text-xs text-muted-foreground">
                          As mensagens e o perfil ficarão ocultos. Você poderá desbloquear depois.
                        </span>
                      </span>
                    </label>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={bloquear} disabled={busy || blocked}>
                        <Ban className="mr-1 h-4 w-4" /> {blocked ? "Bloqueado" : "Bloquear"}
                      </Button>
                      <Button onClick={enviarDenuncia} disabled={busy}>
                        <Flag className="mr-1 h-4 w-4" /> Enviar denúncia
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* IDENTITY CARD */}
          <div className="relative z-10 -mt-12 px-4">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:bg-card animate-fade-up">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="flex items-center gap-2 text-[28px] font-extrabold leading-tight text-foreground sm:text-[34px]">
                    <span className="truncate">{profile.full_name}, {profile.age}</span>
                    {profile.verified && <VerifiedBadge size="md" />}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {targetRole && <RoleBadge role={targetRole.role} color={targetRole.color} size="sm" />}
                    <OnlineDot userId={profile.id} size="sm" showLabel />
                  </div>
                </div>
              </div>

              <UserBadges userId={profile.id} size="sm" max={6} className="mt-3" />

              {profile.bio && (
                <p className="mt-4 text-[15px] leading-relaxed text-foreground/80">{profile.bio}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                {profile.city && (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[var(--rose)]" /> {profile.city}, {profile.state}</span>
                )}
                {profile.height_cm && (
                  <span className="inline-flex items-center gap-1.5"><Ruler className="h-4 w-4 text-[var(--rose)]" /> {profile.height_cm} cm</span>
                )}
                {profile.church && (
                  <span className="inline-flex items-center gap-1.5"><Church className="h-4 w-4 text-[var(--rose)]" /> {profile.church}</span>
                )}
                <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[var(--rose)]" /> {profile.marital === "solteiro" ? "Solteiro(a)" : "Divorciado(a)"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION PILLS */}
        <nav className="mt-6 px-4">
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {([
              { id: "sobre", label: "Sobre", icon: UserRound },
              { id: "fe", label: "Fé", icon: BookOpen },
              { id: "estilo", label: "Estilo de vida", icon: Heart },
              { id: "chamado", label: "Chamado", icon: Crown },
              { id: "mais", label: "Mais", icon: Sparkles },
            ] as const).map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  style={{ scrollSnapAlign: "start" }}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    active
                      ? "border-transparent bg-gradient-to-br from-[var(--rose)] to-[#9B6BFF] text-white shadow-[0_8px_20px_rgba(255,77,141,0.35)]"
                      : "border-border bg-card text-foreground/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* SECTION CONTENT */}
        <div key={activeSection} className="mt-4 space-y-4 px-4 animate-fade-up">
          {activeSection === "sobre" && (
            <>
              {!profile.bio && (
                <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Esta pessoa ainda não escreveu uma bio.
                </div>
              )}
              {(profile.photo_url || extraPhotos.length > 0) && (
                <div className="overflow-hidden rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <PhotoCarousel
                    photos={[...(profile.photo_url ? [profile.photo_url] : []), ...extraPhotos]}
                    alt={profile.full_name}
                    fallback={
                      <div className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-love">
                        <span className="text-7xl text-white">{profile.full_name.charAt(0)}</span>
                      </div>
                    }
                  />
                </div>
              )}
              {prefs && (
                <div className="rounded-2xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE6F0] p-5 dark:from-card dark:to-card">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-[var(--rose)]" /> O que está buscando
                  </h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <dt className="text-muted-foreground">Idade desejada:</dt>
                      <dd className="font-medium">{prefs.age_min}–{prefs.age_max} anos</dd>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <dt className="flex items-center gap-1 text-muted-foreground"><Baby className="h-3.5 w-3.5" /> Aceita filhos:</dt>
                      <dd className="font-medium">{prefs.accepts_children ? "Sim" : "Não"}</dd>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <dt className="flex items-center gap-1 text-muted-foreground"><Globe2 className="h-3.5 w-3.5" /> Localização:</dt>
                      <dd className="font-medium">
                        {prefs.location_scope === "personalizado"
                          ? ((prefs.custom_states ?? []).length > 0 ? (prefs.custom_states ?? []).join(", ") : "—")
                          : prefs.location_scope === "regiao" ? "Mesma região"
                          : prefs.location_scope === "brasil" ? "Brasil todo"
                          : prefs.location_scope === "mundo" ? "Mundo todo"
                          : prefs.location_scope}
                      </dd>
                    </div>
                    {prefs.desired_quality && (
                      <div>
                        <dt className="text-muted-foreground">Qualidade que mais valoriza:</dt>
                        <dd className="mt-0.5 font-medium">{prefs.desired_quality}</dd>
                      </div>
                    )}
                    {prefs.looking_for_bio && (
                      <div>
                        <dt className="text-muted-foreground">Sobre o que busca:</dt>
                        <dd className="mt-0.5 leading-relaxed text-foreground/80">{prefs.looking_for_bio}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </>
          )}

          {activeSection !== "sobre" && (
            <ProfileAdvancedView userId={profile.id} />
          )}
        </div>

        {/* FIXED BOTTOM ACTION BAR */}
        {!(profile && mySex && profile.sex === mySex) && (!(targetRole && !isAdmin)) && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[460px] items-end justify-around gap-2">
              {/* Enviar recado (anônimo) */}
              <div className="flex flex-1 flex-col items-center gap-1">
                {user && user.id !== profile.id && mySex && profile.sex !== mySex ? (
                  <SendAnonymousButton receiverId={profile.id} />
                ) : (
                  <button disabled className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Send className="h-5 w-5" />
                  </button>
                )}
                <span className="text-[11px] text-muted-foreground">Enviar recado</span>
              </div>

              {/* Central CTA: interesse */}
              <div className="flex flex-col items-center gap-1">
                {matchId ? (
                  <Link
                    to="/conversas/$matchId"
                    params={{ matchId }}
                    className="flex h-[60px] w-[60px] -translate-y-2 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rose)] to-[#9B6BFF] text-white shadow-[0_10px_30px_rgba(255,77,141,0.45)] transition hover:scale-105"
                    aria-label="Conversar"
                  >
                    <MessageCircle className="h-7 w-7" />
                  </Link>
                ) : interestSent ? (
                  <button
                    disabled
                    className="flex h-[60px] w-[60px] -translate-y-2 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rose)]/60 to-[#9B6BFF]/60 text-white shadow-[0_10px_30px_rgba(255,77,141,0.25)]"
                    aria-label="Interesse enviado"
                  >
                    <Check className="h-7 w-7" />
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={demonstrarInteresse}
                    className="flex h-[60px] w-[60px] -translate-y-2 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rose)] to-[#9B6BFF] text-white shadow-[0_10px_30px_rgba(255,77,141,0.45)] transition hover:scale-105 active:scale-95"
                    aria-label="Tenho interesse"
                  >
                    <Heart className="h-7 w-7 fill-current" />
                  </button>
                )}
                <span className="-mt-1 text-[11px] font-medium text-foreground">
                  {matchId ? "Conversar" : interestSent ? "Enviado" : "Tenho interesse"}
                </span>
              </div>

              {/* Orar */}
              <div className="flex flex-1 flex-col items-center gap-1">
                <button
                  onClick={() => toast.success("🙏 Oração registrada com carinho")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0F5] text-[var(--rose)] transition hover:bg-[#FFE6F0]"
                  aria-label="Orar por ele(a)"
                >
                  <HandHeart className="h-5 w-5" />
                </button>
                <span className="text-[11px] text-muted-foreground">Orar</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
