import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL / PUBLISHABLE_KEY / SERVICE_ROLE_KEY env vars");
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function clientFor(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Ctx = {
  userId: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

async function createUser(label: string): Promise<Ctx> {
  const email = `rls-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  const password = "Test12345!";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("no user");
  const userId = data.user.id;

  // Insert approved profile via service role (bypasses RLS).
  const { error: pErr } = await admin.from("profiles").insert({
    id: userId,
    full_name: `Test ${label}`,
    age: 30,
    sex: "masculino",
    marital: "solteiro",
    city: "City",
    state: "SP",
    church: "Test",
    years_baptized: 5,
    status: "approved",
  });
  if (pErr) throw pErr;

  const client = clientFor();
  const { error: sErr } = await client.auth.signInWithPassword({ email, password });
  if (sErr) throw sErr;
  return { userId, email, password, client };
}

let A: Ctx, B: Ctx, C: Ctx;
let matchId: string;
let msgFromA: string;

beforeAll(async () => {
  [A, B, C] = await Promise.all([createUser("a"), createUser("b"), createUser("c")]);

  // Create match A-B (ordered) using service role to bypass insert restrictions.
  const [u1, u2] = A.userId < B.userId ? [A.userId, B.userId] : [B.userId, A.userId];
  const { data: m, error: mErr } = await admin
    .from("matches")
    .insert({ user_a: u1, user_b: u2 })
    .select("id")
    .single();
  if (mErr) throw mErr;
  matchId = m.id;

  // A sends a message in match
  const { data: msg, error: msgErr } = await admin
    .from("messages")
    .insert({ match_id: matchId, sender_id: A.userId, content: "olá B" })
    .select("id")
    .single();
  if (msgErr) throw msgErr;
  msgFromA = msg.id;
}, 30000);

afterAll(async () => {
  await admin.from("messages").delete().eq("match_id", matchId);
  await admin.from("matches").delete().eq("id", matchId);
  for (const u of [A, B, C]) {
    if (u?.userId) await admin.auth.admin.deleteUser(u.userId);
  }
}, 30000);

describe("messages RLS — leitura restrita aos participantes do match", () => {
  it("participante A vê mensagens do match", async () => {
    const { data, error } = await A.client.from("messages").select("id").eq("match_id", matchId);
    expect(error).toBeNull();
    expect(data?.map((r) => r.id)).toContain(msgFromA);
  });

  it("participante B vê mensagens do match", async () => {
    const { data, error } = await B.client.from("messages").select("id").eq("match_id", matchId);
    expect(error).toBeNull();
    expect(data?.map((r) => r.id)).toContain(msgFromA);
  });

  it("usuário externo C não vê mensagens do match", async () => {
    const { data, error } = await C.client.from("messages").select("id").eq("match_id", matchId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});

describe("messages RLS — escrita restrita ao remetente participante", () => {
  it("C não pode inserir mensagem em match alheio", async () => {
    const { error } = await C.client
      .from("messages")
      .insert({ match_id: matchId, sender_id: C.userId, content: "intruso" });
    expect(error).not.toBeNull();
  });

  it("A não pode forjar sender_id de outro usuário", async () => {
    const { error } = await A.client
      .from("messages")
      .insert({ match_id: matchId, sender_id: B.userId, content: "spoof" });
    expect(error).not.toBeNull();
  });

  it("B não pode editar conteúdo de mensagem de A", async () => {
    const { data, error } = await B.client
      .from("messages")
      .update({ content: "hacked" })
      .eq("id", msgFromA)
      .select("id");
    // either explicit error or zero rows touched
    expect(error !== null || (data ?? []).length === 0).toBe(true);

    const { data: row } = await admin
      .from("messages")
      .select("content")
      .eq("id", msgFromA)
      .single();
    expect(row?.content).toBe("olá B");
  });

  it("B não pode deletar mensagem de A", async () => {
    const { data } = await B.client.from("messages").delete().eq("id", msgFromA).select("id");
    expect((data ?? []).length).toBe(0);
    const { data: row } = await admin
      .from("messages")
      .select("id")
      .eq("id", msgFromA)
      .maybeSingle();
    expect(row?.id).toBe(msgFromA);
  });
});

describe("read receipts (mark_message_read RPC)", () => {
  it("C (não-participante) não marca mensagem como lida", async () => {
    await C.client.rpc("mark_message_read", { _message_id: msgFromA });
    const { data } = await admin.from("messages").select("read_at").eq("id", msgFromA).single();
    expect(data?.read_at).toBeNull();
  });

  it("A (remetente) não pode marcar a própria mensagem como lida", async () => {
    await A.client.rpc("mark_message_read", { _message_id: msgFromA });
    const { data } = await admin.from("messages").select("read_at").eq("id", msgFromA).single();
    expect(data?.read_at).toBeNull();
  });

  it("B (destinatário) marca como lida com sucesso", async () => {
    const { error } = await B.client.rpc("mark_message_read", { _message_id: msgFromA });
    expect(error).toBeNull();
    const { data } = await admin.from("messages").select("read_at").eq("id", msgFromA).single();
    expect(data?.read_at).not.toBeNull();
  });

  it("UPDATE direto em read_at por não-remetente é bloqueado pela RLS", async () => {
    // policy só permite UPDATE pelo sender_id; B não pode atualizar diretamente.
    const { data } = await B.client
      .from("messages")
      .update({ read_at: null })
      .eq("id", msgFromA)
      .select("id");
    expect((data ?? []).length).toBe(0);
  });
});

describe("global_messages — moderação server-side de palavras restritas", () => {
  it("trigger bloqueia inserção contendo palavra restrita", async () => {
    const { error } = await A.client
      .from("global_messages")
      .insert({ sender_id: A.userId, content: "seu pinto é grande" });
    expect(error).not.toBeNull();
  });

  it("mensagem limpa é aceita", async () => {
    const { data, error } = await A.client
      .from("global_messages")
      .insert({ sender_id: A.userId, content: "boa tarde irmãos" })
      .select("id")
      .single();
    expect(error).toBeNull();
    if (data?.id) await admin.from("global_messages").delete().eq("id", data.id);
  });
});
