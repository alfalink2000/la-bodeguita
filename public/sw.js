// public/sw.js - VERSIÓN MÍNIMA (solo para instalación)
const CACHE_NAME = "minimarket-v1.0.7";

// Instalar - solo registrar, no cachear nada
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

// Activar - limpiar cachés antiguos
self.addEventListener("activate", (event) => {
  console.log("Service Worker activado");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// ❌ NO interceptar fetch - dejar que el navegador maneje todo
// Esto evita que el SW cachee archivos incorrectamente
self.addEventListener("fetch", (event) => {
  // Ir directamente a la red, sin cache
  event.respondWith(fetch(event.request));
});
