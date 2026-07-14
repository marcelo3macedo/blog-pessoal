import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Fira_Code } from "next/font/google";
import Link from "next/link";
import Header from "./components/Header";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { SITE_URL, SITE_NAME, GA_ID } from "@/lib/seo";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  icons: {
    icon: "/uploads/logo.png",
    shortcut: "/uploads/logo.png",
    apple: "/uploads/logo.png",
  },
  description: "Reflexões sobre tecnologia, desenvolvimento web e vida.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_NAME,
    description: "Reflexões sobre tecnologia, desenvolvimento web e vida.",
    images: [{ url: "/uploads/og-cover.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Reflexões sobre tecnologia, desenvolvimento web e vida.",
    images: ["/uploads/og-cover.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${jakartaSans.variable} ${playfair.variable} ${firaCode.variable} h-full`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics gaId={GA_ID} />
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-14">{children}</main>
        <footer className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] py-7">
          <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            <span>© {new Date().getFullYear()} além do script</span>
            <nav className="flex items-center gap-5">
              <Link
                href="/sobre"
                prefetch={false}
                className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
              >
                Sobre
              </Link>
              <Link
                href="/perfil"
                prefetch={false}
                className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
              >
                Perfil
              </Link>
              <Link
                href="/privacidade"
                prefetch={false}
                className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
              >
                Privacidade
              </Link>
              <a
                href="https://www.linkedin.com/in/marcelo-alberico-macedo-23639630/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
                aria-label="LinkedIn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
