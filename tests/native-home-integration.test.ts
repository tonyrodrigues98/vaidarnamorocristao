import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  getNativeInicioPriority,
  type NativeInicioViewModel,
} from "../src/components/home/native/NativeInicioView";

const routeSource = readFileSync("src/routes/inicio.tsx", "utf8");
const viewSource = readFileSync("src/components/home/native/NativeInicioView.tsx", "utf8");

function model(overrides: Partial<NativeInicioViewModel> = {}): NativeInicioViewModel {
  return {
    status: "approved",
    firstName: "Ana",
    greeting: "Bom dia, Ana",
    greetingDetail: "Uma nova jornada.",
    bannedReason: null,
    rejectionReason: null,
    warnings: [],
    requests: [],
    latestAppeal: null,
    latestRejectionAppeal: null,
    canAppeal: false,
    canReverify: false,
    appealText: "",
    appealBusy: false,
    devotional: null,
    strength: 100,
    strengthLabel: "Completo",
    nextProfileAction: null,
    unreadConversations: 0,
    newProfiles: 0,
    suggestion: null,
    commitment: null,
    onAppealTextChange: vi.fn(),
    onAcknowledgeWarning: vi.fn(),
    onResolveRequest: vi.fn(),
    onSubmitAppeal: vi.fn(),
    ...overrides,
  };
}

describe("T46-11 native home integration", () => {
  it("keeps one data layer and selects presentation from runtime context", () => {
    expect(routeSource).toContain("useNativeShellRuntime()");
    expect(routeSource).toContain("if (nativeShellActive)");
    expect(routeSource).toContain("<NativeInicioView model={nativeModel} />");
    expect(routeSource.match(/function InicioPage/g)).toHaveLength(1);
    expect(viewSource).not.toMatch(/supabase|\.from\(|\.rpc\(|\.channel\(/);
  });

  it("preserves the legacy presentation and its operational handlers", () => {
    expect(routeSource).toContain("<Header />");
    expect(routeSource).toContain('supabase.rpc("request_reverification"');
    expect(routeSource).toContain('from("user_admin_warnings")');
    expect(routeSource).toContain('from("user_admin_requests")');
    expect(viewSource).toContain("onAcknowledgeWarning");
    expect(viewSource).toContain("onResolveRequest");
    expect(viewSource).toContain("onSubmitAppeal");
  });

  it("uses deterministic critical-state ordering", () => {
    expect(
      getNativeInicioPriority(
        model({
          status: "banned",
          warnings: [{ id: "w", message: "warning", severity: "severe" }],
        }),
      ).eyebrow,
    ).toBe("Conta suspensa");
    expect(getNativeInicioPriority(model({ status: "rejected" })).eyebrow).toBe(
      "Perfil precisa de revisão",
    );
    expect(
      getNativeInicioPriority(
        model({
          warnings: [{ id: "w", message: "warning", severity: "severe" }],
          requests: [{ id: "r", kind: "photo", message: "request", createdAt: "2026-01-01" }],
        }),
      ).eyebrow,
    ).toBe("Moderação");
    expect(
      getNativeInicioPriority(
        model({
          requests: [{ id: "r", kind: "photo", message: "request", createdAt: "2026-01-01" }],
        }),
      ).eyebrow,
    ).toBe("Solicitação da equipe");
    expect(getNativeInicioPriority(model({ status: "pending" })).eyebrow).toBe("Perfil em análise");
  });

  it("prioritizes purpose, profile completion and devotional after critical states", () => {
    expect(
      getNativeInicioPriority(model({ commitment: { matchId: "m", partnerName: "João", days: 2 } }))
        .eyebrow,
    ).toBe("Propósito ativo");
    expect(
      getNativeInicioPriority(
        model({
          strength: 70,
          nextProfileAction: { title: "Complete", description: "Add bio" },
        }),
      ).progress,
    ).toBe(70);
    expect(
      getNativeInicioPriority(
        model({
          devotional: { title: "Fé", bibleReference: "Hb 11:1", bibleText: "Texto" },
        }),
      ).to,
    ).toBe("/devocional");
  });

  it("contains exactly the four approved shortcuts and honest conditional sections", () => {
    const shortcutsBlock = viewSource.slice(
      viewSource.indexOf("const shortcuts"),
      viewSource.indexOf("export function NativeInicioView"),
    );
    expect(shortcutsBlock.match(/label:/g)).toHaveLength(4);
    for (const path of ["/comunidade", "/explorar", "/conversas", "/perfil"]) {
      expect(shortcutsBlock).toContain(`to: "${path}"`);
    }
    expect(viewSource).toContain("model.unreadConversations > 0 || model.commitment");
    expect(viewSource).toContain("model.suggestion || model.newProfiles > 0");
    expect(viewSource).toContain("Nenhum devocional foi publicado para hoje.");
    expect(viewSource).not.toContain("disponível em breve");
  });

  it("has no duplicated mini header, fictional data or visual-only theme assumptions", () => {
    expect(viewSource).not.toMatch(/<Header|MobileAppHeader|Notificaç.*badge|compatibilidade/);
    expect(viewSource).toContain("bg-card");
    expect(viewSource).toContain("text-foreground");
    expect(viewSource).not.toMatch(/bg-\[linear-gradient|min-h-\[58dvh\]/);
  });
});
