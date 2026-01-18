/**
 * Tiger 900 - Weather Module
 *
 * Weather forecast functionality:
 * - WeatherWidget custom element
 * - Multi-day weather overview
 * - Open-Meteo API integration
 * - IndexedDB caching with TTL
 * - Offline graceful degradation
 *
 * @module features/weather
 */

import { Store, WeatherStore } from '../core/store.js';
import { formatDate, isOnline, onNetworkChange } from '../core/utils.js';

/**
 * API Configuration
 */
const CONFIG = {
  API_URL: 'https://api.open-meteo.com/v1/forecast',
  CACHE_TTL: 3 * 60 * 60 * 1000, // 3 hours
  TIMEZONE: 'America/Sao_Paulo'
};

/**
 * Trip cities with coordinates (destination of each day)
 */
const TRIP_CITIES = {
  '2026-01-19': { nome: 'Uberaba', lat: -19.7489, lon: -47.9318 },
  '2026-01-20': { nome: 'Ourinhos', lat: -22.9781, lon: -49.8719 },
  '2026-01-21': { nome: 'Ponta Grossa', lat: -25.0994, lon: -50.1583 },
  '2026-01-22': { nome: 'Urubici', lat: -27.9994, lon: -49.5897 },
  '2026-01-23': { nome: 'Urubici', lat: -27.9994, lon: -49.5897 },
  '2026-01-24': { nome: 'Bom Jardim', lat: -28.3389, lon: -49.6358 },
  '2026-01-25': { nome: 'Cambará do Sul', lat: -29.0472, lon: -50.1431 },
  '2026-01-26': { nome: 'Cambará do Sul', lat: -29.0472, lon: -50.1431 },
  '2026-01-27': { nome: 'Bento Gonçalves', lat: -29.1699, lon: -51.5188 },
  '2026-01-28': { nome: 'Bento Gonçalves', lat: -29.1699, lon: -51.5188 },
  '2026-01-29': { nome: 'Curitiba', lat: -25.4284, lon: -49.2733 },
  '2026-01-30': { nome: 'Curitiba', lat: -25.4284, lon: -49.2733 },
  '2026-01-31': { nome: 'Ourinhos', lat: -22.9781, lon: -49.8719 },
  '2026-02-01': { nome: 'Uberaba', lat: -19.7489, lon: -47.9318 },
  '2026-02-02': { nome: 'Goiânia', lat: -16.6869, lon: -49.2648 }
};

/**
 * WMO Weather Codes to icons and descriptions
 */
const WMO_CODES = {
  0: { icon: '☀️', desc: 'Céu limpo', severity: 'good' },
  1: { icon: '🌤️', desc: 'Principalmente limpo', severity: 'good' },
  2: { icon: '⛅', desc: 'Parcialmente nublado', severity: 'fair' },
  3: { icon: '☁️', desc: 'Nublado', severity: 'fair' },
  45: { icon: '🌫️', desc: 'Neblina', severity: 'caution' },
  48: { icon: '🌫️', desc: 'Neblina com geada', severity: 'caution' },
  51: { icon: '🌧️', desc: 'Garoa leve', severity: 'caution' },
  53: { icon: '🌧️', desc: 'Garoa moderada', severity: 'caution' },
  55: { icon: '🌧️', desc: 'Garoa intensa', severity: 'warning' },
  61: { icon: '🌧️', desc: 'Chuva leve', severity: 'caution' },
  63: { icon: '🌧️', desc: 'Chuva moderada', severity: 'warning' },
  65: { icon: '🌧️', desc: 'Chuva forte', severity: 'danger' },
  66: { icon: '🌨️', desc: 'Chuva congelante leve', severity: 'warning' },
  67: { icon: '🌨️', desc: 'Chuva congelante forte', severity: 'danger' },
  71: { icon: '❄️', desc: 'Neve leve', severity: 'warning' },
  73: { icon: '❄️', desc: 'Neve moderada', severity: 'danger' },
  75: { icon: '❄️', desc: 'Neve forte', severity: 'danger' },
  80: { icon: '🌦️', desc: 'Pancadas leves', severity: 'caution' },
  81: { icon: '🌦️', desc: 'Pancadas moderadas', severity: 'warning' },
  82: { icon: '⛈️', desc: 'Pancadas fortes', severity: 'danger' },
  95: { icon: '⛈️', desc: 'Tempestade', severity: 'danger' },
  96: { icon: '⛈️', desc: 'Tempestade com granizo', severity: 'danger' },
  99: { icon: '⛈️', desc: 'Tempestade severa', severity: 'danger' }
};

/**
 * Get WMO info for a weather code
 */
function getWMOInfo(code) {
  return WMO_CODES[code] || { icon: '❓', desc: 'Desconhecido', severity: 'unknown' };
}

/**
 * Get city info for a date
 */
export function getCityForDate(dateStr) {
  return TRIP_CITIES[dateStr] || null;
}

/**
 * Fetch weather data from Open-Meteo API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
async function fetchWeatherFromAPI(lat, lon, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
    timezone: CONFIG.TIMEZONE,
    start_date: startDate,
    end_date: endDate
  });

  const response = await fetch(`${CONFIG.API_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get weather for a specific date and location
 * Uses cache if available, fetches from API otherwise
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {Object} city - City object with lat, lon, nome
 * @returns {Promise<Object|null>}
 */
export async function getWeatherForDate(dateStr, city = null) {
  if (!city) {
    city = getCityForDate(dateStr);
  }

  if (!city) {
    return null;
  }

  const cacheKey = `${dateStr}_${city.lat}_${city.lon}`;

  // Try cache first
  const cached = await WeatherStore.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_TTL)) {
    return cached.data;
  }

  // Fetch from API if online
  if (!isOnline()) {
    // Return stale cache if available
    if (cached) {
      return { ...cached.data, stale: true };
    }
    return null;
  }

  try {
    const apiData = await fetchWeatherFromAPI(city.lat, city.lon, dateStr, dateStr);

    if (!apiData.daily) {
      return null;
    }

    const weather = {
      date: dateStr,
      city: city.nome,
      code: apiData.daily.weathercode[0],
      tempMax: apiData.daily.temperature_2m_max[0],
      tempMin: apiData.daily.temperature_2m_min[0],
      precipitation: apiData.daily.precipitation_probability_max[0],
      precipSum: apiData.daily.precipitation_sum?.[0] || 0,
      windMax: apiData.daily.wind_speed_10m_max?.[0] || 0
    };

    // Cache the result
    await WeatherStore.save(cacheKey, weather);

    return weather;
  } catch (error) {
    console.error('[Weather] API error:', error);

    // Return stale cache on error
    if (cached) {
      return { ...cached.data, stale: true };
    }
    return null;
  }
}

/**
 * Get weather for all trip days
 * @returns {Promise<Map<string, Object>>}
 */
export async function getAllTripWeather() {
  const weatherMap = new Map();
  const dates = Object.keys(TRIP_CITIES);

  // Group by unique city to reduce API calls
  const uniqueCities = new Map();
  for (const date of dates) {
    const city = TRIP_CITIES[date];
    const key = `${city.lat},${city.lon}`;
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, { city, dates: [] });
    }
    uniqueCities.get(key).dates.push(date);
  }

  // Check cache first for all dates
  for (const date of dates) {
    const city = TRIP_CITIES[date];
    const cacheKey = `${date}_${city.lat}_${city.lon}`;
    const cached = await WeatherStore.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_TTL)) {
      weatherMap.set(date, cached.data);
    }
  }

  // If all cached, return early
  if (weatherMap.size === dates.length) {
    return weatherMap;
  }

  // Fetch missing from API
  if (!isOnline()) {
    // Fill remaining with stale cache or null
    for (const date of dates) {
      if (!weatherMap.has(date)) {
        const city = TRIP_CITIES[date];
        const cacheKey = `${date}_${city.lat}_${city.lon}`;
        const cached = await WeatherStore.get(cacheKey);
        if (cached) {
          weatherMap.set(date, { ...cached.data, stale: true });
        }
      }
    }
    return weatherMap;
  }

  // Fetch from API for each unique city
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  for (const [, { city, dates: cityDates }] of uniqueCities) {
    try {
      const apiData = await fetchWeatherFromAPI(city.lat, city.lon, startDate, endDate);

      if (apiData.daily) {
        for (let i = 0; i < apiData.daily.time.length; i++) {
          const date = apiData.daily.time[i];

          if (cityDates.includes(date)) {
            const weather = {
              date,
              city: city.nome,
              code: apiData.daily.weathercode[i],
              tempMax: apiData.daily.temperature_2m_max[i],
              tempMin: apiData.daily.temperature_2m_min[i],
              precipitation: apiData.daily.precipitation_probability_max[i],
              precipSum: apiData.daily.precipitation_sum?.[i] || 0,
              windMax: apiData.daily.wind_speed_10m_max?.[i] || 0
            };

            weatherMap.set(date, weather);

            // Cache individually
            const cacheKey = `${date}_${city.lat}_${city.lon}`;
            await WeatherStore.save(cacheKey, weather);
          }
        }
      }
    } catch (error) {
      console.error('[Weather] API error for', city.nome, error);
    }
  }

  return weatherMap;
}

/**
 * Weather Widget Custom Element
 * Usage: <weather-widget date="2026-01-22"></weather-widget>
 */
class WeatherWidget extends HTMLElement {
  static get observedAttributes() {
    return ['date', 'compact'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._weather = null;
    this._loading = false;
  }

  connectedCallback() {
    this.render();
    this.loadWeather();

    // Refresh when coming back online
    this._networkListener = onNetworkChange((online) => {
      if (online && this._weather?.stale) {
        this.loadWeather();
      }
    });
  }

  disconnectedCallback() {
    if (this._networkListener) {
      this._networkListener();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.loadWeather();
    }
  }

  get date() {
    return this.getAttribute('date');
  }

  get compact() {
    return this.hasAttribute('compact');
  }

  async loadWeather() {
    const dateStr = this.date;
    if (!dateStr) return;

    this._loading = true;
    this.render();

    try {
      this._weather = await getWeatherForDate(dateStr);
    } catch (error) {
      console.error('[WeatherWidget] Error loading weather:', error);
      this._weather = null;
    }

    this._loading = false;
    this.render();
  }

  render() {
    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .weather-widget {
          background: var(--weather-bg, #f5f5f5);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        :host([compact]) .weather-widget {
          padding: 12px;
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }

        .weather-loading {
          text-align: center;
          color: #666;
          padding: 16px;
        }

        .weather-unavailable {
          text-align: center;
          color: #999;
          padding: 16px;
          font-size: 14px;
        }

        .weather-icon {
          font-size: 48px;
          line-height: 1;
        }

        :host([compact]) .weather-icon {
          font-size: 32px;
        }

        .weather-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .weather-temps {
          display: flex;
          flex-direction: column;
        }

        .temp-max {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        :host([compact]) .temp-max {
          font-size: 18px;
        }

        .temp-min {
          font-size: 14px;
          color: #666;
        }

        .weather-desc {
          font-size: 14px;
          color: #555;
        }

        .weather-details {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #666;
          flex-wrap: wrap;
        }

        :host([compact]) .weather-details {
          display: none;
        }

        .weather-detail {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .weather-city {
          font-size: 12px;
          color: #888;
        }

        .weather-stale {
          font-size: 11px;
          color: #ff9800;
          margin-top: 4px;
        }

        .severity-good .weather-widget { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); }
        .severity-fair .weather-widget { background: linear-gradient(135deg, #e3f2fd, #bbdefb); }
        .severity-caution .weather-widget { background: linear-gradient(135deg, #fff3e0, #ffe0b2); }
        .severity-warning .weather-widget { background: linear-gradient(135deg, #fff8e1, #ffecb3); }
        .severity-danger .weather-widget { background: linear-gradient(135deg, #ffebee, #ffcdd2); }

        @media (prefers-color-scheme: dark) {
          .weather-widget { background: #2d2d2d; }
          .temp-max { color: #fff; }
          .temp-min { color: #aaa; }
          .weather-desc { color: #ccc; }
          .weather-details { color: #aaa; }
          .weather-city { color: #888; }
        }
      </style>
    `;

    let content = '';

    if (this._loading) {
      content = `
        <div class="weather-widget">
          <div class="weather-loading">Carregando...</div>
        </div>
      `;
    } else if (!this._weather) {
      content = `
        <div class="weather-widget">
          <div class="weather-unavailable">
            ${isOnline() ? 'Previsão não disponível' : '📴 Offline - sem dados em cache'}
          </div>
        </div>
      `;
    } else {
      const w = this._weather;
      const info = getWMOInfo(w.code);

      content = `
        <div class="severity-${info.severity}">
          <div class="weather-widget">
            <div class="weather-main">
              <span class="weather-icon">${info.icon}</span>
              <div class="weather-temps">
                <span class="temp-max">${Math.round(w.tempMax)}°C</span>
                <span class="temp-min">${Math.round(w.tempMin)}° mín</span>
              </div>
            </div>
            <div class="weather-desc">${info.desc}</div>
            <div class="weather-details">
              <span class="weather-detail">💧 ${w.precipitation}%</span>
              ${w.precipSum > 0 ? `<span class="weather-detail">🌧️ ${w.precipSum.toFixed(1)}mm</span>` : ''}
              ${w.windMax > 0 ? `<span class="weather-detail">💨 ${Math.round(w.windMax)}km/h</span>` : ''}
            </div>
            <div class="weather-city">📍 ${w.city}</div>
            ${w.stale ? '<div class="weather-stale">⚠️ Dados desatualizados</div>' : ''}
          </div>
        </div>
      `;
    }

    this.shadowRoot.innerHTML = styles + content;
  }
}

/**
 * Weather Overview Custom Element
 * Shows weather for all trip days in a horizontal scroll
 * Usage: <weather-overview></weather-overview>
 */
class WeatherOverview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._weatherMap = new Map();
    this._loading = false;
  }

  connectedCallback() {
    this.render();
    this.loadAllWeather();
  }

  async loadAllWeather() {
    this._loading = true;
    this.render();

    try {
      this._weatherMap = await getAllTripWeather();
    } catch (error) {
      console.error('[WeatherOverview] Error:', error);
    }

    this._loading = false;
    this.render();
  }

  render() {
    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .weather-overview {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 8px 4px 16px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .weather-overview::-webkit-scrollbar {
          height: 6px;
        }

        .weather-overview::-webkit-scrollbar-track {
          background: #e0e0e0;
          border-radius: 3px;
        }

        .weather-overview::-webkit-scrollbar-thumb {
          background: #999;
          border-radius: 3px;
        }

        .weather-card {
          flex: 0 0 auto;
          width: 120px;
          background: #f5f5f5;
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          scroll-snap-align: start;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .weather-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .weather-card.warning {
          background: linear-gradient(135deg, #fff3e0, #ffe0b2);
          border: 2px solid #ff9800;
        }

        .weather-card.danger {
          background: linear-gradient(135deg, #ffebee, #ffcdd2);
          border: 2px solid #f44336;
        }

        .card-date {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .card-day {
          font-size: 11px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .card-icon {
          font-size: 32px;
          line-height: 1;
          margin-bottom: 8px;
        }

        .card-temps {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .card-precip {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }

        .card-city {
          font-size: 10px;
          color: #888;
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .loading-message {
          text-align: center;
          padding: 24px;
          color: #666;
        }

        @media (prefers-color-scheme: dark) {
          .weather-card { background: #2d2d2d; }
          .card-day { color: #fff; }
          .card-temps { color: #fff; }
          .card-date, .card-precip { color: #aaa; }
        }
      </style>
    `;

    let content = '';

    if (this._loading) {
      content = '<div class="loading-message">Carregando previsões...</div>';
    } else {
      const dates = Object.keys(TRIP_CITIES);
      const cards = dates.map((date, index) => {
        const weather = this._weatherMap.get(date);
        const city = TRIP_CITIES[date];
        const dateObj = new Date(date + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayNum = dateObj.getDate();
        const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' });

        if (!weather) {
          return `
            <div class="weather-card" data-date="${date}">
              <div class="card-date">${dayName}</div>
              <div class="card-day">Dia ${index + 1}</div>
              <div class="card-icon">❓</div>
              <div class="card-temps">—</div>
              <div class="card-city">${city.nome}</div>
            </div>
          `;
        }

        const info = getWMOInfo(weather.code);
        const cardClass = weather.precipitation > 70 ? 'danger' :
                         weather.precipitation > 50 ? 'warning' : '';

        return `
          <div class="weather-card ${cardClass}" data-date="${date}">
            <div class="card-date">${dayNum} ${month}</div>
            <div class="card-day">Dia ${index + 1}</div>
            <div class="card-icon">${info.icon}</div>
            <div class="card-temps">${Math.round(weather.tempMin)}° / ${Math.round(weather.tempMax)}°</div>
            <div class="card-precip">💧 ${weather.precipitation}%</div>
            <div class="card-city">${city.nome}</div>
          </div>
        `;
      }).join('');

      content = `<div class="weather-overview">${cards}</div>`;
    }

    this.shadowRoot.innerHTML = styles + content;
  }
}

/**
 * Register custom elements
 */
export function registerWeatherElements() {
  if (!customElements.get('weather-widget')) {
    customElements.define('weather-widget', WeatherWidget);
  }
  if (!customElements.get('weather-overview')) {
    customElements.define('weather-overview', WeatherOverview);
  }
}

/**
 * Initialize weather module
 */
export function initWeather() {
  registerWeatherElements();
  console.log('[Weather] Module initialized');
}

export { WMO_CODES, TRIP_CITIES, getWMOInfo };
