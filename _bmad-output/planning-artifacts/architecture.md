---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/project-docs/architecture.md
  - _bmad-output/project-docs/source-tree-analysis.md
workflowType: 'architecture'
project_name: 'tiger-900'
user_name: 'Barbosa'
date: '2026-01-16'
status: complete
---

# Architecture Decision Document - Tiger 900 Rally Pro

**Autor:** Barbosa
**Data:** 2026-01-16
**Versão:** 1.0
**Status:** Completo

---

## Executive Summary

Este documento define as decisões arquiteturais para evolução do site Tiger 900 Rally Pro, transformando-o de um site de documentação básico em uma plataforma rica e interativa para registro de viagens de moto.

**Princípios Guia:**
- Mobile-first, offline-first
- Zero dependencies externas (exceto Leaflet para mapas)
- Progressive enhancement
- Modular e extensível

---

## System Context

### Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIGER 900 RALLY PRO                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │ Roteiro  │  │  Galeria │  │   Mapa   │  │  Clima   │        │   │
│  │  │ Timeline │  │  Fotos   │  │Interativo│  │ Widgets  │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      DATA LAYER (JS)                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │  Store   │  │  Sync    │  │  Cache   │  │   API    │        │   │
│  │  │ Manager  │  │ Manager  │  │ Manager  │  │ Client   │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    STORAGE LAYER                                 │   │
│  │  ┌──────────────────┐    ┌──────────────────┐                   │   │
│  │  │    IndexedDB     │    │   Cache API      │                   │   │
│  │  │  (Structured)    │    │   (Assets)       │                   │   │
│  │  └──────────────────┘    └──────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
           ┌───────────────────────┴───────────────────────┐
           ▼                                               ▼
┌─────────────────────┐                     ┌─────────────────────┐
│   OpenWeatherMap    │                     │   OpenStreetMap     │
│   (Weather API)     │                     │   (Tiles via CDN)   │
└─────────────────────┘                     └─────────────────────┘
```

### Boundaries

| Boundary | Interno | Externo |
|----------|---------|---------|
| **Build** | MkDocs, Python plugins | GitHub Actions |
| **Runtime** | Custom JS modules | Weather API, Map Tiles |
| **Storage** | IndexedDB, Cache API | GitHub Pages CDN |
| **Data** | Fotos locais, GPX files | API responses |

---

## Architecture Decisions

### ADR-001: Modular JavaScript Architecture

**Status:** Aceito

**Contexto:**
O PRD define 5 funcionalidades principais que precisam de JavaScript: Galeria, Mapa, Clima, Roteiro e PWA. Precisamos de uma arquitetura que permita desenvolvimento independente e manutenção simples.

**Decisão:**
Adotar arquitetura modular com ES6 modules, cada feature em seu próprio arquivo com interface bem definida.

**Estrutura:**
```
docs/assets/js/
├── core/
│   ├── store.js          # State management (IndexedDB)
│   ├── sync.js           # Sync manager (offline queue)
│   └── utils.js          # Shared utilities
├── features/
│   ├── gallery.js        # Photo gallery
│   ├── map.js            # Interactive map (Leaflet)
│   ├── weather.js        # Weather widgets
│   └── itinerary.js      # Timeline + interactivity
├── pwa/
│   ├── register.js       # SW registration
│   └── cache-config.js   # Cache strategies
└── main.js               # Entry point, orchestration
```

**Consequências:**
- ✅ Separação clara de concerns
- ✅ Testável individualmente
- ✅ Tree-shaking possível
- ⚠️ Mais arquivos para gerenciar

---

### ADR-002: IndexedDB para Storage Estruturado

**Status:** Aceito

**Contexto:**
Precisamos armazenar dados estruturados (fotos com metadata, rotas GPS, previsão do tempo) de forma persistente para funcionamento offline.

**Decisão:**
Usar IndexedDB como storage principal para dados estruturados. LocalStorage apenas para configs simples.

**Schema:**
```javascript
// Database: tiger900
// Version: 1

stores: {
  photos: {
    keyPath: 'id',
    indexes: ['dayId', 'timestamp', 'synced'],
    // { id, dayId, blob, gps, caption, timestamp, synced }
  },
  routes: {
    keyPath: 'id',
    indexes: ['dayId'],
    // { id, dayId, gpxData, name, distance, elevation }
  },
  weather: {
    keyPath: 'locationDate',
    indexes: ['fetchedAt'],
    // { locationDate, data, fetchedAt }
  },
  syncQueue: {
    keyPath: 'id',
    autoIncrement: true,
    // { id, action, data, createdAt }
  }
}
```

**Consequências:**
- ✅ Queries por índice
- ✅ Transações ACID
- ✅ Capacidade de storage grande
- ⚠️ API assíncrona (async/await)

---

### ADR-003: Leaflet.js para Mapas

**Status:** Aceito

**Contexto:**
Precisamos de mapas interativos com suporte a GPX, marcadores e visualização de rotas.

**Alternativas:**
- Google Maps: Paid, vendor lock-in
- Mapbox: Paid tier rápido
- OpenLayers: Muito complexo
- Leaflet: Open source, leve, extensível

**Decisão:**
Usar Leaflet.js com tiles do OpenStreetMap.

**Plugins necessários:**
- `leaflet-gpx`: Parse e display de arquivos GPX
- Built-in: Markers, polylines, popups

**Carregamento:**
```html
<!-- Lazy load apenas quando mapa visível -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9/dist/leaflet.css"
      media="print" onload="this.media='all'">
<script defer src="https://unpkg.com/leaflet@1.9/dist/leaflet.js"></script>
```

**Consequências:**
- ✅ Open source, sem custos
- ✅ ~40KB gzipped
- ✅ Excelente documentação
- ⚠️ Tiles dependem de conexão (mas cacheable)

---

### ADR-004: Cache Strategy (Service Worker)

**Status:** Aceito

**Contexto:**
O site precisa funcionar 100% offline durante a viagem. Precisamos definir estratégias de cache por tipo de recurso.

**Decisão:**
Implementar Workbox com estratégias diferenciadas.

**Estratégias:**
```javascript
// Cache strategies por tipo de recurso

cacheStrategies: {
  // HTML pages: Network-first (sempre tentar atualizar)
  'pages': 'NetworkFirst',

  // Assets estáticos: Cache-first (raramente mudam)
  'static': 'CacheFirst',

  // Imagens: Cache-first com fallback
  'images': 'CacheFirst',

  // API Weather: Stale-while-revalidate
  'weather-api': 'StaleWhileRevalidate',

  // Map tiles: Cache-first (imutáveis)
  'map-tiles': 'CacheFirst',

  // Fotos do usuário: Cache-only (local)
  'user-photos': 'CacheOnly'
}
```

**Precaching:**
```javascript
// Recursos críticos pré-cacheados no install
precacheResources: [
  '/',
  '/viagens/serras-gauchas-2026/',
  '/viagens/serras-gauchas-2026/roteiro/',
  '/assets/js/main.js',
  '/assets/css/*.css',
  '/manifest.json'
]
```

**Consequências:**
- ✅ 100% offline para conteúdo cacheado
- ✅ Atualização em background
- ⚠️ Storage limit (~50MB-100MB)

---

### ADR-005: Photo Handling Architecture

**Status:** Aceito

**Contexto:**
Fotos são o asset mais pesado. Precisamos: captura com GPS, compressão, armazenamento local, exibição otimizada.

**Decisão:**
Pipeline de processamento client-side com múltiplas versões.

**Pipeline:**
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Camera  │───▶│   EXIF   │───▶│ Compress │───▶│  Store   │
│  Input   │    │ Extract  │    │ Resize   │    │ IndexedDB│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │
                     ▼
              ┌──────────┐
              │   GPS    │
              │ Metadata │
              └──────────┘
```

**Versões geradas:**
| Versão | Dimensão | Uso |
|--------|----------|-----|
| thumb | 200x200 | Grid gallery |
| medium | 800x600 | Lightbox |
| original | Preservado | Download (opcional) |

**Compressão:**
- Formato: WebP (fallback JPEG)
- Qualidade: 80%
- Max dimension: 2000px (original)

**Consequências:**
- ✅ Rápido display de thumbnails
- ✅ Storage eficiente
- ✅ GPS preservado no metadata
- ⚠️ Processamento no upload

---

### ADR-006: Weather Data Architecture

**Status:** Aceito

**Contexto:**
Previsão do tempo para múltiplas cidades e datas. API tem limite de requests. Precisa funcionar offline.

**Decisão:**
Cache agressivo com refresh strategy.

**Data Flow:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│  Check      │────▶│   Fresh?    │
│   Weather   │     │  IndexedDB  │     │   < 3h?     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┤
                    │ Yes                     │ No
                    ▼                         ▼
            ┌─────────────┐          ┌─────────────┐
            │   Return    │          │   Fetch     │
            │   Cached    │          │   API       │
            └─────────────┘          └─────────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │   Update    │
                                    │   Cache     │
                                    └─────────────┘
```

**Cache TTL:**
| Tipo | TTL |
|------|-----|
| Previsão atual | 3 horas |
| Previsão futura | 6 horas |
| Histórico | Permanente |

**Fallback offline:** Mostrar última previsão conhecida com timestamp.

**Consequências:**
- ✅ Menos requests à API
- ✅ Funciona offline
- ⚠️ Dados podem estar stale

---

### ADR-007: Itinerary Timeline Architecture

**Status:** Aceito

**Contexto:**
O roteiro precisa ser interativo, visual e integrado com fotos, mapa e clima.

**Decisão:**
Component-based timeline com lazy loading de conteúdo.

**Component Structure:**
```html
<div class="timeline" data-trip="serras-gauchas-2026">
  <article class="timeline-day" data-day="1" data-date="2026-01-17">
    <header class="day-header">
      <h2>Dia 1 - Porto Alegre → Cambará do Sul</h2>
      <weather-widget location="cambara-do-sul" date="2026-01-17"></weather-widget>
    </header>

    <section class="day-map">
      <route-map gpx="/routes/day1.gpx" lazy></route-map>
    </section>

    <section class="day-gallery">
      <photo-gallery day="1" lazy></photo-gallery>
    </section>

    <section class="day-content">
      <!-- Markdown content rendered -->
    </section>
  </article>
</div>
```

**Custom Elements (Web Components):**
- `<weather-widget>` - Previsão inline
- `<route-map>` - Mapa com rota do dia
- `<photo-gallery>` - Grid de fotos do dia

**Consequências:**
- ✅ Componentização clara
- ✅ Lazy loading nativo
- ✅ Progressive enhancement
- ⚠️ Polyfill para Safari antigo

---

## Data Architecture

### Data Model

```javascript
// Core entities

interface Trip {
  id: string;           // "serras-gauchas-2026"
  name: string;
  startDate: Date;
  endDate: Date;
  days: Day[];
}

interface Day {
  id: string;           // "day-1"
  tripId: string;
  date: Date;
  title: string;
  origin: Location;
  destination: Location;
  routeGpx: string;     // Path to GPX file
  photos: Photo[];
  weather: WeatherData;
}

interface Photo {
  id: string;           // UUID
  dayId: string;
  timestamp: Date;
  gps: { lat: number, lng: number };
  caption: string;
  versions: {
    thumb: Blob;
    medium: Blob;
    original?: Blob;
  };
  synced: boolean;
}

interface Location {
  name: string;
  coords: { lat: number, lng: number };
}

interface WeatherData {
  locationDate: string; // "cambara-do-sul_2026-01-17"
  temp: { min: number, max: number };
  condition: string;
  icon: string;
  precipitation: number;
  fetchedAt: Date;
}
```

### Data Flow

```
┌───────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                              │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Markdown    │    GPX       │   Photos     │   Weather API   │
│  (Content)   │  (Routes)    │  (Camera)    │   (External)    │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬────────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌───────────────────────────────────────────────────────────────┐
│                    PROCESSING LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ MkDocs   │  │  GPX     │  │  Image   │  │  JSON    │      │
│  │ Build    │  │  Parser  │  │ Process  │  │  Parse   │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└───────────────────────────────────────────────────────────────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌───────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                               │
│  ┌────────────────┐    ┌────────────────────────────────────┐│
│  │  Static Files  │    │           IndexedDB                ││
│  │  (site/)       │    │  photos | routes | weather | sync  ││
│  └────────────────┘    └────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
       │                                     │
       ▼                                     ▼
┌───────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              UI Components (Custom Elements)             ││
│  └──────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

---

## File Structure (Proposed)

```
tiger-900/
├── docs/
│   ├── assets/
│   │   ├── js/
│   │   │   ├── core/
│   │   │   │   ├── store.js           # IndexedDB wrapper
│   │   │   │   ├── sync.js            # Offline sync queue
│   │   │   │   └── utils.js           # Shared utilities
│   │   │   ├── features/
│   │   │   │   ├── gallery.js         # Photo gallery component
│   │   │   │   ├── map.js             # Leaflet map wrapper
│   │   │   │   ├── weather.js         # Weather widget
│   │   │   │   └── itinerary.js       # Timeline component
│   │   │   ├── pwa/
│   │   │   │   └── register.js        # SW registration
│   │   │   └── main.js                # Entry point
│   │   │
│   │   ├── css/
│   │   │   ├── components/
│   │   │   │   ├── gallery.css
│   │   │   │   ├── map.css
│   │   │   │   ├── weather.css
│   │   │   │   └── timeline.css
│   │   │   └── main.css               # Entry point
│   │   │
│   │   └── routes/                    # GPX files
│   │       ├── day1-poa-cambara.gpx
│   │       ├── day2-canions.gpx
│   │       └── ...
│   │
│   ├── viagens/
│   │   └── serras-gauchas-2026/
│   │       ├── index.md
│   │       ├── roteiro.md             # Timeline page
│   │       ├── galeria.md             # Full gallery page
│   │       ├── mapa.md                # Full map page
│   │       └── ...
│   │
│   ├── manifest.json
│   └── service-worker.js              # Enhanced SW
│
└── _bmad-output/
    └── planning-artifacts/
        ├── prd.md
        └── architecture.md            # Este documento
```

---

## Integration Points

### MkDocs Integration

**Custom JS loading** (mkdocs.yml):
```yaml
extra_javascript:
  - assets/js/main.js
  - https://unpkg.com/leaflet@1.9/dist/leaflet.js

extra_css:
  - assets/css/main.css
  - https://unpkg.com/leaflet@1.9/dist/leaflet.css
```

**Custom templates** (overrides/):
- `overrides/partials/header.html` - PWA install prompt
- `overrides/main.html` - Custom elements registration

### API Integration

**OpenWeatherMap:**
```javascript
// Environment: API key via build-time injection
const WEATHER_API_KEY = '{{WEATHER_API_KEY}}';  // Injected by MkDocs macro

// Endpoint
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/forecast';
```

**Rate limiting:**
- Max 60 calls/minute (free tier)
- Implementar debounce e cache
- Pre-fetch para todos os dias da viagem

---

## Performance Budget

| Métrica | Budget | Atual* | Target |
|---------|--------|--------|--------|
| **JS Bundle** | < 100KB | 38KB | 80KB |
| **CSS Bundle** | < 50KB | 26KB | 40KB |
| **Leaflet** | 40KB | - | 40KB |
| **FCP** | < 1.5s | 1.2s | 1.5s |
| **TTI** | < 3s | 2.1s | 3s |
| **Lighthouse** | > 90 | 95 | 90 |

*Valores atuais antes das novas features

**Otimizações planejadas:**
- Code splitting por feature
- Lazy load de componentes
- Preload de recursos críticos
- Image lazy loading nativo

---

## Security Considerations

| Aspecto | Medida |
|---------|--------|
| **API Keys** | Injetadas em build, não commitadas |
| **CORS** | Apenas APIs whitelisted |
| **CSP** | Content Security Policy via headers |
| **Storage** | Dados locais apenas, sem PII sensível |
| **HTTPS** | Enforced via hosting (GitHub/Cloudflare) |

---

## Testing Strategy

| Tipo | Ferramenta | Cobertura |
|------|------------|-----------|
| **Unit** | Vitest | Core modules |
| **Component** | Vitest + jsdom | Custom elements |
| **E2E** | Playwright | Critical paths |
| **Performance** | Lighthouse CI | Build pipeline |
| **Offline** | Manual + Playwright | PWA functionality |

---

## Implementation Phases

### Phase 1: Core Infrastructure (Sprint 1)
- [ ] Setup modular JS structure
- [ ] Implement IndexedDB store
- [ ] Setup Workbox for enhanced SW
- [ ] Create base custom elements

### Phase 2: Features (Sprint 2-3)
- [ ] Photo gallery component
- [ ] Map component with Leaflet
- [ ] Weather widget
- [ ] Timeline redesign

### Phase 3: Integration (Sprint 4)
- [ ] Connect all components
- [ ] Offline sync queue
- [ ] Performance optimization
- [ ] Testing

### Phase 4: Polish (Sprint 5)
- [ ] Animations and transitions
- [ ] Error handling
- [ ] Documentation
- [ ] Final testing

---

## Validation Checklist

- [x] **Decisões documentadas** - 7 ADRs definidos
- [x] **Data model definido** - Entities e schemas
- [x] **File structure proposta** - Modular architecture
- [x] **Integration points** - MkDocs, APIs, PWA
- [x] **Performance budget** - Métricas definidas
- [x] **Security considerations** - Medidas documentadas
- [x] **Testing strategy** - Ferramentas e cobertura
- [x] **Implementation phases** - Sprints definidos

---

## Appendix

### Glossário

| Termo | Definição |
|-------|-----------|
| **ADR** | Architecture Decision Record |
| **IndexedDB** | API de banco de dados no browser |
| **PWA** | Progressive Web App |
| **Service Worker** | Script em background para cache |
| **GPX** | GPS Exchange Format |
| **Workbox** | Library do Google para Service Workers |

### Referências

- [PRD do Projeto](./prd.md)
- [Documentação Técnica Existente](../project-docs/architecture.md)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Workbox](https://developer.chrome.com/docs/workbox/)

---

*Arquitetura gerada em 2026-01-16 via BMad Method Architecture Workflow*
