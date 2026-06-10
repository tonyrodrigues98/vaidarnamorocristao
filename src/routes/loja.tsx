import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ImageIcon, Loader2, Sparkles, X, Lock, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
type CategoryKey = "frame" | "aura" | "background" | "name-gradient" | "soon";

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  type: DecorationType | "background" | null;
}[] = [
  { key: "frame", label: "Molduras", type: "frame" },
  { key: "aura", label: "Auras", type: "aura" },
  { key: "background", label: "Fundos de Perfil", type: "background" },
  { key: "name-gradient", label: "Gradiente no Nome", type: null },
  { key: "soon", label: "Em breve", type: null },
];

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryKey>("frame");
  const [confirm, setConfirm] = useState<Decoration | null>(null);
  const [confirmBackground, setConfirmBackground] = useState<ProfileBackground | null>(null);

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
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const grouped = useMemo(() => {
    const g: Record<DecorationType, Decoration[]> = { frame: [], aura: [], sticker: [] };
    catalog.forEach((d) => g[d.type]?.push(d));
    return g;
  }, [catalog]);

  const handleBuy = async (d: Decoration) => {
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

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
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

      {/* Tabs */}
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = activeTab === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveTab(c.key)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-foreground text-background shadow-soft"
                    : "border bg-card text-foreground hover:border-[var(--rose-soft)]"
                }`}
              >
                {c.label}
                {c.key === "soon" && (
                  <span className="ml-1.5 inline-flex items-center text-[10px] opacity-70">
                    <Lock className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        {loading ? (
          <ShopSkeleton cards={8} />
        ) : activeTab === "soon" ? (
          <ComingSoon />
        ) : activeTab === "name-gradient" ? (
          nameGradients.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Em breve novos gradientes de nome.
            </p>
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
                      className={`overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft ${
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
                            disabled={busy}
                            onClick={() => handleEquipNameGradient(gradient)}
                          >
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            disabled={busy || !canAfford}
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
            <p className="py-16 text-center text-sm text-muted-foreground">
              Em breve novos fundos de perfil.
            </p>
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
                      className={`group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-soft ${
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
                              disabled={busy}
                              onClick={() => handleEquipBackground(background)}
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full text-xs"
                              disabled={busy || !canAfford}
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
          <p className="py-16 text-center text-sm text-muted-foreground">
            Em breve novos itens nessa categoria.
          </p>
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
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-soft ${
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
                          disabled={busy}
                          onClick={() => handleEquip(d)}
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Equipar"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          disabled={busy || !canAfford}
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
            <Button onClick={() => confirm && handleBuy(confirm)} disabled={busyId === confirm?.id}>
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
              disabled={busyId === confirmBackground?.id}
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

function ComingSoon() {
  const items = [
    { name: "Fundos de Perfil", desc: "Cenários exclusivos atrás da sua foto" },
    { name: "Stickers Especiais", desc: "Adesivos para conversas e perfil" },
    { name: "Efeitos Premium", desc: "Animações exclusivas e raras" },
    { name: "Itens Sazonais", desc: "Coleções limitadas por temporada" },
    { name: "Presentes Virtuais", desc: "Envie um carinho para alguém especial" },
    { name: "Coleções Exclusivas", desc: "Conjuntos completos com bônus" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.name} className="relative overflow-hidden rounded-2xl border bg-card/50 p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl"
            style={{ background: "color-mix(in oklab, var(--rose) 40%, transparent)" }}
          />
          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Lock className="h-3 w-3" /> Em breve
          </div>
          <h3 className="mt-3 text-sm font-semibold">{i.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{i.desc}</p>
        </div>
      ))}
    </div>
  );
}
