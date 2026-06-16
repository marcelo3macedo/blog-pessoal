---
title: "Exemplo de post via Obsidian"
category: desenvolvimento-web
excerpt: "Um exemplo de como escrever posts no Obsidian e sincronizar com o blog."
slug: exemplo-post-obsidian
published_at: 2026-06-15
tags:
  - obsidian
  - workflow
  - ferramentas
# Campos opcionais de SEO — se omitidos, o blog usa title/excerpt como fallback.
seo_title: "Como escrever posts no Obsidian e sincronizar com o blog"
seo_description: "Guia rápido do formato de frontmatter esperado para sincronizar posts do Obsidian com o blog via sync_obsidian.py."
seo_keywords:
  - obsidian
  - markdown
  - blog
  - sincronizacao
---

## Introdução

Este arquivo demonstra o formato esperado para posts escritos no Obsidian.

![Exemplo de imagem](exemplo.png)

## Como funciona

Escreva o post no Obsidian normalmente. Coloque as imagens na pasta `obsidian/images/` com o mesmo nome usado no markdown.

Depois rode:

```bash
python sync_obsidian.py
```

O script cuida de tudo:
- Copia as imagens para `public/uploads/`
- Cria ou atualiza o post no banco
- Cria tags automaticamente se não existirem

## Dry run

Para ver o que seria sincronizado sem alterar nada:

```bash
python sync_obsidian.py --dry-run
```

## Categorias disponíveis

| Slug | Nome |
|------|------|
| `tecnologia` | Tecnologia |
| `desenvolvimento-web` | Desenvolvimento Web |
| `vida-pessoal` | Vida Pessoal |
| `produtividade` | Produtividade |

> Reenviar o mesmo arquivo atualiza o post existente — o slug é a chave.

## Campos de SEO

Três campos opcionais no frontmatter controlam o SEO da página do post:

| Campo | Uso | Fallback se ausente |
|-------|-----|----------------------|
| `seo_title` | `<title>` e `og:title`/`twitter:title` | `title` |
| `seo_description` | `<meta name="description">` e `og:description` | `excerpt` |
| `seo_keywords` | `<meta name="keywords">` (lista ou string) | nenhum |

> Não inclua "— além do script" no `seo_title`: o layout já adiciona o nome do site automaticamente em todas as páginas.
