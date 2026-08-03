import { pathToFileURL } from "node:url";

export const SMOKE_ROUTES = Object.freeze([
  { path: "/", statuses: [200], kind: "html" },
  { path: "/auth/login", statuses: [200], kind: "html" },
  { path: "/manifest.webmanifest", statuses: [200], kind: "json" },
  { path: "/sw.js", statuses: [200], kind: "javascript" },
  { path: "/rota-inexistente", statuses: [404], kind: "html" },
  { path: "/v2", statuses: [301, 302, 307, 308], kind: "redirect" },
  { path: "/api/public/runtime-config", statuses: [200], kind: "runtime-config" },
]);

const DEFAULT_TIMEOUT_MS = 10_000;
const USER_AGENT = "VaiDarNamoro-Ops-Smoke/1.0";

function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function normalizeBaseUrl(value) {
  const baseUrl = new URL(value);
  if (baseUrl.username || baseUrl.password) {
    throw new Error("The base URL must not contain credentials");
  }
  if (
    baseUrl.protocol !== "https:" &&
    !(baseUrl.protocol === "http:" && isLoopback(baseUrl.hostname))
  ) {
    throw new Error("HTTPS is required except for localhost");
  }
  if (baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("Provide an origin without path, query string, or hash");
  }
  return baseUrl;
}

function assertContentType(response, expected) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (expected === "html" && !contentType.includes("text/html")) {
    throw new Error(`expected HTML, received ${contentType || "no content-type"}`);
  }
  if (expected === "json" && !contentType.includes("json")) {
    throw new Error(`expected JSON, received ${contentType || "no content-type"}`);
  }
  if (expected === "javascript" && !/(javascript|text\/plain)/.test(contentType)) {
    throw new Error(`expected JavaScript, received ${contentType || "no content-type"}`);
  }
}

async function validateResponse(baseUrl, route, response) {
  if (!route.statuses.includes(response.status)) {
    throw new Error(
      `unexpected status ${response.status}; expected ${route.statuses.join(" or ")}`,
    );
  }

  if (route.kind === "redirect") {
    const location = response.headers.get("location");
    if (!location) throw new Error("redirect response is missing Location");
    const redirectUrl = new URL(location, baseUrl);
    if (redirectUrl.origin !== baseUrl.origin) {
      throw new Error(`redirect escaped the monitored origin to ${redirectUrl.origin}`);
    }
    return;
  }

  assertContentType(response, route.kind === "runtime-config" ? "json" : route.kind);

  if (route.kind === "json") {
    await response.json();
  }

  if (route.kind === "runtime-config") {
    const payload = await response.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.supabaseUrl !== "string" ||
      typeof payload.publishableKey !== "string" ||
      !payload.supabaseUrl ||
      !payload.publishableKey
    ) {
      throw new Error("runtime config JSON is missing public fields");
    }
  }
}

export async function runSmoke(
  baseUrlValue,
  {
    fetchImpl = fetch,
    logger = console,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    routes = SMOKE_ROUTES,
  } = {},
) {
  const baseUrl = normalizeBaseUrl(baseUrlValue);
  const results = [];

  for (const route of routes) {
    const url = new URL(route.path, baseUrl);
    const response = await fetchImpl(url, {
      headers: { "user-agent": USER_AGENT, accept: "*/*" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    await validateResponse(baseUrl, route, response);
    results.push({ path: route.path, status: response.status });
    logger.log(`PASS ${route.path} ${response.status}`);
  }

  logger.log(`Smoke passed: ${results.length} routes on ${baseUrl.origin}`);
  return results;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error("Usage: npm run ops:smoke -- https://example.com");
    process.exitCode = 1;
  } else {
    runSmoke(baseUrl).catch((error) => {
      console.error(`Smoke failed: ${error instanceof Error ? error.message : "unknown error"}`);
      process.exitCode = 1;
    });
  }
}
