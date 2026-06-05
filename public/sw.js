const CACHE_VERSION = "vaidarnamoro-pwa-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const STATIC_ASSETS = [
  "/offline.html",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
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
        Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isSensitivePath(pathname) {
  return SENSITIVE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isSafeStaticRequest(request, url) {
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return false;
  }

  if (isSensitivePath(url.pathname)) {
    return false;
  }

  return STATIC_EXTENSIONS.some((extension) => url.pathname.endsWith(extension));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (isSafeStaticRequest(request, url)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "VaiDarNamoro",
      body: event.data.text(),
    };
  }

  const title = typeof payload.title === "string" ? payload.title : "VaiDarNamoro";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "Voce tem uma nova notificacao.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url:
        payload.data && typeof payload.data.url === "string"
          ? payload.data.url
          : typeof payload.url === "string"
            ? payload.url
            : "/notificacoes",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/notificacoes";
  const url = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const existingClient = windowClients.find((client) => client.url === url);

      if (existingClient) {
        return existingClient.focus();
      }

      return clients.openWindow(url);
    }),
  );
});
