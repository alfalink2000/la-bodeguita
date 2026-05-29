// public/sw.js - VERSIÓN CORREGIDA (sin cacheo de JS)
const CACHE_NAME = "minimarket-v1.0.6";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache abierto");
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
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
  self.clients.claim();
});

// ✅ Interceptar peticiones - SOLO HTML, NO JS
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ✅ NUNCA cachear archivos JavaScript o CSS
  if (
    url.pathname.match(/\.(js|css|map|json|png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    // Para assets, ir directamente a la red
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ Solo cachear HTML
  if (
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname.endsWith(".html")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
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

  // ✅ Para todo lo demás, ir a la red
  event.respondWith(fetch(event.request));
});
