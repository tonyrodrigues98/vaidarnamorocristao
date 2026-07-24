import { supabase } from "@/integrations/supabase/client";
import { normalizeImageFile } from "@/lib/imageNormalize";
import { verifyProfilePhoto } from "@/lib/verifyPhoto";
import {
  COMMUNITY_HOME_QUERY_BUDGET,
  isCommunityAudience,
  parseCommunityCursor,
  sanitizeCommunityAudience,
  sanitizeCommunityBody,
  type CommunityAudience,
  type CommunityDailyItem,
  type CommunityFeedCursor,
  type CommunityHomeRepository,
  type CommunityHomeSnapshot,
  type CommunityPerson,
  type CommunityPostItem,
  type CommunityRelationshipSummary,
  type CommunityStatusItem,
  type SocialRelationshipState,
} from "./contracts";

const SAFE_ERROR = "Não foi possível carregar a comunidade agora. Tente novamente.";
const STATUS_BUCKET = "community-status-media";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function repositoryError(context: string): Error {
  if (import.meta.env.DEV) {
    console.warn(`[v2-community] ${context}`, { failed: true });
  }
  return new Error(SAFE_ERROR);
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw repositoryError(name);
  return data as T;
}

function parseAuthor(row: JsonRecord) {
  return {
    id: asString(row.author_id),
    name: asString(row.author_name, "Pessoa da comunidade"),
    photoUrl: asNullableString(row.author_photo_url),
  } as const;
}

function parsePost(value: unknown): CommunityPostItem | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const body = asString(value.body);
  const createdAt = asString(value.created_at);
  if (!id || !body || Number.isNaN(Date.parse(createdAt))) return null;
  return {
    id,
    author: parseAuthor(value),
    body,
    audience: sanitizeCommunityAudience(value.audience),
    createdAt,
    reactionCount: asCount(value.reaction_count),
    commentCount: asCount(value.comment_count),
    viewerReacted: value.viewer_reacted === true,
    rankReason: "recent",
  };
}

function parseStatus(value: unknown): CommunityStatusItem | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const createdAt = asString(value.created_at);
  const expiresAt = asString(value.expires_at);
  if (!id || Number.isNaN(Date.parse(createdAt)) || Number.isNaN(Date.parse(expiresAt))) {
    return null;
  }
  return {
    id,
    author: parseAuthor(value),
    caption: asNullableString(value.caption),
    mediaPath: asNullableString(value.media_path),
    mediaUrl: null,
    audience: sanitizeCommunityAudience(value.audience, "connections"),
    createdAt,
    expiresAt,
    viewed: value.viewed === true,
  };
}

function parseDaily(value: unknown): CommunityDailyItem | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const title = asString(value.title);
  const content = asString(value.content);
  const publishedAt = asString(value.published_at);
  if (!id || !title || Number.isNaN(Date.parse(publishedAt))) return null;
  return {
    id,
    title,
    content,
    bibleReference: asNullableString(value.bible_reference),
    publishedAt,
    kind: value.kind === "devotional" ? "devotional" : "news",
  };
}

function parseRelationshipState(value: unknown): SocialRelationshipState {
  switch (value) {
    case "following":
    case "request_sent":
    case "connected":
      return value;
    default:
      return "none";
  }
}

function parsePerson(value: unknown): CommunityPerson | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (!id) return null;
  return {
    id,
    name: asString(value.full_name, "Pessoa da comunidade"),
    photoUrl: asNullableString(value.photo_url),
    city: asNullableString(value.city),
    state: asNullableString(value.state),
    church: asNullableString(value.church),
    relationshipState: parseRelationshipState(value.relationship_state),
  };
}

function parseSummary(value: unknown): CommunityRelationshipSummary {
  const row = isRecord(value) ? value : {};
  return {
    connections: asCount(row.connections),
    following: asCount(row.following),
    pending: asCount(row.pending),
  };
}

async function signStatusMedia(
  statuses: readonly CommunityStatusItem[],
): Promise<readonly CommunityStatusItem[]> {
  const paths = statuses.flatMap((status) => (status.mediaPath ? [status.mediaPath] : []));
  if (paths.length === 0) return statuses;
  const { data, error } = await supabase.storage
    .from(STATUS_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  if (error) throw repositoryError("sign_status_media");
  const signedByPath = new Map(
    (data ?? []).flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [],
    ),
  );
  return statuses.map((status) => ({
    ...status,
    mediaUrl: status.mediaPath ? (signedByPath.get(status.mediaPath) ?? null) : null,
  }));
}

function parseHomePayload(value: unknown): Omit<CommunityHomeSnapshot, "statuses"> & {
  statuses: readonly CommunityStatusItem[];
} {
  const payload = isRecord(value) ? value : {};
  const posts = asArray(payload.posts).map(parsePost).filter(Boolean) as CommunityPostItem[];
  const statuses = asArray(payload.statuses)
    .map(parseStatus)
    .filter(Boolean) as CommunityStatusItem[];
  const daily = asArray(payload.daily).map(parseDaily).filter(Boolean) as CommunityDailyItem[];
  const suggestions = asArray(payload.suggestions)
    .map(parsePerson)
    .filter(Boolean) as CommunityPerson[];
  return {
    posts,
    statuses,
    daily,
    suggestions,
    relationshipSummary: parseSummary(payload.relationshipSummary),
    hasMorePosts: payload.hasMorePosts === true,
    nextCursor: parseCommunityCursor(payload.nextCursor),
  };
}

export const supabaseCommunityHomeRepository: CommunityHomeRepository = {
  async loadHome(_userId, cursor) {
    const payload = await rpc<unknown>("get_community_home_v2", {
      _cursor_created_at: cursor?.createdAt ?? null,
      _cursor_id: cursor?.id ?? null,
      _limit: COMMUNITY_HOME_QUERY_BUDGET.pageSize,
    });
    const parsed = parseHomePayload(payload);
    return {
      ...parsed,
      statuses: await signStatusMedia(parsed.statuses),
    };
  },

  async loadPeople(_userId) {
    const payload = await rpc<unknown>("list_community_people_v2", { _limit: 40 });
    return asArray(payload).map(parsePerson).filter(Boolean) as CommunityPerson[];
  },

  async publishPost(_userId, body, audience) {
    const cleanBody = sanitizeCommunityBody(body, 3000);
    if (!cleanBody) throw new Error("Escreva algo antes de publicar.");
    await rpc("publish_community_post", {
      _body: cleanBody,
      _audience: sanitizeCommunityAudience(audience),
    });
  },

  async toggleReaction(_userId, postId) {
    return rpc<boolean>("toggle_community_post_reaction", {
      _post_id: postId,
      _reaction: "amen",
    });
  },

  async publishStatus(_userId, input) {
    const caption = sanitizeCommunityBody(input.caption, 500);
    const file = input.file ?? null;
    let normalized: File | null = null;
    if (file) {
      normalized = await normalizeImageFile(file);
      const verdict = await verifyProfilePhoto(normalized, "extra");
      if (!verdict.ok) throw new Error(verdict.reason);
      if (!verdict.approved) {
        throw new Error("A imagem precisa de revisão antes de poder ser publicada no Status.");
      }
    }
    if (!caption && !normalized) throw new Error("Adicione um texto ou uma imagem ao Status.");

    const status = await rpc<{ id?: string }>("publish_community_status", {
      _caption: caption,
      _audience: sanitizeCommunityAudience(input.audience, "connections"),
      _has_media: !!normalized,
    });
    const statusId = asString(status?.id);
    if (!normalized || !statusId) return;

    const extension = normalized.type === "image/png" ? "png" : "jpg";
    const path = `${_userId}/${statusId}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(STATUS_BUCKET)
      .upload(path, normalized, {
        upsert: false,
        contentType: normalized.type || "image/jpeg",
        cacheControl: "3600",
      });
    if (uploadError) {
      await rpc("delete_community_status", { _status_id: statusId }).catch(() => false);
      throw repositoryError("upload_status_media");
    }

    try {
      await rpc("attach_community_status_media", {
        _status_id: statusId,
        _media_path: path,
      });
    } catch {
      await supabase.storage.from(STATUS_BUCKET).remove([path]);
      await rpc("delete_community_status", { _status_id: statusId }).catch(() => false);
      throw repositoryError("attach_status_media");
    }
  },

  async deleteStatus(_userId, statusId) {
    return rpc<boolean>("delete_community_status", { _status_id: statusId });
  },

  async recordStatusView(_userId, statusId) {
    return rpc<boolean>("record_community_status_view", { _status_id: statusId });
  },

  async requestRelationship(_userId, targetUserId, kind) {
    const result = await rpc<{ status?: string; kind?: string }>("request_social_relationship", {
      _target_user_id: targetUserId,
      _kind: kind,
    });
    if (result.kind === "connection") {
      return result.status === "active" ? "connected" : "request_sent";
    }
    return "following";
  },
};

export const communityRepositoryBoundaries = Object.freeze({
  maximumHomeQueries: COMMUNITY_HOME_QUERY_BUDGET.total,
  importsBackendOnlyHere: true,
  statusBucket: STATUS_BUCKET,
  usesMatches: false,
  usesDatingPreferences: false,
});

export { parseHomePayload, parsePerson };
