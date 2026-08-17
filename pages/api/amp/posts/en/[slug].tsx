import type { NextApiRequest, NextApiResponse } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { getPostBySlug } from "@/lib/db";
import AmpMarkdownRenderer from "@/app/components/AmpMarkdownRenderer";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { estimateReadingTime } from "@/lib/reading-time";
import { buildAmpDocument } from "@/lib/amp-document";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// See pages/api/amp/posts/[slug].tsx for why this lives in the Pages Router.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug as string;
  const post = getPostBySlug(slug);
  if (!post || post.language !== "en") {
    res.status(404).send("Not Found");
    return;
  }

  const canonicalUrl = `${SITE_URL}/posts/en/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt,
    datePublished: post.published_at,
    keywords: post.seo_keywords || post.tags.map((t) => t.name).join(", "),
    author: { "@type": "Person", name: "Marcelo Macedo" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: canonicalUrl,
    inLanguage: "en",
  };

  const bodyHtml = renderToStaticMarkup(
    <div className="amp-shell">
      <nav className="amp-nav">
        <a href="/en">← Home</a>
        <a className="amp-alt" href={canonicalUrl}>
          View full version →
        </a>
      </nav>

      <header>
        <div className="amp-meta">
          <span className="amp-badge">{post.category_name}</span>
          <time>{formatDate(post.published_at)}</time>
        </div>

        <h1 className="amp-title">{post.title}</h1>
        <p className="amp-excerpt">{post.excerpt}</p>

        {post.tags.length > 0 && (
          <div className="amp-tags">
            {post.tags.map((tag) => (
              <span key={tag.id}>{tag.name}</span>
            ))}
          </div>
        )}

        <p className="amp-byline">
          by Marcelo Macedo
          {post.difficulty && ` · Level: ${post.difficulty}`} · Reading time:{" "}
          {estimateReadingTime(post.content)} min
        </p>
      </header>

      <AmpMarkdownRenderer content={post.content} canonicalUrl={canonicalUrl} locale="en" />

      <footer className="amp-footer">
        This is the AMP version of the article.{" "}
        <a href={canonicalUrl}>Read the full version</a>.
      </footer>
    </div>
  );

  const html = buildAmpDocument({
    lang: "en",
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    canonicalUrl,
    jsonLd,
    bodyHtml,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
