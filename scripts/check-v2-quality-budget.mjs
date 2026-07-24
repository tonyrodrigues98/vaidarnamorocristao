import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDirectory = join(root, ".output", "public", "assets");
const budgetPath = join(root, "docs", "reestruturacao-v2", "audit", "v2-quality-budget.json");

export const V2_QUALITY_METRICS = Object.freeze([
  { id: "runtime-route-js", pattern: /^v2\._section-.*\.js$/ },
  { id: "v2-css", pattern: /^v2-.*\.css$/ },
  { id: "v2-lazy-js-total", pattern: /^V2.*\.js$/ },
]);

export async function measureV2Assets(directory = assetsDirectory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const file = await stat(join(directory, entry.name));
        return { name: entry.name, bytes: file.size };
      }),
  );
  return Object.fromEntries(
    V2_QUALITY_METRICS.map((metric) => {
      const matches = files.filter((file) => metric.pattern.test(file.name));
      return [
        metric.id,
        {
          bytes: matches.reduce((total, file) => total + file.bytes, 0),
          files: matches.map((file) => file.name).sort(),
        },
      ];
    }),
  );
}

export function deriveBudget(observedBytes, headroomPercent = 15) {
  return Math.ceil((observedBytes * (100 + headroomPercent)) / 100 / 1024) * 1024;
}

export async function captureV2QualityBaseline() {
  const measurements = await measureV2Assets();
  const metrics = Object.fromEntries(
    Object.entries(measurements).map(([id, measurement]) => [
      id,
      {
        observedBytes: measurement.bytes,
        budgetBytes: deriveBudget(measurement.bytes),
        fileCount: measurement.files.length,
      },
    ]),
  );
  const report = {
    schemaVersion: 1,
    sourceState: "working-tree-derived-from-v2-022",
    methodology: "production build byte size with 15 percent rollout headroom",
    headroomPercent: 15,
    metrics,
  };
  await writeFile(budgetPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

export async function checkV2QualityBudget() {
  const config = JSON.parse(await readFile(budgetPath, "utf8"));
  const measurements = await measureV2Assets();
  const failures = [];
  for (const [id, budget] of Object.entries(config.metrics)) {
    const observed = measurements[id]?.bytes;
    if (typeof observed !== "number" || observed === 0) {
      failures.push(`${id}: measurement missing`);
    } else if (observed > budget.budgetBytes) {
      failures.push(`${id}: ${observed} > ${budget.budgetBytes}`);
    }
  }
  return { config, measurements, failures };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const capture = process.argv.includes("--capture");
  const result = capture ? await captureV2QualityBaseline() : await checkV2QualityBudget();
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: capture ? "capture" : "check",
        budget: relative(root, budgetPath).replaceAll("\\", "/"),
        ...result,
      },
      null,
      2,
    )}\n`,
  );
  if (!capture && result.failures.length > 0) process.exitCode = 1;
}
