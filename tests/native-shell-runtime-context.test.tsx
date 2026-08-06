import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  NativeShellRuntimeProvider,
  useNativeShellRuntime,
} from "../src/components/native-shell/NativeShellRuntimeContext";

function RuntimeProbe() {
  const runtime = useNativeShellRuntime();
  return (
    <output data-active={String(runtime.active)} data-active-tab={runtime.activeTab}>
      runtime
    </output>
  );
}

describe("NativeShellRuntimeContext", () => {
  it("defaults to an inactive runtime outside its local provider", () => {
    const markup = renderToStaticMarkup(<RuntimeProbe />);
    expect(markup).toContain('data-active="false"');
    expect(markup).not.toContain("data-active-tab");
  });

  it("provides the active primary tab without effects, auth, router, backend or V2", async () => {
    const markup = renderToStaticMarkup(
      <NativeShellRuntimeProvider active activeTab="community">
        <RuntimeProbe />
      </NativeShellRuntimeProvider>,
    );
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/components/native-shell/NativeShellRuntimeContext.tsx", "utf8"),
    );

    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('data-active-tab="community"');
    expect(source).not.toMatch(
      /useEffect|useLayoutEffect|useLocation|useAuth|supabase|feature.flag|Header|@\/v2/i,
    );
  });
});
