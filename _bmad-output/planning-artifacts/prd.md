---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain (skipped)
  - step-06-innovation (skipped)
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-complete
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: brownfield
scope:
  newFeatures:
    - GPS tracking (record routes + real-time display)
    - Photo gallery (integrated with itinerary + separate section)
    - Trip template system (easy addition of new destinations)
  improvements:
    - Interactive itinerary (more interactivity, better visualization, bring life to the site)
    - Weather forecast (expand to all travel dates and cities)
inputDocuments:
  - _bmad-output/project-docs/index.md
  - _bmad-output/project-docs/project-overview.md
  - _bmad-output/project-docs/architecture.md
  - _bmad-output/project-docs/source-tree-analysis.md
  - _bmad-output/project-docs/development-guide.md
documentCounts:
  brief: 0
  research: 0
  brainstorming: 0
  projectDocs: 5
workflowType: 'prd'
projectType: 'brownfield'
status: complete
---

# Product Requirements Document - Triumph Tiger 900 Rally Pro

**Author:** Barbosa
**Date:** 2026-01-16
**Version:** 1.0
**Status:** Complete

---

## Executive Summary

Este PRD define os requisitos para evolução do site de documentação da viagem de moto às Serras Gaúchas em Janeiro 2026. O projeto visa transformar um site MkDocs básico em uma plataforma rica e interativa para registro de viagens, com foco em experiência mobile-first e funcionamento offline.

**Objetivo principal:** Criar o melhor registro possível da viagem e servir como referência para futuras aventuras.

---

## Success Criteria

### User Success

**Para o autor (Barbosa):**
- Conseguir registrar momentos da viagem de forma rápida e fácil (mesmo na estrada)
- Ter um registro visual rico: fotos geolocalizadas, trajetos GPS, notas de contexto
- Revisitar a viagem e reviver os momentos com facilidade
- Usar como referência ao planejar próximas viagens

**Para outros motociclistas:**
- Encontrar informações práticas: rotas, postos, hospedagens, restaurantes
- Entender condições das estradas e pontos de atenção
- Se inspirar para fazer viagens similares
- Navegar facilmente mesmo sem conhecer o site

### Technical Success

| Critério | Meta |
|----------|------|
| **Offline** | Funcionar 100% sem internet (consulta durante viagem) |
| **Mobile** | Performance excelente em celular (uso principal) |
| **Velocidade** | Carregar em < 3s mesmo em 3G/4G |
| **Facilidade de atualização** | Adicionar conteúdo novo sem fricção |

### Measurable Outcomes

| Métrica | Sucesso |
|---------|---------|
| **Cobertura da viagem** | 100% dos dias documentados com fotos e notas |
| **Trajetos GPS** | Todas as rotas registradas e visualizáveis no mapa |
| **Tempo para adicionar conteúdo** | < 10 min por dia de viagem |
| **Satisfação pessoal** | "Ficou demais" ao revisitar daqui 1 ano |

---

## Product Scope

### MVP - Para a Viagem de Janeiro 2026

**Essencial para a viagem funcionar:**

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Galeria de fotos** | Integrada ao roteiro por dia/local | P0 |
| **Mapa interativo** | Visualização de trajetos GPS | P0 |
| **Previsão do tempo** | Expandida para todas as datas/cidades | P0 |
| **Roteiro visual** | Redesign com mais vida e interatividade | P0 |
| **Offline completo** | PWA com cache de todo conteúdo | P0 |

### Growth Features (Post-MVP)

**Para tornar útil a outros:**

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Templates de viagem** | Sistema para criar novas viagens facilmente | P1 |
| **Reviews** | Seção de avaliações (hospedagem, restaurantes) | P1 |
| **Dicas práticas** | Condições de estrada, pontos de atenção | P1 |
| **GPS real-time** | Compartilhar localização durante viagem | P2 |

### Vision (Future)

**O sonho:**
- Plataforma completa de documentação de viagens de moto
- Comunidade de motociclistas compartilhando rotas
- App mobile dedicado para registro durante viagem

### Out of Scope (MVP)

- Backend próprio / banco de dados
- Autenticação de usuários
- Funcionalidades sociais (comentários, likes)
- App nativo (iOS/Android)
- Monetização

---

## User Journeys

### Jornada 1: Registrando Momentos na Estrada

**Persona:** Barbosa, DevOps Engineer, motociclista experiente

**Contexto:** Parou em um mirante no Cânion Itaimbezinho. Vista espetacular, quer eternizar o momento.

| Etapa | Ação | Emoção |
|-------|------|--------|
| **Captura** | Saca o celular, abre o site | Ansioso para não perder o momento |
| **Registro rápido** | Tira foto, GPS captura localização automaticamente | Satisfeito com a praticidade |
| **Contexto** | Adiciona nota rápida sobre o local | Realizado |
| **Confirmação** | Vê a foto aparecer no dia correto do roteiro | Tranquilo - momento salvo |
| **Continua viagem** | Guarda celular, volta pra moto | Feliz - registro feito em < 2 min |

**Requisitos revelados:** Upload foto + GPS auto, interface rápida, associação automática ao dia/local, sync offline

### Jornada 2: Consultando Offline Durante a Viagem

**Persona:** Barbosa, fim de tarde em Cambará do Sul, sem sinal

**Contexto:** Precisa decidir onde jantar. Lembra que tinha pesquisado restaurantes antes.

| Etapa | Ação | Emoção |
|-------|------|--------|
| **Necessidade** | Está com fome, precisa de recomendação | Leve preocupação |
| **Acessa offline** | Abre o site, funciona mesmo sem internet | Alívio |
| **Navega** | Vai até o dia atual > seção "Onde Comer" | Confiante |
| **Encontra** | Vê lista de restaurantes com notas e endereços | Satisfeito |
| **Decide** | Escolhe baseado nas avaliações | Animado |

**Requisitos revelados:** PWA cache completo, navegação por dia/seção, info prática offline

### Jornada 3: Visitante Planejando Viagem Similar

**Persona:** Ricardo, 35 anos, motociclista de São Paulo

**Contexto:** Pesquisou "viagem moto serra gaúcha" no Google, achou o site

| Etapa | Ação | Emoção |
|-------|------|--------|
| **Descoberta** | Clica no resultado, cai na página inicial | Curioso |
| **Primeira impressão** | Vê fotos bonitas, roteiro visual no mapa | Impressionado |
| **Explora** | Navega pelo roteiro dia a dia, vê trajetos | Engajado |
| **Informações práticas** | Encontra dicas de hospedagem, postos, estradas | Grato |
| **Decisão** | Salva nos favoritos | Inspirado |

**Requisitos revelados:** Design visual rico, mapa interativo, galeria de fotos, info prática organizada

### Jornada 4: Adicionando Nova Viagem (Futuro)

**Persona:** Barbosa, 6 meses depois, planejando Serra Catarinense

**Contexto:** Quer documentar nova viagem usando o mesmo sistema

| Etapa | Ação | Emoção |
|-------|------|--------|
| **Inicia** | Acessa área de admin, clica "Nova Viagem" | Motivado |
| **Template** | Sistema oferece estrutura pronta | Aliviado |
| **Configura** | Define datas, destinos principais | Focado |
| **Estrutura criada** | Roteiro base gerado com dias e seções | Satisfeito |
| **Pronto** | Começa a adicionar conteúdo específico | Produtivo |

**Requisitos revelados:** Templates para novas viagens, estrutura replicável, admin simples

---

## Web App Specific Requirements

### Project-Type Overview

| Aspecto | Decisão | Justificativa |
|---------|---------|---------------|
| **Arquitetura** | MPA (Multi-Page App) | Manter MkDocs - simples, SEO-friendly |
| **PWA** | Sim, com offline completo | Essencial para uso sem sinal |
| **Framework JS** | Vanilla JavaScript | Sem dependências, bundle mínimo |

### Browser Support

| Browser | Suporte | Prioridade |
|---------|---------|------------|
| Chrome Mobile | ✅ Completo | **Alta** |
| Safari Mobile | ✅ Completo | **Alta** |
| Chrome Desktop | ✅ Completo | Média |
| Firefox | ✅ Básico | Baixa |
| Edge | ✅ Básico | Baixa |

### Performance Targets

| Métrica | Target | Contexto |
|---------|--------|----------|
| **First Contentful Paint** | < 1.5s | Conexão 4G |
| **Time to Interactive** | < 3s | Conexão 3G |
| **Lighthouse Score** | > 90 | Performance |
| **Offline Load** | < 500ms | Cache local |

### SEO Strategy

- Indexação ativa para descoberta por outros motociclistas
- Meta tags completas (título, descrição, Open Graph)
- Sitemap automático via MkDocs
- URLs limpas e semânticas

### Technical Implementation

| Tecnologia | Uso |
|------------|-----|
| **Geolocation API** | Captura GPS nas fotos |
| **Service Worker** | Cache agressivo |
| **IndexedDB** | Storage local para sync |
| **Lazy Loading** | Galeria de fotos |
| **Image Compression** | Client-side antes de upload |

---

## Functional Requirements

### FR-01: Galeria de Fotos Integrada

**Descrição:** Sistema de galeria de fotos integrado ao roteiro diário

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-01.1 | Upload de fotos com captura automática de GPS | P0 |
| FR-01.2 | Associação automática ao dia/local do roteiro | P0 |
| FR-01.3 | Visualização em grid com lightbox | P0 |
| FR-01.4 | Notas/legendas por foto | P1 |
| FR-01.5 | Compressão automática antes de upload | P1 |

### FR-02: Mapa Interativo com Trajetos GPS

**Descrição:** Visualização de rotas no mapa

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-02.1 | Exibição de trajetos GPX no mapa | P0 |
| FR-02.2 | Marcadores para pontos de interesse | P0 |
| FR-02.3 | Zoom e pan interativo | P0 |
| FR-02.4 | Popup com informações ao clicar | P1 |
| FR-02.5 | Visualização de elevação (opcional) | P2 |

### FR-03: Previsão do Tempo Expandida

**Descrição:** Previsão meteorológica para todas as datas e cidades

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-03.1 | Previsão para cada cidade do roteiro | P0 |
| FR-03.2 | Cobertura de todas as datas da viagem | P0 |
| FR-03.3 | Ícones visuais de condição | P0 |
| FR-03.4 | Temperatura min/max | P0 |
| FR-03.5 | Probabilidade de chuva | P1 |

### FR-04: Roteiro Interativo Melhorado

**Descrição:** Redesign do roteiro com mais vida e interatividade

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-04.1 | Timeline visual por dia | P0 |
| FR-04.2 | Cards expandíveis com detalhes | P0 |
| FR-04.3 | Integração com fotos do dia | P0 |
| FR-04.4 | Animações e transições suaves | P1 |
| FR-04.5 | Indicador de progresso da viagem | P1 |

### FR-05: Funcionamento Offline

**Descrição:** PWA com cache completo para uso sem internet

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-05.1 | Cache de todo conteúdo estático | P0 |
| FR-05.2 | Cache de imagens otimizadas | P0 |
| FR-05.3 | Indicador de status offline | P0 |
| FR-05.4 | Sync automático quando online | P1 |
| FR-05.5 | Queue de uploads pendentes | P1 |

---

## Non-Functional Requirements

### NFR-01: Performance

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-01.1 | Tempo de carregamento inicial | < 3s em 3G |
| NFR-01.2 | Tempo de carregamento offline | < 500ms |
| NFR-01.3 | Lighthouse Performance Score | > 90 |
| NFR-01.4 | Tamanho do bundle JS | < 100KB gzipped |

### NFR-02: Disponibilidade

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-02.1 | Uptime do site | 99.9% (GitHub Pages) |
| NFR-02.2 | Funcionamento offline | 100% do conteúdo |
| NFR-02.3 | Redundância | GitHub + Cloudflare Pages |

### NFR-03: Usabilidade

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-03.1 | Mobile-first design | Touch-friendly em todas as interações |
| NFR-03.2 | Tempo para registrar momento | < 2 minutos |
| NFR-03.3 | Navegação intuitiva | Max 3 cliques para qualquer conteúdo |

### NFR-04: Compatibilidade

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-04.1 | Browsers suportados | Chrome, Safari, Firefox (últimas 2 versões) |
| NFR-04.2 | Dispositivos | iOS 14+, Android 10+ |
| NFR-04.3 | Responsividade | 320px a 2560px |

### NFR-05: Manutenibilidade

| ID | Requisito | Métrica |
|----|-----------|---------|
| NFR-05.1 | Código documentado | JSDoc em funções públicas |
| NFR-05.2 | Estrutura modular | Separação clara de concerns |
| NFR-05.3 | Facilidade de deploy | CI/CD automático via GitHub Actions |

---

## Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Layer (MkDocs)                    │
│  Markdown → HTML estático → GitHub Pages / Cloudflare       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Interactive Layer (JS)                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │  Roteiro  │  │   Mapa    │  │  Galeria  │  │  Clima   │ │
│  │Interativo │  │Leaflet.js │  │ Lightbox  │  │   API    │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      PWA Layer                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │  Service  │  │ IndexedDB │  │  Cache    │               │
│  │  Worker   │  │  Storage  │  │ Strategy  │               │
│  └───────────┘  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependencies & Integrations

### External APIs

| API | Uso | Fallback |
|-----|-----|----------|
| **OpenWeatherMap** | Previsão do tempo | Cache de última previsão |
| **Leaflet/OpenStreetMap** | Mapas interativos | Imagem estática do mapa |

### Libraries (Sugeridas)

| Library | Uso | Tamanho |
|---------|-----|---------|
| **Leaflet.js** | Mapas interativos | ~40KB |
| **GLightbox** | Galeria de fotos | ~10KB (já em uso) |
| **Workbox** | Service Worker | ~5KB |

---

## Risks & Mitigations

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| API clima indisponível | Média | Baixo | Cache agressivo, fallback para última previsão |
| Fotos muito grandes | Alta | Médio | Compressão client-side obrigatória |
| Sem sinal para sync | Alta | Médio | Queue local com IndexedDB |
| Browser não suporta GPS | Baixa | Médio | Entrada manual de localização |

---

## Implementation Phases

### Fase 1: Core MVP (Antes da viagem - Janeiro 2026)

- [ ] Galeria de fotos integrada
- [ ] Mapa interativo com trajetos
- [ ] Previsão do tempo expandida
- [ ] Roteiro visual melhorado
- [ ] PWA offline completo

### Fase 2: Durante a Viagem

- [ ] Testar registro de momentos
- [ ] Coletar feedback de uso real
- [ ] Ajustes de UX baseados em uso

### Fase 3: Pós-Viagem

- [ ] Sistema de templates
- [ ] Seção de reviews
- [ ] Documentar lições aprendidas

---

## Appendix

### Glossário

| Termo | Definição |
|-------|-----------|
| **PWA** | Progressive Web App - site que funciona como app |
| **GPX** | Formato de arquivo para trajetos GPS |
| **Service Worker** | Script que roda em background para cache offline |
| **IndexedDB** | Banco de dados local do browser |

### Referências

- [Documentação técnica do projeto](./../project-docs/index.md)
- [Arquitetura atual](./../project-docs/architecture.md)
- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
- [Leaflet.js](https://leafletjs.com/)

---

*PRD gerado em 2026-01-16 via BMad Method PRD Workflow*
