import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const presentationRoots = ["home", "community", "explore", "conversations", "profile"];
const presentationFiles = presentationRoots.flatMap((root) =>
  readdirSync(`src/components/redesign-zero/${root}`, { recursive: true })
    .filter((entry) => typeof entry === "string" && entry.endsWith(".tsx"))
    .map((entry) => `src/components/redesign-zero/${root}/${entry.replaceAll("\\", "/")}`),
);

const forbiddenImportPaths = [
  "@/components/ui/",
  "@/components/redesign-total/home/",
  "@/components/redesign-total/community/",
  "@/components/redesign-total/explore/",
  "@/components/redesign-total/conversations/",
  "@/components/redesign-total/profile/",
];
const forbiddenImportedNames = [
  "Header",
  "MobileAppHeader",
  "DecoratedAvatar",
  "CommitmentPauseCard",
  "NativeExploreContinue",
  "NativeProgress",
  "NativeConversationsView",
  "NativeInicioView",
  "OfflineState",
  "AppEmptyState",
  "AppSkeletons",
  "StaleDataNotice",
];

const forbiddenClasses = [
  "bg-card",
  "bg-background",
  "border-border",
  "text-muted-foreground",
  "shadow-sm",
  "rounded-2xl",
  "gradient",
  "from-",
  "to-",
  "via-",
];

describe("Visual Zero legacy isolation", () => {
  it("keeps the five presentations free of rejected visual imports", () => {
    expect(presentationFiles).toHaveLength(5);
    for (const file of presentationFiles) {
      const source = readFileSync(file, "utf8");
      const importLines = source.match(/^import[\s\S]*?from\s+["'][^"']+["'];?$/gm) ?? [];
      for (const forbidden of forbiddenImportPaths) {
        expect(importLines.join("\n"), `${file} imports ${forbidden}`).not.toContain(forbidden);
      }
      for (const forbidden of forbiddenImportedNames) {
        expect(importLines.join("\n"), `${file} imports ${forbidden}`).not.toMatch(
          new RegExp(`(?:^|[\\s,{])${forbidden}(?:$|[\\s,}])`, "m"),
        );
      }
    }
  });

  it("uses only vz classes in the five new presentations", () => {
    for (const file of presentationFiles) {
      const source = readFileSync(file, "utf8");
      const classValues = [...source.matchAll(/className=["']([^"']+)["']/g)].map(
        (match) => match[1],
      );
      for (const value of classValues) {
        for (const token of value.split(/\s+/)) {
          expect(token, `${file} contains non-vz class ${token}`).toMatch(/^(vz-|sr-only$)/);
          expect(
            forbiddenClasses.some(
              (forbidden) => token === forbidden || token.startsWith(`${forbidden}/`),
            ),
            `${file} contains rejected class ${token}`,
          ).toBe(false);
        }
      }
    }
  });

  it("does not move runtime data ownership into presentations", () => {
    for (const file of presentationFiles) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(
        /@\/integrations\/supabase|\buseQuery\b|\buseMutation\b|\.channel\(/,
      );
      expect(source).not.toMatch(/service[_-]?role|\/api\//i);
    }
  });
});
