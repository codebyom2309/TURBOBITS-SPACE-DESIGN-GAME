const CACHE_VER = "20261114p8";
const SHELL_CACHE = `cosmo-quest-shell-${CACHE_VER}`;
const API_CACHE = `cosmo-quest-api-${CACHE_VER}`;
const FONT_CACHE = `cosmo-quest-fonts-${CACHE_VER}`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  `/style.css?v=${CACHE_VER}`,
  `/sprites.js?v=${CACHE_VER}`,
  `/labs.js?v=${CACHE_VER}`,
  `/scenes.js?v=${CACHE_VER}`,
  `/prologue.js?v=${CACHE_VER}`,
  `/cosmo.js?v=${CACHE_VER}`,
  `/campaign.js?v=${CACHE_VER}`,
  `/game.js?v=${CACHE_VER}`,
  `/program.js?v=${CACHE_VER}`,
  `/career.js?v=${CACHE_VER}`,
  `/mentor.js?v=${CACHE_VER}`,
  `/pwa.js?v=${CACHE_VER}`,
  "/manifest.webmanifest",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/pwa-maskable-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .open(SHELL_CACHE)
        .then((cache) =>
          Promise.all(
            CORE_ASSETS.map((url) =>
              cache.add(new Request(url, { cache: "reload" })).catch(() => null)
            )
          )
        ),
      caches
        .open(API_CACHE)
        .then((cache) => cache.add(new Request("/api/catalog", { cache: "reload" })).catch(() => null)),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, API_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("cosmo-quest-") && !keep.has(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "Offline — cached data unavailable." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function fontStaleWhileRevalidate(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);
  const netPromise = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) {
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);
  return cached || (await netPromise) || new Response("", { status: 200, headers: { "Content-Type": "text/css; charset=utf-8" } });
}

async function staticCacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached =
    (await cache.match(request)) ||
    (await cache.match(request, { ignoreSearch: true }));

  const refresh = fetch(request)
    .then((res) => {
      if (res && res.ok) {
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }
  const fresh = await refresh;
  return fresh || new Response("Offline", { status: 503 });
}

async function handleNavigate(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put("/index.html", res.clone());
    }
    return res;
  } catch (_) {
    const cache = await caches.open(SHELL_CACHE);
    return (
      (await cache.match("/index.html")) ||
      (await cache.match("/")) ||
      new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com"
  ) {
    event.respondWith(fontStaleWhileRevalidate(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.pathname === "/api/health") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ status: "offline" }), {
            status: 200,
            headers: { "Content-Type": "application/json", "X-PWA-Offline": "1" },
          })
      )
    );
    return;
  }

  if (url.pathname === "/api/catalog" || url.pathname === "/api/leaderboard") {
    event.respondWith(networkFirstApi(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
    return;
  }

  event.respondWith(staticCacheFirst(request));
});
