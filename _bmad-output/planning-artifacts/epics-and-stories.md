---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: 'epics-and-stories'
project_name: 'tiger-900'
user_name: 'Barbosa'
date: '2026-01-16'
status: complete
---

# Tiger 900 Rally Pro - Epic Breakdown

## Overview

Este documento decompõe os requisitos do PRD e decisões de arquitetura em épicos e histórias implementáveis para o projeto Tiger 900 Rally Pro - Site de documentação da viagem às Serras Gaúchas 2026.

**Meta:** Transformar o site MkDocs básico em uma plataforma rica e interativa para registro de viagens de moto, com foco em mobile-first e offline-first.

---

## Requirements Inventory

### Functional Requirements

| ID | Descrição | Prioridade |
|----|-----------|------------|
| FR-01 | Galeria de fotos integrada | P0 |
| FR-02 | Mapa interativo com trajetos GPS | P0 |
| FR-03 | Previsão do tempo expandida | P0 |
| FR-04 | Roteiro interativo melhorado | P0 |
| FR-05 | Funcionamento offline (PWA) | P0 |

### Non-Functional Requirements

| ID | Descrição | Métrica |
|----|-----------|---------|
| NFR-01 | Performance | < 3s load em 3G |
| NFR-02 | Disponibilidade | 99.9% uptime |
| NFR-03 | Usabilidade | < 2 min para registrar momento |
| NFR-04 | Compatibilidade | Chrome/Safari mobile |
| NFR-05 | Manutenibilidade | Código modular |

### Additional Requirements (Architecture)

| ID | Descrição |
|----|-----------|
| ADR-001 | Modular JavaScript Architecture |
| ADR-002 | IndexedDB para storage estruturado |
| ADR-003 | Leaflet.js para mapas |
| ADR-004 | Workbox para Service Worker |
| ADR-005 | Photo processing pipeline |

---

## FR Coverage Map

| FR | Epic | Stories |
|----|------|---------|
| FR-01 | Epic 2: Photo Gallery | 2.1, 2.2, 2.3, 2.4 |
| FR-02 | Epic 3: Interactive Map | 3.1, 3.2, 3.3, 3.4 |
| FR-03 | Epic 4: Weather Forecast | 4.1, 4.2, 4.3 |
| FR-04 | Epic 5: Interactive Itinerary | 5.1, 5.2, 5.3, 5.4 |
| FR-05 | Epic 6: PWA & Offline | 6.1, 6.2, 6.3, 6.4 |
| ADRs | Epic 1: Core Infrastructure | 1.1, 1.2, 1.3, 1.4 |

---

## Epic List

| # | Epic | Objetivo | Stories |
|---|------|----------|---------|
| 1 | Core Infrastructure | Setup base técnica | 4 |
| 2 | Photo Gallery | Sistema de galeria | 4 |
| 3 | Interactive Map | Mapas com GPS | 4 |
| 4 | Weather Forecast | Previsão do tempo | 3 |
| 5 | Interactive Itinerary | Timeline visual | 4 |
| 6 | PWA & Offline | Funcionamento offline | 4 |

**Total:** 6 Épicos, 23 Stories

---

## Epic 1: Core Infrastructure

**Objetivo:** Estabelecer a base técnica modular necessária para todas as features, incluindo storage, state management e estrutura de módulos.

**Requisitos cobertos:** ADR-001, ADR-002, NFR-05

---

### Story 1.1: Setup Modular JavaScript Structure

As a **developer**,
I want **a modular JavaScript architecture with ES6 modules**,
So that **I can develop features independently and maintain code easily**.

**Acceptance Criteria:**

**Given** the project has the old monolithic JS files
**When** I restructure into the new modular architecture
**Then** the file structure matches `/docs/assets/js/{core,features,pwa}/`
**And** each module exports a clear public interface
**And** the main.js orchestrates module initialization

**Technical Notes:**
- Criar estrutura de pastas: `core/`, `features/`, `pwa/`
- Configurar imports em main.js
- Manter backwards compatibility com MkDocs

---

### Story 1.2: Implement IndexedDB Store Module

As a **developer**,
I want **a IndexedDB wrapper module for structured data storage**,
So that **features can persist data locally with consistent API**.

**Acceptance Criteria:**

**Given** the application needs to store structured data
**When** I use the store module
**Then** I can perform CRUD operations on photos, routes, weather, syncQueue
**And** all operations return Promises
**And** the database schema matches ADR-002

**Technical Notes:**
- Database name: `tiger900`
- Stores: photos, routes, weather, syncQueue
- Indexes conforme documentado na arquitetura

---

### Story 1.3: Create Utility Functions Module

As a **developer**,
I want **shared utility functions in a dedicated module**,
So that **common operations are reusable across features**.

**Acceptance Criteria:**

**Given** multiple features need common utilities
**When** I import from utils.js
**Then** I have access to: date formatting, GPS helpers, image compression, debounce/throttle
**And** all functions are pure and well-documented

**Technical Notes:**
- Funções: `formatDate()`, `compressImage()`, `extractGPS()`, `debounce()`, `throttle()`
- JSDoc para documentação

---

### Story 1.4: Configure Build and Development Environment

As a **developer**,
I want **proper build configuration for the new JS structure**,
So that **development is smooth and production builds are optimized**.

**Acceptance Criteria:**

**Given** the new modular JS architecture
**When** I run `mkdocs serve`
**Then** ES modules load correctly in development
**And** browser devtools show proper source maps
**When** I run `mkdocs build`
**Then** production build minifies and bundles correctly

**Technical Notes:**
- Atualizar mkdocs.yml com novos scripts
- Configurar extra_javascript para ES modules
- Verificar compatibilidade com Material theme

---

## Epic 2: Photo Gallery

**Objetivo:** Implementar sistema de galeria de fotos integrado ao roteiro, com captura GPS automática, compressão client-side e visualização em lightbox.

**Requisitos cobertos:** FR-01 (todos sub-requisitos)

---

### Story 2.1: Photo Upload with GPS Capture

As a **motorcycle traveler**,
I want **to upload photos with automatic GPS extraction**,
So that **my photos are automatically geotagged for the map**.

**Acceptance Criteria:**

**Given** I am on a trip day page
**When** I select a photo from my camera roll
**Then** the EXIF GPS data is extracted automatically
**And** if no EXIF GPS, browser Geolocation API is used as fallback
**And** photo is associated with current day

**Given** the photo is larger than 2000px
**When** the upload process runs
**Then** the image is resized to max 2000px (original)
**And** thumbnail (200x200) and medium (800x600) versions are created
**And** all versions are stored in IndexedDB

**Technical Notes:**
- Usar canvas API para resize
- WebP format com fallback para JPEG
- Qualidade 80%

---

### Story 2.2: Photo Grid Gallery Display

As a **site visitor**,
I want **to see photos in an organized grid gallery**,
So that **I can quickly browse trip photos**.

**Acceptance Criteria:**

**Given** a trip day has uploaded photos
**When** I view the day page
**Then** I see a responsive grid of photo thumbnails
**And** photos are sorted by timestamp
**And** lazy loading is applied for off-screen images

**Given** I am on slow connection
**When** photos are loading
**Then** I see placeholder shimmer effects
**And** thumbnails load first before medium versions

**Technical Notes:**
- CSS Grid para layout responsivo
- Intersection Observer para lazy loading
- Skeleton loading states

---

### Story 2.3: Photo Lightbox with Navigation

As a **site visitor**,
I want **to view photos in fullscreen lightbox with navigation**,
So that **I can see photo details and browse through them**.

**Acceptance Criteria:**

**Given** I am viewing the photo grid
**When** I click/tap on a photo thumbnail
**Then** the photo opens in fullscreen lightbox (medium version)
**And** I can swipe/arrow to navigate between photos
**And** caption is displayed if available
**And** I can close with X button or swipe down

**Given** I am viewing a photo in lightbox
**When** I click the info button
**Then** I see photo metadata: date, time, GPS coordinates, caption

**Technical Notes:**
- Usar GLightbox (já instalado) ou criar custom
- Touch gestures para mobile
- Keyboard navigation para desktop

---

### Story 2.4: Photo Caption and Management

As a **motorcycle traveler**,
I want **to add captions to my photos and manage them**,
So that **I can provide context and organize my gallery**.

**Acceptance Criteria:**

**Given** I have uploaded a photo
**When** I tap the edit button on the photo
**Then** I can add/edit a caption (max 280 chars)
**And** the caption is saved to IndexedDB
**And** the change is queued for sync

**Given** I want to delete a photo
**When** I long-press or click delete
**Then** I see confirmation dialog
**And** on confirm, photo is removed from IndexedDB
**And** deletion is queued for sync

**Technical Notes:**
- Inline edit mode
- Soft delete with undo option
- Sync queue para operações

---

## Epic 3: Interactive Map

**Objetivo:** Implementar mapas interativos com Leaflet.js para visualização de trajetos GPX, marcadores de pontos de interesse e integração com fotos geolocalizadas.

**Requisitos cobertos:** FR-02 (todos sub-requisitos)

---

### Story 3.1: Setup Leaflet Map Component

As a **developer**,
I want **a reusable Leaflet map component**,
So that **I can embed interactive maps anywhere in the site**.

**Acceptance Criteria:**

**Given** the map.js module is loaded
**When** I initialize a map on a container element
**Then** Leaflet map renders with OpenStreetMap tiles
**And** default zoom and center are configurable
**And** zoom/pan controls work on touch and mouse

**Given** the user is offline
**When** viewing a cached page with map
**Then** cached map tiles display correctly
**And** uncached areas show fallback message

**Technical Notes:**
- Lazy load Leaflet (defer)
- Default center: região das Serras Gaúchas
- Zoom range: 8-18

---

### Story 3.2: GPX Route Display

As a **site visitor**,
I want **to see trip routes displayed on the map**,
So that **I can visualize the motorcycle journey**.

**Acceptance Criteria:**

**Given** a trip day has a GPX file
**When** the map loads
**Then** the route polyline is rendered on the map
**And** route color indicates direction (start=green, end=red gradient)
**And** map auto-fits to show entire route

**Given** multiple days are being shown
**When** viewing the full trip map
**Then** each day's route has distinct color
**And** legend shows day colors

**Technical Notes:**
- leaflet-gpx plugin para parsing
- Custom styling para polylines
- GPX files em `/docs/assets/routes/`

---

### Story 3.3: Points of Interest Markers

As a **site visitor**,
I want **to see markers for points of interest on the map**,
So that **I can identify key locations on the route**.

**Acceptance Criteria:**

**Given** a trip day has defined waypoints
**When** the map loads
**Then** markers appear for: start, end, stops, photos, fuel, restaurants
**And** each marker type has distinct icon
**And** clicking marker shows popup with details

**Given** photos have GPS coordinates
**When** viewing the map
**Then** photo markers show thumbnail preview
**And** clicking opens the photo in lightbox

**Technical Notes:**
- Custom marker icons em `/docs/assets/icons/markers/`
- Popup templates com Mustache ou template literals
- Cluster markers se muitos pontos próximos

---

### Story 3.4: Map Interaction and Controls

As a **site visitor**,
I want **intuitive map controls and interactions**,
So that **I can explore the route easily**.

**Acceptance Criteria:**

**Given** I am viewing the map
**When** I tap on the route line
**Then** popup shows distance from start and elevation at that point

**Given** I want to see elevation profile
**When** I tap the elevation button
**Then** elevation chart appears below map
**And** hovering chart highlights point on map

**Given** I want to share location
**When** I right-click/long-press on map
**Then** context menu shows "Get directions" (opens Google Maps)

**Technical Notes:**
- Elevation data do GPX
- Chart.js ou custom SVG para elevation profile
- Deep links para apps de navegação

---

## Epic 4: Weather Forecast

**Objetivo:** Expandir sistema de previsão do tempo para cobrir todas as datas e cidades da viagem, com cache inteligente e fallback offline.

**Requisitos cobertos:** FR-03 (todos sub-requisitos)

---

### Story 4.1: Weather Widget Component

As a **motorcycle traveler**,
I want **to see weather forecast for each trip day and location**,
So that **I can prepare for conditions**.

**Acceptance Criteria:**

**Given** a trip day page
**When** the weather widget loads
**Then** I see: temperature (min/max), condition icon, precipitation %
**And** data is for that day's destination city
**And** last update timestamp is shown

**Given** weather data is older than 3 hours
**When** the widget loads and I'm online
**Then** fresh data is fetched and displayed
**And** cache is updated

**Technical Notes:**
- OpenWeatherMap API
- Widget como custom element `<weather-widget>`
- Compact design para mobile

---

### Story 4.2: Multi-day Weather Overview

As a **motorcycle traveler**,
I want **to see weather forecast for all trip days at once**,
So that **I can plan packing and route adjustments**.

**Acceptance Criteria:**

**Given** the trip overview page
**When** weather section loads
**Then** I see forecast cards for all days
**And** each card shows: date, city, temp range, condition
**And** cards are scrollable horizontally on mobile

**Given** any day shows rain > 50%
**When** viewing overview
**Then** that day's card is highlighted with warning style

**Technical Notes:**
- Pre-fetch weather para todos os dias ao carregar overview
- Visual highlight para dias com condições ruins
- Responsive grid/scroll

---

### Story 4.3: Weather Offline and Cache

As a **motorcycle traveler**,
I want **weather information available offline**,
So that **I can check forecast during the trip without signal**.

**Acceptance Criteria:**

**Given** weather data was fetched while online
**When** I go offline and view a trip day
**Then** cached weather data is displayed
**And** "Last updated: X hours ago" message is shown
**And** no error is thrown

**Given** I'm offline and no cached data exists
**When** weather widget loads
**Then** placeholder message shows "Weather unavailable offline"
**And** widget gracefully degrades

**Technical Notes:**
- Cache em IndexedDB (store: weather)
- TTL: 3h para atual, 6h para futuro
- Graceful degradation

---

## Epic 5: Interactive Itinerary

**Objetivo:** Redesenhar o roteiro com timeline visual, cards expandíveis, integração com fotos/mapa/clima e animações suaves.

**Requisitos cobertos:** FR-04 (todos sub-requisitos)

---

### Story 5.1: Timeline Visual Component

As a **site visitor**,
I want **a visual timeline showing the trip progression**,
So that **I can easily understand the journey structure**.

**Acceptance Criteria:**

**Given** the itinerary page
**When** it loads
**Then** I see a vertical timeline with day markers
**And** each day shows: date, origin→destination, distance
**And** connecting lines show travel progression
**And** current day (if during trip) is highlighted

**Given** I'm viewing on mobile
**When** scrolling the timeline
**Then** smooth scrolling with momentum
**And** day headers stick when scrolling past

**Technical Notes:**
- CSS-based timeline with flexbox
- Sticky headers para navegação
- Highlight animation para dia atual

---

### Story 5.2: Expandable Day Cards

As a **site visitor**,
I want **expandable cards for each trip day with details**,
So that **I can see overview or dive into specifics**.

**Acceptance Criteria:**

**Given** I'm viewing the timeline
**When** I tap on a day card
**Then** it expands smoothly showing: route summary, photo preview, weather, notes
**And** other expanded cards collapse
**And** expanded card scrolls into view if needed

**Given** a day card is expanded
**When** I tap the "Full details" button
**Then** I navigate to that day's dedicated page

**Technical Notes:**
- Accordion pattern com single expand
- CSS transitions para smooth animation
- Lazy load content on expand

---

### Story 5.3: Integrated Media Preview

As a **site visitor**,
I want **to see previews of photos and map in the day cards**,
So that **I get a visual sense of each day**.

**Acceptance Criteria:**

**Given** a day card is expanded
**When** that day has photos
**Then** photo carousel shows top 4 photos
**And** "View all X photos" link is shown

**Given** a day card is expanded
**When** that day has route
**Then** mini map preview shows route outline
**And** tapping mini map opens full map

**Technical Notes:**
- Carousel com touch swipe
- Mini map: static image ou tiny Leaflet instance
- Preload next day's previews

---

### Story 5.4: Progress and Status Indicators

As a **site visitor**,
I want **to see trip progress and status indicators**,
So that **I know where we are in the journey**.

**Acceptance Criteria:**

**Given** the trip has started
**When** viewing itinerary
**Then** progress bar shows % complete (days elapsed/total)
**And** past days are visually marked as complete
**And** current day pulses/highlights

**Given** a day has warnings (weather, notes)
**When** viewing that day in timeline
**Then** warning badge appears on day marker
**And** tooltip explains the warning

**Technical Notes:**
- Progress bar animado
- Badge system para status
- Real-time update se durante viagem

---

## Epic 6: PWA & Offline

**Objetivo:** Aprimorar a PWA existente com Workbox, implementar sync queue para operações offline e garantir 100% de funcionamento sem conexão.

**Requisitos cobertos:** FR-05 (todos sub-requisitos), ADR-004

---

### Story 6.1: Enhanced Service Worker with Workbox

As a **developer**,
I want **to implement Workbox for better SW management**,
So that **caching strategies are robust and maintainable**.

**Acceptance Criteria:**

**Given** the new service-worker.js
**When** it installs
**Then** critical assets are precached (HTML, JS, CSS, icons)
**And** runtime caching strategies are active per ADR-004

**Given** a new version is deployed
**When** user opens the site
**Then** SW updates in background
**And** user sees "Update available" toast
**And** on refresh, new version loads

**Technical Notes:**
- Workbox via CDN ou bundled
- Precache manifest gerado no build
- Update notification UX

---

### Story 6.2: Offline Content Cache

As a **motorcycle traveler**,
I want **all trip content available offline**,
So that **I can access everything without signal**.

**Acceptance Criteria:**

**Given** I visited the site while online
**When** I go offline
**Then** all previously visited pages load from cache
**And** all images I viewed are available
**And** GPX routes are cached

**Given** the "Download for offline" button
**When** I tap it
**Then** all trip pages and assets are precached
**And** progress indicator shows download status
**And** confirmation message when complete

**Technical Notes:**
- Manual cache trigger para download completo
- Estimate storage usage
- Clean up old cache entries

---

### Story 6.3: Offline Status Indicator

As a **site visitor**,
I want **to know when I'm offline and what's available**,
So that **I understand the current state**.

**Acceptance Criteria:**

**Given** I lose network connection
**When** viewing the site
**Then** offline indicator appears (banner or icon)
**And** message explains offline mode is active

**Given** I'm offline
**When** I try to access uncached content
**Then** friendly message explains content unavailable
**And** suggestion to return when online

**Technical Notes:**
- `navigator.onLine` + `online/offline` events
- Toast notification para transition
- Graceful degradation messages

---

### Story 6.4: Sync Queue for Offline Actions

As a **motorcycle traveler**,
I want **my offline actions synced when back online**,
So that **photo uploads and edits aren't lost**.

**Acceptance Criteria:**

**Given** I upload a photo while offline
**When** the upload is processed
**Then** photo is saved to IndexedDB
**And** sync action is added to queue
**And** "Pending sync" indicator appears

**Given** I return online with pending sync items
**When** connection is restored
**Then** sync queue processes automatically
**And** success notification for each synced item
**And** queue clears on completion

**Given** sync fails for an item
**When** viewing sync status
**Then** I see retry option
**And** can view error details

**Technical Notes:**
- Background Sync API se suportado
- Fallback para manual sync
- Retry with exponential backoff

---

## Implementation Priority

### Sprint 1: Core Infrastructure (Epic 1)
- Story 1.1: Modular JS Structure
- Story 1.2: IndexedDB Store
- Story 1.3: Utilities
- Story 1.4: Build Config

### Sprint 2: PWA Foundation (Epic 6.1-6.3)
- Story 6.1: Workbox SW
- Story 6.2: Offline Cache
- Story 6.3: Offline Indicator

### Sprint 3: Weather & Itinerary (Epic 4 + 5.1-5.2)
- Story 4.1: Weather Widget
- Story 4.2: Multi-day Overview
- Story 5.1: Timeline Visual
- Story 5.2: Day Cards

### Sprint 4: Gallery & Map (Epic 2 + 3)
- Story 2.1: Photo Upload
- Story 2.2: Grid Gallery
- Story 3.1: Leaflet Setup
- Story 3.2: GPX Routes

### Sprint 5: Integration & Polish
- Story 2.3-2.4: Lightbox, Captions
- Story 3.3-3.4: Markers, Controls
- Story 4.3: Weather Offline
- Story 5.3-5.4: Media Preview, Progress
- Story 6.4: Sync Queue

---

## Validation Checklist

- [x] **Todos FR cobertos** - 5 FRs mapeados para épicos/stories
- [x] **Todos NFRs considerados** - Requisitos técnicos em acceptance criteria
- [x] **ADRs incorporados** - Decisões de arquitetura refletidas nas stories
- [x] **User personas consistentes** - "motorcycle traveler", "developer", "site visitor"
- [x] **Acceptance criteria completos** - Given/When/Then para cada story
- [x] **Priorização definida** - Sprint planning com sequência lógica
- [x] **Dependências identificadas** - Epic 1 antes de outros épicos

---

*Épicos e Stories gerados em 2026-01-16 via BMad Method Create Epics Workflow*
