/**
 * Tiger 900 - Timeline Module
 *
 * Interactive itinerary functionality:
 * - Timeline visual component with day markers
 * - Expandable day cards (accordion pattern)
 * - Progress tracking
 * - Weather and media integration
 *
 * @module features/timeline
 */

import { formatDate } from '../core/utils.js';
import { getWeatherForDate, getWMOInfo } from './weather.js';

/**
 * Trip data configuration
 */
const TRIP_DATA = {
  start: new Date('2026-01-19T00:00:00'),
  end: new Date('2026-02-02T23:59:59'),
  totalDays: 15,
  days: [
    { day: 1, date: '2026-01-19', route: 'Goiânia → Uberaba', km: 380, type: 'Deslocamento', typeIcon: '🛣️', phase: 1, highlights: [] },
    { day: 2, date: '2026-01-20', route: 'Uberaba → Ourinhos', km: 360, type: 'Deslocamento', typeIcon: '🛣️', phase: 1, highlights: [] },
    { day: 3, date: '2026-01-21', route: 'Ourinhos → Ponta Grossa', km: 350, type: 'Deslocamento', typeIcon: '🛣️', phase: 1, highlights: [] },
    { day: 4, date: '2026-01-22', route: 'Ponta Grossa → Urubici', km: 380, type: 'Deslocamento', typeIcon: '🛣️', phase: 1, highlights: ['Serra do Rio do Rastro'] },
    { day: 5, date: '2026-01-23', route: 'Urubici (Morro da Igreja)', km: 60, type: 'Exploração', typeIcon: '🏔️', phase: 2, highlights: ['Pedra Furada', 'Morro da Igreja'] },
    { day: 6, date: '2026-01-24', route: 'Serra do Rio do Rastro', km: 80, type: 'CLÍMAX', typeIcon: '⭐', phase: 2, special: 'climax', highlights: ['Serra do Rio do Rastro', 'Mirantes'] },
    { day: 7, date: '2026-01-25', route: 'Bom Jardim → Cambará', km: 180, type: 'Transição', typeIcon: '🔄', phase: 3, highlights: [] },
    { day: 8, date: '2026-01-26', route: 'Cânions (Fortaleza/Itaimbezinho)', km: 60, type: 'Exploração', typeIcon: '🏔️', phase: 3, highlights: ['Cânion Fortaleza', 'Cânion Itaimbezinho'] },
    { day: 9, date: '2026-01-27', route: 'Cambará → Bento Gonçalves', km: 180, type: 'Serra Gaúcha', typeIcon: '🍇', phase: 3, highlights: [] },
    { day: 10, date: '2026-01-28', route: 'Vale dos Vinhedos', km: 40, type: 'Vinícolas', typeIcon: '🍷', phase: 3, highlights: ['Vinícolas', 'Degustação'] },
    { day: 11, date: '2026-01-29', route: 'Bento → Curitiba', km: 430, type: 'Retorno', typeIcon: '🔙', phase: 4, highlights: [] },
    { day: 12, date: '2026-01-30', route: 'Curitiba (descanso)', km: 0, type: 'Folga', typeIcon: '😴', phase: 4, special: 'folga', highlights: ['Descanso'] },
    { day: 13, date: '2026-01-31', route: 'Curitiba → Ourinhos', km: 400, type: 'Retorno', typeIcon: '🔙', phase: 4, highlights: [] },
    { day: 14, date: '2026-02-01', route: 'Ourinhos → Uberaba', km: 360, type: 'Retorno', typeIcon: '🔙', phase: 4, highlights: [] },
    { day: 15, date: '2026-02-02', route: 'Uberaba → Goiânia', km: 380, type: 'Retorno', typeIcon: '🏠', phase: 4, special: 'home', highlights: [] }
  ],
  phases: [
    { id: 1, name: 'Deslocamento Sul', icon: '🛣️', startDay: 1, endDay: 4, color: '#607d8b' },
    { id: 2, name: 'Serras Catarinenses', icon: '🏔️', startDay: 5, endDay: 6, color: '#4caf50' },
    { id: 3, name: 'Cânions e Serra Gaúcha', icon: '🍇', startDay: 7, endDay: 10, color: '#9c27b0' },
    { id: 4, name: 'Retorno', icon: '🏠', startDay: 11, endDay: 15, color: '#ff9800' }
  ]
};

/**
 * Get trip progress info
 */
function getTripProgress() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today < TRIP_DATA.start) {
    const daysUntil = Math.ceil((TRIP_DATA.start - today) / (1000 * 60 * 60 * 24));
    return {
      status: 'planning',
      daysUntil,
      currentDay: null,
      completedDays: 0,
      progress: 0
    };
  }

  if (today > TRIP_DATA.end) {
    return {
      status: 'completed',
      daysUntil: 0,
      currentDay: null,
      completedDays: TRIP_DATA.totalDays,
      progress: 100
    };
  }

  // Find current day
  const currentDayData = TRIP_DATA.days.find(d => {
    const dayDate = new Date(d.date + 'T00:00:00');
    return dayDate.getTime() === today.getTime();
  });

  const completedDays = TRIP_DATA.days.filter(d => {
    const dayDate = new Date(d.date + 'T00:00:00');
    return dayDate < today;
  }).length;

  return {
    status: 'active',
    daysUntil: 0,
    currentDay: currentDayData?.day || null,
    completedDays,
    progress: Math.round((completedDays / TRIP_DATA.totalDays) * 100)
  };
}

/**
 * Get day status (past, today, future)
 */
function getDayStatus(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayDate = new Date(dateStr + 'T00:00:00');

  if (dayDate.getTime() === today.getTime()) return 'today';
  if (dayDate < today) return 'past';
  return 'future';
}

/**
 * Timeline Visual Custom Element
 * Renders a vertical timeline with day markers and progress
 * Usage: <trip-timeline></trip-timeline>
 */
class TripTimeline extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const progress = getTripProgress();

    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .timeline-container {
          position: relative;
          padding: 20px 0;
        }

        .timeline-progress {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background: linear-gradient(135deg, var(--md-primary-fg-color, #009688), var(--md-accent-fg-color, #00796b));
          border-radius: 12px;
          color: white;
        }

        .progress-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .progress-status {
          font-size: 18px;
          font-weight: 600;
        }

        .progress-subtitle {
          font-size: 13px;
          opacity: 0.9;
        }

        .progress-bar-container {
          flex: 1;
          max-width: 200px;
          margin-left: 20px;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255,255,255,0.3);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: white;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .progress-percent {
          text-align: right;
          font-size: 12px;
          margin-top: 4px;
          opacity: 0.9;
        }

        .phases-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .phase-section {
          position: relative;
        }

        .phase-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--phase-color, #607d8b);
          border-radius: 8px;
          color: white;
          margin-bottom: 12px;
        }

        .phase-icon {
          font-size: 24px;
        }

        .phase-info {
          flex: 1;
        }

        .phase-name {
          font-weight: 600;
          font-size: 16px;
        }

        .phase-meta {
          font-size: 12px;
          opacity: 0.9;
        }

        .days-timeline {
          position: relative;
          padding-left: 24px;
          margin-left: 12px;
        }

        .days-timeline::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e0e0e0;
        }

        .day-marker {
          position: relative;
          padding: 8px 0 8px 24px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .day-marker:hover {
          transform: translateX(4px);
        }

        .day-marker::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #e0e0e0;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #e0e0e0;
          transition: all 0.2s;
        }

        .day-marker.past::before {
          background: var(--md-primary-fg-color, #009688);
          box-shadow: 0 0 0 2px var(--md-primary-fg-color, #009688);
        }

        .day-marker.today::before {
          background: #ff5722;
          box-shadow: 0 0 0 2px #ff5722, 0 0 0 6px rgba(255,87,34,0.3);
          animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px #ff5722, 0 0 0 6px rgba(255,87,34,0.3); }
          50% { box-shadow: 0 0 0 2px #ff5722, 0 0 0 10px rgba(255,87,34,0.1); }
        }

        .day-marker.special-climax::before {
          background: gold;
          box-shadow: 0 0 0 2px gold;
        }

        .day-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 8px;
          transition: background 0.2s, box-shadow 0.2s;
        }

        .day-marker:hover .day-content {
          background: #e8e8e8;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .day-marker.today .day-content {
          background: #fff3e0;
          border-left: 3px solid #ff5722;
        }

        .day-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          color: #333;
        }

        .day-info {
          flex: 1;
          min-width: 0;
        }

        .day-date {
          font-size: 12px;
          color: #666;
        }

        .day-route {
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .day-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #666;
        }

        .day-type {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .day-weather {
          min-width: 60px;
          text-align: center;
        }

        .weather-loading {
          font-size: 20px;
          opacity: 0.5;
        }

        @media (max-width: 600px) {
          .timeline-progress {
            flex-direction: column;
            text-align: center;
          }

          .progress-bar-container {
            max-width: 100%;
            margin: 12px 0 0;
            width: 100%;
          }

          .day-meta {
            flex-wrap: wrap;
          }
        }

        @media (prefers-color-scheme: dark) {
          .day-content { background: #2d2d2d; }
          .day-marker:hover .day-content { background: #3d3d3d; }
          .day-marker.today .day-content { background: #3d3020; }
          .day-number { background: #1d1d1d; color: #fff; }
          .day-route { color: #fff; }
          .day-date, .day-meta { color: #aaa; }
          .days-timeline::before { background: #444; }
          .day-marker::before { border-color: #2d2d2d; }
        }
      </style>
    `;

    let progressHTML = '';
    if (progress.status === 'planning') {
      progressHTML = `
        <div class="progress-info">
          <div class="progress-status">📅 Viagem em ${progress.daysUntil} dias</div>
          <div class="progress-subtitle">Planejamento ativo</div>
        </div>
      `;
    } else if (progress.status === 'completed') {
      progressHTML = `
        <div class="progress-info">
          <div class="progress-status">✅ Viagem Concluída!</div>
          <div class="progress-subtitle">15 dias, 3.200 km percorridos</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar"><div class="progress-bar-fill" style="width: 100%"></div></div>
          <div class="progress-percent">100%</div>
        </div>
      `;
    } else {
      progressHTML = `
        <div class="progress-info">
          <div class="progress-status">🏍️ Dia ${progress.currentDay} de ${TRIP_DATA.totalDays}</div>
          <div class="progress-subtitle">${progress.completedDays} dias concluídos</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar"><div class="progress-bar-fill" style="width: ${progress.progress}%"></div></div>
          <div class="progress-percent">${progress.progress}%</div>
        </div>
      `;
    }

    const phasesHTML = TRIP_DATA.phases.map(phase => {
      const phaseDays = TRIP_DATA.days.filter(d => d.phase === phase.id);

      const daysHTML = phaseDays.map(day => {
        const status = getDayStatus(day.date);
        const dateObj = new Date(day.date + 'T00:00:00');
        const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit'
        });

        return `
          <div class="day-marker ${status} ${day.special ? 'special-' + day.special : ''}"
               data-day="${day.day}" data-date="${day.date}">
            <div class="day-content">
              <div class="day-number">${day.day}</div>
              <div class="day-info">
                <div class="day-date">${dateFormatted}</div>
                <div class="day-route">${day.route}</div>
                <div class="day-meta">
                  <span class="day-type">${day.typeIcon} ${day.type}</span>
                  ${day.km > 0 ? `<span>📏 ${day.km} km</span>` : ''}
                </div>
              </div>
              <div class="day-weather" data-date="${day.date}">
                <span class="weather-loading">⏳</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const phaseStartDate = new Date(phaseDays[0].date + 'T00:00:00');
      const phaseEndDate = new Date(phaseDays[phaseDays.length - 1].date + 'T00:00:00');
      const phaseDates = `${phaseStartDate.getDate()}/${phaseStartDate.getMonth() + 1} - ${phaseEndDate.getDate()}/${phaseEndDate.getMonth() + 1}`;
      const phaseTotalKm = phaseDays.reduce((sum, d) => sum + d.km, 0);

      return `
        <div class="phase-section" style="--phase-color: ${phase.color}">
          <div class="phase-header">
            <span class="phase-icon">${phase.icon}</span>
            <div class="phase-info">
              <div class="phase-name">${phase.name}</div>
              <div class="phase-meta">${phaseDates} • ${phaseTotalKm} km</div>
            </div>
          </div>
          <div class="days-timeline">
            ${daysHTML}
          </div>
        </div>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="timeline-container">
        <div class="timeline-progress">
          ${progressHTML}
        </div>
        <div class="phases-container">
          ${phasesHTML}
        </div>
      </div>
    `;

    // Load weather for each day
    this.loadWeatherForDays();

    // Add click handlers
    this.shadowRoot.querySelectorAll('.day-marker').forEach(marker => {
      marker.addEventListener('click', () => {
        const day = marker.dataset.day;
        this.dispatchEvent(new CustomEvent('day-selected', {
          detail: { day: parseInt(day) },
          bubbles: true
        }));
      });
    });
  }

  async loadWeatherForDays() {
    const weatherCells = this.shadowRoot.querySelectorAll('.day-weather');

    for (const cell of weatherCells) {
      const date = cell.dataset.date;
      try {
        const weather = await getWeatherForDate(date);
        if (weather) {
          const info = getWMOInfo(weather.code);
          cell.innerHTML = `
            <span title="${info.desc}\n${Math.round(weather.tempMin)}° - ${Math.round(weather.tempMax)}°C">${info.icon}</span>
          `;
        } else {
          cell.innerHTML = '<span>—</span>';
        }
      } catch (error) {
        cell.innerHTML = '<span>—</span>';
      }
    }
  }
}

/**
 * Expandable Day Card Custom Element
 * Usage: <day-card day="1" expanded></day-card>
 */
class DayCard extends HTMLElement {
  static get observedAttributes() {
    return ['day', 'expanded'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._dayData = null;
    this._weather = null;
  }

  connectedCallback() {
    this.loadDayData();
    this.render();
    this.loadWeather();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'day' && oldValue !== newValue) {
      this.loadDayData();
      this.render();
      this.loadWeather();
    } else if (name === 'expanded') {
      this.render();
    }
  }

  get day() {
    return parseInt(this.getAttribute('day')) || 1;
  }

  get expanded() {
    return this.hasAttribute('expanded');
  }

  set expanded(val) {
    if (val) {
      this.setAttribute('expanded', '');
    } else {
      this.removeAttribute('expanded');
    }
  }

  loadDayData() {
    this._dayData = TRIP_DATA.days.find(d => d.day === this.day);
  }

  async loadWeather() {
    if (!this._dayData) return;
    try {
      this._weather = await getWeatherForDate(this._dayData.date);
      this.render();
    } catch (error) {
      console.error('[DayCard] Weather error:', error);
    }
  }

  toggle() {
    this.expanded = !this.expanded;
    this.dispatchEvent(new CustomEvent('toggle', {
      detail: { day: this.day, expanded: this.expanded },
      bubbles: true
    }));
  }

  render() {
    const day = this._dayData;
    if (!day) return;

    const status = getDayStatus(day.date);
    const dateObj = new Date(day.date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });

    const weatherInfo = this._weather ? getWMOInfo(this._weather.code) : null;

    const styles = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .day-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: box-shadow 0.3s;
        }

        .day-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .day-card.today {
          border-left: 4px solid #ff5722;
        }

        .day-card.special-climax {
          border-left: 4px solid gold;
        }

        .card-header {
          display: flex;
          align-items: center;
          padding: 16px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }

        .card-header:hover {
          background: #f5f5f5;
        }

        .day-badge {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--md-primary-fg-color, #009688);
          color: white;
          border-radius: 10px;
          font-weight: 600;
          font-size: 18px;
          margin-right: 16px;
        }

        .day-card.past .day-badge {
          background: #9e9e9e;
        }

        .day-card.today .day-badge {
          background: #ff5722;
        }

        .header-info {
          flex: 1;
          min-width: 0;
        }

        .header-date {
          font-size: 12px;
          color: #666;
          text-transform: capitalize;
        }

        .header-route {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 2px 0;
        }

        .header-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #666;
        }

        .header-weather {
          font-size: 28px;
          margin-left: 8px;
        }

        .expand-icon {
          font-size: 20px;
          color: #999;
          margin-left: 8px;
          transition: transform 0.3s;
        }

        :host([expanded]) .expand-icon {
          transform: rotate(180deg);
        }

        .card-content {
          display: none;
          padding: 0 16px 16px;
          border-top: 1px solid #eee;
        }

        :host([expanded]) .card-content {
          display: block;
        }

        .content-section {
          padding: 12px 0;
        }

        .content-section + .content-section {
          border-top: 1px solid #f0f0f0;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .weather-details {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .weather-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .weather-icon-large {
          font-size: 40px;
        }

        .weather-temps {
          line-height: 1.3;
        }

        .temp-max {
          font-size: 24px;
          font-weight: 600;
        }

        .temp-min {
          font-size: 14px;
          color: #666;
        }

        .weather-desc {
          font-size: 14px;
          color: #555;
        }

        .weather-stats {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #666;
        }

        .highlights-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .highlight-tag {
          padding: 4px 12px;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 16px;
          font-size: 13px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.2s;
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .action-btn.primary {
          background: var(--md-primary-fg-color, #009688);
          color: white;
        }

        .action-btn.secondary {
          background: #f0f0f0;
          color: #333;
        }

        @media (prefers-color-scheme: dark) {
          .day-card { background: #2d2d2d; }
          .card-header:hover { background: #3d3d3d; }
          .header-route { color: #fff; }
          .header-date, .header-meta { color: #aaa; }
          .card-content { border-top-color: #444; }
          .content-section + .content-section { border-top-color: #444; }
          .action-btn.secondary { background: #3d3d3d; color: #fff; }
        }
      </style>
    `;

    const weatherHTML = this._weather ? `
      <div class="weather-details">
        <div class="weather-item">
          <span class="weather-icon-large">${weatherInfo.icon}</span>
          <div class="weather-temps">
            <div class="temp-max">${Math.round(this._weather.tempMax)}°C</div>
            <div class="temp-min">${Math.round(this._weather.tempMin)}° mín</div>
          </div>
        </div>
        <div>
          <div class="weather-desc">${weatherInfo.desc}</div>
          <div class="weather-stats">
            <span>💧 ${this._weather.precipitation}%</span>
            ${this._weather.windMax > 0 ? `<span>💨 ${Math.round(this._weather.windMax)} km/h</span>` : ''}
          </div>
        </div>
      </div>
    ` : '<p style="color: #999;">Previsão não disponível</p>';

    const highlightsHTML = day.highlights.length > 0 ? `
      <div class="content-section">
        <div class="section-title">Destaques</div>
        <div class="highlights-list">
          ${day.highlights.map(h => `<span class="highlight-tag">📍 ${h}</span>`).join('')}
        </div>
      </div>
    ` : '';

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="day-card ${status} ${day.special ? 'special-' + day.special : ''}">
        <div class="card-header" role="button" tabindex="0">
          <div class="day-badge">${day.day}</div>
          <div class="header-info">
            <div class="header-date">${dateFormatted}</div>
            <div class="header-route">${day.route}</div>
            <div class="header-meta">
              <span>${day.typeIcon} ${day.type}</span>
              ${day.km > 0 ? `<span>📏 ${day.km} km</span>` : ''}
            </div>
          </div>
          ${weatherInfo ? `<span class="header-weather">${weatherInfo.icon}</span>` : ''}
          <span class="expand-icon">▼</span>
        </div>
        <div class="card-content">
          <div class="content-section">
            <div class="section-title">Previsão do Tempo</div>
            ${weatherHTML}
          </div>
          ${highlightsHTML}
          <div class="content-section">
            <div class="action-buttons">
              <a href="#dia-${day.day}" class="action-btn primary">📖 Ver Detalhes</a>
              <button class="action-btn secondary map-btn">🗺️ Ver no Mapa</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add click handler
    this.shadowRoot.querySelector('.card-header').addEventListener('click', () => this.toggle());
  }
}

/**
 * Day Cards Accordion Custom Element
 * Container that manages single expansion
 * Usage: <day-cards-accordion></day-cards-accordion>
 */
class DayCardsAccordion extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._expandedDay = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const progress = getTripProgress();

    // Auto-expand current day if active
    if (progress.status === 'active' && progress.currentDay) {
      this._expandedDay = progress.currentDay;
    }

    const styles = `
      <style>
        :host {
          display: block;
        }

        .accordion-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      </style>
    `;

    const cardsHTML = TRIP_DATA.days.map(day => `
      <day-card day="${day.day}" ${this._expandedDay === day.day ? 'expanded' : ''}></day-card>
    `).join('');

    this.shadowRoot.innerHTML = `
      ${styles}
      <div class="accordion-container">
        ${cardsHTML}
      </div>
    `;

    // Add toggle handlers for accordion behavior
    this.shadowRoot.querySelectorAll('day-card').forEach(card => {
      card.addEventListener('toggle', (e) => {
        const { day, expanded } = e.detail;

        if (expanded) {
          // Collapse other cards
          this.shadowRoot.querySelectorAll('day-card[expanded]').forEach(otherCard => {
            if (parseInt(otherCard.getAttribute('day')) !== day) {
              otherCard.removeAttribute('expanded');
            }
          });
          this._expandedDay = day;
        } else {
          this._expandedDay = null;
        }
      });
    });
  }
}

/**
 * Register custom elements
 */
export function registerTimelineElements() {
  if (!customElements.get('trip-timeline')) {
    customElements.define('trip-timeline', TripTimeline);
  }
  if (!customElements.get('day-card')) {
    customElements.define('day-card', DayCard);
  }
  if (!customElements.get('day-cards-accordion')) {
    customElements.define('day-cards-accordion', DayCardsAccordion);
  }
}

/**
 * Initialize timeline module
 */
export function initTimeline() {
  registerTimelineElements();
  console.log('[Timeline] Module initialized');
}

export { TRIP_DATA, getTripProgress, getDayStatus };
