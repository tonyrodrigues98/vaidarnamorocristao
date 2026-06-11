import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ImageIcon, Loader2, Lock, Sparkles, ShoppingBag, X, Shirt, PawPrint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { OfflineState } from "@/components/ui/OfflineState";
import { getMyCoins } from "@/lib/coins";
import {
  fetchDecorationCatalog,
  fetchMyOwnedIds,
  fetchMyEquippedDecorations,
  equipDecoration,
  unequipDecoration,
  decorationErrorMessage,
  type Decoration,
  type DecorationType,
} from "@/lib/decorations";
import {
  BACKGROUND_RARITY_STYLE,
  equipProfileBackground,
  fetchMyOwnedBackgroundIds,
  fetchProfileBackgroundCatalog,
  unequipProfileBackground,
  type ProfileBackground,
} from "@/lib/profileBackgrounds";
import {
  equipNameGradient,
  fetchMyOwnedNameGradientIds,
  fetchNameGradientCatalog,
  nameGradientStyle,
  unequipNameGradient,
  type NameGradient,
} from "@/lib/nameGradients";

type EquippedMap = { frame: string | null; aura: string | null; sticker: string | null };

type Category = {
  key: DecorationType | "background" | "soon-badges" | "soon-effects" | "soon-pets" | "soon-themes";
  label: string;
  soon?: boolean;
};

const CATEGORIES: Category[] = [
  { key: "frame", label: "Molduras" },
  { key: "aura", label: "Aura" },
  { key: "background", label: "Meus Fundos" },
  { key: "soon-pets", label: "Nome", soon: false },
  { key: "soon-badges", label: "Badges", soon: true },
  { key: "soon-effects", label: "Efeitos", soon: true },
  { key: "soon-themes", label: "Temas", soon: true },
];

export function CustomizacaoTab({ photoUrl }: { photoUrl: string | null }) {
  const { user, role } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";
  const { isOnline } = useNetworkStatus();
  const offlineEquipMsg = "Disponível online. Reconecte-se para alterar seu visual.";
  const [catalog, setCatalog] = useState<Decoration[]>([]);
  const [backgrounds, setBackgrounds] = useState<ProfileBackground[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [ownedBackgrounds, setOwnedBackgrounds] = useState<Set<string>>(new Set());
  const [nameGradients, setNameGradients] = useState<NameGradient[]>([]);
  const [ownedNameGradients, setOwnedNameGradients] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<EquippedMap>({ frame: null, aura: null, sticker: null });
  const [equippedBackground, setEquippedBackground] = useState<string | null>(null);
  const [equippedNameGradient, setEquippedNameGradient] = useState<string | null>(null);
  const [preview, setPreview] = useState<EquippedMap>({
    frame: null,
    aura: null,
    sticker: null,
  });
  const [previewBackground, setPreviewBackground] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<Category["key"]>("frame");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [c, o, coins, prof] = await Promise.all([
          fetchDecorationCatalog(),
          fetchMyOwnedIds(user.id),
          getMyCoins(),
          supabase
            .from("profiles")
            .select("equipped_frame_id, equipped_aura_id, equipped_sticker_id")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (!alive) return;
        setCatalog(c);
        setOwned(o);
        setBalance(coins.balance);
        const p = (prof.data ?? {}) as {
          equipped_frame_id?: string | null;
          equipped_aura_id?: string | null;
          equipped_sticker_id?: string | null;
        };
        setEquipped({
          frame: p.equipped_frame_id ?? null,
          aura: p.equipped_aura_id ?? null,
          sticker: p.equipped_sticker_id ?? null,
        });
      } catch {
        toast.error("Não foi possível carregar a customização");
      } finally {
        if (alive) setLoading(false);
      }

      try {
        const [bg, ownedBg, nameGradientCatalog, ownedNameGradientIds, bgProf] = await Promise.all([
          fetchProfileBackgroundCatalog(),
          fetchMyOwnedBackgroundIds(),
          fetchNameGradientCatalog(),
          fetchMyOwnedNameGradientIds(),
          supabase
            .from("profiles")
            .select("equipped_background_id, equipped_name_gradient_id")
            .eq("id", user.id)
            .maybeSingle(),
        ]);
        if (!alive) return;
        setBackgrounds(bg);
        setOwnedBackgrounds(ownedBg);
        setNameGradients(nameGradientCatalog);
        setOwnedNameGradients(ownedNameGradientIds);
        setEquippedBackground(
          ((bgProf.data ?? {}) as { equipped_background_id?: string | null })
            .equipped_background_id ?? null,
        );
        setEquippedNameGradient(
          ((bgProf.data ?? {}) as { equipped_name_gradient_id?: string | null })
            .equipped_name_gradient_id ?? null,
        );
      } catch {
        if (!alive) return;
        setBackgrounds([]);
        setOwnedBackgrounds(new Set());
        setEquippedBackground(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const grouped = useMemo(() => {
    const g: Record<DecorationType, Decoration[]> = { frame: [], aura: [], sticker: [] };
    catalog.forEach((d) => g[d.type]?.push(d));
    return g;
  }, [catalog]);

  const ownedBackgroundItems = useMemo(
    () => backgrounds.filter((background) => ownedBackgrounds.has(background.id)),
    [backgrounds, ownedBackgrounds],
  );

  const activePreviewBackground = useMemo(
    () =>
      backgrounds.find(
        (background) => background.id === (previewBackground ?? equippedBackground),
      ) ?? null,
    [backgrounds, equippedBackground, previewBackground],
  );

  const handleEquip = async (d: Decoration) => {
    if (!user) return;
    if (!isOnline) {
      toast.error(offlineEquipMsg);
      return;
    }

    setBusyId(d.id);

    try {
      const result = await equipDecoration(d.id);

      if (result.type !== d.type) {
        throw new Error(`invalid_decoration_type:${result.type}`);
      }

      const nextEquipped = await fetchMyEquippedDecorations(user.id);

      setEquipped(nextEquipped);
      setPreview((p) => ({ ...p, [d.type]: null }));

      toast.success(`${d.name} equipada`);
    } catch (error) {
      toast.error(decorationErrorMessage(error, "Erro ao equipar"));
    } finally {
      setBusyId(null);
    }
  };

  const handleUnequip = async (type: DecorationType) => {
    if (!user) return;
    if (!isOnline) {
      toast.error(offlineEquipMsg);
      return;
    }

    setBusyId(`unequip-${type}`);

    try {
      await unequipDecoration(type);

      const nextEquipped = await fetchMyEquippedDecorations(user.id);

      setEquipped(nextEquipped);
    } catch (error) {
      toast.error(decorationErrorMessage(error, "Erro ao remover"));
    } finally {
      setBusyId(null);
    }
  };

  const handleEquipBackground = async (background: ProfileBackground) => {
    if (!isOnline) {
      toast.error(offlineEquipMsg);
      return;
    }
    setBusyId(background.id);
    try {
      await equipProfileBackground(background.id);
      setEquippedBackground(background.id);
      setPreviewBackground(null);
      toast.success(`${background.name} equipado`);
    } catch {
      toast.error("Erro ao equipar fundo");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnequipBackground = async () => {
    if (!isOnline) {
      toast.error(offlineEquipMsg);
      return;
    }
    setBusyId("unequip-background");
    try {
      await unequipProfileBackground();
      setEquippedBackground(null);
      setPreviewBackground(null);
    } catch {
      toast.error("Erro ao remover fundo");
    } finally {
      setBusyId(null);
    }
  };

  const handleEquipNameGradient = async (gradient: NameGradient) => {
    if (!isOnline) {
      toast.error(offlineEquipMsg);
      return;
    }
    setBusyId(gradient.id);
    try {
      await equipNameGradient(gradient.id);
      setEquippedNameGradient(gradient.id);
      toast.success(`${gradient.name} equipado`);
    } catch {
      toast.error("Erro ao equipar gradiente");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnequipNameGradient = async () => {
    if (!isOnline) {
      toast.error(offlineEquipMsg);
      return;
    }
    setBusyId("unequip-name-gradient");
    try {
      await unequipNameGradient();
      setEquippedNameGradient(null);
    } catch {
      toast.error("Erro ao remover gradiente");
    } finally {
      setBusyId(null);
    }
  };

  const renderGrid = (type: DecorationType) => {
    const items = grouped[type];
    if (!items || items.length === 0) {
      return (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Nenhum item disponível no momento.
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((d) => {
          const isOwned = owned.has(d.id);
          const isEquipped = equipped[type] === d.id;
          const isPreviewing = preview[type] === d.id;
          const busy = busyId === d.id;

          const previewProps = {
            photoUrl,
            fallback: user?.email?.[0]?.toUpperCase() ?? "?",
            size: 56,
            frameId: type === "frame" ? d.id : equipped.frame,
            auraId: type === "aura" ? d.id : equipped.aura,
          };

          return (
            <button
              type="button"
              key={d.id}
              onClick={() => {
                setPreview((p) => ({ ...p, [type]: p[type] === d.id ? null : d.id }));
              }}
              className={`group relative flex flex-col items-center rounded-2xl border bg-card/70 p-3 text-center transition-all duration-200 active:scale-[0.98] ${
                isEquipped
                  ? "border-[var(--rose)]/60 shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--rose)_50%,transparent)]"
                  : isPreviewing
                    ? "border-[var(--rose)] ring-2 ring-[var(--rose)]/30"
                    : isOwned
                      ? "border-border/60 hover:border-[var(--rose-soft)] hover:shadow-soft"
                      : "border-border/40 opacity-90"
              }`}
            >
              {isEquipped && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                  <Check className="h-2.5 w-2.5" /> Equipado
                </span>
              )}
              <div className="relative flex h-28 w-28 items-center justify-center">
                <div className={!isOwned ? "blur-[1.5px] grayscale" : ""}>
                  <DecoratedAvatar {...previewProps} />
                </div>
                {!isOwned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-background/70 p-2 backdrop-blur-sm">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
              <p
                className="mt-2 line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-tight"
                title={d.name}
              >
                {d.name}
              </p>
              <div className="mt-2 w-full" onClick={(e) => e.stopPropagation()}>
                {isEquipped ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    disabled={busyId === `unequip-${type}` || !isOnline}
                    title={!isOnline ? offlineEquipMsg : undefined}
                    onClick={() => handleUnequip(type)}
                  >
                    {busyId === `unequip-${type}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Remover"
                    )}
                  </Button>
                ) : isOwned ? (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    disabled={busy || !isOnline}
                    title={!isOnline ? offlineEquipMsg : undefined}
                    onClick={() => handleEquip(d)}
                  >
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                  </Button>
                ) : (
                  <Button asChild variant="secondary" size="sm" className="w-full text-xs">
                    <Link to="/loja">
                      <span className="inline-flex items-center gap-1">
                        <CoinIcon className="h-3 w-3" /> {d.price_coins}
                      </span>
                    </Link>
                  </Button>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderBackgrounds = () => {
    if (ownedBackgroundItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-background/40 py-12 text-center">
          <ImageIcon className="h-5 w-5 text-[var(--rose)]" />
          <p className="text-sm font-medium">Voce ainda nao possui fundos</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Desbloqueie fundos premium na loja e volte aqui para equipar.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-2">
            <Link to="/loja">
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Ir para loja
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ownedBackgroundItems.map((background) => {
          const isEquipped = equippedBackground === background.id;
          const isPreviewing = previewBackground === background.id;
          const busy = busyId === background.id;
          const rarity = BACKGROUND_RARITY_STYLE[background.rarity];

          return (
            <button
              type="button"
              key={background.id}
              onClick={() =>
                setPreviewBackground((id) => (id === background.id ? null : background.id))
              }
              className={`group overflow-hidden rounded-2xl border bg-card/70 text-left transition-all duration-200 active:scale-[0.98] ${
                isEquipped
                  ? "border-[var(--rose)]/70 shadow-soft"
                  : isPreviewing
                    ? "border-[var(--rose)] ring-2 ring-[var(--rose)]/30"
                    : "border-border/60 hover:border-[var(--rose-soft)] hover:shadow-soft"
              }`}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                {background.image_url ? (
                  <img
                    src={background.image_url}
                    alt={background.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-3 top-3 flex gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rarity.chip}`}
                  >
                    {rarity.label}
                  </span>
                  {isEquipped && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] font-semibold text-white">
                      <Check className="h-2.5 w-2.5" /> Equipado
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-xs font-semibold" title={background.name}>
                  {background.name}
                </p>
                <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] text-muted-foreground">
                  {background.description || "Fundo premium para destacar seu perfil."}
                </p>
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  {isEquipped ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      disabled={busyId === "unequip-background" || !isOnline}
                      title={!isOnline ? offlineEquipMsg : undefined}
                      onClick={handleUnequipBackground}
                    >
                      {busyId === "unequip-background" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Remover"
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      disabled={busy || !isOnline}
                      title={!isOnline ? offlineEquipMsg : undefined}
                      onClick={() => handleEquipBackground(background)}
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                    </Button>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderNameGradients = () => {
    const ownedItems = nameGradients.filter((gradient) => ownedNameGradients.has(gradient.id));
    if (ownedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-background/40 py-12 text-center">
          <Sparkles className="h-5 w-5 text-[var(--rose)]" />
          <p className="text-sm font-medium">Voce ainda nao possui gradientes</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Compre gradientes na loja para deixar seu nome em destaque.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-2">
            <Link to="/loja">
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Ir para loja
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ownedItems.map((gradient) => {
          const isEquipped = equippedNameGradient === gradient.id;
          const busy = busyId === gradient.id;
          return (
            <div
              key={gradient.id}
              className={`rounded-2xl border bg-card/70 p-4 ${
                isEquipped
                  ? "border-[var(--rose)] ring-2 ring-[var(--rose)]/20"
                  : "border-border/60"
              }`}
            >
              <p className="text-2xl font-black" style={nameGradientStyle(gradient)}>
                {gradient.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Preview do seu nome em destaque</p>
              <div className="mt-3">
                {isEquipped ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    disabled={busyId === "unequip-name-gradient" || !isOnline}
                    title={!isOnline ? offlineEquipMsg : undefined}
                    onClick={handleUnequipNameGradient}
                  >
                    Remover
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    disabled={busy || !isOnline}
                    title={!isOnline ? offlineEquipMsg : undefined}
                    onClick={() => handleEquipNameGradient(gradient)}
                  >
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="rounded-3xl border bg-card/50 p-10 text-center text-sm text-muted-foreground">
        Carregando visual…
      </div>
    );
  }

  const hasAnyData =
    catalog.length > 0 ||
    backgrounds.length > 0 ||
    nameGradients.length > 0 ||
    equipped.frame !== null ||
    equipped.aura !== null ||
    equippedBackground !== null ||
    equippedNameGradient !== null;

  if (!isOnline && !hasAnyData) {
    return (
      <OfflineState
        title="Visual indisponível offline"
        description="Conecte-se para carregar seus itens."
      />
    );
  }

  const activeIsSoon = CATEGORIES.find((c) => c.key === activeCat)?.soon;

  return (
    <div className="animate-fade-up space-y-5">
      {!isOnline && (
        <StaleDataNotice message="Você está offline. Mostrando visual carregado anteriormente." />
      )}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-[var(--rose-soft)]/60 bg-card/60 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Admin
          </span>
          <Link
            to="/admin/avatar"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-sm hover:opacity-90"
          >
            <Shirt className="h-3.5 w-3.5" /> Avatares
          </Link>
          <Link
            to="/admin/pets"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-sm hover:opacity-90"
          >
            <PawPrint className="h-3.5 w-3.5" /> Pets
          </Link>
        </div>
      )}
      {/* Header */}
      <div className="glass relative overflow-hidden rounded-3xl p-6 shadow-elegant sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--rose)]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[var(--rose-soft)]/40 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--rose-soft)]/40 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--rose)]">
              <Sparkles className="h-3 w-3" /> Cosméticos
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Visual</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Personalize a aparência do seu perfil e destaque sua identidade na plataforma.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 sm:inline-flex">
            <CoinIcon className="h-4 w-4" /> {balance}
          </div>
        </div>
      </div>

      {/* Preview principal */}
      <div className="glass rounded-3xl p-6 shadow-soft sm:p-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Pré-visualização
          </p>
          <div className="relative flex h-56 w-full max-w-md items-center justify-center overflow-hidden rounded-3xl border bg-background transition-all duration-300">
            {activePreviewBackground?.image_url && (
              <img
                src={activePreviewBackground.image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/55" />
            <div className="relative flex flex-col items-center gap-3 text-white">
              <DecoratedAvatar
                photoUrl={photoUrl}
                fallback={user?.email?.[0]?.toUpperCase() ?? "?"}
                size={96}
                frameId={preview.frame ?? equipped.frame}
                auraId={preview.aura ?? equipped.aura}
              />
              {activePreviewBackground && (
                <div className="max-w-xs text-center">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {activePreviewBackground.name}
                  </p>
                  <p className="line-clamp-1 text-xs text-white/75">
                    {previewBackground ? "Preview de fundo" : "Fundo equipado"}
                  </p>
                </div>
              )}
            </div>
          </div>
          {(preview.frame || preview.aura || previewBackground) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                setPreview({ frame: null, aura: null, sticker: null });
                setPreviewBackground(null);
              }}
            >
              <X className="mr-1 h-3 w-3" /> Limpar pré-visualização
            </Button>
          )}
          <div className="sm:hidden inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
            <CoinIcon className="h-4 w-4" /> {balance}
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="glass rounded-3xl p-4 shadow-soft sm:p-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => {
            const active = activeCat === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCat(c.key)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-[var(--rose)] bg-[var(--rose)] text-white shadow-soft"
                    : "border-border/60 bg-card/60 text-muted-foreground hover:border-[var(--rose-soft)] hover:text-foreground"
                }`}
              >
                {c.label}
                {c.soon && (
                  <span className="ml-1.5 rounded-full bg-background/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wide opacity-70">
                    em breve
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {activeIsSoon ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-background/40 py-12 text-center">
              <Sparkles className="h-5 w-5 text-[var(--rose)]" />
              <p className="text-sm font-medium">Em breve</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Esta categoria está sendo preparada para uma próxima atualização.
              </p>
            </div>
          ) : activeCat === "background" ? (
            renderBackgrounds()
          ) : activeCat === "soon-pets" ? (
            renderNameGradients()
          ) : (
            renderGrid(activeCat as DecorationType)
          )}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed bg-background/40 p-4">
          <div className="pr-3">
            <p className="text-sm font-medium">Quer mais cosméticos?</p>
            <p className="text-xs text-muted-foreground">
              Descubra molduras, auras e fundos exclusivos na loja.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/loja">
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Ir para loja
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
