import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createUser, deleteUsers, sleep, type Ctx } from "./helpers";

let user: Ctx;

beforeAll(async () => {
  user = await createUser("realtime-probe");
}, 30000);

afterAll(async () => {
  await admin.from("release_validation_realtime_probe").delete().eq("owner_id", user.userId);
  await deleteUsers(user);
}, 30000);

describe("disposable Realtime infrastructure", () => {
  it("delivers a published permissive-table INSERT to its authenticated owner", async () => {
    const received: Array<{ marker?: string }> = [];
    const channel = user.client.channel(`release-validation-probe-${user.userId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "release_validation_realtime_probe",
        filter: `owner_id=eq.${user.userId}`,
      },
      (payload) => received.push(payload.new as { marker?: string }),
    );

    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status, error) => {
        if (status === "SUBSCRIBED") resolve();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(error ?? new Error(status));
        }
      });
    });

    const deadline = Date.now() + 20000;
    const attemptedMarkers: string[] = [];
    while (
      Date.now() < deadline &&
      !received.some((row) => row.marker && attemptedMarkers.includes(row.marker))
    ) {
      const marker = `probe-${Date.now()}-${attemptedMarkers.length}`;
      attemptedMarkers.push(marker);
      const { error } = await admin
        .from("release_validation_realtime_probe")
        .insert({ owner_id: user.userId, marker });
      expect(error).toBeNull();
      await sleep(500);
    }

    await user.client.removeChannel(channel);
    expect(received.some((row) => row.marker && attemptedMarkers.includes(row.marker))).toBe(true);
  }, 45000);
});
