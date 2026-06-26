import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, getPostsByCategory } from "@/lib/db";
import { getCategoryStyle } from "@/lib/colors";
import PostCard from "@/app/components/PostCard";
import { SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  const title = category.name;
  const description = category.description || `Posts sobre ${category.name}.`;
  const url = `${SITE_URL}/categorias/${category.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = getPostsByCategory(slug);
  const style = getCategoryStyle(slug);

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/categorias"
          prefetch={false}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
        >
          ← Categorias
        </Link>
      </div>

      <div className="mb-12 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-3 h-3 rounded-full ${style.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-widest ${style.heading}`}>
            Categoria
          </span>
        </div>
        <h1 className={`font-display text-4xl font-bold tracking-tight mb-2 ${style.heading}`}>
          {category.name}
        </h1>
        {category.description && (
          <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            {category.description}
          </p>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-[var(--color-muted)]">Nenhum post nesta categoria ainda.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
