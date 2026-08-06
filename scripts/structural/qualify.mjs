import { readdir, readFile } from "node:fs/promises";

const forbiddenDirectories = [
  "src/assets",
  "src/components",
  "src/config",
  "src/data",
  "src/prototype-01",
  "src/styles",
];

for (const directory of forbiddenDirectories) {
  try {
    const entries = await readdir(directory, { recursive: true });
    const files = entries.filter((entry) => /\.[^/\\]+$/.test(String(entry)));
    if (files.length > 0) throw new Error(`Visual files still exist in ${directory}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Visual files")) throw error;
  }
}

const routeFiles = await readdir("src/routes", { recursive: true });
const visualRouteFiles = routeFiles.filter(
  (file) =>
    typeof file === "string" &&
    file.endsWith(".tsx") &&
    !file.startsWith("api\\") &&
    !file.startsWith("api/") &&
    file !== "__root.tsx" &&
    file !== "index.tsx",
);

if (visualRouteFiles.length > 0) {
  throw new Error(`Visual routes still exist: ${visualRouteFiles.join(", ")}`);
}

const root = await readFile("src/routes/__root.tsx", "utf8");
if (/className=|style=|\.css/.test(root)) {
  throw new Error("Structural root contains visual styling");
}

console.log("Structural zero qualification passed.");
