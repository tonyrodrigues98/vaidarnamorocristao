const CACHE_VERSION = "vaidarnamoro-pwa-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const STATIC_ASSETS = [
  "/offline.html",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

const SENSITIVE_PATHS = [
  "/admin",
  "/auth",
  "/bloqueados",
  "/conversas",
  "/interesses",
  "/loja",
  "/matches",
  "/notificacoes",
  "/perfil",
  "/presentes",
  "/pretendentes",
  "/proposito",
  "/recados",
  "/verificacao",
  "/api",
];

const STATIC_EXTENSIONS = [".css", ".js", ".ico", ".png", ".svg", ".webp", ".woff", ".woff2"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isSensitivePath(pathname) {
  return SENSITIVE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isSafeStaticRequest(url) {
  if (url.origin !== self.location.origin) return false;
  if (isSensitivePath(url.pathname)) return false;
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) return true;
  return STATIC_EXTENSIONS.some((extension) => url.pathname.endsWith(extension));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (isSafeStaticRequest(url)) {
    event.respondWith(cacheFirst(request));
  }
});
