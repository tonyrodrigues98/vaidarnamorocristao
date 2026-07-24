import { supabase } from "@/integrations/supabase/client";
import {
  isProfileAudience,
  isProfileModuleType,
  normalizeProfileModules,
  type ProfileAppearance,
  type ProfileGalleryItem,
  type ProfileHighlight,
  type ProfileIdentity,
  type ProfileModule,
  type ProfileModuleData,
  type ProfileRepository,
  type ProfileSnapshot,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar o perfil agora.";

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function safeProfileMediaUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeColor(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}

function parseHighlights(value: unknown): readonly ProfileHighlight[] {
  return asArray(value)
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = asString(item.id);
      const title = asString(item.title);
      if (!id || !title) return null;
      return {
        id,
        title,
        description: asString(item.description),
        imageUrl: safeProfileMediaUrl(item.image_url),
      };
    })
    .filter(Boolean) as ProfileHighlight[];
}

function parseGallery(value: unknown): readonly ProfileGalleryItem[] {
  return asArray(value)
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = asString(item.id);
      const url = safeProfileMediaUrl(item.url);
      if (!id || !url) return null;
      return { id, url, category: asNullableString(item.category) };
    })
    .filter(Boolean) as ProfileGalleryItem[];
}

function parseModuleData(value: unknown): ProfileModuleData {
  const data = isRecord(value) ? value : {};
  return {
    text: asNullableString(data.text) ?? undefined,
    items: parseHighlights(data.items),
    gallery: parseGallery(data.gallery),
  };
}

function parseModules(value: unknown): readonly ProfileModule[] {
  const modules = asArray(value)
    .map((item) => {
      if (!isRecord(item) || !isProfileModuleType(item.module_type)) return null;
      return {
        type: item.module_type,
        order: typeof item.sort_order === "number" ? item.sort_order : 0,
        visible: item.visible !== false,
        audience: isProfileAudience(item.audience) ? item.audience : "community",
        data: parseModuleData(item.data),
      };
    })
    .filter(Boolean) as ProfileModule[];
  return normalizeProfileModules(modules);
}

export function parseProfileSnapshot(value: unknown): ProfileSnapshot {
  const payload = isRecord(value) ? value : {};
  const identitySource = isRecord(payload.identity) ? payload.identity : {};
  const appearanceSource = isRecord(payload.appearance) ? payload.appearance : {};
  const first = safeColor(appearanceSource.name_color_a);
  const second = safeColor(appearanceSource.name_color_b);
  const identity: ProfileIdentity = {
    displayName: asString(identitySource.display_name, "Pessoa da comunidade"),
    photoUrl: safeProfileMediaUrl(identitySource.photo_url),
    bio: asString(identitySource.bio),
    city: asNullableString(identitySource.city),
    state: asNullableString(identitySource.state),
    church: asNullableString(identitySource.church),
    yearsBaptized:
      typeof identitySource.years_baptized === "number"
        ? Math.max(0, identitySource.years_baptized)
        : null,
    verified: identitySource.verified === true,
    presence:
      identitySource.presence === "online" || identitySource.presence === "recently"
        ? identitySource.presence
        : "offline",
  };
  const appearance: ProfileAppearance = {
    backgroundUrl: safeProfileMediaUrl(appearanceSource.background_url),
    frameUrl: safeProfileMediaUrl(appearanceSource.frame_url),
    auraUrl: safeProfileMediaUrl(appearanceSource.aura_url),
    nameGradient: first && second ? [first, second] : null,
  };
  return {
    identity,
    appearance,
    modules: parseModules(payload.modules),
    owner: payload.owner === true,
    configurationUpdatedAt: asNullableString(payload.configuration_updated_at),
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabaseProfileRepository: ProfileRepository = {
  async loadProfile(_viewerUserId, profileUserId) {
    return parseProfileSnapshot(
      await rpc("get_community_profile_v2", { _profile_user_id: profileUserId }),
    );
  },

  async saveModules(_userId, modules, expectedUpdatedAt) {
    const result = await rpc<unknown>("save_profile_modules_v2", {
      _expected_updated_at: expectedUpdatedAt,
      _modules: normalizeProfileModules(modules).map((module) => ({
        module_type: module.type,
        sort_order: module.order,
        visible: module.visible,
        audience: module.audience,
      })),
    });
    if (!isRecord(result) || typeof result.updated_at !== "string") {
      throw new Error(SAFE_ERROR);
    }
    return result.updated_at;
  },
};

export const profileRepositoryBoundaries = Object.freeze({
  presentationReceivesSession: false,
  inventoryRemainsAuthoritative: true,
  romanticFieldsInCommunityPayload: false,
  appliesPrivacyServerSide: true,
});
