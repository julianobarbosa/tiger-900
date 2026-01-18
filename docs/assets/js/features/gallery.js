/**
 * Tiger 900 - Gallery Module
 *
 * Photo gallery functionality:
 * - Photo upload with GPS extraction
 * - Image compression and thumbnail generation
 * - Grid gallery display with lazy loading
 * - Lightbox viewer
 * - IndexedDB storage
 *
 * @module features/gallery
 */

import { Store, PhotosStore } from '../core/store.js';
import {
  generateUUID,
  compressImage,
  createThumbnail,
  extractGPSFromImage,
  getCurrentPosition,
  formatDate,
  isOnline
} from '../core/utils.js';
import { queueSync } from '../core/sync.js';

/**
 * Gallery configuration
 */
const CONFIG = {
  thumbnailSize: 200,
  mediumSize: 800,
  maxOriginalSize: 2000,
  compressionQuality: 0.8,
  supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  maxFileSize: 20 * 1024 * 1024 // 20MB
};

/**
 * Gallery state
 */
const state = {
  photos: [],
  currentDay: null,
  lightboxOpen: false,
  lightboxIndex: 0
};

/**
 * Process uploaded image - extract GPS, compress, create versions
 * @param {File} file - Image file
 * @param {string} dayDate - Day date string (YYYY-MM-DD)
 * @returns {Promise<Object>} Processed photo object
 */
async function processImage(file, dayDate) {
  // Validate file
  if (!CONFIG.supportedTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
  }

  if (file.size > CONFIG.maxFileSize) {
    throw new Error(`Arquivo muito grande: máximo ${CONFIG.maxFileSize / 1024 / 1024}MB`);
  }

  // Extract GPS from EXIF
  let gps = await extractGPSFromImage(file);

  // Fallback to browser geolocation if no EXIF GPS
  if (!gps && isOnline()) {
    try {
      const position = await getCurrentPosition();
      gps = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: 'browser'
      };
    } catch (error) {
      console.warn('[Gallery] Could not get browser location:', error);
    }
  }

  // Create image versions
  const thumbnail = await createThumbnail(file, CONFIG.thumbnailSize);
  const medium = await compressImage(file, {
    maxWidth: CONFIG.mediumSize,
    maxHeight: CONFIG.mediumSize,
    quality: CONFIG.compressionQuality
  });
  const original = await compressImage(file, {
    maxWidth: CONFIG.maxOriginalSize,
    maxHeight: CONFIG.maxOriginalSize,
    quality: CONFIG.compressionQuality
  });

  // Create photo object
  const photo = {
    id: generateUUID(),
    dayDate,
    filename: file.name,
    mimeType: file.type,
    timestamp: new Date().toISOString(),
    gps,
    caption: '',
    versions: {
      thumbnail: thumbnail.dataUrl,
      medium: medium.dataUrl,
      original: original.dataUrl
    },
    dimensions: {
      original: { width: original.width, height: original.height },
      medium: { width: medium.width, height: medium.height },
      thumbnail: { width: thumbnail.width, height: thumbnail.height }
    },
    synced: false
  };

  return photo;
}

/**
 * Upload photo(s) for a specific day
 * @param {FileList|File[]} files - Files to upload
 * @param {string} dayDate - Day date string
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object[]>} Array of processed photos
 */
export async function uploadPhotos(files, dayDate, onProgress) {
  const results = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];

    onProgress?.({
      current: i + 1,
      total,
      filename: file.name,
      phase: 'processing'
    });

    try {
      const photo = await processImage(file, dayDate);

      // Save to IndexedDB
      await PhotosStore.save(photo);

      // Queue for sync
      queueSync('upload', 'photo', { id: photo.id });

      results.push(photo);

      onProgress?.({
        current: i + 1,
        total,
        filename: file.name,
        phase: 'complete'
      });
    } catch (error) {
      console.error('[Gallery] Error processing', file.name, error);

      onProgress?.({
        current: i + 1,
        total,
        filename: file.name,
        phase: 'error',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get photos for a specific day
 * @param {string} dayDate - Day date string
 * @returns {Promise<Object[]>}
 */
export async function getPhotosForDay(dayDate) {
  return PhotosStore.getByDay(dayDate);
}

/**
 * Get all photos
 * @returns {Promise<Object[]>}
 */
export async function getAllPhotos() {
  return PhotosStore.getAll();
}

/**
 * Update photo caption
 * @param {string} photoId - Photo ID
 * @param {string} caption - New caption
 * @returns {Promise<void>}
 */
export async function updateCaption(photoId, caption) {
  const photo = await PhotosStore.get(photoId);
  if (!photo) return;

  photo.caption = caption.slice(0, 280); // Max 280 chars
  photo.synced = false;

  await PhotosStore.save(photo);
  queueSync('update', 'photo', { id: photoId, caption: photo.caption });
}

/**
 * Delete photo
 * @param {string} photoId - Photo ID
 * @returns {Promise<void>}
 */
export async function deletePhoto(photoId) {
  await PhotosStore.delete(photoId);
  queueSync('delete', 'photo', { id: photoId });
}

/**
 * Photo Upload Custom Element
 * Usage: <photo-upload day="2026-01-22"></photo-upload>
 */
class PhotoUpload extends HTMLElement {
  static get observedAttributes() {
    return ['day'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._uploading = false;
    this._progress = null;
  }

  connectedCallback() {
    this.render();
  }

  get day() {
    return this.getAttribute('day');
  }

  async handleFiles(files) {
    if (this._uploading || !files.length) return;

    this._uploading = true;
    this.render();

    try {
      const photos = await uploadPhotos(files, this.day, (progress) => {
        this._progress = progress;
        this.render();
      });

      // Dispatch event for gallery to refresh
      this.dispatchEvent(new CustomEvent('photos-uploaded', {
        detail: { photos, day: this.day },
        bubbles: true
      }));
    } catch (error) {
      console.error('[PhotoUpload] Error:', error);
    }

    this._uploading = false;
    this._progress = null;
    this.render();
  }

  render() {
    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .upload-container {
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          background: #fafafa;
          transition: all 0.3s;
          cursor: pointer;
        }

        .upload-container:hover,
        .upload-container.dragover {
          border-color: var(--md-primary-fg-color, #009688);
          background: #e0f2f1;
        }

        .upload-container.uploading {
          cursor: default;
          border-style: solid;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .upload-text {
          font-size: 16px;
          color: #333;
          margin-bottom: 8px;
        }

        .upload-hint {
          font-size: 13px;
          color: #666;
        }

        input[type="file"] {
          display: none;
        }

        .upload-btn {
          display: inline-block;
          padding: 10px 24px;
          background: var(--md-primary-fg-color, #009688);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 12px;
          transition: transform 0.2s;
        }

        .upload-btn:hover {
          transform: translateY(-1px);
        }

        .progress-container {
          margin-top: 16px;
        }

        .progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--md-primary-fg-color, #009688);
          transition: width 0.3s;
        }

        .progress-text {
          font-size: 13px;
          color: #666;
          margin-top: 8px;
        }

        @media (prefers-color-scheme: dark) {
          .upload-container { background: #2d2d2d; border-color: #555; }
          .upload-container:hover { background: #1d3d3d; }
          .upload-text { color: #fff; }
          .upload-hint { color: #aaa; }
        }
      </style>
    `;

    let content = '';

    if (this._uploading && this._progress) {
      const percent = Math.round((this._progress.current / this._progress.total) * 100);
      content = `
        <div class="upload-container uploading">
          <div class="upload-icon">📤</div>
          <div class="upload-text">Enviando fotos...</div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="progress-text">
              ${this._progress.current} de ${this._progress.total} - ${this._progress.filename}
            </div>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="upload-container" id="dropzone">
          <div class="upload-icon">📷</div>
          <div class="upload-text">Arraste fotos aqui ou clique para selecionar</div>
          <div class="upload-hint">JPG, PNG, WebP • Máximo 20MB por foto</div>
          <input type="file" id="fileInput" accept="image/*" multiple>
          <button class="upload-btn" id="selectBtn">Selecionar Fotos</button>
        </div>
      `;
    }

    this.shadowRoot.innerHTML = styles + content;

    // Add event listeners
    if (!this._uploading) {
      const dropzone = this.shadowRoot.getElementById('dropzone');
      const fileInput = this.shadowRoot.getElementById('fileInput');
      const selectBtn = this.shadowRoot.getElementById('selectBtn');

      selectBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput?.click();
      });

      dropzone?.addEventListener('click', () => fileInput?.click());

      fileInput?.addEventListener('change', (e) => {
        this.handleFiles(e.target.files);
      });

      dropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone?.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        this.handleFiles(e.dataTransfer.files);
      });
    }
  }
}

/**
 * Photo Grid Custom Element
 * Usage: <photo-grid day="2026-01-22"></photo-grid>
 */
class PhotoGrid extends HTMLElement {
  static get observedAttributes() {
    return ['day'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._photos = [];
    this._loading = true;
  }

  connectedCallback() {
    this.loadPhotos();

    // Listen for new uploads
    document.addEventListener('photos-uploaded', (e) => {
      if (e.detail.day === this.day) {
        this.loadPhotos();
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'day' && oldValue !== newValue) {
      this.loadPhotos();
    }
  }

  get day() {
    return this.getAttribute('day');
  }

  async loadPhotos() {
    this._loading = true;
    this.render();

    try {
      if (this.day) {
        this._photos = await getPhotosForDay(this.day);
      } else {
        this._photos = await getAllPhotos();
      }
    } catch (error) {
      console.error('[PhotoGrid] Error loading photos:', error);
      this._photos = [];
    }

    this._loading = false;
    this.render();
  }

  openLightbox(index) {
    this.dispatchEvent(new CustomEvent('open-lightbox', {
      detail: { photos: this._photos, index },
      bubbles: true
    }));
  }

  render() {
    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;
        }

        .photo-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          background: #f0f0f0;
        }

        .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .photo-item:hover img {
          transform: scale(1.05);
        }

        .photo-item .overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          color: white;
          font-size: 11px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .photo-item:hover .overlay {
          opacity: 1;
        }

        .photo-item .gps-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.5);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }

        .loading, .empty {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
          aspect-ratio: 1;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 480px) {
          .photo-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }
        }

        @media (prefers-color-scheme: dark) {
          .photo-item { background: #3d3d3d; }
          .skeleton { background: linear-gradient(90deg, #3d3d3d 25%, #4d4d4d 50%, #3d3d3d 75%); }
        }
      </style>
    `;

    let content = '';

    if (this._loading) {
      content = `
        <div class="photo-grid">
          ${Array(6).fill('<div class="skeleton"></div>').join('')}
        </div>
      `;
    } else if (this._photos.length === 0) {
      content = `
        <div class="empty">
          <div style="font-size: 48px; margin-bottom: 12px;">📷</div>
          <div>Nenhuma foto ainda</div>
        </div>
      `;
    } else {
      const photosHTML = this._photos.map((photo, index) => `
        <div class="photo-item" data-id="${photo.id}" data-index="${index}">
          <img src="${photo.versions.thumbnail}" alt="${photo.caption || photo.filename}" loading="lazy">
          ${photo.gps ? '<span class="gps-badge">📍</span>' : ''}
          <div class="overlay">
            ${photo.caption || formatDate(photo.timestamp, { timeStyle: 'short' })}
          </div>
        </div>
      `).join('');

      content = `<div class="photo-grid">${photosHTML}</div>`;
    }

    this.shadowRoot.innerHTML = styles + content;

    // Add click handlers
    this.shadowRoot.querySelectorAll('.photo-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.openLightbox(index);
      });
    });
  }
}

/**
 * Photo Lightbox Custom Element
 * Usage: <photo-lightbox></photo-lightbox>
 */
class PhotoLightbox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._photos = [];
    this._currentIndex = 0;
    this._visible = false;
  }

  connectedCallback() {
    this.render();

    // Listen for open events
    document.addEventListener('open-lightbox', (e) => {
      this.open(e.detail.photos, e.detail.index);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this._visible) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'ArrowRight':
          this.next();
          break;
      }
    });
  }

  open(photos, index = 0) {
    this._photos = photos;
    this._currentIndex = index;
    this._visible = true;
    document.body.style.overflow = 'hidden';
    this.render();
  }

  close() {
    this._visible = false;
    document.body.style.overflow = '';
    this.render();
  }

  prev() {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this.render();
    }
  }

  next() {
    if (this._currentIndex < this._photos.length - 1) {
      this._currentIndex++;
      this.render();
    }
  }

  render() {
    const styles = `
      <style>
        :host {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
        }

        .lightbox.visible {
          opacity: 1;
          visibility: visible;
        }

        .lightbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          color: white;
        }

        .lightbox-counter {
          font-size: 14px;
        }

        .lightbox-close {
          background: none;
          border: none;
          color: white;
          font-size: 32px;
          cursor: pointer;
          padding: 0 8px;
          line-height: 1;
        }

        .lightbox-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0 60px;
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 32px;
          padding: 16px;
          cursor: pointer;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .lightbox-nav:hover {
          background: rgba(255,255,255,0.3);
        }

        .lightbox-nav:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .lightbox-prev { left: 16px; }
        .lightbox-next { right: 16px; }

        .lightbox-footer {
          padding: 16px;
          color: white;
          text-align: center;
        }

        .lightbox-caption {
          font-size: 14px;
          margin-bottom: 8px;
        }

        .lightbox-meta {
          font-size: 12px;
          color: #999;
        }

        @media (max-width: 768px) {
          .lightbox-main {
            padding: 0 16px;
          }

          .lightbox-nav {
            padding: 12px;
            font-size: 24px;
          }

          .lightbox-prev { left: 8px; }
          .lightbox-next { right: 8px; }
        }
      </style>
    `;

    if (!this._visible) {
      this.shadowRoot.innerHTML = styles + '<div class="lightbox"></div>';
      return;
    }

    const photo = this._photos[this._currentIndex];
    const dateStr = formatDate(photo.timestamp, {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="lightbox visible">
        <div class="lightbox-header">
          <span class="lightbox-counter">${this._currentIndex + 1} / ${this._photos.length}</span>
          <button class="lightbox-close" id="closeBtn">×</button>
        </div>
        <div class="lightbox-main">
          <button class="lightbox-nav lightbox-prev" id="prevBtn" ${this._currentIndex === 0 ? 'disabled' : ''}>‹</button>
          <img class="lightbox-image" src="${photo.versions.medium}" alt="${photo.caption || ''}">
          <button class="lightbox-nav lightbox-next" id="nextBtn" ${this._currentIndex === this._photos.length - 1 ? 'disabled' : ''}>›</button>
        </div>
        <div class="lightbox-footer">
          ${photo.caption ? `<div class="lightbox-caption">${photo.caption}</div>` : ''}
          <div class="lightbox-meta">
            ${dateStr}
            ${photo.gps ? ` • 📍 ${photo.gps.latitude.toFixed(4)}, ${photo.gps.longitude.toFixed(4)}` : ''}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.getElementById('closeBtn')?.addEventListener('click', () => this.close());
    this.shadowRoot.getElementById('prevBtn')?.addEventListener('click', () => this.prev());
    this.shadowRoot.getElementById('nextBtn')?.addEventListener('click', () => this.next());

    // Close on background click
    this.shadowRoot.querySelector('.lightbox')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('lightbox') || e.target.classList.contains('lightbox-main')) {
        this.close();
      }
    });

    // Touch swipe support
    let touchStartX = 0;
    const mainEl = this.shadowRoot.querySelector('.lightbox-main');

    mainEl?.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    mainEl?.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    });
  }
}

/**
 * Register custom elements
 */
export function registerGalleryElements() {
  if (!customElements.get('photo-upload')) {
    customElements.define('photo-upload', PhotoUpload);
  }
  if (!customElements.get('photo-grid')) {
    customElements.define('photo-grid', PhotoGrid);
  }
  if (!customElements.get('photo-lightbox')) {
    customElements.define('photo-lightbox', PhotoLightbox);
  }
}

/**
 * Initialize gallery module
 */
export function initGallery() {
  registerGalleryElements();

  // Add global lightbox element if not exists
  if (!document.querySelector('photo-lightbox')) {
    document.body.appendChild(document.createElement('photo-lightbox'));
  }

  console.log('[Gallery] Module initialized');
}

export {
  uploadPhotos,
  getPhotosForDay,
  getAllPhotos,
  updateCaption,
  deletePhoto,
  CONFIG as GalleryConfig
};
