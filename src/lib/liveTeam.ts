import { supabase } from "@/integrations/supabase/client";

export const LIVE_TEAM_BUCKET = "live-team";

export const LIVE_TEAM_CATEGORIES = ["host", "administradores", "moderadores", "midia"] as const;

export type LiveTeamCategory = (typeof LIVE_TEAM_CATEGORIES)[number];

export type LiveTeamMember = {
  id: string;
  name: string;
  role_title: string;
  category: LiveTeamCategory;
  chip_text: string | null;
  tiktok_url: string | null;
  photo_url: string;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LiveTeamPayload = {
  name: string;
  role_title: string;
  category: LiveTeamCategory;
  chip_text?: string | null;
  tiktok_url?: string | null;
  photo_url: string;
  storage_path?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export const LIVE_TEAM_CATEGORY_LABELS: Record<LiveTeamCategory, string> = {
  host: "Host",
  administradores: "Administradores",
  moderadores: "Moderadores",
  midia: "Mídia",
};

function normalizeTikTokUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("@")) return `https://www.tiktok.com/${trimmed}`;
  return `https://www.tiktok.com/@${trimmed.replace(/^@/, "")}`;
}

export function prepareLiveTeamPayload(payload: LiveTeamPayload) {
  return {
    name: payload.name.trim(),
    role_title: payload.role_title.trim(),
    category: payload.category,
    chip_text: payload.chip_text?.trim() || null,
    tiktok_url: normalizeTikTokUrl(payload.tiktok_url),
    photo_url: payload.photo_url.trim(),
    storage_path: payload.storage_path ?? null,
    sort_order: payload.sort_order ?? 0,
    is_active: payload.is_active ?? true,
  };
}

export async function fetchActiveLiveTeamMembers(): Promise<LiveTeamMember[]> {
  const { data, error } = await supabase
    .from("live_team_members" as never)
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as LiveTeamMember[];
}

export async function fetchAllLiveTeamMembersAdmin(): Promise<LiveTeamMember[]> {
  const { data, error } = await supabase
    .from("live_team_members" as never)
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as LiveTeamMember[];
}

export async function createLiveTeamMember(payload: LiveTeamPayload): Promise<LiveTeamMember> {
  const { data, error } = await supabase
    .from("live_team_members" as never)
    .insert(prepareLiveTeamPayload(payload) as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LiveTeamMember;
}

export async function updateLiveTeamMember(
  id: string,
  payload: Partial<LiveTeamPayload>,
): Promise<LiveTeamMember> {
  const patch = {
    ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    ...(payload.role_title !== undefined ? { role_title: payload.role_title.trim() } : {}),
    ...(payload.category !== undefined ? { category: payload.category } : {}),
    ...(payload.chip_text !== undefined ? { chip_text: payload.chip_text?.trim() || null } : {}),
    ...(payload.tiktok_url !== undefined
      ? { tiktok_url: normalizeTikTokUrl(payload.tiktok_url) }
      : {}),
    ...(payload.photo_url !== undefined ? { photo_url: payload.photo_url.trim() } : {}),
    ...(payload.storage_path !== undefined ? { storage_path: payload.storage_path ?? null } : {}),
    ...(payload.sort_order !== undefined ? { sort_order: payload.sort_order } : {}),
    ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
  };

  const { data, error } = await supabase
    .from("live_team_members" as never)
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LiveTeamMember;
}

export async function deleteLiveTeamMember(member: LiveTeamMember): Promise<void> {
  if (member.storage_path) {
    await supabase.storage
      .from(LIVE_TEAM_BUCKET)
      .remove([member.storage_path])
      .catch(() => {});
  }

  const { error } = await supabase
    .from("live_team_members" as never)
    .delete()
    .eq("id", member.id);

  if (error) throw error;
}

export async function reorderLiveTeamMembers(
  updates: Array<Pick<LiveTeamMember, "id" | "sort_order">>,
) {
  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from("live_team_members" as never)
        .update({ sort_order } as never)
        .eq("id", id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export function getLiveTeamUploadPath(file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${crypto.randomUUID()}.${ext || "jpg"}`;
}
