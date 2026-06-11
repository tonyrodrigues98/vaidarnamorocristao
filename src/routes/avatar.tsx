import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import roomAsset from "@/assets/avatar-room.png.asset.json";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { AvatarCategoryTabs } from "@/components/avatar/AvatarCategoryTabs";
import { AvatarStage } from "@/components/avatar/AvatarStage";
import { AvatarShopSheet, type ShopTab } from "@/components/avatar/AvatarShopSheet";
import { AvatarPoseSelector } from "@/components/avatar/AvatarPoseSelector";
import { AvatarExpressionSelector } from "@/components/avatar/AvatarExpressionSelector";
import {
  CATEGORY_SLUG_TO_LAYER,
  LAYER_SLOTS,
} from "@/data/avatarMockData";
import {
  LAYER_Z_INDEX,
  type AvatarExpressionKey,
  type AvatarPoseKey,
  type AvatarRendererLayer,
} from "@/types/avatar";

const ROOM_BG = roomAsset.url;

/**
 * Maps a DB category slug to a renderer layer key + anchor slot. Future:
 * `avatar_items.layer_key` will be a real column and this fallback is
 * dropped.
 */
function layerForSlug(slug: string) {
  const key = CATEGORY_SLUG_TO_LAYER[slug?.toLowerCase()] ?? "fullOutfit";
  return { layerKey: key, slot: LAYER_SLOTS[key], zIndex: LAYER_Z_INDEX[key] };
}

export const Route = createFileRoute("/avatar")({
  component: AvatarPage,
});

type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  layer_index: number;
};

type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  price: number;
  rarity: string;
  is_premium: boolean;
  gender: string;
  sort_order: number;
};

type Base = {
  id: string;
  name: string;
  gender: string;
  image_url: string;
};

type Equipped = {
  category_id: string;
  item_id: string;
};

type SavedLook = {
  id: string;
  image_path: string;
  image_url: string;
  created_at: string;
};

function AvatarPage() {
  const { user, role, loading: authLoading } = useAuth();
  const isSuperAdmin = role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [base, setBase] = useState<Base | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [tab, setTab] = useState<ShopTab>("loja");
  const [inventory, setInventory] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<Map<string, string>>(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState<number>(0);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [looksLoading, setLooksLoading] = useState(false);
  // Local-only state — pose & expression aren't persisted yet (no DB
  // columns). When the schema lands, hydrate from `user_avatar_equipped`.
  const [pose, setPose] = useState<AvatarPoseKey>("standing_default");
  const [expression, setExpression] = useState<AvatarExpressionKey>("soft_smile");
  const [poseSheetOpen, setPoseSheetOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadAll();
    void loadLooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAll() {
    if (!user) return;
    setLoading(true);

    const [catsRes, itemsRes, basesRes, profileRes, invRes, eqRes, coinsRes] = await Promise.all([
      supabase.from("avatar_categories").select("*").order("sort_order"),
      supabase.from("avatar_items").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("avatar_bases").select("*").eq("is_active", true),
      supabase.from("profiles").select("sex").eq("id", user.id).maybeSingle(),
      supabase.from("user_avatar_inventory").select("item_id, is_favorite").eq("user_id", user.id),
      supabase.from("user_avatar_equipped").select("category_id, item_id").eq("user_id", user.id),
      supabase.from("user_coins").select("balance").eq("user_id", user.id).maybeSingle(),
    ]);

    const cats = (catsRes.data ?? []) as Category[];
    const its = (itemsRes.data ?? []) as Item[];
    const bs = (basesRes.data ?? []) as Base[];
    setCategories(cats);
    setItems(its);
    setBases(bs);
    if (cats.length && !activeCat) setActiveCat(cats[0].id);

    // Pick base by profile.sex
    const sex = (profileRes.data?.sex as string | undefined)?.toLowerCase();
    const wantGender =
      sex === "f" || sex === "feminino" || sex === "mulher" ? "feminino" : "masculino";
    const matched = bs.find((b) => b.gender === wantGender) ?? bs[0] ?? null;
    setBase(matched);

    const inv = new Set<string>();
    const favs = new Set<string>();
    for (const row of (invRes.data ?? []) as { item_id: string; is_favorite: boolean }[]) {
      inv.add(row.item_id);
      if (row.is_favorite) favs.add(row.item_id);
    }
    setInventory(inv);
    setFavorites(favs);

    const eq = new Map<string, string>();
    for (const row of (eqRes.data ?? []) as Equipped[]) eq.set(row.category_id, row.item_id);
    setEquipped(eq);

    setCoins((coinsRes.data?.balance as number | undefined) ?? 0);
    setLoading(false);
  }

  async function loadLooks() {
    if (!user) return;
    setLooksLoading(true);
    const { data } = await supabase
      .from("user_avatar_looks")
      .select("id, image_path, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24);
    const rows = (data ?? []) as { id: string; image_path: string; created_at: string }[];
    const withUrls: SavedLook[] = rows.map((r) => {
      const { data: pub } = supabase.storage.from("avatar-looks").getPublicUrl(r.image_path);
      return { ...r, image_url: pub.publicUrl };
    });
    setLooks(withUrls);
    setLooksLoading(false);
  }

  async function deleteLook(look: SavedLook) {
    if (!user) return;
    const ok = confirm("Excluir este look salvo?");
    if (!ok) return;
    await supabase.storage.from("avatar-looks").remove([look.image_path]);
    const { error } = await supabase.from("user_avatar_looks").delete().eq("id", look.id);
    if (error) return toast.error("Erro ao excluir");
    setLooks((ls) => ls.filter((l) => l.id !== look.id));
    toast.success("Look excluído");
  }

  const equippedItems = useMemo(() => {
    const map = new Map<string, Item>();
    for (const [catId, itemId] of equipped) {
      const it = items.find((i) => i.id === itemId);
      if (it) map.set(catId, it);
    }
    return map;
  }, [equipped, items]);

  const renderedLayers = useMemo(() => {
    const list: { item: Item; layer: number; slug: string }[] = [];
    for (const cat of categories) {
      const it = equippedItems.get(cat.id);
      if (it) list.push({ item: it, layer: cat.layer_index, slug: cat.slug });
    }
    list.sort((a, b) => a.layer - b.layer);
    return list;
  }, [categories, equippedItems]);

  // Adapter: DB-shaped equipped items → generic renderer layers.
  const rendererLayers = useMemo<AvatarRendererLayer[]>(() => {
    return renderedLayers.map(({ item, slug }) => {
      const { layerKey, slot, zIndex } = layerForSlug(slug);
      return {
        id: item.id,
        layerKey,
        imageUrl: item.image_url,
        slot,
        zIndex,
        alt: item.name,
      };
    });
  }, [renderedLayers]);

  const itemsForCat = useMemo(() => {
    if (!activeCat) return [];
    const filtered = items.filter((i) => i.category_id === activeCat);
    if (tab === "meus") return filtered.filter((i) => inventory.has(i.id));
    return filtered;
  }, [items, activeCat, tab, inventory]);

  async function equipItem(item: Item) {
    if (!user) return;
    if (!inventory.has(item.id)) {
      return buyItem(item);
    }
    const { error } = await supabase
      .from("user_avatar_equipped")
      .upsert(
        { user_id: user.id, category_id: item.category_id, item_id: item.id, base_id: base?.id },
        { onConflict: "user_id,category_id" },
      );
    if (error) {
      toast.error("Erro ao equipar item");
      return;
    }
    setEquipped((m) => new Map(m).set(item.category_id, item.id));
  }

  async function buyItem(item: Item) {
    if (!user) return;
    if (coins < item.price) {
      toast.error(`Saldo insuficiente. Você tem ${coins} moedas.`);
      return;
    }
    const ok = confirm(`Comprar "${item.name}" por ${item.price} moedas?`);
    if (!ok) return;
    const { data, error } = await supabase.rpc("purchase_avatar_item", { _item_id: item.id });
    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("insufficient")) toast.error("Saldo insuficiente.");
      else if (msg.includes("already owned")) toast.info("Você já possui este item.");
      else toast.error("Erro na compra: " + msg);
      return;
    }
    const newBalance = (data as { new_balance?: number } | null)?.new_balance;
    if (typeof newBalance === "number") setCoins(newBalance);
    setInventory((s) => new Set(s).add(item.id));
    toast.success(`"${item.name}" adquirido!`);
    // Auto-equipa
    await supabase
      .from("user_avatar_equipped")
      .upsert(
        { user_id: user.id, category_id: item.category_id, item_id: item.id, base_id: base?.id },
        { onConflict: "user_id,category_id" },
      );
    setEquipped((m) => new Map(m).set(item.category_id, item.id));
  }

  async function saveLook() {
    if (!user || !base) return;
    if (renderedLayers.length === 0) {
      toast.info("Equipe ao menos 1 item para salvar o look.");
      return;
    }
    const toastId = toast.loading("Salvando look...");
    try {
      const canvas = document.createElement("canvas");
      const W = 768;
      const H = 1024;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível");

      ctx.fillStyle = "#FFF7F3";
      ctx.fillRect(0, 0, W, H);

      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Falha ao carregar " + src));
          img.src = src;
        });

      const baseImg = await loadImg(base.image_url);
      // Mesma lógica do preview: base ocupa ~68% da altura, centralizada,
      // posicionada como se estivesse no pódio (bottom ~18%).
      const wrapperH = H * 0.68;
      const wrapperW = wrapperH * (3 / 4);
      const wrapperLeft = (W - wrapperW) / 2;
      // bottom: 18% from canvas bottom
      const wrapperTop = H - wrapperH - H * 0.18;

      // Fundo do quarto (já existe ROOM_BG carregado via CSS — pulamos no canvas
      // pra manter a foto do look limpa e leve. Mantemos fundo creme.)
      const drawInBox = (
        img: HTMLImageElement,
        boxX: number,
        boxY: number,
        boxW: number,
        boxH: number,
      ) => {
        const scale = Math.min(boxW / img.width, boxH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, boxX + (boxW - w) / 2, boxY + (boxH - h) / 2, w, h);
      };

      // Base preenche o wrapper inteiro
      drawInBox(baseImg, wrapperLeft, wrapperTop, wrapperW, wrapperH);

      const pct = (v: string) => parseFloat(v) / 100;
      for (const { item, slug } of renderedLayers) {
        const img = await loadImg(item.image_url);
        const { slot } = layerForSlug(slug);
        const sx = wrapperLeft + pct(slot.left) * wrapperW;
        const sy = wrapperTop + pct(slot.top) * wrapperH;
        const sw = pct(slot.width) * wrapperW;
        const sh = pct(slot.height) * wrapperH;
        drawInBox(img, sx, sy, sw, sh);
      }

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png", 0.92));
      if (!blob) throw new Error("Erro ao gerar imagem");

      const path = `${user.id}/${Date.now()}.png`;
      const up = await supabase.storage.from("avatar-looks").upload(path, blob, {
        contentType: "image/png",
        cacheControl: "31536000",
      });
      if (up.error) throw up.error;

      const snapshot = {
        base_id: base.id,
        items: Array.from(equipped.entries()).map(([category_id, item_id]) => ({ category_id, item_id })),
        pose,
        expression,
      };
      const ins = await supabase
        .from("user_avatar_looks")
        .insert({ user_id: user.id, image_path: path, snapshot });
      if (ins.error) throw ins.error;

      toast.success("Look salvo!", { id: toastId });
      void loadLooks();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast.error(msg, { id: toastId });
    }
  }

  async function toggleFavorite(item: Item) {
    if (!user) return;
    const isFav = favorites.has(item.id);
    if (!inventory.has(item.id)) {
      toast.info("Adquira o item primeiro para favoritar.");
      return;
    }
    const { error } = await supabase
      .from("user_avatar_inventory")
      .update({ is_favorite: !isFav })
      .eq("user_id", user.id)
      .eq("item_id", item.id);
    if (error) return toast.error("Erro ao favoritar");
    setFavorites((s) => {
      const n = new Set(s);
      if (isFav) n.delete(item.id);
      else n.add(item.id);
      return n;
    });
  }

  function shuffleLook() {
    const owned = items.filter((i) => inventory.has(i.id));
    if (!owned.length) {
      toast.info("Você ainda não tem itens. Use o admin para popular a loja.");
      return;
    }
    const next = new Map<string, string>();
    for (const cat of categories) {
      const pool = owned.filter((i) => i.category_id === cat.id);
      if (pool.length) next.set(cat.id, pool[Math.floor(Math.random() * pool.length)].id);
    }
    setEquipped(next);
  }

  function resetLook() {
    setEquipped(new Map());
    setPose("standing_default");
    setExpression("soft_smile");
    if (!user) return;
    void supabase.from("user_avatar_equipped").delete().eq("user_id", user.id);
  }

  const handleEquip = useCallback((item: Item) => void equipItem(item), []);
  const handleToggleFav = useCallback((item: Item) => void toggleFavorite(item), []);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth/login" />;
  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Crown className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Em desenvolvimento</h1>
        <p className="text-sm text-muted-foreground">
          A página de Avatar está disponível apenas para super administradores enquanto está em construção.
        </p>
        <Button asChild variant="outline">
          <Link to="/inicio">Voltar para o início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F3] via-[#FFF1EC] to-[#FFE9E2]">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[#FFF7F3]/80 px-4 pt-4 pb-3 backdrop-blur-md">
        <Link
          to="/inicio"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
        <h1 className="flex items-center gap-1.5 font-serif text-xl font-semibold text-primary">
          <span className="text-primary">♥+</span>
          VaiDarNamoro
        </h1>
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <CoinIcon className="h-5 w-5" />
          <span className="text-sm font-semibold text-foreground">{coins.toLocaleString("pt-BR")}</span>
          <button className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 text-primary">
            +
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-border/30 bg-white">
        <div className="flex gap-1 overflow-x-auto px-2">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] ?? Shirt;
            const isActive = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1 px-3 py-3 transition",
                  "relative",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {cat.name}
                  </span>
                </div>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar stage */}
      <div className="relative">
        <div
          className="relative mx-auto aspect-[9/16] w-full max-w-md overflow-hidden"
          style={{
            backgroundImage: `url(${ROOM_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Base + layers — avatar standing on the white podium */}
          {base && (
            <div className="absolute inset-x-0 bottom-[18%] flex justify-center">
              <div className="relative h-[68%] w-auto" style={{ aspectRatio: "3 / 4" }}>
                <img
                  src={base.image_url}
                  alt={base.name}
                  className="h-full w-auto object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.15)]"
                  draggable={false}
                />
                {renderedLayers.map(({ item, layer, slug }) => {
                  const slot = slotFor(slug);
                  return (
                    <img
                      key={item.id}
                      src={item.image_url}
                      alt={item.name}
                      className="absolute object-contain"
                      style={{
                        top: slot.top,
                        left: slot.left,
                        width: slot.width,
                        height: slot.height,
                        zIndex: layer,
                      }}
                      draggable={false}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Left action rail */}
          <div className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-3">
            <ActionBubble icon={<Shuffle className="h-4 w-4" />} onClick={shuffleLook} />
            <ActionBubble icon={<RotateCcw className="h-4 w-4" />} onClick={resetLook} />
            <ActionBubble icon={<Heart className="h-4 w-4 fill-primary text-primary" />} label="Favorito" />
          </div>

          {/* Right side */}
          <div className="absolute right-3 top-6 flex flex-col items-end gap-3">
            <div className="flex flex-col items-center rounded-2xl border border-amber-200 bg-white px-3 py-2 shadow-sm">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="mt-0.5 text-xs font-semibold leading-tight text-amber-700">Visual</span>
              <span className="text-xs font-semibold leading-tight text-amber-700">Premium</span>
            </div>
          </div>

          <div className="absolute right-3 bottom-24 flex flex-col items-end gap-2">
            <button className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
              <Info className="h-4 w-4" />
              Detalhes
            </button>
            <button
              onClick={saveLook}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
            >
              <Camera className="h-4 w-4" />
              Salvar Look
            </button>
          </div>

        </div>
      </div>

      {/* Saved looks gallery */}
      <div className="mx-auto w-full max-w-md px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Meus Looks Salvos</h2>
          <span className="text-xs text-muted-foreground">{looks.length}</span>
        </div>
        {looksLoading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : looks.length === 0 ? (
          <p className="rounded-2xl bg-white/70 px-3 py-4 text-center text-xs text-muted-foreground">
            Nenhum look salvo ainda. Monte um visual e toque em "Salvar Look".
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {looks.map((l) => (
              <div
                key={l.id}
                className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                style={{ width: 96, height: 128 }}
              >
                <img src={l.image_url} alt="Look salvo" className="h-full w-full object-cover" />
                <button
                  onClick={() => deleteLook(l)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[10px] text-white"
                  aria-label="Excluir look"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shop drawer */}
      <div className="rounded-t-3xl bg-white px-4 pt-4 pb-24 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setTab("loja")}
              className={cn(
                "relative flex items-center gap-1.5 pb-2 text-sm font-medium",
                tab === "loja" ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span>🛍️</span> Loja
              {tab === "loja" && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setTab("meus")}
              className={cn(
                "relative flex items-center gap-1.5 pb-2 text-sm font-medium",
                tab === "meus" ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span>👗</span> Meus Itens
              {tab === "meus" && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : itemsForCat.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === "meus"
                ? "Você ainda não tem itens desta categoria."
                : "Nenhum item cadastrado nesta categoria ainda."}
            </p>
            <p className="text-xs text-muted-foreground">
              Adicione itens via admin para popular a loja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {itemsForCat.map((item) => {
              const isEquipped = equipped.get(item.category_id) === item.id;
              const owned = inventory.has(item.id);
              const isFav = favorites.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => equipItem(item)}
                  className={cn(
                    "group relative flex flex-col rounded-2xl border bg-white p-2 text-left transition",
                    isEquipped
                      ? "border-primary shadow-md ring-1 ring-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleFavorite(item);
                    }}
                    className="absolute right-2 top-2 z-10"
                  >
                    {isEquipped ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <Heart
                        className={cn(
                          "h-5 w-5",
                          isFav ? "fill-primary text-primary" : "text-muted-foreground",
                        )}
                      />
                    )}
                  </button>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FFF7F3] to-[#FFEEE6]">
                    <img
                      src={item.thumbnail_url ?? item.image_url}
                      alt={item.name}
                      className="h-full w-full object-contain p-2"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2 px-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    {item.is_premium && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                        <Crown className="h-3 w-3" />
                        Premium
                      </div>
                    )}
                    <div className="mt-1.5">
                      {isEquipped ? (
                        <div className="rounded-full bg-primary px-3 py-1 text-center text-xs font-semibold text-primary-foreground">
                          Equipado
                        </div>
                      ) : owned ? (
                        <div className="rounded-full bg-secondary px-3 py-1 text-center text-xs font-medium text-foreground">
                          Equipar
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                            coins >= item.price
                              ? "bg-amber-100 text-amber-900"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <CoinIcon className="h-3.5 w-3.5" />
                          <span>{item.price.toLocaleString("pt-BR")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBubble({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full bg-white shadow-md transition hover:scale-105"
    >
      {icon}
      {label && <span className="text-[9px] font-medium text-muted-foreground">{label}</span>}
    </button>
  );
}