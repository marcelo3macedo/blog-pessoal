"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

function CodeLogo() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      className="text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] flex-shrink-0"
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="10" fill="currentColor" />
      {/* < bracket */}
      <path
        d="M13 12L8.5 18L13 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* > bracket */}
      <path
        d="M23 12L27.5 18L23 24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* / slash */}
      <path
        d="M20.5 10.5L15.5 25.5"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      {open ? (
        <path
          d="M5 5l12 12M17 5L5 17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3 6h16M3 11h16M3 16h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/posts/en");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = isEnglish
    ? [{ href: "/en", label: "Home" }]
    : [
        { href: "/", label: "Início" },
        { href: "/projetos", label: "Projetos" },
        { href: "/categorias", label: "Categorias" },
      ];

  return (
    <header className="border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={isEnglish ? "/en" : "/"} className="flex items-center gap-2.5 group">
          <CodeLogo />
          <span className="font-display text-lg font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] group-hover:text-[var(--color-brand)] dark:group-hover:text-[var(--color-brand-dark)] transition-colors">
            além do script
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          <nav className="flex gap-6 text-sm font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <LanguageSwitcher />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] hover:bg-[var(--color-cream)] dark:hover:bg-[var(--color-cream-dark)] transition-colors"
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] px-6 py-4">
          <nav className="flex flex-col gap-1 text-sm font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="py-2 hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 pt-3 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
