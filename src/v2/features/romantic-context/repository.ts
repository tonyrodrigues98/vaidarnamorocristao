import { supabase } from "@/integrations/supabase/client";
import {
  isAnonymousNoteState,
  isPurposeState,
  safeRomanticMediaUrl,
  type AnonymousCenterSnapshot,
  type AnonymousNote,
  type ContextualGift,
  type PurposeCapsule,
  type PurposeRecord,
  type PurposeSnapshot,
  type PurposeTimelineEvent,
  type RomanticContextRepository,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar esta área agora.";

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parsePerson(value: unknown) {
  const row = isRecord(value) ? value : {};
  return {
    id: text(row.id),
    displayName: text(row.display_name, "Participante"),
    photoUrl: safeRomanticMediaUrl(row.photo_url),
  };
}

function parsePurpose(value: unknown): PurposeRecord | null {
  if (!isRecord(value) || !isPurposeState(value.state)) return null;
  const id = text(value.id);
  const matchId = text(value.match_id);
  if (!id || !matchId) return null;
  return {
    id,
    matchId,
    state: value.state,
    requestedByMe: value.requested_by_me === true,
    partner: parsePerson(value.partner),
    requestedAt: text(value.requested_at),
    acceptedAt: nullableText(value.accepted_at),
    endedAt: nullableText(value.ended_at),
    endReason: nullableText(value.end_reason),
  };
}

function parseGift(value: unknown): ContextualGift | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const name = text(value.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    imageUrl: safeRomanticMediaUrl(value.image_url),
    price: number(value.price),
    category: text(value.category),
    sentAt: nullableText(value.sent_at) ?? undefined,
    senderName: nullableText(value.sender_name) ?? undefined,
  };
}

function parseTimelineEvent(value: unknown): PurposeTimelineEvent | null {
  if (!isRecord(value) || !isPurposeState(value.to_state)) return null;
  const id = text(value.id);
  const type = text(value.type);
  if (
    !id ||
    !["requested", "accepted", "rejected", "cancelled", "ended", "archived"].includes(type)
  ) {
    return null;
  }
  return {
    id,
    type: type as PurposeTimelineEvent["type"],
    fromState: isPurposeState(value.from_state) ? value.from_state : null,
    toState: value.to_state,
    actorIsMe: value.actor_is_me === true,
    createdAt: text(value.created_at),
  };
}

function parseCapsule(value: unknown): PurposeCapsule | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const unlockAt = text(value.unlock_at);
  if (!id || !unlockAt) return null;
  return {
    id,
    message: text(value.message),
    unlockAt,
    openedAt: nullableText(value.opened_at),
    createdAt: text(value.created_at),
    authorIsMe: value.author_is_me === true,
    locked: value.locked === true,
  };
}

export function parsePurposeSnapshot(value: unknown): PurposeSnapshot {
  const row = isRecord(value) ? value : {};
  const history = Array.isArray(row.history)
    ? row.history.map(parsePurpose).filter((item): item is PurposeRecord => item !== null)
    : [];
  const eligibleMatches = Array.isArray(row.eligible_matches)
    ? row.eligible_matches
        .map((item) => {
          if (!isRecord(item) || typeof item.match_id !== "string") return null;
          return { matchId: item.match_id, partner: parsePerson(item.partner) };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];
  return {
    current: parsePurpose(row.current),
    history,
    eligibleMatches,
    gifts: Array.isArray(row.gifts)
      ? row.gifts.map(parseGift).filter((item): item is ContextualGift => item !== null)
      : [],
    catalog: Array.isArray(row.catalog)
      ? row.catalog.map(parseGift).filter((item): item is ContextualGift => item !== null)
      : [],
    timeline: Array.isArray(row.timeline)
      ? row.timeline
          .map(parseTimelineEvent)
          .filter((item): item is PurposeTimelineEvent => item !== null)
      : [],
    capsules: Array.isArray(row.capsules)
      ? row.capsules.map(parseCapsule).filter((item): item is PurposeCapsule => item !== null)
      : [],
    messageCount: number(row.message_count),
    capsuleCount: number(row.capsule_count),
  };
}

function parseNote(value: unknown): AnonymousNote | null {
  if (!isRecord(value) || !isAnonymousNoteState(value.state)) return null;
  const id = text(value.id);
  if (!id) return null;
  return {
    id,
    direction: value.direction === "outgoing" ? "outgoing" : "incoming",
    content: text(value.content),
    reply: nullableText(value.reply),
    state: value.state,
    createdAt: text(value.created_at),
    expiresAt: text(value.expires_at),
    hintCount: number(value.hint_count),
    revealRequestedByMe: value.reveal_requested_by_me === true,
    revealRequestedByOther: value.reveal_requested_by_other === true,
    matchId: nullableText(value.match_id),
  };
}

export function parseAnonymousCenter(value: unknown): AnonymousCenterSnapshot {
  const row = isRecord(value) ? value : {};
  return {
    accepting: row.accepting === true,
    notes: Array.isArray(row.notes)
      ? row.notes.map(parseNote).filter((item): item is AnonymousNote => item !== null)
      : [],
    recipients: Array.isArray(row.recipients)
      ? row.recipients
          .map((item) =>
            isRecord(item) && typeof item.id === "string"
              ? { id: item.id, displayName: text(item.display_name, "Participante") }
              : null,
          )
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [],
    dailyUsed: number(row.daily_used),
    dailyFree: number(row.daily_free) || 3,
    extras: number(row.extras),
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabaseRomanticContextRepository: RomanticContextRepository = {
  async loadPurpose(_userId) {
    return parsePurposeSnapshot(await rpc("get_relationship_purpose_hub_v2"));
  },
  async requestPurpose(_userId, matchId, idempotencyKey) {
    await rpc("request_relationship_purpose_v2", {
      _match_id: matchId,
      _idempotency_key: idempotencyKey,
    });
  },
  async transitionPurpose(_userId, purposeId, action) {
    await rpc("transition_relationship_purpose_v2", {
      _commitment_id: purposeId,
      _action: action,
    });
  },
  async sendPurposeGift(_userId, input) {
    return text(
      await rpc("send_contextual_gift_v2", {
        _receiver_id: input.receiverId,
        _gift_id: input.giftId,
        _message: input.message || null,
        _context: "purpose",
        _context_ref_id: input.purposeId,
        _idempotency_key: input.idempotencyKey,
      }),
    );
  },
  async loadAnonymousCenter(_userId) {
    return parseAnonymousCenter(await rpc("get_anonymous_center_v2"));
  },
  async setAnonymousOptIn(_userId, accepting) {
    await rpc("set_anonymous_opt_in_v2", { _accept: accepting });
  },
  async sendAnonymousNote(_userId, receiverId, content) {
    return text(
      await rpc("send_anonymous_message_v2", {
        _receiver_id: receiverId,
        _content: content,
      }),
    );
  },
  async actOnAnonymousNote(_userId, messageId, action) {
    const names = {
      reply: "reply_anonymous_message_v2",
      "request-hint": "request_anonymous_hint_v2",
      "send-hint": "send_anonymous_hint_v2",
      "request-reveal": "request_anonymous_reveal_v2",
      ignore: "ignore_anonymous_message_v2",
      report: "report_anonymous_message_v2",
    } as const;
    await rpc(names[action.kind], {
      _message_id: messageId,
      ...(action.kind === "reply" ? { _reply: action.content } : {}),
      ...(action.kind === "send-hint" ? { _category: action.category, _hint: action.content } : {}),
      ...(action.kind === "report" ? { _reason: action.reason } : {}),
    });
  },
};

export const romanticContextRepositoryBoundaries = Object.freeze({
  purposeTransitionsAreServerAuthoritative: true,
  anonymousIdentityIsNeverReturnedBeforeMutualReveal: true,
  giftEconomyUsesLegacyAtomicCommand: true,
  presentationReceivesSession: false,
  anonymousDefault: false,
});
