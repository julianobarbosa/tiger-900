/**
 * Tiger 900 - Utility Functions Module
 *
 * Shared utility functions used across features.
 * All functions are pure and side-effect free.
 *
 * @module core/utils
 */

/**
 * Generate a UUID v4
 * @returns {string}
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  return d.toLocaleDateString('pt-BR', defaultOptions);
}

/**
 * Format a date with weekday
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatDateWithWeekday(date) {
  return formatDate(date, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

/**
 * Format time from date
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string}
 */
export function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return formatDate(d);
}

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function}
 */
export function throttle(fn, limit = 100) {
  let lastCall = 0;
  let timeoutId;

  return function (...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Extract GPS coordinates from EXIF data
 * @param {ArrayBuffer} buffer - Image file buffer
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
export async function extractGPSFromExif(buffer) {
  try {
    // Simple EXIF GPS extraction
    // For production, consider using a library like exif-js
    const view = new DataView(buffer);

    // Check for JPEG marker
    if (view.getUint16(0) !== 0xFFD8) {
      return null;
    }

    let offset = 2;
    while (offset < view.byteLength) {
      const marker = view.getUint16(offset);

      if (marker === 0xFFE1) {
        // APP1 marker (EXIF)
        const exifData = parseExifGPS(view, offset + 4);
        if (exifData) return exifData;
      }

      // Move to next marker
      const length = view.getUint16(offset + 2);
      offset += 2 + length;
    }

    return null;
  } catch (e) {
    console.warn('[Utils] Failed to extract EXIF GPS:', e);
    return null;
  }
}

/**
 * Parse EXIF GPS data (simplified)
 * @private
 */
function parseExifGPS(view, offset) {
  // This is a simplified implementation
  // In production, use a proper EXIF library
  // For now, return null and rely on Geolocation API fallback
  return null;
}

/**
 * Get current GPS position using Geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      defaultOptions
    );
  });
}

/**
 * Compress an image file
 * @param {File|Blob} file - Image file
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width
 * @param {number} options.maxHeight - Maximum height
 * @param {number} options.quality - Quality (0-1)
 * @param {string} options.type - Output MIME type
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.8,
    type = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Create canvas and draw
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Create thumbnail from image
 * @param {File|Blob} file - Image file
 * @param {number} size - Thumbnail size (square)
 * @returns {Promise<Blob>}
 */
export async function createThumbnail(file, size = 200) {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    type: 'image/webp'
  });
}

/**
 * Create medium-sized image
 * @param {File|Blob} file - Image file
 * @returns {Promise<Blob>}
 */
export async function createMedium(file) {
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    type: 'image/webp'
  });
}

/**
 * Check if browser is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Subscribe to online/offline events
 * @param {Function} callback - Callback(isOnline)
 * @returns {Function} - Unsubscribe function
 */
export function onNetworkChange(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Simple DOM helper - create element
 * @param {string} tag - HTML tag
 * @param {string} className - CSS class
 * @param {string} textContent - Text content
 * @param {Object} attrs - Additional attributes
 * @returns {HTMLElement}
 */
export function createElement(tag, className = '', textContent = '', attrs = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse GPX file content
 * @param {string} gpxContent - GPX XML content
 * @returns {Object} - Parsed route data
 */
export function parseGPX(gpxContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, 'application/xml');

  const points = [];
  const trkpts = doc.querySelectorAll('trkpt');

  trkpts.forEach(pt => {
    points.push({
      lat: parseFloat(pt.getAttribute('lat')),
      lng: parseFloat(pt.getAttribute('lon')),
      ele: parseFloat(pt.querySelector('ele')?.textContent || 0),
      time: pt.querySelector('time')?.textContent
    });
  });

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }

  // Calculate elevation gain
  let elevationGain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].ele - points[i - 1].ele;
    if (diff > 0) elevationGain += diff;
  }

  return {
    points,
    totalDistance: Math.round(totalDistance),
    elevationGain: Math.round(elevationGain),
    bounds: calculateBounds(points)
  };
}

/**
 * Calculate distance between two GPS points (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} - Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @private
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate bounds from array of points
 * @param {Array} points - Array of {lat, lng}
 * @returns {Object} - {minLat, maxLat, minLng, maxLng}
 */
export function calculateBounds(points) {
  if (!points.length) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  points.forEach(p => {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Storage estimation (if available)
 * @returns {Promise<{usage: number, quota: number}|null>}
 */
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  }
  return null;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
