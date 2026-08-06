import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";

describe("auth, onboarding and document shells", () => {
  it.each([
    ["/manual", "public-manual", "Manual"],
    ["/termos", "public-terms", "Termos"],
  ])("gives authenticated documents profile chrome", (path, id, title) => {
    expect(getDestinationBehavior(path)).toMatchObject({ destinationId: id, futureTab: "profile" });
    expect(getNativeSecondaryDestinationChrome(id)).toMatchObject({
      title,
      parentTab: "profile",
      parentPath: "/perfil",
    });
  });

  it("applies the specialized auth shell without changing auth operations", () => {
    for (const route of ["login", "signup", "forgot-password", "reset-password"]) {
      const source = readFileSync(`src/routes/auth/${route}.tsx`, "utf8");
      expect(source).toContain("<AuthShell>");
    }
    expect(readFileSync("src/routes/auth/login.tsx", "utf8")).toContain("signInWithPassword");
    expect(readFileSync("src/routes/auth/signup.tsx", "utf8")).toContain("signUp");
    expect(readFileSync("src/routes/auth/forgot-password.tsx", "utf8")).toContain(
      "resetPasswordForEmail",
    );
    expect(readFileSync("src/routes/auth/reset-password.tsx", "utf8")).toContain("updateUser");
  });

  it("keeps onboarding logic inside its specialized shell", () => {
    expect(readFileSync("src/routes/onboarding/index.tsx", "utf8")).toContain("<OnboardingShell>");
    expect(readFileSync("src/routes/onboarding/etapa-2.tsx", "utf8")).toContain(
      "<OnboardingShell>",
    );
    expect(readFileSync("src/routes/onboarding/etapa-1.tsx", "utf8")).toContain('to="/onboarding"');
  });

  it("documents only truthful current navigation and mandatory legal review", () => {
    const manual = readFileSync("src/routes/manual.tsx", "utf8");
    for (const contract of [
      "Início — painel pessoal",
      "Chat geral, Orações, Notícias e Devocional",
      "Relacionamento opcional em Explorar",
      "não usa swipe nem percentual de compatibilidade",
      "Tema Sistema, Claro e Escuro",
    ])
      expect(manual).toContain(contract);

    const audit = readFileSync("docs/legal/terms-product-consistency-audit.md", "utf8");
    expect(audit).toContain("REQUIRES_HUMAN_LEGAL_REVIEW");
    expect(readFileSync("src/routes/termos.tsx", "utf8")).toContain("<DocumentShell>");
  });

  it("uses the public shell for install with the official brand asset", () => {
    expect(readFileSync("src/routes/instalar.tsx", "utf8")).toContain("<PublicShell>");
    expect(readFileSync("src/components/shells/AuthShell.tsx", "utf8")).toContain("<BrandLogo");
  });
});
