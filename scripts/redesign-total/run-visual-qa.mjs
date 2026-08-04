import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { access, copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "artifacts/redesign-zero");
const profile = resolve(root, `.tmp/redesign-zero-chrome-profile-${process.pid}`);
const port = Number(process.env.REDESIGN_HARNESS_PORT || 4181);
const debugPort = Number(process.env.REDESIGN_CHROME_DEBUG_PORT || 9341);
const origin = `http://127.0.0.1:${port}`;
const candidates = [
  process.env.CHROME_EXECUTABLE,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

let chrome;
for (const candidate of candidates) {
  try {
    await access(candidate);
    chrome = candidate;
    break;
  } catch {}
}
if (!chrome) throw new Error("Google Chrome executable was not found");

await rm(output, { recursive: true, force: true });
await rm(profile, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await mkdir(profile, { recursive: true });

const children = [];
function start(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    shell: process.platform === "win32" && command.endsWith(".cmd"),
  });
  children.push(child);
  return child;
}

async function waitFor(url, timeout = 45_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(url) {
    this.id = 0;
    this.pending = new Map();
    this.socket = new WebSocket(url);
  }
  async ready() {
    await new Promise((resolveReady, reject) => {
      this.socket.addEventListener("open", resolveReady, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    this.socket.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails, null, 2));
  }
  return result.result?.value;
}

const cases = [
  ["mobile-393x852-inicio.png", "inicio", 393, 852],
  ["mobile-393x852-comunidade.png", "comunidade", 393, 852],
  ["mobile-393x852-explorar.png", "explorar", 393, 852],
  ["mobile-393x852-conversas.png", "conversas", 393, 852],
  ["mobile-393x852-perfil.png", "perfil", 393, 852],
  ["mobile-430x932-inicio.png", "inicio", 430, 932],
  ["tablet-834x1194-inicio.png", "inicio", 834, 1194],
  ["desktop-1440x900-inicio.png", "inicio", 1440, 900],
  ["desktop-1440x900-conversas.png", "conversas", 1440, 900],
  ["desktop-1440x900-perfil.png", "perfil", 1440, 900],
];

let cdp;
const report = [];
try {
  start(process.execPath, [
    resolve(root, "node_modules/vite/bin/vite.js"),
    "--config",
    "scripts/redesign-zero/visual-harness/vite.config.mjs",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
  ]);
  await waitFor(origin);
  start(chrome, [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "about:blank",
  ]);
  await waitFor(`http://127.0.0.1:${debugPort}/json/version`);
  const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((res) =>
    res.json(),
  );
  const pages = await fetch(`http://127.0.0.1:${debugPort}/json`).then((res) => res.json());
  const page = pages.find((entry) => entry.type === "page");
  if (!page) throw new Error("Chrome did not expose a page target");
  cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (const [filename, surface, width, height] of cases) {
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
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: "light" },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
    await cdp.send("Page.navigate", { url: `${origin}/?surface=${surface}` });
    const readyDeadline = Date.now() + 8_000;
    while (Date.now() < readyDeadline) {
      const ready = await evaluate(
        cdp,
        `Boolean(document.querySelector('[data-vdn-redesign-total][data-vdn-visual-zero]'))`,
      );
      if (ready) break;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
    const state = await evaluate(
      cdp,
      `(()=>{const all=[...document.querySelectorAll('a,button,input,textarea,select')];const actionable=all.filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0});const small=actionable.filter(el=>{const r=el.getBoundingClientRect();return r.width<44||r.height<44}).map(el=>({tag:el.tagName,label:el.getAttribute('aria-label')||el.textContent?.trim().slice(0,40),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));const avatar=[...document.querySelectorAll('.vz-avatar__media')].find(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0});const avatarStyle=avatar?getComputedStyle(avatar):null;const redesign=document.querySelector('[data-vdn-redesign-total][data-vdn-visual-zero]');return {bodyText:(document.body?.innerText||'').trim().length,redesign:!!redesign,legacyHeader:!!document.querySelector('[data-legacy-header],.mobile-app-header'),bottom:!!document.querySelector('.rd-bottom-nav'),sidebar:!!document.querySelector('.rd-sidebar'),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,smallTargets:small,avatar:avatar?{width:avatar.getBoundingClientRect().width,height:avatar.getBoundingClientRect().height,radius:avatarStyle.borderRadius}:null,colorScheme:getComputedStyle(redesign||document.body).colorScheme};})()`,
    );
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
    const bytes = Buffer.from(screenshot.data, "base64");
    await writeFile(resolve(output, filename), bytes);
    const failures = [];
    if (!state.redesign) failures.push("redesign marker absent");
    if (state.legacyHeader) failures.push("legacy header visible");
    if (state.scrollWidth > state.clientWidth + 1) failures.push("horizontal overflow");
    if (width < 768 && !state.bottom) failures.push("mobile bottom navigation absent");
    if (width >= 768 && !state.sidebar) failures.push("tablet/desktop sidebar absent");
    if (state.smallTargets.length > 0) failures.push("visible touch target below 44px");
    if (
      state.avatar &&
      (Math.abs(state.avatar.width - state.avatar.height) > 1 ||
        !(
          state.avatar.radius.includes("50%") ||
          Number.parseFloat(state.avatar.radius) >=
            Math.min(state.avatar.width, state.avatar.height) / 2
        ))
    )
      failures.push("avatar is not circular");
    report.push({
      file: filename,
      surface,
      viewport: `${width}x${height}`,
      browser: version.Browser,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      horizontalOverflow: state.scrollWidth > state.clientWidth + 1,
      visibleSmallTargets: state.smallTargets,
      avatar: state.avatar,
      colorScheme: state.colorScheme,
      result: state.bodyText > 20 && failures.length === 0 ? "pass" : "issue",
      issues: failures,
    });
  }
  await writeFile(resolve(output, "manifest.json"), JSON.stringify(report, null, 2));
  const cards = report
    .map(
      (item) =>
        `<article><img src="${item.file}" alt="${item.surface} ${item.viewport}"><h2>${item.surface} · ${item.viewport}</h2><p>${item.result.toUpperCase()} · ${item.issues.join(", ") || "sem falhas estruturais"}</p></article>`,
    )
    .join("");
  await writeFile(
    resolve(output, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>VDN Redesign Total QA</title><style>body{margin:0;background:#f3f3f5;color:#1a1a1d;font:14px system-ui;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}article{background:white;border-radius:16px;padding:14px;box-shadow:0 8px 28px #1111}img{display:block;width:100%;height:520px;object-fit:contain;object-position:top;background:#fafafa;border-radius:10px}h2{font-size:16px;margin:12px 0 4px}p{color:#696b73;margin:0}</style><h1>VDN Redesign Total · contato visual</h1><main>${cards}</main>`,
  );
  const comparison = resolve(output, "comparison");
  await mkdir(comparison, { recursive: true });
  const comparisonRows = [];
  for (const surface of ["inicio", "comunidade", "explorar", "conversas", "perfil"]) {
    const prototypeName = `prototype-${surface}.png`;
    const phaseName = `phase-one-${surface}.png`;
    const zeroName = `visual-zero-${surface}.png`;
    await copyFile(
      resolve(root, `../../artifacts/redesign-reference/desktop-${surface}.png`),
      resolve(comparison, prototypeName),
    );
    await copyFile(
      resolve(root, `artifacts/redesign-total/mobile-393x852-${surface}.png`),
      resolve(comparison, phaseName),
    );
    await copyFile(
      resolve(
        output,
        ["inicio", "conversas", "perfil"].includes(surface)
          ? `desktop-1440x900-${surface}.png`
          : `mobile-393x852-${surface}.png`,
      ),
      resolve(comparison, zeroName),
    );
    comparisonRows.push(
      `<section><h2>${surface}</h2><div><figure><img src="${prototypeName}"><figcaption>Prototype 01</figcaption></figure><figure><img src="${phaseName}"><figcaption>Phase 01 rejeitada</figcaption></figure><figure><img src="${zeroName}"><figcaption>Visual Zero</figcaption></figure></div></section>`,
    );
  }
  await writeFile(
    resolve(comparison, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>VDN · comparação visual</title><style>body{margin:0;background:#edeef1;color:#191a1e;font:14px system-ui;padding:24px}section{margin:0 0 32px}section>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}figure{margin:0;background:white;padding:10px;border-radius:14px}img{width:100%;height:620px;object-fit:contain;object-position:top;background:#f8f8f8}figcaption{font-weight:700;margin-top:8px;text-align:center}@media(max-width:800px){section>div{grid-template-columns:1fr}img{height:auto}}</style><h1>Prototype 01 × Phase 01 × Visual Zero</h1>${comparisonRows.join("")}`,
  );
  if (report.some((item) => item.result !== "pass")) {
    throw new Error("Visual QA found structural issues");
  }
  process.stdout.write(
    `${JSON.stringify({ chrome: version.Browser, screenshots: report.length, output }, null, 2)}\n`,
  );
} finally {
  cdp?.close();
  for (const child of children) child.kill();
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
