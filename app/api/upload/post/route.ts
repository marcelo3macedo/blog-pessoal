import { NextResponse } from "next/server";
import matter from "gray-matter";
import { checkAuth } from "@/lib/auth";
import {
  getCategoryBySlug,
  getProjectBySlug,
  getOrCreateTag,
  setPostTags,
  setProjectDescription,
  setProjectTags,
  upsertPost,
  getPostBySlug,
} from "@/lib/db";

// Removes diacritics and converts to a URL-safe slug
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Returns the first non-heading, non-image, non-fence paragraph
function extractExcerpt(content: string, maxLen = 200): string {
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("!") || t.startsWith("```") || t.startsWith("---")) continue;
    return t.slice(0, maxLen);
  }
  return "";
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Field 'file' (.md) is required" }, { status: 400 });
  }

  if (!file.name.endsWith(".md")) {
    return NextResponse.json({ error: "File must be a .md file" }, { status: 415 });
  }

  const raw = await file.text();

  let data: Record<string, unknown>;
  let content: string;
  try {
    const parsed = matter(raw);
    data = parsed.data as Record<string, unknown>;
    content = parsed.content.trim();
  } catch (err) {
    return NextResponse.json({ error: `Failed to parse front matter: ${err}` }, { status: 422 });
  }

  // ── Validate required fields ──────────────────────────────────────────
  const title = (data.title as string | undefined)?.trim();
  if (!title) {
    return NextResponse.json({ error: "Front matter must include 'title'" }, { status: 422 });
  }

  const categorySlug = (data.category as string | undefined)?.trim();
  if (!categorySlug) {
    return NextResponse.json({ error: "Front matter must include 'category' (slug)" }, { status: 422 });
  }

  const category = getCategoryBySlug(categorySlug);
  if (!category) {
    return NextResponse.json(
      { error: `Category '${categorySlug}' not found. Create it first.` },
      { status: 422 }
    );
  }

  // ── Optional project grouping (e.g. category: projetos, project: customizador) ──
  const projectSlug = (data.project as string | undefined)?.trim();
  let projectId: number | null = null;
  if (projectSlug) {
    const project = getProjectBySlug(projectSlug);
    if (!project) {
      return NextResponse.json(
        { error: `Project '${projectSlug}' not found. Create it first.` },
        { status: 422 }
      );
    }
    projectId = project.id;

    // Shared project metadata — description/tags are set on the project, not the post,
    // so any post referencing the project can refresh them.
    const projectDescription = (data.project_description as string | undefined)?.trim();
    if (projectDescription) setProjectDescription(project.id, projectDescription);

    const rawProjectTags: string[] = Array.isArray(data.project_tags)
      ? (data.project_tags as unknown[]).map((t) => String(t).trim()).filter(Boolean)
      : [];
    if (rawProjectTags.length > 0) {
      const projectTagIds = rawProjectTags.map((name) => {
        const tagSlug = slugify(name) || name.toLowerCase();
        return getOrCreateTag(name, tagSlug).id;
      });
      setProjectTags(project.id, projectTagIds);
    }
  }

  // ── Optional fields with fallbacks ───────────────────────────────────
  const slug =
    (data.slug as string | undefined)?.trim() ||
    slugify(title) ||
    file.name.replace(/\.md$/, "");

  const existingPost = getPostBySlug(slug);
  if (existingPost) {
    return NextResponse.json(
      { error: `A post with the slug '${slug}' already exists.` },
      { status: 409 }
    );
  }

  const excerpt =
    (data.excerpt as string | undefined)?.trim() || extractExcerpt(content);

  const publishedAt =
    (data.published_at as string | Date | undefined) instanceof Date
      ? (data.published_at as Date).toISOString().slice(0, 10)
      : ((data.published_at as string | undefined)?.slice(0, 10) ??
        new Date().toISOString().slice(0, 10));

  // ── SEO opcional ──────────────────────────────────────────────────────
  const seoTitle = (data.seo_title as string | undefined)?.trim() || null;
  const seoDescription = (data.seo_description as string | undefined)?.trim() || null;
  const seoKeywords = Array.isArray(data.seo_keywords)
    ? (data.seo_keywords as unknown[]).map(String).join(", ")
    : (data.seo_keywords as string | undefined)?.trim() || null;

  // ── Tags ──────────────────────────────────────────────────────────────
  const rawTags: string[] = Array.isArray(data.tags)
    ? (data.tags as unknown[]).map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean)
    : [];

  const tagIds: number[] = rawTags.map((name) => {
    const tagSlug = slugify(name) || name.toLowerCase();
    return getOrCreateTag(name, tagSlug).id;
  });

  // ── Persist ───────────────────────────────────────────────────────────
  const { id, created } = upsertPost({
    title,
    slug,
    excerpt,
    content,
    category_id: category.id,
    project_id: projectId,
    published_at: publishedAt,
    seo_title: seoTitle,
    seo_description: seoDescription,
    seo_keywords: seoKeywords,
  });

  setPostTags(id, tagIds);

  return NextResponse.json(
    { slug, title, created, updated: !created },
    { status: created ? 201 : 200 }
  );
}
