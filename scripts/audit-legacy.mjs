import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { format } from "prettier";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceRoot = join(projectRoot, "src");
const outputRoot = join(projectRoot, "docs", "reestruturacao-v2", "audit");
const AUDITED_BASE_COMMIT = "0659a9616562a08182581362a3dd9b60923a66af";
const AUDIT_SCHEMA_VERSION = 2;
const APP_ORIGINS = new Set(["https://vaidarnamoro.com", "https://www.vaidarnamoro.com"]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".webmanifest",
  ".xml",
]);
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const ignoredDirectories = new Set([".git", ".output", ".wrangler", "node_modules"]);

function normalizePath(path) {
  return relative(projectRoot, path).split(sep).join("/");
}

function walk(directory, predicate = () => true) {
  if (!statSafe(directory)?.isDirectory()) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path, predicate);
    return predicate(path) ? [path] : [];
  });
}

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function read(path) {
  return readFileSync(path, "utf8");
}

function unique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function collectMatches(source, expression, group = 1) {
  return [...source.matchAll(expression)].map((match) => match[group]).filter(Boolean);
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export function routePatternMatches(pattern, target) {
  const clean = target.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const normalizedPattern = pattern.replace(/\/+$/, "") || "/";
  const expression = new RegExp(
    `^${normalizedPattern
      .split("/")
      .map((part) => (part.startsWith("$") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("/")}/?$`,
  );
  return expression.test(clean);
}

export function classifyNavigationTarget(
  rawTarget,
  { routePatterns = [], appOrigins = APP_ORIGINS } = {},
) {
  const target = String(rawTarget ?? "").trim();
  if (!target) {
    return {
      classification: "dynamic",
      status: "requires-investigation",
      normalizedTarget: null,
      matchedRoutes: [],
    };
  }

  if (target.includes("${") || target.includes("*") || target.includes(":slug")) {
    return {
      classification: "dynamic",
      status: "requires-investigation",
      normalizedTarget: target,
      matchedRoutes: [],
    };
  }

  if (target.startsWith("#")) {
    return {
      classification: "deep-link",
      status: "not-applicable",
      normalizedTarget: target,
      matchedRoutes: [],
    };
  }

  let normalizedTarget = target;
  if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target);
      if (!appOrigins.has(url.origin)) {
        return {
          classification: "external",
          status: "not-applicable",
          normalizedTarget: target,
          matchedRoutes: [],
        };
      }
      normalizedTarget = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return {
        classification: "external",
        status: "requires-investigation",
        normalizedTarget: target,
        matchedRoutes: [],
      };
    }
  } else if (target.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
    return {
      classification: "external",
      status: "not-applicable",
      normalizedTarget: target,
      matchedRoutes: [],
    };
  }

  const pathname = normalizedTarget.split(/[?#]/)[0] || "/";
  if (pathname.startsWith("/api/")) {
    return {
      classification: "endpoint",
      status: "not-applicable",
      normalizedTarget,
      matchedRoutes: [],
    };
  }
  if (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/models/") ||
    pathname.startsWith("/splash/") ||
    /\.(?:avif|css|gif|html?|ico|jpe?g|mjs|js|json|mp3|mp4|png|svg|tsx?|webmanifest|webp|woff2?)(?:$|[?#])/i.test(
      normalizedTarget,
    )
  ) {
    return {
      classification: "asset",
      status: "not-applicable",
      normalizedTarget,
      matchedRoutes: [],
    };
  }
  if (!pathname.startsWith("/")) {
    return {
      classification: "dynamic",
      status: "requires-investigation",
      normalizedTarget,
      matchedRoutes: [],
    };
  }

  const matchedRoutes = routePatterns.filter((route) => routePatternMatches(route, pathname));
  return {
    classification: "route",
    status: matchedRoutes.length ? "resolved" : "unresolved",
    normalizedTarget,
    matchedRoutes,
  };
}

export function classifyPetCacheIdentity(source) {
  const handlesAuthenticatedPetMedia =
    /\(sign\|public\|authenticated\).*pets|authenticated.*pets/is.test(source);
  if (!handlesAuthenticatedPetMedia) return "not-applicable";
  const partitionsByIdentity =
    /user(?:Id|_id)|account(?:Id|_id)|cachePartition|partitionKey|authorization/i.test(source);
  return partitionsByIdentity ? "partitioned" : "risk-unpartitioned";
}

export function classifyNotificationNavigationPolicy(source) {
  if (!/openWindow\s*\(/.test(source)) return "not-applicable";
  const validatesSameOrigin =
    /(?:url|target)\.origin\s*(?:===|!==)\s*(?:self\.)?location\.origin/.test(source) ||
    /sameOrigin|allowedOrigins?|isInternalUrl|sanitize(?:d)?Navigation/i.test(source);
  return validatesSameOrigin ? "same-origin-enforced" : "risk-no-same-origin-policy";
}

async function writeJson(name, value) {
  mkdirSync(outputRoot, { recursive: true });
  const json = await format(JSON.stringify(value), { parser: "json", printWidth: 100 });
  writeFileSync(join(outputRoot, name), json, "utf8");
}

async function runAudit() {
  const repositoryFiles = walk(projectRoot, (path) => textExtensions.has(extname(path)));
  const searchableFiles = repositoryFiles.filter(
    (path) => !normalizePath(path).startsWith("docs/"),
  );
  const sourceFiles = walk(sourceRoot, (path) => sourceExtensions.has(extname(path)));
  const sourceFileSet = new Set(sourceFiles.map((path) => resolve(path)));
  const sources = new Map(searchableFiles.map((path) => [path, read(path)]));

  function resolveImport(importer, specifier) {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
    const base = specifier.startsWith("@/")
      ? join(sourceRoot, specifier.slice(2))
      : resolve(dirname(importer), specifier);
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.jsx`,
      join(base, "index.ts"),
      join(base, "index.tsx"),
      join(base, "index.js"),
      join(base, "index.jsx"),
    ]) {
      if (sourceFileSet.has(resolve(candidate))) return resolve(candidate);
    }
    return null;
  }

  function packageName(specifier) {
    if (specifier.startsWith(".") || specifier.startsWith("@/") || specifier.startsWith("node:")) {
      return null;
    }
    const parts = specifier.split("/");
    return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
  }

  const importExpression =
    /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\s*\(\s*["']([^"']+)["']\s*\)/g;
  const imports = [];
  const incoming = new Map(sourceFiles.map((path) => [resolve(path), []]));
  const importGraph = new Map(sourceFiles.map((path) => [resolve(path), []]));

  for (const file of sourceFiles) {
    const source = stripComments(read(file));
    for (const match of source.matchAll(importExpression)) {
      const specifier = match[1] ?? match[2] ?? match[3];
      const target = resolveImport(file, specifier);
      imports.push({
        importer: normalizePath(file),
        specifier,
        kind: match[2] ? "dynamic" : match[3] ? "require" : "static",
        resolved: target ? normalizePath(target) : null,
      });
      if (target) {
        incoming.get(target)?.push(resolve(file));
        importGraph.get(resolve(file))?.push(target);
      }
    }
  }

  const routeFiles = walk(join(sourceRoot, "routes"), (path) =>
    sourceExtensions.has(extname(path)),
  );
  const routeRecords = routeFiles
    .map((file) => {
      const source = read(file);
      const pathMatch = source.match(/createFileRoute\(\s*["']([^"']+)["']\s*\)/);
      if (!pathMatch) return null;
      const routePath = pathMatch[1];
      const componentMatch =
        source.match(/component:\s*([A-Za-z_$][\w$]*)/) ??
        source.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
      const supabase = {
        tables: unique(collectMatches(source, /\.from\(\s*["']([^"']+)["']\s*\)/g)),
        rpcs: unique(collectMatches(source, /\.rpc\(\s*["']([^"']+)["']/g)),
        functions: unique(collectMatches(source, /\.functions\.invoke\(\s*["']([^"']+)["']/g)),
        buckets: unique(collectMatches(source, /\.storage\.from\(\s*["']([^"']+)["']/g)),
        realtime: unique(collectMatches(source, /\.channel\(\s*["']([^"']+)["']/g)),
        auth: /\.auth\./.test(source),
      };
      const redirects = unique([
        ...collectMatches(source, /<Navigate[^>]*\bto=["']([^"']+)["']/g),
        ...collectMatches(source, /navigate\(\s*\{\s*to:\s*["']([^"']+)["']/g),
        ...collectMatches(source, /window\.location\.(?:href|replace)\s*=\s*["']([^"']+)["']/g),
      ]);
      const parameters = collectMatches(routePath, /\$([A-Za-z0-9_]+)/g);
      const hasNavigateLogin = redirects.some((target) => target.startsWith("/auth/login"));
      const referencesAuth = /useAuth\(|<RouteProtectionBoundary|<RequireApproved/.test(source);
      const adminRoute = routePath === "/admin/" || routePath.startsWith("/admin/");
      const endpoint = routePath.startsWith("/api/");
      const publicRoute =
        routePath === "/" ||
        routePath.startsWith("/auth/") ||
        [
          "/blog/",
          "/blog/$slug",
          "/como-funciona",
          "/depoimentos",
          "/instalar",
          "/manual",
          "/sobre",
          "/termos",
        ].includes(routePath);
      const access = endpoint
        ? "endpoint"
        : adminRoute
          ? "administrative"
          : publicRoute
            ? "public-or-visitor"
            : hasNavigateLogin || referencesAuth || routePath.startsWith("/v2")
              ? "authenticated"
              : "root-guard-inherited";
      const domain = classifyDomain(routePath);
      const linksIn = [];
      return {
        pathname: routePath,
        file: normalizePath(file),
        component: componentMatch?.[1] ?? "(inline/derived)",
        domain,
        access,
        parameters,
        redirects,
        providers: unique(collectMatches(source, /<([A-Za-z_$][\w$]*Provider)\b/g)),
        supabase,
        queryHooks: unique(
          collectMatches(source, /\b(useQuery|useInfiniteQuery|useMutation)\s*\(/g),
        ),
        realtimeSubscriptions: (source.match(/\.on\(\s*["']postgres_changes["']/g) ?? []).length,
        linksIn,
        tests: [],
        notes: [],
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.pathname.localeCompare(right.pathname));

  function classifyDomain(pathname) {
    const rules = [
      ["administration", /^\/admin(?:\/|$)/],
      ["server-endpoints", /^\/api(?:\/|$)/],
      ["authentication", /^\/auth(?:\/|$)/],
      ["onboarding", /^\/onboarding(?:\/|$)/],
      ["v2-platform", /^\/v2(?:\/|$)/],
      ["conversations", /^\/conversas(?:\/|$)/],
      ["dating", /^\/(?:pretendentes|matches|interesses|recados|proposito)(?:\/|$)/],
      ["profile", /^\/(?:perfil|bloqueados|verificacao)(?:\/|$)/],
      ["personalization", /^\/(?:avatar|presentes|caixas)(?:\/|$)/],
      ["pets-games", /^\/(?:meu-pet|pet-arcade|quiz-biblico|conquistas)(?:\/|$)/],
      [
        "community-content",
        /^\/(?:inicio|dashboard|comunidade|oracoes|devocional|noticias)(?:\/|$)/,
      ],
      ["economy", /^\/loja(?:\/|$)/],
      ["support-settings", /^\/(?:conta|suporte|notificacoes)(?:\/|$)/],
      [
        "public-content",
        /^\/(?:blog|como-funciona|depoimentos|instalar|manual|sobre|termos)(?:\/|$)/,
      ],
    ];
    return rules.find(([, expression]) => expression.test(pathname))?.[0] ?? "miscellaneous";
  }

  const internalLinks = [];
  const routePatterns = routeRecords.map((route) => route.pathname);
  function sourceOrigin(file) {
    const normalized = normalizePath(file);
    if (normalized.endsWith(".webmanifest")) return "manifest";
    if (normalized.endsWith("sitemap.xml")) return "sitemap";
    if (normalized.startsWith("src/")) return "src";
    if (normalized.startsWith("tests/")) return "tests";
    if (normalized.startsWith("public/")) return "public";
    if (
      /(?:^|\/)(?:vite|vitest|eslint|prettier|tsconfig|wrangler|package)(?:\.|$)/.test(normalized)
    ) {
      return "configuration";
    }
    return "other";
  }

  function sourceFileType(file) {
    const normalized = normalizePath(file);
    if (normalized.endsWith(".webmanifest")) return "webmanifest";
    if (normalized.endsWith(".xml")) return "xml";
    return extname(file).slice(1) || "extensionless";
  }

  function lineAt(source, index) {
    if (!Number.isInteger(index) || index < 0) return null;
    return source.slice(0, index).split("\n").length;
  }

  function addInternalReference({ file, kind, target, evidence, index = null }) {
    const result = classifyNavigationTarget(target, { routePatterns });
    const record = {
      source: normalizePath(file),
      origin: sourceOrigin(file),
      fileType: sourceFileType(file),
      kind,
      target,
      normalizedTarget: result.normalizedTarget,
      classification: result.classification,
      status: result.status,
      matchedRoutes: result.matchedRoutes,
      evidence: {
        locator: evidence,
        line: lineAt(read(file), index),
      },
    };
    internalLinks.push(record);
    if (record.classification === "route") {
      for (const route of routeRecords.filter((candidate) =>
        record.matchedRoutes.includes(candidate.pathname),
      )) {
        route.linksIn.push({
          source: record.source,
          origin: record.origin,
          kind,
          target: record.normalizedTarget ?? target,
        });
      }
    }
  }

  const linkExpressions = [
    { kind: "jsx-to", expression: /\bto=["']((?:\/|https?:|mailto:|tel:|#)[^"'{}]+)["']/g },
    {
      kind: "jsx-href",
      expression: /\bhref=["']((?:\/|https?:|mailto:|tel:|#)[^"'{}]+)["']/g,
    },
    { kind: "jsx-src", expression: /\bsrc=["']((?:\/|https?:)[^"'{}]+)["']/g },
    { kind: "object-to", expression: /\bto:\s*["']((?:\/|https?:)[^"'{}]+)["']/g },
    {
      kind: "object-href",
      expression: /\bhref:\s*["']((?:\/|https?:|mailto:|tel:|#)[^"'{}]+)["']/g,
    },
    {
      kind: "navigate",
      expression: /\bnavigate\(\s*\{\s*to:\s*["']((?:\/|https?:)[^"']+)["']/g,
    },
    {
      kind: "location",
      expression: /window\.location\.(?:href|replace)\s*=\s*["']((?:\/|https?:)[^"']+)["']/g,
    },
    {
      kind: "object-url",
      expression: /\burl:\s*["']((?:\/|https?:|mailto:|tel:)[^"']+)["']/g,
    },
    {
      kind: "fetch",
      expression: /\bfetch\s*\(\s*["']((?:\/|https?:)[^"']+)["']/g,
    },
    {
      kind: "request",
      expression: /\bnew\s+Request\s*\(\s*["']((?:\/|https?:)[^"']+)["']/g,
    },
    { kind: "template-to", expression: /\bto:\s*`([^`]+)`/g },
    { kind: "template-href", expression: /\bhref:\s*`([^`]+)`/g },
    { kind: "template-url", expression: /\burl:\s*`([^`]+)`/g },
  ];
  for (const file of searchableFiles.filter((path) => sourceExtensions.has(extname(path)))) {
    const source = read(file);
    for (const { kind, expression } of linkExpressions) {
      for (const match of source.matchAll(expression)) {
        addInternalReference({
          file,
          kind,
          target: match[1],
          evidence: kind,
          index: match.index,
        });
      }
    }
  }

  for (const file of searchableFiles.filter((path) => [".html"].includes(extname(path)))) {
    const source = read(file);
    for (const match of source.matchAll(/\b(href|src|action)=["']([^"']+)["']/gi)) {
      addInternalReference({
        file,
        kind: `html-${match[1].toLowerCase()}`,
        target: match[2],
        evidence: match[1].toLowerCase(),
        index: match.index,
      });
    }
  }

  for (const file of searchableFiles.filter((path) => path.endsWith(".webmanifest"))) {
    const manifest = JSON.parse(read(file));
    const entries = [
      ["manifest-start_url", manifest.start_url, "start_url"],
      ["manifest-scope", manifest.scope, "scope"],
      ["manifest-id", manifest.id, "id"],
      ...(manifest.icons ?? []).map((icon, index) => [
        "manifest-icon",
        icon.src,
        `icons[${index}].src`,
      ]),
      ...(manifest.screenshots ?? []).map((screenshot, index) => [
        "manifest-screenshot",
        screenshot.src,
        `screenshots[${index}].src`,
      ]),
      ...(manifest.shortcuts ?? []).flatMap((shortcut, shortcutIndex) => [
        ["manifest-shortcut", shortcut.url, `shortcuts[${shortcutIndex}].url`],
        ...(shortcut.icons ?? []).map((icon, iconIndex) => [
          "manifest-shortcut-icon",
          icon.src,
          `shortcuts[${shortcutIndex}].icons[${iconIndex}].src`,
        ]),
      ]),
      ...(manifest.protocol_handlers ?? []).map((handler, index) => [
        "manifest-protocol-handler",
        handler.url,
        `protocol_handlers[${index}].url`,
      ]),
      ["manifest-share-target", manifest.share_target?.action, "share_target.action"],
    ];
    for (const [kind, target, evidence] of entries) {
      if (typeof target === "string" && target.trim()) {
        addInternalReference({ file, kind, target, evidence });
      }
    }
  }

  for (const file of searchableFiles.filter((path) => path.endsWith("sitemap.xml"))) {
    const source = read(file);
    for (const match of source.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
      addInternalReference({
        file,
        kind: "sitemap-loc",
        target: match[1],
        evidence: "loc",
        index: match.index,
      });
    }
  }

  for (const file of searchableFiles.filter((path) => normalizePath(path) === "public/sw.js")) {
    const source = read(file);
    const staticAssets = source.match(/const\s+STATIC_ASSETS\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? "";
    for (const match of staticAssets.matchAll(/["']([^"']+)["']/g)) {
      addInternalReference({
        file,
        kind: "service-worker-precache",
        target: match[1],
        evidence: "STATIC_ASSETS",
        index: source.indexOf(staticAssets) + (match.index ?? 0),
      });
    }
    for (const match of source.matchAll(/caches\.match\(\s*["']([^"']+)["']/g)) {
      addInternalReference({
        file,
        kind: "service-worker-cache-fallback",
        target: match[1],
        evidence: "caches.match",
        index: match.index,
      });
    }
    for (const match of source.matchAll(/clients\.openWindow\(\s*([^)]+)\)/g)) {
      addInternalReference({
        file,
        kind: "service-worker-dynamic-navigation",
        target: `\${${match[1].trim()}}`,
        evidence: "clients.openWindow",
        index: match.index,
      });
    }
  }
  for (const route of routeRecords) {
    route.linksIn = route.linksIn
      .sort((left, right) =>
        `${left.source}:${left.target}`.localeCompare(`${right.source}:${right.target}`),
      )
      .slice(0, 40);
    const routeName = route.pathname.replaceAll("/", "").replaceAll("$", "");
    const escapedRoutePath = route.pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactRouteReference = new RegExp(`["'\`]${escapedRoutePath}["'\`]`);
    route.tests = walk(join(projectRoot, "tests"), (path) => sourceExtensions.has(extname(path)))
      .filter((path) => {
        const source = read(path);
        return (
          exactRouteReference.test(source) ||
          (routeName.length > 3 && source.includes(routeName)) ||
          source.includes(route.file)
        );
      })
      .map(normalizePath);
  }

  const supabaseReferences = {
    tables: new Map(),
    rpcs: new Map(),
    functions: new Map(),
    buckets: new Map(),
    realtimeChannels: new Map(),
    authFiles: [],
  };
  function addReference(map, name, file) {
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(normalizePath(file));
  }
  for (const file of sourceFiles) {
    const source = read(file);
    for (const name of collectMatches(source, /\.from\(\s*["']([^"']+)["']\s*\)/g)) {
      addReference(supabaseReferences.tables, name, file);
    }
    for (const name of collectMatches(source, /\.rpc\(\s*["']([^"']+)["']/g)) {
      addReference(supabaseReferences.rpcs, name, file);
    }
    for (const name of collectMatches(source, /\.functions\.invoke\(\s*["']([^"']+)["']/g)) {
      addReference(supabaseReferences.functions, name, file);
    }
    for (const name of collectMatches(source, /\.storage\.from\(\s*["']([^"']+)["']/g)) {
      addReference(supabaseReferences.buckets, name, file);
    }
    for (const name of collectMatches(source, /\.channel\(\s*["']([^"']+)["']/g)) {
      addReference(supabaseReferences.realtimeChannels, name, file);
    }
    if (/\.auth\./.test(source)) supabaseReferences.authFiles.push(normalizePath(file));
  }
  function mapToObject(map) {
    return Object.fromEntries(
      [...map.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, files]) => [name, unique(files)]),
    );
  }

  const providerMounts = [];
  function resolveProviderImport(file, source, name) {
    const namedImport = new RegExp(
      `import\\s*\\{[^}]*\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^}]*\\}\\s*from\\s*["']([^"']+)["']`,
      "s",
    ).exec(source)?.[1];
    if (!namedImport) return null;
    return {
      specifier: namedImport,
      resolved: resolveImport(file, namedImport),
    };
  }
  for (const file of sourceFiles) {
    const source = read(file);
    for (const name of unique(collectMatches(source, /<([A-Za-z_$][\w$]*Provider)\b/g))) {
      const importRecord = resolveProviderImport(file, source, name);
      const implementationSource = importRecord?.resolved ? read(importRecord.resolved) : "";
      providerMounts.push({
        provider: name,
        mountedAt: normalizePath(file),
        importedFrom: importRecord?.specifier ?? null,
        implementationFile: importRecord?.resolved ? normalizePath(importRecord.resolved) : null,
        sourceSignals: {
          supabase: /supabase|useAuth/.test(implementationSource),
          fetch: /\bfetch\s*\(/.test(implementationSource),
          query: /useQuery\s*\(|useInfiniteQuery\s*\(|\.from\s*\(/.test(implementationSource),
          rpc: /\.rpc\s*\(/.test(implementationSource),
          realtime: /\.channel\s*\(|postgres_changes|subscribe\s*\(/.test(implementationSource),
          subscriptions: /subscribe\s*\(|onAuthStateChange\s*\(|postgres_changes/.test(
            implementationSource,
          ),
          networkActivity:
            /\bfetch\s*\(|useQuery\s*\(|useInfiniteQuery\s*\(|\.from\s*\(|\.rpc\s*\(|\.channel\s*\(|subscribe\s*\(/.test(
              implementationSource,
            ),
          listeners: /addEventListener\s*\(/.test(implementationSource),
          timers: /setInterval\s*\(|setTimeout\s*\(/.test(implementationSource),
        },
      });
    }
  }

  const packageJson = JSON.parse(read(join(projectRoot, "package.json")));
  const importedPackages = new Map();
  for (const entry of imports) {
    const name = packageName(entry.specifier);
    if (!name) continue;
    if (!importedPackages.has(name)) importedPackages.set(name, []);
    importedPackages.get(name).push(entry.importer);
  }
  const configFiles = searchableFiles.filter((path) => {
    const normalized = normalizePath(path);
    return (
      !normalized.startsWith("src/") &&
      !normalized.startsWith("tests/") &&
      !normalized.startsWith("docs/") &&
      !["package.json", "package-lock.json", "bun.lock", "bun.lockb"].includes(normalized)
    );
  });
  const testFiles = walk(join(projectRoot, "tests"), (path) => sourceExtensions.has(extname(path)));
  const testPackageReferences = new Map();
  const testIncoming = new Map(sourceFiles.map((path) => [resolve(path), []]));
  for (const file of testFiles) {
    for (const match of read(file).matchAll(importExpression)) {
      const specifier = match[1] ?? match[2] ?? match[3];
      const target = resolveImport(file, specifier);
      if (target) testIncoming.get(target)?.push(file);
      const name = packageName(specifier);
      if (!name) continue;
      if (!testPackageReferences.has(name)) testPackageReferences.set(name, []);
      testPackageReferences.get(name).push(normalizePath(file));
    }
  }
  const dependencyUsage = Object.entries({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  })
    .map(([name, version]) => {
      const configReferences = configFiles
        .filter((file) => read(file).includes(name))
        .map(normalizePath);
      const directFiles = unique(importedPackages.get(name) ?? []);
      const testFiles = unique(testPackageReferences.get(name) ?? []);
      return {
        name,
        version,
        declaredAs: Object.hasOwn(packageJson.dependencies, name) ? "dependency" : "devDependency",
        directFiles,
        testFiles,
        configReferences: unique(configReferences),
        classification:
          directFiles.length > 0
            ? "directly-imported"
            : testFiles.length > 0
              ? "test-only"
              : configReferences.length > 0
                ? "build-or-config"
                : "apparently-unused-static-scan",
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const entryFiles = new Set([
    "src/router.tsx",
    "src/routeTree.gen.ts",
    "src/routes/__root.tsx",
    "src/integrations/supabase/client.ts",
    "src/integrations/supabase/client.server.ts",
  ]);
  const orphanCandidates = sourceFiles
    .filter((file) => {
      const normalized = normalizePath(file);
      if (entryFiles.has(normalized)) return false;
      if (normalized.startsWith("src/routes/")) return false;
      if (normalized.endsWith(".d.ts")) return false;
      if (normalized.includes("/showcase/")) return false;
      return (incoming.get(resolve(file)) ?? []).length === 0;
    })
    .map((file) => {
      const normalized = normalizePath(file);
      const source = read(file);
      const incomingTestImports = unique(
        (testIncoming.get(resolve(file)) ?? []).map(normalizePath),
      );
      const dynamicStringReferences = searchableFiles
        .filter((candidate) => candidate !== file && read(candidate).includes(normalized))
        .map(normalizePath);
      return {
        file: normalized,
        symbols: unique([
          ...collectMatches(
            source,
            /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g,
          ),
          ...collectMatches(source, /export\s*\{\s*([^}]+)\s*\}/g),
        ]),
        incomingStaticImports: 0,
        incomingTestImports,
        possibleIndirectReferences: dynamicStringReferences,
        classification:
          incomingTestImports.length > 0
            ? "test-only-contract"
            : dynamicStringReferences.length
              ? "used-indirectly-or-dynamically"
              : "potentially-orphaned-requires-investigation",
        removalSafety: "not-proven-safe",
      };
    })
    .sort((left, right) => left.file.localeCompare(right.file));

  const assetRoots = [join(projectRoot, "public"), join(sourceRoot, "assets")];
  const assetFiles = assetRoots.flatMap((root) =>
    walk(root, (path) => !textExtensions.has(extname(path)) || path.endsWith(".json")),
  );
  const assetRecords = assetFiles
    .map((file) => {
      const name = file.split(sep).at(-1);
      const references = searchableFiles
        .filter((candidate) => candidate !== file && read(candidate).includes(name))
        .map(normalizePath);
      return {
        file: normalizePath(file),
        bytes: statSync(file).size,
        references: unique(references),
        classification: references.length ? "referenced-by-basename" : "potentially-unreferenced",
        removalSafety: "not-proven-safe",
      };
    })
    .sort((left, right) => right.bytes - left.bytes || left.file.localeCompare(right.file));

  let cycleIndex = 0;
  const cycleStack = [];
  const onCycleStack = new Set();
  const cycleIndexes = new Map();
  const cycleLows = new Map();
  const cycles = [];
  function findStronglyConnected(file) {
    cycleIndexes.set(file, cycleIndex);
    cycleLows.set(file, cycleIndex);
    cycleIndex += 1;
    cycleStack.push(file);
    onCycleStack.add(file);
    for (const target of importGraph.get(file) ?? []) {
      if (!cycleIndexes.has(target)) {
        findStronglyConnected(target);
        cycleLows.set(file, Math.min(cycleLows.get(file), cycleLows.get(target)));
      } else if (onCycleStack.has(target)) {
        cycleLows.set(file, Math.min(cycleLows.get(file), cycleIndexes.get(target)));
      }
    }
    if (cycleLows.get(file) !== cycleIndexes.get(file)) return;
    const component = [];
    let target;
    do {
      target = cycleStack.pop();
      onCycleStack.delete(target);
      component.push(target);
    } while (target !== file);
    if (component.length > 1 || (importGraph.get(file) ?? []).includes(file)) {
      cycles.push(component.map(normalizePath).sort());
    }
  }
  for (const file of sourceFiles.map((path) => resolve(path))) {
    if (!cycleIndexes.has(file)) findStronglyConnected(file);
  }

  const auditMetadata = {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    auditedBaseCommit: AUDITED_BASE_COMMIT,
    generatedFrom: "working-tree-derived-from-audited-base",
    sourceState: "pre-commit-working-tree",
  };

  function countBy(records, select, requiredKeys = []) {
    return Object.fromEntries(
      unique([...requiredKeys, ...records.map(select)]).map((key) => [
        key,
        records.filter((record) => select(record) === key).length,
      ]),
    );
  }

  const routeSummary = {
    metadata: auditMetadata,
    count: routeRecords.length,
    byDomain: Object.fromEntries(
      unique(routeRecords.map((route) => route.domain)).map((domain) => [
        domain,
        routeRecords.filter((route) => route.domain === domain).length,
      ]),
    ),
    byAccess: Object.fromEntries(
      unique(routeRecords.map((route) => route.access)).map((access) => [
        access,
        routeRecords.filter((route) => route.access === access).length,
      ]),
    ),
    routes: routeRecords,
  };

  await writeJson("route-inventory.json", routeSummary);
  const sortedInternalLinks = internalLinks.sort((left, right) =>
    `${left.source}:${left.kind}:${left.target}`.localeCompare(
      `${right.source}:${right.kind}:${right.target}`,
    ),
  );
  await writeJson("internal-links.json", {
    metadata: auditMetadata,
    total: sortedInternalLinks.length,
    totalsBySource: countBy(sortedInternalLinks, (link) => link.source),
    totalsByFileType: countBy(sortedInternalLinks, (link) => link.fileType),
    totalsByOrigin: countBy(sortedInternalLinks, (link) => link.origin, [
      "src",
      "tests",
      "manifest",
      "sitemap",
      "public",
      "configuration",
      "other",
    ]),
    totalsByClassification: countBy(sortedInternalLinks, (link) => link.classification, [
      "route",
      "asset",
      "endpoint",
      "external",
      "deep-link",
      "dynamic",
    ]),
    totalsByStatus: countBy(sortedInternalLinks, (link) => link.status, [
      "resolved",
      "unresolved",
      "requires-investigation",
      "not-applicable",
    ]),
    unresolved: sortedInternalLinks.filter((link) => link.status === "unresolved"),
    requiresInvestigation: sortedInternalLinks.filter(
      (link) => link.status === "requires-investigation",
    ),
    links: sortedInternalLinks,
  });
  await writeJson("supabase-references.json", {
    metadata: auditMetadata,
    tables: mapToObject(supabaseReferences.tables),
    rpcs: mapToObject(supabaseReferences.rpcs),
    functions: mapToObject(supabaseReferences.functions),
    buckets: mapToObject(supabaseReferences.buckets),
    realtimeChannels: mapToObject(supabaseReferences.realtimeChannels),
    authFiles: unique(supabaseReferences.authFiles),
  });
  await writeJson("providers.json", {
    metadata: auditMetadata,
    count: providerMounts.length,
    mounts: providerMounts.sort((left, right) =>
      `${left.mountedAt}:${left.provider}`.localeCompare(`${right.mountedAt}:${right.provider}`),
    ),
  });
  await writeJson("dependency-usage.json", {
    metadata: auditMetadata,
    count: dependencyUsage.length,
    dependencies: dependencyUsage,
  });
  await writeJson("orphan-candidates.json", {
    metadata: auditMetadata,
    sourceCandidates: orphanCandidates,
    assetCandidates: assetRecords.filter(
      (asset) => asset.classification === "potentially-unreferenced",
    ),
    largestAssets: assetRecords.slice(0, 40),
  });
  await writeJson("module-graph.json", {
    metadata: auditMetadata,
    sourceFileCount: sourceFiles.length,
    importCount: imports.length,
    dynamicImportCount: imports.filter((entry) => entry.kind === "dynamic").length,
    cycles,
    v2Cycles: cycles.filter((cycle) => cycle.some((file) => file.startsWith("src/v2/"))),
  });

  console.log(
    JSON.stringify(
      {
        routes: routeSummary.count,
        references: sortedInternalLinks.length,
        routeReferences: sortedInternalLinks.filter((link) => link.classification === "route")
          .length,
        assetReferences: sortedInternalLinks.filter((link) => link.classification === "asset")
          .length,
        endpointReferences: sortedInternalLinks.filter((link) => link.classification === "endpoint")
          .length,
        externalReferences: sortedInternalLinks.filter((link) => link.classification === "external")
          .length,
        dynamicReferences: sortedInternalLinks.filter((link) => link.classification === "dynamic")
          .length,
        unresolvedRouteReferences: sortedInternalLinks.filter(
          (link) => link.classification === "route" && link.status === "unresolved",
        ).length,
        referencesRequiringInvestigation: sortedInternalLinks.filter(
          (link) => link.status === "requires-investigation",
        ).length,
        tables: supabaseReferences.tables.size,
        rpcs: supabaseReferences.rpcs.size,
        functions: supabaseReferences.functions.size,
        buckets: supabaseReferences.buckets.size,
        realtimeChannels: supabaseReferences.realtimeChannels.size,
        providerMounts: providerMounts.length,
        dependencies: dependencyUsage.length,
        apparentlyUnusedDependencies: dependencyUsage.filter(
          (dependency) => dependency.classification === "apparently-unused-static-scan",
        ).length,
        orphanCandidates: orphanCandidates.filter(
          (candidate) => candidate.classification === "potentially-orphaned-requires-investigation",
        ).length,
        potentiallyUnreferencedAssets: assetRecords.filter(
          (asset) => asset.classification === "potentially-unreferenced",
        ).length,
        cycles: cycles.length,
        v2Cycles: cycles.filter((cycle) => cycle.some((file) => file.startsWith("src/v2/"))).length,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runAudit();
}
