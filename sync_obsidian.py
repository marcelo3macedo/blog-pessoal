#!/usr/bin/env python3
"""
sync_obsidian.py — Sincroniza posts do Obsidian direto no blog.db

Uso:
    python sync_obsidian.py            # sincroniza tudo
    python sync_obsidian.py --dry-run  # mostra o que faria, sem alterar o banco

Estrutura esperada:
    obsidian/
      posts/     *.md com frontmatter YAML (português, language=pt)
      posts-en/  *.md com frontmatter YAML (inglês, language=en)
      images/    arquivos de imagem referenciados nos posts (compartilhada pelos dois idiomas)

Posts em posts/ e posts-en/ com o mesmo nome de arquivo (mesmo "stem") são tratados
como traduções um do outro — o campo translation_slug de cada post é preenchido
automaticamente com o slug da versão no outro idioma.

Dependências: pip install pyyaml
"""

import argparse
import hashlib
import re
import shutil
import sqlite3
import sys
from datetime import date
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Erro: pyyaml não instalado. Execute: pip install pyyaml")
    sys.exit(1)

ROOT = Path(__file__).parent
OBSIDIAN_DIR = ROOT / "obsidian"
POSTS_DIR = OBSIDIAN_DIR / "posts"
POSTS_DIR_EN = OBSIDIAN_DIR / "posts-en"
IMAGES_DIR = OBSIDIAN_DIR / "images"
UPLOADS_DIR = ROOT / "public" / "uploads"
DB_PATH = ROOT / "blog.db"

# (diretório, idioma) sincronizados nessa ordem
LANGUAGE_DIRS = [(POSTS_DIR, "pt"), (POSTS_DIR_EN, "en")]

TAG_COLORS = ["amber", "teal", "orange", "cyan", "lime", "pink", "fuchsia", "indigo"]


def color_from_slug(slug: str) -> str:
    h = int(hashlib.md5(slug.encode()).hexdigest(), 16)
    return TAG_COLORS[h % len(TAG_COLORS)]


def slugify(text: str) -> str:
    text = text.lower()
    for src, dst in [
        ("àáâãäå", "a"), ("èéêë", "e"), ("ìíîï", "i"),
        ("òóôõö", "o"), ("ùúûü", "u"), ("ç", "c"), ("ñ", "n"),
    ]:
        for ch in src:
            text = text.replace(ch, dst)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    return re.sub(r"[\s-]+", "-", text.strip())


WIKILINK_EMBED_RE = re.compile(r"!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")


def convert_wikilink_embeds(body: str) -> str:
    """Converte embeds do Obsidian (![[arquivo.png]] ou ![[arquivo.png|Legenda]])
    para o markdown padrão ![Legenda](arquivo.png) que o react-markdown entende."""

    def replace(match: re.Match) -> str:
        target = match.group(1).strip()
        alt = (match.group(2) or Path(target).stem).strip()
        return f"![{alt}]({target})"

    return WIKILINK_EMBED_RE.sub(replace, body)


def parse_frontmatter(content: str) -> tuple[dict, str]:
    if not content.startswith("---"):
        return {}, content
    end = content.find("---", 3)
    if end == -1:
        return {}, content
    fm = yaml.safe_load(content[3:end].strip()) or {}
    return fm, content[end + 3:].strip()


def get_or_create_category(cur: sqlite3.Cursor, slug: str) -> int:
    row = cur.execute("SELECT id FROM categories WHERE slug = ?", (slug,)).fetchone()
    if row:
        return row[0]
    name = slug.replace("-", " ").title()
    cur.execute("INSERT INTO categories (name, slug) VALUES (?, ?)", (name, slug))
    return cur.lastrowid


def get_or_create_project(cur: sqlite3.Cursor, slug: str, description: str | None = None) -> int:
    row = cur.execute("SELECT id FROM projects WHERE slug = ?", (slug,)).fetchone()
    if row:
        if description:
            cur.execute("UPDATE projects SET description = ? WHERE id = ?", (description, row[0]))
        return row[0]
    name = slug.replace("-", " ").title()
    cur.execute(
        "INSERT INTO projects (name, slug, description) VALUES (?, ?, ?)",
        (name, slug, description),
    )
    return cur.lastrowid


def set_project_tags(cur: sqlite3.Cursor, project_id: int, tag_names: list) -> None:
    cur.execute("DELETE FROM project_tags WHERE project_id = ?", (project_id,))
    for tag_name in tag_names:
        tag_id = get_or_create_tag(cur, tag_name)
        cur.execute(
            "INSERT OR IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)",
            (project_id, tag_id),
        )


def get_or_create_tag(cur: sqlite3.Cursor, name: str) -> int:
    slug = slugify(str(name))
    row = cur.execute("SELECT id FROM tags WHERE slug = ?", (slug,)).fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)",
        (str(name), slug, color_from_slug(slug)),
    )
    return cur.lastrowid


def sync_images(dry_run: bool) -> int:
    if not IMAGES_DIR.exists():
        return 0
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    for img in sorted(IMAGES_DIR.iterdir()):
        if img.is_file():
            dest = UPLOADS_DIR / img.name
            print(f"  imagem: {img.name} → public/uploads/{img.name}")
            if not dry_run:
                shutil.copy2(img, dest)
            copied += 1
    return copied


def ensure_seo_columns(con: sqlite3.Connection) -> None:
    cols = {row[1] for row in con.execute("PRAGMA table_info(posts)")}
    for col in ("seo_title", "seo_description", "seo_keywords"):
        if col not in cols:
            con.execute(f"ALTER TABLE posts ADD COLUMN {col} TEXT")


def ensure_project_support(con: sqlite3.Connection) -> None:
    con.execute(
        """CREATE TABLE IF NOT EXISTS projects (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             name TEXT NOT NULL,
             slug TEXT NOT NULL UNIQUE,
             description TEXT
           )"""
    )
    con.execute(
        """CREATE TABLE IF NOT EXISTS project_tags (
             project_id INTEGER NOT NULL REFERENCES projects(id),
             tag_id     INTEGER NOT NULL REFERENCES tags(id),
             PRIMARY KEY (project_id, tag_id)
           )"""
    )
    cols = {row[1] for row in con.execute("PRAGMA table_info(posts)")}
    if "project_id" not in cols:
        con.execute("ALTER TABLE posts ADD COLUMN project_id INTEGER REFERENCES projects(id)")


def ensure_language_columns(con: sqlite3.Connection) -> None:
    cols = {row[1] for row in con.execute("PRAGMA table_info(posts)")}
    if "language" not in cols:
        con.execute("ALTER TABLE posts ADD COLUMN language TEXT NOT NULL DEFAULT 'pt'")
    if "translation_slug" not in cols:
        con.execute("ALTER TABLE posts ADD COLUMN translation_slug TEXT")


EXAMPLE_STEMS = ("exemplo-post", "exemplo-project")


def remove_example_posts(cur: sqlite3.Cursor, dry_run: bool) -> int:
    removed = 0
    for stem in EXAMPLE_STEMS:
        example_path = POSTS_DIR / f"{stem}.md"
        if not example_path.exists():
            continue

        fm, _ = parse_frontmatter(example_path.read_text(encoding="utf-8"))
        slug = fm.get("slug") or slugify(fm.get("title") or example_path.stem)

        row = cur.execute("SELECT id FROM posts WHERE slug = ?", (slug,)).fetchone()
        if row:
            if not dry_run:
                post_id = row[0]
                cur.execute("DELETE FROM post_tags WHERE post_id = ?", (post_id,))
                cur.execute("DELETE FROM posts WHERE id = ?", (post_id,))
            print(f"  [removido] {slug}  ({stem})")
            removed += 1
    return removed


def slug_for_path(path: Path) -> str:
    """Determina o slug de um .md sem tocar no banco (usado para detecção de duplicados
    e para o pareamento de traduções entre posts/ e posts-en/)."""
    fm, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
    title = fm.get("title") or path.stem.replace("-", " ").title()
    return fm.get("slug") or slugify(title)


def check_duplicate_slugs(all_md_files: list[Path]) -> bool:
    """Verifica slugs duplicados entre TODOS os arquivos (pt + en), já que o slug é
    globalmente único no banco. Retorna True se houver duplicados."""
    seen_slugs: dict[str, str] = {}
    has_duplicates = False
    for path in all_md_files:
        try:
            slug = slug_for_path(path)
            if slug in seen_slugs:
                print(f"  [erro] Slug duplicado '{slug}' encontrado em '{path}' e '{seen_slugs[slug]}'")
                has_duplicates = True
            else:
                seen_slugs[slug] = str(path)
        except Exception as exc:
            print(f"  [erro] Falha ao analisar '{path}': {exc}")
            has_duplicates = True
    return has_duplicates


def sync_posts(
    con: sqlite3.Connection, dry_run: bool, posts_dir: Path, language: str
) -> tuple[dict[str, int], dict[str, str]]:
    """Sincroniza um diretório de posts para um idioma específico.

    Retorna (stats, stem_to_slug) — o segundo é usado para parear traduções
    entre posts/ (pt) e posts-en/ (en) que compartilham o mesmo nome de arquivo.
    """
    cur = con.cursor()
    stats = {"criado": 0, "atualizado": 0, "removido": 0, "erro": 0}
    stem_to_slug: dict[str, str] = {}

    if not posts_dir.exists():
        print(f"  {posts_dir.relative_to(ROOT)}/ não encontrada")
        return stats, stem_to_slug

    if posts_dir == POSTS_DIR:
        stats["removido"] += remove_example_posts(cur, dry_run)

    md_files = [p for p in sorted(posts_dir.glob("*.md")) if p.stem not in EXAMPLE_STEMS]
    if not md_files:
        print(f"  nenhum .md encontrado em {posts_dir.relative_to(ROOT)}/")
        return stats, stem_to_slug

    for path in md_files:
        try:
            content = path.read_text(encoding="utf-8")
            fm, body = parse_frontmatter(content)
            body = convert_wikilink_embeds(body)

            title = fm.get("title") or path.stem.replace("-", " ").title()
            slug = fm.get("slug") or slugify(title)
            stem_to_slug[path.stem] = slug
            category_slug = fm.get("category") or "tecnologia"
            project_slug = fm.get("project") or None
            project_description = fm.get("project_description") or None
            project_tags: list = fm.get("project_tags") or []
            excerpt = fm.get("excerpt") or re.sub(r"\s+", " ", body[:200]).strip()
            published_at = str(fm.get("published_at") or date.today().isoformat())
            tags: list = fm.get("tags") or []

            # Campos opcionais de SEO (informação adicional no frontmatter do .md)
            seo_title = fm.get("seo_title") or None
            seo_description = fm.get("seo_description") or None
            seo_keywords_raw = fm.get("seo_keywords")
            seo_keywords = (
                ", ".join(str(k) for k in seo_keywords_raw)
                if isinstance(seo_keywords_raw, list)
                else (str(seo_keywords_raw) if seo_keywords_raw else None)
            )

            category_id = get_or_create_category(cur, category_slug)
            project_id = (
                get_or_create_project(cur, project_slug, project_description)
                if project_slug
                else None
            )
            if project_id and project_tags:
                set_project_tags(cur, project_id, project_tags)

            existing = cur.execute(
                "SELECT id FROM posts WHERE slug = ?", (slug,)
            ).fetchone()

            if existing:
                action = "atualizado"
                if not dry_run:
                    cur.execute(
                        """UPDATE posts
                           SET title=?, excerpt=?, content=?, category_id=?, project_id=?, published_at=?,
                               seo_title=?, seo_description=?, seo_keywords=?, language=?
                           WHERE slug=?""",
                        (title, excerpt, body, category_id, project_id, published_at,
                         seo_title, seo_description, seo_keywords, language, slug),
                    )
                    post_id = existing[0]
            else:
                action = "criado"
                if not dry_run:
                    cur.execute(
                        """INSERT INTO posts (title, slug, excerpt, content, category_id, project_id, published_at,
                                               seo_title, seo_description, seo_keywords, language)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (title, slug, excerpt, body, category_id, project_id, published_at,
                         seo_title, seo_description, seo_keywords, language),
                    )
                    post_id = cur.lastrowid
                else:
                    post_id = None

            if not dry_run and post_id:
                cur.execute("DELETE FROM post_tags WHERE post_id = ?", (post_id,))
                for tag_name in tags:
                    tag_id = get_or_create_tag(cur, tag_name)
                    cur.execute(
                        "INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)",
                        (post_id, tag_id),
                    )

            tag_str = ", ".join(str(t) for t in tags) if tags else "sem tags"
            project_str = f" / {project_slug}" if project_slug else ""
            print(f"  [{action}] [{language}] {slug}  ({category_slug}{project_str})  tags: {tag_str}")
            stats[action] += 1

        except Exception as exc:
            print(f"  [erro] {path.name}: {exc}")
            stats["erro"] += 1

    if not dry_run:
        con.commit()

    return stats, stem_to_slug


def link_translations(
    cur: sqlite3.Cursor, stem_maps: dict[str, dict[str, str]]
) -> None:
    """Preenche translation_slug para cada par de posts que compartilha o mesmo
    nome de arquivo em posts/ e posts-en/ (e limpa o vínculo quando a contraparte
    deixou de existir)."""
    languages = list(stem_maps.keys())
    all_stems = set()
    for m in stem_maps.values():
        all_stems |= set(m.keys())

    for stem in all_stems:
        slugs_by_lang = {lang: stem_maps[lang].get(stem) for lang in languages}
        for lang, slug in slugs_by_lang.items():
            if not slug:
                continue
            others = [s for l, s in slugs_by_lang.items() if l != lang and s]
            translation_slug = others[0] if others else None
            cur.execute(
                "UPDATE posts SET translation_slug = ? WHERE slug = ?",
                (translation_slug, slug),
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Sincroniza Obsidian → blog.db")
    parser.add_argument(
        "--dry-run", action="store_true", help="Mostra o que faria sem alterar nada"
    )
    args = parser.parse_args()
    dry = args.dry_run

    if dry:
        print("=== DRY RUN — nenhuma alteração será feita ===\n")

    print("Imagens:")
    n_imgs = sync_images(dry)
    if n_imgs == 0:
        print("  nenhuma imagem encontrada")

    # Slugs são globalmente únicos no banco, então checa duplicados entre pt e en juntos.
    all_md_files = [
        p
        for posts_dir, _ in LANGUAGE_DIRS
        if posts_dir.exists()
        for p in sorted(posts_dir.glob("*.md"))
        if p.stem not in EXAMPLE_STEMS
    ]
    if check_duplicate_slugs(all_md_files):
        print("\nSincronização abortada devido a erros de slug duplicado.")
        sys.exit(1)

    totals = {"criado": 0, "atualizado": 0, "removido": 0, "erro": 0}
    stem_maps: dict[str, dict[str, str]] = {}
    with sqlite3.connect(DB_PATH) as con:
        if not dry:
            ensure_seo_columns(con)
            ensure_project_support(con)
            ensure_language_columns(con)

        for posts_dir, language in LANGUAGE_DIRS:
            print(f"\nPosts ({language}):")
            stats, stem_to_slug = sync_posts(con, dry, posts_dir, language)
            stem_maps[language] = stem_to_slug
            for key in totals:
                totals[key] += stats[key]

        if not dry:
            link_translations(con.cursor(), stem_maps)
            con.commit()

    print(
        f"\nConcluído: {totals['criado']} criado(s), "
        f"{totals['atualizado']} atualizado(s), "
        f"{totals['removido']} removido(s), "
        f"{totals['erro']} erro(s)."
    )


if __name__ == "__main__":
    main()
