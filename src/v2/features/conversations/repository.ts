import { supabase } from "@/integrations/supabase/client";
import {
  isConversationThreadKey,
  parseConversationCursor,
  sanitizeConversationContent,
  type ConversationContext,
  type ConversationDeliveryState,
  type ConversationMessage,
  type ConversationMessagePage,
  type ConversationRepository,
  type ConversationThreadState,
  type ConversationThreadSummary,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar as conversas agora.";

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
  if (import.meta.env.DEV) console.warn(`[v2-conversations] ${context}`, { failed: true });
  return new Error(SAFE_ERROR);
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw safeError(name);
  return data as T;
}

function parseContext(value: unknown): ConversationContext {
  switch (value) {
    case "romantic":
    case "purpose":
    case "space":
    case "global":
    case "cinema":
      return value;
    default:
      return "social";
  }
}

function parseThreadState(value: unknown): ConversationThreadState {
  return value === "request" || value === "archived" || value === "closed" ? value : "active";
}

function parseDelivery(value: unknown): ConversationDeliveryState {
  return value === "read" || value === "delivered" || value === "failed" ? value : "sent";
}

function parseThread(value: unknown): ConversationThreadSummary | null {
  if (!isRecord(value)) return null;
  const key = asString(value.thread_key);
  const updatedAt = asString(value.updated_at);
  if (!isConversationThreadKey(key) || Number.isNaN(Date.parse(updatedAt))) return null;
  return {
    key,
    context: parseContext(value.context),
    title: asString(value.title, "Conversa"),
    avatarUrl: asNullableString(value.avatar_url),
    preview: asString(value.preview),
    updatedAt,
    unreadCount: asCount(value.unread_count),
    state: parseThreadState(value.thread_state),
    requestDirection:
      value.request_direction === "incoming" || value.request_direction === "outgoing"
        ? value.request_direction
        : null,
    muted: value.muted === true,
    pinned: value.pinned === true,
  };
}

function parseMessage(value: unknown, threadKey: string): ConversationMessage | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const content = asString(value.content);
  const createdAt = asString(value.created_at);
  if (!id || !content || Number.isNaN(Date.parse(createdAt))) return null;
  return {
    id,
    clientMessageId: asNullableString(value.client_message_id),
    threadKey,
    senderId: asString(value.sender_id),
    senderName: asString(value.sender_name, "Pessoa da comunidade"),
    content,
    createdAt,
    editedAt: asNullableString(value.edited_at),
    replyToId: asNullableString(value.reply_to_id),
    delivery: parseDelivery(value.delivery_state),
  };
}

export function parseConversationInbox(value: unknown): readonly ConversationThreadSummary[] {
  return asArray(value).map(parseThread).filter(Boolean) as ConversationThreadSummary[];
}

export function parseConversationPage(value: unknown, threadKey: string): ConversationMessagePage {
  const payload = isRecord(value) ? value : {};
  return {
    items: asArray(payload.items)
      .map((row) => parseMessage(row, threadKey))
      .filter(Boolean) as ConversationMessage[],
    nextCursor: parseConversationCursor(payload.nextCursor),
    hasMore: payload.hasMore === true,
  };
}

export const supabaseConversationRepository: ConversationRepository = {
  async loadInbox(_userId) {
    return parseConversationInbox(await rpc("get_conversation_inbox_v2"));
  },

  async loadMessages(_userId, threadKey, cursor) {
    if (!isConversationThreadKey(threadKey)) throw new Error("Conversa inválida.");
    return parseConversationPage(
      await rpc("get_conversation_messages_v2", {
        _thread_key: threadKey,
        _cursor_created_at: cursor?.createdAt ?? null,
        _cursor_id: cursor?.id ?? null,
        _limit: 40,
      }),
      threadKey,
    );
  },

  async sendMessage(_userId, threadKey, clientMessageId, content, replyToId) {
    const clean = sanitizeConversationContent(content);
    if (!clean) throw new Error("Escreva uma mensagem antes de enviar.");
    const payload = await rpc<unknown>("send_conversation_message_v2", {
      _thread_key: threadKey,
      _client_message_id: clientMessageId,
      _content: clean,
      _reply_to_id: replyToId ?? null,
    });
    const message = parseMessage(payload, threadKey);
    if (!message) throw safeError("parse_send");
    return message;
  },

  async markRead(_userId, threadKey, through) {
    await rpc("mark_conversation_read_v2", {
      _thread_key: threadKey,
      _through_created_at: through.createdAt,
      _through_id: through.id,
    });
  },

  async updateThreadPreference(_userId, threadKey, preference, enabled) {
    await rpc("set_conversation_preference_v2", {
      _thread_key: threadKey,
      _preference: preference,
      _enabled: enabled,
    });
  },

  async respondToRequest(_userId, threadKey, accept) {
    if (!threadKey.startsWith("thread:")) throw new Error("Solicitação inválida.");
    await rpc("respond_conversation_request_v2", {
      _thread_id: threadKey.slice("thread:".length),
      _accept: accept,
    });
  },

  subscribe(threadKey, onChange) {
    const [kind, identifier] = threadKey.split(":", 2);
    const channel = supabase.channel(`v2-thread-${threadKey}`);
    if (kind === "legacy-match" && identifier) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `match_id=eq.${identifier}` },
        onChange,
      );
    } else if (threadKey === "global:community") {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_messages" },
        onChange,
      );
    } else if (kind === "thread" && identifier) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_messages_v2",
          filter: `thread_id=eq.${identifier}`,
        },
        onChange,
      );
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
};

export const conversationRepositoryBoundaries = Object.freeze({
  maximumChannelsPerThread: 1,
  preservesLegacyIds: true,
  usesClientMessageId: true,
  passesSessionToPresentation: false,
});
