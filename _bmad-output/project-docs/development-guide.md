# Guia de Desenvolvimento - Tiger 900 Rally Pro

## Pré-requisitos

| Requisito | Versão | Verificação |
|-----------|--------|-------------|
| Python | 3.12+ | `python --version` |
| pip | Latest | `pip --version` |
| Git | Latest | `git --version` |

## Setup do Ambiente

### 1. Clone o Repositório

```bash
git clone https://github.com/julianobarbosa/tiger-900.git
cd tiger-900
```

### 2. Crie um Virtual Environment (Recomendado)

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# ou
.venv\Scripts\activate     # Windows
```

### 3. Instale as Dependências

```bash
pip install -r requirements.txt
```

**Dependências instaladas:**
- `mkdocs` - Gerador de site estático
- `mkdocs-material` - Theme Material Design
- `mkdocs-material-extensions` - Extensões do theme
- `mkdocs-minify-plugin` - Minificação HTML
- `mkdocs-macros-plugin` - Macros Jinja2
- `mkdocs-glightbox` - Lightbox para imagens
- `mkdocs-git-revision-date-localized-plugin` - Datas de revisão

## Desenvolvimento Local

### Servidor de Desenvolvimento

```bash
mkdocs serve
```

Acesse: http://127.0.0.1:8000

**Recursos:**
- Hot reload automático
- Visualização em tempo real de mudanças
- Logs de erro detalhados

### Build Local

```bash
mkdocs build
```

Output gerado em: `./site/`

### Build Estrito (Como CI)

```bash
mkdocs build --strict
```

Falha em warnings (usado no CI/CD).

## Estrutura de Desenvolvimento

### Adicionando Novo Conteúdo

1. **Criar arquivo Markdown** em `docs/`:
   ```bash
   touch docs/nova-pagina.md
   ```

2. **Adicionar à navegação** em `mkdocs.yml`:
   ```yaml
   nav:
     - Home: index.md
     - Nova Página: nova-pagina.md  # Adicionar aqui
   ```

3. **Escrever conteúdo** usando Markdown + extensões

### Extensões Markdown Disponíveis

```markdown
# Admonitions
!!! note "Título"
    Conteúdo da nota

!!! warning
    Aviso importante

# Detalhes expansíveis
??? info "Clique para expandir"
    Conteúdo escondido

# Tabs
=== "Tab 1"
    Conteúdo tab 1

=== "Tab 2"
    Conteúdo tab 2

# Emojis
:smile: :rocket: :motorcycle:
```

### Customizando JavaScript

Arquivos em `docs/assets/js/` são incluídos automaticamente via `mkdocs.yml`:

```yaml
extra_javascript:
  - assets/js/roteiro-interativo.js
  - assets/js/pwa-register.js
  - assets/js/previsao-tempo.js
```

### Customizando CSS

Arquivos em `docs/assets/css/`:

```yaml
extra_css:
  - assets/css/roteiro-interativo.css
```

### Customizando Theme

Override de templates em `overrides/`:
- `overrides/main.html` - Template principal
- `overrides/partials/` - Componentes parciais

## CI/CD Pipeline

### GitHub Actions

**Arquivo:** `.github/workflows/deploy-pages.yml`

**Trigger:** Push para branch `main`

**Etapas:**
1. Checkout do código
2. Setup Python 3.12
3. Instalar dependências
4. Build com `mkdocs build --strict`
5. Upload artifact
6. Deploy para GitHub Pages

### Deploy Manual

```bash
# Build e deploy direto (se configurado)
mkdocs gh-deploy
```

## Troubleshooting

### Erro: Plugin não encontrado

```bash
pip install mkdocs-PLUGIN-NAME
```

### Erro: Build strict falha

Verifique:
- Links quebrados
- Arquivos referenciados que não existem
- Warnings de configuração

### Erro: Hot reload não funciona

```bash
# Reinicie o servidor
mkdocs serve --dirtyreload
```

### PWA não atualiza

Limpe o cache do Service Worker:
1. DevTools → Application → Service Workers
2. "Unregister" e refresh

## Testes

### Verificação Manual

1. `mkdocs serve`
2. Navegar por todas as páginas
3. Testar links internos/externos
4. Verificar responsividade
5. Testar PWA offline

### Verificação Automatizada

```bash
# Build estrito (como CI)
mkdocs build --strict

# Se passar, está pronto para deploy
```

## Deploy

### GitHub Pages (Automático)

Push para `main` → GitHub Actions → Deploy automático

### Cloudflare Pages

Configurado para build automático via GitHub integration.

### URLs de Produção

| Plataforma | URL |
|------------|-----|
| GitHub Pages | https://julianobarbosa.github.io/tiger-900 |
| Cloudflare Pages | https://tiger-900.pages.dev |
