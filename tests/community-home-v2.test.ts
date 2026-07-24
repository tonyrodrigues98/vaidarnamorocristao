import { describe, expect, it } from "vitest";
import {
  COMMUNITY_AUDIENCES,
  COMMUNITY_HOME_QUERY_BUDGET,
  isCommunityAudience,
  parseCommunityCursor,
  resolveCommunityHomeViewState,
  sanitizeCommunityAudience,
  sanitizeCommunityBody,
  statusRemainingLabel,
} from "../src/v2/features/home/contracts";

describe("V2-010 community home contracts", () => {
  it("keeps the home aggregator within an explicit two-request budget", () => {
    expect(COMMUNITY_HOME_QUERY_BUDGET).toEqual({
      aggregator: 1,
      mediaSigning: 1,
      total: 2,
      pageSize: 20,
    });
  });

  it("accepts only semantic audience values", () => {
    expect(COMMUNITY_AUDIENCES).toEqual(["community", "followers", "connections", "private"]);
    expect(isCommunityAudience("connections")).toBe(true);
    expect(isCommunityAudience("matches")).toBe(false);
    expect(sanitizeCommunityAudience("matches")).toBe("community");
  });

  it("uses stable timestamp and id cursors", () => {
    expect(
      parseCommunityCursor({
        createdAt: "2026-07-23T10:00:00.000Z",
        id: "81b46d65-c07b-4f85-83fc-1507e28cf510",
      }),
    ).toEqual({
      createdAt: "2026-07-23T10:00:00.000Z",
      id: "81b46d65-c07b-4f85-83fc-1507e28cf510",
    });
    expect(parseCommunityCursor({ createdAt: "invalid", id: "short" })).toBeNull();
  });

  it("sanitizes text before repository commands", () => {
    expect(sanitizeCommunityBody("  caminhar junto  ", 100)).toBe("caminhar junto");
    expect(sanitizeCommunityBody("abcdef", 3)).toBe("abc");
  });

  it("distinguishes offline from server failure without releasing stale private data", () => {
    expect(
      resolveCommunityHomeViewState({ loading: false, error: true, online: false, itemCount: 0 }),
    ).toBe("offline");
    expect(
      resolveCommunityHomeViewState({ loading: false, error: true, online: true, itemCount: 0 }),
    ).toBe("error");
  });

  it("covers loading, empty and ready states", () => {
    expect(
      resolveCommunityHomeViewState({ loading: true, error: false, online: true, itemCount: 0 }),
    ).toBe("loading");
    expect(
      resolveCommunityHomeViewState({ loading: false, error: false, online: true, itemCount: 0 }),
    ).toBe("empty");
    expect(
      resolveCommunityHomeViewState({ loading: false, error: false, online: true, itemCount: 1 }),
    ).toBe("ready");
  });

  it("describes the remaining 24-hour window without negative values", () => {
    const now = Date.parse("2026-07-23T10:00:00.000Z");
    expect(statusRemainingLabel("2026-07-24T10:00:00.000Z", now)).toBe("24 h");
    expect(statusRemainingLabel("2026-07-23T10:10:00.000Z", now)).toBe("menos de 1 h");
    expect(statusRemainingLabel("2026-07-22T10:00:00.000Z", now)).toBe("menos de 1 h");
  });
});
