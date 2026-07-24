export const COMMUNITY_HOME_QUERY_BUDGET = Object.freeze({
  aggregator: 1,
  mediaSigning: 1,
  total: 2,
  pageSize: 20,
});

export const COMMUNITY_AUDIENCES = ["community", "followers", "connections", "private"] as const;

export type CommunityAudience = (typeof COMMUNITY_AUDIENCES)[number];
export type SocialRelationshipKind = "follow" | "connection";
export type SocialRelationshipState = "none" | "following" | "request_sent" | "connected";

export interface CommunityAuthor {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string | null;
}

export interface CommunityStatusItem {
  readonly id: string;
  readonly author: CommunityAuthor;
  readonly caption: string | null;
  readonly mediaPath: string | null;
  readonly mediaUrl: string | null;
  readonly audience: CommunityAudience;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly viewed: boolean;
}

export interface CommunityPostItem {
  readonly id: string;
  readonly author: CommunityAuthor;
  readonly body: string;
  readonly audience: CommunityAudience;
  readonly createdAt: string;
  readonly reactionCount: number;
  readonly commentCount: number;
  readonly viewerReacted: boolean;
  readonly rankReason: "recent";
}

export interface CommunityDailyItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly bibleReference: string | null;
  readonly publishedAt: string;
  readonly kind: "news" | "devotional";
}

export interface CommunityPerson {
  readonly id: string;
  readonly name: string;
  readonly photoUrl: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly church: string | null;
  readonly relationshipState: SocialRelationshipState;
}

export interface CommunityRelationshipSummary {
  readonly connections: number;
  readonly following: number;
  readonly pending: number;
}

export interface CommunityFeedCursor {
  readonly createdAt: string;
  readonly id: string;
}

export interface CommunityHomeSnapshot {
  readonly posts: readonly CommunityPostItem[];
  readonly statuses: readonly CommunityStatusItem[];
  readonly daily: readonly CommunityDailyItem[];
  readonly suggestions: readonly CommunityPerson[];
  readonly relationshipSummary: CommunityRelationshipSummary;
  readonly hasMorePosts: boolean;
  readonly nextCursor: CommunityFeedCursor | null;
}

export interface PublishCommunityStatusInput {
  readonly caption: string;
  readonly audience: CommunityAudience;
  readonly file?: File | null;
}

export interface CommunityHomeRepository {
  loadHome(userId: string, cursor?: CommunityFeedCursor | null): Promise<CommunityHomeSnapshot>;
  loadPeople(userId: string): Promise<readonly CommunityPerson[]>;
  publishPost(userId: string, body: string, audience: CommunityAudience): Promise<void>;
  toggleReaction(userId: string, postId: string): Promise<boolean>;
  publishStatus(userId: string, input: PublishCommunityStatusInput): Promise<void>;
  deleteStatus(userId: string, statusId: string): Promise<boolean>;
  recordStatusView(userId: string, statusId: string): Promise<boolean>;
  requestRelationship(
    userId: string,
    targetUserId: string,
    kind: SocialRelationshipKind,
  ): Promise<SocialRelationshipState>;
}

export type CommunityHomeViewState = "loading" | "ready" | "empty" | "error" | "offline";

export function isCommunityAudience(value: unknown): value is CommunityAudience {
  return COMMUNITY_AUDIENCES.includes(value as CommunityAudience);
}

export function sanitizeCommunityAudience(
  value: unknown,
  fallback: CommunityAudience = "community",
): CommunityAudience {
  return isCommunityAudience(value) ? value : fallback;
}

export function sanitizeCommunityBody(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function parseCommunityCursor(value: unknown): CommunityFeedCursor | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.createdAt !== "string" ||
    Number.isNaN(Date.parse(candidate.createdAt)) ||
    typeof candidate.id !== "string" ||
    candidate.id.length < 16
  ) {
    return null;
  }
  return { createdAt: candidate.createdAt, id: candidate.id };
}

export function resolveCommunityHomeViewState(input: {
  readonly loading: boolean;
  readonly error: boolean;
  readonly online: boolean;
  readonly itemCount: number;
}): CommunityHomeViewState {
  if (input.loading) return "loading";
  if (input.error) return input.online ? "error" : "offline";
  if (input.itemCount === 0) return "empty";
  return "ready";
}

export function statusRemainingLabel(expiresAt: string, now = Date.now()): string {
  const remainingMs = Math.max(0, Date.parse(expiresAt) - now);
  const hours = Math.ceil(remainingMs / 3_600_000);
  if (hours <= 1) return "menos de 1 h";
  return `${hours} h`;
}
