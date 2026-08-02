import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync("src/routes/perfil.tsx", "utf8");
const tabsSource = readFileSync("src/components/profile/native/NativeProfileTabs.tsx", "utf8");
const cssSource = readFileSync("src/styles/native-profile.css", "utf8");

describe("T46-16 native profile workspace", () => {
  it("keeps one profile data layer and chooses one presentation surface", () => {
    expect(routeSource.match(/const profileMainQuery = useQuery/g)).toHaveLength(1);
    expect(routeSource).toContain("useNativeShellRuntime()");
    expect(routeSource).toContain("data-vdn-native-profile");
    expect(routeSource).toContain("!nativeShellActive && <Header />");
    expect(routeSource).toContain("nativeShellActive && (");
    expect(tabsSource).not.toMatch(/useQuery|supabase|\.from\(|\.rpc\(|\.channel\(|fetch\(/);
  });

  it("preserves deep links and all real tab identifiers", () => {
    for (const tab of [
      "profile",
      "prefs",
      "customizacao",
      "saldo",
      "presentes",
      "missions",
      "role",
    ]) {
      expect(routeSource).toContain(`"${tab}"`);
    }
    expect(routeSource).toContain("validateSearch");
    expect(routeSource).toContain("search?.edit === 1");
    expect(routeSource).toContain("setEditingProfile(true)");
    expect(routeSource).toContain("setEditingPrefs(true)");
  });

  it("provides accessible horizontal native tabs without a second sidebar", () => {
    expect(tabsSource).toContain('role="tablist"');
    expect(tabsSource).toContain('role="tab"');
    expect(tabsSource).toContain("aria-selected={active}");
    expect(tabsSource).toContain("min-h-11");
    expect(routeSource).toContain('nativeShellActive ? "" : "lg:grid-cols');
    expect(routeSource).toMatch(/!nativeShellActive\s*&&\s*\(\s*<aside/);
  });

  it("preserves editing, photo verification, upload and advanced forms", () => {
    for (const contract of [
      "normalizeImageFile",
      'import("@/lib/verifyPhoto")',
      'storage.from("profile-photos")',
      "ProfilePhotosManager",
      "ProfileAdvancedForm",
      "ProfileAdvancedView",
      "saveProfile",
      "savePrefs",
      'from("profile_preferences").upsert',
    ]) {
      expect(routeSource).toContain(contract);
    }
  });

  it("preserves identity, staff, pet, customization and economy surfaces", () => {
    for (const contract of [
      "GradientName",
      "StatusPill",
      "RoleBadge",
      "contributor_highlight",
      "getActiveCommitmentByUser",
      "PetProfileCard",
      "EquippedPetSidekick",
      "prefetchPetEssentials",
      "CustomizacaoTab",
      "SaldoTab",
      "ReceivedGiftsTab",
      "MissionsPanel",
      "saveRoleSettings",
      "AdminWarningBanner",
      "StaleDataNotice",
      "OfflineState",
    ]) {
      expect(routeSource).toContain(contract);
    }
  });

  it("keeps the native identity responsive and avoids fictional social data", () => {
    expect(routeSource).toContain("native-profile__identity");
    expect(routeSource).toContain("native-profile__avatar");
    expect(cssSource).toContain("aspect-ratio: 1");
    expect(cssSource).toContain("border-radius: 9999px");
    expect(cssSource).toContain("font-size: max(1rem, 16px)");
    expect(cssSource).toContain("min-height: 2.75rem");
    expect(routeSource + tabsSource).not.toMatch(/followers?|following|timeline/i);
    expect(cssSource).not.toMatch(/(^|\n)\s*(html|body|:root|\.dark)\b/);
  });
});
