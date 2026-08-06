import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const routeTree = read("src/routeTree.gen.ts");
const routes = [...routeTree.matchAll(/fullPath: '([^']+)'/g)].map((match) => match[1]);
assert(routes.length === 69, `expected 69 generated routes, received ${routes.length}`);

const surfaceCoverage = read("src/config/surface-shell-classification.ts");
for (const route of routes) {
  const normalized = route.replace(/\/$/, "") || "/";
  const classifiedByPrefix = ["/admin", "/api/", "/auth/", "/onboarding", "/v2"].some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix),
  );
  assert(
    classifiedByPrefix || surfaceCoverage.includes(JSON.stringify(route)),
    `route missing explicit shell classification: ${route}`,
  );
}

const primaryNavigation = read("src/config/native-primary-navigation.ts");
const orderedLabels = ["Início", "Comunidade", "Explorar", "Conversas", "Perfil"];
let cursor = -1;
for (const label of orderedLabels) {
  const index = primaryNavigation.indexOf(`label: "${label}"`);
  assert(index > cursor, `primary navigation order changed at ${label}`);
  cursor = index;
}

const adminRegistry = read("src/config/admin-destinations.ts");
assert(
  (adminRegistry.match(/id: "admin-/g) ?? []).length === 13,
  "admin registry must have 13 routes",
);
assert(
  adminRegistry.includes('id: "admin-gifts"') &&
    /id: "admin-gifts"[\s\S]*?allowedRoles: administrators/.test(adminRegistry),
  "gift administration must remain admin/super_admin only",
);

const manifest = JSON.parse(read("public/manifest.webmanifest"));
assert(manifest.start_url === "/inicio", "PWA start_url must remain /inicio");
assert(manifest.display === "standalone", "PWA display must remain standalone");
assert(
  manifest.icons.some((icon) => icon.sizes === "192x192"),
  "PWA icon 192 is missing",
);
assert(
  manifest.icons.some((icon) => icon.sizes === "512x512"),
  "PWA icon 512 is missing",
);
for (const icon of manifest.icons)
  assert(existsSync(join(root, "public", icon.src)), `missing ${icon.src}`);

const serviceWorker = read("public/sw.js");
assert(
  serviceWorker.includes('caches.match("/offline.html")'),
  "offline navigation fallback missing",
);
assert(serviceWorker.includes("isSensitivePath"), "private path cache guard missing");
assert(serviceWorker.includes("isSafeStaticRequest"), "static-only cache guard missing");

for (const route of [
  "src/routes/v2.tsx",
  "src/routes/v2.index.tsx",
  "src/routes/v2.$section.tsx",
]) {
  const source = read(route);
  assert(!source.includes("V2Runtime"), `${route} mounts rejected V2 runtime`);
  const isLayoutOnly = route === "src/routes/v2.tsx" && source.includes("<Outlet />");
  assert(
    isLayoutOnly || source.includes("Navigate") || source.includes("redirect"),
    `${route} is not a tombstone`,
  );
}

const allowedFunctionalV2Imports = new Set([
  "src/config/admin-route-access.ts",
  "src/lib/auth.tsx",
  "src/router.tsx",
  "src/routes/__root.tsx",
  "src/routes/inicio.tsx",
]);

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const visualV2Import = /@\/v2\/(?:app-shell|design-system|integration)/;
for (const file of walk(join(root, "src"))) {
  const path = relative(root, file).replaceAll("\\", "/");
  if (path.startsWith("src/v2/") || !/\.[cm]?[jt]sx?$/.test(path)) continue;
  const source = readFileSync(file, "utf8");
  assert(!visualV2Import.test(source), `rejected visual V2 import outside V2: ${path}`);
  if (source.includes("@/v2/")) {
    assert(allowedFunctionalV2Imports.has(path), `unreviewed functional V2 import: ${path}`);
  }
}

console.log(`Native shell qualification passed: ${routes.length} routes, PWA and residue guards.`);
