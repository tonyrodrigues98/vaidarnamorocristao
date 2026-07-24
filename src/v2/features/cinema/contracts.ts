export const CINEMA_MEDIA_STATES = [
  "uploading",
  "processing",
  "ready",
  "failed",
  "quarantined",
  "removed",
] as const;
export type CinemaMediaState = (typeof CINEMA_MEDIA_STATES)[number];

export const CINEMA_SESSION_STATES = [
  "draft",
  "scheduled",
  "lobby",
  "live",
  "paused",
  "ended",
  "cancelled",
] as const;
export type CinemaSessionState = (typeof CINEMA_SESSION_STATES)[number];

export const CINEMA_ROLES = ["host", "cohost", "moderator", "participant", "viewer"] as const;
export type CinemaRole = (typeof CINEMA_ROLES)[number];

export const CINEMA_CONTROL_ACTIONS = ["play", "pause", "seek", "end"] as const;
export type CinemaControlAction = (typeof CINEMA_CONTROL_ACTIONS)[number];

export interface CinemaMedia {
  readonly id: string;
  readonly title: string;
  readonly durationMs: number;
  readonly status: CinemaMediaState;
  readonly visibility: "private" | "unlisted" | "community";
  readonly thumbnailUrl: string | null;
  readonly captionsAvailable: boolean;
  readonly rightsStatus: "pending" | "approved" | "rejected";
  readonly moderationStatus: "pending" | "approved" | "rejected";
}

export interface CinemaPlaybackSnapshot {
  readonly mediaId: string;
  readonly mediaVersion: number;
  readonly positionMs: number;
  readonly playing: boolean;
  readonly playbackRate: number;
  readonly sequence: number;
  readonly serverTimestamp: string;
  readonly lastAction: CinemaControlAction | null;
}

export interface CinemaSession {
  readonly id: string;
  readonly title: string;
  readonly state: CinemaSessionState;
  readonly scheduledAt: string | null;
  readonly hostDisplayName: string;
  readonly participantCount: number;
  readonly viewerRole: CinemaRole;
  readonly media: CinemaMedia;
  readonly playback: CinemaPlaybackSnapshot;
  readonly conversationThreadId: string | null;
}

export interface CinemaHubSnapshot {
  readonly serverNow: string;
  readonly featured: readonly CinemaSession[];
  readonly upcoming: readonly CinemaSession[];
  readonly history: readonly CinemaSession[];
  readonly gates: {
    readonly uploadEnabled: boolean;
    readonly publicPlaybackEnabled: boolean;
    readonly legalApprovalRecorded: boolean;
  };
}

export interface CinemaControlReceipt {
  readonly sessionId: string;
  readonly idempotencyKey: string;
  readonly playback: CinemaPlaybackSnapshot;
}

export interface CinemaRepository {
  loadHub(userId: string): Promise<CinemaHubSnapshot>;
  loadSession(userId: string, sessionId: string): Promise<CinemaSession>;
  applyControl(
    userId: string,
    sessionId: string,
    expectedSequence: number,
    action: CinemaControlAction,
    positionMs: number,
    idempotencyKey: string,
  ): Promise<CinemaControlReceipt>;
}

export type DriftDecision =
  | { readonly kind: "none"; readonly targetMs: number }
  | { readonly kind: "smooth"; readonly targetMs: number; readonly rate: number }
  | { readonly kind: "seek"; readonly targetMs: number };

export function estimateCanonicalPosition(
  snapshot: CinemaPlaybackSnapshot,
  serverNow: string,
): number {
  const anchoredAt = Date.parse(snapshot.serverTimestamp);
  const now = Date.parse(serverNow);
  const elapsed =
    snapshot.playing && Number.isFinite(anchoredAt) && Number.isFinite(now)
      ? Math.max(0, now - anchoredAt) * snapshot.playbackRate
      : 0;
  return Math.max(0, Math.floor(snapshot.positionMs + elapsed));
}

export function decideDriftCorrection(
  localPositionMs: number,
  canonicalPositionMs: number,
): DriftDecision {
  const drift = canonicalPositionMs - Math.max(0, localPositionMs);
  const absoluteDrift = Math.abs(drift);
  if (absoluteDrift <= 250) return { kind: "none", targetMs: canonicalPositionMs };
  if (absoluteDrift <= 2_000) {
    return {
      kind: "smooth",
      targetMs: canonicalPositionMs,
      rate: drift > 0 ? 1.05 : 0.95,
    };
  }
  return { kind: "seek", targetMs: canonicalPositionMs };
}

export function canControlCinema(role: CinemaRole, action: CinemaControlAction): boolean {
  if (role === "host" || role === "cohost") return true;
  return role === "moderator" && action === "end";
}

export function canTransitionCinemaSession(
  from: CinemaSessionState,
  to: CinemaSessionState,
): boolean {
  const allowed: Readonly<Record<CinemaSessionState, readonly CinemaSessionState[]>> = {
    draft: ["scheduled", "cancelled"],
    scheduled: ["lobby", "cancelled"],
    lobby: ["live", "cancelled"],
    live: ["paused", "ended"],
    paused: ["live", "ended"],
    ended: [],
    cancelled: [],
  };
  return allowed[from].includes(to);
}

export function createCinemaCommandKey(randomUUID: () => string): string {
  const key = randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new Error("secure_cinema_command_key_unavailable");
  }
  return key;
}

export const cinemaPrivacyContract = Object.freeze({
  mediaInGitAllowed: false,
  publicPlaybackFailsClosed: true,
  signedPrivatePlaybackRequired: true,
  chatUsesConversationCore: true,
  localClockIsAuthority: false,
  telemetryContainsPii: false,
});
