import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const backend = vi.hoisted(() => ({
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: backend,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: ComponentProps<"a"> & { to: string; children?: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: "/" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: null,
    isAdmin: false,
    role: null,
    isApproved: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/lib/theme", () => ({
  useTheme: () => ({ theme: "light", toggle: vi.fn() }),
}));

vi.mock("@/lib/notifications", () => ({
  useNotifications: () => ({ unread: 0 }),
}));

import { Header } from "../src/components/layout/Header";
import { NativeShellRuntimeProvider } from "../src/components/native-shell/NativeShellRuntimeContext";

describe("legacy Header suppression", () => {
  it("keeps the legacy header outside the native runtime", () => {
    const markup = renderToStaticMarkup(<Header />);
    expect(markup).toContain("<header");
    expect(markup).toContain("VaiDar");
  });

  it("returns null before legacy hooks, queries and channels mount in the native runtime", () => {
    backend.from.mockClear();
    backend.channel.mockClear();

    const markup = renderToStaticMarkup(
      <NativeShellRuntimeProvider active activeTab="home">
        <Header />
      </NativeShellRuntimeProvider>,
    );

    expect(markup).toBe("");
    expect(backend.from).not.toHaveBeenCalled();
    expect(backend.channel).not.toHaveBeenCalled();
  });

  it("keeps the wrapper hook unconditional and every legacy hook inside LegacyHeader", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/components/layout/Header.tsx", "utf8"),
    );
    const wrapper = source.slice(
      source.indexOf("export function Header"),
      source.indexOf("function LegacyHeader"),
    );
    const legacy = source.slice(source.indexOf("function LegacyHeader"));

    expect(wrapper).toContain("useNativeShellRuntime()");
    expect(wrapper).toContain("if (active) return null");
    expect(wrapper).not.toMatch(/useAuth|useEffect|useNotifications|supabase/);
    expect(legacy).toContain('channel("hdr-counters")');
    expect(legacy).toContain('to="/inicio"');
    expect(legacy).toContain('to="/perfil"');
  });
});
