import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, anonClient, createUser, deleteUsers, type Ctx } from "./helpers";

let recipient: Ctx;
const queueIds: string[] = [];

beforeAll(async () => {
  recipient = await createUser("push-lease-recipient");
});

afterAll(async () => {
  if (queueIds.length > 0) {
    await admin.from("push_queue").delete().in("id", queueIds);
  }
  await deleteUsers(recipient);
});

async function enqueue() {
  const { data, error } = await admin
    .from("push_queue")
    .insert({
      user_id: recipient.userId,
      title: "Disposable push test",
      body: "No production data",
      url: "/inicio",
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("queue setup failed");
  queueIds.push(data.id);
  return data.id;
}

describe("atomic push capability in disposable Supabase", () => {
  it("denies claim and completion to anon and authenticated roles", async () => {
    const anonymous = anonClient();
    const [anonClaim, ownerClaim] = await Promise.all([
      anonymous.rpc(
        "claim_push_dispatch_batch" as never,
        {
          _batch_limit: 1,
          _lease_seconds: 60,
        } as never,
      ),
      recipient.client.rpc(
        "claim_push_dispatch_batch" as never,
        {
          _batch_limit: 1,
          _lease_seconds: 60,
        } as never,
      ),
    ]);

    expect(anonClaim.error).toBeTruthy();
    expect(ownerClaim.error).toBeTruthy();
  });

  it("gives a queued row to only one concurrent service-role claimant", async () => {
    const queueId = await enqueue();
    const [first, second] = await Promise.all([
      admin.rpc(
        "claim_push_dispatch_batch" as never,
        {
          _batch_limit: 1,
          _lease_seconds: 60,
        } as never,
      ),
      admin.rpc(
        "claim_push_dispatch_batch" as never,
        {
          _batch_limit: 1,
          _lease_seconds: 60,
        } as never,
      ),
    ]);
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();

    const claimed = [...((first.data ?? []) as any[]), ...((second.data ?? []) as any[])].filter(
      (row) => row.queue_id === queueId,
    );
    expect(claimed).toHaveLength(1);

    const row = claimed[0];
    const stale = await admin.rpc(
      "complete_push_dispatch_item" as never,
      {
        _queue_id: queueId,
        _lease_token: "00000000-0000-0000-0000-000000000000",
        _outcome: "success",
        _error_code: null,
      } as never,
    );
    expect(stale.error).toBeNull();
    expect(stale.data).toBe(false);

    const completed = await admin.rpc(
      "complete_push_dispatch_item" as never,
      {
        _queue_id: queueId,
        _lease_token: row.lease_token,
        _outcome: "success",
        _error_code: null,
      } as never,
    );
    expect(completed.error).toBeNull();
    expect(completed.data).toBe(true);
  });
});
