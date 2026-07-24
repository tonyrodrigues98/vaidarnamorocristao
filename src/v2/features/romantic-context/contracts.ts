export type PurposeState = "requested" | "active" | "rejected" | "cancelled" | "ended" | "archived";

export type AnonymousNoteState =
  | "pending"
  | "hint_requested"
  | "hint_sent"
  | "replied"
  | "reveal_requested"
  | "revealed"
  | "ignored"
  | "reported"
  | "expired";

export type GiftContext = "social" | "romantic" | "purpose";

export interface PurposePerson {
  readonly id: string;
  readonly displayName: string;
  readonly photoUrl: string | null;
}

export interface PurposeRecord {
  readonly id: string;
  readonly matchId: string;
  readonly state: PurposeState;
  readonly requestedByMe: boolean;
  readonly partner: PurposePerson;
  readonly requestedAt: string;
  readonly acceptedAt: string | null;
  readonly endedAt: string | null;
  readonly endReason: string | null;
}

export interface PurposeEligibleMatch {
  readonly matchId: string;
  readonly partner: PurposePerson;
}

export interface PurposeTimelineEvent {
  readonly id: string;
  readonly type: "requested" | "accepted" | "rejected" | "cancelled" | "ended" | "archived";
  readonly fromState: PurposeState | null;
  readonly toState: PurposeState;
  readonly actorIsMe: boolean;
  readonly createdAt: string;
}

export interface PurposeCapsule {
  readonly id: string;
  readonly message: string;
  readonly unlockAt: string;
  readonly openedAt: string | null;
  readonly createdAt: string;
  readonly authorIsMe: boolean;
  readonly locked: boolean;
}

export interface ContextualGift {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly price: number;
  readonly category: string;
  readonly sentAt?: string;
  readonly senderName?: string;
}

export interface PurposeSnapshot {
  readonly current: PurposeRecord | null;
  readonly history: readonly PurposeRecord[];
  readonly eligibleMatches: readonly PurposeEligibleMatch[];
  readonly gifts: readonly ContextualGift[];
  readonly catalog: readonly ContextualGift[];
  readonly timeline: readonly PurposeTimelineEvent[];
  readonly capsules: readonly PurposeCapsule[];
  readonly messageCount: number;
  readonly capsuleCount: number;
}

export interface AnonymousNote {
  readonly id: string;
  readonly direction: "incoming" | "outgoing";
  readonly content: string;
  readonly reply: string | null;
  readonly state: AnonymousNoteState;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly hintCount: number;
  readonly revealRequestedByMe: boolean;
  readonly revealRequestedByOther: boolean;
  readonly matchId: string | null;
}

export interface AnonymousRecipient {
  readonly id: string;
  readonly displayName: string;
}

export interface AnonymousCenterSnapshot {
  readonly accepting: boolean;
  readonly notes: readonly AnonymousNote[];
  readonly recipients: readonly AnonymousRecipient[];
  readonly dailyUsed: number;
  readonly dailyFree: number;
  readonly extras: number;
}

export interface RomanticContextRepository {
  loadPurpose(userId: string): Promise<PurposeSnapshot>;
  requestPurpose(userId: string, matchId: string, idempotencyKey: string): Promise<void>;
  transitionPurpose(
    userId: string,
    purposeId: string,
    action: "accept" | "reject" | "cancel" | "end" | "archive",
  ): Promise<void>;
  sendPurposeGift(
    userId: string,
    input: {
      readonly receiverId: string;
      readonly giftId: string;
      readonly purposeId: string;
      readonly message: string;
      readonly idempotencyKey: string;
    },
  ): Promise<string>;
  loadAnonymousCenter(userId: string): Promise<AnonymousCenterSnapshot>;
  setAnonymousOptIn(userId: string, accepting: boolean): Promise<void>;
  sendAnonymousNote(userId: string, receiverId: string, content: string): Promise<string>;
  actOnAnonymousNote(
    userId: string,
    messageId: string,
    action:
      | { readonly kind: "reply"; readonly content: string }
      | { readonly kind: "request-hint" }
      | { readonly kind: "send-hint"; readonly category: string; readonly content: string }
      | { readonly kind: "request-reveal" }
      | { readonly kind: "ignore" }
      | { readonly kind: "report"; readonly reason: string },
  ): Promise<void>;
}

export function isPurposeState(value: unknown): value is PurposeState {
  return (
    value === "requested" ||
    value === "active" ||
    value === "rejected" ||
    value === "cancelled" ||
    value === "ended" ||
    value === "archived"
  );
}

export function isAnonymousNoteState(value: unknown): value is AnonymousNoteState {
  return (
    value === "pending" ||
    value === "hint_requested" ||
    value === "hint_sent" ||
    value === "replied" ||
    value === "reveal_requested" ||
    value === "revealed" ||
    value === "ignored" ||
    value === "reported" ||
    value === "expired"
  );
}

export function sanitizeRomanticText(value: string, maximum: number): string {
  return value.replace(/\r\n?/g, "\n").trim().slice(0, maximum);
}

export function createCommandKey(randomUUID: () => string): string {
  const generated = randomUUID();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(generated)
  ) {
    throw new Error("secure_command_key_unavailable");
  }
  return generated;
}

export function safeRomanticMediaUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
