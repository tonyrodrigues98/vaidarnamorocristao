import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { V2CinemaFeature, type CinemaRepository } from "../src/v2/features/cinema";
import { getV2RuntimeRoute } from "../src/v2/integration/route-registry";

const emptyRepository: CinemaRepository = {
  async loadHub() {
    return {
      serverNow: "2026-07-23T12:00:00Z",
      featured: [],
      upcoming: [],
      history: [],
      gates: {
        uploadEnabled: false,
        publicPlaybackEnabled: false,
        legalApprovalRecorded: false,
      },
    };
  },
  async loadSession() {
    throw new Error("not used");
  },
  async applyControl() {
    throw new Error("not used");
  },
};

describe("V2-019 Cinema presentation boundaries", () => {
  it("is exposed through the canonical route registry", () => {
    expect(getV2RuntimeRoute("cinema")).toMatchObject({
      navigationId: "cinema",
      requiredDomain: "cinema",
      width: "fluid",
    });
  });

  it("remains SSR-safe and renders loading without touching a backend", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <V2CinemaFeature userId="user-1" repository={emptyRepository} />
      </QueryClientProvider>,
    );
    expect(html).toContain("Preparando a Sala de Cinema");
    expect(html).not.toMatch(/access_token|refresh_token|service_role/i);
  });

  it("keeps all public styles under the V2 theme scope", () => {
    const css = readFileSync(
      new URL("../src/v2/features/cinema/styles.css", import.meta.url),
      "utf8",
    );
    const selectors = css
      .split("{")
      .slice(0, -1)
      .map((part) => part.split("}").at(-1)?.trim())
      .filter((part): part is string => !!part && !part.startsWith("@"));
    expect(css).not.toMatch(/(^|[},]\s*)(:root|html|body)(?=[\s,{])/m);
    expect(
      selectors.filter((selector) => selector.includes(".vdn-v2-cinema")).length,
    ).toBeGreaterThan(0);
    expect(css).toContain(".vdn-v2[data-vdn-v2] .vdn-v2-cinema");
  });

  it("contains no media files in the Cinema source directory", () => {
    const barrel = readFileSync(
      new URL("../src/v2/features/cinema/index.ts", import.meta.url),
      "utf8",
    );
    expect(barrel).not.toMatch(/\.(mp4|mov|webm|m3u8|mpd|vtt)["']/i);
  });
});
