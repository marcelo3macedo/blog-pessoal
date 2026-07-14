import Link from "next/link";
import { getProjectGroups, getUngroupedPostsByCategory } from "@/lib/db";
import { getCategoryStyle } from "@/lib/colors";
import PostCard from "@/app/components/PostCard";
import TagBadge from "@/app/components/TagBadge";
import { SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

const TITLE = "Projetos";
const DESCRIPTION = "Projetos reais que desenvolvi, documentados em formato de post.";
const CATEGORY_SLUG = "projetos";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/projetos` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/projetos`, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function ProjetosPage() {
  const projects = getProjectGroups(CATEGORY_SLUG);
  const ungroupedPosts = getUngroupedPostsByCategory(CATEGORY_SLUG);
  const style = getCategoryStyle(CATEGORY_SLUG);

  return (
    <div>
      <div className="mb-12">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-3">
          Projetos
        </h1>
        <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          {DESCRIPTION}
        </p>
      </div>

      {projects.length === 0 && ungroupedPosts.length === 0 ? (
        <p className="text-[var(--color-muted)]">Nenhum projeto publicado ainda.</p>
      ) : (
        <>
          {projects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 mb-12">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projetos/${project.slug}`}
                  prefetch={false}
                  className={`group block rounded-2xl border-2 p-6 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] hover:shadow-md transition-all ${style.border}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                      <h2 className={`font-semibold text-base ${style.heading}`}>
                        {project.name}
                      </h2>
                    </div>
                    <span className="text-xs font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)] rounded-full px-2.5 py-0.5">
                      {project.count} {project.count === 1 ? "post" : "posts"}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed mb-3">
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
                </Link>
              ))}
            </div>
          )}

          {ungroupedPosts.length > 0 && (
            <div>
              {projects.length > 0 && (
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-2">
                  Outros posts
                </h2>
              )}
              {ungroupedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
