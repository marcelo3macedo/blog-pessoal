# Formato esperado dos posts

Posts são arquivos `.md` com **front matter YAML** no topo, seguido do conteúdo em Markdown.

---

## Front matter

```yaml
---
title: "Título do post"           # obrigatório
category: desenvolvimento-web     # obrigatório — slug de categoria existente
excerpt: "Frase de resumo breve." # opcional — extraído do conteúdo se ausente
slug: meu-post-url                # opcional — derivado do título se ausente
published_at: 2026-06-15          # opcional — usa a data de hoje se ausente
tags:
  - nextjs
  - react
  - typescript                    # opcional — tags são criadas automaticamente
---
```

### Categorias disponíveis

| Slug | Nome |
|------|------|
| `tecnologia` | Tecnologia |
| `desenvolvimento-web` | Desenvolvimento Web |
| `vida-pessoal` | Vida Pessoal |
| `produtividade` | Produtividade |

---

## Arquivo completo de exemplo

```markdown
---
title: "Como configurei meu ambiente de desenvolvimento em 2026"
category: desenvolvimento-web
excerpt: "Um guia direto das ferramentas que uso no dia a dia e por que escolhi cada uma."
slug: ambiente-dev-2026
published_at: 2026-06-15
tags:
  - ferramentas
  - terminal
  - produtividade
---

## O problema

Toda vez que troco de máquina perco horas reconfigurando tudo. Resolvi documentar de vez.

![Meu terminal](terminal-setup.png)

## Ferramentas que uso

| Ferramenta | Função | Por quê |
|------------|--------|---------|
| Ghostty | Terminal | Rápido e configurável |
| Neovim | Editor | Leve e extensível |
| mise | Versões de runtime | Substitui nvm/rbenv/pyenv |
| lazygit | Git TUI | Mais ágil que a CLI pura |

## Setup do terminal

```bash
# Instala o mise para gerenciar runtimes
curl https://mise.run | sh

# Adiciona ao shell
echo 'eval "$(mise activate bash)"' >> ~/.bashrc

# Instala as versões que uso
mise install node@22 python@3.13
```

## Checklist de uma nova máquina

- [x] Instalar Ghostty
- [x] Clonar dotfiles
- [x] Instalar mise e runtimes
- [ ] Configurar chaves SSH
- [ ] Sincronizar extensões do Neovim

> A melhor configuração é aquela que você consegue recriar em menos de 30 minutos.
```

---

## Enviando para o blog

### 1. Imagens primeiro

Faça upload de cada imagem antes de publicar o post.
O nome do arquivo no upload deve bater exatamente com o caminho usado no `.md`.

```bash
curl -X POST http://localhost:3000/api/upload/image \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@terminal-setup.png"

# Resposta:
# {"filename":"terminal-setup.png","url":"/uploads/terminal-setup.png"}
```

### 2. Post

```bash
curl -X POST http://localhost:3000/api/upload/post \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@ambiente-dev-2026.md"

# Resposta (novo post):
# {"slug":"ambiente-dev-2026","title":"Como configurei...","created":true,"updated":false}

# Resposta (re-envio atualiza):
# {"slug":"ambiente-dev-2026","title":"Como configurei...","created":false,"updated":true}
```

O post fica disponível em `/posts/ambiente-dev-2026`.

---

## Markdown suportado

| Elemento | Sintaxe |
|----------|---------|
| Títulos | `## H2`, `### H3`, `#### H4` |
| Negrito | `**texto**` |
| Itálico | `*texto*` |
| Código inline | `` `código` `` |
| Bloco de código | ` ```linguagem ` |
| Link | `[texto](url)` |
| Imagem | `![legenda](arquivo.png)` |
| Tabela | sintaxe GFM padrão |
| Checklist | `- [x] feito` / `- [ ] pendente` |
| Citação | `> texto` |
| Separador | `---` |
| Strikethrough | `~~texto~~` |
