import { supabase } from "@/integrations/supabase/client";
import {
  isCommunityMembershipState,
  isCommunitySpaceVisibility,
  sanitizeCommunityMessage,
  type CommunityChatMessage,
  type CommunityEventSummary,
  type CommunityHubRepository,
  type CommunityHubSnapshot,
  type CommunityMembershipState,
  type CommunityPresenceSummary,
  type CommunitySpaceRole,
  type CommunitySpaceSummary,
} from "./contracts";

type JsonRecord = Record<string, unknown>;

const SAFE_ERROR = "Não foi possível carregar a Comunidade agora. Tente novamente.";

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

function safeError(context: string): Error {
  if (import.meta.env.DEV) console.warn(`[v2-community-hub] ${context}`, { failed: true });
  return new Error(SAFE_ERROR);
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw safeError(name);
  return data as T;
}

function parseRole(value: unknown): CommunitySpaceRole | null {
  return value === "owner" || value === "moderator" || value === "member" ? value : null;
}

function parseMembership(value: unknown): CommunityMembershipState {
  return isCommunityMembershipState(value) ? value : "none";
}

function parseSpace(value: unknown): CommunitySpaceSummary | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const slug = asString(value.slug);
  const name = asString(value.name);
  if (!id || !slug || !name) return null;
  return {
    id,
    slug,
    name,
    description: asString(value.description),
    visibility: isCommunitySpaceVisibility(value.visibility) ? value.visibility : "public",
    memberCount: asCount(value.member_count),
    membershipState: parseMembership(value.membership_state),
    role: parseRole(value.member_role),
  };
}

function parseEvent(value: unknown): CommunityEventSummary | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const startsAt = asString(value.starts_at);
  const title = asString(value.title);
  if (!id || !title || Number.isNaN(Date.parse(startsAt))) return null;
  const status =
    value.status === "cancelled" || value.status === "completed" ? value.status : "scheduled";
  return {
    id,
    spaceId: asNullableString(value.space_id),
    title,
    description: asString(value.description),
    startsAt,
    endsAt: asNullableString(value.ends_at),
    timezone: asString(value.timezone, "UTC"),
    capacity: typeof value.capacity === "number" ? Math.max(1, value.capacity) : null,
    participantCount: asCount(value.participant_count),
    attending: value.attending === true,
    status,
  };
}

function parseMessage(value: unknown): CommunityChatMessage | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const content = asString(value.content);
  const createdAt = asString(value.created_at);
  if (!id || !content || Number.isNaN(Date.parse(createdAt))) return null;
  return {
    id,
    senderId: asString(value.sender_id),
    senderName: asString(value.sender_name, "Pessoa da comunidade"),
    senderPhotoUrl: asNullableString(value.sender_photo_url),
    content,
    createdAt,
    pinned: typeof value.pinned_at === "string",
  };
}

function parsePresence(value: unknown): CommunityPresenceSummary | null {
  if (!isRecord(value)) return null;
  const userId = asString(value.user_id);
  if (!userId) return null;
  return {
    userId,
    name: asString(value.name, "Pessoa da comunidade"),
    photoUrl: asNullableString(value.photo_url),
    state: value.state === "online" ? "online" : "recent",
  };
}

export function parseCommunityHubPayload(value: unknown): CommunityHubSnapshot {
  const payload = isRecord(value) ? value : {};
  return {
    spaces: asArray(payload.spaces).map(parseSpace).filter(Boolean) as CommunitySpaceSummary[],
    events: asArray(payload.events).map(parseEvent).filter(Boolean) as CommunityEventSummary[],
    messages: asArray(payload.messages).map(parseMessage).filter(Boolean) as CommunityChatMessage[],
    presence: asArray(payload.presence)
      .map(parsePresence)
      .filter(Boolean) as CommunityPresenceSummary[],
  };
}

export const supabaseCommunityHubRepository: CommunityHubRepository = {
  async loadHub(_userId) {
    return parseCommunityHubPayload(await rpc("get_community_hub_v2", { _message_limit: 30 }));
  },

  async requestMembership(_userId, spaceId) {
    const result = await rpc<{ status?: unknown }>("request_community_space_membership", {
      _space_id: spaceId,
    });
    return parseMembership(result?.status);
  },

  async leaveSpace(_userId, spaceId) {
    await rpc("leave_community_space", { _space_id: spaceId });
  },

  async respondMembership(_userId, spaceId, memberId, accept) {
    await rpc("respond_community_space_membership", {
      _space_id: spaceId,
      _member_id: memberId,
      _accept: accept,
    });
  },

  async attendEvent(_userId, eventId, attending) {
    await rpc("set_community_event_attendance", {
      _event_id: eventId,
      _attending: attending,
    });
  },

  async sendGlobalMessage(_userId, content) {
    const clean = sanitizeCommunityMessage(content);
    if (!clean) throw new Error("Escreva uma mensagem antes de enviar.");
    await rpc("send_community_global_message_v2", { _content: clean });
  },

  subscribeToGlobalMessages(onChange) {
    const channel = supabase
      .channel("v2-community-global-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "global_messages" }, onChange)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
};

export const communityHubBoundaries = Object.freeze({
  ownsDating: false,
  ownsBalance: false,
  ownsGlobalSanctions: false,
  preservesGlobalMessages: true,
  realtimeChannelsPerMount: 1,
});
