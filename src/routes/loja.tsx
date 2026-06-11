import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ImageIcon,
  Loader2,
  Sparkles,
  X,
  Gem,
  Frame as FrameIcon,
  Sparkle,
  Image as ImageLucide,
  Type as TypeIcon,
  Package,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ShopSkeleton } from "@/components/ui/AppSkeletons";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { OfflineState } from "@/components/ui/OfflineState";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Gem as GemIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { getMyCoins } from "@/lib/coins";
import {
  fetchDecorationCatalog,
  fetchMyOwnedIds,
  fetchMyEquippedDecorations,
  purchaseDecoration,
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
  purchaseProfileBackground,
  unequipProfileBackground,
  type ProfileBackground,
} from "@/lib/profileBackgrounds";
import {
  equipNameGradient,
  fetchMyOwnedNameGradientIds,
  fetchNameGradientCatalog,
  nameGradientStyle,
  purchaseNameGradient,
  unequipNameGradient,
  type NameGradient,
} from "@/lib/nameGradients";

export const Route = createFileRoute("/loja")({
  component: LojaPage,
  head: () => ({
    meta: [
      { title: "Loja — VaiDarNamoro" },
      {
        name: "description",
        content:
          "Use suas moedas para desbloquear molduras, auras e personalizações exclusivas do seu perfil.",
      },
      { property: "og:title", content: "Loja — VaiDarNamoro" },
      {
        property: "og:description",
        content:
          "Use suas moedas para desbloquear molduras, auras e personalizações exclusivas do seu perfil.",
      },
      { property: "og:url", content: "https://vaidarnamoro.com/loja" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type EquippedMap = { frame: string | null; aura: string | null; sticker: string | null };
type CategoryKey =
  | "all"
  | "frame"
  | "aura"
  | "background"
  | "name-gradient"
  | "inventory";

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: typeof FrameIcon;
  type: DecorationType | "background" | null;
}[] = [
  { key: "all", label: "Todos", icon: Sparkles, type: null },
  { key: "frame", label: "Molduras", icon: FrameIcon, type: "frame" },
  { key: "aura", label: "Auras", icon: Sparkle, type: "aura" },
  { key: "background", label: "Fundos", icon: ImageLucide, type: "background" },
  { key: "name-gradient", label: "Gradientes", icon: TypeIcon, type: null },
  { key: "inventory", label: "Inventário", icon: Package, type: null },
];

const RARITY_WEIGHT: Record<string, number> = {
  exclusive: 5,
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

function LojaPage() {
  const { user, loading: authLoading } = useAuth();
  const [catalog, setCatalog] = useState<Decoration[]>([]);
  const [backgrounds, setBackgrounds] = useState<ProfileBackground[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [ownedBackgrounds, setOwnedBackgrounds] = useState<Set<string>>(new Set());
  const [nameGradients, setNameGradients] = useState<NameGradient[]>([]);
  const [ownedNameGradients, setOwnedNameGradients] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<EquippedMap>({
    frame: null,
    aura: null,
    sticker: null,
  });
  const [equippedBackground, setEquippedBackground] = useState<string | null>(null);
  const [equippedNameGradient, setEquippedNameGradient] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetworkStatus();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryKey>("all");
  const [confirm, setConfirm] = useState<Decoration | null>(null);
  const [confirmBackground, setConfirmBackground] = useState<ProfileBackground | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshResolveRef = useRef<(() => void) | null>(null);
  const handlePullRefresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      refreshResolveRef.current = resolve;
      setRefreshKey((k) => k + 1);
    });
  }, []);

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
            .select("photo_url, equipped_frame_id, equipped_aura_id, equipped_sticker_id")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (!alive) return;
        setCatalog(c);
        setOwned(o);
        setBalance(coins.balance);
        const p = (prof.data ?? {}) as {
          photo_url?: string | null;
          equipped_frame_id?: string | null;
          equipped_aura_id?: string | null;
          equipped_sticker_id?: string | null;
        };
        setPhotoUrl(p.photo_url ?? null);
        setEquipped({
          frame: p.equipped_frame_id ?? null,
          aura: p.equipped_aura_id ?? null,
          sticker: p.equipped_sticker_id ?? null,
        });
      } catch {
        toast.error("Não foi possível carregar a loja");
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
      if (alive) {
        const resolve = refreshResolveRef.current;
        if (resolve) {
          refreshResolveRef.current = null;
          resolve();
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, refreshKey]);

  const grouped = useMemo(() => {
    const g: Record<DecorationType, Decoration[]> = { frame: [], aura: [], sticker: [] };
    catalog.forEach((d) => g[d.type]?.push(d));
    return g;
  }, [catalog]);

  const handleBuy = async (d: Decoration) => {
    if (!isOnline) {
      toast.error("Sem conexão. Tente novamente quando estiver online.");
      return;
    }
    setBusyId(d.id);
    try {
      const r = await purchaseDecoration(d.id);
      setBalance(r.new_balance);
      setOwned((s) => new Set([...s, d.id]));
      toast.success(`✨ ${d.name} desbloqueada com sucesso`);
      setConfirm(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("insufficient")) toast.error("Moedas insuficientes");
      else if (msg.includes("already_owned")) toast.error("Você já possui esse item");
      else toast.error("Não foi possível concluir a compra");
    } finally {
      setBusyId(null);
    }
  };

  const handleBuyBackground = async (background: ProfileBackground) => {
    if (!isOnline) {
      toast.error("Sem conexão. Tente novamente quando estiver online.");
      return;
    }
    setBusyId(background.id);
    try {
      const r = await purchaseProfileBackground(background.id);
      setBalance(r.new_balance);
      setOwnedBackgrounds((s) => new Set([...s, background.id]));
      toast.success(`${background.name} desbloqueado com sucesso`);
      setConfirmBackground(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("insufficient")) toast.error("Moedas insuficientes");
      else if (msg.includes("already_owned")) toast.error("Voce ja possui esse fundo");
      else if (msg.includes("purchase_profile_background") || msg.includes("schema cache")) {
        toast.error("Banco sem a função de compra dos fundos. Rode a migration de reparo.");
      } else if (msg.includes("background_not_found"))
        toast.error("Fundo indisponivel para compra");
      else toast.error("Nao foi possivel concluir a compra");
    } finally {
      setBusyId(null);
    }
  };

  const handleEquip = async (d: Decoration) => {
    if (!user) return;
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para alterar seu visual.");
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
      toast.error("Disponível online. Reconecte-se para alterar seu visual.");
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
      toast.error("Disponível online. Reconecte-se para alterar seu visual.");
      return;
    }
    setBusyId(background.id);
    try {
      await equipProfileBackground(background.id);
      setEquippedBackground(background.id);
      toast.success(`${background.name} equipado`);
    } catch {
      toast.error("Erro ao equipar fundo");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnequipBackground = async () => {
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para alterar seu visual.");
      return;
    }
    setBusyId("unequip-background");
    try {
      await unequipProfileBackground();
      setEquippedBackground(null);
    } catch {
      toast.error("Erro ao remover fundo");
    } finally {
      setBusyId(null);
    }
  };

  const handleBuyNameGradient = async (gradient: NameGradient) => {
    if (!isOnline) {
      toast.error("Sem conexão. Tente novamente quando estiver online.");
      return;
    }
    setBusyId(gradient.id);
    try {
      const result = await purchaseNameGradient(gradient.id);
      setBalance(result.new_balance);
      setOwnedNameGradients((prev) => new Set([...prev, gradient.id]));
      toast.success(`${gradient.name} desbloqueado`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("insufficient")) toast.error("Moedas insuficientes");
      else if (message.includes("already_owned")) toast.error("Voce ja possui esse gradiente");
      else toast.error("Nao foi possivel comprar o gradiente");
    } finally {
      setBusyId(null);
    }
  };

  const handleEquipNameGradient = async (gradient: NameGradient) => {
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para alterar seu visual.");
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
      toast.error("Disponível online. Reconecte-se para alterar seu visual.");
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

  if (!authLoading && !user) return <Navigate to="/auth/login" />;

  const activeCategory = CATEGORIES.find((c) => c.key === activeTab)!;
  const items =
    activeCategory.type && activeCategory.type !== "background" ? grouped[activeCategory.type] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MobileAppHeader title="Loja" subtitle="Personalize sua experiência" />
      <PullToRefresh onRefresh={handlePullRefresh} disabled={!user || !isOnline}>

      {/* Mobile compact balance widget */}
      <section className="md:hidden border-b border-border/60 bg-background">
        <div className="px-4 py-4">
          <div
            className="relative overflow-hidden rounded-2xl border border-border/60 px-4 py-3 shadow-soft"
            style={{
              background:
                "linear-gradient(120deg, color-mix(in oklab, var(--rose) 14%, var(--card)) 0%, color-mix(in oklab, #f59e0b 12%, var(--card)) 100%)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <CoinIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Seu saldo
                  </p>
                  <p className="text-lg font-semibold leading-none">
                    {balance}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">moedas</span>
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur">
                <Gem className="h-3 w-3 text-[var(--rose)]" /> Loja do App
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero (desktop) */}
      <section className="relative overflow-hidden border-b hidden md:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 80% at 20% 0%, color-mix(in oklab, var(--rose) 22%, transparent), transparent 60%), radial-gradient(50% 70% at 90% 10%, color-mix(in oklab, var(--lilac, #c4b5fd) 22%, transparent), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-10 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{ background: "color-mix(in oklab, var(--rose) 50%, transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "color-mix(in oklab, var(--lilac, #c4b5fd) 60%, transparent)" }}
        />

        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--rose-soft)]/40 bg-background/70 px-3 py-1 text-xs font-medium text-[var(--rose)] backdrop-blur">
                <Gem className="h-3.5 w-3.5" /> Loja da Plataforma
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Personalize seu perfil
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Use suas moedas para desbloquear molduras, auras e itens exclusivos. Toda compra
                fica salva permanentemente na sua conta.
              </p>
            </div>

            {/* Balance */}
            <div className="inline-flex items-center gap-3 self-start rounded-2xl border bg-card/80 px-4 py-3 shadow-soft backdrop-blur sm:self-end">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <CoinIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Seu saldo
                </p>
                <p className="text-lg font-semibold leading-none">
                  {balance}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">moedas</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias horizontais */}
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+3.25rem)] z-20 -mb-2 bg-background/95 backdrop-blur md:static md:top-auto md:z-auto md:mb-0 md:bg-transparent md:backdrop-blur-0">
        <div className="mx-auto max-w-5xl px-4 pt-4 md:pt-6">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c) => {
              const active = activeTab === c.key;
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveTab(c.key)}
                  className={`app-pressable inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-foreground text-background shadow-soft"
                      : "border bg-card text-foreground hover:border-[var(--rose-soft)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        {!isOnline && !loading && catalog.length > 0 && (
          <StaleDataNotice
            className="mb-4"
            message="Você está offline. Mostrando itens carregados anteriormente. Compras e mudanças de visual estão indisponíveis."
          />
        )}
        {loading ? (
          <ShopSkeleton cards={8} />
        ) : !isOnline && catalog.length === 0 ? (
          <OfflineState className="my-12" />
        ) : activeTab === "all" ? (
          <HighlightsView
            decorations={catalog}
            backgrounds={backgrounds}
            owned={owned}
            ownedBackgrounds={ownedBackgrounds}
            equipped={equipped}
            equippedBackground={equippedBackground}
            onPickCategory={setActiveTab}
          />
        ) : activeTab === "inventory" ? (
          <InventoryView
            decorations={catalog}
            backgrounds={backgrounds}
            nameGradients={nameGradients}
            owned={owned}
            ownedBackgrounds={ownedBackgrounds}
            ownedNameGradients={ownedNameGradients}
            equipped={equipped}
            equippedBackground={equippedBackground}
            equippedNameGradient={equippedNameGradient}
            busyId={busyId}
            photoUrl={photoUrl}
            userEmail={user?.email ?? null}
            onEquipFrame={handleEquip}
            onEquipAura={handleEquip}
            onUnequipFrame={() => handleUnequip("frame")}
            onUnequipAura={() => handleUnequip("aura")}
            onEquipBackground={handleEquipBackground}
            onUnequipBackground={handleUnequipBackground}
            onEquipNameGradient={handleEquipNameGradient}
            onUnequipNameGradient={handleUnequipNameGradient}
            onBrowse={() => setActiveTab("all")}
          />
        ) : activeTab === "name-gradient" ? (
          nameGradients.length === 0 ? (
            <AppEmptyState
              icon={<GemIcon className="h-5 w-5" />}
              title="Nenhum item nesta categoria"
              description="Novos gradientes de nome podem aparecer em breve."
              className="my-12"
            />
          ) : (
            <>
              {equippedNameGradient && (
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={handleUnequipNameGradient}
                    disabled={busyId === "unequip-name-gradient"}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Remover gradiente atual
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nameGradients.map((gradient) => {
                  const isOwned = ownedNameGradients.has(gradient.id);
                  const isEquipped = equippedNameGradient === gradient.id;
                  const busy = busyId === gradient.id;
                  const canAfford = balance >= gradient.price;
                  return (
                    <article
                      key={gradient.id}
                      className={`app-card-interactive overflow-hidden rounded-2xl border bg-card p-5 transition ${
                        isEquipped
                          ? "border-[var(--rose)] ring-1 ring-[var(--rose)]/30"
                          : "hover:border-[var(--rose-soft)]"
                      }`}
                    >
                      <div className="rounded-2xl border bg-background p-5 text-center">
                        <p className="text-xs text-muted-foreground">Preview no perfil</p>
                        <p className="mt-2 text-3xl font-black" style={nameGradientStyle(gradient)}>
                          {gradient.name}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-black">{gradient.name}</h3>
                          <p className="text-xs text-muted-foreground">{gradient.price} moedas</p>
                        </div>
                        {isEquipped && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] font-semibold text-white">
                            <Check className="h-3 w-3" /> Equipado
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        {isEquipped ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            disabled={busyId === "unequip-name-gradient"}
                            onClick={handleUnequipNameGradient}
                          >
                            Equipado
                          </Button>
                        ) : isOwned ? (
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            disabled={busy || !isOnline}
                            onClick={() => handleEquipNameGradient(gradient)}
                          >
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            disabled={busy || !canAfford || !isOnline}
                            onClick={() => handleBuyNameGradient(gradient)}
                          >
                            {busy ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : canAfford ? (
                              <span className="inline-flex items-center gap-1.5">
                                Comprar
                                <span className="inline-flex items-center gap-1 opacity-80">
                                  <CoinIcon className="h-3 w-3" /> {gradient.price}
                                </span>
                              </span>
                            ) : (
                              "Moedas insuficientes"
                            )}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )
        ) : activeTab === "background" ? (
          backgrounds.length === 0 ? (
            <AppEmptyState
              icon={<GemIcon className="h-5 w-5" />}
              title="Nenhum item nesta categoria"
              description="Novos fundos de perfil podem aparecer em breve."
              className="my-12"
            />
          ) : (
            <>
              {equippedBackground && (
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={handleUnequipBackground}
                    disabled={busyId === "unequip-background"}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Remover fundo atual
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {backgrounds.map((background) => {
                  const isOwned = ownedBackgrounds.has(background.id);
                  const isEquipped = equippedBackground === background.id;
                  const busy = busyId === background.id;
                  const canAfford = balance >= background.price;
                  const rarity = BACKGROUND_RARITY_STYLE[background.rarity];

                  return (
                    <article
                      key={background.id}
                      className={`app-card-interactive group overflow-hidden rounded-2xl border bg-card transition ${
                        isEquipped
                          ? "border-[var(--rose)] ring-1 ring-[var(--rose)]/30"
                          : rarity.border
                      }`}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-muted to-card">
                        {background.image_url ? (
                          <img
                            src={background.image_url}
                            alt={background.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        <div className="absolute left-3 top-3 flex gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rarity.chip}`}
                          >
                            {rarity.label}
                          </span>
                          {isEquipped && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] font-semibold text-white">
                              <Check className="h-3 w-3" /> Equipado
                            </span>
                          )}
                        </div>
                        {!isOwned && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
                            <CoinIcon className="h-3 w-3" /> {background.price}
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="line-clamp-1 text-sm font-semibold" title={background.name}>
                          {background.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
                          {background.description || "Fundo premium para destacar seu perfil."}
                        </p>

                        <div className="mt-4">
                          {isEquipped ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              disabled={busyId === "unequip-background"}
                              onClick={handleUnequipBackground}
                            >
                              {busyId === "unequip-background" ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Equipado"
                              )}
                            </Button>
                          ) : isOwned ? (
                            <Button
                              size="sm"
                              className="w-full text-xs"
                              disabled={busy || !isOnline}
                              onClick={() => handleEquipBackground(background)}
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full text-xs"
                              disabled={busy || !canAfford || !isOnline}
                              onClick={() => setConfirmBackground(background)}
                            >
                              {busy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : canAfford ? (
                                <span className="inline-flex items-center gap-1.5">
                                  Comprar
                                  <span className="inline-flex items-center gap-1 opacity-80">
                                    <CoinIcon className="h-3 w-3" /> {background.price}
                                  </span>
                                </span>
                              ) : (
                                "Moedas insuficientes"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )
        ) : items.length === 0 ? (
          <AppEmptyState
            icon={<GemIcon className="h-5 w-5" />}
            title="Nenhum item nesta categoria"
            description="Novos itens de personalização podem aparecer em breve."
            className="my-12"
          />
        ) : (
          <>
            {activeCategory.type &&
              activeCategory.type !== "background" &&
              equipped[activeCategory.type] && (
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => handleUnequip(activeCategory.type as DecorationType)}
                    disabled={busyId === `unequip-${activeCategory.type}`}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Remover {activeCategory.label.toLowerCase().slice(0, -1)} atual
                  </Button>
                </div>
              )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {items.map((d) => {
                const isOwned = owned.has(d.id);
                const isEquipped = equipped[d.type] === d.id;
                const busy = busyId === d.id;
                const canAfford = balance >= d.price_coins;

                return (
                  <article
                    key={d.id}
                    className={`app-card-interactive group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-4 transition ${
                      isEquipped
                        ? "border-[var(--rose)] ring-1 ring-[var(--rose)]/30"
                        : "hover:border-[var(--rose-soft)]"
                    }`}
                  >
                    {isEquipped && (
                      <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Check className="h-3 w-3" /> Equipado
                      </span>
                    )}
                    {!isOwned && (
                      <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                        <CoinIcon className="h-3 w-3" /> {d.price_coins}
                      </span>
                    )}

                    <div className="relative mx-auto flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
                      <div
                        aria-hidden
                        className="absolute inset-0 rounded-full opacity-0 blur-2xl transition group-hover:opacity-60"
                        style={{
                          background:
                            "radial-gradient(circle, color-mix(in oklab, var(--rose) 40%, transparent), transparent 70%)",
                        }}
                      />
                      <DecoratedAvatar
                        photoUrl={photoUrl}
                        fallback={user?.email?.[0]?.toUpperCase() ?? "?"}
                        size={56}
                        frameId={d.type === "frame" ? d.id : equipped.frame}
                        auraId={d.type === "aura" ? d.id : equipped.aura}
                      />
                    </div>

                    <h3
                      className="mt-3 line-clamp-1 text-center text-sm font-semibold"
                      title={d.name}
                    >
                      {d.name}
                    </h3>
                    <p className="text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                      {d.type === "frame" ? "Moldura" : "Aura"}
                    </p>

                    <div className="mt-3">
                      {isEquipped ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          disabled={busyId === `unequip-${d.type}`}
                          onClick={() => handleUnequip(d.type)}
                        >
                          {busyId === `unequip-${d.type}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Equipado"
                          )}
                        </Button>
                      ) : isOwned ? (
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          disabled={busy || !isOnline}
                          onClick={() => handleEquip(d)}
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          disabled={busy || !canAfford || !isOnline}
                          onClick={() => setConfirm(d)}
                        >
                          {busy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : canAfford ? (
                            <span className="inline-flex items-center gap-1.5">
                              Comprar
                              <span className="inline-flex items-center gap-1 opacity-80">
                                <CoinIcon className="h-3 w-3" /> {d.price_coins}
                              </span>
                            </span>
                          ) : (
                            "Moedas insuficientes"
                          )}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
      </PullToRefresh>

      {/* Confirmation modal */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--rose)]" />
              Confirmar compra?
            </DialogTitle>
            <DialogDescription>
              {confirm && (
                <>
                  Deseja utilizar <strong className="text-foreground">{confirm.price_coins}</strong>{" "}
                  moedas para desbloquear este item?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {confirm && (
            <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                <DecoratedAvatar
                  photoUrl={photoUrl}
                  fallback={user?.email?.[0]?.toUpperCase() ?? "?"}
                  size={40}
                  frameId={confirm.type === "frame" ? confirm.id : equipped.frame}
                  auraId={confirm.type === "aura" ? confirm.id : equipped.aura}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{confirm.name}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {confirm.type === "frame" ? "Moldura" : "Aura"}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-amber-700">
                  <CoinIcon className="h-3.5 w-3.5" /> {confirm.price_coins}
                </p>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Saldo após a compra:{" "}
            <strong className="text-foreground">
              {confirm ? Math.max(0, balance - confirm.price_coins) : balance}
            </strong>{" "}
            moedas
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirm(null)}
              disabled={busyId === confirm?.id}
            >
              Cancelar
            </Button>
            <Button onClick={() => confirm && handleBuy(confirm)} disabled={busyId === confirm?.id || !isOnline}>
              {busyId === confirm?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Comprar item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmBackground} onOpenChange={(o) => !o && setConfirmBackground(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[var(--rose)]" />
              Confirmar compra?
            </DialogTitle>
            <DialogDescription>
              {confirmBackground && (
                <>
                  Deseja utilizar{" "}
                  <strong className="text-foreground">{confirmBackground.price}</strong> moedas para
                  desbloquear este fundo?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {confirmBackground && (
            <div className="overflow-hidden rounded-xl border bg-muted/30">
              <div className="relative aspect-[16/9] bg-muted">
                {confirmBackground.image_url ? (
                  <img
                    src={confirmBackground.image_url}
                    alt={confirmBackground.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="line-clamp-1 text-sm font-semibold">{confirmBackground.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
                    {confirmBackground.description || "Fundo premium para o cabecalho do perfil."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Saldo apos a compra:{" "}
            <strong className="text-foreground">
              {confirmBackground ? Math.max(0, balance - confirmBackground.price) : balance}
            </strong>{" "}
            moedas
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmBackground(null)}
              disabled={busyId === confirmBackground?.id}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => confirmBackground && handleBuyBackground(confirmBackground)}
              disabled={busyId === confirmBackground?.id || !isOnline}
            >
              {busyId === confirmBackground?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Comprar fundo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type HighlightItem =
  | { kind: "decoration"; item: Decoration }
  | { kind: "background"; item: ProfileBackground };

function HighlightsView({
  decorations,
  backgrounds,
  owned,
  ownedBackgrounds,
  equipped,
  equippedBackground,
  onPickCategory,
}: {
  decorations: Decoration[];
  backgrounds: ProfileBackground[];
  owned: Set<string>;
  ownedBackgrounds: Set<string>;
  equipped: EquippedMap;
  equippedBackground: string | null;
  onPickCategory: (key: CategoryKey) => void;
}) {
  const highlights = useMemo<HighlightItem[]>(() => {
    const decs = decorations
      .filter((d) => d.active && !owned.has(d.id))
      .map<HighlightItem>((d) => ({ kind: "decoration", item: d }));
    const bgs = backgrounds
      .filter((b) => b.is_active && !ownedBackgrounds.has(b.id))
      .map<HighlightItem>((b) => ({ kind: "background", item: b }));
    const all = [...decs, ...bgs];
    all.sort((a, b) => {
      const ra = RARITY_WEIGHT[(a.kind === "decoration" ? a.item.rarity : a.item.rarity) as string] ?? 0;
      const rb = RARITY_WEIGHT[(b.kind === "decoration" ? b.item.rarity : b.item.rarity) as string] ?? 0;
      if (rb !== ra) return rb - ra;
      const pa = a.kind === "decoration" ? a.item.price_coins : a.item.price;
      const pb = b.kind === "decoration" ? b.item.price_coins : b.item.price;
      return pb - pa;
    });
    return all.slice(0, 8);
  }, [decorations, backgrounds, owned, ownedBackgrounds]);

  const sections: { key: CategoryKey; label: string; count: number }[] = [
    { key: "frame", label: "Molduras", count: decorations.filter((d) => d.type === "frame").length },
    { key: "aura", label: "Auras", count: decorations.filter((d) => d.type === "aura").length },
    { key: "background", label: "Fundos de Perfil", count: backgrounds.length },
  ];

  if (highlights.length === 0 && decorations.length === 0 && backgrounds.length === 0) {
    return (
      <AppEmptyState
        icon={<GemIcon className="h-5 w-5" />}
        title="A loja está sendo preparada"
        description="Novos itens de personalização aparecerão por aqui em breve."
        className="my-12"
      />
    );
  }

  return (
    <div className="space-y-8">
      {highlights.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <Star className="h-4 w-4 text-[var(--rose)]" /> Destaques
            </h2>
            <span className="text-xs text-muted-foreground">Itens raros e especiais</span>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {highlights.map((h) => {
              const isEquipped =
                h.kind === "decoration"
                  ? equipped[h.item.type] === h.item.id
                  : equippedBackground === h.item.id;
              return (
                <button
                  key={`${h.kind}-${h.item.id}`}
                  type="button"
                  onClick={() =>
                    onPickCategory(
                      h.kind === "background"
                        ? "background"
                        : h.item.type === "frame"
                          ? "frame"
                          : h.item.type === "aura"
                            ? "aura"
                            : "all",
                    )
                  }
                  className="app-card-interactive w-[170px] shrink-0 overflow-hidden rounded-2xl border bg-card text-left md:w-auto"
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-card">
                    {h.kind === "background" ? (
                      h.item.image_url ? (
                        <img
                          src={h.item.image_url}
                          alt={h.item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {h.item.image_url ? (
                          <img
                            src={h.item.image_url}
                            alt={h.item.name}
                            loading="lazy"
                            className="h-3/4 w-3/4 object-contain"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            {h.item.type === "frame" ? (
                              <FrameIcon className="h-6 w-6" />
                            ) : (
                              <Sparkle className="h-6 w-6" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold capitalize text-foreground backdrop-blur">
                      {h.item.rarity}
                    </span>
                    {isEquipped && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold">{h.item.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {h.kind === "background"
                          ? "Fundo"
                          : h.item.type === "frame"
                            ? "Moldura"
                            : "Aura"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <CoinIcon className="h-3 w-3" />
                        {h.kind === "background" ? h.item.price : h.item.price_coins}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold">Categorias</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections
            .filter((s) => s.count > 0)
            .map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onPickCategory(s.key)}
                className="app-card-interactive flex items-center justify-between rounded-2xl border bg-card p-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.count} itens disponíveis</p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}

function InventoryView({
  decorations,
  backgrounds,
  nameGradients,
  owned,
  ownedBackgrounds,
  ownedNameGradients,
  equipped,
  equippedBackground,
  equippedNameGradient,
  busyId,
  photoUrl,
  userEmail,
  onEquipFrame,
  onEquipAura,
  onUnequipFrame,
  onUnequipAura,
  onEquipBackground,
  onUnequipBackground,
  onEquipNameGradient,
  onUnequipNameGradient,
  onBrowse,
}: {
  decorations: Decoration[];
  backgrounds: ProfileBackground[];
  nameGradients: NameGradient[];
  owned: Set<string>;
  ownedBackgrounds: Set<string>;
  ownedNameGradients: Set<string>;
  equipped: EquippedMap;
  equippedBackground: string | null;
  equippedNameGradient: string | null;
  busyId: string | null;
  photoUrl: string | null;
  userEmail: string | null;
  onEquipFrame: (d: Decoration) => void;
  onEquipAura: (d: Decoration) => void;
  onUnequipFrame: () => void;
  onUnequipAura: () => void;
  onEquipBackground: (b: ProfileBackground) => void;
  onUnequipBackground: () => void;
  onEquipNameGradient: (g: NameGradient) => void;
  onUnequipNameGradient: () => void;
  onBrowse: () => void;
}) {
  const myFrames = decorations.filter((d) => d.type === "frame" && owned.has(d.id));
  const myAuras = decorations.filter((d) => d.type === "aura" && owned.has(d.id));
  const myBackgrounds = backgrounds.filter((b) => ownedBackgrounds.has(b.id));
  const myGradients = nameGradients.filter((g) => ownedNameGradients.has(g.id));

  const isEmpty =
    myFrames.length === 0 &&
    myAuras.length === 0 &&
    myBackgrounds.length === 0 &&
    myGradients.length === 0;

  if (isEmpty) {
    return (
      <AppEmptyState
        icon={<Package className="h-5 w-5" />}
        title="Seu inventário ainda está vazio"
        description="Compre molduras, auras, fundos ou gradientes para personalizar sua experiência."
        actionLabel="Ver destaques"
        onAction={onBrowse}
        className="my-12"
      />
    );
  }

  const initials = userEmail?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="space-y-8">
      {myFrames.length > 0 && (
        <InventorySection title="Molduras" icon={<FrameIcon className="h-4 w-4" />}>
          {myFrames.map((d) => {
            const isEq = equipped.frame === d.id;
            const busy = busyId === d.id || (isEq && busyId === "unequip-frame");
            return (
              <InventoryCard
                key={d.id}
                name={d.name}
                rarity={d.rarity}
                preview={
                  <DecoratedAvatar
                    photoUrl={photoUrl}
                    fallback={initials}
                    size={56}
                    frameId={d.id}
                    auraId={equipped.aura}
                  />
                }
                equipped={isEq}
                busy={busy}
                onEquip={() => onEquipFrame(d)}
                onUnequip={onUnequipFrame}
              />
            );
          })}
        </InventorySection>
      )}

      {myAuras.length > 0 && (
        <InventorySection title="Auras" icon={<Sparkle className="h-4 w-4" />}>
          {myAuras.map((d) => {
            const isEq = equipped.aura === d.id;
            const busy = busyId === d.id || (isEq && busyId === "unequip-aura");
            return (
              <InventoryCard
                key={d.id}
                name={d.name}
                rarity={d.rarity}
                preview={
                  <DecoratedAvatar
                    photoUrl={photoUrl}
                    fallback={initials}
                    size={56}
                    frameId={equipped.frame}
                    auraId={d.id}
                  />
                }
                equipped={isEq}
                busy={busy}
                onEquip={() => onEquipAura(d)}
                onUnequip={onUnequipAura}
              />
            );
          })}
        </InventorySection>
      )}

      {myBackgrounds.length > 0 && (
        <InventorySection title="Fundos" icon={<ImageLucide className="h-4 w-4" />}>
          {myBackgrounds.map((b) => {
            const isEq = equippedBackground === b.id;
            const busy = busyId === b.id || (isEq && busyId === "unequip-background");
            return (
              <InventoryCard
                key={b.id}
                name={b.name}
                rarity={b.rarity}
                preview={
                  b.image_url ? (
                    <img
                      src={b.image_url}
                      alt={b.name}
                      loading="lazy"
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )
                }
                previewFill
                equipped={isEq}
                busy={busy}
                onEquip={() => onEquipBackground(b)}
                onUnequip={onUnequipBackground}
              />
            );
          })}
        </InventorySection>
      )}

      {myGradients.length > 0 && (
        <InventorySection title="Gradientes" icon={<TypeIcon className="h-4 w-4" />}>
          {myGradients.map((g) => {
            const isEq = equippedNameGradient === g.id;
            const busy = busyId === g.id || (isEq && busyId === "unequip-name-gradient");
            return (
              <InventoryCard
                key={g.id}
                name={g.name}
                preview={
                  <span
                    className="text-xl font-black"
                    style={nameGradientStyle(g)}
                  >
                    {g.name.slice(0, 6) || "Nome"}
                  </span>
                }
                equipped={isEq}
                busy={busy}
                onEquip={() => onEquipNameGradient(g)}
                onUnequip={onUnequipNameGradient}
              />
            );
          })}
        </InventorySection>
      )}
    </div>
  );
}

function InventorySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold">
        {icon}
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function InventoryCard({
  name,
  rarity,
  preview,
  previewFill,
  equipped,
  busy,
  onEquip,
  onUnequip,
}: {
  name: string;
  rarity?: string;
  preview: React.ReactNode;
  previewFill?: boolean;
  equipped: boolean;
  busy: boolean;
  onEquip: () => void;
  onUnequip: () => void;
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-card p-3 transition ${
        equipped ? "border-[var(--rose)] ring-1 ring-[var(--rose)]/30" : ""
      }`}
    >
      <div
        className={`relative flex items-center justify-center ${
          previewFill ? "aspect-[4/3] overflow-hidden rounded-xl bg-muted" : "h-24"
        }`}
      >
        {preview}
        {rarity && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-background/85 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-foreground backdrop-blur">
            {rarity}
          </span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 text-center text-sm font-semibold" title={name}>
        {name}
      </h3>
      <div className="mt-2">
        {equipped ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={busy}
            onClick={onUnequip}
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipado"}
          </Button>
        ) : (
          <Button size="sm" className="w-full text-xs" disabled={busy} onClick={onEquip}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
          </Button>
        )}
      </div>
    </article>
  );
}
