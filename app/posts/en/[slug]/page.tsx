import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/db";
import CategoryBadge from "@/app/components/CategoryBadge";
import TagBadge from "@/app/components/TagBadge";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.language !== "en") return {};

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;
  const url = `${SITE_URL}/posts/en/${post.slug}`;
  const translation = post.translation_slug ? getPostBySlug(post.translation_slug) : null;

  return {
    title,
    description,
    keywords: post.seo_keywords || undefined,
    alternates: {
      canonical: url,
      ...(translation && translation.language === "pt"
        ? { languages: { "pt-BR": `${SITE_URL}/posts/${translation.slug}` } }
        : {}),
    },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      publishedTime: post.published_at,
      tags: post.tags.map((t) => t.name),
      images: [{ url: "/uploads/og-cover.png", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/uploads/og-cover.png"],
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function EnglishPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.language !== "en") notFound();

  const translation = post.translation_slug ? getPostBySlug(post.translation_slug) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt,
    datePublished: post.published_at,
    keywords: post.seo_keywords || post.tags.map((t) => t.name).join(", "),
    author: { "@type": "Person", name: "Marcelo Macedo" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/posts/en/${post.slug}`,
    inLanguage: "en",
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/en"
          prefetch={false}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
        >
          ← Home
        </Link>
        {translation && translation.language === "pt" && (
          <Link
            href={`/posts/${translation.slug}`}
            prefetch={false}
            className="text-sm font-medium text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] hover:underline underline-offset-4"
          >
            Ler em português →
          </Link>
        )}
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <CategoryBadge name={post.category_name} slug={post.category_slug} />
          {post.project_slug && post.project_name && (
            <span className="text-xs font-semibold text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
              {post.project_name}
            </span>
          )}
          <time className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            {formatDate(post.published_at)}
          </time>
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-4">
          {post.title}
        </h1>

        <p className="text-lg text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed mb-6">
          {post.excerpt}
        </p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        <p className="mt-5 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          by Marcelo Macedo
        </p>
      </header>

      <div className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] pt-10">
        <MarkdownRenderer content={post.content} />
      </div>
    </article>
  );
}
