#!/usr/bin/env python3
"""
sync_obsidian.py — Sincroniza posts do Obsidian direto no blog.db

Uso:
    python sync_obsidian.py            # sincroniza tudo
    python sync_obsidian.py --dry-run  # mostra o que faria, sem alterar o banco

Estrutura esperada:
    obsidian/
      posts/   *.md com frontmatter YAML
      images/  arquivos de imagem referenciados nos posts

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
IMAGES_DIR = OBSIDIAN_DIR / "images"
UPLOADS_DIR = ROOT / "public" / "uploads"
DB_PATH = ROOT / "blog.db"

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


def remove_example_post(cur: sqlite3.Cursor, dry_run: bool) -> bool:
    example_path = POSTS_DIR / "exemplo-post.md"
    if not example_path.exists():
        return False

    fm, _ = parse_frontmatter(example_path.read_text(encoding="utf-8"))
    slug = fm.get("slug") or slugify(fm.get("title") or example_path.stem)

    row = cur.execute("SELECT id FROM posts WHERE slug = ?", (slug,)).fetchone()
    if row:
        if not dry_run:
            post_id = row[0]
            cur.execute("DELETE FROM post_tags WHERE post_id = ?", (post_id,))
            cur.execute("DELETE FROM posts WHERE id = ?", (post_id,))
        print(f"  [removido] {slug}  (exemplo-post)")
    return True


def sync_posts(con: sqlite3.Connection, dry_run: bool) -> dict[str, int]:
    cur = con.cursor()
    stats = {"criado": 0, "atualizado": 0, "removido": 0, "erro": 0}

    if not POSTS_DIR.exists():
        print("  obsidian/posts/ não encontrada")
        return stats

    if remove_example_post(cur, dry_run):
        stats["removido"] += 1

    md_files = [p for p in sorted(POSTS_DIR.glob("*.md")) if p.stem != "exemplo-post"]
    if not md_files:
        print("  nenhum .md encontrado em obsidian/posts/")
        return stats

    for path in md_files:
        try:
            content = path.read_text(encoding="utf-8")
            fm, body = parse_frontmatter(content)

            title = fm.get("title") or path.stem.replace("-", " ").title()
            slug = fm.get("slug") or slugify(title)
            category_slug = fm.get("category") or "tecnologia"
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

            existing = cur.execute(
                "SELECT id FROM posts WHERE slug = ?", (slug,)
            ).fetchone()

            if existing:
                action = "atualizado"
                if not dry_run:
                    cur.execute(
                        """UPDATE posts
                           SET title=?, excerpt=?, content=?, category_id=?, published_at=?,
                               seo_title=?, seo_description=?, seo_keywords=?
                           WHERE slug=?""",
                        (title, excerpt, body, category_id, published_at,
                         seo_title, seo_description, seo_keywords, slug),
                    )
                    post_id = existing[0]
            else:
                action = "criado"
                if not dry_run:
                    cur.execute(
                        """INSERT INTO posts (title, slug, excerpt, content, category_id, published_at,
                                               seo_title, seo_description, seo_keywords)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (title, slug, excerpt, body, category_id, published_at,
                         seo_title, seo_description, seo_keywords),
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
            print(f"  [{action}] {slug}  ({category_slug})  tags: {tag_str}")
            stats[action] += 1

        except Exception as exc:
            print(f"  [erro] {path.name}: {exc}")
            stats["erro"] += 1

    if not dry_run:
        con.commit()

    return stats


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

    print("\nPosts:")
    with sqlite3.connect(DB_PATH) as con:
        if not dry:
            ensure_seo_columns(con)
        stats = sync_posts(con, dry)

    print(
        f"\nConcluído: {stats['criado']} criado(s), "
        f"{stats['atualizado']} atualizado(s), "
        f"{stats['removido']} removido(s), "
        f"{stats['erro']} erro(s)."
    )


if __name__ == "__main__":
    main()
