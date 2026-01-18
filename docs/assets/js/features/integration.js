/**
 * Tiger 900 - Integration Module
 *
 * Sprint 5 polish features:
 * - Photo caption editing and management
 * - Enhanced map controls
 * - Media preview in day cards
 * - Progress and status indicators
 * - Sync queue UI improvements
 *
 * @module features/integration
 */

import { Store, PhotosStore } from '../core/store.js';
import { getSyncStatus, getPendingCount, onSyncStatusChange, retryFailedSync } from '../core/sync.js';
import { formatDate, isOnline, onNetworkChange } from '../core/utils.js';

/**
 * Photo Editor Custom Element
 * Inline caption editing and photo management
 * Usage: <photo-editor photo-id="xxx"></photo-editor>
 */
class PhotoEditor extends HTMLElement {
  static get observedAttributes() {
    return ['photo-id'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._photo = null;
    this._editing = false;
  }

  connectedCallback() {
    this.loadPhoto();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'photo-id' && oldValue !== newValue) {
      this.loadPhoto();
    }
  }

  get photoId() {
    return this.getAttribute('photo-id');
  }

  async loadPhoto() {
    if (!this.photoId) return;
    this._photo = await PhotosStore.get(this.photoId);
    this.render();
  }

  async saveCaption(caption) {
    if (!this._photo) return;

    this._photo.caption = caption.slice(0, 280);
    this._photo.synced = false;
    await PhotosStore.save(this._photo);

    // Import and queue sync
    const { queueSync } = await import('../core/sync.js');
    queueSync('update', 'photo', { id: this._photo.id, caption: this._photo.caption });

    this._editing = false;
    this.render();

    this.dispatchEvent(new CustomEvent('photo-updated', {
      detail: { photo: this._photo },
      bubbles: true
    }));
  }

  async deletePhoto() {
    if (!this._photo) return;

    if (!confirm('Excluir esta foto?')) return;

    await PhotosStore.delete(this._photo.id);

    const { queueSync } = await import('../core/sync.js');
    queueSync('delete', 'photo', { id: this._photo.id });

    this.dispatchEvent(new CustomEvent('photo-deleted', {
      detail: { photoId: this._photo.id },
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

        .editor-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .photo-preview {
          position: relative;
          width: 100%;
          max-height: 400px;
          overflow: hidden;
        }

        .photo-preview img {
          width: 100%;
          height: auto;
          display: block;
        }

        .photo-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          background: rgba(0,0,0,0.5);
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: rgba(0,0,0,0.7);
        }

        .action-btn.delete:hover {
          background: #f44336;
        }

        .editor-body {
          padding: 16px;
        }

        .caption-display {
          font-size: 14px;
          color: #333;
          margin-bottom: 12px;
          min-height: 20px;
        }

        .caption-display.empty {
          color: #999;
          font-style: italic;
        }

        .caption-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          resize: none;
          font-family: inherit;
        }

        .caption-input:focus {
          outline: none;
          border-color: var(--md-primary-fg-color, #009688);
        }

        .char-count {
          text-align: right;
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn-primary {
          background: var(--md-primary-fg-color, #009688);
          color: white;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .photo-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #666;
          padding-top: 12px;
          border-top: 1px solid #eee;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (prefers-color-scheme: dark) {
          .editor-container { background: #2d2d2d; }
          .caption-display { color: #fff; }
          .caption-input { background: #3d3d3d; border-color: #555; color: #fff; }
          .photo-meta { border-top-color: #444; color: #aaa; }
        }
      </style>
    `;

    if (!this._photo) {
      this.shadowRoot.innerHTML = styles + '<div class="editor-container"><p style="padding: 20px; text-align: center;">Carregando...</p></div>';
      return;
    }

    const dateStr = formatDate(this._photo.timestamp, { dateStyle: 'long', timeStyle: 'short' });

    let captionHTML = '';
    if (this._editing) {
      captionHTML = `
        <textarea class="caption-input" id="captionInput" maxlength="280" rows="3" placeholder="Adicionar legenda...">${this._photo.caption || ''}</textarea>
        <div class="char-count"><span id="charCount">${(this._photo.caption || '').length}</span>/280</div>
        <div class="edit-actions">
          <button class="btn btn-primary" id="saveBtn">Salvar</button>
          <button class="btn btn-secondary" id="cancelBtn">Cancelar</button>
        </div>
      `;
    } else {
      captionHTML = `
        <div class="caption-display ${this._photo.caption ? '' : 'empty'}" id="captionDisplay">
          ${this._photo.caption || 'Clique para adicionar legenda'}
        </div>
      `;
    }

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="editor-container">
        <div class="photo-preview">
          <img src="${this._photo.versions.medium}" alt="${this._photo.caption || ''}">
          <div class="photo-actions">
            <button class="action-btn" id="editBtn" title="Editar legenda">✏️</button>
            <button class="action-btn delete" id="deleteBtn" title="Excluir foto">🗑️</button>
          </div>
        </div>
        <div class="editor-body">
          ${captionHTML}
          <div class="photo-meta">
            <span class="meta-item">📅 ${dateStr}</span>
            ${this._photo.gps ? `<span class="meta-item">📍 ${this._photo.gps.latitude.toFixed(4)}, ${this._photo.gps.longitude.toFixed(4)}</span>` : ''}
            ${!this._photo.synced ? '<span class="meta-item">🔄 Pendente sync</span>' : ''}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.getElementById('editBtn')?.addEventListener('click', () => {
      this._editing = true;
      this.render();
    });

    this.shadowRoot.getElementById('deleteBtn')?.addEventListener('click', () => this.deletePhoto());

    this.shadowRoot.getElementById('captionDisplay')?.addEventListener('click', () => {
      this._editing = true;
      this.render();
    });

    this.shadowRoot.getElementById('saveBtn')?.addEventListener('click', () => {
      const input = this.shadowRoot.getElementById('captionInput');
      this.saveCaption(input.value);
    });

    this.shadowRoot.getElementById('cancelBtn')?.addEventListener('click', () => {
      this._editing = false;
      this.render();
    });

    // Character count
    const captionInput = this.shadowRoot.getElementById('captionInput');
    const charCount = this.shadowRoot.getElementById('charCount');
    captionInput?.addEventListener('input', () => {
      charCount.textContent = captionInput.value.length;
    });
  }
}

/**
 * Sync Status Custom Element
 * Shows sync queue status and pending items
 * Usage: <sync-status></sync-status>
 */
class SyncStatusElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._status = 'idle';
    this._pendingCount = 0;
    this._unsubscribe = null;
  }

  connectedCallback() {
    this.updateStatus();
    this._unsubscribe = onSyncStatusChange((status) => {
      this._status = status;
      this.updateStatus();
    });
  }

  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  async updateStatus() {
    this._status = getSyncStatus();
    this._pendingCount = await getPendingCount();
    this.render();
  }

  async handleRetry() {
    await retryFailedSync();
    this.updateStatus();
  }

  render() {
    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .sync-status.syncing {
          background: #fff3e0;
        }

        .sync-status.error {
          background: #ffebee;
        }

        .sync-status.offline {
          background: #fafafa;
        }

        .status-icon {
          font-size: 24px;
        }

        .status-icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status-info {
          flex: 1;
        }

        .status-title {
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }

        .status-subtitle {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .retry-btn {
          padding: 6px 12px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .retry-btn:hover {
          background: #d32f2f;
        }

        .hidden {
          display: none;
        }

        @media (prefers-color-scheme: dark) {
          .sync-status { background: #2d2d2d; }
          .sync-status.syncing { background: #3d3020; }
          .sync-status.error { background: #3d2020; }
          .status-title { color: #fff; }
          .status-subtitle { color: #aaa; }
        }
      </style>
    `;

    let icon = '✅';
    let title = 'Tudo sincronizado';
    let subtitle = '';
    let showRetry = false;
    let statusClass = '';

    if (!isOnline()) {
      icon = '📴';
      title = 'Offline';
      subtitle = this._pendingCount > 0 ? `${this._pendingCount} itens aguardando conexão` : 'Você está offline';
      statusClass = 'offline';
    } else if (this._status === 'syncing') {
      icon = '🔄';
      title = 'Sincronizando...';
      subtitle = `${this._pendingCount} itens pendentes`;
      statusClass = 'syncing';
    } else if (this._status === 'error') {
      icon = '⚠️';
      title = 'Erro na sincronização';
      subtitle = 'Alguns itens não puderam ser enviados';
      showRetry = true;
      statusClass = 'error';
    } else if (this._pendingCount > 0) {
      icon = '🔄';
      title = 'Pendente';
      subtitle = `${this._pendingCount} itens aguardando sync`;
    }

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="sync-status ${statusClass}">
        <span class="status-icon ${this._status === 'syncing' ? 'spinning' : ''}">${icon}</span>
        <div class="status-info">
          <div class="status-title">${title}</div>
          ${subtitle ? `<div class="status-subtitle">${subtitle}</div>` : ''}
        </div>
        <button class="retry-btn ${showRetry ? '' : 'hidden'}" id="retryBtn">Tentar novamente</button>
      </div>
    `;

    this.shadowRoot.getElementById('retryBtn')?.addEventListener('click', () => this.handleRetry());
  }
}

/**
 * Trip Progress Custom Element
 * Shows overall trip progress with visual indicators
 * Usage: <trip-progress></trip-progress>
 */
class TripProgress extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const tripStart = new Date('2026-01-19T00:00:00');
    const tripEnd = new Date('2026-02-02T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let status = 'planning';
    let daysElapsed = 0;
    let totalDays = 15;
    let progress = 0;
    let currentDay = null;
    let statusText = '';
    let statusIcon = '📅';

    if (today < tripStart) {
      const daysUntil = Math.ceil((tripStart - today) / (1000 * 60 * 60 * 24));
      status = 'planning';
      statusText = daysUntil === 1 ? 'Começa amanhã!' : `Começa em ${daysUntil} dias`;
      statusIcon = '🗓️';
    } else if (today > tripEnd) {
      status = 'completed';
      daysElapsed = totalDays;
      progress = 100;
      statusText = 'Viagem concluída!';
      statusIcon = '🏆';
    } else {
      status = 'active';
      daysElapsed = Math.floor((today - tripStart) / (1000 * 60 * 60 * 24)) + 1;
      currentDay = daysElapsed;
      progress = Math.round((daysElapsed / totalDays) * 100);
      statusText = `Dia ${currentDay} de ${totalDays}`;
      statusIcon = '🏍️';
    }

    const totalKm = 3200;
    const kmCompleted = Math.round((progress / 100) * totalKm);

    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .progress-card {
          background: linear-gradient(135deg, var(--md-primary-fg-color, #009688), #00796b);
          border-radius: 16px;
          padding: 20px;
          color: white;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
        }

        .progress-percent {
          font-size: 32px;
          font-weight: 700;
        }

        .progress-bar-container {
          margin-bottom: 16px;
        }

        .progress-bar {
          height: 10px;
          background: rgba(255,255,255,0.3);
          border-radius: 5px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: white;
          border-radius: 5px;
          transition: width 0.5s ease;
        }

        .progress-stats {
          display: flex;
          justify-content: space-between;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .active-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #4caf50;
          border-radius: 50%;
          animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="progress-card">
        <div class="progress-header">
          <div class="status-badge">
            <span>${statusIcon}</span>
            <span>${statusText}</span>
            ${status === 'active' ? '<span class="active-indicator"></span>' : ''}
          </div>
          <div class="progress-percent">${progress}%</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
        <div class="progress-stats">
          <div class="stat">
            <div class="stat-value">${daysElapsed}/${totalDays}</div>
            <div class="stat-label">Dias</div>
          </div>
          <div class="stat">
            <div class="stat-value">${kmCompleted.toLocaleString()}</div>
            <div class="stat-label">km percorridos</div>
          </div>
          <div class="stat">
            <div class="stat-value">${(totalKm - kmCompleted).toLocaleString()}</div>
            <div class="stat-label">km restantes</div>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Media Carousel Custom Element
 * Photo carousel for day cards
 * Usage: <media-carousel day="2026-01-22" max="4"></media-carousel>
 */
class MediaCarousel extends HTMLElement {
  static get observedAttributes() {
    return ['day', 'max'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._photos = [];
    this._currentIndex = 0;
  }

  connectedCallback() {
    this.loadPhotos();
  }

  get day() {
    return this.getAttribute('day');
  }

  get max() {
    return parseInt(this.getAttribute('max')) || 4;
  }

  async loadPhotos() {
    try {
      const allPhotos = await PhotosStore.getByDay(this.day);
      this._photos = allPhotos.slice(0, this.max);
    } catch (error) {
      this._photos = [];
    }
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
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .carousel {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #f0f0f0;
        }

        .carousel-track {
          display: flex;
          transition: transform 0.3s ease;
        }

        .carousel-slide {
          flex: 0 0 100%;
          aspect-ratio: 16/9;
        }

        .carousel-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
        }

        .carousel-nav:hover {
          background: rgba(0,0,0,0.7);
        }

        .carousel-nav:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .carousel-prev { left: 8px; }
        .carousel-next { right: 8px; }

        .carousel-dots {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          cursor: pointer;
        }

        .dot.active {
          background: white;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: #999;
          font-size: 13px;
        }

        .view-all {
          display: block;
          text-align: center;
          padding: 8px;
          background: rgba(0,0,0,0.05);
          color: var(--md-primary-fg-color, #009688);
          text-decoration: none;
          font-size: 12px;
        }

        @media (prefers-color-scheme: dark) {
          .carousel { background: #2d2d2d; }
        }
      </style>
    `;

    if (this._photos.length === 0) {
      this.shadowRoot.innerHTML = `
        ${styles}
        <div class="carousel">
          <div class="empty-state">📷 Nenhuma foto</div>
        </div>
      `;
      return;
    }

    const slidesHTML = this._photos.map(photo => `
      <div class="carousel-slide">
        <img src="${photo.versions.thumbnail}" alt="${photo.caption || ''}" loading="lazy">
      </div>
    `).join('');

    const dotsHTML = this._photos.map((_, i) => `
      <span class="dot ${i === this._currentIndex ? 'active' : ''}" data-index="${i}"></span>
    `).join('');

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="carousel">
        <div class="carousel-track" style="transform: translateX(-${this._currentIndex * 100}%)">
          ${slidesHTML}
        </div>
        ${this._photos.length > 1 ? `
          <button class="carousel-nav carousel-prev" ${this._currentIndex === 0 ? 'disabled' : ''}>‹</button>
          <button class="carousel-nav carousel-next" ${this._currentIndex === this._photos.length - 1 ? 'disabled' : ''}>›</button>
          <div class="carousel-dots">${dotsHTML}</div>
        ` : ''}
      </div>
    `;

    // Navigation
    this.shadowRoot.querySelector('.carousel-prev')?.addEventListener('click', () => this.prev());
    this.shadowRoot.querySelector('.carousel-next')?.addEventListener('click', () => this.next());

    // Dots
    this.shadowRoot.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this._currentIndex = parseInt(dot.dataset.index);
        this.render();
      });
    });

    // Touch swipe
    const carousel = this.shadowRoot.querySelector('.carousel');
    let touchStartX = 0;

    carousel?.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carousel?.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.next();
        else this.prev();
      }
    });
  }
}

/**
 * Warning Badge Custom Element
 * Shows weather or other warnings
 * Usage: <warning-badge type="weather" severity="warning"></warning-badge>
 */
class WarningBadge extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'severity', 'message'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get type() {
    return this.getAttribute('type') || 'info';
  }

  get severity() {
    return this.getAttribute('severity') || 'info';
  }

  get message() {
    return this.getAttribute('message') || '';
  }

  render() {
    const icons = {
      weather: '🌧️',
      alert: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };

    const colors = {
      info: '#2196f3',
      warning: '#ff9800',
      danger: '#f44336',
      success: '#4caf50'
    };

    const styles = `
      <style>
        :host {
          display: inline-flex;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: ${colors[this.severity]};
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .icon {
          font-size: 12px;
        }
      </style>
    `;

    this.shadowRoot.innerHTML = `
      ${styles}
      <span class="badge" title="${this.message}">
        <span class="icon">${icons[this.type]}</span>
        <span>${this.message || this.type}</span>
      </span>
    `;
  }
}

/**
 * Register custom elements
 */
export function registerIntegrationElements() {
  if (!customElements.get('photo-editor')) {
    customElements.define('photo-editor', PhotoEditor);
  }
  if (!customElements.get('sync-status')) {
    customElements.define('sync-status', SyncStatusElement);
  }
  if (!customElements.get('trip-progress')) {
    customElements.define('trip-progress', TripProgress);
  }
  if (!customElements.get('media-carousel')) {
    customElements.define('media-carousel', MediaCarousel);
  }
  if (!customElements.get('warning-badge')) {
    customElements.define('warning-badge', WarningBadge);
  }
}

/**
 * Initialize integration module
 */
export function initIntegration() {
  registerIntegrationElements();
  console.log('[Integration] Module initialized');
}

export {
  PhotoEditor,
  SyncStatusElement,
  TripProgress,
  MediaCarousel,
  WarningBadge
};
