import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateProfileStrength,
  getProfileStrengthLabel,
  getProfileStrengthNextActions,
  hasClaimedFreeFrameLocal,
  markFreeFrameClaimedLocal,
  type StrengthAdvanced,
  type StrengthPreferences,
  type StrengthProfile,
} from "@/lib/profileStrength";
import {
  DECORATION_RARITY_STYLE,
  assetFor,
  equipDecoration,
  fetchDecorationCatalog,
  fetchMyOwnedIds,
  type Decoration,
} from "@/lib/decorations";

type Props = {
  userId: string;
  /**
   * Optional override for next-action clicks. Receives the action id and
   * the default link target. Returning true skips the default navigation.
   * Lets host pages (like /perfil) switch tabs / scroll to real sections
   * instead of relying on Link navigation.
   */
  onAction?: (actionId: string, to: string) => boolean | void;
  /** Add top margin so the card breathes away from preceding content. */
  topSpacing?: boolean;
};

/**
 * Compact "starter" section for the home page:
 * - profile strength bar + label;
 * - top 3 next actions (smart checklist);
 * - free frame redeem CTA (common/rare frames);
 * - discreet "come back tomorrow" line.
 *
 * All values are derived from real profile/advanced/preferences data.
 * Never fabricates data, never deducts coins.
 */
export function HomeStarterSection({ userId, onAction, topSpacing }: Props) {
  const [profile, setProfile] = useState<StrengthProfile | null>(null);
  const [advanced, setAdvanced] = useState<StrengthAdvanced>(null);
  const [prefs, setPrefs] = useState<StrengthPreferences>(null);
  const [photosCount, setPhotosCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showFrames, setShowFrames] = useState(false);
  const [eligibleFrames, setEligibleFrames] = useState<Decoration[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [claimed, setClaimed] = useState<boolean>(() => hasClaimedFreeFrameLocal(userId));
  const [claiming, setClaiming] = useState<string | null>(null);
  const [hasSpent, setHasSpent] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [pRes, aRes, prefRes, photoRes] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "full_name, age, sex, photo_url, city, state, height_cm, marital, bio, church, years_baptized",
            )
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("profile_advanced" as never)
            .select("seeking, faith_moment, spiritual_routine, worship_style, essential_quality")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("profile_preferences" as never)
            .select("looking_for_bio, age_min, age_max")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("profile_photos" as never)
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
        ]);
        if (!active) return;
        setProfile((pRes.data as StrengthProfile | null) ?? null);
        setAdvanced((aRes.data as StrengthAdvanced) ?? null);
        setPrefs((prefRes.data as StrengthPreferences) ?? null);
        setPhotosCount(photoRes.count ?? 0);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Hide the free-frame action for users who already made any purchase
  // (any outgoing coin transaction). Free frame is a first-time-only perk.
  useEffect(() => {
    let active = true;
    (async () => {
      const { count } = await supabase
        .from("coin_transactions" as never)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("direction", "out");
      if (!active) return;
      setHasSpent((count ?? 0) > 0);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const percent = useMemo(
    () => calculateProfileStrength(profile, advanced, prefs, photosCount),
    [profile, advanced, prefs, photosCount],
  );
  const labelInfo = useMemo(() => getProfileStrengthLabel(percent), [percent]);

  const nextActions = useMemo(
    () =>
      getProfileStrengthNextActions(profile, advanced, prefs, photosCount, {
        freeFrameAvailable: !claimed && !hasSpent,
      }),
    [profile, advanced, prefs, photosCount, claimed, hasSpent],
  );

  async function openFrameModal() {
    setShowFrames(true);
    if (eligibleFrames.length > 0) return;
    try {
      const [catalog, owned] = await Promise.all([
        fetchDecorationCatalog(),
        fetchMyOwnedIds(userId).catch(() => new Set<string>()),
      ]);
      setOwnedIds(owned);
      const eligible = catalog
        .filter((d) => d.type === "frame" && d.active)
        .filter((d) => d.rarity === "common" || d.rarity === "rare")
        .filter((d) => !!d.image_url)
        .slice(0, 8);
      setEligibleFrames(eligible);
    } catch (err) {
      console.error("[home-starter] failed to load frames", err);
      toast.error("Não foi possível carregar as molduras agora.");
    }
  }

  async function claim(d: Decoration) {
    setClaiming(d.id);
    try {
      // Try the dedicated free-claim RPC first (if available server-side).
      // Falls back gracefully if not yet deployed.
      const { error } = await supabase.rpc(
        "claim_free_frame" as never,
        { _decoration_id: d.id } as never,
      );
      if (error) {
        const msg = String(error.message || "");
        if (msg.includes("does not exist") || msg.includes("schema cache")) {
          toast.message("Resgate em preparação", {
            description:
              "Em breve você poderá resgatar uma moldura grátis. Enquanto isso, veja outras opções na loja.",
          });
          return;
        }
        if (msg.includes("already_claimed")) {
          markFreeFrameClaimedLocal(userId);
          setClaimed(true);
          toast.message("Você já resgatou sua moldura grátis.");
          return;
        }
        throw error;
      }
      markFreeFrameClaimedLocal(userId);
      setClaimed(true);
      toast.success("Moldura resgatada", {
        description: "Vamos equipar para você ver agora.",
      });
      try {
        await equipDecoration(d.id);
      } catch (err) {
        console.warn("[home-starter] could not auto-equip", err);
      }
      setShowFrames(false);
    } catch (err) {
      console.error("[home-starter] claim failed", err);
      toast.error("Não foi possível resgatar agora. Tente novamente.");
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <section className={`mb-4 px-4 sm:mb-6 sm:px-0 ${topSpacing ? "mt-6 sm:mt-8" : ""}`}>
        <div className="h-28 animate-pulse rounded-3xl bg-muted/40" />
      </section>
    );
  }

  const toneClass =
    labelInfo.tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : labelInfo.tone === "amber"
        ? "text-amber-700 dark:text-amber-300"
        : "text-rose-700 dark:text-rose-300";

  const primaryMissing = nextActions[0]?.id;
  const dynamicHint =
    percent >= 90
      ? "Otimo! Seu perfil esta completo. Continue cuidando dele."
      : percent >= 70
        ? "Seu perfil ja transmite mais confianca."
        : primaryMissing === "photo"
          ? "Uma boa foto deixa seu perfil mais real e confiavel."
          : primaryMissing === "bio"
            ? "Completar a bio ajuda as pessoas certas a te conhecerem."
            : primaryMissing === "city"
              ? "Informar sua cidade ajuda a mostrar pessoas mais proximas."
              : primaryMissing === "name"
                ? "Preencher seu nome deixa o perfil mais humano."
                : "Pequenos ajustes deixam seu perfil mais forte.";

  return (
    <section className={`mb-4 px-4 sm:mb-6 sm:px-0 ${topSpacing ? "mt-6 sm:mt-8" : ""}`}>
      <div className="rounded-3xl border border-border/60 bg-card/75 p-4 shadow-soft backdrop-blur sm:p-5">
        {/* Strength */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--rose)]/15 to-[var(--coral)]/15 text-[var(--rose)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className={`text-sm font-semibold ${toneClass}`}>{labelInfo.label}</h2>
              <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--rose)] to-[var(--coral)] transition-all"
                style={{ width: `${Math.max(4, percent)}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{dynamicHint}</p>
          </div>
        </div>

        {/* Next actions */}
        {nextActions.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Próximos passos
            </div>
            <ul className="space-y-2">
              {nextActions.map((a) => {
                const Icon = a.icon;
                const isFreeFrame = a.id === "free_frame";
                const handleClick = () => {
                  if (onAction) {
                    const handled = onAction(a.id, a.to);
                    if (handled) return;
                  }
                };
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/50 bg-background/60 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--petal)]/40 text-[var(--rose)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 basis-[140px]">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    {isFreeFrame ? (
                      <Button
                        size="sm"
                        className="app-pressable ml-auto shrink-0 rounded-full"
                        onClick={() => {
                          if (onAction && onAction(a.id, a.to)) return;
                          openFrameModal();
                        }}
                      >
                        {a.ctaLabel}
                      </Button>
                    ) : onAction ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="app-pressable ml-auto shrink-0 rounded-full"
                        onClick={handleClick}
                      >
                        {a.ctaLabel}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="app-pressable ml-auto shrink-0 rounded-full"
                      >
                        <Link to={a.to as never}>
                          {a.ctaLabel}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {nextActions.length === 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Seu perfil está em dia. Volte amanhã para novas sugestões.
          </div>
        )}

        {/* Come back tomorrow */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Sun className="h-3.5 w-3.5" />
          Novas sugestões podem aparecer amanhã conforme a comunidade cresce.
        </div>
      </div>

      {/* Free frame modal */}
      {showFrames && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          onClick={() => setShowFrames(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--rose)]/15 to-[var(--coral)]/15 text-[var(--rose)]">
                <Gift className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">Escolha sua moldura grátis</h3>
                <p className="text-xs text-muted-foreground">
                  Apenas uma moldura comum ou rara, por usuário.
                </p>
              </div>
            </div>

            {eligibleFrames.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Carregando opções...
              </p>
            ) : (
              <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto">
                {eligibleFrames.map((d) => {
                  const src = assetFor(d);
                  const owned = ownedIds.has(d.id);
                  const r = DECORATION_RARITY_STYLE[d.rarity];
                  return (
                    <div
                      key={d.id}
                      className={`flex flex-col items-center rounded-2xl border bg-background/70 p-3 ${r.border}`}
                    >
                      <div className="relative h-20 w-20">
                        {src ? (
                          <img
                            src={src}
                            alt={d.name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-muted" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-1 text-center text-xs font-medium">{d.name}</p>
                      <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] ${r.chip}`}>
                        {r.label}
                      </span>
                      <Button
                        size="sm"
                        className="app-pressable mt-2 w-full rounded-full"
                        disabled={!!claiming || owned}
                        onClick={() => claim(d)}
                      >
                        {owned ? "Já possui" : claiming === d.id ? "Resgatando..." : "Resgatar"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFrames(false)}
                className="rounded-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}