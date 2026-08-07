import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("truthful public shell", () => {
  it("uses the official asset and an accessible responsive public menu", () => {
    const nav = read("src/components/PublicNav.tsx");
    expect(nav).toContain("brand.assets.icon192");
    expect(nav).toContain('aria-label="Navegação pública"');
    expect(nav).toContain('event.key === "Escape"');
    expect(nav).toContain("setOpen(false)");
    expect(nav).not.toContain("<Heart");
  });

  it.each([
    "sobre.tsx",
    "como-funciona.tsx",
    "depoimentos.tsx",
    "blog.index.tsx",
    "blog.$slug.tsx",
    "instalar.tsx",
  ])("wraps public route %s with PublicShell", (route) => {
    expect(read(`src/routes/${route}`)).toContain("<PublicShell>");
  });

  it("uses the entry splash as the root route", () => {
    const home = read("src/routes/index.tsx");
    expect(home).toContain("component: OrhaSplash");
    expect(home).not.toContain("<PublicShell>");
  });

  it("positions community first and dating as optional without absolute guarantees", () => {
    const about = read("src/routes/sobre.tsx");
    const how = read("src/routes/como-funciona.tsx");
    expect(about).toContain("comunidade cristã 18+");
    expect(how).toContain("não eliminam todos os riscos");
    expect(`${about}\n${how}`).not.toMatch(
      /aprovação em até 48|garantimos um ambiente|cada pessoa do outro lado é real/i,
    );
  });

  it("removes unverified testimonials and Review structured data", () => {
    const testimonials = read("src/routes/depoimentos.tsx");
    expect(testimonials).toContain("verificação e consentimento");
    expect(testimonials).not.toContain('"@type": "Review"');
    for (const unsupportedName of ["Pedro", "Mariana", "Lucas", "Beatriz", "Rafael", "Juliana"])
      expect(testimonials).not.toContain(unsupportedName);
  });

  it("keeps the static blog trust boundary and centralizes its URLs", () => {
    const post = read("src/routes/blog.$slug.tsx");
    expect(post).toContain("BLOG_POSTS");
    expect(post).toContain("dangerouslySetInnerHTML");
    expect(post).toContain("brand.origin");
    expect(post).toContain('"@type": "Article"');
  });
});
