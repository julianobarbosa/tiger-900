/**
 * Tiger 900 Rally Pro - Main Entry Point
 *
 * This is the main entry point for the modular JavaScript architecture.
 * It orchestrates the initialization of all core modules and features.
 *
 * @module main
 */

// Core modules
import { initStore } from './core/store.js';
import { initSync, createSyncIndicator } from './core/sync.js';
import { isOnline, onNetworkChange } from './core/utils.js';

/**
 * Application state
 */
const App = {
  initialized: false,
  modules: new Map(),
  config: {
    debug: false
  }
};

/**
 * Log helper (respects debug setting)
 */
function log(...args) {
  if (App.config.debug) {
    console.log('[Tiger900]', ...args);
  }
}

/**
 * Initialize core infrastructure
 * @returns {Promise<void>}
 */
async function initCore() {
  log('Initializing core modules...');

  try {
    // Initialize IndexedDB store
    await initStore();
    log('Store initialized');

    // Initialize sync manager
    const cleanupSync = initSync();
    App.modules.set('sync', { cleanup: cleanupSync });
    log('Sync manager initialized');

    // Add sync indicator to DOM
    const syncIndicator = createSyncIndicator();
    document.body.appendChild(syncIndicator);
    log('Sync indicator added');

  } catch (error) {
    console.error('[Tiger900] Core initialization failed:', error);
    throw error;
  }
}

/**
 * Initialize offline indicator
 */
function initOfflineIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'offline-indicator';
  indicator.className = 'offline-indicator';
  indicator.innerHTML = '📴 Você está offline';
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 8px;
    background: #ff5722;
    color: white;
    text-align: center;
    font-size: 14px;
    z-index: 9999;
    display: none;
    transition: transform 0.3s ease;
  `;

  document.body.insertBefore(indicator, document.body.firstChild);

  // Update on network change
  const updateIndicator = (online) => {
    indicator.style.display = online ? 'none' : 'block';
    document.body.style.paddingTop = online ? '' : '40px';
  };

  // Initial state
  updateIndicator(isOnline());

  // Listen for changes
  onNetworkChange(updateIndicator);
}

/**
 * Feature initialization map
 * Maps feature names to their init functions
 */
const featureInitMap = {
  weather: 'initWeather',
  timeline: 'initTimeline',
  gallery: 'initGallery',
  map: 'initMap',
  integration: 'initIntegration'
};

/**
 * Feature loader - dynamically imports features as needed
 * @param {string} featureName - Feature module name
 * @returns {Promise<Object>}
 */
async function loadFeature(featureName) {
  if (App.modules.has(featureName)) {
    return App.modules.get(featureName);
  }

  try {
    log(`Loading feature: ${featureName}`);
    const module = await import(`./features/${featureName}.js`);

    // Try specific init function first, then generic 'init'
    const initFnName = featureInitMap[featureName] || 'init';
    const initFn = module[initFnName] || module.init;

    if (initFn && typeof initFn === 'function') {
      await initFn();
    }

    App.modules.set(featureName, module);
    log(`Feature loaded: ${featureName}`);

    return module;
  } catch (error) {
    console.error(`[Tiger900] Failed to load feature ${featureName}:`, error);
    return null;
  }
}

/**
 * Auto-detect and initialize features based on page content
 */
async function autoInitFeatures() {
  log('Auto-detecting features...');

  const path = window.location.pathname;
  const isViagensPage = path.includes('/viagens/');
  const isRoteiroPage = path.includes('/roteiro');

  // Weather feature - on viagens pages or if weather elements exist
  if (isViagensPage ||
      document.querySelector('[data-weather]') ||
      document.querySelector('weather-widget') ||
      document.querySelector('weather-overview')) {
    await loadFeature('weather');
  }

  // Timeline feature - on roteiro pages or if timeline elements exist
  if (isRoteiroPage ||
      document.querySelector('[data-itinerary]') ||
      document.querySelector('trip-timeline') ||
      document.querySelector('day-cards-accordion') ||
      document.querySelector('#viagem-timeline')) {
    await loadFeature('timeline');
  }

  // Gallery feature - if gallery elements exist
  if (document.querySelector('[data-gallery]') ||
      document.querySelector('.photo-gallery') ||
      document.querySelector('photo-upload') ||
      document.querySelector('photo-grid')) {
    await loadFeature('gallery');
  }

  // Map feature - if map elements exist
  if (document.querySelector('[data-map]') ||
      document.querySelector('.route-map') ||
      document.querySelector('route-map') ||
      document.querySelector('mini-map')) {
    await loadFeature('map');
  }

  // Integration feature - always load on viagens pages for polish features
  if (isViagensPage ||
      document.querySelector('photo-editor') ||
      document.querySelector('sync-status') ||
      document.querySelector('trip-progress') ||
      document.querySelector('media-carousel') ||
      document.querySelector('warning-badge')) {
    await loadFeature('integration');
  }

  log('Feature auto-detection complete');
}

/**
 * Expose global API for non-module scripts
 */
function exposeGlobalAPI() {
  window.Tiger900 = {
    // Load a feature on demand
    loadFeature,

    // Access app state (read-only)
    getState: () => ({ ...App }),

    // Check online status
    isOnline,

    // Enable debug mode
    enableDebug: () => {
      App.config.debug = true;
      console.log('[Tiger900] Debug mode enabled');
    },

    // Version info
    version: '2.0.0'
  };

  log('Global API exposed as window.Tiger900');
}

/**
 * Main initialization
 */
async function init() {
  if (App.initialized) {
    log('Already initialized');
    return;
  }

  log('Starting initialization...');

  try {
    // Initialize core modules
    await initCore();

    // Initialize offline indicator
    initOfflineIndicator();

    // Expose global API
    exposeGlobalAPI();

    // Auto-detect and load features
    await autoInitFeatures();

    App.initialized = true;
    log('Initialization complete');

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('tiger900:ready', {
      detail: { app: App }
    }));

  } catch (error) {
    console.error('[Tiger900] Initialization failed:', error);

    // Dispatch error event
    window.dispatchEvent(new CustomEvent('tiger900:error', {
      detail: { error }
    }));
  }
}

/**
 * Wait for DOM and initialize
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already ready
  init();
}

// Export for ES module usage
export { App, loadFeature, log };
