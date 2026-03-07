const CACHE_NAME = 'nos-v1';
const STATIC_ASSETS = [
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/empty-calendar.svg',
  '/hero-illustration.svg',
  '/stage-illustration.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API/Firebase 요청은 캐시하지 않음
  if (
    request.url.includes('firestore.googleapis.com') ||
    request.url.includes('googleapis.com/identitytoolkit') ||
    request.url.includes('/api/') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // 정적 자산: cache-first
  if (STATIC_ASSETS.some((asset) => request.url.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // 나머지: network-first (오프라인 시 캐시 사용)
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
