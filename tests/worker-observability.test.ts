import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..");

function readJsonc(path: string) {
  const source = readFileSync(path, "utf8").replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(source) as Record<string, unknown>;
}

describe("Cloudflare Worker observability", () => {
  it("uses fields supported by the installed Wrangler schema", () => {
    const schema = readFileSync(join(repoRoot, "node_modules/wrangler/config-schema.json"), "utf8");
    expect(schema).toContain('"observability"');
    expect(schema).toContain('"invocation_logs"');
    expect(schema).toContain('"head_sampling_rate"');
  });

  it("persists sampled invocation and exception logs without deployment credentials", () => {
    const config = readJsonc(join(repoRoot, "wrangler.jsonc"));
    expect(config.observability).toEqual({
      enabled: true,
      logs: {
        enabled: true,
        head_sampling_rate: 0.1,
        invocation_logs: true,
        persist: true,
      },
    });
    expect(config).not.toHaveProperty("routes");
    expect(config).not.toHaveProperty("vars");
  });
});
