# Project Overview - Tiger 900 Rally Pro

## Resumo Executivo

Site de documentação pessoal e blog sobre a Triumph Tiger 900 Rally Pro, incluindo planejamento de viagem às Serras Gaúchas em Janeiro 2026. O projeto utiliza MkDocs com Material Theme e inclui funcionalidades interativas customizadas via JavaScript.

## Informações do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | Triumph Tiger 900 Rally Pro |
| **Tipo** | Static Documentation Site + PWA |
| **URL Produção** | https://julianobarbosa.github.io/tiger-900 |
| **URL Alternativa** | https://tiger-900.pages.dev |
| **Repositório** | github.com/julianobarbosa/tiger-900 |

## Stack Tecnológico

| Categoria | Tecnologia | Propósito |
|-----------|------------|-----------|
| **Build System** | MkDocs | Gerador de site estático |
| **Theme** | Material for MkDocs | Design responsivo e moderno |
| **Linguagem** | Python 3.12 | Build e plugins |
| **Frontend** | Vanilla JavaScript | Funcionalidades interativas |
| **Styling** | CSS3 | Customizações visuais |
| **PWA** | Service Worker | Funcionamento offline |
| **Hosting** | GitHub Pages + Cloudflare Pages | Deploy automático |
| **CI/CD** | GitHub Actions | Build e deploy |

## Plugins MkDocs

- `search` - Busca no site
- `glightbox` - Lightbox para imagens
- `minify` - Minificação HTML
- `macros` - Macros Jinja2
- `git-revision-date-localized` - Datas de revisão

## Funcionalidades JavaScript Customizadas

### 1. Roteiro Interativo (`roteiro-interativo.js`)
- Visualização interativa do roteiro de viagem
- Timeline com waypoints
- Integração com mapas

### 2. Previsão do Tempo (`previsao-tempo.js`)
- Integração com API de clima
- Previsão para destinos da viagem
- Atualização dinâmica

### 3. PWA Register (`pwa-register.js`)
- Registro do Service Worker
- Funcionamento offline
- Instalação como app

## Estrutura de Conteúdo

```
docs/
├── index.md                    # Homepage
├── sobre.md                    # Sobre a moto
├── viagens/
│   └── serras-gauchas-2026/   # Viagem principal
│       ├── index.md           # Overview da viagem
│       ├── roteiro.md         # Roteiro detalhado
│       ├── checklist.md       # Checklist de viagem
│       ├── mapas-offline.md   # Guia de mapas
│       ├── guia-clima.md      # Guia meteorológico
│       ├── guia-emergencias.md # Emergências
│       ├── guia-gastronomico.md # Gastronomia
│       └── manutencao-viagem.md # Manutenção
└── garagem/
    ├── manutencao.md          # Log de manutenção
    ├── ficha-tecnica.md       # Especificações
    └── manuais.md             # Documentação oficial
```

## Links Relacionados

- [Arquitetura](./architecture.md)
- [Árvore de Código](./source-tree-analysis.md)
- [Guia de Desenvolvimento](./development-guide.md)
