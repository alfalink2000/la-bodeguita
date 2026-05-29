// public/sw.js
const CACHE_NAME = "minimarket-v1.0.5"; // ✅ Actualizar versión

// ✅ Solo cachear estos archivos específicos
const urlsToCache = ["/", "/index.html", "/manifest.json", "/offline.html"];

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache abierto");
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting(); // ✅ Activar SW inmediatamente
});

// Activar Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Eliminando cache antiguo:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim(); // ✅ Tomar control inmediatamente
});

// ✅ Interceptar peticiones con estrategia "Network First" para JS
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ✅ Para archivos JS, CSS y assets - NO cachear, solo red
  if (url.pathname.match(/\.(js|css|map|json)$/)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ Para HTML, intentar red primero, fallback a cache
  if (
    url.pathname.match(/\.html$/) ||
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cachear la respuesta para offline
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        }),
    );
    return;
  }

  // ✅ Para imágenes y otros, cache-first
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    }),
  );
});
