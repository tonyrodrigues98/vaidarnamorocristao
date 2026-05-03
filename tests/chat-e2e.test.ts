import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { admin, createUser, deleteUsers, type Ctx } from "./helpers";

let A: Ctx, B: Ctx, C: Ctx;
let matchId: string | null = null;
let firstMessageId: string | null = null;

beforeAll(async () => {
  [A, B, C] = await Promise.all([createUser("e2e-a"), createUser("e2e-b"), createUser("e2e-c")]);
}, 30000);

afterAll(async () => {
  if (matchId) {
    await admin.from("messages").delete().eq("match_id", matchId);
    await admin.from("matches").delete().eq("id", matchId);
  }
  await admin.from("interests").delete().in("sender_id", [A.userId, B.userId]);
  await deleteUsers(A, B, C);
}, 30000);

describe("E2E chat flow — match → mensagem → conversas → ler → marcar como lida", () => {
  it("A demonstra interesse em B", async () => {
    const { error } = await A.client
      .from("interests")
      .insert({ sender_id: A.userId, receiver_id: B.userId });
    expect(error).toBeNull();
  });

  it("B retribui interesse → match é criado por trigger", async () => {
    const { error } = await B.client
      .from("interests")
      .insert({ sender_id: B.userId, receiver_id: A.userId });
    expect(error).toBeNull();

    const [u1, u2] = A.userId < B.userId ? [A.userId, B.userId] : [B.userId, A.userId];
    const { data } = await admin
      .from("matches")
      .select("id")
      .eq("user_a", u1)
      .eq("user_b", u2)
      .single();
    expect(data?.id).toBeDefined();
    matchId = data!.id;
  });

  it("A envia mensagem no match", async () => {
    expect(matchId).not.toBeNull();
    const { data, error } = await A.client
      .from("messages")
      .insert({ match_id: matchId!, sender_id: A.userId, content: "oi B!" })
      .select("id")
      .single();
    expect(error).toBeNull();
    firstMessageId = data!.id;
  });

  it("B lista conversas e vê o match", async () => {
    const { data, error } = await B.client.from("matches").select("id");
    expect(error).toBeNull();
    expect(data?.map((r) => r.id)).toContain(matchId);
  });

  it("C não vê o match na listagem", async () => {
    const { data, error } = await C.client.from("matches").select("id").eq("id", matchId!);
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(0);
  });

  it("B abre a conversa e vê a mensagem de A", async () => {
    const { data, error } = await B.client
      .from("messages")
      .select("id, content, sender_id")
      .eq("match_id", matchId!);
    expect(error).toBeNull();
    expect(data?.[0]?.content).toBe("oi B!");
  });

  it("C não consegue abrir a conversa", async () => {
    const { data } = await C.client
      .from("messages")
      .select("id")
      .eq("match_id", matchId!);
    expect((data ?? []).length).toBe(0);
  });

  it("B marca a mensagem como lida via RPC", async () => {
    const { error } = await B.client.rpc("mark_message_read", { _message_id: firstMessageId! });
    expect(error).toBeNull();
    const { data } = await admin
      .from("messages")
      .select("read_at")
      .eq("id", firstMessageId!)
      .single();
    expect(data?.read_at).not.toBeNull();
  });

  it("C não consegue marcar como lida", async () => {
    // reset
    await admin.from("messages").update({ read_at: null }).eq("id", firstMessageId!);
    await C.client.rpc("mark_message_read", { _message_id: firstMessageId! });
    const { data } = await admin
      .from("messages")
      .select("read_at")
      .eq("id", firstMessageId!)
      .single();
    expect(data?.read_at).toBeNull();
  });

  it("unmatch RPC remove match e mensagens", async () => {
    const { error } = await A.client.rpc("unmatch", { _match_id: matchId! });
    expect(error).toBeNull();
    const { data: msgs } = await admin.from("messages").select("id").eq("match_id", matchId!);
    const { data: mt } = await admin.from("matches").select("id").eq("id", matchId!).maybeSingle();
    expect((msgs ?? []).length).toBe(0);
    expect(mt).toBeNull();
    matchId = null;
    firstMessageId = null;
  });
});