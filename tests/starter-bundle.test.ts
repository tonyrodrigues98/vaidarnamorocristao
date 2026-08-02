/**
 * Integração: claim_starter_bundle
 *
 * Cobre:
 *  - exige usuário autenticado (chamada anônima falha)
 *  - primeiro claim retorna ok=true, grava linha em user_starter_bundle,
 *    audita em coin_transactions e credita moedas + XP
 *  - segundo claim do mesmo usuário retorna ok=false (already_claimed)
 *  - claims paralelos do mesmo usuário só concedem 1 vez (trava por advisory lock)
 *  - claims de usuários diferentes são independentes
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { admin, anonClient, createUser, deleteUsers, type Ctx } from "./helpers";

async function callClaim(ctx: Ctx) {
  return ctx.client.rpc("claim_starter_bundle");
}

describe("claim_starter_bundle — integração", () => {
  const users: Ctx[] = [];

  beforeAll(async () => {
    users.push(await createUser("starter-a"));
    users.push(await createUser("starter-b"));
    users.push(await createUser("starter-c"));
  }, 30_000);

  afterAll(async () => {
    await deleteUsers(...users);
  }, 30_000);

  it("rejeita chamada anônima", async () => {
    const anon = anonClient();
    const { data, error } = await anon.rpc("claim_starter_bundle");
    // Erro do Postgres ou ok=false; em qualquer caso NÃO pode resolver para ok=true.
    if (error) {
      expect(error).toBeTruthy();
    } else {
      expect((data as { ok?: boolean })?.ok).not.toBe(true);
    }
  });

  it("primeiro claim credita coins, XP e registra histórico", async () => {
    const u = users[0];
    const { data, error } = await callClaim(u);
    expect(error).toBeNull();
    const res = data as {
      ok: boolean;
      coins_granted: number;
      xp_granted: number;
      new_balance: number;
    };
    expect(res.ok).toBe(true);
    expect(res.xp_granted).toBe(200);
    // coins_granted pode ser <300 se já estava perto do teto de 500;
    // como o usuário acabou de ser criado, o crédito completo deve ocorrer.
    expect(res.coins_granted).toBeGreaterThan(0);
    expect(res.coins_granted).toBeLessThanOrEqual(300);
    expect(res.new_balance).toBeGreaterThanOrEqual(res.coins_granted);

    // linha gravada (idempotência)
    const bundle = await admin
      .from("user_starter_bundle")
      .select("user_id, coins_granted, xp_granted")
      .eq("user_id", u.userId);
    expect(bundle.error).toBeNull();
    expect(bundle.data?.length).toBe(1);

    // auditoria em coin_transactions
    const tx = await admin
      .from("coin_transactions")
      .select("kind, direction, amount")
      .eq("user_id", u.userId)
      .eq("kind", "starter_bundle");
    expect(tx.error).toBeNull();
    expect(tx.data?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(tx.data?.[0]?.direction).toBe("in");
  }, 30_000);

  it("segundo claim sequencial retorna already_claimed e não duplica linha", async () => {
    const u = users[0]; // já fez claim no teste anterior
    const { data, error } = await callClaim(u);
    expect(error).toBeNull();
    const res = data as { ok: boolean; reason?: string };
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("already_claimed");

    const bundle = await admin
      .from("user_starter_bundle")
      .select("user_id")
      .eq("user_id", u.userId);
    expect(bundle.data?.length).toBe(1);
  }, 30_000);

  it("claims paralelos do mesmo usuário concedem apenas uma vez", async () => {
    const u = users[1];
    const results = await Promise.all([callClaim(u), callClaim(u), callClaim(u), callClaim(u)]);
    const oks = results.map((r) => r.data as { ok: boolean } | null).filter((r) => r?.ok === true);
    expect(oks.length).toBe(1);

    const bundle = await admin
      .from("user_starter_bundle")
      .select("user_id")
      .eq("user_id", u.userId);
    expect(bundle.data?.length).toBe(1);

    const tx = await admin
      .from("coin_transactions")
      .select("id")
      .eq("user_id", u.userId)
      .eq("kind", "starter_bundle");
    expect(tx.data?.length).toBe(1);
  }, 60_000);

  it("claims de usuários diferentes são independentes", async () => {
    const u = users[2];
    const { data, error } = await callClaim(u);
    expect(error).toBeNull();
    expect((data as { ok: boolean }).ok).toBe(true);

    // O usuário 1 (paralelo) e o 2 (independente) devem ambos ter linha própria.
    const all = await admin
      .from("user_starter_bundle")
      .select("user_id")
      .in(
        "user_id",
        users.map((x) => x.userId),
      );
    expect(all.data?.length).toBe(users.length);
  }, 30_000);
});
