import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({ active: false }));

vi.mock("@/components/native-shell/NativeShellRuntimeContext", () => ({
  useNativeShellRuntime: () => runtime,
}));

import { MobileAppHeader } from "../src/components/mobile/MobileAppHeader";

describe("MobileAppHeader suppression", () => {
  it("preserves every legacy prop outside the native runtime", () => {
    runtime.active = false;
    const markup = renderToStaticMarkup(
      <MobileAppHeader
        title="Conversas"
        subtitle="Mensagens e comunidade"
        showBack
        rightAction={<span>Ação</span>}
        className="custom-header"
      />,
    );

    expect(markup).toContain("<header");
    expect(markup).toContain("Conversas");
    expect(markup).toContain("Mensagens e comunidade");
    expect(markup).toContain("Ação");
    expect(markup).toContain("custom-header");
  });

  it("returns null before the legacy mobile chrome mounts inside Native Shell", () => {
    runtime.active = true;
    expect(renderToStaticMarkup(<MobileAppHeader title="Conversas" />)).toBe("");
    runtime.active = false;
  });

  it("keeps the direct runtime import and the legacy implementation unchanged in scope", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/components/mobile/MobileAppHeader.tsx", "utf8"),
    );
    const wrapper = source.slice(
      source.indexOf("export function MobileAppHeader"),
      source.indexOf("function LegacyMobileAppHeader"),
    );

    expect(source).toContain("@/components/native-shell/NativeShellRuntimeContext");
    expect(wrapper).toContain("if (active) return null");
    expect(wrapper).toContain("<LegacyMobileAppHeader {...props} />");
  });
});
