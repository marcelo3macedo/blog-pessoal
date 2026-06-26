import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

const TITLE = "Sobre";
const DESCRIPTION = "Desenvolvedor de software apaixonado por tecnologia e novidades.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/sobre` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/sobre`, type: "profile" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function SobrePage() {
  return (
    <div className="max-w-xl">
      {/* Avatar placeholder + name */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand)] dark:bg-[var(--color-brand-dark)] flex items-center justify-center flex-shrink-0">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 8a5 5 0 1 1 0 10A5 5 0 0 1 16 8Z" fill="white" fillOpacity="0.9" />
            <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] tracking-tight">
            Marcelo Macedo
          </h1>
          <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">
            Software Developer
          </p>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-4 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed mb-10">
        <p>
          Trabalho com desenvolvimento de software há alguns anos e sigo achando que é uma das áreas mais interessantes
          para se estar. A velocidade com que as coisas mudam é o que mais me atrai — sempre tem algo novo para aprender,
          testar ou descartar.
        </p>
        <p>
          Este blog é o espaço onde registro o que estou explorando: seja uma tecnologia nova que chamou atenção,
          uma ferramenta que mudou meu jeito de trabalhar, ou reflexões sobre carreira e produtividade.
          Nada muito formal — mais um diário técnico do que um manual.
        </p>
        <p>
          Se algo aqui te for útil, ótimo. Se quiser trocar ideia, meu LinkedIn está logo abaixo.
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <a
          href="https://www.linkedin.com/in/marcelo-alberico-macedo-23639630/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A66C2] text-white text-sm font-medium hover:bg-[#085196] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
        </a>

        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-sm font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] hover:border-[var(--color-ink)] dark:hover:border-[var(--color-ink-dark)] transition-colors"
        >
          ← Ver posts
        </Link>
      </div>
    </div>
  );
}
