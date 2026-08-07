/* global console, process */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ESLINT_EXTENSIONS = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = [
  ".git/",
  ".nitro/",
  ".output/",
  ".tanstack/",
  ".vinxi/",
  "build/",
  "coverage/",
  "dist/",
  "dist-ssr/",
  "node_modules/",
];
const GENERATED_FILES = new Set(["src/routeTree.gen.ts"]);

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalize(file) {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function isIgnoredChangedPath(file) {
  const normalized = normalize(file);
  return (
    GENERATED_FILES.has(normalized) ||
    IGNORED_DIRECTORIES.some((directory) => normalized.startsWith(directory))
  );
}

export function resolveChangedFiles(baseArgument = process.argv[2]) {
  const baseRef = baseArgument || process.env.NATIVE_SHELL_BASE_REF || "HEAD^";

  try {
    git(["rev-parse", "--verify", `${baseRef}^{commit}`]);
  } catch {
    throw new Error(`Base ref is not a valid commit: ${baseRef}`);
  }

  let mergeBase;
  try {
    mergeBase = git(["merge-base", "HEAD", baseRef]);
  } catch {
    throw new Error(`Unable to resolve merge-base between HEAD and ${baseRef}`);
  }

  const tracked = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMR", "-z", mergeBase, "--"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  )
    .split("\0")
    .filter(Boolean);

  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split("\0")
    .filter(Boolean);

  const files = [...new Set([...tracked, ...untracked].map(normalize))]
    .filter((file) => !isIgnoredChangedPath(file))
    .filter((file) => existsSync(path.resolve(process.cwd(), file)))
    .sort();

  return { baseRef, mergeBase, files };
}

export function eslintChangedFiles(baseArgument = process.argv[2]) {
  const { baseRef, mergeBase, files } = resolveChangedFiles(baseArgument);
  const supported = files.filter((file) => ESLINT_EXTENSIONS.has(path.extname(file).toLowerCase()));

  console.log(`Changed-file base: ${baseRef}`);
  console.log(`Merge-base: ${mergeBase}`);

  if (supported.length === 0) {
    console.log("No changed ESLint-supported files.");
    return 0;
  }

  console.log(`ESLint files (${supported.length}):`);
  for (const file of supported) console.log(`- ${file}`);

  const eslintBin = path.resolve(process.cwd(), "node_modules/eslint/bin/eslint.js");
  const result = spawnSync(process.execPath, [eslintBin, ...supported], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  try {
    process.exitCode = eslintChangedFiles();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
