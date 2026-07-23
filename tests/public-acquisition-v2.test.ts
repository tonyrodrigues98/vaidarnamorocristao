import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const readProjectFile = (path: string) => readFileSync(join(projectRoot, path), "utf8");

const landing = readProjectFile("src/components/home/CommunityAcquisitionLanding.tsx");
const publicNav = readProjectFile("src/components/PublicNav.tsx");
const homeRoute = readProjectFile("src/routes/index.tsx");
const liveHero = readProjectFile("src/components/home/CarenLiveHero.tsx");
const rootRoute = readProjectFile("src/routes/__root.tsx");
const signupRoute = readProjectFile("src/routes/auth/signup.tsx");
const manifest = JSON.parse(readProjectFile("public/manifest.webmanifest")) as {
  description: string;
  background_color: string;
  theme_color: string;
  shortcuts: Array<{ name: string; url: string }>;
};

describe("V2-009 community-first public acquisition", () => {
  it("positions the community before the preserved live experience", () => {
    expect(homeRoute).toContain("<PublicNav />");
    expect(homeRoute.indexOf("<CommunityAcquisitionLanding />")).toBeLessThan(
      homeRoute.indexOf("<CarenLiveHero embedded />"),
    );

    for (const preservedSection of [
      "LiveHowItWorksSection",
      "LiveTeamSection",
      "LiveParticipationSection",
      "LiveMonthlyTop3Section",
      "CommunityPlatformSection",
      "LiveFaqSection",
      "FinalLiveCtaSection",
    ]) {
      expect(homeRoute).toContain(`<${preservedSection}`);
    }
  });

  it("keeps community entry, account creation and the Caren live as distinct actions", () => {
    expect(landing).toContain("Acessar comunidade");
    expect(landing).toContain("Criar minha conta");
    expect(landing).toContain("Participar da live");
    expect(landing).toContain("Participar da comunidade não ativa o Modo Namoro.");
    expect(landing).toContain('target="_blank"');
    expect(landing).toContain('rel="noopener noreferrer"');
    expect(publicNav).toContain("PUBLIC_COMMUNITY_ROUTE");
    expect(publicNav).toContain("CAREN_TIKTOK_LIVE_URL");
  });

  it("keeps the acquisition components free of backend, auth and environment coupling", () => {
    for (const source of [landing, publicNav]) {
      expect(source).not.toMatch(/supabase|useAuth|process\.env|import\.meta\.env|fetch\s*\(/i);
    }
    expect(landing).not.toMatch(/\bHeart\b/);
    expect(publicNav).not.toMatch(/\bHeart\b/);
  });

  it("preserves the live target and supports the embedded acquisition composition", () => {
    expect(liveHero).toContain("CAREN_TIKTOK_LIVE_URL");
    expect(liveHero).toContain("embedded = false");
    expect(liveHero).toContain('id={embedded ? "experiencia-live" : undefined}');
    expect(liveHero).toContain("{embedded ? null : <LiveTopNav />}");
  });

  it("makes global and signup copy community-first without automatic Dating activation", () => {
    expect(rootRoute).toContain("Comunidade cristã para caminhar junto");
    expect(rootRoute).toContain("O Namoro é uma área opcional.");
    expect(rootRoute).not.toContain("plataforma cristã de relacionamentos sérios");
    expect(signupRoute).toContain("O Modo Namoro é opcional.");
    expect(signupRoute).not.toMatch(/datingState|activateDating|pretendentes/i);
  });

  it("keeps the installable entry community-first and removes universal Dating shortcuts", () => {
    expect(manifest.description.toLowerCase()).toContain("comunidade");
    expect(manifest.background_color).toBe("#f7f7f5");
    expect(manifest.theme_color).toBe("#5b21b6");
    expect(manifest.shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "/inicio" }),
        expect.objectContaining({ url: "/comunidade" }),
      ]),
    );
    expect(manifest.shortcuts.map((shortcut) => shortcut.url)).not.toContain("/pretendentes");
  });
});
