import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  throw new Error("Missing SUPABASE_URL / PUBLISHABLE_KEY / SERVICE_ROLE_KEY env vars");
}

export const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 20 } },
});

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
}

export type Ctx = {
  userId: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

export async function createUser(label: string, opts?: { status?: string }): Promise<Ctx> {
  const email = `t-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
  const password = "Test12345!";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("no user");
  const userId = data.user.id;

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
    status: opts?.status ?? "approved",
  });
  if (pErr) throw pErr;

  const client = anonClient();
  const { error: sErr } = await client.auth.signInWithPassword({ email, password });
  if (sErr) throw sErr;
  return { userId, email, password, client };
}

export async function deleteUsers(...ctxs: (Ctx | undefined)[]) {
  for (const u of ctxs) {
    if (u?.userId) {
      try {
        await admin.auth.admin.deleteUser(u.userId);
      } catch {
        /* ignore */
      }
    }
  }
}

export async function grantRole(userId: string, role: string) {
  await admin.from("user_roles").insert({ user_id: userId, role }).select();
}

export async function createMatch(aId: string, bId: string): Promise<string> {
  const [u1, u2] = aId < bId ? [aId, bId] : [bId, aId];
  const { data, error } = await admin
    .from("matches")
    .insert({ user_a: u1, user_b: u2 })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id as string;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
