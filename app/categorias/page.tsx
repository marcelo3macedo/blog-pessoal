import Link from "next/link";
import { getAllCategories, getPostCountByCategory } from "@/lib/db";
import { getCategoryStyle } from "@/lib/colors";
import { SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

const TITLE = "Categorias";
const DESCRIPTION = "Navegue pelos assuntos do blog além do script.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/categorias` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/categorias`, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function CategoriasPage() {
  const categories = getAllCategories();
  const counts = getPostCountByCategory();

  return (
    <div>
      <div className="mb-12">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-3">
          Categorias
        </h1>
        <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          Navegue pelos assuntos do blog.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat) => {
          const style = getCategoryStyle(cat.slug);
          const count = counts[cat.slug] ?? 0;
          return (
            <Link
              key={cat.id}
              href={`/categorias/${cat.slug}`}
              className={`group block rounded-2xl border-2 p-6 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] hover:shadow-md transition-all ${style.border}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  <h2 className={`font-semibold text-base ${style.heading}`}>
                    {cat.name}
                  </h2>
                </div>
                <span className="text-xs font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)] rounded-full px-2.5 py-0.5">
                  {count} {count === 1 ? "post" : "posts"}
                </span>
              </div>
              {cat.description && (
                <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed">
                  {cat.description}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
