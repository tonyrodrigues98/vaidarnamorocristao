import { supabase } from "@/integrations/supabase/client";
import {
  isDatingInterestState,
  isDatingModeState,
  parseDatingCursor,
  safeDatingMediaUrl,
  type DatingCandidate,
  type DatingDiscoveryPage,
  type DatingInterestResult,
  type DatingMembership,
  type DatingModeState,
  type DatingRepository,
  type DatingReportReason,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar o modo Namoro agora.";

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseMembershipState(value: unknown): DatingModeState {
  const mapped =
    value === "legacy_active_pending_confirmation"
      ? "legacy-confirmation"
      : value === "paused_by_commitment"
        ? "committed"
        : value;
  return isDatingModeState(mapped) ? mapped : "inactive";
}

export function parseDatingMembership(value: unknown): DatingMembership {
  const row = isRecord(value) ? value : {};
  return {
    state: parseMembershipState(row.status),
    receiveAnonymous: row.receive_anonymous === true,
  };
}

function parseCandidate(value: unknown): DatingCandidate | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  const displayName = text(value.display_name);
  const age = typeof value.age === "number" ? value.age : Number.NaN;
  if (!id || !displayName || !Number.isInteger(age) || age < 18 || age > 110) return null;
  return {
    id,
    displayName,
    age,
    city: text(value.city),
    state: text(value.state),
    church: text(value.church),
    bio: text(value.bio),
    photoUrl: safeDatingMediaUrl(value.photo_url),
    verified: value.verified === true,
    desiredQuality: nullableText(value.desired_quality),
    seeking: nullableText(value.seeking),
    pace: nullableText(value.pace),
    explanation:
      value.explanation === "mesmo_estado_e_recente" ? "mesmo_estado_e_recente" : "recente",
    interestState: isDatingInterestState(value.interest_state) ? value.interest_state : "none",
  };
}

export function parseDatingDiscovery(value: unknown): DatingDiscoveryPage {
  const payload = isRecord(value) ? value : {};
  const items = Array.isArray(payload.items)
    ? payload.items.map(parseCandidate).filter((item): item is DatingCandidate => item !== null)
    : [];
  return {
    items,
    nextCursor: parseDatingCursor(payload.nextCursor),
    hasMore: payload.hasMore === true,
    eligibilityRule: "legacy-opposite-sex-v1",
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabaseDatingRepository: DatingRepository = {
  async loadMembership(userId) {
    const { data, error } = await supabase
      .from("dating_memberships")
      .select("status, receive_anonymous")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(SAFE_ERROR);
    return parseDatingMembership(data);
  },

  async loadDiscovery(_userId, cursor) {
    const page = parseDatingDiscovery(
      await rpc("get_dating_discovery_v2", {
        _cursor_created_at: cursor?.createdAt ?? null,
        _cursor_id: cursor?.id ?? null,
        _cursor_same_state: cursor?.sameStatePriority ?? null,
        _cursor_unseen: cursor?.unseenPriority ?? null,
        _limit: 18,
      }),
    );
    if (page.items.length > 0) {
      await rpc("record_dating_impressions_v2", {
        _candidate_ids: page.items.map((candidate) => candidate.id),
      });
    }
    return page;
  },

  async expressInterest(_userId, candidateId) {
    const result = await rpc<unknown>("send_dating_interest_v2", {
      _target_user_id: candidateId,
    });
    if (!isRecord(result)) throw new Error(SAFE_ERROR);
    const matchId = nullableText(result.match_id);
    return {
      state: result.state === "matched" ? "matched" : "sent",
      matchId,
    } satisfies DatingInterestResult;
  },

  async pause(_userId) {
    return parseDatingMembership(await rpc("pause_dating_membership"));
  },

  async deactivate(_userId) {
    return parseDatingMembership(await rpc("deactivate_dating_membership"));
  },

  async block(_userId, candidateId) {
    await rpc("block_dating_profile_v2", { _target_user_id: candidateId });
  },

  async report(_userId, candidateId, reason: DatingReportReason) {
    await rpc("report_dating_profile_v2", {
      _target_user_id: candidateId,
      _reason: reason,
    });
  },
};

export const datingRepositoryBoundaries = Object.freeze({
  eligibilityIsServerAuthoritative: true,
  communityIndependence: true,
  preservesLegacyInterestsAndMatches: true,
  presentationReceivesSession: false,
  requestsPerDiscoveryPage: 2,
});
