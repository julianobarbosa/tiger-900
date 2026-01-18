/**
 * Tiger 900 - IndexedDB Store Module
 *
 * Provides a Promise-based wrapper around IndexedDB for structured data storage.
 * Handles photos, routes, weather cache, and sync queue.
 *
 * @module core/store
 */

const DB_NAME = 'tiger900';
const DB_VERSION = 1;

/**
 * Database schema definition
 */
const STORES = {
  photos: {
    keyPath: 'id',
    indexes: [
      { name: 'dayId', keyPath: 'dayId', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'synced', keyPath: 'synced', unique: false }
    ]
  },
  routes: {
    keyPath: 'id',
    indexes: [
      { name: 'dayId', keyPath: 'dayId', unique: false }
    ]
  },
  weather: {
    keyPath: 'locationDate',
    indexes: [
      { name: 'fetchedAt', keyPath: 'fetchedAt', unique: false }
    ]
  },
  syncQueue: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt', unique: false }
    ]
  }
};

/**
 * Database connection instance
 * @type {IDBDatabase|null}
 */
let dbInstance = null;

/**
 * Opens the database connection
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle connection closing
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      Object.entries(STORES).forEach(([storeName, config]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const storeOptions = { keyPath: config.keyPath };
          if (config.autoIncrement) {
            storeOptions.autoIncrement = true;
          }

          const store = db.createObjectStore(storeName, storeOptions);

          // Create indexes
          if (config.indexes) {
            config.indexes.forEach(idx => {
              store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
            });
          }
        }
      });
    };
  });
}

/**
 * Gets a transaction and object store
 * @param {string} storeName - Store name
 * @param {IDBTransactionMode} mode - Transaction mode ('readonly' or 'readwrite')
 * @returns {Promise<{transaction: IDBTransaction, store: IDBObjectStore}>}
 */
async function getStore(storeName, mode = 'readonly') {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, mode);
  const store = transaction.objectStore(storeName);
  return { transaction, store };
}

/**
 * Wraps an IDBRequest in a Promise
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store API - CRUD operations for all stores
 */
export const Store = {
  /**
   * Add or update an item in a store
   * @param {string} storeName - Store name
   * @param {Object} item - Item to store
   * @returns {Promise<IDBValidKey>} - Key of the stored item
   */
  async put(storeName, item) {
    const { store } = await getStore(storeName, 'readwrite');
    return promisifyRequest(store.put(item));
  },

  /**
   * Get an item by key
   * @param {string} storeName - Store name
   * @param {IDBValidKey} key - Item key
   * @returns {Promise<any>}
   */
  async get(storeName, key) {
    const { store } = await getStore(storeName, 'readonly');
    return promisifyRequest(store.get(key));
  },

  /**
   * Get all items from a store
   * @param {string} storeName - Store name
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    const { store } = await getStore(storeName, 'readonly');
    return promisifyRequest(store.getAll());
  },

  /**
   * Get items by index value
   * @param {string} storeName - Store name
   * @param {string} indexName - Index name
   * @param {IDBValidKey} value - Index value to match
   * @returns {Promise<Array>}
   */
  async getByIndex(storeName, indexName, value) {
    const { store } = await getStore(storeName, 'readonly');
    const index = store.index(indexName);
    return promisifyRequest(index.getAll(value));
  },

  /**
   * Delete an item by key
   * @param {string} storeName - Store name
   * @param {IDBValidKey} key - Item key
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    const { store } = await getStore(storeName, 'readwrite');
    return promisifyRequest(store.delete(key));
  },

  /**
   * Clear all items from a store
   * @param {string} storeName - Store name
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    const { store } = await getStore(storeName, 'readwrite');
    return promisifyRequest(store.clear());
  },

  /**
   * Count items in a store
   * @param {string} storeName - Store name
   * @returns {Promise<number>}
   */
  async count(storeName) {
    const { store } = await getStore(storeName, 'readonly');
    return promisifyRequest(store.count());
  }
};

/**
 * Photos Store - Specialized methods for photo management
 */
export const PhotosStore = {
  /**
   * Add a new photo
   * @param {Object} photo - Photo data
   * @param {string} photo.id - Unique ID (UUID)
   * @param {string} photo.dayId - Day identifier (e.g., 'day-1')
   * @param {Blob} photo.thumb - Thumbnail blob
   * @param {Blob} photo.medium - Medium size blob
   * @param {Blob} [photo.original] - Original blob (optional)
   * @param {Object} photo.gps - GPS coordinates { lat, lng }
   * @param {string} photo.caption - Photo caption
   * @param {Date} photo.timestamp - Capture timestamp
   * @param {boolean} photo.synced - Sync status
   * @returns {Promise<string>}
   */
  async add(photo) {
    const item = {
      ...photo,
      timestamp: photo.timestamp || new Date(),
      synced: photo.synced || false
    };
    return Store.put('photos', item);
  },

  /**
   * Get all photos for a specific day
   * @param {string} dayId - Day identifier
   * @returns {Promise<Array>}
   */
  async getByDay(dayId) {
    return Store.getByIndex('photos', 'dayId', dayId);
  },

  /**
   * Get unsynced photos
   * @returns {Promise<Array>}
   */
  async getUnsynced() {
    return Store.getByIndex('photos', 'synced', false);
  },

  /**
   * Mark photo as synced
   * @param {string} id - Photo ID
   * @returns {Promise<void>}
   */
  async markSynced(id) {
    const photo = await Store.get('photos', id);
    if (photo) {
      photo.synced = true;
      await Store.put('photos', photo);
    }
  },

  /**
   * Update photo caption
   * @param {string} id - Photo ID
   * @param {string} caption - New caption
   * @returns {Promise<void>}
   */
  async updateCaption(id, caption) {
    const photo = await Store.get('photos', id);
    if (photo) {
      photo.caption = caption;
      photo.synced = false; // Mark for re-sync
      await Store.put('photos', photo);
    }
  }
};

/**
 * Weather Store - Specialized methods for weather cache
 */
export const WeatherStore = {
  /**
   * Cache weather data for a location and date
   * @param {string} location - Location name
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {Object} data - Weather data
   * @returns {Promise<string>}
   */
  async cache(location, date, data) {
    const locationDate = `${location}_${date}`;
    const item = {
      locationDate,
      data,
      fetchedAt: new Date()
    };
    return Store.put('weather', item);
  },

  /**
   * Get cached weather data
   * @param {string} location - Location name
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {number} maxAge - Max age in milliseconds (default: 3 hours)
   * @returns {Promise<Object|null>}
   */
  async get(location, date, maxAge = 3 * 60 * 60 * 1000) {
    const locationDate = `${location}_${date}`;
    const item = await Store.get('weather', locationDate);

    if (!item) return null;

    // Check if cache is still valid
    const age = Date.now() - new Date(item.fetchedAt).getTime();
    if (age > maxAge) {
      return null;
    }

    return item.data;
  },

  /**
   * Clear expired weather cache
   * @param {number} maxAge - Max age in milliseconds
   * @returns {Promise<number>} - Number of items cleared
   */
  async clearExpired(maxAge = 24 * 60 * 60 * 1000) {
    const all = await Store.getAll('weather');
    const now = Date.now();
    let cleared = 0;

    for (const item of all) {
      const age = now - new Date(item.fetchedAt).getTime();
      if (age > maxAge) {
        await Store.delete('weather', item.locationDate);
        cleared++;
      }
    }

    return cleared;
  }
};

/**
 * Sync Queue Store - For offline operations
 */
export const SyncQueueStore = {
  /**
   * Add an action to the sync queue
   * @param {string} action - Action type ('add', 'update', 'delete')
   * @param {string} entity - Entity type ('photo', 'route', etc.)
   * @param {Object} data - Action data
   * @returns {Promise<number>} - Queue item ID
   */
  async add(action, entity, data) {
    const item = {
      action,
      entity,
      data,
      createdAt: new Date(),
      attempts: 0,
      lastAttempt: null
    };
    return Store.put('syncQueue', item);
  },

  /**
   * Get all pending sync items
   * @returns {Promise<Array>}
   */
  async getPending() {
    return Store.getAll('syncQueue');
  },

  /**
   * Mark sync item as attempted
   * @param {number} id - Queue item ID
   * @returns {Promise<void>}
   */
  async markAttempted(id) {
    const item = await Store.get('syncQueue', id);
    if (item) {
      item.attempts++;
      item.lastAttempt = new Date();
      await Store.put('syncQueue', item);
    }
  },

  /**
   * Remove item from queue (successful sync)
   * @param {number} id - Queue item ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    return Store.delete('syncQueue', id);
  },

  /**
   * Get queue count
   * @returns {Promise<number>}
   */
  async count() {
    return Store.count('syncQueue');
  }
};

/**
 * Initialize the database
 * Call this early in app startup
 * @returns {Promise<void>}
 */
export async function initStore() {
  await openDatabase();
  console.log('[Store] Database initialized');
}

/**
 * Close the database connection
 * @returns {void}
 */
export function closeStore() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Export for direct store access if needed
export { DB_NAME, DB_VERSION, STORES };
