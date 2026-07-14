---
title: "Exemplo de post de projeto via Obsidian"
category: projetos
project: customizador
project_description: "Ferramenta para customizar fluxos de chatbot visualmente, com preview em tempo real."
project_tags:
  - Next.js
  - TypeScript
  - React Flow
excerpt: "Um exemplo de como agrupar posts sob um projeto usando o frontmatter do Obsidian."
slug: exemplo-project-obsidian
published_at: 2026-06-15
tags:
  - obsidian
  - workflow
  - ferramentas
---

## Introdução

Este arquivo demonstra o formato esperado para posts que pertencem a um **projeto** — um agrupador de posts dentro da categoria `projetos`.

## Como funciona

Além dos campos normais de post, três campos extras controlam o agrupamento:

| Campo | Uso | Obrigatório |
|-------|-----|--------------|
| `project` | Slug do projeto (ex: `customizador`). Cria o projeto automaticamente se não existir. | Sim, para agrupar |
| `project_description` | Descrição do projeto, mostrada em `/projetos` e na página do projeto. | Não |
| `project_tags` | Lista de tecnologias usadas, mostradas como badges. | Não |

`project_description` e `project_tags` pertencem ao **projeto**, não ao post — não precisam ser repetidos em todo post do mesmo projeto. Quando presentes em qualquer post que referencie o mesmo `project`, eles atualizam a descrição/tags do projeto (o último post sincronizado "vence").

Depois de escrever o post, rode:

```bash
python sync_obsidian.py
```

O post aparecerá em `/projetos/customizador`, junto de qualquer outro post com `category: projetos` e `project: customizador`. Posts com `category: projetos` mas sem `project` aparecem soltos em "Outros posts" na página `/projetos`.

> Assim como `exemplo-post.md`, este arquivo é sempre removido do banco pelo `sync_obsidian.py` antes da sincronização — ele existe só como referência de formato, não como conteúdo real do blog.
