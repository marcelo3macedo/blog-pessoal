import Link from "next/link";
import type { Post } from "@/lib/db";
import CategoryBadge from "./CategoryBadge";
import TagBadge from "./TagBadge";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="group py-9 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] last:border-0">
      <div className="flex items-center gap-3 mb-3">
        <CategoryBadge name={post.category_name} slug={post.category_slug} />
        <time className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          {formatDate(post.published_at)}
        </time>
      </div>

      <h2 className="font-display text-2xl font-bold leading-snug text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2 group-hover:text-[var(--color-brand)] dark:group-hover:text-[var(--color-brand-dark)] transition-colors tracking-tight">
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>

      <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed mb-4">
        {post.excerpt}
      </p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      <Link
        href={`/posts/${post.slug}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] hover:underline underline-offset-4"
      >
        Ler post
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="translate-y-px">
          <path d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </article>
  );
}
