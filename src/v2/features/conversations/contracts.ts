export type ConversationContext = "social" | "romantic" | "purpose" | "space" | "global" | "cinema";

export type ConversationThreadState = "request" | "active" | "archived" | "closed";
export type ConversationDeliveryState = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ConversationCursor {
  readonly createdAt: string;
  readonly id: string;
}

export interface ConversationThreadSummary {
  readonly key: string;
  readonly context: ConversationContext;
  readonly title: string;
  readonly avatarUrl: string | null;
  readonly preview: string;
  readonly updatedAt: string;
  readonly unreadCount: number;
  readonly state: ConversationThreadState;
  readonly requestDirection: "incoming" | "outgoing" | null;
  readonly muted: boolean;
  readonly pinned: boolean;
}

export interface ConversationMessage {
  readonly id: string;
  readonly clientMessageId: string | null;
  readonly threadKey: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly content: string;
  readonly createdAt: string;
  readonly editedAt: string | null;
  readonly replyToId: string | null;
  readonly delivery: ConversationDeliveryState;
  readonly optimistic?: boolean;
}

export interface ConversationMessagePage {
  readonly items: readonly ConversationMessage[];
  readonly nextCursor: ConversationCursor | null;
  readonly hasMore: boolean;
}

export interface ConversationRepository {
  loadInbox(userId: string): Promise<readonly ConversationThreadSummary[]>;
  loadMessages(
    userId: string,
    threadKey: string,
    cursor?: ConversationCursor | null,
  ): Promise<ConversationMessagePage>;
  sendMessage(
    userId: string,
    threadKey: string,
    clientMessageId: string,
    content: string,
    replyToId?: string | null,
  ): Promise<ConversationMessage>;
  markRead(userId: string, threadKey: string, through: ConversationCursor): Promise<void>;
  updateThreadPreference(
    userId: string,
    threadKey: string,
    preference: "muted" | "pinned" | "archived",
    enabled: boolean,
  ): Promise<void>;
  respondToRequest(userId: string, threadKey: string, accept: boolean): Promise<void>;
  subscribe(threadKey: string, onChange: () => void): () => void;
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAFE_THREAD_PREFIXES = [
  "thread:",
  "legacy-match:",
  "global:community",
  "space:",
  "cinema:",
] as const;

export function isConversationThreadKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 128 &&
    SAFE_THREAD_PREFIXES.some((prefix) => value.startsWith(prefix)) &&
    !/[\s/?#]/.test(value)
  );
}

export function parseConversationCursor(value: unknown): ConversationCursor | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.createdAt !== "string" ||
    Number.isNaN(Date.parse(row.createdAt)) ||
    typeof row.id !== "string" ||
    row.id.length < 8
  ) {
    return null;
  }
  return { createdAt: row.createdAt, id: row.id };
}

export function compareConversationMessages(
  left: Pick<ConversationMessage, "createdAt" | "id">,
  right: Pick<ConversationMessage, "createdAt" | "id">,
): number {
  const time = left.createdAt.localeCompare(right.createdAt);
  return time === 0 ? left.id.localeCompare(right.id) : time;
}

export function reconcileConversationMessages(
  current: readonly ConversationMessage[],
  incoming: readonly ConversationMessage[],
): readonly ConversationMessage[] {
  const byIdentity = new Map<string, ConversationMessage>();
  for (const message of [...current, ...incoming]) {
    const identity = message.clientMessageId
      ? `${message.senderId}:${message.clientMessageId}`
      : message.id;
    const existing = byIdentity.get(identity);
    if (!existing || (existing.optimistic && !message.optimistic)) {
      byIdentity.set(identity, message);
    }
  }
  return [...byIdentity.values()].sort(compareConversationMessages);
}

export function sanitizeConversationContent(value: string): string {
  return value.trim().replace(/\r\n?/g, "\n").slice(0, 4000);
}

export function createOptimisticMessage(input: {
  readonly userId: string;
  readonly threadKey: string;
  readonly clientMessageId: string;
  readonly content: string;
  readonly now?: string;
}): ConversationMessage {
  return {
    id: `optimistic-${input.clientMessageId}`,
    clientMessageId: input.clientMessageId,
    threadKey: input.threadKey,
    senderId: input.userId,
    senderName: "Você",
    content: sanitizeConversationContent(input.content),
    createdAt: input.now ?? new Date().toISOString(),
    editedAt: null,
    replyToId: null,
    delivery: "sending",
    optimistic: true,
  };
}

export function conversationDraftKey(userId: string, threadKey: string): string {
  return `vdn:v2:draft:${userId}:${threadKey}`;
}

export function readConversationDraft(
  storage: DraftStorage | null,
  userId: string,
  threadKey: string,
): string {
  if (!storage || !isConversationThreadKey(threadKey)) return "";
  try {
    return storage.getItem(conversationDraftKey(userId, threadKey))?.slice(0, 4000) ?? "";
  } catch {
    return "";
  }
}

export function writeConversationDraft(
  storage: DraftStorage | null,
  userId: string,
  threadKey: string,
  content: string,
): void {
  if (!storage || !isConversationThreadKey(threadKey)) return;
  const key = conversationDraftKey(userId, threadKey);
  try {
    if (content) storage.setItem(key, content.slice(0, 4000));
    else storage.removeItem(key);
  } catch {
    // Private draft persistence is best effort and never blocks messaging.
  }
}
