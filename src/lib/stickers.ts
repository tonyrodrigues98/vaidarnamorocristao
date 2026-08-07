import { supabase } from "@/integrations/supabase/client";

export type StickerCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Sticker = {
  id: string;
  category_id: string | null;
  name: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  is_animated: boolean;
  active: boolean;
  sort_order: number;
};

export async function fetchCategories(): Promise<StickerCategory[]> {
  const { data, error } = await supabase
    .from("sticker_categories")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StickerCategory[];
}

export async function fetchStickers(opts?: {
  activeOnly?: boolean;
  categoryId?: string | null;
}): Promise<Sticker[]> {
  let q = supabase
    .from("stickers")
    .select(
      "id, category_id, name, storage_path, public_url, mime_type, is_animated, active, sort_order",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (opts?.activeOnly) q = q.eq("active", true);
  if (opts?.categoryId !== undefined && opts?.categoryId !== null)
    q = q.eq("category_id", opts.categoryId);
  const { data, error } = await q;
  if (error) throw error;
  // Always re-derive public_url from storage_path so stale or missing
  // URLs don't silently break thumbnails in the picker.
  const rows = (data ?? []) as Sticker[];
  return rows.map((s) => {
    if (!s.storage_path) return s;
    const { data: pub } = supabase.storage.from("stickers").getPublicUrl(s.storage_path);
    return { ...s, public_url: pub?.publicUrl ?? s.public_url };
  });
}

export async function uploadStickerFile(
  file: File,
  categoryId: string | null,
  name: string,
): Promise<Sticker> {
  const ext = (file.name.split(".").pop() || "webp").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("stickers").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("stickers").getPublicUrl(path);
  const isAnimated = file.type === "image/webp" || file.type === "image/gif";
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("stickers")
    .insert({
      category_id: categoryId,
      name: name || file.name.replace(/\.[^.]+$/, ""),
      storage_path: path,
      public_url: pub.publicUrl,
      mime_type: file.type || `image/${ext}`,
      is_animated: isAnimated,
      active: true,
      created_by: user.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Sticker;
}

export async function deleteSticker(s: Sticker): Promise<void> {
  await supabase.storage
    .from("stickers")
    .remove([s.storage_path])
    .catch(() => {});
  const { error } = await supabase.from("stickers").delete().eq("id", s.id);
  if (error) throw error;
}
