import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AvatarHeader } from "@/components/avatar/AvatarHeader";
import { AvatarCategoryTabs } from "@/components/avatar/AvatarCategoryTabs";
import { AvatarStage } from "@/components/avatar/AvatarStage";
import { AvatarShopSheet, type ShopTab } from "@/components/avatar/AvatarShopSheet";
import { AvatarBaseSelector, type AvatarBaseOption } from "@/components/avatar/AvatarBaseSelector";
import { AvatarPoseSelector } from "@/components/avatar/AvatarPoseSelector";
import { AvatarExpressionSelector } from "@/components/avatar/AvatarExpressionSelector";
import { AvatarColorPicker } from "@/components/avatar/AvatarColorPicker";
import { getColorPreset } from "@/data/avatarColorPresets";
import {
  CATEGORY_SLUG_TO_LAYER,
  LAYER_SLOTS,
} from "@/data/avatarMockData";
import {
  LAYER_Z_INDEX,
  type AvatarExpressionKey,
  type AvatarLayerKey,
  type AvatarPoseKey,
  type AvatarRendererLayer,
} from "@/types/avatar";

const WEIGHT_TAB_ID = "__weight__";
const POSE_TAB_ID = "__pose__";
const SKIN_TAB_ID = "__skin__";

const BODY_TYPE_LABELS: Record<string, string> = {
  default: "Padrão",
  slim: "Magro",
  overweight: "Sobrepeso",
  muscular: "Musculoso",
};
const POSE_LABELS: Record<string, string> = {
  standing_default: "Padrão",
  elegant: "Elegante",
  praying: "Em oração",
  waving: "Acenando",
  holding_heart: "Coração",
};
const SKIN_LABELS: Record<string, string> = {
  default: "Padrão",
  porcelain: "Porcelana",
  light: "Clara",
  tan: "Bronzeada",
  olive: "Oliva",
  brown: "Marrom",
  deep: "Profunda",
};
const SKIN_SWATCH: Record<string, string> = {
  default: "#F2CDA0",
  porcelain: "#F9E2D0",
  light: "#EFC9A4",
  tan: "#C99368",
  olive: "#B68A5A",
  brown: "#8A5A3B",
  deep: "#4E2E1E",
};
const SKIN_ORDER = ["default", "porcelain", "light", "tan", "olive", "brown", "deep"];
const BODY_TYPE_ORDER = ["default", "slim", "overweight", "muscular"];
const POSE_ORDER = [
  "standing_default",
  "elegant",
  "praying",
  "waving",
  "holding_heart",
];

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
  body_type: string;
  pose_key: string;
  skin_tone: string;
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
  // Body type + pose drive WHICH base row is shown (real swap, not overlay).
  const [bodyType, setBodyType] = useState<string>("default");
  const [pose, setPose] = useState<AvatarPoseKey>("standing_default");
  const [skinTone, setSkinTone] = useState<string>("default");
  // Marca quando a hidratação inicial do user_avatar_base terminou —
  // antes disso, os auto-saves precisam ficar travados pra não sobrescrever
  // o que está salvo no banco com o default do useState.
  const baseHydratedRef = useRef(false);
  const [expression, setExpression] = useState<AvatarExpressionKey>("soft_smile");
  const [poseSheetOpen, setPoseSheetOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Preview equips an item visually without persisting/buying. Clears when
  // the user navigates categories or selects another preview.
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  /**
   * Escolha de cor por layer (cabelo, roupa). Persistida em
   * `user_avatar_base.color_selections` (jsonb). Chave = AvatarLayerKey,
   * valor = id do preset em `src/data/avatarColorPresets.ts`.
   */
  const [colorSelections, setColorSelections] = useState<
    Partial<Record<AvatarLayerKey, string>>
  >({
    hairFront: "hair-dark-brown",
    top: "cloth-white",
  });

  function toggleGender() {
    const nextGender = currentGender === "feminino" ? "masculino" : "feminino";
    const next =
      bases.find(
        (b) =>
          b.gender === nextGender &&
          b.body_type === bodyType &&
          b.pose_key === pose &&
          b.skin_tone === skinTone,
      ) ??
      bases.find(
        (b) => b.gender === nextGender && b.body_type === bodyType && b.pose_key === pose,
      ) ??
      bases.find(
        (b) =>
          b.gender === nextGender &&
          b.body_type === "default" &&
          b.pose_key === "standing_default" &&
          b.skin_tone === skinTone,
      ) ??
      bases.find((b) => b.gender === nextGender) ??
      null;
    if (!next) {
      toast.error("Variação indisponível para este gênero.");
      return;
    }
    setBase(next);
    setBodyType(next.body_type);
    setPose(next.pose_key as AvatarPoseKey);
    setSkinTone(next.skin_tone ?? "default");
  }

  useEffect(() => {
    if (!user) return;
    void loadAll();
    void loadLooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAll() {
    if (!user) return;
    setLoading(true);

    const [catsRes, itemsRes, basesRes, profileRes, invRes, eqRes, coinsRes, userBaseRes] =
      await Promise.all([
      supabase.from("avatar_categories").select("*").order("sort_order"),
      supabase.from("avatar_items").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("avatar_bases").select("*").eq("is_active", true),
      supabase.from("profiles").select("sex").eq("id", user.id).maybeSingle(),
      supabase.from("user_avatar_inventory").select("item_id, is_favorite").eq("user_id", user.id),
      supabase.from("user_avatar_equipped").select("category_id, item_id").eq("user_id", user.id),
      supabase.from("user_coins").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("user_avatar_base")
        .select("base_id, skin_tone, color_selections")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const cats = (catsRes.data ?? []) as Category[];
    const its = (itemsRes.data ?? []) as Item[];
    const bs = (basesRes.data ?? []) as Base[];
    setCategories(cats);
    setItems(its);
    setBases(bs);
    if (cats.length && !activeCat) setActiveCat(cats[0].id);

    // Hydrate from saved avatar choice if present; otherwise fall back to
    // profile gender default. Onboarding (/avatar/criar) is opt-in for now.
    const saved = userBaseRes.data as
      | {
          base_id: string;
          skin_tone: string | null;
          color_selections: Partial<Record<AvatarLayerKey, string>> | null;
        }
      | null;
    const profileGender =
      (profileRes.data?.sex as string | undefined) === "f" ? "feminino" : "masculino";
    const matched =
      (saved && bs.find((b) => b.id === saved.base_id)) ??
      bs.find(
        (b) =>
          b.gender === profileGender &&
          b.body_type === "default" &&
          b.pose_key === "standing_default",
      ) ??
      bs.find((b) => b.gender === profileGender) ??
      bs[0] ??
      null;
    setBase(matched);
    setBodyType(matched?.body_type ?? "default");
    setPose((matched?.pose_key as AvatarPoseKey | undefined) ?? "standing_default");
    setSkinTone(saved?.skin_tone ?? matched?.skin_tone ?? "default");
    if (saved?.color_selections && typeof saved.color_selections === "object") {
      setColorSelections((current) => ({ ...current, ...saved.color_selections }));
    }
    // Libera os auto-saves só depois que a hidratação terminou.
    baseHydratedRef.current = true;

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
    // Apply preview: swap or insert the previewed item in its category
    const previewCatId = previewItem?.category_id;
    for (const cat of categories) {
      const it =
        previewCatId === cat.id ? previewItem : equippedItems.get(cat.id);
      if (it) list.push({ item: it, layer: cat.layer_index, slug: cat.slug });
    }
    list.sort((a, b) => a.layer - b.layer);
    return list;
  }, [categories, equippedItems, previewItem]);

  // Adapter: DB-shaped equipped items → generic renderer layers.
  const rendererLayers = useMemo<AvatarRendererLayer[]>(() => {
    return renderedLayers.map(({ item, slug }) => {
      const { layerKey, slot, zIndex } = layerForSlug(slug);
      // Itens do DB atual NÃO têm metadata de cor — caem em fixed_asset
      // (comportamento original). Quando a coluna `color_mode` existir,
      // basta ler dali; o renderer já trata os 4 modos.
      const presetId = colorSelections[layerKey];
      const colorPreset = getColorPreset(presetId);
      return {
        id: item.id,
        layerKey,
        imageUrl: item.image_url,
        slot,
        zIndex,
        alt: item.name,
        colorMode: "fixed_asset" as const,
        colorPreset: colorPreset ?? undefined,
      };
    });
  }, [renderedLayers, colorSelections]);

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
    setExpression("soft_smile");
    // Reset base back to default body + standing pose for current gender
    const g = base?.gender;
    if (g) {
      const def =
        bases.find(
          (b) => b.gender === g && b.body_type === "default" && b.pose_key === "standing_default",
        ) ?? null;
      if (def) {
        setBase(def);
        setBodyType("default");
        setPose("standing_default");
      }
    }
    if (!user) return;
    void supabase.from("user_avatar_equipped").delete().eq("user_id", user.id);
  }

  const handleEquip = useCallback(
    (item: { id: string }) => {
      const full = items.find((i) => i.id === item.id);
      if (full) void equipItem(full);
    },
    [items],
  );
  const handleToggleFav = useCallback(
    (item: { id: string }) => {
      const full = items.find((i) => i.id === item.id);
      if (full) void toggleFavorite(full);
    },
    [items],
  );
  const handlePreview = useCallback(
    (item: { id: string }) => {
      setPreviewItem((curr) => {
        if (curr?.id === item.id) return null;
        const full = items.find((i) => i.id === item.id);
        return full ?? null;
      });
    },
    [items],
  );
  const handleCategoryChange = useCallback((id: string) => {
    setActiveCat(id);
    setPreviewItem(null);
  }, []);

  const handleRemove = useCallback(
    (item: { id: string }) => {
      const full = items.find((i) => i.id === item.id);
      if (!full || !user) return;
      void (async () => {
        const { error } = await supabase
          .from("user_avatar_equipped")
          .delete()
          .eq("user_id", user.id)
          .eq("category_id", full.category_id);
        if (error) {
          toast.error("Erro ao remover item");
          return;
        }
        setEquipped((m) => {
          const n = new Map(m);
          n.delete(full.category_id);
          return n;
        });
        toast.success(`"${full.name}" removido`);
      })();
    },
    [items, user],
  );

  // --- Base swap helpers (Peso / Pose tabs) ---
  const currentGender = base?.gender ?? "masculino";

  function pickBaseFor(
    nextBodyType: string,
    nextPose: string,
    nextSkin: string = skinTone,
  ): Base | null {
    return (
      bases.find(
        (b) =>
          b.gender === currentGender &&
          b.body_type === nextBodyType &&
          b.pose_key === nextPose &&
          b.skin_tone === nextSkin,
      ) ??
      // Fallback: same combo, default skin (in case requested tone not generated yet)
      bases.find(
        (b) =>
          b.gender === currentGender &&
          b.body_type === nextBodyType &&
          b.pose_key === nextPose &&
          b.skin_tone === "default",
      ) ?? null
    );
  }

  function handleBodyType(nextBodyType: string) {
    // Poses only exist for the default body. If switching away from default,
    // collapse the pose back to standing_default.
    const targetPose = nextBodyType === "default" ? pose : "standing_default";
    const next = pickBaseFor(nextBodyType, targetPose, skinTone);
    if (!next) {
      toast.error("Variação indisponível.");
      return;
    }
    setBase(next);
    setBodyType(nextBodyType);
    setPose(targetPose as AvatarPoseKey);
    setSkinTone(next.skin_tone ?? "default");
  }

  function handlePose(nextPose: string) {
    // Poses only seeded for the default body; force default body when picking a pose.
    const next = pickBaseFor("default", nextPose, skinTone);
    if (!next) {
      toast.error("Pose indisponível.");
      return;
    }
    setBase(next);
    setBodyType("default");
    setPose(nextPose as AvatarPoseKey);
    setSkinTone(next.skin_tone ?? "default");
  }

  function handleSkinTone(nextSkin: string) {
    const next = pickBaseFor(bodyType, pose, nextSkin);
    if (!next) {
      toast.error("Tom de pele indisponível para esta combinação.");
      return;
    }
    setBase(next);
    setBodyType(next.body_type);
    setPose(next.pose_key as AvatarPoseKey);
    setSkinTone(next.skin_tone ?? nextSkin);
  }

  const weightOptions: AvatarBaseOption[] = useMemo(
    () =>
      BODY_TYPE_ORDER.map((bt) => {
        const row =
          bases.find(
            (b) =>
              b.gender === currentGender &&
              b.body_type === bt &&
              b.pose_key === "standing_default" &&
              b.skin_tone === skinTone,
          ) ??
          bases.find(
            (b) =>
              b.gender === currentGender &&
              b.body_type === bt &&
              b.pose_key === "standing_default" &&
              b.skin_tone === "default",
          );
        if (!row) return null;
        return {
          id: row.id,
          name: row.name,
          image_url: row.image_url,
          key: bt,
          label: BODY_TYPE_LABELS[bt] ?? bt,
        };
      }).filter(Boolean) as AvatarBaseOption[],
    [bases, currentGender, skinTone],
  );

  const poseOptions: AvatarBaseOption[] = useMemo(
    () =>
      POSE_ORDER.map((pk) => {
        const row = bases.find(
          (b) =>
            b.gender === currentGender &&
            b.body_type === "default" &&
            b.pose_key === pk &&
            b.skin_tone === skinTone,
        ) ?? bases.find(
          (b) =>
            b.gender === currentGender &&
            b.body_type === "default" &&
            b.pose_key === pk &&
            b.skin_tone === "default",
        );
        if (!row) return null;
        return {
          id: row.id,
          name: row.name,
          image_url: row.image_url,
          key: pk,
          label: POSE_LABELS[pk] ?? pk,
        };
      }).filter(Boolean) as AvatarBaseOption[],
    [bases, currentGender, skinTone],
  );

  const skinOptions: AvatarBaseOption[] = useMemo(
    () =>
      SKIN_ORDER.map((tone) => {
        const row =
          bases.find(
            (b) =>
              b.gender === currentGender &&
              b.body_type === "default" &&
              b.pose_key === "standing_default" &&
              b.skin_tone === tone,
          ) ?? null;
        // Show the swatch even if no asset yet, so the user sees the full palette.
        return {
          id: row?.id ?? `tone-${tone}`,
          name: SKIN_LABELS[tone] ?? tone,
          image_url: row?.image_url ?? "",
          key: tone,
          label: SKIN_LABELS[tone] ?? tone,
          swatch: SKIN_SWATCH[tone],
          disabled: !row,
        } as AvatarBaseOption;
      }),
    [bases, currentGender],
  );

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
      <AvatarHeader coins={coins} />

      <div className="mx-auto mt-2 flex w-full max-w-md items-center justify-between gap-2 rounded-full border border-dashed border-amber-400 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900">
        <span>
          Modo teste · Gênero: <strong>{currentGender === "feminino" ? "Feminino" : "Masculino"}</strong>
        </span>
        <button
          type="button"
          onClick={toggleGender}
          className="rounded-full border border-amber-500 bg-white px-3 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
        >
          Trocar para {currentGender === "feminino" ? "Masculino" : "Feminino"}
        </button>
      </div>

      <AvatarCategoryTabs
        categories={[
          { id: WEIGHT_TAB_ID, name: "Peso", icon: "dumbbell" },
          { id: POSE_TAB_ID, name: "Pose", icon: "pose" },
          { id: SKIN_TAB_ID, name: "Pele", icon: "palette" },
          ...categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
        ]}
        activeId={activeCat}
        onChange={handleCategoryChange}
      />

      <AvatarStage
        baseUrl={base?.image_url ?? null}
        baseAlt={base?.name ?? "Avatar"}
        layers={rendererLayers}
        pose={pose}
        expression={expression}
        onShuffle={shuffleLook}
        onReset={resetLook}
        onOpenPoseExpression={() => setPoseSheetOpen((v) => !v)}
        onOpenDetails={() => setDetailsOpen((v) => !v)}
        onSaveLook={saveLook}
      />

      {poseSheetOpen && (
        <div className="mx-auto mt-3 w-full max-w-md rounded-2xl border border-border bg-white p-4 shadow-sm sm:px-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Pose</h3>
          <AvatarPoseSelector value={pose} onChange={setPose} />
          <h3 className="mb-2 mt-4 text-sm font-semibold text-foreground">Expressão</h3>
          <AvatarExpressionSelector value={expression} onChange={setExpression} />
          <div className="mt-4 space-y-3">
            <AvatarColorPicker
              category="hair"
              title="Cor do cabelo"
              value={colorSelections.hairFront ?? null}
              onChange={(id) =>
                setColorSelections((s) => ({ ...s, hairFront: id }))
              }
            />
            <AvatarColorPicker
              category="clothing"
              title="Cor da roupa básica"
              value={colorSelections.top ?? null}
              onChange={(id) => setColorSelections((s) => ({ ...s, top: id }))}
            />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Pose, expressão e cores são locais por enquanto. As cores só
            afetam itens marcados como recoloríveis (`tintable`/`mask_tint`)
            — itens fixos do catálogo atual ignoram a seleção.
          </p>
        </div>
      )}

      {detailsOpen && (
        <div className="mx-auto mt-3 w-full max-w-md rounded-2xl border border-border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Detalhes do visual</h3>
          {renderedLayers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum item equipado.</p>
          ) : (
            <ul className="space-y-1 text-xs text-foreground">
              {renderedLayers.map(({ item }) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{item.name}</span>
                  {item.is_premium && <Crown className="h-3 w-3 text-amber-500" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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

      {previewItem && (
        <div className="mx-auto mt-3 flex w-full max-w-md items-center justify-between gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs shadow-sm">
          <span className="truncate text-foreground">
            Pré-visualizando: <strong>{previewItem.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => setPreviewItem(null)}
            className="rounded-full border border-border px-3 py-1 text-[11px] font-medium text-foreground"
          >
            Sair
          </button>
        </div>
      )}

      {activeCat === WEIGHT_TAB_ID ? (
        <AvatarBaseSelector
          title="Peso & corpo"
          description="Todas as variações são gratuitas e substituem o avatar."
          options={weightOptions}
          activeKey={bodyType}
          onPick={(opt) => handleBodyType(opt.key)}
          emptyHint="Variações ainda não cadastradas para este gênero."
        />
      ) : activeCat === POSE_TAB_ID ? (
        <AvatarBaseSelector
          title="Pose"
          description="Trocar de pose volta o corpo para o padrão."
          options={poseOptions}
          activeKey={pose}
          onPick={(opt) => handlePose(opt.key)}
          emptyHint="Poses ainda não cadastradas para este gênero."
        />
      ) : activeCat === SKIN_TAB_ID ? (
        <AvatarBaseSelector
          title="Tom de pele"
          description="Aplica o tom escolhido ao corpo e pose atuais. Tons sem arte ainda voltam ao padrão."
          options={skinOptions}
          activeKey={skinTone}
          onPick={(opt) => handleSkinTone(opt.key)}
          emptyHint="Tons ainda não cadastrados."
        />
      ) : (
        <AvatarShopSheet
          tab={tab}
          onTabChange={setTab}
          loading={loading}
          items={itemsForCat}
          equippedByCategory={equipped}
          inventory={inventory}
          favorites={favorites}
          coins={coins}
          onEquip={handleEquip}
          onToggleFavorite={handleToggleFav}
          onPreview={handlePreview}
          previewItemId={previewItem?.id ?? null}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
