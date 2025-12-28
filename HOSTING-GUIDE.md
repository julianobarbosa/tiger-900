# Guia de Hospedagem - Tiger 900 MkDocs Site

Este documento serve como referência completa para a configuração de hospedagem do site MkDocs da Triumph Tiger 900 Rally Pro.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Opções de Domínio](#opções-de-domínio)
3. [GitHub Pages](#github-pages)
4. [Cloudflare Pages](#cloudflare-pages)
5. [Configuração do MkDocs](#configuração-do-mkdocs)
6. [Fluxo de Deploy](#fluxo-de-deploy)
7. [Domínio Customizado (Futuro)](#domínio-customizado-futuro)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O site está hospedado em duas plataformas gratuitas simultaneamente:

| Plataforma | URL | Status |
|------------|-----|--------|
| **GitHub Pages** | https://julianobarbosa.github.io/tiger-900/ | Ativo |
| **Cloudflare Pages** | https://tiger-900.pages.dev | Ativo |

Ambas as plataformas fazem deploy automático quando há push na branch `main`.

---

## Opções de Domínio

### Domínios .com.br (Brasil)

Domínios `.com.br` **não podem** ser registrados diretamente no Cloudflare. É necessário usar o [Registro.br](https://registro.br), que é o registrador oficial para domínios brasileiros.

**Processo para .com.br:**
1. Registrar no Registro.br (~R$40/ano)
2. Configurar DNS no Cloudflare (usando Cloudflare como DNS secundário)
3. Apontar para GitHub Pages ou Cloudflare Pages

### Domínios Internacionais (Cloudflare)

Domínios como `.com`, `.net`, `.org` podem ser registrados diretamente no Cloudflare por ~$10/ano.

**Sugestões consideradas:**
- `motonagaragem.com`
- `motogaragem.com`
- `tiger900blog.com`
- `triumphtigerpt.com`

### Opção Gratuita (Escolhida)

Subdomínios gratuitos disponíveis:
- `*.github.io` - GitHub Pages
- `*.pages.dev` - Cloudflare Pages

**Decisão:** Usar ambas as opções gratuitas para redundância e teste.

---

## GitHub Pages

### URLs

- **Site:** https://julianobarbosa.github.io/tiger-900/
- **Configuração:** https://github.com/julianobarbosa/tiger-900/settings/pages

### Configuração Atual

- **Source:** GitHub Actions
- **Workflow:** Deploy MkDocs to GitHub Pages
- **Branch:** `main`
- **HTTPS:** Enforced

### Workflow de Deploy

Arquivo: `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy MkDocs to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Build with MkDocs
        run: mkdocs build --strict

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./site

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Como Configurar GitHub Pages (Passo a Passo)

1. Acesse o repositório no GitHub
2. Vá em **Settings** > **Pages** (menu lateral)
3. Em **Build and deployment**:
   - Source: **GitHub Actions**
4. O workflow já está configurado no repositório
5. Cada push para `main` faz deploy automaticamente

### Verificar Status do Deploy

- **Actions:** https://github.com/julianobarbosa/tiger-900/actions
- **Environments:** https://github.com/julianobarbosa/tiger-900/deployments

---

## Cloudflare Pages

### URLs

- **Site:** https://tiger-900.pages.dev
- **Dashboard:** https://dash.cloudflare.com → Workers & Pages

### Configuração Atual

| Configuração | Valor |
|--------------|-------|
| **Repositório** | julianobarbosa/tiger-900 |
| **Branch de produção** | main |
| **Build command** | `pip install -r requirements.txt && mkdocs build` |
| **Build output directory** | `site` |
| **Root directory** | `/` (raiz do projeto) |

### Como Configurar Cloudflare Pages (Passo a Passo)

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. No menu lateral, vá em **Workers & Pages**
3. Clique em **Create** ou procure por "Pages"
4. Selecione **Connect to Git**
5. Autorize o GitHub (se necessário)
6. Selecione o repositório `tiger-900`
7. Configure o build:
   - **Framework preset:** None
   - **Build command:** `pip install -r requirements.txt && mkdocs build`
   - **Build output directory:** `site`
8. Clique em **Save and Deploy**

### Verificar Status do Deploy

- Acesse Workers & Pages no dashboard
- Clique no projeto `tiger-900`
- Veja o histórico de deployments

---

## Configuração do MkDocs

### Arquivo Principal

Arquivo: `mkdocs.yml`

```yaml
site_name: Triumph Tiger 900 Rally Pro
site_url: https://julianobarbosa.github.io/tiger-900
site_author: Juliano Barbosa
site_description: Blog pessoal e manual de proprietário da Triumph Tiger 900 Rally Pro.

repo_name: julianobarbosa/tiger-900
repo_url: https://github.com/julianobarbosa/tiger-900

theme:
  name: material
  language: pt-BR
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - toc.integrate
  palette:
    - scheme: default
      primary: teal
      accent: amber
      toggle:
        icon: material/weather-sunny
        name: Switch to dark mode
    - scheme: slate
      primary: teal
      accent: amber
      toggle:
        icon: material/weather-night
        name: Switch to light mode

nav:
  - Home: index.md
  - Viagens:
    - 'Serras Gaúchas 2026': viagens/serras-gauchas-2026/index.md
    - 'Roteiro Detalhado': viagens/serras-gauchas-2026/roteiro.md
    - 'Checklist': viagens/serras-gauchas-2026/checklist.md
  - Garagem:
    - 'Manutenção': garagem/manutencao.md
    - 'Ficha Técnica': garagem/ficha-tecnica.md
    - 'Manuais e Documentação': garagem/manuais.md
  - Sobre: sobre.md

plugins:
  - search
  - glightbox
  - minify
  - macros
  - git-revision-date-localized

markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences
  - pymdownx.tabbed
  - attr_list
```

### Dependências Python

Arquivo: `requirements.txt`

```
mkdocs
mkdocs-material
mkdocs-glightbox
mkdocs-minify-plugin
mkdocs-macros-plugin
mkdocs-git-revision-date-localized-plugin
```

### Estrutura de Diretórios

```
tiger-900/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # GitHub Actions workflow
├── docs/
│   ├── garagem/
│   │   ├── ficha-tecnica.md
│   │   ├── manuais.md
│   │   └── manutencao.md
│   ├── viagens/
│   │   └── serras-gauchas-2026/
│   ├── index.md                # Homepage
│   └── sobre.md
├── mkdocs.yml                  # Configuração principal
├── requirements.txt            # Dependências Python
└── HOSTING-GUIDE.md           # Este arquivo
```

---

## Fluxo de Deploy

### Deploy Automático

```
┌─────────────────┐
│   git push      │
│   (main branch) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              Trigger simultâneo              │
└─────────────────┬───────────────────────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  GitHub Actions │   │ Cloudflare Pages│
│                 │   │                 │
│ 1. Checkout     │   │ 1. Clone repo   │
│ 2. Setup Python │   │ 2. pip install  │
│ 3. pip install  │   │ 3. mkdocs build │
│ 4. mkdocs build │   │ 4. Deploy       │
│ 5. Upload       │   │                 │
│ 6. Deploy       │   │                 │
└────────┬────────┘   └────────┬────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ julianobarbosa  │   │ tiger-900       │
│ .github.io      │   │ .pages.dev      │
│ /tiger-900/     │   │                 │
└─────────────────┘   └─────────────────┘
```

### Deploy Manual

**GitHub Pages:**
```bash
# Via GitHub Actions (dispatch manual)
gh workflow run deploy-pages.yml
```

**Cloudflare Pages:**
- Acesse o dashboard → Workers & Pages → tiger-900
- Clique em **Retry deployment**

**Local (preview):**
```bash
# Instalar dependências
pip install -r requirements.txt

# Servidor local com hot-reload
mkdocs serve

# Acesse http://127.0.0.1:8000
```

---

## Domínio Customizado (Futuro)

Se decidir usar um domínio customizado no futuro:

### Opção 1: Domínio no Cloudflare (~$10/ano)

1. Registre o domínio no Cloudflare Registrar
2. No Cloudflare Pages:
   - Vá em tiger-900 → Custom domains
   - Adicione seu domínio
3. No GitHub Pages (opcional):
   - Settings → Pages → Custom domain
   - Digite o mesmo domínio

### Opção 2: Domínio .com.br no Registro.br (~R$40/ano)

1. Registre em [registro.br](https://registro.br)
2. Configure o DNS:
   - Opção A: Use Cloudflare como DNS
   - Opção B: Use os DNS do Registro.br
3. Adicione registros:
   ```
   # Para GitHub Pages
   CNAME: www → julianobarbosa.github.io
   A: @ → 185.199.108.153
   A: @ → 185.199.109.153
   A: @ → 185.199.110.153
   A: @ → 185.199.111.153

   # OU para Cloudflare Pages
   CNAME: www → tiger-900.pages.dev
   CNAME: @ → tiger-900.pages.dev
   ```

### Configuração HTTPS

- **GitHub Pages:** Automático com Let's Encrypt
- **Cloudflare Pages:** Automático com certificado Cloudflare

---

## Troubleshooting

### Build Falhou no GitHub Actions

1. Verifique a aba Actions: https://github.com/julianobarbosa/tiger-900/actions
2. Erros comuns:
   - **Dependência faltando:** Adicione ao `requirements.txt`
   - **Erro de sintaxe YAML:** Valide o `mkdocs.yml`
   - **Arquivo não encontrado:** Verifique os paths no `nav:`

### Build Falhou no Cloudflare

1. Acesse Workers & Pages → tiger-900 → Deployments
2. Clique no deployment com erro
3. Verifique os logs de build
4. Erros comuns:
   - **pip install falhou:** Verifique `requirements.txt`
   - **mkdocs build falhou:** Verifique configuração

### Site Não Atualiza

1. Verifique se o push foi feito na branch `main`
2. Aguarde 2-5 minutos para propagação
3. Limpe o cache do navegador (Ctrl+Shift+R)
4. Verifique se o deploy completou nas Actions/Cloudflare

### Erro 404 no GitHub Pages

1. Verifique se Pages está habilitado: Settings → Pages
2. Confirme Source: GitHub Actions
3. Verifique se o workflow completou com sucesso
4. Confirme que o `site_url` no `mkdocs.yml` está correto

### Links Quebrados

O build usa `--strict`, então links quebrados causam falha:
```bash
# Teste localmente antes de fazer push
mkdocs build --strict
```

---

## Referências

- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Registro.br](https://registro.br)

---

## Histórico de Configuração

| Data | Ação | Resultado |
|------|------|-----------|
| 2025-12-28 | Configuração inicial GitHub Pages | Site live em julianobarbosa.github.io/tiger-900 |
| 2025-12-28 | Configuração Cloudflare Pages | Site live em tiger-900.pages.dev |

---

*Documento criado em 28 de dezembro de 2025*
