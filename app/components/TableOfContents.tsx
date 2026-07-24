"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/toc";

export default function TableOfContents({
  headings,
  label = "Nesta página",
}: {
  headings: Heading[];
  label?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setActiveId((current) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length === 0) return current;
          const topMost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          return topMost.target.id;
        });
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <nav
      aria-label={label}
      className="hidden xl:block sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
        {label}
      </p>
      <ul className="space-y-1 border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - minLevel) * 0.75 + 0.75}rem` }}>
            <a
              href={`#${h.id}`}
              className={`-ml-px block border-l-2 py-1 pl-3 text-sm leading-snug transition-colors ${
                activeId === h.id
                  ? "border-[var(--color-brand)] dark:border-[var(--color-brand-dark)] font-medium text-[var(--color-brand)] dark:text-[var(--color-brand-dark)]"
                  : "border-transparent text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)]"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
