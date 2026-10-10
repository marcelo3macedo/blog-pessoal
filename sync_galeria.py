#!/usr/bin/env python3
"""
sync_galeria.py — Sincroniza docs/galeria-artes.md → artworks no blog.db

Uso:
    python sync_galeria.py            # sincroniza tudo
    python sync_galeria.py --dry-run  # mostra o que faria, sem alterar o banco
    python sync_galeria.py --prune    # remove do banco obras ausentes no .md

Formato esperado em docs/galeria-artes.md:
    Cada obra é uma seção ## Título com um bloco de código ```artwork contendo
    os metadados em YAML, opcionalmente seguido de descrição em texto livre.

    ## Título da Obra

    ```artwork
    slug: meu-slug            # opcional — derivado do título se ausente
    image_url: "https://..."  # obrigatório
    category: Personagem      # obrigatório
    model: SDXL 1.0           # obrigatório
    style: Arte Digital       # obrigatório
    prompt: |
      texto do prompt...
    negative_prompt: |
      texto negativo...
    sampler: DPM++ 2M Karras
    steps: 30
    cfg_scale: 7.5
    seed: "1234567890"
    width: 512
    height: 768
    created_at: 2024-11-15
    ```

    Descrição opcional em texto livre (suporta Markdown).

Dependências: pip install pyyaml
"""

import argparse
import re
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
GALERIA_MD = ROOT / "docs" / "galeria-artes.md"
DB_PATH = ROOT / "blog.db"


# ── helpers ───────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    for src, dst in [
        ("àáâãä", "a"), ("èéêë", "e"), ("ìíîï", "i"),
        ("òóôõö", "o"), ("ùúûü", "u"), ("ç", "c"), ("ñ", "n"),
    ]:
        for ch in src:
            text = text.replace(ch, dst)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    return re.sub(r"[\s-]+", "-", text).strip("-")


# ── parser ────────────────────────────────────────────────────────────

ARTWORK_BLOCK_RE = re.compile(r"```artwork\s*\n(.*?)```", re.DOTALL)


def parse_galeria_md(content: str) -> list[dict]:
    """Extrai lista de artworks do MD.

    Cada seção ## Título contém:
    - Um bloco ```artwork ... ``` com YAML de metadados
    - Texto livre opcional após o bloco (vira `description`)
    """
    artworks: list[dict] = []

    # Quebra em seções pelo ## (mantém o título na linha)
    sections = re.split(r"^## ", content, flags=re.MULTILINE)

    for section in sections[1:]:
        lines = section.split("\n", 1)
        title = lines[0].strip()
        if not title:
            continue
        body = lines[1] if len(lines) > 1 else ""

        block_match = ARTWORK_BLOCK_RE.search(body)
        if not block_match:
            # Seções de documentação do formato (sem bloco artwork) são ignoradas silenciosamente
            continue

        try:
            params = yaml.safe_load(block_match.group(1)) or {}
        except yaml.YAMLError as exc:
            print(f"  [erro] YAML inválido em '{title}': {exc}")
            continue

        # Descrição é o texto livre após o bloco ```artwork
        description_raw = body[block_match.end():].strip()
        # Remove separadores --- e espaços extras
        description = re.sub(r"^---\s*$", "", description_raw, flags=re.MULTILINE).strip() or None

        image_url = str(params.get("image_url") or "").strip()
        if not image_url:
            print(f"  [erro] '{title}' sem image_url — ignorada")
            continue

        category = str(params.get("category") or "").strip()
        model = str(params.get("model") or "").strip()
        style = str(params.get("style") or "").strip()
        if not category or not model or not style:
            print(f"  [erro] '{title}' faltando category/model/style — ignorada")
            continue

        slug = str(params.get("slug") or slugify(title))

        def str_or_none(v) -> str | None:
            return str(v).strip() if v is not None else None

        def int_or_none(v) -> int | None:
            try:
                return int(v) if v is not None else None
            except (ValueError, TypeError):
                return None

        def float_or_none(v) -> float | None:
            try:
                return float(v) if v is not None else None
            except (ValueError, TypeError):
                return None

        created_at = str(params.get("created_at") or date.today().isoformat())

        artworks.append({
            "title": title,
            "slug": slug,
            "description": description,
            "image_url": image_url,
            "thumbnail_url": str_or_none(params.get("thumbnail_url")),
            "category": category,
            "model": model,
            "style": style,
            "prompt": str_or_none(params.get("prompt")),
            "negative_prompt": str_or_none(params.get("negative_prompt")),
            "sampler": str_or_none(params.get("sampler")),
            "steps": int_or_none(params.get("steps")),
            "cfg_scale": float_or_none(params.get("cfg_scale")),
            "seed": str_or_none(params.get("seed")),
            "width": int_or_none(params.get("width")),
            "height": int_or_none(params.get("height")),
            "created_at": created_at,
        })

    return artworks


# ── banco ─────────────────────────────────────────────────────────────

def ensure_table(con: sqlite3.Connection) -> None:
    con.execute("""
        CREATE TABLE IF NOT EXISTS artworks (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          title         TEXT NOT NULL,
          slug          TEXT NOT NULL UNIQUE,
          description   TEXT,
          image_url     TEXT NOT NULL,
          thumbnail_url TEXT,
          category      TEXT NOT NULL,
          model         TEXT NOT NULL,
          style         TEXT NOT NULL,
          prompt        TEXT,
          negative_prompt TEXT,
          sampler       TEXT,
          steps         INTEGER,
          cfg_scale     REAL,
          seed          TEXT,
          width         INTEGER,
          height        INTEGER,
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    con.commit()


def upsert_artwork(cur: sqlite3.Cursor, artwork: dict) -> str:
    """Insere ou atualiza uma obra. Retorna 'criado' ou 'atualizado'."""
    existing = cur.execute(
        "SELECT id FROM artworks WHERE slug = ?", (artwork["slug"],)
    ).fetchone()

    cols = [
        "title", "description", "image_url", "thumbnail_url",
        "category", "model", "style",
        "prompt", "negative_prompt",
        "sampler", "steps", "cfg_scale", "seed",
        "width", "height", "created_at",
    ]
    values = [artwork[c] for c in cols]

    if existing:
        set_clause = ", ".join(f"{c} = ?" for c in cols)
        cur.execute(
            f"UPDATE artworks SET {set_clause} WHERE slug = ?",
            values + [artwork["slug"]],
        )
        return "atualizado"
    else:
        placeholders = ", ".join("?" * (len(cols) + 1))
        cur.execute(
            f"INSERT INTO artworks (slug, {', '.join(cols)}) VALUES ({placeholders})",
            [artwork["slug"]] + values,
        )
        return "criado"


def prune_artworks(cur: sqlite3.Cursor, slugs_in_md: set[str], dry_run: bool) -> int:
    """Remove obras no banco que não estão no MD. Retorna contagem removida."""
    all_slugs_in_db = {
        row[0]
        for row in cur.execute("SELECT slug FROM artworks").fetchall()
    }
    to_remove = all_slugs_in_db - slugs_in_md
    for slug in to_remove:
        print(f"  [removido] {slug}")
        if not dry_run:
            cur.execute("DELETE FROM artworks WHERE slug = ?", (slug,))
    return len(to_remove)


# ── main ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Sincroniza galeria-artes.md → blog.db")
    parser.add_argument("--dry-run", action="store_true", help="Mostra o que faria sem alterar nada")
    parser.add_argument("--prune", action="store_true", help="Remove obras ausentes no .md")
    args = parser.parse_args()
    dry = args.dry_run

    if dry:
        print("=== DRY RUN — nenhuma alteração será feita ===\n")

    if not GALERIA_MD.exists():
        print(f"Erro: {GALERIA_MD} não encontrado")
        sys.exit(1)

    content = GALERIA_MD.read_text(encoding="utf-8")
    artworks = parse_galeria_md(content)

    if not artworks:
        print("Nenhuma obra encontrada no MD. Verifique o formato.")
        sys.exit(1)

    print(f"Obras encontradas no MD: {len(artworks)}\n")

    stats = {"criado": 0, "atualizado": 0, "removido": 0, "erro": 0}

    with sqlite3.connect(DB_PATH) as con:
        if not dry:
            ensure_table(con)

        cur = con.cursor()

        for artwork in artworks:
            try:
                if not dry:
                    action = upsert_artwork(cur, artwork)
                else:
                    existing = cur.execute(
                        "SELECT id FROM artworks WHERE slug = ?", (artwork["slug"],)
                    ).fetchone()
                    action = "atualizado" if existing else "criado"

                dims = f" [{artwork['width']}×{artwork['height']}]" if artwork.get("width") else ""
                print(f"  [{action}] {artwork['slug']}  ({artwork['category']} / {artwork['model']} / {artwork['style']}){dims}")
                stats[action] += 1

            except Exception as exc:
                print(f"  [erro] {artwork.get('slug', '?')}: {exc}")
                stats["erro"] += 1

        if args.prune:
            print("\nPrune:")
            slugs_in_md = {a["slug"] for a in artworks}
            stats["removido"] = prune_artworks(cur, slugs_in_md, dry)

        if not dry:
            con.commit()

    print(
        f"\nConcluído: {stats['criado']} criado(s), "
        f"{stats['atualizado']} atualizado(s), "
        f"{stats['removido']} removido(s), "
        f"{stats['erro']} erro(s)."
    )


if __name__ == "__main__":
    main()
