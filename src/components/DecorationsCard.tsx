import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

type EquippedMap = { frame: string | null; aura: string | null; sticker: string | null };

const TYPE_LABEL: Record<DecorationType, string> = {
  frame: "Moldura",
  aura: "Aura",
  sticker: "Sticker",
};

// Stickers temporariamente desativados na UI até definirmos um novo design.
const VISIBLE_TYPES: DecorationType[] = ["frame", "aura"];

export function DecorationsCard({
  photoUrl,
  onChange,
}: {
  photoUrl: string | null;
  onChange?: (equipped: EquippedMap) => void;
}) {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Decoration[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<EquippedMap>({ frame: null, aura: null, sticker: null });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ frame: string | null; aura: string | null; sticker: string | null }>({
    frame: null,
    aura: null,
    sticker: null,
  });
  const [activeTab, setActiveTab] = useState<DecorationType>("frame");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [c, o, coins, prof] = await Promise.all([
          fetchDecorationCatalog(),
          fetchMyOwnedIds(),
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
        const next: EquippedMap = {
          frame: p.equipped_frame_id ?? null,
          aura: p.equipped_aura_id ?? null,
          sticker: p.equipped_sticker_id ?? null,
        };
        setEquipped(next);
        onChange?.(next);
      } catch {
        toast.error("Não foi possível carregar as decorações");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const grouped = useMemo(() => {
    const g: Record<DecorationType, Decoration[]> = { frame: [], aura: [], sticker: [] };
    catalog.forEach((d) => {
      if (VISIBLE_TYPES.includes(d.type) && owned.has(d.id)) g[d.type].push(d);
    });
    return g;
  }, [catalog, owned]);

  const updateEquipped = (next: EquippedMap) => {
    setEquipped(next);
    onChange?.(next);
  };

  const handleBuy = async (d: Decoration) => {
    setBusyId(d.id);
    try {
      const r = await purchaseDecoration(d.id);
      setBalance(r.new_balance);
      setOwned((s) => new Set([...s, d.id]));
      toast.success(`${d.name} desbloqueada!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("insufficient")) toast.error("Moedas insuficientes");
      else if (msg.includes("already_owned")) toast.error("Você já possui essa decoração");
      else toast.error("Não foi possível comprar");
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

      updateEquipped(nextEquipped);

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

      updateEquipped(nextEquipped);
    } catch (error) {
      toast.error(decorationErrorMessage(error, "Erro ao remover"));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card/50 p-6 text-center text-sm text-muted-foreground">
        Carregando decorações…
      </div>
    );
  }

  const renderItems = (type: DecorationType) => {
    const items = grouped[type];
    if (items.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Você ainda não possui {type === "frame" ? "molduras" : "auras"}.{" "}
          <a href="/loja" className="font-medium text-[var(--rose)] hover:underline">
            Visitar a loja
          </a>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((d) => {
          const isOwned = owned.has(d.id);
          const isEquipped = equipped[type] === d.id;
          const busy = busyId === d.id;
          const isPreviewing = preview[type] === d.id;
          const previewProps = {
            photoUrl,
            fallback: user?.email?.[0]?.toUpperCase() ?? "?",
            size: 40,
            frameId: type === "frame" ? d.id : equipped.frame,
            auraId: type === "aura" ? d.id : equipped.aura,
            stickerId: type === "sticker" ? d.id : equipped.sticker,
          };

          return (
            <div
              key={d.id}
              onClick={() => setPreview((p) => ({ ...p, [type]: p[type] === d.id ? null : d.id }))}
              className={`flex cursor-pointer flex-col items-center rounded-2xl border bg-card p-3 text-center transition ${
                isPreviewing
                  ? "border-[var(--rose)] ring-2 ring-[var(--rose)]/40 shadow-soft"
                  : isEquipped
                    ? "border-[var(--rose)] shadow-soft"
                    : "hover:border-[var(--rose-soft)]"
              }`}
            >
              <div className="flex h-28 w-28 items-center justify-center">
                <DecoratedAvatar {...previewProps} />
              </div>
              <p className="mt-2 line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-tight" title={d.name}>
                {d.name}
              </p>
              <div className="mt-2 w-full" onClick={(e) => e.stopPropagation()}>
                {isEquipped ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    disabled={busy || busyId === `unequip-${type}`}
                    onClick={() => handleUnequip(type)}
                  >
                    {busyId === `unequip-${type}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-3 w-3" /> Equipado
                      </>
                    )}
                  </Button>
                ) : isOwned ? (
                  <Button size="sm" className="w-full text-xs" disabled={busy} onClick={() => handleEquip(d)}>
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Usar"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    disabled={busy || balance < d.price_coins}
                    onClick={() => handleBuy(d)}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <CoinIcon className="h-3 w-3" /> {d.price_coins}
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {equipped[type] && (
          <div className="col-span-2 sm:col-span-3 md:col-span-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => handleUnequip(type)}
              disabled={busyId === `unequip-${type}`}
            >
              <X className="mr-1 h-3 w-3" /> Remover {TYPE_LABEL[type].toLowerCase()} atual
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-2xl border bg-card/50 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-[var(--rose)]" /> Decorações de Perfil
          </h3>
          <p className="text-xs text-muted-foreground">
            Personalize sua foto com molduras e auras. Salva automaticamente.
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
          <CoinIcon className="h-4 w-4" /> {balance}
        </div>
      </div>

      <div className="mb-5 flex flex-col items-center gap-2 rounded-xl border border-dashed bg-background/60 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
        <div className="flex h-52 w-52 items-center justify-center">
          <DecoratedAvatar
            photoUrl={photoUrl}
            fallback={user?.email?.[0]?.toUpperCase() ?? "?"}
            size={72}
            frameId={preview.frame ?? equipped.frame}
            auraId={preview.aura ?? equipped.aura}
          />
        </div>
        {(preview.frame || preview.aura) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setPreview({ frame: null, aura: null, sticker: null })}
          >
            <X className="mr-1 h-3 w-3" /> Limpar pré-visualização
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground">
          Toque em um item para visualizar. Use "Comprar" ou "Usar" para aplicar.
        </p>
      </div>

      <Tabs
        value={activeTab === "sticker" ? "frame" : activeTab}
        onValueChange={(v) => setActiveTab(v as DecorationType)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="frame" className="flex-1">
            Moldura
          </TabsTrigger>
          <TabsTrigger value="aura" className="flex-1">
            Aura
          </TabsTrigger>
        </TabsList>
        <TabsContent value="frame" className="mt-4">
          {renderItems("frame")}
        </TabsContent>
        <TabsContent value="aura" className="mt-4">
          {renderItems("aura")}
        </TabsContent>
      </Tabs>
    </section>
  );
}
