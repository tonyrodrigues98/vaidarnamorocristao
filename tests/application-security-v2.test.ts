import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeTikTokProfileUrl,
  normalizeTrustedUrl,
  sanitizeBlogHtml,
} from "../src/lib/trustedContent";
import { buildSecurityHeaders, CONTENT_SECURITY_POLICY } from "../src/lib/securityHeaders.server";

describe("trusted URL boundary", () => {
  it("accepts normalized internal paths and exact allowed HTTPS origins", () => {
    expect(normalizeTrustedUrl("/v2/inicio?tab=1#top")).toBe("/v2/inicio?tab=1#top");
    expect(
      normalizeTrustedUrl("https://project.supabase.co/storage/v1/object/sign/file", {
        allowRelative: false,
        allowedOrigins: ["https://project.supabase.co"],
      }),
    ).toBe("https://project.supabase.co/storage/v1/object/sign/file");
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//attacker.test/file",
    "/\\attacker.test/file",
    "https://attacker.test/file",
    "not a url",
  ])("rejects unsafe, external or malformed media destination %s", (value) => {
    expect(
      normalizeTrustedUrl(value, {
        allowedOrigins: ["https://project.supabase.co"],
      }),
    ).toBeNull();
  });

  it("allows only canonical HTTPS TikTok profile hosts", () => {
    expect(normalizeTikTokProfileUrl("@comunidade")).toBe("https://www.tiktok.com/@comunidade");
    expect(normalizeTikTokProfileUrl("comunidade")).toBe("https://www.tiktok.com/@comunidade");
    expect(normalizeTikTokProfileUrl("http://www.tiktok.com/@comunidade")).toBeNull();
    expect(normalizeTikTokProfileUrl("https://attacker.test/@comunidade")).toBeNull();
  });
});

describe("blog HTML allowlist", () => {
  it("preserves the compatible article vocabulary", () => {
    const input = "<h2>Título</h2><p>Texto <strong>forte</strong> e <em>ênfase</em>.</p>";
    expect(sanitizeBlogHtml(input)).toBe(input);
  });

  it("removes executable blocks, event handlers, style, images and iframes", () => {
    const sanitized = sanitizeBlogHtml(
      '<script>alert(1)</script><style>body{display:none}</style><p onclick="run()" style="color:red">Seguro</p><img src=x onerror=run()><iframe src="https://attacker.test"></iframe>',
    );

    expect(sanitized).toBe("<p>Seguro</p>");
    expect(sanitized).not.toMatch(/script|style=|onclick|onerror|iframe|<img/i);
  });

  it("rejects javascript links and hardens accepted HTTPS links", () => {
    expect(sanitizeBlogHtml('<a href="javascript:alert(1)">ruim</a>')).toBe("ruim");
    expect(sanitizeBlogHtml('<a href="https://example.org/read">ler</a>')).toBe(
      '<a href="https://example.org/read" target="_blank" rel="noopener noreferrer">ler</a>',
    );
  });

  it("is SSR-safe and does not require window or document", () => {
    expect(() => sanitizeBlogHtml("<p>SSR</p>")).not.toThrow();
    const source = readFileSync(resolve("src/lib/trustedContent.ts"), "utf8");
    expect(source).not.toMatch(/\b(?:window|document|DOMParser)\b/);
  });
});

describe("defensive response headers", () => {
  it("defines restrictive production headers without deployment-specific mutation", () => {
    const headers = buildSecurityHeaders(true);
    expect(headers["Content-Security-Policy"]).toBe(CONTENT_SECURITY_POLICY);
    expect(headers["Strict-Transport-Security"]).toContain("max-age=31536000");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("keeps CSP compatible with current first-party runtime while closing frames and objects", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-src 'self' https://*.supabase.co");
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src 'self' https: wss:");
  });

  it("registers the request middleware once in the canonical start instance", () => {
    const start = readFileSync(resolve("src/start.ts"), "utf8");
    expect(start).toContain("requestMiddleware: [csrfMiddleware, securityHeadersMiddleware]");
    expect(start).toContain('handlerType === "serverFn"');
    expect(start.match(/securityHeadersMiddleware/g)).toHaveLength(2);
  });
});

describe("application sinks and environment boundary", () => {
  it("sanitizes blog content at the only dynamic article sink", () => {
    const blog = readFileSync(resolve("src/routes/blog.$slug.tsx"), "utf8");
    expect(blog).toContain("sanitizeBlogHtml(post.body)");
    expect(blog).not.toContain("__html: post.body");
  });

  it("requires an allowlisted URL and a sandbox for the verification iframe", () => {
    const verification = readFileSync(resolve("src/routes/admin/verificacoes.tsx"), "utf8");
    expect(verification).toContain("normalizeTrustedUrl(previewing.url");
    expect(verification).toContain("allowedOrigins: verificationMediaOrigins()");
    expect(verification).toContain('sandbox=""');
    expect(verification).toContain('referrerPolicy="no-referrer"');
    expect(verification).not.toContain("<iframe src={previewing.url}");
  });

  it("removes the tracked local environment file and publishes placeholders only", () => {
    expect(existsSync(resolve(".env"))).toBe(false);
    const example = readFileSync(resolve(".env.example"), "utf8");
    const assignments = example.split(/\r?\n/).filter((line) => /^[A-Z0-9_]+=/.test(line));
    expect(assignments.length).toBeGreaterThan(0);
    expect(assignments.every((line) => line.endsWith("="))).toBe(true);
    expect(assignments.join("\n")).not.toMatch(/SERVICE_ROLE|PUSH_DISPATCH_SECRET|VAPID_PRIVATE/i);

    const gitignore = readFileSync(resolve(".gitignore"), "utf8");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain("!.env.example");
  });
});
