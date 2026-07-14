import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug, getPostsByProject } from "@/lib/db";
import { getCategoryStyle } from "@/lib/colors";
import PostCard from "@/app/components/PostCard";
import TagBadge from "@/app/components/TagBadge";
import { SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  const title = project.name;
  const description = project.description || `Posts sobre o projeto ${project.name}.`;
  const url = `${SITE_URL}/projetos/${project.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProjetoPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const posts = getPostsByProject(slug);
  const style = getCategoryStyle("projetos");

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/projetos"
          prefetch={false}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
        >
          ← Projetos
        </Link>
      </div>

      <div className="mb-12 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-3 h-3 rounded-full ${style.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-widest ${style.heading}`}>
            Projeto
          </span>
        </div>
        <h1 className={`font-display text-4xl font-bold tracking-tight mb-2 ${style.heading}`}>
          {project.name}
        </h1>
        {project.description && (
          <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-4">
            {project.description}
          </p>
        )}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-[var(--color-muted)]">Nenhum post neste projeto ainda.</p>
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
