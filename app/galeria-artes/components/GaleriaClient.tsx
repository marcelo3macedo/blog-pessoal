"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Artwork } from "@/lib/artworks-db";

interface FilterSet {
  categories: string[];
  models: string[];
  styles: string[];
}

interface Props {
  artworks: Artwork[];
  filters: FilterSet;
}

function FilterPills({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: string[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] shrink-0">
        {label}
      </span>
      <button
        onClick={() => onSelect("")}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          active === ""
            ? "bg-[var(--color-brand)] dark:bg-[var(--color-brand-dark)] text-white"
            : "bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)]"
        }`}
      >
        Todos
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt === active ? "" : opt)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            active === opt
              ? "bg-[var(--color-brand)] dark:bg-[var(--color-brand-dark)] text-white"
              : "bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <Link href={`/galeria-artes/${artwork.slug}`} prefetch={false} className="block group">
      <div className="relative overflow-hidden rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
        <img
          src={artwork.thumbnail_url ?? artwork.image_url}
          alt={artwork.title}
          className="w-full h-auto block"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h3 className="text-white font-semibold text-sm leading-snug mb-1.5">
            {artwork.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] font-medium bg-[var(--color-brand)]/80 text-white rounded px-1.5 py-0.5">
              {artwork.model}
            </span>
            <span className="text-[10px] font-medium bg-white/20 text-white rounded px-1.5 py-0.5 backdrop-blur-sm">
              {artwork.style}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] truncate">
          {artwork.category}
        </p>
      </div>
    </Link>
  );
}

export default function GaleriaClient({ artworks, filters }: Props) {
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [style, setStyle] = useState("");

  const filtered = useMemo(
    () =>
      artworks.filter(
        (a) =>
          (!category || a.category === category) &&
          (!model || a.model === model) &&
          (!style || a.style === style)
      ),
    [artworks, category, model, style]
  );

  const hasFilters = category || model || style;

  return (
    <div>
      <div className="space-y-3 mb-8 p-4 rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <FilterPills label="Categoria" options={filters.categories} active={category} onSelect={setCategory} />
        <FilterPills label="Modelo" options={filters.models} active={model} onSelect={setModel} />
        <FilterPills label="Estilo" options={filters.styles} active={style} onSelect={setStyle} />
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            {filtered.length} {filtered.length === 1 ? "arte" : "artes"} encontrada{filtered.length === 1 ? "" : "s"}
          </p>
          <button
            onClick={() => { setCategory(""); setModel(""); setStyle(""); }}
            className="text-xs text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          <p className="text-4xl mb-3">🎨</p>
          <p className="font-medium">Nenhuma arte encontrada</p>
          <p className="text-sm mt-1">Tente remover alguns filtros</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filtered.map((artwork) => (
            <div key={artwork.id} className="break-inside-avoid mb-4">
              <ArtworkCard artwork={artwork} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
