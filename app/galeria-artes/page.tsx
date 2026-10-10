import type { Metadata } from "next";
import { getAllArtworks, getArtworkFilters } from "@/lib/artworks-db";
import GaleriaClient from "./components/GaleriaClient";
import { SITE_URL } from "@/lib/seo";

const TITLE = "Galeria de Artes IA";
const DESCRIPTION = "Coleção de artes geradas com Stable Diffusion, Flux e outros modelos. Explore por categoria, modelo e estilo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/galeria-artes` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/galeria-artes`, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function GaleriaPage() {
  const artworks = getAllArtworks();
  const filters = getArtworkFilters();

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] dark:text-[var(--color-brand-dark)]">
            IA Generativa
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-3">
          Galeria de Artes
        </h1>
        <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] max-w-xl">
          {DESCRIPTION}
        </p>
      </div>

      <GaleriaClient artworks={artworks} filters={filters} />
    </div>
  );
}
