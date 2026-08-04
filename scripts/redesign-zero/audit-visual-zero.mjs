import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const presentationRoot = resolve(root, "src/components/redesign-zero");
const output = resolve(root, "artifacts/redesign-zero/audit.json");
const forbiddenImports = [
  "@/components/ui/",
  "DecoratedAvatar",
  "CommitmentPauseCard",
  "NativeExploreContinue",
  "NativeProgress",
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

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.name.endsWith(".tsx")) files.push(path);
  }
  return files;
}

const files = await walk(presentationRoot);
const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
const manifest = JSON.parse(
  await readFile(resolve(root, "artifacts/redesign-zero/manifest.json"), "utf8"),
);
const report = {
  generatedAt: new Date().toISOString(),
  presentationFiles: files.length,
  forbiddenImports: forbiddenImports.filter((term) =>
    sources.some((source) => source.includes(term)),
  ),
  forbiddenClasses: forbiddenClasses.filter((term) =>
    sources.some((source) =>
      [...source.matchAll(/className=["']([^"']+)["']/g)].some((match) =>
        match[1].split(/\s+/).some((token) => token === term || token.startsWith(`${term}/`)),
      ),
    ),
  ),
  phaseOnePresentationImports: sources.filter((source) =>
    /@\/components\/redesign-total\/(home|community|explore|conversations|profile)\//.test(source),
  ).length,
  runtimeMocks: sources.filter((source) => /mock|fixture/i.test(source)).length,
  vzCardCount: sources.reduce(
    (total, source) => total + (source.match(/vz-card/g)?.length ?? 0),
    0,
  ),
  borderClassCount: sources.reduce(
    (total, source) => total + (source.match(/\bborder-/g)?.length ?? 0),
    0,
  ),
  shadowClassCount: sources.reduce(
    (total, source) => total + (source.match(/\bshadow-/g)?.length ?? 0),
    0,
  ),
  screenshots: manifest.length,
  horizontalOverflow: manifest.filter((entry) => entry.horizontalOverflow).length,
  smallTouchTargets: manifest.reduce((total, entry) => total + entry.visibleSmallTargets.length, 0),
  nonCircularAvatars: manifest.filter((entry) => entry.issues.includes("avatar is not circular"))
    .length,
  legacyHeaders: manifest.filter((entry) => entry.issues.includes("legacy header visible")).length,
  bottomNavigationFailures: manifest.filter((entry) =>
    entry.issues.includes("mobile bottom navigation absent"),
  ).length,
  result: manifest.every((entry) => entry.result === "pass") ? "pass" : "issue",
};

await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (
  report.result !== "pass" ||
  report.forbiddenImports.length ||
  report.forbiddenClasses.length ||
  report.phaseOnePresentationImports ||
  report.runtimeMocks ||
  report.vzCardCount
) {
  process.exitCode = 1;
}
