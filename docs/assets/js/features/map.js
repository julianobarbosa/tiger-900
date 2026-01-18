/**
 * Tiger 900 - Map Module
 *
 * Interactive map functionality:
 * - Leaflet.js integration
 * - GPX route display
 * - Photo markers with GPS
 * - Points of interest
 * - Offline tile caching support
 *
 * @module features/map
 */

import { parseGPX, haversineDistance, formatDate } from '../core/utils.js';
import { getAllPhotos, getPhotosForDay } from './gallery.js';

/**
 * Map configuration
 */
const CONFIG = {
  defaultCenter: [-28.5, -50.0], // Serra Gaúcha region
  defaultZoom: 8,
  minZoom: 6,
  maxZoom: 18,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  // Route colors for each day
  routeColors: [
    '#2196f3', '#4caf50', '#ff9800', '#e91e63',
    '#9c27b0', '#00bcd4', '#ff5722', '#795548',
    '#607d8b', '#3f51b5', '#009688', '#ffc107',
    '#673ab7', '#8bc34a', '#f44336'
  ]
};

/**
 * Trip waypoints
 */
const TRIP_WAYPOINTS = {
  '2026-01-19': { start: 'Goiânia', end: 'Uberaba', coords: { start: [-16.6869, -49.2648], end: [-19.7489, -47.9318] } },
  '2026-01-20': { start: 'Uberaba', end: 'Ourinhos', coords: { start: [-19.7489, -47.9318], end: [-22.9781, -49.8719] } },
  '2026-01-21': { start: 'Ourinhos', end: 'Ponta Grossa', coords: { start: [-22.9781, -49.8719], end: [-25.0994, -50.1583] } },
  '2026-01-22': { start: 'Ponta Grossa', end: 'Urubici', coords: { start: [-25.0994, -50.1583], end: [-27.9994, -49.5897] } },
  '2026-01-23': { start: 'Urubici', end: 'Urubici', coords: { start: [-27.9994, -49.5897], end: [-27.9994, -49.5897] } },
  '2026-01-24': { start: 'Urubici', end: 'Bom Jardim', coords: { start: [-27.9994, -49.5897], end: [-28.3389, -49.6358] } },
  '2026-01-25': { start: 'Bom Jardim', end: 'Cambará do Sul', coords: { start: [-28.3389, -49.6358], end: [-29.0472, -50.1431] } },
  '2026-01-26': { start: 'Cambará do Sul', end: 'Cambará do Sul', coords: { start: [-29.0472, -50.1431], end: [-29.0472, -50.1431] } },
  '2026-01-27': { start: 'Cambará do Sul', end: 'Bento Gonçalves', coords: { start: [-29.0472, -50.1431], end: [-29.1699, -51.5188] } },
  '2026-01-28': { start: 'Bento Gonçalves', end: 'Bento Gonçalves', coords: { start: [-29.1699, -51.5188], end: [-29.1699, -51.5188] } },
  '2026-01-29': { start: 'Bento Gonçalves', end: 'Curitiba', coords: { start: [-29.1699, -51.5188], end: [-25.4284, -49.2733] } },
  '2026-01-30': { start: 'Curitiba', end: 'Curitiba', coords: { start: [-25.4284, -49.2733], end: [-25.4284, -49.2733] } },
  '2026-01-31': { start: 'Curitiba', end: 'Ourinhos', coords: { start: [-25.4284, -49.2733], end: [-22.9781, -49.8719] } },
  '2026-02-01': { start: 'Ourinhos', end: 'Uberaba', coords: { start: [-22.9781, -49.8719], end: [-19.7489, -47.9318] } },
  '2026-02-02': { start: 'Uberaba', end: 'Goiânia', coords: { start: [-19.7489, -47.9318], end: [-16.6869, -49.2648] } }
};

/**
 * Points of Interest
 */
const POIS = [
  { name: 'Serra do Rio do Rastro', type: 'landmark', coords: [-28.0833, -49.5333], description: 'Estrada mais bonita do Brasil' },
  { name: 'Morro da Igreja', type: 'landmark', coords: [-28.0528, -49.4814], description: 'Ponto mais alto do Sul do Brasil (1.822m)' },
  { name: 'Pedra Furada', type: 'landmark', coords: [-28.0453, -49.5842], description: 'Formação rochosa icônica' },
  { name: 'Cânion Fortaleza', type: 'landmark', coords: [-29.2333, -49.9500], description: 'Vista espetacular dos cânions' },
  { name: 'Cânion Itaimbezinho', type: 'landmark', coords: [-29.2833, -50.0833], description: 'Maior cânion da América do Sul' },
  { name: 'Vale dos Vinhedos', type: 'attraction', coords: [-29.2167, -51.5500], description: 'Rota do vinho gaúcho' }
];

/**
 * Load Leaflet dynamically
 */
let leafletLoaded = false;
let L = null;

async function loadLeaflet() {
  if (leafletLoaded && L) return L;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.L) {
      L = window.L;
      leafletLoaded = true;
      resolve(L);
      return;
    }

    // Load CSS
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      L = window.L;
      leafletLoaded = true;
      resolve(L);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Create custom marker icons
 */
function createMarkerIcons(L) {
  const iconSize = [32, 32];
  const iconAnchor = [16, 32];
  const popupAnchor = [0, -32];

  return {
    start: L.divIcon({
      className: 'custom-marker marker-start',
      html: '<div class="marker-icon">🟢</div>',
      iconSize,
      iconAnchor,
      popupAnchor
    }),
    end: L.divIcon({
      className: 'custom-marker marker-end',
      html: '<div class="marker-icon">🔴</div>',
      iconSize,
      iconAnchor,
      popupAnchor
    }),
    photo: L.divIcon({
      className: 'custom-marker marker-photo',
      html: '<div class="marker-icon">📷</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28]
    }),
    landmark: L.divIcon({
      className: 'custom-marker marker-landmark',
      html: '<div class="marker-icon">⛰️</div>',
      iconSize,
      iconAnchor,
      popupAnchor
    }),
    attraction: L.divIcon({
      className: 'custom-marker marker-attraction',
      html: '<div class="marker-icon">🏛️</div>',
      iconSize,
      iconAnchor,
      popupAnchor
    }),
    fuel: L.divIcon({
      className: 'custom-marker marker-fuel',
      html: '<div class="marker-icon">⛽</div>',
      iconSize,
      iconAnchor,
      popupAnchor
    }),
    restaurant: L.divIcon({
      className: 'custom-marker marker-restaurant',
      html: '<div class="marker-icon">🍽️</div>',
      iconSize,
      iconAnchor,
      popupAnchor
    })
  };
}

/**
 * Route Map Custom Element
 * Usage: <route-map day="2026-01-22"></route-map>
 * Usage: <route-map show-all></route-map>
 */
class RouteMap extends HTMLElement {
  static get observedAttributes() {
    return ['day', 'show-all', 'gpx-url', 'height'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._map = null;
    this._layers = {
      routes: [],
      markers: [],
      photos: []
    };
    this._loading = true;
  }

  async connectedCallback() {
    this.render();
    await this.initMap();
  }

  disconnectedCallback() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this._map) {
      this.updateMapContent();
    }
  }

  get day() {
    return this.getAttribute('day');
  }

  get showAll() {
    return this.hasAttribute('show-all');
  }

  get gpxUrl() {
    return this.getAttribute('gpx-url');
  }

  get height() {
    return this.getAttribute('height') || '400px';
  }

  async initMap() {
    try {
      const L = await loadLeaflet();

      // Wait for shadow DOM to render
      await new Promise(r => setTimeout(r, 100));

      const container = this.shadowRoot.getElementById('map');
      if (!container) return;

      // Initialize map
      this._map = L.map(container, {
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        minZoom: CONFIG.minZoom,
        maxZoom: CONFIG.maxZoom,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer
      L.tileLayer(CONFIG.tileUrl, {
        attribution: CONFIG.tileAttribution
      }).addTo(this._map);

      // Create marker icons
      this._icons = createMarkerIcons(L);

      this._loading = false;
      this.render();

      // Load content
      await this.updateMapContent();
    } catch (error) {
      console.error('[Map] Init error:', error);
      this._loading = false;
      this.render();
    }
  }

  async updateMapContent() {
    if (!this._map) return;

    // Clear existing layers
    this.clearLayers();

    const L = window.L;

    if (this.gpxUrl) {
      // Load GPX file
      await this.loadGPX(this.gpxUrl);
    } else if (this.showAll) {
      // Show all days
      await this.showAllRoutes();
    } else if (this.day) {
      // Show specific day
      await this.showDayRoute(this.day);
    }

    // Fit bounds to show all content
    this.fitBounds();
  }

  clearLayers() {
    const L = window.L;

    this._layers.routes.forEach(layer => this._map.removeLayer(layer));
    this._layers.markers.forEach(layer => this._map.removeLayer(layer));
    this._layers.photos.forEach(layer => this._map.removeLayer(layer));

    this._layers = { routes: [], markers: [], photos: [] };
  }

  async loadGPX(url) {
    try {
      const response = await fetch(url);
      const gpxText = await response.text();
      const gpxData = parseGPX(gpxText);

      if (gpxData.points.length > 0) {
        this.addRoute(gpxData.points.map(p => [p.lat, p.lon]), 0);

        // Add start/end markers
        const first = gpxData.points[0];
        const last = gpxData.points[gpxData.points.length - 1];

        this.addMarker([first.lat, first.lon], 'start', 'Início');
        this.addMarker([last.lat, last.lon], 'end', 'Fim');
      }
    } catch (error) {
      console.error('[Map] GPX load error:', error);
    }
  }

  async showDayRoute(dayDate) {
    const waypoint = TRIP_WAYPOINTS[dayDate];
    if (!waypoint) return;

    const L = window.L;
    const dayIndex = Object.keys(TRIP_WAYPOINTS).indexOf(dayDate);

    // Add route line (simplified without GPX)
    if (waypoint.coords.start[0] !== waypoint.coords.end[0] ||
        waypoint.coords.start[1] !== waypoint.coords.end[1]) {
      this.addRoute([waypoint.coords.start, waypoint.coords.end], dayIndex);
    }

    // Add markers
    this.addMarker(waypoint.coords.start, 'start', `Partida: ${waypoint.start}`);
    this.addMarker(waypoint.coords.end, 'end', `Chegada: ${waypoint.end}`);

    // Add relevant POIs
    POIS.forEach(poi => {
      const distStart = haversineDistance(
        { lat: waypoint.coords.start[0], lon: waypoint.coords.start[1] },
        { lat: poi.coords[0], lon: poi.coords[1] }
      );
      const distEnd = haversineDistance(
        { lat: waypoint.coords.end[0], lon: waypoint.coords.end[1] },
        { lat: poi.coords[0], lon: poi.coords[1] }
      );

      if (distStart < 100 || distEnd < 100) {
        this.addMarker(poi.coords, poi.type, `${poi.name}<br><small>${poi.description}</small>`);
      }
    });

    // Add photo markers
    await this.addPhotoMarkers(dayDate);
  }

  async showAllRoutes() {
    const L = window.L;
    const dates = Object.keys(TRIP_WAYPOINTS);

    dates.forEach((date, index) => {
      const waypoint = TRIP_WAYPOINTS[date];

      if (waypoint.coords.start[0] !== waypoint.coords.end[0] ||
          waypoint.coords.start[1] !== waypoint.coords.end[1]) {
        this.addRoute([waypoint.coords.start, waypoint.coords.end], index);
      }
    });

    // Add start and end of trip
    const firstDay = TRIP_WAYPOINTS[dates[0]];
    const lastDay = TRIP_WAYPOINTS[dates[dates.length - 1]];

    this.addMarker(firstDay.coords.start, 'start', 'Início da Viagem<br>Goiânia');
    this.addMarker(lastDay.coords.end, 'end', 'Fim da Viagem<br>Goiânia');

    // Add all POIs
    POIS.forEach(poi => {
      this.addMarker(poi.coords, poi.type, `${poi.name}<br><small>${poi.description}</small>`);
    });
  }

  addRoute(coordinates, colorIndex) {
    const L = window.L;
    const color = CONFIG.routeColors[colorIndex % CONFIG.routeColors.length];

    const polyline = L.polyline(coordinates, {
      color,
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(this._map);

    this._layers.routes.push(polyline);
    return polyline;
  }

  addMarker(coords, type, popupContent) {
    const L = window.L;
    const icon = this._icons[type] || this._icons.landmark;

    const marker = L.marker(coords, { icon })
      .bindPopup(popupContent)
      .addTo(this._map);

    this._layers.markers.push(marker);
    return marker;
  }

  async addPhotoMarkers(dayDate) {
    try {
      const photos = dayDate
        ? await getPhotosForDay(dayDate)
        : await getAllPhotos();

      const L = window.L;

      photos.forEach(photo => {
        if (!photo.gps) return;

        const marker = L.marker([photo.gps.latitude, photo.gps.longitude], {
          icon: this._icons.photo
        });

        const popupContent = `
          <div style="text-align: center;">
            <img src="${photo.versions.thumbnail}" style="max-width: 150px; border-radius: 4px;">
            ${photo.caption ? `<p style="margin: 8px 0 0; font-size: 12px;">${photo.caption}</p>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent).addTo(this._map);
        this._layers.photos.push(marker);
      });
    } catch (error) {
      console.error('[Map] Photo markers error:', error);
    }
  }

  fitBounds() {
    const L = window.L;
    const allLayers = [...this._layers.routes, ...this._layers.markers, ...this._layers.photos];

    if (allLayers.length === 0) return;

    const group = L.featureGroup(allLayers);
    this._map.fitBounds(group.getBounds(), { padding: [30, 30] });
  }

  render() {
    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .map-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #e0e0e0;
        }

        #map {
          width: 100%;
          height: ${this.height};
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.9);
          z-index: 1000;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e0e0e0;
          border-top-color: var(--md-primary-fg-color, #009688);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Custom marker styles */
        .marker-icon {
          font-size: 24px;
          text-align: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .custom-marker {
          background: transparent !important;
          border: none !important;
        }

        /* Legend */
        .map-legend {
          position: absolute;
          bottom: 30px;
          right: 10px;
          background: white;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 1000;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 4px 0;
        }

        .legend-color {
          width: 20px;
          height: 4px;
          border-radius: 2px;
        }

        @media (prefers-color-scheme: dark) {
          .map-container { background: #2d2d2d; }
          .loading-overlay { background: rgba(45,45,45,0.9); }
          .map-legend { background: #2d2d2d; color: #fff; }
        }
      </style>
    `;

    const loadingOverlay = this._loading ? `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    ` : '';

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="map-container">
        <div id="map"></div>
        ${loadingOverlay}
      </div>
    `;
  }
}

/**
 * Mini Map Custom Element (for day cards)
 * Usage: <mini-map day="2026-01-22"></mini-map>
 */
class MiniMap extends HTMLElement {
  static get observedAttributes() {
    return ['day'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  get day() {
    return this.getAttribute('day');
  }

  render() {
    const waypoint = TRIP_WAYPOINTS[this.day];

    const styles = `
      <style>
        :host {
          display: block;
        }

        .mini-map {
          width: 100%;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
        }

        .mini-map:hover {
          opacity: 0.9;
        }

        .route-preview {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 32px;
        }

        .cities-label {
          position: absolute;
          bottom: 8px;
          left: 8px;
          right: 8px;
          font-size: 11px;
          color: #333;
          background: rgba(255,255,255,0.9);
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
        }

        .expand-hint {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 16px;
          opacity: 0.7;
        }
      </style>
    `;

    const content = waypoint ? `
      <div class="mini-map" title="Clique para ver mapa completo">
        <span class="route-preview">🗺️</span>
        <span class="expand-hint">🔍</span>
        <div class="cities-label">${waypoint.start} → ${waypoint.end}</div>
      </div>
    ` : `
      <div class="mini-map">
        <span class="route-preview">🗺️</span>
      </div>
    `;

    this.shadowRoot.innerHTML = styles + content;

    // Click to open full map
    this.shadowRoot.querySelector('.mini-map')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open-map', {
        detail: { day: this.day },
        bubbles: true
      }));
    });
  }
}

/**
 * Register custom elements
 */
export function registerMapElements() {
  if (!customElements.get('route-map')) {
    customElements.define('route-map', RouteMap);
  }
  if (!customElements.get('mini-map')) {
    customElements.define('mini-map', MiniMap);
  }
}

/**
 * Initialize map module
 */
export function initMap() {
  registerMapElements();

  // Add global styles for Leaflet markers
  const style = document.createElement('style');
  style.textContent = `
    .custom-marker {
      background: transparent !important;
      border: none !important;
    }
    .marker-icon {
      font-size: 24px;
      text-align: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
  `;
  document.head.appendChild(style);

  console.log('[Map] Module initialized');
}

export {
  loadLeaflet,
  CONFIG as MapConfig,
  TRIP_WAYPOINTS,
  POIS
};
