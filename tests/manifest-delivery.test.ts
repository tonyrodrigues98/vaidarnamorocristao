import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("PWA manifest delivery", () => {
  it("keeps the structural manifest valid and free of visual assets", async () => {
    const source = await readFile("public/manifest.webmanifest", "utf8");
    const manifest = JSON.parse(source) as Record<string, unknown>;

    expect(manifest).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        short_name: expect.any(String),
        start_url: "/",
        display: expect.any(String),
      }),
    );
    expect(manifest.icons).toBeUndefined();
    expect(manifest.shortcuts).toBeUndefined();
    expect(manifest.theme_color).toBeUndefined();
    expect(manifest.background_color).toBeUndefined();
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
  });
});
