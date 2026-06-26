const CACHE_NAME = 'digital-knight-cache-v13';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo-2025.png',
  '/loader.min.js',
  
  // Agrega más archivos que quieras cachear
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/manifest.json') {
    // Siempre traer manifest.json desde la red, sin caché
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

