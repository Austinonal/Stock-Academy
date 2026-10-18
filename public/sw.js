// Offline support: precache every built file on install, then
// pages = network first (fresh deploys win), hashed assets = cache first.
// shortcut: old caches are only dropped when CACHE changes; bump it if the precache list ever goes stale.
const CACHE = 'stocklab-v1';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const files = new Set(['./', 'index.html', 'favicon.svg', 'manifest.webmanifest']);
    const res = await fetch('asset-manifest.json', { cache: 'no-store' });
    if (res.ok) {
      for (const chunk of Object.values(await res.json())) {
        files.add(chunk.file);
        for (const f of [...(chunk.css ?? []), ...(chunk.assets ?? [])]) files.add(f);
      }
    }
    await (await caches.open(CACHE)).addAll([...files]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('index.html', copy));
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit ?? fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
