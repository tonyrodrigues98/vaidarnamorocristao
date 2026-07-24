export type CommunitySpaceVisibility = "public" | "private" | "approval";
export type CommunitySpaceRole = "owner" | "moderator" | "member";
export type CommunityMembershipState =
  | "none"
  | "requested"
  | "invited"
  | "active"
  | "muted"
  | "banned";

export interface CommunitySpaceSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly visibility: CommunitySpaceVisibility;
  readonly memberCount: number;
  readonly membershipState: CommunityMembershipState;
  readonly role: CommunitySpaceRole | null;
}

export interface CommunityEventSummary {
  readonly id: string;
  readonly spaceId: string | null;
  readonly title: string;
  readonly description: string;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly timezone: string;
  readonly capacity: number | null;
  readonly participantCount: number;
  readonly attending: boolean;
  readonly status: "scheduled" | "cancelled" | "completed";
}

export interface CommunityChatMessage {
  readonly id: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly senderPhotoUrl: string | null;
  readonly content: string;
  readonly createdAt: string;
  readonly pinned: boolean;
}

export interface CommunityPresenceSummary {
  readonly userId: string;
  readonly name: string;
  readonly photoUrl: string | null;
  readonly state: "online" | "recent";
}

export interface CommunityHubSnapshot {
  readonly spaces: readonly CommunitySpaceSummary[];
  readonly events: readonly CommunityEventSummary[];
  readonly messages: readonly CommunityChatMessage[];
  readonly presence: readonly CommunityPresenceSummary[];
}

export interface CommunityHubRepository {
  loadHub(userId: string): Promise<CommunityHubSnapshot>;
  requestMembership(userId: string, spaceId: string): Promise<CommunityMembershipState>;
  leaveSpace(userId: string, spaceId: string): Promise<void>;
  respondMembership(
    userId: string,
    spaceId: string,
    memberId: string,
    accept: boolean,
  ): Promise<void>;
  attendEvent(userId: string, eventId: string, attending: boolean): Promise<void>;
  sendGlobalMessage(userId: string, content: string): Promise<void>;
  subscribeToGlobalMessages(onChange: () => void): () => void;
}

export function sanitizeCommunityMessage(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 1000);
}

export function isCommunitySpaceVisibility(value: unknown): value is CommunitySpaceVisibility {
  return value === "public" || value === "private" || value === "approval";
}

export function isCommunityMembershipState(value: unknown): value is CommunityMembershipState {
  return (
    value === "none" ||
    value === "requested" ||
    value === "invited" ||
    value === "active" ||
    value === "muted" ||
    value === "banned"
  );
}

export function canManageCommunitySpace(
  role: CommunitySpaceRole | null,
  membership: CommunityMembershipState,
): boolean {
  return membership === "active" && (role === "owner" || role === "moderator");
}

export function formatCommunityEventTime(
  startsAt: string,
  timezone: string,
  locale = "pt-BR",
): string {
  if (Number.isNaN(Date.parse(startsAt))) return "Horário a confirmar";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(startsAt));
  } catch {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(startsAt));
  }
}
