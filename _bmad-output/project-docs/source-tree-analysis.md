# Source Tree Analysis - Tiger 900 Rally Pro

## Estrutura Completa do Projeto

```
tiger-900/
│
├── 📄 mkdocs.yml                    # Configuração principal do MkDocs
├── 📄 requirements.txt              # Dependências Python
├── 📄 HOSTING-GUIDE.md              # Guia de hospedagem
├── 📄 .gitignore                    # Arquivos ignorados pelo Git
├── 📄 .nojekyll                     # Desativa Jekyll no GitHub Pages
│
├── 📁 docs/                         # CONTEÚDO DO SITE
│   ├── 📄 index.md                  # Homepage principal
│   ├── 📄 sobre.md                  # Sobre a moto
│   ├── 📄 manifest.json             # PWA manifest
│   ├── 📄 service-worker.js         # Service Worker (PWA)
│   │
│   ├── 📁 viagens/                  # Seção de viagens
│   │   └── 📁 serras-gauchas-2026/  # Viagem principal
│   │       ├── 📄 index.md          # Overview da viagem
│   │       ├── 📄 roteiro.md        # Roteiro detalhado
│   │       ├── 📄 checklist.md      # Checklist de itens
│   │       ├── 📄 mapas-offline.md  # Guia de mapas
│   │       ├── 📄 guia-clima.md     # Previsão do tempo
│   │       ├── 📄 guia-emergencias.md # Emergências
│   │       ├── 📄 guia-gastronomico.md # Gastronomia local
│   │       └── 📄 manutencao-viagem.md # Manutenção em viagem
│   │
│   ├── 📁 garagem/                  # Seção de garagem
│   │   ├── 📄 manutencao.md         # Log de manutenção
│   │   ├── 📄 ficha-tecnica.md      # Especificações técnicas
│   │   └── 📄 manuais.md            # Links para manuais
│   │
│   └── 📁 assets/                   # Assets estáticos
│       ├── 📁 js/                   # JavaScript customizado
│       │   ├── 📄 roteiro-interativo.js (26KB)
│       │   ├── 📄 previsao-tempo.js (9KB)
│       │   └── 📄 pwa-register.js (3KB)
│       │
│       ├── 📁 css/                  # CSS customizado
│       │   └── 📄 roteiro-interativo.css (26KB)
│       │
│       └── 📁 icons/                # Ícones PWA
│           ├── 📄 icon.svg
│           ├── 📄 icon-72x72.png
│           ├── 📄 icon-96x96.png
│           ├── 📄 icon-128x128.png
│           ├── 📄 icon-144x144.png
│           ├── 📄 icon-152x152.png
│           ├── 📄 icon-192x192.png
│           ├── 📄 icon-384x384.png
│           └── 📄 icon-512x512.png
│
├── 📁 overrides/                    # Customizações do tema
│   └── (theme overrides)
│
├── 📁 site/                         # OUTPUT - Site gerado (gitignored)
│   └── (generated files)
│
├── 📁 .github/                      # GitHub configuration
│   └── 📁 workflows/
│       └── 📄 deploy-pages.yml      # CI/CD pipeline
│
├── 📁 _bmad/                        # BMAD Method modules
│   └── (bmad configuration)
│
└── 📁 _bmad-output/                 # BMAD output artifacts
    ├── 📁 planning-artifacts/
    │   └── 📄 bmm-workflow-status.yaml
    └── 📁 project-docs/             # Esta documentação
```

## Diretórios Críticos

### `/docs/` - Conteúdo do Site
**Propósito:** Todo o conteúdo Markdown que será convertido em HTML.

**Entry Point:** `docs/index.md`

**Padrão:** Estrutura hierárquica refletindo navegação do site.

### `/docs/assets/js/` - JavaScript Customizado
**Propósito:** Funcionalidades interativas do lado do cliente.

| Arquivo | Tamanho | Função |
|---------|---------|--------|
| `roteiro-interativo.js` | 26KB | Timeline interativa, waypoints |
| `previsao-tempo.js` | 9KB | Integração com API de clima |
| `pwa-register.js` | 3KB | Service Worker registration |

### `/docs/assets/icons/` - Ícones PWA
**Propósito:** Ícones em múltiplas resoluções para instalação PWA.

**Tamanhos:** 72, 96, 128, 144, 152, 192, 384, 512 pixels.

### `/.github/workflows/` - CI/CD
**Propósito:** Automação de build e deploy.

**Pipeline:** `deploy-pages.yml`
- Trigger: Push para `main`
- Build: `mkdocs build --strict`
- Deploy: GitHub Pages

## Arquivos de Configuração Chave

| Arquivo | Propósito |
|---------|-----------|
| `mkdocs.yml` | Configuração completa do MkDocs |
| `requirements.txt` | Dependências Python |
| `docs/manifest.json` | PWA manifest |
| `docs/service-worker.js` | Cache e offline |
| `.github/workflows/deploy-pages.yml` | CI/CD pipeline |

## Pontos de Entrada

| Contexto | Entry Point |
|----------|-------------|
| **Build** | `mkdocs.yml` |
| **Site** | `docs/index.md` → `site/index.html` |
| **PWA** | `docs/manifest.json` |
| **CI/CD** | `.github/workflows/deploy-pages.yml` |

## Padrões de Organização

1. **Conteúdo:** Markdown em `/docs/` seguindo estrutura de navegação
2. **Assets:** Separados por tipo em `/docs/assets/{js,css,icons}/`
3. **Config:** Raiz do projeto (`mkdocs.yml`, `requirements.txt`)
4. **Output:** Gerado em `/site/` (gitignored)
5. **BMAD:** Artifacts em `/_bmad-output/`
