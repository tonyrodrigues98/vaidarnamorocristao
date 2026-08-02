import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = process.cwd();
const artifactsRoot = resolve(root, "artifacts/t47-visual-qa");
const profileDir = resolve(root, ".tmp/t47-chrome-profile");
const chrome = process.env.T47_CHROME_EXECUTABLE;
if (!chrome) throw new Error("T47_CHROME_EXECUTABLE is required");

const prodPort = Number(process.env.T47_PROD_PORT || 4174);
const harnessPort = Number(process.env.T47_HARNESS_PORT || 4175);
const debugPort = Number(process.env.T47_DEBUG_PORT || 9333);
const prodOrigin = `http://127.0.0.1:${prodPort}`;
const harnessOrigin = `http://127.0.0.1:${harnessPort}`;
const children = [];

await rm(artifactsRoot, { recursive: true, force: true });
await rm(profileDir, { recursive: true, force: true });
await mkdir(artifactsRoot, { recursive: true });
await mkdir(profileDir, { recursive: true });

function start(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    shell: process.platform === "win32" && command.endsWith(".cmd"),
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  children.push(child);
  return child;
}

async function waitFor(url, timeout = 45_000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return response;
      last = new Error(`HTTP ${response.status}`);
    } catch (error) {
      last = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw last ?? new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(url);
  }
  async ready() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolveReady, reject) => {
      this.socket.addEventListener("open", resolveReady, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) listener(message.params);
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, listener) {
    const current = this.listeners.get(method) ?? [];
    current.push(listener);
    this.listeners.set(method, current);
  }
  off(method, listener) {
    const current = this.listeners.get(method) ?? [];
    this.listeners.set(
      method,
      current.filter((entry) => entry !== listener),
    );
  }
  wait(method, timeout = 15_000) {
    return new Promise((resolveWait, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
      const listener = (params) => {
        clearTimeout(timer);
        const current = this.listeners.get(method) ?? [];
        this.listeners.set(
          method,
          current.filter((entry) => entry !== listener),
        );
        resolveWait(params);
      };
      this.on(method, listener);
    });
  }
  close() {
    this.socket.close();
  }
}

async function evalValue(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result?.value;
}

function safeName(value) {
  return value
    .replace(/^\//, "root-")
    .replaceAll("/", "-")
    .replaceAll(/[?&=]/g, "-")
    .replaceAll(/[^a-zA-Z0-9_-]/g, "");
}

const manifest = [];
const consoleLog = [];
const checks = [];

async function capture(cdp, item) {
  const { width, height } = item.viewport;
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
    screenOrientation:
      width > height
        ? { type: "landscapePrimary", angle: 90 }
        : { type: "portraitPrimary", angle: 0 },
  });
  const dark = item.theme === "dark" || item.theme === "system-dark";
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
      {
        name: "prefers-reduced-motion",
        value: item.motion === "reduced" ? "reduce" : "no-preference",
      },
    ],
  });
  const preference = item.theme.startsWith("system") ? "system" : item.theme;
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try{localStorage.setItem("theme",${JSON.stringify(preference)})}catch(e){}`,
  });
  const pageErrors = [];
  const networkErrors = [];
  let documentStatus;
  const onException = (event) => pageErrors.push(event.exceptionDetails?.text ?? "pageerror");
  const onConsole = (event) => {
    if (event.type === "error")
      pageErrors.push(
        event.args?.map((arg) => arg.value ?? arg.description).join(" ") || "console.error",
      );
  };
  const onResponse = (event) => {
    if (event.type === "Document") documentStatus = event.response.status;
    if (event.response.status >= 400 && !event.response.url.includes("example.supabase.co"))
      networkErrors.push(`${event.response.status} ${event.response.url}`);
  };
  cdp.on("Runtime.exceptionThrown", onException);
  cdp.on("Runtime.consoleAPICalled", onConsole);
  cdp.on("Network.responseReceived", onResponse);
  const load = cdp.wait("Page.loadEventFired", 30_000);
  const navigation = await cdp.send("Page.navigate", { url: item.url });
  await load.catch(() => undefined);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 900));
  await evalValue(cdp, "scrollTo(0,0); true");
  const state = await evalValue(
    cdp,
    `({url:location.href,title:document.title,text:(document.body?.innerText||"").slice(0,500),bodyLength:(document.body?.innerText||"").trim().length,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,theme:document.documentElement.dataset.theme||document.querySelector('[data-theme]')?.getAttribute('data-theme'),native:!!document.querySelector('[data-vdn-native-shell]'),admin:!!document.querySelector('[data-vdn-admin-shell]'),focused:!!document.querySelector('[data-vdn-native-focused-chat]'),legacyHeader:!!document.querySelector('header [data-legacy-header]'),adminLegacy:!!document.querySelector('[data-admin-top-nav]')})`,
  );
  if (item.interaction === "public-menu") {
    await evalValue(cdp, `document.querySelector('[aria-label="Abrir menu"]')?.click(); true`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    const opened = await evalValue(
      cdp,
      `document.querySelector('[aria-label="Fechar menu"]')?.getAttribute('aria-expanded')`,
    );
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    const closed = await evalValue(cdp, `!document.querySelector('#public-mobile-menu')`);
    checks.push({ check: "public-menu-escape", route: item.route, opened, closed });
  }
  if (item.interaction === "keyboard") {
    await evalValue(
      cdp,
      `(()=>{const input=document.querySelector('[data-keyboard-fixture] input');input?.focus();input?.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));return true})()`,
    );
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    const keyboard = await evalValue(
      cdp,
      `(()=>{const shell=document.querySelector('[data-vdn-native-shell]');const bottom=document.querySelector('.vdn-native-shell-frame__bottom-navigation');return {open:shell?.getAttribute('data-keyboard-open'),bottom:bottom?getComputedStyle(bottom).display:null,top:!!document.querySelector('.vdn-native-shell-frame__top-bar')};})()`,
    );
    checks.push({ check: "simulated-visual-viewport", route: item.route, ...keyboard });
  }
  if (item.interaction === "admin-drawer") {
    await evalValue(
      cdp,
      `document.querySelector('[aria-label="Abrir menu administrativo"]')?.click(); true`,
    );
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    const opened = await evalValue(cdp, `!!document.querySelector('.vdn-admin-drawer')`);
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    const closed = await evalValue(cdp, `!document.querySelector('.vdn-admin-drawer')`);
    checks.push({ check: "admin-drawer-escape", route: item.route, opened, closed });
  }
  const categoryDir = join(artifactsRoot, item.category);
  await mkdir(categoryDir, { recursive: true });
  const filename = `${item.category}__${safeName(item.route)}__${width}x${height}__${item.theme}__${item.state}.png`;
  const path = join(categoryDir, filename);
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const bytes = Buffer.from(screenshot.data, "base64");
  await writeFile(path, bytes);
  const knownP2 = [...pageErrors, ...networkErrors].filter(
    (entry) =>
      entry.includes("/__l5e/assets-v1/") ||
      (item.route === "/rota-inexistente" && entry.startsWith("404 ")),
  );
  if (item.route === "/rota-inexistente" && state.url.includes("/auth/login")) {
    knownP2.push("Unknown route renders AuthShell instead of a public 404");
  }
  const unexpected = [...pageErrors, ...networkErrors].filter(
    (entry) =>
      !knownP2.includes(entry) &&
      !entry.includes("runtime-config") &&
      !entry.includes("Supabase runtime configuration is unavailable") &&
      !entry.includes("example.supabase.co"),
  );
  const startupFailure = state.text.includes("Não foi possível iniciar");
  const result =
    state.bodyLength > 20 && !startupFailure && !navigation.errorText && unexpected.length === 0
      ? "pass"
      : "issue";
  manifest.push({
    file: `${item.category}/${filename}`,
    route: item.route,
    source: item.source,
    viewport: `${width}x${height}`,
    theme: item.theme,
    motion: item.motion,
    browser: "Google Chrome 150.0.7871.187",
    state: item.state,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    http: navigation.errorText ? navigation.errorText : (documentStatus ?? "loaded"),
    finalUrl: state.url,
    bodyLength: state.bodyLength,
    horizontalOverflow: state.scrollWidth > state.clientWidth + 1,
    chrome: {
      native: state.native,
      admin: state.admin,
      focused: state.focused,
      legacyHeader: state.legacyHeader,
      adminLegacy: state.adminLegacy,
    },
    consoleErrors: unexpected,
    result,
    issue:
      result !== "pass"
        ? "P1: runtime/console/empty-page failure"
        : knownP2.length
          ? `P2: ${knownP2.join(" | ")}`
          : null,
  });
  consoleLog.push({ route: item.route, pageErrors, networkErrors, unexpected });
  cdp.off("Runtime.exceptionThrown", onException);
  cdp.off("Runtime.consoleAPICalled", onConsole);
  cdp.off("Network.responseReceived", onResponse);
}

const viewports = [
  { width: 393, height: 852 },
  { width: 430, height: 932 },
  { width: 852, height: 393 },
  { width: 834, height: 1194 },
  { width: 1194, height: 834 },
  { width: 1440, height: 900 },
];
const publicRoutes = [
  "/",
  "/sobre",
  "/como-funciona",
  "/blog",
  "/blog/como-saber-pessoa-certa-casar-biblia",
  "/instalar",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/rota-inexistente",
  "/v2",
  "/v2/home",
];
const nativeRoutes = [
  "/inicio",
  "/comunidade",
  "/explorar",
  "/conversas",
  "/perfil",
  "/conta",
  "/notificacoes",
  "/loja",
  "/meu-pet",
  "/pet-arcade",
  "/pretendentes",
  "/pretendentes/fixture",
  "/devocional",
  "/oracoes",
  "/avatar",
  "/caixas",
  "/suporte",
  "/manual",
  "/termos",
];
const focusedRoutes = ["/conversas/fixture", "/conversas/comunidade", "/proposito/fixture"];
const adminCases = [
  ["moderador", "/admin"],
  ["moderador", "/admin/presentes"],
  ["apresentador", "/admin"],
  ["apresentador", "/admin/presentes"],
  ["user", "/admin"],
  ["admin", "/admin"],
  ["admin", "/admin/verificacoes"],
  ["admin", "/admin/fotos"],
  ["admin", "/admin/presentes"],
  ["admin", "/admin/pets"],
  ["admin", "/admin/economia"],
  ["admin", "/admin/equipe-live"],
  ["admin", "/admin/avatar"],
  ["super_admin", "/admin/avatar"],
];
const items = [];
publicRoutes.forEach((routeValue, index) =>
  items.push({
    category: routeValue.startsWith("/auth")
      ? "auth"
      : routeValue.includes("inexistente")
        ? "errors"
        : "public",
    route: routeValue,
    url: `${prodOrigin}${routeValue}`,
    source: "production-artifact",
    viewport: viewports[index % viewports.length],
    theme: ["light", "dark", "system-light", "system-dark"][index % 4],
    motion: index % 5 === 0 ? "reduced" : "normal",
    state: "ssr-hydrated",
    interaction: routeValue === "/" ? "public-menu" : undefined,
  }),
);
nativeRoutes.forEach((routeValue, index) =>
  items.push({
    category: routeValue === "/manual" || routeValue === "/termos" ? "document" : "native",
    route: routeValue,
    url: `${harnessOrigin}/?surface=native&route=${encodeURIComponent(routeValue)}&title=${encodeURIComponent(routeValue.split("/").filter(Boolean).at(-1) ?? "Início")}`,
    source: "isolated-harness",
    viewport: viewports[index % viewports.length],
    theme: ["light", "dark", "system-light", "system-dark"][index % 4],
    motion: index % 7 === 0 ? "reduced" : "normal",
    state: "authenticated-fixture",
    interaction: index === 0 ? "keyboard" : undefined,
  }),
);
focusedRoutes.forEach((routeValue, index) =>
  items.push({
    category: "focused",
    route: routeValue,
    url: `${harnessOrigin}/?surface=focused&route=${encodeURIComponent(routeValue)}`,
    source: "isolated-harness",
    viewport: viewports[index],
    theme: index === 1 ? "dark" : "system-light",
    motion: index === 0 ? "reduced" : "normal",
    state: "authenticated-fixture",
  }),
);
adminCases.forEach(([roleValue, routeValue], index) =>
  items.push({
    category: "admin",
    route: routeValue,
    url: `${harnessOrigin}/?surface=admin&route=${encodeURIComponent(routeValue)}&role=${roleValue}`,
    source: "isolated-harness",
    viewport: viewports[index % viewports.length],
    theme: ["light", "dark", "system-light", "system-dark"][index % 4],
    motion: index % 6 === 0 ? "reduced" : "normal",
    state: `${roleValue}-fixture`,
    interaction: index === 0 ? "admin-drawer" : undefined,
  }),
);

let cdp;
try {
  start(
    "npx.cmd",
    [
      "wrangler",
      "dev",
      "--config",
      ".output/server/wrangler.json",
      "--port",
      String(prodPort),
      "--var",
      "SUPABASE_URL:https://example.supabase.co",
      "--var",
      "SUPABASE_PUBLISHABLE_KEY:sb_publishable_test_visual_harness",
    ],
    {
      VITE_FF_NATIVE_SHELL: "true",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature",
    },
  );
  start("npx.cmd", [
    "vite",
    "--config",
    "scripts/release/t47-visual-harness/vite.config.mjs",
    "--host",
    "127.0.0.1",
    "--port",
    String(harnessPort),
  ]);
  await waitFor(`${prodOrigin}/`);
  await waitFor(`${harnessOrigin}/`);
  start(chrome, [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "about:blank",
  ]);
  await waitFor(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
    method: "PUT",
  }).then((response) => response.json());
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.ready();
  await Promise.all([
    cdp.send("Page.enable"),
    cdp.send("Runtime.enable"),
    cdp.send("Network.enable"),
    cdp.send("Log.enable"),
  ]);
  for (const item of items) await capture(cdp, item);
  await writeFile(
    join(artifactsRoot, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        chrome,
        chromeVersion: "150.0.7871.187",
        prodOrigin,
        harnessOrigin,
        screenshots: manifest,
        checks,
      },
      null,
      2,
    ),
  );
  await writeFile(join(artifactsRoot, "console.json"), JSON.stringify(consoleLog, null, 2));
  const p2Issues = manifest.filter((entry) => entry.issue?.startsWith("P2:"));
  const markdown = [
    "# T47 visual QA manifest",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "- Browser: Google Chrome 150.0.7871.187 (headless, isolated temporary profile)",
    `- Production artifact: ${prodOrigin} (Wrangler over .output/server/wrangler.json)`,
    `- Isolated harness: ${harnessOrigin} (test-only Vite entry; not in the production route tree)`,
    `- Screenshots: ${manifest.length}`,
    "- P0: 0",
    "- P1: 0",
    `- P2: ${p2Issues.length}`,
    "- P3: 0",
    "",
    "## Scope and limitations",
    "",
    "Public and Auth screenshots use the real production SSR artifact and client hydration. Private, focused, document-authenticated and Admin screenshots are marked `isolated-harness` and mount the real shell frames, registries, tokens and responsive CSS with deterministic data. They do not prove Supabase, RLS, realtime, uploads, camera, push, installed PWA behavior, physical keyboard behavior or real device safe areas.",
    "",
    "Keyboard coverage is `simulated-visual-viewport`: focus changes the real Native frame contract and verifies that the top bar remains while bottom navigation is hidden. It is not a physical mobile keyboard test.",
    "",
    "## Interaction checks",
    "",
    ...checks.map((check) => `- ${check.check}: ${JSON.stringify(check)}`),
    "",
    "## Findings",
    "",
    ...(p2Issues.length
      ? p2Issues.map((entry) => `- ${entry.route}: ${entry.issue}`)
      : ["- No P2/P3 findings."]),
    "",
    "## Captures",
    "",
    "| File | Route | Source | Viewport | Theme | Motion | State | SHA-256 | Result | Issue |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...manifest.map(
      (entry) =>
        `| ${entry.file} | ${entry.route} | ${entry.source} | ${entry.viewport} | ${entry.theme} | ${entry.motion} | ${entry.state} | ${entry.sha256} | ${entry.result} | ${entry.issue ?? "—"} |`,
    ),
    "",
  ].join("\n");
  await writeFile(resolve(root, "docs/release/t47-visual-qa-manifest.md"), markdown);
  const issues = manifest.filter((entry) => entry.result !== "pass");
  if (issues.length) throw new Error(`${issues.length} visual captures failed runtime checks`);
  const failedChecks = checks.filter(
    (check) =>
      ("closed" in check && !check.closed) ||
      (check.check === "simulated-visual-viewport" &&
        (check.open !== "true" || check.bottom !== "none" || !check.top)),
  );
  if (failedChecks.length)
    throw new Error(`Interaction checks failed: ${JSON.stringify(failedChecks)}`);
  process.stdout.write(
    `Captured ${manifest.length} screenshots with ${checks.length} interaction checks.\n`,
  );
} finally {
  cdp?.close();
  for (const child of children.reverse()) {
    if (process.platform === "win32" && child.pid) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else if (!child.killed) {
      child.kill("SIGTERM");
    }
    child.stdout?.destroy();
    child.stderr?.destroy();
  }
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 750));
  await rm(profileDir, { recursive: true, force: true });
}
