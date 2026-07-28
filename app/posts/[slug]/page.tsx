import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/db";
import CategoryBadge from "@/app/components/CategoryBadge";
import TagBadge from "@/app/components/TagBadge";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import TableOfContents from "@/app/components/TableOfContents";
import HireMeCTA from "@/app/components/HireMeCTA";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { estimateReadingTime } from "@/lib/reading-time";
import { extractHeadings } from "@/lib/toc";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.language !== "pt") return {};

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;
  const url = `${SITE_URL}/posts/${post.slug}`;
  const translation = post.translation_slug ? getPostBySlug(post.translation_slug) : null;

  return {
    title,
    description,
    keywords: post.seo_keywords || undefined,
    alternates: {
      canonical: url,
      ...(translation && translation.language === "en"
        ? { languages: { en: `${SITE_URL}/posts/en/${translation.slug}` } }
        : {}),
    },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
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
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.language !== "pt") notFound();

  const translation = post.translation_slug ? getPostBySlug(post.translation_slug) : null;
  const headings = extractHeadings(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt,
    datePublished: post.published_at,
    keywords: post.seo_keywords || post.tags.map((t) => t.name).join(", "),
    author: { "@type": "Person", name: "Marcelo Macedo" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/posts/${post.slug}`,
  };

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-10 xl:items-start">
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          prefetch={false}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
        >
          ← Início
        </Link>
        {translation && translation.language === "en" && (
          <Link
            href={`/posts/en/${translation.slug}`}
            prefetch={false}
            className="text-sm font-medium text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] hover:underline underline-offset-4"
          >
            Read in English →
          </Link>
        )}
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <CategoryBadge name={post.category_name} slug={post.category_slug} />
          {post.project_slug && post.project_name && (
            <Link
              href={`/projetos/${post.project_slug}`}
              prefetch={false}
              className="text-xs font-semibold text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
            >
              {post.project_name}
            </Link>
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

        {post.difficulty && (
          <p className="mt-5 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            Nível: {post.difficulty} | Tempo de Leitura: {estimateReadingTime(post.content)} min
          </p>
        )}

        <p className="mt-2 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          por{" "}
          <Link
            href="/perfil"
            prefetch={false}
            className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] hover:underline underline-offset-4 transition-colors"
          >
            Marcelo Macedo
          </Link>
        </p>
      </header>

      <div className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] pt-10">
        <MarkdownRenderer content={post.content} />
      </div>

      <HireMeCTA locale="pt" />
    </article>
    <TableOfContents headings={headings} />
    </div>
  );
}
