/**
 * Service Worker - Triumph Tiger 900 Roteiro
 * Estratégia: Cache-First para páginas do roteiro
 * Permite acesso offline durante a viagem
 */

const CACHE_NAME = 'tiger-roteiro-v1';
const BASE_PATH = '/tiger-900';

// Arquivos essenciais para cache offline
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/roteiro/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/checklist/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/mapas-offline/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/guia-clima/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/guia-emergencias/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/guia-gastronomico/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/manutencao-viagem/`,
  `${BASE_PATH}/assets/css/roteiro-interativo.css`,
  `${BASE_PATH}/assets/js/roteiro-interativo.js`,
  `${BASE_PATH}/manifest.json`
];

// Install: cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              return name !== CACHE_NAME;
            })
            .map(function(name) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

// Fetch: Cache-First for static, Network-First for dynamic
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Cache-First strategy for viagem pages
  if (url.pathname.includes('/viagens/') || url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            // Return cached version, but update cache in background
            fetchAndCache(request);
            return cachedResponse;
          }
          return fetchAndCache(request);
        })
    );
    return;
  }

  // Network-First for other pages
  event.respondWith(
    fetch(request)
      .then(function(response) {
        // Cache successful responses
        if (response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(function() {
        return caches.match(request);
      })
  );
});

// Helper: Fetch and cache
function fetchAndCache(request) {
  return fetch(request)
    .then(function(response) {
      if (response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(function(cache) {
            cache.put(request, responseClone);
          });
      }
      return response;
    })
    .catch(function() {
      return caches.match(request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline fallback page
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head>' +
            '<body style="font-family:sans-serif;text-align:center;padding:50px;">' +
            '<h1>Você está offline</h1>' +
            '<p>Verifique sua conexão e tente novamente.</p>' +
            '<p>As páginas do roteiro que você já visitou estão disponíveis offline.</p>' +
            '</body></html>',
            {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/html' }
            }
          );
        });
    });
}
