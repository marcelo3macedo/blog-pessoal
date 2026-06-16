# além do script

Blog pessoal de **Marcelo Macedo** sobre tecnologia — desenvolvimento web, backend, ferramentas e reflexões sobre carreira na área.

Publicado em [alemdoscript.com.br](https://alemdoscript.com.br).

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- SQLite (`better-sqlite3`) como banco de conteúdo
- Posts escritos em Markdown no [Obsidian](https://obsidian.md) e sincronizados para o banco via `sync_obsidian.py`
- Google Analytics, sitemap.xml e SEO (Open Graph, Twitter card, JSON-LD) configurados por página

## Rodando localmente

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Escrevendo posts

Os posts ficam em `obsidian/posts/*.md` com frontmatter YAML (veja `obsidian/posts/exemplo-post.md` e `docs/formato-post.md` para o formato completo, incluindo os campos opcionais de SEO).

Depois de escrever, sincronize com o banco local:

```bash
python3 sync_obsidian.py          # aplica as alterações
python3 sync_obsidian.py --dry-run # só mostra o que seria feito
```

## Deploy

`scripts/release.sh` sincroniza os posts, builda o projeto (standalone) e envia um zip de release por SSH para o servidor de produção. Veja o script para detalhes.
