import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { brand } from "../src/config/brand";

describe("PWA manifest delivery", () => {
  it("keeps the branded manifest valid and self-contained", async () => {
    expect(brand.assets.manifest).toBe("/manifest.webmanifest");

    const source = await readFile("public/manifest.webmanifest", "utf8");
    const manifest = JSON.parse(source) as Record<string, unknown>;

    expect(manifest).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        short_name: expect.any(String),
        start_url: expect.any(String),
        display: expect.any(String),
        icons: expect.any(Array),
      }),
    );
  });

  it("declares the exact Cloudflare headers required by the manifest", async () => {
    const headers = await readFile("public/_headers", "utf8");

    expect(headers).toBe(
      [
        "/manifest.webmanifest",
        "  Content-Type: application/manifest+json; charset=utf-8",
        "  X-Content-Type-Options: nosniff",
        "",
      ].join("\n"),
    );
    expect(headers).toContain("Content-Type: application/manifest+json");
    expect(headers).toContain("X-Content-Type-Options: nosniff");
  });
});
