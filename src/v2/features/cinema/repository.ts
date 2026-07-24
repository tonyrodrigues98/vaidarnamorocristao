import { supabase } from "@/integrations/supabase/client";
import type {
  CinemaControlAction,
  CinemaControlReceipt,
  CinemaHubSnapshot,
  CinemaMedia,
  CinemaPlaybackSnapshot,
  CinemaRepository,
  CinemaRole,
  CinemaSession,
  CinemaSessionState,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar a Sala de Cinema agora.";

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function integer(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : fallback;
}

function parseMedia(value: unknown): CinemaMedia {
  const row = record(value);
  return {
    id: text(row.id),
    title: text(row.title, "Mídia indisponível"),
    durationMs: integer(row.duration_ms),
    status: text(row.status, "processing") as CinemaMedia["status"],
    visibility: text(row.visibility, "private") as CinemaMedia["visibility"],
    thumbnailUrl: optionalText(row.thumbnail_url),
    captionsAvailable: row.captions_available === true,
    rightsStatus: text(row.rights_status, "pending") as CinemaMedia["rightsStatus"],
    moderationStatus: text(row.moderation_status, "pending") as CinemaMedia["moderationStatus"],
  };
}

export function parseCinemaPlayback(value: unknown): CinemaPlaybackSnapshot {
  const row = record(value);
  return {
    mediaId: text(row.media_id),
    mediaVersion: Math.max(1, integer(row.media_version, 1)),
    positionMs: integer(row.position_ms),
    playing: row.playing === true,
    playbackRate: typeof row.playback_rate === "number" ? row.playback_rate : 1,
    sequence: integer(row.sequence),
    serverTimestamp: text(row.server_timestamp),
    lastAction: optionalText(row.last_action) as CinemaControlAction | null,
  };
}

export function parseCinemaSession(value: unknown): CinemaSession {
  const row = record(value);
  return {
    id: text(row.id),
    title: text(row.title, "Sessão de cinema"),
    state: text(row.state, "draft") as CinemaSessionState,
    scheduledAt: optionalText(row.scheduled_at),
    hostDisplayName: text(row.host_display_name, "Anfitrião"),
    participantCount: integer(row.participant_count),
    viewerRole: text(row.viewer_role, "viewer") as CinemaRole,
    media: parseMedia(row.media),
    playback: parseCinemaPlayback(row.playback),
    conversationThreadId: optionalText(row.conversation_thread_id),
  };
}

export function parseCinemaHub(value: unknown): CinemaHubSnapshot {
  const row = record(value);
  const gates = record(row.gates);
  const sessions = (candidate: unknown) =>
    Array.isArray(candidate) ? candidate.map(parseCinemaSession).filter((item) => item.id) : [];
  return {
    serverNow: text(row.server_now),
    featured: sessions(row.featured),
    upcoming: sessions(row.upcoming),
    history: sessions(row.history),
    gates: {
      uploadEnabled: gates.upload_enabled === true,
      publicPlaybackEnabled: gates.public_playback_enabled === true,
      legalApprovalRecorded: gates.legal_approval_recorded === true,
    },
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabaseCinemaRepository: CinemaRepository = {
  async loadHub(_userId) {
    return parseCinemaHub(await rpc("get_cinema_hub_v2"));
  },
  async loadSession(_userId, sessionId) {
    return parseCinemaSession(await rpc("get_cinema_session_v2", { _session_id: sessionId }));
  },
  async applyControl(_userId, sessionId, expectedSequence, action, positionMs, idempotencyKey) {
    const value = record(
      await rpc("apply_cinema_control_v2", {
        _session_id: sessionId,
        _expected_sequence: expectedSequence,
        _action: action,
        _position_ms: positionMs,
        _idempotency_key: idempotencyKey,
      }),
    );
    return {
      sessionId: text(value.session_id),
      idempotencyKey: text(value.idempotency_key),
      playback: parseCinemaPlayback(value.playback),
    };
  },
};

export const cinemaRepositoryBoundaries = Object.freeze({
  presentationReceivesSession: false,
  presentationReceivesSignedPlaybackUrl: false,
  chatRepositoryCreated: false,
  storageUploadEnabled: false,
  publicPlaybackEnabled: false,
  controlAuthorityServerSide: true,
});
