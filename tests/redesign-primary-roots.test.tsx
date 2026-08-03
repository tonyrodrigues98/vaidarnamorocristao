import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("total redesign primary roots", () => {
  it("branches presentation while preserving the Inicio view model", () => {
    const source = read("src/routes/inicio.tsx");
    expect(source.match(/const nativeModel: NativeInicioViewModel/g)).toHaveLength(1);
    expect(source).toContain("<RedesignInicioView model={nativeModel} />");
    expect(source).toContain("<NativeInicioView model={nativeModel} />");
  });

  it("branches presentation while preserving the conversations model and hook", () => {
    const source = read("src/routes/conversas/index.tsx");
    expect(source.match(/useConversationsList\(/g)).toHaveLength(1);
    expect(source.match(/const model: NativeConversationsViewModel/g)).toHaveLength(1);
    expect(source).toContain("<RedesignConversationsView model={model} />");
    expect(source).toContain("<NativeConversationsView model={model} />");
  });

  it("uses the real registries for community and explore", () => {
    const community = read("src/routes/comunidade.tsx");
    const explore = read("src/routes/explorar.tsx");
    expect(community).toContain("<RedesignCommunityView activeTab={tab} />");
    expect(explore).toContain("<RedesignExploreView items={nativeExploreRegistry} />");
    expect(explore.match(/nativeExploreRegistry/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps profile data ownership in the route", () => {
    const source = read("src/routes/perfil.tsx");
    expect(source.match(/queryKey: \["profile-main", user\?\.id\]/g)).toHaveLength(1);
    expect(source.match(/onChange=\{handlePhoto\}/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("<RedesignProfileHero");
    expect(source).toContain("<RedesignProfileTabs");
  });

  it("does not give product data ownership to redesign presentations", () => {
    const presentations = [
      "src/components/redesign-total/home/RedesignInicioView.tsx",
      "src/components/redesign-total/community/RedesignCommunityView.tsx",
      "src/components/redesign-total/explore/RedesignExploreView.tsx",
      "src/components/redesign-total/conversations/RedesignConversationsView.tsx",
      "src/components/redesign-total/profile/RedesignProfileHero.tsx",
    ].map(read);
    for (const source of presentations) {
      expect(source).not.toMatch(/from ["']@\/integrations\/supabase/);
      expect(source).not.toMatch(/\buseQuery\b|\buseMutation\b|\.channel\(/);
    }
  });
});
