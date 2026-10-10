import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArtworkBySlug, getAllArtworks } from "@/lib/artworks-db";
import { SITE_URL } from "@/lib/seo";
import CopyButton from "./CopyButton";
import RelatedImages from "./RelatedImages";

export async function generateStaticParams() {
  return getAllArtworks().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artwork = getArtworkBySlug(slug);
  if (!artwork) return {};
  return {
    title: artwork.title,
    description: artwork.description ?? undefined,
    alternates: { canonical: `${SITE_URL}/galeria-artes/${slug}` },
    openGraph: {
      title: artwork.title,
      description: artwork.description ?? undefined,
      images: artwork.image_url ? [{ url: artwork.image_url }] : [],
      url: `${SITE_URL}/galeria-artes/${slug}`,
    },
  };
}

function ParamRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] font-mono">
        {String(value)}
      </dd>
    </div>
  );
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artwork = getArtworkBySlug(slug);
  if (!artwork) notFound();

  const badgeBase =
    "px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]";

  return (
    <div>
      <Link
        href="/galeria-artes"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors mb-8"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Galeria
      </Link>

      <div className="grid lg:grid-cols-[1fr_380px] gap-10">
        {/* Image */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-auto block"
            />
          </div>
          {artwork.width && artwork.height && (
            <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-2 text-right">
              {artwork.width} × {artwork.height}px
            </p>
          )}
        </div>

        {/* Info panel */}
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-3">
              {artwork.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={badgeBase}>{artwork.category}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-brand)]/10 dark:bg-[var(--color-brand-dark)]/10 text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] border border-[var(--color-brand)]/20 dark:border-[var(--color-brand-dark)]/20">
                {artwork.model}
              </span>
              <span className={badgeBase}>{artwork.style}</span>
            </div>
            {artwork.description && (
              <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed">
                {artwork.description}
              </p>
            )}
          </div>

          {/* Prompt */}
          {artwork.prompt && (
            <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                  Prompt
                </span>
                <CopyButton text={artwork.prompt} />
              </div>
              <div className="p-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
                <p className="text-xs font-mono text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] leading-relaxed whitespace-pre-wrap break-words">
                  {artwork.prompt}
                </p>
              </div>
            </div>
          )}

          {/* Negative prompt */}
          {artwork.negative_prompt && (
            <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                  Negative Prompt
                </span>
                <CopyButton text={artwork.negative_prompt} />
              </div>
              <div className="p-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
                <p className="text-xs font-mono text-rose-600 dark:text-rose-400 leading-relaxed whitespace-pre-wrap break-words">
                  {artwork.negative_prompt}
                </p>
              </div>
            </div>
          )}

          {/* Generation parameters */}
          {(artwork.sampler || artwork.steps || artwork.cfg_scale || artwork.seed) && (
            <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden">
              <div className="px-4 py-2.5 bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                  Parâmetros
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
                <ParamRow label="Modelo" value={artwork.model} />
                <ParamRow label="Sampler" value={artwork.sampler} />
                <ParamRow label="Steps" value={artwork.steps} />
                <ParamRow label="CFG Scale" value={artwork.cfg_scale} />
                <ParamRow label="Seed" value={artwork.seed} />
                {artwork.width && artwork.height && (
                  <ParamRow label="Resolução" value={`${artwork.width}×${artwork.height}`} />
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      <RelatedImages />
    </div>
  );
}
