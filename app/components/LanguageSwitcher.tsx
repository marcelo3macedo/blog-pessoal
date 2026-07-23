"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/posts/en");

  return (
    <div className="flex items-center gap-1 text-xs font-semibold rounded-full border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-0.5">
      <Link
        href="/"
        prefetch={false}
        aria-current={!isEnglish ? "page" : undefined}
        className={`px-2 py-1 rounded-full transition-colors ${
          !isEnglish
            ? "bg-[var(--color-brand)] dark:bg-[var(--color-brand-dark)] text-white"
            : "text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)]"
        }`}
      >
        PT
      </Link>
      <Link
        href="/en"
        prefetch={false}
        aria-current={isEnglish ? "page" : undefined}
        className={`px-2 py-1 rounded-full transition-colors ${
          isEnglish
            ? "bg-[var(--color-brand)] dark:bg-[var(--color-brand-dark)] text-white"
            : "text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)]"
        }`}
      >
        EN
      </Link>
    </div>
  );
}
