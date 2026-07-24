import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { admin, createUser, createMatch, deleteUsers, sleep, type Ctx } from "./helpers";

let A: Ctx, B: Ctx, C: Ctx;
let matchId: string;

beforeAll(async () => {
  [A, B, C] = await Promise.all([createUser("rt-a"), createUser("rt-b"), createUser("rt-c")]);
  matchId = await createMatch(A.userId, B.userId);
}, 30000);

afterAll(async () => {
  await admin.from("messages").delete().eq("match_id", matchId);
  await admin.from("matches").delete().eq("id", matchId);
  await deleteUsers(A, B, C);
}, 30000);

function subscribe(ctx: Ctx, targetMatchId: string, received: any[]): Promise<() => Promise<void>> {
  return new Promise((resolve, reject) => {
    const channel = ctx.client
      .channel(`msgs-${ctx.userId}-${Math.random().toString(36).slice(2, 7)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${targetMatchId}`,
        },
        (payload) => {
          received.push(payload.new);
        },
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          resolve(async () => {
            await ctx.client.removeChannel(channel);
          });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(err ?? new Error(status));
        }
      });
  });
}

describe("Realtime — eventos de mensagens só vazam para participantes do match", () => {
  it("apenas A e B recebem o INSERT; C não recebe", async () => {
    const recvA: any[] = [];
    const recvB: any[] = [];
    const recvC: any[] = [];

    const [unsubA, unsubB, unsubC] = await Promise.all([
      subscribe(A, matchId, recvA),
      subscribe(B, matchId, recvB),
      subscribe(C, matchId, recvC),
    ]);

    // Small delay to ensure subscriptions are warm
    await sleep(500);

    const content = `rt-${Date.now()}`;
    const { error } = await A.client
      .from("messages")
      .insert({ match_id: matchId, sender_id: A.userId, content });
    expect(error).toBeNull();

    // GitHub-hosted runners can take longer than a fixed 2.5 s to fan out the
    // first event after a complete local Supabase reset. Poll with a strict
    // deadline while preserving the participant/non-participant assertions.
    const deadline = Date.now() + 20000;
    while (
      Date.now() < deadline &&
      (!recvA.some((m) => m.content === content) || !recvB.some((m) => m.content === content))
    ) {
      await sleep(200);
    }

    await Promise.all([unsubA(), unsubB(), unsubC()]);

    expect(recvA.some((m) => m.content === content)).toBe(true);
    expect(recvB.some((m) => m.content === content)).toBe(true);
    expect(recvC.some((m) => m.content === content)).toBe(false);
  }, 45000);
});
