/* global console, process */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { resolveChangedFiles } from "./lint-changed.mjs";

const PRETTIER_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".mts",
  ".scss",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

function prettierChangedFiles(baseArgument = process.argv[2]) {
  const { baseRef, mergeBase, files } = resolveChangedFiles(baseArgument);
  const supported = files.filter((file) =>
    PRETTIER_EXTENSIONS.has(path.extname(file).toLowerCase()),
  );

  console.log(`Changed-file base: ${baseRef}`);
  console.log(`Merge-base: ${mergeBase}`);

  if (supported.length === 0) {
    console.log("No changed Prettier-supported files.");
    return 0;
  }

  console.log(`Prettier files (${supported.length}):`);
  for (const file of supported) console.log(`- ${file}`);

  const prettierBin = path.resolve(process.cwd(), "node_modules/prettier/bin/prettier.cjs");
  const result = spawnSync(
    process.execPath,
    [prettierBin, "--check", "--ignore-path", ".prettierignore", ...supported],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  return result.status ?? 1;
}

try {
  process.exitCode = prettierChangedFiles();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
