# Tiger 900 Rally Pro - Documentação Técnica do Projeto

> Documentação técnica gerada pelo BMad Method para suporte ao desenvolvimento assistido por IA.

## Visão Geral do Projeto

| Campo | Valor |
|-------|-------|
| **Projeto** | Triumph Tiger 900 Rally Pro - Viagem Serras Gaúchas 2026 |
| **Tipo** | Static Documentation Site + PWA |
| **Repositório** | Monolith |
| **Stack Principal** | MkDocs Material + Vanilla JavaScript |
| **Hosting** | GitHub Pages + Cloudflare Pages |

## Quick Reference

| Aspecto | Detalhes |
|---------|----------|
| **Linguagem** | Python (build), JavaScript (frontend) |
| **Framework** | MkDocs with Material Theme |
| **Entry Point** | `mkdocs.yml` (config), `docs/index.md` (content) |
| **Build Command** | `mkdocs build --strict` |
| **Dev Server** | `mkdocs serve` |
| **CI/CD** | GitHub Actions → GitHub Pages |

## Documentação Gerada

### Core Documentation

- [Project Overview](./project-overview.md) - Resumo executivo e stack tecnológico
- [Architecture](./architecture.md) - Padrões arquiteturais e decisões
- [Source Tree Analysis](./source-tree-analysis.md) - Estrutura de diretórios anotada
- [Development Guide](./development-guide.md) - Setup, desenvolvimento e deploy

### Documentação Existente do Projeto

- [HOSTING-GUIDE.md](../../HOSTING-GUIDE.md) - Guia completo de hospedagem
- [mkdocs.yml](../../mkdocs.yml) - Configuração do site
- [requirements.txt](../../requirements.txt) - Dependências Python

## URLs de Produção

| Ambiente | URL |
|----------|-----|
| **GitHub Pages** | https://julianobarbosa.github.io/tiger-900 |
| **Cloudflare Pages** | https://tiger-900.pages.dev |
| **Repositório** | https://github.com/julianobarbosa/tiger-900 |

## Getting Started

### Para Desenvolvimento

```bash
# Clone
git clone https://github.com/julianobarbosa/tiger-900.git
cd tiger-900

# Setup
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Desenvolvimento
mkdocs serve
# Acesse: http://127.0.0.1:8000
```

### Para Adicionar Conteúdo

1. Crie arquivo `.md` em `docs/`
2. Adicione à navegação em `mkdocs.yml`
3. Commit e push para `main`
4. Deploy automático via GitHub Actions

## AI-Assisted Development

Esta documentação foi criada para fornecer contexto completo para desenvolvimento assistido por IA.

**Ao criar PRD para novas funcionalidades:**
1. Referencie esta documentação como contexto do projeto existente
2. Consulte [Architecture](./architecture.md) para decisões técnicas
3. Consulte [Source Tree](./source-tree-analysis.md) para localização de arquivos
4. Consulte [Development Guide](./development-guide.md) para setup e deploy

**Áreas comuns para expansão:**
- Novos destinos de viagem em `docs/viagens/`
- Registros de manutenção em `docs/garagem/`
- Novas funcionalidades JavaScript em `docs/assets/js/`
- Melhorias no PWA (offline maps, etc.)

---

*Documentação gerada em 2026-01-16 pelo BMad Method Document Project Workflow*
