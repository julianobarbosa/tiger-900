/**
 * Tiger 900 - PWA Manager Module
 *
 * Manages PWA lifecycle:
 * - Service Worker registration and updates
 * - Offline content caching
 * - Install prompts
 * - Cache status tracking
 *
 * @module pwa/manager
 */

import { formatBytes, isOnline, onNetworkChange } from '../core/utils.js';

/**
 * PWA Manager state
 */
const state = {
  registration: null,
  updateAvailable: false,
  installedVersion: null,
  isInstalled: false,
  deferredPrompt: null,
  cacheStatus: null
};

/**
 * Event listeners
 */
const listeners = {
  update: new Set(),
  install: new Set(),
  cache: new Set()
};

/**
 * Base path for the app
 */
const BASE_PATH = '/tiger-900';

/**
 * URLs to cache for full offline support
 */
const OFFLINE_URLS = [
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
  `${BASE_PATH}/garagem/manuais/`,
  `${BASE_PATH}/sobre/`
];

/**
 * Register the Service Worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      `${BASE_PATH}/service-worker.js`,
      { scope: `${BASE_PATH}/` }
    );

    state.registration = registration;
    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          state.updateAvailable = true;
          notifyListeners('update', { registration, newWorker });
        }
      });
    });

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    // Check if update is available immediately
    if (registration.waiting) {
      state.updateAvailable = true;
      notifyListeners('update', { registration });
    }

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Handle messages from Service Worker
 */
function handleSWMessage(event) {
  const { type, ...data } = event.data || {};

  switch (type) {
    case 'SW_ACTIVATED':
      console.log('[PWA] New version activated:', data.version);
      state.installedVersion = data.version;
      break;

    case 'CACHE_COMPLETE':
      console.log('[PWA] Cache complete:', data.urls?.length, 'URLs');
      notifyListeners('cache', { complete: true, urls: data.urls });
      break;

    case 'PROCESS_SYNC_QUEUE':
      console.log('[PWA] Background sync triggered');
      // Dispatch event for sync module to handle
      window.dispatchEvent(new CustomEvent('pwa:sync-requested'));
      break;
  }
}

/**
 * Skip waiting and activate new Service Worker
 */
export function activateUpdate() {
  if (!state.registration?.waiting) {
    return;
  }

  state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  // Reload when new SW takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  }, { once: true });
}

/**
 * Get current Service Worker version
 * @returns {Promise<string|null>}
 */
export async function getSWVersion() {
  if (!navigator.serviceWorker?.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data?.version || null);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_VERSION' },
      [channel.port2]
    );

    // Timeout after 1 second
    setTimeout(() => resolve(null), 1000);
  });
}

/**
 * Get cache status from Service Worker
 * @returns {Promise<Object|null>}
 */
export async function getCacheStatus() {
  if (!navigator.serviceWorker?.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      state.cacheStatus = event.data;
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATUS' },
      [channel.port2]
    );

    // Timeout after 2 seconds
    setTimeout(() => resolve(null), 2000);
  });
}

/**
 * Request caching of specific URLs
 * @param {string[]} urls - URLs to cache
 * @returns {Promise<void>}
 */
export function requestCache(urls) {
  if (!navigator.serviceWorker?.controller) {
    return Promise.reject(new Error('No active Service Worker'));
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_URLS',
    payload: { urls }
  });

  return Promise.resolve();
}

/**
 * Download all content for offline use
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
export async function downloadForOffline(onProgress) {
  if (!isOnline()) {
    throw new Error('Cannot download while offline');
  }

  const totalUrls = OFFLINE_URLS.length;
  let cached = 0;

  onProgress?.({ phase: 'starting', total: totalUrls, cached: 0 });

  // Request SW to cache URLs
  await requestCache(OFFLINE_URLS);

  // Also cache current page's assets
  const pageAssets = Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]'))
    .map(el => el.href || el.src)
    .filter(url => url && url.startsWith(window.location.origin));

  if (pageAssets.length > 0) {
    await requestCache(pageAssets);
  }

  // Wait for cache complete message
  return new Promise((resolve) => {
    const unsubscribe = onCacheUpdate((data) => {
      if (data.complete) {
        unsubscribe();
        onProgress?.({ phase: 'complete', total: totalUrls, cached: totalUrls });
        resolve();
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      unsubscribe();
      resolve();
    }, 30000);
  });
}

/**
 * Clear all caches
 * @returns {Promise<void>}
 */
export function clearCache() {
  if (!navigator.serviceWorker?.controller) {
    return Promise.reject(new Error('No active Service Worker'));
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'CLEAR_CACHE'
  });

  return Promise.resolve();
}

/**
 * Check if app can be installed
 * @returns {boolean}
 */
export function canInstall() {
  return state.deferredPrompt !== null;
}

/**
 * Prompt user to install the app
 * @returns {Promise<boolean>} - True if installed
 */
export async function promptInstall() {
  if (!state.deferredPrompt) {
    return false;
  }

  state.deferredPrompt.prompt();
  const { outcome } = await state.deferredPrompt.userChoice;

  state.deferredPrompt = null;

  if (outcome === 'accepted') {
    state.isInstalled = true;
    console.log('[PWA] App installed');
    return true;
  }

  return false;
}

/**
 * Check if app is installed (standalone mode)
 * @returns {boolean}
 */
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         state.isInstalled;
}

/**
 * Subscribe to update events
 * @param {Function} callback
 * @returns {Function} - Unsubscribe function
 */
export function onUpdateAvailable(callback) {
  listeners.update.add(callback);

  // Call immediately if update already available
  if (state.updateAvailable) {
    callback({ updateAvailable: true, registration: state.registration });
  }

  return () => listeners.update.delete(callback);
}

/**
 * Subscribe to install events
 * @param {Function} callback
 * @returns {Function} - Unsubscribe function
 */
export function onInstallAvailable(callback) {
  listeners.install.add(callback);

  // Call immediately if install available
  if (state.deferredPrompt) {
    callback({ canInstall: true });
  }

  return () => listeners.install.delete(callback);
}

/**
 * Subscribe to cache events
 * @param {Function} callback
 * @returns {Function} - Unsubscribe function
 */
export function onCacheUpdate(callback) {
  listeners.cache.add(callback);
  return () => listeners.cache.delete(callback);
}

/**
 * Notify listeners of an event
 */
function notifyListeners(type, data) {
  listeners[type]?.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error(`[PWA] Listener error (${type}):`, error);
    }
  });
}

/**
 * Initialize PWA manager
 */
export async function initPWA() {
  // Register Service Worker
  await registerServiceWorker();

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    notifyListeners('install', { canInstall: true });
    console.log('[PWA] Install prompt captured');
  });

  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    state.isInstalled = true;
    state.deferredPrompt = null;
    console.log('[PWA] App installed');
  });

  // Get initial version
  state.installedVersion = await getSWVersion();

  console.log('[PWA] Manager initialized, version:', state.installedVersion);

  return state;
}

/**
 * Get current PWA state
 * @returns {Object}
 */
export function getState() {
  return { ...state };
}

/**
 * Create storage status display
 * @returns {Promise<HTMLElement>}
 */
export async function createStorageStatus() {
  const status = await getCacheStatus();
  const container = document.createElement('div');
  container.className = 'storage-status';

  if (!status) {
    container.innerHTML = '<p>Informações de armazenamento não disponíveis</p>';
    return container;
  }

  const cacheCount = Object.values(status.caches || {}).reduce((sum, c) => sum + c.count, 0);

  container.innerHTML = `
    <div class="storage-info">
      <div class="storage-item">
        <span class="label">Versão SW:</span>
        <span class="value">${status.version || 'N/A'}</span>
      </div>
      <div class="storage-item">
        <span class="label">Itens em cache:</span>
        <span class="value">${cacheCount}</span>
      </div>
      ${status.storage ? `
        <div class="storage-item">
          <span class="label">Armazenamento:</span>
          <span class="value">${formatBytes(status.storage.usage)} / ${formatBytes(status.storage.quota)} (${status.storage.percent}%)</span>
        </div>
        <div class="storage-bar">
          <div class="storage-bar-fill" style="width: ${Math.min(status.storage.percent, 100)}%"></div>
        </div>
      ` : ''}
    </div>
  `;

  return container;
}
