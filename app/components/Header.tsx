import Link from "next/link";

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

export default function Header() {
  return (
    <header className="border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <CodeLogo />
          <span className="font-display text-lg font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] group-hover:text-[var(--color-brand)] dark:group-hover:text-[var(--color-brand-dark)] transition-colors">
            além do script
          </span>
        </Link>

        <nav className="flex gap-6 text-sm font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          <Link
            href="/"
            prefetch={false}
            className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
          >
            Início
          </Link>
          <Link
            href="/projetos"
            prefetch={false}
            className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
          >
            Projetos
          </Link>
          <Link
            href="/categorias"
            prefetch={false}
            className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
          >
            Categorias
          </Link>
        </nav>
      </div>
    </header>
  );
}
