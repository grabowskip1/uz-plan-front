// Prosty service worker dla GitHub Pages (cache statyków)
const CACHE = "uz-przerwy-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Network-first dla Workera, cache-first dla statyków
  const isWorkerAPI = /\/parseUZ(\?|$)/.test(new URL(req.url).pathname);
  if (isWorkerAPI) {
    e.respondWith(
      fetch(req).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
        return r;
      }).catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      return r;
    }))
  );
});
