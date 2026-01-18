/**
 * Tiger 900 - Sync Manager Module
 *
 * Manages offline sync queue and background synchronization.
 * Handles queueing operations when offline and syncing when online.
 *
 * @module core/sync
 */

import { SyncQueueStore } from './store.js';
import { isOnline, onNetworkChange } from './utils.js';

/**
 * Sync status states
 */
export const SyncStatus = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  ERROR: 'error',
  OFFLINE: 'offline'
};

/**
 * Sync manager state
 */
let syncState = {
  status: SyncStatus.IDLE,
  pendingCount: 0,
  lastSync: null,
  listeners: new Set()
};

/**
 * Max retry attempts before giving up
 */
const MAX_RETRIES = 3;

/**
 * Retry delay in ms (exponential backoff)
 */
const RETRY_DELAY = 1000;

/**
 * Action handlers registry
 * @type {Map<string, Function>}
 */
const actionHandlers = new Map();

/**
 * Register a sync action handler
 * @param {string} entity - Entity type (e.g., 'photo')
 * @param {string} action - Action type (e.g., 'add', 'update', 'delete')
 * @param {Function} handler - Async handler function
 */
export function registerSyncHandler(entity, action, handler) {
  const key = `${entity}:${action}`;
  actionHandlers.set(key, handler);
}

/**
 * Queue an action for sync
 * @param {string} action - Action type
 * @param {string} entity - Entity type
 * @param {Object} data - Action data
 * @returns {Promise<number>} - Queue item ID
 */
export async function queueSync(action, entity, data) {
  const id = await SyncQueueStore.add(action, entity, data);
  await updatePendingCount();
  notifyListeners();

  // Try immediate sync if online
  if (isOnline()) {
    processQueue();
  }

  return id;
}

/**
 * Process the sync queue
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function processQueue() {
  if (syncState.status === SyncStatus.SYNCING) {
    return { success: 0, failed: 0 };
  }

  if (!isOnline()) {
    updateStatus(SyncStatus.OFFLINE);
    return { success: 0, failed: 0 };
  }

  updateStatus(SyncStatus.SYNCING);

  const items = await SyncQueueStore.getPending();
  let success = 0;
  let failed = 0;

  for (const item of items) {
    const key = `${item.entity}:${item.action}`;
    const handler = actionHandlers.get(key);

    if (!handler) {
      console.warn(`[Sync] No handler for ${key}`);
      continue;
    }

    try {
      await handler(item.data);
      await SyncQueueStore.remove(item.id);
      success++;
    } catch (error) {
      console.error(`[Sync] Failed to sync ${key}:`, error);
      await SyncQueueStore.markAttempted(item.id);

      if (item.attempts >= MAX_RETRIES) {
        console.error(`[Sync] Max retries reached for item ${item.id}`);
        // Keep in queue but don't retry immediately
      }

      failed++;
    }
  }

  await updatePendingCount();
  syncState.lastSync = new Date();

  updateStatus(syncState.pendingCount > 0 ? SyncStatus.ERROR : SyncStatus.IDLE);

  return { success, failed };
}

/**
 * Update pending count
 */
async function updatePendingCount() {
  syncState.pendingCount = await SyncQueueStore.count();
}

/**
 * Update sync status
 * @param {string} status
 */
function updateStatus(status) {
  syncState.status = status;
  notifyListeners();
}

/**
 * Notify all status listeners
 */
function notifyListeners() {
  syncState.listeners.forEach(listener => {
    try {
      listener({ ...syncState });
    } catch (e) {
      console.error('[Sync] Listener error:', e);
    }
  });
}

/**
 * Subscribe to sync status changes
 * @param {Function} listener - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function onSyncStatusChange(listener) {
  syncState.listeners.add(listener);
  // Immediately call with current state
  listener({ ...syncState });

  return () => {
    syncState.listeners.delete(listener);
  };
}

/**
 * Get current sync status
 * @returns {string}
 */
export function getSyncStatus() {
  return syncState.status;
}

/**
 * Get full sync state
 * @returns {Object}
 */
export function getSyncState() {
  return { ...syncState };
}

/**
 * Get pending item count
 * @returns {Promise<number>}
 */
export async function getPendingCount() {
  await updatePendingCount();
  return syncState.pendingCount;
}

/**
 * Force retry all failed items
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function retryFailed() {
  return processQueue();
}

/**
 * Alias for retryFailed
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function retryFailedSync() {
  return retryFailed();
}

/**
 * Clear the sync queue (use with caution)
 * @returns {Promise<void>}
 */
export async function clearQueue() {
  const items = await SyncQueueStore.getPending();
  for (const item of items) {
    await SyncQueueStore.remove(item.id);
  }
  await updatePendingCount();
  notifyListeners();
}

/**
 * Initialize the sync manager
 * Sets up network listeners and starts initial sync check
 * @returns {Function} - Cleanup function
 */
export function initSync() {
  // Update status based on current network state
  if (!isOnline()) {
    updateStatus(SyncStatus.OFFLINE);
  }

  // Listen for network changes
  const unsubscribe = onNetworkChange((online) => {
    if (online) {
      console.log('[Sync] Network online - processing queue');
      processQueue();
    } else {
      console.log('[Sync] Network offline');
      updateStatus(SyncStatus.OFFLINE);
    }
  });

  // Initial pending count
  updatePendingCount();

  // Try to sync on init if online
  if (isOnline()) {
    processQueue();
  }

  // Register for Background Sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      // This will be triggered by the service worker
      console.log('[Sync] Background Sync available');
    });
  }

  return unsubscribe;
}

/**
 * Create a sync indicator UI element
 * @returns {HTMLElement}
 */
export function createSyncIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'sync-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 16px;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    background: var(--md-primary-fg-color, #009688);
    color: white;
    display: none;
    align-items: center;
    gap: 6px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;

  const updateIndicator = (state) => {
    if (state.status === SyncStatus.IDLE && state.pendingCount === 0) {
      indicator.style.display = 'none';
      return;
    }

    indicator.style.display = 'flex';

    switch (state.status) {
      case SyncStatus.SYNCING:
        indicator.innerHTML = '🔄 Sincronizando...';
        indicator.style.background = '#ff9800';
        break;
      case SyncStatus.OFFLINE:
        indicator.innerHTML = `📴 Offline (${state.pendingCount} pendentes)`;
        indicator.style.background = '#9e9e9e';
        break;
      case SyncStatus.ERROR:
        indicator.innerHTML = `⚠️ ${state.pendingCount} pendentes`;
        indicator.style.background = '#f44336';
        indicator.onclick = retryFailed;
        indicator.style.cursor = 'pointer';
        break;
      default:
        if (state.pendingCount > 0) {
          indicator.innerHTML = `⏳ ${state.pendingCount} pendentes`;
          indicator.style.background = '#2196f3';
        }
    }
  };

  onSyncStatusChange(updateIndicator);

  return indicator;
}
