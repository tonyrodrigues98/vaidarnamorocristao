import { describe, expect, it } from "vitest";
import { resolvePushPublicKey } from "@/lib/pushPublicKey.server";
import { VAPID_PUBLIC_KEY } from "@/lib/pushVapid";

describe("push public key resolution", () => {
  it("uses the configured VAPID public key when private dispatch is available", async () => {
    await expect(
      resolvePushPublicKey(async () => ({ publicKey: "configured-public-key" })),
    ).resolves.toBe("configured-public-key");
  });

  it("uses the publishable fallback when the preview has no private dispatch key", async () => {
    await expect(
      resolvePushPublicKey(async () => {
        throw new Error("WEB_PUSH_PRIVATE_KEY missing");
      }),
    ).resolves.toBe(VAPID_PUBLIC_KEY);
  });

  it("does not hide unrelated server errors", async () => {
    await expect(
      resolvePushPublicKey(async () => {
        throw new Error("unexpected push failure");
      }),
    ).rejects.toThrow("unexpected push failure");
  });
});
