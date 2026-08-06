import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  isolatePrivateQueryCache,
  isProvenPublicQueryKey,
  shouldRemoveQueryAtAuthBoundary,
} from "../src/v2/app/auth/private-cache";

describe("V2 private cache isolation", () => {
  it("treats audited user and admin query keys as private", () => {
    expect(shouldRemoveQueryAtAuthBoundary(["profile-main", "user-a"])).toBe(true);
    expect(shouldRemoveQueryAtAuthBoundary(["user-balance", "user-a"])).toBe(true);
    expect(shouldRemoveQueryAtAuthBoundary(["pet-arcade", "admin", "metrics"])).toBe(true);
    expect(isProvenPublicQueryKey(["shop-catalog"])).toBe(false);
  });

  it("removes prior-user queries and mutations at an auth boundary", async () => {
    const client = new QueryClient();
    client.setQueryData(["profile-main", "user-a"], { fullName: "A" });
    client.setQueryData(["user-balance", "user-a"], 100);
    client.getMutationCache().build(client, {
      mutationFn: async () => "done",
      mutationKey: ["update-profile", "user-a"],
    });

    isolatePrivateQueryCache(client);
    await Promise.resolve();

    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
});
