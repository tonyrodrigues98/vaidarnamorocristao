import { supabase } from "@/integrations/supabase/client";
import { normalizeTikTokProfileUrl } from "@/lib/trustedContent";

export const LIVE_TEAM_BUCKET = "live-team";

export const LIVE_TEAM_CATEGORIES = ["host", "administradores", "moderadores", "midia"] as const;
export const LIVE_HIGHLIGHT_TYPES = ["viewer", "gifter"] as const;

export type LiveTeamCategory = (typeof LIVE_TEAM_CATEGORIES)[number];
export type LiveHighlightType = (typeof LIVE_HIGHLIGHT_TYPES)[number];

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

const SIGNED_IMAGE_TTL_SECONDS = 60 * 60;

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

export type LiveMonthlyHighlight = {
  id: string;
  ranking_type: LiveHighlightType;
  position: 1 | 2 | 3;
  name: string;
  photo_url: string | null;
  storage_path: string | null;
  chip_text: string | null;
  tiktok_url: string | null;
  month: number;
  year: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LiveMonthlyHighlightPayload = {
  ranking_type: LiveHighlightType;
  position: 1 | 2 | 3;
  name: string;
  photo_url?: string | null;
  storage_path?: string | null;
  chip_text?: string | null;
  tiktok_url?: string | null;
  month?: number;
  year?: number;
  is_active?: boolean;
};

export const LIVE_TEAM_CATEGORY_LABELS: Record<LiveTeamCategory, string> = {
  host: "Host",
  administradores: "Administradores",
  moderadores: "Moderadores",
  midia: "Mídia",
};

export const LIVE_HIGHLIGHT_TYPE_LABELS: Record<LiveHighlightType, string> = {
  viewer: "Telespectadores",
  gifter: "Presenteadores",
};

export function getCurrentHighlightPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

async function withDisplayUrls(members: LiveTeamMember[]) {
  return Promise.all(
    members.map(async (member) => {
      const safeMember = {
        ...member,
        tiktok_url: normalizeTikTokProfileUrl(member.tiktok_url),
      };
      if (!member.storage_path) return safeMember;
      const { data } = await supabase.storage
        .from(LIVE_TEAM_BUCKET)
        .createSignedUrl(member.storage_path, SIGNED_IMAGE_TTL_SECONDS);
      return data?.signedUrl ? { ...safeMember, photo_url: data.signedUrl } : safeMember;
    }),
  );
}

async function withHighlightDisplayUrls(items: LiveMonthlyHighlight[]) {
  return Promise.all(
    items.map(async (item) => {
      const safeItem = {
        ...item,
        tiktok_url: normalizeTikTokProfileUrl(item.tiktok_url),
      };
      if (!item.storage_path) return safeItem;
      const { data } = await supabase.storage
        .from(LIVE_TEAM_BUCKET)
        .createSignedUrl(item.storage_path, SIGNED_IMAGE_TTL_SECONDS);
      return data?.signedUrl ? { ...safeItem, photo_url: data.signedUrl } : safeItem;
    }),
  );
}

export function prepareLiveTeamPayload(payload: LiveTeamPayload) {
  return {
    name: payload.name.trim(),
    role_title: payload.role_title.trim(),
    category: payload.category,
    chip_text: payload.chip_text?.trim() || null,
    tiktok_url: normalizeTikTokProfileUrl(payload.tiktok_url),
    photo_url: payload.photo_url.trim(),
    storage_path: payload.storage_path ?? null,
    sort_order: payload.sort_order ?? 0,
    is_active: payload.is_active ?? true,
  };
}

export function prepareLiveMonthlyHighlightPayload(payload: LiveMonthlyHighlightPayload) {
  const current = getCurrentHighlightPeriod();
  return {
    ranking_type: payload.ranking_type,
    position: payload.position,
    name: payload.name.trim(),
    photo_url: payload.photo_url?.trim() || null,
    storage_path: payload.storage_path ?? null,
    chip_text: payload.chip_text?.trim() || null,
    tiktok_url: normalizeTikTokProfileUrl(payload.tiktok_url),
    month: payload.month ?? current.month,
    year: payload.year ?? current.year,
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
  return withDisplayUrls((data ?? []) as unknown as LiveTeamMember[]);
}

export async function fetchActiveMonthlyHighlights(): Promise<LiveMonthlyHighlight[]> {
  const current = getCurrentHighlightPeriod();
  const { data, error } = await supabase
    .from("live_monthly_highlights" as never)
    .select("*")
    .eq("is_active", true)
    .eq("month", current.month)
    .eq("year", current.year)
    .order("ranking_type", { ascending: true })
    .order("position", { ascending: true });

  if (error) throw error;
  return withHighlightDisplayUrls((data ?? []) as unknown as LiveMonthlyHighlight[]);
}

export async function fetchAllLiveTeamMembersAdmin(): Promise<LiveTeamMember[]> {
  const { data, error } = await supabase
    .from("live_team_members" as never)
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return withDisplayUrls((data ?? []) as unknown as LiveTeamMember[]);
}

export async function fetchAllMonthlyHighlightsAdmin(): Promise<LiveMonthlyHighlight[]> {
  const { data, error } = await supabase
    .from("live_monthly_highlights" as never)
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("ranking_type", { ascending: true })
    .order("position", { ascending: true });

  if (error) throw error;
  return withHighlightDisplayUrls((data ?? []) as unknown as LiveMonthlyHighlight[]);
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

export async function createMonthlyHighlight(
  payload: LiveMonthlyHighlightPayload,
): Promise<LiveMonthlyHighlight> {
  const { data, error } = await supabase
    .from("live_monthly_highlights" as never)
    .insert(prepareLiveMonthlyHighlightPayload(payload) as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LiveMonthlyHighlight;
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
      ? { tiktok_url: normalizeTikTokProfileUrl(payload.tiktok_url) }
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

export async function updateMonthlyHighlight(
  id: string,
  payload: Partial<LiveMonthlyHighlightPayload>,
): Promise<LiveMonthlyHighlight> {
  const patch = {
    ...(payload.ranking_type !== undefined ? { ranking_type: payload.ranking_type } : {}),
    ...(payload.position !== undefined ? { position: payload.position } : {}),
    ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    ...(payload.photo_url !== undefined ? { photo_url: payload.photo_url?.trim() || null } : {}),
    ...(payload.storage_path !== undefined ? { storage_path: payload.storage_path ?? null } : {}),
    ...(payload.chip_text !== undefined ? { chip_text: payload.chip_text?.trim() || null } : {}),
    ...(payload.tiktok_url !== undefined
      ? { tiktok_url: normalizeTikTokProfileUrl(payload.tiktok_url) }
      : {}),
    ...(payload.month !== undefined ? { month: payload.month } : {}),
    ...(payload.year !== undefined ? { year: payload.year } : {}),
    ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
  };

  const { data, error } = await supabase
    .from("live_monthly_highlights" as never)
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as LiveMonthlyHighlight;
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

export async function deleteMonthlyHighlight(highlight: LiveMonthlyHighlight): Promise<void> {
  if (highlight.storage_path) {
    await supabase.storage
      .from(LIVE_TEAM_BUCKET)
      .remove([highlight.storage_path])
      .catch(() => {});
  }

  const { error } = await supabase
    .from("live_monthly_highlights" as never)
    .delete()
    .eq("id", highlight.id);

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
