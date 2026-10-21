/*
 * BluDoku offline support.
 *
 * - Pages: network first (so updates show up right away), falling back to the
 *   saved copy when offline.
 * - Built code, sounds and images: saved on first use and served from the cache
 *   (their file names change whenever their contents do).
 * - After install, every level page is quietly saved in the background so the
 *   whole game works with no signal.
 */
const CACHE = "bludoku-v1";
const CORE = ["/", "/daily/", "/random/", "/cats/", "/trophies/", "/manifest.webmanifest", "/icon-192.png"];
const LEVEL_COUNT = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
  // Save the levels a few at a time, without holding up activation.
  precacheLevels();
});

async function precacheLevels() {
  const cache = await caches.open(CACHE);
  for (let id = 1; id <= LEVEL_COUNT; id++) {
    const url = `/level/${id}/`;
    try {
      if (!(await cache.match(url))) {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      }
    } catch {
      return; // offline or interrupted: try again next time
    }
  }
}

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/sounds/") || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Pages and page data: try the network, keep a copy, fall back to the copy offline.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok && (req.mode === "navigate" || url.pathname.endsWith(".txt"))) cache.put(req, res.clone());
        return res;
      } catch {
        const hit = (await cache.match(req)) ?? (await cache.match(req, { ignoreSearch: true }));
        if (hit) return hit;
        if (req.mode === "navigate") return (await cache.match("/")) ?? Response.error();
        return Response.error();
      }
    })(),
  );
});
