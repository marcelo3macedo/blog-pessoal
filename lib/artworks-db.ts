import { getDb } from "./db";

export interface Artwork {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category: string;
  model: string;
  style: string;
  prompt: string | null;
  negative_prompt: string | null;
  sampler: string | null;
  steps: number | null;
  cfg_scale: number | null;
  seed: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export function getAllArtworks(filters?: {
  category?: string;
  model?: string;
  style?: string;
}): Artwork[] {
  let query = "SELECT * FROM artworks WHERE 1=1";
  const params: (string | number)[] = [];

  if (filters?.category) {
    query += " AND category = ?";
    params.push(filters.category);
  }
  if (filters?.model) {
    query += " AND model = ?";
    params.push(filters.model);
  }
  if (filters?.style) {
    query += " AND style = ?";
    params.push(filters.style);
  }

  query += " ORDER BY created_at DESC";
  return getDb().prepare(query).all(...params) as Artwork[];
}

export function getArtworkBySlug(slug: string): Artwork | null {
  return (
    (getDb()
      .prepare("SELECT * FROM artworks WHERE slug = ?")
      .get(slug) as Artwork) ?? null
  );
}

export function getArtworkFilters(): {
  categories: string[];
  models: string[];
  styles: string[];
} {
  const db = getDb();
  const categories = (
    db.prepare("SELECT DISTINCT category FROM artworks ORDER BY category").all() as {
      category: string;
    }[]
  ).map((r) => r.category);
  const models = (
    db.prepare("SELECT DISTINCT model FROM artworks ORDER BY model").all() as {
      model: string;
    }[]
  ).map((r) => r.model);
  const styles = (
    db.prepare("SELECT DISTINCT style FROM artworks ORDER BY style").all() as {
      style: string;
    }[]
  ).map((r) => r.style);
  return { categories, models, styles };
}
