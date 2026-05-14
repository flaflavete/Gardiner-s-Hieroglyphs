const CACHE = 'hieroglifos-v1';

// These heavy files are cached forever (they never change)
const STATIC = [
  './NotoSansEgyptianHieroglyphs-Regular.ttf',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './gardiner_data.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isStatic = STATIC.some(f => url.pathname.endsWith(f.replace('./', '/')));

  if (isStatic) {
    // Cache first for font and icons
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  } else {
    // Network first for HTML, JS, manifest — always gets latest version
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
