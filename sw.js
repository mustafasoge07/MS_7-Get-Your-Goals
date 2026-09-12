const MS7_CACHE = 'get-your-goals-ms7-final-v1';
const MS7_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(MS7_CACHE)
      .then(cache => cache.addAll(MS7_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== MS7_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(MS7_CACHE).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    const cacheableType = ['script', 'style', 'font'].includes(request.destination);
    if (!cacheableType) return;
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(response => {
          if (response.ok || response.type === 'opaque') {
            const copy = response.clone();
            caches.open(MS7_CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached || Response.error());
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(MS7_CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
