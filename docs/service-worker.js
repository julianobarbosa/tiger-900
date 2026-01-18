/**
 * Tiger 900 Rally Pro - Enhanced Service Worker
 *
 * Implements Workbox-like patterns for robust offline support:
 * - Precaching of critical assets
 * - Runtime caching with multiple strategies
 * - Background sync support
 * - Update notifications
 *
 * @version 2.0.0
 */

const SW_VERSION = '2.0.0';
const BASE_PATH = '/tiger-900';

// Cache names with versioning
const CACHES = {
  precache: `tiger900-precache-v${SW_VERSION}`,
  runtime: `tiger900-runtime-v${SW_VERSION}`,
  images: `tiger900-images-v${SW_VERSION}`,
  api: `tiger900-api-v${SW_VERSION}`
};

// Assets to precache on install (critical for offline)
const PRECACHE_ASSETS = [
  // Core pages
  `${BASE_PATH}/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/roteiro/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/checklist/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/mapas-offline/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/guia-clima/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/guia-emergencias/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/guia-gastronomico/`,
  `${BASE_PATH}/viagens/serras-gauchas-2026/manutencao-viagem/`,
  `${BASE_PATH}/garagem/manutencao/`,
  `${BASE_PATH}/garagem/ficha-tecnica/`,
  `${BASE_PATH}/sobre/`,

  // Core assets
  `${BASE_PATH}/assets/css/roteiro-interativo.css`,
  `${BASE_PATH}/assets/css/core.css`,
  `${BASE_PATH}/assets/js/roteiro-interativo.js`,
  `${BASE_PATH}/assets/js/previsao-tempo.js`,
  `${BASE_PATH}/assets/js/pwa-register.js`,
  `${BASE_PATH}/assets/js/loader.js`,
  `${BASE_PATH}/assets/js/main.js`,
  `${BASE_PATH}/assets/js/core/store.js`,
  `${BASE_PATH}/assets/js/core/utils.js`,
  `${BASE_PATH}/assets/js/core/sync.js`,

  // PWA assets
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/assets/icons/icon-192x192.png`,
  `${BASE_PATH}/assets/icons/icon-512x512.png`
];

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  api: 3 * 60 * 60 * 1000,      // 3 hours for API responses
  images: 30 * 24 * 60 * 60 * 1000, // 30 days for images
  runtime: 7 * 24 * 60 * 60 * 1000  // 7 days for runtime cache
};

// Maximum cache sizes
const MAX_CACHE_ITEMS = {
  images: 100,
  api: 50,
  runtime: 100
};

/* ============================================
   INSTALL EVENT
   ============================================ */

self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', SW_VERSION);

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHES.precache);

      // Cache assets one by one to handle failures gracefully
      const results = await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              return { url, status: 'cached' };
            }
            return { url, status: 'failed', reason: response.status };
          } catch (error) {
            return { url, status: 'failed', reason: error.message };
          }
        })
      );

      const cached = results.filter(r => r.value?.status === 'cached').length;
      const failed = results.filter(r => r.value?.status === 'failed').length;
      console.log(`[SW] Precached ${cached} assets, ${failed} failed`);

      // Skip waiting to activate immediately
      await self.skipWaiting();
    })()
  );
});

/* ============================================
   ACTIVATE EVENT
   ============================================ */

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', SW_VERSION);

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const currentCaches = Object.values(CACHES);

      await Promise.all(
        cacheNames
          .filter(name => name.startsWith('tiger900-') && !currentCaches.includes(name))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );

      // Take control of all clients immediately
      await self.clients.claim();

      // Notify clients of update
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version: SW_VERSION
        });
      });
    })()
  );
});

/* ============================================
   FETCH EVENT - Routing & Strategies
   ============================================ */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  // Route to appropriate strategy
  if (isApiRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHES.api));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, CACHES.images));
  } else if (isPrecachedAsset(url)) {
    event.respondWith(cacheFirst(request, CACHES.precache));
  } else if (isPageRequest(request)) {
    event.respondWith(networkFirst(request, CACHES.runtime));
  } else {
    event.respondWith(networkFirst(request, CACHES.runtime));
  }
});

/* ============================================
   ROUTING HELPERS
   ============================================ */

function isApiRequest(url) {
  return url.hostname === 'api.open-meteo.com' ||
         url.hostname === 'api.openweathermap.org' ||
         url.pathname.includes('/api/');
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

function isPrecachedAsset(url) {
  const path = url.pathname;
  return PRECACHE_ASSETS.some(asset => path === asset || path === asset.replace(BASE_PATH, ''));
}

function isPageRequest(request) {
  return request.mode === 'navigate' ||
         request.headers.get('accept')?.includes('text/html');
}

/* ============================================
   CACHING STRATEGIES
   ============================================ */

/**
 * Cache First - Return cached version, fallback to network
 * Best for: Static assets that rarely change
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Update cache in background
    updateCache(request, cacheName);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return offlineFallback(request);
  }
}

/**
 * Network First - Try network, fallback to cache
 * Best for: Pages and dynamic content
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return offlineFallback(request);
  }
}

/**
 * Stale While Revalidate - Return cached immediately, update in background
 * Best for: API responses where freshness matters but stale is acceptable
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return offlineFallback(request);
}

/**
 * Update cache in background without blocking
 */
async function updateCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - we already have a cached version
  }
}

/* ============================================
   OFFLINE FALLBACK
   ============================================ */

async function offlineFallback(request) {
  // Try precache first
  const precache = await caches.open(CACHES.precache);
  const precachedResponse = await precache.match(request);
  if (precachedResponse) {
    return precachedResponse;
  }

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return new Response(generateOfflinePage(), {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // Return empty response for other requests
  return new Response('', { status: 503, statusText: 'Offline' });
}

function generateOfflinePage() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline - Tiger 900 Rally Pro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #009688, #00796b);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: white;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { font-size: 16px; opacity: 0.9; margin-bottom: 20px; line-height: 1.5; }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: white;
      color: #009688;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .btn:hover { transform: scale(1.05); }
    .cached-pages {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.3);
    }
    .cached-pages h2 { font-size: 14px; opacity: 0.8; margin-bottom: 10px; }
    .cached-pages ul { list-style: none; }
    .cached-pages li { margin: 8px 0; }
    .cached-pages a { color: white; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📴</div>
    <h1>Você está offline</h1>
    <p>Sem conexão com a internet. As páginas que você já visitou estão disponíveis offline.</p>
    <a href="${BASE_PATH}/viagens/serras-gauchas-2026/roteiro/" class="btn">Ver Roteiro Offline</a>
    <div class="cached-pages">
      <h2>Páginas disponíveis offline:</h2>
      <ul>
        <li><a href="${BASE_PATH}/">🏠 Home</a></li>
        <li><a href="${BASE_PATH}/viagens/serras-gauchas-2026/">🗺️ Viagem</a></li>
        <li><a href="${BASE_PATH}/viagens/serras-gauchas-2026/roteiro/">📍 Roteiro</a></li>
        <li><a href="${BASE_PATH}/viagens/serras-gauchas-2026/checklist/">✅ Checklist</a></li>
      </ul>
    </div>
  </div>
  <script>
    // Retry when back online
    window.addEventListener('online', () => location.reload());
  </script>
</body>
</html>`;
}

/* ============================================
   MESSAGE HANDLING
   ============================================ */

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;

    case 'CACHE_URLS':
      cacheUrls(payload?.urls || []);
      break;

    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName);
      break;

    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0]?.postMessage(status);
      });
      break;
  }
});

/**
 * Cache specific URLs on demand
 */
async function cacheUrls(urls) {
  const cache = await caches.open(CACHES.runtime);

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('[SW] Failed to cache:', url);
    }
  }

  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'CACHE_COMPLETE',
      urls
    });
  });
}

/**
 * Clear specific cache or all caches
 */
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
  }
}

/**
 * Get cache storage status
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {
    version: SW_VERSION,
    caches: {}
  };

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status.caches[name] = {
      count: keys.length,
      urls: keys.map(r => r.url)
    };
  }

  // Get storage estimate if available
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    status.storage = {
      usage: estimate.usage,
      quota: estimate.quota,
      percent: Math.round((estimate.usage / estimate.quota) * 100)
    };
  }

  return status;
}

/* ============================================
   BACKGROUND SYNC
   ============================================ */

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  // Notify clients to process their sync queues
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
  });
}

/* ============================================
   PERIODIC BACKGROUND SYNC (if supported)
   ============================================ */

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updatePrecachedContent());
  }
});

async function updatePrecachedContent() {
  const cache = await caches.open(CACHES.precache);

  for (const url of PRECACHE_ASSETS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      // Continue with other assets
    }
  }
}

console.log('[SW] Service Worker loaded, version:', SW_VERSION);
