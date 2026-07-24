import { describe, expect, it } from "vitest";
import {
  compareConversationMessages,
  conversationDraftKey,
  createOptimisticMessage,
  isConversationThreadKey,
  parseConversationCursor,
  readConversationDraft,
  reconcileConversationMessages,
  sanitizeConversationContent,
  writeConversationDraft,
  type ConversationMessage,
  type DraftStorage,
} from "../src/v2/features/conversations/contracts";
import {
  parseConversationInbox,
  parseConversationPage,
} from "../src/v2/features/conversations/repository";

function message(
  id: string,
  createdAt: string,
  clientMessageId: string | null = null,
  optimistic = false,
): ConversationMessage {
  return {
    id,
    clientMessageId,
    threadKey: "thread:12345678",
    senderId: "user-a",
    senderName: "Ana",
    content: "Paz",
    createdAt,
    editedAt: null,
    replyToId: null,
    delivery: optimistic ? "sending" : "sent",
    optimistic,
  };
}

describe("V2-012 conversation contracts", () => {
  it("accepts only bounded canonical thread keys", () => {
    expect(isConversationThreadKey("thread:12345678")).toBe(true);
    expect(isConversationThreadKey("legacy-match:12345678")).toBe(true);
    expect(isConversationThreadKey("global:community")).toBe(true);
    expect(isConversationThreadKey("https://example.com")).toBe(false);
    expect(isConversationThreadKey("thread:a/b")).toBe(false);
  });

  it("uses created_at and id as a total order", () => {
    const createdAt = "2026-07-23T12:00:00.000Z";
    expect(
      compareConversationMessages(message("b-message", createdAt), message("a-message", createdAt)),
    ).toBeGreaterThan(0);
  });

  it("reconciles an optimistic retry with the persisted message", () => {
    const createdAt = "2026-07-23T12:00:00.000Z";
    const optimistic = message("optimistic-client-1", createdAt, "client-1", true);
    const saved = message("saved-message", createdAt, "client-1");
    expect(reconcileConversationMessages([optimistic], [saved])).toEqual([saved]);
  });

  it("does not collapse messages from different senders", () => {
    const createdAt = "2026-07-23T12:00:00.000Z";
    const first = message("first-id", createdAt, "same-client-id");
    const second = { ...message("second-id", createdAt, "same-client-id"), senderId: "user-b" };
    expect(reconcileConversationMessages([first], [second])).toHaveLength(2);
  });

  it("sanitizes line endings, whitespace and maximum length", () => {
    expect(sanitizeConversationContent("  Paz\r\ne graça  ")).toBe("Paz\ne graça");
    expect(sanitizeConversationContent("a".repeat(5000))).toHaveLength(4000);
  });

  it("creates an explicitly optimistic delivery state", () => {
    const optimistic = createOptimisticMessage({
      userId: "user-a",
      threadKey: "thread:12345678",
      clientMessageId: "client-1",
      content: "  Olá  ",
      now: "2026-07-23T12:00:00.000Z",
    });
    expect(optimistic).toMatchObject({
      delivery: "sending",
      optimistic: true,
      content: "Olá",
      clientMessageId: "client-1",
    });
  });

  it("isolates drafts by both user and thread", () => {
    const values = new Map<string, string>();
    const storage: DraftStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => void values.set(key, value),
      removeItem: (key) => void values.delete(key),
    };
    writeConversationDraft(storage, "user-a", "thread:12345678", "rascunho A");
    writeConversationDraft(storage, "user-b", "thread:12345678", "rascunho B");
    expect(readConversationDraft(storage, "user-a", "thread:12345678")).toBe("rascunho A");
    expect(readConversationDraft(storage, "user-b", "thread:12345678")).toBe("rascunho B");
    expect(conversationDraftKey("user-a", "thread:12345678")).not.toBe(
      conversationDraftKey("user-b", "thread:12345678"),
    );
  });

  it("fails closed when draft storage is unavailable", () => {
    const storage: DraftStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readConversationDraft(storage, "user-a", "thread:12345678")).toBe("");
    expect(() =>
      writeConversationDraft(storage, "user-a", "thread:12345678", "rascunho"),
    ).not.toThrow();
  });

  it("parses only complete cursors and untrusted message rows", () => {
    const cursor = { createdAt: "2026-07-23T12:00:00.000Z", id: "message-1" };
    expect(parseConversationCursor(cursor)).toEqual(cursor);
    expect(parseConversationCursor({ createdAt: "invalid", id: "message-1" })).toBeNull();
    expect(
      parseConversationPage(
        {
          items: [
            {
              id: "message-1",
              sender_id: "user-a",
              content: "Paz",
              created_at: cursor.createdAt,
            },
            { id: "", content: "" },
          ],
          nextCursor: cursor,
          hasMore: true,
        },
        "thread:12345678",
      ),
    ).toMatchObject({ hasMore: true, nextCursor: cursor, items: [{ id: "message-1" }] });
  });

  it("preserves social request direction without inventing romantic context", () => {
    const inbox = parseConversationInbox([
      {
        thread_key: "thread:12345678",
        context: "social",
        title: "Ana",
        updated_at: "2026-07-23T12:00:00.000Z",
        thread_state: "request",
        request_direction: "incoming",
      },
      {
        thread_key: "invalid key",
        updated_at: "2026-07-23T12:00:00.000Z",
      },
    ]);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({
      context: "social",
      state: "request",
      requestDirection: "incoming",
    });
  });
});
