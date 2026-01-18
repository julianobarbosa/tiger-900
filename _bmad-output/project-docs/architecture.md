# Arquitetura - Tiger 900 Rally Pro Site

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                         (main branch)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ push
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Checkout   │───▶│ MkDocs Build│───▶│   Deploy    │     │
│  │   Code      │    │  (--strict) │    │   Pages     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│   GitHub Pages      │       │  Cloudflare Pages   │
│ julianobarbosa.     │       │  tiger-900.pages.   │
│ github.io/tiger-900 │       │  dev                │
└─────────────────────┘       └─────────────────────┘
          │                               │
          └───────────────┬───────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Browser/PWA                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   MkDocs    │    │  Custom JS  │    │   Service   │     │
│  │   Pages     │    │  Features   │    │   Worker    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Padrão Arquitetural

**Tipo:** Static Site Generator (SSG) com Progressive Web App (PWA)

Este projeto segue o padrão JAMstack:
- **J**avaScript: Funcionalidades interativas do lado do cliente
- **A**PIs: Integração com API de clima
- **M**arkup: Conteúdo em Markdown, gerado para HTML estático

## Componentes Principais

### 1. Build System (MkDocs)

```yaml
# Fluxo de build
Markdown Files → MkDocs + Plugins → Static HTML/CSS/JS → site/
```

**Plugins utilizados:**
| Plugin | Função |
|--------|--------|
| search | Índice de busca client-side |
| glightbox | Lightbox para imagens |
| minify | Otimização de HTML |
| macros | Templates Jinja2 |
| git-revision-date-localized | Metadados de versão |

### 2. Theme Layer (Material)

**Customizações:**
- Tema claro/escuro com toggle
- Paleta: Teal primary + Amber accent
- Navegação: tabs + sections + expand
- Diretório custom: `overrides/`

### 3. JavaScript Layer

```
docs/assets/js/
├── roteiro-interativo.js  (26KB) - Timeline + waypoints interativos
├── previsao-tempo.js      (9KB)  - Integração API clima
└── pwa-register.js        (3KB)  - Service Worker registration
```

**Dependências externas:** Nenhuma (Vanilla JS)

### 4. PWA Layer

```
docs/
├── manifest.json      - Metadados do app
├── service-worker.js  - Cache e offline
└── assets/icons/      - Ícones em múltiplas resoluções
```

**Estratégia de cache:** Network-first com fallback para cache

## Fluxo de Dados

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Markdown   │────▶│    MkDocs    │────▶│  Static HTML │
│   Content    │     │    Build     │     │    + JS      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Weather    │◀────│   Browser    │
                     │     API      │     │   (Client)   │
                     └──────────────┘     └──────────────┘
```

## Decisões Arquiteturais

### ADR-001: MkDocs vs Outras Alternativas

**Decisão:** Usar MkDocs com Material Theme

**Contexto:** Necessidade de site de documentação simples, rápido e com bom design.

**Alternativas consideradas:**
- Jekyll - Mais complexo, Ruby dependency
- Hugo - Mais rápido, mas menos plugins
- Docusaurus - Overkill para projeto pessoal

**Justificativa:** MkDocs Material oferece excelente UX out-of-box, fácil customização, e ecossistema Python familiar.

### ADR-002: PWA para Offline

**Decisão:** Implementar PWA com Service Worker

**Contexto:** Viagem de moto pode ter áreas sem conectividade.

**Justificativa:** Permite consultar roteiro, mapas e informações offline durante a viagem.

### ADR-003: Vanilla JS vs Framework

**Decisão:** Usar JavaScript vanilla para features customizadas

**Contexto:** Features interativas (roteiro, clima) precisam de JavaScript.

**Justificativa:**
- Tamanho de bundle mínimo
- Sem dependências externas
- Performance otimizada para mobile
- Manutenção simples

## Considerações de Segurança

- Site estático: sem backend para atacar
- HTTPS enforced via GitHub/Cloudflare
- Sem dados sensíveis armazenados
- API de clima: apenas leitura, sem autenticação sensível

## Performance

**Otimizações:**
- HTML minificado via plugin
- Assets servidos via CDN (GitHub/Cloudflare)
- Service Worker cache
- Imagens otimizadas
- Lazy loading via glightbox
